'use strict';

require('dotenv').config();
const mysql = require('mysql2/promise');

const REQUIRED_ENV = ['DB_HOST', 'DB_PORT', 'DB_USER', 'DB_NAME'];
const missing = REQUIRED_ENV.filter((k) => !process.env[k]);
if (missing.length) {
  console.error(`[seed-proveedores] Variables de entorno faltantes: ${missing.join(', ')}`);
  process.exit(1);
}

// ─── Datos ───────────────────────────────────────────────────────────────────

const PROVEEDORES = [
  {
    ruc:             '20100070970',
    razon_social:    'Bosch S.A.C.',
    nombre_comercial:'Bosch Perú',
    direccion:       'Av. Javier Prado Este 4200, San Isidro, Lima',
    telefono:        '01-6110000',
    email:           'ventas@bosch.com.pe',
    contacto:        'Carlos Mendoza',
  },
  {
    ruc:             '20512894724',
    razon_social:    'Stanley Black & Decker Perú S.R.L.',
    nombre_comercial:'Stanley Tools',
    direccion:       'Calle Los Nogales 265, San Isidro, Lima',
    telefono:        '01-4415500',
    email:           'comercial@stanleybd.pe',
    contacto:        'Ana Torres',
  },
  {
    ruc:             '20601234567',
    razon_social:    'Makita Distribuciones S.A.C.',
    nombre_comercial:'Makita Perú',
    direccion:       'Av. Argentina 2390, Cercado de Lima',
    telefono:        '01-3362200',
    email:           'ventas@makita.com.pe',
    contacto:        'Luis Quispe',
  },
  {
    ruc:             '20100017491',
    razon_social:    'Truper Herramientas S.A.C.',
    nombre_comercial:'Truper',
    direccion:       'Jr. Huallaga 520, Cercado de Lima',
    telefono:        '01-4280000',
    email:           'pedidos@truper.pe',
    contacto:        'Rosa Gutierrez',
  },
  {
    ruc:             '20507421218',
    razon_social:    'Ferretería Industrial Lima S.A.C.',
    nombre_comercial:'Ferreindus',
    direccion:       'Av. Colonial 789, Breña, Lima',
    telefono:        '01-3310050',
    email:           'ventas@ferreindus.pe',
    contacto:        'Marco Salinas',
  },
];

// ─── Seed ────────────────────────────────────────────────────────────────────

async function seed() {
  const conn = await mysql.createConnection({
    host:     process.env.DB_HOST,
    port:     parseInt(process.env.DB_PORT, 10),
    user:     process.env.DB_USER,
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME,
  });

  try {
    await conn.beginTransaction();

    for (const p of PROVEEDORES) {
      await conn.query(
        `INSERT IGNORE INTO proveedores
           (ruc, razon_social, nombre_comercial, direccion, telefono, email, contacto)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [p.ruc, p.razon_social, p.nombre_comercial, p.direccion, p.telefono, p.email, p.contacto],
      );
    }

    console.log(`[seed-proveedores] ${PROVEEDORES.length} proveedores procesados`);

    await conn.commit();
    console.log('[seed-proveedores] Seed completado correctamente.');
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
    console.error('[seed-proveedores] Error — se hizo rollback:', err.message);
    process.exit(1);
  });
}
