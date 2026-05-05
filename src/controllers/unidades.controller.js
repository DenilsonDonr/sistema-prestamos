'use strict';

const unidadesService = require('../services/unidades.service');
const { validateUpdate } = require('../validators/unidades.validator');

async function getAll(req, res, next) {
  try {
    const data = await unidadesService.getAll();
    res.json({ ok: true, data });
  } catch (err) {
    next(err);
  }
}

async function getById(req, res, next) {
  try {
    const data = await unidadesService.getById(Number(req.params.id));
    res.json({ ok: true, data });
  } catch (err) {
    next(err);
  }
}

async function update(req, res, next) {
  try {
    const fields = validateUpdate(req.body);
    const usuarioModificaId = req.user?.user_id ?? null;
    const data = await unidadesService.update(Number(req.params.id), fields, usuarioModificaId);
    res.json({ ok: true, data });
  } catch (err) {
    next(err);
  }
}

module.exports = { getAll, getById, update };
