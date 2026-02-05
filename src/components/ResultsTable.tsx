'use client';

interface Props {
   data: any[];
   loading: boolean;
   relations?: Record<string, { table: string, col: string }>;
   onNavigate?: (table: string, col: string, val: string) => void;
}

export default function ResultsTable({ data, loading, relations, onNavigate }: Props) {
   if (loading) return (
      <div className="flex flex-col items-center justify-center h-full gap-2 opacity-50">
         <span className="loading loading-spinner text-primary"></span>
         <span className="text-xs font-mono">Carregando dados...</span>
      </div>
   );

   if (!data || data.length === 0) return (
      <div className="flex items-center justify-center h-full opacity-30 italic text-sm">
         Nenhum registro encontrado.
      </div>
   );

   const columns = Object.keys(data[0]);

   return (
      <div className="overflow-x-auto h-full relative">
         <table className="table table-xs table-pin-rows font-mono w-full">
            <thead>
               <tr className="bg-base-200">
                  {columns.map((col) => (
                     <th key={col} className="text-secondary font-bold border-b border-base-300 min-w-25">
                        <div className="flex items-center gap-1">
                           {col}
                           {relations?.[col] && (
                              <span className="tooltip tooltip-bottom font-normal text-xs" data-tip={`FK -> ${relations[col].table}`}>
                                 🔗
                              </span>
                           )}
                        </div>
                     </th>
                  ))}
               </tr>
            </thead>
            <tbody>
               {data.map((row, i) => (
                  <tr key={i} className="hover:bg-base-200/50 transition-colors border-b border-base-100">
                     {columns.map((col) => {
                        const val = row[col];
                        const relation = relations?.[col];
                        const isLink = relation && val !== null && val !== undefined && onNavigate;

                        return (
                           <td key={col} className="whitespace-nowrap max-w-xs truncate px-3">
                              {isLink ? (
                                 <button
                                    onClick={() => onNavigate(relation.table, relation.col, String(val))}
                                    className="link link-primary link-hover font-bold flex items-center gap-1 group text-xs"
                                    title={`Ir para ${relation.table} onde ${relation.col} = ${val}`}
                                 >
                                    {String(val)}
                                    <span className="opacity-0 group-hover:opacity-100 transition-opacity">↗</span>
                                 </button>
                              ) : (
                                 <span className={val === null ? 'opacity-30 italic' : ''}>
                                    {val === null ? 'null' : String(val)}
                                 </span>
                              )}
                           </td>
                        );
                     })}
                  </tr>
               ))}
            </tbody>
         </table>
      </div>
   );
}