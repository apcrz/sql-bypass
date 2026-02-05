'use client';

import { useState, useEffect } from 'react';
import { useConnections } from '@/context/ConnectionsContext';
import SchemaSidebar from '@/components/SchemaSidebar';
import Topbar from '@/components/Topbar';
import TabHeader from '@/components/TabHeader';
import TablePane from '@/components/TablePane';
import { useTabStore } from '@/store/useTabStore';
import { useUIStore } from '@/store/useUIStore';

export default function MainApp() {
  const [isSidebarOpen, setSidebarOpen] = useState(true);
  const { activeConnection } = useConnections();
  const { tabs, activeTabId, addTab } = useTabStore();
  const { scale } = useUIStore();

  useEffect(() => {
    document.documentElement.style.fontSize = `${scale}%`
  }, [scale])
  
  return (
    <div className="flex h-screen bg-base-100 overflow-hidden">
      <SchemaSidebar
        open={isSidebarOpen}
        onSelectTable={(tableName) => addTab(tableName)}
      />

      <div className="flex-1 flex flex-col min-w-0 transition-all duration-300">
        <Topbar toggleSidebar={() => setSidebarOpen(!isSidebarOpen)} />

        <TabHeader />

        <main className="flex-1 p-4 overflow-hidden relative">
          {!activeConnection ? (
            <div className="flex h-full flex-col items-center justify-center text-base-content/30 italic gap-2">
              <span className="text-5xl">🔌</span>
              <p className="text-lg">Selecione uma conexão para começar.</p>
            </div>
          ) : tabs.length === 0 ? (
            <div className="flex h-full flex-col items-center justify-center opacity-20 pointer-events-none">
              <span className="text-6xl mb-4">🖥️</span>
              <p className="text-xl font-semibold">Ready to Code</p>
            </div>
          ) : (
            tabs.map((tab) => (
              <TablePane
                key={tab.id}
                tab={tab}
                isActive={activeTabId === tab.id}
              />
            ))
          )}
        </main>
      </div>
    </div>
  );
}