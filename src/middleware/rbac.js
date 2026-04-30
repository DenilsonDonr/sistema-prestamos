const db = require ('../config/db');

function createError(statusCode, code, message) {
  return Object.assign(new Error(message), { statusCode, code });
}

//Función exterior
function rbac(requiredPermission) {

    //Devolver el middleware
    return async function rbacMiddleware(req, res, next) {
        try {
            //Validar que auth ya pobló req.user
            if (!req.user?.rol_id) {
                return next(createError(401, 'AUTH_REQUIRED', 'Usuario no autenticado'));
            }

            //Sacar el rol
            const { rol_id: roleId } = req.user;

            //Verificar permisos
            const [rows] = await db.query(
                `SELECT 1
                FROM rol_permiso rp
                JOIN permisos p ON rp.permiso_id = p.id
                WHERE rp.rol_id = ? AND p.codigo = ?
                LIMIT 1`,
                [roleId, requiredPermission]
            );
            //Si no hay permisos, error 403
            if (!rows.length) {
                return next(createError(403, 'FORBIDDEN', 'No tienes permisos'));
            }
            next();  
            //Capturar errores de la BD   
        }   catch (err) {
            next(err);
        }
    };
}

module.exports = rbac;