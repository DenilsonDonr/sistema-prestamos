'use strict';

const tiposAlertaService = require('../services/tipos-alerta.service');

/** GET /api/catalogos/tipos-alerta */
async function getAll(req, res, next) {
  try {
    const data = await tiposAlertaService.getAll();
    res.json({ ok: true, data });
  } catch (err) {
    next(err);
  }
}

/** GET /api/catalogos/tipos-alerta/:id */
async function getById(req, res, next) {
  try {
    const data = await tiposAlertaService.getById(Number(req.params.id));
    res.json({ ok: true, data });
  } catch (err) {
    next(err);
  }
}

module.exports = { getAll, getById };
