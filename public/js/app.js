const state = { employees: [], teams: [] };

document.querySelectorAll('.tab-btn').forEach(btn => {
    btn.addEventListener('click', () => {
        document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
        document.querySelectorAll('.tab-panel').forEach(p => p.classList.remove('active'));
        btn.classList.add('active');
        document.getElementById(btn.dataset.tab).classList.add('active');
    });
});

function fmtMoney(n) { return Number(n).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }); }
function fmtDate(d) { return new Date(d).toLocaleDateString(); }
function populateMonthSelect(select) {
    const months = ['January','February','March','April','May','June','July','August','September','October','November','December'];
    select.innerHTML = months.map((m, i) => `<option value="${i+1}">${m}</option>`).join('');
}

async function loadPendingApprovals() {
    const el = document.getElementById('pendingApprovalsList');
    el.innerHTML = '<span class="loading">Loading…</span>';
    try {
        const requests = await apiGet('/leave?status=pending');
        if (requests.length === 0) { el.innerHTML = '<p class="empty">No pending requests. Nice and clear.</p>'; return; }
        el.innerHTML = requests.map(r => {
            const emp = state.employees.find(e => e.id === r.employee_id);
            return `<div class="approval-row">
                <strong>${emp ? emp.name : 'Employee #' + r.employee_id}</strong>
                — ${fmtDate(r.start_date)} to ${fmtDate(r.end_date)} (${r.leave_type})
                ${r.escalated ? '<span class="badge escalated">Escalated</span>' : ''}
                ${r.low_notice ? '<span class="badge low-notice">Low notice</span>' : ''}
                <button onclick="decideLeave(${r.id}, 'approved')">Approve</button>
                <button onclick="decideLeave(${r.id}, 'rejected')">Reject</button>
            </div>`;
        }).join('');
    } catch (err) { el.innerHTML = `<p class="error">Failed to load: ${err.message}</p>`; }
}

async function loadWhosOut() {
    const el = document.getElementById('whosOutList');
    el.innerHTML = '<span class="loading">Loading…</span>';
    try {
        const requests = await apiGet('/leave?status=approved');
        const today = new Date().toISOString().split('T')[0];
        const current = requests.filter(r => r.end_date >= today);
        if (current.length === 0) { el.innerHTML = `<p class="empty">Everyone's in. No one currently out or upcoming.</p>`; return; }
        el.innerHTML = current.map(r => {
            const emp = state.employees.find(e => e.id === r.employee_id);
            return `<div>${emp ? emp.name : 'Employee #' + r.employee_id} — ${fmtDate(r.start_date)} to ${fmtDate(r.end_date)}</div>`;
        }).join('');
    } catch (err) { el.innerHTML = `<p class="error">Failed to load: ${err.message}</p>`; }
}

async function loadBalances() {
    const el = document.getElementById('balancesList');
    el.innerHTML = '<span class="loading">Loading…</span>';
    try {
        const balances = await apiGet('/leave/balances');
        if (balances.length === 0) { el.innerHTML = '<p class="empty">No active employees yet.</p>'; return; }
        el.innerHTML = `<table><thead><tr><th>Employee</th><th>Allocation</th><th>Taken (YTD)</th><th>Balance</th></tr></thead>
            <tbody>${balances.map(b => `<tr><td>${b.name}</td><td>${b.allocation}</td><td>${b.taken}</td><td>${b.balance}</td></tr>`).join('')}</tbody></table>`;
    } catch (err) { el.innerHTML = `<p class="error">Failed to load: ${err.message}</p>`; }
}

async function loadEmployees() {
    const el = document.getElementById('employeesList');
    el.innerHTML = '<span class="loading">Loading…</span>';
    try {
        const employees = await apiGet('/employees');
        state.employees = employees;
        populateEmployeeDropdowns();
        if (employees.length === 0) { el.innerHTML = '<p class="empty">No employees yet. Add one above.</p>'; return; }
        el.innerHTML = `<table><thead><tr><th>Name</th><th>Role</th><th>Start Date</th><th>Type</th><th></th></tr></thead>
            <tbody>${employees.map(e => `<tr><td>${e.name}</td><td>${e.role}</td><td>${fmtDate(e.start_date)}</td><td>${e.employment_type}</td>
                <td><button onclick="deactivateEmployee(${e.id})">Deactivate</button></td></tr>`).join('')}</tbody></table>`;
    } catch (err) { el.innerHTML = `<p class="error">Failed to load: ${err.message}</p>`; }
}

function populateEmployeeDropdowns() {
    const options = state.employees.map(e => `<option value="${e.id}">${e.name}</option>`).join('');
    document.getElementById('managerSelect').innerHTML = '<option value="">No manager</option>' + options;
    document.getElementById('leaveEmployeeSelect').innerHTML = options;
}

async function loadTeams() {
    try {
        const teams = await apiGet('/teams');
        state.teams = teams;
        document.getElementById('teamSelect').innerHTML = '<option value="">No team</option>' + teams.map(t => `<option value="${t.id}">${t.name}</option>`).join('');
    } catch (err) { console.error('Failed to load teams', err); }
}

async function loadOrgView() {
    const el = document.getElementById('orgView');
    el.innerHTML = '<span class="loading">Loading…</span>';
    try {
        const tree = await apiGet('/employees/org-view');
        el.innerHTML = tree.length === 0 ? '<p class="empty">No employees yet.</p>' : renderOrgNode(tree);
    } catch (err) { el.innerHTML = `<p class="error">Failed to load: ${err.message}</p>`; }
}
function renderOrgNode(nodes) {
    return `<ul>${nodes.map(n => `<li>${n.name} — ${n.role}${n.reports.length ? renderOrgNode(n.reports) : ''}</li>`).join('')}</ul>`;
}

