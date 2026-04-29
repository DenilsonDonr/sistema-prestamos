'use strict';

/**
 * Rutas para el catálogo de cargos.
 * Montado en /api/catalogos/cargos
 *
 * Permisos requeridos:
 *   GET              → catalogo.ver       (administrador, encargado_almacen)
 *   POST / PUT / DEL → catalogo.gestionar (administrador)
 */

const { Router } = require('express');
const authMiddleware = require('../middleware/auth');
const rbac = require('../middleware/rbac');
const cargosController = require('../controllers/cargos.controller');

const router = Router();

router.get('/',       authMiddleware, rbac('catalogo.ver'),       cargosController.getAll);
router.get('/:id',    authMiddleware, rbac('catalogo.ver'),       cargosController.getById);
router.post('/',      authMiddleware, rbac('catalogo.gestionar'), cargosController.create);
router.put('/:id',    authMiddleware, rbac('catalogo.gestionar'), cargosController.update);
router.delete('/:id', authMiddleware, rbac('catalogo.gestionar'), cargosController.remove);

module.exports = router;
