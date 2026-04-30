'use strict';

const comprasService = require('../services/compras.service');
const { validateCreate } = require('../validators/compras.validator');

async function getAll(req, res, next) {
  try {
    const data = await comprasService.getAll();
    res.json({ ok: true, data });
  } catch (err) {
    next(err);
  }
}

async function getById(req, res, next) {
  try {
    const data = await comprasService.getById(Number(req.params.id));
    res.json({ ok: true, data });
  } catch (err) {
    next(err);
  }
}

async function create(req, res, next) {
  try {
    const fields = validateCreate(req.body);
    const usuarioRegistraId = req.user?.user_id ?? null;
    const data = await comprasService.create(fields, usuarioRegistraId);
    res.status(201).json({ ok: true, data });
  } catch (err) {
    next(err);
  }
}

async function anular(req, res, next) {
  try {
    const usuarioModificaId = req.user?.user_id ?? null;
    await comprasService.anular(Number(req.params.id), usuarioModificaId);
    res.json({ ok: true, data: null });
  } catch (err) {
    next(err);
  }
}

module.exports = { getAll, getById, create, anular };
