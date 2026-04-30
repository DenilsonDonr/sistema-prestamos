'use strict';

const { verifyToken } = require("../utils/jwt");

function createError(statusCode, code, message) {
  return Object.assign(new Error(message), { statusCode, code });
}

//Middleware de autenticación
function authMiddleware(req, res, next) {
    try{

        const header = req.headers.authorization;

        //Validar que exista el header de autorización
         if (!header) {
            throw createError(401, 'AUTH_TOKEN_REQUIRED', 'Token requerido');
        }

        //Validar formato bearer 
        if (!header.startsWith('Bearer ')) {
            throw createError(401, 'AUTH_TOKEN_INVALID_FORMAT', 'Formato inválido');
        }

        //Extraer el token
        const token = header.split(' ')[1];

        //Validar que sí haya token
        if (!token) {
        throw createError(401, 'AUTH_TOKEN_REQUIRED', 'Token requerido');
        }

        req.user = verifyToken(token);

        //Verificar token
        next();
    } catch (err) {
        if (!err.statusCode) {
        err = createError(401, 'AUTH_TOKEN_INVALID', 'Token inválido o expirado');
        }
        next(err);
    }
}

module.exports = authMiddleware;