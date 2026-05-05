'use strict';

const bcrypt = require('bcrypt');
const db = require('../config/db');

/**
 * Verifica credenciales y devuelve el payload para el JWT.
 * @param {string} username
 * @param {string} password - contraseña en texto plano
 * @returns {{ user_id: number, rol_id: number, rol_nombre: string }}
 */
async function login(username, password) {
  // JOIN con roles para obtener rol_id y rol_nombre en un solo viaje a la BD
  const [rows] = await db.query(
    `SELECT u.id, u.password_hash, u.activo,
            r.id AS rol_id, r.nombre AS rol_nombre
     FROM usuarios u
     JOIN roles r ON u.rol_id = r.id
     WHERE u.username = ?`,
    [username]
  );

  // Mismo mensaje para "usuario no existe" y "password incorrecto"
  // Evita que un atacante pueda descubrir si un username está registrado (user enumeration)
  if (rows.length === 0) {
    const err = new Error('Credenciales inválidas');
    err.statusCode = 401;
    err.code = 'INVALID_CREDENTIALS';
    throw err;
  }

  const user = rows[0];

  if (!user.activo) {
    const err = new Error('Usuario inactivo. Contacte al administrador');
    err.statusCode = 403;
    err.code = 'USER_INACTIVE';
    throw err;
  }

  const passwordMatch = await bcrypt.compare(password, user.password_hash);
  if (!passwordMatch) {
    const err = new Error('Credenciales inválidas');
    err.statusCode = 401;
    err.code = 'INVALID_CREDENTIALS';
    throw err;
  }

  // Registra el acceso. No se actualiza usuario_modifica_id porque es
  // una operación del sistema, no una edición de datos del usuario
  await db.query(
    'UPDATE usuarios SET ultimo_acceso = NOW() WHERE id = ?',
    [user.id]
  );

  return { user_id: user.id, rol_id: user.rol_id, rol_nombre: user.rol_nombre };
}

/**
 * Devuelve el perfil del usuario autenticado y el listado de codigos de
 * permisos que su rol tiene actualmente. Se usa por el frontend para
 * conocer el estado real (rol, activo, permisos) tras cambios que pueden
 * dejar el JWT desincronizado.
 */
async function getMe(userId) {
  const [users] = await db.query(
    `SELECT u.id, u.codigo, u.dni, u.nombres, u.apellidos,
            u.username, u.email, u.telefono, u.activo,
            u.rol_id, r.nombre AS rol_nombre,
            u.cargo_id, u.area_id, u.turno_id
     FROM usuarios u
     JOIN roles r ON u.rol_id = r.id
     WHERE u.id = ?`,
    [userId]
  );

  if (!users.length) {
    const e = new Error('Usuario no encontrado');
    e.statusCode = 404; e.code = 'USER_NOT_FOUND'; throw e;
  }

  const user = users[0];

  if (!user.activo) {
    const e = new Error('Cuenta desactivada');
    e.statusCode = 401; e.code = 'USER_INACTIVE'; throw e;
  }

  const [perms] = await db.query(
    `SELECT p.codigo
     FROM rol_permiso rp
     JOIN permisos p ON rp.permiso_id = p.id
     WHERE rp.rol_id = ?`,
    [user.rol_id]
  );

  return {
    user,
    permisos: perms.map(p => p.codigo),
  };
}

module.exports = { login, getMe };
