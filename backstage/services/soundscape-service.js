/* ============================================
   BACKSTAGE STUDIO — Soundscape Service
   Reglas de negocio para soundscapes.
   CRUD devuelve Promises cuando el repo es async.
   ============================================ */

(function() {
    window.Backstage = window.Backstage || {};

    function SoundscapeService(soundscapeRepository) {
        this.repository = soundscapeRepository;
    }

    SoundscapeService.prototype.getAll = function() { return this.repository.getAll(); };
    SoundscapeService.prototype.getById = function(id) { return this.repository.getById(id); };
    SoundscapeService.prototype.getStats = function() { return this.repository.getStats(); };
    SoundscapeService.prototype.search = function(query) { return this.repository.search(query); };
    SoundscapeService.prototype.filter = function(status) { return this.repository.filterByStatus(status); };
    SoundscapeService.prototype.getMaxOrder = function() { return this.repository.getMaxOrder(); };

    SoundscapeService.prototype.validate = function(data) {
        var errors = [];
        if (!data.title || !data.title.trim()) errors.push('El titulo es obligatorio');
        if (!data.artist || !data.artist.trim()) errors.push('El artista es obligatorio');

        var cover = (data.cover || '').trim();
        if (cover && !this._isUrl(cover)) errors.push('La URL de la portada no es valida');

        var spotify = (data.spotifyUrl || '').trim();
        if (spotify && !this._isUrl(spotify)) errors.push('El enlace de Spotify no es valido');

        var youtube = (data.youtubeUrl || '').trim();
        if (youtube && !this._isUrl(youtube)) errors.push('El enlace de YouTube no es valido');

        if (data.duration && !(isFinite(data.duration) && parseInt(data.duration, 10) > 0)) {
            errors.push('La duracion debe ser un numero positivo');
        }

        if (data.order && !(isFinite(data.order) && parseInt(data.order, 10) > 0)) {
            errors.push('El orden debe ser un numero positivo');
        }

        return { valid: errors.length === 0, errors: errors };
    };

    SoundscapeService.prototype._isUrl = function(str) {
        return /^(https?:\/\/|www\.)/i.test(str);
    };

    SoundscapeService.prototype._buildSoundscapeData = function(data, id) {
        var now = Date.now();
        return {
            title: (data.title || '').trim(),
            artist: (data.artist || '').trim(),
            playlist: (data.playlist || '').trim(),
            cover: (data.cover || '').trim() || 'https://placehold.co/400x400/1a1a1a/ffffff?text=Album',
            spotifyUrl: (data.spotifyUrl || '').trim(),
            youtubeUrl: (data.youtubeUrl || '').trim(),
            description: (data.description || '').trim(),
            category: (data.category || '').trim(),
            duration: parseInt(data.duration, 10) || 180,
            published: data.published === true || data.published === 'true',
            featured: data.featured === true || data.featured === 'true',
            createdAt: data.createdAt || now,
            updatedAt: now,
            order: parseInt(data.order, 10) || (id ? 1 : this.repository.getMaxOrder() + 1)
        };
    };

    SoundscapeService.prototype.create = function(data) {
        var self = this;
        var validation = this.validate(data);
        if (!validation.valid) return Promise.resolve({ success: false, errors: validation.errors });

        var itemData = this._buildSoundscapeData(data, null);

        var result = this.repository.create(itemData);
        if (result && typeof result.then === 'function') {
            return result.then(function(item) {
                window.Backstage.EventBus.emit('soundscapes:created', item);
                return { success: true, data: item };
            }).catch(function(err) {
                return { success: false, errors: [err.message || 'Error al guardar en Firestore'] };
            });
        }
        window.Backstage.EventBus.emit('soundscapes:created', result);
        return Promise.resolve({ success: true, data: result });
    };

    SoundscapeService.prototype.update = function(id, data) {
        var self = this;
        var validation = this.validate(data);
        if (!validation.valid) return Promise.resolve({ success: false, errors: validation.errors });

        var itemData = this._buildSoundscapeData(data, id);

        var result = this.repository.update(id, itemData);
        if (result && typeof result.then === 'function') {
            return result.then(function(item) {
                if (item) window.Backstage.EventBus.emit('soundscapes:updated', item);
                return { success: !!item, data: item };
            }).catch(function(err) {
                return { success: false, errors: [err.message || 'Error al guardar en Firestore'] };
            });
        }
        if (result) window.Backstage.EventBus.emit('soundscapes:updated', result);
        return Promise.resolve({ success: !!result, data: result });
    };

    SoundscapeService.prototype.remove = function(id) {
        var item = this.repository.getById(id);

        var result = this.repository.remove(id);
        if (result && typeof result.then === 'function') {
            return result.then(function() {
                window.Backstage.EventBus.emit('soundscapes:removed', { id: id, title: item ? item.title : '' });
                return true;
            }).catch(function(err) {
                return Promise.reject(err);
            });
        }
        window.Backstage.EventBus.emit('soundscapes:removed', { id: id, title: item ? item.title : '' });
        return Promise.resolve(true);
    };

    SoundscapeService.prototype.togglePublished = function(id) {
        var result = this.repository.togglePublished(id);
        if (result && typeof result.then === 'function') {
            return result.then(function(item) {
                if (item) window.Backstage.EventBus.emit('soundscapes:toggled', item);
                return item;
            });
        }
        if (result) window.Backstage.EventBus.emit('soundscapes:toggled', result);
        return Promise.resolve(result);
    };

    SoundscapeService.prototype.toggleFeatured = function(id) {
        var result = this.repository.toggleFeatured(id);
        if (result && typeof result.then === 'function') {
            return result.then(function(item) {
                if (item) window.Backstage.EventBus.emit('soundscapes:toggled', item);
                return item;
            });
        }
        if (result) window.Backstage.EventBus.emit('soundscapes:toggled', result);
        return Promise.resolve(result);
    };

    window.Backstage.SoundscapeService = SoundscapeService;
})();
