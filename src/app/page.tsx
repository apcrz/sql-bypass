'use client';

import { useState } from 'react';
import { useConnections } from '@/context/ConnectionsContext';
import SchemaSidebar from '@/components/SchemaSidebar';
import Topbar from '@/components/Topbar';
import ResultsTable from '@/components/ResultsTable';

const PAGE_SIZE = 100;

export default function MainApp() {
  const [isSidebarOpen, setSidebarOpen] = useState(true);
  const { activeConnection } = useConnections();

  const [queryResults, setQueryResults] = useState<any[]>([]);
  const [loadingQuery, setLoadingQuery] = useState(false);

  const [currentTable, setCurrentTable] = useState<string | null>(null);
  const [page, setPage] = useState(0);

  const [filterText, setFilterText] = useState('');

  const fetchData = async (tableName: string, pageNum: number, filter: string) => {
    if (!activeConnection) return;

    setLoadingQuery(true);

    let sql = `SELECT * FROM ${tableName}`;

    if (filter.trim()) {
      const cleanFilter = filter.trim().replace(/^where\s+/i, '');
      sql += ` WHERE ${cleanFilter}`;
    }

    const offset = pageNum * PAGE_SIZE;
    sql += ` LIMIT ${PAGE_SIZE} OFFSET ${offset}`;

    try {
      const res = await fetch('/api/query', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ config: activeConnection, sql }),
      });

      const json = await res.json();

      if (json.error) {
        console.error(json.error);
        alert('Erro SQL: ' + json.error);
      } else {
        setQueryResults(json.data);
      }
    } catch (err) {
      console.error(err);
      alert('Erro de Conexão com a API');
    } finally {
      setLoadingQuery(false);
    }
  };

  const handleTableClick = (tableName: string) => {
    setCurrentTable(tableName);
    setPage(0);
    setFilterText('');
    setQueryResults([]);

    fetchData(tableName, 0, '');
  };

  const handlePagination = (direction: 'next' | 'prev') => {
    if (!currentTable) return;

    const newPage = direction === 'next' ? page + 1 : page - 1;
    if (newPage < 0) return;

    setPage(newPage);
    fetchData(currentTable, newPage, filterText);
  };

  const handleFilterSubmit = (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!currentTable) return;

    const form = e?.target as HTMLFormElement;
    const input = form.elements.namedItem('filterInput') as HTMLInputElement;
    const newFilter = input.value;

    setFilterText(newFilter);
    setPage(0);
    fetchData(currentTable, 0, newFilter);  };

  return (
    <div className="flex h-screen bg-base-100 overflow-hidden">
      <SchemaSidebar
        open={isSidebarOpen}
        onSelectTable={handleTableClick}
      />

      <div className="flex-1 flex flex-col min-w-0 transition-all duration-300">
        <Topbar toggleSidebar={() => setSidebarOpen(!isSidebarOpen)} />

        <main className="flex-1 p-4 overflow-hidden flex flex-col gap-4">
          {activeConnection ? (
            <>
              <div className="flex flex-col gap-2 bg-base-200 border border-base-300 p-3 rounded-lg shadow-sm shrink-0">

                <div className="flex items-center justify-between text-xs font-mono">
                  <div className="flex items-center gap-2 truncate opacity-80">
                    <span className="text-primary font-bold">SQL &gt;</span>
                    {currentTable ? (
                      <span className="font-bold text-secondary text-sm">{currentTable}</span>
                    ) : (
                      <span className="italic opacity-50">Selecione uma tabela...</span>
                    )}
                  </div>

                  <div className="flex gap-2 items-center">
                    {loadingQuery && <span className="loading loading-spinner loading-xs text-primary"></span>}
                    {queryResults.length > 0 && (
                      <div className="badge badge-neutral font-mono text-xs">
                        {queryResults.length} linhas
                      </div>
                    )}
                  </div>
                </div>

                {currentTable && (
                  <form
                    onSubmit={handleFilterSubmit}
                    className="join w-full pt-1"
                    key={currentTable}
                  >
                    <div className="join-item btn btn-sm btn-ghost no-animation bg-base-100 border border-base-300 border-r-0 cursor-default">
                      <span className="text-xs opacity-50 font-normal hidden sm:inline">WHERE</span>
                    </div>

                    <input
                      type="text"
                      name="filterInput"
                      className="join-item input input-sm input-bordered w-full font-mono text-sm focus:outline-none focus:border-primary"
                      placeholder="ex: id = 10 AND status = 'active'"
                      defaultValue=""
                    />

                    <button
                      type="submit"
                      className="join-item btn btn-sm btn-primary"
                      disabled={loadingQuery}
                    >
                      Filtrar
                    </button>
                  </form>
                )}
              </div>

              <div className="flex-1 overflow-hidden shadow-inner bg-base-100 rounded-lg border border-base-200 relative flex flex-col">
                {!loadingQuery && queryResults.length === 0 && !currentTable && (
                  <div className="absolute inset-0 flex flex-col items-center justify-center opacity-20 pointer-events-none">
                    <span className="text-6xl mb-4">🖥️</span>
                    <p className="text-xl font-semibold">Ready to Code</p>
                  </div>
                )}

                <div className="flex-1 overflow-hidden">
                  <ResultsTable data={queryResults} loading={loadingQuery} />
                </div>

                {currentTable && (
                  <div className="bg-base-200 border-t border-base-300 p-2 flex justify-between items-center shrink-0">
                    <div className="text-xs opacity-50 font-mono ml-2">
                      Página {page + 1}
                    </div>

                    <div className="join grid grid-cols-2 w-48">
                      <button
                        className="join-item btn btn-sm btn-outline"
                        disabled={page === 0 || loadingQuery}
                        onClick={() => handlePagination('prev')}
                      >
                        « Anterior
                      </button>
                      <button
                        className="join-item btn btn-sm btn-outline"
                        disabled={queryResults.length < PAGE_SIZE || loadingQuery}
                        onClick={() => handlePagination('next')}
                      >
                        Próximo »
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-base-content/30 italic gap-2">
              <span className="text-5xl">🔌</span>
              <p className="text-lg">Selecione uma conexão para começar.</p>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}

