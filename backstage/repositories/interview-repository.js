/* ============================================
   BACKSTAGE STUDIO — Interview Repository
   Consultas específicas de entrevistas.
   ============================================ */

(function() {
    window.Backstage = window.Backstage || {};

    var STORAGE_KEY = 'interviews_data';

    function InterviewRepository(datasource) {
        window.Backstage.BaseRepository.call(this, STORAGE_KEY, datasource, window.Backstage.Interview);
    }

    InterviewRepository.prototype = Object.create(window.Backstage.BaseRepository.prototype);
    InterviewRepository.prototype.constructor = InterviewRepository;

    InterviewRepository.prototype.search = function(query) {
        var q = (query || '').toLowerCase();
        return this.getAll().filter(function(iv) {
            return (iv.title || '').toLowerCase().indexOf(q) !== -1 ||
                   (iv.author || '').toLowerCase().indexOf(q) !== -1 ||
                   (iv.excerpt || '').toLowerCase().indexOf(q) !== -1 ||
                   (iv.category || '').toLowerCase().indexOf(q) !== -1;
        });
    };

    InterviewRepository.prototype.filterByStatus = function(status) {
        if (!status || status === 'all') return this.getAll();
        if (status === 'featured') return this.getAll().filter(function(iv) { return iv.isPublished() && iv.isFeatured(); });
        if (status === 'published') return this.getAll().filter(function(iv) { return iv.isPublished(); });
        if (status === 'draft') return this.getAll().filter(function(iv) { return !iv.isPublished(); });
        return this.getAll();
    };

    InterviewRepository.prototype.filterByCategory = function(category) {
        if (!category || category === 'all') return this.getAll();
        return this.getAll().filter(function(iv) { return iv.category === category; });
    };

    InterviewRepository.prototype.getPublished = function() {
        return this.getAll().filter(function(iv) { return iv.isPublished(); });
    };

    InterviewRepository.prototype.getFeatured = function() {
        return this.getAll().filter(function(iv) { return iv.isFeatured(); });
    };

    InterviewRepository.prototype.getStats = function() {
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

    InterviewRepository.prototype.togglePublished = function(id) {
        var iv = this.getById(id);
        if (!iv) return null;
        var data = iv.toJSON();
        data.published = !iv.isPublished();
        data.updatedAt = Date.now();
        return this.update(id, data);
    };

    InterviewRepository.prototype.toggleFeatured = function(id) {
        var iv = this.getById(id);
        if (!iv) return null;
        var data = iv.toJSON();
        data.featured = !iv.isFeatured();
        data.updatedAt = Date.now();
        return this.update(id, data);
    };

    InterviewRepository.prototype.isSlugUnique = function(slug, excludeId) {
        if (!slug) return false;
        var items = this.getAll();
        for (var i = 0; i < items.length; i++) {
            if (items[i].slug === slug && items[i].id !== excludeId) return false;
        }
        return true;
    };

    InterviewRepository.prototype.findBySlug = function(slug) {
        var items = this.getAll();
        for (var i = 0; i < items.length; i++) {
            if (items[i].slug === slug) return items[i];
        }
        return null;
    };

    window.Backstage.InterviewRepository = InterviewRepository;
})();
