/* ============================================
   BACKSTAGE STUDIO — Firestore Story Repository
   CRUD confirmado por Firestore.
   - Lecturas leen de caché en memoria (sync).
   - Escrituras esperan confirmación de Firestore antes de actualizar caché.
   - Si Firestore falla, la caché NO se modifica.
   - Todos los writes usan métodos del datasource
     (createDoc, updateDoc, deleteDoc) para error
     translation centralizada.
   ============================================ */

(function() {
    window.Backstage = window.Backstage || {};

    var COLLECTION = 'stories';

    function FirestoreStoryRepository(registry) {
        this.registry = registry;
        this.datasource = registry;
        this.storageKey = COLLECTION;
        this.ModelClass = window.Backstage.Story;
        this._cache = [];
    }

    /* -- Helpers ------------------------------------------ */

    FirestoreStoryRepository.prototype._getFirestore = function() {
        return this.registry.sources['firestore'];
    };

    FirestoreStoryRepository.prototype._ensureCache = function() {
        if (this._cache.length === 0) {
            this._loadCache();
        }
    };

    FirestoreStoryRepository.prototype._loadCache = function() {
        var ds = this._getFirestore();
        if (ds && ds._cache && ds._cache[COLLECTION]) {
            this._cache = ds._cache[COLLECTION].slice();
        }
        this._cache.sort(function(a, b) {
            return (a.order || 999) - (b.order || 999);
        });
    };

    FirestoreStoryRepository.prototype._syncDatasourceCache = function() {
        var ds = this._getFirestore();
        if (ds) {
            ds._cache = ds._cache || {};
            ds._cache[COLLECTION] = this._cache.slice();
        }
    };

    FirestoreStoryRepository.prototype._toModels = function(items) {
        var self = this;
        var models = [];
        for (var i = 0; i < items.length; i++) {
            try {
                models.push(new self.ModelClass(items[i]));
            } catch (e) {
                console.warn('[Backstage] Skipping corrupt item', e);
            }
        }
        return models;
    };

    FirestoreStoryRepository.prototype._generateId = function() {
        return 'id-' + Date.now() + '-' + Math.random().toString(36).substr(2, 5);
    };

    /* -- Read (sync from cache) -------------------------- */

    FirestoreStoryRepository.prototype.getAll = function() {
        this._ensureCache();
        return this._toModels(this._cache);
    };

    FirestoreStoryRepository.prototype.getById = function(id) {
        this._ensureCache();
        for (var i = 0; i < this._cache.length; i++) {
            if (this._cache[i].id === id) {
                return new this.ModelClass(this._cache[i]);
            }
        }
        return null;
    };

    FirestoreStoryRepository.prototype.getMaxOrder = function() {
        var items = this.getAll();
        var max = 0;
        items.forEach(function(item) {
            var o = parseInt(item.order, 10) || 0;
            if (o > max) max = o;
        });
        return max;
    };

    FirestoreStoryRepository.prototype.count = function() {
        this._ensureCache();
        return this._cache.length;
    };

    /* -- Query methods (sync from cache) ---------------- */

    FirestoreStoryRepository.prototype.search = function(query) {
        var q = (query || '').toLowerCase();
        return this.getAll().filter(function(story) {
            return (story.title || '').toLowerCase().indexOf(q) !== -1 ||
                   (story.author || '').toLowerCase().indexOf(q) !== -1 ||
                   (story.excerpt || '').toLowerCase().indexOf(q) !== -1 ||
                   (story.category || '').toLowerCase().indexOf(q) !== -1;
        });
    };

    FirestoreStoryRepository.prototype.filterByStatus = function(status) {
        if (!status || status === 'all') return this.getAll();
        if (status === 'featured') return this.getAll().filter(function(s) { return s.isPublished() && s.isFeatured(); });
        return this.getAll().filter(function(story) { return story.status === status; });
    };

    FirestoreStoryRepository.prototype.filterByCategory = function(category) {
        if (!category || category === 'all') return this.getAll();
        return this.getAll().filter(function(story) { return story.category === category; });
    };

    FirestoreStoryRepository.prototype.getPublished = function() {
        return this.getAll().filter(function(story) { return story.isPublished(); });
    };

    FirestoreStoryRepository.prototype.getFeatured = function() {
        return this.getAll().filter(function(story) { return story.isFeatured(); });
    };

    FirestoreStoryRepository.prototype.getStats = function() {
        var items = this.getAll();
        var lastModified = 0;
        items.forEach(function(s) {
            var t = s.updatedAt || 0;
            if (t > lastModified) lastModified = t;
        });
        return {
            total: items.length,
            published: items.filter(function(s) { return s.isPublished(); }).length,
            draft: items.filter(function(s) { return s.isDraft(); }).length,
            featured: items.filter(function(s) { return s.isPublished() && s.isFeatured(); }).length,
            lastModified: lastModified
        };
    };

    FirestoreStoryRepository.prototype.isSlugUnique = function(slug, excludeId) {
        if (!slug) return false;
        var items = this.getAll();
        for (var i = 0; i < items.length; i++) {
            if (items[i].slug === slug && items[i].id !== excludeId) return false;
        }
        return true;
    };

    FirestoreStoryRepository.prototype.findBySlug = function(slug) {
        var items = this.getAll();
        for (var i = 0; i < items.length; i++) {
            if (items[i].slug === slug) return items[i];
        }
        return null;
    };

    /* -- Confirmed CRUD (returns Promises) --------------- */

    FirestoreStoryRepository.prototype.create = function(data) {
        var self = this;
        var ds = this._getFirestore();
        if (!ds) return Promise.reject(new Error('Firestore no disponible'));

        if (!data.id) data.id = this._generateId();
        var docId = data.id;

        return ds.createDoc(COLLECTION, data, docId).then(function(result) {
            var cachedData = Object.assign({}, result, { id: docId });
            self._ensureCache();
            self._cache.push(cachedData);
            self._syncDatasourceCache();
            return new self.ModelClass(cachedData);
        });
    };

    FirestoreStoryRepository.prototype.update = function(id, data) {
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

    FirestoreStoryRepository.prototype.remove = function(id) {
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

    FirestoreStoryRepository.prototype.toggleStatus = function(id) {
        var self = this;
        var story = this.getById(id);
        if (!story) return Promise.reject(new Error('Historia no encontrada'));
        var data = story.toJSON();
        data.status = story.isPublished() ? 'draft' : 'published';
        data.updatedAt = Date.now();
        return this.update(id, data);
    };

    FirestoreStoryRepository.prototype.toggleFeatured = function(id) {
        var self = this;
        var story = this.getById(id);
        if (!story) return Promise.reject(new Error('Historia no encontrada'));
        var data = story.toJSON();
        data.featured = !story.isFeatured();
        data.updatedAt = Date.now();
        return this.update(id, data);
    };

    /* -- Manual migration from localStorage -------------- */

    FirestoreStoryRepository.prototype.importLocalStories = function() {
        var self = this;
        var ds = this._getFirestore();
        if (!ds) return Promise.reject(new Error('Firestore no disponible'));

        /* --- Guard: block if Firestore already has stories --- */
        self._ensureCache();
        if (self._cache.length > 0) {
            return Promise.resolve({
                success: false,
                imported: 0,
                skipped: 0,
                failed: 0,
                blocked: true,
                message: 'Firestore ya contiene historias. La importacion fue cancelada para evitar sobrescribir o mezclar informacion.'
            });
        }

        var LOCAL_KEY = 'backstage_stories_data';
        var LEGACY_KEY = 'wbox_stories_data';

        var localData = null;
        try {
            var raw = localStorage.getItem(LOCAL_KEY);
            if (raw) localData = JSON.parse(raw);
        } catch (e) { localData = null; }

        if (!localData) {
            try {
                var legacyRaw = localStorage.getItem(LEGACY_KEY);
                if (legacyRaw) localData = JSON.parse(legacyRaw);
            } catch (e) { localData = null; }
        }

        if (!localData || !localData.length) {
            return Promise.resolve({
                success: true,
                imported: 0,
                skipped: 0,
                failed: 0,
                message: 'No hay historias locales para importar'
            });
        }

        var normalized = [];
        localData.forEach(function(story) {
            try {
                var model = new window.Backstage.Story(story);
                var json = model.toJSON();
                if (!json.id) json.id = 'id-' + Date.now() + '-' + Math.random().toString(36).substr(2, 5);
                normalized.push(json);
            } catch (e) {
                console.warn('[Backstage] Skipping invalid local story during import', e);
            }
        });

        if (normalized.length === 0) {
            return Promise.resolve({
                success: true,
                imported: 0,
                skipped: 0,
                failed: 0,
                message: 'No se pudieron normalizar las historias locales'
            });
        }

        var colRef = ds._collectionRef(COLLECTION);
        var batch = ds._getDb().batch();
        normalized.forEach(function(story) {
            var docData = {};
            Object.keys(story).forEach(function(k) {
                if (k !== 'id') docData[k] = story[k];
            });
            batch.set(colRef.doc(story.id), docData);
        });

        return batch.commit().then(function() {
            normalized.forEach(function(story) {
                self._cache.push(story);
            });
            self._syncDatasourceCache();
            return {
                success: true,
                imported: normalized.length,
                skipped: 0,
                failed: 0,
                message: normalized.length + ' historias importadas a Firestore'
            };
        });
    };

    FirestoreStoryRepository.prototype.migrateFromDefaults = function() {
        /* No-op for Firestore */
    };

    window.Backstage.FirestoreStoryRepository = FirestoreStoryRepository;
})();
