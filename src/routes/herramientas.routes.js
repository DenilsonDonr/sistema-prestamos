'use strict';

/**
 * Rutas para el maestro de herramientas.
 * Montado en /api/herramientas
 *
 * Permisos requeridos:
 *   GET              → herramienta.ver    (administrador, encargado_almacen, trabajador)
 *   POST             → herramienta.crear  (administrador)
 *   PUT / DELETE     → herramienta.editar (administrador)
 */

const { Router } = require('express');
const authMiddleware = require('../middleware/auth');
const rbac = require('../middleware/rbac');
const herramientasController = require('../controllers/herramientas.controller');

const router = Router();

router.get('/',       authMiddleware, rbac('herramienta.ver'),    herramientasController.getAll);
router.get('/:id',    authMiddleware, rbac('herramienta.ver'),    herramientasController.getById);
router.post('/',      authMiddleware, rbac('herramienta.crear'),  herramientasController.create);
router.put('/:id',    authMiddleware, rbac('herramienta.editar'), herramientasController.update);
router.delete('/:id', authMiddleware, rbac('herramienta.editar'), herramientasController.remove);

module.exports = router;
