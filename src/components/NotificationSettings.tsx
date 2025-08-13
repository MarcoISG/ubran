import React from 'react';
import { Bell } from 'lucide-react';
import { useNotifications } from '../hooks/useNotifications';

export default function NotificationSettings() {
  const {
    supported,
    permission,
    subscription,
    requestPermission,
    subscribe,
    unsubscribe
  } = useNotifications();

  if (!supported) {
    return (
      <div className="card card--soft">
        <div style={{display:"flex",alignItems:"center",gap:8,color:"var(--color-muted)"}}>
          <Bell size={16}/>
          <span>Tu navegador no soporta notificaciones</span>
        </div>
      </div>
    );
  }

  const handleEnable = async () => {
    const granted = await requestPermission();
    if (granted) {
      await subscribe();
    }
  };

  return (
    <div className="card card--soft">
      <div style={{display:"flex",alignItems:"center",gap:8}}>
        <Bell size={16}/>
        <span>Notificaciones</span>
      </div>

      <div style={{marginTop:12}}>
        {permission === 'default' && (
          <button className="btn" onClick={handleEnable}>
            Activar notificaciones
          </button>
        )}

        {permission === 'denied' && (
          <div style={{color:"var(--color-muted)",fontSize:14}}>
            Notificaciones bloqueadas. Habilítalas en la configuración de tu navegador.
          </div>
        )}

        {permission === 'granted' && (
          <>
            {subscription ? (
              <div style={{display:"flex",alignItems:"center",gap:12}}>
                <span style={{color:"var(--color-muted)",fontSize:14}}>
                  Notificaciones activadas
                </span>
                <button className="btn btn--ghost" onClick={unsubscribe}>
                  Desactivar
                </button>
              </div>
            ) : (
              <button className="btn" onClick={subscribe}>
                Reactivar notificaciones
              </button>
            )}
          </>
        )}
      </div>
    </div>
  );
}
