#!/usr/bin/env python3
"""Genera el modulo TSX de iconos a partir de los SVG presentes en el repo.

MODELO: el CATALOGO de abajo es todo lo que se puede instalar; los ARCHIVOS
presentes en la carpeta de assets determinan lo que esta instalado de verdad.
Un icono del catalogo cuyo SVG no esta descargado se omite sin error.

Asi el bundle solo carga los iconos en uso, y anadir uno es descargar su SVG y
volver a ejecutar este script. Ver docs/icons/CATALOGO.md.

Uso:
  python3 docs/icons/generar.py <carpeta-svg> <archivo-tsx-salida>
  python3 docs/icons/generar.py --listar          # catalogo completo
  python3 docs/icons/generar.py --url <clave>     # URL de descarga de un icono
"""
import sys
import xml.etree.ElementTree as ET
from pathlib import Path

SVG_NS = 'http://www.w3.org/2000/svg'
ET.register_namespace('', SVG_NS)

RAW_BASE = (
    'https://raw.githubusercontent.com/resolvetosavelives/healthicons'
    '/main/public/icons/svg/outline'
)

# ---------------------------------------------------------------------------
# CATALOGO: clave semantica -> (ruta en healthicons, etiqueta en espanol)
#
# Anadir aqui cualquier icono que pueda hacer falta. Estar en el catalogo NO
# mete nada en el bundle: solo pesa lo que tenga su .svg descargado.
# ---------------------------------------------------------------------------
CATALOG = {
    # --- Riesgo vital ---
    'cpr': ('people/cpr', 'Reanimación cardiopulmonar'),
    'heartbeat': ('symbols/heartbeat', 'Paro cardiaco o pulso'),
    'defibrillator': ('devices/defibrillator', 'Desfibrilador (DEA)'),
    'lungs': ('body/lungs', 'Vías respiratorias o atragantamiento'),
    'bleeding': ('body/blood-drop', 'Hemorragia o sangrado'),
    # --- Lesiones ---
    'burn': ('conditions/burn', 'Quemadura'),
    'chemical-burn': ('conditions/chemical-burn', 'Quemadura química'),
    'wound': ('objects/bandage-adhesive', 'Herida o curación'),
    'bone': ('body/bone', 'Fractura'),
    'head': ('body/head', 'Golpe en la cabeza'),
    'electricity': ('symbols/electricity', 'Electrocución'),
    # --- Intoxicaciones y riesgos ---
    'poison': ('symbols/poison', 'Intoxicación'),
    'hazardous': ('symbols/hazardous', 'Material peligroso'),
    'pills': ('medications/blister-pills_oval_x1', 'Medicamentos'),
    # --- Valoracion ---
    'thermometer': ('devices/thermometer', 'Fiebre o temperatura'),
    'stethoscope': ('devices/stethoscope', 'Valoración o consulta'),
    'pulse-oximeter': ('devices/pulse-oximeter', 'Signos vitales'),
    # --- Servicios ---
    'ambulance': ('vehicles/ambulance', 'Traslado o emergencias'),
    'emergency-post': ('places/emergency-post', 'Puesto de emergencias'),
    'alert-triangle': ('symbols/alert-triangle', 'Advertencia'),
}

# atributos SVG que en JSX van en camelCase
JSX_ATTRS = {
    'fill-rule': 'fillRule',
    'clip-rule': 'clipRule',
    'stroke-width': 'strokeWidth',
    'stroke-linecap': 'strokeLinecap',
    'stroke-linejoin': 'strokeLinejoin',
    'stroke-dasharray': 'strokeDasharray',
    'fill-opacity': 'fillOpacity',
    'stroke-opacity': 'strokeOpacity',
}


def filename_for(source: str) -> str:
    """people/cpr -> people_cpr.svg"""
    return source.replace('/', '_') + '.svg'


