/* ============================================
   BACKSTAGE STUDIO — Section Repository (local)
   Persistencia del contenido del sitio en localStorage.
   Clave: backstage_site_content
   Formato: array de SectionContent { id, fields, updatedAt }
   ============================================ */

(function() {
    window.Backstage = window.Backstage || {};

    var STORAGE_KEY = 'site_content';

    function SectionRepository(datasource) {
        window.Backstage.BaseRepository.call(this, STORAGE_KEY, datasource, window.Backstage.SectionContent);
    }

    SectionRepository.prototype = Object.create(window.Backstage.BaseRepository.prototype);
    SectionRepository.prototype.constructor = SectionRepository;

    SectionRepository.prototype.getByPageId = function(pageId) {
        return this.getById(pageId);
    };

    SectionRepository.prototype.getFieldValue = function(pageId, key) {
        var page = this.getById(pageId);
        return page ? page.getField(key) : null;
    };

    /* Guarda (o crea) el contenido de una pagina completa.
       fields: objeto { fieldKey: value } con los campos a sobrescribir. */
    SectionRepository.prototype.savePage = function(pageId, fields) {
        var existing = this.getById(pageId);
        var data;
        if (existing) {
            var merged = Object.assign({}, existing.fields, fields);
            data = { id: pageId, fields: merged, updatedAt: Date.now() };
            return this.update(pageId, data);
        }
        data = { id: pageId, fields: fields, updatedAt: Date.now() };
        return this.create(data);
    };

    /* Crea el baseline desde el schema si aun no existe nada guardado.
       Asi el panel muestra los valores actuales del sitio al abrirlo por primera vez. */
    SectionRepository.prototype.migrateFromDefaults = function(schema) {
        var existing = this.datasource.get(this.storageKey);
        if (existing) return;

        var baseline = [];
        var pages = schema.all();
        for (var i = 0; i < pages.length; i++) {
            var page = pages[i];
            var fields = {};
            for (var j = 0; j < page.fields.length; j++) {
                fields[page.fields[j].key] = page.fields[j].default;
            }
            baseline.push(new window.Backstage.SectionContent({
                id: page.id,
                fields: fields,
                updatedAt: 0
            }).toJSON());
        }
        this.datasource.set(this.storageKey, baseline);
    };

    SectionRepository.prototype.getStats = function() {
        var items = this.getAll();
        var edited = 0;
        var lastModified = 0;
        items.forEach(function(page) {
            if (page.updatedAt > 0) edited++;
            if (page.updatedAt > lastModified) lastModified = page.updatedAt;
        });
        return { total: items.length, edited: edited, lastModified: lastModified };
    };

    window.Backstage.SectionRepository = SectionRepository;
})();
