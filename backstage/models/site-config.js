/* ============================================
   BACKSTAGE STUDIO — SiteConfig Model
   Configuracion general del sitio (un solo documento).
   - id: 'site' (doc unico)
   - social: { spotify, instagram, tiktok, youtube, facebook }
   ============================================ */

(function() {
    window.Backstage = window.Backstage || {};

    var DEFAULT_SOCIAL = {
        spotify: '',
        instagram: '',
        tiktok: '',
        youtube: '',
        facebook: ''
    };

    function SiteConfig(data) {
        var raw = data || {};
        this.id = raw.id || 'site';
        this.siteName = raw.siteName || '';
        this.tagline = raw.tagline || '';
        this.siteDescription = raw.siteDescription || '';
        this.logoUrl = raw.logoUrl || '';
        this.social = Object.assign({}, DEFAULT_SOCIAL, (raw.social && typeof raw.social === 'object') ? raw.social : {});
        this.contactEmail = raw.contactEmail || '';
        this.footerText = raw.footerText || '';
        this.defaultSeoTitle = raw.defaultSeoTitle || '';
        this.defaultSeoDescription = raw.defaultSeoDescription || '';
        this.defaultOgImage = raw.defaultOgImage || '';
        this.updatedAt = raw.updatedAt || 0;
    }

    SiteConfig.prototype.toJSON = function() {
        return {
            id: this.id,
            siteName: this.siteName,
            tagline: this.tagline,
            siteDescription: this.siteDescription,
            logoUrl: this.logoUrl,
            social: Object.assign({}, this.social),
            contactEmail: this.contactEmail,
            footerText: this.footerText,
            defaultSeoTitle: this.defaultSeoTitle,
            defaultSeoDescription: this.defaultSeoDescription,
            defaultOgImage: this.defaultOgImage,
            updatedAt: this.updatedAt
        };
    };

    SiteConfig.defaults = function() {
        return new SiteConfig();
    };

    SiteConfig.create = function(raw) {
        return new SiteConfig(raw);
    };

    window.Backstage.SiteConfig = SiteConfig;
})();
