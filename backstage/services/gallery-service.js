(function() {
    window.Backstage = window.Backstage || {};

    function GalleryService(galleryRepository) {
        this.repository = galleryRepository;
    }

    GalleryService.prototype.getAll = function() {
        return this.repository.getAll();
    };

    GalleryService.prototype.getById = function(id) {
        return this.repository.getById(id);
    };

    GalleryService.prototype.getStats = function() {
        return this.repository.getStats();
    };

    GalleryService.prototype.getMaxOrder = function() {
        return this.repository.getMaxOrder();
    };

    GalleryService.prototype.validate = function(data) {
        var errors = [];
        if (!data.title || !data.title.trim()) errors.push('El título es obligatorio');
        if (!data.cardImage || !data.cardImage.trim()) errors.push('La imagen de portada es obligatoria');
        return { valid: errors.length === 0, errors: errors };
    };

    GalleryService.prototype._buildEventData = function(data) {
        return {
            title: (data.title || '').trim(),
            subtitle: (data.subtitle || '').trim(),
            cardImage: (data.cardImage || '').trim(),
            intro: (data.intro || '').trim(),
            sliderImages: Array.isArray(data.sliderImages) ? data.sliderImages : [],
            galleryItems: Array.isArray(data.galleryItems) ? data.galleryItems : [],
            order: parseInt(data.order, 10) || this.repository.getMaxOrder() + 1,
            updatedAt: new Date().toISOString()
        };
    };

    GalleryService.prototype.create = function(data) {
        var self = this;
        var validation = this.validate(data);
        if (!validation.valid) return Promise.resolve({ success: false, errors: validation.errors });

        var eventData = this._buildEventData(data);

        var result = this.repository.create(eventData);
        if (result && typeof result.then === 'function') {
            return result.then(function(item) {
                window.Backstage.EventBus.emit('gallery:created', item);
                return { success: true, data: item };
            });
        }
        window.Backstage.EventBus.emit('gallery:created', result);
        return Promise.resolve({ success: true, data: result });
    };

    GalleryService.prototype.update = function(id, data) {
        var self = this;
        var validation = this.validate(data);
        if (!validation.valid) return Promise.resolve({ success: false, errors: validation.errors });

        var eventData = this._buildEventData(data);

        var result = this.repository.update(id, eventData);
        if (result && typeof result.then === 'function') {
            return result.then(function(item) {
                if (item) {
                    window.Backstage.EventBus.emit('gallery:updated', item);
                }
                return { success: !!item, data: item };
            });
        }
        if (result) {
            window.Backstage.EventBus.emit('gallery:updated', result);
        }
        return Promise.resolve({ success: !!result, data: result });
    };

    GalleryService.prototype.remove = function(id) {
        var item = this.repository.getById(id);

        var result = this.repository.remove(id);
        if (result && typeof result.then === 'function') {
            return result.then(function() {
                window.Backstage.EventBus.emit('gallery:removed', { id: id, title: item ? item.title : '' });
                return true;
            });
        }
        window.Backstage.EventBus.emit('gallery:removed', { id: id, title: item ? item.title : '' });
        return Promise.resolve(true);
    };

    window.Backstage.GalleryService = GalleryService;
})();
