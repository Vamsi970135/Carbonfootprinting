export interface CalculatorState {
  // Energy
  electricity: number; // kWh/month
  gas: number; // Therms/month
  hasSolarOn: boolean;
  greenEnergyPlan: boolean;
  
  // Transport
  carMiles: number; // miles/week
  carType: 'gas' | 'diesel' | 'hybrid' | 'electric' | 'none';
  transitMiles: number; // miles/week
  shortFlights: number; // flights/year (under 3 hrs)
  mediumFlights: number; // flights/year (3-6 hrs)
  longFlights: number; // flights/year (over 6 hrs)
  
  // Food
  dietType: 'heavy-meat' | 'average-meat' | 'vegetarian' | 'vegan';
  localFood: number; // percentage (0 - 100)
  foodWaste: number; // percentage (0 - 100)
  
  // Lifestyle & Waste
  shoppingType: 'low' | 'moderate' | 'heavy';
  wasteBins: number; // bins/week
  recycling: {
    paper: boolean;
    plastic: boolean;
    glass: boolean;
    metal: boolean;
  };
  waterHabits: 'low' | 'moderate' | 'high';
}

export interface SavedFootprint {
  id: string;
  label: string;
  date: string;
  total: number;
  breakdown: {
    energy: number;
    transport: number;
    food: number;
    lifestyle: number;
  };
  state: CalculatorState;
}

export interface Pledge {
  id: string;
  title: string;
  description: string;
  category: string;
  saving: number;
  icon: any; // Type representation for Lucide Icon
}
