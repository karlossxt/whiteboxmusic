/* Stories Service - CRUD de historias */
(function() {
    window.WBAdmin = window.WBAdmin || {};

    var STORAGE_KEY = 'stories_data';
    var storage = window.WBAdmin.storage;

    function generateId() {
        return 'story-' + Date.now() + '-' + Math.random().toString(36).substr(2, 5);
    }

    window.WBAdmin.storiesService = {
        getAll: function() {
            return storage.getDefault(STORAGE_KEY, 'storiesDataDefault');
        },

        getById: function(id) {
            var stories = this.getAll();
            return stories.find(function(s) { return s.id === id; }) || null;
        },

        save: function(stories) {
            return storage.set(STORAGE_KEY, stories);
        },

        create: function(data) {
            var stories = this.getAll();
            data.id = generateId();
            stories.push(data);
            this.save(stories);
            return data;
        },

        update: function(id, data) {
            var stories = this.getAll();
            var idx = stories.findIndex(function(s) { return s.id === id; });
            if (idx === -1) return null;
            data.id = id;
            stories[idx] = data;
            this.save(stories);
            return data;
        },

        remove: function(id) {
            var stories = this.getAll();
            var filtered = stories.filter(function(s) { return s.id !== id; });
            this.save(filtered);
            return filtered;
        },

        getMaxOrder: function() {
            var stories = this.getAll();
            var max = 0;
            stories.forEach(function(s) {
                var o = parseInt(s.order, 10) || 0;
                if (o > max) max = o;
            });
            return max;
        },

        getStats: function() {
            var stories = this.getAll();
            return {
                total: stories.length,
                published: stories.filter(function(s) { return s.status === 'published'; }).length,
                draft: stories.filter(function(s) { return s.status === 'draft'; }).length,
                featured: stories.filter(function(s) { return s.featured === true || s.featured === 'true'; }).length
            };
        },

        toggleStatus: function(id) {
            var stories = this.getAll();
            var story = stories.find(function(s) { return s.id === id; });
            if (!story) return null;
            story.status = story.status === 'published' ? 'draft' : 'published';
            this.save(stories);
            return story;
        },

        toggleFeatured: function(id) {
            var stories = this.getAll();
            var story = stories.find(function(s) { return s.id === id; });
            if (!story) return null;
            story.featured = story.featured === true || story.featured === 'true' ? false : true;
            this.save(stories);
            return story;
        },

        reorder: function(id, newOrder) {
            var stories = this.getAll();
            var story = stories.find(function(s) { return s.id === id; });
            if (!story) return null;
            story.order = parseInt(newOrder, 10) || 1;
            this.save(stories);
            return story;
        },

        search: function(query) {
            var q = (query || '').toLowerCase();
            return this.getAll().filter(function(s) {
                return (s.title || '').toLowerCase().indexOf(q) !== -1 ||
                       (s.author || '').toLowerCase().indexOf(q) !== -1 ||
                       (s.location || '').toLowerCase().indexOf(q) !== -1;
            });
        },

        filter: function(status) {
            if (!status || status === 'all') return this.getAll();
            return this.getAll().filter(function(s) { return s.status === status; });
        }
    };
})();
