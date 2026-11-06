-- Script de Migración Completo: Desbloquear Secciones, Motivos y Sincronización Global SEDILE-CEFE
-- Ejecute este script en el Editor SQL de Supabase (SQL Editor) para habilitar la persistencia y sincronización total en la nube.

-- 1. Eliminar restricciones antiguas de sección y motivo en mermas_sedile
ALTER TABLE public.mermas_sedile DROP CONSTRAINT IF EXISTS mermas_sedile_seccion_check;
ALTER TABLE public.mermas_sedile DROP CONSTRAINT IF EXISTS check_mermas_seccion;
ALTER TABLE public.mermas_sedile DROP CONSTRAINT IF EXISTS mermas_sedile_motivo_check;
ALTER TABLE public.mermas_sedile DROP CONSTRAINT IF EXISTS check_mermas_motivo;

-- 2. Asegurar que las columnas sean de tipo TEXT libre para admitir pisos (2°piso, 4°piso, UCO), servicios y motivos nuevos
ALTER TABLE public.mermas_sedile ALTER COLUMN seccion TYPE TEXT;
ALTER TABLE public.mermas_sedile ALTER COLUMN motivo TYPE TEXT;
ALTER TABLE public.mermas_sedile ALTER COLUMN producto_unidad TYPE TEXT;

-- 3. Habilitar permisos de lectura, inserción, actualización y eliminación públicas en mermas_sedile
ALTER TABLE public.mermas_sedile ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Permitir inserción de mermas" ON public.mermas_sedile;
CREATE POLICY "Permitir inserción de mermas" ON public.mermas_sedile FOR INSERT WITH CHECK (true);
DROP POLICY IF EXISTS "Permitir actualización de mermas" ON public.mermas_sedile;
CREATE POLICY "Permitir actualización de mermas" ON public.mermas_sedile FOR UPDATE USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "Permitir lectura de mermas a todo el mundo" ON public.mermas_sedile;
CREATE POLICY "Permitir lectura de mermas a todo el mundo" ON public.mermas_sedile FOR SELECT USING (true);
DROP POLICY IF EXISTS "Permitir eliminación de mermas" ON public.mermas_sedile;
CREATE POLICY "Permitir eliminación de mermas" ON public.mermas_sedile FOR DELETE USING (true);

-- 4. Crear tabla de configuración global para sincronizar precios de fórmulas y configuraciones en todos los dispositivos
CREATE TABLE IF NOT EXISTS public.config_sedile (
    key TEXT PRIMARY KEY,
    value JSONB NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);
ALTER TABLE public.config_sedile ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Permitir todo en config_sedile" ON public.config_sedile;
CREATE POLICY "Permitir todo en config_sedile" ON public.config_sedile FOR ALL USING (true) WITH CHECK (true);
