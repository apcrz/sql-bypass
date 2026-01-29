'use client';

import { ThemeProvider } from '@/context/ThemeContext';
import { ConnectionsProvider } from '@/context/ConnectionsContext';

export function Providers({ children }: { children: React.ReactNode }) {
   return (
      <ThemeProvider>
         <ConnectionsProvider>
            {children}
         </ConnectionsProvider>
      </ThemeProvider>
   );
}