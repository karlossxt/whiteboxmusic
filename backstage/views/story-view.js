/* ============================================
   BACKSTAGE STUDIO — Story View
   Renderiza la seccion de historias.
   No conoce servicios ni localStorage.
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
        { key: 'image', label: 'Miniatura' },
        { key: 'title', label: 'Titulo' },
        { key: 'category', label: 'Categoria' },
        { key: 'status', label: 'Estado' },
        { key: 'featured', label: 'Destacada' },
        { key: 'author', label: 'Autor' },
        { key: 'updatedAt', label: 'Ultima mod.' },
        { key: 'actions', label: 'Acciones' }
    ];

    window.Backstage.Views.Story = {
        _section: null,
        _statsContainer: null,
        _filterBar: null,
        _tableBody: null,
        _emptyEl: null,
        _mobileGrid: null,
        _tableWrapper: null,

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

        renderFilterBar: function(callbacks, savedFilters) {
            if (!this._filterBar) return;
            this._filterBar.textContent = '';

            var bar = document.createElement('div');
            bar.className = 'filter-bar';

            var searchWrap = document.createElement('div');
            searchWrap.className = 'filter-search';
            var searchIcon = document.createElement('i');
            searchIcon.className = 'fa-solid fa-magnifying-glass';
            searchWrap.appendChild(searchIcon);
            var searchInput = document.createElement('input');
            searchInput.type = 'text';
            searchInput.placeholder = 'Buscar por titulo, autor, resumen...';
            searchInput.id = 'filterSearch';
            searchInput.setAttribute('aria-label', 'Buscar historias');
            if (savedFilters && savedFilters.search) searchInput.value = savedFilters.search;
            searchWrap.appendChild(searchInput);
            bar.appendChild(searchWrap);

            var statusSelect = document.createElement('select');
            statusSelect.id = 'filterStatus';
            statusSelect.setAttribute('aria-label', 'Filtrar por estado');
            [{v:'all',t:'Todos'},{v:'published',t:'Publicadas'},{v:'draft',t:'Borradores'},{v:'featured',t:'Destacadas'}].forEach(function(o) {
                var opt = document.createElement('option');
                opt.value = o.v; opt.textContent = o.t;
                statusSelect.appendChild(opt);
            });
            if (savedFilters && savedFilters.status) statusSelect.value = savedFilters.status;
            bar.appendChild(statusSelect);

            var catSelect = document.createElement('select');
            catSelect.id = 'filterCategory';
            catSelect.setAttribute('aria-label', 'Filtrar por categoria');
            [{v:'all',t:'Todas'},{v:'Rock',t:'Rock'},{v:'Metal',t:'Metal'},{v:'Indie',t:'Indie'},{v:'Pop',t:'Pop'},{v:'Jazz',t:'Jazz'},{v:'Otro',t:'Otro'}].forEach(function(o) {
                var opt = document.createElement('option');
                opt.value = o.v; opt.textContent = o.t;
                catSelect.appendChild(opt);
            });
            if (savedFilters && savedFilters.category) catSelect.value = savedFilters.category;
            bar.appendChild(catSelect);

            var sortSelect = document.createElement('select');
            sortSelect.id = 'filterSort';
            sortSelect.setAttribute('aria-label', 'Ordenar por');
            [{v:'newest',t:'Mas recientes'},{v:'oldest',t:'Mas antiguas'},{v:'title-az',t:'Titulo A-Z'},{v:'title-za',t:'Titulo Z-A'}].forEach(function(o) {
                var opt = document.createElement('option');
                opt.value = o.v; opt.textContent = o.t;
                sortSelect.appendChild(opt);
            });
            if (savedFilters && savedFilters.sort) sortSelect.value = savedFilters.sort;
            bar.appendChild(sortSelect);

            this._filterBar.appendChild(bar);

            if (callbacks) {
                var debounceTimer = null;
                searchInput.addEventListener('input', function() {
                    clearTimeout(debounceTimer);
                    debounceTimer = setTimeout(function() {
                        if (callbacks.onSearch) callbacks.onSearch(searchInput.value);
                    }, 250);
                });
                statusSelect.addEventListener('change', function() {
                    if (callbacks.onFilter) callbacks.onFilter();
                });
                catSelect.addEventListener('change', function() {
                    if (callbacks.onFilter) callbacks.onFilter();
                });
                sortSelect.addEventListener('change', function() {
                    if (callbacks.onSort) callbacks.onSort();
                });
            }
        },

        getFilters: function() {
            return {
                search: (document.getElementById('filterSearch') || {}).value || '',
                status: (document.getElementById('filterStatus') || {}).value || 'all',
                category: (document.getElementById('filterCategory') || {}).value || 'all',
                sort: (document.getElementById('filterSort') || {}).value || 'newest'
            };
        },

        renderTable: function(stories, actions, isFiltered) {
            this._ensureStructure();
            this._tableBody.textContent = '';
            if (this._mobileGrid) this._mobileGrid.textContent = '';

            if (!stories || stories.length === 0) {
                this._emptyEl.style.display = 'block';
                var emptyIcon = this._emptyEl.querySelector('i');
                var emptyH3 = this._emptyEl.querySelector('h3');
                var emptyP = this._emptyEl.querySelector('p');
                if (isFiltered) {
                    if (emptyIcon) emptyIcon.className = 'fa-solid fa-magnifying-glass';
                    if (emptyH3) emptyH3.textContent = 'Sin resultados';
                    if (emptyP) emptyP.textContent = 'No se encontraron historias que coincidan con tu busqueda.';
                } else {
                    if (emptyIcon) emptyIcon.className = 'fa-solid fa-book-open';
                    if (emptyH3) emptyH3.textContent = 'Aun no hay historias';
                    if (emptyP) emptyP.textContent = 'Crea tu primera historia para que aparezca en el sitio.';
                }
                if (this._tableWrapper) this._tableWrapper.style.display = 'none';
                if (this._mobileGrid) this._mobileGrid.style.display = 'none';
                return;
            }

            this._emptyEl.style.display = 'none';
            if (this._tableWrapper) this._tableWrapper.style.display = '';
            if (this._mobileGrid) this._mobileGrid.style.display = '';

            var self = this;

            stories.forEach(function(story) {
                var statusLabel = story.isDraft() ? 'Borrador' : 'Publicada';
                var statusClass = story.isDraft() ? 'badge-draft' : 'badge-published';
                var cells = [
                    { value: '', className: 'table-thumb-td' },
                    { value: story.title || '(sin titulo)', className: 'table-title' },
                    { value: story.category || '-', className: 'table-category' },
                    { value: statusLabel, className: 'table-status-td' },
                    { value: story.isFeatured() ? 'Si' : 'No', className: 'table-featured-td' },
                    { value: story.author || '-', className: 'table-author' },
                    { value: story.formatUpdatedAt(), className: 'table-date' }
                ];

                var tr = T.dataTableRow(cells);

                var thumbTd = tr.children[0];
                thumbTd.textContent = '';
                var thumb = document.createElement('img');
                thumb.className = 'table-thumb';
                thumb.src = safeImageUrl(story.image);
                thumb.alt = story.title || '';
                thumb.loading = 'lazy';
                thumb.onerror = function() {
                    thumb.onerror = null;
                    thumb.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="48" height="32" fill="%23222"%3E%3Crect width="48" height="32" rx="3"/%3E%3C/svg%3E';
                };
                thumbTd.appendChild(thumb);

                var catTd = tr.children[2];
                catTd.textContent = '';
                if (story.category) {
                    var catBadge = document.createElement('span');
                    catBadge.className = 'badge badge-category';
                    catBadge.textContent = story.category;
                    catTd.appendChild(catBadge);
                }

                var statusTd = tr.children[3];
                statusTd.textContent = '';
                var sBadge = document.createElement('span');
                sBadge.className = 'badge ' + statusClass;
                sBadge.textContent = statusLabel;
                statusTd.appendChild(sBadge);

                var featTd = tr.children[4];
                featTd.textContent = '';
                if (story.isFeatured()) {
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
                        onClick: function() { actions.preview(story.id); }
                    },
                    {
                        icon: 'fa-pen',
                        title: 'Editar',
                        ariaLabel: 'Editar historia',
                        className: 'edit',
                        onClick: function() { actions.edit(story.id); }
                    },
                    {
                        icon: story.isFeatured() ? 'fa-star' : 'fa-regular fa-star',
                        title: story.isFeatured() ? 'Quitar destacado' : 'Destacar',
                        ariaLabel: story.isFeatured() ? 'Quitar destacado' : 'Destacar historia',
                        className: story.isFeatured() ? 'featured-active' : '',
                        onClick: function() { actions.toggleFeatured(story.id); }
                    },
                    {
                        icon: 'fa-copy',
                        title: 'Duplicar',
                        ariaLabel: 'Duplicar historia',
                        className: 'duplicate',
                        onClick: function() { actions.duplicate(story.id); }
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

                if (self._mobileGrid) {
                    self._mobileGrid.appendChild(self._buildMobileCard(story, actions));
                }
            });
        },

        _buildMobileCard: function(story, actions) {
            var card = document.createElement('div');
            card.className = 'mobile-story-card';

            var statusLabel = story.isDraft() ? 'Borrador' : 'Publicada';
            var statusClass = story.isDraft() ? 'badge-draft' : 'badge-published';

            var imgDiv = document.createElement('div');
            imgDiv.className = 'mobile-card-img';
            var img = document.createElement('img');
            img.src = safeImageUrl(story.image);
            img.alt = story.title || '';
            img.onerror = function() {
                img.onerror = null;
                img.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="200" height="120" fill="%23222"%3E%3Crect width="200" height="120" rx="4"/%3E%3C/svg%3E';
            };
            imgDiv.appendChild(img);

            var body = document.createElement('div');
            body.className = 'mobile-card-body';

            var topRow = document.createElement('div');
            topRow.className = 'mobile-card-badges';
            var sBadge = document.createElement('span');
            sBadge.className = 'badge ' + statusClass;
            sBadge.textContent = statusLabel;
            topRow.appendChild(sBadge);
            if (story.category) {
                var cBadge = document.createElement('span');
                cBadge.className = 'badge badge-category';
                cBadge.textContent = story.category;
                topRow.appendChild(cBadge);
            }
            if (story.isFeatured()) {
                var fBadge = document.createElement('span');
                fBadge.className = 'badge badge-featured';
                fBadge.textContent = 'Destacada';
                topRow.appendChild(fBadge);
            }
            body.appendChild(topRow);

            var title = document.createElement('h4');
            title.className = 'mobile-card-title';
            title.textContent = story.title || '(sin titulo)';
            body.appendChild(title);

            var meta = document.createElement('div');
            meta.className = 'mobile-card-meta';
            var authorSpan = document.createElement('span');
            authorSpan.textContent = story.author || '-';
            meta.appendChild(authorSpan);
            var dateSpan = document.createElement('span');
            dateSpan.textContent = story.formatUpdatedAt();
            meta.appendChild(dateSpan);
            body.appendChild(meta);

            var actionsDiv = document.createElement('div');
            actionsDiv.className = 'mobile-card-actions';

            var btnPreview = document.createElement('button');
            btnPreview.className = 'btn-icon';
            btnPreview.title = 'Vista previa';
            btnPreview.setAttribute('aria-label', 'Ver vista previa');
            btnPreview.innerHTML = '<i class="fa-solid fa-eye"></i>';
            btnPreview.addEventListener('click', function() { actions.preview(story.id); });
            actionsDiv.appendChild(btnPreview);

            var btnEdit = document.createElement('button');
            btnEdit.className = 'btn-icon edit';
            btnEdit.title = 'Editar';
            btnEdit.setAttribute('aria-label', 'Editar historia');
            btnEdit.innerHTML = '<i class="fa-solid fa-pen"></i>';
            btnEdit.addEventListener('click', function() { actions.edit(story.id); });
            actionsDiv.appendChild(btnEdit);

            var btnFav = document.createElement('button');
            btnFav.className = 'btn-icon' + (story.isFeatured() ? ' featured-active' : '');
            btnFav.title = story.isFeatured() ? 'Quitar destacado' : 'Destacar';
            btnFav.setAttribute('aria-label', btnFav.title);
            btnFav.innerHTML = '<i class="fa-solid fa-star"></i>';
            btnFav.addEventListener('click', function() { actions.toggleFeatured(story.id); });
            actionsDiv.appendChild(btnFav);

            var btnDup = document.createElement('button');
            btnDup.className = 'btn-icon duplicate';
            btnDup.title = 'Duplicar';
            btnDup.setAttribute('aria-label', 'Duplicar historia');
            btnDup.innerHTML = '<i class="fa-solid fa-copy"></i>';
            btnDup.addEventListener('click', function() { actions.duplicate(story.id); });
            actionsDiv.appendChild(btnDup);

            var btnDel = document.createElement('button');
            btnDel.className = 'btn-icon delete';
            btnDel.title = 'Eliminar';
            btnDel.setAttribute('aria-label', 'Eliminar historia');
            btnDel.innerHTML = '<i class="fa-solid fa-trash"></i>';
            btnDel.addEventListener('click', function() { actions.remove(story.id, story.title); });
            actionsDiv.appendChild(btnDel);

            body.appendChild(actionsDiv);
            card.appendChild(body);
            return card;
        },

        _ensureStructure: function() {
            if (this._statsContainer) return;

            var migrationBanner = document.getElementById('migrationBanner');
            this._section.textContent = '';
            if (migrationBanner) {
                this._section.appendChild(migrationBanner);
            }

            this._statsContainer = document.createElement('div');
            this._section.appendChild(this._statsContainer);

            this._filterBar = document.createElement('div');
            this._filterBar.className = 'filter-bar-container';
            this._section.appendChild(this._filterBar);

            var tableResult = T.dataTable({
                columns: columns,
                emptyIcon: 'fa-book-open',
                emptyTitle: 'Aun no hay historias',
                emptyText: 'Crea tu primera historia para que aparezca en el sitio.'
            });
            this._tableBody = tableResult.tbody;
            this._emptyEl = tableResult.empty;
            this._tableWrapper = tableResult.wrapper;
            this._section.appendChild(tableResult.wrapper);
            this._section.appendChild(this._emptyEl);

            this._mobileGrid = document.createElement('div');
            this._mobileGrid.className = 'mobile-stories-grid';
            this._section.appendChild(this._mobileGrid);
        }
    };
})();
