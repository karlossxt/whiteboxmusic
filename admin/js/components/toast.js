/* Toast Component */
(function() {
    window.WBAdmin = window.WBAdmin || {};

    var container = null;

    function getContainer() {
        if (!container) container = document.getElementById('toastContainer');
        return container;
    }

    window.WBAdmin.toast = {
        show: function(message, type) {
            var c = getContainer();
            if (!c) return;

            var toast = document.createElement('div');
            toast.className = 'toast ' + (type || 'info');

            var iconMap = {
                success: 'fa-check-circle',
                error: 'fa-exclamation-circle',
                info: 'fa-info-circle'
            };

            var icon = document.createElement('i');
            icon.className = 'fa-solid ' + (iconMap[type] || iconMap.info);

            var span = document.createElement('span');
            span.textContent = message;

            toast.appendChild(icon);
            toast.appendChild(span);
            c.appendChild(toast);

            setTimeout(function() {
                if (toast.parentNode) toast.parentNode.removeChild(toast);
            }, 3000);
        }
    };
})();
