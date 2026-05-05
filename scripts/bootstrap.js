'use strict';

const bcrypt = require('bcrypt');
const db = require('../src/config/db');

const seedRbac = require('./seed-rbac');
const seedEstados = require('./seed-estados');
const seedProveedores = require('./seed-proveedores');
const seedCatalogos = require('./seed-catalogos-herramientas');

async function isBootstrapped() {
  const [rows] = await db.query(
    `SELECT u.id FROM usuarios u
     JOIN roles r ON u.rol_id = r.id
     WHERE r.nombre = 'administrador'
     LIMIT 1`,
  );
  return rows.length > 0;
}

async function createAdminUser() {
  const username = process.env.ADMIN_USERNAME || 'admin';
  const password = process.env.ADMIN_PASSWORD || 'Admin1234!';
  const nombres  = process.env.ADMIN_NOMBRES   || 'Administrador';
  const apellidos = process.env.ADMIN_APELLIDOS || 'Sistema';
  const codigo   = process.env.ADMIN_CODIGO    || 'USR-001';

  const [existing] = await db.query(
    'SELECT id FROM usuarios WHERE username = ? OR codigo = ?',
    [username, codigo],
  );
  if (existing.length) {
    console.log('[bootstrap] Usuario administrador ya existe, omitiendo.');
    return;
  }

  const [rolRows] = await db.query(
    "SELECT id FROM roles WHERE nombre = 'administrador' LIMIT 1",
  );
  if (!rolRows.length) throw new Error('Rol administrador no encontrado tras seed-rbac');

  const hash = await bcrypt.hash(password, 10);

  await db.query(
    `INSERT INTO usuarios (rol_id, codigo, nombres, apellidos, username, password_hash)
     VALUES (?, ?, ?, ?, ?, ?)`,
    [rolRows[0].id, codigo, nombres, apellidos, username, hash],
  );

  console.log(`[bootstrap] Usuario administrador creado: ${username}`);
  console.log('[bootstrap] IMPORTANTE: cambia la contraseña por defecto tras el primer inicio de sesión.');
}

async function bootstrap() {
  if (await isBootstrapped()) {
    console.log('[bootstrap] Sistema ya inicializado.');
    return;
  }

  console.log('[bootstrap] Primera ejecución detectada. Iniciando setup...');

  await seedRbac();
  await seedEstados();
  await seedProveedores();
  await seedCatalogos();
  await createAdminUser();

  console.log('[bootstrap] Setup completado.');
}

module.exports = bootstrap;
