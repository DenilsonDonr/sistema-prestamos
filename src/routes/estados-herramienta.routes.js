'use strict';

/**
 * Rutas para el catálogo de estados de herramienta.
 * Montado en /api/catalogos/estados-herramienta
 *
 * Solo lectura — los estados son definidos por el sistema.
 * Permiso requerido: catalogo.ver (administrador, encargado_almacen)
 */

const { Router } = require('express');
const authMiddleware = require('../middleware/auth');
const rbac = require('../middleware/rbac');
const estadosHerramientaController = require('../controllers/estados-herramienta.controller');

const router = Router();

router.get('/',    authMiddleware, rbac('catalogo.ver'), estadosHerramientaController.getAll);
router.get('/:id', authMiddleware, rbac('catalogo.ver'), estadosHerramientaController.getById);

module.exports = router;
