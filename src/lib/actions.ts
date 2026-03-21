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
import { NextRequest, NextResponse } from "next/server";
import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { tipo, destinatario, nombre, score, rango, label, alertas, color } = body;

    let subject = "";
    let html = "";

    if (tipo === "resultado_gratis") {
      subject = "Tu diagnóstico financiero — " + score + "/100";
      html = buildEmailGratis(nombre, score, rango, label, alertas, color);
    } else if (tipo === "resultado_premium") {
      subject = "Tu Reporte Premium está disponible";
      html = buildEmailPremium(nombre, score, label);
    } else if (tipo === "followup_48h") {
      subject = nombre + ", tu plan de acción está esperándote";
      html = buildEmailFollowup(nombre, score, label);
    } else {
      return NextResponse.json({ error: "Tipo de email no válido" }, { status: 400 });
    }

    const { data, error } = await resend.emails.send({
      from: "Fincheq <onboarding@resend.dev>",
      to: [destinatario],
      subject: subject,
      html: html,
    });

    if (error) {
      console.error("Error enviando email:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, id: data?.id });
  } catch (err) {
    console.error("Error en API de email:", err);
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}

// ═══ EMAIL TEMPLATES ═══

function getColorName(rango: string): string {
  if (rango === "critico") return "#FF4D6A";
  if (rango === "fragil") return "#FF9F43";
  if (rango === "inestable") return "#FBBF24";
  if (rango === "ordenado") return "#008efe";
  return "#34D399";
}

function baseWrapper(content: string): string {
  return '<!DOCTYPE html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1.0"></head><body style="margin:0;padding:0;background:#050509;font-family:system-ui,-apple-system,sans-serif;">'
    + '<div style="max-width:520px;margin:0 auto;padding:32px 24px;">'
    + content
    + '<div style="border-top:1px solid #1A1A2E;padding-top:20px;margin-top:32px;text-align:center;">'
    + '<p style="font-size:11px;color:#6B7194;margin:0;">Fincheq es una herramienta de <strong style="color:#cbfaff;">SECRITO Consulting</strong></p>'
    + '</div>'
    + '</div></body></html>';
}

function buildEmailGratis(nombre: string, score: number, rango: string, label: string, alertas: string[], color: string): string {
  const rangoColor = getColorName(rango);

  let alertasHtml = "";
  if (alertas && alertas.length > 0) {
    alertasHtml = '<div style="background:#FF4D6A15;border:1px solid #FF4D6A25;border-radius:12px;padding:20px;margin-bottom:24px;">'
      + '<p style="font-size:13px;font-weight:700;color:#FF4D6A;margin:0 0 12px;">⚠️ Alertas detectadas</p>';
    for (let i = 0; i < Math.min(alertas.length, 2); i++) {
      alertasHtml += '<p style="font-size:13px;color:#FF4D6A;margin:0 0 6px;line-height:1.5;">• ' + alertas[i] + '</p>';
    }
    alertasHtml += '</div>';
  }

  const content = ''
    + '<div style="text-align:center;margin-bottom:28px;">'
    + '<div style="width:40px;height:40px;border-radius:10px;background:linear-gradient(135deg,#008efe,#fe26fe);display:inline-flex;align-items:center;justify-content:center;margin-bottom:16px;">'
    + '<span style="color:#fff;font-size:18px;font-weight:800;">F</span>'
    + '</div>'
    + '<h1 style="font-size:24px;font-weight:800;color:#cbfaff;margin:0 0 4px;">Tu Diagnóstico Financiero</h1>'
    + '<p style="font-size:14px;color:#6B7194;margin:0;">Hola ' + nombre + ', acá está tu resultado</p>'
    + '</div>'

    + '<div style="background:#0C0C14;border:1px solid #1A1A2E;border-radius:16px;padding:28px;text-align:center;margin-bottom:24px;">'
    + '<p style="font-size:56px;font-weight:800;color:' + rangoColor + ';margin:0;line-height:1;">' + score + '</p>'
    + '<p style="font-size:14px;color:#6B7194;margin:4px 0 12px;">/100</p>'
    + '<span style="display:inline-block;background:' + rangoColor + '20;color:' + rangoColor + ';font-size:13px;font-weight:700;padding:6px 16px;border-radius:20px;">' + label + '</span>'
    + '</div>'

    + alertasHtml

    + '<div style="background:#0C0C14;border:1px solid #1A1A2E;border-radius:12px;padding:20px;margin-bottom:24px;">'
    + '<p style="font-size:13px;font-weight:700;color:#008efe;margin:0 0 8px;text-transform:uppercase;letter-spacing:0.06em;">¿Querés el plan de acción completo?</p>'
    + '<p style="font-size:13px;color:#8890B0;margin:0 0 16px;line-height:1.5;">Tu reporte premium incluye scores exactos por dimensión, orden de prioridad, plan a 7/30/90 días, checklist y plantillas.</p>'
    + '<div style="text-align:center;">'
    + '<span style="font-size:24px;font-weight:800;color:#cbfaff;">USD 9.99</span>'
    + '<span style="font-size:12px;color:#6B7194;margin-left:6px;">pago único</span>'
    + '</div>'
    + '</div>'

    + '<div style="text-align:center;">'
    + '<p style="font-size:12px;color:#6B7194;margin:0;">Accedé a tu resultado completo en Fincheq-six.vercel.app</p>'
    + '</div>';

  return baseWrapper(content);
}

function buildEmailPremium(nombre: string, score: number, label: string): string {
  const content = ''
    + '<div style="text-align:center;margin-bottom:28px;">'
    + '<div style="width:40px;height:40px;border-radius:10px;background:linear-gradient(135deg,#008efe,#fe26fe);display:inline-flex;align-items:center;justify-content:center;margin-bottom:16px;">'
    + '<span style="color:#fff;font-size:18px;font-weight:800;">F</span>'
    + '</div>'
    + '<h1 style="font-size:24px;font-weight:800;color:#cbfaff;margin:0 0 4px;">Tu Reporte Premium</h1>'
    + '<p style="font-size:14px;color:#6B7194;margin:0;">Hola ' + nombre + ', tu reporte está disponible</p>'
    + '</div>'

    + '<div style="background:#0C0C14;border:1px solid #1A1A2E;border-radius:16px;padding:24px;margin-bottom:24px;">'
    + '<p style="font-size:14px;color:#8890B0;margin:0 0 16px;line-height:1.6;">Gracias por tu compra. Tu Reporte Premium incluye:</p>'
    + '<p style="font-size:13px;color:#cbfaff;margin:0 0 8px;">✓ Scores exactos de las 7 dimensiones</p>'
    + '<p style="font-size:13px;color:#cbfaff;margin:0 0 8px;">✓ Orden de prioridad 1-2-3</p>'
    + '<p style="font-size:13px;color:#cbfaff;margin:0 0 8px;">✓ Plan de acción a 7, 30 y 90 días</p>'
    + '<p style="font-size:13px;color:#cbfaff;margin:0 0 8px;">✓ Checklist de implementación</p>'
    + '<p style="font-size:13px;color:#cbfaff;margin:0;">✓ 3 plantillas accionables</p>'
    + '</div>'

    + '<div style="text-align:center;">'
    + '<p style="font-size:13px;color:#6B7194;margin:0;">Accedé a tu reporte premium en Fincheq-six.vercel.app</p>'
    + '</div>';

  return baseWrapper(content);
}

function buildEmailFollowup(nombre: string, score: number, label: string): string {
  const content = ''
    + '<div style="text-align:center;margin-bottom:28px;">'
    + '<div style="width:40px;height:40px;border-radius:10px;background:linear-gradient(135deg,#008efe,#fe26fe);display:inline-flex;align-items:center;justify-content:center;margin-bottom:16px;">'
    + '<span style="color:#fff;font-size:18px;font-weight:800;">F</span>'
    + '</div>'
    + '<h1 style="font-size:22px;font-weight:800;color:#cbfaff;margin:0 0 4px;">Tu plan de acción te espera</h1>'
    + '<p style="font-size:14px;color:#6B7194;margin:0;">Hola ' + nombre + '</p>'
    + '</div>'

    + '<div style="background:#0C0C14;border:1px solid #1A1A2E;border-radius:16px;padding:24px;margin-bottom:24px;">'
    + '<p style="font-size:14px;color:#8890B0;margin:0 0 16px;line-height:1.6;">Hace unos días hiciste el diagnóstico financiero de tu negocio y tu score fue <strong style="color:#cbfaff;">' + score + '/100 (' + label + ')</strong>.</p>'
    + '<p style="font-size:14px;color:#8890B0;margin:0 0 16px;line-height:1.6;">Tu reporte premium con el plan de acción completo, prioridades y plantillas sigue disponible por USD 9.99.</p>'
    + '<p style="font-size:13px;color:#008efe;margin:0;">Accedé desde Fincheq-six.vercel.app</p>'
    + '</div>';

  return baseWrapper(content);
}