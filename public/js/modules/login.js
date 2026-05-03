'use strict';

const LoginOverlay = {

    show() {
        // Activar transición y quitar has-token para que CSS muestre el overlay
        const overlay = document.getElementById('loginOverlay');
        if (!overlay) return;
        overlay.classList.add('animating');
        document.documentElement.classList.remove('has-token');
        document.getElementById('loginUsername')?.focus();
        this._clearForm();
    },

    hide() {
        // Activar transición y añadir has-token para que CSS oculte el overlay
        const overlay = document.getElementById('loginOverlay');
        if (!overlay) return;
        overlay.classList.add('animating');
        document.documentElement.classList.add('has-token');
    },

    init() {
        document.getElementById('loginForm')
            ?.addEventListener('submit', e => { e.preventDefault(); this._doLogin(); });

        document.getElementById('btnTogglePassword')
            ?.addEventListener('click', () => {
                const input = document.getElementById('loginPassword');
                const icon  = document.getElementById('eyeIcon');
                const isText = input.type === 'text';
                input.type  = isText ? 'password' : 'text';
                icon.className = isText ? 'bi bi-eye' : 'bi bi-eye-slash';
            });

        document.getElementById('loginUsername')
            ?.addEventListener('input', () => this._clearField('loginUsername'));

        document.getElementById('loginPassword')
            ?.addEventListener('input', () => this._clearField('loginPassword'));
    },

    _clearForm() {
        ['loginUsername', 'loginPassword'].forEach(id => {
            const el = document.getElementById(id);
            if (el) { el.value = ''; el.classList.remove('is-invalid'); }
        });
        document.getElementById('err-loginUsername').textContent = '';
        document.getElementById('err-loginPassword').textContent = '';
        document.getElementById('loginAlert').classList.remove('show');
        if (document.getElementById('loginPassword'))
            document.getElementById('loginPassword').type = 'password';
        const icon = document.getElementById('eyeIcon');
        if (icon) icon.className = 'bi bi-eye';
    },

    _clearField(id) {
        document.getElementById(id)?.classList.remove('is-invalid');
        document.getElementById(`err-${id}`).textContent = '';
        document.getElementById('loginAlert').classList.remove('show');
    },

    _showAlert(msg) {
        const box = document.getElementById('loginAlert');
        document.getElementById('loginAlertMsg').textContent = msg;
        box.classList.add('show');
    },

    _setLoading(loading) {
        const btn     = document.getElementById('btnLogin');
        const content = document.getElementById('btnLoginContent');
        const spinner = document.getElementById('btnLoginSpinner');
        if (btn) btn.disabled = loading;
        content?.classList.toggle('d-none', loading);
        spinner?.classList.toggle('d-none', !loading);
    },

    _validate() {
        let ok = true;
        const u = document.getElementById('loginUsername').value.trim();
        const p = document.getElementById('loginPassword').value;

        if (!u) {
            document.getElementById('loginUsername').classList.add('is-invalid');
            document.getElementById('err-loginUsername').textContent = 'El usuario es requerido';
            ok = false;
        }
        if (!p) {
            document.getElementById('loginPassword').classList.add('is-invalid');
            document.getElementById('err-loginPassword').textContent = 'La contraseña es requerida';
            ok = false;
        }
        return ok;
    },

    async _doLogin() {
        if (!this._validate()) return;
        this._setLoading(true);

        try {
            const res = await fetch('/api/auth/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    username: document.getElementById('loginUsername').value.trim(),
                    password: document.getElementById('loginPassword').value,
                }),
            });

            const data = await res.json().catch(() => ({}));

            if (!res.ok) {
                const code = data?.error?.code;
                if (code === 'USER_INACTIVE') {
                    this._showAlert(data.error.message);
                } else {
                    // No revelar si el username existe o no
                    this._showAlert('Usuario o contraseña incorrectos');
                }
                return;
            }

            // Guardar token y cargar la sesión sin recargar la página
            localStorage.setItem('token', data.data.token);

            await Auth.refresh();
            this.hide();
            renderSidebarUser();
            applySidebarVisibility();

            const initial = Auth.hasPermission('usuario.ver') ? 'usuarios' : 'dashboard';
            Router.navigateTo(initial);

        } catch {
            this._showAlert('No se pudo conectar con el servidor. Intenta de nuevo.');
        } finally {
            this._setLoading(false);
        }
    },
};
