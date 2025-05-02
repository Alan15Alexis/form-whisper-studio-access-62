
// Utilidades para conectar a MySQL y manejar respuestas de formularios
import mysql from 'mysql2/promise';

// Configuración para la conexión a MySQL
// IMPORTANTE: Estas variables deben ser reemplazadas con tus datos reales
// o configurarse usando variables de entorno
const DB_CONFIG = {
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'tu_usuario',
  password: process.env.DB_PASS || 'tu_contraseña',
  database: process.env.DB_NAME || 'tu_base_de_datos'
};

// Función para obtener una conexión a MySQL
export async function getConnection() {
  try {
    // Crear un pool de conexiones para mejor rendimiento
    const pool = mysql.createPool({
      ...DB_CONFIG,
      waitForConnections: true,
      connectionLimit: 10,
      queueLimit: 0
    });
    
    return pool;
  } catch (error) {
    console.error('Error al conectar a MySQL:', error);
    throw error;
  }
}

// Función para guardar respuestas de formularios en la base de datos
export async function saveFormResponse(
  formId: string, 
  responses: Record<string, any>,
  submittedBy: string = 'anonymous',
  formTitle: string = 'Untitled Form'
) {
  // Validar que las respuestas no estén vacías
  if (!responses || Object.keys(responses).length === 0) {
    throw new Error('Las respuestas del formulario no pueden estar vacías');
  }

  try {
    // Obtener conexión del pool
    const pool = await getConnection();
    
    // Guardar las respuestas en la tabla form_responses
    // La columna created_at se establece automáticamente si está configurada como TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    const [result] = await pool.execute(
      'INSERT INTO form_responses (form_id, responses, submitted_by, form_title) VALUES (?, ?, ?, ?)',
      [formId, JSON.stringify(responses), submittedBy, formTitle]
    );
    
    return result;
  } catch (error) {
    console.error('Error al guardar respuestas en MySQL:', error);
    throw error;
  }
}

/*
SQL para crear la tabla en tu base de datos MySQL:

CREATE TABLE form_responses (
  id INT AUTO_INCREMENT PRIMARY KEY,
  form_id VARCHAR(255) NOT NULL,
  responses JSON NOT NULL,
  submitted_by VARCHAR(255),
  form_title VARCHAR(255),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

*/
