/* ============================================
   BACKSTAGE STUDIO — Empty State Template
   Genera el componente de estado vacío reutilizable.
   ============================================ */

(function() {
    window.Backstage = window.Backstage || {};
    window.Backstage.Templates = window.Backstage.Templates || {};

    window.Backstage.Templates.emptyState = function(config) {
        var el = document.createElement('div');
        el.className = 'admin-empty';
        el.setAttribute('data-backstage-empty', '');

        var icon = document.createElement('i');
        icon.className = 'fa-solid ' + (config.icon || 'fa-inbox');
        el.appendChild(icon);

        var h3 = document.createElement('h3');
        h3.textContent = config.title || 'Sin datos';
        el.appendChild(h3);

        var p = document.createElement('p');
        p.textContent = config.text || '';
        el.appendChild(p);

        return el;
    };
})();
