# RespondeYA

Guía interactiva de primeros auxilios para personas sin formación clínica. El contenido se
organiza en **módulos** (reanimación, atragantamiento, hemorragias...) que un administrador
crea y publica, y que cualquier persona usuaria consulta paso a paso.

> **Aviso.** El contenido incluido hoy es material de relleno **no validado clínicamente**.
> Ver [Contenido semilla](#contenido-semilla) antes de usar la app con usuarios reales.

## Roles

| Rol     | Puede hacer                                                                 |
| ------- | --------------------------------------------------------------------------- |
| `user`  | Buscar módulos publicados, abrirlos y recorrer su contenido interactivo     |
| `admin` | Todo lo anterior, más crear, editar, publicar y eliminar módulos y secciones |

La autorización se aplica en el router (`ProtectedRoute allowedRoles`), no dentro de cada
página. Una persona autenticada sin el rol requerido aterriza en `/sin-permisos`, no en el
login: su sesión es válida, lo que le falta es permiso.

## Stack

| Pieza           | Elección             | Por qué                                              |
| --------------- | -------------------- | ---------------------------------------------------- |
| Build           | Vite 8               | Mismo stack que el resto de los proyectos del equipo |
| UI              | React 19 + TypeScript| Estándar ADL, sin `any` ni `PropTypes`               |
| Estado global   | Redux Toolkit 2      | Slices por módulo, hooks tipados                     |
| Rutas           | React Router 7       | Rutas por módulo con lazy loading                    |
| Estilos         | SCSS co-locado       | Tokens en `src/styles`, BEM por componente           |
| HTTP            | Axios (singleton)    | Interceptors centralizados de auth y errores         |
| Lint            | oxlint + prettier    | Igual que `alaria-app`                               |
| Iconos          | lucide-react         | Registro cerrado en `content/constants/moduleIcons`  |

## Arranque

```bash
npm install
cp .env.example .env
npm run dev          # http://localhost:5173
```

Cuentas de demostración (visibles en la pantalla de login con el driver `local`):

| Rol   | Correo                   | Contraseña  |
| ----- | ------------------------ | ----------- |
| admin | admin@respondeya.app     | admin123    |
| user  | usuario@respondeya.app   | usuario123  |

## Scripts

| Script              | Qué hace                                  |
| ------------------- | ----------------------------------------- |
| `npm run dev`       | Servidor de desarrollo                    |
| `npm run build`     | Verificación de tipos + bundle producción |
| `npm run typecheck` | Solo verificación de tipos                |
| `npm run lint`      | oxlint                                    |
| `npm run format`    | prettier sobre `src`                      |

## Arquitectura

Módulos por dominio de negocio, según el steering `estructura-proyecto` del power
`react-power-simple`. Ningún módulo de dominio importa de otro; todo lo transversal vive en
`shared`.

```
src/
├── styles/                      # Tokens, mixins, reset, global
└── modules/
    ├── shared/                  # Infraestructura y UI genérica
    │   ├── components/          #   atoms → molecules → organisms → templates → pages
    │   ├── store/               #   configureStore + hooks tipados + uiSlice
    │   ├── services/            #   httpClient, logger, appConfig, localStore (singletons)
    │   ├── hooks/ utils/ types/ constants/
    │   └── index.ts             #   contrato público
    ├── auth/                    # Sesión y roles
    │   ├── services/            #   auth.local.repository | auth.http.repository
    │   ├── store/authSlice.ts
    │   └── routes.tsx
    └── content/                 # Módulos de primeros auxilios (el dominio central)
        ├── components/          #   StepsSequence, QuizCard, InteractiveChecklist, ...
        ├── services/            #   content.local.repository | content.http.repository
        ├── store/contentSlice.ts
        ├── pages/               #   catálogo, detalle, admin (listado y formulario)
        └── routes.tsx           #   contentRoutes + contentAdminRoutes
```

### Naming: "módulo" significa dos cosas

Hay módulos de código (`src/modules/*`) y módulos de contenido (lo que crea el admin). Para
que no se confundan, la entidad de negocio se llama **siempre** `ContentModule` en el código
y se muestra como "módulo" en la interfaz.

### Persistencia intercambiable

El backend aún no está decidido, así que la app no depende de ninguno. Cada dominio define un
contrato (`ContentRepository`, `AuthRepository`) con dos implementaciones:

```
Componente → thunk → *.service.ts → ┬→ *.local.repository.ts  (localStorage)
                                    └→ *.http.repository.ts   (Axios)
```

`VITE_PERSISTENCE_DRIVER` elige cuál se usa. Pasar a una API real o a Supabase es escribir un
adaptador nuevo: ni los componentes ni los thunks cambian.

### Bloques de contenido

Una sección (`Lesson`) es una lista de bloques. `ContentBlock` es una unión discriminada por
`kind`, y `ContentBlockRenderer` hace un `switch` exhaustivo: agregar un tipo de bloque sin
renderizarlo **rompe la compilación**, no la pantalla del usuario.

| `kind`          | Se renderiza como                                      |
| --------------- | ------------------------------------------------------ |
| `paragraph`     | Texto explicativo                                      |
| `steps`         | Pasos numerados que el usuario marca a medida que avanza |
| `warning`       | Advertencia destacada (`isCritical` cambia el tono)    |
| `checklist`     | Lista verificable con contador de progreso             |
| `image`         | Figura con `alt` obligatorio                           |
| `video`         | Video con controles nativos                            |
| `quiz`          | Pregunta con retroalimentación en región `aria-live`   |
| `emergencyCall` | Enlace `tel:` que marca directo desde el móvil         |

## Decisiones de accesibilidad

No son adorno: una persona usa esto bajo estrés, con una mano, a veces a oscuras.

- Áreas de toque mínimas de 44px en todo control interactivo.
- `aria-invalid` como único mecanismo de error en los campos: sirve de contrato de
  accesibilidad y de gancho de estilo a la vez.
- `LinkButton` para acciones que navegan y `Button` para acciones que ejecutan. Nunca un
  `Link` dentro de un `button`.
- `prefers-reduced-motion` respetado globalmente.
- Enlace "saltar al contenido" en el layout principal.

## Contenido semilla

`src/modules/content/services/content.seed.ts` trae tres módulos de ejemplo (reanimación,
atragantamiento, hemorragia). Resumen guías de primeros auxilios de difusión general y **no
han sido revisados por personal de salud**. Existen solo para que la app sea demostrable y
para ejercitar el renderizador de bloques.

Antes de cualquier uso real: reemplazar ese archivo con el contenido oficial validado y citar
la fuente en cada módulo.

## Seguridad: qué falta para producción

`auth.local.repository.ts` valida credenciales **en el navegador** contra una lista fija. No
hay hashing, no hay servidor y el token no está firmado. Es un adaptador de demostración.

Para producción hay que escribir un adaptador contra el IdP real (mismo contrato
`AuthRepository`) y mover la autorización de escritura al backend: hoy el guard de rol es de
interfaz, no de seguridad.

## Pendiente

- [ ] Editor visual de bloques de contenido (hoy las secciones se crean vacías)
- [ ] Reordenar módulos y secciones por arrastre
- [ ] Subida de imágenes y video
- [ ] Modo offline con service worker
- [ ] Pruebas unitarias (Vitest + Testing Library)
