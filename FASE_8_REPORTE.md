# REPORTE FINAL — FASE 8

## 1. Estado
FASE 8 — LISTA PARA APROBACIÓN

## 2. Payment
- **Modelo:** Reutiliza de forma intacta el modelo `Payment` original.
- **Endpoint:** `POST /api/services/:id/payment` y `GET /api/services/:id/payment` unificados para Cliente/Técnico en `ServicesController`.
- **Estados y Restricciones:** Solo se permite registrar un pago cuando `Service.status === COMPLETED`. Se realiza actualización mediante atomic Compare-And-Swap (CAS) que empuja al servicio al estado `PAID` e inserta el log en `ServiceStatusHistory`.
- **Métodos y Currency:** Se aceptan opciones estrictas del enum Prisma (`CASH`, `NEQUI`, `TRANSFER`, `OTHER`). Moneda controlada forzosamente por el backend a `COP`.
- **Idempotencia y Concurrencia:** Asegurada por `serviceId String @unique` en `Payment`, y control CAS `updateMany` a la tabla de `Service`.

## 3. Rating
- **Quién califica a quién:** Diseño bidireccional puro. Un cliente puede calificar a su técnico y viceversa.
- **Score & Comments:** Validados en DTO (`@Min(1)`, `@Max(5)`, `MaxLength(500)`). Comentario opcional con trim.
- **Duplicados y Concurrencia:** Protegidos robustamente vía `@@unique([serviceId, fromUserId])` nativo en Prisma. Dos peticiones simultáneas del mismo usuario sobre el mismo servicio resultarán en un fallo para la segunda (o a través del check explícito en la transacción o de un constraint violation nativo P2002).
- **Estado RATED:** Tras emitir el primer rating, `Service` sube a `RATED` si estaba `PAID`. (La segunda calificación sigue permitida tras llegar a `RATED`).

## 4. Seguridad
- **JWT y Roles:** Todo pasa por el `JwtAuthGuard` y `RolesGuard` autorizando `CLIENT` o `TECHNICIAN`.
- **Ownership (IDOR):** Comprobado explícitamente en `findOneForParticipant`: `if (service.clientId !== userId && service.technicianId !== userId) throw new ForbiddenException()`.
- **Blocked Users:** Herencia nativa de la protección en la cadena Auth.
- **Manipulación de IDs:** `fromUserId` proviene infaliblemente de `@CurrentUser('sub')`. `toUserId` es inferido algorítmicamente y nunca admitido desde el cliente.

## 5. Prisma
- schema: PASS (No se realizaron cambios destructivos, se utilizó el schema nativo de Phase 0 intacto).
- generate: PASS.
- migration: N/A.
- unique constraints: `serviceId` en `Payment` y `[serviceId, fromUserId]` en `Rating` garantizados.

## 6. Tests
Suites: 8
Tests: 54
Passed: 54
Failed: 0
Skipped: 0

## 7. Build
API: PASS (exit code 0 vía pnpm --filter @serviceflow/api build)
WEB: PASS (exit code 0 vía typecheck estricto tsc --noEmit)
SHARED: PASS (exit code 0 vía build / cache hit)

## 8. Concurrencia
- **Payment concurrente:** 
  resultado: 1 Payment creado (y el Service asciende a PAID). El request paralelo es rechazado con error (`updateMany count 0`).
- **Rating concurrente:**
  resultado: 1 Rating creado. El request paralelo del mismo actor devuelve `BadRequestException` o choca con la unicidad compuesta. Si los actores (Cliente y Técnico) califican concurrentemente, ambos son creados independientemente y de manera exitosa.

## 9. Economía
¿ServiceFlow cobra comisión?
NO

¿ServiceFlow procesa dinero?
NO

¿Existe wallet?
NO

¿Existe escrow?
NO

¿Existe split payment?
NO

¿El técnico recibe el 100%?
SÍ

¿El cliente paga directamente al técnico?
SÍ

## 10. Scope
¿Se implementaron funcionalidades fuera de Fase 8?
NO
