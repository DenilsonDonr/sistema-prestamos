'use strict';

/**
 * Valida el body para crear un estado de herramienta.
 * @param {object} body - req.body
 * @returns {{ nombre: string, descripcion?: string, color?: string }}
 */
function validateCreate(body) {
  const { nombre, descripcion, color } = body ?? {};

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

  if (descripcion !== undefined) {
    if (typeof descripcion !== 'string') {
      const err = new Error('El campo descripcion debe ser texto');
      err.statusCode = 400;
      err.code = 'VALIDATION_ERROR';
      throw err;
    }
    if (descripcion.trim().length > 255) {
      const err = new Error('El campo descripcion no puede superar los 255 caracteres');
      err.statusCode = 400;
      err.code = 'VALIDATION_ERROR';
      throw err;
    }
    result.descripcion = descripcion.trim();
  }

  if (color !== undefined) {
    if (typeof color !== 'string' || color.trim() === '') {
      const err = new Error('El campo color no puede estar vacío');
      err.statusCode = 400;
      err.code = 'VALIDATION_ERROR';
      throw err;
    }
    if (color.trim().length > 20) {
      const err = new Error('El campo color no puede superar los 20 caracteres');
      err.statusCode = 400;
      err.code = 'VALIDATION_ERROR';
      throw err;
    }
    result.color = color.trim();
  }

  return result;
}

/**
 * Valida el body para actualizar un estado de herramienta.
 * Todos los campos son opcionales, pero debe enviarse al menos uno.
 * @param {object} body - req.body
 * @returns {{ nombre?: string, descripcion?: string, color?: string, activo?: boolean }}
 */
function validateUpdate(body) {
  const { nombre, descripcion, color, activo } = body ?? {};
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

  if (descripcion !== undefined) {
    if (typeof descripcion !== 'string') {
      const err = new Error('El campo descripcion debe ser texto');
      err.statusCode = 400;
      err.code = 'VALIDATION_ERROR';
      throw err;
    }
    if (descripcion.trim().length > 255) {
      const err = new Error('El campo descripcion no puede superar los 255 caracteres');
      err.statusCode = 400;
      err.code = 'VALIDATION_ERROR';
      throw err;
    }
    fields.descripcion = descripcion.trim();
  }

  if (color !== undefined) {
    if (typeof color !== 'string' || color.trim() === '') {
      const err = new Error('El campo color no puede estar vacío');
      err.statusCode = 400;
      err.code = 'VALIDATION_ERROR';
      throw err;
    }
    if (color.trim().length > 20) {
      const err = new Error('El campo color no puede superar los 20 caracteres');
      err.statusCode = 400;
      err.code = 'VALIDATION_ERROR';
      throw err;
    }
    fields.color = color.trim();
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
