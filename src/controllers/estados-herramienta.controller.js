'use strict';

const estadosHerramientaService = require('../services/estados-herramienta.service');

/** GET /api/catalogos/estados-herramienta */
async function getAll(req, res, next) {
  try {
    const data = await estadosHerramientaService.getAll();
    res.json({ ok: true, data });
  } catch (err) {
    next(err);
  }
}

/** GET /api/catalogos/estados-herramienta/:id */
async function getById(req, res, next) {
  try {
    const data = await estadosHerramientaService.getById(Number(req.params.id));
    res.json({ ok: true, data });
  } catch (err) {
    next(err);
  }
}

module.exports = { getAll, getById };
