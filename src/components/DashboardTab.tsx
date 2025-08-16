import React from 'react';

type DashboardProps = {
  entries: any[];
  totals: any;
  vehicles: any[];
  goals: any[];
  fixed: any[];
};

export default function DashboardTab({ entries, totals, vehicles, goals, fixed }: DashboardProps) {

  return (
    <div>
      {/* Header */}
      <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px'}}>
        <h1 style={{fontSize: '24px', fontWeight: '600', margin: 0}}>Dashboard</h1>
        <div style={{width: '32px', height: '32px', borderRadius: '50%', backgroundColor: 'var(--color-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center'}}>
          <span style={{color: 'white', fontSize: '14px', fontWeight: '600'}}>U</span>
        </div>
      </div>

      {/* KPIs Grid - 2x2 */}
      <div style={{display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '24px'}}>
        <div style={{backgroundColor: 'var(--color-card)', borderRadius: '12px', padding: '16px'}}>
          <div style={{fontSize: '14px', color: 'var(--color-muted)', marginBottom: '4px'}}>Trips</div>
          <div style={{fontSize: '28px', fontWeight: '700', color: 'white'}}>{totals.totalTrips || 0}</div>
        </div>
        
        <div style={{backgroundColor: 'var(--color-card)', borderRadius: '12px', padding: '16px'}}>
          <div style={{fontSize: '14px', color: 'var(--color-muted)', marginBottom: '4px'}}>Earnings</div>
          <div style={{fontSize: '28px', fontWeight: '700', color: 'white'}}>{totals.grossIncome ? Math.round(totals.grossIncome).toLocaleString() : '0'}</div>
        </div>
        
        <div style={{backgroundColor: 'var(--color-card)', borderRadius: '12px', padding: '16px'}}>
          <div style={{fontSize: '14px', color: 'var(--color-muted)', marginBottom: '4px'}}>Hours</div>
          <div style={{fontSize: '28px', fontWeight: '700', color: 'white'}}>{totals.totalHours || '0'}</div>
        </div>
        
        <div style={{backgroundColor: 'var(--color-card)', borderRadius: '12px', padding: '16px'}}>
          <div style={{fontSize: '14px', color: 'var(--color-muted)', marginBottom: '4px'}}>Net</div>
          <div style={{fontSize: '28px', fontWeight: '700', color: 'var(--color-primary)'}}>{totals.netIncome ? Math.round(totals.netIncome).toLocaleString() : '0'}</div>
        </div>
      </div>

      {/* Add Trip Button */}
      <button style={{
        width: '100%',
        backgroundColor: 'var(--color-primary)',
        color: 'white',
        border: 'none',
        borderRadius: '12px',
        padding: '16px',
        fontSize: '16px',
        fontWeight: '600',
        marginBottom: '32px',
        cursor: 'pointer'
      }}>
        Add Trip
      </button>

      {/* Expenses Section */}
      <div style={{marginBottom: '24px'}}>
        <h2 style={{fontSize: '18px', fontWeight: '600', marginBottom: '16px'}}>Expenses</h2>
        <div style={{display: 'grid', gap: '12px'}}>
          <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 0'}}>
            <span style={{fontSize: '16px'}}>Fuel</span>
            <span style={{fontSize: '16px', fontWeight: '600'}}>CLP 30100</span>
          </div>
          <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 0'}}>
            <span style={{fontSize: '16px'}}>Maintenance</span>
            <span style={{fontSize: '16px', fontWeight: '600'}}>CLP 25000</span>
          </div>
          <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 0'}}>
            <span style={{fontSize: '16px'}}>Cat Loan</span>
            <span style={{fontSize: '16px', fontWeight: '600'}}>CLP 84000</span>
          </div>
        </div>
      </div>

      {/* Bonuses Section */}
      <div>
        <h2 style={{fontSize: '18px', fontWeight: '600', marginBottom: '16px'}}>Bonuses</h2>
        <div style={{backgroundColor: 'var(--color-card)', borderRadius: '12px', padding: '16px'}}>
          <div style={{marginBottom: '8px'}}>
            <span style={{fontSize: '16px'}}>Complete 15 trips</span>
          </div>
          <div style={{marginBottom: '8px'}}>
            <span style={{fontSize: '14px', color: 'var(--color-muted)'}}>to earn </span>
            <span style={{fontSize: '16px', fontWeight: '600', color: 'var(--color-primary)'}}>CLP 56000</span>
          </div>
          <div style={{width: '100%', height: '8px', backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: '4px', marginBottom: '8px'}}>
            <div style={{width: '40%', height: '100%', backgroundColor: 'var(--color-primary)', borderRadius: '4px'}}></div>
          </div>
          <div style={{display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: 'var(--color-muted)'}}>
            <span>CLP 7,500 per day</span>
            <span>40 days</span>
          </div>
        </div>
      </div>

    </div>
  );
}
