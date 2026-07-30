(function() {
    window.Backstage = window.Backstage || {};

    function GalleryEvent(data) {
        var raw = data || {};
        this.id = raw.id || '';
        this.title = raw.title || '';
        this.subtitle = raw.subtitle || '';
        this.cardImage = raw.cardImage || '';
        this.intro = raw.intro || '';
        this.sliderImages = Array.isArray(raw.sliderImages) ? raw.sliderImages.slice() : [];
        this.galleryItems = Array.isArray(raw.galleryItems) ? raw.galleryItems.slice() : [];
        this.order = parseInt(raw.order, 10) || 1;
        this.updatedAt = raw.updatedAt || new Date().toISOString();
    }

    GalleryEvent.prototype.toJSON = function() {
        return {
            id: this.id,
            title: this.title,
            subtitle: this.subtitle,
            cardImage: this.cardImage,
            intro: this.intro,
            sliderImages: this.sliderImages.slice(),
            galleryItems: this.galleryItems.slice(),
            order: this.order,
            updatedAt: this.updatedAt
        };
    };

    GalleryEvent.create = function(raw) {
        return new GalleryEvent(raw);
    };

    window.Backstage.GalleryEvent = GalleryEvent;
})();
