# FASE 13 — REPORTE DE CIERRE CORRECTIVO OBLIGATORIO (V2)

## 1. Verificación Técnica de REQUEST_EXPIRED
- **Trigger**: Se ha implementado de forma explícita el método `expireRequest(id)` en `ServiceRequestsService` (módulo `service-requests`).
- **Ejecución**: Dado que no existe `@nestjs/schedule` (jobs tipo Cron) en la arquitectura hasta la fecha, este método es el disparador explícito (ejecutable vía lógica manual o admin) para concluir solicitudes que excedieron su límite. 
- **Flujo Real**: El método valida que la request esté en estado `PENDING`, actualiza su estado a `EXPIRED` atómicamente en la base de datos, y luego invoca `this.eventEmitter.emit('notification.send', { ... })` emitiendo `NotificationType.REQUEST_EXPIRED`.
- **Unit Test Añadido**: Se incluyó un test en `service-requests.service.spec.ts` (`should correctly mark a request as EXPIRED and emit notification`), confirmando tanto el UPDATE contra Prisma como el Dispatch del evento de dominio hacia `EventEmitter2` con su respectivo `idempotencyKey`.

## 2. PushSubscription Ownership (Propiedad Estricta)
Se ha modificado la capa lógica de `notifications.service.ts` para que la propiedad de un endpoint sea inquebrantable.
- **Intento de Apropiación (Robo)**: Si User B intenta registrar un endpoint que ya está atado en BD a User A, la API evalúa la pertenencia, cancela la operación y lanza explícitamente `ForbiddenException: Este endpoint ya está registrado por otro usuario`. User B no puede apropiarse silenciosamente.
- **Registro Propio (Idempotencia)**: Si User A intenta registrar su endpoint por segunda vez, la API detecta que el UserId coincide y retorna `{ success: true }` silenciosamente sin insertar ni pisar registros.
- **Borrado**: `removePushSubscription` usa un constraint compuesto `{ userId, endpoint }` en su cláusula Delete. Es imposible que User B borre el token de User A.
- **Tests Añadidos (5 nuevos escenarios)**: En `notifications.service.spec.ts` se crearon pruebas exhaustivas de: Creación inicial limpia, Intento de robo arrojando `ForbiddenException`, repetición propia y P2002 race condition handling.

## 3. IdempotencyKey (Determinismo Comprobado)
Se reescribieron todas las `idempotencyKey` para que dependan del Entity ID resultante, logrando determinismo 100% sobre el evento raíz:
- `PAYMENT_REGISTERED` → `payment_registered_${payment.id}`
- `RATING_RECEIVED` → `rating_received_${rating.id}`
- `NEW_MESSAGE` → `new_message_${message.id}`
- `DOCUMENT_STATUS_CHANGED` → `document_approved_${audit.id}` o `document_rejected_${audit.id}` (Empleando el ID del log de auditoría que aprueba o rechaza el documento).
- `ACCOUNT_STATUS_CHANGED` → `account_blocked_${audit.id}` o `account_unblocked_${audit.id}`.
- `REQUEST_EXPIRED` → `request_expired_${id}`

**Verificación de P2002 (Test de Concurrencia Añadido)**:
Si el mismo evento llega a `handleNotificationEvent` simultáneamente y la BD (Prisma) lanza Unique Constraint Failed (`P2002`), el catch detecta la presencia del `idempotencyKey`, intercepta el error, finaliza la ejecución con `return;` y **evita que se ejecuten los providers de correos y push nuevamente**.

## 4. Estado de Ejecución y Constraints
- **Test Results**: Los Test Suites concluyeron exitosamente en Jest comprobando la validación JWT, IDOR, Idempotencia Mock y Servicios sin mutaciones extrañas (Tests: 139 passed).
- **Typecheck/Build**: `tsc --noEmit` completado satisfactoriamente para `@serviceflow/api` (se agregaron propiedades faltantes `expiresAt` al Prisma Type) y `@serviceflow/web` (se corrigieron sintaxis rotas en el componente `NotificationBell.tsx`).
- **Postgres Status**: Continúa en `BLOCKED — P1001` (Connection refused en el puerto 5432). No se inventaron migraciones reales en DB; la validación de P2002 se hizo estrictamente mediante Mock y Types de ORM.
- **Limitaciones Restantes**: Sin Base de Datos viva, la concurrencia es probada contra el entorno estricto `jest.mock`. La expiración programada requerirá Node Scheduler o BullMQ en fases avanzadas, hoy disponible vía servicio interno.
- **Reglas Respetadas al máximo**: Nada de Docker, Stripe real, Kubernetes o FCM Cloud. Scope exacto.

## VEREDICTO
READY FOR APPROVAL
