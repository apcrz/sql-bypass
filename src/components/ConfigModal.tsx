// src/components/ConfigModal.tsx
'use client';
import { useState, useEffect } from 'react';
import { DbConfig, useConnections } from '@/context/ConnectionsContext';
import { useDbTest } from '@/hooks/useDbTest';
import { v4 as uuid } from 'uuid';

type ConfigModalProps = {
   connection?: DbConfig; // se presente, modo edição
   onClose?: () => void;
};

export default function ConfigModal({ connection, onClose }: ConfigModalProps) {
   const { addConnection, updateConnection } = useConnections();
   const [config, setConfig] = useState<DbConfig>({
      id: uuid(),
      name: '',
      host: '',
      user: '',
      password: '',
      database: '',
      port: '3306',
      ...connection,
   });

   const [tested, setTested] = useState(false);
   const { status, error, testConnection } = useDbTest();

   const handleSave = () => {
      if (connection) updateConnection(config);
      else addConnection(config);
      const modal = document.getElementById('config_modal') as HTMLDialogElement;
      modal?.close();
      onClose?.();
   };

   const handleTest = async () => {
      const ok = await testConnection(config);
      setTested(ok);
   };

   return (
      <>
         <button
            className="btn btn-primary btn-sm"
            onClick={() => (document.getElementById('config_modal') as HTMLDialogElement).showModal()}
         >
            ⚙️ Config
         </button>
         <dialog id="config_modal" className="modal">
            <div className="modal-box border border-base-300">
               <h3 className="font-bold text-lg text-primary mb-4">
                  {connection ? 'Editar Conexão' : 'Nova Conexão'}
               </h3>

               <div className="space-y-3">
                  <input
                     type="text"
                     placeholder="Nome da Conexão"
                     className="input input-bordered w-full"
                     value={config.name}
                     onChange={(e) => setConfig({ ...config, name: e.target.value })}
                  />
                  <input
                     type="text"
                     placeholder="Host"
                     className="input input-bordered w-full"
                     value={config.host}
                     onChange={(e) => setConfig({ ...config, host: e.target.value })}
                  />
                  <div className="flex gap-2">
                     <input
                        type="text"
                        placeholder="User"
                        className="input input-bordered w-1/2"
                        value={config.user}
                        onChange={(e) => setConfig({ ...config, user: e.target.value })}
                     />
                     <input
                        type="text"
                        placeholder="Port"
                        className="input input-bordered w-1/2"
                        value={config.port}
                        onChange={(e) => setConfig({ ...config, port: e.target.value })}
                     />
                  </div>
                  <input
                     type="password"
                     placeholder="Password"
                     className="input input-bordered w-full"
                     value={config.password}
                     onChange={(e) => setConfig({ ...config, password: e.target.value })}
                  />
                  <input
                     type="text"
                     placeholder="Database"
                     className="input input-bordered w-full"
                     value={config.database}
                     onChange={(e) => setConfig({ ...config, database: e.target.value })}
                  />
               </div>

               <div className="flex items-center gap-2 mt-4">
                  <button
                     className={`btn btn-outline btn-sm ${status === 'testing' ? 'loading' : ''}`}
                     onClick={handleTest}
                  >
                     Testar Conexão
                  </button>
                  {status === 'success' && <span className="text-success font-semibold">✅ OK</span>}
                  {status === 'error' && <span className="text-error font-semibold">❌ {error}</span>}
               </div>

               <div className="modal-action mt-4">
                  <button className="btn btn-primary w-full" disabled={!tested} onClick={handleSave}>
                     Salvar
                  </button>
               </div>
            </div>
            <form method="dialog" className="modal-backdrop">
               <button />
            </form>
         </dialog>
      </>
   );
}
