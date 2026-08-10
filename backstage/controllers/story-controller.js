/* ============================================
   BACKSTAGE STUDIO — Story Controller
   Conecta StoryService con StoryView.
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

    function StoryController(storyService, storyView) {
        this.service = storyService;
        this.view = storyView;
        this._formBound = false;
        this._saving = false;
        this._formDirty = false;
        this._slugManuallyEdited = false;
        this._eventsBound = false;
        this._keyHandler = null;
        this._imageFile = null;
        this._storage = null;
        try {
            var StorageClass = window.Backstage.Services.Storage;
            if (StorageClass) {
                this._storage = new StorageClass();
            }
        } catch (e) {
            console.warn('[Story] StorageService no disponible');
        }
    }

    StoryController.prototype.mount = function() {
        this._renderAll();
        this._bindHeader();
        this._bindForm();
        this._bindEvents();
        this._bindGlobalKeys();
        this._bindImportAction();
    };

    StoryController.prototype.unmount = function() {
        Header.hideAll();
        this._unbindGlobalKeys();
    };

    StoryController.prototype.refresh = function() {
        this._renderAll();
    };

    StoryController.prototype._renderAll = function() {
        var stats = this.service.getStats();
        var self = this;

        this.view.renderStats(stats);

        var savedFilters = this.view.getFilters();

        var callbacks = {
            onSearch: function() { self._applyFilters(); },
            onFilter: function() { self._applyFilters(); },
            onSort: function() { self._applyFilters(); }
        };
        this.view.renderFilterBar(callbacks, savedFilters);

        this._applyFilters();
    };

    StoryController.prototype._applyFilters = function() {
        var filters = this.view.getFilters();
        var stories = this.service.getAll();
        var isFiltered = false;

        if (filters.search) {
            stories = this.service.search(filters.search);
            isFiltered = true;
        }

        if (filters.status && filters.status !== 'all') {
            stories = stories.filter(function(s) {
                if (filters.status === 'featured') return s.isPublished() && s.isFeatured();
                return s.status === filters.status;
            });
            isFiltered = true;
        }

        if (filters.category && filters.category !== 'all') {
            stories = stories.filter(function(s) { return s.category === filters.category; });
            isFiltered = true;
        }

        var sort = filters.sort || 'newest';
        stories.sort(function(a, b) {
            if (sort === 'newest') return (b.updatedAt || 0) - (a.updatedAt || 0);
            if (sort === 'oldest') return (a.updatedAt || 0) - (b.updatedAt || 0);
            if (sort === 'title-az') return (a.title || '').localeCompare(b.title || '');
            if (sort === 'title-za') return (b.title || '').localeCompare(a.title || '');
            return 0;
        });

        var self = this;
        var actions = {
            preview: function(id) { self._openPreview(id); },
            edit: function(id) { self._openEditModal(id); },
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
                        Toast.show('Historia duplicada', 'success');
                    } else {
                        Toast.show(result.errors[0] || 'Error al duplicar', 'error');
                    }
                }).catch(function(err) {
                    Toast.show('Error al duplicar: ' + (err.message || 'Error desconocido'), 'error');
                });
            },
            remove: function(id, title) { self._openConfirm(id, title); }
        };

        this.view.renderTable(stories, actions, isFiltered);
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

        document.getElementById('btnSaveDraft').addEventListener('click', function(e) {
            e.preventDefault();
            self._handleSave('draft');
        });

        document.getElementById('btnPublish').addEventListener('click', function(e) {
            e.preventDefault();
            self._handleSave('publish');
        });

        document.getElementById('btnCancel').addEventListener('click', function() {
            if (self._formDirty) {
                Confirm.show('Cancelar edicion', 'Tienes cambios sin guardar. ¿Deseas salir?', function() {
                    self._formDirty = false;
                    Modal.closeAll();
                });
            } else {
                Modal.closeAll();
            }
        });

        document.getElementById('modalClose').addEventListener('click', function() {
            document.getElementById('btnCancel').click();
        });

        document.getElementById('storyModal').addEventListener('click', function(e) {
            if (e.target === document.getElementById('storyModal')) {
                document.getElementById('btnCancel').click();
            }
        });

        var titleInput = document.getElementById('formTitle');
        var slugInput = document.getElementById('formSlug');
        var imageInput = document.getElementById('formImage');

        titleInput.addEventListener('input', function() {
            self._formDirty = true;
            if (!self._slugManuallyEdited) {
                slugInput.value = self.service.generateSlug(titleInput.value);
            }
        });

        slugInput.addEventListener('input', function() {
            self._slugManuallyEdited = true;
            self._formDirty = true;
        });

        imageInput.addEventListener('input', function() {
            self._formDirty = true;
            self._updateImagePreview(imageInput.value);
        });

        var imageFileInput = document.getElementById('formImageFile');
        if (imageFileInput) {
            imageFileInput.addEventListener('change', function() {
                self._handleImageFile(this.files);
            });
        }

        var imageRemoveBtn = document.getElementById('storyImageRemove');
        if (imageRemoveBtn) {
            imageRemoveBtn.addEventListener('click', function() {
                self._clearImageFile();
            });
        }

        var otherInputs = ['formExcerpt','formCategory','formAuthor','formContent','formStatus','formFeatured','formDate'];
        otherInputs.forEach(function(id) {
            var el = document.getElementById(id);
            if (el) el.addEventListener('input', function() { self._formDirty = true; });
            if (el && el.tagName === 'SELECT') el.addEventListener('change', function() { self._formDirty = true; });
        });

        document.getElementById('btnPreviewForm').addEventListener('click', function() {
            self._openPreviewFromForm();
        });
    };

    StoryController.prototype._bindEvents = function() {
        if (this._eventsBound) return;
        this._eventsBound = true;
        var self = this;
        window.Backstage.EventBus.on('stories:created', function() { self._renderAll(); });
        window.Backstage.EventBus.on('stories:updated', function() { self._renderAll(); });
        window.Backstage.EventBus.on('stories:removed', function() { self._renderAll(); });
        window.Backstage.EventBus.on('stories:toggled', function() { self._renderAll(); });
    };

    StoryController.prototype._bindGlobalKeys = function() {
        var self = this;
        this._keyHandler = function(e) {
            if ((e.ctrlKey || e.metaKey) && e.key === 's') {
                var modal = document.getElementById('storyModal');
                if (modal && modal.classList.contains('active')) {
                    e.preventDefault();
                    self._handleSave('draft');
                }
            }
        };
        document.addEventListener('keydown', this._keyHandler);

        window.addEventListener('beforeunload', function(e) {
            if (self._formDirty) {
                e.preventDefault();
                e.returnValue = '';
            }
        });
    };

    StoryController.prototype._unbindGlobalKeys = function() {
        if (this._keyHandler) {
            document.removeEventListener('keydown', this._keyHandler);
            this._keyHandler = null;
        }
    };

    StoryController.prototype._bindImportAction = function() {
        var ds = window.Backstage.storyDatasourceRegistry;
        if (!ds || !ds.isFirestore()) return;

        var repo = this.service.repository;
        if (!repo.importLocalStories) return;

        var bannerEl = document.getElementById('migrationBanner');
        if (!bannerEl) return;

        var hasLocal = false;
        try {
            var raw = localStorage.getItem('backstage_stories_data');
            if (raw) {
                var data = JSON.parse(raw);
                if (data && data.length > 0) hasLocal = true;
            }
        } catch (e) {}

        if (!hasLocal) {
            try {
                var legacyRaw = localStorage.getItem('wbox_stories_data');
                if (legacyRaw) {
                    var legacyData = JSON.parse(legacyRaw);
                    if (legacyData && legacyData.length > 0) hasLocal = true;
                }
            } catch (e) {}
        }

        if (!hasLocal) {
            bannerEl.style.display = 'none';
            return;
        }

        var self = this;
        bannerEl.style.display = '';
        var importBtn = document.getElementById('migrationImportBtn');
        var importCount = document.getElementById('migrationCount');
        var countLocal = 0;
        try {
            var raw2 = localStorage.getItem('backstage_stories_data') || localStorage.getItem('wbox_stories_data');
            if (raw2) {
                var arr = JSON.parse(raw2);
                if (arr) countLocal = arr.length;
            }
        } catch (e) {}

        if (importCount && countLocal > 0) {
            importCount.textContent = countLocal + ' historias encontradas en localStorage.';
        }

        if (importBtn) {
            importBtn.addEventListener('click', function() {
                Confirm.show(
                    'Importar historias locales',
                    'Se subiran ' + countLocal + ' historias a Firestore. Esta accion no se puede deshacer.',
                    function() {
                        importBtn.disabled = true;
                        importBtn.textContent = 'Importando...';
                        repo.importLocalStories().then(function(result) {
                            if (result.success === false) {
                                Toast.show(result.message, 'error');
                                if (result.blocked) {
                                    importBtn.textContent = 'Importacion no disponible';
                                    importBtn.disabled = true;
                                } else {
                                    importBtn.disabled = false;
                                    importBtn.textContent = 'Importar historias locales';
                                }
                                return;
                            }
                            Toast.show(result.message, 'success');
                            self._renderAll();
                            window.Backstage.EventBus.emit('dashboard:refresh');
                            bannerEl.style.display = 'none';
                        }).catch(function(err) {
                            Toast.show('Error al importar: ' + (err.message || 'Error de Firestore'), 'error');
                            importBtn.disabled = false;
                            importBtn.textContent = 'Importar historias locales';
                        });
                    }
                );
            });
        }
    };

    StoryController.prototype._openAddModal = function() {
        document.getElementById('modalTitle').textContent = 'Nueva Historia';
        document.getElementById('storyForm').reset();
        document.getElementById('formId').value = '';
        document.getElementById('formSlug').value = '';
        document.getElementById('formSlugManuallyEdited').value = '';
        document.getElementById('formStatus').value = 'draft';
        document.getElementById('formFeatured').value = 'false';
        this._slugManuallyEdited = false;
        this._formDirty = false;
        this._saving = false;
        this._imageFile = null;
        this._clearFieldErrors();
        this._clearImageFile();
        this._setButtonsDisabled(false);
        Modal.open(document.getElementById('storyModal'));
        setTimeout(function() {
            document.getElementById('formTitle').focus();
        }, 100);
    };

    StoryController.prototype._openEditModal = function(id) {
        var story = this.service.getById(id);
        if (!story) return;

        document.getElementById('modalTitle').textContent = 'Editar Historia';
        document.getElementById('formId').value = story.id;
        document.getElementById('formTitle').value = story.title || '';
        document.getElementById('formSlug').value = story.slug || '';
        document.getElementById('formSlugManuallyEdited').value = story.slug ? 'true' : '';
        document.getElementById('formExcerpt').value = story.excerpt || '';
        document.getElementById('formCategory').value = story.category || '';
        document.getElementById('formAuthor').value = story.author || '';
        document.getElementById('formImage').value = story.image || '';
        document.getElementById('formContent').value = story.content || '';
        document.getElementById('formStatus').value = story.status || 'draft';
        document.getElementById('formFeatured').value = story.featured ? 'true' : 'false';
        document.getElementById('formDate').value = story.date || '';
        this._slugManuallyEdited = !!story.slug;
        this._formDirty = false;
        this._saving = false;
        this._imageFile = null;
        var imageFileInput = document.getElementById('formImageFile');
        if (imageFileInput) imageFileInput.value = '';
        this._clearFieldErrors();
        this._updateImagePreview(story.image || '');
        this._setButtonsDisabled(false);
        Modal.open(document.getElementById('storyModal'));
    };

    StoryController.prototype._openConfirm = function(id, title) {
        var self = this;
        var text = title
            ? 'Se eliminara la historia "' + title + '". Esta accion no se puede deshacer.'
            : 'Esta accion no se puede deshacer.';

        Confirm.show('Eliminar historia', text, function() {
            self.service.remove(id).then(function() {
                self._renderAll();
                window.Backstage.EventBus.emit('dashboard:refresh');
                Toast.show('Historia eliminada', 'success');
            }).catch(function(err) {
                Toast.show('Error al eliminar: ' + (err.message || 'Error de Firestore'), 'error');
            });
        });
    };

    StoryController.prototype._openPreview = function(id) {
        var story = this.service.getById(id);
        if (!story) return;
        this._showPreview(story.toJSON());
    };

    StoryController.prototype._openPreviewFromForm = function() {
        var data = this._readFormData();
        this._showPreview(data);
    };

    StoryController.prototype._showPreview = function(data) {
        var previewCard = document.getElementById('previewCardContent');
        previewCard.textContent = '';

        var card = document.createElement('article');
        card.className = 'preview-story-card';

        var imgDiv = document.createElement('div');
        imgDiv.className = 'preview-card-image';
        var img = document.createElement('img');
        img.src = this._safeImageUrl(data.image);
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
        if (data.date) {
            var dateEl = document.createElement('span');
            dateEl.className = 'preview-card-date';
            dateEl.textContent = data.date;
            footer.appendChild(dateEl);
        }
        body.appendChild(footer);
        card.appendChild(body);

        previewCard.appendChild(card);
        Modal.open(document.getElementById('previewModal'));
    };

    StoryController.prototype._readFormData = function() {
        return {
            title: document.getElementById('formTitle').value,
            slug: document.getElementById('formSlug').value,
            excerpt: document.getElementById('formExcerpt').value,
            category: document.getElementById('formCategory').value,
            author: document.getElementById('formAuthor').value,
            image: document.getElementById('formImage').value,
            content: document.getElementById('formContent').value,
            status: document.getElementById('formStatus').value,
            featured: document.getElementById('formFeatured').value,
            date: document.getElementById('formDate').value
        };
    };

    StoryController.prototype._handleSave = function(mode) {
        if (this._saving) return;
        this._saving = true;

        var data = this._readFormData();
        var isPublish = mode === 'publish';

        if (isPublish) data.status = 'published';
        else data.status = data.status || 'draft';

        /* Imagen pendiente de subir: la validacion la considera presente */
        if (this._imageFile) data.image = 'pending-upload';

        var validation = this.service.validate(data, isPublish);
        if (!validation.valid) {
            this._showFieldErrors(validation.errors);
            Toast.show('Corrige los errores antes de guardar', 'error');
            this._saving = false;
            return;
        }

        this._clearFieldErrors();
        this._setButtonsDisabled(true);

        var self = this;
        var existingId = document.getElementById('formId').value;

        this._prepareImage(data).then(function(finalData) {
            var promise;
            if (existingId) {
                promise = self.service.update(existingId, finalData);
            } else {
                promise = self.service.create(finalData);
            }
            return promise;
        }).then(function(result) {
            self._saving = false;
            self._setButtonsDisabled(false);

            if (result.success) {
                self._formDirty = false;
                Toast.show(existingId ? 'Historia actualizada' : (isPublish ? 'Historia publicada' : 'Borrador guardado'), 'success');
                self._renderAll();
                window.Backstage.EventBus.emit('dashboard:refresh');
                Modal.closeAll();
            } else {
                if (result.errors && result.errors.length) {
                    if (typeof result.errors[0] === 'object') {
                        self._showFieldErrors(result.errors);
                    } else {
                        Toast.show(result.errors.join('. '), 'error');
                    }
                }
            }
        }).catch(function(err) {
            self._saving = false;
            self._setButtonsDisabled(false);
            Toast.show('Error al guardar: ' + (err.message || 'Error de Firestore'), 'error');
        });
    };

    StoryController.prototype._showFieldErrors = function(errors) {
        this._clearFieldErrors();
        errors.forEach(function(err) {
            var fieldId = err.field || '';
            var message = err.message || err;
            if (fieldId) {
                var input = document.getElementById(fieldId);
                if (input) input.classList.add('input-error');
                var errorEl = document.getElementById('error' + fieldId.replace('form', ''));
                if (errorEl) {
                    errorEl.textContent = message;
                    errorEl.style.display = 'block';
                }
            }
        });
    };

    StoryController.prototype._clearFieldErrors = function() {
        var errored = document.querySelectorAll('.input-error');
        for (var i = 0; i < errored.length; i++) errored[i].classList.remove('input-error');
        var error_msgs = document.querySelectorAll('.form-error');
        for (var j = 0; j < error_msgs.length; j++) {
            error_msgs[j].textContent = '';
            error_msgs[j].style.display = 'none';
        }
    };

    StoryController.prototype._setButtonsDisabled = function(disabled) {
        var btnDraft = document.getElementById('btnSaveDraft');
        var btnPublish = document.getElementById('btnPublish');
        if (btnDraft) btnDraft.disabled = disabled;
        if (btnPublish) btnPublish.disabled = disabled;
    };

    StoryController.prototype._updateImagePreview = function(url) {
        var preview = document.getElementById('imagePreview');
        var previewImg = document.getElementById('imagePreviewImg');
        if (!preview || !previewImg) return;
        if (url && url.trim()) {
            previewImg.src = this._safeImageUrl(url);
            previewImg.onerror = function() {
                previewImg.onerror = null;
                previewImg.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="200" height="100" fill="%231a1a1a"%3E%3Crect width="200" height="100" rx="4"/%3E%3Ctext x="50%25" y="50%25" fill="%23555" font-size="12" text-anchor="middle" dy=".3em"%3EURL invalida%3C/text%3E%3C/svg%3E';
            };
            preview.style.display = 'block';
        } else {
            preview.style.display = 'none';
        }
    };

    StoryController.prototype._hideImagePreview = function() {
        var preview = document.getElementById('imagePreview');
        if (preview) preview.style.display = 'none';
    };

    /* -- Imagen local ------------------------------------ */

    StoryController.prototype._handleImageFile = function(files) {
        if (!files || !files.length) return;
        var file = files[0];
        if (!file.type.startsWith('image/')) {
            Toast.show('Selecciona un archivo de imagen', 'error');
            return;
        }
        this._imageFile = file;
        this._formDirty = true;

        var reader = new FileReader();
        reader.onload = function(e) {
            var preview = document.getElementById('imagePreview');
            var previewImg = document.getElementById('imagePreviewImg');
            if (preview && previewImg) {
                previewImg.src = e.target.result;
                preview.style.display = '';
            }
        };
        reader.readAsDataURL(file);
    };

    StoryController.prototype._clearImageFile = function() {
        this._imageFile = null;
        var fileInput = document.getElementById('formImageFile');
        if (fileInput) fileInput.value = '';
        this._hideImagePreview();
    };

    StoryController.prototype._prepareImage = function(data) {
        var self = this;
        if (!this._imageFile) return Promise.resolve(data);
        if (!this._storage) {
            Toast.show('La subida de imagenes no esta disponible', 'error');
            return Promise.reject(new Error('Storage no disponible'));
        }

        Toast.show('Subiendo imagen...', 'info');
        return this._storage.uploadImage(this._imageFile, 'stories').then(function(url) {
            data.image = url;
            self._imageFile = null;
            return data;
        }).catch(function(err) {
            Toast.show('Error al subir la imagen: ' + (err.message || 'desconocido'), 'error');
            throw err;
        });
    };

    StoryController.prototype._safeImageUrl = function(url) {
        if (!url || typeof url !== 'string') return '';
        var trimmed = url.trim();
        if (!trimmed) return '';
        var lower = trimmed.toLowerCase();
        if (lower.indexOf('javascript:') === 0) return '';
        if (lower.indexOf('data:text/html') === 0) return '';
        return trimmed;
    };

    window.Backstage.Controllers.Story = StoryController;
})();
