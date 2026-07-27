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
            if (raw) {
                var parsed = JSON.parse(raw);
                return parsed;
            }
        } catch (e) {
            console.error('[Backstage] Corrupt data for key ' + PREFIX + key + ', keeping backup.');
            try {
                var backupKey = PREFIX + key + '_backup';
                if (!localStorage.getItem(backupKey)) {
                    localStorage.setItem(backupKey, localStorage.getItem(PREFIX + key));
                }
            } catch (backupErr) { /* best effort */ }
        }
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
     * Migra datos de wbox_* a backstage_* con backup, merge y deduplicación por ID.
     * Idempotente: ejecutar múltiples veces no duplica registros.
     */
    LocalDatasource.prototype.migrateFromLegacy = function(legacyKey, newKey) {
        try {
            var MIGRATION_KEY = 'backstage_migration_v1_completed';
            if (localStorage.getItem(MIGRATION_KEY) === 'done') return;

            var legacyRaw = localStorage.getItem('wbox_' + legacyKey);
            var backstageRaw = localStorage.getItem(PREFIX + newKey);

            if (!legacyRaw && !backstageRaw) {
                localStorage.setItem(MIGRATION_KEY, 'done');
                return;
            }

            var legacyData = null;
            var backstageData = null;
            try { if (legacyRaw) legacyData = JSON.parse(legacyRaw); } catch (e) { legacyData = null; }
            try { if (backstageRaw) backstageData = JSON.parse(backstageRaw); } catch (e) { backstageData = null; }

            /* Create backup */
            try {
                var backupKey = 'backstage_migration_backup_v1';
                if (!localStorage.getItem(backupKey)) {
                    var backup = {
                        version: 1,
                        createdAt: new Date().toISOString(),
                        sourceKeys: {
                            legacy: 'wbox_' + legacyKey,
                            backstage: PREFIX + newKey
                        },
                        originalData: {
                            legacy: legacyData,
                            backstage: backstageData
                        }
                    };
                    localStorage.setItem(backupKey, JSON.stringify(backup));
                }
            } catch (e) { /* backup is best-effort */ }

            /* Merge by ID, backstage wins on collision */
            var merged = [];
            var idMap = {};
            var i, item, id;

            if (backstageData && backstageData.length) {
                for (i = 0; i < backstageData.length; i++) {
                    item = backstageData[i];
                    id = item.id || ('item-' + i);
                    idMap[id] = item;
                }
            }

            if (legacyData && legacyData.length) {
                for (i = 0; i < legacyData.length; i++) {
                    item = legacyData[i];
                    id = item.id || ('item-' + i);
                    if (!idMap[id]) {
                        idMap[id] = item;
                    }
                }
            }

            var keys = Object.keys(idMap);
            for (i = 0; i < keys.length; i++) {
                merged.push(idMap[keys[i]]);
            }

            if (merged.length > 0) {
                localStorage.setItem(PREFIX + newKey, JSON.stringify(merged));
            }

            localStorage.setItem(MIGRATION_KEY, 'done');
        } catch (e) { /* migration is best-effort */ }
    };

    window.Backstage.LocalDatasource = LocalDatasource;
})();
