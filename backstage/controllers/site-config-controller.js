/* ============================================
   BACKSTAGE STUDIO — SiteConfig Controller
   Conecta SiteConfigService con SiteConfigView.
   Maneja repos local (sync) y Firestore (async).
   ============================================ */

(function() {
    window.Backstage = window.Backstage || {};
    window.Backstage.Controllers = window.Backstage.Controllers || {};

    var Toast = window.Backstage.Components.Toast;
    var Confirm = window.Backstage.Components.Confirm;
    var Header = window.Backstage.Components.Header;

    function SiteConfigController(siteConfigService, siteConfigView) {
        this.service = siteConfigService;
        this.view = siteConfigView;
        this._saving = false;
        this._eventsBound = false;
    }

    SiteConfigController.prototype.mount = function() {
        this._renderForm();
        this._bindEvents();
    };

    SiteConfigController.prototype.unmount = function() {
        Header.hideAll();
    };

    SiteConfigController.prototype.refresh = function() {
        this._renderForm();
    };

    SiteConfigController.prototype._renderForm = function() {
        var config = this.service.getConfig();
        var self = this;

        this.view.renderForm(config, {
            save: function() { self._save(); },
            reset: function() { self._reset(); }
        });
    };

    SiteConfigController.prototype._save = function() {
        if (this._saving) return;
        var self = this;

        var values = this.view.getFormValues();
        this._saving = true;

        function handle(r) {
            self._saving = false;
            if (r && r.success) {
                Toast.show('Configuracion guardada', 'success');
                self._renderForm();
            } else {
                var msg = (r && r.errors) ? r.errors.join('. ') : 'Error al guardar';
                Toast.show(msg, 'error');
            }
        }

        var result = this.service.saveConfig(values);
        if (result && typeof result.then === 'function') {
            result.then(handle).catch(function(err) {
                self._saving = false;
                Toast.show(err.message || 'Error al guardar', 'error');
            });
        } else {
            handle(result);
        }
    };

    SiteConfigController.prototype._reset = function() {
        var self = this;
        Confirm.show('Restaurar configuracion', 'Se restauraran los valores por defecto de la configuracion del sitio. Esta accion no se puede deshacer.', function() {
            var defaults = window.Backstage.SiteConfig.defaults();
            var result = self.service.saveConfig(defaults.toJSON());
            var promise = (result && typeof result.then === 'function') ? result : Promise.resolve(result);
            promise.then(function(r) {
                Toast.show(r && r.success ? 'Configuracion restaurada' : 'Error al restaurar', r && r.success ? 'success' : 'error');
                self._renderForm();
            }).catch(function(err) {
                Toast.show(err.message || 'Error al restaurar', 'error');
            });
        });
    };

    SiteConfigController.prototype._bindEvents = function() {
        if (this._eventsBound) return;
        this._eventsBound = true;
        var self = this;
        window.Backstage.EventBus.on('siteconfig:saved', function() {
            self._renderForm();
        });
    };

    window.Backstage.Controllers.SiteConfig = SiteConfigController;
})();
