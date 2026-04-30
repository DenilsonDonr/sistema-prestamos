'use strict';

const db = require('../config/db');

/** Devuelve todos los tipos de herramienta ordenados alfabéticamente. */
async function getAll() {
  const [rows] = await db.query(
    'SELECT id, nombre, activo, created_at, updated_at FROM tipos_herramienta ORDER BY nombre ASC'
  );
  return rows;
}

/**
 * Devuelve un tipo de herramienta por su ID.
 * @throws {404} Si no existe.
 */
async function getById(id) {
  const [rows] = await db.query(
    'SELECT id, nombre, activo, created_at, updated_at FROM tipos_herramienta WHERE id = ?',
    [id]
  );

  if (rows.length === 0) {
    const err = new Error('Tipo de herramienta no encontrado');
    err.statusCode = 404;
    err.code = 'NOT_FOUND';
    throw err;
  }

  return rows[0];
}

/**
 * Crea un nuevo tipo de herramienta.
 * @throws {409} Si ya existe uno con ese nombre.
 */
async function create(nombre) {
  const [existing] = await db.query(
    'SELECT id FROM tipos_herramienta WHERE nombre = ?',
    [nombre]
  );

  if (existing.length > 0) {
    const err = new Error(`Ya existe un tipo de herramienta con el nombre "${nombre}"`);
    err.statusCode = 409;
    err.code = 'DUPLICATE_ENTRY';
    throw err;
  }

  const [result] = await db.query(
    'INSERT INTO tipos_herramienta (nombre) VALUES (?)',
    [nombre]
  );

  return getById(result.insertId);
}

/**
 * Actualiza campos de un tipo de herramienta.
 * @param {number} id
 * @param {{ nombre?: string, activo?: boolean }} fields
 * @param {number|null} usuarioModificaId
 * @throws {404} Si no existe. {409} Si el nuevo nombre ya está en uso.
 */
async function update(id, fields, usuarioModificaId) {
  await getById(id);

  if (fields.nombre !== undefined) {
    const [existing] = await db.query(
      'SELECT id FROM tipos_herramienta WHERE nombre = ? AND id != ?',
      [fields.nombre, id]
    );

    if (existing.length > 0) {
      const err = new Error(`Ya existe un tipo de herramienta con el nombre "${fields.nombre}"`);
      err.statusCode = 409;
      err.code = 'DUPLICATE_ENTRY';
      throw err;
    }
  }

  const setClauses = [];
  const values = [];

  for (const [key, val] of Object.entries(fields)) {
    setClauses.push(`${key} = ?`);
    values.push(val);
  }

  setClauses.push('usuario_modifica_id = ?', 'updated_at = NOW()');
  values.push(usuarioModificaId, id);

  await db.query(
    `UPDATE tipos_herramienta SET ${setClauses.join(', ')} WHERE id = ?`,
    values
  );

  return getById(id);
}

/**
 * Baja lógica: marca el tipo como inactivo (activo = false).
 * @param {number} id
 * @param {number|null} usuarioModificaId
 */
async function remove(id, usuarioModificaId) {
  await getById(id);

  await db.query(
    'UPDATE tipos_herramienta SET activo = false, usuario_modifica_id = ?, updated_at = NOW() WHERE id = ?',
    [usuarioModificaId, id]
  );
}

module.exports = { getAll, getById, create, update, remove };
