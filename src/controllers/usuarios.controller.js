'use strict';

const {
    validateCreateUser,
    validateUpdateUser,
    parseUserId,
} = require('../validators/usuarios.validator');

const service = require('../services/usuarios.service');

async function create(req, res, next) {
    try {
        const payload = validateCreateUser(req.body);
        const result = await service.createUser(payload, req.user.id);
        res.status(201).json({ ok: true, data: result });
    } catch (err) {
        next(err);
    }
}

async function getById(req, res, next) {
    try {
        const id = parseUserId(req.params.id);
        const result = await service.getUserById(id);
        res.json({ ok: true, data: result });
    } catch (err) {
        next(err);
    }
}

async function list(req, res, next) {
    try {
        const filters = {};

        if (req.query.rol_id) {
            const rol = Number.parseInt(req.query.rol_id, 10);
            if (!Number.isInteger(rol) || rol <= 0) {
                throw Object.assign(new Error('rol_id inválido'), {
                    statusCode: 400,
                    code: 'INVALID_PARAMETER',
                });
            }
            filters.rol_id = rol;
        }

        if (req.query.activo !== undefined) {
            filters.activo = req.query.activo === 'true';
        }

        if (req.query.search) {
            filters.search = req.query.search.trim();
        }

        const limit = Math.min(Number.parseInt(req.query.limit, 10) || 10, 100);
        const offset = Number.parseInt(req.query.offset, 10) || 0;

        const result = await service.listUsers(filters, limit, offset);
        res.json({ ok: true, data: result });
    } catch (err) {
        next(err);
    }
}

async function update(req, res, next) {
    try {
        const id = parseUserId(req.params.id);
        const payload = validateUpdateUser(req.body);
        const result = await service.updateUser(id, payload, req.user.id);
        res.json({ ok: true, data: result });
    } catch (err) {
        next(err);
    }
}

async function deactivate(req, res, next) {
    try {
        const id = parseUserId(req.params.id);
        const result = await service.deactivateUser(id, req.user.id);
        res.json({ ok: true, data: result });
    } catch (err) {
        next(err);
    }
}

async function activate(req, res, next) {
    try {
        const id = parseUserId(req.params.id);
        const result = await service.activateUser(id, req.user.id);
        res.json({ ok: true, data: result });
    } catch (err) {
        next(err);
    }
}

async function checkUsername(req, res, next) {
    try {
        const username = req.params.username?.trim();

        if (!username) {
            throw Object.assign(new Error('username requerido'), {
                statusCode: 400,
                code: 'VALIDATION_ERROR',
            });
        }

        const available = await service.isUsernameAvailable(username);
        res.json({ ok: true, data: { username, available } });
    } catch (err) {
        next(err);
    }
}

module.exports = {
    create,
    getById,
    list,
    update,
    deactivate,
    activate,
    checkUsername,
};