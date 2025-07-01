
-- Add the colaboradores column to store collaborator emails as JSON array
ALTER TABLE formulario_construccion 
ADD COLUMN IF NOT EXISTS colaboradores jsonb DEFAULT '[]'::jsonb;

-- Create an index for better performance when querying collaborators
CREATE INDEX IF NOT EXISTS idx_formulario_construccion_colaboradores_gin 
ON formulario_construccion USING GIN(colaboradores);

-- Update any existing NULL values to empty array
UPDATE formulario_construccion 
SET colaboradores = '[]'::jsonb 
WHERE colaboradores IS NULL;
