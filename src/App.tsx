import React, { useState, useEffect } from 'react';
import { useAuthContext } from './contexts/AuthContext';

import Login from './components/Login';
import DashboardTab from './components/DashboardTab';
import ExpensesTab from './components/ExpensesTab';
import RoutesTab from './components/RoutesTab';
import StatsTab from './components/StatsTab';
import NotificationSettings from './components/NotificationSettings';
import { entryService, vehicleService, goalService, expenseService, statsService } from './services/firestore';

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
    <div style={{ padding: 16, fontFamily: 'ui-sans-serif, system-ui' }}>
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
        <h1 style={{ margin: 0 }}>Ubran</h1>
        <nav style={{ display: 'flex', gap: 8 }}>
          <button className={`btn ${tab === 'dashboard' ? 'pill--active' : ''}`} onClick={() => setTab('dashboard')}>Dashboard</button>
          <button className={`btn ${tab === 'expenses' ? 'pill--active' : ''}`} onClick={() => setTab('expenses')}>Gastos</button>
          <button className={`btn ${tab === 'routes' ? 'pill--active' : ''}`} onClick={() => setTab('routes')}>Rutas</button>
          <button className={`btn ${tab === 'stats' ? 'pill--active' : ''}`} onClick={() => setTab('stats')}>Estadísticas</button>
          <button className={`btn ${tab === 'settings' ? 'pill--active' : ''}`} onClick={() => setTab('settings')}>Ajustes</button>
        </nav>
      </header>

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
  );
}