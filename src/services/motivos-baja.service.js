'use strict';

const db = require('../config/db');

/** Devuelve todos los motivos de baja ordenados alfabéticamente. */
async function getAll() {
  const [rows] = await db.query(
    'SELECT id, nombre, descripcion, activo, created_at, updated_at FROM motivos_baja ORDER BY nombre ASC'
  );
  return rows;
}

/**
 * Devuelve un motivo de baja por su ID.
 * @throws {404} Si no existe.
 */
async function getById(id) {
  const [rows] = await db.query(
    'SELECT id, nombre, descripcion, activo, created_at, updated_at FROM motivos_baja WHERE id = ?',
    [id]
  );

  if (rows.length === 0) {
    const err = new Error('Motivo de baja no encontrado');
    err.statusCode = 404;
    err.code = 'NOT_FOUND';
    throw err;
  }

  return rows[0];
}

/**
 * Crea un nuevo motivo de baja.
 * @throws {409} Si ya existe uno con ese nombre.
 */
async function create(fields) {
  const [existing] = await db.query(
    'SELECT id FROM motivos_baja WHERE nombre = ?',
    [fields.nombre]
  );

  if (existing.length > 0) {
    const err = new Error(`Ya existe un motivo de baja con el nombre "${fields.nombre}"`);
    err.statusCode = 409;
    err.code = 'DUPLICATE_ENTRY';
    throw err;
  }

  const columns = Object.keys(fields).join(', ');
  const placeholders = Object.keys(fields).map(() => '?').join(', ');

  const [result] = await db.query(
    `INSERT INTO motivos_baja (${columns}) VALUES (${placeholders})`,
    Object.values(fields)
  );

  return getById(result.insertId);
}

/**
 * Actualiza campos de un motivo de baja.
 * @param {number} id
 * @param {{ nombre?: string, descripcion?: string, activo?: boolean }} fields
 * @param {number|null} usuarioModificaId
 * @throws {404} Si no existe. {409} Si el nuevo nombre ya está en uso.
 */
async function update(id, fields, usuarioModificaId) {
  await getById(id);

  if (fields.nombre !== undefined) {
    const [existing] = await db.query(
      'SELECT id FROM motivos_baja WHERE nombre = ? AND id != ?',
      [fields.nombre, id]
    );

    if (existing.length > 0) {
      const err = new Error(`Ya existe un motivo de baja con el nombre "${fields.nombre}"`);
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
    `UPDATE motivos_baja SET ${setClauses.join(', ')} WHERE id = ?`,
    values
  );

  return getById(id);
}

/**
 * Baja lógica: marca el motivo como inactivo (activo = false).
 * @param {number} id
 * @param {number|null} usuarioModificaId
 */
async function remove(id, usuarioModificaId) {
  await getById(id);

  await db.query(
    'UPDATE motivos_baja SET activo = false, usuario_modifica_id = ?, updated_at = NOW() WHERE id = ?',
    [usuarioModificaId, id]
  );
}

module.exports = { getAll, getById, create, update, remove };
