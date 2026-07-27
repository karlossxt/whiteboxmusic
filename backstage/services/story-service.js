/* ============================================
   BACKSTAGE STUDIO — Story Service
   Reglas de negocio para historias.
   Valida, transforma y orquesta operaciones.
   No conoce la interfaz ni el datasource.
   ============================================ */

(function() {
    window.Backstage = window.Backstage || {};

    function StoryService(storyRepository) {
        this.repository = storyRepository;
    }

    StoryService.prototype.getAll = function() {
        return this.repository.getAll();
    };

    StoryService.prototype.getById = function(id) {
        return this.repository.getById(id);
    };

    StoryService.prototype.getStats = function() {
        return this.repository.getStats();
    };

    StoryService.prototype.search = function(query) {
        return this.repository.search(query);
    };

    StoryService.prototype.filter = function(status) {
        return this.repository.filterByStatus(status);
    };

    StoryService.prototype.validate = function(data) {
        var errors = [];
        if (!data.title || !data.title.trim()) errors.push('El titulo es obligatorio');
        if (!data.author || !data.author.trim()) errors.push('El autor es obligatorio');
        if (!data.excerpt || !data.excerpt.trim()) errors.push('El extracto es obligatorio');
        if (!data.content || !data.content.trim()) errors.push('El contenido es obligatorio');
        return { valid: errors.length === 0, errors: errors };
    };

    StoryService.prototype.create = function(data) {
        var validation = this.validate(data);
        if (!validation.valid) return { success: false, errors: validation.errors };

        var storyData = {
            title: data.title.trim(),
            author: data.author.trim(),
            location: (data.location || '').trim(),
            image: (data.image || '').trim() || 'https://placehold.co/800x500/1a1a1a/ffffff?text=Story',
            date: (data.date || '').trim(),
            relatedSong: (data.relatedSong || '').trim(),
            initialLikes: parseInt(data.initialLikes, 10) || 0,
            order: parseInt(data.order, 10) || this.repository.getMaxOrder() + 1,
            excerpt: data.excerpt.trim(),
            content: data.content.trim(),
            status: data.status || 'draft',
            featured: data.featured === true || data.featured === 'true'
        };

        var story = this.repository.create(storyData);
        window.Backstage.EventBus.emit('stories:created', story);
        return { success: true, data: story };
    };

    StoryService.prototype.update = function(id, data) {
        var validation = this.validate(data);
        if (!validation.valid) return { success: false, errors: validation.errors };

        var storyData = {
            title: data.title.trim(),
            author: data.author.trim(),
            location: (data.location || '').trim(),
            image: (data.image || '').trim() || 'https://placehold.co/800x500/1a1a1a/ffffff?text=Story',
            date: (data.date || '').trim(),
            relatedSong: (data.relatedSong || '').trim(),
            initialLikes: parseInt(data.initialLikes, 10) || 0,
            order: parseInt(data.order, 10) || 1,
            excerpt: data.excerpt.trim(),
            content: data.content.trim(),
            status: data.status || 'draft',
            featured: data.featured === true || data.featured === 'true'
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

    StoryService.prototype.getMaxOrder = function() {
        return this.repository.getMaxOrder();
    };

    window.Backstage.StoryService = StoryService;
})();
