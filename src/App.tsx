import React, { useState, useEffect } from 'react';
import { useAuthContext } from './contexts/AuthContext';

import Login from './components/Login';
import DashboardTab from './components/DashboardTab';
import ExpensesTab from './components/ExpensesTab';
import RoutesTab from './components/RoutesTab';
import StatsTab from './components/StatsTab';
import NotificationSettings from './components/NotificationSettings';
import NetworkStatus from './components/NetworkStatus';
import FirebaseDiagnostic from './components/FirebaseDiagnostic';
import { entryService, vehicleService, goalService, expenseService, statsService } from './services/firestore';
import { Home, Wallet, Route as RouteIcon, BarChart3, Settings as SettingsIcon } from 'lucide-react';

// Tipos mínimos para manejar estado local de gastos
type Expense = {
  id: string;
  date: string;
  amount: number;
  category: string;
  description: string;
};

export default function App() {
  const { user, loading } = useAuthContext();
  const [tab, setTab] = useState<'dashboard' | 'expenses' | 'routes' | 'stats' | 'settings'>('dashboard');

  // Estado derivado de Firestore
  const [entries, setEntries] = useState<any[]>([]);
  const [vehicles, setVehicles] = useState<any[]>([]);
  const [goals, setGoals] = useState<any[]>([]);
  const [fixed, setFixed] = useState<any[]>([]); // gastos fijos/expenses
  const [totals, setTotals] = useState<any>({});

  useEffect(() => {
    if (!user) return;
    let mounted = true;
    let timeoutId: NodeJS.Timeout;

    // Función optimizada para calcular totales
    const calculateTotals = (entries: any[]) => {
      let totalKm = 0, totalLiters = 0, totalHours = 0, totalTrips = 0;
      let grossIncome = 0, fuelCosts = 0;
      
      for (const entry of entries) {
        const km = (entry.odometerEnd ?? 0) - (entry.odometerStart ?? 0);
        if (km > 0) totalKm += km;
        totalLiters += entry.liters ?? 0;
        totalHours += entry.hours ?? 0;
        totalTrips += entry.trips ?? 0;
        grossIncome += entry.gross ?? 0;
        fuelCosts += entry.fuelCLP ?? 0;
      }
      
      return {
        avgKmPerL: totalLiters > 0 ? totalKm / totalLiters : undefined,
        totalHours,
        totalTrips,
        grossIncome,
        netIncome: grossIncome - fuelCosts
      };
    };

    const loadAll = async () => {
      try {
        // Cargar datos básicos primero
        const [e, v, g, ex] = await Promise.all([
          entryService.getAll(user.uid),
          vehicleService.getAll(user.uid),
          goalService.getAll(user.uid),
          expenseService.getAll(user.uid)
        ]);
        
        if (!mounted) return;
        
        // Actualizar estado inmediatamente para mostrar datos
        setEntries(e);
        setVehicles(v);
        setGoals(g);
        setFixed(ex);

        setTotals(calculateTotals(e));

        // Actualizar estadísticas en background (no bloquear UI)
        setTimeout(async () => {
          if (!mounted) return;
          try {
            const now = new Date();
            const period = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
            const monthEntries = e.filter((it: any) => 
              typeof it.date === 'string' && it.date.slice(0, 7) === period
            );

            if (monthEntries.length > 0) {
              const monthlyTotals = calculateTotals(monthEntries);
              await statsService.upsertMonthly(user.uid, period, {
                totalTrips: monthlyTotals.totalTrips,
                totalHours: monthlyTotals.totalHours,
                grossIncome: monthlyTotals.grossIncome,
                netIncome: monthlyTotals.netIncome,
                fuelCosts: monthlyTotals.grossIncome - monthlyTotals.netIncome,
                avgKmPerL: monthlyTotals.avgKmPerL || 0,
                totalKm: monthEntries.reduce((sum, it) => {
                  const km = (it.odometerEnd ?? 0) - (it.odometerStart ?? 0);
                  return sum + (km > 0 ? km : 0);
                }, 0),
              });
            }
          } catch (statsErr) {
            console.warn('Error actualizando estadísticas mensuales (no crítico):', statsErr);
          }
        }, 100); // Delay mínimo para no bloquear UI
      } catch (err) {
        console.error('Error cargando datos:', err);
        if (!mounted) return;
        
        // Establecer estados vacíos para evitar problemas de carga
        setEntries([]);
        setVehicles([]);
        setGoals([]);
        setFixed([]);
        setTotals({
          avgKmPerL: undefined,
          totalHours: 0,
          totalTrips: 0,
          grossIncome: 0,
          netIncome: 0
        });
      }
    };

    // Ejecutar carga con timeout para evitar bloqueos
    timeoutId = setTimeout(() => {
      if (mounted) loadAll();
    }, 50);

    return () => {
      mounted = false;
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, [user]);

  const onAddExpense = async (expense: Omit<Expense, 'id'>) => {
    if (!user) return;
    try {
      const created = await expenseService.create(user.uid, {
        name: expense.description,
        amountCLP: expense.amount,
        paidCLP: 0,
        userId: user.uid
      } as any);
      // Mantener estado local sincronizado
      setFixed(prev => [created, ...prev]);
    } catch (error) {
      console.error('Error creando gasto:', error);
    }
  };

  const onDeleteExpense = async (id: string) => {
    try {
      await expenseService.delete(id);
      setFixed(prev => prev.filter(e => e.id !== id));
    } catch (error) {
      console.error('Error eliminando gasto:', error);
    }
  };

  if (loading) {
    return <div style={{padding: 20}}>Cargando...</div>;
  }

  if (!user) {
    return <Login />;
  }

  return (
    <div className="app-shell mobile-only" style={{ padding: '0 0 16px 0', fontFamily: 'ui-sans-serif, system-ui', minHeight: '100vh' }}>

      <div style={{ padding: '16px 16px 0 16px' }}>
        {tab === 'dashboard' && (
          <DashboardTab entries={entries} totals={totals} vehicles={vehicles} goals={goals} fixed={fixed} />
        )}

        {tab === 'expenses' && (
          <ExpensesTab 
            expenses={fixed.map((f: any) => ({
              id: f.id,
              date: new Date().toISOString().split('T')[0],
              amount: f.amountCLP ?? 0,
              category: 'Otros',
              description: f.name ?? 'Gasto'
            }))}
            onAddExpense={onAddExpense}
            onDeleteExpense={onDeleteExpense}
          />
        )}

        {tab === 'routes' && <RoutesTab />}

        {tab === 'stats' && <StatsTab />}

        {tab === 'settings' && (
          <div className="card" style={{ padding: 12 }}>
            <h3 style={{ marginTop: 0 }}>Ajustes</h3>
            <NotificationSettings />
          </div>
        )}
      </div>

      {/* Bottom navigation (mobile) */}
      <div className="bottom-nav" role="navigation" aria-label="Navegación inferior">
        <div className="bottom-nav__inner">
          <button className={tab === 'dashboard' ? 'active' : ''} onClick={() => setTab('dashboard')} aria-label="Inicio">
            <Home size={22} />
            <span>Inicio</span>
          </button>
          <button className={tab === 'expenses' ? 'active' : ''} onClick={() => setTab('expenses')} aria-label="Gastos">
            <Wallet size={22} />
            <span>Gastos</span>
          </button>
          <button className={tab === 'routes' ? 'active' : ''} onClick={() => setTab('routes')} aria-label="Rutas">
            <RouteIcon size={22} />
            <span>Rutas</span>
          </button>
          <button className={tab === 'stats' ? 'active' : ''} onClick={() => setTab('stats')} aria-label="Estadísticas">
            <BarChart3 size={22} />
            <span>Stats</span>
          </button>
          <button className={tab === 'settings' ? 'active' : ''} onClick={() => setTab('settings')} aria-label="Ajustes">
            <SettingsIcon size={22} />
            <span>Ajustes</span>
          </button>
        </div>
      </div>
      
      {/* Indicador de estado de red */}
      <NetworkStatus />
      
      {/* Diagnóstico de Firebase */}
      <FirebaseDiagnostic />
    </div>
  );
}