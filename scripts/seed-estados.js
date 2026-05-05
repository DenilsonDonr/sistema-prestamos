'use strict';

require('dotenv').config();
const mysql = require('mysql2/promise');

const REQUIRED_ENV = ['DB_HOST', 'DB_PORT', 'DB_USER', 'DB_NAME'];
const missing = REQUIRED_ENV.filter((k) => !process.env[k]);
if (missing.length) {
  console.error(`[seed-estados] Variables de entorno faltantes: ${missing.join(', ')}`);
  process.exit(1);
}

// ─── Datos ───────────────────────────────────────────────────────────────────

// Estados completos de la unidad (incluyendo prestado y baja)
const ESTADOS_HERRAMIENTA = [
  { nombre: 'bueno', color: '#16a34a' }, // verde
  { nombre: 'regular', color: '#d97706' }, // naranja
  { nombre: 'malo', color: '#dc2626' }, // rojo
  { nombre: 'prestado', color: '#2563eb' }, // azul
  { nombre: 'baja', color: '#6b7280' }, // gris
];

const MOTIVOS_BAJA = [
  { nombre: 'Rotura', descripcion: 'La unidad sufrió rotura irreparable durante el uso' },
  { nombre: 'Extravío', descripcion: 'La unidad no fue encontrada o fue reportada como perdida' },
  { nombre: 'Robo', descripcion: 'La unidad fue sustraída' },
  { nombre: 'Obsolescencia', descripcion: 'La unidad quedó obsoleta o fuera de servicio por antigüedad' },
  { nombre: 'Deterioro', descripcion: 'Desgaste severo que impide el uso seguro de la unidad' },
];

const TIPOS_ALERTA = [
  { nombre: 'devolucion_vencida', descripcion: 'Préstamo con fecha de retorno estimada superada' },
  { nombre: 'stock_bajo', descripcion: 'Stock disponible de una herramienta por debajo del mínimo' },
  { nombre: 'herramienta_danada', descripcion: 'Unidad devuelta con estado malo' },
  { nombre: 'prestamos_repetidos', descripcion: 'Usuario con múltiples préstamos vencidos sin devolver' },
];

// ─── Seed ────────────────────────────────────────────────────────────────────

async function seed() {
  const conn = await mysql.createConnection({
    host: process.env.DB_HOST,
    port: parseInt(process.env.DB_PORT, 10),
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME,
  });

  try {
    await conn.beginTransaction();

    for (const e of ESTADOS_HERRAMIENTA) {
      await conn.query(
        'INSERT IGNORE INTO estados_herramienta (nombre, color) VALUES (?, ?)',
        [e.nombre, e.color],
      );
    }
    console.log(`[seed-estados] estados_herramienta: ${ESTADOS_HERRAMIENTA.length} procesados`);

    for (const m of MOTIVOS_BAJA) {
      await conn.query(
        'INSERT IGNORE INTO motivos_baja (nombre, descripcion) VALUES (?, ?)',
        [m.nombre, m.descripcion],
      );
    }
    console.log(`[seed-estados] motivos_baja: ${MOTIVOS_BAJA.length} procesados`);

    for (const t of TIPOS_ALERTA) {
      await conn.query(
        'INSERT IGNORE INTO tipos_alerta (nombre, descripcion) VALUES (?, ?)',
        [t.nombre, t.descripcion],
      );
    }
    console.log(`[seed-estados] tipos_alerta: ${TIPOS_ALERTA.length} procesados`);

    await conn.commit();
    console.log('[seed-estados] Seed completado correctamente.');
  } catch (err) {
    await conn.rollback();
    throw err;
  } finally {
    await conn.end();
  }
}

module.exports = seed;

if (require.main === module) {
  seed().catch((err) => {
    console.error('[seed-estados] Error — se hizo rollback:', err.message);
    process.exit(1);
  });
}