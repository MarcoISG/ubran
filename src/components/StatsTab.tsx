import React, { useState, useEffect } from 'react';
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { TrendingUp, Clock, Target, DollarSign } from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { statsService } from '../services/firestore';
import type { Statistics } from '../types/models';
import { useAuthContext } from '../contexts/AuthContext';

export default function StatsTab() {
  const { user } = useAuthContext();
  const [monthlyStats, setMonthlyStats] = useState<Statistics[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      loadStats();
    }
  }, [user]);

  const loadStats = async () => {
    if (!user) return;
    try {
      // Cargar últimos 6 meses
      const months = [];
      for (let i = 0; i < 6; i++) {
        const date = new Date();
        date.setMonth(date.getMonth() - i);
        const period = format(date, 'yyyy-MM');
        const stats = await statsService.getMonthly(user.uid, period);
        if (stats) months.unshift(stats);
      }
      setMonthlyStats(months);
    } catch (error) {
      console.error('Error loading stats:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div>Cargando estadísticas...</div>;
  }

  const lastMonth = monthlyStats[monthlyStats.length - 1];

  return (
    <div>
      {/* KPIs del último mes */}
      <div className="kpi-grid">
        <div className="card">
          <div style={{display:"flex",alignItems:"center",gap:6,color:"var(--color-muted)",fontSize:12}}>
            <DollarSign size={16}/> Ingreso Neto
          </div>
          <div style={{fontSize:22,fontWeight:800}}>
            CLP {lastMonth?.netIncome.toLocaleString()}
          </div>
          <div style={{color:"var(--color-muted)",fontSize:12}}>
            Último mes
          </div>
        </div>

        <div className="card">
          <div style={{display:"flex",alignItems:"center",gap:6,color:"var(--color-muted)",fontSize:12}}>
            <Clock size={16}/> Horas Trabajadas
          </div>
          <div style={{fontSize:22,fontWeight:800}}>
            {lastMonth?.totalHours.toFixed(1)}
          </div>
          <div style={{color:"var(--color-muted)",fontSize:12}}>
            Último mes
          </div>
        </div>

        <div className="card">
          <div style={{display:"flex",alignItems:"center",gap:6,color:"var(--color-muted)",fontSize:12}}>
            <Target size={16}/> Viajes
          </div>
          <div style={{fontSize:22,fontWeight:800}}>
            {lastMonth?.totalTrips}
          </div>
          <div style={{color:"var(--color-muted)",fontSize:12}}>
            Último mes
          </div>
        </div>

        <div className="card">
          <div style={{display:"flex",alignItems:"center",gap:6,color:"var(--color-muted)",fontSize:12}}>
            <TrendingUp size={16}/> Rendimiento
          </div>
          <div style={{fontSize:22,fontWeight:800}}>
            {lastMonth?.avgKmPerL.toFixed(1)} km/L
          </div>
          <div style={{color:"var(--color-muted)",fontSize:12}}>
            Promedio último mes
          </div>
        </div>
      </div>

      {/* Gráficos */}
      <div style={{display:"grid",gap:18,marginTop:18}}>
        {/* Ingresos por mes */}
        <div className="card">
          <h3 style={{marginTop:0}}>Ingresos por mes</h3>
          <div style={{height:260}}>
            <ResponsiveContainer>
              <LineChart data={monthlyStats}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="period"
                  tickFormatter={(period) => format(new Date(period + '-01'), 'MMM', { locale: es })}
                />
                <YAxis />
                <Tooltip 
                  formatter={(value: number) => `CLP ${value.toLocaleString()}`}
                  labelFormatter={(period) => format(new Date(period + '-01'), 'MMMM yyyy', { locale: es })}
                />
                <Line
                  type="monotone"
                  dataKey="netIncome"
                  stroke="#10b981"
                  strokeWidth={2}
                  dot={false}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Horas y viajes */}
        <div className="card">
          <h3 style={{marginTop:0}}>Horas y viajes por mes</h3>
          <div style={{height:260}}>
            <ResponsiveContainer>
              <BarChart data={monthlyStats}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="period"
                  tickFormatter={(period) => format(new Date(period + '-01'), 'MMM', { locale: es })}
                />
                <YAxis yAxisId="left" />
                <YAxis yAxisId="right" orientation="right" />
                <Tooltip
                  labelFormatter={(period) => format(new Date(period + '-01'), 'MMMM yyyy', { locale: es })}
                />
                <Bar
                  yAxisId="left"
                  dataKey="totalHours"
                  fill="#111827"
                  name="Horas"
                />
                <Bar
                  yAxisId="right"
                  dataKey="totalTrips"
                  fill="#34d399"
                  name="Viajes"
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Rendimiento */}
        <div className="card">
          <h3 style={{marginTop:0}}>Rendimiento (km/L)</h3>
          <div style={{height:260}}>
            <ResponsiveContainer>
              <LineChart data={monthlyStats}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="period"
                  tickFormatter={(period) => format(new Date(period + '-01'), 'MMM', { locale: es })}
                />
                <YAxis />
                <Tooltip
                  formatter={(value: number) => `${value.toFixed(1)} km/L`}
                  labelFormatter={(period) => format(new Date(period + '-01'), 'MMMM yyyy', { locale: es })}
                />
                <Line
                  type="monotone"
                  dataKey="avgKmPerL"
                  stroke="#60a5fa"
                  strokeWidth={2}
                  dot={false}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}
