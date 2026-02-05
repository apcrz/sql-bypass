'use client';

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';

export type DbConfig = {
   id: string;
   name: string;
   host: string;
   user: string;
   password: string;
   database: string;
   port: string;
};

type ConnectionsContextType = {
   connections: DbConfig[];
   activeConnectionId: string | null;
   activeConnection: DbConfig | undefined;
   addConnection: (c: DbConfig) => void;
   updateConnection: (c: DbConfig) => void;
   removeConnection: (id: string) => void;
   selectConnection: (id: string | null) => void;
};

const ConnectionsContext = createContext<ConnectionsContextType>({
   connections: [],
   activeConnectionId: null,
   activeConnection: undefined,
   addConnection: () => { },
   updateConnection: () => { },
   removeConnection: () => { },
   selectConnection: () => { },
});

export const ConnectionsProvider = ({ children }: { children: ReactNode }) => {
   const [connections, setConnections] = useState<DbConfig[]>([]);
   const [activeConnectionId, setActiveConnectionId] = useState<string | null>(null);

   useEffect(() => {
      const savedConns = localStorage.getItem('db_connections');
      const savedActive = localStorage.getItem('db_active_id');

      if (savedConns) setConnections(JSON.parse(savedConns));
      if (savedActive) setActiveConnectionId(savedActive);
   }, []);

   const saveAll = (conns: DbConfig[]) => {
      localStorage.setItem('db_connections', JSON.stringify(conns));
      setConnections(conns);
   };

   const addConnection = (c: DbConfig) => saveAll([...connections, c]);

   const updateConnection = (c: DbConfig) => {
      const updated = connections.map((conn) => (conn.id === c.id ? c : conn));
      saveAll(updated);
   };

   const removeConnection = (id: string) => {
      const updated = connections.filter(c => c.id !== id);
      saveAll(updated);
      if (activeConnectionId === id) selectConnection(null);
   };

   const selectConnection = (id: string | null) => {
      setActiveConnectionId(id);
      if (id) localStorage.setItem('db_active_id', id);
      else localStorage.removeItem('db_active_id');
   };

   const activeConnection = connections.find(c => c.id === activeConnectionId);

   return (
      <ConnectionsContext.Provider value={{
         connections,
         activeConnectionId,
         activeConnection,
         addConnection,
         updateConnection,
         removeConnection,
         selectConnection
      }}>
         {children}
      </ConnectionsContext.Provider>
   );
};

export const useConnections = () => useContext(ConnectionsContext);