const { verifyToken } = require("../utils/jwt");

//Middleware de autenticación
function authMiddleware(req, res, next) {
    const authHeader = req.headers.authorization;

    //Validar que exista el header de autorización
    if (!authHeader) {
        const error = new Error ('Token de autenticación requerido');
        error.statusCode = 401;
        error.code = 'AUTH_TOKEN_REQUIRED';
        return next(error);
    }

    //Validar formato bearer 
    if (!authHeader.startsWith('Bearer ')) {
        const error = new Error('Formato de token invalido');
        error.statusCode = 401;
        error.code = 'AUTH_TOKEN_INVALID_FORMAT';
        return next(error);
    }

    //Extraer el token
    const token = authHeader.split(' ')[1];

    //Validar que sí haya token
    if (!token) {
        const error = new Error('Token de autenticación requerido');
        error.statusCode = 401;
        error.code = 'AUTH_TOKEN_REQUIRED';
        return next(error);
    }

    //Verificar token
    try {
        const decodedToken = verifyToken(token);
        req.user = decodedToken; //Agregar el usuario decodificado al request
        return next();
    } catch (err) {
        const error = new Error('Token invalido o expirado');
        error.statusCode = 401;
        error.code = 'AUTH_TOKEN_INVALID'; 
        return next(error);
    }
}

module.exports = authMiddleware;