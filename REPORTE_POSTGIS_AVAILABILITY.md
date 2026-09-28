# DIAGNÓSTICO DE DISPONIBILIDAD DE POSTGIS

## 1. Verificación de PostgreSQL
- **Versión:** `PostgreSQL 18.6 on x86_64-windows`

## 2. Disponibilidad de la Extensión
Se ejecutaron consultas a la vista del sistema `pg_available_extensions` para buscar `postgis` o cualquier extensión relacionada (`%postgis%`).
- **Resultado:** 0 filas encontradas.
- Adicionalmente, se inspeccionó físicamente el directorio de extensiones de PostgreSQL en Windows (`C:\Program Files\PostgreSQL\18\share\extension`). No existe ningún archivo de control (`postgis.control`) ni binarios relacionados.

## 3. ¿Puede ejecutarse `CREATE EXTENSION`?
- **NO.** Cualquier intento de ejecutar `CREATE EXTENSION postgis` en la base `serviceflow` resultará en el error: `la extensión «postgis» no está disponible`.

## 4. Qué falta para instalarlo en Windows
Para desbloquear la disponibilidad de PostGIS en esta instancia de PostgreSQL 18.6 nativa de Windows, es necesario:
1. **Ejecutar Application Stack Builder** (incluido típicamente en la instalación de PostgreSQL en Windows) y seleccionar la instalación de "Spatial Extensions -> PostGIS" para la versión 18.
2. Alternativamente, descargar y ejecutar manualmente el **instalador de PostGIS para Windows** compatible con PostgreSQL 18 desde el sitio web oficial o repositorios de OSGeo4W.
3. El instalador copiará los archivos `postgis.control`, los archivos SQL de soporte y las librerías dinámicas (`.dll`) a los directorios `share/extension` y `lib` de PostgreSQL.
4. (Opcional pero recomendado) Reiniciar el servicio `postgresql-x64-18`.

Una vez los binarios estén físicamente presentes, `pg_available_extensions` lo reportará y la discrepancia del schema podrá resolverse limpiamente.

POSTGIS AVAILABILITY: BLOCKED
