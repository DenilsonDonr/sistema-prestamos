'use strict';

function validateCreate(body) {
  const { nombre, descripcion, tipo_id, marca_id, modelo_id, ubicacion_id, stock_minimo } = body ?? {};

  if (!nombre || typeof nombre !== 'string' || nombre.trim() === '') {
    const err = new Error('El campo nombre es requerido');
    err.statusCode = 400; err.code = 'VALIDATION_ERROR'; throw err;
  }
  if (nombre.trim().length > 150) {
    const err = new Error('El campo nombre no puede superar los 150 caracteres');
    err.statusCode = 400; err.code = 'VALIDATION_ERROR'; throw err;
  }

  for (const [campo, valor] of [['tipo_id', tipo_id], ['marca_id', marca_id], ['modelo_id', modelo_id], ['ubicacion_id', ubicacion_id]]) {
    if (!Number.isInteger(valor) || valor <= 0) {
      const err = new Error(`El campo ${campo} es requerido y debe ser un entero positivo`);
      err.statusCode = 400; err.code = 'VALIDATION_ERROR'; throw err;
    }
  }

  const result = {
    nombre: nombre.trim(),
    tipo_id,
    marca_id,
    modelo_id,
    ubicacion_id,
  };

  if (descripcion !== undefined) {
    if (typeof descripcion !== 'string') {
      const err = new Error('El campo descripcion debe ser texto');
      err.statusCode = 400; err.code = 'VALIDATION_ERROR'; throw err;
    }
    result.descripcion = descripcion.trim();
  }

  if (stock_minimo !== undefined) {
    if (!Number.isInteger(stock_minimo) || stock_minimo < 0) {
      const err = new Error('El campo stock_minimo debe ser un entero mayor o igual a 0');
      err.statusCode = 400; err.code = 'VALIDATION_ERROR'; throw err;
    }
    result.stock_minimo = stock_minimo;
  }

  return result;
}

function validateUpdate(body) {
  const { nombre, descripcion, tipo_id, marca_id, modelo_id, ubicacion_id, stock_minimo, activo } = body ?? {};
  const fields = {};

  if (nombre !== undefined) {
    if (typeof nombre !== 'string' || nombre.trim() === '') {
      const err = new Error('El campo nombre no puede estar vacío');
      err.statusCode = 400; err.code = 'VALIDATION_ERROR'; throw err;
    }
    if (nombre.trim().length > 150) {
      const err = new Error('El campo nombre no puede superar los 150 caracteres');
      err.statusCode = 400; err.code = 'VALIDATION_ERROR'; throw err;
    }
    fields.nombre = nombre.trim();
  }

  for (const [campo, valor] of [['tipo_id', tipo_id], ['marca_id', marca_id], ['modelo_id', modelo_id], ['ubicacion_id', ubicacion_id]]) {
    if (valor !== undefined) {
      if (!Number.isInteger(valor) || valor <= 0) {
        const err = new Error(`El campo ${campo} debe ser un entero positivo`);
        err.statusCode = 400; err.code = 'VALIDATION_ERROR'; throw err;
      }
      fields[campo] = valor;
    }
  }

  if (descripcion !== undefined) {
    if (typeof descripcion !== 'string') {
      const err = new Error('El campo descripcion debe ser texto');
      err.statusCode = 400; err.code = 'VALIDATION_ERROR'; throw err;
    }
    fields.descripcion = descripcion.trim();
  }

  if (stock_minimo !== undefined) {
    if (!Number.isInteger(stock_minimo) || stock_minimo < 0) {
      const err = new Error('El campo stock_minimo debe ser un entero mayor o igual a 0');
      err.statusCode = 400; err.code = 'VALIDATION_ERROR'; throw err;
    }
    fields.stock_minimo = stock_minimo;
  }

  if (activo !== undefined) {
    if (typeof activo !== 'boolean') {
      const err = new Error('El campo activo debe ser booleano');
      err.statusCode = 400; err.code = 'VALIDATION_ERROR'; throw err;
    }
    fields.activo = activo;
  }

  if (Object.keys(fields).length === 0) {
    const err = new Error('Debe enviar al menos un campo para actualizar');
    err.statusCode = 400; err.code = 'VALIDATION_ERROR'; throw err;
  }

  return fields;
}

module.exports = { validateCreate, validateUpdate };
