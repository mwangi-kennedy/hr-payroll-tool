const express = require('express');
const router = express.Router();
const { getAllTeams, createTeam } = require('../controllers/teamController');

router.get('/', getAllTeams);
router.post('/', createTeam);

module.exports = router;