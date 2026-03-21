import type { Metadata } from "next";
import { Outfit } from "next/font/google";
import "./globals.css";

const outfit = Outfit({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "fincheq — Diagnóstico financiero para tu negocio",
  description:
    "Descubrí en 5 minutos si tu negocio está financieramente sano, en riesgo o en peligro. Sin planillas, sin contador, sin tecnicismos.",
  openGraph: {
    title: "fincheq — Diagnóstico financiero para tu negocio",
    description:
      "Respondé 14 preguntas simples y recibí un diagnóstico con score, alertas y recomendaciones. Gratis.",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es">
      <body className={outfit.className}>{children}</body>
    </html>
  );
}
