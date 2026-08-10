/* ============================================
   BACKSTAGE STUDIO — SiteConfig Service
   Reglas de negocio para la configuracion del sitio.
   Soporta repositorio local (sync) y Firestore (async).
   ============================================ */

(function() {
    window.Backstage = window.Backstage || {};

    function SiteConfigService(siteConfigRepository) {
        this.repository = siteConfigRepository;
    }

    SiteConfigService.prototype.getConfig = function() {
        return this.repository.getConfig();
    };

    SiteConfigService.prototype.validate = function(data) {
        var errors = [];
        if (!data || typeof data !== 'object') {
            errors.push('No hay datos que guardar');
            return { valid: false, errors: errors };
        }
        return { valid: true, errors: errors };
    };

    SiteConfigService.prototype.saveConfig = function(data) {
        var validation = this.validate(data);
        if (!validation.valid) return Promise.resolve({ success: false, errors: validation.errors });

        var cleaned = {};
        Object.keys(data).forEach(function(k) {
            var v = data[k];
            if (v === null || v === undefined) return;
            if (k === 'social' && typeof v === 'object') {
                cleaned[k] = Object.assign({}, v);
                return;
            }
            cleaned[k] = typeof v === 'string' ? v : String(v);
        });

        var result = this.repository.saveConfig(cleaned);

        if (result && typeof result.then === 'function') {
            return result.then(function(saved) {
                window.Backstage.EventBus.emit('siteconfig:saved', saved);
                return { success: true, data: saved };
            }).catch(function(err) {
                console.error('[Backstage] Error guardando config en Firestore', err);
                return { success: false, errors: [err.message || 'Error al guardar en Firestore'] };
            });
        }

        window.Backstage.EventBus.emit('siteconfig:saved', result);
        return Promise.resolve({ success: !!result, data: result });
    };

    window.Backstage.SiteConfigService = SiteConfigService;
})();
