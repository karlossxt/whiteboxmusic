/* ============================================
   BACKSTAGE STUDIO — Import Service
   Lee el contenido guardado en localStorage
   (claves backstage_* y legacy wbox_*) y lo
   sube a Supabase usando el datasource Supabase.

   Uso:
     window.Backstage.Services.Import.run()
   Devuelve Promise con un reporte:
     { clave: { count, skipped?, error? } }
   ============================================ */

(function() {
    window.Backstage = window.Backstage || {};
    window.Backstage.Services = window.Backstage.Services || {};

    var PREFIX = 'backstage_';

    var COLLECTIONS = [
        { key: 'stories_data',       label: 'Historias' },
        { key: 'soundscapes_data',   label: 'Soundscapes' },
        { key: 'interviews_data',    label: 'Entrevistas' },
        { key: 'gallery_events_data', label: 'Galeria' },
        { key: 'site_content',       label: 'Paginas (secciones)' },
        { key: 'site_config',        label: 'Configuracion del sitio' }
    ];

    function readLocal(storageKey) {
        var out = {};
        var prefixes = [PREFIX + storageKey, 'wbox_' + storageKey];
        for (var i = 0; i < prefixes.length; i++) {
            var raw;
            try { raw = localStorage.getItem(prefixes[i]); } catch (e) { raw = null; }
            if (!raw) continue;
            try { out[prefixes[i]] = JSON.parse(raw); } catch (e) {
                console.warn('[Import] JSON corrupto en ' + prefixes[i]);
            }
        }
        return out;
    }

    /* Junta las fuentes (backstage_* y wbox_*) en un solo
       array, deduplicando por id. backstage gana en colision. */
    function mergeArrays(localData) {
        var map = {};
        var order = [];
        var keys = Object.keys(localData);
        for (var i = 0; i < keys.length; i++) {
            var arr = localData[keys[i]];
            if (!Array.isArray(arr)) continue;
            for (var j = 0; j < arr.length; j++) {
                var item = arr[j];
                if (!item || typeof item !== 'object') continue;
                var id = item.id || item._id || item.slug;
                if (!id) {
                    id = 'import-' + Date.now() + '-' + Math.random().toString(36).substr(2, 6);
                    item = Object.assign({}, item, { id: id });
                }
                if (!map[id]) { map[id] = item; order.push(id); }
            }
        }
        return order.map(function(id) { return map[id]; });
    }

    function ImportService() {}

    ImportService.prototype.run = function() {
        var sb;
        try { sb = window.getSupabaseClient(); } catch (e) { sb = null; }
        if (!sb) return Promise.reject(new Error('Cliente Supabase no disponible'));

        var ds = new window.Backstage.SupabaseDatasource(sb);
        var report = {};

        var tasks = [];
        COLLECTIONS.forEach(function(col) {
            tasks.push(function() {
                var entry = { count: 0 };
                report[col.key] = entry;

                var localData = readLocal(col.key);

                if (col.key === 'site_config') {
                    var cfg = localData[PREFIX + 'site_config'] || localData['wbox_site_config'];
                    if (!cfg || typeof cfg !== 'object') {
                        entry.skipped = true;
                        return Promise.resolve();
                    }
                    if (!cfg.id) cfg = Object.assign({}, cfg, { id: 'site' });
                    return ds.set(col.key, cfg)
                        .then(function() { entry.count = 1; })
                        .catch(function(err) { entry.error = err.message || String(err); });
                }

                var items = mergeArrays(localData);
                if (items.length === 0) {
                    entry.skipped = true;
                    return Promise.resolve();
                }
                return ds.set(col.key, items)
                    .then(function() { entry.count = items.length; })
                    .catch(function(err) { entry.error = err.message || String(err); });
            });
        });

        var chain = Promise.resolve();
        tasks.forEach(function(t) { chain = chain.then(t); });

        return chain.then(function() { return report; });
    };

    window.Backstage.Services.Import = new ImportService();
    window.Backstage.Services.Import._labels = COLLECTIONS;
})();