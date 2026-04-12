# Análisis de Avance: PWA Aurae vs. SRS v1.0

**Fecha de análisis:** 2026-04-11  
**Documento de referencia:** SRS - Aurae.docx (v1.0, 13 enero 2026)  
**Repo analizado:** `PWA-aurae` (React 19 + Vite + Tailwind, rama `main`)

---

## Resumen Ejecutivo

El SRS define la PWA como *"interfaz web ligera para la adquisición rápida de accesos y consulta de agenda sin necesidad de instalación"* (§1.2). En la práctica, la implementación va bastante más allá de ese alcance mínimo: incluye gamificación, Smart Concierge, Aura Flow y un panel administrativo completo. Sin embargo, los tres flujos de mayor valor del producto — pago real con Stripe, colas virtuales en tiempo real y detección BLE nativa — siguen siendo stubs o mocks.

```
Iteración 1 — Core (Auth, Aura, Agenda, Tickets):     █████████░  90%
Iteración 2 — Logística (Concierge, WebSockets, BLE): ████░░░░░░  40%
Iteración 3 — Inteligencia (IA real, Analytics):      ███░░░░░░░  30%
```

---

## Iteración 1 — Core

### Implementado ✅

| Módulo | Detalle |
|---|---|
| Registro de usuarios | Formulario completo: nombre, email, contraseña (8+ chars, letra+número), intereses (10 categorías). Rate limiting client-side: 3 intentos → 30 s cooldown |
| Login + JWT | Autenticación con localStorage, interceptor Axios para `Authorization: Bearer`, redirect automático en 401, decodificación client-side para expiración |
| Perfil de Aura | 6 niveles (Neutro → Legendario), rangos de puntos, colores con glow CSS, progreso visual, 6 arquetipos inferidos del vector de intereses |
| Listado de eventos | Búsqueda por nombre/descripción/ubicación, filtros de tiempo (próximos, todos, pasados) y categoría |
| Detalle de evento | Imagen, fechas, ubicación, precio, capacidad, stands y acceso a herramientas (Concierge, AuraFlow, ScanQR) |
| Mis Tickets | Listado con filtro por estado (activo, usado, cancelado, expirado), card con QR generado con `qrcode.react` |
| Compra de Ticket | Formulario de 3 tipos de ticket (General $150 / VIP $400 / Early Bird $80), crea orden y ticket via API |
| Perfil de usuario | Edición de nombre, avatar (solo HTTPS), intereses — guarda a `PATCH /usuarios/me` |
| Panel Admin — CRUD Eventos | Tabla de eventos con crear/editar/eliminar; formulario detallado (26 KB) con todos los campos del SRS |
| Panel Admin — CRUD Stands | Gestión de stands incluyendo `beacon_uuid`, `beacon_major`, `beacon_minor` para configuración BLE |
| Panel Admin — Tickets | Vista de tickets por evento |
| Panel Admin — Reportes | Gráficas con Recharts (pie chart de interacciones, bar chart de asistencia) |

### Faltante en Iteración 1 ⚠️

| Pendiente | Detalle |
|---|---|
| **Stripe Checkout real** | SRS §5.2.2 y §5.3.1: el pago debe procesarse con Stripe. `@stripe/stripe-js` está importado pero sin integrar. La compra actual llama directamente `POST /ordenes/` con pago simulado — el backend ya tiene `POST /ordenes/{id}/pagar` que devuelve `client_secret`, pero el frontend no lo usa |
| **Listado de transacciones Stripe** | SRS §5.2.2: "listado de transacciones procesadas por Stripe, últimos 4 dígitos de tarjeta, estado del pago" — no existe en la UI |
| **Color inicial de Aura "Gris (Neutral)"** | SRS §5.3.1: al registrarse el Aura debe ser Gris. Actualmente el nivel 0 usa `#FFFFFF` (Blanco) — pendiente de alinear diseño con equipo |

---

## Iteración 2 — Logística

### Implementado ✅

| Módulo | Detalle |
|---|---|
| QR Fallback para Handshake | SRS §3.3.1 fallback QR: `html5-qrcode` escanea el QR físico del stand, identifica por `beacon_uuid`, registra handshake via `POST /interacciones/handshake` |
| Feedback post-visita (UI) | `FeedbackModal` con rating 1-5 estrellas + comentario opcional. Se activa 2 horas después de uso del ticket. Otorga +5 Aura (llamada a `PATCH /usuarios/me` actualiza puntos) |
| Colas Virtuales (UI) | Página `Concierge` con visualización de estados (REGISTRADO, EN_COLA, NOTIFICADO, ATENDIDO, EXPIRADO), posición y tiempo estimado. `StandCard` con botón de unirse a la cola |
| Admin Colas (UI) | `AdminColas`: lista de usuarios en espera, botón "Llamar siguiente", tabla de estado |
| Cápsula del Tiempo (UI) | Página `Capsula`: estadísticas de visitas, timeline de interacciones, stand con mayor duración, resumen IA si existe snapshot |

