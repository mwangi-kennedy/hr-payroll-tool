const BASE = 'http://localhost:3000/api';

function fmtDate(d) { return d.toISOString().split('T')[0]; }
function addDays(base, days) { const d = new Date(base); d.setDate(d.getDate() + days); return d; }

async function post(path, body) {
    const res = await fetch(`${BASE}${path}`, { method: 'POST', headers: {'Content-Type':'application/json'}, body: JSON.stringify(body) });
    return res.json();
}
async function patch(path, body) {
    const res = await fetch(`${BASE}${path}`, { method: 'PATCH', headers: {'Content-Type':'application/json'}, body: JSON.stringify(body || {}) });
    return res.json();
}

async function seed() {
    const today = new Date();
    const eng = await post('/teams', { name: 'Engineering' });
    const ops = await post('/teams', { name: 'Operations' });

    const alice = await post('/employees', { name: 'Alice Njoroge', role: 'Engineering Manager', team_id: eng.id, start_date: '2024-01-10', salary: 95000, employment_type: 'full_time' });
    const brian = await post('/employees', { name: 'Brian Otieno', role: 'Software Engineer', team_id: eng.id, manager_id: alice.id, start_date: '2024-03-01', salary: 65000, employment_type: 'full_time' });
    const carol = await post('/employees', { name: 'Carol Wambui', role: 'Operations Lead', team_id: ops.id, start_date: '2023-06-15', salary: 55000, employment_type: 'full_time' });
    const david = await post('/employees', { name: 'David Kiptoo', role: 'Operations Analyst', team_id: ops.id, manager_id: carol.id, start_date: '2026-07-15', salary: 42000, employment_type: 'contract' });

    const brianLeave = await post('/leave', { employee_id: brian.id, start_date: fmtDate(addDays(today, 1)), end_date: fmtDate(addDays(today, 2)), leave_type: 'unpaid', reason: 'Personal matters' });
    if (brianLeave.id) await patch(`/leave/${brianLeave.id}/decision`, { decision: 'approved', decided_by: alice.id });

    await post('/leave', { employee_id: david.id, start_date: fmtDate(addDays(today, 5)), end_date: fmtDate(addDays(today, 6)), leave_type: 'paid', reason: 'Family event' });

    const rejected = await post('/leave', { employee_id: carol.id, start_date: fmtDate(addDays(today, 20)), end_date: fmtDate(addDays(today, 25)), leave_type: 'unpaid' });
    if (rejected.id) await patch(`/leave/${rejected.id}/decision`, { decision: 'rejected', decided_by: alice.id });

    const payroll = await post('/payroll/generate', { month: today.getMonth() + 1, year: today.getFullYear() });
    console.log('Payroll generated:', payroll);

    await fetch(`${BASE}/employees/${carol.id}/deactivate`, { method: 'PATCH' });
    console.log('Seed complete.');
}

seed().catch(console.error);