# Health Icons

Iconos del dominio sanitario usados en los módulos de contenido.

| | |
| --- | --- |
| Proyecto | [Health Icons](https://healthicons.org) |
| Repositorio | [resolvetosavelives/healthicons](https://github.com/resolvetosavelives/healthicons) |
| Licencia | **CC0-1.0** (dominio público) |
| Estilo | `outline`, 48×48, `fill="currentColor"` |
| Descargados | 2026-10-27 |

CC0 no exige atribución, uso comercial ni permiso para editar o republicar. Esta ficha está
aquí por trazabilidad nuestra, no por obligación legal: sin ella nadie sabría de dónde salieron
estos archivos ni cómo traer uno nuevo.

## Por qué están copiados y no instalados

El registro de iconos de módulo es un **conjunto cerrado** de 20 entradas, no un catálogo de
miles. Copiar los archivos evita una dependencia de 13 MB y 4080 archivos en `node_modules`,
quita el riesgo de que el *tree-shaking* arrastre el set completo, y nos deja ajustar el trazo
si hiciera falta armonizarlos con Lucide.

## Cómo añadir o cambiar un icono

1. Busca el icono en [healthicons.org](https://healthicons.org) y fíjate en su categoría.
2. Descarga el SVG `outline` a esta carpeta, con el nombre `categoria_icono.svg`:

   ```bash
   curl -o devices_syringe.svg \
     https://raw.githubusercontent.com/resolvetosavelives/healthicons/main/public/icons/svg/outline/devices/syringe.svg
   ```

3. Añade la entrada a `MAPPING` en `docs/icons/generar.py` (clave semántica, archivo, para qué).
4. Regenera el módulo de componentes:

   ```bash
   python3 docs/icons/generar.py \
     src/modules/shared/assets/icons/health \
     src/modules/shared/components/atoms/HealthIcon/healthIconNodes.tsx
   ```

5. Añade su etiqueta en español a `MODULE_ICON_LABELS`
   (`src/modules/content/constants/moduleIcons.tsx`), que es lo que lee el selector del admin.

**No edites `healthIconNodes.tsx` a mano.** Está generado. Copiar un atributo `d` a ojo es
como se cuelan iconos sutilmente deformados que nadie detecta hasta producción.

## Lo que falta

**No hay icono de atragantamiento.** Busqué `chok`, `airway`, `breath` y `compress` en las 628
entradas indexadas y no existe. Ese módulo usa `lungs` (vías respiratorias), que es lo más
cercano y honesto. Si hace falta uno específico, CC0 permite dibujarlo partiendo de estos.
