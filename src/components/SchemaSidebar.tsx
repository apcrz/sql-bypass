'use client';

import { useState, useEffect } from 'react';
import { useConnections, DbConfig } from '@/context/ConnectionsContext';

type SchemaNode = {
   name: string;
   tables: string[];
};

type Props = {
   open: boolean;
   onSelectTable?: (tableName: string) => void;
};

export default function SchemaSidebar({ open, onSelectTable }: Props) {
   const { connections, activeConnectionId, activeConnection, selectConnection, removeConnection } = useConnections();
   const [activeTable, setActiveTable] = useState<string | null>(null);
   const [connToDelete, setConnToDelete] = useState<DbConfig | null>(null);
   const [schema, setSchema] = useState<SchemaNode[]>([]);
   const [loading, setLoading] = useState(false);
   const [error, setError] = useState<string | null>(null);

   useEffect(() => {
      if (!activeConnection) {
         setSchema([]);
         return;
      }
      const fetchSchema = async () => {
         setLoading(true);
         setError(null);
         setSchema([]);
         try {
            const res = await fetch('/api/schema', {
               method: 'POST',
               headers: { 'Content-Type': 'application/json' },
               body: JSON.stringify(activeConnection),
            });
            const json = await res.json();
            if (json.error) throw new Error(json.error);
            setSchema(json.data);
         } catch (err: any) {
            setError(err.message);
         } finally {
            setLoading(false);
         }
      };
      fetchSchema();
   }, [activeConnection]);

   const handleDelete = () => {
      if (connToDelete) {
         removeConnection(connToDelete.id);
         setConnToDelete(null);
      }
   };

   const handleTableClick = (dbName: string, tableName: string) => {
      const fullTableName = `${dbName}.${tableName}`;
      setActiveTable(fullTableName);
      if (onSelectTable) onSelectTable(fullTableName);
   };

   return (
      <>
         <aside
            className={`
            h-full bg-base-200 border-r border-base-300
            transition-all duration-300 ease-in-out
            ${open ? 'w-80 opacity-100' : 'w-0 opacity-0'}
            overflow-hidden flex flex-col shrink-0
         `}
         >
            <div className="h-full flex flex-col min-w-[20rem]">

               <div className="flex items-center justify-between p-4 border-b border-base-300/50 h-16 shrink-0">
                  <h2 className="text-sm font-bold tracking-wide uppercase opacity-70 flex items-center gap-2">
                     <span className="text-primary text-lg">🔌</span> Conexões
                  </h2>
                  {loading && <span className="loading loading-spinner loading-sm text-primary"></span>}
               </div>

               <div className="flex-1 overflow-y-auto p-3 space-y-3 scrollbar-thin scrollbar-thumb-base-300">
                  {connections.length === 0 && (
                     <div className="text-center p-4 opacity-40 text-sm italic mt-10">
                        Nenhuma conexão salva.<br />
                        Configure no topo.
                     </div>
                  )}

                  {connections.map((conn) => {
                     const isActive = activeConnectionId === conn.id;

                     return (
                        <div key={conn.id} className={`collapse collapse-arrow bg-base-100 border border-base-300 rounded-box transition-all ${isActive ? 'collapse-open shadow-md' : 'collapse-close opacity-90 hover:opacity-100'}`}>

                           <div
                              className={`collapse-title text-base font-medium flex items-center justify-between pr-8 cursor-pointer select-none py-4 ${isActive ? 'bg-base-300/50 text-primary' : ''}`}
                              onClick={() => !isActive && selectConnection(conn.id)}
                           >
                              <div className="flex items-center gap-3 truncate">
                                 {isActive ? '🟢' : '⚪'}
                                 <span className="truncate" title={conn.name || conn.host}>{conn.name || conn.host}</span>
                              </div>

                              <button
                                 className="btn btn-ghost btn-sm text-error z-50 opacity-0 group-hover:opacity-100"
                                 title="Remover"
                                 onClick={(e) => {
                                    e.stopPropagation();
                                    setConnToDelete(conn);
                                 }}
                              >
                                 🗑️
                              </button>
                           </div>

                           <div className="collapse-content px-0 pb-0">
                              {isActive && (
                                 <div className="bg-base-200/50 min-h-12.5 border-t border-base-200">
                                    {loading && <div className="p-4 text-sm opacity-50 text-center">Lendo tabelas...</div>}
                                    {error && <div className="p-3 text-sm text-error bg-error/10 m-2 rounded">{error}</div>}

                                    {!loading && !error && schema.length > 0 && (
                                       <ul className="menu menu-sm w-full p-0">
                                          {schema.map((db) => (
                                             <li key={db.name}>
                                                <details>
                                                   <summary className="font-semibold text-secondary truncate py-3 hover:bg-base-300 rounded-none text-sm">
                                                      🗄️ {db.name} <span className="opacity-50 text-xs">({db.tables.length})</span>
                                                   </summary>
                                                   <ul>
                                                      {db.tables.map((table) => (
                                                         <li key={table}>
                                                            <a
                                                               onClick={() => handleTableClick(db.name, table)}
                                                               className={`py-2 rounded-none border-l-4 border-transparent text-sm ${activeTable === `${db.name}.${table}` ? 'active border-primary font-bold' : 'hover:border-base-content/30'}`}
                                                            >
                                                               <span className="opacity-50">📄</span> {table}
                                                            </a>
                                                         </li>
                                                      ))}
                                                   </ul>
                                                </details>
                                             </li>
                                          ))}
                                       </ul>
                                    )}
                                 </div>
                              )}
                           </div>
                        </div>
                     );
                  })}
               </div>
            </div>
         </aside>

         {connToDelete && (
            <dialog className="modal modal-open">
               <div className="modal-box border border-error shadow-xl">
                  <h3 className="font-bold text-lg text-error">⚠️ Remover Conexão?</h3>
                  <p className="py-4 text-base">
                     Tem certeza que deseja esquecer a conexão <br />
                     <span className="font-bold font-mono bg-base-200 px-2 py-1 rounded text-lg">{connToDelete.name || connToDelete.host}</span>?
                  </p>
                  <div className="modal-action">
                     <button className="btn" onClick={() => setConnToDelete(null)}>Cancelar</button>
                     <button className="btn btn-error" onClick={handleDelete}>Confirmar</button>
                  </div>
               </div>
            </dialog>
         )}
      </>
   );
}