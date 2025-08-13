import React, { useState, useEffect } from 'react';
import { Wrench, AlertTriangle, PlusCircle, Trash2 } from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { maintenanceService } from '../services/firestore';
import type { Maintenance } from '../types/models';
import { useAuthContext } from '../contexts/AuthContext';

export default function MaintenanceTab({ vehicles }: { vehicles: any[] }) {
  const { user } = useAuthContext();
  const [maintenances, setMaintenances] = useState<Maintenance[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      loadMaintenances();
    }
  }, [user]);

  const loadMaintenances = async () => {
    if (!user) return;
    try {
      const data = await maintenanceService.getAll(user.uid);
      setMaintenances(data);
    } catch (error) {
      console.error('Error loading maintenances:', error);
    } finally {
      setLoading(false);
    }
  };

  const addMaintenance = async () => {
    if (!user || !vehicles.length) return;
    try {
      const now = new Date();
      const maintenance: Omit<Maintenance, 'id' | 'userId' | 'createdAt' | 'updatedAt'> = {
        vehicleId: vehicles[0].id,
        type: 'oil',
        datePerformed: format(now, 'yyyy-MM-dd'),
        nextDueKm: 10000,
        nextDueDate: format(new Date(now.setMonth(now.getMonth() + 3)), 'yyyy-MM-dd'),
        cost: 0,
        notes: '',
        attachments: []
      };
      await maintenanceService.create(user.uid, maintenance);
      loadMaintenances();
    } catch (error) {
      console.error('Error adding maintenance:', error);
    }
  };

  const updateMaintenance = async (id: string, data: Partial<Maintenance>) => {
    try {
      await maintenanceService.update(id, data);
      loadMaintenances();
    } catch (error) {
      console.error('Error updating maintenance:', error);
    }
  };

  const deleteMaintenance = async (id: string) => {
    if (!confirm('¿Eliminar este registro?')) return;
    try {
      await maintenanceService.delete(id);
      loadMaintenances();
    } catch (error) {
      console.error('Error deleting maintenance:', error);
    }
  };

  if (loading) {
    return <div>Cargando mantenimientos...</div>;
  }

  return (
    <div className="card">
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
        <h3 style={{margin:0}}>Mantenimiento</h3>
        <button className="btn" onClick={addMaintenance}>
          <PlusCircle size={16}/> Nuevo registro
        </button>
      </div>

      <div style={{display:"grid",gap:12,marginTop:12}}>
        {maintenances.map(m => {
          const vehicle = vehicles.find(v => v.id === m.vehicleId);
          const nextDue = new Date(m.nextDueDate);
          const isOverdue = nextDue < new Date();
          
          return (
            <div key={m.id} className="card card--soft">
              <div style={{display:"grid",gridTemplateColumns:"1fr auto",gap:8,alignItems:"center"}}>
                <div style={{display:"flex",alignItems:"center",gap:8}}>
                  <Wrench size={16}/>
                  <span style={{fontWeight:500}}>{vehicle?.label || 'Vehículo eliminado'}</span>
                  {isOverdue && (
                    <span className="badge" style={{background:'#fee2e2',color:'#ef4444',borderColor:'#fecaca'}}>
                      <AlertTriangle size={14}/> Vencido
                    </span>
                  )}
                </div>
                <button className="btn" onClick={() => deleteMaintenance(m.id)}><Trash2 size={16}/></button>
              </div>

              <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit, minmax(200px, 1fr))",gap:12,marginTop:8}}>
                <div>
                  <label>Tipo</label>
                  <select
                    value={m.type}
                    onChange={e => updateMaintenance(m.id, { type: e.target.value as Maintenance['type'] })}
                  >
                    <option value="oil">Aceite</option>
                    <option value="tires">Neumáticos</option>
                    <option value="technical">Revisión técnica</option>
                    <option value="other">Otro</option>
                  </select>
                </div>

                <div>
                  <label>Fecha realizado</label>
                  <input
                    type="date"
                    value={m.datePerformed}
                    onChange={e => updateMaintenance(m.id, { datePerformed: e.target.value })}
                  />
                </div>

                <div>
                  <label>Próximo (km)</label>
                  <input
                    type="number"
                    value={m.nextDueKm}
                    onChange={e => updateMaintenance(m.id, { nextDueKm: Number(e.target.value) })}
                  />
                </div>

                <div>
                  <label>Próxima fecha</label>
                  <input
                    type="date"
                    value={m.nextDueDate}
                    onChange={e => updateMaintenance(m.id, { nextDueDate: e.target.value })}
                  />
                </div>

                <div>
                  <label>Costo (CLP)</label>
                  <input
                    type="number"
                    value={m.cost}
                    onChange={e => updateMaintenance(m.id, { cost: Number(e.target.value) })}
                  />
                </div>
              </div>

              <div style={{marginTop:8}}>
                <label>Notas</label>
                <textarea
                  value={m.notes}
                  onChange={e => updateMaintenance(m.id, { notes: e.target.value })}
                  rows={2}
                />
              </div>
            </div>
          );
        })}

        {maintenances.length === 0 && (
          <div style={{textAlign:"center",color:"var(--color-muted)",padding:20}}>
            No hay registros de mantenimiento
          </div>
        )}
      </div>
    </div>
  );
}
