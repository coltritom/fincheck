import { NextRequest, NextResponse } from "next/server";
import { Resend } from "resend";
import { generateFreePdf, generatePremiumPdf } from "@/lib/pdf";

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const tipo = body.tipo;
    const destinatario = body.destinatario;
    const nombre = body.nombre;
    const score = body.score;
    const rango = body.rango;
    const label = body.label;
    const alertas = body.alertas;
    const dimScores = body.dimScores;
    const diagId = body.diagId || null;

    let subject = "";
    let html = "";
    var attachments: Array<{ filename: string; content: Buffer }> = [];

    var pdfData = {
      nombre: nombre,
      score: score,
      rango: rango,
      label: label,
      alertas: alertas || [],
      dimScores: dimScores,
    };

    if (tipo === "resultado_gratis") {
      subject = nombre + ", tu diagnóstico financiero: " + score + "/100";
      html = buildEmailGratis(nombre, score, rango, label, alertas, dimScores, diagId);
      try {
        console.log("Generando PDF para:", nombre, "score:", score);
        var freePdfBytes = generateFreePdf(pdfData);
        console.log("PDF generado, tamaño:", freePdfBytes.byteLength);
        attachments.push({
          filename: "Fincheq-Diagnostico-" + nombre.replace(/\s+/g, "-") + ".pdf",
          content: Buffer.from(freePdfBytes),
        });
      } catch (pdfErr) {
        console.error("Error generando PDF gratuito:", pdfErr);
      }
    } else if (tipo === "resultado_premium") {
      subject = nombre + ", tu Reporte Premium está disponible";
      html = buildEmailPremium(nombre, score, label, diagId);
      try {
        var premPdfBytes = generatePremiumPdf(pdfData);
        attachments.push({
          filename: "Fincheq-ReportePremium-" + nombre.replace(/\s+/g, "-") + ".pdf",
          content: Buffer.from(premPdfBytes),
        });
      } catch (pdfErr) {
        console.error("Error generando PDF premium:", pdfErr);
      }
    } else if (tipo === "followup_48h") {
      subject = nombre + ", tu plan de acción está esperándote";
      html = buildEmailFollowup(nombre, score, label, diagId);
    } else {
      return NextResponse.json({ error: "Tipo no válido" }, { status: 400 });
    }

    var emailOptions: {
      from: string;
      to: string[];
      subject: string;
      html: string;
      attachments?: Array<{ filename: string; content: Buffer }>;
    } = {
      from: "Fincheq <hola@fincheq.pro>",
      to: [destinatario],
      subject: subject,
      html: html,
    };

    console.log("Attachments:", attachments.length, attachments.map(function(a) { return a.filename + " (" + a.content.length + " bytes)"; }));
    if (attachments.length > 0) {
      emailOptions.attachments = attachments;
    }

    const { data, error } = await resend.emails.send(emailOptions);

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
  if (rango === "critico") return "Tu negocio tiene problemas severos que ponen en riesgo su continuidad. Necesit\u00e1s actuar esta semana.";
  if (rango === "fragil") return "Tu negocio opera con fragilidad. Cualquier imprevisto puede disparar una crisis. Hay correcciones urgentes que hacer.";
  if (rango === "inestable") return "Tu negocio funciona pero tiene vulnerabilidades. Con ajustes concretos pod\u00e9s mejorar significativamente en 30-90 d\u00edas.";
  if (rango === "ordenado") return "Tu negocio tiene una base s\u00f3lida con \u00e1reas de optimizaci\u00f3n. No hay urgencias, pero s\u00ed oportunidades importantes.";
  return "Tu negocio demuestra salud financiera robusta. El foco deber\u00eda estar en escalar y proteger lo construido.";
}

