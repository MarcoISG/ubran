
import React, { useMemo, useState, useEffect } from "react";
import { Wallet, Gauge, Target, Fuel, Upload, Download, PlusCircle, Trash2, Car, Goal as GoalIcon, MapPin, Menu } from "lucide-react";
import { ResponsiveContainer, LineChart, Line, CartesianGrid, XAxis, YAxis, Tooltip, BarChart, Bar } from "recharts";
import Tesseract from 'tesseract.js';

import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider, signInWithPopup, signOut, onAuthStateChanged, User as FbUser } from "firebase/auth";

// --- Firebase (Google Auth) ---
const firebaseConfig = {
  apiKey: "AIzaSyApQzLZ8LaW01pq5l-WruIhJzfSpe9sh2k",
  authDomain: "ubran-c29d3.firebaseapp.com",
  projectId: "ubran-c29d3",
  storageBucket: "ubran-c29d3.firebasestorage.app",
  messagingSenderId: "131691494187",
  appId: "1:131691494187:web:4a9e6753388a87baa8236e",
  measurementId: "G-6GW039CQM6"
};

// Evitar doble inicialización en HMR/React Strict
let _appInited = false as boolean;
let _auth = null as ReturnType<typeof getAuth> | null;
let _provider = null as GoogleAuthProvider | null;
function ensureFirebase(){
  if (_appInited) return;
  initializeApp(firebaseConfig);
  _auth = getAuth();
  _provider = new GoogleAuthProvider();
  _appInited = true;
}

/*
TODO – pendientes a integrar (según solicitud del usuario):
  • 📌 Formulario completo para añadir/editar gastos fijos.
  • 📌 Lógica para calcular el total mensual y mostrar la barra de progreso como en Metas.
  • 📌 Separación del módulo de gasolina con carga automática de rendimiento según el vehículo.
  • 📌 Cálculo del gasto de gasolina en el Dashboard usando km recorridos y rendimiento.

Si quieres, puedo entrar ahora mismo al código y dejar todo eso armado de una vez para que luego solo lo subas.
*/

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

// OCR helper functions
async function ocrReceipt(file: File): Promise<string> {
  // OCR con Tesseract (inglés suficiente para números/símbolos). Puedes cambiar a 'spa' si quieres.
  const { data } = await Tesseract.recognize(file, 'eng', {
    logger: (m) => console.log('[OCR]', m.status, m.progress)
  });
  return data.text || '';
}

function parseReceipt(text: string): {
  totalCLP?: number,
  litros?: number,
  precioPorLitro?: number,
  fechaISO?: string,
  estacion?: string
} {
  const clean = text.replace(/\s+/g, ' ').toUpperCase();

  // TOTAL
  const totalMatch =
    clean.match(/TOTAL[^0-9]*\$?\s*([\d\.,]{3,})/) ||
    clean.match(/MONTO\s+TOTAL[^0-9]*\$?\s*([\d\.,]{3,})/) ||
    clean.match(/PAGAR[^0-9]*\$?\s*([\d\.,]{3,})/);

  // LITROS
  const litrosMatch =
    clean.match(/LITROS?\s*[:=]?\s*([\d\.,]+)/) ||
    clean.match(/\b([0-9]+(?:[.,][0-9]+)?)\s*L\b/);

  // PRECIO / LITRO
  const pplMatch =
    clean.match(/PRECIO\s*\/\s*LITRO[^0-9]*\$?\s*([\d\.,]+)/) ||
    clean.match(/P\/?L\s*[:=]?\s*\$?\s*([\d\.,]+)/);

  // FECHA
  const fechaMatch =
    clean.match(/\b(\d{2}[\/\-.]\d{2}[\/\-.]\d{4})\b/) ||
    clean.match(/\b(\d{4}[\/\-.]\d{2}[\/\-.]\d{2})\b/);

  // ESTACIÓN
  const estacionMatch = clean.match(/\b(COPEC|SHELL|ENEX|PETROBRAS|TERPEL|PRONTO|LIPIGAS|ESO|GULF)\b/);

  const toNumber = (s?: string) => {
    if (!s) return undefined;
    const n = s.replace(/\./g, '').replace(/,/g, '.');
    const val = Number(n);
    return Number.isFinite(val) ? val : undefined;
  };

  const totalCLP = toNumber(totalMatch?.[1]);
  const litros = toNumber(litrosMatch?.[1]);
  const precioPorLitro = toNumber(pplMatch?.[1]);

  let fechaISO: string | undefined;
  if (fechaMatch?.[1]) {
    const f = fechaMatch[1].replace(/\./g,'/').replace(/-/g,'/');
    const parts = f.split('/');
    if (parts[0].length === 2 && parts[2].length === 4) {
      const [dd, mm, yyyy] = parts.map(p=>parseInt(p,10));
      const d = new Date(yyyy, mm-1, dd);
      if (!isNaN(d.getTime())) fechaISO = d.toISOString().slice(0,10);
    } else if (parts[0].length === 4) {
      const [yyyy, mm, dd] = parts.map(p=>parseInt(p,10));
      const d = new Date(yyyy, mm-1, dd);
      if (!isNaN(d.getTime())) fechaISO = d.toISOString().slice(0,10);
    }
  }

  const estacion = estacionMatch?.[1] || undefined;

  return { totalCLP, litros, precioPorLitro, fechaISO, estacion };
}

type Entry = {
  id: string;
  date: string;
  hours: number;
  trips: number;
  gross: number;
  cash: number;
  fuelCLP: number;          // total CLP (si se conoce)
  odometerStart?: number;   // km inicio
  odometerEnd?: number;     // km final
  liters?: number;          // litros cargados
  pricePerL?: number;       // CLP por litro
  station?: string;         // nombre estación (opcional)
  vehicleId?: string;
}
type Vehicle = {
  id: string;
  label: string;
  make?: string;
  model?: string;
  year?: number;
  engineL?: number;  // cilindrada (L)
  kmPerL?: number;   // rendimiento (km/L)
  manualSpecs?: boolean; // permitir edición manual de motor/rendimiento
  notes?: string;
}
type Goal = {
  id: string;
  name: string;
  targetCLP: number;
  savedCLP: number;
  deadline?: string;
}


type FixedExpense = {
  id: string;
  name: string;
  amountCLP: number;   // cuota mensual objetivo
  paidCLP: number;     // pagado este mes
  dueDay?: number;     // día de vencimiento (1-31)
};

type Totals = {
  hours: number;
  trips: number;
  gross: number;
  cash: number;
  tax: number;
  postTax: number;
  maint: number;
  net: number;
  bonusAcc: number;
  netPerHour: number;
  netPerTrip: number;
  fuelByReceipts: number;
  fuelByKmCLP: number;
  fuelUberLitersEst: number;
  fuel: number;
  fuelMethod: 'km' | 'boleta';
  fixedRemaining: number;
  fixedAdj: number;
};
// UI state for OCR feedback per entry id
type OcrState = {
  loading?: boolean;
  error?: string;
  info?: {
    totalCLP?: number;
    litros?: number;
    precioPorLitro?: number;
    fechaISO?: string;
    estacion?: string;
  };
};

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
  incMaint: true,  // incluir mantención/h
  useFuelByKm: true, // usar bencina estimada por km (default true)
  subFixed: false   // restar gastos fijos del Neto
};

