import { useTabStore } from '@/store/useTabStore';

export default function TabHeader() {
   const { tabs, activeTabId, setActiveTab, removeTab } = useTabStore();

   if (tabs.length === 0) return null;

   return (
      <div className="tabs tabs-boxed bg-base-200 rounded-none px-2 pt-2 gap-1 overflow-x-auto flex-nowrap shrink-0">
         {tabs.map((tab) => (
            <a
               key={tab.id}
               className={`tab tab-sm transition-all flex-nowrap whitespace-nowrap gap-2 ${activeTabId === tab.id ? 'tab-active font-bold' : ''}`}
               onClick={() => setActiveTab(tab.id)}
            >
               {tab.id}
               <span
                  className="hover:text-error font-mono text-xs px-1 rounded hover:bg-base-100/20"
                  onClick={(e) => { e.stopPropagation(); removeTab(tab.id); }}
               >
                  x
               </span>
            </a>
         ))}
      </div>
   );
}