async function deactivateEmployee(id) {
    if (!confirm('Deactivate this employee? Their payroll history will be preserved.')) return;
    try {
        await apiPatch(`/employees/${id}/deactivate`);
        loadEmployees(); loadOrgView(); loadBalances();
    } catch (err) { alert('Failed: ' + err.message); }
}

document.getElementById('employeeForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const msg = document.getElementById('employeeFormMsg');
    const body = Object.fromEntries(new FormData(e.target).entries());
    if (!body.team_id) delete body.team_id;
    if (!body.manager_id) delete body.manager_id;
    body.salary = Number(body.salary);
    try {
        await apiPost('/employees', body);
        msg.textContent = 'Employee added.'; msg.className = 'success';
        e.target.reset(); loadEmployees(); loadOrgView();
    } catch (err) { msg.textContent = err.message; msg.className = 'error'; }
});

document.getElementById('teamForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    try {
        await apiPost('/teams', Object.fromEntries(new FormData(e.target).entries()));
        e.target.reset(); loadTeams();
    } catch (err) { alert('Failed: ' + err.message); }
});

async function loadAllLeave() {
    const el = document.getElementById('allLeaveList');
    el.innerHTML = '<span class="loading">Loading…</span>';
    try {
        const requests = await apiGet('/leave');
        if (requests.length === 0) { el.innerHTML = '<p class="empty">No leave requests yet.</p>'; return; }
        el.innerHTML = `<table><thead><tr><th>Employee</th><th>Dates</th><th>Type</th><th>Status</th></tr></thead>
            <tbody>${requests.map(r => {
                const emp = state.employees.find(e => e.id === r.employee_id);
                return `<tr><td>${emp ? emp.name : '#' + r.employee_id}</td><td>${fmtDate(r.start_date)} – ${fmtDate(r.end_date)}</td>
                    <td>${r.leave_type}</td><td><span class="badge ${r.status}">${r.status}</span></td></tr>`;
            }).join('')}</tbody></table>`;
    } catch (err) { el.innerHTML = `<p class="error">Failed to load: ${err.message}</p>`; }
}

async function decideLeave(id, decision) {
    try {
        await apiPatch(`/leave/${id}/decision`, { decision });
        loadPendingApprovals(); loadWhosOut(); loadAllLeave(); loadBalances();
    } catch (err) { alert('Failed: ' + err.message); }
}

document.getElementById('leaveForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const msg = document.getElementById('leaveFormMsg');
    const body = Object.fromEntries(new FormData(e.target).entries());
    try {
        const result = await apiPost('/leave', body);
        msg.textContent = result.low_notice ? 'Submitted (flagged: low notice).' : 'Submitted.';
        msg.className = 'success';
        e.target.reset(); loadAllLeave(); loadPendingApprovals();
    } catch (err) { msg.textContent = err.message; msg.className = 'error'; }
});

document.getElementById('payrollGenerateForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const msg = document.getElementById('payrollGenMsg');
    const month = document.getElementById('genMonth').value;
    const year = document.getElementById('genYear').value;
    msg.textContent = 'Generating…'; msg.className = 'loading';
    try {
        const result = await apiPost('/payroll/generate', { month: Number(month), year: Number(year) });
        msg.textContent = `Generated payroll for ${result.payslips.length} employee(s).`; msg.className = 'success';
    } catch (err) { msg.textContent = err.message; msg.className = 'error'; }
});

document.getElementById('payrollViewForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const el = document.getElementById('payslipsList');
    const month = document.getElementById('viewMonth').value;
    const year = document.getElementById('viewYear').value;
    el.innerHTML = '<span class="loading">Loading…</span>';
    try {
        const result = await apiGet(`/payroll/${year}/${month}`);
        if (result.payslips.length === 0) { el.innerHTML = '<p class="empty">No payslips in this run.</p>'; return; }
        el.innerHTML = `
            <button onclick="window.location.href='/api/payroll/${year}/${month}/download-csv'">Download CSV</button>
            <table><thead><tr><th>Employee</th><th>Gross</th><th>Unpaid Days</th><th>Tax</th><th>Social Security</th><th>Net Pay</th></tr></thead>
            <tbody>${result.payslips.map(p => `<tr><td>${p.name}</td><td>${fmtMoney(p.gross_pay)}</td><td>${p.unpaid_leave_days}</td>
                <td>${fmtMoney(p.tax_deduction)}</td><td>${fmtMoney(p.social_security_deduction)}</td><td>${fmtMoney(p.net_pay)}</td></tr>`).join('')}</tbody></table>`;
    } catch (err) { el.innerHTML = `<p class="error">${err.message} — has payroll been generated for this period yet?</p>`; }
});

async function init() {
    populateMonthSelect(document.getElementById('genMonth'));
    populateMonthSelect(document.getElementById('viewMonth'));
    document.getElementById('genYear').value = new Date().getFullYear();
    document.getElementById('viewYear').value = new Date().getFullYear();
    await loadTeams();
    await loadEmployees();
    loadPendingApprovals(); loadWhosOut(); loadBalances(); loadOrgView(); loadAllLeave();
}
init();