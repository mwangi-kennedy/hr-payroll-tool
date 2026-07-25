const express = require('express');
const router = express.Router();
const { getAllEmployees, createEmployee } = require('../controllers/employeeController');

router.get('/', getAllEmployees);
router.post('/', createEmployee);

module.exports = router;