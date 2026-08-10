/* ============================================
   BACKSTAGE STUDIO — Firestore Interview Repository
   CRUD confirmado por Firestore.
   - Lecturas leen de caché en memoria (sync).
   - Escrituras esperan confirmación de Firestore antes de actualizar caché.
   - Si Firestore falla, la caché NO se modifica.
   ============================================ */

(function() {
    window.Backstage = window.Backstage || {};

    var COLLECTION = 'interviews';

    function FirestoreInterviewRepository(registry) {
        this.registry = registry;
        this.datasource = registry;
        this.storageKey = COLLECTION;
        this.ModelClass = window.Backstage.Interview;
        this._cache = [];
    }

    /* -- Helpers ------------------------------------------ */

    FirestoreInterviewRepository.prototype._getFirestore = function() {
        return this.registry.sources['firestore'];
    };

    FirestoreInterviewRepository.prototype._ensureCache = function() {
        if (this._cache.length === 0) {
            this._loadCache();
        }
    };

    FirestoreInterviewRepository.prototype._loadCache = function() {
        var ds = this._getFirestore();
        if (ds && ds._cache && ds._cache[COLLECTION]) {
            this._cache = ds._cache[COLLECTION].slice();
        }
        this._cache.sort(function(a, b) {
            return (a.order || 999) - (b.order || 999);
        });
    };

    FirestoreInterviewRepository.prototype._syncDatasourceCache = function() {
        var ds = this._getFirestore();
        if (ds) {
            ds._cache = ds._cache || {};
            ds._cache[COLLECTION] = this._cache.slice();
        }
    };

    FirestoreInterviewRepository.prototype._toModels = function(items) {
        var self = this;
        var models = [];
        for (var i = 0; i < items.length; i++) {
            try {
                models.push(new self.ModelClass(items[i]));
            } catch (e) {
                console.warn('[Backstage] Skipping corrupt interview item', e);
            }
        }
        return models;
    };

    FirestoreInterviewRepository.prototype._generateId = function() {
        return 'id-' + Date.now() + '-' + Math.random().toString(36).substr(2, 5);
    };

    /* -- Read (sync from cache) -------------------------- */

    FirestoreInterviewRepository.prototype.getAll = function() {
        this._ensureCache();
        return this._toModels(this._cache);
    };

    FirestoreInterviewRepository.prototype.getById = function(id) {
        this._ensureCache();
        for (var i = 0; i < this._cache.length; i++) {
            if (this._cache[i].id === id) {
                return new this.ModelClass(this._cache[i]);
            }
        }
        return null;
    };

    FirestoreInterviewRepository.prototype.getMaxOrder = function() {
        var items = this.getAll();
        var max = 0;
        items.forEach(function(item) {
            var o = parseInt(item.order, 10) || 0;
            if (o > max) max = o;
        });
        return max;
    };

    FirestoreInterviewRepository.prototype.count = function() {
        this._ensureCache();
        return this._cache.length;
    };

    /* -- Query methods (sync from cache) ---------------- */

    FirestoreInterviewRepository.prototype.search = function(query) {
        var q = (query || '').toLowerCase();
        return this.getAll().filter(function(iv) {
            return (iv.title || '').toLowerCase().indexOf(q) !== -1 ||
                   (iv.author || '').toLowerCase().indexOf(q) !== -1 ||
                   (iv.excerpt || '').toLowerCase().indexOf(q) !== -1 ||
                   (iv.category || '').toLowerCase().indexOf(q) !== -1;
        });
    };

    FirestoreInterviewRepository.prototype.filterByStatus = function(status) {
        if (!status || status === 'all') return this.getAll();
        if (status === 'featured') return this.getAll().filter(function(iv) { return iv.isPublished() && iv.isFeatured(); });
        if (status === 'published') return this.getAll().filter(function(iv) { return iv.isPublished(); });
        if (status === 'draft') return this.getAll().filter(function(iv) { return !iv.isPublished(); });
        return this.getAll();
    };

    FirestoreInterviewRepository.prototype.filterByCategory = function(category) {
        if (!category || category === 'all') return this.getAll();
        return this.getAll().filter(function(iv) { return iv.category === category; });
    };

    FirestoreInterviewRepository.prototype.getPublished = function() {
        return this.getAll().filter(function(iv) { return iv.isPublished(); });
    };

    FirestoreInterviewRepository.prototype.getFeatured = function() {
        return this.getAll().filter(function(iv) { return iv.isFeatured(); });
    };

    FirestoreInterviewRepository.prototype.getStats = function() {
        var items = this.getAll();
        var lastModified = 0;
        items.forEach(function(iv) {
            var t = iv.updatedAt || 0;
            if (t > lastModified) lastModified = t;
        });
        return {
            total: items.length,
            published: items.filter(function(iv) { return iv.isPublished(); }).length,
            draft: items.filter(function(iv) { return !iv.isPublished(); }).length,
            featured: items.filter(function(iv) { return iv.isPublished() && iv.isFeatured(); }).length,
            lastModified: lastModified
        };
    };

    FirestoreInterviewRepository.prototype.isSlugUnique = function(slug, excludeId) {
        if (!slug) return false;
        var items = this.getAll();
        for (var i = 0; i < items.length; i++) {
            if (items[i].slug === slug && items[i].id !== excludeId) return false;
        }
        return true;
    };

    FirestoreInterviewRepository.prototype.findBySlug = function(slug) {
        var items = this.getAll();
        for (var i = 0; i < items.length; i++) {
            if (items[i].slug === slug) return items[i];
        }
        return null;
    };

    /* -- Confirmed CRUD (returns Promises) --------------- */

    FirestoreInterviewRepository.prototype.create = function(data) {
        var self = this;
        var ds = this._getFirestore();
        if (!ds) return Promise.reject(new Error('Firestore no disponible'));

        if (!data.id) data.id = this._generateId();
        var docId = data.id;

        return ds.createDoc(COLLECTION, data, docId).then(function(result) {
            var cachedData = Object.assign({}, result, { id: docId });
            self._ensureCache();
            self._cache.push(cachedData);
            self._cache.sort(function(a, b) {
                return (a.order || 999) - (b.order || 999);
            });
            self._syncDatasourceCache();
            return new self.ModelClass(cachedData);
        });
    };

    FirestoreInterviewRepository.prototype.update = function(id, data) {
        var self = this;
        var ds = this._getFirestore();
        if (!ds) return Promise.reject(new Error('Firestore no disponible'));

        var docData = {};
        Object.keys(data).forEach(function(k) {
            if (k !== 'id') docData[k] = data[k];
        });

        return ds.updateDoc(COLLECTION, id, docData).then(function(result) {
            var cachedData = Object.assign({}, result, { id: id });
            self._ensureCache();
            for (var i = 0; i < self._cache.length; i++) {
                if (self._cache[i].id === id) {
                    self._cache[i] = cachedData;
                    break;
                }
            }
            self._syncDatasourceCache();
            return new self.ModelClass(cachedData);
        });
    };

    FirestoreInterviewRepository.prototype.remove = function(id) {
        var self = this;
        var ds = this._getFirestore();
        if (!ds) return Promise.reject(new Error('Firestore no disponible'));

        return ds.deleteDoc(COLLECTION, id).then(function() {
            self._ensureCache();
            self._cache = self._cache.filter(function(item) {
                return item.id !== id;
            });
            self._syncDatasourceCache();
            return true;
        });
    };

    FirestoreInterviewRepository.prototype.togglePublished = function(id) {
        var self = this;
        var iv = this.getById(id);
        if (!iv) return Promise.reject(new Error('Entrevista no encontrada'));
        var data = iv.toJSON();
        data.published = !iv.isPublished();
        data.updatedAt = Date.now();
        return this.update(id, data);
    };

    FirestoreInterviewRepository.prototype.toggleFeatured = function(id) {
        var self = this;
        var iv = this.getById(id);
        if (!iv) return Promise.reject(new Error('Entrevista no encontrada'));
        var data = iv.toJSON();
        data.featured = !iv.isFeatured();
        data.updatedAt = Date.now();
        return this.update(id, data);
    };

    FirestoreInterviewRepository.prototype.migrateFromDefaults = function() {
        /* No-op for Firestore */
    };

    window.Backstage.FirestoreInterviewRepository = FirestoreInterviewRepository;
})();
