/* Modal Component */
(function() {
    window.WBAdmin = window.WBAdmin || {};

    window.WBAdmin.modal = {
        open: function(overlay) {
            if (!overlay) return;
            overlay.classList.add('active');
            document.body.style.overflow = 'hidden';
        },

        close: function(overlay) {
            if (!overlay) return;
            overlay.classList.remove('active');
            document.body.style.overflow = '';
        },

        closeAll: function() {
            var modals = document.querySelectorAll('.modal-overlay.active');
            for (var i = 0; i < modals.length; i++) {
                modals[i].classList.remove('active');
            }
            document.body.style.overflow = '';
        }
    };
})();
