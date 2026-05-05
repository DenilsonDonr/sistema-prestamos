'use strict';

require('dotenv').config();
const mysql = require('mysql2/promise');

const REQUIRED_ENV = ['DB_HOST', 'DB_PORT', 'DB_USER', 'DB_NAME'];
const missing = REQUIRED_ENV.filter((k) => !process.env[k]);
if (missing.length) {
  console.error(`[seed-catalogos] Variables de entorno faltantes: ${missing.join(', ')}`);
  process.exit(1);
}

// ─── Datos del catálogo ──────────────────────────────────────────────────────

const TIPOS_HERRAMIENTA = [
  { nombre: 'manual'    },
  { nombre: 'eléctrica' },
  { nombre: 'neumática' },
  { nombre: 'hidráulica'},
  { nombre: 'medición'  },
];

const UBICACIONES = [
  { nombre: 'Estante A-1', descripcion: 'Pasillo A, nivel 1 — herramientas manuales' },
  { nombre: 'Estante A-2', descripcion: 'Pasillo A, nivel 2 — herramientas manuales' },
  { nombre: 'Estante B-1', descripcion: 'Pasillo B, nivel 1 — herramientas eléctricas' },
  { nombre: 'Estante B-2', descripcion: 'Pasillo B, nivel 2 — herramientas eléctricas' },
  { nombre: 'Gabinete 1',  descripcion: 'Gabinete con llave — herramientas de medición' },
  { nombre: 'Gabinete 2',  descripcion: 'Gabinete con llave — herramientas neumáticas' },
  { nombre: 'Zona Norte',  descripcion: 'Área norte del almacén — equipos de gran tamaño' },
  { nombre: 'Bodega principal', descripcion: 'Bodega central — stock de reserva' },
];

const MARCAS = [
  'Bosch',
  'Stanley',
  'DeWalt',
  'Makita',
  'Truper',
  'Black+Decker',
  'Hilti',
  'Milwaukee',
];

// Modelos por marca. La clave debe coincidir exactamente con el nombre en MARCAS.
const MODELOS_POR_MARCA = {
  Bosch: [
    'GSB 550',
    'GBH 2-28',
    'GSS 18V-10',
    'GWS 7-115',
    'GCO 2000',
    'GLL 3-80',
  ],
  Stanley: [
    'FATMAX 1-51-118',
    'STHT33106',
    'FatMax Xtreme',
    'ST-300A',
  ],
  DeWalt: [
    'DCD771C2',
    'DWE7491RS',
    'DCF885C2',
    'DCS391B',
    'DCH273B',
  ],
  Makita: [
    'HP1631',
    'BO4556',
    'GA4030',
    'HR2470',
    'DDF484Z',
  ],
  Truper: [
    'TRU-DR-3/8',
    'TRU-ESM-7',
    'TRU-TAL-10',
    'DISM-7P',
  ],
  'Black+Decker': [
    'BDCHD12C1',
    'BDECS300C',
    'BEH200',
    'KS701EK',
  ],
  Hilti: [
    'TE 6-A36',
    'SF 6H-A22',
    'SFC 22-A',
    'DD 150-U',
  ],
  Milwaukee: [
    'M18 FUEL 2804-20',
    '2697-22',
    'M12 2407-20',
    '2730-20',
  ],
};

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

    // 1. Tipos de herramienta
    for (const tipo of TIPOS_HERRAMIENTA) {
      await conn.query(
        'INSERT IGNORE INTO tipos_herramienta (nombre) VALUES (?)',
        [tipo.nombre],
      );
    }
    console.log(`[seed-catalogos] tipos_herramienta: ${TIPOS_HERRAMIENTA.length} procesados`);

    // 2. Ubicaciones
    for (const ub of UBICACIONES) {
      await conn.query(
        'INSERT IGNORE INTO ubicaciones (nombre, descripcion) VALUES (?, ?)',
        [ub.nombre, ub.descripcion],
      );
    }
    console.log(`[seed-catalogos] ubicaciones: ${UBICACIONES.length} procesadas`);

    // 3. Marcas
    for (const nombre of MARCAS) {
      await conn.query(
        'INSERT IGNORE INTO marcas (nombre) VALUES (?)',
        [nombre],
      );
    }
    console.log(`[seed-catalogos] marcas: ${MARCAS.length} procesadas`);

    // 4. Leer IDs de marcas (las recién insertadas + las que ya existían)
    const [marcaRows] = await conn.query(
      'SELECT id, nombre FROM marcas WHERE nombre IN (?)',
      [MARCAS],
    );
    const marcaMap = Object.fromEntries(marcaRows.map((m) => [m.nombre, m.id]));

    // Validar que todas las marcas del catálogo están en la BD
    for (const nombre of MARCAS) {
      if (!marcaMap[nombre]) {
        throw new Error(`Marca no encontrada en BD tras INSERT: "${nombre}"`);
      }
    }

    // 5. Modelos (requieren marca_id)
    let totalModelos = 0;
    for (const [marcaNombre, modelos] of Object.entries(MODELOS_POR_MARCA)) {
      const marcaId = marcaMap[marcaNombre];
      if (!marcaId) {
        throw new Error(`Marca "${marcaNombre}" no está en MARCAS — verifica la clave en MODELOS_POR_MARCA`);
      }
      for (const nombreModelo of modelos) {
        await conn.query(
          'INSERT IGNORE INTO modelos (marca_id, nombre) VALUES (?, ?)',
          [marcaId, nombreModelo],
        );
        totalModelos++;
      }
    }
    console.log(`[seed-catalogos] modelos: ${totalModelos} procesados`);

    await conn.commit();
    console.log('[seed-catalogos] Seed completado correctamente.');
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
    console.error('[seed-catalogos] Error — se hizo rollback:', err.message);
    process.exit(1);
  });
}
