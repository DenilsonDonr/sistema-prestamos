'use strict';

const HORA_REGEX = /^([01]\d|2[0-3]):[0-5]\d$/;

function _validarHora(valor, campo) {
  if (typeof valor !== 'string' || !HORA_REGEX.test(valor)) {
    const err = new Error(`El campo ${campo} debe tener formato HH:MM`);
    err.statusCode = 400;
    err.code = 'VALIDATION_ERROR';
    throw err;
  }
}

/**
 * Valida el body para crear un turno.
 * @param {object} body - req.body
 * @returns {{ nombre: string, hora_inicio?: string, hora_fin?: string }}
 */
function validateCreate(body) {
  const { nombre, hora_inicio, hora_fin } = body ?? {};

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

  const result = { nombre: nombre.trim() };

  if (hora_inicio !== undefined) {
    _validarHora(hora_inicio, 'hora_inicio');
    result.hora_inicio = hora_inicio;
  }

  if (hora_fin !== undefined) {
    _validarHora(hora_fin, 'hora_fin');
    result.hora_fin = hora_fin;
  }

  return result;
}

/**
 * Valida el body para actualizar un turno.
 * Todos los campos son opcionales, pero debe enviarse al menos uno.
 * @param {object} body - req.body
 * @returns {{ nombre?: string, hora_inicio?: string, hora_fin?: string, activo?: boolean }}
 */
function validateUpdate(body) {
  const { nombre, hora_inicio, hora_fin, activo } = body ?? {};
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

  if (hora_inicio !== undefined) {
    _validarHora(hora_inicio, 'hora_inicio');
    fields.hora_inicio = hora_inicio;
  }

  if (hora_fin !== undefined) {
    _validarHora(hora_fin, 'hora_fin');
    fields.hora_fin = hora_fin;
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
