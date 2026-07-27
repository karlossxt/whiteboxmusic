/* ADMIN - Panel de administracion de historias WhiteBox Music */

document.addEventListener('DOMContentLoaded', function() {

    var STORAGE_KEY = 'wbox_stories_data';
    var tableBody = document.getElementById('storiesTableBody');
    var emptyState = document.getElementById('emptyState');
    var storyModal = document.getElementById('storyModal');
    var confirmModal = document.getElementById('confirmModal');
    var storyForm = document.getElementById('storyForm');
    var toastContainer = document.getElementById('toastContainer');

    var formId = document.getElementById('formId');
    var formTitle = document.getElementById('formTitle');
    var formAuthor = document.getElementById('formAuthor');
    var formLocation = document.getElementById('formLocation');
    var formImage = document.getElementById('formImage');
    var formDate = document.getElementById('formDate');
    var formRelatedSong = document.getElementById('formRelatedSong');
    var formInitialLikes = document.getElementById('formInitialLikes');
    var formOrder = document.getElementById('formOrder');
    var formExcerpt = document.getElementById('formExcerpt');
    var formContent = document.getElementById('formContent');
    var formStatus = document.getElementById('formStatus');
    var formFeatured = document.getElementById('formFeatured');
    var modalTitle = document.getElementById('modalTitle');

    var deleteTargetId = null;

    function getStories() {
        try {
            var data = localStorage.getItem(STORAGE_KEY);
            if (data) return JSON.parse(data);
        } catch (e) { /* ignore */ }
        if (typeof storiesDataDefault !== 'undefined') return storiesDataDefault.slice();
        return [];
    }

    function saveStories(stories) {
        try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(stories));
        } catch (e) {
            showToast('Error al guardar. localStorage puede estar lleno.', 'error');
        }
    }

    function generateId() {
        return 'story-' + Date.now() + '-' + Math.random().toString(36).substr(2, 5);
    }

    function getMaxOrder(stories) {
        var max = 0;
        stories.forEach(function(s) {
            var o = parseInt(s.order, 10) || 0;
            if (o > max) max = o;
        });
        return max;
    }

    function updateStats(stories) {
        var total = stories.length;
        var published = stories.filter(function(s) { return s.status === 'published'; }).length;
        var draft = stories.filter(function(s) { return s.status === 'draft'; }).length;
        var featured = stories.filter(function(s) { return s.featured === true || s.featured === 'true'; }).length;

        document.getElementById('statTotal').textContent = total;
        document.getElementById('statPublished').textContent = published;
        document.getElementById('statDraft').textContent = draft;
        document.getElementById('statFeatured').textContent = featured;
    }

    function renderTable() {
        var stories = getStories();
        stories.sort(function(a, b) { return (a.order || 999) - (b.order || 999); });

        updateStats(stories);
        tableBody.textContent = '';

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
            thumb.onerror = function() { thumb.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="48" height="32" fill="%23222"%3E%3Crect width="48" height="32" rx="3"/%3E%3C/svg%3E'; };
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

            var editBtn = document.createElement('button');
            editBtn.className = 'btn-icon edit';
            editBtn.title = 'Editar';
            editBtn.setAttribute('aria-label', 'Editar historia');
            editBtn.innerHTML = '<i class="fa-solid fa-pen"></i>';
            editBtn.addEventListener('click', function() { openEditModal(story.id); });
            actionsDiv.appendChild(editBtn);

            var deleteBtn = document.createElement('button');
            deleteBtn.className = 'btn-icon delete';
            deleteBtn.title = 'Eliminar';
            deleteBtn.setAttribute('aria-label', 'Eliminar historia');
            deleteBtn.innerHTML = '<i class="fa-solid fa-trash"></i>';
            deleteBtn.addEventListener('click', function() { openConfirmModal(story.id); });
            actionsDiv.appendChild(deleteBtn);

            tdActions.appendChild(actionsDiv);
            tr.appendChild(tdActions);

            tableBody.appendChild(tr);
        });
    }

    function openAddModal() {
        modalTitle.textContent = 'Nueva Historia';
        storyForm.reset();
        formId.value = '';
        formInitialLikes.value = '0';
        formStatus.value = 'published';
        formFeatured.value = 'false';
        var stories = getStories();
        formOrder.value = String(getMaxOrder(stories) + 1);
        openModal(storyModal);
    }

    function openEditModal(storyId) {
        var stories = getStories();
        var story = stories.find(function(s) { return s.id === storyId; });
        if (!story) return;

        modalTitle.textContent = 'Editar Historia';
        formId.value = story.id;
        formTitle.value = story.title || '';
        formAuthor.value = story.author || '';
        formLocation.value = story.location || '';
        formImage.value = story.image || '';
        formDate.value = story.date || '';
        formRelatedSong.value = story.relatedSong || '';
        formInitialLikes.value = String(story.initialLikes || 0);
        formOrder.value = String(story.order || 1);
        formExcerpt.value = story.excerpt || '';
        formContent.value = story.content || '';
        formStatus.value = story.status || 'published';
        formFeatured.value = story.featured ? 'true' : 'false';
        openModal(storyModal);
    }

    function openModal(overlay) {
        overlay.classList.add('active');
        document.body.style.overflow = 'hidden';
    }

    function closeModalAll() {
        storyModal.classList.remove('active');
        confirmModal.classList.remove('active');
        document.body.style.overflow = '';
    }

    function openConfirmModal(storyId) {
        deleteTargetId = storyId;
        var stories = getStories();
        var story = stories.find(function(s) { return s.id === storyId; });
        document.getElementById('confirmText').textContent =
            story
                ? 'Se eliminara la historia "' + story.title + '". Esta accion no se puede deshacer.'
                : 'Esta accion no se puede deshacer.';
        openModal(confirmModal);
    }

    function deleteStory(storyId) {
        var stories = getStories();
        var filtered = stories.filter(function(s) { return s.id !== storyId; });
        saveStories(filtered);
        renderTable();
        showToast('Historia eliminada', 'success');
        closeModalAll();
        deleteTargetId = null;
    }

    storyForm.addEventListener('submit', function(e) {
        e.preventDefault();

        if (!formTitle.value.trim() || !formAuthor.value.trim() || !formExcerpt.value.trim() || !formContent.value.trim()) {
            showToast('Completa los campos obligatorios.', 'error');
            return;
        }

        var stories = getStories();
        var existingId = formId.value;

        var storyData = {
            title: formTitle.value.trim(),
            author: formAuthor.value.trim(),
            location: formLocation.value.trim(),
            image: formImage.value.trim() || 'https://placehold.co/800x500/1a1a1a/ffffff?text=Story',
            date: formDate.value.trim(),
            relatedSong: formRelatedSong.value.trim(),
            initialLikes: parseInt(formInitialLikes.value, 10) || 0,
            order: parseInt(formOrder.value, 10) || 1,
            excerpt: formExcerpt.value.trim(),
            content: formContent.value.trim(),
            status: formStatus.value,
            featured: formFeatured.value === 'true'
        };

        if (existingId) {
            var idx = stories.findIndex(function(s) { return s.id === existingId; });
            if (idx !== -1) {
                storyData.id = existingId;
                stories[idx] = storyData;
                showToast('Historia actualizada', 'success');
            }
        } else {
            storyData.id = generateId();
            stories.push(storyData);
            showToast('Historia creada', 'success');
        }

        saveStories(stories);
        renderTable();
        closeModalAll();
    });

    document.getElementById('btnAddStory').addEventListener('click', openAddModal);
    document.getElementById('modalClose').addEventListener('click', closeModalAll);
    document.getElementById('btnCancel').addEventListener('click', closeModalAll);

    storyModal.addEventListener('click', function(e) {
        if (e.target === storyModal) closeModalAll();
    });

    confirmModal.addEventListener('click', function(e) {
        if (e.target === confirmModal) closeModalAll();
    });

    document.getElementById('confirmCancel').addEventListener('click', closeModalAll);
    document.getElementById('confirmDelete').addEventListener('click', function() {
        if (deleteTargetId) deleteStory(deleteTargetId);
    });

    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape' && (storyModal.classList.contains('active') || confirmModal.classList.contains('active'))) {
            closeModalAll();
        }
    });

    function showToast(message, type) {
        var toast = document.createElement('div');
        toast.className = 'toast ' + (type || 'info');
        var icon = type === 'success' ? 'fa-check-circle' : type === 'error' ? 'fa-exclamation-circle' : 'fa-info-circle';
        toast.innerHTML = '<i class="fa-solid ' + icon + '"></i><span>' + message + '</span>';
        toastContainer.appendChild(toast);
        setTimeout(function() {
            if (toast.parentNode) toast.parentNode.removeChild(toast);
        }, 3000);
    }

    renderTable();
});
