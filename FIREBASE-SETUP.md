# FIREBASE SETUP — WhiteBox Music

Guía de configuración de Firebase para el CMS (Backstage Studio) y la conexión de datos
del sitio público (Soundscapes, Stories, Interviews, Configuración).

El proyecto usa **Firebase Web SDK v9 (compat)** cargado por CDN en cada página.

---

## 1. Crear el proyecto en Firebase

1. Entra en <https://console.firebase.google.com>.
2. **Add project** → nómbralo (ej. `whitebox-music-cms`) → crea el proyecto.
   - Puedes desactivar Google Analytics si no lo necesitas.
3. Anota el **Project ID** (ej. `whitebox-music-cms`). Se usa en `js/firebase-config.js`.

## 2. Registrar la app web

1. En la consola: **Project settings → Your apps → Web app (`</>`) **.
2. Dale un apodo (ej. `whitebox-music`) y registra.
3. Copia el objeto de configuración que Firebase te da:

```js
apiKey: "...",
authDomain: "PROYECTO.firebaseapp.com",
projectId: "PROYECTO",
storageBucket: "PROYECTO.firebasestorage.app",
messagingSenderId: "...",
appId: "..."
```

4. Pégalo en `js/firebase-config.js` reemplazando el bloque `firebaseConfig`.

## 3. Instalar Firebase CLI

```powershell
npm install -g firebase-tools
firebase login
```

## 4. Inicializar el proyecto (una sola vez, desde la raíz del repo)

```powershell
firebase init
```

- Selecciona **Firestore** y (opcional) **Hosting**.
- Cuando pregunte por el archivo de reglas usa `firestore.rules` (ya existe).
- Para Hosting usa `public: "."` (o la carpeta que quieras publicar).

## 5. Crear la base de datos Firestore

1. Consola → **Firestore Database → Create database**.
2. Elige **Production mode** (recomendado) y una región cercana (ej. `us-central1`).

## 6. Habilitar autenticación para el admin del CMS

1. Consola → **Authentication → Get started → Sign-in method**.
2. Activa **Email/Password** (y/o Google).
3. Crea el usuario administrador: **Authentication → Users → Add user**
   (ej. `admin@whiteboxmusic.com`).
4. Copia el **UID** de ese usuario (es el campo `User UID` en la lista de usuarios).

## 7. Actualizar el UID admin en las reglas

En `firestore.rules`, reemplaza el UID de la función `isAuthorized()` por el tuyo:

```js
function isAuthorized() {
  return request.auth != null
    && request.auth.uid == 'TU-UID-AQUI';
}
```

> Las escrituras (crear/editar/borrar) solo las permite ese usuario.
> Las lecturas públicas del sitio están limitadas a contenido publicado
> (ej. `resource.data.published == true` en `soundscapes`).

## 8. Desplegar las reglas

```powershell
firebase deploy --only firestore:rules
```

## 9. Cargar los datos iniciales (seed)

La colección `soundscapes` arranca vacía. Dos opciones:

### Opción A — Desde el CMS (recomendada)

1. Abre `backstage/index.html` en el navegador y entra con el usuario admin.
2. En **Soundscapes**, usa **+ Nueva Canción** para crear cada tema, o
   **Restaurar / Importar** si el panel tiene importación de JSON.

### Opción B — Script de importación (Node)

Hay un script listo en `data/import-soundscapes.js` que sube el contenido de
`data/soundscapes-seed.json` (las 5 canciones iniciales).

```powershell
npm install firebase-admin
# Descarga la clave de servicio: Firebase console > Project settings > Service accounts
#   > Generate new private key (guárdala como serviceAccountKey.json en la raíz)
$env:FIREBASE_SERVICE_ACCOUNT = "serviceAccountKey.json"
node data/import-soundscapes.js
```

Verifica en la consola → **Firestore** que exista la colección `soundscapes` con 5 documentos.

## 10. Storage (subida de carátulas) — opcional pero recomendado

1. Consola → **Storage → Get started** (Production mode).
2. Reglas iniciales recomendadas:

```
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    match /{allPaths=**} {
      allow read: if true;
      allow write: if request.auth != null
        && request.auth.uid == 'TU-UID-AQUI';
    }
  }
}
```

3. Despliega: `firebase deploy --only storage`.
4. Si no configuras Storage, el CMS sigue funcionando; solo debes pegar la URL
   de la portada a mano en el formulario.

## 11. Probar el sitio y el CMS en local

Servir la carpeta del proyecto con un servidor estático (requerido por los
módulos ES y las peticiones HTTP):

```powershell
npx http-server -p 8080
# o
python -m http.server 8080
```

- Sitio público: <http://localhost:8080/index.html>
- CMS: <http://localhost:8080/backstage/index.html>

En el CMS inicia sesión con el usuario admin. Crea una canción con **Publicar**
activado y compruébala en <http://localhost:8080/index.html#soundscapes>.

## 12. Desplegar (opcional)

```powershell
firebase deploy
```

Con Hosting configurado en la raíz, el sitio queda en
`https://PROYECTO.web.app` y el CMS en `https://PROYECTO.web.app/backstage/index.html`.

---

## Colecciones usadas por la app

| Colección        | Escritura          | Lectura pública            |
|------------------|--------------------|----------------------------|
| `stories`        | Solo admin         | Todo                       |
| `soundscapes`    | Solo admin         | Solo `published == true`   |
| `interviews`     | Solo admin         | Todo                       |
| `site_content`   | Solo admin         | Todo                       |
| `gallery`        | Solo admin         | Todo                       |
| `site_config`    | Solo admin         | Todo                       |

## Archivos clave

| Archivo                            | Rol                                        |
|------------------------------------|--------------------------------------------|
| `js/firebase-config.js`            | Config web del proyecto Firebase           |
| `js/soundscapes-data.js`           | Carga publicadas desde Firestore (fallback local) |
| `js/soundscapes.js`                | Renderiza el grid y el reproductor         |
| `backstage/index.html`             | Entrada del CMS                            |
| `firestore.rules`                  | Reglas de Firestore                        |
| `data/soundscapes-seed.json`       | Datos iniciales de soundscapes             |
| `data/import-soundscapes.js`       | Importador Node del seed                   |
