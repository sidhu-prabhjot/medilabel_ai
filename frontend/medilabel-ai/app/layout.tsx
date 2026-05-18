import "./globals.css";
import { ThemeProvider } from "./src/context/theme-context";

export const metadata = {
  title: "MediLabel AI",
  description: "Your intelligent medicine assistant",
};

// Runs synchronously before first paint to apply saved theme without flash.
// Wrapping in try/catch guards against restricted environments (e.g. incognito with storage blocked).
const themeInitScript = `(function(){try{var s=localStorage.getItem('theme');var sys=window.matchMedia('(prefers-color-scheme: dark)').matches;if(s==='dark'||(s===null&&sys)){document.documentElement.classList.add('dark');}}catch(_){}})();`;

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    // suppressHydrationWarning because the inline script may add class="dark"
    // before React hydrates, creating a server/client class mismatch on <html>
    <html lang="en" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeInitScript }} />
      </head>
      <body className="min-h-screen">
        <ThemeProvider>{children}</ThemeProvider>
      </body>
    </html>
  );
}
