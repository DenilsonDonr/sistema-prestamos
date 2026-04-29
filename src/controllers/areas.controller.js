'use strict';

const areasService = require('../services/areas.service');
const { validateCreate, validateUpdate } = require('../validators/areas.validator');

/** GET /api/catalogos/areas */
async function getAll(req, res, next) {
  try {
    const data = await areasService.getAll();
    res.json({ ok: true, data });
  } catch (err) {
    next(err);
  }
}

/** GET /api/catalogos/areas/:id */
async function getById(req, res, next) {
  try {
    const data = await areasService.getById(Number(req.params.id));
    res.json({ ok: true, data });
  } catch (err) {
    next(err);
  }
}

/** POST /api/catalogos/areas */
async function create(req, res, next) {
  try {
    const fields = validateCreate(req.body);
    const data = await areasService.create(fields);
    res.status(201).json({ ok: true, data });
  } catch (err) {
    next(err);
  }
}

/** PUT /api/catalogos/areas/:id */
async function update(req, res, next) {
  try {
    const fields = validateUpdate(req.body);
    const usuarioModificaId = req.user?.user_id ?? null;
    const data = await areasService.update(Number(req.params.id), fields, usuarioModificaId);
    res.json({ ok: true, data });
  } catch (err) {
    next(err);
  }
}

/** DELETE /api/catalogos/areas/:id */
async function remove(req, res, next) {
  try {
    const usuarioModificaId = req.user?.user_id ?? null;
    await areasService.remove(Number(req.params.id), usuarioModificaId);
    res.json({ ok: true, data: null });
  } catch (err) {
    next(err);
  }
}

module.exports = { getAll, getById, create, update, remove };
