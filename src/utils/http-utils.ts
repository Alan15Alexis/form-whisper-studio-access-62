
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

// Función mejorada para enviar solicitudes HTTP directamente al destino
export const sendHttpRequest = async (config: {
  url: string;
  method: string;
  headers: Record<string, string>;
  body: any;
  timeout?: number;
}) => {
  const { url, method, headers, body, timeout = 10000 } = config;
  
  console.log(`Realizando solicitud ${method} a ${url}`);
  console.log("Headers:", headers);
  console.log("Body:", JSON.stringify(body));
  
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);
    
    const requestOptions: RequestInit = {
      method,
      headers,
      body: method !== 'GET' ? JSON.stringify(body) : undefined,
      signal: controller.signal,
      mode: 'cors', // Intentamos con cors primero
    };
    
    const response = await fetch(url, requestOptions);
    clearTimeout(timeoutId);
    
    let responseData;
    const contentType = response.headers.get('content-type');
    if (contentType && contentType.includes('application/json')) {
      responseData = await response.json();
    } else {
      responseData = await response.text();
    }
    
    return {
      status: response.status,
      data: responseData,
      ok: response.ok,
      statusText: response.statusText
    };
  } catch (error: any) {
    console.error("Error en la solicitud HTTP:", error);
    
    // Determinamos el tipo de error para dar mensajes más descriptivos
    let errorType = "unknown";
    let errorMessage = "Error desconocido";
    
    if (error.name === 'AbortError') {
      errorType = "timeout";
      errorMessage = "La solicitud excedió el tiempo de espera";
    } else if (error.message?.includes('networker') || 
              error.message?.includes('Network') ||
              error.message?.includes('Failed to fetch')) {
      errorType = "network";
      errorMessage = "Error de conexión de red";
    } else if (error.message?.includes('CORS') || 
              error.message?.includes('cors')) {
      errorType = "cors";
      errorMessage = "Error de CORS: el servidor no permite solicitudes desde este origen";
    }
    
    return {
      status: 0,
      data: errorMessage,
      ok: false,
      statusText: errorType,
      error: error.message || "Error al procesar la solicitud"
    };
  }
};
