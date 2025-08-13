import { Timestamp } from 'firebase/firestore';

export interface User {
  id: string;
  name: string;
  email: string;
  createdAt: Timestamp;
  settings: UserSettings;
}

export interface UserSettings {
  tax: number;
  maintPerHour: number;
  incTax: boolean;
  incFuel: boolean;
  incMaint: boolean;
  useFuelByKm: boolean;
  subFixed: boolean;
  favPlace: string;
}

export interface Entry {
  id: string;
  userId: string;
  date: string;
  hours: number;
  trips: number;
  gross: number;
  cash: number;
  fuelCLP: number;
  odometerStart?: number;
  odometerEnd?: number;
  liters?: number;
  pricePerL?: number;
  station?: string;
  vehicleId?: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export interface Vehicle {
  id: string;
  userId: string;
  label: string;
  make?: string;
  model?: string;
  year?: number;
  engineL?: number;
  kmPerL?: number;
  manualSpecs?: boolean;
  notes?: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export interface Goal {
  id: string;
  userId: string;
  name: string;
  targetCLP: number;
  savedCLP: number;
  deadline?: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export interface FixedExpense {
  id: string;
  userId: string;
  name: string;
  amountCLP: number;
  paidCLP: number;
  dueDay?: number;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export interface Maintenance {
  id: string;
  userId: string;
  vehicleId: string;
  type: 'oil' | 'tires' | 'technical' | 'other';
  datePerformed: string;
  nextDueKm: number;
  nextDueDate: string;
  cost: number;
  notes: string;
  attachments: string[];
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export interface Route {
  id: string;
  userId: string;
  date: string;
  startLocation: {
    lat: number;
    lng: number;
  };
  endLocation: {
    lat: number;
    lng: number;
  };
  earnings: number;
  distance: number;
  duration: number;
  timeOfDay: string;
  rating: number;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export interface Statistics {
  id: string;
  userId: string;
  period: string; // YYYY-MM
  totalTrips: number;
  totalHours: number;
  grossIncome: number;
  netIncome: number;
  fuelCosts: number;
  avgKmPerL: number;
  totalKm: number;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}
