(function() {
    window.Backstage = window.Backstage || {};
    window.Backstage.Views = window.Backstage.Views || {};

    var T = window.Backstage.Templates;

    var columns = [
        { key: 'order', label: 'Orden' },
        { key: 'image', label: 'Portada' },
        { key: 'title', label: 'Evento' },
        { key: 'subtitle', label: 'Subtítulo' },
        { key: 'photos', label: 'Fotos' },
        { key: 'slider', label: 'Slider' },
        { key: 'updated', label: 'Actualizado' },
        { key: 'actions', label: 'Acciones' }
    ];

    function formatDate(iso) {
        if (!iso) return '-';
        try {
            var d = new Date(iso);
            return d.toLocaleDateString('es-MX', { year: 'numeric', month: 'short', day: 'numeric' });
        } catch(e) { return iso; }
    }

    window.Backstage.Views.Gallery = {
        _section: null,
        _statsContainer: null,
        _tableBody: null,
        _emptyEl: null,
        _tableWrapper: null,

        init: function(sectionId) {
            this._section = document.getElementById(sectionId);
        },

        renderStats: function(stats) {
            this._ensureStructure();
            this._statsContainer.textContent = '';
            var cards = T.statsCards([
                { value: stats.total, label: 'Total eventos' },
                { value: stats.totalGalleryItems, label: 'Fotos en galería' },
                { value: stats.totalSliderImages, label: 'Imágenes slider' },
                { value: stats.withContent, label: 'Con contenido' }
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
            items.sort(function(a, b) { return (a.order || 999) - (b.order || 999); });

            items.forEach(function(item) {
                var cells = [
                    { value: item.order || '-', className: 'table-order' },
                    { value: '', className: 'table-thumb-td' },
                    { value: item.title || '(sin título)', className: 'table-title' },
                    { value: item.subtitle || '-', className: 'table-location' },
                    { value: String(item.galleryItems ? item.galleryItems.length : 0), className: 'table-location' },
                    { value: String(item.sliderImages ? item.sliderImages.length : 0), className: 'table-location' },
                    { value: formatDate(item.updatedAt), className: 'table-date' }
                ];

                var tr = T.dataTableRow(cells);

                var thumbTd = tr.children[1];
                thumbTd.textContent = '';
                var thumb = document.createElement('img');
                thumb.className = 'table-thumb';
                thumb.src = item.cardImage || '';
                thumb.alt = item.title || '';
                thumb.loading = 'lazy';
                thumb.onerror = function() {
                    thumb.onerror = null;
                    thumb.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="48" height="32" fill="%23222"%3E%3Crect width="48" height="32" rx="3"/%3E%3C/svg%3E';
                };
                thumbTd.appendChild(thumb);

                var actionBtns = T.tableActions([
                    {
                        icon: 'fa-eye',
                        title: 'Vista previa',
                        ariaLabel: 'Vista previa del evento',
                        onClick: function() { actions.preview(item.id); }
                    },
                    {
                        icon: 'fa-pen',
                        title: 'Editar',
                        ariaLabel: 'Editar evento',
                        className: 'edit',
                        onClick: function() { actions.edit(item.id); }
                    },
                    {
                        icon: 'fa-trash',
                        title: 'Eliminar',
                        ariaLabel: 'Eliminar evento',
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
                emptyIcon: 'fa-camera',
                emptyTitle: 'No hay eventos',
                emptyText: 'Crea tu primer evento fotográfico para que aparezca en la galería.'
            });
            this._tableBody = tableResult.tbody;
            this._emptyEl = tableResult.empty;
            this._tableWrapper = tableResult.wrapper;
            this._section.appendChild(tableResult.wrapper);
            this._section.appendChild(this._emptyEl);
        }
    };
})();
