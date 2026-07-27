/* ============================================
   BACKSTAGE STUDIO — Confirm Component
   Diálogo de confirmación reutilizable.
   ============================================ */

(function() {
    window.Backstage = window.Backstage || {};
    window.Backstage.Components = window.Backstage.Components || {};

    var overlay = null;
    var titleEl = null;
    var textEl = null;
    var deleteBtn = null;
    var cancelBtn = null;
    var currentCallback = null;
    var bound = false;

    function getElements() {
        if (!overlay) {
            overlay = document.getElementById('confirmModal');
            titleEl = document.getElementById('confirmTitle');
            textEl = document.getElementById('confirmText');
            deleteBtn = document.getElementById('confirmDelete');
            cancelBtn = document.getElementById('confirmCancel');
        }
    }

    function clearCallback() {
        currentCallback = null;
    }

    function bindEvents() {
        if (bound) return;

        deleteBtn.addEventListener('click', function() {
            if (currentCallback) {
                var cb = currentCallback;
                currentCallback = null;
                cb();
            }
            window.Backstage.Components.Modal.closeAll();
        });

        cancelBtn.addEventListener('click', function() {
            clearCallback();
            window.Backstage.Components.Modal.closeAll();
        });

        overlay.addEventListener('click', function(e) {
            if (e.target === overlay) {
                clearCallback();
                window.Backstage.Components.Modal.closeAll();
            }
        });

        bound = true;
    }

    window.Backstage.Components.Confirm = {
        show: function(title, text, onConfirm) {
            getElements();
            bindEvents();

            if (titleEl) titleEl.textContent = title || 'Confirmar';
            if (textEl) textEl.textContent = text || 'Esta accion no se puede deshacer.';

            currentCallback = onConfirm;
            window.Backstage.Components.Modal.open(overlay);
        },
        clearCallback: function() {
            clearCallback();
        }
    };
})();
