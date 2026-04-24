import type { Metadata } from 'next';
import { AppShell } from '@/components/shell/app-shell';
import './globals.css';

export const metadata: Metadata = {
  title: 'MealFit Sales Admin',
  description: 'Quản lý món hàng, combo, khách hàng, nhân viên, đơn hàng và import Excel master data.',
  icons: {
    icon: '/logo-square.jpg'
  }
};

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="vi">
      <body>
        <AppShell>{children}</AppShell>
      </body>
    </html>
  );
}
