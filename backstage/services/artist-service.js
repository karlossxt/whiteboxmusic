/* ============================================
   BACKSTAGE STUDIO — Artist Service
   Reglas de negocio para los artistas de
   la sección "Descubre".
   CRUD devuelve Promises cuando el repo es async.
   ============================================ */

(function() {
    window.Backstage = window.Backstage || {};

    function ArtistService(artistRepository) {
        this.repository = artistRepository;
    }

    ArtistService.prototype.getAll = function() { return this.repository.getAll(); };
    ArtistService.prototype.getById = function(id) { return this.repository.getById(id); };
    ArtistService.prototype.getStats = function() { return this.repository.getStats(); };
    ArtistService.prototype.search = function(query) { return this.repository.search(query); };
    ArtistService.prototype.filter = function(status) { return this.repository.filterByStatus(status); };
    ArtistService.prototype.getPublished = function() { return this.repository.getPublished(); };
    ArtistService.prototype.getMaxOrder = function() { return this.repository.getMaxOrder(); };

    /* Nombre obligatorio siempre. Imagen y tags son
       obligatorios al publicar, igual que la portada y
       la categoría en Entrevistas. El link es opcional. */
    ArtistService.prototype.validate = function(data, isPublish) {
        var errors = [];
        if (!data.name || !String(data.name).trim()) {
            errors.push({ field: 'arFormName', message: 'El nombre es obligatorio' });
        }
        if (isPublish) {
            if (!data.image || !String(data.image).trim()) {
                errors.push({ field: 'arFormImage', message: 'La imagen es obligatoria para publicar' });
            }
            var tags = window.Backstage.Artist.normalizeTags(data.tags);
            if (!tags.length) {
                errors.push({ field: 'arFormTags', message: 'Se requiere al menos un tag para publicar' });
            }
        }
        return { valid: errors.length === 0, errors: errors };
    };

    ArtistService.prototype._buildArtistData = function(data, id) {
        var now = Date.now();
        return {
            name: String(data.name || '').trim(),
            image: String(data.image || '').trim(),
            tags: window.Backstage.Artist.normalizeTags(data.tags),
            link: String(data.link || '').trim(),
            interview: String(data.interview || '').trim(),
            published: data.published === true || data.published === 'true',
            featured: data.featured === true || data.featured === 'true',
            createdAt: data.createdAt || now,
            updatedAt: now,
            order: parseInt(data.order, 10) || (id ? 1 : this.repository.getMaxOrder() + 1)
        };
    };

    ArtistService.prototype.create = function(data) {
        var artistData = this._buildArtistData(data, null);

        var result = this.repository.create(artistData);
        if (result && typeof result.then === 'function') {
            return result.then(function(artist) {
                window.Backstage.EventBus.emit('artists:created', artist);
                return { success: true, data: artist };
            }).catch(function(err) {
                console.error('[Artist] Error al crear en Supabase', err);
                return { success: false, errors: [err.message || 'Error al guardar en Supabase'] };
            });
        }
        window.Backstage.EventBus.emit('artists:created', result);
        return Promise.resolve({ success: true, data: result });
    };

    ArtistService.prototype.update = function(id, data) {
        var artistData = this._buildArtistData(data, id);

        var result = this.repository.update(id, artistData);
        if (result && typeof result.then === 'function') {
            return result.then(function(artist) {
                if (artist) {
                    window.Backstage.EventBus.emit('artists:updated', artist);
                }
                return { success: !!artist, data: artist };
            }).catch(function(err) {
                console.error('[Artist] Error al actualizar en Supabase', err);
                return { success: false, errors: [err.message || 'Error al guardar en Supabase'] };
            });
        }
        if (result) {
            window.Backstage.EventBus.emit('artists:updated', result);
        }
        return Promise.resolve({ success: !!result, data: result });
    };

    ArtistService.prototype.remove = function(id) {
        var artist = this.repository.getById(id);

        var result = this.repository.remove(id);
        if (result && typeof result.then === 'function') {
            return result.then(function() {
                window.Backstage.EventBus.emit('artists:removed', { id: id, name: artist ? artist.name : '' });
                return true;
            }).catch(function(err) {
                return Promise.reject(err);
            });
        }
        window.Backstage.EventBus.emit('artists:removed', { id: id, name: artist ? artist.name : '' });
        return Promise.resolve(true);
    };

    ArtistService.prototype.togglePublished = function(id) {
        var result = this.repository.togglePublished(id);
        if (result && typeof result.then === 'function') {
            return result.then(function(artist) {
                if (artist) window.Backstage.EventBus.emit('artists:toggled', artist);
                return artist;
            });
        }
        if (result) window.Backstage.EventBus.emit('artists:toggled', result);
        return Promise.resolve(result);
    };

    ArtistService.prototype.toggleFeatured = function(id) {
        var result = this.repository.toggleFeatured(id);
        if (result && typeof result.then === 'function') {
            return result.then(function(artist) {
                if (artist) window.Backstage.EventBus.emit('artists:toggled', artist);
                return artist;
            });
        }
        if (result) window.Backstage.EventBus.emit('artists:toggled', result);
        return Promise.resolve(result);
    };

    ArtistService.prototype.duplicate = function(id) {
        var original = this.repository.getById(id);
        if (!original) return Promise.resolve({ success: false, errors: ['Artista no encontrado'] });

        var now = Date.now();
        var data = original.toJSON();
        data.name = original.name + ' (Copia)';
        data.published = false;
        data.featured = false;
        data.createdAt = now;
        data.updatedAt = now;
        delete data.id;

        var result = this.repository.create(data);
        if (result && typeof result.then === 'function') {
            return result.then(function(artist) {
                window.Backstage.EventBus.emit('artists:created', artist);
                return { success: true, data: artist };
            });
        }
        window.Backstage.EventBus.emit('artists:created', result);
        return Promise.resolve({ success: true, data: result });
    };

    window.Backstage.ArtistService = ArtistService;
})();
