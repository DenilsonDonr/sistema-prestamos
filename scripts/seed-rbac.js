'use strict';

require('dotenv').config();
const mysql = require('mysql2/promise');

const REQUIRED_ENV = ['DB_HOST', 'DB_PORT', 'DB_USER', 'DB_NAME'];
const missing = REQUIRED_ENV.filter((k) => !process.env[k]);
if (missing.length) {
  console.error(`[seed-rbac] Variables de entorno faltantes: ${missing.join(', ')}`);
  process.exit(1);
}

// ─── Datos del catálogo ──────────────────────────────────────────────────────

const ROLES = [
  { nombre: 'administrador', descripcion: 'Gestiona inventario, usuarios, compras y reportes' },
  { nombre: 'encargado_almacen', descripcion: 'Registra préstamos, devoluciones y supervisa el almacén' },
  { nombre: 'trabajador', descripcion: 'Consulta herramientas y solicita préstamos' },
];

const PERMISOS = [
  { codigo: 'usuario.ver', nombre: 'Ver usuarios', modulo: 'usuarios', descripcion: 'Consultar la lista de usuarios del sistema' },
  { codigo: 'usuario.crear', nombre: 'Crear usuarios', modulo: 'usuarios', descripcion: 'Registrar nuevos usuarios en el sistema' },
  { codigo: 'usuario.editar', nombre: 'Editar usuarios', modulo: 'usuarios', descripcion: 'Modificar datos de usuarios existentes' },
  { codigo: 'usuario.eliminar', nombre: 'Eliminar usuarios', modulo: 'usuarios', descripcion: 'Desactivar usuarios del sistema' },
  { codigo: 'catalogo.ver', nombre: 'Ver catálogos', modulo: 'catalogos', descripcion: 'Consultar catálogos del sistema (marcas, áreas, estados, etc.)' },
  { codigo: 'catalogo.gestionar', nombre: 'Gestionar catálogos', modulo: 'catalogos', descripcion: 'Crear y editar entradas de catálogos' },
  { codigo: 'herramienta.ver', nombre: 'Ver herramientas', modulo: 'herramientas', descripcion: 'Consultar el catálogo maestro de herramientas' },
  { codigo: 'herramienta.crear', nombre: 'Crear herramientas', modulo: 'herramientas', descripcion: 'Registrar nuevas herramientas en el inventario' },
  { codigo: 'herramienta.editar', nombre: 'Editar herramientas', modulo: 'herramientas', descripcion: 'Modificar datos de herramientas existentes' },
  { codigo: 'unidad.ver', nombre: 'Ver unidades', modulo: 'unidades', descripcion: 'Consultar unidades físicas de herramientas' },
  { codigo: 'compra.ver', nombre: 'Ver compras', modulo: 'compras', descripcion: 'Consultar el historial de compras a proveedores' },
  { codigo: 'compra.registrar', nombre: 'Registrar compras', modulo: 'compras', descripcion: 'Registrar nuevas compras a proveedores' },
  { codigo: 'prestamo.ver', nombre: 'Ver préstamos', modulo: 'prestamos', descripcion: 'Consultar préstamos activos e históricos' },
  { codigo: 'prestamo.registrar', nombre: 'Registrar préstamos', modulo: 'prestamos', descripcion: 'Registrar la salida de herramientas en préstamo' },
  { codigo: 'devolucion.ver', nombre: 'Ver devoluciones', modulo: 'devoluciones', descripcion: 'Consultar devoluciones registradas' },
  { codigo: 'devolucion.registrar', nombre: 'Registrar devoluciones', modulo: 'devoluciones', descripcion: 'Registrar la devolución de herramientas al almacén' },
  { codigo: 'baja.ver', nombre: 'Ver bajas', modulo: 'bajas', descripcion: 'Consultar unidades dadas de baja' },
  { codigo: 'baja.registrar', nombre: 'Registrar bajas', modulo: 'bajas', descripcion: 'Dar de baja unidades de herramientas irrecuperables' },
  { codigo: 'alerta.ver', nombre: 'Ver alertas', modulo: 'alertas', descripcion: 'Consultar alertas generadas por el sistema' },
  { codigo: 'reporte.ver', nombre: 'Ver reportes', modulo: 'reportes', descripcion: 'Generar y consultar reportes del sistema' },
  { codigo: 'reporte.crear', nombre: 'Crear reportes', modulo: 'reportes', descripcion: 'Generar nuevos reportes del sistema' },
];

