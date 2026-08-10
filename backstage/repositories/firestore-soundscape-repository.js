/* ============================================
   BACKSTAGE STUDIO — Firestore Soundscape Repository
   CRUD confirmado por Firestore.
   - Lecturas leen de caché en memoria (sync).
   - Escrituras esperan confirmación de Firestore antes de actualizar caché.
   ============================================ */

(function() {
    window.Backstage = window.Backstage || {};

    var COLLECTION = 'soundscapes';

    function FirestoreSoundscapeRepository(registry) {
        this.registry = registry;
        this.datasource = registry;
        this.storageKey = COLLECTION;
        this.ModelClass = window.Backstage.Soundscape;
        this._cache = [];
    }

    /* -- Helpers ------------------------------------------ */

    FirestoreSoundscapeRepository.prototype._getFirestore = function() {
        return this.registry.sources['firestore'];
    };

    FirestoreSoundscapeRepository.prototype._ensureCache = function() {
        if (this._cache.length === 0) {
            this._loadCache();
        }
    };

    FirestoreSoundscapeRepository.prototype._loadCache = function() {
        var ds = this._getFirestore();
        if (ds && ds._cache && ds._cache[COLLECTION]) {
            this._cache = ds._cache[COLLECTION].slice();
        }
        this._cache.sort(function(a, b) {
            return (a.order || 999) - (b.order || 999);
        });
    };

    FirestoreSoundscapeRepository.prototype._syncDatasourceCache = function() {
        var ds = this._getFirestore();
        if (ds) {
            ds._cache = ds._cache || {};
            ds._cache[COLLECTION] = this._cache.slice();
        }
    };

    FirestoreSoundscapeRepository.prototype._toModels = function(items) {
        var self = this;
        var models = [];
        for (var i = 0; i < items.length; i++) {
            try {
                models.push(new self.ModelClass(items[i]));
            } catch (e) {
                console.warn('[Backstage] Skipping corrupt soundscape item', e);
            }
        }
        return models;
    };

    FirestoreSoundscapeRepository.prototype._generateId = function() {
        return 'id-' + Date.now() + '-' + Math.random().toString(36).substr(2, 5);
    };

    /* -- Read (sync from cache) -------------------------- */

    FirestoreSoundscapeRepository.prototype.getAll = function() {
        this._ensureCache();
        return this._toModels(this._cache);
    };

    FirestoreSoundscapeRepository.prototype.getById = function(id) {
        this._ensureCache();
        for (var i = 0; i < this._cache.length; i++) {
            if (this._cache[i].id === id) {
                return new this.ModelClass(this._cache[i]);
            }
        }
        return null;
    };

    FirestoreSoundscapeRepository.prototype.getMaxOrder = function() {
        var items = this.getAll();
        var max = 0;
        items.forEach(function(item) {
            var o = parseInt(item.order, 10) || 0;
            if (o > max) max = o;
        });
        return max;
    };

    FirestoreSoundscapeRepository.prototype.count = function() {
        this._ensureCache();
        return this._cache.length;
    };

    /* -- Query methods (sync from cache) ---------------- */

    FirestoreSoundscapeRepository.prototype.search = function(query) {
        var q = (query || '').toLowerCase();
        return this.getAll().filter(function(item) {
            return (item.title || '').toLowerCase().indexOf(q) !== -1 ||
                   (item.artist || '').toLowerCase().indexOf(q) !== -1 ||
                   (item.playlist || '').toLowerCase().indexOf(q) !== -1 ||
                   (item.category || '').toLowerCase().indexOf(q) !== -1;
        });
    };

    FirestoreSoundscapeRepository.prototype.filterByStatus = function(status) {
        if (!status || status === 'all') return this.getAll();
        if (status === 'published') return this.getAll().filter(function(s) { return s.isPublished(); });
        if (status === 'draft') return this.getAll().filter(function(s) { return !s.isPublished(); });
        return this.getAll();
    };

    FirestoreSoundscapeRepository.prototype.getPublished = function() {
        return this.getAll().filter(function(item) { return item.isPublished(); });
    };

    FirestoreSoundscapeRepository.prototype.getStats = function() {
        var items = this.getAll();
        var playlists = {};
        items.forEach(function(s) {
            if (s.playlist) playlists[s.playlist] = true;
        });
        return {
            total: items.length,
            published: items.filter(function(s) { return s.isPublished(); }).length,
            draft: items.filter(function(s) { return !s.isPublished(); }).length,
            playlists: Object.keys(playlists).length
        };
    };

    /* -- Confirmed CRUD (returns Promises) --------------- */

    FirestoreSoundscapeRepository.prototype.create = function(data) {
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

    FirestoreSoundscapeRepository.prototype.update = function(id, data) {
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

    FirestoreSoundscapeRepository.prototype.remove = function(id) {
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

    FirestoreSoundscapeRepository.prototype.togglePublished = function(id) {
        var self = this;
        var item = this.getById(id);
        if (!item) return Promise.reject(new Error('Cancion no encontrada'));
        var data = item.toJSON();
        data.published = !item.isPublished();
        data.updatedAt = Date.now();
        return this.update(id, data);
    };

    FirestoreSoundscapeRepository.prototype.toggleFeatured = function(id) {
        var self = this;
        var item = this.getById(id);
        if (!item) return Promise.reject(new Error('Cancion no encontrada'));
        var data = item.toJSON();
        data.featured = !item.isFeatured();
        data.updatedAt = Date.now();
        return this.update(id, data);
    };

    FirestoreSoundscapeRepository.prototype.migrateFromDefaults = function() {
        /* No-op for Firestore */
    };

    window.Backstage.FirestoreSoundscapeRepository = FirestoreSoundscapeRepository;
})();
