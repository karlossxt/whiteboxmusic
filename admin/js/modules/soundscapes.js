/* Soundscapes Module - CRUD UI */
(function() {
    window.WBAdmin = window.WBAdmin || {};

    var section = null;
    var tableBody = null;
    var emptyState = null;
    var service = window.WBAdmin.soundscapesService;
    var eventsBound = false;

    function formatDuration(sec) {
        var m = Math.floor(sec / 60);
        var s = Math.floor(sec % 60);
        return m + ':' + (s < 10 ? '0' : '') + s;
    }

    function updateStats() {
        var stats = service.getStats();
        var el;
        el = document.getElementById('ssStatTotal');
        if (el) el.textContent = stats.total;
        el = document.getElementById('ssStatPublished');
        if (el) el.textContent = stats.published;
        el = document.getElementById('ssStatDraft');
        if (el) el.textContent = stats.draft;
        el = document.getElementById('ssStatPlaylists');
        if (el) el.textContent = stats.playlists;
    }

    function showAddButton(show) {
        var btn = document.getElementById('btnAddSoundscape');
        if (btn) btn.style.display = show ? '' : 'none';
    }

    function renderTable(items) {
        items = items || service.getAll();
        items.sort(function(a, b) { return (a.order || 999) - (b.order || 999); });

        tableBody.textContent = '';
        updateStats();

        if (items.length === 0) {
            emptyState.style.display = 'block';
            return;
        }

        emptyState.style.display = 'none';

        items.forEach(function(item) {
            var tr = document.createElement('tr');

            var tdOrder = document.createElement('td');
            tdOrder.className = 'table-order';
            tdOrder.textContent = item.order || '-';
            tr.appendChild(tdOrder);

            var tdCover = document.createElement('td');
            var cover = document.createElement('img');
            cover.className = 'table-thumb';
            cover.src = item.cover || '';
            cover.alt = item.title || '';
            cover.loading = 'lazy';
            cover.onerror = function() {
                cover.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="48" height="32" fill="%23222"%3E%3Crect width="48" height="32" rx="3"/%3E%3C/svg%3E';
            };
            tdCover.appendChild(cover);
            tr.appendChild(tdCover);

            var tdTitle = document.createElement('td');
            var titleSpan = document.createElement('span');
            titleSpan.className = 'table-title';
            titleSpan.textContent = item.title || '(sin titulo)';
            tdTitle.appendChild(titleSpan);
            tr.appendChild(tdTitle);

            var tdArtist = document.createElement('td');
            tdArtist.className = 'table-author';
            tdArtist.textContent = item.artist || '-';
            tr.appendChild(tdArtist);

            var tdPlaylist = document.createElement('td');
            tdPlaylist.className = 'table-location';
            tdPlaylist.textContent = item.playlist || '-';
            tr.appendChild(tdPlaylist);

            var tdDuration = document.createElement('td');
            tdDuration.className = 'table-location';
            tdDuration.textContent = item.duration ? formatDuration(item.duration) : '-';
            tr.appendChild(tdDuration);

            var tdStatus = document.createElement('td');
            var statusBadge = document.createElement('span');
            statusBadge.className = 'badge ' + (item.published === true ? 'badge-published' : 'badge-draft');
            statusBadge.textContent = item.published === true ? 'Publicada' : 'Borrador';
            tdStatus.appendChild(statusBadge);
            tr.appendChild(tdStatus);

            var tdActions = document.createElement('td');
            var actionsDiv = document.createElement('div');
            actionsDiv.className = 'table-actions';

            var toggleBtn = document.createElement('button');
            toggleBtn.className = 'btn-icon';
            toggleBtn.title = item.published === true ? 'Despublicar' : 'Publicar';
            toggleBtn.setAttribute('aria-label', toggleBtn.title);
            var toggleIcon = document.createElement('i');
            toggleIcon.className = item.published === true ? 'fa-solid fa-eye-slash' : 'fa-solid fa-eye';
            toggleBtn.appendChild(toggleIcon);
            toggleBtn.addEventListener('click', (function(id) {
                return function() {
                    service.togglePublished(id);
                    renderTable();
                    window.WBAdmin.dashboard.refresh();
                    window.WBAdmin.toast.show('Estado actualizado', 'success');
                };
            })(item.id));
            actionsDiv.appendChild(toggleBtn);

            var editBtn = document.createElement('button');
            editBtn.className = 'btn-icon edit';
            editBtn.title = 'Editar';
            editBtn.setAttribute('aria-label', 'Editar cancion');
            var editIcon = document.createElement('i');
            editIcon.className = 'fa-solid fa-pen';
            editBtn.appendChild(editIcon);
            editBtn.addEventListener('click', (function(id) {
                return function() { openEditModal(id); };
            })(item.id));
            actionsDiv.appendChild(editBtn);

            var deleteBtn = document.createElement('button');
            deleteBtn.className = 'btn-icon delete';
            deleteBtn.title = 'Eliminar';
            deleteBtn.setAttribute('aria-label', 'Eliminar cancion');
            var deleteIcon = document.createElement('i');
            deleteIcon.className = 'fa-solid fa-trash';
            deleteBtn.appendChild(deleteIcon);
            deleteBtn.addEventListener('click', (function(id, title) {
                return function() { openConfirmModal(id, title); };
            })(item.id, item.title));
            actionsDiv.appendChild(deleteBtn);

            tdActions.appendChild(actionsDiv);
            tr.appendChild(tdActions);

            tableBody.appendChild(tr);
        });
    }

    function openAddModal() {
        var modal = document.getElementById('soundscapeModal');
        document.getElementById('ssModalTitle').textContent = 'Nueva Cancion';
        document.getElementById('soundscapeForm').reset();
        document.getElementById('ssFormId').value = '';
        document.getElementById('ssFormDuration').value = '180';
        document.getElementById('ssFormPublished').value = 'true';
        document.getElementById('ssFormOrder').value = String(service.getMaxOrder() + 1);
        window.WBAdmin.modal.open(modal);
    }

    function openEditModal(itemId) {
        var item = service.getById(itemId);
        if (!item) return;

        var modal = document.getElementById('soundscapeModal');
        document.getElementById('ssModalTitle').textContent = 'Editar Cancion';
        document.getElementById('ssFormId').value = item.id;
        document.getElementById('ssFormTitle').value = item.title || '';
        document.getElementById('ssFormArtist').value = item.artist || '';
        document.getElementById('ssFormPlaylist').value = item.playlist || '';
        document.getElementById('ssFormCover').value = item.cover || '';
        document.getElementById('ssFormSpotifyUrl').value = item.spotifyUrl || '';
        document.getElementById('ssFormDuration').value = String(item.duration || 180);
        document.getElementById('ssFormOrder').value = String(item.order || 1);
        document.getElementById('ssFormPublished').value = item.published === true ? 'true' : 'false';
        window.WBAdmin.modal.open(modal);
    }

    function openConfirmModal(itemId, title) {
        var text = title
            ? 'Se eliminara la cancion "' + title + '". Esta accion no se puede deshacer.'
            : 'Esta accion no se puede deshacer.';

        window.WBAdmin.confirm.show('Eliminar cancion', text, function() {
            service.remove(itemId);
            renderTable();
            window.WBAdmin.dashboard.refresh();
            window.WBAdmin.toast.show('Cancion eliminada', 'success');
        });
    }

    function setupForm() {
        if (eventsBound) return;

        document.getElementById('soundscapeForm').addEventListener('submit', function(e) {
            e.preventDefault();

            var titleVal = document.getElementById('ssFormTitle').value.trim();
            var artistVal = document.getElementById('ssFormArtist').value.trim();

            if (!titleVal || !artistVal) {
                window.WBAdmin.toast.show('Completa los campos obligatorios.', 'error');
                return;
            }

            var existingId = document.getElementById('ssFormId').value;

            var data = {
                title: titleVal,
                artist: artistVal,
                playlist: document.getElementById('ssFormPlaylist').value.trim(),
                cover: document.getElementById('ssFormCover').value.trim() || 'https://placehold.co/400x400/1a1a1a/ffffff?text=Album',
                spotifyUrl: document.getElementById('ssFormSpotifyUrl').value.trim(),
                duration: parseInt(document.getElementById('ssFormDuration').value, 10) || 180,
                order: parseInt(document.getElementById('ssFormOrder').value, 10) || 1,
                published: document.getElementById('ssFormPublished').value === 'true'
            };

            if (existingId) {
                service.update(existingId, data);
                window.WBAdmin.toast.show('Cancion actualizada', 'success');
            } else {
                service.create(data);
                window.WBAdmin.toast.show('Cancion creada', 'success');
            }

            renderTable();
            window.WBAdmin.dashboard.refresh();
            window.WBAdmin.modal.closeAll();
        });

        document.getElementById('btnAddSoundscape').addEventListener('click', openAddModal);
        document.getElementById('ssModalClose').addEventListener('click', function() {
            window.WBAdmin.modal.closeAll();
        });
        document.getElementById('ssBtnCancel').addEventListener('click', function() {
            window.WBAdmin.modal.closeAll();
        });

        document.getElementById('soundscapeModal').addEventListener('click', function(e) {
            if (e.target === document.getElementById('soundscapeModal')) window.WBAdmin.modal.closeAll();
        });

        eventsBound = true;
    }

    window.WBAdmin.soundscapes = {
        mount: function(el) {
            section = el;
            tableBody = document.getElementById('soundscapesTableBody');
            emptyState = document.getElementById('soundscapesEmptyState');
            setupForm();
            renderTable();
            showAddButton(true);
        },
        unmount: function() {
            showAddButton(false);
        },
        refresh: function() {
            if (tableBody) renderTable();
        },
        openAdd: openAddModal
    };
})();
