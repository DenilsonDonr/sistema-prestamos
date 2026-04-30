'use strict';

const RUC_REGEX = /^\d{11}$/;
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function validateCreate(body) {
  const { razon_social, ruc, nombre_comercial, direccion, telefono, email, contacto } = body ?? {};

  if (!razon_social || typeof razon_social !== 'string' || razon_social.trim() === '') {
    const err = new Error('El campo razon_social es requerido');
    err.statusCode = 400; err.code = 'VALIDATION_ERROR'; throw err;
  }
  if (razon_social.trim().length > 150) {
    const err = new Error('El campo razon_social no puede superar los 150 caracteres');
    err.statusCode = 400; err.code = 'VALIDATION_ERROR'; throw err;
  }

  const result = { razon_social: razon_social.trim() };

  if (ruc !== undefined) {
    if (typeof ruc !== 'string' || !RUC_REGEX.test(ruc.trim())) {
      const err = new Error('El RUC debe tener exactamente 11 dígitos');
      err.statusCode = 400; err.code = 'VALIDATION_ERROR'; throw err;
    }
    result.ruc = ruc.trim();
  }

  if (nombre_comercial !== undefined) {
    if (typeof nombre_comercial !== 'string' || nombre_comercial.trim().length > 150) {
      const err = new Error('El campo nombre_comercial no puede superar los 150 caracteres');
      err.statusCode = 400; err.code = 'VALIDATION_ERROR'; throw err;
    }
    result.nombre_comercial = nombre_comercial.trim();
  }

  if (direccion !== undefined) {
    if (typeof direccion !== 'string' || direccion.trim().length > 255) {
      const err = new Error('El campo direccion no puede superar los 255 caracteres');
      err.statusCode = 400; err.code = 'VALIDATION_ERROR'; throw err;
    }
    result.direccion = direccion.trim();
  }

  if (telefono !== undefined) {
    if (typeof telefono !== 'string' || telefono.trim().length > 20) {
      const err = new Error('El campo telefono no puede superar los 20 caracteres');
      err.statusCode = 400; err.code = 'VALIDATION_ERROR'; throw err;
    }
    result.telefono = telefono.trim();
  }

  if (email !== undefined) {
    if (typeof email !== 'string' || !EMAIL_REGEX.test(email.trim())) {
      const err = new Error('El campo email no tiene un formato válido');
      err.statusCode = 400; err.code = 'VALIDATION_ERROR'; throw err;
    }
    if (email.trim().length > 100) {
      const err = new Error('El campo email no puede superar los 100 caracteres');
      err.statusCode = 400; err.code = 'VALIDATION_ERROR'; throw err;
    }
    result.email = email.trim().toLowerCase();
  }

  if (contacto !== undefined) {
    if (typeof contacto !== 'string' || contacto.trim().length > 100) {
      const err = new Error('El campo contacto no puede superar los 100 caracteres');
      err.statusCode = 400; err.code = 'VALIDATION_ERROR'; throw err;
    }
    result.contacto = contacto.trim();
  }

  return result;
}

function validateUpdate(body) {
  const { razon_social, ruc, nombre_comercial, direccion, telefono, email, contacto, activo } = body ?? {};
  const fields = {};

  if (razon_social !== undefined) {
    if (typeof razon_social !== 'string' || razon_social.trim() === '') {
      const err = new Error('El campo razon_social no puede estar vacío');
      err.statusCode = 400; err.code = 'VALIDATION_ERROR'; throw err;
    }
    if (razon_social.trim().length > 150) {
      const err = new Error('El campo razon_social no puede superar los 150 caracteres');
      err.statusCode = 400; err.code = 'VALIDATION_ERROR'; throw err;
    }
    fields.razon_social = razon_social.trim();
  }

  if (ruc !== undefined) {
    if (typeof ruc !== 'string' || !RUC_REGEX.test(ruc.trim())) {
      const err = new Error('El RUC debe tener exactamente 11 dígitos');
      err.statusCode = 400; err.code = 'VALIDATION_ERROR'; throw err;
    }
    fields.ruc = ruc.trim();
  }

  if (nombre_comercial !== undefined) {
    if (typeof nombre_comercial !== 'string' || nombre_comercial.trim().length > 150) {
      const err = new Error('El campo nombre_comercial no puede superar los 150 caracteres');
      err.statusCode = 400; err.code = 'VALIDATION_ERROR'; throw err;
    }
    fields.nombre_comercial = nombre_comercial.trim();
  }

  if (direccion !== undefined) {
    if (typeof direccion !== 'string' || direccion.trim().length > 255) {
      const err = new Error('El campo direccion no puede superar los 255 caracteres');
      err.statusCode = 400; err.code = 'VALIDATION_ERROR'; throw err;
    }
    fields.direccion = direccion.trim();
  }

  if (telefono !== undefined) {
    if (typeof telefono !== 'string' || telefono.trim().length > 20) {
      const err = new Error('El campo telefono no puede superar los 20 caracteres');
      err.statusCode = 400; err.code = 'VALIDATION_ERROR'; throw err;
    }
    fields.telefono = telefono.trim();
  }

  if (email !== undefined) {
    if (typeof email !== 'string' || !EMAIL_REGEX.test(email.trim())) {
      const err = new Error('El campo email no tiene un formato válido');
      err.statusCode = 400; err.code = 'VALIDATION_ERROR'; throw err;
    }
    if (email.trim().length > 100) {
      const err = new Error('El campo email no puede superar los 100 caracteres');
      err.statusCode = 400; err.code = 'VALIDATION_ERROR'; throw err;
    }
    fields.email = email.trim().toLowerCase();
  }

  if (contacto !== undefined) {
    if (typeof contacto !== 'string' || contacto.trim().length > 100) {
      const err = new Error('El campo contacto no puede superar los 100 caracteres');
      err.statusCode = 400; err.code = 'VALIDATION_ERROR'; throw err;
    }
    fields.contacto = contacto.trim();
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
