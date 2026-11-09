-- ==============================================================================
-- SOLUCIÓN A RLS Y VISIBILIDAD DE PACIENTES ENTRE COLEGAS / TURNOS EN SUPABASE
-- ==============================================================================
-- ¿Por qué ocurría el problema?
-- Al activar RLS en Supabase, por defecto PostgreSQL bloquea el acceso o restringe
-- que cada usuario solo vea sus propios registros (auth.uid() = user_id).
-- En un hospital, las camas y pacientes pertenecen al servicio clínico (HRA),
-- por lo que cualquier nutricionista autenticado (turnos, reemplazos, etc.)
-- debe poder ver y editar los pacientes de la sala.
--
-- INSTRUCCIONES:
-- 1. Ingrese a su proyecto en Supabase (https://supabase.com/dashboard)
-- 2. Vaya a "SQL Editor" en el menú lateral izquierdo.
-- 3. Cree una nueva consulta, pegue todo este código y presione "Run" (Ejecutar).
-- ==============================================================================

-- 1. TABLA 'pacientes' (Censo Clínico de Sala, Diagnósticos, Evaluaciones)
ALTER TABLE IF EXISTS public.pacientes ENABLE ROW LEVEL SECURITY;

-- Eliminar políticas restrictivas previas si existían
DROP POLICY IF EXISTS "Permitir todo a usuarios autenticados en pacientes" ON public.pacientes;
DROP POLICY IF EXISTS "Users can only see their own patients" ON public.pacientes;
DROP POLICY IF EXISTS "Individuals can view their own patients" ON public.pacientes;
DROP POLICY IF EXISTS "Permitir leer a usuarios autenticados" ON public.pacientes;
DROP POLICY IF EXISTS "Permitir insertar a usuarios autenticados" ON public.pacientes;
DROP POLICY IF EXISTS "Permitir actualizar a usuarios autenticados" ON public.pacientes;
DROP POLICY IF EXISTS "Permitir eliminar a usuarios autenticados" ON public.pacientes;

-- Crear política colaborativa completa para todos los nutricionistas autenticados
CREATE POLICY "Permitir todo a usuarios autenticados en pacientes"
ON public.pacientes
FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);


-- 2. TABLA 'config_camas' (Configuración de cupos y camas por servicio)
ALTER TABLE IF EXISTS public.config_camas ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Permitir todo a usuarios autenticados en config_camas" ON public.config_camas;
DROP POLICY IF EXISTS "Permitir leer config_camas" ON public.config_camas;

CREATE POLICY "Permitir todo a usuarios autenticados en config_camas"
ON public.config_camas
FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);


-- 3. TABLA 'camas' (En caso de existir tabla individual de camas)
DO $$
BEGIN
    IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'camas') THEN
        ALTER TABLE public.camas ENABLE ROW LEVEL SECURITY;
        DROP POLICY IF EXISTS "Permitir todo a usuarios autenticados en camas" ON public.camas;
        CREATE POLICY "Permitir todo a usuarios autenticados en camas"
        ON public.camas FOR ALL TO authenticated USING (true) WITH CHECK (true);
    END IF;
END $$;


-- 4. TABLA 'prescripciones' (Fórmulas, SEDILE y órdenes dietéticas)
DO $$
BEGIN
    IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'prescripciones') THEN
        ALTER TABLE public.prescripciones ENABLE ROW LEVEL SECURITY;
        DROP POLICY IF EXISTS "Permitir todo a usuarios autenticados en prescripciones" ON public.prescripciones;
        CREATE POLICY "Permitir todo a usuarios autenticados en prescripciones"
        ON public.prescripciones FOR ALL TO authenticated USING (true) WITH CHECK (true);
    END IF;
END $$;


-- 5. TABLA 'censo_diario' (Registros históricos de censo)
DO $$
BEGIN
    IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'censo_diario') THEN
        ALTER TABLE public.censo_diario ENABLE ROW LEVEL SECURITY;
        DROP POLICY IF EXISTS "Permitir todo a usuarios autenticados en censo_diario" ON public.censo_diario;
        CREATE POLICY "Permitir todo a usuarios autenticados en censo_diario"
        ON public.censo_diario FOR ALL TO authenticated USING (true) WITH CHECK (true);
    END IF;
END $$;


-- 6. VERIFICACIÓN FINAL: Muestra el estado de RLS de las tablas de la app
SELECT 
    tablename AS tabla, 
    rowsecurity AS rls_activado,
    (SELECT count(*) FROM pg_policies WHERE tablename = pt.tablename) AS total_politicas
FROM pg_tables pt
WHERE schemaname = 'public'
ORDER BY tablename;
