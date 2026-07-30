(function() {
    window.Backstage = window.Backstage || {};

    var STORAGE_KEY = 'gallery_events_data';

    function GalleryRepository(datasource) {
        window.Backstage.BaseRepository.call(this, STORAGE_KEY, datasource, window.Backstage.GalleryEvent);
    }

    GalleryRepository.prototype = Object.create(window.Backstage.BaseRepository.prototype);
    GalleryRepository.prototype.constructor = GalleryRepository;

    GalleryRepository.prototype.search = function(query) {
        var q = (query || '').toLowerCase();
        return this.getAll().filter(function(item) {
            return (item.title || '').toLowerCase().indexOf(q) !== -1 ||
                   (item.subtitle || '').toLowerCase().indexOf(q) !== -1;
        });
    };

    GalleryRepository.prototype.getStats = function() {
        var items = this.getAll();
        var totalGalleryItems = 0;
        var totalSliderImages = 0;
        items.forEach(function(ev) {
            totalGalleryItems += (ev.galleryItems || []).length;
            totalSliderImages += (ev.sliderImages || []).length;
        });
        return {
            total: items.length,
            totalGalleryItems: totalGalleryItems,
            totalSliderImages: totalSliderImages,
            withContent: items.filter(function(ev) {
                return ev.galleryItems && ev.galleryItems.length > 0;
            }).length
        };
    };

    GalleryRepository.prototype.migrateFromDefaults = function(defaultData) {
        var existing = this.datasource.get(this.storageKey);
        if (!existing && defaultData && defaultData.length > 0) {
            this.datasource.set(this.storageKey, defaultData);
        }
    };

    window.Backstage.GalleryRepository = GalleryRepository;
})();
