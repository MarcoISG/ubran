import React, { useState } from 'react';
import { useAuthContext } from '../contexts/AuthContext';

export default function Login() {
  const [isLogin, setIsLogin] = useState(true);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const { login, signup } = useAuthContext();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    try {
      if (isLogin) {
        await login(email, password);
      } else {
        await signup(email, password, name);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error en la autenticación');
    }
  };

  return (
    <div style={{maxWidth:540, margin:"40px auto", fontFamily:"ui-sans-serif"}}>
      <h1 style={{display:"flex",alignItems:"center",gap:10}}>
        <span style={{width:28,height:28,display:"grid",placeItems:"center",borderRadius:6,background:"#0f172a",color:"#10b981",fontWeight:900}}>U</span>
        Ubran
      </h1>
      <div className="card">
        <h3 style={{marginTop:0}}>{isLogin ? 'Iniciar sesión' : 'Crear cuenta'}</h3>
        
        {error && (
          <div style={{color:"#ef4444",marginBottom:12,fontSize:14}}>{error}</div>
        )}

        <form onSubmit={handleSubmit}>
          {!isLogin && (
            <div style={{marginBottom:12}}>
              <label style={{color:"#6b7280",fontSize:12}}>Nombre</label>
              <input
                type="text"
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder="Tu nombre"
                required
              />
            </div>
          )}
          
          <div style={{marginBottom:12}}>
            <label style={{color:"#6b7280",fontSize:12}}>Email</label>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="tucorreo@ejemplo.com"
              required
            />
          </div>
          
          <div style={{marginBottom:16}}>
            <label style={{color:"#6b7280",fontSize:12}}>Contraseña</label>
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="********"
              required
            />
          </div>

          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
            <button
              type="button"
              onClick={() => setIsLogin(!isLogin)}
              style={{color:"#6b7280",fontSize:14,textDecoration:"underline",background:"none",border:"none",cursor:"pointer"}}
            >
              {isLogin ? '¿No tienes cuenta? Regístrate' : '¿Ya tienes cuenta? Inicia sesión'}
            </button>
            
            <button
              type="submit"
              className="btn btn--accent"
            >
              {isLogin ? 'Entrar' : 'Crear cuenta'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