function getPriorityAction(dimScores: Record<string, number> | null): string {
  if (!dimScores) return "Revis\u00e1 tu diagn\u00f3stico completo en fincheq.pro para ver tu acci\u00f3n prioritaria.";
  if (dimScores["Flujo de caja"] <= 4) return "List\u00e1 todos los pagos de los pr\u00f3ximos 30 d\u00edas, clasificalos por urgencia, e identific\u00e1 cu\u00e1les pod\u00e9s negociar o postergar.";
  if (dimScores["Rentabilidad"] <= 4) return "Calcul\u00e1 cu\u00e1nto te queda despu\u00e9s de pagar todo (incluido tu sueldo). Si es cero o negativo, revis\u00e1 tus 3 mayores gastos.";
  if (dimScores["Cobranzas"] <= 4) return "Hac\u00e9 una lista de todas las facturas vencidas y contact\u00e1 a cada deudor esta semana.";
  return "Revis\u00e1 si tu excedente est\u00e1 trabajando y si tus precios reflejan el valor real que entreg\u00e1s.";
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
  return "Cr\u00edtico";
}

function makeLink(diagId: string | null): string {
  if (diagId) return "https://fincheq.pro?diag=" + diagId;
  return "https://fincheq.pro";
}

function wrap(content: string): string {
  return '<!DOCTYPE html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1.0"></head>'
    + '<body style="margin:0;padding:0;background:#050509;font-family:system-ui,-apple-system,sans-serif;">'
    + '<div style="max-width:560px;margin:0 auto;padding:32px 24px;">'
    + content
    + '<div style="border-top:1px solid #1A1A2E;padding-top:24px;margin-top:36px;text-align:center;">'
    + '<p style="font-size:11px;color:#6B7194;margin:0;">Fincheq es una herramienta de <strong style="color:#cbfaff;">SECRITO Consulting</strong></p>'
    + '<p style="font-size:11px;color:#6B7194;margin:6px 0 0;"><a href="https://fincheq.pro" style="color:#008efe;text-decoration:none;">fincheq.pro</a></p>'
    + '</div>'
    + '</div></body></html>';
}

