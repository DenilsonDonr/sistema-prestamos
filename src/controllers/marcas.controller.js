'use strict';

const marcasService = require('../services/marcas.service');
const { validateCreate, validateUpdate } = require('../validators/marcas.validator');

/** GET /api/catalogos/marcas */
async function getAll(req, res, next) {
  try {
    const data = await marcasService.getAll();
    res.json({ ok: true, data });
  } catch (err) {
    next(err);
  }
}

/** GET /api/catalogos/marcas/:id */
async function getById(req, res, next) {
  try {
    const data = await marcasService.getById(Number(req.params.id));
    res.json({ ok: true, data });
  } catch (err) {
    next(err);
  }
}

/** POST /api/catalogos/marcas */
async function create(req, res, next) {
  try {
    const { nombre } = validateCreate(req.body);
    const data = await marcasService.create(nombre);
    res.status(201).json({ ok: true, data });
  } catch (err) {
    next(err);
  }
}

/** PUT /api/catalogos/marcas/:id */
async function update(req, res, next) {
  try {
    const fields = validateUpdate(req.body);
    const usuarioModificaId = req.user?.user_id ?? null;
    const data = await marcasService.update(Number(req.params.id), fields, usuarioModificaId);
    res.json({ ok: true, data });
  } catch (err) {
    next(err);
  }
}

/** DELETE /api/catalogos/marcas/:id */
async function remove(req, res, next) {
  try {
    const usuarioModificaId = req.user?.user_id ?? null;
    await marcasService.remove(Number(req.params.id), usuarioModificaId);
    res.json({ ok: true, data: null });
  } catch (err) {
    next(err);
  }
}

module.exports = { getAll, getById, create, update, remove };
