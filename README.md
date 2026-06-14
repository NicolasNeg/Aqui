# Aquí.

> El sistema que **guía, informa y controla acceso** en cualquier espacio — desde una boda hasta un festival masivo. Sin apps. Sin instalaciones. Solo QR.

MVP completo en **Next.js 14 + TypeScript + Tailwind + Supabase**, listo para deploy en Vercel.

---

## 🚀 Inicio rápido (5 minutos)

```bash
# 1. Instala dependencias
npm install

# 2. Copia el ejemplo de variables de entorno
cp .env.local.example .env.local

# 3. (Opcional por ahora) Configura Supabase en .env.local

# 4. Levanta en local
npm run dev
```

Abre `http://localhost:3000` → verás la landing.

**Rutas principales para probar:**

| URL                          | Qué hace                                    |
| ---------------------------- | ------------------------------------------- |
| `/`                          | Landing comercial (la del PDF)              |
| `/v/demo`                    | Demo del visitante                          |
| `/v/demo?loc=A1`             | Visitante ya en la entrada norte            |
| `/v/boda-demo`               | Demo con sistema de tickets (boda)          |
| `/v/boda-demo/t/DEMO-001`    | Vista del invitado con su QR personal       |
| `/v/boda-demo/checkin`       | Vista del staff para validar entradas       |
| `/admin`                     | Panel de administración                     |
| `/admin/demo/qr-points`      | Generar QRs imprimibles                     |
| `/admin/boda-demo/tickets`   | Crear y administrar invitaciones            |

---

## ⚙️ Configurar Supabase (para guardar tickets reales)

> Sin Supabase, la app funciona en **modo demo** con datos hardcoded. Para que los tickets persistan y el check-in funcione de verdad, conecta una base.

### Paso 1: Crea el proyecto