function buildEmailGratis(nombre: string, score: number, rango: string, label: string, alertas: string[], dimScores: Record<string, number> | null, diagId: string | null): string {
  var c = getColor(rango);
  var interp = getInterpretation(rango);
  var action = getPriorityAction(dimScores);
  var link = makeLink(diagId);

  var html = ''
    + '<div style="text-align:center;margin-bottom:28px;">'
    + '<div style="width:44px;height:44px;border-radius:12px;background:linear-gradient(135deg,#008efe,#fe26fe);display:inline-flex;align-items:center;justify-content:center;margin-bottom:16px;">'
    + '<span style="color:#fff;font-size:20px;font-weight:800;">F</span></div>'
    + '<h1 style="font-size:24px;font-weight:800;color:#cbfaff;margin:0 0 6px;">Tu Diagn\u00f3stico Financiero</h1>'
    + '<p style="font-size:14px;color:#6B7194;margin:0;">Hola ' + nombre + ', ac\u00e1 est\u00e1n los resultados</p>'
    + '</div>';

  html += '<div style="background:#0C0C14;border:1px solid #1A1A2E;border-radius:16px;padding:32px;text-align:center;margin-bottom:24px;">'
    + '<p style="font-size:56px;font-weight:800;color:' + c + ';margin:0;line-height:1;">' + score + '</p>'
    + '<p style="font-size:15px;color:#6B7194;margin:4px 0 14px;">/100</p>'
    + '<span style="display:inline-block;background:' + c + '20;color:' + c + ';font-size:14px;font-weight:700;padding:8px 20px;border-radius:24px;">' + label + '</span></div>';

  html += '<div style="background:#0C0C14;border:1px solid #1A1A2E;border-radius:14px;padding:22px;margin-bottom:24px;">'
    + '<p style="font-size:15px;font-weight:700;color:#cbfaff;margin:0 0 10px;">Tu negocio: ' + label + '</p>'
    + '<p style="font-size:14px;color:#8890B0;margin:0;line-height:1.65;">' + interp + '</p></div>';

  if (alertas && alertas.length > 0) {
    html += '<div style="background:#FF4D6A12;border:1px solid #FF4D6A25;border-radius:14px;padding:22px;margin-bottom:24px;">'
      + '<p style="font-size:14px;font-weight:700;color:#FF4D6A;margin:0 0 14px;">Alertas cr\u00edticas detectadas</p>';
    for (var i = 0; i < alertas.length; i++) {
      html += '<p style="font-size:13px;color:#FF4D6A;margin:0 0 ' + (i < alertas.length - 1 ? '8' : '0') + 'px;line-height:1.55;">\u2022 ' + alertas[i] + '</p>';
    }
    html += '</div>';
  }

  // Brief importance text
  html += '<div style="background:#0C0C14;border:1px solid #1A1A2E;border-radius:14px;padding:22px;margin-bottom:24px;">'
    + '<p style="font-size:11px;font-weight:700;color:#008efe;margin:0 0 12px;text-transform:uppercase;letter-spacing:0.06em;">Por qu\u00e9 importa cada dimensi\u00f3n</p>'
    + '<p style="font-size:13px;color:#8890B0;margin:0 0 16px;line-height:1.6;">Evaluamos 7 variables clave de tu negocio. Encontr\u00e1 el detalle completo de cada una en el PDF adjunto a este email.</p>'
    + '</div>';

  html += '<div style="background:#0C0C14;border:1px solid #1A1A2E;border-radius:14px;padding:22px;margin-bottom:28px;border-left:3px solid #008efe;">'
    + '<p style="font-size:11px;font-weight:700;color:#008efe;margin:0 0 10px;text-transform:uppercase;letter-spacing:0.06em;">Tu acci\u00f3n prioritaria esta semana</p>'
    + '<p style="font-size:14px;color:#8890B0;margin:0;line-height:1.65;">' + action + '</p></div>';

  html += '<div style="background:linear-gradient(145deg,#0C0C14,#0A0A18);border:1px solid #008efe40;border-radius:16px;padding:28px;text-align:center;">'
    + '<p style="font-size:10px;font-weight:700;color:#fe26fe;margin:0 0 10px;text-transform:uppercase;letter-spacing:0.12em;">Reporte Premium</p>'
    + '<p style="font-size:18px;font-weight:800;color:#cbfaff;margin:0 0 12px;line-height:1.3;">Quer\u00e9s saber exactamente qu\u00e9 hacer y en qu\u00e9 orden?</p>'
    + '<p style="font-size:13px;color:#cbfaff;margin:0 0 4px;">\u2713 Scores exactos por dimensi\u00f3n</p>'
    + '<p style="font-size:13px;color:#cbfaff;margin:0 0 4px;">\u2713 Orden de prioridad 1-2-3</p>'
    + '<p style="font-size:13px;color:#cbfaff;margin:0 0 4px;">\u2713 Plan de acci\u00f3n a 7, 30 y 90 d\u00edas</p>'
    + '<p style="font-size:13px;color:#cbfaff;margin:0 0 4px;">\u2713 Checklist de implementaci\u00f3n</p>'
    + '<p style="font-size:13px;color:#cbfaff;margin:0 0 20px;">\u2713 3 plantillas accionables</p>'
    + '<p style="font-size:30px;font-weight:800;color:#cbfaff;margin:0 0 4px;">USD 9.99</p>'
    + '<p style="font-size:12px;color:#6B7194;margin:0 0 20px;">Pago \u00fanico \u2014 Acceso inmediato</p>'
    + '<a href="' + link + '" style="display:inline-block;background:linear-gradient(135deg,#008efe,#fe26fe);color:#fff;text-decoration:none;padding:14px 40px;border-radius:12px;font-size:15px;font-weight:700;">Acceder a mi reporte completo \u2192</a></div>';

  return wrap(html);
}

