'use client';

import { useEffect, useCallback, useRef, useState } from 'react';
import { useTabStore, Tab } from '@/store/useTabStore';
import { DbConfig } from '@/context/ConnectionsContext'; // Ajuste o import se necessário
import ResultsTable from '@/components/ResultsTable';
import { downloadCSV } from '@/utils/csv';
import { FiDownload, FiPlus, FiRefreshCw } from "react-icons/fi";

const PAGE_SIZE = 100;
const MAX_SAFE_ROWS = 3000;

interface Props {
   tab: Tab;
   connection: DbConfig | undefined;
   isActive: boolean;
}

export default function TableDataView({ tab, connection, isActive }: Props) {
   const { updateTab, addTab } = useTabStore();
   const inputRef = useRef<HTMLInputElement>(null);
   const [relations, setRelations] = useState<Record<string, any>>({});

   const [hasMore, setHasMore] = useState(true);

   const fetchData = useCallback(async (
      mode: 'replace' | 'append',
      overrideFilter?: string
   ) => {
      if (!connection) return;

      if (mode === 'replace' && !overrideFilter && tab.data && tab.data.length > 0) return;

      const effectiveFilter = overrideFilter !== undefined ? overrideFilter : tab.filter;

      const targetPage = mode === 'replace' ? 0 : (tab.page + 1);

      updateTab(tab.id, { loading: true });

      let sql = `SELECT * FROM ${tab.id}`;
      if (effectiveFilter.trim()) {
         const cleanFilter = effectiveFilter.trim().replace(/^where\s+/i, '');
         sql += ` WHERE ${cleanFilter}`;
      }

      const offset = targetPage * PAGE_SIZE;
      sql += ` LIMIT ${PAGE_SIZE} OFFSET ${offset}`;

      try {
         const res = await fetch('/api/query', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ config: connection, sql }),
         });

         const json = await res.json();

         if (json.error) {
            alert('Erro SQL: ' + json.error);
            updateTab(tab.id, { loading: false });
         } else {
            const returnedRows = json.data || [];

            const newData = mode === 'append'
               ? [...(tab.data || []), ...returnedRows]
               : returnedRows;

            setHasMore(returnedRows.length === PAGE_SIZE);

            updateTab(tab.id, {
               data: newData,
               loading: false,
               filter: effectiveFilter,
               page: targetPage
            });
         }
      } catch (err) {
         console.error(err);
         updateTab(tab.id, { loading: false });
      }
   }, [connection, tab.id, tab.filter, tab.page, tab.data, updateTab]);

   const fetchRelations = async () => {
      if (Object.keys(relations).length > 0) return;
      let [dbName, tblName] = tab.id.includes('.') ? tab.id.split('.') : [undefined, tab.id];
      if (tblName) tblName = tblName.replace(/`/g, '');

      try {
         const res = await fetch('/api/query/relations', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
               config: connection,
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
      if (isActive && (!tab.data || tab.data.length === 0) && !tab.loading) {
         fetchData('replace');
         fetchRelations();
      }
   }, [isActive, fetchData, tab.data, tab.loading]);

   const handleFilterSubmit = (e: React.FormEvent) => {
      e.preventDefault();
      fetchData('replace', inputRef.current?.value || '');
   };

   const handleLoadMore = () => {
      fetchData('append');
   };

   const handleNavigateFK = (targetTable: string, targetCol: string, val: string) => {
      // ... (mantive igual)
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

   const handleExportCSV = () => {
      if (!tab.data || tab.data.length === 0) return;
      const fileName = `${tab.id}_rows${tab.data.length}_${new Date().toISOString().split('T')[0]}`;
      downloadCSV(tab.data, fileName);
   };

   const currentCount = tab.data?.length || 0;
   const isSafetyCapReached = currentCount >= MAX_SAFE_ROWS;

   return (
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
               <button type="submit" className="join-item btn btn-xs btn-primary">
                  <FiRefreshCw className={tab.loading ? "animate-spin" : ""} /> Filtrar
               </button>
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

         <div className="bg-base-200 border-t border-base-300 p-2 flex justify-between items-center shrink-0 text-xs rounded-b-lg">
            <div className="flex items-center gap-3 ml-2">
               <span className="font-mono text-secondary font-bold">
                  {currentCount} registros carregados
               </span>

               {isSafetyCapReached && (
                  <span className="text-warning flex items-center gap-1">
                     ⚠️ Limite de exibição atingido
                  </span>
               )}
            </div>

            <div className="flex gap-2">
               {currentCount > 0 && (
                  <button onClick={handleExportCSV} className="btn btn-xs btn-outline btn-success gap-1">
                     <FiDownload /> {isSafetyCapReached ? 'Baixar Tudo (CSV)' : 'CSV'}
                  </button>
               )}

               <button
                  onClick={handleLoadMore}
                  className="btn btn-xs btn-primary gap-1"
                  disabled={!hasMore || tab.loading || isSafetyCapReached}
               >
                  {tab.loading ? (
                     <span className="loading loading-spinner loading-xs"></span>
                  ) : (
                     <FiPlus />
                  )}
                  {hasMore
                     ? (isSafetyCapReached ? 'Use Exportar CSV' : `Carregar +${PAGE_SIZE}`)
                     : 'Fim da tabela'}
               </button>
            </div>
         </div>
      </>
   );
}