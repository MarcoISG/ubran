import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { AuthProvider } from './contexts/AuthContext';

// Asegurar que la app se monta correctamente
console.log('Iniciando aplicación...');

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
