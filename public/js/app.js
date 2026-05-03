/**
 * app.js — Punto de arranque de la SPA
 */

'use strict';

/* ════════════════════════════════════════════
   ESTADO GLOBAL COMPARTIDO
════════════════════════════════════════════ */
const AppState = {
    usuarios:  [],
    roles:     [],
    cargos:    [],
    areas:     [],
    turnos:    [],
    deleteTarget: { type: null, id: null, name: null, onConfirm: null },
};

/* ════════════════════════════════════════════
   MODAL DE ELIMINACIÓN (compartido)
════════════════════════════════════════════ */
const DeleteModal = {

    render() {
        document.getElementById('modalsContainer').innerHTML = `
      <div class="modal-overlay" id="modalDeleteOverlay">
        <div class="modal-panel modal-sm">
          <div class="modal-header-custom">
            <div class="modal-title-custom text-danger" id="deleteModalTitle">
              <i class="bi bi-exclamation-triangle-fill me-2"></i>Confirmar acción
            </div>
            <button class="btn-modal-close" id="btnCloseDelete"><i class="bi bi-x-lg"></i></button>
          </div>
          <div class="modal-body-custom">
            <p class="text-muted mb-0" id="deleteMessage">
              ¿Estás seguro de que deseas continuar?
            </p>
          </div>
          <div class="modal-footer-custom">
            <button class="btn-cancel" id="btnCancelDelete">Cancelar</button>
            <button id="btnConfirmDelete">
              <i id="deleteConfirmIcon" class="bi bi-trash3-fill me-1"></i>
              <span id="deleteConfirmLabel">Confirmar</span>
            </button>
          </div>
        </div>
      </div>`;

        document.getElementById('btnConfirmDelete').addEventListener('click', () => this._execute());
        document.getElementById('btnCancelDelete').addEventListener('click',  () => closeOverlay('modalDeleteOverlay'));
        document.getElementById('btnCloseDelete').addEventListener('click',   () => closeOverlay('modalDeleteOverlay'));
        document.getElementById('modalDeleteOverlay').addEventListener('click', e => {
            if (e.target.id === 'modalDeleteOverlay') closeOverlay('modalDeleteOverlay');
        });
    },

    open(type, id, name, onConfirm) {
        AppState.deleteTarget = { type, id, name, onConfirm };

        const config = {
            desactivar: {
                title:   'Confirmar desactivación',
                msg:     `¿Desactivar a "<strong>${escapeHtml(name)}</strong>"? Perderá acceso al sistema hasta que sea reactivado.`,
                icon:    'bi-person-slash',
                label:   'Desactivar',
                btnCls:  'btn-danger-action',
            },
            activar: {
                title:   'Confirmar activación',
                msg:     `¿Activar a "<strong>${escapeHtml(name)}</strong>"? Recuperará acceso al sistema.`,
                icon:    'bi-person-check',
                label:   'Activar',
                btnCls:  'btn-primary-action',
            },
        };

        const def = config[type] ?? {
            title:   'Confirmar eliminación',
            msg:     `¿Eliminar "<strong>${escapeHtml(name)}</strong>"? Esta acción no se puede deshacer.`,
            icon:    'bi-trash3-fill',
            label:   'Eliminar',
            btnCls:  'btn-danger-action',
        };

        const btn = document.getElementById('btnConfirmDelete');
        btn.className = def.btnCls;
        document.getElementById('deleteModalTitle').innerHTML    = `<i class="bi bi-exclamation-triangle-fill me-2"></i>${def.title}`;
        document.getElementById('deleteMessage').innerHTML       = def.msg;
        document.getElementById('deleteConfirmIcon').className   = `bi ${def.icon} me-1`;
        document.getElementById('deleteConfirmLabel').textContent = def.label;

        openOverlay('modalDeleteOverlay');
    },

    async _execute() {
        const { onConfirm } = AppState.deleteTarget;
        closeOverlay('modalDeleteOverlay');
        if (typeof onConfirm === 'function') await onConfirm();
    },
};

/* ════════════════════════════════════════════
   MÓDULO DASHBOARD (stub)
════════════════════════════════════════════ */
const DashboardModule = {
    init() {
        document.getElementById('pageContainer').innerHTML = `
          <div class="page-header">
            <div>
              <h1 class="page-title">Dashboard</h1>
              <p class="page-subtitle">Resumen del sistema</p>
            </div>
          </div>
          <div class="card-panel" style="padding:40px;text-align:center">
            <i class="bi bi-grid-1x2-fill" style="font-size:48px;opacity:.2"></i>
            <p class="mt-3 text-muted">Dashboard en construcción</p>
          </div>`;
    },
};

/* ════════════════════════════════════════════
   BADGES DE SIDEBAR
════════════════════════════════════════════ */
function updateBadges() {
    setText('badge-usuarios', AppState.usuarios.length);
}

/* ════════════════════════════════════════════
   GATING DE NAVEGACIÓN POR PERMISOS
════════════════════════════════════════════ */
// Mapa de página → código de permiso requerido. Si la página no aparece aquí,
// se considera pública para usuarios autenticados (ej: dashboard).
const PAGE_PERMISSIONS = {
    usuarios: 'usuario.ver',
};

function applySidebarVisibility() {
    document.querySelectorAll('.nav-item[data-page]').forEach(el => {
        const page = el.dataset.page;
        const required = PAGE_PERMISSIONS[page];
        if (!required) return;
        if (Auth.hasPermission(required)) {
            el.classList.remove('d-none');
        } else {
            el.classList.add('d-none');
        }
    });
}

/* ════════════════════════════════════════════
   SIDEBAR — USUARIO ACTUAL + LOGOUT
════════════════════════════════════════════ */
function renderSidebarUser() {
    const user = Auth.state.me?.user;
    if (!user) return;

    const footer = document.querySelector('.sidebar-footer');
    if (!footer) return;

    const nombre = `${user.nombres} ${user.apellidos}`;
    const rol    = user.rol_nombre ?? '';

    footer.innerHTML = `
      <div class="d-flex align-items-center gap-2" style="overflow:hidden">
        <div class="avatar-xs" style="flex-shrink:0"><i class="bi bi-person-fill"></i></div>
        <div style="overflow:hidden;flex:1;min-width:0">
          <div class="fw-600 text-sm text-white text-truncate" title="${escapeHtml(nombre)}">${escapeHtml(nombre)}</div>
          <div style="font-size:11px;color:#9ca3af;text-transform:capitalize">${escapeHtml(rol)}</div>
        </div>
        <button id="btnLogout" title="Cerrar sesión"
          style="background:none;border:none;color:#6b7280;cursor:pointer;font-size:17px;padding:4px;line-height:1;flex-shrink:0;transition:color .15s"
          onmouseover="this.style.color='#ef4444'" onmouseout="this.style.color='#6b7280'">
          <i class="bi bi-box-arrow-right"></i>
        </button>
      </div>`;

    document.getElementById('btnLogout').addEventListener('click', () => {
        if (confirm('¿Cerrar sesión?')) Auth.forceLogout('Sesión cerrada correctamente.');
    });
}

/* ════════════════════════════════════════════
   ARRANQUE
════════════════════════════════════════════ */
document.addEventListener('DOMContentLoaded', async () => {
    DeleteModal.render();
    LoginOverlay.init();
    Router.init();

    try {
        await Auth.refresh();
    } catch {
        LoginOverlay.show();
        return;
    }

    renderSidebarUser();
    applySidebarVisibility();

    const initial = Auth.hasPermission('usuario.ver') ? 'usuarios' : 'dashboard';
    Router.navigateTo(initial);
});
