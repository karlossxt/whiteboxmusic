/* ============================================
   BACKSTAGE STUDIO — Story Repository
   Extiende BaseRepository con consultas específicas de historias.
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
                   (story.location || '').toLowerCase().indexOf(q) !== -1;
        });
    };

    StoryRepository.prototype.filterByStatus = function(status) {
        if (!status || status === 'all') return this.getAll();
        return this.getAll().filter(function(story) { return story.status === status; });
    };

    StoryRepository.prototype.getPublished = function() {
        return this.getAll().filter(function(story) { return story.isPublished(); });
    };

    StoryRepository.prototype.getFeatured = function() {
        return this.getAll().filter(function(story) { return story.isFeatured(); });
    };

    StoryRepository.prototype.getStats = function() {
        var items = this.getAll();
        return {
            total: items.length,
            published: items.filter(function(s) { return s.isPublished(); }).length,
            draft: items.filter(function(s) { return !s.isPublished(); }).length,
            featured: items.filter(function(s) { return s.isFeatured(); }).length
        };
    };

    StoryRepository.prototype.toggleStatus = function(id) {
        var story = this.getById(id);
        if (!story) return null;
        story.status = story.isPublished() ? 'draft' : 'published';
        this.update(id, story.toJSON());
        return story;
    };

    StoryRepository.prototype.toggleFeatured = function(id) {
        var story = this.getById(id);
        if (!story) return null;
        story.featured = !story.isFeatured();
        this.update(id, story.toJSON());
        return story;
    };

    /**
     * Migración: carga datos del legacy storiesDataDefault si no hay datos en backstage_
     */
    StoryRepository.prototype.migrateFromDefaults = function(defaultData) {
        var existing = this.datasource.get(this.storageKey);
        if (!existing && defaultData && defaultData.length > 0) {
            this.datasource.set(this.storageKey, defaultData);
        }
    };

    window.Backstage.StoryRepository = StoryRepository;
})();
