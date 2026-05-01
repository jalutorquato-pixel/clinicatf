import "./globals.css";

export const metadata = {
  title: "Clínica TF",
  description: "Sistema de gestão de embaixadoras da Clínica TF",
};

export default function RootLayout({ children }) {
  return (
    <html lang="pt-BR">
      <body className={`antialiased bg-gray-50 text-gray-900`}>
        {children}
      </body>
    </html>
  );
}
