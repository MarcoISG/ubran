import React, { useState, useEffect } from 'react';
import { useAuthContext } from './contexts/AuthContext';

import Login from './components/Login';
import DashboardTab from './components/DashboardTab';
import ExpensesTab from './components/ExpensesTab';
import RoutesTab from './components/RoutesTab';
import StatsTab from './components/StatsTab';
import NotificationSettings from './components/NotificationSettings';
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

    const loadAll = async () => {
      try {
        const [e, v, g, ex] = await Promise.all([
          entryService.getAll(user.uid),
          vehicleService.getAll(user.uid),
          goalService.getAll(user.uid),
          expenseService.getAll(user.uid)
        ]);
        if (!mounted) return;
        setEntries(e);
        setVehicles(v);
        setGoals(g);
        setFixed(ex);

        // Calcular totales mínimos para Dashboard (ej: rendimiento promedio km/L)
        const totalKm = e.reduce((sum: number, it: any) => {
          const km = (it.odometerEnd ?? 0) - (it.odometerStart ?? 0);
          return sum + (km > 0 ? km : 0);
        }, 0);
        const totalLiters = e.reduce((sum: number, it: any) => sum + (it.liters ?? 0), 0);
        const avgKmPerL = totalLiters > 0 ? totalKm / totalLiters : undefined;

        // Métricas básicas adicionales
        const totalHours = e.reduce((sum: number, it: any) => sum + (it.hours ?? 0), 0);
        const totalTrips = e.reduce((sum: number, it: any) => sum + (it.trips ?? 0), 0);
        const grossIncome = e.reduce((sum: number, it: any) => sum + (it.gross ?? 0), 0);
        const fuelCosts = e.reduce((sum: number, it: any) => sum + (it.fuelCLP ?? 0), 0);
        const netIncome = grossIncome - fuelCosts;

        setTotals({ avgKmPerL, totalHours, totalTrips, grossIncome, netIncome });

        // Persistir estadísticas mensuales actuales para StatsTab
        try {
          const now = new Date();
          const period = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`; // YYYY-MM
          const monthEntries = e.filter((it: any) => typeof it.date === 'string' && it.date.slice(0, 7) === period);

          const mTotalHours = monthEntries.reduce((sum: number, it: any) => sum + (it.hours ?? 0), 0);
          const mTotalTrips = monthEntries.reduce((sum: number, it: any) => sum + (it.trips ?? 0), 0);
          const mGrossIncome = monthEntries.reduce((sum: number, it: any) => sum + (it.gross ?? 0), 0);
          const mFuelCosts = monthEntries.reduce((sum: number, it: any) => sum + (it.fuelCLP ?? 0), 0);
          const mTotalKm = monthEntries.reduce((sum: number, it: any) => {
            const km = (it.odometerEnd ?? 0) - (it.odometerStart ?? 0);
            return sum + (km > 0 ? km : 0);
          }, 0);
          const mTotalLiters = monthEntries.reduce((sum: number, it: any) => sum + (it.liters ?? 0), 0);
          const mAvgKmPerL = mTotalLiters > 0 ? mTotalKm / mTotalLiters : 0;
          const mNetIncome = mGrossIncome - mFuelCosts;

          await statsService.upsertMonthly(user.uid, period, {
            totalTrips: mTotalTrips,
            totalHours: mTotalHours,
            grossIncome: mGrossIncome,
            netIncome: mNetIncome,
            fuelCosts: mFuelCosts,
            avgKmPerL: mAvgKmPerL,
            totalKm: mTotalKm,
          });
        } catch (statsErr) {
          console.error('Error actualizando estadísticas mensuales:', statsErr);
        }
      } catch (err) {
        console.error('Error cargando datos:', err);
        // En caso de error, mostrar datos de ejemplo para que la interfaz no esté vacía
        if (!mounted) return;
        
        // Datos demo temporales mientras se soluciona el acceso a Firebase
        const demoEntries = [
          {
            id: 'demo1',
            userId: user.uid,
            date: '2024-01-15',
            hours: 8.5,
            trips: 12,
            gross: 92000,
            cash: 5000,
            fuelCLP: 15000,
            odometerStart: 125000,
            odometerEnd: 125120,
            liters: 8.5,
            zone: 'Centro'
          },
          {
            id: 'demo2', 
            userId: user.uid,
            date: '2024-01-14',
            hours: 7.0,
            trips: 9,
            gross: 78000,
            cash: 3500,
            fuelCLP: 12000,
            odometerStart: 124850,
            odometerEnd: 125000,
            liters: 7.2,
            zone: 'Providencia'
          }
        ];
        
        const demoGoals = [
          {
            id: 'goal1',
            userId: user.uid,
            name: 'Comprar TV',
            targetCLP: 300000,
            savedCLP: 120000,
            deadline: '2024-03-31'
          }
        ];
        
        const demoFixed = [
          {
            id: 'expense1',
            userId: user.uid,
            name: 'Combustible',
            amountCLP: 30000,
            paidCLP: 8000
          }
        ];
        
        setEntries(demoEntries);
        setGoals(demoGoals);
        setFixed(demoFixed);
        setVehicles([]);
        
        // Calcular totales con datos demo
        const totalKm = demoEntries.reduce((sum: number, it: any) => {
          const km = (it.odometerEnd ?? 0) - (it.odometerStart ?? 0);
          return sum + (km > 0 ? km : 0);
        }, 0);
        const totalLiters = demoEntries.reduce((sum: number, it: any) => sum + (it.liters ?? 0), 0);
        const avgKmPerL = totalLiters > 0 ? totalKm / totalLiters : undefined;
        const totalHours = demoEntries.reduce((sum: number, it: any) => sum + (it.hours ?? 0), 0);
        const totalTrips = demoEntries.reduce((sum: number, it: any) => sum + (it.trips ?? 0), 0);
        const grossIncome = demoEntries.reduce((sum: number, it: any) => sum + (it.gross ?? 0), 0);
        const fuelCosts = demoEntries.reduce((sum: number, it: any) => sum + (it.fuelCLP ?? 0), 0);
        const netIncome = grossIncome - fuelCosts;
        
        setTotals({ avgKmPerL, totalHours, totalTrips, grossIncome, netIncome });
      }
    };

    loadAll();
    return () => { mounted = false; };
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
    </div>
  );
}