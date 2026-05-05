'use strict';

const turnosService = require('../services/turnos.service');
const { validateCreate, validateUpdate } = require('../validators/turnos.validator');

/** GET /api/catalogos/turnos */
async function getAll(req, res, next) {
  try {
    const data = await turnosService.getAll();
    res.json({ ok: true, data });
  } catch (err) {
    next(err);
  }
}

/** GET /api/catalogos/turnos/:id */
async function getById(req, res, next) {
  try {
    const data = await turnosService.getById(Number(req.params.id));
    res.json({ ok: true, data });
  } catch (err) {
    next(err);
  }
}

/** POST /api/catalogos/turnos */
async function create(req, res, next) {
  try {
    const fields = validateCreate(req.body);
    const data = await turnosService.create(fields);
    res.status(201).json({ ok: true, data });
  } catch (err) {
    next(err);
  }
}

/** PUT /api/catalogos/turnos/:id */
async function update(req, res, next) {
  try {
    const fields = validateUpdate(req.body);
    const usuarioModificaId = req.user?.user_id ?? null;
    const data = await turnosService.update(Number(req.params.id), fields, usuarioModificaId);
    res.json({ ok: true, data });
  } catch (err) {
    next(err);
  }
}

/** DELETE /api/catalogos/turnos/:id */
async function remove(req, res, next) {
  try {
    const usuarioModificaId = req.user?.user_id ?? null;
    await turnosService.remove(Number(req.params.id), usuarioModificaId);
    res.json({ ok: true, data: null });
  } catch (err) {
    next(err);
  }
}

module.exports = { getAll, getById, create, update, remove };
