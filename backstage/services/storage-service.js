(function() {
    window.Backstage = window.Backstage || {};
    window.Backstage.Services = window.Backstage.Services || {};

    function StorageService() {
        this._storage = null;
        try {
            var wbf = window.WhiteBoxFirebase;
            if (wbf && wbf.app && typeof firebase !== 'undefined' && firebase.storage) {
                this._storage = firebase.storage();
            }
        } catch (e) {
            console.warn('[StorageService] Firebase Storage no disponible:', e.message);
        }
    }

    StorageService.prototype.isAvailable = function() {
        return !!this._storage;
    };

    StorageService.prototype.uploadImage = function(file, folder) {
        return new Promise(function(resolve, reject) {
            if (!this._storage) {
                reject(new Error('Firebase Storage no disponible'));
                return;
            }
            if (!file || !file.type || !file.type.startsWith('image/')) {
                reject(new Error('Archivo no válido. Selecciona una imagen.'));
                return;
            }

            var ext = file.name.split('.').pop() || 'jpg';
            var filename = Date.now() + '_' + Math.random().toString(36).substring(2, 8) + '.' + ext;
            var fullPath = (folder || 'gallery') + '/' + filename;
            var storageRef = this._storage.ref(fullPath);

            var self = this;
            var reader = new FileReader();
            reader.onload = function(e) {
                self._compressImage(e.target.result, 1600, 0.8, function(compressed) {
                    var blob = self._dataURLtoBlob(compressed);
                    var uploadTask = storageRef.put(blob, {
                        contentType: 'image/jpeg',
                        customMetadata: { uploadTimestamp: String(Date.now()) }
                    });

                    uploadTask.on('state_changed',
                        function(snapshot) {
                            var progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
                        },
                        function(error) {
                            reject(error);
                        },
                        function() {
                            uploadTask.snapshot.ref.getDownloadURL().then(function(url) {
                                resolve(url);
                            }).catch(reject);
                        }
                    );
                });
            };
            reader.onerror = function() { reject(new Error('Error al leer el archivo')); };
            reader.readAsDataURL(file);
        }.bind(this));
    };

    StorageService.prototype.uploadMultiple = function(files, folder) {
        if (!files || files.length === 0) return Promise.resolve([]);
        var promises = [];
        for (var i = 0; i < files.length; i++) {
            promises.push(this.uploadImage(files[i], folder));
        }
        return Promise.all(promises);
    };

    StorageService.prototype._compressImage = function(dataUrl, maxSize, quality, callback) {
        var img = new Image();
        img.onload = function() {
            var w = img.width;
            var h = img.height;
            if (w > maxSize || h > maxSize) {
                if (w > h) { h = Math.round(h * maxSize / w); w = maxSize; }
                else { w = Math.round(w * maxSize / h); h = maxSize; }
            }
            var canvas = document.createElement('canvas');
            canvas.width = w;
            canvas.height = h;
            canvas.getContext('2d').drawImage(img, 0, 0, w, h);
            callback(canvas.toDataURL('image/jpeg', quality));
        };
        img.onerror = function() { callback(dataUrl); };
        img.src = dataUrl;
    };

    StorageService.prototype._dataURLtoBlob = function(dataUrl) {
        var parts = dataUrl.split(',');
        var mime = parts[0].match(/:(.*?);/)[1];
        var bytes = atob(parts[1]);
        var ab = new ArrayBuffer(bytes.length);
        var ia = new Uint8Array(ab);
        for (var i = 0; i < bytes.length; i++) {
            ia[i] = bytes.charCodeAt(i);
        }
        return new Blob([ab], { type: mime });
    };

    window.Backstage.Services.Storage = StorageService;
})();
