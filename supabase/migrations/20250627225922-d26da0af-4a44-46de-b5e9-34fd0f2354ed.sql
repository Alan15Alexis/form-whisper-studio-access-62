
-- Add status column to usuario_administrador table for approval workflow
ALTER TABLE usuario_administrador 
ADD COLUMN estatus_aprobacion VARCHAR(20) DEFAULT 'pendiente' NOT NULL;

-- Add constraint to ensure only valid status values
ALTER TABLE usuario_administrador 
ADD CONSTRAINT check_estatus_aprobacion 
CHECK (estatus_aprobacion IN ('pendiente', 'aprobado', 'rechazado'));

-- Update existing records to have 'aprobado' status (assuming they are already active)
UPDATE usuario_administrador 
SET estatus_aprobacion = 'aprobado' 
WHERE estatus_aprobacion = 'pendiente';

-- Add index for better performance on status queries
CREATE INDEX idx_usuario_administrador_estatus_aprobacion 
ON usuario_administrador(estatus_aprobacion);
