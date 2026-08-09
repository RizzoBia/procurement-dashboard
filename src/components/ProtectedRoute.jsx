import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function ProtectedRoute() {
  const { user } = useAuth();

  if (!user) {
    // Redireciona para o login se não estiver autenticado
    return <Navigate to="/login" replace />;
  }

  // Renderiza as rotas filhas se estiver logado
  return <Outlet />;
}
