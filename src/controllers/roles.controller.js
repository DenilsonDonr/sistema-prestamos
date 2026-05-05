'use strict';

const service = require('../services/roles.service');

async function list(req, res, next) {
  try {
    const data = await service.listRoles();
    res.json({ ok: true, data });
  } catch (err) {
    next(err);
  }
}

module.exports = { list };
