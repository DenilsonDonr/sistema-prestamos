'use strict';

const tiposHerramientaService = require('../services/tipos-herramienta.service');
const { validateCreate, validateUpdate } = require('../validators/tipos-herramienta.validator');

/** GET /api/catalogos/tipos-herramienta */
async function getAll(req, res, next) {
  try {
    const data = await tiposHerramientaService.getAll();
    res.json({ ok: true, data });
  } catch (err) {
    next(err);
  }
}

/** GET /api/catalogos/tipos-herramienta/:id */
async function getById(req, res, next) {
  try {
    const data = await tiposHerramientaService.getById(Number(req.params.id));
    res.json({ ok: true, data });
  } catch (err) {
    next(err);
  }
}

/** POST /api/catalogos/tipos-herramienta */
async function create(req, res, next) {
  try {
    const { nombre } = validateCreate(req.body);
    const data = await tiposHerramientaService.create(nombre);
    res.status(201).json({ ok: true, data });
  } catch (err) {
    next(err);
  }
}

/** PUT /api/catalogos/tipos-herramienta/:id */
async function update(req, res, next) {
  try {
    const fields = validateUpdate(req.body);
    const usuarioModificaId = req.user?.user_id ?? null;
    const data = await tiposHerramientaService.update(Number(req.params.id), fields, usuarioModificaId);
    res.json({ ok: true, data });
  } catch (err) {
    next(err);
  }
}

/** DELETE /api/catalogos/tipos-herramienta/:id */
async function remove(req, res, next) {
  try {
    const usuarioModificaId = req.user?.user_id ?? null;
    await tiposHerramientaService.remove(Number(req.params.id), usuarioModificaId);
    res.json({ ok: true, data: null });
  } catch (err) {
    next(err);
  }
}

module.exports = { getAll, getById, create, update, remove };
