/**
 * utils.js — Funciones utilitarias compartidas por todos los módulos
 * No tiene dependencias. Se carga primero.
 */

'use strict';

/* ════════════════════════════════════════════
   AUTH HELPERS
════════════════════════════════════════════ */
function getToken() {
    return localStorage.getItem('token');
}

/**
 * Lee el payload del JWT (rápido, no autoritativo). Para el rol/permisos
 * vigentes usar Auth.me() que se actualiza desde /api/auth/me.
 */
function getCurrentUser() {
    if (Auth.state.me?.user) {
        const u = Auth.state.me.user;
        return { id: u.id, rol_id: u.rol_id, rol_nombre: u.rol_nombre };
    }
    const token = getToken();
    if (!token) return null;
    try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        return { id: payload.user_id, rol_id: payload.rol_id, rol_nombre: payload.rol_nombre };
    } catch {
        return null;
    }
}

/* ════════════════════════════════════════════
   AUTH MODULE
   Mantiene el perfil + permisos del usuario autenticado, sincronizados
   con BD en cada navegación. La fuente de verdad NO es el JWT.
════════════════════════════════════════════ */
const Auth = {
    state: {
        me: null,           // { user, permisos }
        loaded: false,
    },

    async refresh() {
        try {
            const r = await http('/api/auth/me');
            this.state.me = r.data;
            this.state.loaded = true;
            return this.state.me;
        } catch (e) {
            this.state.me = null;
            this.state.loaded = false;
            throw e;
        }
    },

    hasPermission(code) {
        const perms = this.state.me?.permisos;
        if (!Array.isArray(perms)) return false;
        return perms.includes(code);
    },

    isSelf(userId) {
        const me = this.state.me?.user;
        return me ? Number(me.id) === Number(userId) : false;
    },

    rolNombre() {
        return this.state.me?.user?.rol_nombre ?? null;
    },

    forceLogout(reason) {
        localStorage.removeItem('token');
        this.state.me = null;
        this.state.loaded = false;
        if (reason) try { showToast(reason, 'info'); } catch { /* */ }
        if (typeof LoginOverlay !== 'undefined') {
            setTimeout(() => LoginOverlay.show(), reason ? 900 : 0);
        }
    },
};

/* ════════════════════════════════════════════
   HTTP HELPER
════════════════════════════════════════════ */
async function http(url, method = 'GET', body = null) {
    const opts = { method, headers: { 'Content-Type': 'application/json' } };
    const token = getToken();
    if (token) opts.headers['Authorization'] = `Bearer ${token}`;
    if (body) opts.body = JSON.stringify(body);
    const res = await fetch(url, opts);
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
        const code = data?.error?.code;
        // 401: token inválido, expirado, o cuenta desactivada → cerrar sesión
        if (res.status === 401) {
            Auth.forceLogout(data?.error?.message);
        }
        const err = new Error(data?.error?.message || data?.message || `Error ${res.status}`);
        err.status = res.status;
        err.code = code;
        throw err;
    }
    return data;
}

/* ════════════════════════════════════════════
   TOASTS
════════════════════════════════════════════ */
function showToast(msg, type = 'success') {
    const map = {
        success: { icon: 'bi-check-circle-fill', cls: 'toast-success', icoCls: 'toast-icon-success' },
        error: { icon: 'bi-x-circle-fill', cls: 'toast-error', icoCls: 'toast-icon-error' },
        info: { icon: 'bi-info-circle-fill', cls: 'toast-info', icoCls: 'toast-icon-info' },
    };
    const t = map[type] || map.info;
    const el = document.createElement('div');
    el.className = `toast-item ${t.cls}`;
    el.innerHTML = `<i class="bi ${t.icon} toast-icon ${t.icoCls}"></i><span>${msg}</span>`;
    document.getElementById('toastContainer').appendChild(el);
    setTimeout(() => el.remove(), 3500);
}

/* ════════════════════════════════════════════
   FORMULARIOS / UI
════════════════════════════════════════════ */
function setError(inputId, errId, msg) {
    document.getElementById(inputId)?.classList.add('is-invalid');
    const err = document.getElementById(errId);
    if (err) err.textContent = msg;
}

function clearErrors(inputIds) {
    inputIds.forEach(id => {
        document.getElementById(id)?.classList.remove('is-invalid');
        const err = document.getElementById('err-' + id);
        if (err) err.textContent = '';
    });
}

function setLoading(btnId, textId, spinnerId, loading) {
    const btn = document.getElementById(btnId);
    if (btn) btn.disabled = loading;
    document.getElementById(textId)?.[loading ? 'classList' : 'classList'][loading ? 'add' : 'remove']('d-none');
    document.getElementById(spinnerId)?.[loading ? 'classList' : 'classList'][loading ? 'remove' : 'add']('d-none');
}

function setText(id, val) {
    const el = document.getElementById(id);
    if (el) el.textContent = val;
}

function openOverlay(id) { document.getElementById(id)?.classList.add('open'); }
function closeOverlay(id) { document.getElementById(id)?.classList.remove('open'); }

/* ════════════════════════════════════════════
   FORMATTERS
════════════════════════════════════════════ */
function escapeHtml(str) {
    if (!str) return '';
    return String(str)
        .replace(/&/g, '&amp;').replace(/</g, '&lt;')
        .replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

function formatPrecio(val) {
    return parseFloat(val || 0).toLocaleString('es-PE', {
        minimumFractionDigits: 2, maximumFractionDigits: 2,
    });
}

function formatFecha(fechaStr) {
    if (!fechaStr) return '—';
    const [y, m, d] = fechaStr.split('-');
    const meses = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
    return `${d} ${meses[parseInt(m, 10) - 1]} ${y}`;
}