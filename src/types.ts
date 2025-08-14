export type Vehicle = {
  id: string;
  label: string;
  make?: string;
  model?: string;
  year?: number;
  engineL?: number;
  kmPerL?: number;
  manualSpecs?: boolean;
  notes?: string;
};

export type Entry = {
  id: string;
  date?: string;
  odometerStart?: number;
  odometerEnd?: number;
  vehicleId?: string;
  liters?: number;
  fuelCLP?: number;
  pricePerL?: number;
  hours?: number;
  trips?: number;
  gross?: number;
  cash?: number;
  station?: string;
};
export type Totals = {
  net: number;
  netPerHour: number;
  netPerTrip: number;
  trips: number;
  bonusAcc: number;
  fuel: number;
  maint: number;
  tax: number;
  fixedAdj: number;
  fuelMethod: 'km' | 'boleta';
  fuelByKmCLP: number;
  fuelUberLitersEst: number;
  gross: number;
  cash: number;
  postTax: number;
  hours: number;
};
