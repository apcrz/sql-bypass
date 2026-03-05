'use client';

import { useState } from 'react';
import { useConnections } from '@/context/ConnectionsContext';
import { Tab } from '@/store/useTabStore';
import { FiDatabase, FiCode } from "react-icons/fi";
import TableDataView from './table/TableDataView';
import TableDDLView from './table/TableDDLView';

interface Props {
   tab: Tab;
   isActive: boolean;
}

export default function TablePane({ tab, isActive }: Props) {
   const { activeConnection } = useConnections();
   const [view, setView] = useState<'data' | 'ddl'>('data');

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
                  {tab.loading && <span className="loading loading-spinner loading-xs text-primary"></span>}
               </div>
            </div>

            <div className="flex gap-1 mt-1">
               <button
                  onClick={() => setView('data')}
                  className={`btn btn-sm rounded-b-none border-b-0 rounded-t-md px-6 gap-2 ${view === 'data' ? 'btn-active bg-base-100 hover:bg-base-100 border-base-200' : 'btn-ghost opacity-60 hover:bg-base-300'
                     }`}
               >
                  <FiDatabase className="w-3 h-3" /> Dados
               </button>
               <button
                  onClick={() => setView('ddl')}
                  className={`btn btn-sm rounded-b-none border-b-0 rounded-t-md px-6 gap-2 ${view === 'ddl' ? 'btn-active bg-base-100 hover:bg-base-100 border-base-200' : 'btn-ghost opacity-60 hover:bg-base-300'
                     }`}
               >
                  <FiCode className="w-3 h-3" /> DDL / Properties
               </button>
            </div>
         </div>

         {/* CONTENT BODY */}
         <div className="flex-1 overflow-hidden bg-base-100 border border-t-0 border-base-200 relative flex flex-col rounded-b-lg">
            {view === 'data' ? (
               <TableDataView
                  tab={tab}
                  connection={activeConnection}
                  isActive={isActive && view === 'data'}
               />
            ) : (
               <TableDDLView
                  tableName={tab.id}
                  connection={activeConnection}
               />
            )}
         </div>
      </div>
   );
}