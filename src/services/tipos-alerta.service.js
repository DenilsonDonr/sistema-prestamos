'use strict';

const db = require('../config/db');

/** Devuelve todos los tipos de alerta ordenados alfabéticamente. */
async function getAll() {
  const [rows] = await db.query(
    'SELECT id, nombre, descripcion, activo, created_at, updated_at FROM tipos_alerta ORDER BY nombre ASC'
  );
  return rows;
}

/**
 * Devuelve un tipo de alerta por su ID.
 * @throws {404} Si no existe.
 */
async function getById(id) {
  const [rows] = await db.query(
    'SELECT id, nombre, descripcion, activo, created_at, updated_at FROM tipos_alerta WHERE id = ?',
    [id]
  );

  if (rows.length === 0) {
    const err = new Error('Tipo de alerta no encontrado');
    err.statusCode = 404;
    err.code = 'NOT_FOUND';
    throw err;
  }

  return rows[0];
}

module.exports = { getAll, getById };
