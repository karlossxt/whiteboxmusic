/* ============================================
   BACKSTAGE STUDIO — Router
   Router hash-based con lifecycle (mount/unmount).
   Cada ruta tiene un controller que se monta/desmonta.
   
   Uso:
     router.register('dashboard', { mount: fn, unmount: fn, title: '...' });
     router.navigate('stories');
   ============================================ */

(function() {
    window.Backstage = window.Backstage || {};

    function Router() {
        this._routes = {};
        this._current = null;
        this._beforeEach = null;
    }

    Router.prototype.register = function(name, config) {
        this._routes[name] = {
            mount: config.mount || function() {},
            unmount: config.unmount || function() {},
            title: config.title || '',
            subtitle: config.subtitle || ''
        };
    };

    Router.prototype.beforeEach = function(hook) {
        this._beforeEach = hook;
    };

    Router.prototype.navigate = function(route) {
        if (!this._routes[route]) route = 'dashboard';
        if (route === this._current) return;

        if (this._beforeEach) {
            var proceed = this._beforeEach(this._current, route);
            if (proceed === false) return;
        }

        this._unmountCurrent();
        this._current = route;
        this._mountRoute(route);
        this._updateHash(route);

        window.Backstage.EventBus.emit('router:navigated', { route: route });
    };

    Router.prototype.getCurrent = function() {
        return this._current;
    };

    Router.prototype.getRouteConfig = function(name) {
        return this._routes[name] || null;
    };

    Router.prototype._unmountCurrent = function() {
        if (this._current && this._routes[this._current]) {
            this._routes[this._current].unmount();
        }
    };

    Router.prototype._mountRoute = function(route) {
        if (this._routes[route]) {
            this._routes[route].mount();
        }
    };

    Router.prototype._updateHash = function(route) {
        if (window.location.hash !== '#' + route) {
            window.location.hash = route;
        }
    };

    Router.prototype._handleHashChange = function() {
        var hash = window.location.hash.replace('#', '') || 'dashboard';
        this.navigate(hash);
    };

    Router.prototype.start = function() {
        var self = this;
        window.addEventListener('hashchange', function() {
            self._handleHashChange();
        });
        this._handleHashChange();
    };

    window.Backstage.Router = Router;
})();
