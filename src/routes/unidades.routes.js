'use strict';

/**
 * Rutas para unidades físicas de herramienta.
 * Montado en /api/unidades
 *
 * Las unidades se crean automáticamente al registrar una compra.
 *
 * Permisos requeridos:
 *   GET       → unidad.ver     (administrador, encargado_almacen)
 *   PUT       → herramienta.editar (administrador, encargado_almacen)
 */

const { Router } = require('express');
const authMiddleware = require('../middleware/auth');
const rbac = require('../middleware/rbac');
const unidadesController = require('../controllers/unidades.controller');

const router = Router();

router.get('/',    authMiddleware, rbac('unidad.ver'),          unidadesController.getAll);
router.get('/:id', authMiddleware, rbac('unidad.ver'),          unidadesController.getById);
router.put('/:id', authMiddleware, rbac('herramienta.editar'),  unidadesController.update);

module.exports = router;
