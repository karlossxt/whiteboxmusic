/* ============================================
   BACKSTAGE STUDIO — Section Service
   Orquesta la lectura/guardado del contenido del sitio.
   Soporta repositorio local (sync) y Firestore (async).
   ============================================ */

(function() {
    window.Backstage = window.Backstage || {};

    function SectionService(sectionRepository, schema) {
        this.repository = sectionRepository;
        this.schema = schema;
    }

    SectionService.prototype.getAll = function() {
        return this.repository.getAll();
    };

    /* Devuelve la pagina con contenido guardado, o un modelo
       baseline con los valores por defecto del schema. */
    SectionService.prototype.getPage = function(pageId) {
        var page = this.repository.getByPageId(pageId);
        if (page) return page;

        var schemaPage = this.schema.getById(pageId);
        var fields = {};
        if (schemaPage) {
            for (var i = 0; i < schemaPage.fields.length; i++) {
                fields[schemaPage.fields[i].key] = schemaPage.fields[i].default;
            }
        }
        return new window.Backstage.SectionContent({ id: pageId, fields: fields, updatedAt: 0 });
    };

    SectionService.prototype.getStats = function() {
        return this.repository.getStats();
    };

    SectionService.prototype.validate = function(fields) {
        var errors = [];
        if (!fields || typeof fields !== 'object') {
            errors.push('No hay datos que guardar');
            return { valid: false, errors: errors };
        }
        return { valid: true, errors: errors };
    };

    /* Guarda los campos de una pagina. Devuelve un modelo
       (repo local) o una Promise (repo Firestore). */
    SectionService.prototype.savePage = function(pageId, fields) {
        var validation = this.validate(fields);
        if (!validation.valid) return { success: false, errors: validation.errors };

        var schemaPage = this.schema.getById(pageId);
        var allowedKeys = {};
        if (schemaPage) {
            for (var i = 0; i < schemaPage.fields.length; i++) {
                allowedKeys[schemaPage.fields[i].key] = true;
            }
        }

        var cleaned = {};
        Object.keys(fields).forEach(function(k) {
            if (!allowedKeys[k]) return;
            var v = fields[k];
            if (v === null || v === undefined) return;
            cleaned[k] = typeof v === 'string' ? v : String(v);
        });

        var result = this.repository.savePage(pageId, cleaned);

        if (result && typeof result.then === 'function') {
            var self = this;
            return result.then(function(saved) {
                window.Backstage.EventBus.emit('section:saved', { pageId: pageId, data: saved });
                return { success: true, data: saved };
            }).catch(function(err) {
                console.error('[Backstage] Error guardando seccion en Firestore', err);
                return { success: false, errors: [err.message || 'Error al guardar en Firestore'] };
            });
        }

        window.Backstage.EventBus.emit('section:saved', { pageId: pageId, data: result });
        return { success: !!result, data: result };
    };

    window.Backstage.SectionService = SectionService;
})();
