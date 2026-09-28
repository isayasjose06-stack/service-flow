# DIAGNÓSTICO PARA INSTALACIÓN DE POSTGIS

## 1. Versión de PostgreSQL y Ruta
- **Versión Exacta:** PostgreSQL 18.6 (x86_64-windows)
- **Ruta de Instalación:** `C:\Program Files\PostgreSQL\18`

## 2. Método Recomendado (Oficial)
Para instalaciones nativas de PostgreSQL en Windows (distribución EDB), el método oficial, más seguro y totalmente compatible para agregar PostGIS es utilizar la herramienta integrada **Application Stack Builder**.

- **¿Requiere Stack Builder?** SÍ, es el método preferido. 
- Se ha comprobado que el ejecutable está presente en el sistema en la ruta: `C:\Program Files\PostgreSQL\18\bin\stackbuilder.exe`.

## 3. Pasos del Método (vía Stack Builder)
Si se ejecuta `stackbuilder.exe`:
1. El asistente pedirá seleccionar la instalación objetivo (PostgreSQL 18 en el puerto 5432).
2. Descargará el catálogo de aplicaciones.
3. Dentro de la categoría **"Spatial Extensions"**, se debe seleccionar **PostGIS** (la versión más reciente compatible con PG 18).
4. Procederá a descargar el paquete y lanzará un sub-instalador para colocar las librerías DLL y los archivos de extensión (`.control`, `.sql`) dentro del directorio base de PostgreSQL.

*Método alternativo:* Descargar el instalador `.exe` compilado directamente desde el repositorio oficial de OSGeo4W/PostGIS, asegurándose que sea la compilación estricta para PostgreSQL 18 x64.

## 4. Requisitos Adicionales
- **Privilegios de Administrador:** El instalador requerirá elevación (UAC) para escribir en `C:\Program Files`.
- **Servicio en ejecución:** Dependiendo de la actualización, el instalador puede requerir reiniciar el servicio `postgresql-x64-18` al finalizar.
- **Configuración PostGIS:** Durante la instalación, puede que pregunte si desea registrar las bases de datos espaciales (como plantilla `template_postgis` o en una base existente). Para ServiceFlow, basta con instalar los binarios; nosotros ejecutaremos `CREATE EXTENSION postgis;` en la fase de migración.

**NOTA:** Me he detenido aquí y no he ejecutado ninguna descarga ni instalación, manteniendo la restricción absoluta indicada.
