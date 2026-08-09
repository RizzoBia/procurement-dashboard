import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { LogIn } from 'lucide-react';
import './Login.css';

export default function Login() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      // O Supabase exige um formato de e-mail por padrão. 
      // Adicionamos um domínio fictício escondido para permitir login só com o "nome"
      const formattedEmail = `${username.trim().toLowerCase()}@procurement.local`;
      const { error } = await login(formattedEmail, password);
      
      if (error) {
        setError('Usuário ou senha incorretos.');
      } else {
        navigate('/executive');
      }
    } catch (err) {
      setError('Ocorreu um erro ao tentar fazer login.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="login-container">
      <div className="login-glass-panel">
        <div className="login-header">
          <img src="/viridis-logo.png" alt="Viridis Logo" className="login-logo" />
          <h1 className="login-title">Acesso Restrito</h1>
          <p className="login-subtitle">Dashboard de Procurement</p>
        </div>

        {error && <div className="error-message">{error}</div>}

        <form className="login-form" onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="username">Usuário</label>
            <input
              type="text"
              id="username"
              placeholder="Ex: admin ou michel.bernardes"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
            />
          </div>
          
          <div className="form-group">
            <label htmlFor="password">Senha</label>
            <input
              type="password"
              id="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          <button 
            type="submit" 
            className="login-button" 
            disabled={isLoading || !username || !password}
          >
            {isLoading ? 'Entrando...' : (
              <>
                Entrar <LogIn size={18} style={{ marginLeft: '8px' }} />
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
