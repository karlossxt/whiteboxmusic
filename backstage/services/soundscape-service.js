/* ============================================
   BACKSTAGE STUDIO — Soundscape Service
   Reglas de negocio para soundscapes.
   ============================================ */

(function() {
    window.Backstage = window.Backstage || {};

    function SoundscapeService(soundscapeRepository) {
        this.repository = soundscapeRepository;
    }

    SoundscapeService.prototype.getAll = function() {
        return this.repository.getAll();
    };

    SoundscapeService.prototype.getById = function(id) {
        return this.repository.getById(id);
    };

    SoundscapeService.prototype.getStats = function() {
        return this.repository.getStats();
    };

    SoundscapeService.prototype.search = function(query) {
        return this.repository.search(query);
    };

    SoundscapeService.prototype.filter = function(status) {
        return this.repository.filterByStatus(status);
    };

    SoundscapeService.prototype.validate = function(data) {
        var errors = [];
        if (!data.title || !data.title.trim()) errors.push('El titulo es obligatorio');
        if (!data.artist || !data.artist.trim()) errors.push('El artista es obligatorio');
        return { valid: errors.length === 0, errors: errors };
    };

    SoundscapeService.prototype.create = function(data) {
        var validation = this.validate(data);
        if (!validation.valid) return { success: false, errors: validation.errors };

        var itemData = {
            title: data.title.trim(),
            artist: data.artist.trim(),
            playlist: (data.playlist || '').trim(),
            cover: (data.cover || '').trim() || 'https://placehold.co/400x400/1a1a1a/ffffff?text=Album',
            spotifyUrl: (data.spotifyUrl || '').trim(),
            duration: parseInt(data.duration, 10) || 180,
            order: parseInt(data.order, 10) || this.repository.getMaxOrder() + 1,
            published: data.published === true || data.published === 'true'
        };

        var item = this.repository.create(itemData);
        window.Backstage.EventBus.emit('soundscapes:created', item);
        return { success: true, data: item };
    };

    SoundscapeService.prototype.update = function(id, data) {
        var validation = this.validate(data);
        if (!validation.valid) return { success: false, errors: validation.errors };

        var itemData = {
            title: data.title.trim(),
            artist: data.artist.trim(),
            playlist: (data.playlist || '').trim(),
            cover: (data.cover || '').trim() || 'https://placehold.co/400x400/1a1a1a/ffffff?text=Album',
            spotifyUrl: (data.spotifyUrl || '').trim(),
            duration: parseInt(data.duration, 10) || 180,
            order: parseInt(data.order, 10) || 1,
            published: data.published === true || data.published === 'true'
        };

        var item = this.repository.update(id, itemData);
        if (item) {
            window.Backstage.EventBus.emit('soundscapes:updated', item);
        }
        return { success: !!item, data: item };
    };

    SoundscapeService.prototype.remove = function(id) {
        var item = this.repository.getById(id);
        this.repository.remove(id);
        window.Backstage.EventBus.emit('soundscapes:removed', { id: id, title: item ? item.title : '' });
        return true;
    };

    SoundscapeService.prototype.togglePublished = function(id) {
        var item = this.repository.togglePublished(id);
        if (item) {
            window.Backstage.EventBus.emit('soundscapes:toggled', item);
        }
        return item;
    };

    SoundscapeService.prototype.getMaxOrder = function() {
        return this.repository.getMaxOrder();
    };

    window.Backstage.SoundscapeService = SoundscapeService;
})();
