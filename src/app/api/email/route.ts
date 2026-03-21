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
      subject = nombre + ", tu diagnóstico financiero: " + score + "/100";
      html = buildEmailGratis(nombre, score, rango, label, alertas, dimScores);
    } else if (tipo === "resultado_premium") {
      subject = nombre + ", tu Reporte Premium está disponible";
      html = buildEmailPremium(nombre, score, label);
    } else if (tipo === "followup_48h") {
      subject = nombre + ", tu plan de acción está esperándote";
      html = buildEmailFollowup(nombre, score, label);
    } else {
      return NextResponse.json({ error: "Tipo no válido" }, { status: 400 });
    }

    const { data, error } = await resend.emails.send({
      from: "Fincheq <onboarding@resend.dev>",
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

// ═══ HELPERS ═══

function getColor(rango: string): string {
  if (rango === "critico") return "#FF4D6A";
  if (rango === "fragil") return "#FF9F43";
  if (rango === "inestable") return "#FBBF24";
  if (rango === "ordenado") return "#008efe";
  return "#34D399";
}

function getInterpretation(rango: string): string {
  if (rango === "critico") return "Tu negocio tiene problemas severos que ponen en riesgo su continuidad. Necesitás actuar esta semana.";
  if (rango === "fragil") return "Tu negocio opera con fragilidad. Cualquier imprevisto puede disparar una crisis. Hay correcciones urgentes que hacer.";
  if (rango === "inestable") return "Tu negocio funciona pero tiene vulnerabilidades. Con ajustes concretos podés mejorar significativamente en 30-90 días.";
  if (rango === "ordenado") return "Tu negocio tiene una base sólida con áreas de optimización. No hay urgencias, pero sí oportunidades importantes.";
  return "Tu negocio demuestra salud financiera robusta. El foco debería estar en escalar y proteger lo construido.";
}

function getPriorityAction(dimScores: Record<string, number> | null): string {
  if (!dimScores) return "Revisá tu diagnóstico completo en fincheq.pro para ver tu acción prioritaria.";
  if (dimScores["Flujo de caja"] <= 4) return "Listá todos los pagos de los próximos 30 días, clasificalos por urgencia, e identificá cuáles podés negociar o postergar.";
  if (dimScores["Rentabilidad"] <= 4) return "Calculá cuánto te queda después de pagar todo (incluido tu sueldo). Si es cero o negativo, revisá tus 3 mayores gastos.";
  if (dimScores["Cobranzas"] <= 4) return "Hacé una lista de todas las facturas vencidas y contactá a cada deudor esta semana.";
  return "Revisá si tu excedente está trabajando y si tus precios reflejan el valor real que entregás.";
}

function getDimColor(val: number): string {
  if (val >= 7) return "#34D399";
  if (val >= 5) return "#FBBF24";
  if (val >= 3) return "#FF9F43";
  return "#FF4D6A";
}

function getDimStatus(val: number): string {
  if (val >= 7) return "Bien";
  if (val >= 5) return "Mejorable";
  if (val >= 3) return "Bajo";
  return "Crítico";
}

// ═══ WRAPPER ═══

function wrap(content: string): string {
  return '<!DOCTYPE html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1.0"></head>'
    + '<body style="margin:0;padding:0;background:#050509;font-family:system-ui,-apple-system,sans-serif;">'
    + '<div style="max-width:560px;margin:0 auto;padding:32px 24px;">'
    + content
    + '<div style="border-top:1px solid #1A1A2E;padding-top:24px;margin-top:36px;text-align:center;">'
    + '<p style="font-size:11px;color:#6B7194;margin:0;">Fincheq es una herramienta de <strong style="color:#cbfaff;">SECRITO Consulting</strong></p>'
    + '<p style="font-size:11px;color:#6B7194;margin:6px 0 0;"><a href="https://fincheq.pro" style="color:#008efe;text-decoration:none;">fincheq.pro</a> — Diagnóstico financiero para pymes</p>'
    + '</div>'
    + '</div></body></html>';
}

// ═══ EMAIL: RESULTADO GRATUITO ═══

function buildEmailGratis(nombre: string, score: number, rango: string, label: string, alertas: string[], dimScores: Record<string, number> | null): string {
  const c = getColor(rango);
  const interp = getInterpretation(rango);
  const action = getPriorityAction(dimScores);

  // Header
  let html = ''
    + '<div style="text-align:center;margin-bottom:28px;">'
    + '<div style="width:44px;height:44px;border-radius:12px;background:linear-gradient(135deg,#008efe,#fe26fe);display:inline-flex;align-items:center;justify-content:center;margin-bottom:16px;">'
    + '<span style="color:#fff;font-size:20px;font-weight:800;">F</span>'
    + '</div>'
    + '<h1 style="font-size:24px;font-weight:800;color:#cbfaff;margin:0 0 6px;">Tu Diagnóstico Financiero</h1>'
    + '<p style="font-size:14px;color:#6B7194;margin:0;">Hola ' + nombre + ', acá están los resultados de tu diagnóstico</p>'
    + '</div>';

  // Score
  html += ''
    + '<div style="background:#0C0C14;border:1px solid #1A1A2E;border-radius:16px;padding:32px;text-align:center;margin-bottom:24px;">'
    + '<p style="font-size:56px;font-weight:800;color:' + c + ';margin:0;line-height:1;">' + score + '</p>'
    + '<p style="font-size:15px;color:#6B7194;margin:4px 0 14px;">/100</p>'
    + '<span style="display:inline-block;background:' + c + '20;color:' + c + ';font-size:14px;font-weight:700;padding:8px 20px;border-radius:24px;">' + label + '</span>'
    + '</div>';

  // Interpretation
  html += ''
    + '<div style="background:#0C0C14;border:1px solid #1A1A2E;border-radius:14px;padding:22px;margin-bottom:24px;">'
    + '<p style="font-size:15px;font-weight:700;color:#cbfaff;margin:0 0 10px;">Tu negocio: ' + label + '</p>'
    + '<p style="font-size:14px;color:#8890B0;margin:0;line-height:1.65;">' + interp + '</p>'
    + '</div>';

  // Alerts
  if (alertas && alertas.length > 0) {
    html += '<div style="background:#FF4D6A12;border:1px solid #FF4D6A25;border-radius:14px;padding:22px;margin-bottom:24px;">'
      + '<p style="font-size:14px;font-weight:700;color:#FF4D6A;margin:0 0 14px;">⚠️ Alertas críticas detectadas</p>';
    for (let i = 0; i < alertas.length; i++) {
      html += '<p style="font-size:13px;color:#FF4D6A;margin:0 0 ' + (i < alertas.length - 1 ? '8' : '0') + 'px;line-height:1.55;">• ' + alertas[i] + '</p>';
    }
    html += '</div>';
  }

  // Why dimensions matter
  html += ''
    + '<div style="background:#0C0C14;border:1px solid #1A1A2E;border-radius:14px;padding:22px;margin-bottom:24px;">'
    + '<p style="font-size:11px;font-weight:700;color:#008efe;margin:0 0 14px;text-transform:uppercase;letter-spacing:0.06em;">¿Por qué importa cada dimensión?</p>'
    + '<p style="font-size:13px;color:#8890B0;margin:0 0 16px;line-height:1.6;">Tu diagnóstico evalúa 7 dimensiones clave. Cada una impacta directamente en la supervivencia y crecimiento de tu negocio:</p>';

  const dimInfo = [
    { k: "Flujo de caja", l: "Flujo de caja", why: "Es la causa #1 de cierre de pymes. Si no tenés efectivo para operar, el negocio se frena sin importar cuánto vendas." },
    { k: "Rentabilidad", l: "Rentabilidad", why: "Facturar no es ganar. Si después de pagar todo (incluido tu sueldo) no queda nada, el negocio no es sostenible." },
    { k: "Cobranzas", l: "Cobranzas", why: "Vender y no cobrar es regalar tu trabajo. La plata que te deben es plata que no podés usar." },
    { k: "Endeudamiento", l: "Endeudamiento", why: "La deuda no es mala, pero si las cuotas se llevan demasiado de lo que facturás, perdés capacidad de reacción." },
    { k: "Precios", l: "Precios y costos", why: "Si no sabés cuánto te cuesta lo que vendés, no podés saber si tu precio es correcto. Muchos venden a pérdida sin saberlo." },
    { k: "Orden", l: "Orden administrativo", why: "Sin registros ni separación de finanzas personales y del negocio, toda decisión financiera es a ciegas." },
    { k: "Concentración", l: "Concentración de clientes", why: "Si un solo cliente representa la mayoría de tus ingresos, tu negocio depende de una decisión que no controlás." },
  ];

  for (let i = 0; i < dimInfo.length; i++) {
    const d = dimInfo[i];
    const val = dimScores ? dimScores[d.k] || 0 : 0;
    const dc = dimScores ? getDimColor(val) : "#6B7194";
    const ds = dimScores ? getDimStatus(val) : "—";

    html += '<div style="padding:12px 0;border-bottom:' + (i < dimInfo.length - 1 ? '1px solid #1A1A2E' : 'none') + ';">'
      + '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:4px;">'
      + '<span style="font-size:13px;font-weight:700;color:#cbfaff;">' + d.l + '</span>'
      + '<span style="font-size:12px;font-weight:700;color:' + dc + ';">' + ds + '</span>'
      + '</div>'
      + '<p style="font-size:12px;color:#6B7194;margin:0;line-height:1.5;">' + d.why + '</p>'
      + '</div>';
  }

  html += '<p style="font-size:11px;color:#6B7194;margin:14px 0 0;text-align:center;font-style:italic;">Los scores numéricos exactos están disponibles en el Reporte Premium.</p>';
  html += '</div>';

  // Priority action
  html += ''
    + '<div style="background:#0C0C14;border:1px solid #1A1A2E;border-radius:14px;padding:22px;margin-bottom:28px;border-left:3px solid #008efe;">'
    + '<p style="font-size:11px;font-weight:700;color:#008efe;margin:0 0 10px;text-transform:uppercase;letter-spacing:0.06em;">Tu acción prioritaria esta semana</p>'
    + '<p style="font-size:14px;color:#8890B0;margin:0;line-height:1.65;">' + action + '</p>'
    + '</div>';

  // Upsell CTA
  html += ''
    + '<div style="background:linear-gradient(145deg,#0C0C14,#0A0A18);border:1px solid #008efe40;border-radius:16px;padding:28px;text-align:center;margin-bottom:8px;">'
    + '<p style="font-size:10px;font-weight:700;color:#fe26fe;margin:0 0 10px;text-transform:uppercase;letter-spacing:0.12em;">Reporte Premium</p>'
    + '<p style="font-size:18px;font-weight:800;color:#cbfaff;margin:0 0 12px;line-height:1.3;">¿Querés saber exactamente qué hacer y en qué orden?</p>'
    + '<p style="font-size:13px;color:#8890B0;margin:0 0 8px;line-height:1.5;">Tu reporte premium incluye:</p>'
    + '<p style="font-size:13px;color:#cbfaff;margin:0 0 4px;">✓ Scores exactos por dimensión</p>'
    + '<p style="font-size:13px;color:#cbfaff;margin:0 0 4px;">✓ Orden de prioridad 1-2-3</p>'
    + '<p style="font-size:13px;color:#cbfaff;margin:0 0 4px;">✓ Plan de acción a 7, 30 y 90 días</p>'
    + '<p style="font-size:13px;color:#cbfaff;margin:0 0 4px;">✓ Checklist de implementación</p>'
    + '<p style="font-size:13px;color:#cbfaff;margin:0 0 20px;">✓ 3 plantillas accionables</p>'
    + '<p style="font-size:30px;font-weight:800;color:#cbfaff;margin:0 0 4px;">USD 9.99</p>'
    + '<p style="font-size:12px;color:#6B7194;margin:0 0 20px;">Pago único — Acceso inmediato</p>'
    + '<a href="https://fincheq.pro" style="display:inline-block;background:linear-gradient(135deg,#008efe,#fe26fe);color:#fff;text-decoration:none;padding:14px 40px;border-radius:12px;font-size:15px;font-weight:700;">Acceder a mi reporte completo →</a>'
    + '</div>';

  return wrap(html);
}

// ═══ EMAIL: RESULTADO PREMIUM ═══

function buildEmailPremium(nombre: string, score: number, label: string): string {
  return wrap(
    '<div style="text-align:center;margin-bottom:28px;">'
    + '<div style="width:44px;height:44px;border-radius:12px;background:linear-gradient(135deg,#008efe,#fe26fe);display:inline-flex;align-items:center;justify-content:center;margin-bottom:16px;"><span style="color:#fff;font-size:20px;font-weight:800;">F</span></div>'
    + '<h1 style="font-size:24px;font-weight:800;color:#cbfaff;margin:0 0 6px;">Tu Reporte Premium está listo</h1>'
    + '<p style="font-size:14px;color:#6B7194;margin:0;">Hola ' + nombre + ', gracias por tu compra</p>'
    + '</div>'
    + '<div style="background:#0C0C14;border:1px solid #1A1A2E;border-radius:16px;padding:24px;margin-bottom:24px;">'
    + '<p style="font-size:14px;color:#8890B0;margin:0 0 18px;line-height:1.65;">Tu Reporte Premium incluye todo lo que necesitás para tomar acción:</p>'
    + '<p style="font-size:14px;color:#cbfaff;margin:0 0 10px;">✓ Scores exactos de las 7 dimensiones financieras</p>'
    + '<p style="font-size:14px;color:#cbfaff;margin:0 0 10px;">✓ Ranking de prioridad: qué corregir primero</p>'
    + '<p style="font-size:14px;color:#cbfaff;margin:0 0 10px;">✓ Plan de acción concreto a 7, 30 y 90 días</p>'
    + '<p style="font-size:14px;color:#cbfaff;margin:0 0 10px;">✓ Checklist de implementación paso a paso</p>'
    + '<p style="font-size:14px;color:#cbfaff;margin:0;">✓ 3 plantillas accionables para usar esta semana</p>'
    + '</div>'
    + '<div style="text-align:center;">'
    + '<a href="https://fincheq.pro" style="display:inline-block;background:linear-gradient(135deg,#008efe,#fe26fe);color:#fff;text-decoration:none;padding:14px 40px;border-radius:12px;font-size:15px;font-weight:700;">Acceder a mi Reporte Premium →</a>'
    + '<p style="font-size:12px;color:#6B7194;margin:14px 0 0;">Tu reporte está disponible en cualquier momento desde fincheq.pro</p>'
    + '</div>'
  );
}

// ═══ EMAIL: FOLLOWUP 48H ═══

function buildEmailFollowup(nombre: string, score: number, label: string): string {
  return wrap(
    '<div style="text-align:center;margin-bottom:28px;">'
    + '<div style="width:44px;height:44px;border-radius:12px;background:linear-gradient(135deg,#008efe,#fe26fe);display:inline-flex;align-items:center;justify-content:center;margin-bottom:16px;"><span style="color:#fff;font-size:20px;font-weight:800;">F</span></div>'
    + '<h1 style="font-size:22px;font-weight:800;color:#cbfaff;margin:0 0 6px;">Tu plan de acción te espera</h1>'
    + '<p style="font-size:14px;color:#6B7194;margin:0;">Hola ' + nombre + '</p>'
    + '</div>'
    + '<div style="background:#0C0C14;border:1px solid #1A1A2E;border-radius:16px;padding:24px;margin-bottom:24px;">'
    + '<p style="font-size:14px;color:#8890B0;margin:0 0 16px;line-height:1.65;">Hace unos días hiciste el diagnóstico financiero de tu negocio y tu score fue <strong style="color:#cbfaff;">' + score + '/100 (' + label + ')</strong>.</p>'
    + '<p style="font-size:14px;color:#8890B0;margin:0 0 16px;line-height:1.65;">Las dimensiones que medimos (flujo de caja, rentabilidad, cobranzas, endeudamiento, precios, orden y concentración) son las que determinan si tu negocio puede sostenerse y crecer, o si está acumulando riesgos en silencio.</p>'
    + '<p style="font-size:14px;color:#8890B0;margin:0;line-height:1.65;">Tu reporte premium con el plan de acción completo, prioridades y plantillas sigue disponible.</p>'
    + '</div>'
    + '<div style="text-align:center;">'
    + '<a href="https://fincheq.pro" style="display:inline-block;background:linear-gradient(135deg,#008efe,#fe26fe);color:#fff;text-decoration:none;padding:14px 40px;border-radius:12px;font-size:15px;font-weight:700;">Ver mi plan de acción — USD 9.99 →</a>'
    + '</div>'
  );
}