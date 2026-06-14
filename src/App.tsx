import { useState, useEffect } from 'react';
import { Sidebar } from './components/layout/Sidebar';
import DramaManagement from './pages/DramaManagement';
import PartBinding from './pages/PartBinding';
import JointConstraints from './pages/JointConstraints';
import ActionTimeline from './pages/ActionTimeline';
import ActionLibrary from './pages/ActionLibrary';
import { useAppStore } from './store/useAppStore';
import { cn } from './lib/utils';

function App() {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const currentPage = useAppStore(state => state.currentPage);
  const currentDramaId = useAppStore(state => state.currentDramaId);
  const dramas = useAppStore(state => state.dramas);
  const setCurrentDrama = useAppStore(state => state.setCurrentDrama);

  useEffect(() => {
    if (currentPage !== 'drama' && !currentDramaId && dramas.length > 0) {
      setCurrentDrama(dramas[0].id);
    }
  }, [currentPage, currentDramaId, dramas, setCurrentDrama]);

  const renderPage = () => {
    switch (currentPage) {
      case 'drama':
        return <DramaManagement />;
      case 'binding':
        return <PartBinding />;
      case 'constraints':
        return <JointConstraints />;
      case 'timeline':
        return <ActionTimeline />;
      case 'library':
        return <ActionLibrary />;
      default:
        return <DramaManagement />;
    }
  };

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-parchment-50 font-body">
      <Sidebar 
        collapsed={sidebarCollapsed} 
        onToggle={() => setSidebarCollapsed(!sidebarCollapsed)} 
      />
      
      <main className={cn(
        "flex-1 flex flex-col overflow-hidden transition-all duration-300",
      )}>
        <div className="flex-1 overflow-hidden">
          {renderPage()}
        </div>
      </main>
    </div>
  );
}

export default App;
