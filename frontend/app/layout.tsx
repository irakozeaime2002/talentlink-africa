import "./globals.css";
import ClientWrapper from "../components/ClientWrapper";

export const metadata = {
  title: "TalentLink Africa",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="noise-bg">
        <div className="orb w-96 h-96 bg-indigo-300/20 dark:bg-indigo-600/10 top-[-100px] left-[-100px]" />
        <div className="orb w-80 h-80 bg-violet-300/20 dark:bg-violet-600/10 bottom-[-80px] right-[-80px]" style={{ animationDelay: "3s" }} />
        <div className="orb w-64 h-64 bg-blue-300/15 dark:bg-blue-600/10 top-1/2 right-1/4" style={{ animationDelay: "1.5s" }} />
        <ClientWrapper>{children}</ClientWrapper>
      </body>
    </html>
  );
}
