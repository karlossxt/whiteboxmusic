/* ============================================
   BACKSTAGE STUDIO — Soundscape View
   Renderiza la sección de soundscapes (stats + tabla).
   No conoce servicios, repositories ni localStorage.
   ============================================ */

(function() {
    window.Backstage = window.Backstage || {};
    window.Backstage.Views = window.Backstage.Views || {};

    var T = window.Backstage.Templates;

    var columns = [
        { key: 'order', label: 'Orden' },
        { key: 'cover', label: 'Portada' },
        { key: 'title', label: 'Titulo' },
        { key: 'artist', label: 'Artista' },
        { key: 'playlist', label: 'Playlist' },
        { key: 'duration', label: 'Duracion' },
        { key: 'status', label: 'Estado' },
        { key: 'actions', label: 'Acciones' }
    ];

    function formatDuration(sec) {
        var m = Math.floor(sec / 60);
        var s = Math.floor(sec % 60);
        return m + ':' + (s < 10 ? '0' : '') + s;
    }

    window.Backstage.Views.Soundscape = {
        _section: null,
        _statsContainer: null,
        _tableBody: null,
        _emptyEl: null,

        init: function(sectionId) {
            this._section = document.getElementById(sectionId);
        },

        renderStats: function(stats) {
            this._ensureStructure();
            this._statsContainer.textContent = '';

            var cards = T.statsCards([
                { value: stats.total, label: 'Total canciones' },
                { value: stats.published, label: 'Publicadas' },
                { value: stats.draft, label: 'Borradores' },
                { value: stats.playlists, label: 'Playlists' }
            ]);
            this._statsContainer.appendChild(cards);
        },

        renderTable: function(items, actions) {
            this._ensureStructure();
            this._tableBody.textContent = '';

            if (!items || items.length === 0) {
                this._emptyEl.style.display = 'block';
                return;
            }

            this._emptyEl.style.display = 'none';

            var self = this;
            items.forEach(function(item) {
                var cells = [
                    { value: item.order || '-', className: 'table-order' },
                    { value: '', className: 'table-thumb-td' },
                    { value: item.title || '(sin titulo)', className: 'table-title' },
                    { value: item.artist || '-', className: 'table-author' },
                    { value: item.playlist || '-', className: 'table-location' },
                    { value: item.duration ? formatDuration(item.duration) : '-', className: 'table-location' },
                    { value: '', className: 'table-status-td' }
                ];

                var tr = T.dataTableRow(cells);

                var thumbTd = tr.children[1];
                thumbTd.textContent = '';
                var thumb = document.createElement('img');
                thumb.className = 'table-thumb';
                thumb.src = item.cover || '';
                thumb.alt = item.title || '';
                thumb.loading = 'lazy';
                thumb.onerror = function() {
                    thumb.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="48" height="32" fill="%23222"%3E%3Crect width="48" height="32" rx="3"/%3E%3C/svg%3E';
                };
                thumbTd.appendChild(thumb);

                var statusTd = tr.children[6];
                statusTd.textContent = '';
                var statusBadge = document.createElement('span');
                statusBadge.className = 'badge ' + (item.isPublished() ? 'badge-published' : 'badge-draft');
                statusBadge.textContent = item.isPublished() ? 'Publicada' : 'Borrador';
                statusTd.appendChild(statusBadge);

                var actionBtns = T.tableActions([
                    {
                        icon: item.isPublished() ? 'fa-eye-slash' : 'fa-eye',
                        title: item.isPublished() ? 'Despublicar' : 'Publicar',
                        ariaLabel: item.isPublished() ? 'Despublicar cancion' : 'Publicar cancion',
                        onClick: function() { actions.togglePublished(item.id); }
                    },
                    {
                        icon: 'fa-pen',
                        title: 'Editar',
                        ariaLabel: 'Editar cancion',
                        className: 'edit',
                        onClick: function() { actions.edit(item.id); }
                    },
                    {
                        icon: 'fa-trash',
                        title: 'Eliminar',
                        ariaLabel: 'Eliminar cancion',
                        className: 'delete',
                        onClick: function() { actions.remove(item.id, item.title); }
                    }
                ]);

                var tdActions = document.createElement('td');
                tdActions.appendChild(actionBtns);
                tr.appendChild(tdActions);
                self._tableBody.appendChild(tr);
            });
        },

        _ensureStructure: function() {
            if (this._statsContainer) return;
            this._section.textContent = '';

            this._statsContainer = document.createElement('div');
            this._section.appendChild(this._statsContainer);

            var tableResult = T.dataTable({
                columns: columns,
                emptyIcon: 'fa-headphones',
                emptyTitle: 'No hay canciones',
                emptyText: 'Agrega tu primera cancion para que aparezca en el sitio.'
            });
            this._tableBody = tableResult.tbody;
            this._emptyEl = tableResult.empty;
            this._section.appendChild(tableResult.wrapper);
            this._section.appendChild(this._emptyEl);
        }
    };
})();
