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

| Pieza         | Elección                            | Por qué                                              |
| ------------- | ----------------------------------- | ---------------------------------------------------- |
| Build         | Vite 8                              | Mismo stack que el resto de los proyectos del equipo |
| UI            | React 19 + TypeScript               | Estándar ADL, sin `any` ni `PropTypes`               |
| Estado global | Redux Toolkit 2                     | Slices por módulo, hooks tipados                     |
| Rutas         | React Router 7                      | Rutas por módulo con lazy loading                    |
| Estilos       | SCSS co-locado                      | Tokens en `src/styles`, BEM por componente           |
| HTTP          | Axios (singleton)                   | Interceptors centralizados de auth y errores         |
| Lint          | oxlint + prettier                   | Igual que `alaria-app`                               |
| Iconos        | lucide-react                        | Registro cerrado en `content/constants/moduleIcons`  |
| Tipografía    | Plus Jakarta Sans (`@fontsource`)   | Autoalojada: sin peticiones a terceros, va sin red   |

### Lo que NO se instaló, y por qué

No hay librería de animación (`framer-motion` o similar). Añade del orden de 50 kB gzip a una
aplicación cuyo valor depende de abrir rápido durante una emergencia. El movimiento se hace
con transiciones CSS y `prefers-reduced-motion`, que cubre el 100% de lo que se necesita aquí.
Si en algún momento hace falta movimiento compartido entre vistas, se reevalúa.

Tampoco hay librería de gráficos: el anillo de progreso son dos círculos SVG y un
`stroke-dashoffset`.

## Diseño

Lenguaje visual de aplicación móvil de salud: superficies claras con tintes pastel, radios
amplios, sombras difusas y tipografía grande. Rojo reservado para urgencia y acción primaria;
el azul marino de marca lleva el peso de la tipografía.

La referencia visual y el mapeo patrón por patrón están en
[`docs/design-reference/`](docs/design-reference/README.md).

### Una pantalla, una tarea

| Pantalla    | Ruta        | Para qué                                                     |
| ----------- | ----------- | ------------------------------------------------------------ |
| Bienvenida  | `/`         | Puerta de entrada. Se cruza una vez                          |
| Inicio      | `/modulos`  | Saludo y rejilla. Reconocer la situación de un vistazo       |
| Buscar      | `/buscar`   | Buscador y filtros. Para cuando ya sabes qué buscas          |
| Detalle     | `/modulos/:id` | El protocolo paso a paso                                  |

El inicio no lleva buscador, filtros ni barra superior: el saludo es su cabecera y la rejilla
ordenada por gravedad ya resuelve el reconocimiento. Meter controles ahí solo añadía cosas
que mirar antes de poder actuar.

En el menú inferior **«Inicio» apunta a `/modulos`**, no a `/`. Tener una pestaña «Inicio» y
otra «Módulos» para dos pantallas parecidas obligaba a adivinar cuál era cuál.

### Navegación según el ancho

Dos navegaciones excluyentes, cada una oculta en el breakpoint de la otra:

| Ancho    | Navegación                                    |
| -------- | --------------------------------------------- |
| < 1024px | `BottomNav` (pestañas abajo) + `TopBar`       |
| ≥ 1024px | `AppHeader` (cabecera fija)                   |

Las pestañas van abajo en móvil porque es donde llega el pulgar. `AppShell` compone el
armazón; la barra superior contextual la pone cada página, que es la única que conoce su
título y si procede un botón de volver.

### Piezas del sistema

| Componente     | Para qué                                                   |
| -------------- | ---------------------------------------------------------- |
| `IconBubble`   | Icono con tinte pastel. Unifica fichas, filas y cabeceras  |
| `Chip`         | Filtro en pastilla con `aria-pressed`                      |
| `ProgressRing` | Anillo de avance en SVG con `role="progressbar"`           |
| `ListRow`      | Fila con icono, título, subtítulo y chevron                |
| `ModuleTile`   | Ficha de la rejilla; el tinte lo marca la gravedad         |
| `LinkButton`   | Navegación con aspecto de botón (nunca un `Link` en `button`) |

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
| `stats`         | Cifras clave en grande, para buscarlas con la vista    |
| `metronome`     | Círculo que late al ritmo indicado, para comprimir a la vez |
| `doDont`        | Dos columnas enfrentadas: lo que sí y lo que nunca     |

### Preferir lo visual al párrafo

Los tres últimos bloques existen para quitar prosa. El módulo de RCP pasó de ~900 palabras y
4 secciones a ~190 palabras y 3 secciones sin perder ninguna indicación:

| Antes | Ahora |
| --- | --- |
| Párrafo explicando «entre 100 y 120 por minuto» y el truco de la canción | `metronome` a 110 bpm: se comprime al ritmo del círculo |
| Prosa con el ritmo, la profundidad y «sin pausas» | `stats` con las tres cifras en grande |
| Tres bloques `warning` seguidos | un `doDont` de dos columnas |
| Checklist de 6 puntos de técnica | la columna «Hazlo así» del `doDont` |

El `metronome` es el caso extremo: ninguna descripción escrita del ritmo sirve para comprimir
al ritmo correcto. Es el único componente cuyo movimiento **no** se desactiva con
`prefers-reduced-motion`, porque ahí el movimiento es la función, no el adorno; lo que se hace
es suavizarlo.

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

`src/modules/content/services/content.seed.ts` trae tres módulos: **RCP solo con las manos**,
atragantamiento y hemorragia externa.

El de RCP está redactado a partir de guías públicas, con las fuentes citadas en el propio
archivo (American Heart Association y Cruz Roja) y parafraseado, no copiado. Los otros dos
resumen guías de difusión general sin fuente concreta.

**Nada de esto ha sido revisado por personal de salud.** Antes de cualquier uso real:
reemplazar el archivo con el contenido oficial validado por la organización y citar esa
fuente en cada módulo.

### Versionado de la semilla

El contenido semilla solo se escribía si `localStorage` estaba vacío, así que quien ya había
abierto la app nunca veía los módulos nuevos. Ahora la migración se dispara por una **huella
del contenido**, no por un número que haya que acordarse de subir:

```
signature = FNV-1a( JSON(SEED_MODULES) + RETIRED_SEED_IDS )
```

1. Edita la semilla. **No hay que subir nada**: cualquier cambio altera la huella, incluido
   retocar una frase de un módulo que ya existía.
2. Si retiras un módulo, añade su id a `RETIRED_SEED_IDS`. Sin eso la migración no puede
   distinguir un módulo retirado de uno que creó un administrador, y lo conservaría.
3. En el siguiente arranque los módulos de la semilla se reinstalan y **los creados por un
   administrador se conservan** intactos.

`SEED_VERSION` sigue existiendo, pero solo como prefijo legible de la huella y para los logs.
Ya no decide nada.

Antes la decisión dependía de ese número y fallaba de dos formas, las dos silenciosas:
olvidarse de subirlo dejaba a la gente con contenido viejo indefinidamente, y subirlo en una
edición distinta a la del contenido persistía una combinación incoherente que ya no se
corregía nunca.

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
