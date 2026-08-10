/* ============================================
   Importa data/soundscapes-seed.json a Firestore
   (coleccion "soundscapes").

   Requisitos:
     npm install firebase-admin

   Uso (desde la raiz del proyecto):
     $env:FIREBASE_SERVICE_ACCOUNT = "RUTA_A_serviceAccountKey.json"
     node data/import-soundscapes.js
   ============================================ */
'use strict';

var admin = require('firebase-admin');
var fs = require('fs');
var path = require('path');

var serviceAccountPath = process.env.FIREBASE_SERVICE_ACCOUNT || path.join(process.cwd(), 'serviceAccountKey.json');
if (!fs.existsSync(serviceAccountPath)) {
    console.error('No se encontro el archivo de credenciales: ' + serviceAccountPath);
    process.exit(1);
}

admin.initializeApp({
    credential: admin.credential.cert(serviceAccountPath)
});

var db = admin.firestore();
var seed = require('./soundscapes-seed.json');

function run() {
    var chain = Promise.resolve();
    seed.forEach(function (item) {
        chain = chain.then(function () {
            var id = item.id;
            var doc = {};
            Object.keys(item).forEach(function (k) {
                if (k !== 'id') doc[k] = item[k];
            });
            return db.collection('soundscapes').doc(id).set(doc).then(function () {
                console.log('Ok:', id, item.title);
            });
        });
    });
    return chain.then(function () {
        console.log('Listo. Importados', seed.length, 'soundscapes.');
    });
}

run().then(function () {
    process.exit(0);
}).catch(function (err) {
    console.error(err);
    process.exit(1);
});