// Fuente de verdad: qué permisos tiene cada rol
const ROL_PERMISOS = {
  administrador: [
    'usuario.ver', 'usuario.crear', 'usuario.editar', 'usuario.eliminar',
    'catalogo.ver', 'catalogo.gestionar',
    'herramienta.ver', 'herramienta.crear', 'herramienta.editar',
    'unidad.ver',
    'compra.ver', 'compra.registrar',
    'prestamo.ver',
    'devolucion.ver',
    'baja.ver', 'baja.registrar',
    'alerta.ver',
    'reporte.ver', 'reporte.crear',
  ],
  encargado_almacen: [
    'catalogo.ver',
    'herramienta.ver',
    'unidad.ver',
    'prestamo.ver', 'prestamo.registrar',
    'devolucion.ver', 'devolucion.registrar',
    'baja.ver',
    'alerta.ver',
  ],
  trabajador: [
    'catalogo.ver',
    'herramienta.ver',
    'unidad.ver',
    'prestamo.ver',
    'devolucion.ver',
  ],
};

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

    // 1. Roles
    for (const rol of ROLES) {
      await conn.query(
        'INSERT IGNORE INTO roles (nombre, descripcion) VALUES (?, ?)',
        [rol.nombre, rol.descripcion],
      );
    }
    console.log(`[seed-rbac] Roles: ${ROLES.length} procesados`);

    // 2. Permisos
    for (const p of PERMISOS) {
      await conn.query(
        'INSERT IGNORE INTO permisos (codigo, nombre, modulo, descripcion) VALUES (?, ?, ?, ?)',
        [p.codigo, p.nombre, p.modulo, p.descripcion],
      );
    }
    console.log(`[seed-rbac] Permisos: ${PERMISOS.length} procesados`);

    // 3. Leer IDs insertados/existentes
    const [rolesRows] = await conn.query('SELECT id, nombre FROM roles WHERE nombre IN (?)', [
      ROLES.map((r) => r.nombre),
    ]);
    const rolMap = Object.fromEntries(rolesRows.map((r) => [r.nombre, r.id]));

    const [permisosRows] = await conn.query('SELECT id, codigo FROM permisos WHERE codigo IN (?)', [
      PERMISOS.map((p) => p.codigo),
    ]);
    const permisoMap = Object.fromEntries(permisosRows.map((p) => [p.codigo, p.id]));

    // 4. Asignaciones rol_permiso
    let asignaciones = 0;
    for (const [rolNombre, codigos] of Object.entries(ROL_PERMISOS)) {
      const rolId = rolMap[rolNombre];
      if (!rolId) {
        throw new Error(`Rol no encontrado en BD: ${rolNombre}`);
      }
      for (const codigo of codigos) {
        const permisoId = permisoMap[codigo];
        if (!permisoId) {
          throw new Error(`Permiso no encontrado en BD: ${codigo}`);
        }
        await conn.query(
          'INSERT IGNORE INTO rol_permiso (rol_id, permiso_id) VALUES (?, ?)',
          [rolId, permisoId],
        );
        asignaciones++;
      }
    }
    console.log(`[seed-rbac] Asignaciones rol_permiso: ${asignaciones} procesadas`);

    await conn.commit();
    console.log('[seed-rbac] Seed completado correctamente.');
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
    console.error('[seed-rbac] Error — se hizo rollback:', err.message);
    process.exit(1);
  });
}
