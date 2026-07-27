# BACKSTAGE STUDIO — Arquitectura

## Panel oficial
- **Punto de entrada:** `/backstage/index.html`
- **Panel legado archivado:** `/legacy-admin-backup/admin/` (no usar)

## Arquitectura por capas

```
HTML (DOM) <-> Controller <-> Service <-> Repository <-> Datasource (localStorage)
                                    |
                              EventBus (notificaciones entre módulos)
```

### Capas

| Capa | Archivos | Responsabilidad |
|------|----------|-----------------|
| **Datasource** | `datasources/local/local-datasource.js` | Único punto de acceso a localStorage |
| **DatasourceRegistry** | `datasources/datasource-registry.js` | Swap point para cambiar fuente de datos (Firestore futuro) |
| **Repository** | `repositories/base-repository.js`, `story-repository.js`, `soundscape-repository.js` | CRUD genérico + queries específicas |
| **Service** | `services/story-service.js`, `soundscape-service.js`, `dashboard-service.js` | Validación + reglas de negocio + eventos |
| **Controller** | `controllers/story-controller.js`, `soundscape-controller.js`, `dashboard-controller.js` | Orquestación UI ↔ Service |
| **View** | `views/story-view.js`, `soundscape-view.js`, `dashboard-view.js` | Renderizado DOM |
| **Templates** | `templates/stats-cards.js`, `data-table.js`, `empty-state.js`, `action-buttons.js` | Generadores de DOM reutilizables |
| **Components** | `components/sidebar.js`, `header.js`, `modal.js`, `toast.js`, `confirm.js` | UI compartida |
| **Core** | `core/event-bus.js`, `core/router.js` | Infraestructura (pub/sub + routing) |
| **Models** | `models/story.js`, `models/soundscape.js` |Constructores de datos tipados |
| **Bootstrap** | `app.js` | Inicialización: datasource → repos → services → views → controllers → router |

## Flujo de datos

1. Usuario interactúa con el DOM
2. Controller recibe el evento
3. Controller llama a Service
4. Service valida datos
5. Service llama a Repository
6. Repository serializa y llama a Datasource
7. Datasource escribe a localStorage
8. Service emite evento via EventBus
9. Controller escucha evento y refresca View
10. View actualiza el DOM

## Claves de localStorage

### Panel oficial (Backstage)

| Clave | Propósito |
|-------|-----------|
| `backstage_stories_data` | Array de historias (JSON) |
| `backstage_soundscapes_data` | Array de soundscapes (JSON) |
| `backstage_migration_backup_v1` | Backup de migración (creado una vez) |
| `backstage_migration_v1_completed` | Marca de migración completada |

### Sitio público

| Clave | Propósito |
|-------|-----------|
| `wbox_story_likes` | Likes del usuario por historia (independiente del contenido) |

### Legacy (migradas, ya no escritas por el panel oficial)

| Clave | Propósito |
|-------|-----------|
| `wbox_stories_data` | Datos legacy de historias (fuente de migración) |
| `wbox_soundscapes_data` | Datos legacy de soundscapes (fuente de migración) |

## Estrategia de migración

1. **Al abrir Backstage:** `migrateFromLegacy()` combina datos de `wbox_*` y `backstage_*`
2. **Deduplicación:** Por ID — backstage gana en caso de colisión
3. **Backup:** Se crea `backstage_migration_backup_v1` antes de migrar (una sola vez)
4. **Idempotente:** Marca `backstage_migration_v1_completed` evita re-ejecución
5. **Al abrir sitio público:** `js/stories-data.js` lee de `backstage_stories_data`, fallback a `wbox_stories_data`, fallback a defaults

## Repositorio anidado retirado

La carpeta `whiteboxmusic-repo/` era una copia congelada del repositorio Git (commit `cb9f049`).
Fue retirada a `/legacy-repository-backup/` porque era redundante y contenía un `.git` anidado.

## Instrucciones de ejecución local

```bash
# Opción 1: Python
cd white/
python -m http.server 8000

# Opción 2: Node.js
npx serve .

# Opción 3: PHP
php -S localhost:8000
```

Abrir:
- Sitio público: `http://localhost:8000/`
- Panel administrativo: `http://localhost:8000/backstage/index.html`

## Despliegue en GitHub Pages

1. Push a `main`
2. GitHub Pages sirve desde la raíz
3. Sitio público: `https://whiteboxmusic.com.mx/`
4. Panel: `https://whiteboxmusic.com.mx/backstage/`
