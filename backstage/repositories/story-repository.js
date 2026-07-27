/* ============================================
   BACKSTAGE STUDIO — Story Repository
   Consultas específicas de historias.
   ============================================ */

(function() {
    window.Backstage = window.Backstage || {};

    var STORAGE_KEY = 'stories_data';

    function StoryRepository(datasource) {
        window.Backstage.BaseRepository.call(this, STORAGE_KEY, datasource, window.Backstage.Story);
    }

    StoryRepository.prototype = Object.create(window.Backstage.BaseRepository.prototype);
    StoryRepository.prototype.constructor = StoryRepository;

    StoryRepository.prototype.search = function(query) {
        var q = (query || '').toLowerCase();
        return this.getAll().filter(function(story) {
            return (story.title || '').toLowerCase().indexOf(q) !== -1 ||
                   (story.author || '').toLowerCase().indexOf(q) !== -1 ||
                   (story.excerpt || '').toLowerCase().indexOf(q) !== -1 ||
                   (story.category || '').toLowerCase().indexOf(q) !== -1;
        });
    };

    StoryRepository.prototype.filterByStatus = function(status) {
        if (!status || status === 'all') return this.getAll();
        if (status === 'featured') return this.getAll().filter(function(s) { return s.isPublished() && s.isFeatured(); });
        return this.getAll().filter(function(story) { return story.status === status; });
    };

    StoryRepository.prototype.filterByCategory = function(category) {
        if (!category || category === 'all') return this.getAll();
        return this.getAll().filter(function(story) { return story.category === category; });
    };

    StoryRepository.prototype.getPublished = function() {
        return this.getAll().filter(function(story) { return story.isPublished(); });
    };

    StoryRepository.prototype.getFeatured = function() {
        return this.getAll().filter(function(story) { return story.isFeatured(); });
    };

    StoryRepository.prototype.getStats = function() {
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

    StoryRepository.prototype.toggleStatus = function(id) {
        var story = this.getById(id);
        if (!story) return null;
        var data = story.toJSON();
        data.status = story.isPublished() ? 'draft' : 'published';
        data.updatedAt = Date.now();
        return this.update(id, data);
    };

    StoryRepository.prototype.toggleFeatured = function(id) {
        var story = this.getById(id);
        if (!story) return null;
        var data = story.toJSON();
        data.featured = !story.isFeatured();
        data.updatedAt = Date.now();
        return this.update(id, data);
    };

    StoryRepository.prototype.isSlugUnique = function(slug, excludeId) {
        if (!slug) return false;
        var items = this.getAll();
        for (var i = 0; i < items.length; i++) {
            if (items[i].slug === slug && items[i].id !== excludeId) return false;
        }
        return true;
    };

    StoryRepository.prototype.findBySlug = function(slug) {
        var items = this.getAll();
        for (var i = 0; i < items.length; i++) {
            if (items[i].slug === slug) return items[i];
        }
        return null;
    };

    StoryRepository.prototype.migrateFromDefaults = function(defaultData) {
        var existing = this.datasource.get(this.storageKey);
        if (!existing && defaultData && defaultData.length > 0) {
            this.datasource.set(this.storageKey, defaultData);
        }
    };

    window.Backstage.StoryRepository = StoryRepository;
})();
