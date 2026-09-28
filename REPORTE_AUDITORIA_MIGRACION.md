# AUDITORÍA DE MIGRACIÓN INICIAL

## 1. Estado de Prisma Migrate
Al ejecutar `prisma migrate status`, el resultado es:
`Database schema is up to date!`
Prisma reporta que está "al día" porque la tabla de control `_prisma_migrations` tiene registrada la migración `20260924205232_init` como exitosa, y su checksum interno coincide con el archivo SQL guardado. Prisma no inspecciona la base de datos viva en tiempo real durante un comando `status`.

## 2. Inspección del SQL y Comparación
El SQL generado inicialmente contenía la estructura completa declarada en `schema.prisma`. Sin embargo, debido al parche aplicado en el paso anterior, las siguientes instrucciones fueron **eliminadas/comentadas** del SQL que se ejecutó contra la base de datos:
1. `CREATE EXTENSION IF NOT EXISTS "postgis" WITH VERSION "3";`
2. `"geom" geography(Point,4326),` (En la tabla `CoverageZone`)
3. `"location" geography(Point,4326),` (En la tabla `ServiceRequest`)

## 3. Dependencia Real de PostGIS
¿Requiere `schema.prisma` realmente PostGIS? **SÍ**.
El esquema contiene definiciones explícitas usando tipos soportados únicamente por PostGIS:
- `geom Unsupported("geography(Point,4326)")?`
- `location Unsupported("geography(Point,4326)")?`
Al estar declaradas en el esquema, Prisma asume que estas columnas existen en la base de datos. Si el código intenta ejecutar una consulta SQL cruda (`$queryRaw`) contra estas columnas, fallará.

## 4. Comprobación de Discrepancia (Drift)
Se ejecutó una comparación estricta entre la base de datos viva y el modelo definido en `schema.prisma` mediante el comando `prisma migrate diff --from-schema-datasource prisma/schema.prisma --to-schema-datamodel prisma/schema.prisma`.

El resultado confirmó la discrepancia física:
```text
[+] Added extensions
  - postgis

[*] Changed the `CoverageZone` table
  [+] Added column `geom`

[*] Changed the `ServiceRequest` table
  [+] Added column `location`
```

## 5. Conclusión de la Auditoría
Aunque la base de datos contiene el 99% de las estructuras (todas las tablas, enums, primary keys, foreign keys y tipos estándar), **falta la implementación espacial de PostGIS**.
Dado que el `schema.prisma` aún requiere estas columnas geográficas, la base de datos actual **no está 100% sincronizada** con el modelo declarado. Queda una dependencia funcional (PostGIS) que fue eliminada físicamente pero sigue declarada en Prisma.

MIGRATION INITIAL AUDIT: FAIL
