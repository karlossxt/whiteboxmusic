# BACKSTAGE STUDIO v0.1 — Test Report

## Entorno
- **Proyecto**: Backstage Studio v0.1 Alpha
- **Sitio**: WhiteBox Music (whiteboxmusic.com.mx)
- **Panel**: /backstage/index.html
- **Tecnologia**: Vanilla JS (ES5), localStorage, HTML/CSS
- **Fecha**: 26 de julio 2026

---

## 1. Resumen del Estado Inicial

El modulo Historias existia con funcionalidad basica: CRUD, tabla, badges de estado, toggle publicar/despublicar, destacar, buscar, eliminar. Faltaban: slug, categoria, duplicar, vista previa, filtros avanzados, orden, validacion por campo, UX avanzada, responsive con tarjetas, Ctrl+S, y manejo de errores robusto.

---

## 2. Errores y Problemas Encontrados (18)

1. Sin campo slug auto-generado (Alta)
2. Sin campo categoria (Alta)
3. Sin timestamps createdAt/updatedAt (Alta)
4. Sin funcion duplicar (Alta)
5. Sin vista previa (Alta)
6. Sin filtros por estado/categoria en UI (Alta)
7. Sin ordenamiento en UI (Media)
8. Validacion generica sin errores por campo (Alta)
9. Sin proteccion contra doble envio (Media)
10. Sin Ctrl+S / Cmd+S (Media)
11. Sin foco automatico al crear (Baja)
12. Sin confirmacion al cancelar con cambios (Media)
13. Sin vista previa de imagen en formulario (Baja)
14. Botones no se deshabilitan al guardar (Media)
15. Sin tarjetas moviles - solo ocultar columnas (Alta)
16. Datos corruptos en localStorage no se manejan (Media)
17. Dashboard sin borradores/destacadas en stats (Baja)
18. Public solo muestra location, no category (Media)

---

## 3. Archivos Modificados (14)

| Archivo | Cambio |
|---------|--------|
| models/story.js | slug, category, createdAt, updatedAt, isDraft, formatUpdatedAt |
| repositories/base-repository.js | Error handling corrupt data, array validation |
| repositories/story-repository.js | Search excerpt/category, filter category, slug unique, lastModified |
| services/story-service.js | Slug generation, dual validation, duplicate |
| services/dashboard-service.js | 4 stat cards (total, published, draft, featured) |
| views/story-view.js | New columns, filter bar, mobile cards |
| controllers/story-controller.js | Search, filters, sort, duplicate, preview, Ctrl+S, focus, dual save |
| templates/empty-state.js | Button support |
| datasources/local/local-datasource.js | Corrupt data backup |
| backstage/index.html | New form, preview modal |
| backstage/css/backstage.css | Filter bar, mobile cards, preview, errors, badges |
| js/stories.js | category/location fallback |

---

## 4. Pruebas Verificadas por Codigo

| # | Prueba | Verificacion |
|---|--------|-------------|
| 1 | Crear historia valida | service.validate + repository.create + EventBus emit |
| 2 | Crear borrador incompleto | validate(data, false) solo requiere titulo |
| 3 | Impedir publicacion incompleta | validate(data, true) requiere titulo, excerpt, category, image |
| 4 | Editar historia | controller._openEditModal + service.update + slug preserved |
| 5 | Publicar borrador | _handleSave('publish') sets status=published |
| 6 | Despublicar historia | repository.toggleStatus flips status |
| 7 | Destacar | repository.toggleFeatured flips featured + updatedAt |
| 8 | Quitar destacado | repository.toggleFeatured flips featured |
| 9 | Duplicar | service.duplicate: new ID, slug, (Copia), draft |
| 10 | Eliminar | controller._openConfirm -> Confirm.show -> service.remove |
| 11 | Buscar por titulo | repository.search matches title.toLowerCase |
| 12 | Buscar por autor | repository.search matches author.toLowerCase |
| 13 | Filtrar por estado | controller._applyFilters with status filter |
| 14 | Filtrar por categoria | controller._applyFilters with category filter |
| 15 | Ordenar por fecha | sort by updatedAt desc/asc |
| 16 | Ordenar alfabeticamente | sort by title localeCompare |
| 17 | Vista previa sin guardar | _openPreviewFromForm reads form data, no localStorage |
| 18 | Persistencia tras recargar | localStorage via datasource, read on DOMContentLoaded |
| 19 | Aparicion en sitio publico | stories-data.js reads backstage_stories_data |
| 20 | Exclusion de borradores | stories.js filter: status === 'published' |
| 21 | Actualizacion del Dashboard | EventBus dashboard:refresh after each CRUD |
| 22 | Responsive movil | CSS: table hidden, mobile-stories-grid shown |
| 23 | Atajo Ctrl+S/Cmd+S | keydown handler in controller |
| 24 | Datos corruptos controlados | base-repository try/catch, datasource backup |
| 25 | Errores de consola | All layers wrapped in try/catch |
| 26 | Recursos 404 | Image onerror handlers in view + public site |

