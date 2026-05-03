'use strict';

const { Router } = require('express');
const auth = require('../middleware/auth');
const { login, me } = require('../controllers/auth.controller');

const router = Router();

router.post('/login', login);
router.get('/me', auth, me);

module.exports = router;
