'use strict';

/**
 * Rutas para el catálogo de turnos.
 * Montado en /api/catalogos/turnos
 *
 * Permisos requeridos:
 *   GET              → catalogo.ver       (administrador, encargado_almacen)
 *   POST / PUT / DEL → catalogo.gestionar (administrador)
 */

const { Router } = require('express');
const authMiddleware = require('../middleware/auth');
const rbac = require('../middleware/rbac');
const turnosController = require('../controllers/turnos.controller');

const router = Router();

router.get('/',       authMiddleware, rbac('catalogo.ver'),       turnosController.getAll);
router.get('/:id',    authMiddleware, rbac('catalogo.ver'),       turnosController.getById);
router.post('/',      authMiddleware, rbac('catalogo.gestionar'), turnosController.create);
router.put('/:id',    authMiddleware, rbac('catalogo.gestionar'), turnosController.update);
router.delete('/:id', authMiddleware, rbac('catalogo.gestionar'), turnosController.remove);

module.exports = router;
