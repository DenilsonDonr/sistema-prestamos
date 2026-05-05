'use strict';

const db = require('../config/db');

/** Devuelve todos los estados de herramienta ordenados alfabéticamente. */
async function getAll() {
  const [rows] = await db.query(
    'SELECT id, nombre, descripcion, color, activo, created_at, updated_at FROM estados_herramienta ORDER BY nombre ASC'
  );
  return rows;
}

/**
 * Devuelve un estado de herramienta por su ID.
 * @throws {404} Si no existe.
 */
async function getById(id) {
  const [rows] = await db.query(
    'SELECT id, nombre, descripcion, color, activo, created_at, updated_at FROM estados_herramienta WHERE id = ?',
    [id]
  );

  if (rows.length === 0) {
    const err = new Error('Estado de herramienta no encontrado');
    err.statusCode = 404;
    err.code = 'NOT_FOUND';
    throw err;
  }

  return rows[0];
}

module.exports = { getAll, getById };
