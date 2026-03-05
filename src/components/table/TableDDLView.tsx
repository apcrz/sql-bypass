'use client';

import { useState, useEffect } from 'react';
import { FiCopy, FiCode } from "react-icons/fi";
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';

interface Props {
   tableName: string;
   connection: any;
}

export default function TableDDLView({ tableName, connection }: Props) {
   const [content, setContent] = useState<string>('');
   const [loading, setLoading] = useState(false);

   useEffect(() => {
      const fetchDDL = async () => {
         if (!connection || content) return;
         setLoading(true);

         let [dbName, tblName] = tableName.includes('.') ? tableName.split('.') : [undefined, tableName];
         if (tblName) tblName = tblName.replace(/`/g, '');

         try {
            const res = await fetch('/api/query/ddl', {
               method: 'POST',
               headers: { 'Content-Type': 'application/json' },
               body: JSON.stringify({
                  config: connection,
                  tableName: tblName,
                  targetDatabase: dbName
               }),
            });
            const json = await res.json();
            if (json.error) throw new Error(json.error);
            setContent(json.ddl);
         } catch (err: any) {
            setContent(`-- Erro: ${err.message}`);
         } finally {
            setLoading(false);
         }
      };

      fetchDDL();
   }, [tableName, connection, content]);

   return (
      <div className="flex-1 flex flex-col h-full bg-[#1e1e1e] relative group overflow-hidden rounded-b-lg">
         <div className="absolute top-4 right-4 z-10 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
            <button
               onClick={() => navigator.clipboard.writeText(content)}
               className="btn btn-xs bg-base-100/10 text-white border-0 hover:bg-base-100/30 backdrop-blur-md gap-2"
            >
               <FiCopy /> Copiar SQL
            </button>
         </div>
         <div className="flex-1 overflow-auto text-sm custom-scrollbar">
            {loading ? (
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
                  {content || '-- Nenhuma definição encontrada.'}
               </SyntaxHighlighter>
            )}
         </div>
      </div>
   );
}