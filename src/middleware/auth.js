'use strict';

const { verifyToken } = require('../utils/jwt');
const db = require('../config/db');

function createError(statusCode, code, message) {
    return Object.assign(new Error(message), { statusCode, code });
}

// Releemos rol_id y activo desde BD en cada request en lugar de confiar en el JWT.
// Razón: si a un usuario se le cambia el rol o se le desactiva durante una sesión
// activa, el JWT seguiría siendo válido hasta su expiración. Releer evita ventanas
// de privilegio obsoleto.
async function authMiddleware(req, res, next) {
    try {
        const header = req.headers.authorization;

        if (!header) {
            throw createError(401, 'AUTH_TOKEN_REQUIRED', 'Token requerido');
        }
        if (!header.startsWith('Bearer ')) {
            throw createError(401, 'AUTH_TOKEN_INVALID_FORMAT', 'Formato inválido');
        }

        const token = header.split(' ')[1];
        if (!token) {
            throw createError(401, 'AUTH_TOKEN_REQUIRED', 'Token requerido');
        }

        let payload;
        try {
            payload = verifyToken(token);
        } catch {
            throw createError(401, 'AUTH_TOKEN_INVALID', 'Token inválido o expirado');
        }

        const [rows] = await db.query(
            `SELECT u.id, u.activo, u.rol_id, r.nombre AS rol_nombre
             FROM usuarios u
             JOIN roles r ON u.rol_id = r.id
             WHERE u.id = ?`,
            [payload.user_id]
        );

        if (!rows.length) {
            throw createError(401, 'USER_NOT_FOUND', 'Usuario no encontrado');
        }

        const user = rows[0];

        if (!user.activo) {
            throw createError(401, 'USER_INACTIVE', 'Tu cuenta fue desactivada');
        }

        req.user = {
            user_id: user.id,
            rol_id: user.rol_id,
            rol_nombre: user.rol_nombre,
        };

        next();
    } catch (err) {
        if (!err.statusCode) {
            err = createError(401, 'AUTH_TOKEN_INVALID', 'Token inválido o expirado');
        }
        next(err);
    }
}

module.exports = authMiddleware;