def render_node(node, indent: int) -> str:
    tag = node.tag.replace(f'{{{SVG_NS}}}', '')
    attrs = []
    for name, value in node.attrib.items():
        name = name.replace(f'{{{SVG_NS}}}', '')
        attrs.append(f'{JSX_ATTRS.get(name, name)}="{value}"')
    pad = ' ' * indent
    return f'{pad}<{tag} {" ".join(attrs)} />' if attrs else f'{pad}<{tag} />'


def generate(svg_dir: Path, out_file: Path) -> int:
    installed, skipped = [], []

    for key, (source, label) in CATALOG.items():
        path = svg_dir / filename_for(source)
        if not path.exists():
            skipped.append(key)
            continue

        root = ET.fromstring(path.read_text(encoding='utf-8'))
        children = [render_node(child, 6) for child in root]
        if not children:
            skipped.append(key)
            continue

        installed.append((key, source, label, children))

    if not installed:
        print('ERROR: no hay ningun SVG en', svg_dir, file=sys.stderr)
        return 1

    keys = '\n'.join(f"  | '{key}'" for key, _, _, _ in installed)

    nodes = '\n'.join(
        f'  // {label} — healthicons {source}\n'
        f"  '{key}': (\n    <>\n" + '\n'.join(children) + '\n    </>\n  ),'
        for key, source, label, children in installed
    )

    labels = '\n'.join(f"  '{key}': '{label}'," for key, _, label, _ in installed)

    out_file.write_text(
        '/* eslint-disable */\n'
        '// ARCHIVO GENERADO. No editar a mano.\n'
        '//\n'
        '// Fuente: Health Icons (https://healthicons.org), licencia CC0-1.0.\n'
        '//\n'
        '// Solo contiene los iconos cuyo SVG esta descargado en\n'
        '// `shared/assets/icons/health/`. El catalogo completo de lo que se\n'
        '// puede instalar esta en `docs/icons/CATALOGO.md`.\n'
        '//\n'
        '// Regenerar:\n'
        '//   python3 docs/icons/generar.py \\\n'
        '//     src/modules/shared/assets/icons/health \\\n'
        '//     src/modules/shared/components/atoms/HealthIcon/healthIconNodes.tsx\n'
        '\n'
        "import type { ReactNode } from 'react';\n"
        '\n'
        'export type HealthIconName =\n'
        f'{keys};\n'
        '\n'
        '/** Nodos internos de cada icono. El `<svg>` contenedor lo pone `HealthIcon`. */\n'
        'export const HEALTH_ICON_NODES: Readonly<Record<HealthIconName, ReactNode>> = {\n'
        f'{nodes}\n'
        '};\n'
        '\n'
        '/** Etiquetas del selector del administrador. */\n'
        'export const HEALTH_ICON_LABELS: Readonly<Record<HealthIconName, string>> = {\n'
        f'{labels}\n'
        '};\n',
        encoding='utf-8',
    )

    print(f'instalados {len(installed)}: {", ".join(k for k, _, _, _ in installed)}')
    if skipped:
        print(f'\nen el catalogo pero SIN descargar ({len(skipped)}):')
        print('  ' + ', '.join(skipped))
        print('\nPara instalar uno:  python3 docs/icons/generar.py --url <clave>')
    return 0


def main(argv: list[str]) -> int:
    if '--listar' in argv:
        print(f'{"clave":18} {"healthicons":34} etiqueta')
        for key, (source, label) in CATALOG.items():
            print(f'{key:18} {source:34} {label}')
        return 0

    if '--url' in argv:
        key = argv[argv.index('--url') + 1]
        if key not in CATALOG:
            print(f'ERROR: "{key}" no esta en el catalogo', file=sys.stderr)
            return 1
        source, _ = CATALOG[key]
        print(
            f'curl -o src/modules/shared/assets/icons/health/{filename_for(source)} \\\n'
            f'  {RAW_BASE}/{source}.svg'
        )
        return 0

    if len(argv) < 3:
        print(__doc__, file=sys.stderr)
        return 1

    return generate(Path(argv[1]), Path(argv[2]))


if __name__ == '__main__':
    sys.exit(main(sys.argv))
