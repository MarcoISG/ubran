import React, { useMemo, useState } from "react";
import { Wallet, Gauge, Target, Fuel, Upload, Download, PlusCircle, Trash2, Car, Goal as GoalIcon, MapPin } from "lucide-react";
import { ResponsiveContainer, LineChart, Line, CartesianGrid, XAxis, YAxis, Tooltip, BarChart, Bar } from "recharts";

// Helper numeric input with placeholder, avoids persistent 0 by using text input and internal buffer
function InputNum({
  value,
  onChange,
  placeholder = "0",
  step,
}: {
  value: number;
  onChange: (v: number) => void;
  placeholder?: string;
  step?: number;
}) {
  const [text, setText] = React.useState<string>(value === 0 ? "" : String(value));

  // Mantén sincronizado cuando el valor externo cambie programáticamente
  React.useEffect(() => {
    const next = value === 0 ? "" : String(value);
    if (next !== text) setText(next);
  }, [value]);

  const commit = (raw: string) => {
    const norm = raw.replace(',', '.').trim();
    if (norm === "") { onChange(0); return; }
    const n = Number(norm);
    onChange(Number.isFinite(n) ? n : 0);
  };

  return (
    <input
      type="text"
      inputMode="decimal"
      pattern="[0-9]*[.,]?[0-9]*"
      placeholder={placeholder}
      value={text}
      onChange={(e) => setText(e.target.value)}
      onBlur={(e) => commit(e.target.value)}
      onKeyDown={(e) => { if (e.key === 'Enter') commit((e.target as HTMLInputElement).value); }}
      style={{ width: '100%' }}
    />
  );
}

type Entry = {
  id: string;
  date: string;
  hours: number;
  trips: number;
  gross: number;
  cash: number;
  fuelCLP: number;
  vehicleId?: string;
}
type Vehicle = {
  id: string;
  label: string;
  make?: string;
  model?: string;
  year?: number;
  notes?: string;
}
type Goal = {
  id: string;
  name: string;
  targetCLP: number;
  savedCLP: number;
  deadline?: string;
}

const uid = ()=>Math.random().toString(36).slice(2,9);
const todayISO = ()=>new Date().toISOString().slice(0,10);

function useLocalState<T>(key:string, initial:T){
  const [value, setValue] = useState<T>(()=>{
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) as T : initial;
  });
  React.useEffect(()=>{ localStorage.setItem(key, JSON.stringify(value)); }, [key, value]);
  return [value, setValue] as const;
}

type User = { name:string; email:string };
const DEFAULT_BONUS = { b20:26000, b30:40500, b40:56000, b50:72500 };
const DEFAULT_SETTINGS = {
  tax: 0.14,
  maintPerHour: 500,
  favPlace: "",
  incTax: true,    // incluir 14% en neto
  incFuel: true,   // incluir bencina
  incMaint: true   // incluir mantención/h
};

