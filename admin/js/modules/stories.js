/* Stories Module - CRUD UI */
(function() {
    window.WBAdmin = window.WBAdmin || {};

    var section = null;
    var tableBody = null;
    var emptyState = null;
    var service = window.WBAdmin.storiesService;
    var eventsBound = false;

    function updateStats() {
        var stats = service.getStats();
        var el = document.getElementById('statTotal');
        if (el) el.textContent = stats.total;
        el = document.getElementById('statPublished');
        if (el) el.textContent = stats.published;
        el = document.getElementById('statDraft');
        if (el) el.textContent = stats.draft;
        el = document.getElementById('statFeatured');
        if (el) el.textContent = stats.featured;
    }

    function showAddButton(show) {
        var btn = document.getElementById('btnAddStory');
        if (btn) btn.style.display = show ? '' : 'none';
    }

    function renderTable(stories) {
        stories = stories || service.getAll();
        stories.sort(function(a, b) { return (a.order || 999) - (b.order || 999); });

        tableBody.textContent = '';
        updateStats();

        if (stories.length === 0) {
            emptyState.style.display = 'block';
            return;
        }

        emptyState.style.display = 'none';

        stories.forEach(function(story) {
            var tr = document.createElement('tr');

            var tdOrder = document.createElement('td');
            tdOrder.className = 'table-order';
            tdOrder.textContent = story.order || '-';
            tr.appendChild(tdOrder);

            var tdThumb = document.createElement('td');
            var thumb = document.createElement('img');
            thumb.className = 'table-thumb';
            thumb.src = story.image || '';
            thumb.alt = story.title || '';
            thumb.loading = 'lazy';
            thumb.onerror = function() {
                thumb.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="48" height="32" fill="%23222"%3E%3Crect width="48" height="32" rx="3"/%3E%3C/svg%3E';
            };
            tdThumb.appendChild(thumb);
            tr.appendChild(tdThumb);

            var tdTitle = document.createElement('td');
            var titleSpan = document.createElement('span');
            titleSpan.className = 'table-title';
            titleSpan.textContent = story.title || '(sin titulo)';
            tdTitle.appendChild(titleSpan);
            if (story.featured === true || story.featured === 'true') {
                var featBadge = document.createElement('span');
                featBadge.className = 'badge badge-featured';
                featBadge.textContent = 'Destacada';
                tdTitle.appendChild(featBadge);
            }
            tr.appendChild(tdTitle);

            var tdAuthor = document.createElement('td');
            tdAuthor.className = 'table-author';
            tdAuthor.textContent = story.author || '-';
            tr.appendChild(tdAuthor);

            var tdLocation = document.createElement('td');
            tdLocation.className = 'table-location';
            tdLocation.textContent = story.location || '-';
            tr.appendChild(tdLocation);

            var tdLikes = document.createElement('td');
            tdLikes.className = 'table-likes';
            tdLikes.textContent = story.initialLikes || 0;
            tr.appendChild(tdLikes);

            var tdStatus = document.createElement('td');
            var statusBadge = document.createElement('span');
            statusBadge.className = 'badge ' + (story.status === 'published' ? 'badge-published' : 'badge-draft');
            statusBadge.textContent = story.status === 'published' ? 'Publicada' : 'Borrador';
            tdStatus.appendChild(statusBadge);
            tr.appendChild(tdStatus);

            var tdActions = document.createElement('td');
            var actionsDiv = document.createElement('div');
            actionsDiv.className = 'table-actions';

            var toggleStatusBtn = document.createElement('button');
            toggleStatusBtn.className = 'btn-icon';
            toggleStatusBtn.title = story.status === 'published' ? 'Despublicar' : 'Publicar';
            toggleStatusBtn.setAttribute('aria-label', toggleStatusBtn.title);
            var statusIcon = document.createElement('i');
            statusIcon.className = story.status === 'published' ? 'fa-solid fa-eye-slash' : 'fa-solid fa-eye';
            toggleStatusBtn.appendChild(statusIcon);
            toggleStatusBtn.addEventListener('click', function() {
                service.toggleStatus(story.id);
                renderTable();
                window.WBAdmin.dashboard.refresh();
                window.WBAdmin.toast.show(story.status === 'published' ? 'Historia despublicada' : 'Historia publicada', 'success');
            });
            actionsDiv.appendChild(toggleStatusBtn);

            var editBtn = document.createElement('button');
            editBtn.className = 'btn-icon edit';
            editBtn.title = 'Editar';
            editBtn.setAttribute('aria-label', 'Editar historia');
            var editIcon = document.createElement('i');
            editIcon.className = 'fa-solid fa-pen';
            editBtn.appendChild(editIcon);
            editBtn.addEventListener('click', function() { openEditModal(story.id); });
            actionsDiv.appendChild(editBtn);

            var deleteBtn = document.createElement('button');
            deleteBtn.className = 'btn-icon delete';
            deleteBtn.title = 'Eliminar';
            deleteBtn.setAttribute('aria-label', 'Eliminar historia');
            var deleteIcon = document.createElement('i');
            deleteIcon.className = 'fa-solid fa-trash';
            deleteBtn.appendChild(deleteIcon);
            deleteBtn.addEventListener('click', function() { openConfirmModal(story.id); });
            actionsDiv.appendChild(deleteBtn);

            tdActions.appendChild(actionsDiv);
            tr.appendChild(tdActions);

            tableBody.appendChild(tr);
        });
    }

    function openAddModal() {
        var storyModal = document.getElementById('storyModal');
        var modalTitle = document.getElementById('modalTitle');
        var storyForm = document.getElementById('storyForm');
        var formId = document.getElementById('formId');
        var formInitialLikes = document.getElementById('formInitialLikes');
        var formStatus = document.getElementById('formStatus');
        var formFeatured = document.getElementById('formFeatured');
        var formOrder = document.getElementById('formOrder');

        modalTitle.textContent = 'Nueva Historia';
        storyForm.reset();
        formId.value = '';
        formInitialLikes.value = '0';
        formStatus.value = 'published';
        formFeatured.value = 'false';
        formOrder.value = String(service.getMaxOrder() + 1);
        window.WBAdmin.modal.open(storyModal);
    }

    function openEditModal(storyId) {
        var story = service.getById(storyId);
        if (!story) return;

        var storyModal = document.getElementById('storyModal');
        var modalTitle = document.getElementById('modalTitle');

        modalTitle.textContent = 'Editar Historia';
        document.getElementById('formId').value = story.id;
        document.getElementById('formTitle').value = story.title || '';
        document.getElementById('formAuthor').value = story.author || '';
        document.getElementById('formLocation').value = story.location || '';
        document.getElementById('formImage').value = story.image || '';
        document.getElementById('formDate').value = story.date || '';
        document.getElementById('formRelatedSong').value = story.relatedSong || '';
        document.getElementById('formInitialLikes').value = String(story.initialLikes || 0);
        document.getElementById('formOrder').value = String(story.order || 1);
        document.getElementById('formExcerpt').value = story.excerpt || '';
        document.getElementById('formContent').value = story.content || '';
        document.getElementById('formStatus').value = story.status || 'published';
        document.getElementById('formFeatured').value = story.featured ? 'true' : 'false';
        window.WBAdmin.modal.open(storyModal);
    }

    function openConfirmModal(storyId) {
        var story = service.getById(storyId);
        var text = story
            ? 'Se eliminara la historia "' + story.title + '". Esta accion no se puede deshacer.'
            : 'Esta accion no se puede deshacer.';

        window.WBAdmin.confirm.show('Eliminar historia', text, function() {
            service.remove(storyId);
            renderTable();
            window.WBAdmin.dashboard.refresh();
            window.WBAdmin.toast.show('Historia eliminada', 'success');
        });
    }

    function setupForm() {
        if (eventsBound) return;

        var storyForm = document.getElementById('storyForm');
        var formTitle = document.getElementById('formTitle');
        var formAuthor = document.getElementById('formAuthor');
        var formExcerpt = document.getElementById('formExcerpt');
        var formContent = document.getElementById('formContent');

        storyForm.addEventListener('submit', function(e) {
            e.preventDefault();

            if (!formTitle.value.trim() || !formAuthor.value.trim() || !formExcerpt.value.trim() || !formContent.value.trim()) {
                window.WBAdmin.toast.show('Completa los campos obligatorios.', 'error');
                return;
            }

            var existingId = document.getElementById('formId').value;

            var storyData = {
                title: formTitle.value.trim(),
                author: formAuthor.value.trim(),
                location: document.getElementById('formLocation').value.trim(),
                image: document.getElementById('formImage').value.trim() || 'https://placehold.co/800x500/1a1a1a/ffffff?text=Story',
                date: document.getElementById('formDate').value.trim(),
                relatedSong: document.getElementById('formRelatedSong').value.trim(),
                initialLikes: parseInt(document.getElementById('formInitialLikes').value, 10) || 0,
                order: parseInt(document.getElementById('formOrder').value, 10) || 1,
                excerpt: formExcerpt.value.trim(),
                content: formContent.value.trim(),
                status: document.getElementById('formStatus').value,
                featured: document.getElementById('formFeatured').value === 'true'
            };

            if (existingId) {
                service.update(existingId, storyData);
                window.WBAdmin.toast.show('Historia actualizada', 'success');
            } else {
                service.create(storyData);
                window.WBAdmin.toast.show('Historia creada', 'success');
            }

            renderTable();
            window.WBAdmin.dashboard.refresh();
            window.WBAdmin.modal.closeAll();
        });
    }

    function setupButtons() {
        document.getElementById('btnAddStory').addEventListener('click', openAddModal);
        document.getElementById('modalClose').addEventListener('click', function() {
            window.WBAdmin.modal.closeAll();
        });
        document.getElementById('btnCancel').addEventListener('click', function() {
            window.WBAdmin.modal.closeAll();
        });

        document.getElementById('storyModal').addEventListener('click', function(e) {
            if (e.target === document.getElementById('storyModal')) window.WBAdmin.modal.closeAll();
        });

        eventsBound = true;
    }

    window.WBAdmin.stories = {
        mount: function(el) {
            section = el;
            tableBody = document.getElementById('storiesTableBody');
            emptyState = document.getElementById('emptyState');
            setupForm();
            setupButtons();
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
