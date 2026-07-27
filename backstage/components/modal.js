/* ============================================
   BACKSTAGE STUDIO — Modal Component
   Modal reutilizable con soporte para contenido dinámico.
   ============================================ */

(function() {
    window.Backstage = window.Backstage || {};
    window.Backstage.Components = window.Backstage.Components || {};

    var _previousFocus = null;
    var _FOCUSABLE = 'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

    function _trapFocus(e) {
        var topModal = null;
        var modals = document.querySelectorAll('.modal-overlay.active');
        if (modals.length > 0) topModal = modals[modals.length - 1];
        if (!topModal) return;
        var focusable = topModal.querySelectorAll(_FOCUSABLE);
        if (focusable.length === 0) return;
        var first = focusable[0];
        var last = focusable[focusable.length - 1];
        if (e.key === 'Tab') {
            if (e.shiftKey) {
                if (document.activeElement === first) {
                    e.preventDefault();
                    last.focus();
                }
            } else {
                if (document.activeElement === last) {
                    e.preventDefault();
                    first.focus();
                }
            }
        }
    }

    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape') {
            var modals = document.querySelectorAll('.modal-overlay.active');
            if (modals.length > 0) {
                var topModal = modals[modals.length - 1];
                if (topModal.id === 'confirmModal' && window.Backstage.Components.Confirm) {
                    window.Backstage.Components.Confirm.clearCallback();
                }
                topModal.classList.remove('active');
                if (modals.length === 1) {
                    document.body.style.overflow = '';
                    if (_previousFocus) {
                        _previousFocus.focus();
                        _previousFocus = null;
                    }
                }
                e.stopPropagation();
                return;
            }
        }
        _trapFocus(e);
    });

    window.Backstage.Components.Modal = {
        open: function(overlay) {
            if (!overlay) return;
            _previousFocus = document.activeElement;
            overlay.classList.add('active');
            document.body.style.overflow = 'hidden';
            var focusable = overlay.querySelectorAll(_FOCUSABLE);
            if (focusable.length > 0) {
                setTimeout(function() { focusable[0].focus(); }, 100);
            }
        },

        close: function(overlay) {
            if (!overlay) return;
            overlay.classList.remove('active');
            var remaining = document.querySelectorAll('.modal-overlay.active');
            if (remaining.length === 0) {
                document.body.style.overflow = '';
                if (_previousFocus) {
                    _previousFocus.focus();
                    _previousFocus = null;
                }
            }
        },

        closeAll: function() {
            var modals = document.querySelectorAll('.modal-overlay.active');
            for (var i = 0; i < modals.length; i++) {
                modals[i].classList.remove('active');
            }
            document.body.style.overflow = '';
            if (_previousFocus) {
                _previousFocus.focus();
                _previousFocus = null;
            }
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
