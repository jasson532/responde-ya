# RespondeYa

Guía interactiva de primeros auxilios para personas sin formación clínica. El contenido se
organiza en **módulos** (reanimación, atragantamiento, hemorragias...) que un administrador
crea y publica, y que cualquier persona usuaria consulta paso a paso.

> **Aviso.** El contenido incluido hoy es material de relleno **no validado clínicamente**.
> Ver [Contenido semilla](#contenido-semilla) antes de usar la app con usuarios reales.

## Roles y acceso

| Rol     | Credenciales | Puede hacer                                                      |
| ------- | ------------ | ---------------------------------------------------------------- |
| `user`  | **Ninguna**  | Buscar módulos publicados, abrirlos y recorrer su contenido       |
| `admin` | Correo y contraseña | Todo lo anterior, más crear, editar, publicar y eliminar  |

**El contenido es público.** `user` es el rol por defecto: se obtiene con solo abrir la app.
Nadie tiene que registrarse ni iniciar sesión para ver un protocolo, y un enlace compartido
(`/modulos/mod-rcp-adulto`) abre directo sin pasar por ninguna pantalla intermedia. En una
app de primeros auxilios una pantalla de login cuesta segundos que no se tienen.

`admin` es el único rol que se autentica, y lo único que se custodia es la escritura.

### El flag de admin

`role` en el slice `auth` es la única fuente de verdad, y el flag se deriva de él:

```tsx
import { selectIsAdmin } from 'modules/auth';

const isAdmin = useAppSelector(selectIsAdmin);   // boolean
```

No se guarda además un booleano `isAdmin` en el estado: dos campos describiendo el mismo
hecho se desincronizan en cuanto alguien actualice solo uno.

| Selector                   | Devuelve                                   |
| -------------------------- | ------------------------------------------ |
| `selectIsAdmin`            | `boolean` — el flag                        |
| `selectRole`               | `UserRole.User` o `UserRole.Admin`         |
| `selectAdminUser`          | Datos del admin, o `null` si es anónimo    |
| `selectIsAuthBootstrapped` | Si ya se intentó rehidratar la sesión      |

### Flujo de pantallas

```
/                     Bienvenida: "Ingresar" (directo) | "Soy administrador" (despliega form)
/modulos              Catálogo            → PÚBLICO
/modulos/:moduleId    Detalle             → PÚBLICO
/buscar               Búsqueda            → PÚBLICO
/admin/*              Administración      → requiere rol admin (AdminRoute)
```

`AdminRoute` manda al visitante anónimo a `/` con la ruta original guardada en
`location.state.from`, y tras identificarse vuelve a donde iba. No se le muestra un error:
no es alguien sin permiso, es alguien que todavía no se ha identificado.

Al cerrar sesión el admin no queda fuera: vuelve a rol `user` y sigue leyendo todo.

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

Para ver contenido no hace falta nada: abre y pulsa **Ingresar**.

Para administrar, pulsa **Soy administrador** y usa la cuenta de demostración (se muestra en
pantalla con el driver `local`):

| Correo               | Contraseña |
| -------------------- | ---------- |
| admin@respondeya.app | admin123   |

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
    ├── auth/                    # Rol del visitante y sesión de admin
    │   ├── components/          #   AdminLoginForm
    │   ├── pages/WelcomePage/   #   Pantalla de entrada con los dos caminos
    │   ├── services/            #   auth.local.repository | auth.http.repository
    │   ├── store/authSlice.ts   #   role + selectIsAdmin
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

**`AdminRoute` es seguridad de interfaz, no de verdad.** Impide llegar a la pantalla de
administración, no ejecutar la escritura: con el driver `local`, cualquiera con la consola
abierta puede llamar al repositorio y modificar el contenido. Eso es aceptable mientras los
datos vivan en el `localStorage` de cada visitante, y deja de serlo en cuanto haya un backend
compartido.

Para producción:

1. Adaptador contra el IdP real, con el mismo contrato `AuthRepository`.
2. **Autorización de escritura en el backend**, verificando el token en cada mutación. El
   contenido se sirve público para lectura; `POST`, `PUT` y `DELETE` exigen rol admin.

## Pendiente

- [ ] Editor visual de bloques de contenido (hoy las secciones se crean vacías)
- [ ] Reordenar módulos y secciones por arrastre
- [ ] Subida de imágenes y video
- [ ] Modo offline con service worker
- [ ] Pruebas unitarias (Vitest + Testing Library)
