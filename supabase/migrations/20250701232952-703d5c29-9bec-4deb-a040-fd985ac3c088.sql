
-- Agregar columna para almacenar el correo del administrador que creó el formulario
ALTER TABLE formulario_construccion 
ADD COLUMN IF NOT EXISTS administrador_creador text;

-- Actualizar los registros existentes para establecer el administrador_creador basado en el campo administrador actual
UPDATE formulario_construccion 
SET administrador_creador = administrador 
WHERE administrador_creador IS NULL AND administrador IS NOT NULL;

-- Crear un índice para mejorar las consultas por administrador_creador
CREATE INDEX IF NOT EXISTS idx_formulario_construccion_administrador_creador 
ON formulario_construccion(administrador_creador);

-- Crear un índice para mejorar las consultas por colaboradores
CREATE INDEX IF NOT EXISTS idx_formulario_construccion_colaboradores 
ON formulario_construccion USING GIN(colaboradores);
