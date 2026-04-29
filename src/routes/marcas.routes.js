'use strict';

/**
 * Rutas para el catálogo de marcas.
 * Montado en /api/catalogos/marcas
 *
 * Permisos requeridos:
 *   GET              → catalogo.ver      (administrador, encargado_almacen)
 *   POST / PUT / DEL → catalogo.gestionar (administrador)
 */

const { Router } = require('express');
const authMiddleware = require('../middleware/auth');
const rbac = require('../middleware/rbac');
const marcasController = require('../controllers/marcas.controller');

const router = Router();

router.get('/',    authMiddleware, rbac('catalogo.ver'),       marcasController.getAll);
router.get('/:id', authMiddleware, rbac('catalogo.ver'),       marcasController.getById);
router.post('/',   authMiddleware, rbac('catalogo.gestionar'), marcasController.create);
router.put('/:id', authMiddleware, rbac('catalogo.gestionar'), marcasController.update);
router.delete('/:id', authMiddleware, rbac('catalogo.gestionar'), marcasController.remove);

module.exports = router;
