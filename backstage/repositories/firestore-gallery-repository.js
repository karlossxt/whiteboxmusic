/* ============================================
   BACKSTAGE STUDIO — Firestore Gallery Repository
   Eventos fotograficos persistidos en Cloud Firestore.
   Coleccion: gallery

   - Lecturas usan la cache en memoria precargada (sync).
   - Escrituras esperan confirmacion de Firestore.
   ============================================ */

(function() {
    window.Backstage = window.Backstage || {};

    var COLLECTION = 'gallery';

    function FirestoreGalleryRepository(registry) {
        this.registry = registry;
        this.datasource = registry;
        this.storageKey = COLLECTION;
        this.ModelClass = window.Backstage.GalleryEvent;
        this._cache = null;
    }

    FirestoreGalleryRepository.prototype._getFirestore = function() {
        return this.registry.sources['firestore'];
    };

    FirestoreGalleryRepository.prototype._ensureCache = function() {
        if (this._cache) return;
        var ds = this._getFirestore();
        if (ds && ds._cache && ds._cache[COLLECTION]) {
            this._cache = ds._cache[COLLECTION].slice();
        } else {
            this._cache = [];
        }
    };

    FirestoreGalleryRepository.prototype._syncDatasourceCache = function() {
        var ds = this._getFirestore();
        if (ds) {
            ds._cache = ds._cache || {};
            ds._cache[COLLECTION] = this._cache.slice();
        }
    };

    FirestoreGalleryRepository.prototype._toModels = function(items) {
        var self = this;
        var models = [];
        for (var i = 0; i < items.length; i++) {
            try {
                models.push(new self.ModelClass(items[i]));
            } catch (e) {
                console.warn('[Backstage] Skipping corrupt gallery item', e);
            }
        }
        return models;
    };

    FirestoreGalleryRepository.prototype._generateId = function() {
        return 'evt_' + Date.now() + '_' + Math.random().toString(36).substr(2, 8);
    };

    /* -- Read (sync from cache) -------------------------- */

    FirestoreGalleryRepository.prototype.getAll = function() {
        this._ensureCache();
        var items = this._toModels(this._cache);
        items.sort(function(a, b) { return (a.order || 999) - (b.order || 999); });
        return items;
    };

    FirestoreGalleryRepository.prototype.getById = function(id) {
        this._ensureCache();
        for (var i = 0; i < this._cache.length; i++) {
            if (this._cache[i].id === id) {
                return new this.ModelClass(this._cache[i]);
            }
        }
        return null;
    };

    FirestoreGalleryRepository.prototype.getMaxOrder = function() {
        var items = this.getAll();
        var max = 0;
        items.forEach(function(item) {
            var o = parseInt(item.order, 10) || 0;
            if (o > max) max = o;
        });
        return max;
    };

    FirestoreGalleryRepository.prototype.getStats = function() {
        var items = this.getAll();
        var totalGalleryItems = 0;
        var totalSliderImages = 0;
        items.forEach(function(ev) {
            totalGalleryItems += (ev.galleryItems || []).length;
            totalSliderImages += (ev.sliderImages || []).length;
        });
        return {
            total: items.length,
            totalGalleryItems: totalGalleryItems,
            totalSliderImages: totalSliderImages,
            withContent: items.filter(function(ev) {
                return ev.galleryItems && ev.galleryItems.length > 0;
            }).length
        };
    };

    FirestoreGalleryRepository.prototype.search = function(query) {
        var q = (query || '').toLowerCase();
        return this.getAll().filter(function(item) {
            return (item.title || '').toLowerCase().indexOf(q) !== -1 ||
                   (item.subtitle || '').toLowerCase().indexOf(q) !== -1;
        });
    };

    /* -- Confirmed writes (Promises) --------------------- */

    FirestoreGalleryRepository.prototype.create = function(data) {
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

    FirestoreGalleryRepository.prototype.update = function(id, data) {
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
            var found = false;
            for (var i = 0; i < self._cache.length; i++) {
                if (self._cache[i].id === id) {
                    self._cache[i] = cachedData;
                    found = true;
                    break;
                }
            }
            if (!found) self._cache.push(cachedData);
            self._syncDatasourceCache();
            return new self.ModelClass(cachedData);
        });
    };

    FirestoreGalleryRepository.prototype.remove = function(id) {
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

    FirestoreGalleryRepository.prototype.migrateFromDefaults = function() {
        /* No-op for Firestore */
    };

    window.Backstage.FirestoreGalleryRepository = FirestoreGalleryRepository;
})();
