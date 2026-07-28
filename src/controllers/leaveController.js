const db = require('../db');
const ANNUAL_LEAVE_ALLOCATION_DAYS = 21;
const { daysBetween, getNoticeDays, MIN_NOTICE_DAYS, TEAM_COVERAGE_THRESHOLD, ESCALATION_DAYS } = require('../services/leaveRules');

async function createLeaveRequest(req, res) {
    const { employee_id, start_date, end_date, leave_type, reason } = req.body;

    if (!employee_id || !start_date || !end_date || !leave_type) {
        return res.status(400).json({ error: 'Missing required fields' });
    }

    try {
        const { rows: empRows } = await db.query('SELECT * FROM employees WHERE id = $1 AND is_active = 1', [employee_id]);
        if (empRows.length === 0) return res.status(404).json({ error: 'Employee not found or inactive' });

        if (new Date(end_date) < new Date(start_date)) {
            return res.status(400).json({ error: 'end_date cannot be before start_date' });
        }

        const today = new Date().toISOString().split('T')[0];
        if (new Date(start_date) < new Date(today)) {
            return res.status(400).json({ error: 'Cannot request leave for a date in the past' });
        }

        const days_requested = daysBetween(start_date, end_date);
        const notice_days = getNoticeDays(today, start_date);
        const low_notice = notice_days < MIN_NOTICE_DAYS;

        const { rows: newRequest } = await db.query(`
            INSERT INTO leave_requests (employee_id, start_date, end_date, days_requested, leave_type, reason)
            VALUES ($1, $2, $3, $4, $5, $6)
            RETURNING *
        `, [employee_id, start_date, end_date, days_requested, leave_type, reason || null]);

        res.status(201).json({ ...newRequest[0], low_notice, notice_days });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
}

async function listLeaveRequests(req, res) {
    const { status } = req.query;
    try {
        const { rows: requests } = status
            ? await db.query('SELECT * FROM leave_requests WHERE status = $1 ORDER BY id DESC', [status])
            : await db.query('SELECT * FROM leave_requests ORDER BY id DESC');

        const now = new Date();
        const enriched = requests.map(r => {
            const pendingDays = Math.floor((now - new Date(r.requested_at)) / (1000 * 60 * 60 * 24));
            return { ...r, escalated: r.status === 'pending' && pendingDays >= ESCALATION_DAYS };
        });

        res.json(enriched);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
}

async function decideLeaveRequest(req, res) {
    const { id } = req.params;
    const { decision, decided_by } = req.body;

    if (!['approved', 'rejected'].includes(decision)) {
        return res.status(400).json({ error: "decision must be 'approved' or 'rejected'" });
    }

    try {
        const { rows: leaveRows } = await db.query('SELECT * FROM leave_requests WHERE id = $1', [id]);
        if (leaveRows.length === 0) return res.status(404).json({ error: 'Leave request not found' });
        const leaveRequest = leaveRows[0];

        if (leaveRequest.status !== 'pending') {
            return res.status(400).json({ error: `Request already ${leaveRequest.status}` });
        }

        if (decision === 'approved') {
            const { rows: empRows } = await db.query('SELECT * FROM employees WHERE id = $1', [leaveRequest.employee_id]);
            const employee = empRows[0];

            if (employee && employee.team_id) {
                const { rows: teamSizeRows } = await db.query('SELECT COUNT(*) as count FROM employees WHERE team_id = $1 AND is_active = 1', [employee.team_id]);
                const teamSize = parseInt(teamSizeRows[0].count, 10);

                const { rows: overlapping } = await db.query(`
                    SELECT lr.* FROM leave_requests lr
                    JOIN employees e ON e.id = lr.employee_id
                    WHERE e.team_id = $1 AND lr.status = 'approved'
                    AND lr.start_date <= $2 AND lr.end_date >= $3
                `, [employee.team_id, leaveRequest.end_date, leaveRequest.start_date]);

                const coverageRatio = (overlapping.length + 1) / teamSize;
                if (coverageRatio > TEAM_COVERAGE_THRESHOLD) {
                    return res.status(409).json({
                        error: 'Approving this would leave the team under-covered',
                        team_size: teamSize,
                        already_approved_overlapping: overlapping.length,
                        coverage_ratio: coverageRatio
                    });
                }
            }
        }

        const { rows: updated } = await db.query(`
            UPDATE leave_requests SET status = $1, decided_at = CURRENT_TIMESTAMP, decided_by = $2
            WHERE id = $3 RETURNING *
        `, [decision, decided_by || null, id]);

        res.json(updated[0]);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
}

async function getLeaveBalances(req, res) {
    try {
        const { rows: employees } = await db.query('SELECT * FROM employees WHERE is_active = 1');
        const currentYear = String(new Date().getFullYear());

        const balances = await Promise.all(employees.map(async (emp) => {
            const { rows } = await db.query(`
                SELECT COALESCE(SUM(days_requested), 0) as taken
                FROM leave_requests
                WHERE employee_id = $1 AND status = 'approved' AND leave_type = 'paid'
                AND TO_CHAR(start_date, 'YYYY') = $2
            `, [emp.id, currentYear]);

            const taken = parseInt(rows[0].taken, 10);

            return {
                employee_id: emp.id,
                name: emp.name,
                allocation: ANNUAL_LEAVE_ALLOCATION_DAYS,
                taken,
                balance: ANNUAL_LEAVE_ALLOCATION_DAYS - taken
            };
        }));

        res.json(balances);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
}

module.exports = { createLeaveRequest, listLeaveRequests, decideLeaveRequest, getLeaveBalances };