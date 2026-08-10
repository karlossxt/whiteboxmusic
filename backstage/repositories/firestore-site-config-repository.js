/* ============================================
   BACKSTAGE STUDIO — Firestore SiteConfig Repository
   Configuracion general del sitio en Cloud Firestore.
   Coleccion: site_config (documento unico con id 'site')
   data: { siteName, tagline, ..., updatedAt }

   - Lecturas usan la cache en memoria precargada (sync).
   - Escrituras esperan confirmacion de Firestore.
   ============================================ */

(function() {
    window.Backstage = window.Backstage || {};

    var COLLECTION = 'site_config';
    var DOC_ID = 'site';

    function FirestoreSiteConfigRepository(registry) {
        this.registry = registry;
        this.datasource = registry;
        this.storageKey = COLLECTION;
        this.ModelClass = window.Backstage.SiteConfig;
        this._cache = null;
    }

    FirestoreSiteConfigRepository.prototype._getFirestore = function() {
        return this.registry.sources['firestore'];
    };

    FirestoreSiteConfigRepository.prototype._findCached = function() {
        var ds = this._getFirestore();
        if (ds && ds._cache && ds._cache[COLLECTION]) {
            for (var i = 0; i < ds._cache[COLLECTION].length; i++) {
                if (ds._cache[COLLECTION][i].id === DOC_ID) {
                    return ds._cache[COLLECTION][i];
                }
            }
        }
        return null;
    };

    FirestoreSiteConfigRepository.prototype.getConfig = function() {
        var cached = this._findCached();
        if (cached) return new this.ModelClass(cached);
        return window.Backstage.SiteConfig.defaults();
    };

    FirestoreSiteConfigRepository.prototype.saveConfig = function(data) {
        var self = this;
        var ds = this._getFirestore();
        if (!ds) return Promise.reject(new Error('Firestore no disponible'));

        var configData = Object.assign({}, data);
        delete configData.id;
        configData.updatedAt = Date.now();

        return ds.updateDoc(COLLECTION, DOC_ID, configData).then(function(result) {
            var cached = Object.assign({}, result, { id: DOC_ID });
            ds._cache = ds._cache || {};
            ds._cache[COLLECTION] = ds._cache[COLLECTION] || [];
            var found = false;
            for (var i = 0; i < ds._cache[COLLECTION].length; i++) {
                if (ds._cache[COLLECTION][i].id === DOC_ID) {
                    ds._cache[COLLECTION][i] = cached;
                    found = true;
                    break;
                }
            }
            if (!found) ds._cache[COLLECTION].push(cached);
            /* Espejo en localStorage para que las paginas publicas
               (aunque no carguen Firebase) reflejen la config guardada. */
            try {
                localStorage.setItem('backstage_site_config', JSON.stringify(cached));
            } catch (e) {
                console.warn('[Backstage] No se pudo cachear site_config en localStorage', e);
            }
            return new self.ModelClass(cached);
        });
    };

    FirestoreSiteConfigRepository.prototype.migrateFromDefaults = function() {
        /* No-op for Firestore */
    };

    window.Backstage.FirestoreSiteConfigRepository = FirestoreSiteConfigRepository;
})();
