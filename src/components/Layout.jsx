import { useState, useEffect } from 'react';
import { Outlet, NavLink } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Clock, 
  TrendingUp, 
  Users, 
  DollarSign, 
  Settings, 
  BarChart2,
  Moon,
  Sun,
  Maximize,
  Minimize,
  Menu,
  Database
} from 'lucide-react';
import './Layout.css';

const navItems = [
  { path: '/executive', label: 'Visão Geral', icon: <LayoutDashboard size={20} /> },
  { path: '/sla', label: 'Gestão de SLA', icon: <Clock size={20} /> },
  { path: '/saving', label: 'Saving', icon: <TrendingUp size={20} /> },
  { path: '/performance', label: 'Performance', icon: <Users size={20} /> },
  { path: '/financeiro', label: 'Financeiro', icon: <DollarSign size={20} /> },
  { path: '/operacional', label: 'Operacional', icon: <Settings size={20} /> },
  { path: '/analytics', label: 'Analytics', icon: <BarChart2 size={20} /> },
  { path: '/admin-upload', label: 'Base de Dados', icon: <Database size={20} /> },
];

export default function Layout({ theme, toggleTheme }) {
  const [presentationMode, setPresentationMode] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  const togglePresentation = () => setPresentationMode(!presentationMode);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && presentationMode) {
        setPresentationMode(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [presentationMode]);

  return (
    <div 
      className={`app-container ${presentationMode ? 'presentation-mode' : ''}`}
      onDoubleClick={() => {
        if (presentationMode) setPresentationMode(false);
      }}
    >
      
      {/* Sidebar */}
      <aside className={`sidebar ${presentationMode ? 'hidden-print no-print' : ''} ${isSidebarCollapsed ? 'collapsed' : ''}`}>
        <div className="sidebar-header">
          <div className="logo-container" style={{ width: '100%', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
            {isSidebarCollapsed ? (
              <div className="logo-icon" style={{ fontSize: '1.2rem', fontWeight: 'bold' }}>V</div>
            ) : (
              <img src="/viridis-logo.png" alt="Viridis Procurement Logo" style={{ maxWidth: '100%', maxHeight: '45px', objectFit: 'contain' }} />
            )}
          </div>
        </div>
        
        <nav className="sidebar-nav">
          {navItems.map((item) => (
            <NavLink 
              key={item.path} 
              to={item.path} 
              className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
              title={isSidebarCollapsed ? item.label : ''}
            >
              <span className="nav-icon">{item.icon}</span>
              {!isSidebarCollapsed && <span className="nav-label">{item.label}</span>}
            </NavLink>
          ))}
        </nav>
      </aside>

      {/* Main Content */}
      <main className="main-content">
        <header className={`top-header ${presentationMode ? 'hidden-print no-print' : ''}`}>
          <div className="header-left">
            <button className="icon-btn" onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)} title="Alternar Menu">
              <Menu size={20} />
            </button>
          </div>
          <div className="header-actions">
            <button className="icon-btn" onClick={toggleTheme} title="Alternar Tema">
              {theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
            </button>
            <button className="icon-btn" onClick={togglePresentation} title="Modo Apresentação">
              {presentationMode ? <Minimize size={20} /> : <Maximize size={20} />}
            </button>
          </div>
        </header>

        <div className="content-scrollable">
          <Outlet />
        </div>
      </main>

    </div>
  );
}
