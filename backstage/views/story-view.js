/* ============================================
   BACKSTAGE STUDIO — Story View
   Renderiza la sección de historias (stats + tabla).
   No conoce servicios, repositories ni localStorage.
   ============================================ */

(function() {
    window.Backstage = window.Backstage || {};
    window.Backstage.Views = window.Backstage.Views || {};

    var T = window.Backstage.Templates;

    var columns = [
        { key: 'order', label: 'Orden' },
        { key: 'image', label: 'Imagen' },
        { key: 'title', label: 'Titulo' },
        { key: 'author', label: 'Autor' },
        { key: 'location', label: 'Ubicacion' },
        { key: 'likes', label: 'Likes' },
        { key: 'status', label: 'Estado' },
        { key: 'actions', label: 'Acciones' }
    ];

    window.Backstage.Views.Story = {
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
                { value: stats.total, label: 'Total historias' },
                { value: stats.published, label: 'Publicadas' },
                { value: stats.draft, label: 'Borradores' },
                { value: stats.featured, label: 'Destacadas' }
            ]);
            this._statsContainer.appendChild(cards);
        },

        renderTable: function(stories, actions) {
            this._ensureStructure();
            this._tableBody.textContent = '';

            if (!stories || stories.length === 0) {
                this._emptyEl.style.display = 'block';
                return;
            }

            this._emptyEl.style.display = 'none';

            var self = this;
            stories.forEach(function(story) {
                var cells = [
                    { value: story.order || '-', className: 'table-order' },
                    { value: '', className: 'table-thumb-td' },
                    { value: story.title || '(sin titulo)', className: 'table-title' },
                    { value: story.author || '-', className: 'table-author' },
                    { value: story.location || '-', className: 'table-location' },
                    { value: story.initialLikes || 0, className: 'table-likes' },
                    { value: story.isPublished() ? 'Publicada' : 'Borrador', className: 'table-status-td' }
                ];

                var tr = T.dataTableRow(cells);

                var thumbTd = tr.children[1];
                thumbTd.textContent = '';
                var thumb = document.createElement('img');
                thumb.className = 'table-thumb';
                thumb.src = story.image || '';
                thumb.alt = story.title || '';
                thumb.loading = 'lazy';
                thumb.onerror = function() {
                    thumb.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="48" height="32" fill="%23222"%3E%3Crect width="48" height="32" rx="3"/%3E%3C/svg%3E';
                };
                thumbTd.appendChild(thumb);

                if (story.isFeatured()) {
                    var featBadge = document.createElement('span');
                    featBadge.className = 'badge badge-featured';
                    featBadge.textContent = 'Destacada';
                    tr.children[2].appendChild(featBadge);
                }

                var statusTd = tr.children[6];
                statusTd.textContent = '';
                var statusBadge = document.createElement('span');
                statusBadge.className = 'badge ' + (story.isPublished() ? 'badge-published' : 'badge-draft');
                statusBadge.textContent = story.isPublished() ? 'Publicada' : 'Borrador';
                statusTd.appendChild(statusBadge);

                var actionBtns = T.tableActions([
                    {
                        icon: story.isPublished() ? 'fa-eye-slash' : 'fa-eye',
                        title: story.isPublished() ? 'Despublicar' : 'Publicar',
                        ariaLabel: story.isPublished() ? 'Despublicar historia' : 'Publicar historia',
                        onClick: function() { actions.toggleStatus(story.id); }
                    },
                    {
                        icon: 'fa-pen',
                        title: 'Editar',
                        ariaLabel: 'Editar historia',
                        className: 'edit',
                        onClick: function() { actions.edit(story.id); }
                    },
                    {
                        icon: 'fa-trash',
                        title: 'Eliminar',
                        ariaLabel: 'Eliminar historia',
                        className: 'delete',
                        onClick: function() { actions.remove(story.id, story.title); }
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
                emptyIcon: 'fa-book-open',
                emptyTitle: 'No hay historias',
                emptyText: 'Crea tu primera historia para que aparezca en el sitio.'
            });
            this._tableBody = tableResult.tbody;
            this._emptyEl = tableResult.empty;
            this._section.appendChild(tableResult.wrapper);
            this._section.appendChild(this._emptyEl);
        }
    };
})();
