const express = require('express');
const cors = require('cors');
const path = require('path');
const employeeRoutes = require('./routes/employees');
const leaveRoutes = require('./routes/leave');
const payrollRoutes = require('./routes/payroll');
const teamRoutes = require('./routes/teams');

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, '../public')));

app.use('/api/employees', employeeRoutes);
app.use('/api/leave', leaveRoutes);
app.use('/api/payroll', payrollRoutes);
app.use('/api/teams', teamRoutes);

app.get('/api', (req, res) => {
    res.json({ status: 'HR & Payroll API running' });
});

module.exports = app;