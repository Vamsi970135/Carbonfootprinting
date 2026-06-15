/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { 
  Leaf, 
  Zap, 
  Car, 
  Plane, 
  Utensils, 
  ShoppingBag, 
  Trash2, 
  CheckCircle2, 
  Award, 
  Trees, 
  TrendingDown, 
  Info, 
  Save, 
  Plus, 
  History, 
  RefreshCw, 
  Sparkles, 
  Droplets,
  ChevronRight,
  Flame,
  Globe,
  Sun,
  ShieldAlert,
  Sliders,
  History as HistoryIcon
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { CalculatorState, SavedFootprint } from './types';
import { DEFAULT_STATE, PLEDGES_DATA } from './data';

export default function App() {
  // STATE DEFINITIONS
  const [calcState, setCalcState] = useState<CalculatorState>(DEFAULT_STATE);
  const [activeTab, setActiveTab] = useState<'energy' | 'transport' | 'food' | 'lifestyle'>('energy');
  const [activeSidebarView, setActiveSidebarView] = useState<'dashboard' | 'calculator' | 'pledges' | 'offset' | 'history'>('dashboard');
  const [activePledges, setActivePledges] = useState<string[]>([]);
  const [savedRecords, setSavedRecords] = useState<SavedFootprint[]>([]);
  const [newLabelText, setNewLabelText] = useState('');
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [offsetSliderVal, setOffsetSliderVal] = useState(0); // Offset simulation percentage (0 - 100%)
  const [activeOffsetType, setActiveOffsetType] = useState<'reforestation' | 'wind' | 'methane'>('reforestation');
  const [notification, setNotification] = useState<string | null>(null);

  // Initialize and load saved records
  useEffect(() => {
    try {
      const stored = localStorage.getItem('eco_carbon_records');
      if (stored) {
        setSavedRecords(JSON.parse(stored));
      } else {
        // Seed initial record
        const seedRecord: SavedFootprint = {
          id: 'seed-1',
          label: 'Default Baseline Average',
          date: new Date(Date.now() - 30 * 24 * 60 * 60 * 1005).toLocaleDateString(),
          total: 8.84,
          breakdown: {
            energy: 2.72,
            transport: 3.54,
            food: 1.58,
            lifestyle: 1.00
          },
          state: DEFAULT_STATE,
        };
        setSavedRecords([seedRecord]);
        localStorage.setItem('eco_carbon_records', JSON.stringify([seedRecord]));
      }
    } catch (e) {
      console.error("Failed to load local storage", e);
    }
  }, []);

  const triggerToast = (msg: string) => {
    setNotification(msg);
    setTimeout(() => {
      setNotification((prev) => (prev === msg ? null : prev));
    }, 4000);
  };

  // CALCULATIONS MATHEMATICAL SCHEMES
  const getEnergyBaselineNum = () => {
    let electricityEmissions = calcState.electricity * 12 * 0.38 / 1000;
    if (calcState.greenEnergyPlan) {
      electricityEmissions = electricityEmissions * 0.15; // 85% renewable credit
    }
    const gasEmissions = calcState.gas * 12 * 5.3 / 1000;
    let total = electricityEmissions + gasEmissions;
    if (calcState.hasSolarOn) {
      total = Math.max(0.15, total - 1.25); // solar offsets up to 1.25t
    }
    return parseFloat(total.toFixed(2));
  };

  const getTransportBaselineNum = () => {
    let carFactor = 0.404; // standard gasoline average
    switch (calcState.carType) {
      case 'diesel': carFactor = 0.430; break;
      case 'hybrid': carFactor = 0.210; break;
      case 'electric': carFactor = 0.085; break;
      case 'none': carFactor = 0.000; break;
    }
    const carEmissions = calcState.carMiles * 52 * carFactor / 1000;
    const transitEmissions = calcState.transitMiles * 52 * 0.08 / 1000;
    const flightEmissions = 
      (calcState.shortFlights * 0.18) +   
      (calcState.mediumFlights * 0.45) +  
      (calcState.longFlights * 1.35);     

    return parseFloat((carEmissions + transitEmissions + flightEmissions).toFixed(2));
  };

  const getFoodBaselineNum = () => {
    let dietBase = 2.9;
    switch (calcState.dietType) {
      case 'heavy-meat': dietBase = 3.9; break;
      case 'vegetarian': dietBase = 1.7; break;
      case 'vegan': dietBase = 1.3; break;
    }
    const localDiscount = dietBase * (calcState.localFood / 100) * 0.18;
    const wasteAugment = dietBase * (calcState.foodWaste / 100) * 0.22;
    return parseFloat((dietBase - localDiscount + wasteAugment).toFixed(2));
  };

  const getLifestyleBaselineNum = () => {
    let shoppingBase = 1.25;
    if (calcState.shoppingType === 'low') shoppingBase = 0.55;
    if (calcState.shoppingType === 'heavy') shoppingBase = 2.50;

    const wasteBaseEmissions = calcState.wasteBins * 52 * 6.2 / 1000;
    let recyclingDiscount = 0;
    if (calcState.recycling.paper) recyclingDiscount += 0.05;
    if (calcState.recycling.plastic) recyclingDiscount += 0.05;
    if (calcState.recycling.glass) recyclingDiscount += 0.04;
    if (calcState.recycling.metal) recyclingDiscount += 0.06;

    const wasteTotal = Math.max(0.04, wasteBaseEmissions - recyclingDiscount);
    let waterEmissions = 0.22;
    if (calcState.waterHabits === 'low') waterEmissions = 0.08;
    if (calcState.waterHabits === 'high') waterEmissions = 0.38;

    return parseFloat((shoppingBase + wasteTotal + waterEmissions).toFixed(2));
  };

  const getActivePledgeSavings = () => {
    let energySavings = 0;
    let transportSavings = 0;
    let foodSavings = 0;
    let lifestyleSavings = 0;

    activePledges.forEach(id => {
      const p = PLEDGES_DATA.find(item => item.id === id);
      if (p) {
        if (p.category === 'energy') energySavings += p.saving;
        if (p.category === 'transport') transportSavings += p.saving;
        if (p.category === 'food') foodSavings += p.saving;
        if (p.category === 'waste' || p.category === 'lifestyle') lifestyleSavings += p.saving;
      }
    });

    return {
      energy: energySavings,
      transport: transportSavings,
      food: foodSavings,
      lifestyle: lifestyleSavings,
      total: energySavings + transportSavings + foodSavings + lifestyleSavings
    };
  };

  const savings = getActivePledgeSavings();

  const finalEnergy = Math.max(0.12, getEnergyBaselineNum() - savings.energy);
  const finalTransport = Math.max(0.0, getTransportBaselineNum() - savings.transport);
  const finalFood = Math.max(0.8, getFoodBaselineNum() - savings.food);
  const finalLifestyle = Math.max(0.15, getLifestyleBaselineNum() - savings.lifestyle);

  const baselineTotal = parseFloat((getEnergyBaselineNum() + getTransportBaselineNum() + getFoodBaselineNum() + getLifestyleBaselineNum()).toFixed(2));
  const activeUnroundedSum = finalEnergy + finalTransport + finalFood + finalLifestyle;
  const activeTotalEmissions = parseFloat(activeUnroundedSum.toFixed(2));

  const totalOffsetTons = parseFloat((activeTotalEmissions * (offsetSliderVal / 100)).toFixed(2));
  const finalNetEmissions = parseFloat((activeTotalEmissions - totalOffsetTons).toFixed(2));

  // Equivalencies calculations
  const treesRequiredToOffset = Math.ceil(activeTotalEmissions * 45.4);
  const singleFlightEquivalent = Math.ceil(activeTotalEmissions / 0.85);
  const averagePlasticStrawEmissionInBottles = Math.ceil(activeTotalEmissions * 12100);

  // Status mapping
  const getCarbonStatusDetails = (val: number) => {
    if (val <= 2.2) {
      return {
        label: 'Eco Champion',
        color: 'text-emerald-700 bg-emerald-50/80 border-emerald-250',
        barColor: 'bg-emerald-500',
        desc: 'Incredible! Your carbon footprint aligns with the Paris Agreement goal to keep global temperature rise under 1.5°C.',
        badge: '🏆 Global Standard'
      };
    } else if (val <= 5.5) {
      return {
        label: 'Low Impact Citizen',
        color: 'text-teal-700 bg-teal-50/80 border-teal-200',
        barColor: 'bg-teal-500',
        desc: 'Great job! Your footprint is under the European average and is close to sustainable planetary targets.',
        badge: '🌱 Planet Safe'
      };
    } else if (val <= 11.0) {
      return {
        label: 'Moderate Emitter',
        color: 'text-amber-700 bg-amber-50/80 border-amber-200',
        barColor: 'bg-amber-500',
        desc: 'You are on par with global western averages. Consider toggling more pledges to slash your baseline footprints.',
        badge: '⚠️ Average'
      };
    } else {
      return {
        label: 'High Carbon Consumer',
        color: 'text-rose-700 bg-rose-50/80 border-rose-200',
        barColor: 'bg-rose-500',
        desc: 'Your emissions exceed standard thresholds. High car commutes or frequent flights are driving your environmental impact.',
        badge: '⚡ High Impact'
      };
    }
  };

  const status = getCarbonStatusDetails(activeTotalEmissions);

  // SCENARIO SAVE TIMELINE HANDLERS
  const handleSaveScenario = () => {
    if (!newLabelText.trim()) {
      triggerToast("Please provide a distinct title label for this carbon record.");
      return;
    }
    const newRecord: SavedFootprint = {
      id: 'scen-' + Date.now(),
      label: newLabelText,
      date: new Date().toLocaleDateString() + ' ' + new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      total: activeTotalEmissions,
      breakdown: {
        energy: parseFloat(finalEnergy.toFixed(2)),
        transport: parseFloat(finalTransport.toFixed(2)),
        food: parseFloat(finalFood.toFixed(2)),
        lifestyle: parseFloat(finalLifestyle.toFixed(2)),
      },
      state: { ...calcState },
    };

    const updated = [newRecord, ...savedRecords];
    setSavedRecords(updated);
    localStorage.setItem('eco_carbon_records', JSON.stringify(updated));
    setNewLabelText('');
    setShowSaveModal(false);
    triggerToast(`Scenario "${newRecord.label}" successfully timestamped to snapshots timeline!`);
  };

  const deleteRecord = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const filtered = savedRecords.filter(r => r.id !== id);
    setSavedRecords(filtered);
    localStorage.setItem('eco_carbon_records', JSON.stringify(filtered));
    triggerToast("Scenario log deleted.");
  };

  const loadRecord = (record: SavedFootprint) => {
    setCalcState(record.state);
    triggerToast(`Restored inputs from label: "${record.label}"`);
  };

  const togglePledge = (id: string) => {
    let updated;
    if (activePledges.includes(id)) {
      updated = activePledges.filter(p => p !== id);
      triggerToast("Pledge unselected.");
    } else {
      updated = [...activePledges, id];
      triggerToast("🌿 Eco pledge activated! Dynamic scores adjusted.");
    }
    setActivePledges(updated);
  };

  // Preset Injectors
  const injectPreset = (type: 'green' | 'average' | 'high') => {
    if (type === 'green') {
      setCalcState({
        electricity: 180,
        gas: 15,
        hasSolarOn: true,
        greenEnergyPlan: true,
        carMiles: 40,
        carType: 'electric',
        transitMiles: 80,
        shortFlights: 0,
        mediumFlights: 0,
        longFlights: 0,
        dietType: 'vegan',
        localFood: 85,
        foodWaste: 5,
        shoppingType: 'low',
        wasteBins: 1,
        recycling: { paper: true, plastic: true, glass: true, metal: true },
        waterHabits: 'low',
      });
      setActivePledges(['led', 'solar', 'compost', 'thrift']);
      triggerToast("Injected Green Eco-Champion Preset!");
    } else if (type === 'average') {
      setCalcState(DEFAULT_STATE);
      setActivePledges([]);
      triggerToast("Reset state to Global Average Household parameters.");
    } else if (type === 'high') {
      setCalcState({
        electricity: 1100,
        gas: 95,
        hasSolarOn: false,
        greenEnergyPlan: false,
        carMiles: 380,
        carType: 'diesel',
        transitMiles: 0,
        shortFlights: 6,
        mediumFlights: 4,
        longFlights: 2,
        dietType: 'heavy-meat',
        localFood: 10,
        foodWaste: 45,
        shoppingType: 'heavy',
        wasteBins: 4,
        recycling: { paper: false, plastic: false, glass: false, metal: false },
        waterHabits: 'high',
      });
      setActivePledges([]);
      triggerToast("Injected Heavy Carbon Commuter Preset.");
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 font-sans flex flex-col md:flex-row selection:bg-emerald-100 selection:text-emerald-950">
      
      {/* Toast Notification notification container */}
      <AnimatePresence>
        {notification && (
          <motion.div 
            initial={{ opacity: 0, y: -45, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.95 }}
            className="fixed top-6 left-1/2 -translate-x-1/2 z-55 flex items-center gap-2.5 bg-slate-900 text-white px-5 py-3.5 rounded-2xl shadow-xl border border-slate-800 font-semibold text-xs"
          >
            <Sparkles className="w-4.5 h-4.5 text-emerald-400 animate-pulse" />
            <span>{notification}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* LEFT SIDEBAR COHESIVE NAVIGATION PANEL */}
      <aside className="w-full md:w-64 bg-white border-b md:border-b-0 md:border-r border-slate-200/80 p-5 flex flex-col justify-between shrink-0 md:h-screen md:sticky md:top-0 z-40 shadow-xs">
        <div className="space-y-6">
          {/* Logo Brand Header */}
          <div className="flex items-center gap-3 px-1 py-1">
            <div className="bg-gradient-to-tr from-emerald-600 to-teal-500 p-2.5 rounded-2xl shadow-md shadow-emerald-500/10 shrink-0">
              <Leaf className="w-5.5 h-5.5 text-white animate-pulse" />
            </div>
            <div>
              <h1 className="font-display font-extrabold text-base tracking-tight text-slate-900 leading-none">EcoSync</h1>
              <span className="text-[9px] font-mono font-bold text-slate-400 tracking-wider">CARBON ANALYST v3</span>
            </div>
          </div>

          {/* User Scorecard Avatar Status Block */}
          <div className="bg-slate-50 border border-slate-100 p-3 rounded-2xl flex items-center gap-3">
            <div className="bg-white p-2 rounded-xl text-slate-700 shadow-xs border border-slate-200/30">
              <Globe className="w-4 h-4 text-emerald-600" />
            </div>
            <div className="min-w-0">
              <p className="text-[9px] uppercase font-bold text-slate-400 tracking-wider">Assessment Status</p>
              <p className="text-xs font-black text-slate-900 truncate tracking-tight">{status.label}</p>
            </div>
          </div>

          {/* Tab Button Segmenters */}
          <div className="space-y-1">
            <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider px-2 block mb-2">Workspace Rooms</span>
            
            <button 
              onClick={() => setActiveSidebarView('dashboard')}
              className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-semibold tracking-wide transition-all ${
                activeSidebarView === 'dashboard' 
                  ? 'bg-slate-100 text-slate-900 font-bold border-l-3 border-slate-800 pl-2.5' 
                  : 'text-slate-500 hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              <span className="flex items-center gap-2.5">
                <Globe className="w-4 h-4" />
                <span>Dashboard Hub</span>
              </span>
              <span className="text-[9px] font-mono px-1.5 py-0.5 bg-slate-200 rounded text-slate-700 font-bold">{finalNetEmissions}t</span>
            </button>

            <button 
              onClick={() => setActiveSidebarView('calculator')}
              className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-semibold tracking-wide transition-all ${
                activeSidebarView === 'calculator' 
                  ? 'bg-slate-100 text-slate-900 font-bold border-l-3 border-slate-800 pl-2.5' 
                  : 'text-slate-500 hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              <span className="flex items-center gap-2.5">
                <Sliders className="w-4 h-4" />
                <span>Input Parameters</span>
              </span>
              <span className="text-[9px] px-1.5 py-0.5 bg-emerald-100 text-emerald-800 rounded font-bold">LIVE</span>
            </button>

            <button 
              onClick={() => setActiveSidebarView('pledges')}
              className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-semibold tracking-wide transition-all ${
                activeSidebarView === 'pledges' 
                  ? 'bg-slate-100 text-slate-900 font-bold border-l-3 border-slate-800 pl-2.5' 
                  : 'text-slate-500 hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              <span className="flex items-center gap-2.5">
                <CheckCircle2 className="w-4 h-4" />
                <span>Conscious Pledges</span>
              </span>
              <span className="text-[9px] font-mono px-1.5 py-0.5 bg-slate-200 rounded text-slate-700 font-bold">{activePledges.length}</span>
            </button>

            <button 
              onClick={() => setActiveSidebarView('offset')}
              className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-semibold tracking-wide transition-all ${
                activeSidebarView === 'offset' 
                  ? 'bg-slate-100 text-slate-900 font-bold border-l-3 border-slate-800 pl-2.5' 
                  : 'text-slate-500 hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              <span className="flex items-center gap-2.5">
                <Sparkles className="w-4 h-4" />
                <span>Offsets Simulator</span>
              </span>
              {offsetSliderVal > 0 && (
                <span className="text-[9px] font-mono px-1.5 py-0.5 bg-emerald-600 text-white rounded font-bold">{offsetSliderVal}%</span>
              )}
            </button>

            <button 
              onClick={() => setActiveSidebarView('history')}
              className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-semibold tracking-wide transition-all ${
                activeSidebarView === 'history' 
                  ? 'bg-slate-100 text-slate-900 font-bold border-l-3 border-slate-800 pl-2.5' 
                  : 'text-slate-500 hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              <span className="flex items-center gap-2.5">
                <HistoryIcon className="w-4 h-4" />
                <span>Scenarios History</span>
              </span>
              <span className="text-[9px] font-mono px-1.5 py-0.5 bg-slate-200 rounded text-slate-700 font-bold">{savedRecords.length}</span>
            </button>
          </div>
        </div>

        {/* Footprint Tracker Progress Bar on left */}
        <div className="pt-4 border-t border-slate-100 hidden md:block space-y-2">
          <div className="flex justify-between items-center text-[10px] text-slate-400 font-black uppercase tracking-wider">
            <span>Stable target</span>
            <span className="font-mono">&lt; 2.0 t/yr</span>
          </div>
          <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
            <div 
              className="bg-emerald-500 h-full transition-all duration-500" 
              style={{ width: `${Math.min(100, (2.0 / (finalNetEmissions || 1)) * 100)}%` }}
            />
          </div>
        </div>
      </aside>

      {/* RIGHT SIDE MAIN VIEW WRAPPER */}
      <div className="flex-1 flex flex-col md:h-screen md:overflow-y-auto">
        
        {/* UPPER TOOLBAR BAR */}
        <header className="bg-white border-b border-slate-200/80 px-6 py-4 flex flex-col sm:flex-row justify-between items-center gap-4 shrink-0 shadow-xs">
          <div className="flex flex-col">
            <div className="flex items-center gap-2 text-[10px] font-mono font-bold tracking-wider text-slate-400 uppercase">
              <span>Platform Space</span>
              <span>&gt;</span>
              <span className="text-slate-700 font-black">
                {activeSidebarView === 'dashboard' ? 'Dash Analytics' : 
                 activeSidebarView === 'calculator' ? 'Input Parameters' : 
                 activeSidebarView === 'pledges' ? 'Active Pledges' : 
                 activeSidebarView === 'offset' ? 'Climate Offsetting' : 
                 'Saved Scenarios'}
              </span>
            </div>
            <p className="text-[11px] text-slate-400 mt-0.5">Education modeling framework centered on standard EPA calculation formulas</p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5 bg-slate-50 border border-slate-100 p-1 rounded-2xl shrink-0">
            <span className="text-[9px] font-mono font-bold text-slate-400 uppercase tracking-widest px-2.5">Presets:</span>
            <button 
              onClick={() => injectPreset('green')}
              className="px-3 py-1 bg-white text-emerald-800 text-[10px] font-bold rounded-lg border border-slate-200/40 hover:bg-slate-100 transition-all cursor-pointer shadow-xs"
            >
              🌱 Champion
            </button>
            <button 
              onClick={() => injectPreset('average')}
              className="px-3 py-1 bg-white text-slate-700 text-[10px] font-bold rounded-lg border border-slate-200/40 hover:bg-slate-100 transition-all cursor-pointer shadow-xs"
            >
              👤 US/EU Avg
            </button>
            <button 
              onClick={() => injectPreset('high')}
              className="px-3 py-1 bg-white text-rose-800 text-[10px] font-bold rounded-lg border border-slate-200/40 hover:bg-slate-100 transition-all cursor-pointer shadow-xs"
            >
              ⚡ High Emitter
            </button>
          </div>
        </header>

        {/* PAGE CONTENT CONTAINER */}
        <main className="p-4 md:p-8 space-y-6 flex-1 max-w-7xl w-full mx-auto">
          
          {/* VIEW: DASHBOARD */}
          {activeSidebarView === 'dashboard' && (
            <div className="space-y-6 animate-fadeIn">
              
              {/* PRIMARY STAT CARD BENTO ROW */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                
                {/* Main Hero Card (Tons footprint + Equivalents) */}
                <div className="lg:col-span-8 relative overflow-hidden bg-slate-900 rounded-3xl p-6 md:p-8 text-white flex flex-col justify-between shadow-md border border-slate-800">
                  <div className="absolute right-0 bottom-0 pointer-events-none opacity-10 transform translate-y-6 translate-x-6">
                    <Leaf className="w-56 h-56 text-emerald-400" />
                  </div>
                  
                  <div className="relative z-10 space-y-3">
                    <div className="flex items-center gap-2">
                      <div className="bg-emerald-400/20 text-emerald-300 px-2 py-0.5 rounded-md text-[10px] font-mono font-extrabold tracking-widest uppercase">
                        REAL-TIME ANALYSIS
                      </div>
                      <span className="text-slate-400 text-xs">• Dynamic Planetary Breakdown</span>
                    </div>

                    <div className="space-y-1.5">
                      <p className="text-sm font-medium text-slate-300">Your Current Net Living Footprint</p>
                      <h2 className="text-4xl md:text-5xl font-display font-extrabold tracking-tight">
                        <span className="text-emerald-400 underline decoration-2 decoration-emerald-500/50 underline-offset-4">{finalNetEmissions}</span> <span className="text-xl md:text-2xl font-light text-slate-400">Metric Tons CO₂e/yr</span>
                      </h2>
                    </div>
                  </div>

                  {/* Status Banner Inside Hero */}
                  <div className={`p-4 rounded-2xl border mt-5 flex flex-col sm:flex-row gap-3 justify-between items-start sm:items-center ${status.color}`}>
                    <div className="space-y-0.5">
                      <div className="flex items-center gap-2">
                        <Award className="w-4.5 h-4.5 shrink-0" />
                        <span className="font-extrabold text-sm">{status.badge} - {status.label}</span>
                      </div>
                      <p className="text-xs leading-relaxed opacity-90 max-w-xl">{status.desc}</p>
                    </div>
                  </div>

                  {/* Equivalencies grid row */}
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 pt-6 mt-6 border-t border-slate-800/80">
                    <div className="space-y-0.5">
                      <span className="text-slate-400 text-[11px] flex items-center gap-1"><Trees className="w-4 h-4 text-emerald-400" /> Forest Offset</span>
                      <p className="text-lg font-mono text-emerald-300 font-bold">
                        {treesRequiredToOffset} <span className="text-xs font-sans text-slate-400 font-normal">trees</span>
                      </p>
                      <span className="text-[9px] text-slate-500 block leading-tight">required yearly absorption</span>
                    </div>
                    
                    <div className="space-y-0.5">
                      <span className="text-slate-400 text-[11px] flex items-center gap-1">✈️ Aviation Credit</span>
                      <p className="text-lg font-mono text-emerald-300 font-bold">
                        {singleFlightEquivalent} <span className="text-xs font-sans text-slate-400 font-normal">flights</span>
                      </p>
                      <span className="text-[9px] text-slate-500 block leading-tight">NY to London emissions</span>
                    </div>

                    <div className="col-span-2 sm:col-span-1 space-y-0.5">
                      <span className="text-slate-400 text-[11px] flex items-center gap-1">🥤 Plastic equivalent</span>
                      <p className="text-lg font-mono text-emerald-300 font-bold">
                        {averagePlasticStrawEmissionInBottles.toLocaleString()} <span className="text-xs font-sans text-slate-400 font-normal">bottles</span>
                      </p>
                      <span className="text-[9px] text-slate-500 block leading-tight">manufactured carbon load</span>
                    </div>
                  </div>
                </div>

                {/* Mitigation Stat Panel (Active Pledges Saving) */}
                <div className="lg:col-span-4 bg-white rounded-3xl p-6 shadow-xs border border-slate-200/80 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-2">
                        <TrendingDown className="w-4.5 h-4.5 text-emerald-600 animate-bounce" />
                        <h3 className="font-display font-extrabold text-slate-900 text-sm">Mitigation Progress</h3>
                      </div>
                      <span className="text-[9px] font-mono text-slate-400 font-bold bg-slate-50 px-2 py-0.5 rounded border border-slate-100">ANNUAL</span>
                    </div>

                    <div className="space-y-5">
                      <div>
                        <span className="text-slate-400 text-xs">Pledged Carbon Mitigated:</span>
                        <p className="text-3xl font-display font-extrabold text-slate-900 mt-1">
                          -{savings.total.toFixed(2)} <span className="text-xs font-sans text-slate-400 font-normal">t CO₂e/yr</span>
                        </p>
                      </div>

                      <div className="space-y-2.5">
                        <div className="flex justify-between text-xs font-bold text-slate-700">
                          <span>Pledged Avoided:</span>
                          <span className="font-mono text-emerald-700">{baselineTotal > 0 ? ((savings.total / baselineTotal) * 100).toFixed(0) : 0}% reduction</span>
                        </div>
                        <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                          <div 
                            className="bg-emerald-500 h-1.5 rounded-full transition-all duration-500"
                            style={{ width: `${Math.min(100, Math.max(3, (savings.total / (baselineTotal || 1)) * 100))}%` }}
                          />
                        </div>
                        <p className="text-[11px] text-slate-450 italic leading-relaxed">
                          By adopting <span className="font-bold text-slate-755">{activePledges.length} conscious pledges</span>, you prevent landfills methane decay and redundant fuel burn.
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="mt-8 pt-4 border-t border-slate-100 flex items-center justify-between">
                    <span className="text-xs text-slate-400 font-bold">Pledges checked: {activePledges.length}</span>
                    {activePledges.length > 0 && (
                      <button 
                        onClick={() => { setActivePledges([]); triggerToast("Cleared active eco pledges."); }}
                        className="text-xs font-black text-rose-500 hover:text-rose-700 flex items-center gap-1 cursor-pointer transition-colors"
                      >
                        <RefreshCw className="w-3.5 h-3.5" /> Clear All Pledges
                      </button>
                    )}
                  </div>
                </div>

              </div>

              {/* GAUGES BENTO COMPONENT GRID */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                
                {/* Circular Gauge card */}
                <div className="lg:col-span-7 bg-white rounded-3xl p-6 shadow-xs border border-slate-200/80 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="font-display font-extrabold text-slate-900 text-sm flex items-center gap-1.5">
                        <Globe className="w-4.5 h-4.5 text-slate-600" /> Planetary Carbon Index Dial
                      </h3>
                      <span className="text-[10px] font-mono text-slate-400 font-black">METER TONS</span>
                    </div>

                    <div className="flex flex-col items-center justify-center py-4 relative">
                      {/* Gauge Circle SVG */}
                      <svg className="w-44 h-44 drop-shadow-sm" viewBox="0 0 100 100">
                        <circle 
                          cx="50" 
                          cy="50" 
                          r="40" 
                          fill="transparent" 
                          stroke="#f1f5f9" 
                          strokeWidth="10" 
                        />
                        <circle 
                          cx="50" 
                          cy="50" 
                          r="40" 
                          fill="transparent" 
                          stroke={
                            activeTotalEmissions <= 2.2 ? '#10b981' : 
                            activeTotalEmissions <= 5.5 ? '#14b8a6' : 
                            activeTotalEmissions <= 11.0 ? '#f59e0b' : 
                            '#f43f5e' 
                          } 
                          strokeWidth="10" 
                          strokeDasharray="251.2"
                          strokeDashoffset={Math.max(12.5, 251.2 - (Math.min(24.5, activeTotalEmissions) / 24.5) * 251.2)}
                          strokeLinecap="round"
                          transform="rotate(-90 50 50)"
                          style={{ transition: 'stroke-dashoffset 0.8s cubic-bezier(0.16, 1, 0.3, 1), stroke 0.6s' }}
                        />
                      </svg>

                      {/* Display Numbers inside Circle */}
                      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-center mt-1">
                        <span className="text-[9px] uppercase tracking-wider text-slate-400 font-black">Total Net Score</span>
                        <p className="text-3xl font-display font-extrabold text-slate-900 font-mono mt-0.5 tracking-tighter">
                          {finalNetEmissions}
                        </p>
                        <span className="text-[10px] font-bold text-slate-400 block mt-0.5">tons CO₂e / yr</span>
                      </div>
                    </div>

                    {/* Gauge labels */}
                    <div className="w-full flex justify-between px-4 text-[9px] font-mono text-slate-400 font-semibold mb-6">
                      <span>0t (Paris Goal)</span>
                      <span>5.5t (EU Safe)</span>
                      <span>11.0t (Western Avg)</span>
                      <span>24t (High)</span>
                    </div>

                    {/* Details explanation */}
                    <div className="bg-slate-50 border border-slate-100 rounded-2xl p-4 flex gap-3 text-xs text-slate-650 leading-relaxed mt-2.5">
                      <div className="p-1 bg-white rounded-lg border border-slate-100 shadow-xs text-slate-700 animate-pulse">
                        <Info className="w-4 h-4 text-emerald-500" />
                      </div>
                      <p>
                        Current rating: <span className="font-extrabold text-slate-900">{status.label}</span>. Standard grid electricity averages 0.38 kg/kWh. Replacing vehicle fuel systems to hybrid or electric has the highest travel impact.
                      </p>
                    </div>
                  </div>

                  {/* Horizontal Segmenters Bar Breakdown */}
                  <div className="space-y-4 pt-6 mt-6 border-t border-slate-100">
                    <span className="text-[10px] font-black text-slate-400 block uppercase tracking-wider">Volumetric Impact Categories:</span>
                    
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {/* Energy */}
                      <div className="space-y-1.5">
                        <div className="flex justify-between text-xs font-bold text-slate-700">
                          <span className="flex items-center gap-1"><Zap className="w-3.5 h-3.5 text-emerald-600" /> Home Utilities</span>
                          <span className="font-mono text-slate-500">{finalEnergy.toFixed(2)} t</span>
                        </div>
                        <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                          <div className="bg-emerald-500 rounded-full h-full" style={{ width: `${Math.min(100, (finalEnergy / (activeTotalEmissions || 1)) * 100)}%` }} />
                        </div>
                      </div>

                      {/* Travel */}
                      <div className="space-y-1.5">
                        <div className="flex justify-between text-xs font-bold text-slate-700">
                          <span className="flex items-center gap-1"><Car className="w-3.5 h-3.5 text-emerald-600" /> Transport & Transit</span>
                          <span className="font-mono text-slate-500">{finalTransport.toFixed(2)} t</span>
                        </div>
                        <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                          <div className="bg-teal-500 rounded-full h-full" style={{ width: `${Math.min(100, (finalTransport / (activeTotalEmissions || 1)) * 100)}%` }} />
                        </div>
                      </div>

                      {/* Food */}
                      <div className="space-y-1.5">
                        <div className="flex justify-between text-xs font-bold text-slate-700">
                          <span className="flex items-center gap-1"><Utensils className="w-3.5 h-3.5 text-emerald-600" /> Agriculture & Diet</span>
                          <span className="font-mono text-slate-500">{finalFood.toFixed(2)} t</span>
                        </div>
                        <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                          <div className="bg-emerald-400 rounded-full h-full" style={{ width: `${Math.min(100, (finalFood / (activeTotalEmissions || 1)) * 100)}%` }} />
                        </div>
                      </div>

                      {/* Materials */}
                      <div className="space-y-1.5">
                        <div className="flex justify-between text-xs font-bold text-slate-700">
                          <span className="flex items-center gap-1"><ShoppingBag className="w-3.5 h-3.5 text-emerald-600" /> Consumer Lifestyle</span>
                          <span className="font-mono text-slate-500">{finalLifestyle.toFixed(2)} t</span>
                        </div>
                        <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                          <div className="bg-teal-400 rounded-full h-full" style={{ width: `${Math.min(100, (finalLifestyle / (activeTotalEmissions || 1)) * 100)}%` }} />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Benchmark Comparisons Panel */}
                <div className="lg:col-span-5 bg-white rounded-3xl p-6 shadow-xs border border-slate-200/80 flex flex-col justify-between">
                  <div className="space-y-5">
                    <div className="flex items-center justify-between">
                      <h4 className="font-display font-extrabold text-slate-900 text-sm">Global Benchmark Comparison</h4>
                      <span className="text-[9px] font-mono text-slate-400 font-bold uppercase tracking-widest bg-slate-50 px-2 py-0.5 rounded border border-slate-100">ANNUAL</span>
                    </div>

                    <div className="space-y-4 text-xs">
                      
                      {/* Stable Limit */}
                      <div className="space-y-1">
                        <div className="flex justify-between text-slate-500 text-[11px] font-semibold">
                          <span className="flex items-center gap-1.5">🏆 Paris Agreement Cap</span>
                          <strong className="text-emerald-600 font-mono">2.00 t</strong>
                        </div>
                        <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                          <div className="bg-emerald-500 h-full" style={{ width: '13.8%' }} />
                        </div>
                      </div>

                      {/* Your Net footprint */}
                      <div className="space-y-1 bg-slate-50/50 p-2.5 rounded-xl border border-slate-200/30">
                        <div className="flex justify-between text-slate-900 font-black text-[11px]">
                          <span className="flex items-center gap-1.5">📍 Your Custom Net Score</span>
                          <strong className="text-emerald-700 font-mono font-black">{finalNetEmissions} t</strong>
                        </div>
                        <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                          <div className="bg-gradient-to-r from-emerald-500 to-teal-400 h-full" style={{ width: `${Math.min(100, Math.max(5, (finalNetEmissions / 15) * 100))}%` }} />
                        </div>
                      </div>

                      {/* Global average */}
                      <div className="space-y-1">
                        <div className="flex justify-between text-slate-500 text-[11px] font-semibold">
                          <span className="flex items-center gap-1.5">🌍 Human Family Avg</span>
                          <strong className="text-slate-700 font-mono">4.70 t</strong>
                        </div>
                        <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                          <div className="bg-slate-400 h-full" style={{ width: '32.4%' }} />
                        </div>
                      </div>

                      {/* EU Avg */}
                      <div className="space-y-1">
                        <div className="flex justify-between text-slate-500 text-[11px] font-semibold">
                          <span className="flex items-center gap-1.5">🇪🇺 European Union Avg</span>
                          <strong className="text-slate-700 font-mono">6.50 t</strong>
                        </div>
                        <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                          <div className="bg-slate-400 h-full" style={{ width: '44.8%' }} />
                        </div>
                      </div>

                      {/* US Avg */}
                      <div className="space-y-1">
                        <div className="flex justify-between text-slate-500 text-[11px] font-semibold">
                          <span className="flex items-center gap-1.5">🇺🇸 United States Avg</span>
                          <strong className="text-slate-700 font-mono">14.50 t</strong>
                        </div>
                        <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                          <div className="bg-rose-400 h-full" style={{ width: '96.5%' }} />
                        </div>
                      </div>

                    </div>
                  </div>

                  <p className="text-[10px] text-slate-400 leading-normal italic pt-4 mt-8 border-t border-slate-100 text-center">
                    Multiple variables of lifestyle presets parsed directly out of EPA emissions catalog databases. Adjust parameters on the calculator tab.
                  </p>
                </div>

              </div>

            </div>
          )}

          {/* VIEW: CALCULATOR */}
          {activeSidebarView === 'calculator' && (
            <div className="space-y-6 animate-fadeIn">
              
              {/* LIVE EMITTER HEADER BLOCK */}
              <div className="bg-slate-900 text-white rounded-3xl p-6 shadow-md border border-slate-800 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 relative overflow-hidden">
                <div className="absolute right-0 bottom-0 pointer-events-none opacity-10">
                  <Sliders className="w-44 h-44 text-emerald-400" />
                </div>
                
                <div className="space-y-1 leading-none">
                  <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 text-[10px] font-mono font-extrabold tracking-widest uppercase">
                    REALTIME MODELER
                  </span>
                  <h3 className="font-display font-extrabold text-xl tracking-tight mt-1">
                    Calculate Living Footprints
                  </h3>
                  <p className="text-slate-400 text-xs">Sliding or selecting buttons calculates standard atmospheric greenhouse loads in real-time.</p>
                </div>

                <div className="flex items-center gap-4 bg-white/5 border border-white/10 p-3 rounded-2xl relative z-10 font-mono text-center shrink-0">
                  <div>
                    <span className="text-[9px] uppercase font-bold text-slate-400 tracking-wider">Baseline Emitter</span>
                    <p className="text-xl font-bold font-mono text-emerald-300 mt-0.5">{baselineTotal} t</p>
                  </div>
                  <div className="h-6 w-px bg-white/10" />
                  <div>
                    <span className="text-[9px] uppercase font-bold text-slate-400 tracking-wider">Actives Savings</span>
                    <p className="text-xl font-bold font-mono text-emerald-300 mt-0.5">-{savings.total.toFixed(2)} t</p>
                  </div>
                  <div className="h-6 w-px bg-white/10" />
                  <div>
                    <span className="text-[9px] uppercase font-bold text-slate-100 tracking-wider block bg-emerald-600 px-1 py-0.5 rounded text-[8px]">Net Emissions</span>
                    <p className="text-xl font-bold font-mono text-white mt-0.5">{finalNetEmissions} t</p>
                  </div>
                </div>
              </div>

              {/* BENTO BLOCK: FORM TABS & PRESETS */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                
                {/* Left Side: TAB CONSOLE (Span 8) */}
                <div className="lg:col-span-8 bg-white rounded-3xl shadow-xs border border-slate-200/80 overflow-hidden flex flex-col justify-between">
                  
                  {/* Category switcher tabs */}
                  <div className="grid grid-cols-4 bg-slate-50 border-b border-rose-50/20 p-2 gap-1.5 shrink-0">
                    {[
                      { key: 'energy', label: 'Energy ⚡', icon: Zap },
                      { key: 'transport', label: 'Travel 🚗', icon: Car },
                      { key: 'food', label: 'Nutrition 🥗', icon: Utensils },
                      { key: 'lifestyle', label: 'Lifestyle 🛍️', icon: ShoppingBag }
                    ].map((tab) => {
                      const TabIcon = tab.icon;
                      const isActive = activeTab === tab.key;
                      return (
                        <button
                          key={tab.key}
                          onClick={() => setActiveTab(tab.key as any)}
                          className={`py-3 px-1.5 rounded-xl font-display text-xs font-bold flex flex-col sm:flex-row items-center justify-center gap-1.5 transition-all text-center outline-none cursor-pointer ${
                            isActive 
                              ? 'bg-slate-900 text-white shadow-xs' 
                              : 'text-slate-650 hover:bg-slate-100 hover:text-slate-900'
                          }`}
                        >
                          <TabIcon className="w-4 h-4 shrink-0" />
                          <span className="hidden sm:inline">{tab.label}</span>
                          <span className="sm:hidden text-[9px] truncate">{tab.key}</span>
                        </button>
                      );
                    })}
                  </div>

                  {/* FORM RENDER AREA */}
                  <div className="p-6 md:p-8 flex-1">
                    <AnimatePresence mode="wait">
                      
                      {/* Energy Category */}
                      {activeTab === 'energy' && (
                        <motion.div
                          key="energy"
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -10 }}
                          className="space-y-6"
                        >
                          <div>
                            <h4 className="text-lg font-display font-extrabold text-slate-900 flex items-center gap-2">
                              Residential Heating & Utility Power <span>⚡</span>
                            </h4>
                            <p className="text-xs text-slate-400 mt-0.5">Control grid electricity variables and natural gas heating totals.</p>
                          </div>

                          {/* electricity slider */}
                          <div className="space-y-2 bg-gradient-to-r from-slate-50 to-slate-100/50 p-4 rounded-2xl border border-slate-100">
                            <div className="flex justify-between items-center text-xs font-semibold text-slate-700">
                              <label className="flex items-center gap-1.5">
                                <span>🔌 Month Electricity Consumption</span>
                              </label>
                              <span className="font-mono text-slate-800 font-bold bg-white px-2 py-0.5 rounded border border-slate-250">
                                {calcState.electricity} kWh /mo
                              </span>
                            </div>
                            <input 
                              type="range"
                              min="0"
                              max="1800"
                              step="20"
                              value={calcState.electricity}
                              onChange={(e) => setCalcState({...calcState, electricity: parseInt(e.target.value)})}
                              className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-slate-800"
                            />
                            <div className="flex justify-between text-[9px] text-slate-400 font-semibold font-mono">
                              <span>0 kWh (Off grid)</span>
                              <span>400 kWh (Europe Avg)</span>
                              <span>900 kWh (US Home Avg)</span>
                              <span>1800+ kWh (Heavy)</span>
                            </div>
                          </div>

                          {/* natural gas slider */}
                          <div className="space-y-2 bg-gradient-to-r from-slate-50 to-slate-100/50 p-4 rounded-2xl border border-slate-100">
                            <div className="flex justify-between items-center text-xs font-semibold text-slate-700">
                              <label className="flex items-center gap-1.5">
                                <Flame className="w-4 h-4 text-orange-550 shrink-0" />
                                <span>🔥 Heating Thermal Consumption</span>
                              </label>
                              <span className="font-mono text-slate-800 font-bold bg-white px-2 py-0.5 rounded border border-slate-250">
                                {calcState.gas} Therms /mo
                              </span>
                            </div>
                            <input 
                              type="range"
                              min="0"
                              max="240"
                              step="5"
                              value={calcState.gas}
                              onChange={(e) => setCalcState({...calcState, gas: parseInt(e.target.value)})}
                              className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-slate-800"
                            />
                            <div className="flex justify-between text-[9px] text-slate-400 font-semibold font-mono">
                              <span>0 (None / Heatpump)</span>
                              <span>30 (Small apartment)</span>
                              <span>100 (Medium Home Avg)</span>
                              <span>240+ (Heavy boiler)</span>
                            </div>
                          </div>

                          {/* Green tariff options */}
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            
                            {/* Option 1: Green Power Plan */}
                            <div 
                              onClick={() => {
                                const newVal = !calcState.greenEnergyPlan;
                                setCalcState({...calcState, greenEnergyPlan: newVal});
                                triggerToast(newVal ? "Switched power tariff to certifiable green sources (85% reduction applied)!" : "Green grid tariff disabled.");
                              }}
                              className={`p-4 rounded-2xl cursor-pointer border transition-all ${
                                calcState.greenEnergyPlan 
                                  ? 'bg-emerald-50/40 border-emerald-500/30 shadow-xs' 
                                  : 'bg-white border-slate-200 text-slate-600 hover:border-slate-300'
                              }`}
                            >
                              <div className="flex justify-between items-center mb-2">
                                <span className="bg-emerald-100 text-emerald-800 p-1.5 rounded-lg">
                                  <Leaf className="w-4.5 h-4.5 text-emerald-700" />
                                </span>
                                <div className={`w-8 h-4 rounded-full p-0.5 transition-colors ${
                                  calcState.greenEnergyPlan ? 'bg-emerald-600' : 'bg-slate-300'
                                }`}>
                                  <div className={`w-3 h-3 rounded-full bg-white transition-all ${
                                    calcState.greenEnergyPlan ? 'translate-x-4' : 'translate-x-0'
                                  }`} />
                                </div>
                              </div>
                              <h5 className="font-bold text-xs text-slate-900">Green Utility Tariff</h5>
                              <p className="text-[10px] text-slate-400 mt-1">Utility contract is powered primarily by certifiable wind or grid photovoltaic source allocations.</p>
                            </div>

                            {/* Option 2: Rooftop Solar panels */}
                            <div 
                              onClick={() => {
                                const newVal = !calcState.hasSolarOn;
                                setCalcState({
                                  ...calcState, 
                                  hasSolarOn: newVal, 
                                  greenEnergyPlan: newVal ? true : calcState.greenEnergyPlan
                                });
                                triggerToast(newVal ? "Rooftop Solar arrays active! Severe Carbon reduction offsets applied." : "Solar installation turned off.");
                              }}
                              className={`p-4 rounded-2xl cursor-pointer border transition-all ${
                                calcState.hasSolarOn 
                                  ? 'bg-emerald-50/40 border-emerald-500/30 shadow-xs' 
                                  : 'bg-white border-slate-200 text-slate-600 hover:border-slate-300'
                              }`}
                            >
                              <div className="flex justify-between items-center mb-2">
                                <span className="bg-amber-100 text-amber-800 p-1.5 rounded-lg">
                                  <Sun className="w-4.5 h-4.5 text-amber-700" />
                                </span>
                                <div className={`w-8 h-4 rounded-full p-0.5 transition-colors ${
                                  calcState.hasSolarOn ? 'bg-emerald-600' : 'bg-slate-300'
                                }`}>
                                  <div className={`w-3 h-3 rounded-full bg-white transition-all ${
                                    calcState.hasSolarOn ? 'translate-x-4' : 'translate-x-0'
                                  }`} />
                                </div>
                              </div>
                              <h5 className="font-bold text-xs text-slate-900">Rooftop Solar hardware</h5>
                              <p className="text-[10px] text-slate-400 mt-1">Active rooftop clean solar array panels feeding clean energy into core grid offsets.</p>
                            </div>

                          </div>
                        </motion.div>
                      )}

                      {/* Travel Category */}
                      {activeTab === 'transport' && (
                        <motion.div
                          key="transport"
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -10 }}
                          className="space-y-6"
                        >
                          <div>
                            <h4 className="text-lg font-display font-extrabold text-slate-900 flex items-center gap-2">
                              Automotive transit & Commercial jetflights <span>🚗</span>
                            </h4>
                            <p className="text-xs text-slate-400 mt-0.5">Configure your daily commute segments and annual roundtrip airlines travel.</p>
                          </div>

                          {/* Primary Commute Vehicle buttons selector */}
                          <div className="space-y-2.5">
                            <label className="text-xs font-bold text-slate-700 block">🚘 Commute Vehicle Engine Grid</label>
                            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                              {[
                                { key: 'gas', title: 'Petrol Engine', short: 'Petrol base', icon: '⛽' },
                                { key: 'diesel', title: 'Diesel Car', short: 'Heavy emitter', icon: '🛢️' },
                                { key: 'hybrid', title: 'Hybrid Engine', short: 'High efficiency', icon: '🔌' },
                                { key: 'electric', title: 'Electric EV', short: 'Clean grid', icon: '⚡' },
                                { key: 'none', title: 'No Vehicle', short: 'Bicycle/Transit', icon: '🚲' }
                              ].map((item) => (
                                <button
                                  key={item.key}
                                  onClick={() => {
                                    setCalcState({...calcState, carType: item.key as any});
                                    triggerToast(`Commute vehicle updated: ${item.title}`);
                                  }}
                                  className={`p-2.5 rounded-xl border text-center transition-all cursor-pointer ${
                                    calcState.carType === item.key 
                                      ? 'bg-slate-100 border-slate-900 font-bold' 
                                      : 'bg-white border-slate-200 hover:bg-slate-50'
                                  }`}
                                >
                                  <span className="text-lg block mb-1">{item.icon}</span>
                                  <span className="block font-bold text-[10px] text-slate-900 leading-tight truncate">{item.title}</span>
                                  <span className="block text-[8px] text-slate-400 mt-0.5">{item.short}</span>
                                </button>
                              ))}
                            </div>
                          </div>

                          {/* Weekly mileage slider if passenger type is car */}
                          {calcState.carType !== 'none' && (
                            <div className="space-y-2 bg-gradient-to-r from-slate-50 to-slate-100/50 p-4 rounded-2xl border border-slate-100">
                              <div className="flex justify-between items-center text-xs font-semibold text-slate-700">
                                <span>🚗 Passenger driving miles / week</span>
                                <span className="font-mono text-slate-800 font-bold bg-white px-2 py-0.5 rounded border border-slate-250">
                                  {calcState.carMiles} miles / wk
                                </span>
                              </div>
                              <input 
                                type="range"
                                min="0"
                                max="650"
                                step="10"
                                value={calcState.carMiles}
                                onChange={(e) => setCalcState({...calcState, carMiles: parseInt(e.target.value)})}
                                className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-slate-800"
                              />
                            </div>
                          )}

                          {/* Public transport mileage */}
                          <div className="space-y-2 bg-gradient-to-r from-slate-50 to-slate-100/50 p-4 rounded-2xl border border-slate-100">
                            <div className="flex justify-between items-center text-xs font-semibold text-slate-700">
                              <span>🚇 Bus & Metropolitan railways transit</span>
                              <span className="font-mono text-slate-800 font-bold bg-white px-2 py-0.5 rounded border border-slate-250">
                                {calcState.transitMiles} miles / wk
                              </span>
                            </div>
                            <input 
                              type="range"
                              min="0"
                              max="300"
                              step="5"
                              value={calcState.transitMiles}
                              onChange={(e) => setCalcState({...calcState, transitMiles: parseInt(e.target.value)})}
                              className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-slate-800"
                            />
                          </div>

                          {/* Aviation Segment Counters */}
                          <div className="space-y-2.5">
                            <label className="text-xs font-bold text-slate-700 block">✈️ Flying volume (Airlines roundtrips annually)</label>
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                              
                              {/* Short */}
                              <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-100 text-center font-sans">
                                <span className="block text-[11px] font-bold text-slate-500">Short Haul (&lt;3h)</span>
                                <span className="block text-base font-extrabold text-slate-900 mt-1">{calcState.shortFlights} flights/yr</span>
                                <div className="flex justify-center gap-2.5 mt-2">
                                  <button onClick={() => setCalcState({...calcState, shortFlights: Math.max(0, calcState.shortFlights - 1)})} className="w-6 h-6 rounded-full bg-white shadow-xs border border-slate-200 font-bold text-xs hover:bg-slate-55">-</button>
                                  <button onClick={() => setCalcState({...calcState, shortFlights: calcState.shortFlights + 1})} className="w-6 h-6 rounded-full bg-white shadow-xs border border-slate-200 font-bold text-xs hover:bg-slate-55">+</button>
                                </div>
                              </div>

                              {/* Medium */}
                              <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-100 text-center font-sans">
                                <span className="block text-[11px] font-bold text-slate-500">Medium Haul (3-6h)</span>
                                <span className="block text-base font-extrabold text-slate-900 mt-1">{calcState.mediumFlights} flights/yr</span>
                                <div className="flex justify-center gap-2.5 mt-2">
                                  <button onClick={() => setCalcState({...calcState, mediumFlights: Math.max(0, calcState.mediumFlights - 1)})} className="w-6 h-6 rounded-full bg-white shadow-xs border border-slate-200 font-bold text-xs hover:bg-slate-55">-</button>
                                  <button onClick={() => setCalcState({...calcState, mediumFlights: calcState.mediumFlights + 1})} className="w-6 h-6 rounded-full bg-white shadow-xs border border-slate-200 font-bold text-xs hover:bg-slate-55">+</button>
                                </div>
                              </div>

                              {/* Long */}
                              <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-100 text-center font-sans">
                                <span className="block text-[11px] font-bold text-slate-500">Long Haul (&gt;6h)</span>
                                <span className="block text-base font-extrabold text-slate-900 mt-1">{calcState.longFlights} flights/yr</span>
                                <div className="flex justify-center gap-2.5 mt-2">
                                  <button onClick={() => setCalcState({...calcState, longFlights: Math.max(0, calcState.longFlights - 1)})} className="w-6 h-6 rounded-full bg-white shadow-xs border border-slate-200 font-bold text-xs hover:bg-slate-55">-</button>
                                  <button onClick={() => setCalcState({...calcState, longFlights: calcState.longFlights + 1})} className="w-6 h-6 rounded-full bg-white shadow-xs border border-slate-200 font-bold text-xs hover:bg-slate-55">+</button>
                                </div>
                              </div>

                            </div>
                          </div>
                        </motion.div>
                      )}

                      {/* Nutrition Category */}
                      {activeTab === 'food' && (
                        <motion.div
                          key="food"
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -10 }}
                          className="space-y-6"
                        >
                          <div>
                            <h4 className="text-lg font-display font-extrabold text-slate-900 flex items-center gap-2">
                              Diet presets, organic routing & local sourcing <span>🥗</span>
                            </h4>
                            <p className="text-xs text-slate-400 mt-0.5">Agriculture and livestock options play crucial roles in global protein greenhouse footprints.</p>
                          </div>

                          {/* Diet buttons */}
                          <div className="space-y-2.5">
                            <label className="text-xs font-bold text-slate-700 block">🥩 Meal protein profiles</label>
                            <div className="grid grid-cols-1 sm:grid-cols-4 gap-2.5">
                              {[
                                { key: 'heavy-meat', title: 'Heavy Beef/Meat', short: '🥩 Regular beef consumption', load: 'Heavy carbon' },
                                { key: 'average-meat', title: 'Average Omnivore', short: '🍗 Standard poultry/pig', load: 'Moderate carbon' },
                                { key: 'vegetarian', title: 'Vegetarian Base', short: '🍳 Eggs and dairy habits', load: 'Eco efficient' },
                                { key: 'vegan', title: 'Plant-Based', short: '🥬 Zero animal proteins', load: 'Paris standard' }
                              ].map((item) => (
                                <button
                                  key={item.key}
                                  onClick={() => {
                                    setCalcState({...calcState, dietType: item.key as any});
                                    triggerToast(`Diet presets applied: ${item.title}`);
                                  }}
                                  className={`p-3 rounded-xl border text-left flex flex-col justify-between transition-all cursor-pointer ${
                                    calcState.dietType === item.key 
                                      ? 'bg-slate-100 border-slate-900 font-bold shadow-xs' 
                                      : 'bg-white border-slate-200 hover:bg-slate-50'
                                  }`}
                                >
                                  <div>
                                    <span className="block font-bold text-[10px] text-slate-900 leading-none">{item.title}</span>
                                    <span className="block text-[8px] text-slate-400 mt-1 leading-relaxed">{item.short}</span>
                                  </div>
                                  <span className="inline-block mt-2.5 font-mono text-[8px] px-1 py-0.5 bg-slate-200 text-slate-700 rounded-md font-bold max-w-max leading-none">{item.load}</span>
                                </button>
                              ))}
                            </div>
                          </div>

                          {/* Organic / Local sourcing percentages */}
                          <div className="space-y-2 bg-gradient-to-r from-slate-50 to-slate-100/50 p-4 rounded-2xl border border-slate-100">
                            <div className="flex justify-between items-center text-xs font-semibold text-slate-700">
                              <span>🚜 Sourced organic/locally grown veggies</span>
                              <span className="font-mono text-slate-800 font-bold bg-white px-2 py-0.5 rounded border border-slate-250">
                                {calcState.localFood}% local
                              </span>
                            </div>
                            <input 
                              type="range"
                              min="0"
                              max="100"
                              step="5"
                              value={calcState.localFood}
                              onChange={(e) => setCalcState({...calcState, localFood: parseInt(e.target.value)})}
                              className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-slate-800"
                            />
                            <div className="flex justify-between text-[9px] text-slate-400 font-semibold font-mono">
                              <span>0% (Imported goods)</span>
                              <span>25% (Supermarkets avg)</span>
                              <span>60% (Organic market)</span>
                              <span>100% (Fully local)</span>
                            </div>
                          </div>

                          {/* Food waste percentage scale */}
                          <div className="space-y-2 bg-gradient-to-r from-slate-50 to-slate-100/50 p-4 rounded-2xl border border-slate-100">
                            <div className="flex justify-between items-center text-xs font-semibold text-slate-700">
                              <span>🗑️ Kitchen organic leftovers decay waste</span>
                              <span className="font-mono text-slate-800 font-bold bg-white px-2 py-0.5 rounded border border-slate-250">
                                {calcState.foodWaste}% waste
                              </span>
                            </div>
                            <input 
                              type="range"
                              min="0"
                              max="60"
                              step="5"
                              value={calcState.foodWaste}
                              onChange={(e) => setCalcState({...calcState, foodWaste: parseInt(e.target.value)})}
                              className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-slate-800"
                            />
                            <div className="flex justify-between text-[9px] text-slate-400 font-semibold font-mono">
                              <span>0% (Zero compost goal)</span>
                              <span>15% (Standard family)</span>
                              <span>35% (High spoilage)</span>
                              <span>60% (High discard)</span>
                            </div>
                          </div>
                        </motion.div>
                      )}

                      {/* Lifestyle Category */}
                      {activeTab === 'lifestyle' && (
                        <motion.div
                          key="lifestyle"
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -10 }}
                          className="space-y-6"
                        >
                          <div>
                            <h4 className="text-lg font-display font-extrabold text-slate-900 flex items-center gap-2">
                              Consumer goods, water footprints & recycling <span>🛍️</span>
                            </h4>
                            <p className="text-xs text-slate-400 mt-0.5">Manufacturing, textile fast fashion, and metal ores have high incorporated carbon footprints.</p>
                          </div>

                          {/* Shopping Frequency */}
                          <div className="space-y-2.5">
                            <label className="text-xs font-bold text-slate-705 block">🛍️ Consumables Thrifting / Purchase Habit</label>
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                              {[
                                { key: 'low', title: 'Minimalist & Thrifted', short: 'Purchase only essentials, regular clothing reuse', rating: '-0.70 t' },
                                { key: 'moderate', title: 'Average consumer', short: 'Standard electronics, wardrobe updates', rating: 'Baseline factor' },
                                { key: 'heavy', title: 'Heavy fast fashion client', short: 'Regular electronics upgrades and imports', rating: '+1.25 t' }
                              ].map((item) => (
                                <button
                                  key={item.key}
                                  onClick={() => {
                                    setCalcState({...calcState, shoppingType: item.key as any});
                                    triggerToast(`Shopping habit adjusted: ${item.title}`);
                                  }}
                                  className={`p-3.5 rounded-xl border text-left flex flex-col justify-between transition-all cursor-pointer ${
                                    calcState.shoppingType === item.key 
                                      ? 'bg-slate-100 border-slate-900 font-bold shadow-xs' 
                                      : 'bg-white border-slate-200 hover:bg-slate-50'
                                  }`}
                                >
                                  <div>
                                    <span className="block font-bold text-[10px] text-slate-900 leading-tight">{item.title}</span>
                                    <span className="block text-[8px] text-slate-400 mt-1 leading-normal">{item.short}</span>
                                  </div>
                                  <span className="inline-block mt-3 text-[8px] font-mono font-bold text-slate-600 bg-slate-200 px-1.5 py-0.5 rounded max-w-max">{item.rating}</span>
                                </button>
                              ))}
                            </div>
                          </div>

                          {/* Trash bins */}
                          <div className="space-y-2 bg-gradient-to-r from-slate-50 to-slate-100/50 p-4 rounded-2xl border border-slate-100">
                            <div className="flex justify-between items-center text-xs font-semibold text-slate-705">
                              <span className="flex items-center gap-1.5"><Trash2 className="w-4 h-4 text-slate-400 shrink-0" /> Weekly landfill bins loaded</span>
                              <span className="font-mono text-slate-800 font-bold bg-white px-2 py-0.5 rounded border border-slate-250">
                                {calcState.wasteBins} bins / wk
                              </span>
                            </div>
                            <input 
                              type="range"
                              min="0"
                              max="8"
                              step="1"
                              value={calcState.wasteBins}
                              onChange={(e) => setCalcState({...calcState, wasteBins: parseInt(e.target.value)})}
                              className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-slate-800"
                            />
                          </div>

                          {/* Active recycling categories checkboxes */}
                          <div className="space-y-2.5">
                            <label className="text-xs font-bold text-slate-750 block">♻️ Daily active sorting & recycling routines</label>
                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                              {[
                                { key: 'paper', title: 'Paper/Carton', desc: '-50kg CO₂', icon: '📰' },
                                { key: 'plastic', title: 'Plastics/Bottles', desc: '-50kg CO₂', icon: '🥤' },
                                { key: 'glass', title: 'Glass Jar sorting', desc: '-40kg CO₂', icon: '🍾' },
                                { key: 'metal', title: 'Alum Cans/Tin', desc: '-60kg CO₂', icon: '🥫' }
                              ].map((item) => {
                                const isChecked = (calcState.recycling as any)[item.key];
                                return (
                                  <button
                                    key={item.key}
                                    onClick={() => {
                                      const updatedCheck = {
                                        ...calcState.recycling,
                                        [item.key]: !isChecked
                                      };
                                      setCalcState({...calcState, recycling: updatedCheck});
                                      triggerToast(`${isChecked ? 'Disabled' : 'Activated'} selective sorting pledge for: ${item.title}`);
                                    }}
                                    className={`p-3 rounded-xl border text-center transition-all cursor-pointer ${
                                      isChecked 
                                        ? 'bg-emerald-50 text-emerald-800 border-emerald-550/30' 
                                        : 'bg-white border-slate-200 hover:bg-slate-50'
                                    }`}
                                  >
                                    <span className="block text-lg mb-1 leading-none">{item.icon}</span>
                                    <span className="block text-[10px] font-bold text-slate-900 leading-tight">{item.title}</span>
                                    <span className="inline-block mt-1 font-mono text-[8px] bg-slate-100 text-slate-650 px-1 py-0.5 rounded border border-slate-200/50 font-bold">{item.desc}</span>
                                  </button>
                                );
                              })}
                            </div>
                          </div>

                          {/* Water Habits select buttons */}
                          <div className="space-y-2.5">
                            <label className="text-xs font-bold text-slate-705 block flex items-center gap-1"><Droplets className="w-3.5 h-3.5 text-blue-500 shrink-0" /> Domestic hot water shower profiles</label>
                            <div className="grid grid-cols-3 gap-2.5">
                              {[
                                { key: 'low', title: 'Eco conscious flow', desc: 'Short showers, cold washes', rating: '0.08 t/yr' },
                                { key: 'moderate', title: 'Standard flow average', desc: 'Symmetrical washes, typical flow', rating: '0.22 t/yr' },
                                { key: 'high', title: 'High flow / Hot baths', desc: 'Spa, long routines, high gallons', rating: '0.38 t/yr' }
                              ].map((item) => (
                                <button
                                  key={item.key}
                                  onClick={() => {
                                    setCalcState({...calcState, waterHabits: item.key as any});
                                    triggerToast(`Water consumption habit: ${item.title}`);
                                  }}
                                  className={`p-2.5 text-center rounded-xl border transition-all cursor-pointer text-xs ${
                                    calcState.waterHabits === item.key 
                                      ? 'bg-slate-100 border-slate-900 font-bold font-sans' 
                                      : 'bg-white border-slate-200 hover:bg-slate-50'
                                  }`}
                                >
                                  <span className="block font-bold text-[10px] text-slate-900 leading-tight">{item.title}</span>
                                  <span className="block text-[8px] text-slate-400 mt-0.5 leading-normal">{item.desc}</span>
                                  <span className="inline-block mt-2 font-mono text-[8px] text-slate-600 bg-slate-200 px-1.5 py-0.5 rounded font-black">{item.rating}</span>
                                </button>
                              ))}
                            </div>
                          </div>
                        </motion.div>
                      )}

                    </AnimatePresence>
                  </div>

                  {/* BOTTOM CAPTURE SLATE PRESETS BAR */}
                  <div className="p-4 bg-slate-50 border-t border-slate-100 flex flex-col sm:flex-row justify-between items-center gap-3 shrink-0">
                    <span className="text-xs text-slate-400 font-semibold">Ready to record current parameters in logs?</span>
                    <button
                      onClick={() => setShowSaveModal(true)}
                      className="w-full sm:w-auto px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl flex items-center justify-center gap-1.5 shadow-sm transition-all cursor-pointer"
                    >
                      <Save className="w-3.5 h-3.5" /> Save Scenario Snapshot
                    </button>
                  </div>

                </div>

                {/* Right Side: LIVE EQUIVALENTS SUMMARY WIDGET (Span 4) */}
                <div className="lg:col-span-4 bg-white rounded-3xl p-6 border border-slate-200/80 flex flex-col justify-between shadow-xs">
                  <div className="space-y-5">
                    <div className="flex items-center gap-2">
                      <Award className="w-4.5 h-4.5 text-emerald-600 shrink-0" />
                      <h4 className="font-display font-extrabold text-slate-900 text-sm">Real-time Equivalents</h4>
                    </div>

                    <div className="space-y-4">
                      
                      <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-100/50 space-y-1">
                        <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-widest">Atmosphere Weight</span>
                        <p className="text-3xl font-display font-extrabold text-slate-900">
                          {activeTotalEmissions} <span className="text-sm font-sans font-normal text-slate-400">Tons / yr</span>
                        </p>
                        <p className="text-[9px] text-slate-400">Total emissions before pledges reduction or voluntary offsets.</p>
                      </div>

                      <div className="space-y-3 pt-2.5">
                        
                        <div className="flex items-start gap-3">
                          <div className="p-2 bg-emerald-50 border border-emerald-100 rounded-xl text-emerald-800 shrink-0">
                            <Trees className="w-4 h-4 text-emerald-700" />
                          </div>
                          <div>
                            <span className="text-[10px] font-bold text-slate-400 block uppercase leading-none">Trees Absorber</span>
                            <span className="font-mono text-xs font-black text-slate-800">{treesRequiredToOffset} mature trees</span>
                            <p className="text-[9px] text-slate-450 mt-0.5">required to process equivalent yearly emissions loads.</p>
                          </div>
                        </div>

                        <div className="flex items-start gap-3">
                          <div className="p-2 bg-slate-50 border border-slate-100 rounded-xl text-slate-700 shrink-0">
                            <Plane className="w-4 h-4 text-slate-500" />
                          </div>
                          <div>
                            <span className="text-[10px] font-bold text-slate-400 block uppercase leading-none">Frequent Flights</span>
                            <span className="font-mono text-xs font-black text-slate-800">{singleFlightEquivalent} London flights</span>
                            <p className="text-[9px] text-slate-450 mt-0.5">representative carbon burn equivalent.</p>
                          </div>
                        </div>

                        <div className="flex items-start gap-3">
                          <div className="p-2 bg-blue-50 border border-blue-100 rounded-xl text-blue-800 shrink-0">
                            <Trash2 className="w-4 h-4 text-blue-600" />
                          </div>
                          <div>
                            <span className="text-[10px] font-bold text-slate-400 block uppercase leading-none">Plastic bottle manufacture</span>
                            <span className="font-mono text-xs font-black text-slate-800">{averagePlasticStrawEmissionInBottles.toLocaleString()} units</span>
                            <p className="text-[9px] text-slate-450 mt-0.5">equivalent manufacturing energy carbon loading.</p>
                          </div>
                        </div>

                      </div>

                    </div>
                  </div>

                  <div className="bg-slate-50 border border-slate-100/60 rounded-xl p-3 text-[10px] leading-relaxed text-slate-400 mt-6 pt-3 border-t">
                    <strong className="text-slate-650">Real-time update: </strong>
                    All state values trigger instant downstream recalculation values based on core IPCC and EPA multipliers models.
                  </div>
                </div>

              </div>

            </div>
          )}

          {/* VIEW: PLEDGES */}
          {activeSidebarView === 'pledges' && (
            <div className="space-y-6 animate-fadeIn">
              
              <div className="bg-gradient-to-r from-emerald-900 to-teal-950 text-white rounded-3xl p-6 md:p-8 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 relative overflow-hidden">
                <div className="absolute right-0 bottom-0 pointer-events-none opacity-10">
                  <Trees className="w-36 h-36 text-emerald-400" />
                </div>
                <div className="space-y-1">
                  <span className="px-2.5 py-0.5 rounded-full bg-emerald-800/40 text-emerald-300 text-[10px] font-mono font-black tracking-widest uppercase inline-block">
                    CONSCIOUS LOCAL ACTIONS
                  </span>
                  <h3 className="font-display font-extrabold text-xl tracking-tight mt-1.5">
                    Conscious Lifestyle Carbon Pledges
                  </h3>
                  <p className="text-emerald-150 text-xs mt-0.5">Commit to active personal strategies to decrease baseline footprint calculation projections in real-time.</p>
                </div>
                <span className="px-3.5 py-1.5 rounded-xl bg-white/10 text-emerald-300 text-xs font-mono font-bold shrink-0 border border-white/10">
                  {activePledges.length} challenges active
                </span>
              </div>

              {/* CARD GRID */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {PLEDGES_DATA.map((pledge) => {
                  const isActive = activePledges.includes(pledge.id);
                  const PldIcon = pledge.icon;
                  
                  return (
                    <div
                      key={pledge.id}
                      onClick={() => togglePledge(pledge.id)}
                      className={`p-4 rounded-2xl border transition-all duration-200 flex flex-col justify-between cursor-pointer group select-none ${
                        isActive 
                          ? 'bg-emerald-50/20 border-emerald-500 shadow-xs' 
                          : 'bg-white border-slate-200 hover:border-slate-300'
                      }`}
                    >
                      <div className="space-y-4">
                        <div className="flex justify-between items-center">
                          <span className={`p-2 rounded-xl transition-colors ${
                            isActive 
                              ? 'bg-emerald-100 text-emerald-800' 
                              : 'bg-slate-50 text-slate-500 group-hover:bg-slate-100 group-hover:text-slate-900 animate-pulse'
                          }`}>
                            <PldIcon className="w-4.5 h-4.5" />
                          </span>
                          <div className={`w-4.5 h-4.5 rounded-full flex items-center justify-center transition-all ${
                            isActive ? 'bg-emerald-600 text-white' : 'border border-slate-300'
                          }`}>
                            {isActive && <CheckCircle2 className="w-3.5 h-3.5" />}
                          </div>
                        </div>

                        <div className="space-y-1">
                          <h4 className="font-bold text-slate-900 text-sm leading-tight">{pledge.title}</h4>
                          <p className="text-[11px] text-slate-400 group-hover:text-slate-550 leading-relaxed">{pledge.description}</p>
                        </div>
                      </div>

                      <div className="mt-6 pt-3 border-t border-slate-100/60 flex justify-between items-center shrink-0">
                        <span className="text-[9px] uppercase font-mono tracking-wider text-slate-400">{pledge.category}</span>
                        <span className="font-mono text-[11px] font-black text-emerald-700 font-bold">
                          -{pledge.saving.toFixed(2)} t CO₂e / yr
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Informative message */}
              <div className="bg-slate-50 border border-slate-100 rounded-2xl p-4 flex gap-3 text-xs text-slate-500 leading-relaxed">
                <Sparkles className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>
                  <strong>Tip:</strong> Symmetrical housing changes like insulation bulbs can prevent 0.32 t emissions instantly. EV vehicle transition offers massive transport footprint reductions.
                </span>
              </div>

            </div>
          )}

          {/* VIEW: OFFSETS SIMULATOR */}
          {activeSidebarView === 'offset' && (
            <div className="space-y-6 animate-fadeIn">
              
              {/* PRIMARY COHERENT SECTION PANEL */}
              <div className="bg-gradient-to-br from-emerald-950 to-teal-950 text-white rounded-3xl p-6 md:p-8 space-y-6 relative overflow-hidden shadow-lg">
                <div className="absolute right-0 bottom-0 pointer-events-none opacity-10">
                  <Trees className="w-64 h-64 text-emerald-400" />
                </div>

                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 relative z-10 leading-none">
                  <div className="space-y-1">
                    <span className="px-2.5 py-0.5 rounded bg-emerald-800 text-emerald-300 text-[9px] font-mono font-bold tracking-widest uppercase inline-block">
                      GOLD-STANDARD VOLUNTARY OFFSETTING
                    </span>
                    <h3 className="font-display font-extrabold text-2xl tracking-tight mt-1">
                      Simulate Neutralizing Living Footprints
                    </h3>
                    <p className="text-emerald-200 text-xs max-w-2xl leading-normal mt-0.5">
                      Sponsor gold-standard preservation initiatives to virtually neutralize unavoidable air flights or heating emissions in real-time modeling.
                    </p>
                  </div>

                  <div className="bg-white/5 border border-white/10 px-5 py-3 rounded-2xl font-mono text-center shrink-0 min-w-[130px]">
                    <span className="text-[9px] uppercase text-emerald-400 font-bold block">Neutralized Carbon</span>
                    <p className="text-2xl font-bold font-mono text-emerald-300 mt-0.5">{totalOffsetTons} Tons</p>
                    <span className="text-[10px] text-emerald-200">({offsetSliderVal}% of yours)</span>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center border-t border-emerald-900 pt-6 relative z-10">
                  
                  {/* Slider parameter */}
                  <div className="md:col-span-8 space-y-4 bg-white/5 p-4 rounded-xl border border-white/5">
                    <div className="flex justify-between items-center text-xs font-semibold">
                      <span className="flex items-center gap-1.5"><Trees className="w-3.5 h-3.5 text-emerald-400" /> Offsets Coverage Percentage</span>
                      <span className="font-mono text-emerald-300 text-base font-bold">{offsetSliderVal}% offsetted</span>
                    </div>
                    <input 
                      type="range"
                      min="0"
                      max="100"
                      step="10"
                      value={offsetSliderVal}
                      onChange={(e) => {
                        setOffsetSliderVal(parseInt(e.target.value));
                        if (parseInt(e.target.value) === 100) {
                          triggerToast("🔮 Full Net-Zero simulation active!");
                        }
                      }}
                      className="w-full h-1.5 bg-emerald-950 rounded-lg appearance-none cursor-pointer accent-emerald-400"
                    />
                    <div className="flex justify-between text-[9px] text-emerald-300 font-semibold font-mono">
                      <span>0% (Off-grid baseline)</span>
                      <span>30% (Forest conservation)</span>
                      <span>70% (Energy transition)</span>
                      <span>100% (Absolute carbon neutral status)</span>
                    </div>
                  </div>

                  {/* Destination Program Cards */}
                  <div className="md:col-span-4 space-y-2">
                    <label className="text-[9px] uppercase tracking-wider text-emerald-400 font-bold block">Sponsorship Destination:</label>
                    <div className="grid grid-cols-1 gap-2">
                      {[
                        { key: 'reforestation', title: '🌲 Reforestation Planting', sub: 'Amazon biodiversity preservation', rate: '$12/ton cost' },
                        { key: 'wind', title: '💨 Wind Turbine Infrastructure', sub: 'Displacing coal dependency grids', rate: '$9/ton cost' },
                        { key: 'methane', title: '🔥 Methane Bio-Capture', sub: 'Mitigating landfill potents leakages', rate: '$15/ton cost' }
                      ].map((prj) => (
                        <button
                          key={prj.key}
                          onClick={() => {
                            setActiveOffsetType(prj.key as any);
                            triggerToast(`Offset sponsored program updated: ${prj.title}`);
                          }}
                          className={`p-2.5 text-left rounded-xl border transition-all text-xs cursor-pointer outline-none ${
                            activeOffsetType === prj.key 
                              ? 'bg-emerald-800 border-emerald-400 text-white' 
                              : 'bg-emerald-950/40 border-emerald-900/30 text-emerald-100 hover:bg-emerald-900/30'
                          }`}
                        >
                          <span className="block font-bold">{prj.title}</span>
                          <span className="block text-[10px] opacity-80 leading-none mt-0.5">{prj.sub}</span>
                          <span className="block text-[8px] font-mono font-bold text-emerald-250 mt-1">{prj.rate}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                </div>

                <div className="bg-emerald-950/40 p-4 rounded-xl border border-emerald-900/40 text-xs text-emerald-150 text-center relative z-10 leading-normal">
                  💡 Gold Standard Emission Reductions simulate purchasing verified credit structures. 
                  {offsetSliderVal >0 && ` Neutralizing ${offsetSliderVal}% of emissions represents a voluntary purchase allocation of roughly $${Math.ceil(totalOffsetTons * (activeOffsetType === 'reforestation' ? 12 : activeOffsetType === 'wind' ? 9 : 15))} USD annually.`}
                </div>

              </div>

            </div>
          )}

          {/* VIEW: HISTORY SNAPSHOT TIMELINE */}
          {activeSidebarView === 'history' && (
            <div className="space-y-6 animate-fadeIn">
              
              <div className="bg-white rounded-3xl p-6 md:p-8 shadow-xs border border-slate-200/80 space-y-6">
                
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                  <div>
                    <h3 className="font-display font-extrabold text-lg text-slate-900">Comparative Timeline Snapshots</h3>
                    <p className="text-xs text-slate-400 mt-0.5 font-sans">Compare and load benchmark state checkpoints to analyze historical adjustments.</p>
                  </div>

                  {savedRecords.length > 0 && (
                    <button 
                      onClick={() => {
                        localStorage.removeItem('eco_carbon_records');
                        setSavedRecords([]);
                        triggerToast("Timeline snapshots purged.");
                      }}
                      className="px-3.5 py-1.5 bg-rose-50 text-rose-700 hover:bg-rose-100/70 border border-rose-105 rounded-xl font-bold text-[10px] uppercase transition-colors cursor-pointer"
                    >
                      Clear snapshot list
                    </button>
                  )}
                </div>

                {savedRecords.length === 0 ? (
                  <div className="text-center py-12 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                    <span className="text-3xl block">📁</span>
                    <p className="text-slate-400 text-xs font-bold mt-2.5">No snapshot timelines recorded yet.</p>
                    <p className="text-[10px] text-slate-400 mt-0.5">Use the snapshot option in the calculator factors panel to register checkpoints.</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse min-w-[600px] font-sans">
                      <thead>
                        <tr className="border-b border-slate-100 text-[9px] font-mono font-bold uppercase text-slate-400 tracking-wider">
                          <th className="pb-3 pl-4">Snapshot Scenario Name</th>
                          <th className="pb-3 text-center">Net Footprint</th>
                          <th className="pb-3 text-center">Incorporated Breakdown</th>
                          <th className="pb-3 text-center">Registered Date</th>
                          <th className="pb-3 pr-4 text-right">Action Controls</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 text-xs">
                        {savedRecords.map((item) => (
                          <tr 
                            key={item.id} 
                            onClick={() => loadRecord(item)}
                            className="hover:bg-slate-50 transition-colors cursor-pointer group"
                          >
                            <td className="py-4 pl-4 font-bold text-slate-900">
                              <div className="flex items-center gap-2">
                                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping-onceshrink-0" />
                                <span>{item.label}</span>
                              </div>
                            </td>
                            <td className="py-4 text-center font-mono font-black text-emerald-850 text-xs">
                              <span className="bg-emerald-50 border border-emerald-100 px-2 py-0.5 rounded text-emerald-850">
                                {item.total.toFixed(2)} t
                              </span>
                            </td>
                            <td className="py-4 text-center">
                              <div className="flex justify-center gap-1.5 font-mono text-[9px]">
                                <span className="px-1.5 bg-slate-100 rounded text-slate-600">⚡{item.breakdown.energy}</span>
                                <span className="px-1.5 bg-slate-100 rounded text-slate-600">🚗{item.breakdown.transport}</span>
                                <span className="px-1.5 bg-slate-100 rounded text-slate-600">🥗{item.breakdown.food}</span>
                                <span className="px-1.5 bg-slate-100 rounded text-slate-600">🛍️{item.breakdown.lifestyle}</span>
                              </div>
                            </td>
                            <td className="py-4 text-center font-mono text-slate-400 text-[10px]">{item.date}</td>
                            <td className="py-4 pr-4 text-right" onClick={(e) => e.stopPropagation()}>
                              <div className="flex justify-end gap-2.5">
                                <button 
                                  onClick={() => loadRecord(item)}
                                  className="px-2 py-1 bg-slate-900 text-white rounded text-[10px] hover:bg-slate-800 transition-all cursor-pointer font-bold shrink-0"
                                >
                                  Load setup
                                </button>
                                <button 
                                  onClick={(e) => deleteRecord(item.id, e)}
                                  className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 border border-slate-200/50 rounded cursor-pointer"
                                  title="Delete Scenario"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}

              </div>

            </div>
          )}

        </main>

        {/* BOTTOM PLATFORM FOOTER */}
        <footer className="bg-slate-900 text-slate-400 py-10 px-6 border-t border-slate-800 mt-16 shrink-0 font-sans">
          <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Leaf className="w-4 h-4 text-emerald-400" />
                <span className="font-display font-black text-white text-sm">EcoSync Carbon 플랫폼</span>
              </div>
              <p className="text-[11px] leading-relaxed max-w-sm">
                Educational metrics program parsing greenhouse multipliers variables. Promote daily conservation.
              </p>
            </div>

            <div className="space-y-2">
              <h5 className="text-white font-bold font-mono text-[10px] uppercase tracking-wider">Multipliers ledger averages</h5>
              <div className="text-[10px] space-y-1 text-slate-450 border-r border-slate-800 pr-4">
                <p className="flex justify-between">
                  <span>⚡ Grid electricity average</span>
                  <span className="font-mono font-bold text-slate-350">~0.38 kg/kWh</span>
                </p>
                <p className="flex justify-between">
                  <span>🚗 Automotive Petrol</span>
                  <span className="font-mono font-bold text-slate-350">~0.40 kg/mi</span>
                </p>
                <p className="flex justify-between">
                  <span>🐄 Livestock Agriculture beef</span>
                  <span className="font-mono font-bold text-slate-350">~27.0 kg CO₂e/kg</span>
                </p>
              </div>
            </div>

            <div className="space-y-2.5">
              <h5 className="text-white font-bold font-mono text-[10px] uppercase tracking-wider">Atmospheric impact</h5>
              <p className="text-[11px] leading-relaxed">
                Every avoided gram of carbon slowdown cumulative positive feedback triggers in melting Arctic methane zones.
              </p>
              <p className="text-[9px] font-mono text-slate-500">
                Created with Google AI Studio Build. Free-access educational utility.
              </p>
            </div>
          </div>
        </footer>

      </div>

      {/* TIMELINE SAVE MODAL POPUP */}
      <AnimatePresence>
        {showSaveModal && (
          <div className="fixed inset-0 z-55 flex items-center justify-center p-4">
            
            {/* Overlay backdrop block */}
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowSaveModal(false)}
              className="absolute inset-0 bg-slate-950/40 backdrop-blur-xs"
            />

            {/* Modal card content */}
            <motion.div 
              initial={{ scale: 0.95, opacity: 0, y: 15 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 10 }}
              className="bg-white rounded-3xl p-6 md:p-8 max-w-sm w-full shadow-2xl relative z-10 border border-slate-100 font-sans"
            >
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <div className="bg-emerald-100 text-emerald-800 p-2 rounded-xl">
                    <Save className="w-5 h-5 text-emerald-600" />
                  </div>
                  <div>
                    <h3 className="font-display font-extrabold text-sm text-slate-905">Record Scenario Snapshot</h3>
                    <p className="text-[10px] text-slate-400 mt-0.5">Label this snapshot configuration to comparison lines later.</p>
                  </div>
                </div>

                <div className="space-y-2 pt-2">
                  <label className="text-[10px] font-bold text-slate-600 block">Scenario Label Title (e.g. "Baseline 2026", "Hybrid Commute")</label>
                  <input 
                    type="text"
                    required
                    maxLength={32}
                    placeholder="E.g., Moderate Omnivore, EV upgrade..."
                    value={newLabelText}
                    onChange={(e) => setNewLabelText(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:border-slate-800 text-xs font-sans"
                  />
                </div>

                <div className="flex gap-2.5 pt-4">
                  <button 
                    onClick={() => setShowSaveModal(false)}
                    className="flex-1 py-2.5 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 text-[11px] font-bold transition-all cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button 
                    onClick={handleSaveScenario}
                    className="flex-1 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-[11px] font-bold shadow-sm transition-all cursor-pointer"
                  >
                    Confirm Save
                  </button>
                </div>
              </div>
            </motion.div>

          </div>
        )}
      </AnimatePresence>

    </div>
  );
}
