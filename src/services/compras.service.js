'use strict';

const db = require('../config/db');

async function getAll() {
  const [rows] = await db.query(`
    SELECT c.id, c.codigo, c.fecha_compra, c.subtotal, c.igv, c.total,
           c.numero_documento, c.observaciones, c.created_at,
           p.id AS proveedor_id, p.razon_social AS proveedor_razon_social
    FROM compras c
    JOIN proveedores p ON c.proveedor_id = p.id
    ORDER BY c.created_at DESC
  `);
  return rows;
}

async function getById(id) {
  const [compras] = await db.query(`
    SELECT c.id, c.codigo, c.fecha_compra, c.subtotal, c.igv, c.total,
           c.numero_documento, c.observaciones, c.created_at, c.updated_at,
           c.usuario_registra_id,
           p.id AS proveedor_id, p.razon_social AS proveedor_razon_social
    FROM compras c
    JOIN proveedores p ON c.proveedor_id = p.id
    WHERE c.id = ?
  `, [id]);

  if (compras.length === 0) {
    const err = new Error('Compra no encontrada');
    err.statusCode = 404; err.code = 'NOT_FOUND'; throw err;
  }

  const [detalle] = await db.query(`
    SELECT dc.id, dc.herramienta_id, h.nombre AS herramienta_nombre, h.codigo AS herramienta_codigo,
           dc.cantidad, dc.precio_unitario, dc.subtotal
    FROM detalle_compras dc
    JOIN herramientas h ON dc.herramienta_id = h.id
    WHERE dc.compra_id = ?
  `, [id]);

  return { ...compras[0], detalle };
}

async function create(fields, usuarioRegistraId) {
  const conn = await db.getConnection();
  await conn.beginTransaction();

  try {
    // Verificar proveedor activo
    const [prov] = await conn.query(
      'SELECT id FROM proveedores WHERE id = ? AND activo = true',
      [fields.proveedor_id]
    );
    if (prov.length === 0) {
      const err = new Error('Proveedor no encontrado o inactivo');
      err.statusCode = 404; err.code = 'NOT_FOUND'; throw err;
    }

    // Estado 'bueno' para las unidades generadas
    const [estadoRows] = await conn.query(
      "SELECT id FROM estados_herramienta WHERE nombre = 'bueno'"
    );
    if (estadoRows.length === 0) {
      const err = new Error('Estado "bueno" no configurado en el sistema');
      err.statusCode = 500; err.code = 'INTERNAL_ERROR'; throw err;
    }
    const estadoId = estadoRows[0].id;

    // Calcular subtotales por línea y totales de cabecera
    for (const item of fields.detalle) {
      item.subtotal = parseFloat((item.precio_unitario * item.cantidad).toFixed(2));
    }
    const subtotal = parseFloat(
      fields.detalle.reduce((sum, i) => sum + i.subtotal, 0).toFixed(2)
    );
    const igv = parseFloat((subtotal * 0.18).toFixed(2));
    const total = parseFloat((subtotal + igv).toFixed(2));

    // Insertar cabecera con código temporal; se actualiza con el insertId
    const [compraResult] = await conn.query(
      `INSERT INTO compras
         (codigo, proveedor_id, usuario_registra_id, numero_documento, fecha_compra,
          subtotal, igv, total, observaciones)
       VALUES ('TEMP', ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        fields.proveedor_id,
        usuarioRegistraId,
        fields.numero_documento ?? null,
        fields.fecha_compra,
        subtotal, igv, total,
        fields.observaciones ?? null,
      ]
    );
    const compraId = compraResult.insertId;
    const codigo = `COMP-${String(compraId).padStart(4, '0')}`;
    await conn.query('UPDATE compras SET codigo = ? WHERE id = ?', [codigo, compraId]);

    // Insertar cada línea de detalle y generar unidades
    for (const item of fields.detalle) {
      const [herrRows] = await conn.query(
        'SELECT id, codigo FROM herramientas WHERE id = ? AND activo = true',
        [item.herramienta_id]
      );
      if (herrRows.length === 0) {
        const err = new Error(`Herramienta con id ${item.herramienta_id} no encontrada o inactiva`);
        err.statusCode = 404; err.code = 'NOT_FOUND'; throw err;
      }
      const herrCodigo = herrRows[0].codigo;

      await conn.query(
        `INSERT INTO detalle_compras (compra_id, herramienta_id, cantidad, precio_unitario, subtotal)
         VALUES (?, ?, ?, ?, ?)`,
        [compraId, item.herramienta_id, item.cantidad, item.precio_unitario, item.subtotal]
      );

      // Contar unidades existentes para continuar la secuencia del código
      const [unitRows] = await conn.query(
        'SELECT COUNT(*) AS cnt FROM unidades_herramienta WHERE herramienta_id = ?',
        [item.herramienta_id]
      );
      let seq = unitRows[0].cnt;

      for (let i = 0; i < item.cantidad; i++) {
        seq++;
        const codigoUnidad = `${herrCodigo}-${String(seq).padStart(2, '0')}`;
        await conn.query(
          `INSERT INTO unidades_herramienta
             (herramienta_id, codigo_unidad, estado_id, compra_id, fecha_ingreso)
           VALUES (?, ?, ?, ?, ?)`,
          [item.herramienta_id, codigoUnidad, estadoId, compraId, fields.fecha_compra]
        );
      }
    }

    await conn.commit();
    return getById(compraId);

  } catch (err) {
    await conn.rollback();
    throw err;
  } finally {
    conn.release();
  }
}

async function anular(id, usuarioModificaId) {
  const conn = await db.getConnection();
  await conn.beginTransaction();

  try {
    const [compras] = await conn.query(
      'SELECT id, anulada FROM compras WHERE id = ?',
      [id]
    );
    if (compras.length === 0) {
      const err = new Error('Compra no encontrada');
      err.statusCode = 404; err.code = 'NOT_FOUND'; throw err;
    }
    if (compras[0].anulada) {
      const err = new Error('La compra ya fue anulada');
      err.statusCode = 409; err.code = 'ALREADY_ANULADA'; throw err;
    }

    // Verificar que ninguna unidad de esta compra haya sido usada
    const [usadas] = await conn.query(`
      SELECT u.id FROM unidades_herramienta u
      WHERE u.compra_id = ?
        AND (
          EXISTS (SELECT 1 FROM detalle_prestamos dp WHERE dp.unidad_herramienta_id = u.id)
          OR
          EXISTS (SELECT 1 FROM bajas b WHERE b.unidad_herramienta_id = u.id)
        )
      LIMIT 1
    `, [id]);

    if (usadas.length > 0) {
      const err = new Error('No se puede anular: existen unidades de esta compra que ya fueron usadas en préstamos o bajas');
      err.statusCode = 409; err.code = 'UNITS_IN_USE'; throw err;
    }

    // Eliminar las unidades generadas por esta compra
    await conn.query(
      'DELETE FROM unidades_herramienta WHERE compra_id = ?',
      [id]
    );

    // Marcar la compra como anulada
    await conn.query(
      'UPDATE compras SET anulada = true, anulada_at = NOW(), usuario_modifica_id = ?, updated_at = NOW() WHERE id = ?',
      [usuarioModificaId, id]
    );

    await conn.commit();

  } catch (err) {
    await conn.rollback();
    throw err;
  } finally {
    conn.release();
  }
}

module.exports = { getAll, getById, create, anular };
