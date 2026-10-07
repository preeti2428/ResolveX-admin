import React from 'react';
import {
  LayoutDashboard,
  FileText,
  Megaphone,
  User
} from 'lucide-react';

export default function Sidebar({ activeTab, setActiveTab }) {
  const navItems = [
    { name: 'Dashboard', icon: LayoutDashboard },
    { name: 'Grievances', icon: FileText },
    { name: 'Announcements', icon: Megaphone },
    { name: 'My Profile', icon: User },
  ];

  return (
    <aside className="w-64 flex-shrink-0 hidden md:flex flex-col border-r border-slate-200/60 bg-transparent py-8 px-4">
      <nav className="flex-1 space-y-2.5">
        {navItems.map((item) => {
          const isActive = activeTab === item.name;
          return (
            <button
              key={item.name}
              onClick={() => setActiveTab(item.name)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-colors ${
                isActive
                  ? 'bg-[#EAE4D9] text-slate-800 shadow-sm'
                  : 'text-slate-500 hover:bg-black/5 hover:text-slate-800'
              }`}
            >
              <item.icon size={18} className={isActive ? 'text-slate-700' : 'text-slate-400'} />
              {item.name}
            </button>
          );
        })}
      </nav>
    </aside>
  );
}
