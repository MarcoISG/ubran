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
    <div style={{minHeight:'100dvh', padding:'24px 16px calc(24px + env(safe-area-inset-bottom))', display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', gap:16, fontFamily:'ui-sans-serif'}}>
      <div style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:8, marginBottom:12 }}>
        <div style={{width:64,height:64,display:'grid',placeItems:'center',borderRadius:12,background:'#0f172a',color:'#10b981',fontWeight:900,fontSize:28}}>U</div>
        <h1 style={{ margin:0 }}>Ubran</h1>
      </div>
      <div className="card" style={{ width:'100%', maxWidth:420, padding:16 }}>
        <h3 style={{marginTop:0}}>{isLogin ? 'Iniciar sesión' : 'Crear cuenta'}</h3>
        
        {error && (
          <div style={{color:"#ef4444",marginBottom:12,fontSize:14}}>{error}</div>
        )}

        <div style={{marginBottom:16,padding:12,background:'#0f172a',borderRadius:8,fontSize:13}}>
          <strong>Cuenta de prueba:</strong><br/>
          Email: demo@ubran.com<br/>
          Contraseña: demo123456
        </div>
        
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
              placeholder="demo@ubran.com"
              required
            />
          </div>
          
          <div style={{marginBottom:16}}>
            <label style={{color:"#6b7280",fontSize:12}}>Contraseña</label>
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="demo123456"
              required
            />
          </div>

          <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',gap:8}}>
            <button
              type="button"
              onClick={() => setIsLogin(!isLogin)}
              style={{color:'#6b7280',fontSize:14,textDecoration:'underline',background:'none',border:'none',cursor:'pointer'}}
            >
              {isLogin ? '¿No tienes cuenta? Regístrate' : '¿Ya tienes cuenta? Inicia sesión'}
            </button>
            
            <button
              type="submit"
              className="btn btn--accent"
              style={{ padding:'10px 16px' }}
            >
              {isLogin ? 'Entrar' : 'Crear cuenta'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
