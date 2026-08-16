/* ============================================
   BACKSTAGE STUDIO — Soundscape Repository
   Extiende BaseRepository con consultas específicas de soundscapes.
   ============================================ */

(function() {
    window.Backstage = window.Backstage || {};

    var STORAGE_KEY = 'soundscapes_data';

    function SoundscapeRepository(datasource) {
        window.Backstage.BaseRepository.call(this, STORAGE_KEY, datasource, window.Backstage.Soundscape);
    }

    SoundscapeRepository.prototype = Object.create(window.Backstage.BaseRepository.prototype);
    SoundscapeRepository.prototype.constructor = SoundscapeRepository;

    SoundscapeRepository.prototype.search = function(query) {
        var q = (query || '').toLowerCase();
        return this.getAll().filter(function(item) {
            return (item.title || '').toLowerCase().indexOf(q) !== -1 ||
                   (item.artist || '').toLowerCase().indexOf(q) !== -1 ||
                   (item.playlist || '').toLowerCase().indexOf(q) !== -1;
        });
    };

    SoundscapeRepository.prototype.filterByStatus = function(status) {
        if (!status || status === 'all') return this.getAll();
        if (status === 'published') return this.getAll().filter(function(s) { return s.isPublished(); });
        if (status === 'draft') return this.getAll().filter(function(s) { return !s.isPublished(); });
        return this.getAll();
    };

    SoundscapeRepository.prototype.getPublished = function() {
        return this.getAll().filter(function(item) { return item.isPublished(); });
    };

    SoundscapeRepository.prototype.getStats = function() {
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

    SoundscapeRepository.prototype.togglePublished = function(id) {
        var item = this.getById(id);
        if (!item) return null;
        item.published = !item.isPublished();
        var result = this.update(id, item.toJSON());
        if (result && typeof result.then === 'function') {
            return result;
        }
        return item;
    };

    SoundscapeRepository.prototype.toggleFeatured = function(id) {
        var item = this.getById(id);
        if (!item) return null;
        item.featured = !item.isFeatured();
        var result = this.update(id, item.toJSON());
        if (result && typeof result.then === 'function') {
            return result;
        }
        return item;
    };

    SoundscapeRepository.prototype.migrateFromDefaults = function(defaultData) {
        var existing = this.datasource.get(this.storageKey);
        if (!existing && defaultData && defaultData.length > 0) {
            this.datasource.set(this.storageKey, defaultData);
        }
    };

    window.Backstage.SoundscapeRepository = SoundscapeRepository;
})();
