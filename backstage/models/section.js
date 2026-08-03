/* ============================================
   BACKSTAGE STUDIO — SectionContent Model
   Contenido editable de una pagina del sitio.
   - id: pageId segun js/site-schema.js (home, entrevistas, ...)
   - fields: objeto { fieldKey: value }
   - updatedAt: timestamp de ultima edicion
   ============================================ */

(function() {
    window.Backstage = window.Backstage || {};

    function SectionContent(data) {
        var raw = data || {};
        this.id = raw.id || '';
        this.fields = (raw.fields && typeof raw.fields === 'object') ? raw.fields : {};
        this.updatedAt = raw.updatedAt || 0;
    }

    SectionContent.prototype.toJSON = function() {
        return {
            id: this.id,
            fields: Object.assign({}, this.fields),
            updatedAt: this.updatedAt
        };
    };

    SectionContent.prototype.getField = function(key) {
        return Object.prototype.hasOwnProperty.call(this.fields, key) ? this.fields[key] : null;
    };

    SectionContent.create = function(raw) {
        return new SectionContent(raw);
    };

    window.Backstage.SectionContent = SectionContent;
})();
