/* ============================================
   BACKSTAGE STUDIO — Event Bus
   Sistema de eventos desacoplado.
   Permite comunicación entre capas sin dependencias circulares.
   
   Uso:
     Backstage.EventBus.emit('stories:created', data);
     Backstage.EventBus.on('stories:created', function(data) { ... });
     Backstage.EventBus.off('stories:created', handler);
   ============================================ */

(function() {
    window.Backstage = window.Backstage || {};

    function EventBus() {
        this._listeners = {};
    }

    EventBus.prototype.on = function(event, callback) {
        if (!this._listeners[event]) {
            this._listeners[event] = [];
        }
        this._listeners[event].push(callback);
        return this;
    };

    EventBus.prototype.off = function(event, callback) {
        if (!this._listeners[event]) return this;
        if (!callback) {
            this._listeners[event] = [];
        } else {
            this._listeners[event] = this._listeners[event].filter(function(cb) {
                return cb !== callback;
            });
        }
        return this;
    };

    EventBus.prototype.emit = function(event, data) {
        if (!this._listeners[event]) return this;
        var listeners = this._listeners[event].slice();
        for (var i = 0; i < listeners.length; i++) {
            try {
                listeners[i](data);
            } catch (e) {
                console.error('[Backstage EventBus] Error in listener for "' + event + '":', e);
            }
        }
        return this;
    };

    EventBus.prototype.once = function(event, callback) {
        var self = this;
        function wrapper(data) {
            self.off(event, wrapper);
            callback(data);
        }
        return this.on(event, wrapper);
    };

    window.Backstage.EventBus = new EventBus();
})();
