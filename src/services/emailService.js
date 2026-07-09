export async function sendEmail(data) {
  const accessKey = import.meta.env.PUBLIC_WEB3FORMS_ACCESS_KEY;
  const accessKeyAlt = import.meta.env.PUBLIC_WEB3FORMS_ACCESS_KEY_ALT;
  
  if (!accessKey && !accessKeyAlt) {
    console.warn("Web3Forms access keys are missing in environmental variables.");
    throw new Error("Las claves de Web3Forms no están configuradas en las variables de entorno.");
  }

  // Mapeamos los campos para enviar a Web3Forms de forma ordenada y legible en el email
  const payload = {
    subject: data.Asunto || "Nueva Cotización desde el Sitio Web",
    from_name: "Web Banda Bruna",
    
    // Campos del formulario
    "Nombre de Contacto": data.Nombre || data.name,
    "Teléfono": data.Teléfono || data.Telefono || data.phone,
    "Correo Electrónico": data.Email || data.email,
    "Tipo de Evento": data["Tipo de Evento"] || data.tipo_evento || data.type,
    "Fecha Tentativa": data["Fecha Tentativa"] || data.fecha_evento || data.date,
    "Ciudad/Comuna": data["Ciudad/Comuna"] || data.ciudad || data.city,
    "Detalles del Requerimiento": data["Detalles/Mensaje"] || data.mensaje || data.message
  };

  const promises = [];

  // Enviar a la dirección principal (Zoho: contacto@bandabruna.cl)
  if (accessKey) {
    promises.push(
      fetch("https://api.web3forms.com/submit", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Accept": "application/json"
        },
        body: JSON.stringify({
          ...payload,
          access_key: accessKey
        })
      })
    );
  }

  // Enviar a la dirección secundaria (Gmail: contactobandabruna@gmail.com)
  if (accessKeyAlt) {
    promises.push(
      fetch("https://api.web3forms.com/submit", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Accept": "application/json"
        },
        body: JSON.stringify({
          ...payload,
          access_key: accessKeyAlt
        })
      })
    );
  }

  // Ejecutamos ambas solicitudes en paralelo
  const responses = await Promise.all(promises);

  let success = false;
  let lastError = null;

  // Verificamos que al menos uno de los envíos haya tenido éxito
  for (const response of responses) {
    try {
      const result = await response.json();
      if (response.ok && result.success) {
        success = true;
      } else {
        lastError = result.message || "Error en la respuesta de Web3Forms.";
      }
    } catch (err) {
      lastError = err.message;
    }
  }

  if (!success) {
    throw new Error(lastError || "Error al enviar la solicitud de correo.");
  }

  return { success: true };
}
