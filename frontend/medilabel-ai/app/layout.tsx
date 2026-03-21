import "./globals.css";
import { ThemeProvider } from "./src/context/theme-context";

export const metadata = {
  title: "MediLabel AI",
  description: "Your intelligent medicine assistant",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="min-h-screen">
        <ThemeProvider>{children}</ThemeProvider>
      </body>
    </html>
  );
}