function buildEmailPremium(nombre: string, score: number, label: string, diagId: string | null): string {
  var link = makeLink(diagId);
  return wrap(
    '<div style="text-align:center;margin-bottom:28px;">'
    + '<div style="width:44px;height:44px;border-radius:12px;background:linear-gradient(135deg,#008efe,#fe26fe);display:inline-flex;align-items:center;justify-content:center;margin-bottom:16px;"><span style="color:#fff;font-size:20px;font-weight:800;">F</span></div>'
    + '<h1 style="font-size:24px;font-weight:800;color:#cbfaff;margin:0 0 6px;">Tu Reporte Premium est\u00e1 listo</h1>'
    + '<p style="font-size:14px;color:#6B7194;margin:0;">Hola ' + nombre + ', gracias por tu compra</p></div>'
    + '<div style="background:#0C0C14;border:1px solid #1A1A2E;border-radius:16px;padding:24px;margin-bottom:24px;">'
    + '<p style="font-size:14px;color:#8890B0;margin:0 0 18px;line-height:1.65;">Tu Reporte Premium completo est\u00e1 adjunto a este email como PDF. Tambi\u00e9n pod\u00e9s verlo online:</p>'
    + '<p style="font-size:14px;color:#cbfaff;margin:0 0 10px;">\u2713 Scores exactos de las 7 dimensiones</p>'
    + '<p style="font-size:14px;color:#cbfaff;margin:0 0 10px;">\u2713 Ranking de prioridad</p>'
    + '<p style="font-size:14px;color:#cbfaff;margin:0 0 10px;">\u2713 Plan de acci\u00f3n a 7, 30 y 90 d\u00edas</p>'
    + '<p style="font-size:14px;color:#cbfaff;margin:0 0 10px;">\u2713 Checklist de implementaci\u00f3n</p>'
    + '<p style="font-size:14px;color:#cbfaff;margin:0;">\u2713 3 plantillas accionables</p></div>'
    + '<div style="text-align:center;">'
    + '<a href="' + link + '" style="display:inline-block;background:linear-gradient(135deg,#008efe,#fe26fe);color:#fff;text-decoration:none;padding:14px 40px;border-radius:12px;font-size:15px;font-weight:700;">Ver mi Reporte Premium online \u2192</a></div>'
  );
}

function buildEmailFollowup(nombre: string, score: number, label: string, diagId: string | null): string {
  var link = makeLink(diagId);
  return wrap(
    '<div style="text-align:center;margin-bottom:28px;">'
    + '<div style="width:44px;height:44px;border-radius:12px;background:linear-gradient(135deg,#008efe,#fe26fe);display:inline-flex;align-items:center;justify-content:center;margin-bottom:16px;"><span style="color:#fff;font-size:20px;font-weight:800;">F</span></div>'
    + '<h1 style="font-size:22px;font-weight:800;color:#cbfaff;margin:0 0 6px;">Tu plan de acci\u00f3n te espera</h1>'
    + '<p style="font-size:14px;color:#6B7194;margin:0;">Hola ' + nombre + '</p></div>'
    + '<div style="background:#0C0C14;border:1px solid #1A1A2E;border-radius:16px;padding:24px;margin-bottom:24px;">'
    + '<p style="font-size:14px;color:#8890B0;margin:0 0 16px;line-height:1.65;">Tu score fue <strong style="color:#cbfaff;">' + score + '/100 (' + label + ')</strong>.</p>'
    + '<p style="font-size:14px;color:#8890B0;margin:0;line-height:1.65;">Tu reporte premium con el plan de acci\u00f3n completo sigue disponible.</p></div>'
    + '<div style="text-align:center;">'
    + '<a href="' + link + '" style="display:inline-block;background:linear-gradient(135deg,#008efe,#fe26fe);color:#fff;text-decoration:none;padding:14px 40px;border-radius:12px;font-size:15px;font-weight:700;">Ver mi plan de acci\u00f3n \u2014 USD 9.99 \u2192</a></div>'
  );
}