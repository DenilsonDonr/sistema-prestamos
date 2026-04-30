/**
 * modules/usuarios.js
 * Solo conoce el DOM de views/usuarios.html
 */

'use strict';

const UsuariosModule = {

    async init() {
        // Cargar catálogos necesarios para los selects del modal
        const pendientes = [];

        if (!AppState.cargos.length)
            pendientes.push(http('/api/catalogos/cargos').then(r => { AppState.cargos = r.data; }).catch(() => { }));
        if (!AppState.areas.length)
            pendientes.push(http('/api/catalogos/areas').then(r => { AppState.areas = r.data; }).catch(() => { }));
        if (!AppState.turnos.length)
            pendientes.push(http('/api/catalogos/turnos').then(r => { AppState.turnos = r.data; }).catch(() => { }));
        if (!AppState.roles.length)
            pendientes.push(http('/api/roles').then(r => { AppState.roles = r.data; }).catch(() => { }));

        await Promise.all(pendientes);

        this._bindEvents();
        await this.load();
    },

    async load() {
        document.getElementById('bodyUsuarios').innerHTML =
            `<tr><td colspan="7" class="text-center py-5"><div class="spinner-custom"></div></td></tr>`;

        try {
            const res = await http('/api/usuarios?limit=100');
            // El endpoint devuelve { data: { data: [...], total, limit, offset } }
            AppState.usuarios = res.data.data ?? res.data;
            this._render(AppState.usuarios);
            this._populateFilterRol();
            updateBadges();
        } catch (e) {
            showToast('Error al cargar usuarios: ' + e.message, 'error');
        }
    },

    _render(lista) {
        setText('totalUsuariosLabel', `${lista.length} usuario(s) encontrado(s)`);
        const tbody = document.getElementById('bodyUsuarios');
        const currentUserId = getCurrentUser()?.id;

        if (!lista.length) {
            tbody.innerHTML = `<tr><td colspan="7"><div class="empty-state">
        <i class="bi bi-people"></i><p>No hay usuarios que mostrar</p>
      </div></td></tr>`;
            return;
        }

        tbody.innerHTML = lista.map((u, i) => {
            const isSelf = currentUserId != null && u.id === currentUserId;
            const isActive = !!u.activo;

            const toggleBtn = isSelf
                ? `<button class="btn-action" disabled title="No puedes cambiar el estado de tu propia cuenta"
                    style="opacity:.35;cursor:not-allowed;color:var(--text-muted)">
                    <i class="bi bi-toggle-on" style="font-size:17px"></i>
                  </button>`
                : isActive
                    ? `<button class="btn-action" title="Desactivar usuario"
                        onclick="UsuariosModule.toggleActivo(${u.id},true,'${escapeHtml(u.nombres + ' ' + u.apellidos)}')"
                        style="color:#ef4444">
                        <i class="bi bi-toggle-on" style="font-size:17px"></i>
                       </button>`
                    : `<button class="btn-action" title="Activar usuario"
                        onclick="UsuariosModule.toggleActivo(${u.id},false,'${escapeHtml(u.nombres + ' ' + u.apellidos)}')"
                        style="color:#16a34a">
                        <i class="bi bi-toggle-off" style="font-size:17px"></i>
                       </button>`;

            return `
      <tr${isSelf ? ' class="row-self"' : ''}>
        <td><span style="font-family:'DM Mono',monospace;font-size:12px;color:var(--text-muted)">${String(i + 1).padStart(2, '0')}</span></td>
        <td>
          <div style="font-weight:600">${escapeHtml(u.nombres)} ${escapeHtml(u.apellidos)}${isSelf ? ' <span style="font-size:11px;color:var(--text-muted);font-weight:400">(tú)</span>' : ''}</div>
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
          <button class="btn-action btn-action-edit"
            onclick="UsuariosModule.openEdit(${u.id})" title="Editar">
            <i class="bi bi-pencil-fill"></i>
          </button>
          ${toggleBtn}
        </td>
      </tr>`;
        }).join('');
    },

    /* ── Filtros ─────────────────────────── */
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

    _filter() {

    },

    /* ── Modal ───────────────────────────── */
    _openModal(mode, usuario = null) {
        const isEdit = mode === 'edit';
        setText('modalUsuarioTitle', isEdit ? 'Editar Usuario' : 'Nuevo Usuario');
        setText('modalUsuarioSubtitle', isEdit
            ? `Editando: ${usuario.nombres} ${usuario.apellidos}`
            : 'Completa los campos del formulario');

        // Limpiar campos
        ['usuarioId', 'uNombres', 'uApellidos', 'uCodigo', 'uDni',
            'uTelefono', 'uUsername', 'uPassword', 'uEmail']
            .forEach(id => { const el = document.getElementById(id); if (el) el.value = ''; });
        clearErrors(['uNombres', 'uApellidos', 'uCodigo', 'uDni', 'uRol', 'uUsername', 'uPassword', 'uEmail']);

        // Poblar selects
        this._populateSelect('uRol', AppState.roles, 'id', 'nombre', '— Seleccionar rol —', isEdit ? usuario?.rol_id : null);
        this._populateSelect('uCargo', AppState.cargos, 'id', 'nombre', '— Sin cargo —', isEdit ? usuario?.cargo_id : null);
        this._populateSelect('uArea', AppState.areas, 'id', 'nombre', '— Sin área —', isEdit ? usuario?.area_id : null);
        this._populateSelect('uTurno', AppState.turnos, 'id', 'nombre', '— Sin turno —', isEdit ? usuario?.turno_id : null);

        // Password: obligatoria solo al crear
        const pwdInput = document.getElementById('uPassword');
        const pwdLabel = document.getElementById('labelPassword');
        if (pwdInput) {
            pwdInput.required = !isEdit;
            pwdInput.placeholder = isEdit ? 'Dejar vacío para no cambiar' : 'Contraseña *';
        }
        if (pwdLabel)
            pwdLabel.innerHTML = isEdit
                ? 'Contraseña <span class="text-muted" style="font-weight:400">(opcional)</span>'
                : 'Contraseña <span class="required">*</span>';

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
        try {
            const { data } = await http(`/api/usuarios/${id}`);
            this._openModal('edit', data);
        } catch (e) {
            showToast('No se pudo cargar el usuario: ' + e.message, 'error');
        }
    },

    toggleActivo(id, isCurrentlyActive, name) {
        if (isCurrentlyActive) {
            DeleteModal.open('desactivar', id, name, async () => {
                try {
                    await http(`/api/usuarios/${id}`, 'DELETE');
                    showToast(`"${name}" desactivado`, 'success');
                    await this.load();
                } catch (e) {
                    showToast(e.message, 'error');
                }
            });
        } else {
            DeleteModal.open('activar', id, name, async () => {
                try {
                    await http(`/api/usuarios/${id}/activate`, 'PATCH');
                    showToast(`"${name}" activado`, 'success');
                    await this.load();
                } catch (e) {
                    showToast(e.message, 'error');
                }
            });
        }
    },

    async _save() {
        if (!this._validate()) return;

        const id = document.getElementById('usuarioId').value;
        const isEdit = !!id;
        const pwd = document.getElementById('uPassword').value;

        const body = {
            rol_id: parseInt(document.getElementById('uRol').value),
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

        if (!isEdit || pwd) body.password = pwd;

        setLoading('btnSaveUsuario', 'btnSaveUsuarioText', 'btnSaveUsuarioSpinner', true);
        try {
            await http(
                isEdit ? `/api/usuarios/${id}` : '/api/usuarios',
                isEdit ? 'PUT' : 'POST',
                body
            );
            showToast(`Usuario ${isEdit ? 'actualizado' : 'creado'} correctamente`, 'success');
            closeOverlay('modalUsuarioOverlay');
            await this.load();
        } catch (e) {
            showToast(e.message, 'error');
        } finally {
            setLoading('btnSaveUsuario', 'btnSaveUsuarioText', 'btnSaveUsuarioSpinner', false);
        }
    },

    _validate() {
        clearErrors(['uNombres', 'uApellidos', 'uCodigo', 'uRol', 'uUsername', 'uPassword']);
        let ok = true;

        if (!document.getElementById('uNombres').value.trim()) { setError('uNombres', 'err-uNombres', 'Los nombres son requeridos'); ok = false; }
        if (!document.getElementById('uApellidos').value.trim()) { setError('uApellidos', 'err-uApellidos', 'Los apellidos son requeridos'); ok = false; }
        if (!document.getElementById('uCodigo').value.trim()) { setError('uCodigo', 'err-uCodigo', 'El código interno es requerido'); ok = false; }
        if (!document.getElementById('uRol').value) { setError('uRol', 'err-uRol', 'Selecciona un rol'); ok = false; }
        if (!document.getElementById('uUsername').value.trim()) { setError('uUsername', 'err-uUsername', 'El nombre de usuario es requerido'); ok = false; }

        const isEdit = !!document.getElementById('usuarioId').value;
        if (!isEdit && !document.getElementById('uPassword').value) { setError('uPassword', 'err-uPassword', 'La contraseña es requerida'); ok = false; }

        return ok;
    },

    /* ── Listeners ───────────────────────── */
    _bindEvents() {
        document.getElementById('btnNuevoUsuario')?.addEventListener('click', () => this._openModal('new'));
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
