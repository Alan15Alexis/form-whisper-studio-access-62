export const validateUrl = (url: string) => {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
};

export const getResponseBadgeColor = (status: number) => {
  if (status >= 200 && status < 300) return "bg-green-100 text-green-700 border-green-200";
  if (status >= 300 && status < 400) return "bg-yellow-100 text-yellow-700 border-yellow-200";
  if (status >= 400 && status < 500) return "bg-red-100 text-red-700 border-red-200";
  if (status >= 500) return "bg-purple-100 text-purple-700 border-purple-200";
  return "bg-gray-100 text-gray-700 border-gray-200";
};

export const getResponseMessage = (status: number) => {
  if (status >= 200 && status < 300) return "Éxito - La solicitud se procesó correctamente";
  if (status >= 300 && status < 400) return "Redirección - Puede requerir ajustes adicionales";
  if (status >= 400 && status < 500) return "Error del cliente - Verifica los datos enviados";
  if (status >= 500) return "Error del servidor - Contacta al administrador del sistema";
  return "Estado desconocido";
};

export const getFieldTypeName = (type: string): string => {
  const typeNames: Record<string, string> = {
    text: "Texto corto",
    textarea: "Texto largo",
    email: "Correo electrónico",
    number: "Número",
    date: "Fecha",
    time: "Hora",
    select: "Selección única",
    checkbox: "Casillas de verificación",
    radio: "Opciones múltiples",
    yesno: "Sí/No",
    "image-select": "Selección de imagen",
    fullname: "Nombre completo",
    phone: "Teléfono",
    address: "Dirección",
    "image-upload": "Subir imagen",
    "file-upload": "Subir archivo",
    drawing: "Dibujo",
    signature: "Firma",
    "opinion-scale": "Escala de opinión",
    "star-rating": "Calificación con estrellas",
    matrix: "Matriz",
    ranking: "Ranking",
    terms: "Términos y condiciones",
    welcome: "Mensaje de bienvenida",
    timer: "Temporizador"
  };
  
  return typeNames[type] || type;
};

// Function to send HTTP requests through the backend proxy
export const sendHttpRequest = async (
  url: string,
  method: string,
  headers: Record<string, string>,
  body: any
): Promise<{ status: number; data: any }> => {
  try {
    console.log(`Sending request to: ${url}`);
    console.log(`Method: ${method}`);
    console.log(`Headers:`, headers);
    if (body) console.log(`Body: ${JSON.stringify(body)}`);

    // Send the request through our proxy endpoint
    const response = await fetch('/api/http-proxy', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        targetUrl: url,
        method: method,
        headers: headers,
        body: body
      })
    });

    if (!response.ok) {
      let errorText = '';
      try {
        const errorData = await response.json();
        errorText = errorData.error || errorData.message || `Error ${response.status}`;
      } catch {
        errorText = `Error ${response.status}`;
      }
      
      throw new Error(`Proxy error: ${errorText}`);
    }

    const responseData = await response.json();
    
    return {
      status: responseData.status,
      data: responseData.data
    };
  } catch (error) {
    console.error("HTTP Request Error:", error);
    return {
      status: 0,
      data: error instanceof Error ? error.message : "Unknown error"
    };
  }
};
