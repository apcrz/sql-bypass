import { useState } from 'react';

export function useDbTest() {
   const [status, setStatus] = useState<'idle' | 'testing' | 'success' | 'error'>('idle');
   const [error, setError] = useState<string | null>(null);

   const testConnection = async (config: {
      host: string;
      user: string;
      password: string;
      database: string;
      port: string;
   }) => {
      setStatus('testing');
      setError(null);

      try {
         const res = await fetch('/api/test-connection', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(config),
         });

         const data = await res.json();
         if (res.ok && data.success) {
            setStatus('success');
            return true;
         } else {
            setStatus('error');
            setError(data.message || 'Falha na conexão');
            return false;
         }
      } catch (err: any) {
         setStatus('error');
         setError(err.message || 'Erro desconhecido');
         return false;
      }
   };

   return { status, error, testConnection };
}
