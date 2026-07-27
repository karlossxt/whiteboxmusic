/* ============================================
   BACKSTAGE STUDIO — Dashboard View
   Solo renderiza el dashboard. No conoce servicios ni datos.
   ============================================ */

(function() {
    window.Backstage = window.Backstage || {};
    window.Backstage.Views = window.Backstage.Views || {};

    window.Backstage.Views.Dashboard = {
        _container: null,

        init: function(containerId) {
            this._container = document.getElementById(containerId);
        },

        render: function(statCards, onNewStory, onNewSong, onViewSite) {
            if (!this._container) return;
            this._container.textContent = '';

            var cards = window.Backstage.Templates.statsCards(statCards);
            this._container.appendChild(cards);

            var actions = document.createElement('div');
            actions.className = 'dashboard-actions';

            var storyBtn = document.createElement('button');
            storyBtn.className = 'btn-primary';
            storyBtn.innerHTML = '<i class="fa-solid fa-plus"></i> Nueva Historia';
            storyBtn.addEventListener('click', onNewStory);
            actions.appendChild(storyBtn);

            var ssBtn = document.createElement('button');
            ssBtn.className = 'btn-primary';
            ssBtn.innerHTML = '<i class="fa-solid fa-plus"></i> Nueva Cancion';
            ssBtn.addEventListener('click', onNewSong);
            actions.appendChild(ssBtn);

            var viewBtn = document.createElement('button');
            viewBtn.className = 'btn-secondary';
            viewBtn.innerHTML = '<i class="fa-solid fa-external-link"></i> Ver sitio';
            viewBtn.addEventListener('click', onViewSite);
            actions.appendChild(viewBtn);

            this._container.appendChild(actions);
        }
    };
})();
