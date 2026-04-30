'use strict';

const ubicacionesService = require('../services/ubicaciones.service');
const { validateCreate, validateUpdate } = require('../validators/ubicaciones.validator');

/** GET /api/catalogos/ubicaciones */
async function getAll(req, res, next) {
  try {
    const data = await ubicacionesService.getAll();
    res.json({ ok: true, data });
  } catch (err) {
    next(err);
  }
}

/** GET /api/catalogos/ubicaciones/:id */
async function getById(req, res, next) {
  try {
    const data = await ubicacionesService.getById(Number(req.params.id));
    res.json({ ok: true, data });
  } catch (err) {
    next(err);
  }
}

/** POST /api/catalogos/ubicaciones */
async function create(req, res, next) {
  try {
    const fields = validateCreate(req.body);
    const data = await ubicacionesService.create(fields);
    res.status(201).json({ ok: true, data });
  } catch (err) {
    next(err);
  }
}

/** PUT /api/catalogos/ubicaciones/:id */
async function update(req, res, next) {
  try {
    const fields = validateUpdate(req.body);
    const usuarioModificaId = req.user?.user_id ?? null;
    const data = await ubicacionesService.update(Number(req.params.id), fields, usuarioModificaId);
    res.json({ ok: true, data });
  } catch (err) {
    next(err);
  }
}

/** DELETE /api/catalogos/ubicaciones/:id */
async function remove(req, res, next) {
  try {
    const usuarioModificaId = req.user?.user_id ?? null;
    await ubicacionesService.remove(Number(req.params.id), usuarioModificaId);
    res.json({ ok: true, data: null });
  } catch (err) {
    next(err);
  }
}

module.exports = { getAll, getById, create, update, remove };
