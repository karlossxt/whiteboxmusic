/* ============================================
   BACKSTAGE STUDIO — Story Service
   Reglas de negocio para historias.
   ============================================ */

(function() {
    window.Backstage = window.Backstage || {};

    var CATEGORIES = ['Rock', 'Metal', 'Indie', 'Pop', 'Jazz', 'Otro'];

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

    StoryService.prototype.create = function(data) {
        var now = Date.now();
        var slug = data.slug || this.generateUniqueSlug(data.title, null);
        var storyData = {
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
            createdAt: now,
            updatedAt: now,
            order: parseInt(data.order, 10) || this.repository.getMaxOrder() + 1,
            location: (data.location || '').trim(),
            relatedSong: (data.relatedSong || '').trim(),
            initialLikes: parseInt(data.initialLikes, 10) || 0
        };

        var story = this.repository.create(storyData);
        window.Backstage.EventBus.emit('stories:created', story);
        return { success: true, data: story };
    };

    StoryService.prototype.update = function(id, data) {
        var now = Date.now();
        var slug = data.slug || this.generateUniqueSlug(data.title, id);
        var storyData = {
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
            order: parseInt(data.order, 10) || 1,
            location: (data.location || '').trim(),
            relatedSong: (data.relatedSong || '').trim(),
            initialLikes: parseInt(data.initialLikes, 10) || 0
        };

        var story = this.repository.update(id, storyData);
        if (story) {
            window.Backstage.EventBus.emit('stories:updated', story);
        }
        return { success: !!story, data: story };
    };

    StoryService.prototype.remove = function(id) {
        var story = this.repository.getById(id);
        this.repository.remove(id);
        window.Backstage.EventBus.emit('stories:removed', { id: id, title: story ? story.title : '' });
        return true;
    };

    StoryService.prototype.toggleStatus = function(id) {
        var story = this.repository.toggleStatus(id);
        if (story) {
            window.Backstage.EventBus.emit('stories:toggled', story);
        }
        return story;
    };

    StoryService.prototype.toggleFeatured = function(id) {
        var story = this.repository.toggleFeatured(id);
        if (story) {
            window.Backstage.EventBus.emit('stories:toggled', story);
        }
        return story;
    };

    StoryService.prototype.duplicate = function(id) {
        var original = this.repository.getById(id);
        if (!original) return { success: false, errors: ['Historia no encontrada'] };

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

        var story = this.repository.create(data);
        window.Backstage.EventBus.emit('stories:created', story);
        return { success: true, data: story };
    };

    window.Backstage.StoryService = StoryService;
})();
