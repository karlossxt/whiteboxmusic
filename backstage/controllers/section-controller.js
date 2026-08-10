/* ============================================
   BACKSTAGE STUDIO — Sections Controller
   Orquesta la vista del editor de contenido.
   Maneja repos local (sync) y Firestore (async).
   ============================================ */

(function() {
    window.Backstage = window.Backstage || {};
    window.Backstage.Controllers = window.Backstage.Controllers || {};

    var Toast = window.Backstage.Components.Toast;
    var Confirm = window.Backstage.Components.Confirm;
    var Header = window.Backstage.Components.Header;

    function SectionController(sectionService, schema, sectionView) {
        this.service = sectionService;
        this.schema = schema;
        this.view = sectionView;
        this._activePageId = null;
        this._saving = false;
        this._eventsBound = false;
        this._storage = null;
        try {
            var StorageClass = window.Backstage.Services.Storage;
            if (StorageClass) {
                this._storage = new StorageClass();
            }
        } catch (e) {
            console.warn('[Sections] StorageService no disponible');
        }
    }

    SectionController.prototype.mount = function() {
        this._renderAll();
        this._bindEvents();
    };

    SectionController.prototype.unmount = function() {
        Header.hideAll();
    };

    SectionController.prototype.refresh = function() {
        this._renderAll();
    };

    /* -- Rendering -------------------------------------- */

    SectionController.prototype._renderAll = function() {
        var self = this;
        var stats = this.service.getStats();

        var pages = this.schema.all().map(function(page) {
            var content = self.service.getPage(page.id);
            return {
                id: page.id,
                label: page.label,
                file: page.file,
                edited: content.updatedAt > 0,
                updatedAt: content.updatedAt
            };
        });

        this.view.renderStats(stats);
        this.view.renderList(pages, {
            edit: function(id) { self._openEditor(id); },
            resetAll: function() { self._resetAll(); }
        });
    };

    SectionController.prototype._openEditor = function(pageId) {
        this._activePageId = pageId;
        var schemaPage = this.schema.getById(pageId);
        var content = this.service.getPage(pageId);

        var self = this;
        this.view.renderForm(schemaPage, content, {
            back: function() { self._backToList(); },
            reset: function(id) { self._resetPage(id); },
            save: function(id) { self._save(id); },
            upload: function(file, pageId) { return self._uploadImage(file, pageId); }
        });
    };

    SectionController.prototype._uploadImage = function(file, pageId) {
        if (!this._storage) {
            return Promise.reject(new Error('La subida de imagenes no esta disponible'));
        }
        var folder = 'site/' + (pageId || 'content');
        return this._storage.uploadImage(file, folder);
    };

    SectionController.prototype._backToList = function() {
        this._activePageId = null;
        this._renderAll();
    };

    /* -- Actions ---------------------------------------- */

    SectionController.prototype._save = function(pageId) {
        if (this._saving) return;
        var self = this;

        var values = this.view.getFormValues();
        this._saving = true;

        function handle(r) {
            self._saving = false;
            if (r && r.success) {
                Toast.show('Contenido guardado', 'success');
                if (self._activePageId === pageId) self._openEditor(pageId);
                else self._renderAll();
            } else {
                var msg = (r && r.errors) ? r.errors.join('. ') : 'Error al guardar';
                Toast.show(msg, 'error');
            }
        }

        var result = this.service.savePage(pageId, values);
        if (result && typeof result.then === 'function') {
            result.then(handle).catch(function(err) {
                self._saving = false;
                Toast.show(err.message || 'Error al guardar', 'error');
            });
        } else {
            handle(result);
        }
    };

    SectionController.prototype._resetPage = function(pageId) {
        var self = this;
        var schemaPage = this.schema.getById(pageId);
        var fields = {};
        schemaPage.fields.forEach(function(f) { fields[f.key] = f.default; });

        Confirm.show('Restaurar pagina', 'Se restauraran los valores originales de esta pagina. Esta accion no se puede deshacer.', function() {
            var result = self.service.savePage(pageId, fields);
            var promise = (result && typeof result.then === 'function') ? result : Promise.resolve(result);
            promise.then(function(r) {
                Toast.show(r && r.success ? 'Pagina restaurada' : 'Error al restaurar', r && r.success ? 'success' : 'error');
                if (self._activePageId === pageId) self._openEditor(pageId);
                else self._renderAll();
            }).catch(function(err) {
                Toast.show(err.message || 'Error al restaurar', 'error');
            });
        });
    };

    SectionController.prototype._resetAll = function() {
        var self = this;
        var pages = this.schema.all();

        Confirm.show('Restaurar todas las paginas', 'Se restauraran los valores originales de TODAS las paginas del sitio. Esta accion no se puede deshacer.', function() {
            var operations = pages.map(function(page) {
                var fields = {};
                page.fields.forEach(function(f) { fields[f.key] = f.default; });
                var r = self.service.savePage(page.id, fields);
                return (r && typeof r.then === 'function') ? r : Promise.resolve(r);
            });

            Promise.all(operations).then(function(results) {
                var failed = results.filter(function(r) { return !r.success; }).length;
                Toast.show(failed === 0 ? 'Todas las paginas restauradas' : (failed + ' pagina(s) con error'), failed === 0 ? 'success' : 'error');
                self._backToList();
            }).catch(function(err) {
                Toast.show(err.message || 'Error al restaurar', 'error');
            });
        });
    };

    /* -- Events ----------------------------------------- */

    SectionController.prototype._bindEvents = function() {
        if (this._eventsBound) return;
        this._eventsBound = true;
        var self = this;

        window.Backstage.EventBus.on('section:saved', function() {
            if (!self._activePageId) self._renderAll();
        });
    };

    window.Backstage.Controllers.Sections = SectionController;
})();
