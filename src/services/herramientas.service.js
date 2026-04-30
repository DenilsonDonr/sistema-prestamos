'use strict';

const db = require('../config/db');

const SELECT = `
  SELECT h.id, h.codigo, h.nombre, h.descripcion, h.stock_minimo, h.activo,
         h.created_at, h.updated_at,
         t.id AS tipo_id,       t.nombre AS tipo_nombre,
         m.id AS marca_id,      m.nombre AS marca_nombre,
         mo.id AS modelo_id,    mo.nombre AS modelo_nombre,
         u.id AS ubicacion_id,  u.nombre AS ubicacion_nombre
  FROM herramientas h
  JOIN tipos_herramienta t  ON h.tipo_id      = t.id
  JOIN marcas m             ON h.marca_id     = m.id
  JOIN modelos mo           ON h.modelo_id    = mo.id
  JOIN ubicaciones u        ON h.ubicacion_id = u.id
`;

async function calcularStock(herramientaId) {
  const [rows] = await db.query(`
    SELECT COUNT(*) AS disponible
    FROM unidades_herramienta uh
    JOIN estados_herramienta e ON uh.estado_id = e.id
    WHERE uh.herramienta_id = ?
      AND e.nombre IN ('bueno', 'regular')
      AND uh.id NOT IN (
        SELECT unidad_herramienta_id FROM detalle_prestamos WHERE devuelto = false
      )
  `, [herramientaId]);
  return rows[0].disponible;
}

async function getAll() {
  const [rows] = await db.query(`${SELECT} ORDER BY h.nombre ASC`);
  return rows;
}

async function getById(id) {
  const [rows] = await db.query(`${SELECT} WHERE h.id = ?`, [id]);

  if (rows.length === 0) {
    const err = new Error('Herramienta no encontrada');
    err.statusCode = 404; err.code = 'NOT_FOUND'; throw err;
  }

  const stock_disponible = await calcularStock(id);
  return { ...rows[0], stock_disponible };
}

async function create(fields) {
  // Verificar FKs existen
  await verificarFKs(fields);

  // Verificar nombre único
  const [existing] = await db.query(
    'SELECT id FROM herramientas WHERE nombre = ?',
    [fields.nombre]
  );
  if (existing.length > 0) {
    const err = new Error(`Ya existe una herramienta con el nombre "${fields.nombre}"`);
    err.statusCode = 409; err.code = 'DUPLICATE_ENTRY'; throw err;
  }

  const { nombre, descripcion, tipo_id, marca_id, modelo_id, ubicacion_id, stock_minimo } = fields;

  const [result] = await db.query(
    `INSERT INTO herramientas (codigo, nombre, descripcion, tipo_id, marca_id, modelo_id, ubicacion_id, stock_minimo)
     VALUES ('TEMP', ?, ?, ?, ?, ?, ?, ?)`,
    [nombre, descripcion ?? null, tipo_id, marca_id, modelo_id, ubicacion_id, stock_minimo ?? 0]
  );

  const id = result.insertId;
  const codigo = `H-${String(id).padStart(3, '0')}`;
  await db.query('UPDATE herramientas SET codigo = ? WHERE id = ?', [codigo, id]);

  return getById(id);
}

async function update(id, fields, usuarioModificaId) {
  await getById(id);

  if (fields.nombre !== undefined) {
    const [existing] = await db.query(
      'SELECT id FROM herramientas WHERE nombre = ? AND id != ?',
      [fields.nombre, id]
    );
    if (existing.length > 0) {
      const err = new Error(`Ya existe una herramienta con el nombre "${fields.nombre}"`);
      err.statusCode = 409; err.code = 'DUPLICATE_ENTRY'; throw err;
    }
  }

  await verificarFKs(fields);

  const setClauses = [];
  const values = [];

  for (const [key, val] of Object.entries(fields)) {
    setClauses.push(`${key} = ?`);
    values.push(val);
  }

  setClauses.push('usuario_modifica_id = ?', 'updated_at = NOW()');
  values.push(usuarioModificaId, id);

  await db.query(
    `UPDATE herramientas SET ${setClauses.join(', ')} WHERE id = ?`,
    values
  );

  return getById(id);
}

async function remove(id, usuarioModificaId) {
  await getById(id);

  await db.query(
    'UPDATE herramientas SET activo = false, usuario_modifica_id = ?, updated_at = NOW() WHERE id = ?',
    [usuarioModificaId, id]
  );
}

// Verifica que los IDs de FK enviados existan en sus tablas
async function verificarFKs(fields) {
  const checks = [
    { campo: 'tipo_id',      tabla: 'tipos_herramienta' },
    { campo: 'marca_id',     tabla: 'marcas' },
    { campo: 'modelo_id',    tabla: 'modelos' },
    { campo: 'ubicacion_id', tabla: 'ubicaciones' },
  ];

  for (const { campo, tabla } of checks) {
    if (fields[campo] === undefined) continue;

    const [rows] = await db.query(
      `SELECT id FROM ${tabla} WHERE id = ? AND activo = true`,
      [fields[campo]]
    );
    if (rows.length === 0) {
      const err = new Error(`${campo} ${fields[campo]} no existe o está inactivo`);
      err.statusCode = 404; err.code = 'NOT_FOUND'; throw err;
    }
  }
}

module.exports = { getAll, getById, create, update, remove };
