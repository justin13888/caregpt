import "./globals.css";
import { Public_Sans } from "next/font/google";

// import { Navbar } from "@/app/components/Navbar";

const publicSans = Public_Sans({ subsets: ["latin"] });

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <title>CareGPT</title>
        <link rel="shortcut icon" href="/images/favicon.ico" />
        <meta property="og:title" content="Employee Care GPT" />
        <meta name="description" content="AI Employee Care System" />
        <meta property="og:description" content="AI Employee Care System" />
        <meta property="og:image" content="/images/og-image.png" />
      </head>
      <body className={publicSans.className}>
        {/* p-4 md:p-12 */}
        <div className="flex flex-col p-8 md:p-8 h-[100vh]">
          {/* <Navbar></Navbar> */}
          {children}
        </div>
      </body>
    </html>
  );
}
