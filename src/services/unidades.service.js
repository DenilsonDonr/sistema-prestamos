'use strict';

const db = require('../config/db');

const SELECT = `
  SELECT u.id, u.codigo_unidad, u.numero_serie, u.fecha_ingreso, u.observaciones,
         u.created_at, u.updated_at,
         h.id AS herramienta_id, h.codigo AS herramienta_codigo, h.nombre AS herramienta_nombre,
         e.id AS estado_id, e.nombre AS estado_nombre, e.color AS estado_color,
         c.id AS compra_id, c.codigo AS compra_codigo
  FROM unidades_herramienta u
  JOIN herramientas h         ON u.herramienta_id = h.id
  JOIN estados_herramienta e  ON u.estado_id = e.id
  LEFT JOIN compras c         ON u.compra_id = c.id
`;

async function getAll() {
  const [rows] = await db.query(`${SELECT} ORDER BY h.nombre ASC, u.codigo_unidad ASC`);
  return rows;
}

async function getById(id) {
  const [rows] = await db.query(`${SELECT} WHERE u.id = ?`, [id]);

  if (rows.length === 0) {
    const err = new Error('Unidad no encontrada');
    err.statusCode = 404; err.code = 'NOT_FOUND'; throw err;
  }

  return rows[0];
}

async function update(id, fields, usuarioModificaId) {
  await getById(id);

  if (fields.estado_id !== undefined) {
    const [estado] = await db.query(
      'SELECT id FROM estados_herramienta WHERE id = ?',
      [fields.estado_id]
    );
    if (estado.length === 0) {
      const err = new Error(`estado_id ${fields.estado_id} no existe`);
      err.statusCode = 404; err.code = 'NOT_FOUND'; throw err;
    }
  }

  if (fields.numero_serie !== undefined) {
    const [existing] = await db.query(
      'SELECT id FROM unidades_herramienta WHERE numero_serie = ? AND id != ?',
      [fields.numero_serie, id]
    );
    if (existing.length > 0) {
      const err = new Error(`Ya existe una unidad con el número de serie "${fields.numero_serie}"`);
      err.statusCode = 409; err.code = 'DUPLICATE_ENTRY'; throw err;
    }
  }

  const setClauses = [];
  const values = [];

  for (const [key, val] of Object.entries(fields)) {
    setClauses.push(`${key} = ?`);
    values.push(val);
  }

  setClauses.push('usuario_modifica_id = ?', 'updated_at = NOW()');
  values.push(usuarioModificaId, id);

  await db.query(
    `UPDATE unidades_herramienta SET ${setClauses.join(', ')} WHERE id = ?`,
    values
  );

  return getById(id);
}

module.exports = { getAll, getById, update };
