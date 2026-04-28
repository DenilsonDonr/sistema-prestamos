'use strict';

/**
 * Valida el body del request de login.
 * Lanza un error 400 si falta username o password.
 * @param {object} body - req.body del request entrante
 * @returns {{ username: string, password: string }}
 */
function validateLogin(body) {
  const { username, password } = body ?? {};

  if (!username || typeof username !== 'string' || username.trim() === '') {
    const err = new Error('El campo username es requerido');
    err.statusCode = 400;
    err.code = 'VALIDATION_ERROR';
    throw err;
  }

  if (!password || typeof password !== 'string' || password === '') {
    const err = new Error('El campo password es requerido');
    err.statusCode = 400;
    err.code = 'VALIDATION_ERROR';
    throw err;
  }

  // No se hace trim al password: un espacio intencional al inicio/fin es parte de la clave
  return { username: username.trim(), password };
}

module.exports = { validateLogin };
