'use strict';

const db = require('../config/db');

const SELECT = 'SELECT id, ruc, razon_social, nombre_comercial, direccion, telefono, email, contacto, activo, created_at, updated_at FROM proveedores';

async function getAll() {
  const [rows] = await db.query(`${SELECT} ORDER BY razon_social ASC`);
  return rows;
}

async function getById(id) {
  const [rows] = await db.query(`${SELECT} WHERE id = ?`, [id]);

  if (rows.length === 0) {
    const err = new Error('Proveedor no encontrado');
    err.statusCode = 404; err.code = 'NOT_FOUND'; throw err;
  }

  return rows[0];
}

async function create(fields) {
  if (fields.ruc !== undefined) {
    const [existing] = await db.query('SELECT id FROM proveedores WHERE ruc = ?', [fields.ruc]);
    if (existing.length > 0) {
      const err = new Error(`Ya existe un proveedor con el RUC "${fields.ruc}"`);
      err.statusCode = 409; err.code = 'DUPLICATE_ENTRY'; throw err;
    }
  }

  const columns = Object.keys(fields).join(', ');
  const placeholders = Object.keys(fields).map(() => '?').join(', ');

  const [result] = await db.query(
    `INSERT INTO proveedores (${columns}) VALUES (${placeholders})`,
    Object.values(fields)
  );

  return getById(result.insertId);
}

async function update(id, fields, usuarioModificaId) {
  await getById(id);

  if (fields.ruc !== undefined) {
    const [existing] = await db.query(
      'SELECT id FROM proveedores WHERE ruc = ? AND id != ?',
      [fields.ruc, id]
    );
    if (existing.length > 0) {
      const err = new Error(`Ya existe un proveedor con el RUC "${fields.ruc}"`);
      err.statusCode = 409; err.code = 'DUPLICATE_ENTRY'; throw err;
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
    `UPDATE proveedores SET ${setClauses.join(', ')} WHERE id = ?`,
    values
  );

  return getById(id);
}

async function remove(id, usuarioModificaId) {
  await getById(id);

  await db.query(
    'UPDATE proveedores SET activo = false, usuario_modifica_id = ?, updated_at = NOW() WHERE id = ?',
    [usuarioModificaId, id]
  );
}

module.exports = { getAll, getById, create, update, remove };
