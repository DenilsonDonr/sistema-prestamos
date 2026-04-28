const jwt = require('jsonwebtoken');
const env = require('../config/env');

//Función para firmar tokens
function signToken(payload) {
    return jwt.sign(payload, env.jwt.secret, {
        expiresIn: env.jwt.expiresIn,
    });
}

//Función para verificar tokens
function verifyToken(token) {
    return jwt.verify(token, env.jwt.secret);
}

//Exportación
module.exports = {
    signToken,
    verifyToken,
};

