/* ============================================
   BACKSTAGE STUDIO — Storage Service (Supabase)
   Sube imágenes al bucket público 'images' de
   Supabase Storage y devuelve la URL pública.

   Reemplaza Firebase Storage tras la migración.
   ============================================ */

(function() {
    window.Backstage = window.Backstage || {};
    window.Backstage.Services = window.Backstage.Services || {};

    var BUCKET = 'images';

    function StorageService() {
        this._supabase = null;
        try {
            if (typeof window.getSupabaseClient === 'function') {
                this._supabase = window.getSupabaseClient();
            }
        } catch (e) {
            console.warn('[StorageService] Supabase Storage no disponible:', e.message);
        }
    }

    StorageService.prototype.isAvailable = function() {
        return !!(this._supabase && this._supabase.storage);
    };

    StorageService.prototype.uploadImage = function(file, folder) {
        var self = this;
        return new Promise(function(resolve, reject) {
            if (!self.isAvailable()) {
                reject(new Error('Supabase Storage no disponible'));
                return;
            }
            if (!file || !file.type || !file.type.startsWith('image/')) {
                reject(new Error('Archivo no válido. Selecciona una imagen.'));
                return;
            }

            var ext = file.name.split('.').pop() || 'jpg';
            var filename = Date.now() + '_' + Math.random().toString(36).substring(2, 8) + '.' + ext;
            var fullPath = ((folder || 'gallery') + '/' + filename).replace(/^\/+/, '');

            var reader = new FileReader();
            reader.onload = function(e) {
                self._compressImage(e.target.result, 1600, 0.8, function(compressed) {
                    var blob = self._dataURLtoBlob(compressed);

                    self._supabase.storage.from(BUCKET).upload(fullPath, blob, {
                        contentType: 'image/jpeg',
                        upsert: false
                    }).then(function(resp) {
                        if (resp.error) {
                            reject(resp.error);
                            return;
                        }
                        var url = self._supabase.storage.from(BUCKET).getPublicUrl(fullPath).data.publicUrl;
                        resolve(url);
                    }).catch(reject);
                });
            };
            reader.onerror = function() { reject(new Error('Error al leer el archivo')); };
            reader.readAsDataURL(file);
        });
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