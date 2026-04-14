
import { ApiPostPayload, N8nApiResponse } from '../types.ts';

const API_ENDPOINT = 'https://webhookn8n.innova1001.com.br/webhook/reservas_grupo1001'; // This endpoint will now handle the reservation
const VERIFICATION_ENDPOINT = 'https://qdpzlxqsjbyxcajinixi.supabase.co/functions/v1/verificar_pagamento';

interface PaymentStatusResponse {
  status: 'pago' | 'aguardando_pagamento' | string;
}

export const checkPaymentStatus = async (txid: string): Promise<PaymentStatusResponse> => {
  const response = await fetch(VERIFICATION_ENDPOINT, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ txid }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Erro ao verificar pagamento: ${response.status} - ${errorText}`);
  }
  
  // Handle both object and array-wrapped object responses for robustness
  let data = await response.json();
  if (Array.isArray(data) && data.length > 0) {
    data = data[0];
  }

  return data;
};


export const submitReservation = async (payload: ApiPostPayload): Promise<N8nApiResponse> => {
  const response = await fetch(API_ENDPOINT, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) { 
    let detailedErrorMessage = `Erro HTTP: ${response.status} ${response.statusText}`;
    try {
      const errorData = await response.json();
      if (errorData && errorData.message) { 
        detailedErrorMessage = errorData.message;
      }
    } catch (e) {
        // Ignore if error response is not JSON
    }
    throw new Error(detailedErrorMessage);
  }

  const responseText = await response.text();
  if (!responseText) {
    throw new Error('Resposta do servidor vazia. A API não retornou os dados do Pix necessários.');
  }

  try {
    let successData = JSON.parse(responseText);
    
    // The webhook might return an array with a single object.
    // We check for that and extract the object if necessary.
    if (Array.isArray(successData) && successData.length > 0) {
      successData = successData[0];
    }

    // After potentially unwrapping, validate the final object has the required fields.
    if (successData && successData.pixCopiaECola && successData.pixUrl && successData.txid) {
        return successData as N8nApiResponse;
    } else {
        console.error("Parsed API response is missing required PIX fields:", successData);
        throw new Error('A API retornou uma resposta, mas os dados do Pix estão incompletos ou em formato inesperado.');
    }
  } catch (e) {
    console.error("Failed to parse JSON response:", responseText);
    throw new Error(`Resposta do servidor inválida. Não foi possível processar os dados recebidos.`);
  }
};