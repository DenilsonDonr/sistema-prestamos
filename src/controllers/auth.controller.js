'use strict';

const { validateLogin } = require('../validators/auth.validator');
const authService = require('../services/auth.service');
const { signToken } = require('../utils/jwt');

/**
 * POST /api/auth/login
 * Autentica un usuario y devuelve un JWT.
 */
async function login(req, res, next) {
  try {
    const { username, password } = validateLogin(req.body);
    const payload = await authService.login(username, password);
    const token = signToken(payload);
    res.status(200).json({ ok: true, data: { token } });
  } catch (err) {
    next(err);
  }
}

module.exports = { login };
