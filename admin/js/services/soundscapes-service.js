/* Soundscapes Service - CRUD de canciones */
(function() {
    window.WBAdmin = window.WBAdmin || {};

    var STORAGE_KEY = 'soundscapes_data';
    var storage = window.WBAdmin.storage;

    function generateId() {
        return 'ss-' + Date.now() + '-' + Math.random().toString(36).substr(2, 5);
    }

    window.WBAdmin.soundscapesService = {
        getAll: function() {
            return storage.getDefault(STORAGE_KEY, 'soundscapesData');
        },

        getById: function(id) {
            var items = this.getAll();
            return items.find(function(s) { return s.id === id; }) || null;
        },

        save: function(items) {
            return storage.set(STORAGE_KEY, items);
        },

        create: function(data) {
            var items = this.getAll();
            data.id = generateId();
            items.push(data);
            this.save(items);
            return data;
        },

        update: function(id, data) {
            var items = this.getAll();
            var idx = items.findIndex(function(s) { return s.id === id; });
            if (idx === -1) return null;
            data.id = id;
            items[idx] = data;
            this.save(items);
            return data;
        },

        remove: function(id) {
            var items = this.getAll();
            var filtered = items.filter(function(s) { return s.id !== id; });
            this.save(filtered);
            return filtered;
        },

        getMaxOrder: function() {
            var items = this.getAll();
            var max = 0;
            items.forEach(function(s) {
                var o = parseInt(s.order, 10) || 0;
                if (o > max) max = o;
            });
            return max;
        },

        getStats: function() {
            var items = this.getAll();
            var playlists = {};
            items.forEach(function(s) {
                if (s.playlist) playlists[s.playlist] = true;
            });
            return {
                total: items.length,
                published: items.filter(function(s) { return s.published === true; }).length,
                draft: items.filter(function(s) { return s.published !== true; }).length,
                playlists: Object.keys(playlists).length
            };
        },

        togglePublished: function(id) {
            var items = this.getAll();
            var item = items.find(function(s) { return s.id === id; });
            if (!item) return null;
            item.published = item.published === true ? false : true;
            this.save(items);
            return item;
        },

        search: function(query) {
            var q = (query || '').toLowerCase();
            return this.getAll().filter(function(s) {
                return (s.title || '').toLowerCase().indexOf(q) !== -1 ||
                       (s.artist || '').toLowerCase().indexOf(q) !== -1 ||
                       (s.playlist || '').toLowerCase().indexOf(q) !== -1;
            });
        },

        filter: function(status) {
            if (!status || status === 'all') return this.getAll();
            if (status === 'published') return this.getAll().filter(function(s) { return s.published === true; });
            if (status === 'draft') return this.getAll().filter(function(s) { return s.published !== true; });
            return this.getAll();
        }
    };
})();
