
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
