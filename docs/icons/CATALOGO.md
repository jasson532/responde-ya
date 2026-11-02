# Catálogo de iconos sanitarios

De dónde salen los iconos de módulo y cómo traer uno nuevo.

| | |
| --- | --- |
| Proyecto | [Health Icons](https://healthicons.org) |
| Repositorio | [resolvetosavelives/healthicons](https://github.com/resolvetosavelives/healthicons) |
| Licencia | **CC0-1.0** (dominio público): uso comercial, edición y republicación, sin atribución |
| Estilo | `outline`, 48×48, `fill="currentColor"` |

## Cómo funciona

Hay dos listas y conviene no confundirlas:

- **El catálogo** es el diccionario `CATALOG` de `generar.py`. Es todo lo que *se puede*
  instalar. Estar aquí **no pesa nada en el bundle**.
- **Lo instalado** son los `.svg` que están descargados en
  `src/modules/shared/assets/icons/health/`. Solo eso acaba en el bundle.

El generador cruza las dos: produce un componente por cada icono del catálogo que tenga su
SVG descargado, y omite el resto sin error.

```
CATALOG (generar.py)  ∩  *.svg descargados  ──►  healthIconNodes.tsx  ──►  bundle
```

Así se puede ampliar el catálogo libremente y pagar solo por lo que se usa.

## Ver el catálogo

```bash
python3 docs/icons/generar.py --listar
```

## Instalar un icono del catálogo

1. Pide el comando de descarga:

   ```bash
   python3 docs/icons/generar.py --url burn
   ```

2. Ejecuta lo que imprima (descarga el SVG a la carpeta de assets).
3. Regenera:

   ```bash
   python3 docs/icons/generar.py \
     src/modules/shared/assets/icons/health \
     src/modules/shared/components/atoms/HealthIcon/healthIconNodes.tsx
   ```

El tipo `HealthIconName`, los nodos SVG y las etiquetas en español salen de ahí. No hay que
tocar `moduleIcons.tsx`.

## Añadir un icono que NO está en el catálogo

1. Búscalo en [healthicons.org](https://healthicons.org) y apunta su **categoría y nombre**
   (ej. `devices/syringe`).
2. Añade la entrada a `CATALOG` en `docs/icons/generar.py`:

   ```python
   'syringe': ('devices/syringe', 'Inyección'),
   ```

   La clave es semántica y **se guarda en los datos** (`iconName` de cada módulo), así que
   cambiarla después rompe el icono de los módulos existentes. Elígela pensando en el uso, no
   en el dibujo: `bleeding`, no `blood-drop`.
3. Descarga y regenera como en la sección anterior.

## Reglas

- **No editar `healthIconNodes.tsx` a mano.** Está generado. Copiar un atributo `d` a ojo es
  como se cuelan iconos sutilmente deformados que nadie detecta hasta producción.
- **No renombrar claves ya usadas.** Si hay que hacerlo, añade el nombre viejo a
  `LEGACY_ICON_ALIASES` en `moduleIcons.tsx`, igual que se hizo al migrar desde Lucide.
- **Solo estilo `outline`.** Mezclar `filled` y `outline` rompe la coherencia visual.
- **Lucide se queda para la interfaz** (chevrons, buscar, navegación). Health Icons es solo
  para el dominio. Los dos sets nunca coinciden en la misma fila, que es lo que delataría la
  diferencia de trazo.

## Coste actual

20 iconos instalados: **41 kB sin comprimir, ~16 kB gzip**, en su propio chunk
(`moduleIcons-*.js`). Son ~820 bytes gzip por icono, frente a ~340 de Lucide: están dibujados
a 48×48 con bastante más detalle, y ese detalle es justo el motivo de usarlos (el icono de RCP
muestra la maniobra, no un corazón genérico).

Si hiciera falta recortar, la vía es quitar del catálogo los que el administrador no vaya a
elegir nunca y borrar sus SVG. Ten en cuenta que **los 20 son la paleta del selector del
administrador**: reducirlos convierte «crear un módulo con otro icono» en una tarea de
desarrollo, no de administración.

## Hueco conocido

**No existe icono de atragantamiento.** Busqué `chok`, `airway`, `breath` y `compress` en las
628 entradas indexadas del set. Ese módulo usa `lungs` (vías respiratorias), que es lo más
cercano. CC0 permite dibujar uno partiendo de estos si se quiere algo específico.
