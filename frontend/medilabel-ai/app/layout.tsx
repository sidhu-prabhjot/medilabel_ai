import "./globals.css";
import Navbar from "./src/components/Navbar";

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
      <body className="min-h-screen bg-background">
        <Navbar />
        <main className="pt-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {children}
        </main>
      </body>
    </html>
  );
}
