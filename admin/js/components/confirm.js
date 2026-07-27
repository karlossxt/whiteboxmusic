/* Confirm Dialog Component */
(function() {
    window.WBAdmin = window.WBAdmin || {};

    var confirmOverlay = null;
    var confirmTitle = null;
    var confirmText = null;
    var confirmDeleteBtn = null;
    var confirmCancelBtn = null;
    var currentCallback = null;

    function getElements() {
        if (!confirmOverlay) {
            confirmOverlay = document.getElementById('confirmModal');
            confirmTitle = document.getElementById('confirmTitle');
            confirmText = document.getElementById('confirmText');
            confirmDeleteBtn = document.getElementById('confirmDelete');
            confirmCancelBtn = document.getElementById('confirmCancel');
        }
    }

    function bindEvents() {
        if (confirmDeleteBtn._bound) return;

        confirmDeleteBtn.addEventListener('click', function() {
            if (currentCallback) {
                currentCallback();
                currentCallback = null;
            }
            window.WBAdmin.modal.closeAll();
        });

        confirmCancelBtn.addEventListener('click', function() {
            currentCallback = null;
            window.WBAdmin.modal.closeAll();
        });

        confirmOverlay.addEventListener('click', function(e) {
            if (e.target === confirmOverlay) {
                currentCallback = null;
                window.WBAdmin.modal.closeAll();
            }
        });

        confirmDeleteBtn._bound = true;
    }

    window.WBAdmin.confirm = {
        show: function(title, text, onConfirm) {
            getElements();
            bindEvents();

            if (confirmTitle) confirmTitle.textContent = title || 'Confirmar';
            if (confirmText) confirmText.textContent = text || 'Esta accion no se puede deshacer.';

            currentCallback = onConfirm;
            window.WBAdmin.modal.open(confirmOverlay);
        }
    };
})();
