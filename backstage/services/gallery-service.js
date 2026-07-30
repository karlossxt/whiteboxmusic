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

    GalleryService.prototype.validate = function(data) {
        var errors = [];
        if (!data.title || !data.title.trim()) errors.push('El título es obligatorio');
        if (!data.cardImage || !data.cardImage.trim()) errors.push('La imagen de portada es obligatoria');
        return { valid: errors.length === 0, errors: errors };
    };

    GalleryService.prototype.create = function(data) {
        var validation = this.validate(data);
        if (!validation.valid) return { success: false, errors: validation.errors };

        var eventData = {
            title: data.title.trim(),
            subtitle: (data.subtitle || '').trim(),
            cardImage: (data.cardImage || '').trim(),
            intro: (data.intro || '').trim(),
            sliderImages: Array.isArray(data.sliderImages) ? data.sliderImages : [],
            galleryItems: Array.isArray(data.galleryItems) ? data.galleryItems : [],
            order: parseInt(data.order, 10) || this.repository.getMaxOrder() + 1
        };

        var item = this.repository.create(eventData);
        window.Backstage.EventBus.emit('gallery:created', item);
        return { success: true, data: item };
    };

    GalleryService.prototype.update = function(id, data) {
        var validation = this.validate(data);
        if (!validation.valid) return { success: false, errors: validation.errors };

        var eventData = {
            title: data.title.trim(),
            subtitle: (data.subtitle || '').trim(),
            cardImage: (data.cardImage || '').trim(),
            intro: (data.intro || '').trim(),
            sliderImages: Array.isArray(data.sliderImages) ? data.sliderImages : [],
            galleryItems: Array.isArray(data.galleryItems) ? data.galleryItems : [],
            order: parseInt(data.order, 10) || 1
        };

        var item = this.repository.update(id, eventData);
        if (item) {
            window.Backstage.EventBus.emit('gallery:updated', item);
        }
        return { success: !!item, data: item };
    };

    GalleryService.prototype.remove = function(id) {
        var item = this.repository.getById(id);
        this.repository.remove(id);
        window.Backstage.EventBus.emit('gallery:removed', { id: id, title: item ? item.title : '' });
        return true;
    };

    GalleryService.prototype.getMaxOrder = function() {
        return this.repository.getMaxOrder();
    };

    window.Backstage.GalleryService = GalleryService;
})();
