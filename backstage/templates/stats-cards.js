/* ============================================
   BACKSTAGE STUDIO — Stats Cards Template
   Genera el grid de tarjetas de estadísticas.
   ============================================ */

(function() {
    window.Backstage = window.Backstage || {};
    window.Backstage.Templates = window.Backstage.Templates || {};

    window.Backstage.Templates.statsCards = function(cards) {
        var grid = document.createElement('div');
        grid.className = 'admin-stats';

        cards.forEach(function(c) {
            var card = document.createElement('div');
            card.className = 'stat-card';

            var numDiv = document.createElement('div');
            numDiv.className = 'stat-number';
            numDiv.textContent = c.value;

            var labelDiv = document.createElement('div');
            labelDiv.className = 'stat-label';
            labelDiv.textContent = c.label;

            card.appendChild(numDiv);
            card.appendChild(labelDiv);
            grid.appendChild(card);
        });

        return grid;
    };
})();
