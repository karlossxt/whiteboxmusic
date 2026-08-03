/* ============================================
   SIDEBAR — Menú lateral compartido
   - Desktop: contrae/expande el sidebar
   - Mobile: abre/cierra el sidebar deslizante
   ============================================ */
(function() {
    'use strict';

    var MOBILE_MAX = 768;

    function isMobile() {
        return (window.innerWidth || document.documentElement.clientWidth) <= MOBILE_MAX;
    }

    function closeMobileMenu() {
        var sidebar = document.getElementById('sidebar');
        var overlay = document.getElementById('overlay');
        if (sidebar) sidebar.classList.remove('active');
        if (overlay) overlay.classList.remove('active');
    }

    window.toggleMenu = function() {
        var sidebar = document.getElementById('sidebar');
        if (!sidebar) return;

        if (isMobile()) {
            sidebar.classList.toggle('active');
            var overlay = document.getElementById('overlay');
            if (overlay) overlay.classList.toggle('active');
        } else {
            document.body.classList.toggle('sidebar-collapsed');
        }
    };

    window.addEventListener('resize', function() {
        if (!isMobile()) closeMobileMenu();
    });
})();
