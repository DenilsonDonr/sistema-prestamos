'use strict';

const modelosService = require('../services/modelos.service');
const { validateCreate, validateUpdate } = require('../validators/modelos.validator');

/** GET /api/catalogos/modelos?marca_id=1 */
async function getAll(req, res, next) {
  try {
    const marcaId = req.query.marca_id ? Number(req.query.marca_id) : undefined;
    const data = await modelosService.getAll(marcaId);
    res.json({ ok: true, data });
  } catch (err) {
    next(err);
  }
}

/** GET /api/catalogos/modelos/:id */
async function getById(req, res, next) {
  try {
    const data = await modelosService.getById(Number(req.params.id));
    res.json({ ok: true, data });
  } catch (err) {
    next(err);
  }
}

/** POST /api/catalogos/modelos */
async function create(req, res, next) {
  try {
    const { marca_id, nombre } = validateCreate(req.body);
    const data = await modelosService.create(marca_id, nombre);
    res.status(201).json({ ok: true, data });
  } catch (err) {
    next(err);
  }
}

/** PUT /api/catalogos/modelos/:id */
async function update(req, res, next) {
  try {
    const fields = validateUpdate(req.body);
    const usuarioModificaId = req.user?.user_id ?? null;
    const data = await modelosService.update(Number(req.params.id), fields, usuarioModificaId);
    res.json({ ok: true, data });
  } catch (err) {
    next(err);
  }
}

/** DELETE /api/catalogos/modelos/:id */
async function remove(req, res, next) {
  try {
    const usuarioModificaId = req.user?.user_id ?? null;
    await modelosService.remove(Number(req.params.id), usuarioModificaId);
    res.json({ ok: true, data: null });
  } catch (err) {
    next(err);
  }
}

module.exports = { getAll, getById, create, update, remove };
