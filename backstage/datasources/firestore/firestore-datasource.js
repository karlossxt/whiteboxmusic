/* ============================================
   BACKSTAGE STUDIO — Firestore Datasource
   Persistencia con Cloud Firestore.
   Operaciones documentales que relanzan errores
   para que el controlador decida qué mostrar.
   ============================================ */

(function() {
    window.Backstage = window.Backstage || {};

    var ERROR_MESSAGES = {
        'permission-denied': 'Sin permisos de acceso a Firestore.',
        'unauthenticated': 'Sesion no autenticada. Vuelve a iniciar sesion.',
        'unavailable': 'Firestore no esta disponible. Verifica tu conexion.',
        'deadline-exceeded': 'La operacion tardo demasiado. Intenta de nuevo.',
        'not-found': 'El documento solicitado no existe.',
        'failed-precondition': 'Operacion rechazada por el estado actual.',
        'resource-exhausted': 'Cuota de Firestore agotada.'
    };

    function translateError(err) {
        var code = err && err.code ? err.code.replace('firestore/', '') : '';
        var message = ERROR_MESSAGES[code] || (err && err.message ? err.message : 'Error desconocido de Firestore.');
        var translated = new Error(message);
        translated.originalCode = code;
        translated.originalError = err;
        return translated;
    }

    function FirestoreDatasource() {
        this.type = 'firestore';
        this._db = null;
    }

    FirestoreDatasource.prototype._getDb = function() {
        if (!this._db) {
            var wbf = window.WhiteBoxFirebase;
            if (!wbf || !wbf.db) {
                throw new Error('Firestore no disponible');
            }
            this._db = wbf.db;
        }
        return this._db;
    };

    FirestoreDatasource.prototype._collectionRef = function(collection) {
        return this._getDb().collection(collection);
    };

    FirestoreDatasource.prototype.get = function(key) {
        return this._collectionRef(key).get().then(function(snapshot) {
            var items = [];
            snapshot.forEach(function(doc) {
                var data = doc.data();
                data.id = doc.id;
                items.push(data);
            });
            return items;
        }).catch(function(err) {
            console.error('[Backstage] Firestore read error for ' + key, err);
            throw translateError(err);
        });
    };

    FirestoreDatasource.prototype.createDoc = function(collection, data, docId) {
        var colRef = this._collectionRef(collection);
        var ref = docId ? colRef.doc(docId) : colRef.doc();
        var docData = {};
        Object.keys(data).forEach(function(k) {
            if (k !== 'id') docData[k] = data[k];
        });

        return ref.set(docData).then(function() {
            var result = Object.assign({}, docData);
            result.id = ref.id;
            return result;
        }).catch(function(err) {
            console.error('[Backstage] Firestore createDoc error', err);
            throw translateError(err);
        });
    };

    FirestoreDatasource.prototype.updateDoc = function(collection, docId, data) {
        var docData = {};
        Object.keys(data).forEach(function(k) {
            if (k !== 'id') docData[k] = data[k];
        });

        return this._collectionRef(collection).doc(docId).set(docData, { merge: true }).then(function() {
            var result = Object.assign({}, docData);
            result.id = docId;
            return result;
        }).catch(function(err) {
            console.error('[Backstage] Firestore updateDoc error', err);
            throw translateError(err);
        });
    };

    FirestoreDatasource.prototype.deleteDoc = function(collection, docId) {
        return this._collectionRef(collection).doc(docId).delete().then(function() {
            return true;
        }).catch(function(err) {
            console.error('[Backstage] Firestore deleteDoc error', err);
            throw translateError(err);
        });
    };

    FirestoreDatasource.prototype.getDoc = function(collection, docId) {
        return this._collectionRef(collection).doc(docId).get().then(function(doc) {
            if (!doc.exists) return null;
            var data = doc.data();
            data.id = doc.id;
            return data;
        }).catch(function(err) {
            console.error('[Backstage] Firestore getDoc error', err);
            throw translateError(err);
        });
    };

    FirestoreDatasource.prototype.getPublished = function(key) {
        return this._collectionRef(key)
            .where('status', '==', 'published')
            .get()
            .then(function(snapshot) {
                var items = [];
                snapshot.forEach(function(doc) {
                    var data = doc.data();
                    data.id = doc.id;
                    items.push(data);
                });
                return items;
            })
            .catch(function(err) {
                console.error('[Backstage] Firestore published read error for ' + key, err);
                throw translateError(err);
            });
    };

    FirestoreDatasource.prototype._generateDocId = function() {
        return 'id-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9);
    };

    window.Backstage.FirestoreDatasource = FirestoreDatasource;
    window.Backstage.FirestoreDatasource.translateError = translateError;
})();
