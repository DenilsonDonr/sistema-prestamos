'use strict';

/**
 * Rutas para el catálogo de áreas.
 * Montado en /api/catalogos/areas
 *
 * Permisos requeridos:
 *   GET              → catalogo.ver       (administrador, encargado_almacen)
 *   POST / PUT / DEL → catalogo.gestionar (administrador)
 */

const { Router } = require('express');
const authMiddleware = require('../middleware/auth');
const rbac = require('../middleware/rbac');
const areasController = require('../controllers/areas.controller');

const router = Router();

router.get('/',       authMiddleware, rbac('catalogo.ver'),       areasController.getAll);
router.get('/:id',    authMiddleware, rbac('catalogo.ver'),       areasController.getById);
router.post('/',      authMiddleware, rbac('catalogo.gestionar'), areasController.create);
router.put('/:id',    authMiddleware, rbac('catalogo.gestionar'), areasController.update);
router.delete('/:id', authMiddleware, rbac('catalogo.gestionar'), areasController.remove);

module.exports = router;