export default function App(){
  ensureFirebase();
  const auth = _auth!; // ya inicializado arriba
  const provider = _provider!;

  const [guser, setGuser] = useState<FbUser|null>(null);
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => {
      setGuser(u);
      if (u) {
        // sincrona una sesión local mínima para compatibilidad con el resto de la app
        setUser({ name: u.displayName || u.email || 'Usuario', email: u.email || '' });
      }
    });
    return () => unsub();
  }, []);

  // --- LocalStorage por usuario: prefijo por uid o 'guest' ---
  const userKeyPrefix = useMemo(() => guser?.uid ? `ubran_${guser.uid}_` : 'ubran_guest_', [guser?.uid]);
  function useUserState<T>(key: string, initial: T){
    return useLocalState<T>(userKeyPrefix + key, initial);
  }

  // Migración 1 sola vez: copia claves legacy a claves con prefijo del usuario
  useEffect(() => {
    const uid = guser?.uid;
    if (!uid) return; // solo migra si hay usuario Google
    const prefix = `ubran_${uid}_`;
    const legacyKeys = [
      'ubran_entries', 'ubran_settings', 'ubran_vehicles', 'ubran_fixed', 'ubran_goals',
      'ubran_current_vehicle', 'ubran_bonus'
    ];
    legacyKeys.forEach((legacy) => {
      const val = localStorage.getItem(legacy);
      const target = prefix + legacy.replace('ubran_','');
      if (val && !localStorage.getItem(target)){
        try { localStorage.setItem(target, val); } catch {}
      }
    });
  }, [guser?.uid]);

  const googleSignIn = async ()=>{
    try { await signInWithPopup(auth, provider); }
    catch(e){ console.error('Google Sign-In error', e); alert('No se pudo iniciar sesión con Google'); }
  };
  const googleSignOut = async ()=>{
    try { await signOut(auth); setUser(null); }
    catch(e){ console.error('SignOut error', e); }
  };

  const [user, setUser] = useLocalState<User|null>("ubran_user", null);
  const [entries, setEntries] = useUserState<Entry[]>("entries", []);
  const DEFAULT_VEHICLES: Vehicle[] = [
    { id: 'chery_tiggo2_2022_15', label: 'Chery Tiggo 2 1.5 (2022)', make: 'Chery', model: 'Tiggo 2', year: 2022, engineL: 1.5, kmPerL: 11 },
    { id: 'toyota_corolla_2018_18', label: 'Toyota Corolla 1.8 (2018)', make: 'Toyota', model: 'Corolla', year: 2018, engineL: 1.8, kmPerL: 14 },
    { id: 'hyundai_accent_2017_14', label: 'Hyundai Accent 1.4 (2017)', make: 'Hyundai', model: 'Accent', year: 2017, engineL: 1.4, kmPerL: 15 },
    { id: 'chevrolet_sail_2019_15', label: 'Chevrolet Sail 1.5 (2019)', make: 'Chevrolet', model: 'Sail', year: 2019, engineL: 1.5, kmPerL: 13 },
    { id: 'kia_morning_2016_10', label: 'Kia Morning 1.0 (2016)', make: 'Kia', model: 'Morning', year: 2016, engineL: 1.0, kmPerL: 17 }
  ];
  const [vehicles, setVehicles] = useUserState<Vehicle[]>("vehicles", []);
  useEffect(() => {
    if (!vehicles || vehicles.length === 0) {
      setVehicles(DEFAULT_VEHICLES);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  const [vehicleId, setVehicleId] = useUserState<string>("current_vehicle", "");
  const [goals, setGoals] = useUserState<Goal[]>("goals", []);
  const [fixed, setFixed] = useUserState<FixedExpense[]>("fixed", []);
  const [bonus, setBonus] = useUserState("bonus", DEFAULT_BONUS);
  const [settings, setSettings] = useUserState("settings", DEFAULT_SETTINGS);
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
  const [tab, setTab] = useState<"dashboard"|"data"|"fuel"|"fixed"|"goals"|"vehicles"|"settings">("dashboard");
  const [ocr, setOcr] = useState<Record<string, OcrState>>({});
  const [isMobile, setIsMobile] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  useEffect(() => {
    if (typeof window === 'undefined' || !window.matchMedia) return;
    const mq = window.matchMedia('(max-width: 640px)');
    const apply = () => setIsMobile(mq.matches);
    apply();
    try { mq.addEventListener('change', apply); } catch { mq.addListener(apply); }
    return () => { try { mq.removeEventListener('change', apply); } catch { mq.removeListener(apply); } };
  }, []);

  const avgPricePerL = useMemo(()=>{
    const vals = entries.map(e=>Number(e.pricePerL)||0).filter(n=>n>0);
    if (!vals.length) return 0;
    return vals.reduce((a,b)=>a+b,0)/vals.length;
  },[entries]);

  // Valores aproximados por fabricante/modelo (referenciales)
  const VEH_SPECS: Record<string, Record<string, { engineL: number; kmPerL: number }>> = {
    "Chery": {
      "Tiggo 2": { engineL: 1.5, kmPerL: 11 },
      "Arrizo 5": { engineL: 1.5, kmPerL: 13 }
    },
    "Toyota": {
      "Yaris": { engineL: 1.3, kmPerL: 16 },
      "Corolla": { engineL: 1.6, kmPerL: 15 }
    },
    "Chevrolet": {
      "Sail": { engineL: 1.5, kmPerL: 14 },
      "Onix": { engineL: 1.0, kmPerL: 17 }
    },
    "Hyundai": {
      "Accent": { engineL: 1.6, kmPerL: 13 },
      "Grand i10": { engineL: 1.2, kmPerL: 18 }
    },
    "Kia": {
      "Rio": { engineL: 1.4, kmPerL: 14 },
      "Morning": { engineL: 1.2, kmPerL: 17 }
    },
    "Nissan": {
      "Versa": { engineL: 1.6, kmPerL: 15 },
      "Sentra": { engineL: 2.0, kmPerL: 13 }
    },
    "Suzuki": {
      "Swift": { engineL: 1.2, kmPerL: 18 },
      "Baleno": { engineL: 1.4, kmPerL: 17 }
    },
    "Ford": {
      "Fiesta": { engineL: 1.6, kmPerL: 14 },
      "Focus": { engineL: 2.0, kmPerL: 12 }
    },
    "Volkswagen": {
      "Gol": { engineL: 1.6, kmPerL: 13 },
      "Polo": { engineL: 1.6, kmPerL: 14 }
    }
  };

  // Combustible del mes (CLP y litros), según método elegido en Ajustes
  const monthFuel = useMemo(() => {
    const monthPrefix = new Date().toISOString().slice(0,7); // YYYY-MM
    let clp = 0;
    let liters = 0;

    const monthEntries = entries.filter(r => (r.date || '').slice(0,7) === monthPrefix);

    if (settings.useFuelByKm) {
      for (const r of monthEntries){
        const kms = Math.max(0, (Number(r.odometerEnd)||0) - (Number(r.odometerStart)||0));
        if (kms<=0) continue;
        const veh = vehicles.find(v => v.id === (r.vehicleId || '')) || vehicles.find(v=>v.id===vehicleId);
        const kmPerL = veh?.kmPerL || 0;
        if (kmPerL>0){
          const estLit = kms / kmPerL;
          liters += estLit;
          const ppl = (Number(r.pricePerL)||0) || avgPricePerL || 0;
          clp += estLit * (ppl||0);
        }
      }
    } else {
      for (const r of monthEntries){
        const l = Number(r.liters)||0;
        const ppl = Number(r.pricePerL)||0;
        const direct = Number(r.fuelCLP)||0;
        if (direct>0) clp += direct;
        else if (l>0 && ppl>0) clp += l * ppl;
        if (l>0) liters += l;
      }
    }

    return { clp, liters };
  }, [entries, vehicles, vehicleId, avgPricePerL, settings.useFuelByKm]);
  const totals = useMemo<Totals>(()=>{
    const hours = entries.reduce((s,r)=>s+(Number(r.hours)||0),0);
    const trips = entries.reduce((s,r)=>s+(Number(r.trips)||0),0);
    const gross = entries.reduce((s,r)=>s+(Number(r.gross)||0),0);
    const cash = entries.reduce((s,r)=>s+(Number(r.cash)||0),0);

    // costos con toggles
    const tax  = settings.incTax  ? gross * settings.tax : 0;
    const postTax = gross - tax;
    // Gastos fijos restantes del mes (restante del mes)
    const fixedRemaining = fixed.reduce(
      (s,g)=> s + Math.max(0,(Number(g.amountCLP)||0)-(Number(g.paidCLP)||0)),
      0
    );

    // Método 1: bencina por boletas (fuelCLP o litros*$L)
    const fuelByReceipts = entries.reduce((s,r)=>{
      const direct = Number(r.fuelCLP)||0;
      const calc = (Number(r.liters)||0) * (Number(r.pricePerL)||0);
      return s + (direct>0 ? direct : calc);
    },0);

    // Método 2: bencina estimada solo Uber por km
    let fuelUberLitersEst = 0;
    let fuelByKmCLP = 0;
    for (const r of entries){
      const kms = Math.max(0, (Number(r.odometerEnd)||0) - (Number(r.odometerStart)||0));
      if (kms<=0) continue;
      const veh = vehicles.find(v => v.id === (r.vehicleId || '')) || vehicles.find(v=>v.id===vehicleId);
      const kmPerL = veh?.kmPerL || 0;
      if (kmPerL>0){
        const liters = kms / kmPerL;
        const price = (Number(r.pricePerL)||0) || avgPricePerL || 0;
        fuelUberLitersEst += liters;
        fuelByKmCLP += liters * price;
      }
    }

    const fuelChosen = settings.incFuel ? (settings.useFuelByKm ? fuelByKmCLP : fuelByReceipts) : 0;
    const maint = settings.incMaint ? hours * settings.maintPerHour : 0;
    const fixedAdj = settings.subFixed ? fixedRemaining : 0;
    const net = postTax - fuelChosen - maint - fixedAdj;

    // Bonos
    let bonusAcc = 0;
    if (trips>=20) bonusAcc += bonus.b20;
    if (trips>=30) bonusAcc += bonus.b30;
    if (trips>=40) bonusAcc += bonus.b40;
    if (trips>=50) bonusAcc += bonus.b50;

    const netPerHour = hours>0? net/hours : 0;
    const netPerTrip = trips>0? net/trips : 0;
    return { hours, trips, gross, cash, tax, postTax, maint, net, bonusAcc, netPerHour, netPerTrip,
      // fuel aggregates
      fuelByReceipts, fuelByKmCLP, fuelUberLitersEst,
      fuel: fuelChosen, fuelMethod: (settings.useFuelByKm ? 'km' : 'boleta') as 'km'|'boleta',
      fixedRemaining, fixedAdj
    };
  }, [entries, settings, bonus, vehicles, vehicleId, avgPricePerL, fixed]);

  const chartData = entries.slice().sort((a,b)=>a.date.localeCompare(b.date)).map(r=>{
    const hours = Number(r.hours)||0;
    const gross = Number(r.gross)||0;
    const fuelVal = settings.incFuel ? ((Number(r.fuelCLP)||0) || ((Number(r.liters)||0)*(Number(r.pricePerL)||0))) : 0;
    const taxVal = settings.incTax ? gross * settings.tax : 0;
    const maintVal = settings.incMaint ? hours * settings.maintPerHour : 0;
    const netDay = Math.max(0, gross - taxVal - fuelVal - maintVal);

    // estimación de bencina por km
    const kms = Math.max(0, (Number(r.odometerEnd)||0) - (Number(r.odometerStart)||0));
    const veh = vehicles.find(v => v.id === (r.vehicleId || '')) || vehicles.find(v=>v.id===vehicleId);
    const kmPerL = veh?.kmPerL || 0;
    const litersEst = kmPerL>0 ? (kms / kmPerL) : 0;
    const price = (Number(r.pricePerL)||0) || avgPricePerL;
    const fuelCostEst = litersEst * (price||0);

    return {
      date: r.date.slice(5),
      netDay,
      hours: hours,
      trips: Number(r.trips)||0,
      fuelCostEst
    };
  });

  // helpers
  const addEntry = ()=> setEntries(e=>[...e,{
    id:uid(), date:todayISO(), hours:0, trips:0, gross:0, cash:0, fuelCLP:0,
    odometerStart:0, odometerEnd:0, liters:0, pricePerL:0, station:"", vehicleId
  }]);
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

  if (!user && !guser){
    return (
      <div style={{maxWidth:540, margin:"40px auto", fontFamily:"ui-sans-serif"}}>
        <h1 style={{display:"flex",alignItems:"center",gap:10}}>
          <span style={{width:28,height:28,display:"grid",placeItems:"center",borderRadius:6,background:"#0f172a",color:"#10b981",fontWeight:900}}>U</span>
          Ubran
        </h1>
        <div style={{border:"1px solid var(--color-border)",borderRadius:12,padding:16,background:"var(--color-bg-card)"}}>
          <h3 style={{marginTop:0}}>Entrar</h3>
          <p className="muted">Conecta tu cuenta de Google para guardar preferencias. También puedes crear sesión local.</p>
          <div style={{display:'grid', gap:10}}>
            <button className="btn" onClick={googleSignIn}>Continuar con Google</button>
            <details>
              <summary style={{cursor:'pointer', color:'#9ca3af'}}>o crear sesión local</summary>
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12,marginTop:8}}>
                <div>
                  <label style={{color:"#6b7280",fontSize:12}}>Nombre</label>
                  <input id="name" placeholder="Tu nombre" style={{width:"100%",padding:"8px 10px",border:"1px solid var(--color-border)",borderRadius:10,background:"#0e1526",color:"var(--color-text)"}}/>
                </div>
                <div>
                  <label style={{color:"#6b7280",fontSize:12}}>Correo</label>
                  <input id="email" placeholder="tucorreo@ejemplo.com" style={{width:"100%",padding:"8px 10px",border:"1px solid var(--color-border)",borderRadius:10,background:"#0e1526",color:"var(--color-text)"}}/>
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
                >Entrar local</button>
              </div>
            </details>
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
        {isMobile ? (
          <button className="btn" onClick={()=>setMenuOpen(true)} aria-label="Abrir menú">
            <Menu size={18}/> Menu
          </button>
        ) : (
          <div style={{display:"flex",gap:8,flexWrap:"wrap"}}>
            <label className="btn">
              <Upload size={16}/> Importar
              <input type="file" style={{display:'none'}} onChange={(e)=>{const f=e.target.files?.[0]; if(f) importJson(f)}}/>
            </label>
            <button className="btn" onClick={exportJson}><Download size={16}/> Exportar</button>
          </div>
        )}
      </div>

      {isMobile && menuOpen && (
        <div style={{position:'fixed',inset:0,background:'rgba(0,0,0,0.45)',zIndex:50}} onClick={()=>setMenuOpen(false)}>
          <div
            onClick={(e)=>e.stopPropagation()}
            style={{position:'absolute',top:0,right:0,height:'100%',width:'78%',maxWidth:360,background:'var(--color-bg-card)',borderLeft:'1px solid var(--color-border)',padding:16,display:'grid',gap:12}}
          >
            <div style={{display:'flex',justifyContent:'space-between',alignItems:'center'}}>
              <strong>Menú</strong>
              <button className="pill" onClick={()=>setMenuOpen(false)}>Cerrar</button>
            </div>
            <div style={{display:'grid',gap:8}}>
              <button className={`pill ${tab==='dashboard'?'pill--active':''}`} onClick={()=>{setTab('dashboard'); setMenuOpen(false);}}>Inicio</button>
              <button className={`pill ${tab==='data'?'pill--active':''}`} onClick={()=>{setTab('data'); setMenuOpen(false);}}>Carga de datos</button>
              <button className={`pill ${tab==='fuel'?'pill--active':''}`} onClick={()=>{setTab('fuel'); setMenuOpen(false);}}>Combustible</button>
              <button className={`pill ${tab==='fixed'?'pill--active':''}`} onClick={()=>{setTab('fixed'); setMenuOpen(false);}}>Fijos</button>
              <button className={`pill ${tab==='goals'?'pill--active':''}`} onClick={()=>{setTab('goals'); setMenuOpen(false);}}>Metas</button>
              <button className={`pill ${tab==='vehicles'?'pill--active':''}`} onClick={()=>{setTab('vehicles'); setMenuOpen(false);}}>Vehículos</button>
              <button className={`pill ${tab==='settings'?'pill--active':''}`} onClick={()=>{setTab('settings'); setMenuOpen(false);}}>Ajustes</button>
            </div>
            <div style={{borderTop:'1px solid var(--color-border)',paddingTop:12,display:'grid',gap:8}}>
              <label className="btn">
                <Upload size={16}/> Importar
                <input type="file" style={{display:'none'}} onChange={(e)=>{const f=e.target.files?.[0]; if(f) importJson(f); setMenuOpen(false);}}/>
              </label>
              <button className="btn" onClick={()=>{exportJson(); setMenuOpen(false);}}><Download size={16}/> Exportar</button>
            </div>
          </div>
        </div>
      )}

      {/* KPIs (desktop) */}
      {!isMobile && (
        <div className="kpi-grid" style={{marginTop:16}}>
        <Kpi
          title="Neto real"
          icon={<Wallet size={16}/>} 
          value={`CLP ${Math.round(totals.net).toLocaleString()}`}
          sub={(() => {
            const parts = [
              settings.incTax ? '14%' : null,
              settings.incFuel ? 'bencina' : null,
              settings.incMaint ? 'mantención' : null,
              settings.subFixed ? 'fijos' : null,
            ].filter(Boolean) as string[];
            return parts.length ? `Después de ${parts.join(' + ')}` : 'Sin descuentos aplicados';
          })()}
        />
        <Kpi title="Neto / hora" icon={<Gauge size={16}/>} value={`CLP ${Math.round(totals.netPerHour).toLocaleString()}`} sub={`Horas: ${totals.hours.toFixed(1)} — Viajes: ${totals.trips}`}/>
        <Kpi title="Bonos" icon={<Target size={16}/>} value={`CLP ${totals.bonusAcc.toLocaleString()}`} sub="20/30/40/50 viajes"/>
        <Kpi
          title="Bencina (Uber)"
          icon={<Fuel size={16}/>} 
          value={`CLP ${Math.round(totals.fuelByKmCLP).toLocaleString()}`}
          sub={`${totals.fuelUberLitersEst.toFixed(1)} L estimados`}
        />
        <Kpi
          title="Bencina del mes"
          icon={<Fuel size={16}/>} 
          value={`CLP ${Math.round(monthFuel.clp).toLocaleString()}`}
          sub={`${monthFuel.liters.toFixed(1)} L (${settings.useFuelByKm ? 'estimado por km' : 'por boleta'})`}
        />
        <Costs fuel={totals.fuel} maint={totals.maint} tax={totals.tax} fixed={totals.fixedAdj} fuelMethod={totals.fuelMethod as 'km'|'boleta'}/>
        </div>
      )}

      {/* Tabs */}
      <div className="pill-tabs">
        <TabBtn active={tab==='dashboard'} onClick={()=>setTab('dashboard')}>Dashboard</TabBtn>
        <TabBtn active={tab==='data'} onClick={()=>setTab('data')}>Carga de datos</TabBtn>
        <TabBtn active={tab==='fuel'} onClick={()=>setTab('fuel')}>Combustible</TabBtn>
        <TabBtn active={tab==='fixed'} onClick={()=>setTab('fixed')}>Fijos</TabBtn>
        <TabBtn active={tab==='goals'} onClick={()=>setTab('goals')}>Metas</TabBtn>
        <TabBtn active={tab==='vehicles'} onClick={()=>setTab('vehicles')}>Vehículos</TabBtn>
        <TabBtn active={tab==='settings'} onClick={()=>setTab('settings')}>Ajustes</TabBtn>
      </div>

      {tab==='fixed' && (
        <Card>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
            <h3 style={{margin:0}}>Gastos fijos (mensuales)</h3>
            <button className="btn" onClick={()=>setFixed(list=>[...list,{id:uid(), name:"Nuevo gasto", amountCLP:0, paidCLP:0, dueDay:1}])}><PlusCircle size={16}/> Nuevo gasto</button>
          </div>

          <div style={{display:"grid",gap:12,marginTop:8}}>
            {fixed.map(g=>{
              const rest = Math.max(0, g.amountCLP - g.paidCLP);
              const progress = g.amountCLP>0 ? Math.min(100, (g.paidCLP/g.amountCLP)*100) : 0;
              const horas = totals.netPerHour>0 ? rest / totals.netPerHour : 0;
              const viajes = totals.netPerTrip>0 ? rest / totals.netPerTrip : 0;
              return (
                <Card key={g.id}>
                  <div style={{display:"grid",gridTemplateColumns:"1fr auto",gap:8,alignItems:"center"}}>
                    <input value={g.name} onChange={e=>setFixed(list=>list.map(x=>x.id===g.id?{...x, name:e.target.value}:x))}/>
                    <button className="btn" onClick={()=>setFixed(list=>list.filter(x=>x.id!==g.id))}><Trash2 size={16}/> Eliminar</button>
                  </div>

                  <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:12,marginTop:8}}>
                    <div>
                      <label style={{color:"#6b7280",fontSize:12}}>Monto mensual (CLP)</label>
                      <input
                        type="number"
                        inputMode="decimal"
                        min={0}
                        step={1000}
                        value={g.amountCLP}
                        onChange={e=>setFixed(list=>list.map(x=>x.id===g.id?{...x, amountCLP:Number(e.target.value)}:x))}
                      />
                    </div>
                    <div>
                      <label style={{color:"#6b7280",fontSize:12}}>Pagado este mes (CLP)</label>
                      <input
                        type="number"
                        inputMode="decimal"
                        min={0}
                        step={1000}
                        value={g.paidCLP}
                        onChange={e=>setFixed(list=>list.map(x=>x.id===g.id?{...x, paidCLP:Number(e.target.value)}:x))}
                      />
                    </div>
                    <div>
                      <label style={{color:"#6b7280",fontSize:12}}>Día de vencimiento</label>
                      <input
                        type="number"
                        inputMode="numeric"
                        min={1}
                        max={31}
                        step={1}
                        value={g.dueDay||''}
                        onChange={e=>setFixed(list=>list.map(x=>x.id===g.id?{...x, dueDay:Number(e.target.value)}:x))}
                      />
                    </div>
                    <div style={{display:'flex',gap:8,alignItems:'flex-end'}}>
                      <button className="btn" onClick={()=>setFixed(list=>list.map(x=>x.id===g.id?{...x, paidCLP:0}:x))}>Reiniciar mes</button>
                    </div>
                  </div>

                  <div style={{height:8, border:"1px solid var(--color-border)", borderRadius:999, overflow:"hidden", background:"var(--color-bg-card-soft)", marginTop:8}}>
                    <div style={{width:`${progress}%`,height:"100%",background:"linear-gradient(90deg,#10b981,#34d399)"}}/>
                  </div>
                  <div style={{display:"flex",gap:8,flexWrap:"wrap",marginTop:8}}>
                    <Pill>Falta: CLP {Math.round(rest).toLocaleString()}</Pill>
                    <Pill>Horas: {horas>0? horas.toFixed(1): "—"}</Pill>
                    <Pill>Viajes: {viajes>0? viajes.toFixed(0): "—"}</Pill>
                  </div>
                </Card>
              );
            })}
          </div>
        </Card>
      )}

      {tab==='dashboard' && (
        isMobile ? (
          <MobileDashboard totals={totals} monthFuel={monthFuel} settings={settings} />
        ) : (
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
            <Card>
              <h3 style={{marginTop:0}}>Bencina (estimada) por día</h3>
              <div style={{height:260}}>
                <ResponsiveContainer>
                  <BarChart data={chartData} margin={{ top: 10, right: 20, bottom: 0, left: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip formatter={(v)=>`CLP ${Number(v).toLocaleString()}`} />
                    <Bar dataKey="fuelCostEst" fill="#60a5fa" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </Card>
          </div>
        )
      )}

      {tab==='data' && (
        <Card>
          <div style={{display:"flex",justifyContent:"space-between",marginBottom:8,gap:12,flexWrap:"wrap"}}>
            <div style={{display:"flex",gap:12}}>
              <button className="btn" onClick={addEntry}><PlusCircle size={16}/> Agregar día</button>
              <select value={vehicleId} onChange={(e)=>setVehicleId(e.target.value)} style={{padding:"8px 10px",border:"1px solid var(--color-border)",borderRadius:10,background:"#0e1526",color:"var(--color-text)"}}>
                <option value="">Sin vehículo</option>
                {vehicles.map(v=>(<option key={v.id} value={v.id}>{v.label}</option>))}
              </select>
            </div>
          </div>

          {isMobile ? (
            <div style={{display:'grid', gap:12}}>
              {entries.map(r=> (
                <Card key={r.id}>
                  <div style={{display:'grid', gap:10}}>
                    <div>
                      <label style={{color:'#6b7280',fontSize:12}}>Fecha</label>
                      <input type="date" value={r.date} onChange={e=>patchEntry(r.id,{date:e.target.value})}/>
                    </div>
                    <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:10}}>
                      <div>
                        <label style={{color:'#6b7280',fontSize:12}}>Horas</label>
                        <InputNum step={0.1} value={r.hours} onChange={(v)=>patchEntry(r.id,{hours:v})} />
                      </div>
                      <div>
                        <label style={{color:'#6b7280',fontSize:12}}>Viajes</label>
                        <InputNum value={r.trips} onChange={(v)=>patchEntry(r.id,{trips:v})} />
                      </div>
                    </div>
                    <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:10}}>
                      <div>
                        <label style={{color:'#6b7280',fontSize:12}}>Km inicio</label>
                        <InputNum value={r.odometerStart||0} onChange={(v)=>patchEntry(r.id,{odometerStart:v})} />
                      </div>
                      <div>
                        <label style={{color:'#6b7280',fontSize:12}}>Km final</label>
                        <InputNum value={r.odometerEnd||0} onChange={(v)=>patchEntry(r.id,{odometerEnd:v})} />
                      </div>
                    </div>
                    <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:10}}>
                      <div>
                        <label style={{color:'#6b7280',fontSize:12}}>Bruto</label>
                        <InputNum value={r.gross} onChange={(v)=>patchEntry(r.id,{gross:v})} />
                      </div>
                      <div>
                        <label style={{color:'#6b7280',fontSize:12}}>Efectivo</label>
                        <InputNum value={r.cash} onChange={(v)=>patchEntry(r.id,{cash:v})} />
                      </div>
                    </div>
                    <div style={{color:'#6b7280',fontSize:12}}>
                      {(() => {
                        const kms = Math.max(0, (Number(r.odometerEnd)||0) - (Number(r.odometerStart)||0));
                        const veh = vehicles.find(v => v.id === (r.vehicleId || '')) || vehicles.find(v=>v.id===vehicleId);
                        const kmPerL = veh?.kmPerL || 0;
                        const litersEst = kmPerL>0 ? (kms / kmPerL) : 0;
                        const price = (Number(r.pricePerL)||0) || avgPricePerL || 0;
                        const clp = litersEst * price;
                        return <span>Bencina (est.): <strong>CLP {Math.round(clp).toLocaleString()}</strong></span>;
                      })()}
                    </div>
                    <div style={{display:'flex', justifyContent:'flex-end'}}>
                      <button className="btn" onClick={()=>rmEntry(r.id)} title="Eliminar"><Trash2 size={16}/> Eliminar</button>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          ) : (
            <div className="table-wrap">
              <table className="table" style={{fontSize:14}}>
                <thead>
                  <tr>
                    <th colSpan={5}>Jornada</th>
                    <th colSpan={3}>Ingresos</th>
                    <th></th>
                  </tr>
                  <tr>
                    <th>Fecha</th><th>Horas</th><th>Viajes</th><th>Km inicio</th><th>Km final</th>
                    <th>Bruto</th><th>Efectivo</th><th>Bencina (est.)</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {entries.map(r=> (
                    <tr key={r.id}>
                      <td><input type="date" value={r.date} onChange={e=>patchEntry(r.id,{date:e.target.value})}/></td>
                      <td><InputNum step={0.1} value={r.hours} onChange={(v)=>patchEntry(r.id,{hours:v})} /></td>
                      <td><InputNum value={r.trips} onChange={(v)=>patchEntry(r.id,{trips:v})} /></td>
                      <td><InputNum value={r.odometerStart||0} onChange={(v)=>patchEntry(r.id,{odometerStart:v})} /></td>
                      <td><InputNum value={r.odometerEnd||0} onChange={(v)=>patchEntry(r.id,{odometerEnd:v})} /></td>
                      <td><InputNum value={r.gross} onChange={(v)=>patchEntry(r.id,{gross:v})} /></td>
                      <td><InputNum value={r.cash} onChange={(v)=>patchEntry(r.id,{cash:v})} /></td>
                      <td style={{color:'#6b7280'}}>
                        {(() => {
                          const kms = Math.max(0, (Number(r.odometerEnd)||0) - (Number(r.odometerStart)||0));
                          const veh = vehicles.find(v => v.id === (r.vehicleId || '')) || vehicles.find(v=>v.id===vehicleId);
                          const kmPerL = veh?.kmPerL || 0;
                          const litersEst = kmPerL>0 ? (kms / kmPerL) : 0;
                          const price = (Number(r.pricePerL)||0) || avgPricePerL || 0;
                          const clp = litersEst * price;
                          return `CLP ${Math.round(clp).toLocaleString()}`;
                        })()}
                      </td>
                      <td style={{textAlign:'right'}}>
                        <button className="btn" onClick={()=>rmEntry(r.id)} title="Eliminar"><Trash2 size={16}/></button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      )}

      {tab==='fuel' && (
        <Card>
          <div style={{display:"flex",justifyContent:"space-between",marginBottom:8,gap:12,flexWrap:"wrap"}}>
            <div style={{display:"flex",gap:12}}>
              <button className="btn" onClick={addEntry}><PlusCircle size={16}/> Agregar día</button>
              <select value={vehicleId} onChange={(e)=>setVehicleId(e.target.value)} style={{padding:"8px 10px",border:"1px solid var(--color-border)",borderRadius:10,background:"#0e1526",color:"var(--color-text)"}}>
                <option value="">Sin vehículo</option>
                {vehicles.map(v=>(<option key={v.id} value={v.id}>{v.label}</option>))}
              </select>
            </div>
          </div>

          {isMobile ? (
            <div style={{display:'grid', gap:12}}>
              {entries.map(r=> (
                <Card key={r.id}>
                  <div style={{display:'grid', gap:10}}>
                    <div>
                      <label style={{color:'#6b7280',fontSize:12}}>Fecha</label>
                      <input type="date" value={r.date} onChange={e=>patchEntry(r.id,{date:e.target.value})}/>
                    </div>
                    <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:10}}>
                      <div>
                        <label style={{color:'#6b7280',fontSize:12}}>Km inicio</label>
                        <InputNum value={r.odometerStart||0} onChange={(v)=>{
                          const next:any = { odometerStart: v };
                          const veh = vehicles.find(vh => vh.id === (r.vehicleId || '')) || vehicles.find(vh=>vh.id===vehicleId);
                          const kmPerL = veh?.kmPerL || 0;
                          const kms = Math.max(0, (Number(r.odometerEnd)||0) - v);
                          if (kmPerL>0 && (Number(r.liters)||0)===0) {
                            const estLit = kms / kmPerL;
                            next.liters = estLit;
                            const ppl = Number(r.pricePerL)||0; if (ppl>0) next.fuelCLP = Math.round(estLit * ppl);
                          }
                          patchEntry(r.id,next);
                        }} />
                      </div>
                      <div>
                        <label style={{color:'#6b7280',fontSize:12}}>Km final</label>
                        <InputNum value={r.odometerEnd||0} onChange={(v)=>{
                          const next:any = { odometerEnd: v };
                          const veh = vehicles.find(vh => vh.id === (r.vehicleId || '')) || vehicles.find(vh=>vh.id===vehicleId);
                          const kmPerL = veh?.kmPerL || 0;
                          const kms = Math.max(0, v - (Number(r.odometerStart)||0));
                          if (kmPerL>0 && (Number(r.liters)||0)===0) {
                            const estLit = kms / kmPerL;
                            next.liters = estLit;
                            const ppl = Number(r.pricePerL)||0; if (ppl>0) next.fuelCLP = Math.round(estLit * ppl);
                          }
                          patchEntry(r.id,next);
                        }} />
                      </div>
                    </div>
                    <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:10}}>
                      <div>
                        <label style={{color:'#6b7280',fontSize:12}}>$ / L</label>
                        <InputNum value={r.pricePerL||0} onChange={(v)=>{
                          const next:any = { pricePerL: v };
                          const total = Number(r.fuelCLP)||0;
                          const liters = Number(r.liters)||0;
                          if (v>0 && total>0 && liters===0) next.liters = total / v; // litros = total / $/L
                          if (v>0 && liters>0) next.fuelCLP = Math.round(liters * v); // total = litros * $/L
                          patchEntry(r.id,next);
                        }} />
                      </div>
                      <div>
                        <label style={{color:'#6b7280',fontSize:12}}>Total CLP</label>
                        <InputNum value={r.fuelCLP} onChange={(v)=>{
                          const next:any = { fuelCLP: v };
                          const ppl = Number(r.pricePerL)||0;
                          const liters = Number(r.liters)||0;
                          if (ppl>0 && liters===0) next.liters = v / ppl; // litros = total / $/L
                          patchEntry(r.id,next);
                        }} />
                      </div>
                    </div>
                    <div>
                      <label style={{color:'#6b7280',fontSize:12}}>Litros</label>
                      <InputNum value={r.liters||0} onChange={(v)=>{
                        const next:any = { liters: v };
                        const ppl = Number(r.pricePerL)||0;
                        if (ppl>0) next.fuelCLP = Math.round(v * ppl); // total = litros * $/L
                        patchEntry(r.id,next);
                      }} />
                    </div>
                    <div>
                      <label style={{color:'#6b7280',fontSize:12}}>Estación</label>
                      <input value={r.station||''} onChange={e=>patchEntry(r.id,{station:e.target.value})} placeholder="Copec, Shell…"/>
                    </div>
                    <div>
                      {/* OCR: desactivado en móvil */}
                      <div className="upload" style={{textAlign:'left'}}>
                        <div style={{fontSize:14, fontWeight:700, marginBottom:6}}>OCR desactivado en móvil</div>
                        <div className="hint">Usa la entrada manual: <strong>$/L</strong> + <strong>Total</strong> → calculamos <strong>Litros</strong>.</div>
                      </div>
                    </div>
                    <div style={{display:'flex', justifyContent:'flex-end'}}>
                      <button className="btn" onClick={()=>rmEntry(r.id)} title="Eliminar"><Trash2 size={16}/> Eliminar</button>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          ) : (
            <div className="table-wrap">
              <table className="table" style={{fontSize:14}}>
                <thead>
                  <tr>
                    <th>Fecha</th><th>Km inicio</th><th>Km final</th><th>$/L</th><th>Total</th><th>Litros</th><th>Estación</th><th>Boleta</th><th></th>
                  </tr>
                </thead>
                <tbody>
                  {entries.map(r=> (
                    <tr key={r.id}>
                      <td><input type="date" value={r.date} onChange={e=>patchEntry(r.id,{date:e.target.value})}/></td>
                      <td>
                        <InputNum value={r.odometerStart||0} onChange={(v)=>{
                          const next:any = { odometerStart: v };
                          const veh = vehicles.find(vh => vh.id === (r.vehicleId || '')) || vehicles.find(vh=>vh.id===vehicleId);
                          const kmPerL = veh?.kmPerL || 0;
                          const kms = Math.max(0, (Number(r.odometerEnd)||0) - v);
                          if (kmPerL>0 && (Number(r.liters)||0)===0) {
                            const estLit = kms / kmPerL;
                            next.liters = estLit;
                            const ppl = Number(r.pricePerL)||0; if (ppl>0) next.fuelCLP = Math.round(estLit * ppl);
                          }
                          patchEntry(r.id,next);
                        }}/>
                      </td>
                      <td>
                        <InputNum value={r.odometerEnd||0} onChange={(v)=>{
                          const next:any = { odometerEnd: v };
                          const veh = vehicles.find(vh => vh.id === (r.vehicleId || '')) || vehicles.find(vh=>vh.id===vehicleId);
                          const kmPerL = veh?.kmPerL || 0;
                          const kms = Math.max(0, v - (Number(r.odometerStart)||0));
                          if (kmPerL>0 && (Number(r.liters)||0)===0) {
                            const estLit = kms / kmPerL;
                            next.liters = estLit;
                            const ppl = Number(r.pricePerL)||0; if (ppl>0) next.fuelCLP = Math.round(estLit * ppl);
                          }
                          patchEntry(r.id,next);
                        }}/>
                      </td>
                      <td>
                        <InputNum value={r.pricePerL||0} onChange={(v)=>{
                          const next:any = { pricePerL: v };
                          const total = Number(r.fuelCLP)||0;
                          const liters = Number(r.liters)||0;
                          if (v>0 && total>0 && liters===0) next.liters = total / v;
                          if (v>0 && liters>0) next.fuelCLP = Math.round(liters * v);
                          patchEntry(r.id,next);
                        }}/>
                      </td>
                      <td>
                        <InputNum value={r.fuelCLP} onChange={(v)=>{
                          const next:any = { fuelCLP: v };
                          const ppl = Number(r.pricePerL)||0;
                          const liters = Number(r.liters)||0;
                          if (ppl>0 && liters===0) next.liters = v / ppl;
                          patchEntry(r.id,next);
                        }}/>
                      </td>
                      <td>
                        <InputNum value={r.liters||0} onChange={(v)=>{
                          const next:any = { liters: v };
                          const ppl = Number(r.pricePerL)||0;
                          if (ppl>0) next.fuelCLP = Math.round(v * ppl);
                          patchEntry(r.id,next);
                        }}/>
                      </td>
                      <td><input value={r.station||''} onChange={e=>patchEntry(r.id,{station:e.target.value})} placeholder="Copec, Shell…"/></td>
                      <td>
                        {isMobile ? (
                          <div className="upload" style={{textAlign:'left'}}>
                            <div style={{fontSize:14, fontWeight:700, marginBottom:6}}>OCR desactivado en móvil</div>
                            <div className="hint">Usa la entrada manual: <strong>$/L</strong> + <strong>Total</strong> → calculamos <strong>Litros</strong>.</div>
                          </div>
                        ) : (
                          <label className="btn" style={{display:'inline-flex', alignItems:'center', gap:8}}>
                            Subir boleta (OCR)
                            <input type="file" accept="image/*,.jpg,.jpeg,.png,.webp" style={{display:'none'}}
                              onChange={async (e)=>{
  const file=e.target.files?.[0]; if(!file) return;
  setOcr(prev=>({...prev, [r.id]: { loading:true, error: undefined, info: undefined }}));
  try{
    const text=await ocrReceipt(file);
    const info=parseReceipt(text);
    const patch: Partial<Entry> = {};
    if (info.fechaISO) patch.date = info.fechaISO;
    if (info.litros) patch.liters = info.litros;
    if (info.precioPorLitro) patch.pricePerL = info.precioPorLitro;
    if (info.totalCLP) patch.fuelCLP = Math.round(info.totalCLP);
    else if ((info.litros||0) > 0 && (info.precioPorLitro||0) > 0) patch.fuelCLP = Math.round((info.litros||0)*(info.precioPorLitro||0));
    if (info.estacion) patch.station = info.estacion;
    patchEntry(r.id, patch);
    setOcr(prev=>({...prev, [r.id]: { loading:false, info }}));
  }catch(err){
    console.error('OCR error',err);
    setOcr(prev=>({...prev, [r.id]: { loading:false, error: 'No pude leer la boleta. Intenta con una foto nítida.' }}));
  }finally{ e.currentTarget.value=''; }
}}
                            />
                          </label>
                        )}
                        {(() => {
  const st = ocr[r.id];
  if (!st) return null;
  if (st.loading) return <div style={{fontSize:12,color:'#9ca3af',marginTop:6}}>Leyendo boleta…</div>;
  if (st.error) return <div style={{fontSize:12,color:'#ef4444',marginTop:6}}>{st.error}</div>;
  const i = st.info || {};
  return (
    <div className="card card--soft" style={{marginTop:6,padding:8,fontSize:12}}>
      <div style={{display:'flex',gap:8,flexWrap:'wrap'}}>
        {i.totalCLP!==undefined && <span className="badge">Total CLP: {Math.round(i.totalCLP).toLocaleString()}</span>}
        {i.precioPorLitro!==undefined && <span className="badge">$/L: {i.precioPorLitro}</span>}
        {i.litros!==undefined && <span className="badge">Litros: {i.litros}</span>}
        {i.estacion && <span className="badge">Estación: {i.estacion}</span>}
        {i.fechaISO && <span className="badge">Fecha: {i.fechaISO}</span>}
      </div>
    </div>
  );
})()}
                      </td>
                      <td style={{textAlign:'right'}}>
                        <button className="btn" onClick={()=>rmEntry(r.id)} title="Eliminar"><Trash2 size={16}/></button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
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
                      <input
                        type="number"
                        inputMode="decimal"
                        min={0}
                        step={1000}
                        value={g.targetCLP}
                        onChange={e=>setGoals(list=>list.map(x=>x.id===g.id?{...x, targetCLP:Number(e.target.value)}:x))}
                      />
                    </div>
                    <div>
                      <label style={{color:"#6b7280",fontSize:12}}>Ahorro actual (CLP)</label>
                      <input
                        type="number"
                        inputMode="decimal"
                        min={0}
                        step={1000}
                        value={g.savedCLP}
                        onChange={e=>setGoals(list=>list.map(x=>x.id===g.id?{...x, savedCLP:Number(e.target.value)}:x))}
                      />
                    </div>
                  </div>
                  <div style={{height:8, border:"1px solid var(--color-border)", borderRadius:999, overflow:"hidden", background:"var(--color-bg-card-soft)", marginTop:8}}>
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
                        setVehicles(list=>list.map(x=>{
                          if (x.id!==v.id) return x;
                          let next:any = { ...x, make };
                          // reset modelo si no pertenece
                          if (make && next.model && !(VEH_DB[make]?.includes(next.model))) {
                            next.model = '';
                          }
                          // si NO está en manual, intentar autocompletar desde specs
                          if (!next.manualSpecs && make && next.model) {
                            const spec = VEH_SPECS[make]?.[next.model];
                            if (spec) { next.engineL = spec.engineL; next.kmPerL = spec.kmPerL; }
                          }
                          return next;
                        }));
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
                      onChange={e=>{
                        const model = e.target.value;
                        setVehicles(list=>list.map(x=>{
                          if (x.id!==v.id) return x;
                          let next:any = { ...x, model };
                          if (!next.manualSpecs) {
                            const spec = VEH_SPECS[next.make || '']?.[model];
                            if (spec) { next.engineL = spec.engineL; next.kmPerL = spec.kmPerL; }
                          }
                          return next;
                        }));
                      }}
                      onBlur={e=>{
                        const model = e.target.value;
                        setVehicles(list=>list.map(x=>{
                          if (x.id!==v.id) return x;
                          if (x.manualSpecs) return { ...x, model };
                          const spec = VEH_SPECS[x.make || '']?.[model];
                          return spec ? { ...x, model, engineL: spec.engineL, kmPerL: spec.kmPerL } : { ...x, model };
                        }));
                      }}
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
                    <label style={{display:'flex',alignItems:'center',gap:8}}>
                      <input type="checkbox" checked={!!v.manualSpecs} onChange={e=>setVehicles(list=>list.map(x=>x.id===v.id?{...x,manualSpecs:e.target.checked}:x))}/>
                      Editar motor/rendimiento manualmente
                    </label>
                  </div>
                  <div>
                    <label style={{color:'#6b7280',fontSize:12}}>Motor (L)</label>
                    <input type="number" step="0.1" value={v.engineL||''} disabled={!v.manualSpecs} onChange={e=>setVehicles(list=>list.map(x=>x.id===v.id?{...x,engineL:Number(e.target.value)}:x))}/>
                  </div>
                  <div>
                    <label style={{color:'#6b7280',fontSize:12}}>Rendimiento (km/L)</label>
                    <input type="number" step="0.1" value={v.kmPerL||''} disabled={!v.manualSpecs} onChange={e=>setVehicles(list=>list.map(x=>x.id===v.id?{...x,kmPerL:Number(e.target.value)}:x))}/>
                  </div>
                  <div style={{gridColumn:"1 / -1", color:'#6b7280', fontSize:12}}>
                    {v.manualSpecs ? 'Ingresando especificaciones manualmente.' : 'Especificaciones cargadas automáticamente al elegir marca y modelo.'}
                  </div>
                  <div style={{gridColumn:"1 / -1"}}>
                    <label style={{color:"#6b7280",fontSize:12}}>Notas</label>
                    <input value={v.notes||''} onChange={e=>setVehicles(list=>list.map(x=>x.id===v.id?{...x,notes:e.target.value}:x))}/>
                  </div>
                </div>
                {(() => {
                  const current = entries.find(en => en.vehicleId === v.id);
                  const kms = current && current.odometerEnd && current.odometerStart ? Math.max(0, (current.odometerEnd||0) - (current.odometerStart||0)) : 0;
                  const estLitros = v.kmPerL && v.kmPerL>0 ? (kms / v.kmPerL) : 0;
                  return kms>0 && v.kmPerL ? (
                    <div style={{marginTop:8, color:'#6b7280', fontSize:12}}>
                      Estimado jornada: {kms.toFixed(1)} km ≈ {estLitros.toFixed(2)} L · ({v.kmPerL} km/L)
                    </div>
                  ) : null;
                })()}
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
              <input type="number" inputMode="decimal" step="0.01" min={0} max={1} value={settings.tax} onChange={e=>setSettings({...settings, tax:Number(e.target.value)})}/>
            </div>
            <div>
              <label style={{color:"#6b7280",fontSize:12}}>Mantención por hora (CLP)</label>
              <input type="number" inputMode="decimal" min={0} step={100} value={settings.maintPerHour} onChange={e=>setSettings({...settings, maintPerHour:Number(e.target.value)})}/>
            </div>
            <div style={{gridColumn:"1 / -1", display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:12}}>
              <label style={{display:"flex",gap:8,alignItems:"center",lineHeight:1.35}}>
                <input type="checkbox" checked={settings.incTax} onChange={e=>setSettings({...settings, incTax: e.target.checked})}/>
                Incluir 14% de Uber
              </label>
              <label style={{display:"flex",gap:8,alignItems:"center",lineHeight:1.35}}>
                <input type="checkbox" checked={settings.incFuel} onChange={e=>setSettings({...settings, incFuel: e.target.checked})}/>
                Incluir bencina
              </label>
              <label style={{display:"flex",gap:8,alignItems:"center",lineHeight:1.35}}>
                <input type="checkbox" checked={settings.incMaint} onChange={e=>setSettings({...settings, incMaint: e.target.checked})}/>
                Incluir mantención/h
              </label>
            </div>
            <div style={{gridColumn:"1 / -1", display:"flex", gap:12, alignItems:'center'}}>
              <label style={{display:'flex',gap:8,alignItems:'center'}}>
                <input type="checkbox" checked={settings.useFuelByKm} onChange={e=>setSettings({...settings, useFuelByKm: e.target.checked})}/>
                Usar costo de bencina estimado por km (si desactivas, se usa boleta)
              </label>
            </div>
            <div style={{gridColumn:"1 / -1"}}>
              <label style={{display:"flex",gap:8,alignItems:'center'}}>
                <input
                  type="checkbox"
                  checked={!!settings.subFixed}
                  onChange={e=>setSettings({...settings, subFixed: e.target.checked})}
                />
                Restar gastos fijos del Neto (usa el restante del mes)
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
            <span style={{color:"#6b7280"}}>Sesión: {(guser?.displayName || user?.name) || '—'} · {(guser?.email || user?.email) || '—'}</span>
            {guser ? (
              <button className="btn" onClick={googleSignOut}>Cerrar sesión Google</button>
            ) : (
              <button className="btn" onClick={()=>{ if(confirm('¿Cerrar sesión local? Tus datos permanecen en este dispositivo.')) setUser(null); }}>Cerrar sesión</button>
            )}
          </div>
        </Card>
      )}

      {isMobile && <MobileNav tab={tab} setTab={setTab} />}
      <div style={{marginTop:14,color:"#6b7280",fontSize:12}}>© Ubran — versión rápida offline</div>
    </div>
  );
}

/* --- UI helpers --- */
function Card({children}:{children:React.ReactNode}) {
  return <div className="card" style={{padding:14}}>{children}</div>;
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
function Costs({fuel, maint, tax, fixed=0, fuelMethod}:{fuel:number; maint:number; tax:number; fixed?: number; fuelMethod?: 'km'|'boleta'}) {
  return (
    <Card>
      <div style={{display:"flex",alignItems:"center",gap:6,color:"#6b7280",fontSize:12}}><Fuel size={16}/> Costos</div>
      <div style={{color:'#6b7280',fontSize:11,marginTop:2}}>Bencina por: {fuelMethod==='km' ? 'km (estimado)' : 'boleta'}</div>
      <Row k="Bencina" v={`CLP ${Math.round(fuel).toLocaleString()}`}/>
      <Row k="Mantención" v={`CLP ${Math.round(maint).toLocaleString()}`}/>
      {fixed>0 && <Row k="Fijos" v={`CLP ${Math.round(fixed).toLocaleString()}`}/>}
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
  return (
    <button onClick={onClick} className={`pill ${active ? 'pill--active' : ''}`}>{children}</button>
  );
}

function MobileDashboard(
  { totals, monthFuel, settings }:
  { totals: Totals; monthFuel: {clp:number; liters:number}; settings: typeof DEFAULT_SETTINGS }
){
  return (
    <div style={{display:'grid', gap:12}}>
      <Card>
        <div style={{color:'#9ca3af',fontSize:12}}>Neto real</div>
        <div style={{fontSize:28,fontWeight:800}}>CLP {Math.round(totals.net).toLocaleString()}</div>
        <div style={{color:'#9ca3af',fontSize:12}}>
          {(() => {
            const parts = [
              settings.incTax ? '14%' : null,
              settings.incFuel ? 'bencina' : null,
              settings.incMaint ? 'mantención' : null,
              settings.subFixed ? 'fijos' : null,
            ].filter(Boolean) as string[];
            return parts.length ? `Después de ${parts.join(' + ')}` : 'Sin descuentos aplicados';
          })()}
        </div>
      </Card>

      <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:12}}>
        <Card><div style={{color:'#9ca3af',fontSize:12}}>Horas</div><div style={{fontSize:22,fontWeight:800}}>{totals.hours.toFixed(1)}</div></Card>
        <Card><div style={{color:'#9ca3af',fontSize:12}}>Viajes</div><div style={{fontSize:22,fontWeight:800}}>{totals.trips}</div></Card>
      </div>

      <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:12}}>
        <Card><div style={{color:'#9ca3af',fontSize:12}}>Neto / hora</div><div style={{fontSize:22,fontWeight:800}}>CLP {Math.round(totals.netPerHour).toLocaleString()}</div></Card>
        <Card><div style={{color:'#9ca3af',fontSize:12}}>Bonos acumulados</div><div style={{fontSize:22,fontWeight:800}}>CLP {Math.round(totals.bonusAcc).toLocaleString()}</div></Card>
      </div>

      <Card>
        <div style={{display:'flex',justifyContent:'space-between',gap:16}}>
          <div>
            <div style={{color:'#9ca3af',fontSize:12}}>Bencina del mes</div>
            <div style={{fontSize:18,fontWeight:700}}>CLP {Math.round(monthFuel.clp).toLocaleString()}</div>
            <div style={{color:'#9ca3af',fontSize:12}}>{monthFuel.liters.toFixed(1)} L ({settings.useFuelByKm? 'estimado por km':'por boleta'})</div>
          </div>
          <div>
            <div style={{color:'#9ca3af',fontSize:12}}>Costos</div>
            <div style={{fontSize:12}}>Bencina: <strong>CLP {Math.round(totals.fuel).toLocaleString()}</strong></div>
            <div style={{fontSize:12}}>Mantención: <strong>CLP {Math.round(totals.maint).toLocaleString()}</strong></div>
            <div style={{fontSize:12}}>Impuesto: <strong>CLP {Math.round(totals.tax).toLocaleString()}</strong></div>
          </div>
        </div>
      </Card>
    </div>
  );
}

function MobileNav({ tab, setTab }:{ tab: any; setTab:(t:any)=>void }){
  return (
    <nav style={{position:'sticky',bottom:0,left:0,right:0,background:'var(--color-bg-card)',borderTop:'1px solid var(--color-border)',padding:8,display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:8}}>
      <button className={`pill ${tab==='dashboard'?'pill--active':''}`} onClick={()=>setTab('dashboard')}>Inicio</button>
      <button className={`pill ${tab==='data'?'pill--active':''}`} onClick={()=>setTab('data')}>Datos</button>
      <button className={`pill ${tab==='fuel'?'pill--active':''}`} onClick={()=>setTab('fuel')}>Bencina</button>
      <button className={`pill ${tab==='settings'?'pill--active':''}`} onClick={()=>setTab('settings')}>Ajustes</button>
    </nav>
  );
}