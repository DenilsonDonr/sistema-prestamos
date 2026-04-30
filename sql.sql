CREATE DATABASE IF NOT EXISTS prestamo_herramientas;

USE prestamo_herramientas;

CREATE TABLE roles (
    id int PRIMARY KEY AUTO_INCREMENT,
    nombre varchar(50) UNIQUE NOT NULL COMMENT 'administrador, encargado_almacen, trabajador',
    descripcion varchar(255),
    activo boolean DEFAULT true,
    usuario_modifica_id int,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE permisos (
    id int PRIMARY KEY AUTO_INCREMENT,
    codigo varchar(100) UNIQUE NOT NULL,
    nombre varchar(100) NOT NULL,
    descripcion varchar(255),
    modulo varchar(50) COMMENT 'inventario, prestamos, compras, bajas, reportes, etc.',
    usuario_modifica_id int,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE rol_permiso (
    id int PRIMARY KEY AUTO_INCREMENT,
    rol_id int NOT NULL,
    permiso_id int NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE areas (
    id int PRIMARY KEY AUTO_INCREMENT,
    nombre varchar(100) UNIQUE NOT NULL COMMENT 'soldadura, mantenimiento, almacÃ©n',
    descripcion varchar(255),
    activo boolean DEFAULT true,
    usuario_modifica_id int,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE turnos (
    id int PRIMARY KEY AUTO_INCREMENT,
    nombre varchar(50) UNIQUE NOT NULL COMMENT 'maÃ±ana, tarde, noche',
    hora_inicio time,
    hora_fin time,
    activo boolean DEFAULT true,
    usuario_modifica_id int,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE cargos (
    id int PRIMARY KEY AUTO_INCREMENT,
    nombre varchar(100) UNIQUE NOT NULL,
    descripcion varchar(255),
    activo boolean DEFAULT true,
    usuario_modifica_id int,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE marcas (
    id int PRIMARY KEY AUTO_INCREMENT,
    nombre varchar(100) UNIQUE NOT NULL,
    activo boolean DEFAULT true,
    usuario_modifica_id int,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE modelos (
    id int PRIMARY KEY AUTO_INCREMENT,
    marca_id int NOT NULL,
    nombre varchar(100) NOT NULL,
    activo boolean DEFAULT true,
    usuario_modifica_id int,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE tipos_herramienta (
    id int PRIMARY KEY AUTO_INCREMENT,
    nombre varchar(50) UNIQUE NOT NULL COMMENT 'manual, elÃ©ctrica, neumÃ¡tica',
    activo boolean DEFAULT true,
    usuario_modifica_id int,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE ubicaciones (
    id int PRIMARY KEY AUTO_INCREMENT,
    nombre varchar(100) UNIQUE NOT NULL COMMENT 'estante A-1, gabinete 3, zona norte',
    descripcion varchar(255),
    activo boolean DEFAULT true,
    usuario_modifica_id int,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE estados_herramienta (
    id int PRIMARY KEY AUTO_INCREMENT,
    nombre varchar(50) UNIQUE NOT NULL COMMENT 'bueno, regular, malo, prestado, baja',
    descripcion varchar(255),
    color varchar(20),
    activo boolean DEFAULT true,
    usuario_modifica_id int,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE motivos_baja (
    id int PRIMARY KEY AUTO_INCREMENT,
    nombre varchar(100) UNIQUE NOT NULL COMMENT 'extravÃ­o, rotura, obsolescencia, robo',
    descripcion varchar(255),
    activo boolean DEFAULT true,
    usuario_modifica_id int,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE tipos_alerta (
    id int PRIMARY KEY AUTO_INCREMENT,
    nombre varchar(100) UNIQUE NOT NULL COMMENT 'devolucion_vencida, stock_bajo, herramienta_daÃ±ada, prestamos_repetidos',
    descripcion varchar(255),
    activo boolean DEFAULT true,
    usuario_modifica_id int,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE usuarios (
    id int PRIMARY KEY AUTO_INCREMENT,
    rol_id int NOT NULL,
    codigo varchar(20) UNIQUE NOT NULL COMMENT 'cÃ³digo interno de la empresa',
    dni varchar(20) UNIQUE,
    nombres varchar(100) NOT NULL,
    apellidos varchar(100) NOT NULL,
    cargo_id int,
    area_id int,
    turno_id int,
    telefono varchar(20),
    username varchar(50) UNIQUE NOT NULL,
    password_hash varchar(255) NOT NULL,
    email varchar(100) UNIQUE,
    ultimo_acceso TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    activo boolean DEFAULT true,
    usuario_modifica_id int COMMENT 'auto-referencia: quiÃ©n editÃ³ este usuario',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE proveedores (
    id int PRIMARY KEY AUTO_INCREMENT,
    ruc varchar(20) UNIQUE,
    razon_social varchar(150) NOT NULL,
    nombre_comercial varchar(150),
    direccion varchar(255),
    telefono varchar(20),
    email varchar(100),
    contacto varchar(100) COMMENT 'nombre de la persona de contacto',
    activo boolean DEFAULT true,
    usuario_modifica_id int,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE compras (
    id int PRIMARY KEY AUTO_INCREMENT,
    codigo varchar(20) UNIQUE NOT NULL COMMENT 'ej: COMP-0001',
    proveedor_id int NOT NULL,
    usuario_registra_id int NOT NULL,
    numero_documento varchar(50) COMMENT 'nÃºmero de factura o boleta',
    fecha_compra date NOT NULL,
    subtotal decimal(12, 2) DEFAULT 0,
    igv decimal(12, 2) DEFAULT 0,
    total decimal(12, 2) DEFAULT 0,
    observaciones text,
    anulada boolean DEFAULT false,
    anulada_at TIMESTAMP NULL,
    usuario_modifica_id int,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE detalle_compras (
    id int PRIMARY KEY AUTO_INCREMENT,
    compra_id int NOT NULL,
    herramienta_id int NOT NULL,
    cantidad int NOT NULL,
    precio_unitario decimal(10, 2) NOT NULL,
    subtotal decimal(12, 2) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE herramientas (
    id int PRIMARY KEY AUTO_INCREMENT,
    codigo varchar(20) UNIQUE NOT NULL COMMENT 'ej: H-001',
    nombre varchar(150) NOT NULL,
    descripcion text,
    tipo_id int,
    marca_id int,
    modelo_id int,
    ubicacion_id int,
    stock_minimo int DEFAULT 0,
    activo boolean DEFAULT true,
    usuario_modifica_id int,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE unidades_herramienta (
    id int PRIMARY KEY AUTO_INCREMENT,
    herramienta_id int NOT NULL,
    codigo_unidad varchar(30) UNIQUE NOT NULL,
    numero_serie varchar(50) UNIQUE COMMENT 'nÃºmero de serie del fabricante, si aplica',
    estado_id int NOT NULL,
    compra_id int,
    fecha_ingreso date NOT NULL,
    observaciones text,
    usuario_modifica_id int,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE prestamos (
    id int PRIMARY KEY AUTO_INCREMENT,
    codigo varchar(20) UNIQUE NOT NULL COMMENT 'ej: PRE-0001',
    usuario_solicita_id int NOT NULL,
    usuario_registra_id int NOT NULL,
    area_uso_id int COMMENT 'Ã¡rea donde se usarÃ¡ la herramienta',
    fecha_salida TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    fecha_retorno_estimada TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    motivo text COMMENT 'trabajo asignado',
    estado varchar(20) DEFAULT 'activo' COMMENT 'activo, devuelto, parcial, vencido',
    usuario_modifica_id int,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE detalle_prestamos (
    id int PRIMARY KEY AUTO_INCREMENT,
    prestamo_id int NOT NULL,
    unidad_herramienta_id int NOT NULL,
    estado_salida_id int NOT NULL,
    devuelto boolean DEFAULT false,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE devoluciones (
    id int PRIMARY KEY AUTO_INCREMENT,
    codigo varchar(20) UNIQUE NOT NULL,
    prestamo_id int NOT NULL,
    usuario_recibe_id int NOT NULL,
    fecha_devolucion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    observaciones text,
    usuario_modifica_id int,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE detalle_devoluciones (
    id int PRIMARY KEY AUTO_INCREMENT,
    devolucion_id int NOT NULL,
    detalle_prestamo_id int UNIQUE NOT NULL,
    unidad_herramienta_id int NOT NULL,
    estado_devolucion_id int NOT NULL,
    observaciones text,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE bajas (
    id int PRIMARY KEY AUTO_INCREMENT,
    codigo varchar(20) UNIQUE NOT NULL,
    unidad_herramienta_id int UNIQUE NOT NULL,
    motivo_baja_id int NOT NULL,
    usuario_registra_id int NOT NULL,
    fecha_baja date NOT NULL,
    descripcion text COMMENT 'detalle del motivo especÃ­fico',
    usuario_modifica_id int,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE alertas (
    id int PRIMARY KEY AUTO_INCREMENT,
    tipo_alerta_id int NOT NULL,
    prestamo_id int,
    herramienta_id int,
    unidad_herramienta_id int,
    mensaje text NOT NULL,
    leida boolean DEFAULT false,
    fecha_alerta TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    usuario_modifica_id int,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE notificaciones (
    id int PRIMARY KEY AUTO_INCREMENT,
    usuario_id int NOT NULL,
    alerta_id int,
    mensaje text NOT NULL,
    leida boolean DEFAULT false,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE UNIQUE INDEX rol_permiso_index_0 ON rol_permiso (rol_id, permiso_id);

CREATE UNIQUE INDEX modelos_index_1 ON modelos (marca_id, nombre);

ALTER TABLE roles
ADD FOREIGN KEY (usuario_modifica_id) REFERENCES usuarios (id);

ALTER TABLE permisos
ADD FOREIGN KEY (usuario_modifica_id) REFERENCES usuarios (id);

ALTER TABLE rol_permiso
ADD FOREIGN KEY (rol_id) REFERENCES roles (id);

ALTER TABLE rol_permiso
ADD FOREIGN KEY (permiso_id) REFERENCES permisos (id);

ALTER TABLE areas
ADD FOREIGN KEY (usuario_modifica_id) REFERENCES usuarios (id);

ALTER TABLE turnos
ADD FOREIGN KEY (usuario_modifica_id) REFERENCES usuarios (id);

ALTER TABLE cargos
ADD FOREIGN KEY (usuario_modifica_id) REFERENCES usuarios (id);

ALTER TABLE marcas
ADD FOREIGN KEY (usuario_modifica_id) REFERENCES usuarios (id);

ALTER TABLE modelos
ADD FOREIGN KEY (marca_id) REFERENCES marcas (id);

ALTER TABLE modelos
ADD FOREIGN KEY (usuario_modifica_id) REFERENCES usuarios (id);

ALTER TABLE tipos_herramienta
ADD FOREIGN KEY (usuario_modifica_id) REFERENCES usuarios (id);

ALTER TABLE ubicaciones
ADD FOREIGN KEY (usuario_modifica_id) REFERENCES usuarios (id);

ALTER TABLE estados_herramienta
ADD FOREIGN KEY (usuario_modifica_id) REFERENCES usuarios (id);

ALTER TABLE motivos_baja
ADD FOREIGN KEY (usuario_modifica_id) REFERENCES usuarios (id);

ALTER TABLE tipos_alerta
ADD FOREIGN KEY (usuario_modifica_id) REFERENCES usuarios (id);

ALTER TABLE usuarios
ADD FOREIGN KEY (rol_id) REFERENCES roles (id);

ALTER TABLE usuarios
ADD FOREIGN KEY (cargo_id) REFERENCES cargos (id);

ALTER TABLE usuarios
ADD FOREIGN KEY (area_id) REFERENCES areas (id);

ALTER TABLE usuarios
ADD FOREIGN KEY (turno_id) REFERENCES turnos (id);

ALTER TABLE usuarios
ADD FOREIGN KEY (usuario_modifica_id) REFERENCES usuarios (id);

ALTER TABLE proveedores
ADD FOREIGN KEY (usuario_modifica_id) REFERENCES usuarios (id);

ALTER TABLE compras
ADD FOREIGN KEY (proveedor_id) REFERENCES proveedores (id);

ALTER TABLE compras
ADD FOREIGN KEY (usuario_registra_id) REFERENCES usuarios (id);

ALTER TABLE compras
ADD FOREIGN KEY (usuario_modifica_id) REFERENCES usuarios (id);

ALTER TABLE detalle_compras
ADD FOREIGN KEY (compra_id) REFERENCES compras (id);

ALTER TABLE detalle_compras
ADD FOREIGN KEY (herramienta_id) REFERENCES herramientas (id);

ALTER TABLE herramientas
ADD FOREIGN KEY (tipo_id) REFERENCES tipos_herramienta (id);

ALTER TABLE herramientas
ADD FOREIGN KEY (marca_id) REFERENCES marcas (id);

ALTER TABLE herramientas
ADD FOREIGN KEY (modelo_id) REFERENCES modelos (id);

ALTER TABLE herramientas
ADD FOREIGN KEY (ubicacion_id) REFERENCES ubicaciones (id);

ALTER TABLE herramientas
ADD FOREIGN KEY (usuario_modifica_id) REFERENCES usuarios (id);

ALTER TABLE unidades_herramienta
ADD FOREIGN KEY (herramienta_id) REFERENCES herramientas (id);

ALTER TABLE unidades_herramienta
ADD FOREIGN KEY (estado_id) REFERENCES estados_herramienta (id);

ALTER TABLE unidades_herramienta
ADD FOREIGN KEY (compra_id) REFERENCES compras (id);

ALTER TABLE unidades_herramienta
ADD FOREIGN KEY (usuario_modifica_id) REFERENCES usuarios (id);

ALTER TABLE prestamos
ADD FOREIGN KEY (usuario_solicita_id) REFERENCES usuarios (id);

ALTER TABLE prestamos
ADD FOREIGN KEY (usuario_registra_id) REFERENCES usuarios (id);

ALTER TABLE prestamos
ADD FOREIGN KEY (area_uso_id) REFERENCES areas (id);

ALTER TABLE prestamos
ADD FOREIGN KEY (usuario_modifica_id) REFERENCES usuarios (id);

ALTER TABLE detalle_prestamos
ADD FOREIGN KEY (prestamo_id) REFERENCES prestamos (id);

ALTER TABLE detalle_prestamos
ADD FOREIGN KEY (unidad_herramienta_id) REFERENCES unidades_herramienta (id);

ALTER TABLE detalle_prestamos
ADD FOREIGN KEY (estado_salida_id) REFERENCES estados_herramienta (id);

ALTER TABLE devoluciones
ADD FOREIGN KEY (prestamo_id) REFERENCES prestamos (id);

ALTER TABLE devoluciones
ADD FOREIGN KEY (usuario_recibe_id) REFERENCES usuarios (id);

ALTER TABLE devoluciones
ADD FOREIGN KEY (usuario_modifica_id) REFERENCES usuarios (id);

ALTER TABLE detalle_devoluciones
ADD FOREIGN KEY (devolucion_id) REFERENCES devoluciones (id);

ALTER TABLE detalle_devoluciones
ADD FOREIGN KEY (detalle_prestamo_id) REFERENCES detalle_prestamos (id);

ALTER TABLE detalle_devoluciones
ADD FOREIGN KEY (unidad_herramienta_id) REFERENCES unidades_herramienta (id);

ALTER TABLE detalle_devoluciones
ADD FOREIGN KEY (estado_devolucion_id) REFERENCES estados_herramienta (id);

ALTER TABLE bajas
ADD FOREIGN KEY (unidad_herramienta_id) REFERENCES unidades_herramienta (id);

ALTER TABLE bajas
ADD FOREIGN KEY (motivo_baja_id) REFERENCES motivos_baja (id);

ALTER TABLE bajas
ADD FOREIGN KEY (usuario_registra_id) REFERENCES usuarios (id);

ALTER TABLE bajas
ADD FOREIGN KEY (usuario_modifica_id) REFERENCES usuarios (id);

ALTER TABLE alertas
ADD FOREIGN KEY (tipo_alerta_id) REFERENCES tipos_alerta (id);

ALTER TABLE alertas
ADD FOREIGN KEY (prestamo_id) REFERENCES prestamos (id);

ALTER TABLE alertas
ADD FOREIGN KEY (herramienta_id) REFERENCES herramientas (id);

ALTER TABLE alertas
ADD FOREIGN KEY (unidad_herramienta_id) REFERENCES unidades_herramienta (id);

ALTER TABLE alertas
ADD FOREIGN KEY (usuario_modifica_id) REFERENCES usuarios (id);

ALTER TABLE notificaciones
ADD FOREIGN KEY (usuario_id) REFERENCES usuarios (id);

ALTER TABLE notificaciones
ADD FOREIGN KEY (alerta_id) REFERENCES alertas (id);
