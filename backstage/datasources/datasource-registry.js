/* ============================================
   BACKSTAGE STUDIO — Datasource Registry
   Selecciona y expone el datasource activo.
   Soporta 'local' (localStorage) y 'firestore'.
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

    DatasourceRegistry.prototype.getActiveType = function() {
        return this.active ? this.active.type : 'none';
    };

    DatasourceRegistry.prototype.isFirestore = function() {
        return this.getActiveType() === 'firestore';
    };

    DatasourceRegistry.prototype.isLocal = function() {
        return this.getActiveType() === 'local';
    };

    /* Synchronous interface (works with local datasource) */
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

    /* Async interface (works with both, wraps local in Promise) */
    DatasourceRegistry.prototype.getAsync = function(key) {
        var result = this.active.get(key);
        if (result && typeof result.then === 'function') {
            return result;
        }
        return Promise.resolve(result);
    };

    DatasourceRegistry.prototype.setAsync = function(key, value) {
        var result = this.active.set(key, value);
        if (result && typeof result.then === 'function') {
            return result;
        }
        return Promise.resolve(result);
    };

    DatasourceRegistry.prototype.removeAsync = function(key) {
        var result = this.active.remove(key);
        if (result && typeof result.then === 'function') {
            return result;
        }
        return Promise.resolve(result);
    };

    DatasourceRegistry.prototype.getWithDefaultAsync = function(key, defaultData) {
        var result = this.active.getWithDefault(key, defaultData);
        if (result && typeof result.then === 'function') {
            return result;
        }
        return Promise.resolve(result);
    };

    window.Backstage.DatasourceRegistry = DatasourceRegistry;
})();
