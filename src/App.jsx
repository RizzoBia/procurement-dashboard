import { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout';
import ExecutiveDashboard from './pages/ExecutiveDashboard';
import GestaoSLA from './pages/GestaoSLA';
import Saving from './pages/Saving';
import Performance from './pages/Performance';
import Financeiro from './pages/Financeiro';
import Operacional from './pages/Operacional';
import Analytics from './pages/Analytics';
import AdminUpload from './pages/AdminUpload';
import { DataProvider } from './context/DataContext';

function App() {
  const [theme, setTheme] = useState('dark');
  
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prev => prev === 'dark' ? 'light' : 'dark');
  };

  return (
    <DataProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Layout theme={theme} toggleTheme={toggleTheme} />}>
            <Route index element={<Navigate to="/executive" replace />} />
            <Route path="executive" element={<ExecutiveDashboard />} />
            <Route path="sla" element={<GestaoSLA />} />
            <Route path="saving" element={<Saving />} />
            <Route path="performance" element={<Performance />} />
            <Route path="financeiro" element={<Financeiro />} />
            <Route path="operacional" element={<Operacional />} />
            <Route path="analytics" element={<Analytics />} />
            <Route path="admin-upload" element={<AdminUpload />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </DataProvider>
  );
}

export default App;
