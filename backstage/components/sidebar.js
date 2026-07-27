/* ============================================
   BACKSTAGE STUDIO — Sidebar Component
   Navegación lateral del panel.
   ============================================ */

(function() {
    window.Backstage = window.Backstage || {};
    window.Backstage.Components = window.Backstage.Components || {};

    window.Backstage.Components.Sidebar = {
        init: function() {
            this._bindNav();
        },

        _bindNav: function() {
            var items = document.querySelectorAll('.admin-nav-item[data-section]');
            for (var i = 0; i < items.length; i++) {
                items[i].addEventListener('click', function(e) {
                    e.preventDefault();
                    var route = this.getAttribute('data-section');
                    if (route) {
                        window.Backstage.router.navigate(route);
                    }
                });
            }
        },

        setActive: function(route) {
            var items = document.querySelectorAll('.admin-nav-item[data-section]');
            for (var i = 0; i < items.length; i++) {
                items[i].classList.remove('active');
                if (items[i].getAttribute('data-section') === route) {
                    items[i].classList.add('active');
                }
            }
        }
    };
})();
