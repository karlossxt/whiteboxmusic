# BACKSTAGE STUDIO v0.2 — CHANGELOG

## v0.2.0 — 2026-07-26

### Seguridad

- **[CRÍTICO] Corregido XSS en vista previa de autor** — El campo `author` se inyectaba con `innerHTML` sin escape. Ahora usa `textContent` y `createTextNode`. (`story-controller.js`)
- **[ALTA] Agregada validación de URL de imagen** — Nueva función `safeImageUrl()` bloquea protocolos `javascript:` y `data:text/html`. Aplicada en controller, view y sitio público. (`story-controller.js`, `story-view.js`, `stories.js`)
- **[ALTA] Prevención de loops infinitos en onerror** — Todos los handlers `img.onerror` ahora ejecutan `img.onerror = null` antes de asignar el fallback SVG. (`story-controller.js`, `story-view.js`, `soundscape-view.js`, `stories.js`)

### Bugs corregidos

- **[ALTA] Filtros se pierden tras operaciones CRUD** — Al crear, editar o eliminar una historia, la barra de filtros se recreaba desde cero perdiendo el estado del usuario. Ahora `renderFilterBar()` preserva y restaura los valores de búsqueda, estado, categoría y orden. (`story-view.js:49`, `story-controller.js:50`)
- **[ALTA] Botones del header se duplicaban** — Cada vez que el usuario navegaba a Historias o Soundscapes, se agregaba un botón adicional con el mismo ID. `Header.addAction()` ahora verifica si ya existe un elemento con ese ID. (`header.js:42`)
- **[ALTA] Leak de EventBus en Soundscapes** — `SoundscapeController._bindEvents()` no tenía protección contra múltiples llamadas. Después de 3 navegaciones, se acumulaban 3 listeners idénticos. Agregado guard `_eventsBound`. (`soundscape-controller.js:92-93`)
- **[ALTA] Soundscapes sin protección contra doble clic** — El formulario de Soundscapes no tenía flag `_saving`. Doble clic en Guardar creaba entradas duplicadas. Agregado `_saving` flag con reset en éxito/error. (`soundscape-controller.js:142-143`)
- **[MEDIA] Empty state no diferenciaba "sin datos" de "sin resultados"** — La misma UI se mostraba para una tabla vacía y para una búsqueda sin resultados. Ahora `renderTable()` acepta parámetro `isFiltered` y muestra icono/texto diferentes. (`story-view.js:130`, `story-controller.js:65`)
- **[MEDIA] Confirm callback no se limpiaba en Escape** — Al cerrar el diálogo de confirmación con Escape, el callback quedaba pendiente. Ahora `Confirm.clearCallback()` se expone y es llamado por el handler global de Escape. (`confirm.js`, `modal.js:44`)

### Funcionalidad

- **Multi-pestaña: detección de cambios externos** — Agregado `storage` event listener que detecta cuando `backstage_stories_data` o `backstage_soundscapes_data` cambian en otra pestaña, y refresca automáticamente la vista activa. (`app.js:151-164`)
- **beforeunload para cambios sin guardar** — Al cerrar la pestaña o navegar con cambios pendientes en el formulario, el navegador muestra una advertencia. (`story-controller.js:222-227`)

### Accesibilidad

- **Focus trap en modales** — Al abrir un modal, el foco se muestran al primer elemento enfocable y Tab/Shift+Tab se ciclan dentro del modal. (`modal.js:13-34`)
- **Restauración de foco** — Al cerrar cualquier modal, el foco vuelve al elemento que lo tenía antes de abrirlo. (`modal.js:60,75-78,88-91`)
- **Escape solo cierra el modal más reciente** — Antes Escape cerraba todos los modales activos. Ahora solo cierra el superior (confirm sobre story, por ejemplo). (`modal.js:37-55`)
- **aria-live en Toast** — El contenedor de notificaciones ahora tiene `aria-live="polite"` para que screen readers anuncien los mensajes. (`index.html:241`)

### Imágenes

- **Fallback de imagen en sitio público** — Las imágenes del sitio público ahora tienen `onerror` con fallback SVG y prevención de loops infinitos. (`stories.js:87-93,239-243`)
- **Validación de protocolo en todas las capas** — `safeImageUrl()` se aplica en: controller preview, controller image preview, table thumbnails, mobile cards, public site cards, public site modal. (múltiples archivos)

### Testing

- **Script de stress test** — Nuevo archivo `TEST-STRESS.js` con funciones para generar 100/500/1000 historias de prueba, medir rendimiento, reportar uso de almacenamiento, y limpiar datos de prueba. (`backstage/TEST-STRESS.js`)
- **Reporte QA completo** — Documento con 26+ pruebas ejecutadas, 18 errores encontrados, 16 correcciones aplicadas. (`BACKSTAGE-V0.2-QA-REPORT.md`)

### Archivos modificados

| Archivo | Cambios |
|---------|---------|
| `backstage/controllers/story-controller.js` | XSS fix, safeImageUrl, filter persistence, beforeunload, onerror null |
| `backstage/views/story-view.js` | safeImageUrl, filter preservation, differentiated empty state, onerror null |
| `backstage/components/modal.js` | Focus trap, focus restore, Escape topmost, confirm callback cleanup |
| `backstage/components/confirm.js` | clearCallback method, callback cleanup on action |
| `backstage/components/header.js` | Duplicate button prevention |
| `backstage/controllers/soundscape-controller.js` | _eventsBound guard, _saving flag |
| `backstage/views/soundscape-view.js` | onerror null |
| `backstage/app.js` | Removed duplicate Escape handler, added storage event listener |
| `backstage/index.html` | aria-live on toast container |
| `backstage/datasources/local/local-datasource.js` | (sin cambios v0.2) |
| `backstage/repositories/base-repository.js` | (sin cambios v0.2) |
| `backstage/repositories/story-repository.js` | (sin cambios v0.2) |
| `backstage/services/story-service.js` | (sin cambios v0.2) |
| `backstage/services/dashboard-service.js` | (sin cambios v0.2) |
| `backstage/models/story.js` | (sin cambios v0.2) |
| `js/stories.js` | safeImageUrl, onerror fallback |
| `js/stories-data.js` | (sin cambios v0.2) |
| `backstage/TEST-STRESS.js` | **NUEVO** — script de testing |

### Archivos no modificados

- `backstage/core/event-bus.js`
- `backstage/core/router.js`
- `backstage/datasources/datasource-registry.js`
- `backstage/repositories/story-repository.js`
- `backstage/repositories/soundscape-repository.js`
- `backstage/services/soundscape-service.js`
- `backstage/services/story-service.js`
- `backstage/models/soundscape.js`
- `backstage/templates/*` (excepto empty-state.js que usa innerHTML pero sin datos de usuario)
- `backstage/css/backstage.css`
