import { NextRequest, NextResponse } from "next/server";
import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { tipo, destinatario, nombre, score, rango, label, alertas, dimScores } = body;

    let subject = "";
    let html = "";

    if (tipo === "resultado_gratis") {
      subject = "Tu diagnóstico financiero — " + score + "/100 — " + label;
      html = buildEmailGratis(nombre, score, rango, label, alertas, dimScores);
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
      from: "fincheq <onboarding@resend.dev>",
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

function getInterpretation(rango: string): string {
  if (rango === "critico") return "Tu negocio tiene problemas severos que ponen en riesgo su continuidad. Necesitás actuar esta semana.";
  if (rango === "fragil") return "Tu negocio opera con fragilidad. Cualquier imprevisto puede disparar una crisis. Hay correcciones urgentes.";
  if (rango === "inestable") return "Tu negocio funciona pero tiene vulnerabilidades. Con ajustes concretos podés mejorar en 30-90 días.";
  if (rango === "ordenado") return "Tu negocio tiene una base sólida con áreas de optimización. No hay urgencias, pero sí oportunidades.";
  return "Tu negocio demuestra salud financiera robusta. El foco: escalar y proteger.";
}

function getPriorityAction(dimScores: Record<string, number> | null): string {
  if (!dimScores) return "Revisá tu diagnóstico completo en fincheq.pro para ver tu acción prioritaria.";
  if (dimScores["Flujo de caja"] <= 4) return "Esta semana: listá todos los pagos de los próximos 30 días, clasificalos por urgencia, e identificá cuáles podés negociar o postergar.";
  if (dimScores["Rentabilidad"] <= 4) return "Esta semana: calculá cuánto te queda después de pagar todo (incluido tu sueldo). Si es cero o negativo, revisá tus 3 mayores gastos.";
  if (dimScores["Cobranzas"] <= 4) return "Esta semana: hacé una lista de todas las facturas vencidas y contactá a cada deudor.";
  return "Esta semana: revisá si tu excedente está trabajando y si tus precios reflejan el valor real que entregás.";
}

function getDimColor(val: number): string {
  if (val >= 7) return "#34D399";
  if (val >= 5) return "#FBBF24";
  if (val >= 3) return "#FF9F43";
  return "#FF4D6A";
}

function getDimLabel(val: number): string {
  if (val >= 7) return "Bien";
  if (val >= 5) return "Mejorable";
  if (val >= 3) return "Bajo";
  return "Crítico";
}

function wrap(content: string): string {
  return '<!DOCTYPE html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1.0"></head>'
    + '<body style="margin:0;padding:0;background:#050509;font-family:system-ui,-apple-system,sans-serif;">'
    + '<div style="max-width:520px;margin:0 auto;padding:32px 24px;">'
    + content
    + '<div style="border-top:1px solid #1A1A2E;padding-top:20px;margin-top:32px;text-align:center;">'
    + '<p style="font-size:11px;color:#6B7194;margin:0;">fincheq es una herramienta de <strong style="color:#cbfaff;">SECRITO Consulting</strong></p>'
    + '<p style="font-size:11px;color:#6B7194;margin:6px 0 0;">Diagnóstico financiero para pymes — fincheq.pro</p>'
    + '</div>'
    + '</div></body></html>';
}

function buildEmailGratis(nombre: string, score: number, rango: string, label: string, alertas: string[], dimScores: Record<string, number> | null): string {
  const c = getColor(rango);
  const interp = getInterpretation(rango);
  const action = getPriorityAction(dimScores);

  // Header + Score
  let html = ''
    + '<div style="text-align:center;margin-bottom:24px;">'
    + '<div style="width:40px;height:40px;border-radius:10px;background:linear-gradient(135deg,#008efe,#fe26fe);display:inline-flex;align-items:center;justify-content:center;margin-bottom:16px;">'
    + '<span style="color:#fff;font-size:18px;font-weight:800;">F</span>'
    + '</div>'
    + '<h1 style="font-size:22px;font-weight:800;color:#cbfaff;margin:0 0 4px;">Tu Diagnóstico Financiero</h1>'
    + '<p style="font-size:14px;color:#6B7194;margin:0;">Hola ' + nombre + ', acá está tu resultado</p>'
    + '</div>';

  // Score box
  html += ''
    + '<div style="background:#0C0C14;border:1px solid #1A1A2E;border-radius:16px;padding:28px;text-align:center;margin-bottom:20px;">'
    + '<p style="font-size:52px;font-weight:800;color:' + c + ';margin:0;line-height:1;">' + score + '</p>'
    + '<p style="font-size:14px;color:#6B7194;margin:4px 0 12px;">/100</p>'
    + '<span style="display:inline-block;background:' + c + '20;color:' + c + ';font-size:13px;font-weight:700;padding:6px 16px;border-radius:20px;">' + label + '</span>'
    + '</div>';

  // Interpretation
  html += ''
    + '<div style="background:#0C0C14;border:1px solid #1A1A2E;border-radius:12px;padding:20px;margin-bottom:20px;">'
    + '<p style="font-size:14px;font-weight:700;color:#cbfaff;margin:0 0 8px;">Tu negocio: ' + label + '</p>'
    + '<p style="font-size:13px;color:#8890B0;margin:0;line-height:1.6;">' + interp + '</p>'
    + '</div>';

  // Alerts
  if (alertas && alertas.length > 0) {
    html += '<div style="background:#FF4D6A15;border:1px solid #FF4D6A25;border-radius:12px;padding:20px;margin-bottom:20px;">'
      + '<p style="font-size:13px;font-weight:700;color:#FF4D6A;margin:0 0 12px;">Alertas críticas detectadas</p>';
    for (let i = 0; i < Math.min(alertas.length, 2); i++) {
      html += '<p style="font-size:13px;color:#FF4D6A;margin:0 0 6px;line-height:1.5;">⚠️ ' + alertas[i] + '</p>';
    }
    html += '</div>';
  }

  // Dimension summary
  if (dimScores) {
    const dims = [
      { k: "Flujo de caja", l: "Flujo de caja" },
      { k: "Rentabilidad", l: "Rentabilidad" },
      { k: "Cobranzas", l: "Cobranzas" },
      { k: "Endeudamiento", l: "Endeudamiento" },
      { k: "Precios", l: "Precios y costos" },
      { k: "Orden", l: "Orden admin." },
      { k: "Concentración", l: "Concentración" },
    ];
    html += '<div style="background:#0C0C14;border:1px solid #1A1A2E;border-radius:12px;padding:20px;margin-bottom:20px;">'
      + '<p style="font-size:11px;font-weight:700;color:#008efe;margin:0 0 14px;text-transform:uppercase;letter-spacing:0.06em;">Tus 7 dimensiones</p>';
    for (let i = 0; i < dims.length; i++) {
      const val = dimScores[dims[i].k] || 0;
      const dc = getDimColor(val);
      const dl = getDimLabel(val);
      html += '<div style="display:flex;justify-content:space-between;align-items:center;padding:6px 0;border-bottom:' + (i < dims.length - 1 ? '1px solid #1A1A2E' : 'none') + ';">'
        + '<span style="font-size:13px;color:#8890B0;">' + dims[i].l + '</span>'
        + '<span style="font-size:12px;font-weight:700;color:' + dc + ';">' + dl + '</span>'
        + '</div>';
    }
    html += '<p style="font-size:11px;color:#6B7194;margin:12px 0 0;text-align:center;">Scores exactos disponibles en el Reporte Premium</p>';
    html += '</div>';
  }

  // Priority action
  html += ''
    + '<div style="background:#0C0C14;border:1px solid #1A1A2E;border-radius:12px;padding:20px;margin-bottom:20px;border-left:3px solid #008efe;">'
    + '<p style="font-size:11px;font-weight:700;color:#008efe;margin:0 0 8px;text-transform:uppercase;letter-spacing:0.06em;">Tu acción prioritaria</p>'
    + '<p style="font-size:13px;color:#8890B0;margin:0;line-height:1.6;">' + action + '</p>'
    + '</div>';

  // Upsell
  html += ''
    + '<div style="background:linear-gradient(145deg,#0C0C14,#0A0A18);border:1px solid #008efe40;border-radius:12px;padding:24px;text-align:center;">'
    + '<p style="font-size:10px;font-weight:700;color:#fe26fe;margin:0 0 8px;text-transform:uppercase;letter-spacing:0.1em;">Reporte Premium</p>'
    + '<p style="font-size:16px;font-weight:800;color:#cbfaff;margin:0 0 12px;">¿Querés el plan de acción completo?</p>'
    + '<p style="font-size:12px;color:#8890B0;margin:0 0 16px;line-height:1.5;">Scores exactos · Prioridades · Plan 7/30/90 días · Checklist · Plantillas</p>'
    + '<p style="font-size:28px;font-weight:800;color:#cbfaff;margin:0 0 4px;">USD 9.99</p>'
    + '<p style="font-size:12px;color:#6B7194;margin:0 0 16px;">Pago único — Acceso inmediato</p>'
    + '<a href="https://fincheq.pro" style="display:inline-block;background:linear-gradient(135deg,#008efe,#fe26fe);color:#fff;text-decoration:none;padding:12px 32px;border-radius:10px;font-size:14px;font-weight:700;">Ver mi reporte completo</a>'
    + '</div>';

  return wrap(html);
}

function buildEmailPremium(nombre: string, score: number, label: string): string {
  return wrap(
    '<div style="text-align:center;margin-bottom:28px;">'
    + '<div style="width:40px;height:40px;border-radius:10px;background:linear-gradient(135deg,#008efe,#fe26fe);display:inline-flex;align-items:center;justify-content:center;margin-bottom:16px;"><span style="color:#fff;font-size:18px;font-weight:800;">F</span></div>'
    + '<h1 style="font-size:24px;font-weight:800;color:#cbfaff;margin:0 0 4px;">Tu Reporte Premium</h1>'
    + '<p style="font-size:14px;color:#6B7194;margin:0;">Hola ' + nombre + ', tu reporte está listo</p>'
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
    + '<a href="https://fincheq.pro" style="display:inline-block;background:linear-gradient(135deg,#008efe,#fe26fe);color:#fff;text-decoration:none;padding:12px 32px;border-radius:10px;font-size:14px;font-weight:700;">Acceder a mi reporte</a>'
    + '</div>'
  );
}

function buildEmailFollowup(nombre: string, score: number, label: string): string {
  return wrap(
    '<div style="text-align:center;margin-bottom:28px;">'
    + '<div style="width:40px;height:40px;border-radius:10px;background:linear-gradient(135deg,#008efe,#fe26fe);display:inline-flex;align-items:center;justify-content:center;margin-bottom:16px;"><span style="color:#fff;font-size:18px;font-weight:800;">F</span></div>'
    + '<h1 style="font-size:22px;font-weight:800;color:#cbfaff;margin:0 0 4px;">Tu plan de acción te espera</h1>'
    + '<p style="font-size:14px;color:#6B7194;margin:0;">Hola ' + nombre + '</p>'
    + '</div>'
    + '<div style="background:#0C0C14;border:1px solid #1A1A2E;border-radius:16px;padding:24px;margin-bottom:24px;">'
    + '<p style="font-size:14px;color:#8890B0;margin:0 0 16px;line-height:1.6;">Hace unos días hiciste el diagnóstico financiero de tu negocio y tu score fue <strong style="color:#cbfaff;">' + score + '/100 (' + label + ')</strong>.</p>'
    + '<p style="font-size:14px;color:#8890B0;margin:0;line-height:1.6;">Tu reporte premium con el plan de acción completo sigue disponible por USD 9.99.</p>'
    + '</div>'
    + '<div style="text-align:center;">'
    + '<a href="https://fincheq.pro" style="display:inline-block;background:linear-gradient(135deg,#008efe,#fe26fe);color:#fff;text-decoration:none;padding:12px 32px;border-radius:10px;font-size:14px;font-weight:700;">Ver mi plan de acción</a>'
    + '</div>'
  );
}