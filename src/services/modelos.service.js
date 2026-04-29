'use strict';

const db = require('../config/db');

/** Devuelve todos los modelos, con nombre de marca. Acepta filtro opcional por marca_id. */
async function getAll(marcaId) {
  const conditions = marcaId ? 'WHERE m.marca_id = ?' : '';
  const params     = marcaId ? [marcaId] : [];

  const [rows] = await db.query(
    `SELECT m.id, m.nombre, m.activo, m.marca_id, ma.nombre AS marca_nombre,
            m.created_at, m.updated_at
     FROM modelos m
     JOIN marcas ma ON m.marca_id = ma.id
     ${conditions}
     ORDER BY ma.nombre ASC, m.nombre ASC`,
    params
  );

  return rows;
}

/**
 * Devuelve un modelo por ID, incluyendo nombre de marca.
 * @throws {404} Si no existe.
 */
async function getById(id) {
  const [rows] = await db.query(
    `SELECT m.id, m.nombre, m.activo, m.marca_id, ma.nombre AS marca_nombre,
            m.created_at, m.updated_at
     FROM modelos m
     JOIN marcas ma ON m.marca_id = ma.id
     WHERE m.id = ?`,
    [id]
  );

  if (rows.length === 0) {
    const err = new Error('Modelo no encontrado');
    err.statusCode = 404;
    err.code = 'NOT_FOUND';
    throw err;
  }

  return rows[0];
}

/**
 * Verifica que una marca exista y esté activa.
 * @throws {404} Si no existe o está inactiva.
 */
async function _assertMarcaExists(marcaId) {
  const [rows] = await db.query(
    'SELECT id FROM marcas WHERE id = ? AND activo = true',
    [marcaId]
  );

  if (rows.length === 0) {
    const err = new Error('La marca indicada no existe o está inactiva');
    err.statusCode = 404;
    err.code = 'NOT_FOUND';
    throw err;
  }
}

/**
 * Crea un nuevo modelo.
 * @throws {404} Si la marca no existe. {409} Si ya existe ese nombre en la misma marca.
 */
async function create(marcaId, nombre) {
  await _assertMarcaExists(marcaId);

  const [existing] = await db.query(
    'SELECT id FROM modelos WHERE marca_id = ? AND nombre = ?',
    [marcaId, nombre]
  );

  if (existing.length > 0) {
    const err = new Error(`Ya existe el modelo "${nombre}" para esa marca`);
    err.statusCode = 409;
    err.code = 'DUPLICATE_ENTRY';
    throw err;
  }

  const [result] = await db.query(
    'INSERT INTO modelos (marca_id, nombre) VALUES (?, ?)',
    [marcaId, nombre]
  );

  return getById(result.insertId);
}

/**
 * Actualiza campos de un modelo.
 * Si cambia marca_id o nombre, verifica que la nueva combinación no exista.
 * @param {number} id
 * @param {{ marca_id?: number, nombre?: string, activo?: boolean }} fields
 * @param {number|null} usuarioModificaId
 */
async function update(id, fields, usuarioModificaId) {
  const current = await getById(id);

  if (fields.marca_id !== undefined) {
    await _assertMarcaExists(fields.marca_id);
  }

  if (fields.marca_id !== undefined || fields.nombre !== undefined) {
    const newMarcaId = fields.marca_id ?? current.marca_id;
    const newNombre  = fields.nombre  ?? current.nombre;

    const [existing] = await db.query(
      'SELECT id FROM modelos WHERE marca_id = ? AND nombre = ? AND id != ?',
      [newMarcaId, newNombre, id]
    );

    if (existing.length > 0) {
      const err = new Error(`Ya existe el modelo "${newNombre}" para esa marca`);
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
    `UPDATE modelos SET ${setClauses.join(', ')} WHERE id = ?`,
    values
  );

  return getById(id);
}

/**
 * Baja lógica: marca el modelo como inactivo (activo = false).
 * @param {number} id
 * @param {number|null} usuarioModificaId
 */
async function remove(id, usuarioModificaId) {
  await getById(id);

  await db.query(
    'UPDATE modelos SET activo = false, usuario_modifica_id = ?, updated_at = NOW() WHERE id = ?',
    [usuarioModificaId, id]
  );
}

module.exports = { getAll, getById, create, update, remove };