### Faltante en Iteración 2 ❌

| Pendiente | Prioridad | Detalle |
|---|---|---|
| **Integración real de Colas** | Alta | `colaApi.js` tiene todos los métodos definidos (`unirse`, `cancelar`, `llamarSiguiente`, `marcarAtendido`, etc.) pero `Concierge.jsx` y `AdminColas.jsx` usan **datos mock estáticos** — no hacen ninguna llamada a la API. El backend ya tiene los endpoints `/colas/` completos |
| **WebSocket para turno en tiempo real** | Alta | SRS §1.3 y §8.2: actualizaciones de cola via WebSocket. `Concierge.jsx` tiene un comentario: `// TODO: reemplazar polling por WebSocket ws://backend/ws/colas/:stand_id`. El backend expone `WS /colas/ws/{usuario_id}?token=<jwt>` sin consumidor en el frontend |
| **BLE nativo** | Media | SRS §3.3.1: detección de beacon BLE del stand. La PWA solo tiene el fallback QR (`ScanQR.jsx`). La Web Bluetooth API permite leer beacons desde Chrome/Edge en Android, pero no está implementada |
| **Token BLE anónimo** | Media | SRS §3.5: la app debe solicitar un token temporal y emitirlo por BLE. El backend expone `GET /usuarios/me/ble-token`, pero el frontend no lo consume ni usa en el handshake anónimo |
| **Notificaciones push (FCM)** | Media | SRS §3.4: notificaciones en ≤30 s tras perder BLE. El service worker (`sw.js`) está configurado con Workbox para caché, pero sin integración Firebase/FCM. `POST /usuarios/me/fcm-token` existe en el backend pero no se llama desde la PWA |
| **Feedback — persistencia en backend** | Media | `FeedbackModal` actualiza los puntos localmente pero no llama `POST /feedback/`. El backend tiene el endpoint completo con rating + comentario |
| **Heatmap Admin** | Baja | SRS §5.2.1 PWA Administrativa: "mapa de calor en tiempo real del recinto". `AdminReportes.jsx` usa Recharts con gráficas de barras/pie, pero no hay heatmap ni visualización geoespacial |

---

## Iteración 3 — Inteligencia

### Implementado (parcial) ⚠️

| Módulo | Detalle |
|---|---|
| Aura Flow (UI) | Página `AuraFlow.jsx`: llama `POST /aura/snapshot`, muestra `recomendaciones[]` como ruta numerada con íconos y nombres de stands extraídos del texto, con archetype del usuario |
| Arquetipos de usuario | 6 arquetipos (Techie, Foodie, Networker, Artist, Gamer, Eco) inferidos del `vector_intereses` en `auraColors.js`. Se muestran en `AuraView` y `AuraFlow` |
| Snapshot / Smart Concierge | `useAura.js` consume `POST /aura/snapshot`. El resumen IA y recomendaciones se muestran en `AuraView` y `Capsula` |
| Panel de Reportes Admin | `AdminReportes.jsx`: gráficas de interacciones y asistencia con Recharts. Datos de `GET /metricas/evento/{id}` |

### Faltante en Iteración 3 ❌

| Pendiente | Prioridad | Detalle |
|---|---|---|
| **Panel de configuración de arquetipos** | Media | SRS §5.2.3: el organizador debe poder definir arquetipos y pesos de categorías de stands para el Aura Flow. No hay UI para configurar estos parámetros — los arquetipos están hardcodeados en `auraColors.js` |
| **Recomendaciones IA en tiempo real** | Media | El Aura Flow muestra `recomendaciones[]` del snapshot, pero el backend genera estas con reglas estáticas (sin LLM). La integración con OpenAI está pendiente en el backend — cuando se conecte, la UI ya podría consumirlo sin cambios |
| **Galería de fotos por stand** | Baja | SRS §5.2.6: "galería de fotos tomadas en el punto específico del stand". El backend tiene `media_service.py` comentado. No hay UI de upload/visualización de fotos |
| **Calificación promedio en detalle de stand** | Baja | SRS §5.2.6: "calificación promedio de feedback". `EventoDetalle` muestra los stands pero no sus ratings. El backend expone `GET /feedback/stand/{id}` — solo falta consumirlo en la UI |
| **Heatmap de densidad en tiempo real** | Baja | SRS §5.2.1 para administrador: visualización de zonas de mayor concentración de personas. Requiere datos de localización/BLE que actualmente no se recopilan |
| **Cápsula del Tiempo — collage de fotos** | Baja | SRS §5.2.7: resumen visual con "collage de fotos del asistente". `Capsula.jsx` muestra estadísticas y timeline, pero no hay galería de imágenes |

