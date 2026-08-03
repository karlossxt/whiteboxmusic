/* ============================================
   BACKSTAGE STUDIO — Firestore Section Repository
   Contenido del sitio persistido en Cloud Firestore.
   Coleccion: site_content
   Cada documento usa como id el pageId (home, entrevistas, ...)
   y su data es { fields: { key: value }, updatedAt }.

   - Lecturas usan la cache en memoria precargada (sync).
   - Escrituras esperan confirmacion de Firestore.
   ============================================ */

(function() {
    window.Backstage = window.Backstage || {};

    var COLLECTION = 'site_content';

    function FirestoreSectionRepository(registry) {
        this.registry = registry;
        this.datasource = registry;
        this.storageKey = COLLECTION;
        this.ModelClass = window.Backstage.SectionContent;
        this._cache = null;
    }

    FirestoreSectionRepository.prototype._getFirestore = function() {
        return this.registry.sources['firestore'];
    };

    FirestoreSectionRepository.prototype._ensureCache = function() {
        if (this._cache) return;
        var ds = this._getFirestore();
        if (ds && ds._cache && ds._cache[COLLECTION]) {
            this._cache = ds._cache[COLLECTION].slice();
        } else {
            this._cache = [];
        }
    };

    FirestoreSectionRepository.prototype._syncDatasourceCache = function() {
        var ds = this._getFirestore();
        if (ds) {
            ds._cache = ds._cache || {};
            ds._cache[COLLECTION] = this._cache.slice();
        }
    };

    FirestoreSectionRepository.prototype._toModels = function(items) {
        var self = this;
        var models = [];
        for (var i = 0; i < items.length; i++) {
            try {
                models.push(new self.ModelClass(items[i]));
            } catch (e) {
                console.warn('[Backstage] Skipping corrupt section item', e);
            }
        }
        return models;
    };

    /* -- Read (sync from cache) -------------------------- */

    FirestoreSectionRepository.prototype.getAll = function() {
        this._ensureCache();
        return this._toModels(this._cache);
    };

    FirestoreSectionRepository.prototype.getById = function(pageId) {
        this._ensureCache();
        for (var i = 0; i < this._cache.length; i++) {
            if (this._cache[i].id === pageId) {
                return new this.ModelClass(this._cache[i]);
            }
        }
        return null;
    };

    FirestoreSectionRepository.prototype.getByPageId = function(pageId) {
        return this.getById(pageId);
    };

    FirestoreSectionRepository.prototype.getStats = function() {
        var items = this.getAll();
        var edited = 0;
        var lastModified = 0;
        items.forEach(function(page) {
            if (page.updatedAt > 0) edited++;
            if (page.updatedAt > lastModified) lastModified = page.updatedAt;
        });
        return { total: items.length, edited: edited, lastModified: lastModified };
    };

    /* -- Confirmed writes (Promises) --------------------- */

    FirestoreSectionRepository.prototype.savePage = function(pageId, fields) {
        var self = this;
        var ds = this._getFirestore();
        if (!ds) return Promise.reject(new Error('Firestore no disponible'));

        var docData = { fields: fields, updatedAt: Date.now() };

        return ds.updateDoc(COLLECTION, pageId, docData).then(function() {
            var cached = { id: pageId, fields: fields, updatedAt: docData.updatedAt };
            self._ensureCache();
            var found = false;
            for (var i = 0; i < self._cache.length; i++) {
                if (self._cache[i].id === pageId) {
                    self._cache[i] = cached;
                    found = true;
                    break;
                }
            }
            if (!found) self._cache.push(cached);
            self._syncDatasourceCache();
            return new self.ModelClass(cached);
        });
    };

    window.Backstage.FirestoreSectionRepository = FirestoreSectionRepository;
})();
