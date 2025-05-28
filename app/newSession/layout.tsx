import { SessionProvider } from './SessionContext';

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      {children}
    </SessionProvider>
  );
}
