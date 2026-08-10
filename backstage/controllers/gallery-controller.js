(function() {
    window.Backstage = window.Backstage || {};
    window.Backstage.Controllers = window.Backstage.Controllers || {};

    var Modal = window.Backstage.Components.Modal;
    var Toast = window.Backstage.Components.Toast;
    var Confirm = window.Backstage.Components.Confirm;
    var Header = window.Backstage.Components.Header;

    function GalleryController(galleryService, galleryView) {
        this.service = galleryService;
        this.view = galleryView;
        this._formBound = false;
        this._eventsBound = false;
        this._saving = false;
        this._storage = null;
        try {
            var StorageClass = window.Backstage.Services.Storage;
            if (StorageClass) {
                this._storage = new StorageClass();
            }
        } catch (e) {
            console.warn('[Gallery] StorageService no disponible');
        }
        this._cardFile = null;
        this._sliderFiles = [];
        this._itemsFiles = [];
    }

    GalleryController.prototype.mount = function() {
        this._renderAll();
        this._bindHeader();
        this._bindForm();
        this._bindEvents();
    };

    GalleryController.prototype.unmount = function() {
        Header.hideAll();
    };

    GalleryController.prototype.refresh = function() {
        this._renderAll();
    };

    GalleryController.prototype._renderAll = function() {
        var stats = this.service.getStats();
        var items = this.service.getAll();

        var self = this;
        var actions = {
            preview: function(id) { self._openPreview(id); },
            edit: function(id) { self._openEditModal(id); },
            remove: function(id, title) { self._openConfirm(id, title); }
        };

        this.view.renderStats(stats);
        this.view.renderTable(items, actions);
    };

    GalleryController.prototype._bindHeader = function() {
        Header.addAction({
            id: 'btnAddGallery',
            icon: 'fa-plus',
            label: 'Nuevo Evento',
            onClick: this._openAddModal.bind(this)
        });
    };

    GalleryController.prototype._bindForm = function() {
        if (this._formBound) return;
        this._formBound = true;

        var self = this;

        document.getElementById('galleryForm').addEventListener('submit', function(e) {
            e.preventDefault();
            self._handleFormSubmit();
        });

        document.getElementById('galleryBtnCancel').addEventListener('click', function() {
            Modal.closeAll();
        });

        document.getElementById('galleryModalClose').addEventListener('click', function() {
            Modal.closeAll();
        });

        document.getElementById('galleryModal').addEventListener('click', function(e) {
            if (e.target === document.getElementById('galleryModal')) Modal.closeAll();
        });

        var cardInput = document.getElementById('galleryFormCardImageFile');
        if (cardInput) {
            cardInput.addEventListener('change', function() {
                self._handleCardFile(this.files);
            });
        }

        var cardRemove = document.getElementById('galleryCardRemove');
        if (cardRemove) {
            cardRemove.addEventListener('click', function() {
                self._clearCardFile();
            });
        }

        var sliderInput = document.getElementById('galleryFormSliderFiles');
        if (sliderInput) {
            sliderInput.addEventListener('change', function() {
                self._handleSliderFiles(this.files);
            });
        }

        var itemsInput = document.getElementById('galleryFormItemsFiles');
        if (itemsInput) {
            itemsInput.addEventListener('change', function() {
                self._handleItemsFiles(this.files);
            });
        }
    };

    GalleryController.prototype._handleCardFile = function(files) {
        if (!files || !files.length) return;
        var file = files[0];
        if (!file.type.startsWith('image/')) {
            Toast.show('Selecciona un archivo de imagen', 'error');
            return;
        }
        this._cardFile = file;
        var preview = document.getElementById('galleryCardPreview');
        var previewImg = document.getElementById('galleryCardPreviewImg');
        if (preview && previewImg) {
            var reader = new FileReader();
            reader.onload = function(e) {
                previewImg.src = e.target.result;
                preview.style.display = '';
            };
            reader.readAsDataURL(file);
        }
        document.getElementById('galleryFormCardImage').value = '';
    };

    GalleryController.prototype._clearCardFile = function() {
        var input = document.getElementById('galleryFormCardImageFile');
        var preview = document.getElementById('galleryCardPreview');
        if (input) input.value = '';
        if (preview) preview.style.display = 'none';
        this._cardFile = null;
    };

    GalleryController.prototype._handleSliderFiles = function(files) {
        if (!files || !files.length) return;
        this._sliderFiles = [];
        var container = document.getElementById('gallerySliderPreview');
        if (container) container.textContent = '';

        for (var i = 0; i < files.length; i++) {
            var file = files[i];
            if (!file.type.startsWith('image/')) continue;
            this._sliderFiles.push(file);
            var reader = new FileReader();
            reader.onload = (function(src) {
                return function(e) {
                    var div = document.createElement('div');
                    div.className = 'thumb-item';
                    var img = document.createElement('img');
                    img.src = e.target.result;
                    img.alt = 'Slider';
                    div.appendChild(img);
                    if (src) src.appendChild(div);
                };
            })(container);
            reader.readAsDataURL(file);
        }
    };

    GalleryController.prototype._handleItemsFiles = function(files) {
        if (!files || !files.length) return;
        this._itemsFiles = [];
        var container = document.getElementById('galleryItemsPreview');
        if (container) container.textContent = '';

        var filesArray = [];
        for (var i = 0; i < files.length; i++) {
            if (files[i].type.startsWith('image/')) {
                filesArray.push(files[i]);
            }
        }
        this._itemsFiles = filesArray;

        filesArray.forEach(function(file) {
            var reader = new FileReader();
            reader.onload = (function(c) {
                return function(e) {
                    var div = document.createElement('div');
                    div.className = 'thumb-item';
                    var img = document.createElement('img');
                    img.src = e.target.result;
                    img.alt = 'Gallery';
                    div.appendChild(img);
                    if (c) c.appendChild(div);
                };
            })(container);
            reader.readAsDataURL(file);
        });
    };

    GalleryController.prototype._bindEvents = function() {
        if (this._eventsBound) return;
        this._eventsBound = true;
        var self = this;
        window.Backstage.EventBus.on('gallery:created', function() { self._renderAll(); });
        window.Backstage.EventBus.on('gallery:updated', function() { self._renderAll(); });
        window.Backstage.EventBus.on('gallery:removed', function() { self._renderAll(); });
    };

    GalleryController.prototype._openAddModal = function() {
        document.getElementById('galleryModalTitle').textContent = 'Nuevo Evento Fotográfico';
        document.getElementById('galleryForm').reset();
        document.getElementById('galleryFormId').value = '';
        document.getElementById('galleryFormOrder').value = String(this.service.getMaxOrder() + 1);
        this._resetFormState();
        Modal.open(document.getElementById('galleryModal'));
    };

    GalleryController.prototype._resetFormState = function() {
        this._cardFile = null;
        this._sliderFiles = [];
        this._itemsFiles = [];
        var cardPreview = document.getElementById('galleryCardPreview');
        if (cardPreview) cardPreview.style.display = 'none';
        var sliderPreview = document.getElementById('gallerySliderPreview');
        if (sliderPreview) sliderPreview.textContent = '';
        var itemsPreview = document.getElementById('galleryItemsPreview');
        if (itemsPreview) itemsPreview.textContent = '';
        var uploadProgress = document.getElementById('galleryUploadProgress');
        if (uploadProgress) uploadProgress.style.display = 'none';
        var uploadFill = document.getElementById('galleryUploadFill');
        if (uploadFill) uploadFill.style.width = '0%';
        var cardFileInput = document.getElementById('galleryFormCardImageFile');
        if (cardFileInput) cardFileInput.value = '';
        var sliderFileInput = document.getElementById('galleryFormSliderFiles');
        if (sliderFileInput) sliderFileInput.value = '';
        var itemsFileInput = document.getElementById('galleryFormItemsFiles');
        if (itemsFileInput) itemsFileInput.value = '';
    };

    GalleryController.prototype._openEditModal = function(id) {
        var item = this.service.getById(id);
        if (!item) return;

        this._resetFormState();

        document.getElementById('galleryModalTitle').textContent = 'Editar Evento';
        document.getElementById('galleryFormId').value = item.id;
        document.getElementById('galleryFormTitle').value = item.title || '';
        document.getElementById('galleryFormSubtitle').value = item.subtitle || '';
        document.getElementById('galleryFormCardImage').value = item.cardImage || '';
        document.getElementById('galleryFormIntro').value = item.intro || '';
        document.getElementById('galleryFormOrder').value = String(item.order || 1);

        if (item.cardImage) {
            var preview = document.getElementById('galleryCardPreview');
            var previewImg = document.getElementById('galleryCardPreviewImg');
            if (preview && previewImg) {
                previewImg.src = item.cardImage;
                preview.style.display = '';
            }
        }

        document.getElementById('galleryFormSlider').value = (item.sliderImages || []).join('\n');

        document.getElementById('galleryFormItems').value = (item.galleryItems || []).map(function(gi) {
            return (gi.image || '') + ' | ' + (gi.title || '') + ' | ' + (gi.text || '');
        }).join('\n');

        var sliderPreview = document.getElementById('gallerySliderPreview');
        if (sliderPreview) {
            sliderPreview.textContent = '';
            (item.sliderImages || []).forEach(function(url) {
                var div = document.createElement('div');
                div.className = 'thumb-item';
                var img = document.createElement('img');
                img.src = url;
                img.alt = 'Slider';
                img.onerror = function() { img.style.display = 'none'; };
                div.appendChild(img);
                sliderPreview.appendChild(div);
            });
        }

        Modal.open(document.getElementById('galleryModal'));
    };

    GalleryController.prototype._openConfirm = function(id, title) {
        var self = this;
        var text = title
            ? 'Se eliminará el evento "' + title + '" y todo su contenido. Esta acción no se puede deshacer.'
            : 'Esta acción no se puede deshacer.';

        Confirm.show('Eliminar evento', text, function() {
            self.service.remove(id).then(function() {
                self._renderAll();
                window.Backstage.EventBus.emit('dashboard:refresh');
                Toast.show('Evento eliminado', 'success');
            }).catch(function(err) {
                Toast.show('Error al eliminar: ' + (err.message || 'Error de Firestore'), 'error');
            });
        });
    };

    GalleryController.prototype._openPreview = function(id) {
        var item = this.service.getById(id);
        if (!item) return;
        var content = document.getElementById('previewGalleryContent');
        if (!content) return;

        var html = '<div style="background:#111;border-radius:8px;overflow:hidden;">';
        if (item.cardImage) {
            html += '<img src="' + item.cardImage.replace(/"/g, '&quot;') + '" alt="' + (item.title || '') + '" style="width:100%;height:200px;object-fit:cover;display:block;">';
        }
        html += '<div style="padding:20px;">';
        html += '<h3 style="font-size:1.2rem;font-weight:700;margin-bottom:4px;color:#fff;">' + (item.title || '') + '</h3>';
        if (item.subtitle) html += '<p style="font-size:0.75rem;color:#666;text-transform:uppercase;letter-spacing:2px;margin-bottom:12px;">' + item.subtitle + '</p>';
        if (item.intro) html += '<p style="font-size:0.85rem;color:#999;line-height:1.6;margin-bottom:12px;">' + item.intro + '</p>';
        var sliderCount = (item.sliderImages || []).length;
        var galleryCount = (item.galleryItems || []).length;
        html += '<div style="display:flex;gap:12px;font-size:0.75rem;color:#888;">';
        html += '<span><i class="fa-solid fa-images"></i> ' + sliderCount + ' slider</span>';
        html += '<span><i class="fa-solid fa-camera"></i> ' + galleryCount + ' fotos</span>';
        html += '</div></div></div>';

        content.innerHTML = html;
        document.getElementById('previewModalTitle').textContent = 'Vista previa: ' + (item.title || '');
        Modal.open(document.getElementById('previewGalleryModal'));
    };

    GalleryController.prototype._handleFormSubmit = function() {
        if (this._saving) return;

        var self = this;

        var title = document.getElementById('galleryFormTitle').value.trim();
        if (!title) {
            Toast.show('El título es obligatorio', 'error');
            return;
        }

        var cardImageUrl = document.getElementById('galleryFormCardImage').value.trim();
        var hasCardFile = !!this._cardFile;
        var hasCardUrl = !!cardImageUrl;

        if (!hasCardFile && !hasCardUrl) {
            Toast.show('Debes seleccionar una imagen de portada o ingresar una URL', 'error');
            return;
        }

        this._saving = true;
        this._showProgress(true, 'Preparando imágenes...');

        var existingId = document.getElementById('galleryFormId').value;
        var eventId = existingId || 'evt_' + Date.now() + '_' + Math.random().toString(36).substring(2, 8);

        var folder = 'gallery/' + eventId;

        var uploads = [];

        if (this._cardFile) {
            uploads.push({ type: 'card', promise: this._storage.uploadImage(this._cardFile, folder) });
        }

        if (this._sliderFiles.length > 0) {
            var sliderPromises = [];
            for (var i = 0; i < this._sliderFiles.length; i++) {
                sliderPromises.push(this._storage.uploadImage(this._sliderFiles[i], folder));
            }
            var sliderAll = Promise.all(sliderPromises);
            uploads.push({ type: 'slider', promise: sliderAll });
        }

        if (this._itemsFiles.length > 0) {
            var itemsPromises = [];
            for (var j = 0; j < this._itemsFiles.length; j++) {
                itemsPromises.push(this._storage.uploadImage(this._itemsFiles[j], folder));
            }
            var itemsAll = Promise.all(itemsPromises);
            uploads.push({ type: 'items', promise: itemsAll });
        }

        var total = uploads.length;
        var completed = 0;

        function onOneDone() {
            completed++;
            if (total > 0) {
                var pct = Math.round((completed / total) * 100);
                self._updateProgress(pct, 'Subiendo imágenes... (' + completed + '/' + total + ')');
            }
        }

        function finishUp(cardUrl, sliderUrls, itemsUrls) {
            var sliderRaw = document.getElementById('galleryFormSlider').value;
            var sliderFromTextarea = sliderRaw.split('\n').map(function(s) { return s.trim(); }).filter(function(s) { return s.length > 0; });
            var allSlider = sliderUrls.concat(sliderFromTextarea);

            var itemsRaw = document.getElementById('galleryFormItems').value;
            var itemLines = itemsRaw.split('\n').map(function(s) { return s.trim(); }).filter(function(s) { return s.length > 0; });

            var galleryItems = [];
            var maxItems = Math.max(itemsUrls.length, itemLines.length);
            for (var k = 0; k < maxItems; k++) {
                var imageUrl = itemsUrls[k] || '';
                var lineParts = itemLines[k] ? itemLines[k].split('|').map(function(p) { return p.trim(); }) : [];
                var itemTitle, itemText;
                if (lineParts.length >= 3) {
                    imageUrl = imageUrl || lineParts[0];
                    itemTitle = lineParts[1] || '';
                    itemText = lineParts.slice(2).join(' | ') || '';
                } else {
                    itemTitle = lineParts[0] || '';
                    itemText = lineParts[1] || '';
                }
                if (imageUrl || itemTitle) {
                    galleryItems.push({ image: imageUrl, title: itemTitle, text: itemText });
                }
            }

            var data = {
                title: title,
                subtitle: document.getElementById('galleryFormSubtitle').value.trim(),
                cardImage: cardUrl,
                intro: document.getElementById('galleryFormIntro').value.trim(),
                order: document.getElementById('galleryFormOrder').value,
                sliderImages: allSlider,
                galleryItems: galleryItems
            };

            var promise;
            if (existingId) {
                promise = self.service.update(existingId, data);
            } else {
                if (!data.cardImage && !hasCardUrl) {
                    self._saving = false;
                    self._showProgress(false);
                    Toast.show('Error al subir la imagen de portada', 'error');
                    return;
                }
                promise = self.service.create(data);
            }

            promise.then(function(result) {
                self._saving = false;
                self._showProgress(false);
                if (result && result.success) {
                    Toast.show(existingId ? 'Evento actualizado' : 'Evento creado', 'success');
                    self._renderAll();
                    window.Backstage.EventBus.emit('dashboard:refresh');
                    self._resetFormState();
                    Modal.closeAll();
                } else {
                    var errMsg = (result && result.errors) ? result.errors.join('. ') : 'Error al guardar';
                    Toast.show(errMsg, 'error');
                }
            }).catch(function(err) {
                self._saving = false;
                self._showProgress(false);
                Toast.show('Error al guardar: ' + (err.message || 'desconocido'), 'error');
            });
        }

        function handleError(err) {
            self._saving = false;
            self._showProgress(false);
            Toast.show('Error al subir imágenes: ' + (err.message || 'desconocido'), 'error');
        }

        if (uploads.length === 0) {
            finishUp(
                cardImageUrl || '',
                (document.getElementById('galleryFormSlider').value.split('\n').map(function(s) { return s.trim(); }).filter(function(s) { return s.length > 0; })),
                []
            );
            return;
        }

        var cardUrl = cardImageUrl || '';
        var sliderUrls = [];
        var itemsUrls = [];

        function processUpload(index) {
            if (index >= uploads.length) {
                finishUp(cardUrl, sliderUrls, itemsUrls);
                return;
            }
            var upload = uploads[index];
            upload.promise.then(function(result) {
                if (upload.type === 'card') {
                    cardUrl = result;
                } else if (upload.type === 'slider') {
                    sliderUrls = result;
                } else if (upload.type === 'items') {
                    itemsUrls = result;
                }
                onOneDone();
                processUpload(index + 1);
            }).catch(handleError);
        }

        processUpload(0);
    };

    GalleryController.prototype._showProgress = function(show, status) {
        var el = document.getElementById('galleryUploadProgress');
        var statusEl = document.getElementById('galleryUploadStatus');
        if (el) el.style.display = show ? '' : 'none';
        if (statusEl && status) statusEl.textContent = status;
        var saveBtn = document.getElementById('galleryBtnSave');
        if (saveBtn) saveBtn.disabled = show;
    };

    GalleryController.prototype._updateProgress = function(pct, status) {
        var fill = document.getElementById('galleryUploadFill');
        var statusEl = document.getElementById('galleryUploadStatus');
        if (fill) fill.style.width = Math.min(pct, 100) + '%';
        if (statusEl && status) statusEl.textContent = status;
    };

    window.Backstage.Controllers.Gallery = GalleryController;
})();
