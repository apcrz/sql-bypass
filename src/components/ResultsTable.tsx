'use client';

type Props = {
   data: any[];
   loading?: boolean;
};

export default function ResultsTable({ data, loading }: Props) {
   if (loading) {
      return (
         <div className="flex h-full items-center justify-center opacity-50 flex-col gap-3">
            <span className="loading loading-spinner loading-lg text-primary"></span>
            <span className="text-sm animate-pulse font-medium">Buscando dados no servidor...</span>
         </div>
      );
   }

   if (!data || data.length === 0) {
      return (
         <div className="flex h-full items-center justify-center opacity-40 italic text-base flex-col">
            <span className="text-4xl mb-3">🥥</span>
            <span>Nenhum dado para exibir.</span>
         </div>
      );
   }

   const columns = Object.keys(data[0]);

   return (
      <div className="overflow-x-auto h-full bg-base-100 rounded-lg border border-base-300">
         <table className="table table-sm table-pin-rows">
            <thead>
               <tr className="bg-base-200">
                  <th className="bg-base-300 text-base-content/50 w-16 text-center text-xs">#</th>
                  {columns.map((col) => (
                     <th key={col} className="font-mono text-primary font-bold text-sm tracking-wide">
                        {col}
                     </th>
                  ))}
               </tr>
            </thead>
            <tbody className="font-mono text-sm">
               {data.map((row, i) => (
                  <tr key={i} className="hover">
                     <th className="opacity-50 text-center font-normal">{i + 1}</th>
                     {columns.map((col) => (
                        <td key={`${i}-${col}`} className="whitespace-nowrap max-w-100 truncate border-r border-base-200 last:border-0 px-4">
                           {typeof row[col] === 'object' && row[col] !== null
                              ? <span className="opacity-70 text-xs">{JSON.stringify(row[col])}</span>
                              : String(row[col] ?? 'NULL')}
                        </td>
                     ))}
                  </tr>
               ))}
            </tbody>
         </table>
      </div>
   );
}