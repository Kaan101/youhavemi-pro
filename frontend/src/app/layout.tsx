import "./globals.css";

export const metadata = {
  title: "YouHaveMi Pro",
  description: "Kurumsal, anonim mesajlaşma altyapısı",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="tr">
      <body className="bg-slateBg text-ink">{children}</body>
    </html>
  );
}
