const db = require ('../config/db');

//Función exterior
function rbac(requiredPermission) {

    //Devolver el middleware
    return async function rbacMiddleware(req, res, next) {
        //Validar que auth ya pobló req.user
        if (!req.user || !req.user.rol_id) {
            const error = new Error('Usuario no autenticado');
            error.statusCode = 401;
            error.code = 'AUTH_REQUIRED';
            return next(error);
        }
        //Sacar el rol
        const { rol_id: roleId } = req.user;

        try {
            //Query de permisos
            const [rows] = await db.query(
                `SELECT rp.id
                FROM rol_permiso rp
                JOIN permisos p ON rp.permiso_id = p.id
                WHERE rp.rol_id = ? AND p.codigo = ?
                LIMIT 1`,
                [roleId, requiredPermission]
            );
            //Si no hay permisos, error 403
            if (!rows.length) {
                const error = new Error('No tienes permisos para realizar esta acción');
                error.statusCode = 403;
                error.code = 'FORBIDDEN';
                return next (error);
            }
            return next();  
        //Capturar errores de la BD   
        } catch (err) {
            return next(err);
        }
    };
}

module.exports = rbac;