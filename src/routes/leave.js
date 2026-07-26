const express = require('express');
const router = express.Router();
const { createLeaveRequest, listLeaveRequests, decideLeaveRequest } = require('../controllers/leaveController');

router.post('/', createLeaveRequest);
router.get('/', listLeaveRequests);
router.patch('/:id/decision', decideLeaveRequest);

module.exports = router;