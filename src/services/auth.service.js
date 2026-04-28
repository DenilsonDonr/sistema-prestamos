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

module.exports = { login };
