import './globals.css';

export const metadata = {
  title: 'OrdAp - Apilo Dashboard',
  description: 'Dashboard zamowien z Apilo',
};

export default function RootLayout({ children }) {
  return (
    <html lang="pl">
      <body>{children}</body>
    </html>
  );
}
