'use strict';

const herramientasService = require('../services/herramientas.service');
const { validateCreate, validateUpdate } = require('../validators/herramientas.validator');

async function getAll(req, res, next) {
  try {
    const data = await herramientasService.getAll();
    res.json({ ok: true, data });
  } catch (err) {
    next(err);
  }
}

async function getById(req, res, next) {
  try {
    const data = await herramientasService.getById(Number(req.params.id));
    res.json({ ok: true, data });
  } catch (err) {
    next(err);
  }
}

async function create(req, res, next) {
  try {
    const fields = validateCreate(req.body);
    const data = await herramientasService.create(fields);
    res.status(201).json({ ok: true, data });
  } catch (err) {
    next(err);
  }
}

async function update(req, res, next) {
  try {
    const fields = validateUpdate(req.body);
    const usuarioModificaId = req.user?.user_id ?? null;
    const data = await herramientasService.update(Number(req.params.id), fields, usuarioModificaId);
    res.json({ ok: true, data });
  } catch (err) {
    next(err);
  }
}

async function remove(req, res, next) {
  try {
    const usuarioModificaId = req.user?.user_id ?? null;
    await herramientasService.remove(Number(req.params.id), usuarioModificaId);
    res.json({ ok: true, data: null });
  } catch (err) {
    next(err);
  }
}

module.exports = { getAll, getById, create, update, remove };
