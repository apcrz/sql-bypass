// src/components/Topbar.tsx

'use client';
import { useTheme } from '@/context/ThemeContext';
import { useConnections } from '@/context/ConnectionsContext';
import ConfigModal from './ConfigModal';
import { daisyThemes } from '@/lib/daisyThemes';

const themes = daisyThemes;

export default function Topbar({ toggleSidebar }: { toggleSidebar: () => void }) {
   const { theme: currentTheme, setTheme } = useTheme();
   const { activeConnection } = useConnections();

   return (
      <div className="navbar bg-base-200 border-b border-base-300 px-4 shadow-md h-16 min-h-16">
         <div className="flex-none">
            <button onClick={toggleSidebar} className="btn btn-square btn-ghost btn-sm">
               <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" className="inline-block w-5 h-5 stroke-current"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16"></path></svg>
            </button>
         </div>
         <div className="flex-1 px-2 mx-2">
            <a className="text-xl font-black tracking-tighter flex items-center gap-2 uppercase select-none">
               <span className="text-primary text-2xl">⚡</span> SQL Bypass
            </a>
         </div>

         <div className="flex-none gap-3 items-center">
            {activeConnection ? (
               <div className="tooltip tooltip-bottom" data-tip={`Conectado a: ${activeConnection.host}`}>
                  <div className="badge badge-success badge-outline gap-2 p-3 font-mono text-[10px] cursor-help">
                     <div className="w-2 h-2 rounded-full bg-success animate-pulse shadow-[0_0_8px_rgba(0,255,0,0.5)]"></div>
                     ONLINE
                  </div>
               </div>
            ) : (
               <div className="tooltip tooltip-bottom" data-tip="Nenhuma conexão selecionada">
                  <div className="badge badge-neutral gap-2 p-3 font-mono text-[10px] opacity-50">
                     <div className="w-2 h-2 rounded-full bg-base-content opacity-20"></div>
                     OFFLINE
                  </div>
               </div>
            )}

            <div className="dropdown dropdown-end">
               <div tabIndex={0} role="button" className="btn btn-ghost btn-sm m-1 capitalize text-xs">
                  🎨 {currentTheme}
               </div>
               <ul tabIndex={0} className="dropdown-content z-50 menu p-2 shadow-lg bg-base-300 rounded-box w-52 max-h-96 overflow-y-auto border border-base-100">
                  {themes.map((t) => (
                     <li key={t}>
                        <button
                           onClick={() => setTheme(t)}
                           className={`btn btn-sm btn-ghost justify-start content-center font-normal ${currentTheme === t ? "btn-active" : ""}`}
                        >
                           {t}
                        </button>
                     </li>
                  ))}
               </ul>
            </div>

            <ConfigModal />
         </div>
      </div>
   );
}