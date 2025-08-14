import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { AuthProvider } from './context/AuthContext';
import { auth } from './firebase';

// Asegurar que Firebase esté inicializado
console.log('Iniciando aplicación...', auth ? 'Firebase OK' : 'Firebase no inicializado');

const root = document.getElementById('root');
if (!root) {
  console.error('No se encontró el elemento root');
} else {
  console.log('Elemento root encontrado, montando aplicación...');
  ReactDOM.createRoot(root).render(
    <React.StrictMode>
      <AuthProvider>
        <App />
      </AuthProvider>
    </React.StrictMode>
  );
  console.log('Aplicación montada');
}
