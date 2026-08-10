/* ============================================
   BACKSTAGE STUDIO — SiteConfig View
   Editor de la configuracion general del sitio.
   Renderiza un formulario con un campo por opcion.
   No conoce servicios ni datos.
   ============================================ */

(function() {
    window.Backstage = window.Backstage || {};
    window.Backstage.Views = window.Backstage.Views || {};

    var T = window.Backstage.Templates;

    var FIELDS = [
        { key: 'siteName', label: 'Nombre del sitio', type: 'text', fullWidth: true },
        { key: 'tagline', label: 'Frase (tagline)', type: 'text', fullWidth: true },
        { key: 'siteDescription', label: 'Descripcion del sitio (SEO)', type: 'textarea', fullWidth: true },
        { key: 'logoUrl', label: 'URL del logo', type: 'url', fullWidth: true },
        { key: 'social.spotify', label: 'URL Spotify', type: 'url' },
        { key: 'social.instagram', label: 'URL Instagram', type: 'url' },
        { key: 'social.tiktok', label: 'URL TikTok', type: 'url' },
        { key: 'social.youtube', label: 'URL YouTube', type: 'url' },
        { key: 'social.facebook', label: 'URL Facebook', type: 'url' },
        { key: 'contactEmail', label: 'Email de contacto', type: 'email', fullWidth: true },
        { key: 'footerText', label: 'Texto del footer', type: 'textarea', fullWidth: true }
    ];

    function getNested(obj, key) {
        var parts = key.split('.');
        var val = obj;
        for (var i = 0; i < parts.length; i++) {
            if (val === null || val === undefined) return null;
            val = val[parts[i]];
        }
        return val;
    }

    function setNested(obj, key, value) {
        var parts = key.split('.');
        var cursor = obj;
        for (var i = 0; i < parts.length - 1; i++) {
            if (!cursor[parts[i]] || typeof cursor[parts[i]] !== 'object') {
                cursor[parts[i]] = {};
            }
            cursor = cursor[parts[i]];
        }
        cursor[parts[parts.length - 1]] = value;
    }

    window.Backstage.Views.SiteConfig = {
        _section: null,
        _container: null,
        _formBound: false,

        init: function(sectionId) {
            this._section = document.getElementById(sectionId);
        },

        renderForm: function(config, actions) {
            this._ensureStructure();
            this._container.textContent = '';

            var header = document.createElement('div');
            header.className = 'sections-editor-top';
            header.innerHTML =
                '<div class="sections-editor-heading">' +
                '<h3>Configuracion general</h3>' +
                '<span class="form-hint">Datos globales del sitio: identidad, redes y contacto.</span>' +
                '</div>';
            this._container.appendChild(header);

            var form = document.createElement('form');
            form.id = 'siteConfigForm';
            form.setAttribute('novalidate', 'novalidate');

            var grid = document.createElement('div');
            grid.className = 'form-grid';

            FIELDS.forEach(function(field) {
                var group = document.createElement('div');
                group.className = 'form-group' + (field.fullWidth ? ' full-width' : '');

                var label = document.createElement('label');
                label.textContent = field.label;
                label.setAttribute('for', 'cfg_' + field.key);
                group.appendChild(label);

                var input;
                var value = getNested(config, field.key);

                if (field.type === 'textarea') {
                    input = document.createElement('textarea');
                    input.rows = 3;
                    input.value = value === null || value === undefined ? '' : value;
                } else {
                    input = document.createElement('input');
                    input.type = field.type || 'text';
                    input.value = value === null || value === undefined ? '' : value;
                }

                input.id = 'cfg_' + field.key;
                input.dataset.fieldKey = field.key;
                group.appendChild(input);
                grid.appendChild(group);
            });

            form.appendChild(grid);

            var actionsBar = document.createElement('div');
            actionsBar.className = 'form-actions sections-editor-actions';
            actionsBar.innerHTML =
                '<button type="button" class="btn-secondary" id="cfgResetBtn">' +
                '<i class="fa-solid fa-rotate-left"></i> Restaurar valores</button>' +
                '<button type="submit" class="btn-primary" id="cfgSaveBtn">' +
                '<i class="fa-solid fa-check"></i> Guardar configuracion</button>';
            form.appendChild(actionsBar);

            this._container.appendChild(form);

            this._bindForm(actions);
        },

        getFormValues: function() {
            var values = {};
            var inputs = this._container.querySelectorAll('[data-field-key]');
            for (var i = 0; i < inputs.length; i++) {
                var key = inputs[i].dataset.fieldKey;
                var output = {};
                setNested(output, key, inputs[i].value);
                Object.keys(output).forEach(function(top) {
                    values[top] = Object.assign({}, values[top] || {}, output[top]);
                });
            }
            return values;
        },

        _bindForm: function(actions) {
            if (this._formBound) {
                this._rebind(actions);
                return;
            }
            this._formBound = true;
            this._rebind(actions);
        },

        _rebind: function(actions) {
            var resetBtn = document.getElementById('cfgResetBtn');
            if (resetBtn) {
                resetBtn.onclick = function() { actions.reset(); };
            }
            var form = document.getElementById('siteConfigForm');
            if (form) {
                form.onsubmit = function(e) {
                    e.preventDefault();
                    actions.save();
                };
            }
        },

        _ensureStructure: function() {
            if (this._container) return;
            this._section.textContent = '';
            this._container = document.createElement('div');
            this._container.className = 'sections-editor';
            this._section.appendChild(this._container);
        }
    };
})();
