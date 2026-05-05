'use strict';

/**
 * Rutas para el catálogo de tipos de herramienta.
 * Montado en /api/catalogos/tipos-herramienta
 *
 * Permisos requeridos:
 *   GET              → catalogo.ver       (administrador, encargado_almacen)
 *   POST / PUT / DEL → catalogo.gestionar (administrador)
 */

const { Router } = require('express');
const authMiddleware = require('../middleware/auth');
const rbac = require('../middleware/rbac');
const tiposHerramientaController = require('../controllers/tipos-herramienta.controller');

const router = Router();

router.get('/',       authMiddleware, rbac('catalogo.ver'),       tiposHerramientaController.getAll);
router.get('/:id',    authMiddleware, rbac('catalogo.ver'),       tiposHerramientaController.getById);
router.post('/',      authMiddleware, rbac('catalogo.gestionar'), tiposHerramientaController.create);
router.put('/:id',    authMiddleware, rbac('catalogo.gestionar'), tiposHerramientaController.update);
router.delete('/:id', authMiddleware, rbac('catalogo.gestionar'), tiposHerramientaController.remove);

module.exports = router;
