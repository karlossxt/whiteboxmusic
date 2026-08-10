/* ============================================
   BACKSTAGE STUDIO — Sections View
   Editor del contenido del sitio.
   Lista las paginas editables y muestra un
   formulario con un campo por cada seccion.
   ============================================ */

(function() {
    window.Backstage = window.Backstage || {};
    window.Backstage.Views = window.Backstage.Views || {};

    var T = window.Backstage.Templates;
    var Toast = window.Backstage.Components.Toast;

    var columns = [
        { key: 'page', label: 'Pagina' },
        { key: 'file', label: 'Archivo' },
        { key: 'status', label: 'Estado' },
        { key: 'updated', label: 'Actualizado' },
        { key: 'actions', label: 'Acciones' }
    ];

    function formatDate(ts) {
        if (!ts) return 'Nunca';
        try {
            var d = new Date(ts);
            return d.toLocaleDateString('es-MX', { year: 'numeric', month: 'short', day: 'numeric' }) +
                   ' ' + d.toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' });
        } catch (e) { return ts; }
    }

    function escapeHtml(str) {
        return String(str || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
    }

    window.Backstage.Views.Sections = {
        _section: null,
        _statsContainer: null,
        _listContainer: null,
        _editorContainer: null,
        _emptyEl: null,

        init: function(sectionId) {
            this._section = document.getElementById(sectionId);
        },

        renderStats: function(stats) {
            this._ensureStructure();
            this._statsContainer.textContent = '';
            var cards = T.statsCards([
                { value: stats.total, label: 'Paginas editables' },
                { value: stats.edited, label: 'Paginas editadas' },
                { value: formatDate(stats.lastModified), label: 'Ultima actualizacion' }
            ]);
            this._statsContainer.appendChild(cards);
        },

        renderList: function(items, actions) {
            this._ensureStructure();
            this._editorContainer.textContent = '';
            this._listContainer.textContent = '';

            var header = document.createElement('div');
            header.className = 'sections-list-header';
            header.innerHTML = '<h3 class="sections-list-title"><i class="fa-solid fa-file-lines"></i> Paginas del sitio</h3>' +
                               '<span class="form-hint">Selecciona una pagina para editar sus secciones.</span>';
            this._listContainer.appendChild(header);

            var tableResult = T.dataTable({
                columns: columns,
                emptyIcon: 'fa-file-lines',
                emptyTitle: 'No hay paginas',
                emptyText: 'El schema no define paginas editables.'
            });
            var tbody = tableResult.tbody;
            this._emptyEl = tableResult.empty;
            this._listContainer.appendChild(tableResult.wrapper);
            this._listContainer.appendChild(this._emptyEl);

            if (!items || items.length === 0) {
                this._emptyEl.style.display = 'block';
                return;
            }
            this._emptyEl.style.display = 'none';

            var self = this;
            items.forEach(function(page) {
                var cells = [
                    { value: page.label, className: 'table-title' },
                    { value: page.file, className: 'table-location' },
                    { value: page.edited ? 'Editada' : 'Original', className: page.edited ? 'table-badge-ok' : '' },
                    { value: formatDate(page.updatedAt), className: 'table-date' }
                ];

                var tr = T.dataTableRow(cells);

                var tdActions = document.createElement('td');
                tdActions.appendChild(T.tableActions([
                    {
                        icon: 'fa-pen',
                        title: 'Editar pagina',
                        ariaLabel: 'Editar ' + page.label,
                        className: 'edit',
                        onClick: function() { actions.edit(page.id); }
                    }
                ]));
                tr.appendChild(tdActions);
                tbody.appendChild(tr);
            });

            var back = document.createElement('button');
            back.className = 'btn-secondary';
            back.style.marginTop = '20px';
            back.innerHTML = '<i class="fa-solid fa-rotate-left"></i> Restaurar todos los valores originales';
            back.addEventListener('click', function() { actions.resetAll(); });
            this._listContainer.appendChild(back);
        },

        renderForm: function(schemaPage, content, actions) {
            this._ensureStructure();
            this._listContainer.style.display = 'none';
            this._editorContainer.style.display = '';
            this._editorContainer.textContent = '';

            var self = this;

            var top = document.createElement('div');
            top.className = 'sections-editor-top';
            top.innerHTML =
                '<button type="button" class="btn-secondary btn-sm" id="sectionsBackBtn">' +
                '<i class="fa-solid fa-arrow-left"></i> Volver a paginas</button>' +
                '<div class="sections-editor-heading">' +
                '<h3>' + escapeHtml(schemaPage.label) + '</h3>' +
                '<span class="form-hint">' + escapeHtml(schemaPage.file) + ' · ' + schemaPage.fields.length + ' campos</span>' +
                '</div>';
            this._editorContainer.appendChild(top);

            var form = document.createElement('form');
            form.id = 'sectionsForm';
            form.setAttribute('novalidate', 'novalidate');

            var grid = document.createElement('div');
            grid.className = 'form-grid';

            schemaPage.fields.forEach(function(field) {
                var group = document.createElement('div');
                group.className = 'form-group full-width';

                var label = document.createElement('label');
                label.textContent = field.label;
                label.setAttribute('for', 'sec_' + schemaPage.id + '_' + field.key);
                group.appendChild(label);

                var input;
                var value = content.getField(field.key);

                if (field.type === 'text') {
                    input = document.createElement('input');
                    input.type = 'text';
                    input.value = value === null ? '' : value;
                } else if (field.type === 'url') {
                    input = document.createElement('input');
                    input.type = 'url';
                    input.value = value === null ? '' : value;
                } else {
                    input = document.createElement('textarea');
                    input.rows = (field.type === 'list') ? 6 : 3;
                    input.value = value === null ? '' : value;
                }

                input.id = 'sec_' + schemaPage.id + '_' + field.key;
                input.dataset.fieldKey = field.key;
                group.appendChild(input);

                if (field.apply === 'src' || field.apply === 'background') {
                    var uploadWrap = document.createElement('div');
                    uploadWrap.className = 'form-image-upload';

                    var fileInput = document.createElement('input');
                    fileInput.type = 'file';
                    fileInput.className = 'form-file-input';
                    fileInput.accept = 'image/*';
                    fileInput.setAttribute('aria-label', 'Subir imagen para ' + field.label);

                    fileInput.addEventListener('change', function(key, target) {
                        if (!this.files || !this.files.length) return;
                        var file = this.files[0];
                        if (!file.type.startsWith('image/')) return;
                        if (!actions.upload) return;

                        this.disabled = true;
                        this.nextSibling.textContent = 'Subiendo...';

                        actions.upload(file, schemaPage.id).then(function(url) {
                            target.value = url;
                            target.dataset.uploaded = 'true';
                            this.disabled = false;
                            this.nextSibling.textContent = 'Subir imagen';
                            Toast.show('Imagen subida', 'success');
                        }.bind(this)).catch(function(err) {
                            this.disabled = false;
                            this.nextSibling.textContent = 'Subir imagen';
                            Toast.show('Error al subir imagen: ' + (err.message || 'desconocido'), 'error');
                        }.bind(this));
                    }.bind(fileInput, field.key, input));

                    uploadWrap.appendChild(fileInput);

                    var fileLabel = document.createElement('span');
                    fileLabel.className = 'form-file-label';
                    fileLabel.textContent = 'Subir imagen';
                    uploadWrap.appendChild(fileLabel);

                    group.appendChild(uploadWrap);
                }

                var hint = document.createElement('span');
                hint.className = 'form-hint';
                hint.textContent = field.apply === 'list'
                    ? 'Una linea por elemento'
                    : 'Selector: ' + field.selector;
                group.appendChild(hint);

                grid.appendChild(group);
            });

            form.appendChild(grid);

            var actionsBar = document.createElement('div');
            actionsBar.className = 'form-actions sections-editor-actions';
            actionsBar.innerHTML =
                '<button type="button" class="btn-secondary" id="sectionsResetBtn">' +
                '<i class="fa-solid fa-rotate-left"></i> Restaurar pagina</button>' +
                '<button type="submit" class="btn-primary" id="sectionsSaveBtn">' +
                '<i class="fa-solid fa-check"></i> Guardar cambios</button>';
            form.appendChild(actionsBar);

            this._editorContainer.appendChild(form);

            this._bindForm(schemaPage, actions);
        },

        renderEmpty: function() {
            this._ensureStructure();
            this._editorContainer.style.display = 'none';
            this._listContainer.style.display = '';
        },

        getFormValues: function() {
            var values = {};
            var inputs = this._editorContainer.querySelectorAll('[data-field-key]');
            for (var i = 0; i < inputs.length; i++) {
                values[inputs[i].dataset.fieldKey] = inputs[i].value;
            }
            return values;
        },

        _bindForm: function(schemaPage, actions) {
            var backBtn = document.getElementById('sectionsBackBtn');
            if (backBtn) backBtn.addEventListener('click', function() { actions.back(); });

            var resetBtn = document.getElementById('sectionsResetBtn');
            if (resetBtn) resetBtn.addEventListener('click', function() {
                actions.reset(schemaPage.id);
            });

            var form = document.getElementById('sectionsForm');
            if (form) form.addEventListener('submit', function(e) {
                e.preventDefault();
                actions.save(schemaPage.id);
            });
        },

        _ensureStructure: function() {
            if (this._statsContainer) return;
            this._section.textContent = '';

            this._statsContainer = document.createElement('div');
            this._section.appendChild(this._statsContainer);

            this._listContainer = document.createElement('div');
            this._listContainer.className = 'sections-list';
            this._section.appendChild(this._listContainer);

            this._editorContainer = document.createElement('div');
            this._editorContainer.className = 'sections-editor';
            this._editorContainer.style.display = 'none';
            this._section.appendChild(this._editorContainer);
        }
    };
})();
