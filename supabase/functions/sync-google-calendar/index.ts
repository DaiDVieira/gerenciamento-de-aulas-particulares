import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface CalendarEventRequest {
  summary: string;
  description: string;
  startDateTime: string;
  endDateTime: string;
  attendees: string[];
  action: 'create' | 'update' | 'delete';
  eventId?: string;
}

serve(async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { summary, description, startDateTime, endDateTime, attendees, action, eventId }: CalendarEventRequest = await req.json();

    console.log("=== SIMULAÇÃO GOOGLE CALENDAR ===");
    console.log(`Ação: ${action}`);
    console.log(`Evento: ${summary}`);
    console.log(`Descrição: ${description}`);
    console.log(`Início: ${startDateTime}`);
    console.log(`Fim: ${endDateTime}`);
    console.log(`Participantes: ${attendees.join(', ')}`);
    if (eventId) console.log(`Event ID: ${eventId}`);
    console.log("================================");

    // Simular delay de API
    await new Promise(resolve => setTimeout(resolve, 800));

    // Simular resposta de sucesso
    const mockResponse = {
      success: true,
      eventId: eventId || `mock_event_${Date.now()}`,
      summary,
      description,
      startDateTime,
      endDateTime,
      attendees,
      action,
      htmlLink: `https://calendar.google.com/calendar/event?eid=mock_${Date.now()}`,
      status: "confirmed",
      created: new Date().toISOString(),
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
    console.error("Erro ao simular Google Calendar:", error);
    return new Response(
      JSON.stringify({ error: error.message, simulation: true }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
});
