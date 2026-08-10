/* ============================================
   BACKSTAGE STUDIO — Interview Service
   Reglas de negocio para entrevistas.
   CRUD devuelve Promises cuando el repo es async.
   ============================================ */

(function() {
    window.Backstage = window.Backstage || {};

    function InterviewService(interviewRepository) {
        this.repository = interviewRepository;
    }

    InterviewService.prototype.getAll = function() { return this.repository.getAll(); };
    InterviewService.prototype.getById = function(id) { return this.repository.getById(id); };
    InterviewService.prototype.getStats = function() { return this.repository.getStats(); };
    InterviewService.prototype.search = function(query) { return this.repository.search(query); };
    InterviewService.prototype.filter = function(status) { return this.repository.filterByStatus(status); };
    InterviewService.prototype.filterByCategory = function(cat) { return this.repository.filterByCategory(cat); };
    InterviewService.prototype.getPublished = function() { return this.repository.getPublished(); };
    InterviewService.prototype.getFeatured = function() { return this.repository.getFeatured(); };
    InterviewService.prototype.getMaxOrder = function() { return this.repository.getMaxOrder(); };

    InterviewService.prototype.generateSlug = function(text) {
        if (!text) return '';
        return text.toLowerCase()
            .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
            .replace(/[^a-z0-9\s-]/g, '')
            .replace(/\s+/g, '-')
            .replace(/-+/g, '-')
            .replace(/^-|-$/g, '');
    };

    InterviewService.prototype.generateUniqueSlug = function(title, excludeId) {
        var slug = this.generateSlug(title);
        if (!slug) return 'sin-titulo';
        if (this.repository.isSlugUnique(slug, excludeId)) return slug;
        var counter = 2;
        while (!this.repository.isSlugUnique(slug + '-' + counter, excludeId)) counter++;
        return slug + '-' + counter;
    };

    InterviewService.prototype.validate = function(data, isPublish) {
        var errors = [];
        if (!data.title || !data.title.trim()) {
            errors.push({ field: 'ivFormTitle', message: 'El titulo es obligatorio' });
        }
        if (isPublish) {
            if (!data.excerpt || !data.excerpt.trim()) {
                errors.push({ field: 'ivFormExcerpt', message: 'El resumen es obligatorio para publicar' });
            }
            if (!data.category || !data.category.trim()) {
                errors.push({ field: 'ivFormCategory', message: 'La categoria es obligatoria para publicar' });
            }
            if (!data.cover || !data.cover.trim()) {
                errors.push({ field: 'ivFormCover', message: 'La portada es obligatoria para publicar' });
            }
        }
        return { valid: errors.length === 0, errors: errors };
    };

    InterviewService.prototype._buildInterviewData = function(data, id) {
        var now = Date.now();
        var slug = data.slug || this.generateUniqueSlug(data.title, id || null);
        return {
            title: (data.title || '').trim(),
            slug: slug,
            excerpt: (data.excerpt || '').trim(),
            content: (data.content || '').trim(),
            category: (data.category || '').trim(),
            author: (data.author || '').trim(),
            cover: (data.cover || '').trim() || '',
            youtubeUrl: (data.youtubeUrl || '').trim(),
            spotifyUrl: (data.spotifyUrl || '').trim(),
            published: data.published === true || data.published === 'true',
            featured: data.featured === true || data.featured === 'true',
            publishDate: (data.publishDate || '').trim(),
            createdAt: data.createdAt || now,
            updatedAt: now,
            order: parseInt(data.order, 10) || (id ? 1 : this.repository.getMaxOrder() + 1)
        };
    };

    InterviewService.prototype.create = function(data) {
        var self = this;
        var interviewData = this._buildInterviewData(data, null);

        var result = this.repository.create(interviewData);
        if (result && typeof result.then === 'function') {
            return result.then(function(iv) {
                window.Backstage.EventBus.emit('interviews:created', iv);
                return { success: true, data: iv };
            }).catch(function(err) {
                return { success: false, errors: [err.message || 'Error al guardar en Firestore'] };
            });
        }
        window.Backstage.EventBus.emit('interviews:created', result);
        return Promise.resolve({ success: true, data: result });
    };

    InterviewService.prototype.update = function(id, data) {
        var self = this;
        var interviewData = this._buildInterviewData(data, id);

        var result = this.repository.update(id, interviewData);
        if (result && typeof result.then === 'function') {
            return result.then(function(iv) {
                if (iv) {
                    window.Backstage.EventBus.emit('interviews:updated', iv);
                }
                return { success: !!iv, data: iv };
            }).catch(function(err) {
                return { success: false, errors: [err.message || 'Error al guardar en Firestore'] };
            });
        }
        if (result) {
            window.Backstage.EventBus.emit('interviews:updated', result);
        }
        return Promise.resolve({ success: !!result, data: result });
    };

    InterviewService.prototype.remove = function(id) {
        var iv = this.repository.getById(id);

        var result = this.repository.remove(id);
        if (result && typeof result.then === 'function') {
            return result.then(function() {
                window.Backstage.EventBus.emit('interviews:removed', { id: id, title: iv ? iv.title : '' });
                return true;
            }).catch(function(err) {
                return Promise.reject(err);
            });
        }
        window.Backstage.EventBus.emit('interviews:removed', { id: id, title: iv ? iv.title : '' });
        return Promise.resolve(true);
    };

    InterviewService.prototype.togglePublished = function(id) {
        var result = this.repository.togglePublished(id);
        if (result && typeof result.then === 'function') {
            return result.then(function(iv) {
                if (iv) window.Backstage.EventBus.emit('interviews:toggled', iv);
                return iv;
            });
        }
        if (result) window.Backstage.EventBus.emit('interviews:toggled', result);
        return Promise.resolve(result);
    };

    InterviewService.prototype.toggleFeatured = function(id) {
        var result = this.repository.toggleFeatured(id);
        if (result && typeof result.then === 'function') {
            return result.then(function(iv) {
                if (iv) window.Backstage.EventBus.emit('interviews:toggled', iv);
                return iv;
            });
        }
        if (result) window.Backstage.EventBus.emit('interviews:toggled', result);
        return Promise.resolve(result);
    };

    InterviewService.prototype.duplicate = function(id) {
        var self = this;
        var original = this.repository.getById(id);
        if (!original) return Promise.resolve({ success: false, errors: ['Entrevista no encontrada'] });

        var now = Date.now();
        var newTitle = original.title + ' (Copia)';
        var newSlug = this.generateUniqueSlug(newTitle, null);

        var data = original.toJSON();
        data.title = newTitle;
        data.slug = newSlug;
        data.published = false;
        data.featured = false;
        data.createdAt = now;
        data.updatedAt = now;
        delete data.id;

        var result = this.repository.create(data);
        if (result && typeof result.then === 'function') {
            return result.then(function(iv) {
                window.Backstage.EventBus.emit('interviews:created', iv);
                return { success: true, data: iv };
            });
        }
        window.Backstage.EventBus.emit('interviews:created', result);
        return Promise.resolve({ success: true, data: result });
    };

    window.Backstage.InterviewService = InterviewService;
})();
