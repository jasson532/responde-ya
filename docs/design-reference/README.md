# Referencia de diseño

`nefrocontigo-prototipo.jpeg` es el prototipo de **NefroContigo** que el equipo usó como
referencia visual para RespondeYa. No es material propio y no se distribuye con la
aplicación: vive aquí, fuera de `src/`, para que nunca entre en el bundle.

## Qué se tomó de ahí

| Patrón del prototipo                        | Dónde está en RespondeYa                              |
| ------------------------------------------- | ----------------------------------------------------- |
| Barra de pestañas inferior                  | `shared/components/organisms/BottomNav`               |
| Barra superior con volver y título centrado | `shared/components/organisms/TopBar`                  |
| Rejilla de fichas con icono grande          | `content/components/molecules/ModuleTile`             |
| Icono en contenedor con tinte pastel        | `shared/components/atoms/IconBubble`                  |
| Filtros en pastilla                         | `shared/components/atoms/Chip`                        |
| Anillo de progreso                          | `shared/components/atoms/ProgressRing`                |
| Filas de lista con chevron                  | `shared/components/molecules/ListRow`                 |
| Radios amplios y sombras difusas            | `styles/_variables.scss`                              |

## Qué NO se tomó

La paleta. NefroContigo es azul y verde; RespondeYa mantiene el rojo de urgencia como
primario y el azul marino de su propia marca para la tipografía.
