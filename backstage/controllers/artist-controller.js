/* ============================================
   BACKSTAGE STUDIO — Artist Controller
   Conecta ArtistService con ArtistView.
   CRUD asíncrono: espera confirmación de
   Supabase antes de cerrar el modal o mostrar
   el toast de éxito.
   ============================================ */

(function() {
    window.Backstage = window.Backstage || {};
    window.Backstage.Controllers = window.Backstage.Controllers || {};

    var Modal = window.Backstage.Components.Modal;
    var Toast = window.Backstage.Components.Toast;
    var Confirm = window.Backstage.Components.Confirm;
    var Header = window.Backstage.Components.Header;

    function ArtistController(artistService, artistView) {
        this.service = artistService;
        this.view = artistView;
        this._formBound = false;
        this._eventsBound = false;
        this._saving = false;
        this._imageFile = null;
        this._storage = null;
        try {
            var StorageClass = window.Backstage.Services.Storage;
            if (StorageClass) {
                this._storage = new StorageClass();
            }
        } catch (e) {
            console.warn('[Artist] StorageService no disponible');
        }
    }

    ArtistController.prototype.mount = function() {
        this._renderAll();
        this._bindHeader();
        this._bindForm();
        this._bindEvents();
    };

    ArtistController.prototype.unmount = function() {
        Header.hideAll();
    };

    ArtistController.prototype.refresh = function() {
        this._renderAll();
    };

    ArtistController.prototype._renderAll = function() {
        var stats = this.service.getStats();
        var items = this.service.getAll();
        items.sort(function(a, b) { return (a.order || 999) - (b.order || 999); });

        var self = this;
        var actions = {
            edit: function(id) { self._openEditModal(id); },
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
                    Toast.show('Destacado actualizado', 'success');
                }).catch(function(err) {
                    Toast.show('Error al actualizar destacado: ' + (err.message || 'Error desconocido'), 'error');
                });
            },
            duplicate: function(id) {
                self.service.duplicate(id).then(function(result) {
                    if (result.success) {
                        self._renderAll();
                        window.Backstage.EventBus.emit('dashboard:refresh');
                        Toast.show('Artista duplicado', 'success');
                    } else {
                        Toast.show(result.errors[0] || 'Error al duplicar', 'error');
                    }
                }).catch(function(err) {
                    Toast.show('Error al duplicar: ' + (err.message || 'Error desconocido'), 'error');
                });
            },
            remove: function(id, name) { self._openConfirm(id, name); }
        };

        this.view.renderStats(stats);
        this.view.renderTable(items, actions);
    };

    ArtistController.prototype._bindHeader = function() {
        Header.addAction({
            id: 'btnAddArtist',
            icon: 'fa-plus',
            label: 'Nuevo Artista',
            onClick: this._openAddModal.bind(this)
        });
    };

    ArtistController.prototype._bindForm = function() {
        if (this._formBound) return;
        this._formBound = true;

        var self = this;

        var form = document.getElementById('arForm');
        if (form) {
            form.addEventListener('submit', function(e) {
                e.preventDefault();
                self._handleFormSubmit();
            });
        }

        var cancelBtn = document.getElementById('arBtnCancel');
        if (cancelBtn) cancelBtn.addEventListener('click', function() { Modal.closeAll(); });

        var closeBtn = document.getElementById('arModalClose');
        if (closeBtn) closeBtn.addEventListener('click', function() { Modal.closeAll(); });

        var modal = document.getElementById('artistModal');
        if (modal) {
            modal.addEventListener('click', function(e) {
                if (e.target === modal) Modal.closeAll();
            });
        }

        var fileInput = document.getElementById('arFormImageFile');
        if (fileInput) {
            fileInput.addEventListener('change', function() {
                self._handleImageFile(this.files);
            });
        }

        var removeBtn = document.getElementById('arImageRemove');
        if (removeBtn) {
            removeBtn.addEventListener('click', function() {
                self._clearImageFile();
            });
        }

        var imageInput = document.getElementById('arFormImage');
        if (imageInput) {
            imageInput.addEventListener('input', function() {
                self._updateImagePreview(imageInput.value);
            });
        }
    };

    ArtistController.prototype._bindEvents = function() {
        if (this._eventsBound) return;
        this._eventsBound = true;
        var self = this;
        window.Backstage.EventBus.on('artists:created', function() { self._renderAll(); });
        window.Backstage.EventBus.on('artists:updated', function() { self._renderAll(); });
        window.Backstage.EventBus.on('artists:removed', function() { self._renderAll(); });
        window.Backstage.EventBus.on('artists:toggled', function() { self._renderAll(); });
    };

    ArtistController.prototype._handleImageFile = function(files) {
        if (!files || !files.length) return;
        var file = files[0];
        if (!file.type.startsWith('image/')) {
            Toast.show('Selecciona un archivo de imagen', 'error');
            return;
        }
        this._imageFile = file;
        var reader = new FileReader();
        reader.onload = function(e) {
            var preview = document.getElementById('arImagePreview');
            var previewImg = document.getElementById('arImagePreviewImg');
            if (preview && previewImg) {
                previewImg.src = e.target.result;
                preview.style.display = '';
            }
        };
        reader.readAsDataURL(file);
        document.getElementById('arFormImage').value = '';
    };

    ArtistController.prototype._clearImageFile = function() {
        this._imageFile = null;
        var fileInput = document.getElementById('arFormImageFile');
        var preview = document.getElementById('arImagePreview');
        if (fileInput) fileInput.value = '';
        if (preview) preview.style.display = 'none';
        document.getElementById('arFormImage').value = '';
    };

    ArtistController.prototype._updateImagePreview = function(url) {
        var preview = document.getElementById('arImagePreview');
        var previewImg = document.getElementById('arImagePreviewImg');
        if (!preview || !previewImg) return;
        if (url && url.trim()) {
            previewImg.src = url;
            preview.style.display = 'block';
        } else {
            preview.style.display = 'none';
        }
    };

    ArtistController.prototype._prepareImage = function(data) {
        var self = this;
        if (!this._imageFile) return Promise.resolve(data);
        if (!this._storage) {
            Toast.show('La subida de imagenes no esta disponible', 'error');
            return Promise.reject(new Error('Storage no disponible'));
        }
        Toast.show('Subiendo imagen...', 'info');
        return this._storage.uploadImage(this._imageFile, 'artists').then(function(url) {
            data.image = url;
            self._imageFile = null;
            return data;
        }).catch(function(err) {
            Toast.show('Error al subir la imagen: ' + (err.message || 'desconocido'), 'error');
            throw err;
        });
    };

    ArtistController.prototype._openAddModal = function() {
        document.getElementById('arModalTitle').textContent = 'Nuevo Artista';
        document.getElementById('arForm').reset();
        document.getElementById('arFormId').value = '';
        document.getElementById('arFormStatus').value = 'draft';
        document.getElementById('arFormFeatured').value = 'false';
        document.getElementById('arFormOrder').value = String(this.service.getMaxOrder() + 1);
        this._imageFile = null;
        this._clearImageFile();
        this._clearFieldErrors();
        Modal.open(document.getElementById('artistModal'));
        setTimeout(function() {
            document.getElementById('arFormName').focus();
        }, 100);
    };

    ArtistController.prototype._openEditModal = function(id) {
        var artist = this.service.getById(id);
        if (!artist) return;

        document.getElementById('arModalTitle').textContent = 'Editar Artista';
        document.getElementById('arFormId').value = artist.id;
        document.getElementById('arFormName').value = artist.name || '';
        document.getElementById('arFormImage').value = artist.image || '';
        document.getElementById('arFormTags').value = artist.getTagsText();
        document.getElementById('arFormLink').value = artist.link || '';
        document.getElementById('arFormInterview').value = artist.interview || '';
        document.getElementById('arFormStatus').value = artist.published ? 'published' : 'draft';
        document.getElementById('arFormFeatured').value = artist.featured ? 'true' : 'false';
        document.getElementById('arFormOrder').value = String(artist.order || 1);
        this._imageFile = null;
        var fileInput = document.getElementById('arFormImageFile');
        if (fileInput) fileInput.value = '';
        this._clearFieldErrors();
        this._updateImagePreview(artist.image || '');
        Modal.open(document.getElementById('artistModal'));
    };

    ArtistController.prototype._openConfirm = function(id, name) {
        var self = this;
        var text = name
            ? 'Se eliminara el artista "' + name + '". Esta accion no se puede deshacer.'
            : 'Esta accion no se puede deshacer.';

        Confirm.show('Eliminar artista', text, function() {
            self.service.remove(id).then(function() {
                self._renderAll();
                window.Backstage.EventBus.emit('dashboard:refresh');
                Toast.show('Artista eliminado', 'success');
            }).catch(function(err) {
                Toast.show('Error al eliminar: ' + (err.message || 'Error desconocido'), 'error');
            });
        });
    };

    ArtistController.prototype._handleFormSubmit = function() {
        if (this._saving) return;
        this._saving = true;

        var data = {
            name: document.getElementById('arFormName').value,
            image: document.getElementById('arFormImage').value,
            tags: document.getElementById('arFormTags').value,
            link: document.getElementById('arFormLink').value,
            interview: document.getElementById('arFormInterview').value,
            published: document.getElementById('arFormStatus').value === 'published',
            featured: document.getElementById('arFormFeatured').value,
            order: document.getElementById('arFormOrder').value
        };

        var isPublish = data.published === true;

        var validation = this.service.validate(data, isPublish);
        if (!validation.valid) {
            this._showFieldErrors(validation.errors);
            Toast.show('Corrige los errores antes de guardar', 'error');
            this._saving = false;
            return;
        }

        this._clearFieldErrors();

        var existingId = document.getElementById('arFormId').value;
        var self = this;

        this._prepareImage(data).then(function(finalData) {
            if (existingId) {
                return self.service.update(existingId, finalData);
            }
            return self.service.create(finalData);
        }).then(function(result) {
            self._saving = false;
            if (result.success) {
                Toast.show(existingId ? 'Artista actualizado' : 'Artista creado', 'success');
                self._renderAll();
                window.Backstage.EventBus.emit('dashboard:refresh');
                Modal.closeAll();
            } else {
                var msg = (result.errors && result.errors.length)
                    ? result.errors.map(function(e) { return e.message || e; }).join('. ')
                    : 'Error al guardar';
                Toast.show(msg, 'error');
            }
        }).catch(function(err) {
            self._saving = false;
            Toast.show(err.message || 'Error al guardar', 'error');
        });
    };

    ArtistController.prototype._showFieldErrors = function(errors) {
        this._clearFieldErrors();
        errors.forEach(function(err) {
            var fieldId = err.field || '';
            var message = err.message || err;
            if (fieldId) {
                var input = document.getElementById(fieldId);
                if (input) input.classList.add('input-error');
                var errorEl = document.getElementById('error' + fieldId);
                if (errorEl) {
                    errorEl.textContent = message;
                    errorEl.style.display = 'block';
                }
            }
        });
    };

    ArtistController.prototype._clearFieldErrors = function() {
        var errored = document.querySelectorAll('.input-error');
        for (var i = 0; i < errored.length; i++) errored[i].classList.remove('input-error');
        var error_msgs = document.querySelectorAll('.form-error');
        for (var j = 0; j < error_msgs.length; j++) {
            error_msgs[j].textContent = '';
            error_msgs[j].style.display = 'none';
        }
    };

    window.Backstage.Controllers.Artist = ArtistController;
})();
