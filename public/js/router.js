/**
 * router.js — Router SPA
 *
 * Para agregar una nueva página:
 *  a) Crear  public/views/nueva-pagina.html
 *  b) Crear  public/js/modules/nueva-pagina.js  con un init()
 *  c) Registrarla aquí en ROUTES
 *  d) Agregar el <a data-page="nueva-pagina"> en el sidebar del index.html
 */

'use strict';

/* ════════════════════════════════════════════
   REGISTRO DE RUTAS
════════════════════════════════════════════ */
const ROUTES = {
    dashboard: {
        title: 'Dashboard',
        view: '/views/dashboard.html',
        module: () => DashboardModule,
    },
    usuarios: {
        title: 'Usuarios',
        view: '/views/usuarios.html',
        module: () => UsuariosModule,
    },
    herramientas: {
        title: 'Herramientas',
        view: '/views/herramientas.html',
        module: () => HerramientasModule,
    }
};

/* ════════════════════════════════════════════
   CACHÉ DE VISTAS
════════════════════════════════════════════ */
const viewCache = {};

/* ════════════════════════════════════════════
   ROUTER
════════════════════════════════════════════ */
const Router = {

    currentPage: null,

    async navigateTo(page) {
        const route = ROUTES[page];

        if (!route) {
            console.warn(`Router: ruta "${page}" no registrada.`);
            return;
        }

        // 0. Antes de navegar, refrescar el perfil para detectar cambios de
        //    rol/activo aplicados por otro admin durante esta sesión.
        try {
            if (typeof Auth !== 'undefined' && Auth.state.loaded) {
                await Auth.refresh();
                if (typeof applySidebarVisibility === 'function') applySidebarVisibility();
            }
        } catch {
            // Si /me falla (401, etc.) http() ya disparó forceLogout; abortamos.
            return;
        }

        // Gate por permiso de página
        const required = (typeof PAGE_PERMISSIONS !== 'undefined') ? PAGE_PERMISSIONS[page] : null;
        if (required && typeof Auth !== 'undefined' && !Auth.hasPermission(required)) {
            showToast('No tienes permisos para acceder a esa sección', 'error');
            // Caer a una página segura. Dashboard se asume sin restricción.
            if (page !== 'dashboard') {
                return this.navigateTo('dashboard');
            }
            return;
        }

        // 1. Actualizar sidebar
        document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
        document.querySelector(`.nav-item[data-page="${page}"]`)?.classList.add('active');

        // 2. Actualizar título del topbar
        setText('topbarTitle', route.title);

        // 3. Mostrar spinner mientras carga
        const container = document.getElementById('pageContainer');
        container.innerHTML = `
      <div class="d-flex justify-content-center align-items-center" style="height:60vh">
        <div class="spinner-custom"></div>
      </div>`;

        // 4. Obtener HTML (desde caché o fetch)
        try {
            if (!viewCache[page]) {
                const res = await fetch(route.view);
                if (!res.ok) throw new Error(`No se pudo cargar la vista: ${route.view}`);
                viewCache[page] = await res.text();
            }

            // 5. Inyectar el HTML en el contenedor
            container.innerHTML = viewCache[page];

            // 6. Inicializar el módulo de la página
            const mod = route.module();
            if (mod && typeof mod.init === 'function') {
                await mod.init();
            }

            this.currentPage = page;

            // 7. Cerrar sidebar en móvil
            this._closeSidebarMobile();

        } catch (err) {
            container.innerHTML = `
        <div class="empty-state" style="padding:80px 20px">
          <i class="bi bi-exclamation-triangle" style="font-size:48px;color:var(--danger);opacity:.5"></i>
          <p class="mt-3">Error al cargar la vista <strong>${page}</strong></p>
          <p style="font-size:12px;color:var(--text-muted)">${err.message}</p>
        </div>`;
            console.error('Router error:', err);
        }
    },

    init() {
        // Clicks del sidebar
        document.querySelectorAll('.nav-item[data-page]').forEach(item => {
            item.addEventListener('click', e => {
                e.preventDefault();
                Router.navigateTo(item.dataset.page);
            });
        });

        // Toggle sidebar móvil
        document.getElementById('btnToggleSidebar')?.addEventListener('click', () => {
            document.getElementById('sidebar').classList.toggle('open');
            document.getElementById('sidebarOverlay').classList.toggle('open');
        });

        document.getElementById('sidebarOverlay')?.addEventListener('click', () => {
            this._closeSidebarMobile();
        });

        // Cerrar modales con Escape
        document.addEventListener('keydown', e => {
            if (e.key === 'Escape') {
                document.querySelectorAll('.modal-overlay.open').forEach(m => {
                    m.classList.remove('open');
                });
            }
        });
    },

    _closeSidebarMobile() {
        document.getElementById('sidebar')?.classList.remove('open');
        document.getElementById('sidebarOverlay')?.classList.remove('open');
    },
};