---

## Discrepancias SRS ↔ Código

| Aspecto | SRS establece | Código actual |
|---|---|---|
| Rol de la PWA | "Adquisición rápida de accesos y consulta de agenda" (§1.2) | Implementación mucho más amplia: gamificación, admin, AI routing, etc. |
| Pago Stripe | Checkout completo con Stripe SDK (§5.2.2, §5.3.1) | `@stripe/stripe-js` importado pero no integrado — "Pago simulado · Stripe próximamente" |
| BLE detección | App detecta beacon del stand (§3.3.1) | Solo fallback QR; Web BT API no implementada |
| Umbral BLE | 2 minutos (§3.3.1) | QR registra handshake con duración 0s (sin validación) |
| Color inicial Aura | Gris — Neutral (§5.3.1) | `#FFFFFF` Blanco en nivel 0 |
| Notificaciones push | FCM en ≤30 s (§3.4) | Estructura PWA lista, sin integración Firebase |
| Panel Admin | PWA Administrativa con heatmap (§5.2.1) | Dashboard admin con gráficas (Recharts), sin heatmap |
| RBAC Admin | Rol staff/organizador diferenciado (§2.3) | `AdminRoute` listo pero comprobación `es_admin` desactivada (`// TODO`) |

---

## Arquitectura: flujos pendientes de conectar

```
PWA-aurae/src/
├── api/
│   ├── colaApi.js          ← DEFINIDO, no consumido (Concierge usa mock)
│   └── feedbackApi.js      ← FALTANTE (FeedbackModal no llama backend)
├── pages/
│   ├── Concierge.jsx       ← datos mock → conectar a colaApi + WebSocket
│   ├── Comprar.jsx         ← pago simulado → integrar Stripe Elements
│   └── admin/
│       ├── AdminColas.jsx  ← datos mock → conectar a colaApi
│       └── AdminReportes.jsx ← agregar calificaciones de stand (GET /feedback/stand/{id})
└── hooks/
    └── useWebSocket.js     ← FALTANTE (necesario para colas en tiempo real)
```

---

## Próximos pasos sugeridos (por prioridad)

1. **Conectar `colaApi.js` a `Concierge.jsx` y `AdminColas.jsx`** — el backend está completo, solo falta eliminar los mocks y llamar los endpoints reales.
2. **WebSocket en Concierge** — reemplazar el polling con `useWebSocket` consumiendo `WS /colas/ws/{usuario_id}?token=<jwt>`.
3. **Stripe Elements en `Comprar.jsx`** — consumir `POST /ordenes/{id}/pagar` → `client_secret` → `stripe.confirmCardPayment()`.
4. **`feedbackApi.js` + llamada en `FeedbackModal`** — `POST /feedback/` con rating y `interaccion_id`.
5. **FCM token registration** — tras login, llamar `POST /usuarios/me/fcm-token` con el token del service worker.
6. **Rating en `EventoDetalle` y `AdminReportes`** — consumir `GET /feedback/stand/{id}` para mostrar calificación promedio.

---

## Referencias de código

| Archivo | Línea | Relevancia |
|---|---|---|
| `src/pages/Comprar.jsx` | ~80 | `// Pago simulado · Stripe próximamente` |
| `src/pages/Concierge.jsx` | ~15 | Mock data hardcodeado en lugar de `colaApi` |
| `src/components/FeedbackModal.jsx` | ~60 | Actualiza Aura pero no llama `POST /feedback/` |
| `src/components/AdminRoute.jsx` | ~10 | `// TODO: verificar es_admin` |
| `src/pages/Concierge.jsx` | ~90 | `// TODO: reemplazar polling por WebSocket` |
| `src/utils/auraColors.js` | 1 | Arquetipos y rangos de Aura hardcodeados |
| `src/api/colaApi.js` | 1 | API de colas definida pero no usada en páginas |
| `vite.config.js` | ~25 | Workbox caching configurado (offline-ready) |
