const express = require('express');
const router = express.Router();
const { getAllEmployees, createEmployee, getOrgView, deactivateEmployee } = require('../controllers/employeeController');

router.get('/org-view', getOrgView);
router.get('/', getAllEmployees);
router.post('/', createEmployee);
router.patch('/:id/deactivate', deactivateEmployee);

module.exports = router;