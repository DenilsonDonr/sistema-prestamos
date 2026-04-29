'use strict';

const db = require('../config/db');

/** Devuelve todos los cargos ordenados alfabéticamente. */
async function getAll() {
  const [rows] = await db.query(
    'SELECT id, nombre, descripcion, activo, created_at, updated_at FROM cargos ORDER BY nombre ASC'
  );
  return rows;
}

/**
 * Devuelve un cargo por su ID.
 * @throws {404} Si no existe.
 */
async function getById(id) {
  const [rows] = await db.query(
    'SELECT id, nombre, descripcion, activo, created_at, updated_at FROM cargos WHERE id = ?',
    [id]
  );

  if (rows.length === 0) {
    const err = new Error('Cargo no encontrado');
    err.statusCode = 404;
    err.code = 'NOT_FOUND';
    throw err;
  }

  return rows[0];
}

/**
 * Crea un nuevo cargo.
 * @throws {409} Si ya existe un cargo con ese nombre.
 */
async function create(fields) {
  const [existing] = await db.query(
    'SELECT id FROM cargos WHERE nombre = ?',
    [fields.nombre]
  );

  if (existing.length > 0) {
    const err = new Error(`Ya existe un cargo con el nombre "${fields.nombre}"`);
    err.statusCode = 409;
    err.code = 'DUPLICATE_ENTRY';
    throw err;
  }

  const columns = Object.keys(fields).join(', ');
  const placeholders = Object.keys(fields).map(() => '?').join(', ');

  const [result] = await db.query(
    `INSERT INTO cargos (${columns}) VALUES (${placeholders})`,
    Object.values(fields)
  );

  return getById(result.insertId);
}

/**
 * Actualiza campos de un cargo.
 * @param {number} id
 * @param {{ nombre?: string, descripcion?: string, activo?: boolean }} fields
 * @param {number|null} usuarioModificaId
 * @throws {404} Si no existe. {409} Si el nuevo nombre ya está en uso.
 */
async function update(id, fields, usuarioModificaId) {
  await getById(id);

  if (fields.nombre !== undefined) {
    const [existing] = await db.query(
      'SELECT id FROM cargos WHERE nombre = ? AND id != ?',
      [fields.nombre, id]
    );

    if (existing.length > 0) {
      const err = new Error(`Ya existe un cargo con el nombre "${fields.nombre}"`);
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
    `UPDATE cargos SET ${setClauses.join(', ')} WHERE id = ?`,
    values
  );

  return getById(id);
}

/**
 * Baja lógica: marca el cargo como inactivo (activo = false).
 * @param {number} id
 * @param {number|null} usuarioModificaId
 */
async function remove(id, usuarioModificaId) {
  await getById(id);

  await db.query(
    'UPDATE cargos SET activo = false, usuario_modifica_id = ?, updated_at = NOW() WHERE id = ?',
    [usuarioModificaId, id]
  );
}

module.exports = { getAll, getById, create, update, remove };
