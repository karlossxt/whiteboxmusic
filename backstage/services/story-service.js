/* ============================================
   BACKSTAGE STUDIO — Story Service
   Reglas de negocio para historias.
   CRUD devuelve Promises cuando el repo es async.
   ============================================ */

(function() {
    window.Backstage = window.Backstage || {};

    function StoryService(storyRepository) {
        this.repository = storyRepository;
    }

    StoryService.prototype.getAll = function() { return this.repository.getAll(); };
    StoryService.prototype.getById = function(id) { return this.repository.getById(id); };
    StoryService.prototype.getStats = function() { return this.repository.getStats(); };
    StoryService.prototype.search = function(query) { return this.repository.search(query); };
    StoryService.prototype.filter = function(status) { return this.repository.filterByStatus(status); };
    StoryService.prototype.filterByCategory = function(cat) { return this.repository.filterByCategory(cat); };
    StoryService.prototype.getPublished = function() { return this.repository.getPublished(); };
    StoryService.prototype.getMaxOrder = function() { return this.repository.getMaxOrder(); };

    StoryService.prototype.generateSlug = function(text) {
        if (!text) return '';
        return text.toLowerCase()
            .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
            .replace(/[^a-z0-9\s-]/g, '')
            .replace(/\s+/g, '-')
            .replace(/-+/g, '-')
            .replace(/^-|-$/g, '');
    };

    StoryService.prototype.generateUniqueSlug = function(title, excludeId) {
        var slug = this.generateSlug(title);
        if (!slug) return 'sin-titulo';
        if (this.repository.isSlugUnique(slug, excludeId)) return slug;
        var counter = 2;
        while (!this.repository.isSlugUnique(slug + '-' + counter, excludeId)) counter++;
        return slug + '-' + counter;
    };

    StoryService.prototype.validate = function(data, isPublish) {
        var errors = [];
        if (!data.title || !data.title.trim()) {
            errors.push({ field: 'formTitle', message: 'El titulo es obligatorio' });
        }
        if (isPublish) {
            if (!data.excerpt || !data.excerpt.trim()) {
                errors.push({ field: 'formExcerpt', message: 'El resumen es obligatorio para publicar' });
            }
            if (!data.category || !data.category.trim()) {
                errors.push({ field: 'formCategory', message: 'La categoria es obligatoria para publicar' });
            }
            if (!data.image || !data.image.trim()) {
                errors.push({ field: 'formImage', message: 'La imagen es obligatoria para publicar' });
            }
        }
        return { valid: errors.length === 0, errors: errors };
    };

    StoryService.prototype._buildStoryData = function(data, id) {
        var now = Date.now();
        var slug = data.slug || this.generateUniqueSlug(data.title, id || null);
        return {
            title: (data.title || '').trim(),
            slug: slug,
            excerpt: (data.excerpt || '').trim(),
            category: (data.category || '').trim(),
            author: (data.author || '').trim(),
            image: (data.image || '').trim() || '',
            content: (data.content || '').trim(),
            status: data.status || 'draft',
            featured: data.featured === true || data.featured === 'true',
            date: (data.date || '').trim(),
            createdAt: data.createdAt || now,
            updatedAt: now,
            order: parseInt(data.order, 10) || (id ? 1 : this.repository.getMaxOrder() + 1),
            location: (data.location || '').trim(),
            relatedSong: (data.relatedSong || '').trim(),
            initialLikes: parseInt(data.initialLikes, 10) || 0
        };
    };

    StoryService.prototype.create = function(data) {
        var self = this;
        var storyData = this._buildStoryData(data, null);

        var result = this.repository.create(storyData);
        if (result && typeof result.then === 'function') {
            return result.then(function(story) {
                window.Backstage.EventBus.emit('stories:created', story);
                return { success: true, data: story };
            });
        }
        window.Backstage.EventBus.emit('stories:created', result);
        return Promise.resolve({ success: true, data: result });
    };

    StoryService.prototype.update = function(id, data) {
        var self = this;
        var storyData = this._buildStoryData(data, id);

        var result = this.repository.update(id, storyData);
        if (result && typeof result.then === 'function') {
            return result.then(function(story) {
                if (story) {
                    window.Backstage.EventBus.emit('stories:updated', story);
                }
                return { success: !!story, data: story };
            });
        }
        if (result) {
            window.Backstage.EventBus.emit('stories:updated', result);
        }
        return Promise.resolve({ success: !!result, data: result });
    };

    StoryService.prototype.remove = function(id) {
        var story = this.repository.getById(id);

        var result = this.repository.remove(id);
        if (result && typeof result.then === 'function') {
            return result.then(function() {
                window.Backstage.EventBus.emit('stories:removed', { id: id, title: story ? story.title : '' });
                return true;
            });
        }
        window.Backstage.EventBus.emit('stories:removed', { id: id, title: story ? story.title : '' });
        return Promise.resolve(true);
    };

    StoryService.prototype.toggleFeatured = function(id) {
        var result = this.repository.toggleFeatured(id);
        if (result && typeof result.then === 'function') {
            return result.then(function(story) {
                if (story) {
                    window.Backstage.EventBus.emit('stories:toggled', story);
                }
                return story;
            });
        }
        if (result) {
            window.Backstage.EventBus.emit('stories:toggled', result);
        }
        return Promise.resolve(result);
    };

    StoryService.prototype.toggleStatus = function(id) {
        var result = this.repository.toggleStatus(id);
        if (result && typeof result.then === 'function') {
            return result.then(function(story) {
                if (story) {
                    window.Backstage.EventBus.emit('stories:toggled', story);
                }
                return story;
            });
        }
        if (result) {
            window.Backstage.EventBus.emit('stories:toggled', result);
        }
        return Promise.resolve(result);
    };

    StoryService.prototype.duplicate = function(id) {
        var self = this;
        var original = this.repository.getById(id);
        if (!original) return Promise.resolve({ success: false, errors: ['Historia no encontrada'] });

        var now = Date.now();
        var newTitle = original.title + ' (Copia)';
        var newSlug = this.generateUniqueSlug(newTitle, null);

        var data = original.toJSON();
        data.title = newTitle;
        data.slug = newSlug;
        data.status = 'draft';
        data.featured = false;
        data.createdAt = now;
        data.updatedAt = now;
        delete data.id;

        var result = this.repository.create(data);
        if (result && typeof result.then === 'function') {
            return result.then(function(story) {
                window.Backstage.EventBus.emit('stories:created', story);
                return { success: true, data: story };
            });
        }
        window.Backstage.EventBus.emit('stories:created', result);
        return Promise.resolve({ success: true, data: result });
    };

    window.Backstage.StoryService = StoryService;
})();
