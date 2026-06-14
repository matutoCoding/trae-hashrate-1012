import React from 'react';
import { 
  Theater, 
  Link2, 
  Lock, 
  Clock, 
  Library,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import { useAppStore } from '../../store/useAppStore';
import { cn } from '../../lib/utils';

interface SidebarProps {
  collapsed: boolean;
  onToggle: () => void;
}

const navItems = [
  { id: 'drama', icon: Theater, label: '剧目管理' },
  { id: 'binding', icon: Link2, label: '部件绑定' },
  { id: 'constraints', icon: Lock, label: '关节约束' },
  { id: 'timeline', icon: Clock, label: '动作编排' },
  { id: 'library', icon: Library, label: '动作库' },
] as const;

export const Sidebar: React.FC<SidebarProps> = ({ collapsed, onToggle }) => {
  const currentPage = useAppStore(state => state.currentPage);
  const setCurrentPage = useAppStore(state => state.setCurrentPage);
  const currentDrama = useAppStore(state => state.getCurrentDrama());

  return (
    <aside 
      className={cn(
        "h-screen bg-gradient-to-b from-ink-700 to-ink-800 border-r border-ink-600 flex flex-col transition-all duration-300",
        collapsed ? "w-16" : "w-56"
      )}
    >
      <div className={cn(
        "h-16 flex items-center border-b border-ink-600 px-4",
        collapsed ? "justify-center" : "justify-between"
      )}>
        {!collapsed && (
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-crimson-400 to-crimson-600 flex items-center justify-center">
              <Theater className="w-5 h-5 text-parchment-100" />
            </div>
            <span className="font-display text-lg text-parchment-100 font-bold">影之艺</span>
          </div>
        )}
        {collapsed && (
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-crimson-400 to-crimson-600 flex items-center justify-center">
            <Theater className="w-5 h-5 text-parchment-100" />
          </div>
        )}
        <button
          onClick={onToggle}
          className={cn(
            "p-1.5 rounded-lg hover:bg-ink-600 text-parchment-300 hover:text-parchment-100 transition-colors",
            collapsed && "hidden"
          )}
        >
          <ChevronLeft className="w-4 h-4" />
        </button>
      </div>

      {!collapsed && currentDrama && (
        <div className="px-4 py-3 border-b border-ink-600">
          <p className="text-xs text-parchment-400 mb-1">当前剧目</p>
          <p className="font-display text-sm text-parchment-100 truncate">{currentDrama.name}</p>
        </div>
      )}

      {collapsed && (
        <button
          onClick={onToggle}
          className="p-2 mx-auto mt-2 rounded-lg hover:bg-ink-600 text-parchment-300 hover:text-parchment-100 transition-colors"
        >
          <ChevronRight className="w-4 h-4" />
        </button>
      )}

      <nav className="flex-1 py-4 px-2">
        <ul className="space-y-1">
          {navItems.map(item => {
            const Icon = item.icon;
            const isActive = currentPage === item.id;
            
            return (
              <li key={item.id}>
                <button
                  onClick={() => setCurrentPage(item.id)}
                  className={cn(
                    "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200",
                    collapsed && "justify-center px-0",
                    isActive 
                      ? "bg-crimson-500/20 text-crimson-300 shadow-inner" 
                      : "text-parchment-300 hover:bg-ink-600/50 hover:text-parchment-100"
                  )}
                >
                  <Icon className={cn(
                    "w-5 h-5 flex-shrink-0",
                    isActive && "text-crimson-400"
                  )} />
                  {!collapsed && (
                    <span className="text-sm font-medium">{item.label}</span>
                  )}
                  {isActive && !collapsed && (
                    <div className="ml-auto w-1.5 h-1.5 rounded-full bg-crimson-400" />
                  )}
                </button>
              </li>
            );
          })}
        </ul>
      </nav>

      {!collapsed && (
        <div className="p-4 border-t border-ink-600">
          <div className="bg-ink-800/50 rounded-lg p-3">
            <p className="text-xs text-parchment-400 mb-2">快捷操作</p>
            <div className="flex flex-wrap gap-2">
              <span className="px-2 py-1 text-xs bg-ink-700 text-parchment-300 rounded">
                皮影戏
              </span>
              <span className="px-2 py-1 text-xs bg-ink-700 text-parchment-300 rounded">
                数字非遗
              </span>
            </div>
          </div>
        </div>
      )}
    </aside>
  );
};
