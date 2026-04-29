'use strict';

/**
 * Rutas para el catálogo de ubicaciones.
 * Montado en /api/catalogos/ubicaciones
 *
 * Permisos requeridos:
 *   GET              → catalogo.ver       (administrador, encargado_almacen)
 *   POST / PUT / DEL → catalogo.gestionar (administrador)
 */

const { Router } = require('express');
const authMiddleware = require('../middleware/auth');
const rbac = require('../middleware/rbac');
const ubicacionesController = require('../controllers/ubicaciones.controller');

const router = Router();

router.get('/',       authMiddleware, rbac('catalogo.ver'),       ubicacionesController.getAll);
router.get('/:id',    authMiddleware, rbac('catalogo.ver'),       ubicacionesController.getById);
router.post('/',      authMiddleware, rbac('catalogo.gestionar'), ubicacionesController.create);
router.put('/:id',    authMiddleware, rbac('catalogo.gestionar'), ubicacionesController.update);
router.delete('/:id', authMiddleware, rbac('catalogo.gestionar'), ubicacionesController.remove);

module.exports = router;
