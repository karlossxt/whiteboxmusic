/* ============================================
   BACKSTAGE STUDIO — Artist Repository
   Consultas específicas de los artistas de
   la sección "Descubre".
   ============================================ */

(function() {
    window.Backstage = window.Backstage || {};

    var STORAGE_KEY = 'artists_data';

    function ArtistRepository(datasource) {
        window.Backstage.BaseRepository.call(this, STORAGE_KEY, datasource, window.Backstage.Artist);
    }

    ArtistRepository.prototype = Object.create(window.Backstage.BaseRepository.prototype);
    ArtistRepository.prototype.constructor = ArtistRepository;

    /* La búsqueda pública filtra por nombre y tags, que es
       justo lo que promete el placeholder del buscador. */
    ArtistRepository.prototype.search = function(query) {
        var q = (query || '').toLowerCase().trim();
        if (!q) return this.getAll();
        return this.getAll().filter(function(artist) {
            if ((artist.name || '').toLowerCase().indexOf(q) !== -1) return true;
            var tags = artist.tags || [];
            for (var i = 0; i < tags.length; i++) {
                if (tags[i].toLowerCase().indexOf(q) !== -1) return true;
            }
            return false;
        });
    };

    ArtistRepository.prototype.filterByStatus = function(status) {
        if (!status || status === 'all') return this.getAll();
        if (status === 'featured') return this.getAll().filter(function(a) { return a.isPublished() && a.isFeatured(); });
        if (status === 'published') return this.getAll().filter(function(a) { return a.isPublished(); });
        if (status === 'draft') return this.getAll().filter(function(a) { return !a.isPublished(); });
        return this.getAll();
    };

    ArtistRepository.prototype.getPublished = function() {
        return this.getAll().filter(function(a) { return a.isPublished(); });
    };

    ArtistRepository.prototype.getStats = function() {
        var items = this.getAll();
        var lastModified = 0;
        items.forEach(function(a) {
            var t = a.updatedAt || 0;
            if (t > lastModified) lastModified = t;
        });
        return {
            total: items.length,
            published: items.filter(function(a) { return a.isPublished(); }).length,
            draft: items.filter(function(a) { return !a.isPublished(); }).length,
            featured: items.filter(function(a) { return a.isPublished() && a.isFeatured(); }).length,
            lastModified: lastModified
        };
    };

    ArtistRepository.prototype.togglePublished = function(id) {
        var artist = this.getById(id);
        if (!artist) return null;
        var data = artist.toJSON();
        data.published = !artist.isPublished();
        data.updatedAt = Date.now();
        return this.update(id, data);
    };

    ArtistRepository.prototype.toggleFeatured = function(id) {
        var artist = this.getById(id);
        if (!artist) return null;
        var data = artist.toJSON();
        data.featured = !artist.isFeatured();
        data.updatedAt = Date.now();
        return this.update(id, data);
    };

    /* Crea el baseline desde una lista de valores por
       defecto si aun no hay nada guardado. */
    ArtistRepository.prototype.migrateFromDefaults = function(defaults) {
        var existing = this.datasource.get(this.storageKey);
        if (existing) return;

        if (!Array.isArray(defaults) || !defaults.length) return;

        var baseline = defaults.map(function(item) {
            return new window.Backstage.Artist(item).toJSON();
        });
        this.datasource.set(this.storageKey, baseline);
    };

    window.Backstage.ArtistRepository = ArtistRepository;
})();
