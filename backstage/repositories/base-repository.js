/* ============================================
   BACKSTAGE STUDIO — Base Repository
   Repositorio genérico. Toda acceso a datos pasa por aquí.
   No conoce el datasource (localStorage, Firestore, etc.)
   solo llama datasource.get/set.
   ============================================ */

(function() {
    window.Backstage = window.Backstage || {};

    function BaseRepository(storageKey, datasource, ModelClass) {
        this.storageKey = storageKey;
        this.datasource = datasource;
        this.ModelClass = ModelClass;
    }

    BaseRepository.prototype.getAll = function(defaultData) {
        var raw;
        try {
            raw = this.datasource.getWithDefault(this.storageKey, defaultData || []);
        } catch (e) {
            console.error('[Backstage] Error reading data for ' + this.storageKey, e);
            raw = defaultData || [];
        }
        if (!Array.isArray(raw)) {
            console.warn('[Backstage] Data for ' + this.storageKey + ' is not an array, resetting.');
            raw = [];
        }
        var self = this;
        var items = [];
        for (var i = 0; i < raw.length; i++) {
            try {
                items.push(new self.ModelClass(raw[i]));
            } catch (e) {
                console.warn('[Backstage] Skipping corrupt item at index ' + i, e);
            }
        }
        return items;
    };

    BaseRepository.prototype.getById = function(id) {
        var items = this.getAll();
        for (var i = 0; i < items.length; i++) {
            if (items[i].id === id) return items[i];
        }
        return null;
    };

    BaseRepository.prototype.save = function(items) {
        var raw = items.map(function(item) {
            return item.toJSON ? item.toJSON() : item;
        });
        return this.datasource.set(this.storageKey, raw);
    };

    BaseRepository.prototype.create = function(item) {
        var items = this.getAll();
        if (!item.id) {
            item.id = this._generateId();
        }
        var model = new this.ModelClass(item);
        items.push(model);
        var saveResult = this.save(items);
        if (saveResult && typeof saveResult.then === 'function') {
            return saveResult.then(function() { return model; });
        }
        return model;
    };

    BaseRepository.prototype.update = function(id, data) {
        var items = this.getAll();
        for (var i = 0; i < items.length; i++) {
            if (items[i].id === id) {
                data.id = id;
                items[i] = new this.ModelClass(data);
                var saveResult = this.save(items);
                if (saveResult && typeof saveResult.then === 'function') {
                    return saveResult.then(function() { return items[i]; });
                }
                return items[i];
            }
        }
        return null;
    };

    BaseRepository.prototype.remove = function(id) {
        var items = this.getAll();
        var filtered = items.filter(function(item) { return item.id !== id; });
        var saveResult = this.save(filtered);
        if (saveResult && typeof saveResult.then === 'function') {
            return saveResult.then(function() { return filtered; });
        }
        return filtered;
    };

    BaseRepository.prototype.getMaxOrder = function() {
        var items = this.getAll();
        var max = 0;
        items.forEach(function(item) {
            var o = parseInt(item.order, 10) || 0;
            if (o > max) max = o;
        });
        return max;
    };

    BaseRepository.prototype.count = function() {
        return this.getAll().length;
    };

    BaseRepository.prototype._generateId = function() {
        return 'id-' + Date.now() + '-' + Math.random().toString(36).substr(2, 5);
    };

    window.Backstage.BaseRepository = BaseRepository;
})();
