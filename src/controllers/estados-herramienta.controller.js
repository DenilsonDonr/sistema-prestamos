'use strict';

const estadosHerramientaService = require('../services/estados-herramienta.service');
const { validateCreate, validateUpdate } = require('../validators/estados-herramienta.validator');

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

/** POST /api/catalogos/estados-herramienta */
async function create(req, res, next) {
  try {
    const fields = validateCreate(req.body);
    const data = await estadosHerramientaService.create(fields);
    res.status(201).json({ ok: true, data });
  } catch (err) {
    next(err);
  }
}

/** PUT /api/catalogos/estados-herramienta/:id */
async function update(req, res, next) {
  try {
    const fields = validateUpdate(req.body);
    const usuarioModificaId = req.user?.user_id ?? null;
    const data = await estadosHerramientaService.update(Number(req.params.id), fields, usuarioModificaId);
    res.json({ ok: true, data });
  } catch (err) {
    next(err);
  }
}

/** DELETE /api/catalogos/estados-herramienta/:id */
async function remove(req, res, next) {
  try {
    const usuarioModificaId = req.user?.user_id ?? null;
    await estadosHerramientaService.remove(Number(req.params.id), usuarioModificaId);
    res.json({ ok: true, data: null });
  } catch (err) {
    next(err);
  }
}

module.exports = { getAll, getById, create, update, remove };
