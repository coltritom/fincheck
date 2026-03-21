import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { generateFreePdf, generatePremiumPdf } from "@/lib/pdf";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export async function GET(req: NextRequest) {
  try {
    var url = new URL(req.url);
    var id = url.searchParams.get("id");
    var tipo = url.searchParams.get("tipo") || "free";

    if (!id) {
      return NextResponse.json({ error: "ID requerido" }, { status: 400 });
    }

    var { data, error } = await supabase
      .from("diagnosticos")
      .select("nombre, scores_dimensiones, score_final, rango, alertas_criticas, compro_premium")
      .eq("id", id)
      .single();

    if (error || !data) {
      return NextResponse.json({ error: "Diagnóstico no encontrado" }, { status: 404 });
    }

    var rangoLabels: Record<string, string> = {
      critico: "Crítico", fragil: "Frágil", inestable: "Inestable pero recuperable",
      ordenado: "Ordenado con alertas", solido: "Sólido"
    };

    var pdfData = {
      nombre: data.nombre,
      score: data.score_final,
      rango: data.rango,
      label: rangoLabels[data.rango] || data.rango,
      alertas: data.alertas_criticas || [],
      dimScores: data.scores_dimensiones,
    };

    var pdfBytes: ArrayBuffer;
    var filename: string;

    if (tipo === "premium") {
      pdfBytes = generatePremiumPdf(pdfData);
      filename = "Fincheq-ReportePremium-" + data.nombre.replace(/\s+/g, "-") + ".pdf";
    } else {
      pdfBytes = generateFreePdf(pdfData);
      filename = "Fincheq-Diagnostico-" + data.nombre.replace(/\s+/g, "-") + ".pdf";
    }

    return new NextResponse(Buffer.from(pdfBytes), {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": "attachment; filename=\"" + filename + "\"",
      },
    });
  } catch (err) {
    console.error("Error generando PDF:", err);
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}