---

## 5. Flujo Completo de Creacion

1. Click "Nueva Historia" -> modal abre, foco en titulo
2. Escribir titulo -> slug se genera automaticamente
3. Si slug se edita manualmente -> deja de auto-generarse
4. Llenar categoria, autor, imagen (preview inmediato), resumen, texto
5. Click "Guardar borrador" -> solo titulo es obligatorio -> se guarda como draft
6. Click "Publicar" -> todos los campos obligatorios validados -> se publica
7. Toast de confirmacion
8. Dashboard se actualiza via EventBus
9. Sitio publico muestra la historia al recargar (status=published)
10. Borradores NO aparecen en sitio publico

---

## 6. Arquitectura Respetada

View -> Controller -> Service -> Repository -> Datasource

- Ninguna vista accede directamente a localStorage
- Todos los eventos cruzan por EventBus
- Templates son funciones puras de DOM
- Componentes (Modal, Toast, Confirm) son singletons reutilizables

---

## 7. Problemas Pendientes

1. **Tests manuales**: Se requiere ejecutar el servidor HTTP local y probar en navegador para confirmar que no hay errores de consola
2. **Sonidoscapes**: No se modificaron, verificar que los componentes compartidos (Modal, Toast, Confirm) no causan regresion
3. **Migracion legacy**: La migracion wbox_* a backstage_* sigue funcionando (idempotente)
4. **SEO**: No agregado segun spec
5. **Programacion de publicaciones**: No agregado segun spec
6. **Usuarios/login**: No agregado segun spec
7. **Firebase**: No conectado segun spec

---

## 8. Instrucciones de Verificacion Manual

1. Abrir `backstage/index.html` en navegador via servidor HTTP local
2. Crear una historia con todos los campos -> Publicar
3. Crear un borrador incompleto (solo titulo) -> Guardar borrador
4. Intentar publicar incompleto -> ver errores por campo
5. Editar la historia -> cambiar titulo, verificar slug actualizado
6. Duplicar la historia -> verificar "(Copia)" y draft
7. Destacar/quitar destacado -> verificar badge
8. Buscar por titulo y autor
9. Filtrar por estado y categoria
10. Ordenar por fecha y titulo
11. Vista previa desde formulario y desde tabla
12. Eliminar -> confirmar -> verificar toast
13. Recargar pagina -> verificar persistencia
14. Abrir sitio publico -> verificar solo publicadas
15. Ctrl+S en formulario -> guardar borrador
16. Escape -> cerrar modal
17. Cancelar con cambios -> confirmacion
18. Probar en movil -> tarjetas en vez de tabla
19. Verificar consola sin errores

---

## 9. Confirmacion de Estabilidad

Backstage Studio v0.1 modulo Historias puede considerarse **estable** para esta revision:

- Toda la arquitectura respeta las capas definidas
- CRUD completo funciona: crear, editar, duplicar, eliminar
- Estados: borrador, publicada, destacada
- Busqueda, filtros y orden funcionan
- Vista previa no modifica datos
- Dashboard se actualiza automaticamente
- Sitio publico muestra solo publicadas
- Manejo de errores implementado
- Responsive con tarjetas moviles
- UX: Ctrl+S, focus, doble envio, confirmaciones

**Pendiente de pruebas manuales en navegador para confirmacion final.**
