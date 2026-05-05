/**
 * modules/usuarios.js
 *
 * Reglas de negocio aplicadas en este módulo (ver db.md §14):
 *  - Un usuario no puede cambiar su propio rol.
 *  - Un usuario no puede desactivar su propia cuenta.
 *  - El sistema no puede quedarse sin al menos un administrador activo
 *    (ni por desactivación ni por cambio de rol).
 *  - Cambiar la contraseña propia obliga a re-loguear.
 *  - No hay eliminación física: solo soft delete (activo=false).
 *
 * El backend valida lo mismo. El frontend lo replica para UX clara.
 */

'use strict';

const UsuariosModule = {

    async init() {
        if (!Auth.hasPermission('usuario.ver')) {
            document.getElementById('pageContainer').innerHTML = `
              <div class="empty-state" style="padding:80px 20px">
                <i class="bi bi-shield-lock" style="font-size:48px;color:var(--danger);opacity:.5"></i>
                <p class="mt-3">No tienes permisos para ver esta sección</p>
              </div>`;
            return;
        }

        const pendientes = [];
        if (!AppState.cargos.length)
            pendientes.push(http('/api/catalogos/cargos').then(r => { AppState.cargos = r.data; }).catch(() => {}));
        if (!AppState.areas.length)
            pendientes.push(http('/api/catalogos/areas').then(r => { AppState.areas = r.data; }).catch(() => {}));
        if (!AppState.turnos.length)
            pendientes.push(http('/api/catalogos/turnos').then(r => { AppState.turnos = r.data; }).catch(() => {}));
        if (!AppState.roles.length)
            pendientes.push(http('/api/roles').then(r => { AppState.roles = r.data; }).catch(() => {}));

        await Promise.all(pendientes);

        this._applyPermissions();
        this._bindEvents();
        await this.load();
    },

    /* ── Visibilidad de acciones según permisos ─────── */
    _applyPermissions() {
        document.querySelectorAll('[data-perm]').forEach(el => {
            const perm = el.dataset.perm;
            if (!Auth.hasPermission(perm)) el.classList.add('d-none');
        });
    },

    async load() {
        const CACHE_TTL = 30_000;
        const cached = AppState.usuarios.length && (Date.now() - (AppState._ts.usuarios ?? 0)) < CACHE_TTL;

        if (cached) {
            this._render(this._applyFilters(AppState.usuarios));
            this._populateFilterRol();
            return;
        }

        document.getElementById('bodyUsuarios').innerHTML =
            `<tr><td colspan="7" class="text-center py-5"><div class="spinner-custom"></div></td></tr>`;

        try {
            const res = await http('/api/usuarios?limit=100');
            AppState.usuarios = res.data.data ?? res.data;
            AppState._ts.usuarios = Date.now();
            this._render(this._applyFilters(AppState.usuarios));
            this._populateFilterRol();
            updateBadges();
        } catch (e) {
            showToast('Error al cargar usuarios: ' + e.message, 'error');
        }
    },

    /* ── Helpers de reglas de negocio ─────────────────── */

    _isAdminRole(rol) {
        // rol puede ser un objeto o un string. Usamos rol_nombre como fuente.
        const nombre = typeof rol === 'string' ? rol : rol?.nombre;
        return nombre === 'administrador';
    },

    _isLastActiveAdmin(usuario) {
        if (!this._isAdminRole(usuario.rol_nombre)) return false;
        if (!usuario.activo) return false;
        const adminsActivos = AppState.usuarios.filter(u =>
            this._isAdminRole(u.rol_nombre) && !!u.activo
        );
        return adminsActivos.length <= 1;
    },

    _canEdit() { return Auth.hasPermission('usuario.editar'); },
    _canCreate() { return Auth.hasPermission('usuario.crear'); },
    _canDeactivate() { return Auth.hasPermission('usuario.eliminar'); },

    /* ── Render ───────────────────────────────── */
    _render(lista) {
        setText('totalUsuariosLabel', `${lista.length} usuario(s) encontrado(s)`);
        const tbody = document.getElementById('bodyUsuarios');

        if (!lista.length) {
            tbody.innerHTML = `<tr><td colspan="7"><div class="empty-state">
                <i class="bi bi-people"></i><p>No hay usuarios que mostrar</p>
              </div></td></tr>`;
            return;
        }

        const canEdit = this._canEdit();
        const canDeactivate = this._canDeactivate();

        tbody.innerHTML = lista.map((u, i) => {
            const isSelf = Auth.isSelf(u.id);
            const isActive = !!u.activo;
            const isLastAdmin = this._isLastActiveAdmin(u);

            // Botón de editar
            const editBtn = canEdit
                ? `<button class="btn-action btn-action-edit"
                        onclick="UsuariosModule.openEdit(${u.id})" title="Editar">
                     <i class="bi bi-pencil-fill"></i>
                   </button>`
                : '';

            // Botón de toggle activo
            let toggleBtn = '';
            if (canDeactivate) {
                if (isSelf) {
                    toggleBtn = `<button class="btn-action" disabled
                            title="No puedes cambiar el estado de tu propia cuenta"
                            style="opacity:.35;cursor:not-allowed">
                            <i class="bi bi-toggle-on" style="font-size:17px"></i>
                          </button>`;
                } else if (isActive && isLastAdmin) {
                    toggleBtn = `<button class="btn-action" disabled
                            title="No se puede desactivar al único administrador activo"
                            style="opacity:.35;cursor:not-allowed">
                            <i class="bi bi-toggle-on" style="font-size:17px"></i>
                          </button>`;
                } else if (isActive) {
                    toggleBtn = `<button class="btn-action" title="Desactivar usuario"
                            onclick="UsuariosModule.toggleActivo(${u.id},true,'${escapeHtml(u.nombres + ' ' + u.apellidos)}')"
                            style="color:#ef4444">
                            <i class="bi bi-toggle-on" style="font-size:17px"></i>
                          </button>`;
                } else {
                    toggleBtn = `<button class="btn-action" title="Activar usuario"
                            onclick="UsuariosModule.toggleActivo(${u.id},false,'${escapeHtml(u.nombres + ' ' + u.apellidos)}')"
                            style="color:#16a34a">
                            <i class="bi bi-toggle-off" style="font-size:17px"></i>
                          </button>`;
                }
            }

            return `
              <tr${isSelf ? ' class="row-self"' : ''}>
                <td><span style="font-family:'DM Mono',monospace;font-size:12px;color:var(--text-muted)">${String(i + 1).padStart(2, '0')}</span></td>
                <td>
                  <div style="font-weight:600">
                    ${escapeHtml(u.nombres)} ${escapeHtml(u.apellidos)}
                    ${isSelf ? ' <span class="self-tag">tú</span>' : ''}
                    ${isLastAdmin ? ' <span class="last-admin-tag" title="Único administrador activo"><i class="bi bi-shield-fill-check"></i> único admin</span>' : ''}
                  </div>
                  <div style="font-size:12px;color:var(--text-muted)">@${escapeHtml(u.username)}</div>
                </td>
                <td><span style="font-family:'DM Mono',monospace;font-size:12px">${escapeHtml(u.codigo)}</span></td>
                <td>${u.dni ? escapeHtml(u.dni) : '<span class="text-muted">—</span>'}</td>
                <td><span class="badge-marca"><i class="bi bi-shield-fill me-1"></i>${escapeHtml(u.rol_nombre || String(u.rol_id))}</span></td>
                <td>
                  ${isActive
                    ? '<span style="display:inline-flex;align-items:center;gap:4px;font-size:12px;font-weight:600;color:#16a34a"><i class="bi bi-circle-fill" style="font-size:7px"></i>Activo</span>'
                    : '<span style="display:inline-flex;align-items:center;gap:4px;font-size:12px;font-weight:600;color:var(--text-muted)"><i class="bi bi-circle-fill" style="font-size:7px"></i>Inactivo</span>'}
                </td>
                <td style="white-space:nowrap">
                  ${editBtn}
                  ${toggleBtn}
                </td>
              </tr>`;
        }).join('');
    },

    /* ── Filtros ─────────────────────────────── */
    _populateFilterRol() {
        const sel = document.getElementById('filterRol');
        if (!sel) return;
        const uniqueRoles = [
            ...new Map(
                AppState.usuarios
                    .filter(u => u.rol_id)
                    .map(u => [u.rol_id, { id: u.rol_id, nombre: u.rol_nombre || String(u.rol_id) }])
            ).values(),
        ];
        sel.innerHTML = `<option value="">Todos los roles</option>` +
            uniqueRoles.map(r => `<option value="${r.id}">${escapeHtml(r.nombre)}</option>`).join('');
    },

    _applyFilters(lista) {
        const q = (document.getElementById('searchUsuario')?.value || '').trim().toLowerCase();
        const rol = document.getElementById('filterRol')?.value;
        const activo = document.getElementById('filterActivo')?.value;

        return lista.filter(u => {
            if (rol && String(u.rol_id) !== String(rol)) return false;
            if (activo === 'true' && !u.activo) return false;
            if (activo === 'false' && u.activo) return false;
            if (q) {
                const hay = [u.nombres, u.apellidos, u.username, u.codigo, u.dni, u.email]
                    .filter(Boolean).join(' ').toLowerCase();
                if (!hay.includes(q)) return false;
            }
            return true;
        });
    },

    _filter() {
        this._render(this._applyFilters(AppState.usuarios));
    },

    /* ── Modal ───────────────────────────────── */
    _openModal(mode, usuario = null) {
        const isEdit = mode === 'edit';
        const isSelf = isEdit && Auth.isSelf(usuario.id);
        const isLastAdmin = isEdit && this._isLastActiveAdmin(usuario);

        setText('modalUsuarioTitle', isEdit ? 'Editar Usuario' : 'Nuevo Usuario');
        setText('modalUsuarioSubtitle', isEdit
            ? `Editando: ${usuario.nombres} ${usuario.apellidos}${isSelf ? ' (tú)' : ''}`
            : 'Completa los campos del formulario');

        // Limpiar
        ['usuarioId', 'uNombres', 'uApellidos', 'uCodigo', 'uDni',
            'uTelefono', 'uUsername', 'uPassword', 'uEmail']
            .forEach(id => { const el = document.getElementById(id); if (el) el.value = ''; });
        clearErrors(['uNombres', 'uApellidos', 'uCodigo', 'uDni', 'uRol', 'uUsername', 'uPassword', 'uEmail', 'uTelefono']);

        // Avisos contextuales
        document.getElementById('selfEditNotice').classList.toggle('d-none', !isSelf);
        document.getElementById('lastAdminNotice').classList.toggle('d-none', !(isLastAdmin && !isSelf));

        // Selects
        this._populateSelect('uRol', AppState.roles, 'id', 'nombre', '— Seleccionar rol —', isEdit ? usuario?.rol_id : null);
        this._populateSelect('uCargo', AppState.cargos, 'id', 'nombre', '— Sin cargo —', isEdit ? usuario?.cargo_id : null);
        this._populateSelect('uArea', AppState.areas, 'id', 'nombre', '— Sin área —', isEdit ? usuario?.area_id : null);
        this._populateSelect('uTurno', AppState.turnos, 'id', 'nombre', '— Sin turno —', isEdit ? usuario?.turno_id : null);

        // Bloqueo del campo Rol cuando aplica
        const rolSelect = document.getElementById('uRol');
        const rolHint = document.getElementById('rolLockHint');
        const rolBlocked = isSelf || (isLastAdmin && !isSelf);
        rolSelect.disabled = rolBlocked;
        rolSelect.classList.toggle('input-locked', rolBlocked);
        rolHint.classList.toggle('d-none', !rolBlocked);

        // Password: obligatoria solo al crear
        const pwdInput = document.getElementById('uPassword');
        const pwdLabel = document.getElementById('labelPassword');
        const pwdHint = document.getElementById('hintPassword');
        if (pwdInput) {
            pwdInput.required = !isEdit;
            pwdInput.placeholder = isEdit ? 'Dejar vacío para no cambiar' : 'Mínimo 8 caracteres';
        }
        if (pwdLabel) {
            pwdLabel.innerHTML = isEdit
                ? 'Contraseña <span class="text-muted" style="font-weight:400">(opcional)</span>'
                : 'Contraseña <span class="required">*</span>';
        }
        if (pwdHint) {
            pwdHint.textContent = isSelf
                ? 'Si cambias tu contraseña, se cerrará tu sesión actual.'
                : 'Mínimo 8 caracteres.';
        }

        if (isEdit) {
            document.getElementById('usuarioId').value = usuario.id;
            document.getElementById('uNombres').value = usuario.nombres || '';
            document.getElementById('uApellidos').value = usuario.apellidos || '';
            document.getElementById('uCodigo').value = usuario.codigo || '';
            document.getElementById('uDni').value = usuario.dni || '';
            document.getElementById('uTelefono').value = usuario.telefono || '';
            document.getElementById('uUsername').value = usuario.username || '';
            document.getElementById('uEmail').value = usuario.email || '';
        }

        openOverlay('modalUsuarioOverlay');
    },

    _populateSelect(selectId, items, valKey, labelKey, defaultLabel, selectedVal = null) {
        const sel = document.getElementById(selectId);
        if (!sel) return;
        sel.innerHTML = `<option value="">${defaultLabel}</option>` +
            items
                .filter(i => i.activo !== false)
                .map(i => `<option value="${i[valKey]}"${selectedVal != null && String(i[valKey]) === String(selectedVal) ? ' selected' : ''}>${escapeHtml(i[labelKey])}</option>`)
                .join('');
    },

    async openEdit(id) {
        if (!this._canEdit()) {
            showToast('No tienes permisos para editar usuarios', 'error');
            return;
        }
        try {
            const { data } = await http(`/api/usuarios/${id}`);
            this._openModal('edit', data);
        } catch (e) {
            showToast('No se pudo cargar el usuario: ' + e.message, 'error');
        }
    },

    toggleActivo(id, isCurrentlyActive, name) {
        // Defensa adicional client-side. El backend ya enforza esto.
        if (Auth.isSelf(id)) {
            showToast('No puedes cambiar el estado de tu propia cuenta', 'error');
            return;
        }
        if (isCurrentlyActive) {
            const target = AppState.usuarios.find(u => u.id === id);
            if (target && this._isLastActiveAdmin(target)) {
                showToast('No se puede desactivar al único administrador activo', 'error');
                return;
            }
            DeleteModal.open('desactivar', id, name, async () => {
                try {
                    await http(`/api/usuarios/${id}`, 'DELETE');
                    showToast(`"${name}" desactivado`, 'success');
                    await this.load();
                } catch (e) { showToast(e.message, 'error'); }
            });
        } else {
            DeleteModal.open('activar', id, name, async () => {
                try {
                    await http(`/api/usuarios/${id}/activate`, 'PATCH');
                    showToast(`"${name}" activado`, 'success');
                    await this.load();
                } catch (e) { showToast(e.message, 'error'); }
            });
        }
    },

    async _save() {
        if (!this._validate()) return;

        const id = document.getElementById('usuarioId').value;
        const isEdit = !!id;
        const isSelf = isEdit && Auth.isSelf(Number(id));
        const pwd = document.getElementById('uPassword').value;

        const body = {
            codigo: document.getElementById('uCodigo').value.trim(),
            nombres: document.getElementById('uNombres').value.trim(),
            apellidos: document.getElementById('uApellidos').value.trim(),
            dni: document.getElementById('uDni').value.trim() || null,
            cargo_id: parseInt(document.getElementById('uCargo').value) || null,
            area_id: parseInt(document.getElementById('uArea').value) || null,
            turno_id: parseInt(document.getElementById('uTurno').value) || null,
            telefono: document.getElementById('uTelefono').value.trim() || null,
            username: document.getElementById('uUsername').value.trim(),
            email: document.getElementById('uEmail').value.trim() || null,
        };

        // Solo enviar rol_id cuando NO es self-edit. Así el backend nunca recibe
        // un rol "igual al actual" desde el formulario propio (defensa en profundidad).
        if (!isSelf) {
            body.rol_id = parseInt(document.getElementById('uRol').value);
        }

        if (!isEdit || pwd) body.password = pwd;

        setLoading('btnSaveUsuario', 'btnSaveUsuarioText', 'btnSaveUsuarioSpinner', true);
        try {
            const res = await http(
                isEdit ? `/api/usuarios/${id}` : '/api/usuarios',
                isEdit ? 'PUT' : 'POST',
                body
            );

            // Cambio de contraseña propia → forzar relogin
            if (res?.data?.requires_relogin) {
                showToast('Contraseña actualizada. Por seguridad debes iniciar sesión de nuevo.', 'info');
                closeOverlay('modalUsuarioOverlay');
                Auth.forceLogout('Tu contraseña fue cambiada. Vuelve a iniciar sesión.');
                return;
            }

            showToast(`Usuario ${isEdit ? 'actualizado' : 'creado'} correctamente`, 'success');
            closeOverlay('modalUsuarioOverlay');

            // Si edité a alguien (no a mí) sus permisos pudieron cambiar; refresco mi sesión.
            if (!isSelf) await Auth.refresh().catch(() => {});

            await this.load();
        } catch (e) {
            // Mapeo de códigos de error a mensajes amigables
            const map = {
                SELF_ROLE_CHANGE: 'No puedes cambiar tu propio rol.',
                LAST_ADMIN: 'No se puede dejar al sistema sin administrador activo.',
                USERNAME_EXISTS: 'Ese username ya está en uso.',
                CODIGO_EXISTS: 'Ese código interno ya está en uso.',
            };
            showToast(map[e.code] || e.message, 'error');
        } finally {
            setLoading('btnSaveUsuario', 'btnSaveUsuarioText', 'btnSaveUsuarioSpinner', false);
        }
    },

    /* ── Validación ──────────────────────────── */
    _validate() {
        const fields = ['uNombres', 'uApellidos', 'uCodigo', 'uDni', 'uRol', 'uUsername', 'uPassword', 'uEmail', 'uTelefono'];
        clearErrors(fields);
        let ok = true;

        const nombres = document.getElementById('uNombres').value.trim();
        const apellidos = document.getElementById('uApellidos').value.trim();
        const codigo = document.getElementById('uCodigo').value.trim();
        const dni = document.getElementById('uDni').value.trim();
        const username = document.getElementById('uUsername').value.trim();
        const email = document.getElementById('uEmail').value.trim();
        const telefono = document.getElementById('uTelefono').value.trim();
        const password = document.getElementById('uPassword').value;
        const id = document.getElementById('usuarioId').value;
        const isEdit = !!id;
        const isSelf = isEdit && Auth.isSelf(Number(id));

        if (!nombres) { setError('uNombres', 'err-uNombres', 'Los nombres son requeridos'); ok = false; }
        if (!apellidos) { setError('uApellidos', 'err-uApellidos', 'Los apellidos son requeridos'); ok = false; }

        if (!codigo) { setError('uCodigo', 'err-uCodigo', 'El código interno es requerido'); ok = false; }
        else if (codigo.length > 20) { setError('uCodigo', 'err-uCodigo', 'Máximo 20 caracteres'); ok = false; }

        if (dni && !/^\d{8,12}$/.test(dni)) { setError('uDni', 'err-uDni', 'DNI debe tener entre 8 y 12 dígitos'); ok = false; }

        if (!username) { setError('uUsername', 'err-uUsername', 'El nombre de usuario es requerido'); ok = false; }
        else if (!/^[a-zA-Z0-9._-]{3,50}$/.test(username)) {
            setError('uUsername', 'err-uUsername', 'Solo letras, números, punto, guion y guion bajo (3–50)');
            ok = false;
        }

        // Rol: solo se valida si NO es self-edit (en self-edit el campo está bloqueado).
        if (!isSelf) {
            if (!document.getElementById('uRol').value) {
                setError('uRol', 'err-uRol', 'Selecciona un rol'); ok = false;
            }
        }

        if (!isEdit && !password) {
            setError('uPassword', 'err-uPassword', 'La contraseña es requerida'); ok = false;
        } else if (password && password.length < 8) {
            setError('uPassword', 'err-uPassword', 'Mínimo 8 caracteres'); ok = false;
        }

        if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
            setError('uEmail', 'err-uEmail', 'Email inválido'); ok = false;
        }

        if (telefono && !/^\+?[\d\s-]{6,20}$/.test(telefono)) {
            setError('uTelefono', 'err-uTelefono', 'Teléfono inválido'); ok = false;
        }

        return ok;
    },

    /* ── Listeners ───────────────────────────── */
    _bindEvents() {
        document.getElementById('btnNuevoUsuario')?.addEventListener('click', () => {
            if (!this._canCreate()) {
                showToast('No tienes permisos para crear usuarios', 'error');
                return;
            }
            this._openModal('new');
        });
        document.getElementById('btnSaveUsuario')?.addEventListener('click', () => this._save());
        document.getElementById('btnCancelUsuario')?.addEventListener('click', () => closeOverlay('modalUsuarioOverlay'));
        document.getElementById('btnCloseModalUsuario')?.addEventListener('click', () => closeOverlay('modalUsuarioOverlay'));
        document.getElementById('btnRefreshUsuarios')?.addEventListener('click', () => this.load());
        document.getElementById('searchUsuario')?.addEventListener('input', () => this._filter());
        document.getElementById('filterRol')?.addEventListener('change', () => this._filter());
        document.getElementById('filterActivo')?.addEventListener('change', () => this._filter());
        document.getElementById('modalUsuarioOverlay')?.addEventListener('click', e => {
            if (e.target.id === 'modalUsuarioOverlay') closeOverlay('modalUsuarioOverlay');
        });
    },
};
