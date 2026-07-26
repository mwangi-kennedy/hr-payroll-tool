const express = require('express');
const cors = require('cors');
const employeeRoutes = require('./routes/employees');
const leaveRoutes = require('./routes/leave');
const payrollRoutes = require('./routes/payroll');

const app = express();
app.use(cors());
app.use(express.json());

app.use('/api/employees', employeeRoutes);
app.use('/api/leave', leaveRoutes);

app.get('/', (req, res) => {
    res.json({ status: 'HR & Payroll API running' });
});
app.use('/api/payroll', payrollRoutes);

module.exports = app;