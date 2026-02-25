import "./globals.css";

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
        <p>Hello World</p>
      </body>
    </html>
  );
}
