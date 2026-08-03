/* ============================================
   BACKSTAGE STUDIO — Dashboard View
   Renderiza el dashboard con métricas y rejilla asimétrica.
   No conoce servicios ni datos.
   ============================================ */

(function() {
    window.Backstage = window.Backstage || {};
    window.Backstage.Views = window.Backstage.Views || {};

    function el(tag, className, text) {
        var node = document.createElement(tag);
        if (className) node.className = className;
        if (text !== undefined && text !== null) node.textContent = text;
        return node;
    }

    window.Backstage.Views.Dashboard = {
        _container: null,

        init: function(containerId) {
            this._container = document.getElementById(containerId);
        },

        render: function(cards, recentStories, recentSoundscapes, handlers) {
            if (!this._container) return;
            this._container.textContent = '';

            /* ---- PASO 1: tarjetas de métricas ---- */
            var metrics = el('div', 'dashboard-metrics');
            (cards || []).forEach(function(c) {
                var card = el('div', 'metric-card');

                var icon = el('div', 'metric-icon ' + (c.color || 'pink'));
                var i = el('i', 'fa-solid ' + (c.icon || 'fa-chart-simple'));
                icon.appendChild(i);
                card.appendChild(icon);

                var info = el('div', 'metric-info');
                var value = el('h3', '', c.value);
                var label = el('p', '', c.label);
                info.appendChild(value);
                info.appendChild(label);
                if (c.trend) {
                    var trend = el('span', 'trend ' + (c.trendClass || 'neutral'), c.trend);
                    info.appendChild(trend);
                }
                card.appendChild(info);

                metrics.appendChild(card);
            });
            this._container.appendChild(metrics);

            /* ---- PASO 2: rejilla principal ---- */
            var grid = el('div', 'dashboard-grid');

            /* Columna 1: Historias recientes */
            var col1 = el('div', 'dash-col');
            var header1 = el('div', 'col-header');
            header1.appendChild(el('h2', '', 'Historias recientes'));
            var link1 = el('button', 'view-all', 'Ver todas');
            link1.addEventListener('click', handlers.onViewStories || function() {});
            header1.appendChild(link1);
            col1.appendChild(header1);
            col1.appendChild(this._buildStoryList(recentStories));
            grid.appendChild(col1);

            /* Columna 2: Música reciente */
            var col2 = el('div', 'dash-col');
            var header2 = el('div', 'col-header');
            header2.appendChild(el('h2', '', 'Música reciente'));
            var link2 = el('button', 'view-all', 'Ver todas');
            link2.addEventListener('click', handlers.onViewSoundscapes || function() {});
            header2.appendChild(link2);
            col2.appendChild(header2);
            col2.appendChild(this._buildSoundscapeList(recentSoundscapes));
            grid.appendChild(col2);

            /* Columna 3: Acciones rápidas */
            var col3 = el('div', 'dash-col');
            var header3 = el('div', 'col-header');
            header3.appendChild(el('h2', '', 'Acciones rápidas'));
            col3.appendChild(header3);
            col3.appendChild(this._buildActions(handlers));
            grid.appendChild(col3);

            this._container.appendChild(grid);
        },

        _buildStoryList: function(items) {
            var list = el('div', 'dash-list');
            if (!items || !items.length) {
                list.appendChild(el('div', 'dash-empty', 'Aún no hay historias.'));
                return list;
            }
            items.forEach(function(s) {
                var row = el('div', 'dash-list-item');
                var main = el('div', 'dash-item-main');
                main.appendChild(el('div', 'dash-item-title', s.title || '(sin título)'));
                var meta = s.category || '';
                if (meta) main.appendChild(el('div', 'dash-item-meta', meta));
                row.appendChild(main);
                var badge = el('span', 'status-badge ' + (s.status === 'published' ? 'published' : 'draft'),
                    s.status === 'published' ? 'Publicado' : 'Borrador');
                row.appendChild(badge);
                list.appendChild(row);
            });
            return list;
        },

        _buildSoundscapeList: function(items) {
            var list = el('div', 'dash-list');
            if (!items || !items.length) {
                list.appendChild(el('div', 'dash-empty', 'Aún no hay música.'));
                return list;
            }
            items.forEach(function(ss) {
                var row = el('div', 'dash-list-item');
                var main = el('div', 'dash-item-main');
                main.appendChild(el('div', 'dash-item-title', ss.title || '(sin título)'));
                var meta = ss.artist || '';
                if (meta) main.appendChild(el('div', 'dash-item-meta', meta));
                row.appendChild(main);
                var badge = el('span', 'status-badge ' + (ss.published ? 'published' : 'draft'),
                    ss.published ? 'Publicado' : 'Borrador');
                row.appendChild(badge);
                list.appendChild(row);
            });
            return list;
        },

        _buildActions: function(handlers) {
            var wrap = el('div', 'dash-actions');

            var storyBtn = el('button', 'btn-primary', '');
            storyBtn.innerHTML = '<i class="fa-solid fa-plus"></i> Nueva Historia';
            storyBtn.addEventListener('click', handlers.onNewStory || function() {});
            wrap.appendChild(storyBtn);

            var ssBtn = el('button', 'btn-primary', '');
            ssBtn.innerHTML = '<i class="fa-solid fa-plus"></i> Nueva Canción';
            ssBtn.addEventListener('click', handlers.onNewSong || function() {});
            wrap.appendChild(ssBtn);

            var viewBtn = el('button', 'btn-secondary', '');
            viewBtn.innerHTML = '<i class="fa-solid fa-external-link"></i> Ver sitio';
            viewBtn.addEventListener('click', handlers.onViewSite || function() {});
            wrap.appendChild(viewBtn);

            return wrap;
        }
    };
})();
