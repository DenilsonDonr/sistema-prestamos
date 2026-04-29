'use strict';

/**
 * Rutas para el catálogo de modelos.
 * Montado en /api/catalogos/modelos
 *
 * Permisos requeridos:
 *   GET              → catalogo.ver       (administrador, encargado_almacen)
 *   POST / PUT / DEL → catalogo.gestionar (administrador)
 */

const { Router } = require('express');
const authMiddleware = require('../middleware/auth');
const rbac = require('../middleware/rbac');
const modelosController = require('../controllers/modelos.controller');

const router = Router();

router.get('/',       authMiddleware, rbac('catalogo.ver'),       modelosController.getAll);
router.get('/:id',    authMiddleware, rbac('catalogo.ver'),       modelosController.getById);
router.post('/',      authMiddleware, rbac('catalogo.gestionar'), modelosController.create);
router.put('/:id',    authMiddleware, rbac('catalogo.gestionar'), modelosController.update);
router.delete('/:id', authMiddleware, rbac('catalogo.gestionar'), modelosController.remove);

module.exports = router;
