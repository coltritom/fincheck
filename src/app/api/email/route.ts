import { NextRequest, NextResponse } from "next/server";
import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { tipo, destinatario, nombre, score, rango, label, alertas } = body;

    let subject = "";
    let html = "";

    if (tipo === "resultado_gratis") {
      subject = "Tu diagnóstico financiero — " + score + "/100";
      html = buildEmailGratis(nombre, score, rango, label, alertas);
    } else if (tipo === "resultado_premium") {
      subject = "Tu Reporte Premium está disponible";
      html = buildEmailPremium(nombre, score, label);
    } else if (tipo === "followup_48h") {
      subject = nombre + ", tu plan de acción está esperándote";
      html = buildEmailFollowup(nombre, score, label);
    } else {
      return NextResponse.json({ error: "Tipo no válido" }, { status: 400 });
    }

    const { data, error } = await resend.emails.send({
      from: "Fincheck <onboarding@resend.dev>",
      to: [destinatario],
      subject: subject,
      html: html,
    });

    if (error) {
      console.error("Resend error:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, id: data?.id });
  } catch (err) {
    console.error("API email error:", err);
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}

function getColor(rango: string): string {
  if (rango === "critico") return "#FF4D6A";
  if (rango === "fragil") return "#FF9F43";
  if (rango === "inestable") return "#FBBF24";
  if (rango === "ordenado") return "#008efe";
  return "#34D399";
}

function wrap(content: string): string {
  return '<!DOCTYPE html><html><head><meta charset="utf-8"></head><body style="margin:0;padding:0;background:#050509;font-family:system-ui,sans-serif;"><div style="max-width:520px;margin:0 auto;padding:32px 24px;">' + content + '<div style="border-top:1px solid #1A1A2E;padding-top:20px;margin-top:32px;text-align:center;"><p style="font-size:11px;color:#6B7194;margin:0;">Fincheck — SECRITO Consulting</p></div></div></body></html>';
}

function buildEmailGratis(nombre: string, score: number, rango: string, label: string, alertas: string[]): string {
  const c = getColor(rango);
  let al = "";
  if (alertas && alertas.length > 0) {
    al = '<div style="background:#FF4D6A15;border:1px solid #FF4D6A25;border-radius:12px;padding:20px;margin-bottom:24px;"><p style="font-size:13px;font-weight:700;color:#FF4D6A;margin:0 0 12px;">Alertas detectadas</p>';
    for (let i = 0; i < Math.min(alertas.length, 2); i++) {
      al += '<p style="font-size:13px;color:#FF4D6A;margin:0 0 6px;">- ' + alertas[i] + '</p>';
    }
    al += '</div>';
  }
  return wrap(
    '<div style="text-align:center;margin-bottom:28px;"><h1 style="font-size:24px;font-weight:800;color:#cbfaff;margin:0 0 4px;">Tu Diagnóstico Financiero</h1><p style="font-size:14px;color:#6B7194;margin:0;">Hola ' + nombre + '</p></div>'
    + '<div style="background:#0C0C14;border:1px solid #1A1A2E;border-radius:16px;padding:28px;text-align:center;margin-bottom:24px;"><p style="font-size:56px;font-weight:800;color:' + c + ';margin:0;line-height:1;">' + score + '</p><p style="font-size:14px;color:#6B7194;margin:4px 0 12px;">/100</p><span style="display:inline-block;background:' + c + '20;color:' + c + ';font-size:13px;font-weight:700;padding:6px 16px;border-radius:20px;">' + label + '</span></div>'
    + al
    + '<div style="background:#0C0C14;border:1px solid #1A1A2E;border-radius:12px;padding:20px;"><p style="font-size:13px;font-weight:700;color:#008efe;margin:0 0 8px;">Reporte Premium disponible — USD 9.99</p><p style="font-size:13px;color:#8890B0;margin:0;line-height:1.5;">Incluye scores exactos, plan de acción a 7/30/90 días, checklist y plantillas.</p></div>'
  );
}

function buildEmailPremium(nombre: string, score: number, label: string): string {
  return wrap(
    '<div style="text-align:center;margin-bottom:28px;"><h1 style="font-size:24px;font-weight:800;color:#cbfaff;margin:0 0 4px;">Tu Reporte Premium</h1><p style="font-size:14px;color:#6B7194;margin:0;">Hola ' + nombre + ', tu reporte está listo</p></div>'
    + '<div style="background:#0C0C14;border:1px solid #1A1A2E;border-radius:16px;padding:24px;"><p style="font-size:13px;color:#cbfaff;margin:0 0 8px;">✓ Scores exactos de las 7 dimensiones</p><p style="font-size:13px;color:#cbfaff;margin:0 0 8px;">✓ Orden de prioridad 1-2-3</p><p style="font-size:13px;color:#cbfaff;margin:0 0 8px;">✓ Plan de acción a 7, 30 y 90 días</p><p style="font-size:13px;color:#cbfaff;margin:0 0 8px;">✓ Checklist de implementación</p><p style="font-size:13px;color:#cbfaff;margin:0;">✓ 3 plantillas accionables</p></div>'
  );
}

function buildEmailFollowup(nombre: string, score: number, label: string): string {
  return wrap(
    '<div style="text-align:center;margin-bottom:28px;"><h1 style="font-size:22px;font-weight:800;color:#cbfaff;margin:0 0 4px;">Tu plan de acción te espera</h1><p style="font-size:14px;color:#6B7194;margin:0;">Hola ' + nombre + '</p></div>'
    + '<div style="background:#0C0C14;border:1px solid #1A1A2E;border-radius:16px;padding:24px;"><p style="font-size:14px;color:#8890B0;margin:0 0 16px;line-height:1.6;">Tu score fue ' + score + '/100 (' + label + '). Tu reporte premium sigue disponible por USD 9.99.</p></div>'
  );
}