/* ============================================
   BACKSTAGE STUDIO — Modal Component
   Modal reutilizable con soporte para contenido dinámico.
   ============================================ */

(function() {
    window.Backstage = window.Backstage || {};
    window.Backstage.Components = window.Backstage.Components || {};

    window.Backstage.Components.Modal = {
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
        },

        setContent: function(overlay, title, formElement) {
            if (!overlay) return;
            var titleEl = overlay.querySelector('.modal-header h2');
            if (titleEl) titleEl.textContent = title;

            var existingForm = overlay.querySelector('form');
            if (existingForm && formElement) {
                existingForm.replaceWith(formElement);
            }
        }
    };
})();
