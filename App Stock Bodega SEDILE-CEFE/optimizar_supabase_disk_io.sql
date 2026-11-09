-- ==============================================================================
-- SCRIPT DE OPTIMIZACIÓN DE DISK I/O PARA SUPABASE (SEDILE HRA / STOCK)
-- ==============================================================================
-- Copie y pegue este script en el editor SQL de Supabase (SQL Editor) y presione 'Run'.
-- Este script:
--   1. Crea índices B-Tree para eliminar escaneos secuenciales completos de disco.
--   2. Limpia el historial antiguo acumulado en stock_history (mayor a 60 días).
--   3. Excluye tablas de alto volumen de la réplica en tiempo real innecesaria (WAL).
--   4. Ejecuta VACUUM ANALYZE para desfragmentar disco y actualizar estadísticas.
-- ==============================================================================

-- ------------------------------------------------------------------------------
-- PASO 1: CREACIÓN DE ÍNDICES ESTRATÉGICOS (Evita Full Table Scans en lecturas)
-- ------------------------------------------------------------------------------

-- Tabla: mermas_sedile (Consultas ordenadas por fecha y filtros de mes)
CREATE INDEX IF NOT EXISTS idx_mermas_sedile_fecha_created 
ON public.mermas_sedile (fecha DESC, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_mermas_sedile_seccion 
ON public.mermas_sedile (seccion);

-- Tabla: stock_history (Evita ordenar todo el historial en disco en cada carga)
CREATE INDEX IF NOT EXISTS idx_stock_history_changed_at 
ON public.stock_history (changed_at DESC);

CREATE INDEX IF NOT EXISTS idx_stock_history_stock_id 
ON public.stock_history (stock_id);

-- Tabla: carga_laboral_sedile (Consultas ordenadas por fecha)
CREATE INDEX IF NOT EXISTS idx_carga_laboral_fecha_created 
ON public.carga_laboral_sedile (fecha DESC, created_at DESC);

-- Tabla: peg_pediatria (Consultas de entregas)
CREATE INDEX IF NOT EXISTS idx_peg_pediatria_fecha_created 
ON public.peg_pediatria (fecha_entrega DESC, created_at DESC);

-- Tabla: stock_sedile (Búsquedas y ordenamiento por categoría y nombre)
CREATE INDEX IF NOT EXISTS idx_stock_sedile_categoria_nombre 
ON public.stock_sedile (categoria, nombre);

-- Tabla: config_sedile (Búsqueda de configuraciones por clave única)
CREATE INDEX IF NOT EXISTS idx_config_sedile_key 
ON public.config_sedile (key);

-- ------------------------------------------------------------------------------
-- PASO 2: LIMPIEZA DE HISTORIAL ANTIGUO ACUMULADO (Pruning de stock_history)
-- ------------------------------------------------------------------------------
-- Mantiene los últimos 60 días de cambios y elimina los registros más viejos
-- que sobrecargan el almacenamiento y las consultas.
DELETE FROM public.stock_history 
WHERE changed_at < NOW() - INTERVAL '60 days';

-- ------------------------------------------------------------------------------
-- PASO 3: REMOVER TABLAS DE HISTORIAL DE LA RÉPLICA REALTIME
-- ------------------------------------------------------------------------------
-- stock_history no necesita emitir eventos por WebSocket a cada cliente,
-- ya que cada UPDATE de stock_sedile ya notifica el cambio.
-- Esto reduce significativamente las escrituras en el WAL (Write-Ahead Log).
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM pg_publication_tables 
        WHERE pubname = 'supabase_realtime' AND tablename = 'stock_history'
    ) THEN
        ALTER PUBLICATION supabase_realtime DROP TABLE public.stock_history;
    END IF;
END $$;

-- ------------------------------------------------------------------------------
-- PASO 4: DESFRAGMENTACIÓN DE DISCO Y ACTUALIZACIÓN DE ESTADÍSTICAS
-- ------------------------------------------------------------------------------
-- Reclama espacio en disco de filas actualizadas/borradas y recalcula los planes
-- de ejecución para que Postgres use los nuevos índices en lugar del disco.
VACUUM (ANALYZE, VERBOSE);

-- ------------------------------------------------------------------------------
-- PASO 5: DIAGNÓSTICO DEL TAMAÑO DE TABLAS (Para verificar espacio liberado)
-- ------------------------------------------------------------------------------
SELECT 
    table_name AS tabla,
    pg_size_pretty(pg_total_relation_size(quote_ident(table_name))) AS tamano_total,
    pg_size_pretty(pg_relation_size(quote_ident(table_name))) AS tamano_datos,
    pg_size_pretty(pg_indexes_size(quote_ident(table_name))) AS tamano_indices
FROM information_schema.tables
WHERE table_schema = 'public'
ORDER BY pg_total_relation_size(quote_ident(table_name)) DESC;
