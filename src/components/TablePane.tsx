'use client';

import { useEffect, useCallback, useRef, useState } from 'react';
import { useConnections } from '@/context/ConnectionsContext';
import { useTabStore, Tab } from '@/store/useTabStore';
import ResultsTable from '@/components/ResultsTable';
import { downloadCSV } from '@/utils/csv';
import { FiDownload, FiCopy, FiDatabase, FiCode } from "react-icons/fi";
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';

const PAGE_SIZE = 100;

interface Props {
   tab: Tab;
   isActive: boolean;
}

export default function TablePane({ tab, isActive }: Props) {
   const { activeConnection } = useConnections();
   const { updateTab, addTab } = useTabStore();

   const inputRef = useRef<HTMLInputElement>(null);

   const [view, setView] = useState<'data' | 'ddl'>('data');
   const [ddlContent, setDdlContent] = useState<string>('');
   const [loadingDdl, setLoadingDdl] = useState(false);
   const [relations, setRelations] = useState<Record<string, any>>({});

   const fetchData = useCallback(async (
      force = false,
      overrideFilter?: string,
      overridePage?: number
   ) => {
      if (!activeConnection) return;

      const hasData = tab.data && tab.data.length > 0;
      if (!force && hasData) return;

      const effectiveFilter = overrideFilter !== undefined ? overrideFilter : tab.filter;
      const effectivePage = overridePage !== undefined ? overridePage : tab.page;

      updateTab(tab.id, { loading: true });

      let sql = `SELECT * FROM ${tab.id}`;

      if (effectiveFilter.trim()) {
         const cleanFilter = effectiveFilter.trim().replace(/^where\s+/i, '');
         sql += ` WHERE ${cleanFilter}`;
      }

      const offset = effectivePage * PAGE_SIZE;
      sql += ` LIMIT ${PAGE_SIZE} OFFSET ${offset}`;

      try {
         const res = await fetch('/api/query', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ config: activeConnection, sql }),
         });

         const json = await res.json();

         if (json.error) {
            alert('Erro SQL: ' + json.error);
            updateTab(tab.id, { loading: false });
         } else {
            updateTab(tab.id, {
               data: json.data,
               loading: false,
               filter: effectiveFilter,
               page: effectivePage
            });
         }
      } catch (err) {
         console.error(err);
         updateTab(tab.id, { loading: false });
      }
   }, [activeConnection, tab.id, tab.filter, tab.page, tab.data, updateTab]);


   const fetchRelations = async () => {
      if (Object.keys(relations).length > 0) return;

      let [dbName, tblName] = tab.id.includes('.') ? tab.id.split('.') : [undefined, tab.id];
      if (tblName) tblName = tblName.replace(/`/g, '');

      try {
         const res = await fetch('/api/query/relations', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
               config: activeConnection,
               tableName: tblName,
               targetDatabase: dbName
            }),
         });
         const json = await res.json();
         if (json.relations) setRelations(json.relations);
      } catch (err) {
         console.error("Erro ao carregar FKs:", err);
      }
   };

   useEffect(() => {
      if (isActive && view === 'data' && (!tab.data || tab.data.length === 0) && !tab.loading) {
         fetchData();
         fetchRelations();
      }
   }, [isActive, view, fetchData, tab.data, tab.loading]);


   const fetchDDL = async () => {
      if (ddlContent) return;
      setLoadingDdl(true);

      let [dbName, tblName] = tab.id.includes('.') ? tab.id.split('.') : [undefined, tab.id];
      if (tblName) tblName = tblName.replace(/`/g, '');

      try {
         const res = await fetch('/api/query/ddl', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
               config: activeConnection,
               tableName: tblName,
               targetDatabase: dbName
            }),
         });
         const json = await res.json();
         if (json.error) throw new Error(json.error);
         setDdlContent(json.ddl);
      } catch (err: any) {
         setDdlContent(`-- Erro: ${err.message}`);
      } finally {
         setLoadingDdl(false);
      }
   };

   const handleNavigateFK = (targetTable: string, targetCol: string, val: string) => {
      let [dbName] = tab.id.includes('.') ? tab.id.split('.') : [undefined];
      const fullTargetName = dbName ? `${dbName}.${targetTable}` : targetTable;

      addTab(fullTargetName);

      setTimeout(() => {
         updateTab(fullTargetName, {
            filter: `${targetCol} = '${val}'`,
            page: 0,
            data: [],
            loading: false
         });
      }, 50);
   };

   const handleViewSwitch = (newView: 'data' | 'ddl') => {
      setView(newView);
      if (newView === 'ddl') fetchDDL();
   };

   const handleFilterSubmit = (e: React.FormEvent) => {
      e.preventDefault();
      fetchData(true, inputRef.current?.value || '', 0);
   };

   const changePage = (dir: 'next' | 'prev') => {
      const newPage = dir === 'next' ? tab.page + 1 : tab.page - 1;
      if (newPage < 0) return;
      fetchData(true, undefined, newPage);
   };

   const handleExportCSV = () => {
      if (!tab.data || tab.data.length === 0) return;
      const fileName = `${tab.id}_pg${tab.page + 1}_${new Date().toISOString().split('T')[0]}`;
      downloadCSV(tab.data, fileName);
   };

   return (
      <div className={`flex-1 flex flex-col gap-0 overflow-hidden h-full ${isActive ? 'flex' : 'hidden'}`}>

         <div className="flex flex-col bg-base-200 border border-base-300 p-3 pb-0 rounded-t-lg shadow-sm shrink-0">
            <div className="flex items-center justify-between text-xs font-mono mb-3">
               <div className="flex items-center gap-2 truncate opacity-80">
                  <span className="text-primary font-bold flex items-center gap-1">
                     <FiDatabase /> TABLE &gt;
                  </span>
                  <span className="font-bold text-secondary text-sm">{tab.id}</span>
               </div>

               <div className="flex gap-2 items-center">
                  {(tab.loading || loadingDdl) && <span className="loading loading-spinner loading-xs text-primary"></span>}
               </div>
            </div>

            <div className="flex gap-1 mt-1">
               <button
                  onClick={() => handleViewSwitch('data')}
                  className={`btn btn-sm rounded-b-none border-b-0 rounded-t-md px-6 gap-2 ${view === 'data' ? 'btn-active bg-base-100 hover:bg-base-100 border-base-200' : 'btn-ghost opacity-60 hover:bg-base-300'
                     }`}
               >
                  <FiDatabase className="w-3 h-3" /> Dados
               </button>
               <button
                  onClick={() => handleViewSwitch('ddl')}
                  className={`btn btn-sm rounded-b-none border-b-0 rounded-t-md px-6 gap-2 ${view === 'ddl' ? 'btn-active bg-base-100 hover:bg-base-100 border-base-200' : 'btn-ghost opacity-60 hover:bg-base-300'
                     }`}
               >
                  <FiCode className="w-3 h-3" /> DDL / Properties
               </button>
            </div>
         </div>

         <div className="flex-1 overflow-hidden bg-base-100 border border-t-0 border-base-200 relative flex flex-col rounded-b-lg">

            {view === 'data' && (
               <>
                  <div className="p-2 border-b border-base-200 bg-base-100">
                     <form onSubmit={handleFilterSubmit} className="join w-full">
                        <div className="join-item btn btn-xs btn-ghost no-animation cursor-default opacity-50 font-mono">WHERE</div>
                        <input
                           ref={inputRef}
                           type="text"
                           className="join-item input input-xs input-bordered w-full font-mono focus:outline-none focus:border-primary"
                           defaultValue={tab.filter}
                           placeholder="id > 0..."
                        />
                        <button type="submit" className="join-item btn btn-xs btn-primary">Filtrar</button>
                     </form>
                  </div>

                  <div className="flex-1 overflow-hidden">
                     <ResultsTable
                        data={tab.data || []}
                        loading={tab.loading}
                        relations={relations}
                        onNavigate={handleNavigateFK}
                     />
                  </div>

                  <div className="bg-base-200 border-t border-base-300 p-2 flex justify-between items-center shrink-0 text-xs">
                     <div className="flex items-center gap-3 ml-2">
                        <span className="opacity-50 font-mono">Página {tab.page + 1}</span>
                        {tab.data && tab.data.length > 0 && (
                           <button onClick={handleExportCSV} className="btn btn-xs btn-outline btn-success gap-1 h-6 min-h-0">
                              <FiDownload /> CSV
                           </button>
                        )}
                     </div>

                     <div className="join grid grid-cols-2 w-48">
                        <button onClick={() => changePage('prev')} className="join-item btn btn-xs btn-outline bg-base-100" disabled={tab.page === 0 || tab.loading}>« Ant</button>
                        <button onClick={() => changePage('next')} className="join-item btn btn-xs btn-outline bg-base-100" disabled={(tab.data && tab.data.length < PAGE_SIZE) || tab.loading}>Prox »</button>
                     </div>
                  </div>
               </>
            )}

            {view === 'ddl' && (
               <div className="flex-1 flex flex-col h-full bg-[#1e1e1e] relative group overflow-hidden">
                  <div className="absolute top-4 right-4 z-10 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                     <button
                        onClick={() => navigator.clipboard.writeText(ddlContent)}
                        className="btn btn-xs bg-base-100/10 text-white border-0 hover:bg-base-100/30 backdrop-blur-md gap-2"
                     >
                        <FiCopy /> Copiar SQL
                     </button>
                  </div>
                  <div className="flex-1 overflow-auto text-sm custom-scrollbar">
                     {loadingDdl ? (
                        <div className="flex flex-col items-center justify-center h-full gap-3 text-gray-500 italic">
                           <span className="loading loading-dots loading-md"></span>Buscando metadados...
                        </div>
                     ) : (
                        <SyntaxHighlighter
                           language="sql"
                           style={vscDarkPlus}
                           customStyle={{ margin: 0, padding: '1.5rem', height: '100%', background: 'transparent', fontSize: '13px', lineHeight: '1.6', fontFamily: 'monospace' }}
                           showLineNumbers={true}
                           wrapLongLines={true}
                        >
                           {ddlContent || '-- Nenhuma definição encontrada.'}
                        </SyntaxHighlighter>
                     )}
                  </div>
               </div>
            )}
         </div>
      </div>
   );
}