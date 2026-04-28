'use strict';

const { Router } = require('express');
const { login } = require('../controllers/auth.controller');

const router = Router();

// POST /api/auth/login
router.post('/login', login);

module.exports = router;
