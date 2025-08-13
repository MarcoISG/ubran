import React, { useState } from 'react';
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { TrendingUp, Clock, Target, DollarSign, Calendar, MapPin, Fuel } from 'lucide-react';

type DashboardProps = {
  entries: any[];
  totals: any;
  vehicles: any[];
  goals: any[];
  fixed: any[];
};

export default function DashboardTab({ entries, totals, vehicles, goals, fixed }: DashboardProps) {
  const [timeframe, setTimeframe] = useState<'day'|'week'|'month'>('week');

  // Calcular ganancias por hora del día
  const hourlyEarnings = entries.reduce((acc: any, entry: any) => {
    const hour = new Date(entry.date).getHours();
    if (!acc[hour]) acc[hour] = { hour, total: 0, count: 0 };
    acc[hour].total += entry.gross;
    acc[hour].count++;
    return acc;
  }, {});

  const hourlyData = Object.values(hourlyEarnings).map((data: any) => ({
    hour: data.hour,
    avg: data.total / data.count
  }));

  // Calcular zonas más rentables
  const zoneEarnings = entries.reduce((acc: any, entry: any) => {
    if (!entry.zone) return acc;
    if (!acc[entry.zone]) acc[entry.zone] = { zone: entry.zone, total: 0, trips: 0 };
    acc[entry.zone].total += entry.gross;
    acc[entry.zone].trips++;
    return acc;
  }, {});

  const zoneData = Object.values(zoneEarnings)
    .map((data: any) => ({
      zone: data.zone,
      avgPerTrip: data.total / data.trips
    }))
    .sort((a: any, b: any) => b.avgPerTrip - a.avgPerTrip);

  // Predicción de ingresos
  const avgDailyGross = entries.reduce((sum: number, entry: any) => sum + entry.gross, 0) / entries.length;
  const daysInMonth = new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0).getDate();
  const projectedMonthlyGross = avgDailyGross * daysInMonth;

  return (
    <div>
      {/* KPIs Principales */}
      <div className="kpi-grid">
        <div className="card">
          <div style={{display:"flex",alignItems:"center",gap:6,color:"var(--color-muted)",fontSize:12}}>
            <DollarSign size={16}/> Proyección Mensual
          </div>
          <div style={{fontSize:22,fontWeight:800}}>
            CLP {Math.round(projectedMonthlyGross).toLocaleString()}
          </div>
          <div style={{color:"var(--color-muted)",fontSize:12}}>
            Basado en promedio diario
          </div>
        </div>

        <div className="card">
          <div style={{display:"flex",alignItems:"center",gap:6,color:"var(--color-muted)",fontSize:12}}>
            <Clock size={16}/> Mejor Horario
          </div>
          <div style={{fontSize:22,fontWeight:800}}>
            {hourlyData.length > 0 
              ? `${hourlyData.reduce((best: any, curr: any) => 
                  curr.avg > (best?.avg || 0) ? curr : best
                ).hour}:00`
              : "—"
            }
          </div>
          <div style={{color:"var(--color-muted)",fontSize:12}}>
            Mayor ganancia promedio
          </div>
        </div>

        <div className="card">
          <div style={{display:"flex",alignItems:"center",gap:6,color:"var(--color-muted)",fontSize:12}}>
            <MapPin size={16}/> Mejor Zona
          </div>
          <div style={{fontSize:22,fontWeight:800}}>
            {zoneData.length > 0 ? zoneData[0].zone : "—"}
          </div>
          <div style={{color:"var(--color-muted)",fontSize:12}}>
            CLP {zoneData.length > 0 ? Math.round(zoneData[0].avgPerTrip).toLocaleString() : "0"}/viaje
          </div>
        </div>

        <div className="card">
          <div style={{display:"flex",alignItems:"center",gap:6,color:"var(--color-muted)",fontSize:12}}>
            <Fuel size={16}/> Consumo Promedio
          </div>
          <div style={{fontSize:22,fontWeight:800}}>
            {totals.avgKmPerL ? `${totals.avgKmPerL.toFixed(1)} km/L` : "—"}
          </div>
          <div style={{color:"var(--color-muted)",fontSize:12}}>
            Últimos 30 días
          </div>
        </div>
      </div>

      {/* Selector de período */}
      <div style={{display:"flex",gap:8,marginTop:18}}>
        <button 
          className={`btn ${timeframe === 'day' ? 'btn--accent' : ''}`}
          onClick={() => setTimeframe('day')}
        >
          Día
        </button>
        <button 
          className={`btn ${timeframe === 'week' ? 'btn--accent' : ''}`}
          onClick={() => setTimeframe('week')}
        >
          Semana
        </button>
        <button 
          className={`btn ${timeframe === 'month' ? 'btn--accent' : ''}`}
          onClick={() => setTimeframe('month')}
        >
          Mes
        </button>
      </div>

      {/* Gráficos */}
      <div style={{display:"grid",gap:18,marginTop:18}}>
        {/* Ingresos por hora */}
        <div className="card">
          <h3 style={{marginTop:0}}>Ingresos por Hora del Día</h3>
          <div style={{height:260}}>
            <ResponsiveContainer>
              <BarChart data={hourlyData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="hour"
                  tickFormatter={(hour) => `${hour}:00`}
                />
                <YAxis />
                <Tooltip 
                  formatter={(value: number) => `CLP ${value.toLocaleString()}`}
                  labelFormatter={(hour) => `${hour}:00`}
                />
                <Bar dataKey="avg" fill="#10b981" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Tendencia de ganancias */}
        <div className="card">
          <h3 style={{marginTop:0}}>Tendencia de Ganancias</h3>
          <div style={{height:260}}>
            <ResponsiveContainer>
              <LineChart data={entries.slice(-30)}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="date"
                  tickFormatter={(date) => new Date(date).toLocaleDateString()}
                />
                <YAxis />
                <Tooltip 
                  formatter={(value: number) => `CLP ${value.toLocaleString()}`}
                  labelFormatter={(date) => new Date(date).toLocaleDateString()}
                />
                <Line 
                  type="monotone" 
                  dataKey="gross" 
                  stroke="#10b981" 
                  strokeWidth={2}
                  dot={false}
                />
                <Line 
                  type="monotone" 
                  dataKey="net" 
                  stroke="#60a5fa" 
                  strokeWidth={2}
                  dot={false}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Estadísticas por zona */}
        <div className="card">
          <h3 style={{marginTop:0}}>Ganancias por Zona</h3>
          <div style={{height:260}}>
            <ResponsiveContainer>
              <BarChart data={zoneData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="zone" />
                <YAxis />
                <Tooltip 
                  formatter={(value: number) => `CLP ${value.toLocaleString()}`}
                />
                <Bar dataKey="avgPerTrip" fill="#60a5fa" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Metas y Gastos */}
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:18,marginTop:18}}>
        {/* Progreso de Metas */}
        <div className="card">
          <h3 style={{marginTop:0}}>Progreso de Metas</h3>
          <div style={{display:"grid",gap:12}}>
            {goals.map(goal => {
              const progress = (goal.savedCLP / goal.targetCLP) * 100;
              return (
                <div key={goal.id}>
                  <div style={{display:"flex",justifyContent:"space-between",marginBottom:4}}>
                    <span>{goal.name}</span>
                    <span>{Math.round(progress)}%</span>
                  </div>
                  <div className="progress">
                    <div 
                      className="progress__bar" 
                      style={{width: `${progress}%`}}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Gastos Fijos */}
        <div className="card">
          <h3 style={{marginTop:0}}>Gastos Fijos</h3>
          <div style={{display:"grid",gap:12}}>
            {fixed.map(expense => {
              const progress = (expense.paidCLP / expense.amountCLP) * 100;
              return (
                <div key={expense.id}>
                  <div style={{display:"flex",justifyContent:"space-between",marginBottom:4}}>
                    <span>{expense.name}</span>
                    <span>{Math.round(progress)}%</span>
                  </div>
                  <div className="progress">
                    <div 
                      className="progress__bar" 
                      style={{width: `${progress}%`}}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
