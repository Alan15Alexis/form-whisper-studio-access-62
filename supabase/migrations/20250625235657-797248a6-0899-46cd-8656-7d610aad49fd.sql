
-- Asegurar que la columna colaboradores existe y tiene el tipo correcto
DO $$
BEGIN
    -- Verificar si la columna colaboradores existe
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'formulario_construccion' 
        AND column_name = 'colaboradores'
    ) THEN
        -- Agregar la columna si no existe
        ALTER TABLE public.formulario_construccion 
        ADD COLUMN colaboradores jsonb DEFAULT '[]'::jsonb;
    END IF;
END $$;

-- Crear un índice para mejorar el rendimiento de las consultas en colaboradores
CREATE INDEX IF NOT EXISTS idx_formulario_construccion_colaboradores 
ON public.formulario_construccion USING gin (colaboradores);
