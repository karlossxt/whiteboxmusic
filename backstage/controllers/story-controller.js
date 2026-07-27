/* ============================================
   BACKSTAGE STUDIO — Story Controller
   Conecta StoryService con StoryView.
   Maneja eventos de CRUD y formularios.
   ============================================ */

(function() {
    window.Backstage = window.Backstage || {};
    window.Backstage.Controllers = window.Backstage.Controllers || {};

    var Modal = window.Backstage.Components.Modal;
    var Toast = window.Backstage.Components.Toast;
    var Confirm = window.Backstage.Components.Confirm;
    var Header = window.Backstage.Components.Header;

    function StoryController(storyService, storyView) {
        this.service = storyService;
        this.view = storyView;
        this._formBound = false;
        this._deleteTarget = null;
    }

    StoryController.prototype.mount = function() {
        this._renderAll();
        this._bindHeader();
        this._bindForm();
        this._bindEvents();
    };

    StoryController.prototype.unmount = function() {
        Header.hideAll();
    };

    StoryController.prototype.refresh = function() {
        this._renderAll();
    };

    StoryController.prototype._renderAll = function() {
        var stats = this.service.getStats();
        var stories = this.service.getAll();
        stories.sort(function(a, b) { return (a.order || 999) - (b.order || 999); });

        var self = this;
        var actions = {
            toggleStatus: function(id) {
                self.service.toggleStatus(id);
                self._renderAll();
                window.Backstage.EventBus.emit('dashboard:refresh');
                Toast.show('Estado actualizado', 'success');
            },
            edit: function(id) { self._openEditModal(id); },
            remove: function(id, title) { self._openConfirm(id, title); }
        };

        this.view.renderStats(stats);
        this.view.renderTable(stories, actions);
    };

    StoryController.prototype._bindHeader = function() {
        Header.addAction({
            id: 'btnAddStory',
            icon: 'fa-plus',
            label: 'Nueva Historia',
            onClick: this._openAddModal.bind(this)
        });
    };

    StoryController.prototype._bindForm = function() {
        if (this._formBound) return;
        this._formBound = true;

        var self = this;

        document.getElementById('storyForm').addEventListener('submit', function(e) {
            e.preventDefault();
            self._handleFormSubmit();
        });

        document.getElementById('btnCancel').addEventListener('click', function() {
            Modal.closeAll();
        });

        document.getElementById('modalClose').addEventListener('click', function() {
            Modal.closeAll();
        });

        document.getElementById('storyModal').addEventListener('click', function(e) {
            if (e.target === document.getElementById('storyModal')) Modal.closeAll();
        });
    };

    StoryController.prototype._bindEvents = function() {
        var self = this;
        window.Backstage.EventBus.on('stories:created', function() { self._renderAll(); });
        window.Backstage.EventBus.on('stories:updated', function() { self._renderAll(); });
        window.Backstage.EventBus.on('stories:removed', function() { self._renderAll(); });
    };

    StoryController.prototype._openAddModal = function() {
        document.getElementById('modalTitle').textContent = 'Nueva Historia';
        document.getElementById('storyForm').reset();
        document.getElementById('formId').value = '';
        document.getElementById('formInitialLikes').value = '0';
        document.getElementById('formStatus').value = 'published';
        document.getElementById('formFeatured').value = 'false';
        document.getElementById('formOrder').value = String(this.service.getMaxOrder() + 1);
        Modal.open(document.getElementById('storyModal'));
    };

    StoryController.prototype._openEditModal = function(id) {
        var story = this.service.getById(id);
        if (!story) return;

        document.getElementById('modalTitle').textContent = 'Editar Historia';
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
        Modal.open(document.getElementById('storyModal'));
    };

    StoryController.prototype._openConfirm = function(id, title) {
        var self = this;
        var text = title
            ? 'Se eliminara la historia "' + title + '". Esta accion no se puede deshacer.'
            : 'Esta accion no se puede deshacer.';

        Confirm.show('Eliminar historia', text, function() {
            self.service.remove(id);
            self._renderAll();
            window.Backstage.EventBus.emit('dashboard:refresh');
            Toast.show('Historia eliminada', 'success');
        });
    };

    StoryController.prototype._handleFormSubmit = function() {
        var data = {
            title: document.getElementById('formTitle').value,
            author: document.getElementById('formAuthor').value,
            location: document.getElementById('formLocation').value,
            image: document.getElementById('formImage').value,
            date: document.getElementById('formDate').value,
            relatedSong: document.getElementById('formRelatedSong').value,
            initialLikes: document.getElementById('formInitialLikes').value,
            order: document.getElementById('formOrder').value,
            excerpt: document.getElementById('formExcerpt').value,
            content: document.getElementById('formContent').value,
            status: document.getElementById('formStatus').value,
            featured: document.getElementById('formFeatured').value
        };

        var existingId = document.getElementById('formId').value;
        var result;

        if (existingId) {
            result = this.service.update(existingId, data);
        } else {
            result = this.service.create(data);
        }

        if (result.success) {
            Toast.show(existingId ? 'Historia actualizada' : 'Historia creada', 'success');
            this._renderAll();
            window.Backstage.EventBus.emit('dashboard:refresh');
            Modal.closeAll();
        } else {
            Toast.show(result.errors.join('. '), 'error');
        }
    };

    window.Backstage.Controllers.Story = StoryController;
})();
