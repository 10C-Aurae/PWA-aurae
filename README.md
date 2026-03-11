# Aurae PWA

Progressive Web App para la plataforma **Aurae** — gestión de eventos con gamificación BLE.

## Stack

- React 18 + Vite
- React Router v6
- TailwindCSS v3
- Axios (JWT en localStorage)
- vite-plugin-pwa (Service Worker + manifest)
- Recharts (gráficas admin)
- qrcode.react (QR de tickets)
- @stripe/stripe-js (pagos — integración pendiente)

## Estructura

```
src/
├── api/           # Clientes Axios por dominio
├── components/    # Componentes reutilizables
├── context/       # AuthContext (JWT + estado de sesión)
├── hooks/         # useAuth, useAura, useEventos
├── pages/         # Páginas de la app
│   └── admin/     # Panel de administración
└── utils/         # auraColors, formatDate
```

## Setup

```bash
# 1. Instalar dependencias
npm install

# 2. Configurar variables de entorno
cp .env.example .env.local
# Edita .env.local con tus valores

# 3. Iniciar servidor de desarrollo
npm run dev
```

## Variables de entorno

| Variable                 | Descripción                                              |
|--------------------------|----------------------------------------------------------|
| `VITE_API_BASE_URL`      | URL base del backend FastAPI (`http://localhost:8000/api/v1`) |
| `VITE_STRIPE_PUBLIC_KEY` | Clave pública de Stripe (`pk_test_...` o `pk_live_...`)  |

## Comandos

```bash
npm run dev      # Servidor de desarrollo (http://localhost:5173)
npm run build    # Build de producción → dist/
npm run preview  # Previsualizar build local
```

## Backend

El backend companion está en `/backend-aurae` (FastAPI).
Expone la API REST en `/api/v1`.
Ver `/backend-aurae/README.md` para instrucciones de arranque.

## TODOs pendientes

- [ ] RBAC: proteger rutas `/admin/*` con verificación de rol en `PrivateRoute`
- [ ] Integración real de Stripe Checkout (webhook de confirmación de pago)
- [ ] Push Notifications via FCM para recordatorios de eventos
- [ ] Página de error 404 personalizada
