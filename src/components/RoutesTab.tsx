import React, { useState, useEffect } from 'react';
import { GoogleMap, LoadScript, Marker } from '@react-google-maps/api';
import { MapPin, PlusCircle, Trash2 } from 'lucide-react';
import { format } from 'date-fns';
import { routeService } from '../services/firestore';
import type { Route } from '../types/models';
import { useAuthContext } from '../contexts/AuthContext';

const GOOGLE_MAPS_API_KEY = 'TU_API_KEY_AQUI'; // Reemplazar con tu API key

const mapContainerStyle = {
  width: '100%',
  height: '400px',
  borderRadius: '12px'
};

const defaultCenter = {
  lat: -33.4369436, // Santiago, Chile
  lng: -70.6482700
};

export default function RoutesTab() {
  const { user } = useAuthContext();
  const [routes, setRoutes] = useState<Route[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedRoute, setSelectedRoute] = useState<Route | null>(null);

  useEffect(() => {
    if (user) {
      loadRoutes();
    }
  }, [user]);

  const loadRoutes = async () => {
    if (!user) return;
    try {
      const data = await routeService.getAll(user.uid);
      setRoutes(data);
    } catch (error) {
      console.error('Error loading routes:', error);
    } finally {
      setLoading(false);
    }
  };

  const addRoute = async () => {
    if (!user) return;
    try {
      const now = new Date();
      const route: Omit<Route, 'id' | 'userId' | 'createdAt' | 'updatedAt'> = {
        date: format(now, 'yyyy-MM-dd'),
        startLocation: defaultCenter,
        endLocation: defaultCenter,
        earnings: 0,
        distance: 0,
        duration: 0,
        timeOfDay: format(now, 'HH:mm'),
        rating: 5
      };
      await routeService.create(user.uid, route);
      loadRoutes();
    } catch (error) {
      console.error('Error adding route:', error);
    }
  };

  const updateRoute = async (id: string, data: Partial<Route>) => {
    try {
      await routeService.update(id, data);
      loadRoutes();
    } catch (error) {
      console.error('Error updating route:', error);
    }
  };

  const deleteRoute = async (id: string) => {
    if (!confirm('¿Eliminar esta ruta?')) return;
    try {
      await routeService.delete(id);
      loadRoutes();
    } catch (error) {
      console.error('Error deleting route:', error);
    }
  };

  if (loading) {
    return <div>Cargando rutas...</div>;
  }

  return (
    <div className="card">
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
        <h3 style={{margin:0}}>Rutas</h3>
        <button className="btn" onClick={addRoute}>
          <PlusCircle size={16}/> Nueva ruta
        </button>
      </div>

      <LoadScript googleMapsApiKey={GOOGLE_MAPS_API_KEY}>
        <div style={{marginTop:12}}>
          <GoogleMap
            mapContainerStyle={mapContainerStyle}
            center={defaultCenter}
            zoom={12}
          >
            {routes.map(route => (
              <React.Fragment key={route.id}>
                <Marker
                  position={route.startLocation}
                  onClick={() => setSelectedRoute(route)}
                  icon={{
                    url: 'data:image/svg+xml;utf8,' + encodeURIComponent(`
                      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <circle cx="12" cy="12" r="8" fill="#10b981"/>
                        <circle cx="12" cy="12" r="4" fill="white"/>
                      </svg>
                    `)
                  }}
                />
                <Marker
                  position={route.endLocation}
                  onClick={() => setSelectedRoute(route)}
                  icon={{
                    url: 'data:image/svg+xml;utf8,' + encodeURIComponent(`
                      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <circle cx="12" cy="12" r="8" fill="#ef4444"/>
                        <circle cx="12" cy="12" r="4" fill="white"/>
                      </svg>
                    `)
                  }}
                />
              </React.Fragment>
            ))}
          </GoogleMap>
        </div>
      </LoadScript>

      <div style={{display:"grid",gap:12,marginTop:12}}>
        {routes.map(route => (
          <div key={route.id} className="card card--soft">
            <div style={{display:"grid",gridTemplateColumns:"1fr auto",gap:8,alignItems:"center"}}>
              <div style={{display:"flex",alignItems:"center",gap:8}}>
                <MapPin size={16}/>
                <span style={{fontWeight:500}}>
                  {format(new Date(route.date), 'dd/MM/yyyy')} - {route.timeOfDay}
                </span>
              </div>
              <button className="btn" onClick={() => deleteRoute(route.id)}><Trash2 size={16}/></button>
            </div>

            <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit, minmax(200px, 1fr))",gap:12,marginTop:8}}>
              <div>
                <label>Fecha</label>
                <input
                  type="date"
                  value={route.date}
                  onChange={e => updateRoute(route.id, { date: e.target.value })}
                />
              </div>

              <div>
                <label>Hora</label>
                <input
                  type="time"
                  value={route.timeOfDay}
                  onChange={e => updateRoute(route.id, { timeOfDay: e.target.value })}
                />
              </div>

              <div>
                <label>Distancia (km)</label>
                <input
                  type="number"
                  value={route.distance}
                  onChange={e => updateRoute(route.id, { distance: Number(e.target.value) })}
                />
              </div>

              <div>
                <label>Duración (min)</label>
                <input
                  type="number"
                  value={route.duration}
                  onChange={e => updateRoute(route.id, { duration: Number(e.target.value) })}
                />
              </div>

              <div>
                <label>Ganancias (CLP)</label>
                <input
                  type="number"
                  value={route.earnings}
                  onChange={e => updateRoute(route.id, { earnings: Number(e.target.value) })}
                />
              </div>

              <div>
                <label>Calificación</label>
                <select
                  value={route.rating}
                  onChange={e => updateRoute(route.id, { rating: Number(e.target.value) })}
                >
                  {[1,2,3,4,5].map(n => (
                    <option key={n} value={n}>{n} estrellas</option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        ))}

        {routes.length === 0 && (
          <div style={{textAlign:"center",color:"var(--color-muted)",padding:20}}>
            No hay rutas registradas
          </div>
        )}
      </div>
    </div>
  );
}
