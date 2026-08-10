/* ============================================
   BACKSTAGE STUDIO — Interview Controller
   Conecta InterviewService con InterviewView.
   CRUD asíncrono: espera confirmación de Firestore
   antes de cerrar modal o mostrar toast de éxito.
   ============================================ */

(function() {
    window.Backstage = window.Backstage || {};
    window.Backstage.Controllers = window.Backstage.Controllers || {};

    var Modal = window.Backstage.Components.Modal;
    var Toast = window.Backstage.Components.Toast;
    var Confirm = window.Backstage.Components.Confirm;
    var Header = window.Backstage.Components.Header;

    function InterviewController(interviewService, interviewView) {
        this.service = interviewService;
        this.view = interviewView;
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
            console.warn('[Interview] StorageService no disponible');
        }
    }

    InterviewController.prototype.mount = function() {
        this._renderAll();
        this._bindHeader();
        this._bindForm();
        this._bindEvents();
    };

    InterviewController.prototype.unmount = function() {
        Header.hideAll();
    };

    InterviewController.prototype.refresh = function() {
        this._renderAll();
    };

    InterviewController.prototype._renderAll = function() {
        var stats = this.service.getStats();
        var items = this.service.getAll();
        items.sort(function(a, b) { return (a.order || 999) - (b.order || 999); });

        var self = this;
        var actions = {
            preview: function(id) { self._openPreview(id); },
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
                        Toast.show('Entrevista duplicada', 'success');
                    } else {
                        Toast.show(result.errors[0] || 'Error al duplicar', 'error');
                    }
                }).catch(function(err) {
                    Toast.show('Error al duplicar: ' + (err.message || 'Error desconocido'), 'error');
                });
            },
            remove: function(id, title) { self._openConfirm(id, title); }
        };

        this.view.renderStats(stats);
        this.view.renderTable(items, actions);
    };

    InterviewController.prototype._bindHeader = function() {
        Header.addAction({
            id: 'btnAddInterview',
            icon: 'fa-plus',
            label: 'Nueva Entrevista',
            onClick: this._openAddModal.bind(this)
        });
    };

    InterviewController.prototype._bindForm = function() {
        if (this._formBound) return;
        this._formBound = true;

        var self = this;

        document.getElementById('ivForm').addEventListener('submit', function(e) {
            e.preventDefault();
            self._handleFormSubmit();
        });

        document.getElementById('ivBtnCancel').addEventListener('click', function() {
            Modal.closeAll();
        });

        document.getElementById('ivModalClose').addEventListener('click', function() {
            Modal.closeAll();
        });

        document.getElementById('interviewModal').addEventListener('click', function(e) {
            if (e.target === document.getElementById('interviewModal')) Modal.closeAll();
        });

        var titleInput = document.getElementById('ivFormTitle');
        var slugInput = document.getElementById('ivFormSlug');
        if (titleInput && slugInput) {
            titleInput.addEventListener('input', function() {
                if (!self._slugManuallyEdited) {
                    slugInput.value = self.service.generateSlug(titleInput.value);
                }
            });
            slugInput.addEventListener('input', function() {
                self._slugManuallyEdited = true;
            });
        }

        var fileInput = document.getElementById('ivFormCoverFile');
        if (fileInput) {
            fileInput.addEventListener('change', function() {
                self._handleCoverFile(this.files);
            });
        }

        var removeBtn = document.getElementById('ivCoverRemove');
        if (removeBtn) {
            removeBtn.addEventListener('click', function() {
                self._clearCoverFile();
            });
        }

        var coverInput = document.getElementById('ivFormCover');
        if (coverInput) {
            coverInput.addEventListener('input', function() {
                self._updateCoverPreview(coverInput.value);
            });
        }
    };

    InterviewController.prototype._bindEvents = function() {
        if (this._eventsBound) return;
        this._eventsBound = true;
        var self = this;
        window.Backstage.EventBus.on('interviews:created', function() { self._renderAll(); });
        window.Backstage.EventBus.on('interviews:updated', function() { self._renderAll(); });
        window.Backstage.EventBus.on('interviews:removed', function() { self._renderAll(); });
        window.Backstage.EventBus.on('interviews:toggled', function() { self._renderAll(); });
    };

    InterviewController.prototype._handleCoverFile = function(files) {
        if (!files || !files.length) return;
        var file = files[0];
        if (!file.type.startsWith('image/')) {
            Toast.show('Selecciona un archivo de imagen', 'error');
            return;
        }
        this._coverFile = file;
        var reader = new FileReader();
        reader.onload = function(e) {
            var preview = document.getElementById('ivCoverPreview');
            var previewImg = document.getElementById('ivCoverPreviewImg');
            if (preview && previewImg) {
                previewImg.src = e.target.result;
                preview.style.display = '';
            }
        };
        reader.readAsDataURL(file);
        document.getElementById('ivFormCover').value = '';
    };

    InterviewController.prototype._clearCoverFile = function() {
        this._coverFile = null;
        var fileInput = document.getElementById('ivFormCoverFile');
        var preview = document.getElementById('ivCoverPreview');
        if (fileInput) fileInput.value = '';
        if (preview) preview.style.display = 'none';
        document.getElementById('ivFormCover').value = '';
    };

    InterviewController.prototype._updateCoverPreview = function(url) {
        var preview = document.getElementById('ivCoverPreview');
        var previewImg = document.getElementById('ivCoverPreviewImg');
        if (!preview || !previewImg) return;
        if (url && url.trim()) {
            previewImg.src = url;
            preview.style.display = 'block';
        } else {
            preview.style.display = 'none';
        }
    };

    InterviewController.prototype._prepareCover = function(data) {
        var self = this;
        if (!this._coverFile) return Promise.resolve(data);
        if (!this._storage) {
            Toast.show('La subida de imagenes no esta disponible', 'error');
            return Promise.reject(new Error('Storage no disponible'));
        }
        Toast.show('Subiendo portada...', 'info');
        return this._storage.uploadImage(this._coverFile, 'interviews').then(function(url) {
            data.cover = url;
            self._coverFile = null;
            return data;
        }).catch(function(err) {
            Toast.show('Error al subir la portada: ' + (err.message || 'desconocido'), 'error');
            throw err;
        });
    };

    InterviewController.prototype._openAddModal = function() {
        document.getElementById('ivModalTitle').textContent = 'Nueva Entrevista';
        document.getElementById('ivForm').reset();
        document.getElementById('ivFormId').value = '';
        document.getElementById('ivFormSlug').value = '';
        document.getElementById('ivFormStatus').value = 'draft';
        document.getElementById('ivFormFeatured').value = 'false';
        document.getElementById('ivFormOrder').value = String(this.service.getMaxOrder() + 1);
        this._slugManuallyEdited = false;
        this._coverFile = null;
        this._clearCoverFile();
        this._clearFieldErrors();
        Modal.open(document.getElementById('interviewModal'));
        setTimeout(function() {
            document.getElementById('ivFormTitle').focus();
        }, 100);
    };

    InterviewController.prototype._openEditModal = function(id) {
        var iv = this.service.getById(id);
        if (!iv) return;

        document.getElementById('ivModalTitle').textContent = 'Editar Entrevista';
        document.getElementById('ivFormId').value = iv.id;
        document.getElementById('ivFormTitle').value = iv.title || '';
        document.getElementById('ivFormSlug').value = iv.slug || '';
        document.getElementById('ivFormExcerpt').value = iv.excerpt || '';
        document.getElementById('ivFormContent').value = iv.content || '';
        document.getElementById('ivFormCategory').value = iv.category || '';
        document.getElementById('ivFormAuthor').value = iv.author || '';
        document.getElementById('ivFormCover').value = iv.cover || '';
        document.getElementById('ivFormYoutubeUrl').value = iv.youtubeUrl || '';
        document.getElementById('ivFormSpotifyUrl').value = iv.spotifyUrl || '';
        document.getElementById('ivFormPublishDate').value = iv.publishDate || '';
        document.getElementById('ivFormStatus').value = iv.published ? 'published' : 'draft';
        document.getElementById('ivFormFeatured').value = iv.featured ? 'true' : 'false';
        document.getElementById('ivFormOrder').value = String(iv.order || 1);
        this._slugManuallyEdited = !!iv.slug;
        this._coverFile = null;
        var fileInput = document.getElementById('ivFormCoverFile');
        if (fileInput) fileInput.value = '';
        this._clearFieldErrors();
        this._updateCoverPreview(iv.cover || '');
        Modal.open(document.getElementById('interviewModal'));
    };

    InterviewController.prototype._openConfirm = function(id, title) {
        var self = this;
        var text = title
            ? 'Se eliminara la entrevista "' + title + '". Esta accion no se puede deshacer.'
            : 'Esta accion no se puede deshacer.';

        Confirm.show('Eliminar entrevista', text, function() {
            self.service.remove(id).then(function() {
                self._renderAll();
                window.Backstage.EventBus.emit('dashboard:refresh');
                Toast.show('Entrevista eliminada', 'success');
            }).catch(function(err) {
                Toast.show('Error al eliminar: ' + (err.message || 'Error de Firestore'), 'error');
            });
        });
    };

    InterviewController.prototype._openPreview = function(id) {
        var iv = this.service.getById(id);
        if (!iv) return;
        this._showPreview(iv.toJSON());
    };

    InterviewController.prototype._showPreview = function(data) {
        var previewCard = document.getElementById('previewCardContent');
        previewCard.textContent = '';

        var card = document.createElement('article');
        card.className = 'preview-story-card';

        var imgDiv = document.createElement('div');
        imgDiv.className = 'preview-card-image';
        var img = document.createElement('img');
        img.src = this._safeImageUrl(data.cover);
        img.alt = data.title || '';
        img.onerror = function() {
            img.onerror = null;
            img.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="680" height="340" fill="%231a1a1a"%3E%3Crect width="680" height="340"/%3E%3Ctext x="50%25" y="50%25" fill="%23444" font-size="16" text-anchor="middle" dy=".3em"%3ESin imagen%3C/text%3E%3C/svg%3E';
        };
        imgDiv.appendChild(img);

        if (data.category) {
            var catBadge = document.createElement('span');
            catBadge.className = 'story-card-category';
            catBadge.textContent = data.category;
            imgDiv.appendChild(catBadge);
        }
        card.appendChild(imgDiv);

        var body = document.createElement('div');
        body.className = 'preview-card-body';

        var titleEl = document.createElement('h3');
        titleEl.className = 'preview-card-title';
        titleEl.textContent = data.title || '(sin titulo)';
        body.appendChild(titleEl);

        var excerptEl = document.createElement('p');
        excerptEl.className = 'preview-card-excerpt';
        excerptEl.textContent = data.excerpt || '';
        body.appendChild(excerptEl);

        var footer = document.createElement('div');
        footer.className = 'preview-card-footer';
        var authorEl = document.createElement('span');
        authorEl.className = 'preview-card-author';
        var byTextNode = document.createTextNode('by ');
        authorEl.appendChild(byTextNode);
        var authorStrong = document.createElement('strong');
        authorStrong.textContent = data.author || '-';
        authorEl.appendChild(authorStrong);
        footer.appendChild(authorEl);
        if (data.publishDate) {
            var dateEl = document.createElement('span');
            dateEl.className = 'preview-card-date';
            dateEl.textContent = data.publishDate;
            footer.appendChild(dateEl);
        }
        body.appendChild(footer);
        card.appendChild(body);

        previewCard.appendChild(card);
        Modal.open(document.getElementById('previewModal'));
    };

    InterviewController.prototype._handleFormSubmit = function() {
        if (this._saving) return;
        this._saving = true;

        var data = {
            title: document.getElementById('ivFormTitle').value,
            slug: document.getElementById('ivFormSlug').value,
            excerpt: document.getElementById('ivFormExcerpt').value,
            content: document.getElementById('ivFormContent').value,
            category: document.getElementById('ivFormCategory').value,
            author: document.getElementById('ivFormAuthor').value,
            cover: document.getElementById('ivFormCover').value,
            youtubeUrl: document.getElementById('ivFormYoutubeUrl').value,
            spotifyUrl: document.getElementById('ivFormSpotifyUrl').value,
            publishDate: document.getElementById('ivFormPublishDate').value,
            status: document.getElementById('ivFormStatus').value,
            published: document.getElementById('ivFormStatus').value === 'published',
            featured: document.getElementById('ivFormFeatured').value,
            order: document.getElementById('ivFormOrder').value
        };

        var isPublish = data.status === 'published';
        if (this._coverFile) data.cover = 'pending-upload';

        var validation = this.service.validate(data, isPublish);
        if (!validation.valid) {
            this._showFieldErrors(validation.errors);
            Toast.show('Corrige los errores antes de guardar', 'error');
            this._saving = false;
            return;
        }

        this._clearFieldErrors();

        var existingId = document.getElementById('ivFormId').value;
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
                Toast.show(existingId ? 'Entrevista actualizada' : 'Entrevista creada', 'success');
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

    InterviewController.prototype._showFieldErrors = function(errors) {
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

    InterviewController.prototype._clearFieldErrors = function() {
        var errored = document.querySelectorAll('.input-error');
        for (var i = 0; i < errored.length; i++) errored[i].classList.remove('input-error');
        var error_msgs = document.querySelectorAll('.form-error');
        for (var j = 0; j < error_msgs.length; j++) {
            error_msgs[j].textContent = '';
            error_msgs[j].style.display = 'none';
        }
    };

    InterviewController.prototype._safeImageUrl = function(url) {
        if (!url || typeof url !== 'string') return '';
        var trimmed = url.trim();
        if (!trimmed) return '';
        var lower = trimmed.toLowerCase();
        if (lower.indexOf('javascript:') === 0) return '';
        if (lower.indexOf('data:text/html') === 0) return '';
        return trimmed;
    };

    window.Backstage.Controllers.Interview = InterviewController;
})();
