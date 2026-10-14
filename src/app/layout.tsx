import type { Metadata } from "next";
import "./globals.css";
export const metadata: Metadata = {
  title: "Speech2Structure · Medizinische Notizen",
  description: "Audio in strukturierte medizinische Notizen umwandeln",
};
export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="de">
      {/* Browser extensions can inject body attributes (e.g. cz-shortcut-listen)
          before React hydrates. Ignore only this element's attribute mismatch;
          descendants retain their normal hydration checks. */}
      <body suppressHydrationWarning>{children}</body>
    </html>
  );
}
