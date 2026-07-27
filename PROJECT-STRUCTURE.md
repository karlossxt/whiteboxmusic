# PROJECT-STRUCTURE — WhiteBox Music

## Estructura activa

```
white/
├── index.html                    ← Sitio público principal
├── styles.css                    ← Estilos del sitio público
├── CNAME                         ← Dominio: whiteboxmusic.com.mx
├── .gitignore
│
├── css/                          ← Estilos modulares del sitio público
│   ├── historias.css
│   ├── soundscapes.css
│   └── stories.css
│
├── js/                           ← JavaScript del sitio público
│   ├── main.js                   ← Menú hamburguesa
│   ├── stories-data.js           ← Fuente de datos unificada (backstage → legacy → defaults)
│   ├── stories.js                ← Renderizado de historias (no cargado actualmente)
│   ├── soundscapes-data.js       ← Fuente de datos unificada
│   └── soundscapes.js            ← Reproductor de soundscapes (no cargado actualmente)
│
├── backstage/                    ← Panel administrativo oficial
│   ├── index.html                ← Punto de entrada del panel
│   ├── app.js                    ← Bootstrap + migración
│   ├── css/backstage.css         ← Estilos del panel
│   ├── core/                     ← EventBus + Router
│   ├── models/                   ← Story + Soundscape constructors
│   ├── datasources/              ← LocalDatasource + DatasourceRegistry
│   ├── repositories/             ← Base + Story + Soundscape repos
│   ├── services/                 ← Story + Soundscape + Dashboard services
│   ├── views/                    ← Dashboard + Story + Soundscape views
│   ├── templates/                ← Generadores de DOM
│   └── components/               ← Sidebar + Header + Modal + Toast + Confirm
│
├── html/                         ← Páginas públicas adicionales
│   ├── historias.html
│   ├── comunidad.html
│   ├── fotos.html
│   ├── descubre.html
│   ├── entrevistas.html
│   ├── quienes.html
│   ├── contacto.html
│   └── ...
│
├── assets/                       ← Assets adicionales (carpeta vacía)
│
├── *.jpg, *.webp, *.png          ← Imágenes del sitio público
│
├── instrucciones.txt             ← Requisitos originales del proyecto
│
├── BACKSTAGE-STUDIO-ARCHITECTURE.md  ← Documentación de arquitectura
├── PROJECT-STRUCTURE.md              ← Este archivo
└── WHITEBOXMUSIC-REPO-COMPARISON.md  ← Comparación del repo retirado
```

## Backups temporales (no editar)

```
├── legacy-admin-backup/          ← Panel admin archivado
│   ├── admin/                    ← Copia completa del panel legado
│   └── LEGACY-ADMIN-README.md   ← Documentación del respaldo
│
└── legacy-repository-backup/     ← Repositorio anidado archivado
    └── whiteboxmusic-repo/       ← Copia del repo (commit cb9f049)
```

## Archivos que no deben editarse directamente

| Archivo | Razón |
|---------|-------|
| `js/stories-data.js` | Fuente de datos unificada — cualquier cambio afecta sitio público y backstage |
| `js/soundscapes-data.js` | Fuente de datos unificada — datos por defecto de soundscapes |
| `backstage/datasources/local/local-datasource.js` | Único punto de acceso a localStorage — no duplicar acceso |
| `backstage/app.js` | Bootstrap — el orden de inicialización es crítico |

## Convenciones

- **Sin frameworks:** Todo vanilla JS (ES5)
- **Sin build tools:** Sin webpack, sin babel, sin npm
- **Namespace:** `window.Backstage` para el panel, globals para el sitio público
- **localStorage:** Solo el datasource accede directamente
- **Likes:** Independientes del contenido editorial (`wbox_story_likes`)
