/**
 * modules/herramientas.js
 * Solo conoce el DOM de views/herramientas.html
 */

'use strict';

// Descripciones de fallback para cuando estados_herramienta.descripcion es NULL
function _estadoDescFallback(nombre) {
    const map = {
        bueno:    'Unidad en buen estado. Disponible para préstamo.',
        regular:  'Unidad funcional con desgaste. Disponible para préstamo.',
        malo:     'Unidad dañada o inoperable. No disponible para préstamo.',
        prestado: 'Unidad actualmente prestada. Se asigna automáticamente.',
        baja:     'Unidad dada de baja definitivamente. No puede prestarse.',
    };
    return map[nombre] ?? 'Sin descripción disponible.';
}

const HerramientasModule = {

    _lista: [],
    // herramienta actualmente abierta en el panel de unidades
    _unidadesHerramientaId: null,

    async init() {
        const pendientes = [];

        if (!AppState.tiposHerramienta.length)
            pendientes.push(
                http('/api/catalogos/tipos-herramienta')
                    .then(r => { AppState.tiposHerramienta = r.data; })
                    .catch(() => {})
            );
        if (!AppState.marcas.length)
            pendientes.push(
                http('/api/catalogos/marcas')
                    .then(r => { AppState.marcas = r.data; })
                    .catch(() => {})
            );
        if (!AppState.ubicaciones.length)
            pendientes.push(
                http('/api/catalogos/ubicaciones')
                    .then(r => { AppState.ubicaciones = r.data; })
                    .catch(() => {})
            );
        if (!AppState.estadosHerramienta.length)
            pendientes.push(
                http('/api/catalogos/estados-herramienta')
                    .then(r => { AppState.estadosHerramienta = r.data; })
                    .catch(() => {})
            );

        await Promise.all(pendientes);

        this._bindEvents();
        this._populateFilterTipo();
        await this.load();
    },

    async load() {
        const CACHE_TTL = 30_000;
        const cached = AppState.herramientas.length && (Date.now() - (AppState._ts.herramientas ?? 0)) < CACHE_TTL;

        if (cached) {
            this._lista = AppState.herramientas;
            this._applyFilters();
            return;
        }

        document.getElementById('bodyHerramientas').innerHTML =
            `<tr><td colspan="8" class="text-center py-5"><div class="spinner-custom"></div></td></tr>`;

        try {
            const res = await http('/api/herramientas');
            this._lista = res.data ?? res;
            AppState.herramientas = this._lista;
            AppState._ts.herramientas = Date.now();
            this._applyFilters();
            updateBadges();
        } catch (e) {
            showToast('Error al cargar herramientas: ' + e.message, 'error');
        }
    },

    _render(lista) {
        setText('totalHerramientasLabel', `${lista.length} herramienta(s) encontrada(s)`);
        const tbody = document.getElementById('bodyHerramientas');

        if (!lista.length) {
            tbody.innerHTML = `<tr><td colspan="8"><div class="empty-state">
        <i class="bi bi-tools"></i><p>No hay herramientas que mostrar</p>
      </div></td></tr>`;
            return;
        }

        tbody.innerHTML = lista.map(h => {
            const isActive = !!h.activo;

            const stockNum = Number(h.stock_disponible ?? 0);
            const stockMin = Number(h.stock_minimo ?? 0);
            let stockColor = '#16a34a', stockBg = '#dcfce7';
            if (stockNum === 0)          { stockColor = '#dc2626'; stockBg = '#fee2e2'; }
            else if (stockNum <= stockMin) { stockColor = '#d97706'; stockBg = '#fef3c7'; }

            const marcaModelo = [
                h.marca_nombre ? escapeHtml(h.marca_nombre) : null,
                h.modelo_nombre ? escapeHtml(h.modelo_nombre) : null,
            ].filter(Boolean).join(' / ') || '<span class="text-muted">—</span>';

            const toggleBtn = isActive
                ? `<button class="btn-action" title="Desactivar"
                     onclick="HerramientasModule.toggleActivo(${h.id},true,'${escapeHtml(h.nombre)}')"
                     style="color:#ef4444">
                     <i class="bi bi-toggle-on" style="font-size:17px"></i>
                   </button>`
                : `<button class="btn-action" title="Activar"
                     onclick="HerramientasModule.toggleActivo(${h.id},false,'${escapeHtml(h.nombre)}')"
                     style="color:#16a34a">
                     <i class="bi bi-toggle-off" style="font-size:17px"></i>
                   </button>`;

            return `
      <tr>
        <td><span style="font-family:'DM Mono',monospace;font-size:12px;color:var(--text-muted)">${escapeHtml(h.codigo)}</span></td>
        <td>
          <div style="font-weight:600">${escapeHtml(h.nombre)}</div>
          ${h.descripcion ? `<div style="font-size:12px;color:var(--text-muted)">${escapeHtml(h.descripcion)}</div>` : ''}
        </td>
        <td>${h.tipo_nombre ? `<span class="badge-marca">${escapeHtml(h.tipo_nombre)}</span>` : '<span class="text-muted">—</span>'}</td>
        <td style="font-size:13px">${marcaModelo}</td>
        <td style="font-size:13px">${h.ubicacion_nombre ? escapeHtml(h.ubicacion_nombre) : '<span class="text-muted">—</span>'}</td>
        <td>
          <span style="display:inline-flex;align-items:center;gap:4px;font-size:13px;font-weight:700;
            color:${stockColor};background:${stockBg};padding:2px 8px;border-radius:99px;cursor:default"
            title="${stockNum} unidad(es) disponible(s)${stockMin > 0 ? ` · mínimo configurado: ${stockMin}` : ' · sin alerta de mínimo configurada'}">
            ${stockNum}
          </span>
        </td>
        <td>
          ${isActive
              ? '<span style="display:inline-flex;align-items:center;gap:4px;font-size:12px;font-weight:600;color:#16a34a"><i class="bi bi-circle-fill" style="font-size:7px"></i>Activo</span>'
              : '<span style="display:inline-flex;align-items:center;gap:4px;font-size:12px;font-weight:600;color:var(--text-muted)"><i class="bi bi-circle-fill" style="font-size:7px"></i>Inactivo</span>'}
        </td>
        <td style="white-space:nowrap">
          <button class="btn-action" title="Ver y gestionar unidades físicas"
            onclick="HerramientasModule.openUnidades(${h.id},'${escapeHtml(h.nombre)}')"
            style="color:var(--primary)">
            <i class="bi bi-boxes"></i>
          </button>
          <button class="btn-action btn-action-edit"
            onclick="HerramientasModule.openEdit(${h.id})" title="Editar">
            <i class="bi bi-pencil-fill"></i>
          </button>
          ${toggleBtn}
        </td>
      </tr>`;
        }).join('');
    },

    /* ── Filtros ─────────────────────────── */
    _populateFilterTipo() {
        const sel = document.getElementById('filterTipo');
        if (!sel) return;
        sel.innerHTML = `<option value="">Todos los tipos</option>` +
            AppState.tiposHerramienta
                .filter(t => t.activo !== false)
                .map(t => `<option value="${t.id}">${escapeHtml(t.nombre)}</option>`)
                .join('');
    },

    _applyFilters() {
        const search = (document.getElementById('searchHerramienta')?.value ?? '').toLowerCase();
        const tipoId = document.getElementById('filterTipo')?.value ?? '';
        const activo = document.getElementById('filterActivoH')?.value ?? '';

        const filtered = this._lista.filter(h => {
            if (search && !h.nombre.toLowerCase().includes(search) && !h.codigo.toLowerCase().includes(search))
                return false;
            if (tipoId && String(h.tipo_id) !== tipoId) return false;
            if (activo === 'true'  && !h.activo) return false;
            if (activo === 'false' &&  h.activo) return false;
            return true;
        });

        this._render(filtered);
    },

    /* ══════════════════════════════════════
       UNIDADES
    ══════════════════════════════════════ */
    async openUnidades(herramientaId, nombre) {
        this._unidadesHerramientaId = herramientaId;
        setText('modalUnidadesTitle',    `Unidades — ${nombre}`);
        setText('modalUnidadesSubtitle', 'Unidades físicas registradas para esta herramienta');
        setText('totalUnidadesLabel', '');

        // Leyenda dinámica de estados
        const legend = document.getElementById('unidadesEstadoLegend');
        if (legend) {
            legend.innerHTML = AppState.estadosHerramienta
                .filter(e => e.activo !== false)
                .map(e => `<span class="stock-legend-item">
                    <span style="width:8px;height:8px;border-radius:50%;background:${e.color || '#6b7280'};display:inline-block"></span>
                    ${escapeHtml(e.nombre)}
                  </span>`)
                .join('');
        }
        document.getElementById('unidadesContent').innerHTML =
            `<div class="d-flex justify-content-center py-5"><div class="spinner-custom"></div></div>`;
        openOverlay('modalUnidadesOverlay');
        await this._loadUnidades(herramientaId);
    },

    async _loadUnidades(herramientaId) {
        try {
            const res = await http(`/api/unidades?herramienta_id=${herramientaId}`);
            const unidades = res.data ?? res;
            this._renderUnidades(unidades);
        } catch (e) {
            document.getElementById('unidadesContent').innerHTML =
                `<p class="text-muted text-center py-4">Error al cargar unidades: ${escapeHtml(e.message)}</p>`;
        }
    },

    _renderUnidades(unidades) {
        setText('totalUnidadesLabel', `${unidades.length} unidad(es)`);
        const container = document.getElementById('unidadesContent');

        if (!unidades.length) {
            container.innerHTML = `<div class="empty-state" style="padding:40px 20px">
        <i class="bi bi-box-seam"></i>
        <p>Sin unidades registradas — se crean automáticamente al registrar una compra.</p>
      </div>`;
            return;
        }

        const rows = unidades.map(u => {
            const color = u.estado_color || '#6b7280';
            return `
        <tr>
          <td><span style="font-family:'DM Mono',monospace;font-size:12px">${escapeHtml(u.codigo_unidad)}</span></td>
          <td style="font-size:12px">${u.numero_serie ? escapeHtml(u.numero_serie) : '<span class="text-muted">—</span>'}</td>
          <td>
            <span style="display:inline-flex;align-items:center;gap:5px;font-size:12px;font-weight:600;
              color:${color};background:${color}18;padding:2px 8px;border-radius:99px">
              <i class="bi bi-circle-fill" style="font-size:6px"></i>${escapeHtml(u.estado_nombre)}
            </span>
          </td>
          <td style="font-size:12px">${u.compra_codigo
              ? `<span style="font-family:'DM Mono',monospace">${escapeHtml(u.compra_codigo)}</span>`
              : '<span class="text-muted" title="Inventario inicial">—</span>'}</td>
          <td style="font-size:12px">${formatFecha(u.fecha_ingreso?.split('T')[0] ?? u.fecha_ingreso)}</td>
          <td style="font-size:12px;max-width:120px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap"
            title="${u.observaciones ? escapeHtml(u.observaciones) : ''}">
            ${u.observaciones ? escapeHtml(u.observaciones) : '<span class="text-muted">—</span>'}
          </td>
          <td>
            <button class="btn-action btn-action-edit" title="Cambiar estado"
              onclick="HerramientasModule.openEditEstado(${u.id},'${escapeHtml(u.codigo_unidad)}',${u.estado_id},'${escapeHtml(u.observaciones ?? '')}')">
              <i class="bi bi-pencil-fill"></i>
            </button>
          </td>
        </tr>`;
        }).join('');

        container.innerHTML = `
      <div class="table-responsive">
        <table class="table-custom">
          <thead>
            <tr>
              <th>Código unidad</th>
              <th>N° Serie</th>
              <th>Estado</th>
              <th>Compra</th>
              <th>Ingreso</th>
              <th>Observaciones</th>
              <th style="width:50px"></th>
            </tr>
          </thead>
          <tbody>${rows}</tbody>
        </table>
      </div>`;
    },

    /* ── Modal editar estado ─────────────── */
    openEditEstado(unidadId, codigoUnidad, estadoIdActual, obsActual) {
        document.getElementById('editEstadoUnidadId').value = unidadId;
        setText('editEstadoSubtitle', codigoUnidad);
        document.getElementById('editEstadoObs').value = obsActual || '';
        document.getElementById('err-editEstado').textContent = '';

        // Poblar select de estados (solo físicos: bueno, regular, malo)
        const sel = document.getElementById('editEstadoSelect');
        sel.innerHTML = '<option value="">— Seleccionar —</option>' +
            AppState.estadosHerramienta
                .filter(e => e.activo !== false)
                .map(e => `<option value="${e.id}"${e.id === estadoIdActual ? ' selected' : ''}>${escapeHtml(e.nombre)}</option>`)
                .join('');

        this._updateEstadoHint(estadoIdActual);
        openOverlay('modalEditEstadoOverlay');
    },

    _updateEstadoHint(estadoId) {
        const hint = document.getElementById('editEstadoHint');
        if (!hint) return;

        if (!estadoId) {
            hint.innerHTML = `<i class="bi bi-info-circle"></i><span>Selecciona un estado para ver su descripción.</span>`;
            return;
        }

        const estado = AppState.estadosHerramienta.find(e => String(e.id) === String(estadoId));
        if (!estado) return;

        const dot   = `<span style="width:9px;height:9px;border-radius:50%;background:${estado.color || '#6b7280'};display:inline-block;flex-shrink:0;margin-top:2px"></span>`;
        const desc  = estado.descripcion
            ? escapeHtml(estado.descripcion)
            : _estadoDescFallback(estado.nombre);

        hint.innerHTML = `${dot}<span><strong>${escapeHtml(estado.nombre)}</strong> — ${desc}</span>`;
    },

    async _saveEstado() {
        const unidadId = document.getElementById('editEstadoUnidadId').value;
        const estadoId = parseInt(document.getElementById('editEstadoSelect').value);
        const obs      = document.getElementById('editEstadoObs').value.trim();

        document.getElementById('err-editEstado').textContent = '';
        if (!estadoId) {
            document.getElementById('err-editEstado').textContent = 'Selecciona un estado';
            return;
        }

        const body = { estado_id: estadoId };
        if (obs) body.observaciones = obs;

        setLoading('btnSaveEditEstado', 'btnSaveEditEstadoText', 'btnSaveEditEstadoSpinner', true);
        try {
            await http(`/api/unidades/${unidadId}`, 'PUT', body);
            showToast('Estado actualizado correctamente', 'success');
            closeOverlay('modalEditEstadoOverlay');
            await this._loadUnidades(this._unidadesHerramientaId);
            AppState._ts.herramientas = 0;
            await this.load();
        } catch (e) {
            showToast(e.message, 'error');
        } finally {
            setLoading('btnSaveEditEstado', 'btnSaveEditEstadoText', 'btnSaveEditEstadoSpinner', false);
        }
    },

    /* ── Modal herramienta (crear/editar) ── */
    async _openModal(mode, herramienta = null) {
        const isEdit = mode === 'edit';
        setText('modalHerramientaTitle',    isEdit ? 'Editar Herramienta' : 'Nueva Herramienta');
        setText('modalHerramientaSubtitle', isEdit
            ? `Editando: ${herramienta.nombre}`
            : 'Completa los campos del formulario');

        ['herramientaId','hNombre','hDescripcion','hStockMinimo'].forEach(id => {
            const el = document.getElementById(id);
            if (el) el.value = id === 'hStockMinimo' ? '0' : '';
        });
        clearErrors(['hNombre','hTipo','hUbicacion','hMarca','hModelo','hStockMinimo']);

        this._populateSelect('hTipo',      AppState.tiposHerramienta, 'id', 'nombre', '— Seleccionar tipo —',      isEdit ? herramienta?.tipo_id     : null);
        this._populateSelect('hUbicacion', AppState.ubicaciones,       'id', 'nombre', '— Seleccionar ubicación —', isEdit ? herramienta?.ubicacion_id : null);
        this._populateSelect('hMarca',     AppState.marcas,             'id', 'nombre', '— Seleccionar marca —',     isEdit ? herramienta?.marca_id     : null);

        const hModelo = document.getElementById('hModelo');
        hModelo.innerHTML = '<option value="">— Selecciona una marca primero —</option>';
        hModelo.disabled = true;

        if (isEdit) {
            document.getElementById('herramientaId').value = herramienta.id;
            document.getElementById('hNombre').value       = herramienta.nombre      || '';
            document.getElementById('hDescripcion').value  = herramienta.descripcion || '';
            document.getElementById('hStockMinimo').value  = herramienta.stock_minimo ?? 0;
            if (herramienta.marca_id) await this._loadModelos(herramienta.marca_id, herramienta.modelo_id);
        }

        openOverlay('modalHerramientaOverlay');
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

    async _loadModelos(marcaId, selectedModeloId = null) {
        const sel = document.getElementById('hModelo');
        sel.disabled = true;
        sel.innerHTML = '<option value="">Cargando…</option>';
        try {
            const res = await http(`/api/catalogos/modelos?marca_id=${marcaId}`);
            const modelos = res.data ?? res;
            AppState.modelos = modelos;
            if (!modelos.length) {
                sel.innerHTML = '<option value="">Sin modelos para esta marca</option>';
                return;
            }
            sel.innerHTML = '<option value="">— Seleccionar modelo —</option>' +
                modelos
                    .filter(m => m.activo !== false)
                    .map(m => `<option value="${m.id}"${selectedModeloId != null && String(m.id) === String(selectedModeloId) ? ' selected' : ''}>${escapeHtml(m.nombre)}</option>`)
                    .join('');
            sel.disabled = false;
        } catch {
            sel.innerHTML = '<option value="">Error al cargar modelos</option>';
        }
    },

    async openEdit(id) {
        try {
            const { data } = await http(`/api/herramientas/${id}`);
            await this._openModal('edit', data);
        } catch (e) {
            showToast('No se pudo cargar la herramienta: ' + e.message, 'error');
        }
    },

    toggleActivo(id, isCurrentlyActive, name) {
        if (isCurrentlyActive) {
            DeleteModal.open('desactivar-herramienta', id, name, async () => {
                try {
                    await http(`/api/herramientas/${id}`, 'DELETE');
                    showToast(`"${name}" desactivada`, 'success');
                    AppState._ts.herramientas = 0;
                    await this.load();
                } catch (e) { showToast(e.message, 'error'); }
            });
        } else {
            DeleteModal.open('activar-herramienta', id, name, async () => {
                try {
                    await http(`/api/herramientas/${id}`, 'PUT', { activo: true });
                    showToast(`"${name}" activada`, 'success');
                    AppState._ts.herramientas = 0;
                    await this.load();
                } catch (e) { showToast(e.message, 'error'); }
            });
        }
    },

    async _save() {
        if (!this._validate()) return;

        const id     = document.getElementById('herramientaId').value;
        const isEdit = !!id;
        const body   = {
            nombre:       document.getElementById('hNombre').value.trim(),
            descripcion:  document.getElementById('hDescripcion').value.trim() || null,
            tipo_id:      parseInt(document.getElementById('hTipo').value),
            marca_id:     parseInt(document.getElementById('hMarca').value),
            modelo_id:    parseInt(document.getElementById('hModelo').value),
            ubicacion_id: parseInt(document.getElementById('hUbicacion').value),
            stock_minimo: parseInt(document.getElementById('hStockMinimo').value) || 0,
        };

        setLoading('btnSaveHerramienta', 'btnSaveHerramientaText', 'btnSaveHerramientaSpinner', true);
        try {
            await http(
                isEdit ? `/api/herramientas/${id}` : '/api/herramientas',
                isEdit ? 'PUT' : 'POST',
                body
            );
            showToast(`Herramienta ${isEdit ? 'actualizada' : 'creada'} correctamente`, 'success');
            closeOverlay('modalHerramientaOverlay');
            AppState._ts.herramientas = 0;
            await this.load();
        } catch (e) {
            showToast(e.message, 'error');
        } finally {
            setLoading('btnSaveHerramienta', 'btnSaveHerramientaText', 'btnSaveHerramientaSpinner', false);
        }
    },

    _validate() {
        clearErrors(['hNombre','hTipo','hUbicacion','hMarca','hModelo']);
        let ok = true;
        if (!document.getElementById('hNombre').value.trim())    { setError('hNombre',    'err-hNombre',    'El nombre es requerido');       ok = false; }
        if (!document.getElementById('hTipo').value)             { setError('hTipo',      'err-hTipo',      'Selecciona un tipo');            ok = false; }
        if (!document.getElementById('hUbicacion').value)        { setError('hUbicacion', 'err-hUbicacion', 'Selecciona una ubicación');      ok = false; }
        if (!document.getElementById('hMarca').value)            { setError('hMarca',     'err-hMarca',     'Selecciona una marca');          ok = false; }
        if (!document.getElementById('hModelo').value)           { setError('hModelo',    'err-hModelo',    'Selecciona un modelo');          ok = false; }
        return ok;
    },

    /* ── Listeners ───────────────────────── */
    _bindEvents() {
        // Herramienta form
        document.getElementById('btnNuevaHerramienta')?.addEventListener('click',        () => this._openModal('new'));
        document.getElementById('btnSaveHerramienta')?.addEventListener('click',         () => this._save());
        document.getElementById('btnCancelHerramienta')?.addEventListener('click',       () => closeOverlay('modalHerramientaOverlay'));
        document.getElementById('btnCloseModalHerramienta')?.addEventListener('click',   () => closeOverlay('modalHerramientaOverlay'));
        document.getElementById('btnRefreshHerramientas')?.addEventListener('click',     () => this.load());
        document.getElementById('searchHerramienta')?.addEventListener('input',          () => this._applyFilters());
        document.getElementById('filterTipo')?.addEventListener('change',                () => this._applyFilters());
        document.getElementById('filterActivoH')?.addEventListener('change',             () => this._applyFilters());
        document.getElementById('modalHerramientaOverlay')?.addEventListener('click', e => {
            if (e.target.id === 'modalHerramientaOverlay') closeOverlay('modalHerramientaOverlay');
        });
        document.getElementById('hMarca')?.addEventListener('change', async e => {
            const marcaId = e.target.value;
            const hModelo = document.getElementById('hModelo');
            if (!marcaId) { hModelo.innerHTML = '<option value="">— Selecciona una marca primero —</option>'; hModelo.disabled = true; return; }
            await this._loadModelos(marcaId);
        });

        // Unidades panel
        document.getElementById('btnCloseModalUnidades')?.addEventListener('click',  () => closeOverlay('modalUnidadesOverlay'));
        document.getElementById('btnCloseUnidadesFooter')?.addEventListener('click', () => closeOverlay('modalUnidadesOverlay'));
        document.getElementById('modalUnidadesOverlay')?.addEventListener('click', e => {
            if (e.target.id === 'modalUnidadesOverlay') closeOverlay('modalUnidadesOverlay');
        });

        // Editar estado
        document.getElementById('btnSaveEditEstado')?.addEventListener('click',    () => this._saveEstado());
        document.getElementById('btnCancelEditEstado')?.addEventListener('click',  () => closeOverlay('modalEditEstadoOverlay'));
        document.getElementById('btnCloseEditEstado')?.addEventListener('click',   () => closeOverlay('modalEditEstadoOverlay'));
        document.getElementById('modalEditEstadoOverlay')?.addEventListener('click', e => {
            if (e.target.id === 'modalEditEstadoOverlay') closeOverlay('modalEditEstadoOverlay');
        });
        document.getElementById('editEstadoSelect')?.addEventListener('change', e => {
            this._updateEstadoHint(e.target.value);
        });
    },
};
