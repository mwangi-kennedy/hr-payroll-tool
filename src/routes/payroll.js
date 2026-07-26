const express = require('express');
const router = express.Router();
const { generatePayroll, getPayrollForPeriod, listPayrollRuns } = require('../controllers/payrollController');

router.post('/generate', generatePayroll);
router.get('/runs', listPayrollRuns);
router.get('/:year/:month', getPayrollForPeriod);

module.exports = router;