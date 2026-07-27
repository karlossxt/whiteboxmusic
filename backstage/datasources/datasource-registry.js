/* ============================================
   BACKSTAGE STUDIO — Datasource Registry
   Selecciona y expone el datasource activo.
   
   Para cambiar a Firestore en el futuro:
   1. Crear datasources/firestore/firestore-datasource.js
   2. Importarlo y configurarlo aquí
   3. Cambiar this.active = firestoreDatasource
   Ningún otro archivo se modifica.
   ============================================ */

(function() {
    window.Backstage = window.Backstage || {};

    function DatasourceRegistry() {
        this.active = null;
        this.sources = {};
    }

    DatasourceRegistry.prototype.register = function(name, datasource) {
        this.sources[name] = datasource;
    };

    DatasourceRegistry.prototype.setActive = function(name) {
        if (this.sources[name]) {
            this.active = this.sources[name];
        }
    };

    DatasourceRegistry.prototype.get = function(key) {
        return this.active.get(key);
    };

    DatasourceRegistry.prototype.set = function(key, value) {
        return this.active.set(key, value);
    };

    DatasourceRegistry.prototype.remove = function(key) {
        return this.active.remove(key);
    };

    DatasourceRegistry.prototype.getWithDefault = function(key, defaultData) {
        return this.active.getWithDefault(key, defaultData);
    };

    DatasourceRegistry.prototype.getActiveType = function() {
        return this.active ? this.active.type : 'none';
    };

    window.Backstage.DatasourceRegistry = DatasourceRegistry;
})();
