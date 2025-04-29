
// Archivo que simula un servidor proxy para manejar solicitudes HTTP
// Este archivo tendría que ser implementado en un servidor real
// Aquí solo se muestra como una simulación

export default function handler(req, res) {
  // Solo permitimos método POST para este proxy
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { targetUrl, method, headers, body } = req.body;

    if (!targetUrl) {
      return res.status(400).json({ error: 'Target URL is required' });
    }

    // Aquí iría la lógica para hacer la solicitud HTTP desde el servidor
    // En un entorno real, esto se ejecutaría en el servidor
    
    fetch(targetUrl, {
      method: method || 'GET',
      headers: headers || {},
      body: body ? JSON.stringify(body) : undefined
    })
      .then(async (response) => {
        const contentType = response.headers.get('content-type');
        let data;
        
        try {
          if (contentType && contentType.includes('application/json')) {
            data = await response.json();
          } else {
            data = await response.text();
          }
        } catch (error) {
          data = await response.text();
        }
        
        // Devolvemos la respuesta al cliente
        return res.status(response.status).json({
          status: response.status,
          data: data,
          headers: Object.fromEntries(response.headers.entries())
        });
      })
      .catch((error) => {
        console.error('Error en proxy HTTP:', error);
        return res.status(500).json({ 
          error: 'Error al realizar la solicitud HTTP', 
          details: error.message 
        });
      });
  } catch (error) {
    console.error('Error en proxy HTTP:', error);
    return res.status(500).json({ 
      error: 'Error inesperado', 
      details: error.message 
    });
  }
}
