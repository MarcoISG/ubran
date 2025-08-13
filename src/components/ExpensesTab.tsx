import React, { useState } from 'react';
import { Plus, DollarSign, Calendar, Tag, MoreVertical } from 'lucide-react';

type Expense = {
  id: string;
  date: string;
  amount: number;
  category: string;
  description: string;
};

type ExpensesTabProps = {
  expenses: Expense[];
  onAddExpense: (expense: Omit<Expense, 'id'>) => void;
  onDeleteExpense: (id: string) => void;
};

export default function ExpensesTab({ expenses, onAddExpense, onDeleteExpense }: ExpensesTabProps) {
  const [showAddForm, setShowAddForm] = useState(false);
  const [newExpense, setNewExpense] = useState({
    date: new Date().toISOString().split('T')[0],
    amount: 0,
    category: '',
    description: ''
  });

  const categories = [
    'Combustible',
    'Mantenimiento',
    'Seguro',
    'Permiso',
    'Lavado',
    'Otros'
  ];

  // Calcular totales por categoría
  const totals = expenses.reduce((acc, expense) => {
    if (!acc[expense.category]) acc[expense.category] = 0;
    acc[expense.category] += expense.amount;
    return acc;
  }, {} as Record<string, number>);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onAddExpense(newExpense);
    setNewExpense({
      date: new Date().toISOString().split('T')[0],
      amount: 0,
      category: '',
      description: ''
    });
    setShowAddForm(false);
  };

  return (
    <div>
      {/* Resumen de gastos */}
      <div className="kpi-grid">
        <div className="card">
          <div style={{display:"flex",alignItems:"center",gap:6,color:"var(--color-muted)",fontSize:12}}>
            <DollarSign size={16}/> Total Gastos
          </div>
          <div style={{fontSize:22,fontWeight:800}}>
            CLP {expenses.reduce((sum, exp) => sum + exp.amount, 0).toLocaleString()}
          </div>
          <div style={{color:"var(--color-muted)",fontSize:12}}>
            Este mes
          </div>
        </div>
        
        {Object.entries(totals).slice(0, 3).map(([category, total]) => (
          <div className="card" key={category}>
            <div style={{display:"flex",alignItems:"center",gap:6,color:"var(--color-muted)",fontSize:12}}>
              <Tag size={16}/> {category}
            </div>
            <div style={{fontSize:22,fontWeight:800}}>
              CLP {total.toLocaleString()}
            </div>
            <div style={{color:"var(--color-muted)",fontSize:12}}>
              Este mes
            </div>
          </div>
        ))}
      </div>

      {/* Botón Agregar */}
      <button 
        className="btn btn--accent"
        style={{marginTop:18,display:"flex",alignItems:"center",gap:6}}
        onClick={() => setShowAddForm(true)}
      >
        <Plus size={16}/>
        Agregar Gasto
      </button>

      {/* Formulario Agregar */}
      {showAddForm && (
        <div className="modal">
          <div className="modal__content">
            <h3>Nuevo Gasto</h3>
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label>Fecha</label>
                <input
                  type="date"
                  value={newExpense.date}
                  onChange={e => setNewExpense({...newExpense, date: e.target.value})}
                  required
                />
              </div>

              <div className="form-group">
                <label>Monto</label>
                <input
                  type="number"
                  value={newExpense.amount}
                  onChange={e => setNewExpense({...newExpense, amount: Number(e.target.value)})}
                  required
                />
              </div>

              <div className="form-group">
                <label>Categoría</label>
                <select
                  value={newExpense.category}
                  onChange={e => setNewExpense({...newExpense, category: e.target.value})}
                  required
                >
                  <option value="">Seleccionar...</option>
                  {categories.map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label>Descripción</label>
                <input
                  type="text"
                  value={newExpense.description}
                  onChange={e => setNewExpense({...newExpense, description: e.target.value})}
                  required
                />
              </div>

              <div style={{display:"flex",gap:8,marginTop:18}}>
                <button type="submit" className="btn btn--accent">
                  Guardar
                </button>
                <button 
                  type="button" 
                  className="btn"
                  onClick={() => setShowAddForm(false)}
                >
                  Cancelar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Lista de gastos */}
      <div style={{marginTop:18}}>
        {expenses.map(expense => (
          <div 
            key={expense.id}
            className="card"
            style={{
              display:"flex",
              alignItems:"center",
              justifyContent:"space-between",
              marginBottom:8
            }}
          >
            <div>
              <div style={{fontWeight:500}}>{expense.description}</div>
              <div style={{display:"flex",alignItems:"center",gap:12,color:"var(--color-muted)",fontSize:12}}>
                <span style={{display:"flex",alignItems:"center",gap:4}}>
                  <Calendar size={14}/>
                  {new Date(expense.date).toLocaleDateString()}
                </span>
                <span style={{display:"flex",alignItems:"center",gap:4}}>
                  <Tag size={14}/>
                  {expense.category}
                </span>
              </div>
            </div>
            
            <div style={{display:"flex",alignItems:"center",gap:12}}>
              <div style={{fontWeight:500}}>
                CLP {expense.amount.toLocaleString()}
              </div>
              <button 
                className="btn btn--icon"
                onClick={() => onDeleteExpense(expense.id)}
              >
                <MoreVertical size={16}/>
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
