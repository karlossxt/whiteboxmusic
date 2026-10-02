/* ============================================
   BACKSTAGE STUDIO — Artist View
   Renderiza la seccion de artistas de
   "Descubre" (stats + tabla).
   No conoce servicios ni datos.
   ============================================ */

(function() {
    window.Backstage = window.Backstage || {};
    window.Backstage.Views = window.Backstage.Views || {};

    var T = window.Backstage.Templates;

    function safeImageUrl(url) {
        if (!url || typeof url !== 'string') return '';
        var trimmed = url.trim();
        if (!trimmed) return '';
        var lower = trimmed.toLowerCase();
        if (lower.indexOf('javascript:') === 0) return '';
        if (lower.indexOf('data:text/html') === 0) return '';
        return trimmed;
    }

    var columns = [
        { key: 'image', label: 'Imagen' },
        { key: 'name', label: 'Artista' },
        { key: 'tags', label: 'Tags' },
        { key: 'status', label: 'Estado' },
        { key: 'featured', label: 'Destacado' },
        { key: 'order', label: 'Orden' },
        { key: 'actions', label: 'Acciones' }
    ];

    window.Backstage.Views.Artist = {
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
                { value: stats.total, label: 'Total artistas' },
                { value: stats.published, label: 'Publicados' },
                { value: stats.draft, label: 'Borradores' },
                { value: stats.featured, label: 'Destacados' }
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

            items.forEach(function(artist) {
                var cells = [
                    { value: '', className: 'table-thumb-td' },
                    { value: artist.name || '(sin nombre)', className: 'table-title' },
                    { value: '', className: 'table-category' },
                    { value: '', className: 'table-status-td' },
                    { value: '', className: 'table-featured-td' },
                    { value: artist.order || 1, className: 'table-date' }
                ];

                var tr = T.dataTableRow(cells);

                var thumbTd = tr.children[0];
                thumbTd.textContent = '';
                var thumb = document.createElement('img');
                thumb.className = 'table-thumb';
                thumb.src = safeImageUrl(artist.image);
                thumb.alt = artist.name || '';
                thumb.loading = 'lazy';
                thumb.onerror = function() {
                    thumb.onerror = null;
                    thumb.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="48" height="32" fill="%23222"%3E%3Crect width="48" height="32" rx="3"/%3E%3C/svg%3E';
                };
                thumbTd.appendChild(thumb);

                var tagsTd = tr.children[2];
                tagsTd.textContent = '';
                var tags = artist.tags || [];
                if (tags.length) {
                    var tagWrap = document.createElement('div');
                    tagWrap.className = 'table-tags';
                    tags.forEach(function(tag) {
                        var chip = document.createElement('span');
                        chip.className = 'badge badge-category';
                        chip.textContent = tag;
                        tagWrap.appendChild(chip);
                    });
                    tagsTd.appendChild(tagWrap);
                } else {
                    tagsTd.textContent = '-';
                }

                var statusTd = tr.children[3];
                statusTd.textContent = '';
                var sBadge = document.createElement('span');
                sBadge.className = 'badge ' + (artist.isPublished() ? 'badge-published' : 'badge-draft');
                sBadge.textContent = artist.isPublished() ? 'Publicado' : 'Borrador';
                statusTd.appendChild(sBadge);

                var featTd = tr.children[4];
                featTd.textContent = '';
                if (artist.isFeatured()) {
                    var fBadge = document.createElement('span');
                    fBadge.className = 'badge badge-featured';
                    fBadge.textContent = 'Destacado';
                    featTd.appendChild(fBadge);
                }

                var actionBtns = T.tableActions([
                    {
                        icon: 'fa-pen',
                        title: 'Editar',
                        ariaLabel: 'Editar ' + (artist.name || 'artista'),
                        className: 'edit',
                        onClick: function() { actions.edit(artist.id); }
                    },
                    {
                        icon: artist.isPublished() ? 'fa-eye-slash' : 'fa-eye',
                        title: artist.isPublished() ? 'Despublicar' : 'Publicar',
                        ariaLabel: artist.isPublished() ? 'Despublicar artista' : 'Publicar artista',
                        onClick: function() { actions.togglePublished(artist.id); }
                    },
                    {
                        icon: artist.isFeatured() ? 'fa-star' : 'fa-regular fa-star',
                        title: artist.isFeatured() ? 'Quitar destacado' : 'Destacar',
                        ariaLabel: artist.isFeatured() ? 'Quitar destacado' : 'Destacar artista',
                        className: artist.isFeatured() ? 'featured-active' : '',
                        onClick: function() { actions.toggleFeatured(artist.id); }
                    },
                    {
                        icon: 'fa-copy',
                        title: 'Duplicar',
                        ariaLabel: 'Duplicar artista',
                        className: 'duplicate',
                        onClick: function() { actions.duplicate(artist.id); }
                    },
                    {
                        icon: 'fa-trash',
                        title: 'Eliminar',
                        ariaLabel: 'Eliminar ' + (artist.name || 'artista'),
                        className: 'delete',
                        onClick: function() { actions.remove(artist.id, artist.name); }
                    }
                ]);

                var tdActions = document.createElement('td');
                tdActions.appendChild(actionBtns);
                tr.appendChild(tdActions);

                this._tableBody.appendChild(tr);
            }, this);
        },

        _ensureStructure: function() {
            if (this._statsContainer) return;
            this._section.textContent = '';

            this._statsContainer = document.createElement('div');
            this._section.appendChild(this._statsContainer);

            var tableResult = T.dataTable({
                columns: columns,
                emptyIcon: 'fa-headphones',
                emptyTitle: 'Aun no hay artistas',
                emptyText: 'Agrega tu primer artista para que aparezca en la seccion Descubre.'
            });
            this._tableBody = tableResult.tbody;
            this._emptyEl = tableResult.empty;
            this._section.appendChild(tableResult.wrapper);
            this._section.appendChild(this._emptyEl);
        }
    };
})();
