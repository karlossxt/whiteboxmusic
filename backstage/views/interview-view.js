/* ============================================
   BACKSTAGE STUDIO — Interview View
   Renderiza la seccion de entrevistas (stats + tabla).
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
        { key: 'cover', label: 'Portada' },
        { key: 'title', label: 'Titulo' },
        { key: 'category', label: 'Categoria' },
        { key: 'status', label: 'Estado' },
        { key: 'featured', label: 'Destacada' },
        { key: 'author', label: 'Autor' },
        { key: 'publishDate', label: 'Fecha pub.' },
        { key: 'actions', label: 'Acciones' }
    ];

    window.Backstage.Views.Interview = {
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
                { value: stats.total, label: 'Total entrevistas' },
                { value: stats.published, label: 'Publicadas' },
                { value: stats.draft, label: 'Borradores' },
                { value: stats.featured, label: 'Destacadas' }
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
            items.forEach(function(iv) {
                var cells = [
                    { value: '', className: 'table-thumb-td' },
                    { value: iv.title || '(sin titulo)', className: 'table-title' },
                    { value: iv.category || '-', className: 'table-category' },
                    { value: '', className: 'table-status-td' },
                    { value: '', className: 'table-featured-td' },
                    { value: iv.author || '-', className: 'table-author' },
                    { value: iv.publishDate || '-', className: 'table-date' }
                ];

                var tr = T.dataTableRow(cells);

                var thumbTd = tr.children[0];
                thumbTd.textContent = '';
                var thumb = document.createElement('img');
                thumb.className = 'table-thumb';
                thumb.src = safeImageUrl(iv.cover);
                thumb.alt = iv.title || '';
                thumb.loading = 'lazy';
                thumb.onerror = function() {
                    thumb.onerror = null;
                    thumb.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="48" height="32" fill="%23222"%3E%3Crect width="48" height="32" rx="3"/%3E%3C/svg%3E';
                };
                thumbTd.appendChild(thumb);

                var catTd = tr.children[2];
                catTd.textContent = '';
                if (iv.category) {
                    var catBadge = document.createElement('span');
                    catBadge.className = 'badge badge-category';
                    catBadge.textContent = iv.category;
                    catTd.appendChild(catBadge);
                }

                var statusTd = tr.children[3];
                statusTd.textContent = '';
                var sBadge = document.createElement('span');
                sBadge.className = 'badge ' + (iv.isPublished() ? 'badge-published' : 'badge-draft');
                sBadge.textContent = iv.isPublished() ? 'Publicada' : 'Borrador';
                statusTd.appendChild(sBadge);

                var featTd = tr.children[4];
                featTd.textContent = '';
                if (iv.isFeatured()) {
                    var fBadge = document.createElement('span');
                    fBadge.className = 'badge badge-featured';
                    fBadge.textContent = 'Destacada';
                    featTd.appendChild(fBadge);
                }

                var actionBtns = T.tableActions([
                    {
                        icon: 'fa-eye',
                        title: 'Vista previa',
                        ariaLabel: 'Ver vista previa',
                        onClick: function() { actions.preview(iv.id); }
                    },
                    {
                        icon: 'fa-pen',
                        title: 'Editar',
                        ariaLabel: 'Editar entrevista',
                        className: 'edit',
                        onClick: function() { actions.edit(iv.id); }
                    },
                    {
                        icon: iv.isPublished() ? 'fa-eye-slash' : 'fa-eye',
                        title: iv.isPublished() ? 'Despublicar' : 'Publicar',
                        ariaLabel: iv.isPublished() ? 'Despublicar entrevista' : 'Publicar entrevista',
                        onClick: function() { actions.togglePublished(iv.id); }
                    },
                    {
                        icon: iv.isFeatured() ? 'fa-star' : 'fa-regular fa-star',
                        title: iv.isFeatured() ? 'Quitar destacado' : 'Destacar',
                        ariaLabel: iv.isFeatured() ? 'Quitar destacado' : 'Destacar entrevista',
                        className: iv.isFeatured() ? 'featured-active' : '',
                        onClick: function() { actions.toggleFeatured(iv.id); }
                    },
                    {
                        icon: 'fa-copy',
                        title: 'Duplicar',
                        ariaLabel: 'Duplicar entrevista',
                        className: 'duplicate',
                        onClick: function() { actions.duplicate(iv.id); }
                    },
                    {
                        icon: 'fa-trash',
                        title: 'Eliminar',
                        ariaLabel: 'Eliminar entrevista',
                        className: 'delete',
                        onClick: function() { actions.remove(iv.id, iv.title); }
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
                emptyIcon: 'fa-microphone',
                emptyTitle: 'Aun no hay entrevistas',
                emptyText: 'Crea tu primera entrevista para que aparezca en el sitio.'
            });
            this._tableBody = tableResult.tbody;
            this._emptyEl = tableResult.empty;
            this._section.appendChild(tableResult.wrapper);
            this._section.appendChild(this._emptyEl);
        }
    };
})();
