'use strict';

/**
 * Valida el body para crear un tipo de herramienta.
 * @param {object} body - req.body
 * @returns {{ nombre: string }}
 */
function validateCreate(body) {
  const { nombre } = body ?? {};

  if (!nombre || typeof nombre !== 'string' || nombre.trim() === '') {
    const err = new Error('El campo nombre es requerido');
    err.statusCode = 400;
    err.code = 'VALIDATION_ERROR';
    throw err;
  }

  if (nombre.trim().length > 50) {
    const err = new Error('El campo nombre no puede superar los 50 caracteres');
    err.statusCode = 400;
    err.code = 'VALIDATION_ERROR';
    throw err;
  }

  return { nombre: nombre.trim() };
}

/**
 * Valida el body para actualizar un tipo de herramienta.
 * Todos los campos son opcionales, pero debe enviarse al menos uno.
 * @param {object} body - req.body
 * @returns {{ nombre?: string, activo?: boolean }}
 */
function validateUpdate(body) {
  const { nombre, activo } = body ?? {};
  const fields = {};

  if (nombre !== undefined) {
    if (typeof nombre !== 'string' || nombre.trim() === '') {
      const err = new Error('El campo nombre no puede estar vacío');
      err.statusCode = 400;
      err.code = 'VALIDATION_ERROR';
      throw err;
    }
    if (nombre.trim().length > 50) {
      const err = new Error('El campo nombre no puede superar los 50 caracteres');
      err.statusCode = 400;
      err.code = 'VALIDATION_ERROR';
      throw err;
    }
    fields.nombre = nombre.trim();
  }

  if (activo !== undefined) {
    if (typeof activo !== 'boolean') {
      const err = new Error('El campo activo debe ser booleano');
      err.statusCode = 400;
      err.code = 'VALIDATION_ERROR';
      throw err;
    }
    fields.activo = activo;
  }

  if (Object.keys(fields).length === 0) {
    const err = new Error('Debe enviar al menos un campo para actualizar');
    err.statusCode = 400;
    err.code = 'VALIDATION_ERROR';
    throw err;
  }

  return fields;
}

module.exports = { validateCreate, validateUpdate };
