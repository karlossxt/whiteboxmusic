/* ============================================
   BACKSTAGE STUDIO — Header Component
   Header principal con título, subtítulo y botones de acción.
   ============================================ */

(function() {
    window.Backstage = window.Backstage || {};
    window.Backstage.Components = window.Backstage.Components || {};

    window.Backstage.Components.Header = {
        _h1: null,
        _subtitle: null,
        _actionsContainer: null,

        init: function() {
            this._h1 = document.querySelector('.admin-header h1');
            this._subtitle = document.querySelector('.admin-subtitle');
            this._actionsContainer = document.querySelector('.admin-header-right');
        },

        setTitle: function(title) {
            if (this._h1) this._h1.textContent = title;
        },

        setSubtitle: function(subtitle) {
            if (this._subtitle) this._subtitle.textContent = subtitle;
        },

        updateForRoute: function(route) {
            var config = window.Backstage.router.getRouteConfig(route);
            if (config) {
                this.setTitle(config.title);
                this.setSubtitle(config.subtitle);
            }
        },

        clearActions: function() {
            if (this._actionsContainer) this._actionsContainer.textContent = '';
        },

        addAction: function(config) {
            if (!this._actionsContainer) return;
            if (config.id && document.getElementById(config.id)) return;
            var btn = document.createElement('button');
            btn.className = 'btn-primary';
            if (config.id) btn.id = config.id;
            if (config.display === false) btn.style.display = 'none';

            var icon = document.createElement('i');
            icon.className = 'fa-solid ' + (config.icon || 'fa-plus');
            btn.appendChild(icon);
            btn.appendChild(document.createTextNode(' ' + (config.label || '')));

            if (config.onClick) btn.addEventListener('click', config.onClick);
            this._actionsContainer.appendChild(btn);
        },

        showOnly: function(buttonId) {
            var btns = this._actionsContainer.querySelectorAll('.btn-primary');
            for (var i = 0; i < btns.length; i++) {
                btns[i].style.display = btns[i].id === buttonId ? '' : 'none';
            }
        },

        hideAll: function() {
            var btns = this._actionsContainer.querySelectorAll('.btn-primary');
            for (var i = 0; i < btns.length; i++) {
                btns[i].style.display = 'none';
            }
        }
    };
})();
