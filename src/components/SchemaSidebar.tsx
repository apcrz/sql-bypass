'use client';

import { useState, useEffect, useMemo } from 'react';
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
   const [searchTerm, setSearchTerm] = useState('');

   useEffect(() => {
      if (!activeConnection) {
         setSchema([]);
         return;
      }
      const fetchSchema = async () => {
         setLoading(true);
         setError(null);
         setSchema([]);
         setSearchTerm('');
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

   const filteredSchema = useMemo(() => {
      if (!searchTerm.trim()) return schema;
      const lowerTerm = searchTerm.toLowerCase();
      return schema.map(db => {
         const dbNameMatch = db.name.toLowerCase().includes(lowerTerm);
         const matchingTables = db.tables.filter(t => t.toLowerCase().includes(lowerTerm));
         if (matchingTables.length > 0) return { ...db, tables: matchingTables };
         if (dbNameMatch) return db;
         return null;
      }).filter(Boolean) as SchemaNode[];
   }, [schema, searchTerm]);

   const handleTableClick = (dbName: string, tableName: string) => {
      const fullTableName = `${dbName}.${tableName}`;
      setActiveTable(fullTableName);
      if (onSelectTable) onSelectTable(fullTableName);
   };

   return (
      <>
         <aside className={`h-full bg-base-200 border-r border-base-300 transition-all duration-300 ease-in-out ${open ? 'w-80 opacity-100' : 'w-0 opacity-0'} overflow-hidden flex flex-col shrink-0`}>
            <div className="h-full flex flex-col min-w-[20rem]">

               <div className="p-3 border-b border-base-300/50 shrink-0 flex flex-col gap-2 bg-base-300/20">
                  <div className="flex items-center justify-between">
                     <h2 className="text-[10px] font-bold tracking-widest uppercase opacity-60 flex items-center gap-2">
                        <span className="text-primary text-base">🔌</span> Conexões
                     </h2>
                     {loading && <span className="loading loading-spinner loading-xs text-primary"></span>}
                  </div>

                  {activeConnection && (
                     <div className="relative">
                        <input
                           type="text"
                           placeholder="Filtrar tabelas..."
                           className="input input-xs input-bordered w-full pr-8 font-sans"
                           value={searchTerm}
                           onChange={(e) => setSearchTerm(e.target.value)}
                        />
                        {searchTerm && (
                           <button onClick={() => setSearchTerm('')} className="absolute right-2 top-1 text-[10px] opacity-40 hover:opacity-100">❌</button>
                        )}
                     </div>
                  )}
               </div>

               <div className="flex-1 overflow-y-auto p-2 space-y-2 scrollbar-thin">
                  {connections.length === 0 && (
                     <div className="text-center p-4 opacity-40 text-xs italic mt-10">Nenhuma conexão salva.</div>
                  )}

                  {connections.map((conn) => {
                     const isActive = activeConnectionId === conn.id;

                     return (
                        <div key={conn.id} className={`collapse collapse-arrow bg-base-100 border border-base-300 rounded-md transition-all ${isActive ? 'collapse-open shadow-sm' : 'collapse-close opacity-80'}`}>

                           <div
                              className={`collapse-title text-xs font-bold flex items-center justify-between pr-8 cursor-pointer select-none min-h-0 py-3 ${isActive ? 'bg-base-300/30 text-primary' : ''}`}
                              onClick={() => !isActive && selectConnection(conn.id)}
                           >
                              <div className="flex items-center gap-2 truncate">
                                 <span className="text-[10px]">{isActive ? '🟢' : '⚪'}</span>
                                 <span className="truncate uppercase tracking-tight" title={conn.name || conn.host}>{conn.name || conn.host}</span>
                              </div>
                              <button
                                 className="btn btn-ghost btn-xs text-error absolute right-8 top-2 opacity-0 group-hover:opacity-100"
                                 onClick={(e) => { e.stopPropagation(); setConnToDelete(conn); }}
                              >🗑️</button>
                           </div>

                           <div className="collapse-content px-0 pb-0">
                              {isActive && (
                                 <div className="bg-base-200/30 border-t border-base-200">
                                    {error && <div className="p-2 text-[11px] text-error bg-error/10 m-2 rounded italic">{error}</div>}

                                    {!loading && !error && (
                                       <ul className="menu menu-xs w-full p-0 gap-0">
                                          {filteredSchema.map((db) => (
                                             <li key={db.name} className="gap-0">
                                                <details open={searchTerm.length > 0}>
                                                   <summary className="font-bold text-secondary truncate py-2 hover:bg-base-300 rounded-none text-[11px] border-b border-base-300/10">
                                                      🗄️ {db.name.toUpperCase()} <span className="opacity-40 font-normal text-[9px]">({db.tables.length})</span>
                                                   </summary>
                                                   <ul className="before:bg-base-300/50">
                                                      {db.tables.map((table) => (
                                                         <li key={table}>
                                                            <a
                                                               onClick={() => handleTableClick(db.name, table)}
                                                               className={`py-1.5 rounded-none border-l-2 border-transparent text-[12px] font-mono ${activeTable === `${db.name}.${table}` ? 'active border-primary bg-primary/10 font-bold' : 'hover:border-base-content/20'}`}
                                                            >
                                                               <span className="opacity-30 text-[10px]">📄</span>
                                                               {searchTerm ? (
                                                                  <span className="truncate">
                                                                     {table.split(new RegExp(`(${searchTerm})`, 'gi')).map((part, i) =>
                                                                        part.toLowerCase() === searchTerm.toLowerCase()
                                                                           ? <span key={i} className="bg-warning/40 text-warning-content">{part}</span>
                                                                           : part
                                                                     )}
                                                                  </span>
                                                               ) : <span className="truncate">{table}</span>}
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
               <div className="modal-box border border-error p-4">
                  <h3 className="font-bold text-sm text-error uppercase">Remover Conexão?</h3>
                  <p className="py-2 text-xs opacity-70">Deseja esquecer {connToDelete.name || connToDelete.host}?</p>
                  <div className="modal-action">
                     <button className="btn btn-xs" onClick={() => setConnToDelete(null)}>Não</button>
                     <button className="btn btn-xs btn-error" onClick={() => { removeConnection(connToDelete.id); setConnToDelete(null); }}>Sim</button>
                  </div>
               </div>
            </dialog>
         )}
      </>
   );
}