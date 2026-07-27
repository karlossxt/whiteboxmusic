/* Storage Service - Capa de acceso a localStorage */
(function() {
    window.WBAdmin = window.WBAdmin || {};

    var STORAGE_PREFIX = 'wbox_';

    window.WBAdmin.storage = {
        get: function(key) {
            try {
                var raw = localStorage.getItem(STORAGE_PREFIX + key);
                if (raw) return JSON.parse(raw);
            } catch (e) { /* ignore */ }
            return null;
        },

        set: function(key, value) {
            try {
                localStorage.setItem(STORAGE_PREFIX + key, JSON.stringify(value));
                return true;
            } catch (e) {
                window.WBAdmin.toast.show('Error al guardar. localStorage puede estar lleno.', 'error');
                return false;
            }
        },

        getDefault: function(key, defaultKey) {
            var data = this.get(key);
            if (data) return data;
            if (window[defaultKey]) return window[defaultKey].slice();
            return [];
        }
    };
})();
