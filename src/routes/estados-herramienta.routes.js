'use strict';

/**
 * Rutas para el catálogo de estados de herramienta.
 * Montado en /api/catalogos/estados-herramienta
 *
 * Permisos requeridos:
 *   GET              → catalogo.ver       (administrador, encargado_almacen)
 *   POST / PUT / DEL → catalogo.gestionar (administrador)
 */

const { Router } = require('express');
const authMiddleware = require('../middleware/auth');
const rbac = require('../middleware/rbac');
const estadosHerramientaController = require('../controllers/estados-herramienta.controller');

const router = Router();

router.get('/',       authMiddleware, rbac('catalogo.ver'),       estadosHerramientaController.getAll);
router.get('/:id',    authMiddleware, rbac('catalogo.ver'),       estadosHerramientaController.getById);
router.post('/',      authMiddleware, rbac('catalogo.gestionar'), estadosHerramientaController.create);
router.put('/:id',    authMiddleware, rbac('catalogo.gestionar'), estadosHerramientaController.update);
router.delete('/:id', authMiddleware, rbac('catalogo.gestionar'), estadosHerramientaController.remove);

module.exports = router;
