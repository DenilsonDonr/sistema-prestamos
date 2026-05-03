/**
 * modules/compras.js
 * Solo conoce el DOM de views/compras.html
 */

'use strict';

const ComprasModule = {

    _lista:   [],
    _detalle: [], // líneas del formulario activo: [{ herramienta_id, cantidad, precio_unitario }]

    async init() {
        const pendientes = [];

        if (!AppState.proveedores.length)
            pendientes.push(
                http('/api/proveedores')
                    .then(r => { AppState.proveedores = r.data; })
                    .catch(() => {})
            );
        if (!AppState.herramientas.length)
            pendientes.push(
                http('/api/herramientas')
                    .then(r => { AppState.herramientas = r.data; })
                    .catch(() => {})
            );

        await Promise.all(pendientes);

        this._bindEvents();
        await this.load();
    },

    async load() {
        document.getElementById('bodyCompras').innerHTML =
            `<tr><td colspan="9" class="text-center py-5"><div class="spinner-custom"></div></td></tr>`;

        try {
            const res = await http('/api/compras');
            this._lista = res.data ?? res;
            AppState.compras = this._lista;
            this._applyFilters();
            updateBadges();
        } catch (e) {
            showToast('Error al cargar compras: ' + e.message, 'error');
        }
    },

    _render(lista) {
        setText('totalComprasLabel', `${lista.length} compra(s) encontrada(s)`);
        const tbody = document.getElementById('bodyCompras');

        if (!lista.length) {
            tbody.innerHTML = `<tr><td colspan="9"><div class="empty-state">
        <i class="bi bi-bag-x"></i><p>No hay compras que mostrar</p>
      </div></td></tr>`;
            return;
        }

        tbody.innerHTML = lista.map(c => {
            const anulada = !!c.anulada;
            return `
      <tr${anulada ? ' style="opacity:.55"' : ''}>
        <td><span style="font-family:'DM Mono',monospace;font-size:12px;color:var(--text-muted)">${escapeHtml(c.codigo)}</span></td>
        <td style="font-weight:600">${escapeHtml(c.proveedor_razon_social)}</td>
        <td style="font-size:13px">${formatFecha(c.fecha_compra?.split('T')[0] ?? c.fecha_compra)}</td>
        <td style="font-size:13px">${c.numero_documento ? escapeHtml(c.numero_documento) : '<span class="text-muted">—</span>'}</td>
        <td style="text-align:right;font-family:'DM Mono',monospace;font-size:12px">S/ ${formatPrecio(c.subtotal)}</td>
        <td style="text-align:right;font-family:'DM Mono',monospace;font-size:12px">S/ ${formatPrecio(c.igv)}</td>
        <td style="text-align:right;font-family:'DM Mono',monospace;font-size:13px;font-weight:700">S/ ${formatPrecio(c.total)}</td>
        <td>
          ${anulada
              ? '<span style="display:inline-flex;align-items:center;gap:4px;font-size:12px;font-weight:600;color:#dc2626"><i class="bi bi-circle-fill" style="font-size:7px"></i>Anulada</span>'
              : '<span style="display:inline-flex;align-items:center;gap:4px;font-size:12px;font-weight:600;color:#16a34a"><i class="bi bi-circle-fill" style="font-size:7px"></i>Activa</span>'}
        </td>
        <td style="white-space:nowrap">
          <button class="btn-action btn-action-edit"
            onclick="ComprasModule.openDetalle(${c.id})" title="Ver detalle">
            <i class="bi bi-eye-fill"></i>
          </button>
          ${!anulada
              ? `<button class="btn-action" title="Anular compra"
                   onclick="ComprasModule.confirmarAnular(${c.id},'${escapeHtml(c.codigo)}')"
                   style="color:#ef4444">
                   <i class="bi bi-x-circle-fill"></i>
                 </button>`
              : ''}
        </td>
      </tr>`;
        }).join('');
    },

    /* ── Filtros ─────────────────────────── */
    _applyFilters() {
        const search = (document.getElementById('searchCompra')?.value ?? '').toLowerCase();
        const estado = document.getElementById('filterEstadoCompra')?.value ?? '';

        const filtered = this._lista.filter(c => {
            if (search && !c.codigo.toLowerCase().includes(search) &&
                !(c.numero_documento ?? '').toLowerCase().includes(search) &&
                !c.proveedor_razon_social.toLowerCase().includes(search))
                return false;
            if (estado === 'activa'  &&  c.anulada) return false;
            if (estado === 'anulada' && !c.anulada) return false;
            return true;
        });

        this._render(filtered);
    },

    /* ── Modal formulario ────────────────── */
    _openFormModal() {
        this._detalle = [];

        // Resetear cabecera
        ['cProveedor','cFecha','cNumDoc','cObservaciones'].forEach(id => {
            const el = document.getElementById(id);
            if (el) el.value = '';
        });
        clearErrors(['cProveedor','cFecha','detalle']);
        document.getElementById('err-detalle').textContent = '';

        // Poblar proveedor
        const sel = document.getElementById('cProveedor');
        sel.innerHTML = '<option value="">— Seleccionar proveedor —</option>' +
            AppState.proveedores
                .filter(p => p.activo !== false)
                .map(p => `<option value="${p.id}">${escapeHtml(p.razon_social)}</option>`)
                .join('');

        // Fecha por defecto: hoy
        document.getElementById('cFecha').value = new Date().toISOString().slice(0, 10);

        // Limpiar tabla de detalle y totales
        this._renderDetalleTable();
        this._recalcTotals();

        // Agregar una línea inicial vacía
        this._addLinea();

        openOverlay('modalCompraFormOverlay');
    },

    _addLinea() {
        this._detalle.push({ herramienta_id: '', cantidad: 1, precio_unitario: '' });
        this._renderDetalleTable();
    },

    _removeLinea(index) {
        this._detalle.splice(index, 1);
        this._renderDetalleTable();
        this._recalcTotals();
    },

    _renderDetalleTable() {
        const tbody = document.getElementById('bodyDetalle');
        if (!tbody) return;

        if (!this._detalle.length) {
            tbody.innerHTML = `<tr><td colspan="5" class="text-center" style="padding:20px;color:var(--text-muted);font-size:13px">
        Sin líneas — haz clic en "Agregar línea"
      </td></tr>`;
            return;
        }

        const herramientaOpts = '<option value="">— Seleccionar —</option>' +
            AppState.herramientas
                .filter(h => h.activo !== false)
                .map(h => `<option value="${h.id}">${escapeHtml(h.codigo)} — ${escapeHtml(h.nombre)}</option>`)
                .join('');

        tbody.innerHTML = this._detalle.map((linea, i) => {
            const sub = (Number(linea.cantidad) || 0) * (Number(linea.precio_unitario) || 0);
            return `
        <tr id="lineaRow-${i}">
          <td>
            <select class="input-custom input-sm" onchange="ComprasModule._onLineaChange(${i},'herramienta_id',this.value)">
              ${herramientaOpts.replace(`value="${linea.herramienta_id}"`, `value="${linea.herramienta_id}" selected`)}
            </select>
          </td>
          <td>
            <input type="number" class="input-custom input-sm" min="1" step="1"
              value="${linea.cantidad}"
              onchange="ComprasModule._onLineaChange(${i},'cantidad',this.value)"
              oninput="ComprasModule._onLineaChange(${i},'cantidad',this.value)" />
          </td>
          <td>
            <input type="number" class="input-custom input-sm" min="0.01" step="0.01"
              placeholder="0.00"
              value="${linea.precio_unitario}"
              onchange="ComprasModule._onLineaChange(${i},'precio_unitario',this.value)"
              oninput="ComprasModule._onLineaChange(${i},'precio_unitario',this.value)" />
          </td>
          <td style="text-align:right;font-family:'DM Mono',monospace;font-size:12px;padding-right:8px">
            S/ <span id="sub-${i}">${formatPrecio(sub)}</span>
          </td>
          <td style="text-align:center">
            <button type="button" class="btn-action" title="Quitar línea"
              onclick="ComprasModule._removeLinea(${i})" style="color:#ef4444">
              <i class="bi bi-trash3-fill"></i>
            </button>
          </td>
        </tr>`;
        }).join('');
    },

    _onLineaChange(index, field, value) {
        if (field === 'cantidad') {
            this._detalle[index].cantidad = parseInt(value) || 0;
        } else if (field === 'precio_unitario') {
            this._detalle[index].precio_unitario = parseFloat(value) || 0;
        } else {
            this._detalle[index][field] = value;
        }

        // Actualizar solo el subtotal de la fila sin re-renderizar toda la tabla
        if (field === 'cantidad' || field === 'precio_unitario') {
            const sub = (this._detalle[index].cantidad || 0) * (this._detalle[index].precio_unitario || 0);
            const subEl = document.getElementById(`sub-${index}`);
            if (subEl) subEl.textContent = formatPrecio(sub);
            this._recalcTotals();
        }
    },

    _recalcTotals() {
        const subtotal = this._detalle.reduce((s, l) => {
            return s + ((Number(l.cantidad) || 0) * (Number(l.precio_unitario) || 0));
        }, 0);
        const igv   = subtotal * 0.18;
        const total = subtotal + igv;

        setText('resumenSubtotal', `S/ ${formatPrecio(subtotal)}`);
        setText('resumenIgv',      `S/ ${formatPrecio(igv)}`);
        setText('resumenTotal',    `S/ ${formatPrecio(total)}`);
    },

    /* ── Modal detalle (vista) ─────────────────── */
    async openDetalle(id) {
        try {
            const { data: c } = await http(`/api/compras/${id}`);
            const anulada = !!c.anulada;

            setText('modalDetalleTitle',    `Compra ${escapeHtml(c.codigo)}`);
            setText('modalDetalleSubtitle', c.proveedor_razon_social);

            const detalleRows = (c.detalle ?? []).map(d => `
          <tr>
            <td>
              <div style="font-weight:600">${escapeHtml(d.herramienta_nombre)}</div>
              <div style="font-size:11px;color:var(--text-muted);font-family:'DM Mono',monospace">${escapeHtml(d.herramienta_codigo)}</div>
            </td>
            <td style="text-align:center">${d.cantidad}</td>
            <td style="text-align:right;font-family:'DM Mono',monospace;font-size:12px">S/ ${formatPrecio(d.precio_unitario)}</td>
            <td style="text-align:right;font-family:'DM Mono',monospace;font-size:12px">S/ ${formatPrecio(d.subtotal)}</td>
          </tr>`).join('');

            document.getElementById('modalDetalleBody').innerHTML = `
        <!-- Info cabecera -->
        <div class="row g-2 mb-4" style="font-size:13px">
          <div class="col-6">
            <div style="color:var(--text-muted);font-size:11px;text-transform:uppercase;letter-spacing:.5px;margin-bottom:2px">Proveedor</div>
            <div style="font-weight:600">${escapeHtml(c.proveedor_razon_social)}</div>
          </div>
          <div class="col-6">
            <div style="color:var(--text-muted);font-size:11px;text-transform:uppercase;letter-spacing:.5px;margin-bottom:2px">Fecha</div>
            <div>${formatFecha(c.fecha_compra?.split('T')[0] ?? c.fecha_compra)}</div>
          </div>
          ${c.numero_documento ? `
          <div class="col-6">
            <div style="color:var(--text-muted);font-size:11px;text-transform:uppercase;letter-spacing:.5px;margin-bottom:2px">N° Documento</div>
            <div style="font-family:'DM Mono',monospace">${escapeHtml(c.numero_documento)}</div>
          </div>` : ''}
          ${c.observaciones ? `
          <div class="col-12">
            <div style="color:var(--text-muted);font-size:11px;text-transform:uppercase;letter-spacing:.5px;margin-bottom:2px">Observaciones</div>
            <div>${escapeHtml(c.observaciones)}</div>
          </div>` : ''}
          ${anulada ? `
          <div class="col-12">
            <div style="display:inline-flex;align-items:center;gap:6px;background:#fee2e2;color:#dc2626;
              padding:4px 12px;border-radius:99px;font-size:12px;font-weight:600">
              <i class="bi bi-x-circle-fill"></i> Anulada el ${formatFecha(c.anulada_at?.split('T')[0] ?? c.anulada_at)}
            </div>
          </div>` : ''}
        </div>

        <!-- Líneas -->
        <div style="border-top:1px solid var(--border);padding-top:16px">
          <div style="font-size:13px;font-weight:600;margin-bottom:10px">Líneas de detalle</div>
          <div class="table-responsive">
            <table class="table-custom">
              <thead>
                <tr>
                  <th>Herramienta</th>
                  <th style="text-align:center">Cant.</th>
                  <th style="text-align:right">Precio unit.</th>
                  <th style="text-align:right">Subtotal</th>
                </tr>
              </thead>
              <tbody>${detalleRows}</tbody>
            </table>
          </div>

          <!-- Totales -->
          <div style="display:flex;justify-content:flex-end;margin-top:12px">
            <table style="font-size:13px;border-collapse:collapse">
              <tr>
                <td style="padding:3px 12px;color:var(--text-muted);text-align:right">Subtotal</td>
                <td style="padding:3px 0;font-family:'DM Mono',monospace;text-align:right;min-width:100px">S/ ${formatPrecio(c.subtotal)}</td>
              </tr>
              <tr>
                <td style="padding:3px 12px;color:var(--text-muted);text-align:right">IGV (18%)</td>
                <td style="padding:3px 0;font-family:'DM Mono',monospace;text-align:right">S/ ${formatPrecio(c.igv)}</td>
              </tr>
              <tr style="border-top:1px solid var(--border)">
                <td style="padding:6px 12px;font-weight:700;text-align:right">Total</td>
                <td style="padding:6px 0;font-family:'DM Mono',monospace;font-weight:700;font-size:15px;text-align:right">S/ ${formatPrecio(c.total)}</td>
              </tr>
            </table>
          </div>
        </div>

        ${!anulada ? `
        <div style="margin-top:16px;padding:12px;background:#fff7ed;border:1px solid #fed7aa;border-radius:var(--radius-xs);font-size:12px;color:#9a3412">
          <i class="bi bi-info-circle me-1"></i>
          Las unidades generadas por esta compra tienen estado <strong>bueno</strong> por defecto.
          Si alguna llegó en diferente condición, corrígela desde el módulo de Unidades.
        </div>` : ''}
      `;

            // Footer: botón anular si está activa
            const footer = document.getElementById('modalDetalleFooter');
            footer.innerHTML = !anulada
                ? `<button class="btn-cancel" id="btnCloseCompraDetalleFooter">Cerrar</button>
                   <button class="btn-danger-action" id="btnAnularDesdeDetalle">
                     <i class="bi bi-x-circle-fill me-1"></i> Anular compra
                   </button>`
                : `<button class="btn-cancel" id="btnCloseCompraDetalleFooter">Cerrar</button>`;

            document.getElementById('btnCloseCompraDetalleFooter')
                ?.addEventListener('click', () => closeOverlay('modalCompraDetalleOverlay'));

            if (!anulada) {
                document.getElementById('btnAnularDesdeDetalle')
                    ?.addEventListener('click', () => {
                        closeOverlay('modalCompraDetalleOverlay');
                        this.confirmarAnular(c.id, c.codigo);
                    });
            }

            openOverlay('modalCompraDetalleOverlay');
        } catch (e) {
            showToast('No se pudo cargar el detalle: ' + e.message, 'error');
        }
    },

    /* ── Anular ──────────────────────────── */
    confirmarAnular(id, codigo) {
        DeleteModal.open('anular-compra', id, codigo, async () => {
            try {
                await http(`/api/compras/${id}/anular`, 'POST');
                showToast(`Compra ${codigo} anulada`, 'success');
                await this.load();
            } catch (e) {
                showToast(e.message, 'error');
            }
        });
    },

    /* ── Guardar ─────────────────────────── */
    async _save() {
        if (!this._validate()) return;

        const body = {
            proveedor_id:     parseInt(document.getElementById('cProveedor').value),
            fecha_compra:     document.getElementById('cFecha').value,
            numero_documento: document.getElementById('cNumDoc').value.trim() || undefined,
            observaciones:    document.getElementById('cObservaciones').value.trim() || undefined,
            detalle: this._detalle.map(l => ({
                herramienta_id: parseInt(l.herramienta_id),
                cantidad:       parseInt(l.cantidad),
                precio_unitario: parseFloat(l.precio_unitario),
            })),
        };

        setLoading('btnSaveCompra', 'btnSaveCompraText', 'btnSaveCompraSpinner', true);
        try {
            const { data } = await http('/api/compras', 'POST', body);
            showToast(`Compra ${data.codigo} registrada — ${data.detalle.length} línea(s) procesadas`, 'success');
            closeOverlay('modalCompraFormOverlay');
            await this.load();
        } catch (e) {
            showToast(e.message, 'error');
        } finally {
            setLoading('btnSaveCompra', 'btnSaveCompraText', 'btnSaveCompraSpinner', false);
        }
    },

    _validate() {
        clearErrors(['cProveedor', 'cFecha']);
        document.getElementById('err-detalle').textContent = '';
        let ok = true;

        if (!document.getElementById('cProveedor').value)
            { setError('cProveedor', 'err-cProveedor', 'Selecciona un proveedor'); ok = false; }

        if (!document.getElementById('cFecha').value)
            { setError('cFecha', 'err-cFecha', 'La fecha es requerida'); ok = false; }

        if (!this._detalle.length) {
            document.getElementById('err-detalle').textContent = 'Agrega al menos una línea de detalle';
            ok = false;
        } else {
            for (let i = 0; i < this._detalle.length; i++) {
                const l = this._detalle[i];
                if (!l.herramienta_id) {
                    document.getElementById('err-detalle').textContent = `Línea ${i + 1}: selecciona una herramienta`;
                    ok = false; break;
                }
                if (!l.cantidad || l.cantidad < 1) {
                    document.getElementById('err-detalle').textContent = `Línea ${i + 1}: la cantidad debe ser mayor a 0`;
                    ok = false; break;
                }
                if (!l.precio_unitario || l.precio_unitario <= 0) {
                    document.getElementById('err-detalle').textContent = `Línea ${i + 1}: el precio debe ser mayor a 0`;
                    ok = false; break;
                }
            }
        }

        return ok;
    },

    /* ── Listeners ───────────────────────── */
    _bindEvents() {
        document.getElementById('btnNuevaCompra')?.addEventListener('click',    () => this._openFormModal());
        document.getElementById('btnSaveCompra')?.addEventListener('click',     () => this._save());
        document.getElementById('btnCancelCompraForm')?.addEventListener('click', () => closeOverlay('modalCompraFormOverlay'));
        document.getElementById('btnCloseCompraForm')?.addEventListener('click',  () => closeOverlay('modalCompraFormOverlay'));
        document.getElementById('btnCloseCompraDetalle')?.addEventListener('click', () => closeOverlay('modalCompraDetalleOverlay'));
        document.getElementById('btnRefreshCompras')?.addEventListener('click', () => this.load());
        document.getElementById('btnAddLinea')?.addEventListener('click',       () => this._addLinea());
        document.getElementById('searchCompra')?.addEventListener('input',      () => this._applyFilters());
        document.getElementById('filterEstadoCompra')?.addEventListener('change', () => this._applyFilters());

        document.getElementById('modalCompraFormOverlay')?.addEventListener('click', e => {
            if (e.target.id === 'modalCompraFormOverlay') closeOverlay('modalCompraFormOverlay');
        });
        document.getElementById('modalCompraDetalleOverlay')?.addEventListener('click', e => {
            if (e.target.id === 'modalCompraDetalleOverlay') closeOverlay('modalCompraDetalleOverlay');
        });
    },
};
