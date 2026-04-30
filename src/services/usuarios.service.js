'use strict';

const bcrypt = require('bcrypt');
const db = require('../config/db');

function error(statusCode, code, message) {
  return Object.assign(new Error(message), { statusCode, code });
}

// ================= CREATE =================
async function createUser(payload, userId) {
  const {
    rol_id, codigo, dni, nombres, apellidos,
    cargo_id, area_id, turno_id,
    telefono, username, password, email
  } = payload;

  // validar duplicados
  const [u1] = await db.query('SELECT id FROM usuarios WHERE username = ?', [username]);
  if (u1.length) throw error(409, 'USERNAME_EXISTS', 'Username ya existe');

  const [u2] = await db.query('SELECT id FROM usuarios WHERE codigo = ?', [codigo]);
  if (u2.length) throw error(409, 'CODIGO_EXISTS', 'Código ya existe');

  const hash = await bcrypt.hash(password, 10);

  const [res] = await db.query(
    `INSERT INTO usuarios 
    (rol_id, codigo, dni, nombres, apellidos, cargo_id, area_id, turno_id,
     telefono, username, password_hash, email, usuario_modifica_id)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      rol_id, codigo, dni, nombres, apellidos,
      cargo_id, area_id, turno_id,
      telefono, username, hash, email, userId
    ]
  );

  return { id: res.insertId, username, nombres };
}

// ================= UPDATE =================
async function updateUser(id, payload, userId) {

  // verificar existencia
  const [exists] = await db.query('SELECT id FROM usuarios WHERE id = ?', [id]);
  if (!exists.length) throw error(404, 'USER_NOT_FOUND', 'Usuario no encontrado');

  // validar duplicados si cambian
  if (payload.username) {
    const [u] = await db.query(
      'SELECT id FROM usuarios WHERE username = ? AND id != ?',
      [payload.username, id]
    );
    if (u.length) throw error(409, 'USERNAME_EXISTS', 'Username ya existe');
  }

  if (payload.codigo) {
    const [c] = await db.query(
      'SELECT id FROM usuarios WHERE codigo = ? AND id != ?',
      [payload.codigo, id]
    );
    if (c.length) throw error(409, 'CODIGO_EXISTS', 'Código ya existe');
  }

  // whitelist de campos
  const allowed = [
    'rol_id','codigo','dni','nombres','apellidos',
    'cargo_id','area_id','turno_id',
    'telefono','username','email'
  ];

  const fields = [];
  const values = [];

  for (const key of allowed) {
    if (payload[key] !== undefined) {
      fields.push(`${key} = ?`);
      values.push(payload[key]);
    }
  }

  // password opcional
  if (payload.password) {
    const hash = await bcrypt.hash(payload.password, 10);
    fields.push('password_hash = ?');
    values.push(hash);
  }

  fields.push('usuario_modifica_id = ?', 'updated_at = NOW()');
  values.push(userId, id);

  await db.query(
    `UPDATE usuarios SET ${fields.join(', ')} WHERE id = ?`,
    values
  );

  return { id };
}

// ================= GET =================
async function getUserById(id) {
  const [rows] = await db.query(
    `SELECT u.*, r.nombre AS rol_nombre
     FROM usuarios u
     JOIN roles r ON u.rol_id = r.id
     WHERE u.id = ?`,
    [id]
  );

  if (!rows.length) throw error(404, 'USER_NOT_FOUND', 'Usuario no encontrado');

  return rows[0];
}

// ================= LIST =================
async function listUsers(filters, limit, offset) {
  let base = 'FROM usuarios WHERE 1=1';
  const values = [];

  if (filters.rol_id) {
    base += ' AND rol_id = ?';
    values.push(filters.rol_id);
  }

  if (filters.activo !== undefined) {
    base += ' AND activo = ?';
    values.push(filters.activo ? 1 : 0);
  }

  if (filters.search) {
    base += ' AND (codigo LIKE ? OR username LIKE ? OR nombres LIKE ?)';
    const s = `%${filters.search}%`;
    values.push(s, s, s);
  }

  // total
  const [[{ total }]] = await db.query(
    `SELECT COUNT(*) as total ${base}`,
    values
  );

  // data
  const [rows] = await db.query(
    `SELECT * ${base} LIMIT ? OFFSET ?`,
    [...values, limit, offset]
  );

  return { data: rows, total, limit, offset };
}

// ================= ACTIVATE / DEACTIVATE =================
async function deactivateUser(id, userId) {
  if (id === userId)
    throw error(400, 'SELF_DEACTIVATION', 'No puedes desactivar tu propia cuenta');

  const [rows] = await db.query(
    `SELECT u.id, u.rol_id, r.nombre AS rol_nombre
     FROM usuarios u
     JOIN roles r ON u.rol_id = r.id
     WHERE u.id = ?`,
    [id]
  );
  if (!rows.length) throw error(404, 'USER_NOT_FOUND', 'Usuario no encontrado');

  const target = rows[0];

  if (target.rol_nombre === 'administrador') {
    const [[{ cnt }]] = await db.query(
      'SELECT COUNT(*) AS cnt FROM usuarios WHERE rol_id = ? AND activo = 1 AND id != ?',
      [target.rol_id, id]
    );
    if (cnt === 0)
      throw error(400, 'LAST_ADMIN', 'No se puede desactivar al único administrador activo del sistema');
  }

  await db.query(
    'UPDATE usuarios SET activo = 0, usuario_modifica_id = ? WHERE id = ?',
    [userId, id]
  );

  return { id };
}

async function activateUser(id, userId) {
  const [exists] = await db.query('SELECT id FROM usuarios WHERE id = ?', [id]);
  if (!exists.length) throw error(404, 'USER_NOT_FOUND', 'Usuario no encontrado');

  await db.query(
    'UPDATE usuarios SET activo = 1, usuario_modifica_id = ? WHERE id = ?',
    [userId, id]
  );

  return { id };
}

// ================= USERNAME =================
async function isUsernameAvailable(username) {
  const [rows] = await db.query(
    'SELECT id FROM usuarios WHERE username = ?',
    [username]
  );
  return rows.length === 0;
}

module.exports = {
  createUser,
  updateUser,
  getUserById,
  listUsers,
  deactivateUser,
  activateUser,
  isUsernameAvailable,
};