/* ============================================
   BACKSTAGE STUDIO — Action Buttons Template
   Genera los botones de acción de tabla (toggle, edit, delete).
   ============================================ */

(function() {
    window.Backstage = window.Backstage || {};
    window.Backstage.Templates = window.Backstage.Templates || {};

    window.Backstage.Templates.tableActions = function(actions) {
        var div = document.createElement('div');
        div.className = 'table-actions';

        actions.forEach(function(action) {
            var btn = document.createElement('button');
            btn.className = 'btn-icon' + (action.className ? ' ' + action.className : '');
            btn.title = action.title || '';
            btn.setAttribute('aria-label', action.ariaLabel || action.title || '');

            var icon = document.createElement('i');
            icon.className = 'fa-solid ' + action.icon;
            btn.appendChild(icon);

            if (action.onClick) {
                btn.addEventListener('click', action.onClick);
            }

            div.appendChild(btn);
        });

        return div;
    };
})();
