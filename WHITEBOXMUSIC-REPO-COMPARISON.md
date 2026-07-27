# WHITEBOXMUSIC-REPO — Comparación y retiro

## Resumen
La carpeta `/whiteboxmusic-repo/` era una copia congelada del repositorio Git principal,
contenida dentro del mismo proyecto con su propio directorio `.git` apuntando al mismo remote.

## Origen detectado
- Remote: `https://github.com/karlossxt/whiteboxmusic.git` (mismo que la raíz)
- Último commit: `cb9f049` (3 commits detrás del HEAD actual `c587a12`)
- Contenido: Snapshot de la versión anterior del sitio público

## Diferencias con la raíz

| Aspecto | Raíz (activo) | whiteboxmusic-repo (retirado) |
|---------|---------------|-------------------------------|
| index.html | 1,307 líneas (stories antes de soundscapes, "Ver más") | 1,286 líneas (soundscapes antes, 4 stories sin paginación) |
| Soundscapes | 5 nuevos (Geese, Radio Free Alice, La Plata, Glitch Kingdom, Margot Sinclair) | 5 antiguos (BITTER DONUTS, Protocole, Sidney, Boy In Space, Celine Cairo) |
| Sidebar | 7 items (con LATEST SOUNDSCAPES) | 6 items (sin LATEST SOUNDSCAPES) |
| admin/ | No existía | No existía |
| backstage/ | No existía | No existía |
| js/ modular | No existía | No existía |
| css/ modular | No existía | No existía |
| historias.html | No existía | No existía |
| .git anidado | Propio (raíz) | Mismo remote (riesgo de conflicto) |

## Archivos exclusivos útiles
Ninguno. Todos los archivos de whiteboxmusic-repo existían en la raíz en versiones más recientes.

## Problema del .git anidado
Ambos directorios apuntaban al mismo remote de GitHub. El `.git` anidado podía causar:
- Conflictos en herramientas de CI/CD
- Ambigüedad en `git add .` desde la raíz
- Duplicación del historial

## Acción tomada
Carpeta movida a `/legacy-repository-backup/whiteboxmusic-repo/`
No eliminada definitivamente en esta iteración.
