/* ============================================
   BACKSTAGE STUDIO — Local Datasource
   Capa de persistencia con localStorage.
   Único archivo que debe usar localStorage directamente.
   ============================================ */

(function() {
    window.Backstage = window.Backstage || {};

    var PREFIX = 'backstage_';

    function LocalDatasource() {
        this.type = 'local';
    }

    LocalDatasource.prototype.get = function(key) {
        try {
            var raw = localStorage.getItem(PREFIX + key);
            if (raw) return JSON.parse(raw);
        } catch (e) { /* ignore */ }
        return null;
    };

    LocalDatasource.prototype.set = function(key, value) {
        try {
            localStorage.setItem(PREFIX + key, JSON.stringify(value));
            return true;
        } catch (e) {
            return false;
        }
    };

    LocalDatasource.prototype.remove = function(key) {
        try {
            localStorage.removeItem(PREFIX + key);
            return true;
        } catch (e) {
            return false;
        }
    };

    LocalDatasource.prototype.getWithDefault = function(key, defaultData) {
        var data = this.get(key);
        if (data) return data;
        if (defaultData) return defaultData.slice();
        return [];
    };

    /**
     * Migración: lee datos del antiguo prefijo 'wbox_' y los migra a 'backstage_'.
     * Se ejecuta una sola vez al inicio.
     */
    LocalDatasource.prototype.migrateFromLegacy = function(legacyKey, newKey) {
        try {
            var legacy = localStorage.getItem('wbox_' + legacyKey);
            if (legacy && !localStorage.getItem(PREFIX + newKey)) {
                localStorage.setItem(PREFIX + newKey, legacy);
            }
        } catch (e) { /* ignore */ }
    };

    window.Backstage.LocalDatasource = LocalDatasource;
})();
