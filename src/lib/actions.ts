import { supabase } from "./supabase";
import type { ScoreResult } from "./scoring";

// Guardar diagnóstico cuando el usuario completa el test
export async function saveDiagnostico(
  nombre: string,
  email: string,
  respuestas: Record<number, number>,
  result: ScoreResult
): Promise<string | null> {
  try {
    const { data, error } = await supabase
      .from("diagnosticos")
      .insert({
        nombre: nombre,
        email: email,
        respuestas: respuestas,
        scores_dimensiones: result.ds,
        score_final: result.fin,
        rango: result.rg,
        alertas_criticas: result.al,
      })
      .select("id")
      .single();

    if (error) {
      console.error("Error guardando diagnóstico:", error);
      return null;
    }

    return data.id;
  } catch (err) {
    console.error("Error guardando diagnóstico:", err);
    return null;
  }
}

// Guardar lead de consultoría desde el modal
export async function saveLeadConsultoria(
  formData: {
    nombre: string;
    email: string;
    whatsapp: string;
    empresa: string;
    rubro: string;
    empleados: string;
    facturacion: string;
    motivo: string;
    detalle: string;
    urgencia: string;
  },
  result: ScoreResult | null,
  diagnosticoId: string | null
): Promise<boolean> {
  try {
    const { error } = await supabase
      .from("leads_consultoria")
      .insert({
        diagnostico_id: diagnosticoId,
        nombre: formData.nombre,
        email: formData.email,
        whatsapp: formData.whatsapp,
        empresa: formData.empresa,
        rubro: formData.rubro || null,
        empleados: formData.empleados,
        facturacion: formData.facturacion || null,
        motivo: formData.motivo,
        detalle: formData.detalle,
        urgencia: formData.urgencia || null,
        score_total: result ? result.fin : null,
        resultado_rango: result ? result.rg : null,
        alertas_principales: result ? result.al.join(" | ") : null,
        source: "cta_consultoria_diagnostico",
      });

    if (error) {
      console.error("Error guardando lead:", error);
      return false;
    }

    return true;
  } catch (err) {
    console.error("Error guardando lead:", err);
    return false;
  }
}

// Marcar diagnóstico como premium (después del pago)
export async function marcarComoPremium(
  diagnosticoId: string,
  pagoReferencia: string
): Promise<boolean> {
  try {
    const { error } = await supabase
      .from("diagnosticos")
      .update({ compro_premium: true })
      .eq("id", diagnosticoId);

    if (error) {
      console.error("Error actualizando diagnóstico:", error);
      return false;
    }

    // Guardar el pago
    await supabase.from("pagos").insert({
      diagnostico_id: diagnosticoId,
      monto: 9.99,
      moneda: "USD",
      pasarela: "mercadopago",
      estado: "completado",
      referencia_externa: pagoReferencia,
    });

    return true;
  } catch (err) {
    console.error("Error:", err);
    return false;
  }
}

// Cargar diagnóstico guardado por ID
export async function loadDiagnostico(id: string): Promise<{
  nombre: string;
  email: string;
  respuestas: Record<number, number>;
  scores_dimensiones: Record<string, number>;
  score_final: number;
  rango: string;
  alertas_criticas: string[];
  compro_premium: boolean;
} | null> {
  try {
    const { data, error } = await supabase
      .from("diagnosticos")
      .select("nombre, email, respuestas, scores_dimensiones, score_final, rango, alertas_criticas, compro_premium")
      .eq("id", id)
      .single();

    if (error || !data) {
      console.error("Error cargando diagnóstico:", error);
      return null;
    }

    return data;
  } catch (err) {
    console.error("Error cargando diagnóstico:", err);
    return null;
  }
}