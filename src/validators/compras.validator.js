'use strict';

const DATE_REGEX = /^\d{4}-\d{2}-\d{2}$/;

function validateDetalleItem(item, index) {
  const prefix = `detalle[${index}]`;

  if (!item || typeof item !== 'object') {
    const err = new Error(`${prefix}: debe ser un objeto`);
    err.statusCode = 400; err.code = 'VALIDATION_ERROR'; throw err;
  }

  const { herramienta_id, cantidad, precio_unitario } = item;

  if (!Number.isInteger(herramienta_id) || herramienta_id <= 0) {
    const err = new Error(`${prefix}.herramienta_id: debe ser un entero positivo`);
    err.statusCode = 400; err.code = 'VALIDATION_ERROR'; throw err;
  }

  if (!Number.isInteger(cantidad) || cantidad <= 0) {
    const err = new Error(`${prefix}.cantidad: debe ser un entero mayor a 0`);
    err.statusCode = 400; err.code = 'VALIDATION_ERROR'; throw err;
  }

  if (typeof precio_unitario !== 'number' || precio_unitario <= 0) {
    const err = new Error(`${prefix}.precio_unitario: debe ser un número mayor a 0`);
    err.statusCode = 400; err.code = 'VALIDATION_ERROR'; throw err;
  }

  return { herramienta_id, cantidad, precio_unitario };
}

function validateCreate(body) {
  const { proveedor_id, numero_documento, fecha_compra, observaciones, detalle } = body ?? {};

  if (!Number.isInteger(proveedor_id) || proveedor_id <= 0) {
    const err = new Error('El campo proveedor_id debe ser un entero positivo');
    err.statusCode = 400; err.code = 'VALIDATION_ERROR'; throw err;
  }

  if (!fecha_compra || !DATE_REGEX.test(fecha_compra) || isNaN(Date.parse(fecha_compra))) {
    const err = new Error('El campo fecha_compra es requerido y debe tener formato YYYY-MM-DD');
    err.statusCode = 400; err.code = 'VALIDATION_ERROR'; throw err;
  }

  if (!Array.isArray(detalle) || detalle.length === 0) {
    const err = new Error('El campo detalle debe ser un arreglo con al menos un ítem');
    err.statusCode = 400; err.code = 'VALIDATION_ERROR'; throw err;
  }

  const herramientaIds = new Set();
  const detalleValidado = detalle.map((item, i) => {
    const d = validateDetalleItem(item, i);
    if (herramientaIds.has(d.herramienta_id)) {
      const err = new Error(`detalle: herramienta_id ${d.herramienta_id} aparece duplicado`);
      err.statusCode = 400; err.code = 'VALIDATION_ERROR'; throw err;
    }
    herramientaIds.add(d.herramienta_id);
    return d;
  });

  const result = {
    proveedor_id,
    fecha_compra,
    detalle: detalleValidado,
  };

  if (numero_documento !== undefined) {
    if (typeof numero_documento !== 'string' || numero_documento.trim().length > 50) {
      const err = new Error('El campo numero_documento no puede superar los 50 caracteres');
      err.statusCode = 400; err.code = 'VALIDATION_ERROR'; throw err;
    }
    result.numero_documento = numero_documento.trim();
  }

  if (observaciones !== undefined) {
    if (typeof observaciones !== 'string') {
      const err = new Error('El campo observaciones debe ser texto');
      err.statusCode = 400; err.code = 'VALIDATION_ERROR'; throw err;
    }
    result.observaciones = observaciones.trim();
  }

  return result;
}

module.exports = { validateCreate };
