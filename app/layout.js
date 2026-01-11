import './globals.css';
import Navigation from '@/components/Navigation';

export const metadata = {
  title: 'Centrala Poom-Furniture',
  description: 'Dashboard zamowien Poom-Furniture',
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
