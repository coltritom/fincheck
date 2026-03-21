import { NextRequest, NextResponse } from "next/server";
import { MercadoPagoConfig, Payment } from "mercadopago";
import { createClient } from "@supabase/supabase-js";

const client = new MercadoPagoConfig({
  accessToken: process.env.MERCADOPAGO_ACCESS_TOKEN!,
});

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    if (body.type === "payment" || body.action === "payment.created" || body.action === "payment.updated") {
      const paymentId = body.data?.id;

      if (!paymentId) {
        return NextResponse.json({ received: true });
      }

      const payment = new Payment(client);
      const paymentData = await payment.get({ id: paymentId });

      if (paymentData.status === "approved") {
        const diagnosticoId = paymentData.external_reference;

        if (diagnosticoId) {
          // Marcar diagnóstico como premium
          await supabase
            .from("diagnosticos")
            .update({ compro_premium: true })
            .eq("id", diagnosticoId);

          // Guardar el pago
          await supabase.from("pagos").insert({
            diagnostico_id: diagnosticoId,
            monto: 9.99,
            moneda: "USD",
            pasarela: "mercadopago",
            estado: "completado",
            referencia_externa: String(paymentId),
          });

          console.log("Pago aprobado para diagnóstico:", diagnosticoId);
        }
      }
    }

    return NextResponse.json({ received: true });
  } catch (err) {
    console.error("Error en webhook MP:", err);
    return NextResponse.json({ received: true });
  }
}

// MercadoPago also sends GET requests to verify the endpoint
export async function GET() {
  return NextResponse.json({ status: "ok" });
}