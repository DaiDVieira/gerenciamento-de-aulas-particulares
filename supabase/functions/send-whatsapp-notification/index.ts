import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface NotificationRequest {
  to: string;
  message: string;
  type: 'criacao' | 'alteracao' | 'cancelamento';
}

serve(async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { to, message, type }: NotificationRequest = await req.json();

    console.log("=== SIMULAÇÃO DE NOTIFICAÇÃO WHATSAPP ===");
    console.log(`Tipo: ${type}`);
    console.log(`Para: ${to}`);
    console.log(`Mensagem: ${message}`);
    console.log("=======================================");

    // Simular delay de envio
    await new Promise(resolve => setTimeout(resolve, 500));

    // Simular resposta de sucesso
    const mockResponse = {
      success: true,
      messageId: `mock_${Date.now()}`,
      to,
      message,
      type,
      sentAt: new Date().toISOString(),
      status: "delivered",
      simulation: true
    };

    return new Response(JSON.stringify(mockResponse), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        ...corsHeaders,
      },
    });
  } catch (error: any) {
    console.error("Erro ao simular notificação WhatsApp:", error);
    return new Response(
      JSON.stringify({ error: error.message, simulation: true }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
});
