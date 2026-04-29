'use strict';

const db = require('../config/db');

/** Devuelve todas las marcas ordenadas alfabéticamente. */
async function getAll() {
  const [rows] = await db.query(
    'SELECT id, nombre, activo, created_at, updated_at FROM marcas ORDER BY nombre ASC'
  );
  return rows;
}

/**
 * Devuelve una marca por su ID.
 * @throws {404} Si no existe.
 */
async function getById(id) {
  const [rows] = await db.query(
    'SELECT id, nombre, activo, created_at, updated_at FROM marcas WHERE id = ?',
    [id]
  );

  if (rows.length === 0) {
    const err = new Error('Marca no encontrada');
    err.statusCode = 404;
    err.code = 'NOT_FOUND';
    throw err;
  }

  return rows[0];
}

/**
 * Crea una nueva marca.
 * @throws {409} Si ya existe una marca con ese nombre.
 */
async function create(nombre) {
  const [existing] = await db.query(
    'SELECT id FROM marcas WHERE nombre = ?',
    [nombre]
  );

  if (existing.length > 0) {
    const err = new Error(`Ya existe una marca con el nombre "${nombre}"`);
    err.statusCode = 409;
    err.code = 'DUPLICATE_ENTRY';
    throw err;
  }

  const [result] = await db.query(
    'INSERT INTO marcas (nombre) VALUES (?)',
    [nombre]
  );

  return getById(result.insertId);
}

/**
 * Actualiza nombre y/o activo de una marca.
 * @param {number} id
 * @param {{ nombre?: string, activo?: boolean }} fields
 * @param {number|null} usuarioModificaId - ID del usuario autenticado (req.user.user_id).
 * @throws {404} Si no existe. {409} Si el nuevo nombre ya está en uso.
 */
async function update(id, fields, usuarioModificaId) {
  await getById(id);

  if (fields.nombre !== undefined) {
    const [existing] = await db.query(
      'SELECT id FROM marcas WHERE nombre = ? AND id != ?',
      [fields.nombre, id]
    );

    if (existing.length > 0) {
      const err = new Error(`Ya existe una marca con el nombre "${fields.nombre}"`);
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
    `UPDATE marcas SET ${setClauses.join(', ')} WHERE id = ?`,
    values
  );

  return getById(id);
}

/**
 * Baja lógica: marca la marca como inactiva (activo = false).
 * No elimina el registro porque otras tablas referencian marca_id.
 * @param {number} id
 * @param {number|null} usuarioModificaId
 */
async function remove(id, usuarioModificaId) {
  await getById(id);

  await db.query(
    'UPDATE marcas SET activo = false, usuario_modifica_id = ?, updated_at = NOW() WHERE id = ?',
    [usuarioModificaId, id]
  );
}

module.exports = { getAll, getById, create, update, remove };
