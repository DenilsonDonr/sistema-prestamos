'use strict';

/**
 * Validaciones del modulo de usuarios.
 * Revisa ids y datos de entrada antes de tocar la BD.
 */

//Helper para errores de validación
function createValidationError(message) {
    const err = new Error(message);
    err.statusCode = 400;
    err.code = 'VALIDATION_ERROR';
    return err;
}


//Validar
function parseUserId(value) {
    const id = Number.parseInt(value, 10);

    if(!Number.isInteger(id) || id <= 0) {
        throw createValidationError('El id del usuario debe ser un entero positivo');
    }

    return id;
}

function normalizeOptionalString(value) {
    if (value === undefined || value === null || value === '') {
        return null;
    }

    if (typeof value !== 'string') {
        throw createValidationError('Se esperaba una cadena de texto válida')
    }

    const trimmed = value.trim();
    return trimmed === '' ? null : trimmed;
}

//Normalizar FK opcional
function normalizeOptionalForeignKey(value, fieldName) {
    if (value === undefined || value === null || value === '') {
        return null;
    }

    const parsed = Number.parseInt(value, 10);

    if (!Number.isInteger(parsed) || parsed <= 0) {
        throw createValidationError(`El campo ${fieldName} debe ser un entero positivo`);
    }

    return parsed;
}

//Validar creación de usuario
function validateCreateUser(body) {
    const {
        rol_id,
        codigo,
        dni,
        nombres,
        apellidos,
        cargo_id,
        area_id,
        turno_id,
        telefono,
        username,
        password,
        email,
    } = body ?? {};

    // Validar campos obligatorios del alta de usuario
    const rolId = Number.parseInt(rol_id, 10);
    if (!Number.isInteger(rolId) || rolId <= 0) {
        throw createValidationError('El campo rol_id es requerido y debe ser un entero positivo');
    }

    if (typeof codigo !== 'string' || codigo.trim() === '') {
        throw createValidationError('El campo codigo es requerido');
    }

    if (typeof nombres !== 'string' || nombres.trim() === '') {
        throw createValidationError('El campo nombres es requerido');
    }

    if (typeof apellidos !== 'string' || apellidos.trim() === '') {
        throw createValidationError('El campo apellidos es requerido');
    }

    if (typeof username !== 'string' || username.trim() === '') {
        throw createValidationError('El campo username es requerido');
    }

    if (typeof password !== 'string' || password === '') {
        throw createValidationError('El campo password es requerido');
    }

    // Devolver payload limpio y normalizado para el service
    return {
        rol_id: rolId,
        codigo: codigo.trim(),
        dni: normalizeOptionalString(dni),
        nombres: nombres.trim(),
        apellidos: apellidos.trim(),
        cargo_id: normalizeOptionalForeignKey(cargo_id, 'cargo_id'),
        area_id: normalizeOptionalForeignKey(area_id, 'area_id'),
        turno_id: normalizeOptionalForeignKey(turno_id, 'turno_id'),
        telefono: normalizeOptionalString(telefono),
        username: username.trim(),
        password,
        email: normalizeOptionalString(email),
    };

}

// En actualización: rol_id y password son opcionales.
// rol_id puede no venir cuando el usuario edita su propia cuenta (self-edit),
// porque el service bloquea el cambio de rol propio y el frontend no lo envía.
function validateUpdateUser(body) {
    const {
        rol_id,
        codigo,
        dni,
        nombres,
        apellidos,
        cargo_id,
        area_id,
        turno_id,
        telefono,
        username,
        password,
        email,
    } = body ?? {};

    if (typeof codigo !== 'string' || codigo.trim() === '') {
        throw createValidationError('El campo codigo es requerido');
    }
    if (typeof nombres !== 'string' || nombres.trim() === '') {
        throw createValidationError('El campo nombres es requerido');
    }
    if (typeof apellidos !== 'string' || apellidos.trim() === '') {
        throw createValidationError('El campo apellidos es requerido');
    }
    if (typeof username !== 'string' || username.trim() === '') {
        throw createValidationError('El campo username es requerido');
    }

    const payload = {
        codigo: codigo.trim(),
        dni: normalizeOptionalString(dni),
        nombres: nombres.trim(),
        apellidos: apellidos.trim(),
        cargo_id: normalizeOptionalForeignKey(cargo_id, 'cargo_id'),
        area_id: normalizeOptionalForeignKey(area_id, 'area_id'),
        turno_id: normalizeOptionalForeignKey(turno_id, 'turno_id'),
        telefono: normalizeOptionalString(telefono),
        username: username.trim(),
        email: normalizeOptionalString(email),
    };

    // rol_id opcional: si viene debe ser un entero positivo válido
    if (rol_id !== undefined && rol_id !== null && rol_id !== '') {
        const rolId = Number.parseInt(rol_id, 10);
        if (!Number.isInteger(rolId) || rolId <= 0) {
            throw createValidationError('El campo rol_id debe ser un entero positivo');
        }
        payload.rol_id = rolId;
    }

    // password opcional en actualización
    if (password !== undefined && password !== null && password !== '') {
        payload.password = password;
    }

    return payload;
}

// Exportar validadores del modulo usuarios
module.exports = {
    parseUserId,
    validateCreateUser,
    validateUpdateUser,
};