1. Ve a [supabase.com](https://supabase.com) y crea cuenta (gratis hasta 500MB y 50k usuarios)
2. **New project** → ponle nombre (ej. `aqui-mvp`)
3. Genera y guarda una contraseña fuerte
4. Elige región más cercana (US East para LATAM)
5. Espera ~2 minutos a que termine de aprovisionar

### Paso 2: Ejecuta el schema

1. En el dashboard de Supabase → **SQL Editor** → **New query**
2. Copia todo el contenido de `supabase/schema.sql`
3. Pégalo y dale **Run**
4. (Opcional) Repite con `supabase/seed.sql` para tener datos de prueba

### Paso 3: Copia las llaves

1. En el dashboard → **Settings → API**
2. Copia estos dos valores:
   - **Project URL** → va en `NEXT_PUBLIC_SUPABASE_URL`
   - **anon public** key → va en `NEXT_PUBLIC_SUPABASE_ANON_KEY`
3. Pégalos en tu archivo `.env.local`:

```env
NEXT_PUBLIC_SUPABASE_URL=https://abcdefg.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOi...
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### Paso 4: Reinicia

```bash
# Detén el dev server con Ctrl+C
npm run dev
```

Ahora en `/admin` verás "Supabase conectado" en verde.

> ⚠️ **Seguridad**: el schema actual tiene políticas RLS permisivas para que el MVP funcione sin autenticación. Antes de salir a producción real, agrega Supabase Auth y restringe las políticas. Mira los comentarios en `supabase/schema.sql`.

---

## 🌐 Deploy a Vercel (10 minutos)

### Paso 1: Sube a GitHub

```bash
# Inicializa git si aún no
git init
git add .
git commit -m "Aquí MVP inicial"

# Crea repo en github.com → New repository (privado)
# Luego conecta:
git remote add origin https://github.com/TU_USUARIO/aqui.git
git branch -M main
git push -u origin main
```

### Paso 2: Importa a Vercel

1. Ve a [vercel.com](https://vercel.com) y conecta tu GitHub
2. **Add New → Project**
3. Selecciona el repo `aqui`
4. Framework: **Next.js** (autodetectado)
5. **Environment Variables** → agrega las mismas que tienes en `.env.local`:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `NEXT_PUBLIC_APP_URL` → aquí pon tu URL final, ej. `https://aqui-mvp.vercel.app`
6. **Deploy**

En 2 minutos tendrás tu app live.

### Paso 3: Dominio custom (opcional)

Vercel → tu proyecto → **Settings → Domains** → agrega tu dominio. Vercel te dice qué DNS configurar.

---

## 🎨 Personalizar para un cliente real

Hoy los venues están hardcoded en `src/data/demo-venue.ts`. Para configurar un cliente real:

### Opción A: rápido (hardcoded — 30 min)

1. Abre `src/data/demo-venue.ts`
2. Copia la estructura del `DEMO_VENUE` y crea uno nuevo:
   ```ts
   export const MI_CLIENTE: Venue = {
     id: 'cliente-x',
     name: 'Boda Pérez 2026',
     type: 'wedding',
     brandColor: '#...',
     accentColor: '#...',
     floorWidth: 320,
     floorHeight: 380,
     buildings: [...],
     points: { ... },
     paths: [ ... ]
   };
   ```
3. Agrégalo al record `DEMO_VENUES`
4. La app ya lo conoce — entra a `/v/cliente-x`

### Opción B: usando Supabase (más limpio — 1 hora)

1. Inserta el venue en la tabla `venues`
2. Inserta los puntos en `points`
3. Modifica `src/data/demo-venue.ts` para que primero busque en DB y haga fallback al demo

> Próxima versión: editor visual drag-and-drop de puntos sobre el plano. Por ahora es manual.

---

## 📐 Estructura del proyecto

> La app vive en la **raíz del repo** (lista para Vercel). Cada carpeta tiene
> una responsabilidad clara, así es fácil de navegar y de escalar.

```
aqui/                                   ← raíz del repo
├── README.md                          ← Este archivo
├── package.json                       ← Dependencias
├── tailwind.config.ts                 ← Tokens de marca exactos del PDF
├── .env.local.example                 ← Variables de entorno
├── src/
│   ├── app/                           ← Rutas (Next.js App Router)
│   │   ├── page.tsx                   ← Landing comercial
│   │   ├── layout.tsx                 ← Root + fuente Inter
│   │   ├── globals.css                ← Design system (tinta + rojo + crema)
│   │   ├── v/[venueId]/               ← Vistas del VISITANTE
│   │   │   ├── page.tsx               ← Escanear / lista de destinos
│   │   │   ├── map/page.tsx           ← Mapa con ruta animada
│   │   │   ├── ar/page.tsx            ← AR con flecha 3D
│   │   │   ├── checkin/page.tsx       ← Staff: validar tickets
│   │   │   └── t/[ticketCode]/page.tsx ← Vista del invitado
│   │   └── admin/                     ← Panel de ADMINISTRACIÓN
│   │       ├── page.tsx               ← Dashboard
│   │       └── [venueId]/
│   │           ├── page.tsx           ← Detalle venue
│   │           ├── qr-points/page.tsx ← Generar QRs imprimibles
│   │           └── tickets/page.tsx   ← Gestión de invitaciones
│   ├── components/                    ← UI reutilizable (sin lógica de datos)
│   │   ├── icons.tsx                  ← Set de íconos de línea compartidos
│   │   ├── Logo.tsx                   ← Marca "Aquí." con punto rojo
│   │   ├── SectionMarker.tsx          ← → 01 LABEL (firma visual)
│   │   ├── TopBar.tsx                 ← Barra superior consistente
│   │   ├── QRScanner.tsx              ← Escáner con html5-qrcode
│   │   ├── FloorPlan.tsx              ← SVG del plano + ruta
│   │   ├── ARArrow.tsx                ← Flecha 3D con brújula
│   │   ├── QRDisplay.tsx              ← Render de QRs + tarjeta imprimible
│   │   └── DestinationCard.tsx        ← Tarjeta de punto destino
│   ├── hooks/                         ← React hooks reutilizables
│   │   └── useVenue.ts                ← Carga el venue de la ruta [venueId]
│   ├── lib/                           ← Lógica pura (sin React)
│   │   ├── types.ts                   ← Tipos del dominio
│   │   ├── routing.ts                 ← BFS + bearings + distancias
│   │   ├── scan.ts                    ← Parseo del texto de un QR escaneado
│   │   ├── url.ts                     ← URLs públicas (base, ubicación, ticket)
│   │   ├── tickets.ts                 ← Tipo de fila DB + mapeo a dominio
│   │   └── supabase/
│   │       ├── env.ts                 ← Config compartida (¿hay Supabase?)
│   │       ├── client.ts              ← Cliente del navegador
│   │       └── server.ts              ← Cliente del servidor
│   └── data/
│       └── demo-venue.ts              ← Plaza Aquí + Boda demo
├── supabase/
│   ├── schema.sql                     ← Tablas + RLS
│   └── seed.sql                       ← Datos de prueba
└── public/
    ├── favicon.svg
    └── manifest.json                  ← PWA
```

### Convención (para escalar sin desorden)

- **`lib/`** = lógica pura y reutilizable, **sin** React. Fácil de testear.
- **`hooks/`** = estado/efectos de React reutilizables (ej. `useVenue`).
- **`components/`** = UI presentacional; los datos llegan por props.
- **`app/`** = cada carpeta es una ruta; las páginas componen hooks + componentes.
- ¿Texto repetido, SVG repetido o cálculo repetido en 2+ páginas? → muévelo a
  `lib/`, `hooks/` o `components/icons.tsx`. Esa es la regla que mantiene el código simple.

---

## 📱 Compatibilidad

| Función                  | iOS Safari | Android Chrome | Desktop |
| ------------------------ | ---------- | -------------- | ------- |
| Escaneo de QR            | ✅ iOS 11+ | ✅              | ✅ con webcam |
| Mapa SVG con ruta        | ✅          | ✅              | ✅       |
| Vista AR (cámara+brújula)| ✅ iOS 13+ requiere permiso explícito | ✅ | ⚠️ sin brújula |
| Geolocalización GPS      | ✅          | ✅              | ⚠️ baja precisión |
| QRs imprimibles          | —          | —              | ✅       |

> En iOS, la vista AR pide permiso de orientación al primer uso (es requisito del sistema operativo).

---

## 🛠️ Stack técnico

- **Next.js 14** (App Router) — framework con server components
- **TypeScript** — tipado estricto
- **Tailwind CSS** — design tokens del PDF como variables
- **Supabase** — Postgres + autenticación (cuando la agregues)
- **html5-qrcode** — escaneo en vivo
- **qrcode** — generación de QRs
- **DeviceOrientation API** — flecha 3D con brújula
- **MediaStream API** — cámara para AR

Cero dependencias innecesarias. Build size ~85 KB JS gzipped en cliente.

---

## 🎯 Roadmap (próximos pasos sugeridos)

**Antes del primer cliente real:**
- [ ] Agregar Supabase Auth para `/admin`
- [ ] Restringir políticas RLS (que solo el dueño del venue lea sus tickets)
- [ ] Editor visual de puntos (drag-and-drop sobre el plano)
- [ ] Subida de imágenes/audio por punto (Supabase Storage)

**Mejoras de experiencia:**
- [ ] Multi-idioma (i18n con Next.js)
- [ ] Modo offline (Service Worker)
- [ ] Notificaciones push (cuando un invitado llega)
- [ ] Dashboard de analytics (mapas de calor de escaneos)

**Modelo de negocio:**
- [ ] Stripe para suscripciones del Plan Profesional
- [ ] Onboarding self-service para SaaS
- [ ] White-label por cliente (dominio + logo)

---

## 💬 Soporte

Si algo no funciona:

1. Verifica que estás en Node 18+ (`node -v`)
2. Borra `node_modules` y reinstala (`rm -rf node_modules && npm install`)
3. Verifica las variables de entorno en `.env.local`
4. En Vercel: revisa los logs de **Deployments → tu deploy → View Function Logs**

---

**Aquí.** · El siguiente paso es tuyo.
