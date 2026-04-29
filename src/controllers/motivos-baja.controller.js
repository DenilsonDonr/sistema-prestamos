'use strict';

const motivosBajaService = require('../services/motivos-baja.service');
const { validateCreate, validateUpdate } = require('../validators/motivos-baja.validator');

/** GET /api/catalogos/motivos-baja */
async function getAll(req, res, next) {
  try {
    const data = await motivosBajaService.getAll();
    res.json({ ok: true, data });
  } catch (err) {
    next(err);
  }
}

/** GET /api/catalogos/motivos-baja/:id */
async function getById(req, res, next) {
  try {
    const data = await motivosBajaService.getById(Number(req.params.id));
    res.json({ ok: true, data });
  } catch (err) {
    next(err);
  }
}

/** POST /api/catalogos/motivos-baja */
async function create(req, res, next) {
  try {
    const fields = validateCreate(req.body);
    const data = await motivosBajaService.create(fields);
    res.status(201).json({ ok: true, data });
  } catch (err) {
    next(err);
  }
}

/** PUT /api/catalogos/motivos-baja/:id */
async function update(req, res, next) {
  try {
    const fields = validateUpdate(req.body);
    const usuarioModificaId = req.user?.user_id ?? null;
    const data = await motivosBajaService.update(Number(req.params.id), fields, usuarioModificaId);
    res.json({ ok: true, data });
  } catch (err) {
    next(err);
  }
}

/** DELETE /api/catalogos/motivos-baja/:id */
async function remove(req, res, next) {
  try {
    const usuarioModificaId = req.user?.user_id ?? null;
    await motivosBajaService.remove(Number(req.params.id), usuarioModificaId);
    res.json({ ok: true, data: null });
  } catch (err) {
    next(err);
  }
}

module.exports = { getAll, getById, create, update, remove };
