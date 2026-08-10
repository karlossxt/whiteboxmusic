/* ============================================
   BACKSTAGE STUDIO — Soundscape Controller
   Conecta SoundscapeService con SoundscapeView.
   ============================================ */

(function() {
    window.Backstage = window.Backstage || {};
    window.Backstage.Controllers = window.Backstage.Controllers || {};

    var Modal = window.Backstage.Components.Modal;
    var Toast = window.Backstage.Components.Toast;
    var Confirm = window.Backstage.Components.Confirm;
    var Header = window.Backstage.Components.Header;

    function SoundscapeController(soundscapeService, soundscapeView) {
        this.service = soundscapeService;
        this.view = soundscapeView;
        this._formBound = false;
        this._eventsBound = false;
        this._saving = false;
        this._coverFile = null;
        this._storage = null;
        try {
            var StorageClass = window.Backstage.Services.Storage;
            if (StorageClass) {
                this._storage = new StorageClass();
            }
        } catch (e) {
            console.warn('[Soundscape] StorageService no disponible');
        }
    }

    SoundscapeController.prototype.mount = function() {
        this._renderAll();
        this._bindHeader();
        this._bindForm();
        this._bindEvents();
    };

    SoundscapeController.prototype.unmount = function() {
        Header.hideAll();
    };

    SoundscapeController.prototype.refresh = function() {
        this._renderAll();
    };

    SoundscapeController.prototype._renderAll = function() {
        var stats = this.service.getStats();
        var items = this.service.getAll();
        items.sort(function(a, b) { return (a.order || 999) - (b.order || 999); });

        var self = this;
        var actions = {
            togglePublished: function(id) {
                self.service.togglePublished(id).then(function() {
                    self._renderAll();
                    window.Backstage.EventBus.emit('dashboard:refresh');
                    Toast.show('Estado actualizado', 'success');
                }).catch(function(err) {
                    Toast.show('Error al actualizar estado: ' + (err.message || 'Error desconocido'), 'error');
                });
            },
            toggleFeatured: function(id) {
                self.service.toggleFeatured(id).then(function() {
                    self._renderAll();
                    window.Backstage.EventBus.emit('dashboard:refresh');
                    Toast.show('Destacada actualizada', 'success');
                }).catch(function(err) {
                    Toast.show('Error al actualizar destacada: ' + (err.message || 'Error desconocido'), 'error');
                });
            },
            edit: function(id) { self._openEditModal(id); },
            remove: function(id, title) { self._openConfirm(id, title); }
        };

        this.view.renderStats(stats);
        this.view.renderTable(items, actions);
    };

    SoundscapeController.prototype._bindHeader = function() {
        Header.addAction({
            id: 'btnAddSoundscape',
            icon: 'fa-plus',
            label: 'Nueva Cancion',
            onClick: this._openAddModal.bind(this)
        });
    };

    SoundscapeController.prototype._bindForm = function() {
        if (this._formBound) return;
        this._formBound = true;

        var self = this;

        document.getElementById('soundscapeForm').addEventListener('submit', function(e) {
            e.preventDefault();
            self._handleFormSubmit();
        });

        document.getElementById('ssBtnCancel').addEventListener('click', function() {
            Modal.closeAll();
        });

        document.getElementById('ssModalClose').addEventListener('click', function() {
            Modal.closeAll();
        });

        document.getElementById('soundscapeModal').addEventListener('click', function(e) {
            if (e.target === document.getElementById('soundscapeModal')) Modal.closeAll();
        });

        var fileInput = document.getElementById('ssFormCoverFile');
        var removeBtn = document.getElementById('ssCoverRemove');
        if (fileInput) {
            fileInput.addEventListener('change', function() {
                self._handleCoverFile(fileInput.files);
            });
        }
        if (removeBtn) {
            removeBtn.addEventListener('click', function() {
                self._clearCoverFile();
            });
        }
    };

    SoundscapeController.prototype._handleCoverFile = function(files) {
        if (!files || !files.length) return;
        var file = files[0];
        if (!file.type.startsWith('image/')) {
            Toast.show('Selecciona un archivo de imagen', 'error');
            return;
        }
        this._coverFile = file;
        var self = this;
        var reader = new FileReader();
        reader.onload = function(e) {
            var preview = document.getElementById('ssCoverPreview');
            var previewImg = document.getElementById('ssCoverPreviewImg');
            if (preview && previewImg) {
                previewImg.src = e.target.result;
                preview.style.display = '';
            }
        };
        reader.readAsDataURL(file);
        document.getElementById('ssFormCover').value = '';
    };

    SoundscapeController.prototype._clearCoverFile = function() {
        this._coverFile = null;
        var fileInput = document.getElementById('ssFormCoverFile');
        var preview = document.getElementById('ssCoverPreview');
        if (fileInput) fileInput.value = '';
        if (preview) preview.style.display = 'none';
        document.getElementById('ssFormCover').value = '';
    };

    SoundscapeController.prototype._prepareCover = function(data) {
        var self = this;
        if (!this._coverFile) return Promise.resolve(data);
        if (!this._storage) {
            Toast.show('La subida de imagenes no esta disponible', 'error');
            return Promise.reject(new Error('Storage no disponible'));
        }
        Toast.show('Subiendo caratula...', 'info');
        return this._storage.uploadImage(this._coverFile, 'soundscapes').then(function(url) {
            data.cover = url;
            self._coverFile = null;
            return data;
        }).catch(function(err) {
            Toast.show('Error al subir la caratula: ' + (err.message || 'desconocido'), 'error');
            throw err;
        });
    };

    SoundscapeController.prototype._bindEvents = function() {
        if (this._eventsBound) return;
        this._eventsBound = true;
        var self = this;
        window.Backstage.EventBus.on('soundscapes:created', function() { self._renderAll(); });
        window.Backstage.EventBus.on('soundscapes:updated', function() { self._renderAll(); });
        window.Backstage.EventBus.on('soundscapes:removed', function() { self._renderAll(); });
    };

    SoundscapeController.prototype._openAddModal = function() {
        document.getElementById('ssModalTitle').textContent = 'Nueva Cancion';
        document.getElementById('soundscapeForm').reset();
        document.getElementById('ssFormId').value = '';
        document.getElementById('ssFormDuration').value = '180';
        document.getElementById('ssFormPublished').value = 'true';
        document.getElementById('ssFormFeatured').value = 'false';
        document.getElementById('ssFormOrder').value = String(this.service.getMaxOrder() + 1);
        this._coverFile = null;
        var preview = document.getElementById('ssCoverPreview');
        if (preview) preview.style.display = 'none';
        var fileInput = document.getElementById('ssFormCoverFile');
        if (fileInput) fileInput.value = '';
        Modal.open(document.getElementById('soundscapeModal'));
    };

    SoundscapeController.prototype._openEditModal = function(id) {
        var item = this.service.getById(id);
        if (!item) return;

        document.getElementById('ssModalTitle').textContent = 'Editar Cancion';
        document.getElementById('ssFormId').value = item.id;
        document.getElementById('ssFormTitle').value = item.title || '';
        document.getElementById('ssFormArtist').value = item.artist || '';
        document.getElementById('ssFormPlaylist').value = item.playlist || '';
        document.getElementById('ssFormCover').value = item.cover || '';
        document.getElementById('ssFormSpotifyUrl').value = item.spotifyUrl || '';
        document.getElementById('ssFormYoutubeUrl').value = item.youtubeUrl || '';
        document.getElementById('ssFormDescription').value = item.description || '';
        document.getElementById('ssFormCategory').value = item.category || '';
        document.getElementById('ssFormDuration').value = String(item.duration || 180);
        document.getElementById('ssFormOrder').value = String(item.order || 1);
        document.getElementById('ssFormPublished').value = item.published ? 'true' : 'false';
        document.getElementById('ssFormFeatured').value = item.featured ? 'true' : 'false';

        var preview = document.getElementById('ssCoverPreview');
        var previewImg = document.getElementById('ssCoverPreviewImg');
        var fileInput = document.getElementById('ssFormCoverFile');
        this._coverFile = null;
        if (fileInput) fileInput.value = '';
        if (preview && previewImg && item.cover) {
            previewImg.src = item.cover;
            preview.style.display = '';
        } else if (preview) {
            preview.style.display = 'none';
        }

        Modal.open(document.getElementById('soundscapeModal'));
    };

    SoundscapeController.prototype._openConfirm = function(id, title) {
        var self = this;
        var text = title
            ? 'Se eliminara la cancion "' + title + '". Esta accion no se puede deshacer.'
            : 'Esta accion no se puede deshacer.';

        Confirm.show('Eliminar cancion', text, function() {
            self.service.remove(id).then(function() {
                self._renderAll();
                window.Backstage.EventBus.emit('dashboard:refresh');
                Toast.show('Cancion eliminada', 'success');
            }).catch(function(err) {
                Toast.show('Error al eliminar: ' + (err.message || 'Error de Firestore'), 'error');
            });
        });
    };

    SoundscapeController.prototype._handleFormSubmit = function() {
        if (this._saving) return;
        this._saving = true;

        var data = {
            title: document.getElementById('ssFormTitle').value,
            artist: document.getElementById('ssFormArtist').value,
            playlist: document.getElementById('ssFormPlaylist').value,
            cover: document.getElementById('ssFormCover').value,
            spotifyUrl: document.getElementById('ssFormSpotifyUrl').value,
            youtubeUrl: document.getElementById('ssFormYoutubeUrl').value,
            description: document.getElementById('ssFormDescription').value,
            category: document.getElementById('ssFormCategory').value,
            duration: document.getElementById('ssFormDuration').value,
            order: document.getElementById('ssFormOrder').value,
            published: document.getElementById('ssFormPublished').value,
            featured: document.getElementById('ssFormFeatured').value
        };

        var existingId = document.getElementById('ssFormId').value;
        var self = this;

        this._prepareCover(data).then(function(finalData) {
            var promise;
            if (existingId) {
                promise = self.service.update(existingId, finalData);
            } else {
                promise = self.service.create(finalData);
            }
            return promise;
        }).then(function(result) {
            self._saving = false;
            if (result.success) {
                Toast.show(existingId ? 'Cancion actualizada' : 'Cancion creada', 'success');
                self._renderAll();
                window.Backstage.EventBus.emit('dashboard:refresh');
                Modal.closeAll();
            } else {
                Toast.show(result.errors.join('. '), 'error');
            }
        }).catch(function(err) {
            self._saving = false;
            Toast.show(err.message || 'Error al guardar', 'error');
        });
    };

    window.Backstage.Controllers.Soundscape = SoundscapeController;
})();
