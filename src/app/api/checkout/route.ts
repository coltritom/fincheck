import { NextRequest, NextResponse } from "next/server";
import { MercadoPagoConfig, Preference } from "mercadopago";

const client = new MercadoPagoConfig({
  accessToken: process.env.MERCADOPAGO_ACCESS_TOKEN!,
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { diagnosticoId, email, nombre } = body;

    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://Fincheq-six.vercel.app";

    const preference = new Preference(client);

    const result = await preference.create({
      body: {
        items: [
          {
            id: "reporte-premium",
            title: "Fincheq — Reporte Premium",
            description: "Diagnóstico financiero completo con plan de acción",
            quantity: 1,
            currency_id: "ARS",
            unit_price: 14000,
          },
        ],
        payer: {
          email: email,
          name: nombre,
        },
        back_urls: {
          success: siteUrl + "?pago=ok&diag=" + diagnosticoId,
          failure: siteUrl + "?pago=error&diag=" + diagnosticoId,
          pending: siteUrl + "?pago=pendiente&diag=" + diagnosticoId,
        },
        auto_return: "approved",
        external_reference: diagnosticoId,
        notification_url: siteUrl + "/api/webhook/mercadopago",
      },
    });

    return NextResponse.json({
      id: result.id,
      init_point: result.init_point,
    });
  } catch (err) {
    console.error("Error creando preferencia:", err);
    return NextResponse.json({ error: "Error creando pago" }, { status: 500 });
  }
}