'use strict';

function validateUpdate(body) {
  const { estado_id, observaciones, numero_serie } = body ?? {};
  const fields = {};

  if (estado_id !== undefined) {
    if (!Number.isInteger(estado_id) || estado_id <= 0) {
      const err = new Error('El campo estado_id debe ser un entero positivo');
      err.statusCode = 400; err.code = 'VALIDATION_ERROR'; throw err;
    }
    fields.estado_id = estado_id;
  }

  if (observaciones !== undefined) {
    if (typeof observaciones !== 'string') {
      const err = new Error('El campo observaciones debe ser texto');
      err.statusCode = 400; err.code = 'VALIDATION_ERROR'; throw err;
    }
    fields.observaciones = observaciones.trim();
  }

  if (numero_serie !== undefined) {
    if (typeof numero_serie !== 'string' || numero_serie.trim() === '') {
      const err = new Error('El campo numero_serie no puede estar vacío');
      err.statusCode = 400; err.code = 'VALIDATION_ERROR'; throw err;
    }
    if (numero_serie.trim().length > 50) {
      const err = new Error('El campo numero_serie no puede superar los 50 caracteres');
      err.statusCode = 400; err.code = 'VALIDATION_ERROR'; throw err;
    }
    fields.numero_serie = numero_serie.trim();
  }

  if (Object.keys(fields).length === 0) {
    const err = new Error('Debe enviar al menos un campo para actualizar');
    err.statusCode = 400; err.code = 'VALIDATION_ERROR'; throw err;
  }

  return fields;
}

module.exports = { validateUpdate };
