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
        { key: 'footerText', label: 'Texto del footer', type: 'textarea', fullWidth: true },
        { key: 'defaultSeoTitle', label: 'SEO: titulo por defecto', type: 'text', fullWidth: true },
        { key: 'defaultSeoDescription', label: 'SEO: descripcion por defecto', type: 'textarea', fullWidth: true },
        { key: 'defaultOgImage', label: 'SEO: imagen social (Open Graph)', type: 'url', fullWidth: true }
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

            this._renderImportPanel(actions);

            this._bindForm(actions);
        },

        _renderImportPanel: function(actions) {
            var panel = document.createElement('div');
            panel.className = 'sections-editor-import';
            panel.innerHTML =
                '<div class="sections-editor-top" style="margin-top:24px;">' +
                '<div class="sections-editor-heading">' +
                '<h3>Herramientas</h3>' +
                '<span class="form-hint">Importa el contenido guardado en este navegador (localStorage) hacia Supabase, la fuente de verdad del sitio publico.</span>' +
                '</div></div>' +
                '<div class="form-actions sections-editor-actions">' +
                '<button type="button" class="btn-primary" id="importLocalBtn">' +
                '<i class="fa-solid fa-cloud-arrow-up"></i> Importar contenido local a Supabase</button>' +
                '</div>' +
                '<div id="importLocalResults" class="import-results" style="display:none;"></div>';
            this._container.appendChild(panel);
        },

        showImportResult: function(report) {
            var box = document.getElementById('importLocalResults');
            if (!box) return;
            box.style.display = 'block';
            box.textContent = '';

            var keys = Object.keys(report);
            var anyError = false;
            for (var i = 0; i < keys.length; i++) {
                var key = keys[i];
                var r = report[key];
                if (!r || typeof r !== 'object') continue;

                var row = document.createElement('div');
                var label = key;
                for (var c = 0; c < window.Backstage.Services.Import._labels.length; c++) {
                    if (window.Backstage.Services.Import._labels[c].key === key) {
                        label = window.Backstage.Services.Import._labels[c].label;
                        break;
                    }
                }

                if (r.error) {
                    row.className = 'import-result-row error';
                    row.textContent = label + ': ERROR — ' + r.error;
                    anyError = true;
                } else if (r.skipped) {
                    row.className = 'import-result-row';
                    row.textContent = label + ': sin datos locales (omitido)';
                } else {
                    row.className = 'import-result-row';
                    row.textContent = label + ': ' + r.count + ' importado(s)';
                }
                box.appendChild(row);
            }

            if (anyError) {
                var note = document.createElement('div');
                note.className = 'import-result-note';
                note.textContent = 'Revisa que estes con sesion iniciada en Supabase y que las policies RLS de la tabla permitan escritura (autenticado).';
                box.appendChild(note);
            }
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
            var importBtn = document.getElementById('importLocalBtn');
            if (importBtn) {
                importBtn.onclick = function() {
                    if (actions.importLocal) actions.importLocal();
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
