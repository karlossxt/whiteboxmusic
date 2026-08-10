# CMS Progressivo — WhiteBox Music

## Concepto

WhiteBox Music opera como un CMS progresivo: el panel **BACKSTAGE** es la única
fuente de verdad y el sitio público consume su contenido. La escritura ocurre
siempre en el panel; la lectura puede venir de **Firestore** (cuando está
disponible) o del **localStorage** (fallback), sin cambios en el diseño público.

```
Backstage (edición) ──► Firestore (sincronización)
        │                        │
        └──► localStorage ───────┘
                                   │
                    js/*-data.js (loaders async)
                                   │
                          Sitio público (solo lectura)
```

## Flujo de datos

1. El panel **Backstage** escribe en el datasource activo (Firestore o local).
2. Cada entidad tiene **dos repositorios**:
   - `*-repository.js` → localStorage (offline, modo local).
   - `firestore-*-repository.js` → Firestore (nube).
3. El **DatasourceRegistry** selecciona el repositorio según disponibilidad
   (Firestore disponible y autenticado → nube; si no → local).
4. Los **services** y **controllers** son *async-aware*: soportan tanto
   repositorios síncronos (local) como asíncronos (Firestore) vía Promesas.
5. El **sitio público** lee con loaders async (`js/stories-data.js`,
   `js/soundscapes-data.js`): Firestore primero, luego localStorage,
   luego datos predeterminados.
6. Los **EventBus** del panel notifican cambios entre módulos del CMS.

## Entidades y colecciones Firestore

| Entidad | Repositorio local | Repositorio Firestore | Colección | Clave localStorage |
|---------|-------------------|-----------------------|-----------|--------------------|
| Historias | `story-repository.js` | `firestore-story-repository.js` | `stories` | `backstage_stories_data` |
| Soundscapes | `soundscape-repository.js` | `firestore-soundscape-repository.js` | `soundscapes` | `backstage_soundscapes_data` |
| Entrevistas | `interview-repository.js` | `firestore-interview-repository.js` | `interviews` | `backstage_interviews_data` |
| Contenido del sitio | `section-repository.js` | `firestore-section-repository.js` | `site_content` | `backstage_site_content` |
| Galería | `gallery-repository.js` | `firestore-gallery-repository.js` | `gallery` | `backstage_gallery_data` |
| Configuración del sitio | `site-config-repository.js` | `firestore-site-config-repository.js` | `site_config` (doc `site`) | `backstage_site_config` |

## Capas del panel (Backstage)

```
HTML (DOM) <-> Controller <-> Service <-> Repository <-> Datasource
                                    |
                              EventBus (pub/sub)
```

| Capa | Responsabilidad |
|------|-----------------|
| **Model** | Constructores tipados (`story.js`, `soundscape.js`, `interview.js`, `site-config.js`) |
| **Repository** | CRUD genérico (`base-repository.js`) + queries específicas por entidad |
| **Service** | Validación + reglas de negocio + emisión de eventos |
| **Controller** | Orquestación UI ↔ Service (async-aware) |
| **View** | Renderizado DOM |
| **DatasourceRegistry** | Swap point local/Firestore |

## Migración y respaldo

- `migrateFromDefaults()` copia datos predeterminados a la fuente activa la
  primera vez (se evita re-ejecución con marcas como `backstage_migration_v1_completed`).
- En modo Firestore los repositorios leen de Firestore y cachean en memoria;
  no escriben en localStorage.
- El modo local mantiene el comportamiento previo: el sitio público lee de
  `backstage_*` con fallback a `wbox_*` y defaults.

## Reglas de Firestore

`firestore.rules` define el acceso por colección. Toda escritura (create,
update, delete) exige `isAuthorized()` (admin autenticado). La lectura
pública está limitada por tipo de contenido:

```
stories     → solo status == 'published'
soundscapes → solo published == true
interviews  → solo published == true
site_content, gallery, site_config → lectura pública
```

La autenticación usa Firebase Auth; `isAuthorized()` verifica el UID del
administrador (`qtguil5JI0ejOeJ0fpiXrxTJvIq2`).

### Decisiones de publicación y sincronización

- **El borrador nunca se expone**: en `stories` el estado se maneja con
  `status` (`'draft' | 'published'`); en `soundscapes`/`interviews` con el
  booleano `published`. Las reglas de Firestore **y** los loaders del sitio
  público (`loadPublished`) filtran lo no publicado en ambas capas.
- **El UID del admin no es un secreto**: Firebase lo expone en los tokens
  públicos de sesión. La seguridad real la da Firebase Auth + Security Rules,
  no el ocultamiento del UID. Por eso puede vivir en el frontend
  (`backstage/auth/admin-config.js`, única fuente) y en `firestore.rules`.
  No debe colocarse en esas variables ninguna contraseña ni credencial.
- **Config no editorial es pública**: `site_content`, `gallery` y
  `site_config` se leen sin filtro porque el sitio los necesita siempre
  (estructura de UI, galería, opciones). El contenido editorial con flujo
  de borrador/publicación vive en `stories`, `soundscapes` e `interviews`.

## Verificación manual

1. Abrir `backstage/index.html` → debe cargar sin errores de consola.
2. Editar una historia/soundscape/entrevista → se persiste en el datasource activo.
3. Con Firestore configurado, las colecciones `stories`, `soundscapes`,
   `interviews`, `site_content`, `gallery`, `site_config` reciben escrituras.
4. Abrir el sitio público → los loaders async prefieren Firestore y caen a local.
5. Crear una historia/entrevista/soundscape como **borrador** y comprobar que
   no aparece en el sitio público (reglas + loaders la filtran).
6. Desde otra sesión (sin login) intentar escribir en Firestore → la regla
   `isAuthorized()` lo rechaza.
