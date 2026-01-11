import './globals.css';
import Navigation from '@/components/Navigation';

export const metadata = {
  title: 'OrdAp - Apilo Dashboard',
  description: 'Dashboard zamowien z Apilo',
};

export default function RootLayout({ children }) {
  return (
    <html lang="pl">
      <body>
        <Navigation />
        {children}
      </body>
    </html>
  );
}
