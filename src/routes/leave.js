const express = require('express');
const router = express.Router();
const { createLeaveRequest, listLeaveRequests, decideLeaveRequest, getLeaveBalances } = require('../controllers/leaveController');

router.post('/', createLeaveRequest);
router.get('/', listLeaveRequests);
router.patch('/:id/decision', decideLeaveRequest);
router.get('/balances', getLeaveBalances);  

module.exports = router;