export default function App(){
  const [user, setUser] = useLocalState<User|null>("ubran_user", null);
  const [entries, setEntries] = useLocalState<Entry[]>("ubran_entries", []);
  const [vehicles, setVehicles] = useLocalState<Vehicle[]>("ubran_vehicles", []);
  const [vehicleId, setVehicleId] = useLocalState<string>("ubran_current_vehicle","");
  const [goals, setGoals] = useLocalState<Goal[]>("ubran_goals", []);
  const [bonus, setBonus] = useLocalState("ubran_bonus", DEFAULT_BONUS);
  const [settings, setSettings] = useLocalState("ubran_settings", DEFAULT_SETTINGS);
  const VEH_DB: Record<string, string[]> = {
    "Chery": ["Tiggo 2", "Tiggo 3", "Tiggo 4", "Tiggo 7", "Tiggo 8", "Arrizo 5", "Arrizo 7"],
    "Chevrolet": ["Spark", "Sail", "Onix", "Aveo", "Prisma", "Cruze", "Tracker", "Equinox", "Spin", "Captiva", "Corvette"],
    "Toyota": ["Yaris", "Corolla", "Etios", "Hilux", "RAV4", "Avanza", "Prius"],
    "Hyundai": ["Grand i10", "i10", "Accent", "Verna", "Elantra", "Tucson", "Creta", "Santa Fe"],
    "Kia": ["Morning", "Picanto", "Rio", "Cerato", "Soul", "Sportage", "Seltos"],
    "Nissan": ["March", "Micra", "Versa", "Tiida", "Sentra", "Note", "Kicks", "Qashqai", "X-Trail"],
    "Suzuki": ["Alto", "Celerio", "Swift", "Baleno", "Dzire", "Vitara", "S-Cross"],
    "Peugeot": ["208", "2008", "301", "308", "3008", "Partner"],
    "Renault": ["Kwid", "Logan", "Sandero", "Stepway", "Duster", "Captur"],
    "Ford": ["Ka", "Fiesta", "Focus", "Fusion", "EcoSport", "Escape"],
    "Volkswagen": ["Gol", "Voyage", "Polo", "Virtus", "Golf", "T-Cross", "Tiguan"],
    "Mitsubishi": ["Mirage", "Lancer", "ASX", "Outlander", "Montero Sport"],
    "Mazda": ["2", "3", "6", "CX-3", "CX-30", "CX-5"],
    "Subaru": ["Impreza", "Legacy", "XV", "Forester", "Outback"],
    "Geely": ["CK", "GC6", "Coolray", "Azkarra"],
    "Great Wall": ["Wingle 5", "Wingle 7", "Haval H2", "Haval H6"],
    "BYD": ["F0", "Dolphin", "Atto 3", "Song"],
    "JAC": ["S2", "S3", "S4", "T6"],
    "Fiat": ["Uno", "Mobi", "Argo", "Cronos", "Punto"],
    "Citroën": ["C3", "C-Elysée", "C4 Cactus", "Berlingo"],
    "Honda": ["Fit", "City", "Civic", "HR-V", "CR-V"],
    "BMW": ["Serie 1", "Serie 2", "Serie 3", "X1", "X3"],
    "Mercedes-Benz": ["Clase A", "Clase B", "GLA", "GLC"],
    "Audi": ["A1", "A3", "Q2", "Q3"],
    "Haval": ["H2", "H6", "Jolion"],
    "Changan": ["Alsvin", "CS15", "CS35", "CS55"],
    "MG": ["3", "5", "ZS", "HS"],
    "Baic": ["X25", "X35", "X55"],
    "DFSK": ["Glory 560", "Glory 580"],
    "Volvo": ["S40", "S60", "XC40", "XC60"]
  };
  const [tab, setTab] = useState<"dashboard"|"data"|"goals"|"vehicles"|"settings">("dashboard");

  const totals = useMemo(()=>{
    const hours = entries.reduce((s,r)=>s+(Number(r.hours)||0),0);
    const trips = entries.reduce((s,r)=>s+(Number(r.trips)||0),0);
    const gross = entries.reduce((s,r)=>s+(Number(r.gross)||0),0);
    const cash = entries.reduce((s,r)=>s+(Number(r.cash)||0),0);
    // costos con toggles
    const tax  = settings.incTax  ? gross * settings.tax : 0;
    const postTax = gross - tax;
    const fuel = settings.incFuel
      ? entries.reduce((s,r)=>s+(Number(r.fuelCLP)||0),0)
      : 0;
    const maint = settings.incMaint ? hours * settings.maintPerHour : 0;
    const net = postTax - fuel - maint;
    let bonusAcc = 0;
    if (trips>=20) bonusAcc += bonus.b20;
    if (trips>=30) bonusAcc += bonus.b30;
    if (trips>=40) bonusAcc += bonus.b40;
    if (trips>=50) bonusAcc += bonus.b50;
    const netPerHour = hours>0? net/hours : 0;
    const netPerTrip = trips>0? net/trips : 0;
    return { hours, trips, gross, cash, fuel, tax, postTax, maint, net, bonusAcc, netPerHour, netPerTrip };
  }, [entries, settings, bonus]);

  const chartData = entries.slice().sort((a,b)=>a.date.localeCompare(b.date)).map(r=>({
    date: r.date.slice(5),
    netDay: Math.max(0, r.gross*(1-settings.tax) - r.fuelCLP - (r.hours*settings.maintPerHour)),
    hours: r.hours,
    trips: r.trips
  }));

  // helpers
  const addEntry = ()=> setEntries(e=>[...e,{ id:uid(), date:todayISO(), hours:0, trips:0, gross:0, cash:0, fuelCLP:0, vehicleId }]);
  const rmEntry = (id:string)=> setEntries(e=>e.filter(x=>x.id!==id));
  const patchEntry = (id:string, patch:Partial<Entry>)=> setEntries(e=>e.map(x=>x.id===id?{...x,...patch}:x));

  const addVehicle = ()=>{
    const v:Vehicle = { id:uid(), label:"Mi vehículo" };
    setVehicles(prev=>[...prev, v]);
    if (!vehicleId) setVehicleId(v.id);
  };
  const rmVehicle = (id:string)=>{
    setVehicles(v=>v.filter(x=>x.id!==id));
    if (vehicleId===id) setVehicleId(vehicles.find(x=>x.id!==id)?.id || "");
  };

  const exportJson = ()=>{
    const blob = new Blob([JSON.stringify({user, entries, vehicles, vehicleId, goals, bonus, settings}, null, 2)],{type:"application/json"});
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href=url; a.download=`ubran-backup-${todayISO()}.json`; a.click(); URL.revokeObjectURL(url);
  };
  const importJson = (file:File)=>{
    const reader = new FileReader();
    reader.onload = ()=>{
      try{
        const data = JSON.parse(String(reader.result));
        if (data.user!==undefined) setUser(data.user);
        if (data.entries) setEntries(data.entries);
        if (data.vehicles) setVehicles(data.vehicles);
        if (data.vehicleId!==undefined) setVehicleId(data.vehicleId);
        if (data.goals) setGoals(data.goals);
        if (data.bonus) setBonus(data.bonus);
        if (data.settings) setSettings(data.settings);
        alert("Importado OK");
      }catch{ alert("Archivo inválido"); }
    };
    reader.readAsText(file);
  };

  if (!user){
    return (
      <div style={{maxWidth:540, margin:"40px auto", fontFamily:"ui-sans-serif"}}>
        <h1 style={{display:"flex",alignItems:"center",gap:10}}>
          <span style={{width:28,height:28,display:"grid",placeItems:"center",borderRadius:6,background:"#0f172a",color:"#10b981",fontWeight:900}}>U</span>
          Ubran
        </h1>
        <div style={{border:"1px solid #e5e7eb",borderRadius:12,padding:16,background:"#fff"}}>
          <h3 style={{marginTop:0}}>Crear sesión local</h3>
          <p style={{color:"#6b7280"}}>Tus datos se guardarán en este dispositivo (offline). Más tarde activamos respaldo en la nube.</p>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12,marginTop:8}}>
            <div>
              <label style={{color:"#6b7280",fontSize:12}}>Nombre</label>
              <input id="name" placeholder="Tu nombre" style={{width:"100%",padding:"8px 10px",border:"1px solid #e5e7eb",borderRadius:10}}/>
            </div>
            <div>
              <label style={{color:"#6b7280",fontSize:12}}>Correo</label>
              <input id="email" placeholder="tucorreo@ejemplo.com" style={{width:"100%",padding:"8px 10px",border:"1px solid #e5e7eb",borderRadius:10}}/>
            </div>
          </div>
          <div style={{display:"flex",justifyContent:"flex-end",marginTop:12}}>
            <button
              onClick={()=>{
                const name = (document.getElementById('name') as HTMLInputElement).value.trim();
                const email = (document.getElementById('email') as HTMLInputElement).value.trim();
                if(!name || !email) return alert("Completa nombre y correo");
                setUser({name,email});
              }}
              style={{background:"#10b981",color:"#fff",border:"none",padding:"8px 12px",borderRadius:10,cursor:"pointer"}}
            >Entrar</button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={{maxWidth:1160, margin:"0 auto", padding:20, fontFamily:"ui-sans-serif"}}>
      {/* Header */}
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
        <h1 style={{display:"flex",alignItems:"center",gap:10}}>
          <span style={{width:28,height:28,display:"grid",placeItems:"center",borderRadius:6,background:"#0f172a",color:"#10b981",fontWeight:900}}>U</span>
          Ubran
        </h1>
          <div style={{display:"flex",gap:8,flexWrap:"wrap"}}>
            <label className="btn">
              <Upload size={16}/> Importar
              <input type="file" style={{display:'none'}} onChange={(e)=>{const f=e.target.files?.[0]; if(f) importJson(f)}}/>
            </label>
            <button className="btn" onClick={exportJson}><Download size={16}/> Exportar</button>
          </div>
      </div>

      {/* KPIs */}
      <div className="kpi-grid" style={{marginTop:16}}>
        <Kpi title="Neto real" icon={<Wallet size={16}/>} value={`CLP ${Math.round(totals.net).toLocaleString()}`} sub="Después de 14% + bencina + mantención"/>
        <Kpi title="Neto / hora" icon={<Gauge size={16}/>} value={`CLP ${Math.round(totals.netPerHour).toLocaleString()}`} sub={`Horas: ${totals.hours.toFixed(1)} — Viajes: ${totals.trips}`}/>
        <Kpi title="Bonos" icon={<Target size={16}/>} value={`CLP ${totals.bonusAcc.toLocaleString()}`} sub="20/30/40/50 viajes"/>
        <Costs fuel={totals.fuel} maint={totals.maint} tax={totals.tax}/>
      </div>

      {/* Tabs */}
      <div className="tabs">
        <TabBtn active={tab==='dashboard'} onClick={()=>setTab('dashboard')}>Dashboard</TabBtn>
        <TabBtn active={tab==='data'} onClick={()=>setTab('data')}>Carga de datos</TabBtn>
        <TabBtn active={tab==='goals'} onClick={()=>setTab('goals')}>Metas</TabBtn>
        <TabBtn active={tab==='vehicles'} onClick={()=>setTab('vehicles')}>Vehículos</TabBtn>
        <TabBtn active={tab==='settings'} onClick={()=>setTab('settings')}>Ajustes</TabBtn>
      </div>

      {tab==='dashboard' && (
        <div className="charts-grid">
          <Card>
            <h3 style={{marginTop:0}}>Neto por día</h3>
            <div style={{height:260}}>
              <ResponsiveContainer>
                <LineChart data={chartData} margin={{ top: 10, right: 20, bottom: 0, left: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip formatter={(v)=>`CLP ${Number(v).toLocaleString()}`} />
                  <Line type="monotone" dataKey="netDay" stroke="#10b981" strokeWidth={2} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </Card>
          <Card>
            <h3 style={{marginTop:0}}>Horas & Viajes</h3>
            <div style={{height:260}}>
              <ResponsiveContainer>
                <BarChart data={chartData} margin={{ top: 10, right: 20, bottom: 0, left: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="hours" fill="#111827" />
                  <Bar dataKey="trips" fill="#34d399" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Card>
        </div>
      )}

      {tab==='data' && (
        <Card>
          <div style={{display:"flex",justifyContent:"space-between",marginBottom:8,gap:12,flexWrap:"wrap"}}>
            <div style={{display:"flex",gap:12}}>
              <button className="btn" onClick={addEntry}><PlusCircle size={16}/> Agregar día</button>
              <select value={vehicleId} onChange={(e)=>setVehicleId(e.target.value)} style={{padding:"8px 10px",border:"1px solid #e5e7eb",borderRadius:10}}>
                <option value="">Sin vehículo</option>
                {vehicles.map(v=>(<option key={v.id} value={v.id}>{v.label}</option>))}
              </select>
            </div>
          </div>
          <table style={{width:"100%",borderCollapse:"collapse",fontSize:14}}>
            <thead><tr>
              <th>Fecha</th><th>Horas</th><th>Viajes</th><th>Bruto</th><th>Efectivo</th><th>Bencina</th><th></th>
            </tr></thead>
            <tbody>
              {entries.map(r=>(
                <tr key={r.id}>
                  <td><input type="date" value={r.date} onChange={e=>patchEntry(r.id,{date:e.target.value})}/></td>
                  <td>
                    <InputNum step={0.1} value={r.hours} onChange={(v)=>patchEntry(r.id,{hours:v})} />
                  </td>
                  <td>
                    <InputNum value={r.trips} onChange={(v)=>patchEntry(r.id,{trips:v})} />
                  </td>
                  <td>
                    <InputNum value={r.gross} onChange={(v)=>patchEntry(r.id,{gross:v})} />
                  </td>
                  <td>
                    <InputNum value={r.cash} onChange={(v)=>patchEntry(r.id,{cash:v})} />
                  </td>
                  <td>
                    <InputNum value={r.fuelCLP} onChange={(v)=>patchEntry(r.id,{fuelCLP:v})} />
                  </td>
                  <td style={{textAlign:'right'}}><button className="btn" onClick={()=>rmEntry(r.id)} title="Eliminar"><Trash2 size={16}/></button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      )}

      {tab==='goals' && (
        <Card>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
            <h3 style={{margin:0}}>Metas</h3>
            <button className="btn" onClick={()=>setGoals(g=>[...g,{id:uid(), name:"Nueva meta", targetCLP:0, savedCLP:0}])}><GoalIcon size={16}/> Nueva meta</button>
          </div>
          <div style={{display:"grid",gap:12,marginTop:8}}>
            {goals.map(g=>{
              const faltante = Math.max(0, g.targetCLP - g.savedCLP);
              const horas = totals.netPerHour>0 ? faltante / totals.netPerHour : 0;
              const viajes = totals.netPerTrip>0 ? faltante / totals.netPerTrip : 0;
              const progress = g.targetCLP>0 ? Math.min(100, (g.savedCLP/g.targetCLP)*100) : 0;
              return (
                <Card key={g.id}>
                  <div style={{display:"grid",gridTemplateColumns:"1fr auto",gap:8,alignItems:"center"}}>
                    <input value={g.name} onChange={e=>setGoals(list=>list.map(x=>x.id===g.id?{...x, name:e.target.value}:x))}/>
                    <button className="btn" onClick={()=>setGoals(list=>list.filter(x=>x.id!==g.id))}><Trash2 size={16}/> Eliminar</button>
                  </div>
                  <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12,marginTop:8}}>
                    <div>
                      <label style={{color:"#6b7280",fontSize:12}}>Objetivo (CLP)</label>
                      <input type="number" value={g.targetCLP} onChange={e=>setGoals(list=>list.map(x=>x.id===g.id?{...x, targetCLP:Number(e.target.value)}:x))}/>
                    </div>
                    <div>
                      <label style={{color:"#6b7280",fontSize:12}}>Ahorro actual (CLP)</label>
                      <input type="number" value={g.savedCLP} onChange={e=>setGoals(list=>list.map(x=>x.id===g.id?{...x, savedCLP:Number(e.target.value)}:x))}/>
                    </div>
                  </div>
                  <div style={{height:8,border:"1px solid #e5e7eb",borderRadius:999,overflow:"hidden",background:"#f7f8fa",marginTop:8}}>
                    <div style={{width:`${progress}%`,height:"100%",background:"linear-gradient(90deg,#10b981,#34d399)"}}/>
                  </div>
                  <div style={{display:"flex",gap:8,flexWrap:"wrap",marginTop:8}}>
                    <Pill>Faltan: CLP {Math.round(faltante).toLocaleString()}</Pill>
                    <Pill>Horas: {horas>0? horas.toFixed(1): "—"}</Pill>
                    <Pill>Viajes: {viajes>0? viajes.toFixed(0): "—"}</Pill>
                  </div>
                </Card>
              )
            })}
          </div>
        </Card>
      )}

      {tab==='vehicles' && (
        <Card>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
            <h3 style={{margin:0}}>Vehículos</h3>
            <button className="btn" onClick={addVehicle}><Car size={16}/> Añadir vehículo</button>
          </div>
          <div style={{display:"grid",gap:12,marginTop:8}}>
            {vehicles.map(v=>(
              <Card key={v.id}>
                <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}>
                  <div>
                    <label style={{color:"#6b7280",fontSize:12}}>Etiqueta</label>
                    <input value={v.label} onChange={e=>setVehicles(list=>list.map(x=>x.id===v.id?{...x,label:e.target.value}:x))}/>
                  </div>
                  <div>
                    <label style={{color:"#6b7280",fontSize:12}}>Año</label>
                    <input type="number" value={v.year||''} onChange={e=>setVehicles(list=>list.map(x=>x.id===v.id?{...x,year:Number(e.target.value)}:x))}/>
                  </div>
                  <div>
                    <label style={{color:'#6b7280',fontSize:12}}>Marca</label>
                    <input
                      list={`brands-${v.id}`}
                      value={v.make || ''}
                      onChange={e=>{
                        const make = e.target.value;
                        setVehicles(list=>list.map(x=>x.id===v.id ? {
                          ...x,
                          make,
                          // si cambia la marca y el modelo actual no pertenece, lo vaciamos
                          model: make && x.model && !(VEH_DB[make]?.includes(x.model)) ? '' : x.model
                        } : x));
                      }}
                      placeholder="Ej: Chery, Chevrolet, Toyota…"
                    />
                    <datalist id={`brands-${v.id}`}>
                      {Object.keys(VEH_DB)
                        .filter(b => b.toLowerCase().includes((v.make||'').toLowerCase()))
                        .map(b => <option key={b} value={b} />)}
                    </datalist>
                  </div>
                  <div>
                    <label style={{color:'#6b7280',fontSize:12}}>Modelo</label>
                    <input
                      list={`models-${v.id}`}
                      value={v.model || ''}
                      onChange={e=>setVehicles(list=>list.map(x=>x.id===v.id ? {...x, model: e.target.value} : x))}
                      placeholder={v.make ? 'Escribe modelo…' : 'Primero elige la marca'}
                      disabled={!v.make}
                    />
                    <datalist id={`models-${v.id}`}>
                      {(VEH_DB[v.make || ''] ? VEH_DB[v.make || ''].filter(m =>
                        m.toLowerCase().includes((v.model||'').toLowerCase())
                      ) : []).map(m => <option key={m} value={m} />)}
                    </datalist>
                  </div>
                  <div style={{gridColumn:"1 / -1"}}>
                    <label style={{color:"#6b7280",fontSize:12}}>Notas</label>
                    <input value={v.notes||''} onChange={e=>setVehicles(list=>list.map(x=>x.id===v.id?{...x,notes:e.target.value}:x))}/>
                  </div>
                </div>
                <div style={{display:"flex",justifyContent:"space-between",marginTop:8,alignItems:"center"}}>
                  <div style={{display:"flex",gap:8,alignItems:"center"}}>
                    <label style={{color:"#6b7280"}}>Activo:</label>
                    <input type="radio" checked={vehicleId===v.id} onChange={()=>setVehicleId(v.id)}/>
                  </div>
                  <button className="btn" onClick={()=>rmVehicle(v.id)}><Trash2 size={16}/> Eliminar</button>
                </div>
              </Card>
            ))}
          </div>
        </Card>
      )}

      {tab==='settings' && (
        <Card>
          <h3 style={{marginTop:0}}>Ajustes</h3>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}>
            <div>
              <label style={{color:"#6b7280",fontSize:12}}>Impuesto (0.14 = 14%)</label>
              <input type="number" step="0.01" value={settings.tax} onChange={e=>setSettings({...settings, tax:Number(e.target.value)})}/>
            </div>
            <div>
              <label style={{color:"#6b7280",fontSize:12}}>Mantención por hora (CLP)</label>
              <input type="number" value={settings.maintPerHour} onChange={e=>setSettings({...settings, maintPerHour:Number(e.target.value)})}/>
            </div>
            <div style={{gridColumn:"1 / -1", display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:12}}>
              <label style={{display:"flex",gap:8,alignItems:"center"}}>
                <input type="checkbox" checked={settings.incTax} onChange={e=>setSettings({...settings, incTax: e.target.checked})}/>
                Incluir 14% de Uber
              </label>
              <label style={{display:"flex",gap:8,alignItems:"center"}}>
                <input type="checkbox" checked={settings.incFuel} onChange={e=>setSettings({...settings, incFuel: e.target.checked})}/>
                Incluir bencina
              </label>
              <label style={{display:"flex",gap:8,alignItems:"center"}}>
                <input type="checkbox" checked={settings.incMaint} onChange={e=>setSettings({...settings, incMaint: e.target.checked})}/>
                Incluir mantención/h
              </label>
            </div>
            <div style={{gridColumn:"1 / -1"}}>
              <label style={{color:"#6b7280",fontSize:12}}>Lugar favorito (para abrir en Waze)</label>
              <div style={{display:"flex",gap:8}}>
                <input value={settings.favPlace} onChange={e=>setSettings({...settings, favPlace:e.target.value})} placeholder="Ej: Estación Central, Santiago" style={{flex:1}}/>
                <button className="btn" onClick={()=>{
                  const q = encodeURIComponent(settings.favPlace||"");
                  if (!q) return alert("Agrega un lugar en Ajustes");
                  window.open(`https://waze.com/ul?q=${q}&navigate=yes`, "_blank");
                }}><MapPin size={16}/> Abrir en Waze</button>
              </div>
            </div>
          </div>

          <div style={{display:"flex",justifyContent:"space-between",marginTop:12}}>
            <span style={{color:"#6b7280"}}>Sesión: {user.name} · {user.email}</span>
            <button className="btn" onClick={()=>{ if(confirm('¿Cerrar sesión local? Tus datos permanecen en este dispositivo.')) setUser(null); }}>Cerrar sesión</button>
          </div>
        </Card>
      )}

      <div style={{marginTop:14,color:"#6b7280",fontSize:12}}>© Ubran — versión rápida offline</div>
    </div>
  );
}

/* --- UI helpers --- */
function Card({children}:{children:React.ReactNode}) {
  return <div style={{background:"#fff",border:"1px solid #e5e7eb",borderRadius:12,padding:14,boxShadow:"0 6px 18px rgba(0,0,0,.06)"}}>{children}</div>;
}
function Kpi({title, icon, value, sub}:{title:string; icon:React.ReactNode; value:string; sub:string}) {
  return (
    <Card>
      <div style={{display:"flex",alignItems:"center",gap:6,color:"#6b7280",fontSize:12}}>{icon} {title}</div>
      <div style={{fontSize:22,fontWeight:800}}>{value}</div>
      <div style={{color:"#6b7280",fontSize:12}}>{sub}</div>
    </Card>
  );
}
function Costs({fuel, maint, tax}:{fuel:number; maint:number; tax:number}) {
  return (
    <Card>
      <div style={{display:"flex",alignItems:"center",gap:6,color:"#6b7280",fontSize:12}}><Fuel size={16}/> Costos</div>
      <Row k="Bencina" v={`CLP ${Math.round(fuel).toLocaleString()}`}/>
      <Row k="Mantención" v={`CLP ${Math.round(maint).toLocaleString()}`}/>
      <Row k="Impuesto" v={`CLP ${Math.round(tax).toLocaleString()}`}/>
    </Card>
  );
}
function Row({k,v}:{k:string; v:string}) {
  return <div style={{display:"flex",justifyContent:"space-between"}}><span>{k}</span><span>{v}</span></div>;
}

function Pill({children}:{children:React.ReactNode}) {
  return (
    <span
      style={{
        display: 'inline-block',
        padding: '4px 8px',
        border: '1px solid #e5e7eb',
        borderRadius: 999,
        background: '#f9fafb',
        fontSize: 12,
      }}
    >
      {children}
    </span>
  );
}
function TabBtn({active, children, onClick}:{active:boolean; children:React.ReactNode; onClick:()=>void}) {
  return <button onClick={onClick} style={{padding:"8px 12px",border:"1px solid "+(active?"#10b981":"#e5e7eb"),borderRadius:10,background:active?"#eefcf6":"#fff",cursor:"pointer"}}>{children}</button>;
}