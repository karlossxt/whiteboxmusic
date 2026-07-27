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
        var raw = this.datasource.getWithDefault(this.storageKey, defaultData || []);
        return raw.map(function(item) {
            return new this.ModelClass(item);
        }.bind(this));
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
        this.save(items);
        return model;
    };

    BaseRepository.prototype.update = function(id, data) {
        var items = this.getAll();
        for (var i = 0; i < items.length; i++) {
            if (items[i].id === id) {
                data.id = id;
                items[i] = new this.ModelClass(data);
                this.save(items);
                return items[i];
            }
        }
        return null;
    };

    BaseRepository.prototype.remove = function(id) {
        var items = this.getAll();
        var filtered = items.filter(function(item) { return item.id !== id; });
        this.save(filtered);
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
