/* ============================================
   BACKSTAGE STUDIO — SiteConfig Repository (local)
   Configuracion general del sitio en localStorage.
   Clave: backstage_site_config
   Formato: un solo objeto SiteConfig.
   ============================================ */

(function() {
    window.Backstage = window.Backstage || {};

    var STORAGE_KEY = 'site_config';

    function SiteConfigRepository(datasource) {
        this.datasource = datasource;
        this.storageKey = STORAGE_KEY;
        this.ModelClass = window.Backstage.SiteConfig;
    }

    SiteConfigRepository.prototype.getConfig = function() {
        var raw = this.datasource.get(this.storageKey);
        if (!raw) return window.Backstage.SiteConfig.defaults();
        return new this.ModelClass(raw);
    };

    SiteConfigRepository.prototype.saveConfig = function(data) {
        var model = new this.ModelClass(data);
        model.updatedAt = Date.now();
        this.datasource.set(this.storageKey, model.toJSON());
        return model;
    };

    SiteConfigRepository.prototype.migrateFromDefaults = function() {
        var existing = this.datasource.get(this.storageKey);
        if (!existing) {
            this.datasource.set(this.storageKey, window.Backstage.SiteConfig.defaults().toJSON());
        }
    };

    window.Backstage.SiteConfigRepository = SiteConfigRepository;
})();
