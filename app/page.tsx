"use client";

import dynamic from "next/dynamic"

const MapboxView = dynamic(() => import("../components/MapboxView"), { 
  ssr: false,
  loading: () => (
    <div className="flex h-full w-full items-center justify-center font-mono text-sm text-zinc-600 bg-zinc-950">
      [ Mapbox Initialization... ]
    </div>
  )
});
import { LineChart, Line, XAxis, YAxis, ResponsiveContainer, AreaChart, Area } from 'recharts'
import {
  Radio,
  Activity,
  Gauge,
  MapPin,
  Battery,
  AlertTriangle,
  CloudRain,
  Satellite,
  ArrowUp,
  HelpCircle
} from "lucide-react"
import React, { useState, useEffect, useCallback } from "react"
import { missionTelemetryResponse, pointForecastData } from "../lib/windborne-api-mock"

export function useLiveTelemetry() {
  const [index, setIndex] = useState(0);
  const [profileCrossings, setProfileCrossings] = useState(0);
  const renderCountRef = React.useRef(0);
  const observations = missionTelemetryResponse.observations;

  useEffect(() => {
    const interval = setInterval(() => {
      setIndex(prev => {
        const next = (prev + 1) % observations.length;
        return next;
      });
    }, 10000); // 10s playback strictly respected
    return () => clearInterval(interval);
  }, [observations.length]);

  useEffect(() => {
    if (index > 1) {
      const p1 = observations[index - 2];
      const p2 = observations[index - 1];
      const p3 = observations[index];

      const dtPrev = p2.timestamp - p1.timestamp;
      const prevVz = dtPrev !== 0 ? (p2.altitude - p1.altitude) / dtPrev : 0;
      
      const dtCurr = p3.timestamp - p2.timestamp;
      const currVz = dtCurr !== 0 ? (p3.altitude - p2.altitude) / dtCurr : 0;

      if (Math.sign(prevVz) !== Math.sign(currVz) && prevVz !== 0) {
        setProfileCrossings(c => c + 1);
      }
    }
  }, [index, observations]);

  const currentObs = observations[index];
  const prevObs = index > 0 ? observations[index - 1] : observations[0];

  let v_z = 0;
  if (index > 0) {
    const dt = currentObs.timestamp - prevObs.timestamp; // in seconds
    const dz = currentObs.altitude - prevObs.altitude;
    if (dt > 0) v_z = dz / dt;
  }

  const windAngle = Math.atan2(currentObs.speed_u, currentObs.speed_v) * (180 / Math.PI);
  const latency = currentObs.updated_at ? currentObs.updated_at - currentObs.timestamp : 0;

  return {
    ...currentObs,
    lat: currentObs.latitude,
    lng: currentObs.longitude,
    v_z,
    windAngle,
    tick: index,
    profileCrossings,
    latency,
    renderCount: renderCountRef.current
  };
}

function DebugOverlay({ telemetry }: { telemetry: ReturnType<typeof useLiveTelemetry> }) {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.shiftKey && e.key === 'D') {
        setIsVisible(prev => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  if (!isVisible) return null;

  return (
    <div className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-black/90 text-zinc-200 font-mono text-sm p-6 border border-emerald-500/50 z-[100] rounded shadow-[0_0_50px_rgba(16,185,129,0.2)] animate-in fade-in zoom-in-95 duration-150">
      <div className="text-emerald-400 text-lg border-b border-emerald-500/30 pb-2 mb-4 font-bold flex gap-4 pr-12">
        <span>GSB_TELEMETRY.DEBUG_OVERLAY</span>
        <span className="text-zinc-600 text-[10px] mt-2 tracking-widest">v1.8.0</span>
      </div>
      <div className="space-y-1 bg-zinc-900/50 p-4 border border-zinc-800 rounded">
        <div className="grid grid-cols-2 gap-x-12 gap-y-2">
          <span className="text-zinc-500 uppercase text-xs tracking-wider">Array Index Tic</span>
          <span className="text-emerald-400">{telemetry.tick} / {missionTelemetryResponse.observations.length - 1}</span>
          
          <span className="text-zinc-500 uppercase text-xs tracking-wider">Unix Timestamp</span>
          <span className="text-emerald-400">{telemetry.timestamp}</span>
          
          <span className="text-zinc-500 uppercase text-xs tracking-wider">Calculated v_z</span>
          <span className="text-emerald-400">{telemetry.v_z.toFixed(4)} m/s</span>
          
          <span className="text-zinc-500 uppercase text-xs tracking-wider">Profile X-ings</span>
          <span className="text-emerald-400">{telemetry.profileCrossings}</span>
          
          <span className="text-zinc-500 uppercase text-xs tracking-wider">Top Render Cnt</span>
          <span className="text-emerald-400">{telemetry.renderCount}</span>
        </div>
      </div>
      <div className="text-zinc-600 text-[10px] mt-4 uppercase">
        <kbd className="px-1 py-0.5 rounded bg-zinc-800 border border-zinc-700 text-zinc-400">Shift</kbd> + <kbd className="px-1 py-0.5 rounded bg-zinc-800 border border-zinc-700 text-zinc-400">D</kbd> to unmount
      </div>
    </div>
  );
}

function TopNavigation({ telemetry }: { telemetry: ReturnType<typeof useLiveTelemetry> }) {
  return (
    <header className="h-16 border-b border-zinc-800 bg-zinc-900/50 backdrop-blur-md px-6 flex items-center justify-between shrink-0">
      {/* Left: Brand */}
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2">
          <Satellite className="h-5 w-5 text-emerald-400" />
          <h1 className="text-sm font-bold uppercase tracking-wider text-zinc-100">
            AgriShield Terminal
          </h1>
        </div>
        <span className="px-2 py-0.5 rounded bg-emerald-400/10 border border-emerald-400/30 text-emerald-400 text-xs font-mono">
          WM-5c Live
        </span>
      </div>

      {/* Center: Sector */}
      <div className="absolute left-1/2 -translate-x-1/2 flex items-center gap-2">
        <MapPin className="h-4 w-4 text-zinc-500" />
        <span className="text-sm text-zinc-400 font-medium">
          Nakuru Sector • LAT {telemetry.lat.toFixed(4)}° / LON {telemetry.lng.toFixed(4)}°
        </span>
      </div>

      {/* Right: System Status */}
      <div className="flex items-center gap-2">
        <div className="status-pulse h-2 w-2 rounded-full bg-emerald-400" />
        <span className="text-xs text-zinc-400">System Status:</span>
        <span className="text-xs font-mono text-emerald-400">Nominal</span>
      </div>
    </header>
  )
}



function VectorCard({ telemetry }: { telemetry: ReturnType<typeof useLiveTelemetry> }) {
  const [flash, setFlash] = useState(false);
  useEffect(() => {
    if (telemetry.tick > 0) {
      setFlash(true);
      const timeout = setTimeout(() => setFlash(false), 300);
      return () => clearTimeout(timeout);
    }
  }, [telemetry.tick]);

  const windMagnitude = Math.sqrt(telemetry.speed_u ** 2 + telemetry.speed_v ** 2);

  return (
    <div className={`p-4 rounded-lg bg-zinc-900/50 backdrop-blur-md border transition-colors duration-300 ${flash ? 'border-emerald-400/50 shadow-[0_0_15px_rgba(52,211,153,0.15)]' : 'border-zinc-800'} space-y-3`}>
      <div className="flex items-center gap-2 text-zinc-500">
        <Activity className="h-4 w-4" />
        <span className="text-xs uppercase tracking-wide">GPS-Derived Drift</span>
      </div>
      <div className="flex items-center justify-between">
        <div className="font-mono text-2xl text-emerald-400 tabular-nums">
          {windMagnitude.toFixed(1)} <span className="text-sm text-zinc-500">m/s</span>
        </div>
        <div 
          className="h-8 w-8 rounded-full bg-zinc-800 flex items-center justify-center transition-transform duration-500"
          style={{ transform: `rotate(${telemetry.windAngle}deg)` }}
        >
          <ArrowUp className="h-4 w-4 text-emerald-400" />
        </div>
      </div>
      <p className="text-xs text-zinc-500 font-mono">U: {telemetry.speed_u.toFixed(2)} | V: {telemetry.speed_v.toFixed(2)}</p>
    </div>
  )
}

function TargetingPanel() {
  const [sliderValue, setSliderValue] = useState(17500);
  const [tempTargetAlt, setTempTargetAlt] = useState(sliderValue);

  const handleExecute = useCallback(() => {
    console.log("Committed retarget for target:", sliderValue);
  }, [sliderValue]);

  const snapPercent = ((tempTargetAlt - 16000) / 3000) * 100;

  return (
    <div className="p-4 rounded-lg border border-zinc-800 bg-zinc-900/30 space-y-3">
      <h3 className="text-xs uppercase tracking-wide text-zinc-500 font-medium border-b border-zinc-800 pb-2">NAVIGATION OVERRIDE</h3>
      <div className="flex h-32 items-center gap-6 pt-2">
        <div className="flex flex-col justify-between h-full text-[10px] text-zinc-500 py-2 font-mono">
          <span className="flex items-center gap-1 group relative">
             VENT
             <span title="Venting gas increases balloon density for controlled descent.">
               <HelpCircle className="h-3 w-3 cursor-help opacity-50 hover:opacity-100 transition-opacity" />
             </span>
          </span>
          <span className="text-emerald-400">HOLD</span>
          <span className="flex items-center gap-1 group relative">
             BALLAST
             <span title="Dropping ballast forces immediate ascent.">
               <HelpCircle className="h-3 w-3 cursor-help opacity-50 hover:opacity-100 transition-opacity" />
             </span>
          </span>
        </div>
        
        <div className="relative h-full w-4 flex flex-col justify-center items-center">
          <input 
            type="range" 
            min="16000" 
            max="19000"
            step="500" 
            value={tempTargetAlt} 
            onChange={(e) => setTempTargetAlt(Number(e.target.value))}
            onPointerUp={() => setSliderValue(tempTargetAlt)}
            className="w-32 h-1 absolute -rotate-90 appearance-none bg-transparent [&::-webkit-slider-runnable-track]:bg-zinc-800 [&::-webkit-slider-runnable-track]:h-1 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:bg-emerald-500 [&::-webkit-slider-thumb]:transition-transform hover:[&::-webkit-slider-thumb]:scale-110 cursor-pointer"
          />
          <div 
            className="absolute left-6 pointer-events-none transition-all duration-75 flex items-center gap-1.5 text-emerald-400 font-mono text-[10px] whitespace-nowrap"
            style={{ bottom: `calc(${snapPercent}% - 6px)` }}
          >
             <div className="h-px w-2 bg-emerald-500/50" />
             {tempTargetAlt}m
          </div>
        </div>
      </div>
      <div className="flex justify-end pt-2 border-t border-zinc-800/50">
        <button 
          onClick={handleExecute}
          className="px-3 py-1.5 bg-transparent border border-zinc-800 text-[9px] font-mono text-zinc-500 hover:text-zinc-200 hover:border-zinc-600 hover:bg-zinc-900/50 active:text-emerald-400 active:border-emerald-500/50 active:bg-emerald-500/10 rounded transition-all duration-150 tracking-widest uppercase">
          Execute Retarget
        </button>
      </div>
    </div>
  )
}

const VerticalProfileChart = React.memo(({ data }: { data: any[] }) => {
  return (
    <div className="h-48 w-full p-2 bg-zinc-900/30 rounded-lg border border-zinc-800">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart layout="vertical" data={data} margin={{ top: 15, right: 15, left: 15, bottom: 25 }}>
          <XAxis type="number" dataKey="temp" domain={['auto', 'auto']} stroke="#52525b" tick={{ fill: '#a1a1aa', fontSize: 9 }} label={{ value: 'TEMP (°C)', position: 'insideBottom', offset: -15, fill: '#52525b', fontSize: 9 }} />
          <YAxis type="number" dataKey="alt" domain={[0, 20000]} stroke="#52525b" tick={{ fill: '#a1a1aa', fontSize: 9 }} label={{ value: 'ALT (m)', angle: -90, position: 'insideLeft', offset: -5, fill: '#52525b', fontSize: 9 }} />
          <Line dataKey="temp" stroke="#34d399" strokeWidth={1.5} dot={{ r: 2.5, fill: '#10b981' }} isAnimationActive={false} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
});

function LeftSidebar({ telemetry }: { telemetry: ReturnType<typeof useLiveTelemetry> }) {
  const [page, setPage] = useState<'NAV' | 'SND'>('NAV');

  const downlinkData = React.useMemo(() => missionTelemetryResponse.observations
    .slice(0, telemetry.tick + 1)
    .slice(-25)
    .map(obs => ({
      temp: obs.temperature,
      alt: obs.altitude
    })), [telemetry.tick]);

  let vzColor = "text-emerald-400";
  if (telemetry.v_z < -5 || telemetry.v_z > 0) {
    vzColor = "text-red-500 drop-shadow-[0_0_5px_rgba(239,68,68,0.5)]";
  } else if (telemetry.v_z < -3) {
    vzColor = "text-amber-500 drop-shadow-[0_0_5px_rgba(245,158,11,0.5)]";
  }

  return (
    <aside className="w-[300px] border-r border-zinc-800 bg-zinc-950 flex flex-col shrink-0 z-10" style={{ height: 'calc(100vh - 4rem)' }}>
      {/* Header — always visible */}
      <div className="flex items-center justify-between p-4 pb-2 border-b border-zinc-800 shrink-0">
        <div className="flex items-center gap-2">
          <Satellite className="h-4 w-4 text-emerald-400" />
          <h2 className="text-xs font-semibold uppercase tracking-wider text-zinc-300">
            LIVE TELEMETRY
          </h2>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[9px] font-mono text-zinc-600">{page === 'NAV' ? '1' : '2'}/2</span>
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
          </span>
        </div>
      </div>

      {/* Page viewport — overflow hidden, fixed height */}
      <div className="flex-1 overflow-hidden relative min-h-0">
        <div
          className="absolute inset-0 flex transition-transform duration-300 ease-in-out"
          style={{ transform: page === 'NAV' ? 'translateX(0)' : 'translateX(-100%)' }}
        >
          {/* ═══ PAGE 1: NAV — Flight Ops ═══ */}
          <div className="w-full shrink-0 p-4 flex flex-col gap-3 overflow-y-auto">
            {/* Telemetry Grid */}
            <div className="grid grid-cols-2 gap-2">
              <div className="bg-zinc-900/50 p-2.5 rounded border border-zinc-800 flex flex-col">
                <span className="text-[10px] uppercase text-zinc-500 font-mono">Altitude</span>
                <span className="text-lg font-mono text-zinc-200 tabular-nums">{telemetry.altitude.toLocaleString()}<span className="text-[10px] text-zinc-600 ml-1">m</span></span>
              </div>
              <div className="bg-zinc-900/50 p-2.5 rounded border border-zinc-800 flex flex-col">
                <span className="text-[10px] uppercase text-zinc-500 font-mono">Pressure</span>
                <span className="text-lg font-mono text-zinc-200 tabular-nums">{telemetry.pressure.toFixed(1)}<span className="text-[10px] text-zinc-600 ml-1">hPa</span></span>
              </div>
              <div className="bg-zinc-900/50 p-2.5 rounded border border-zinc-800 flex flex-col">
                <span className="text-[10px] uppercase text-zinc-500 font-mono">Temperature</span>
                <span className="text-lg font-mono text-blue-400 tabular-nums">{telemetry.temperature.toFixed(1)}<span className="text-[10px] text-blue-400/50 ml-1">°C</span></span>
              </div>
              <div className="bg-zinc-900/50 p-2.5 rounded border border-zinc-800 flex flex-col">
                <span className="text-[10px] uppercase text-zinc-500 font-mono">Humidity</span>
                <span className="text-lg font-mono text-emerald-400 tabular-nums">{(telemetry.humidity * 100).toFixed(0)}<span className="text-[10px] text-emerald-400/50 ml-1">%</span></span>
              </div>
            </div>

            <VectorCard telemetry={telemetry} />
            <TargetingPanel />
          </div>

          {/* ═══ PAGE 2: SND — Sounding ═══ */}
          <div className="w-full shrink-0 p-4 flex flex-col gap-3 overflow-y-auto">
            <VerticalProfileChart data={downlinkData} />

            {/* Atmospheric Physics */}
            <div className="bg-zinc-900/50 p-3 rounded border border-zinc-800 space-y-2">
              <div className="flex justify-between items-center text-[10px] font-mono text-zinc-400">
                <span>Flight Phase:</span>
                <span className="text-emerald-400">COMMANDED_DESCENT</span>
              </div>
              <div className="flex justify-between items-center text-[10px] font-mono text-zinc-400 border-t border-zinc-800/50 pt-2">
                <span>Vertical Vel:</span>
                <span className={`text-sm ${vzColor} tabular-nums font-bold transition-colors duration-300`}>{telemetry.v_z > 0 ? '+' : ''}{telemetry.v_z.toFixed(2)} m/s</span>
              </div>
              <div className="flex justify-between items-center text-[10px] font-mono text-zinc-400 border-t border-zinc-800/50 pt-2">
                <span>Profile Counter:</span>
                <span className="text-zinc-200 tracking-wider">#{Math.floor(telemetry.profileCrossings)}</span>
              </div>
              <div className="flex justify-between items-center text-[10px] font-mono text-zinc-400 border-t border-zinc-800/50 pt-2">
                <span>Comm Latency:</span>
                <span className="text-zinc-200 tracking-wider font-mono">{telemetry.latency}s</span>
              </div>
              <div className="flex justify-between items-center text-[10px] font-mono text-zinc-400 border-t border-zinc-800/50 pt-2">
                <span>Sp. Humidity:</span>
                <span className="text-zinc-200 tabular-nums font-mono">{telemetry.specific_humidity} mg/kg</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ─── MFD Pip Navigation ─── */}
      <div className="shrink-0 border-t border-zinc-800 p-2 flex gap-2">
        <button
          onClick={() => setPage('NAV')}
          className={`flex-1 py-1.5 text-[10px] font-mono uppercase tracking-widest rounded transition-all duration-150 border ${
            page === 'NAV'
              ? 'bg-emerald-500/10 border-emerald-500/50 text-emerald-400'
              : 'border-zinc-800 text-zinc-600 hover:text-zinc-300 hover:border-zinc-600'
          }`}
        >
          ◈ NAV
        </button>
        <button
          onClick={() => setPage('SND')}
          className={`flex-1 py-1.5 text-[10px] font-mono uppercase tracking-widest rounded transition-all duration-150 border ${
            page === 'SND'
              ? 'bg-emerald-500/10 border-emerald-500/50 text-emerald-400'
              : 'border-zinc-800 text-zinc-600 hover:text-zinc-300 hover:border-zinc-600'
          }`}
        >
          ◈ SND
        </button>
      </div>
    </aside>
  )
}

function CenterStage({ activeModel, isTransitioning, telemetry }: { activeModel: 'ecmwf' | 'wm-5c', isTransitioning: boolean, telemetry: ReturnType<typeof useLiveTelemetry> }) {
  return (
    <main className="flex-1 relative terminal-grid bg-zinc-950 overflow-hidden">
      {/* Subtle overlay gradient */}
      <div className="absolute inset-0 bg-gradient-to-b from-zinc-950/80 via-transparent to-zinc-950/80 pointer-events-none z-10" />

      <MapboxView 
        activeModel={activeModel} 
        externalTelemetry={telemetry} 
        ensembleSpreadDerived={pointForecastData.forecasts[0][0].ensembleSpreadDerived}
      />

      {isTransitioning && (
        <div className="absolute inset-0 z-20 flex items-center justify-center bg-zinc-950/50 backdrop-blur-sm">
          <div className="flex flex-col items-center gap-2 bg-zinc-900/80 p-4 rounded border border-zinc-800">
             <div className="h-5 w-5 border-2 border-emerald-400 border-t-transparent rounded-full animate-spin" />
             <span className="font-mono text-xs text-emerald-400 animate-pulse">Assimilating Targeted Observations...</span>
          </div>
        </div>
      )}

      {/* Corner coordinates (decorative) */}
      <div className="absolute top-4 left-4 font-mono text-[10px] text-zinc-700 transition-colors duration-300" style={{ color: telemetry.tick % 2 === 0 ? '#3f3f46' : '#52525b' }}>
        LAT {telemetry.lat.toFixed(4)}° | LON {telemetry.lng.toFixed(4)}°
      </div>
      <div className="absolute top-4 right-4 font-mono text-[10px] text-zinc-700">
        ZOOM 8.4x | BEARING 0°
      </div>
      <div className="absolute bottom-4 left-4 font-mono text-[10px] text-zinc-700">
        TILES LOADED: 0/0
      </div>
      <div className="absolute bottom-4 right-4 font-mono text-[10px] text-zinc-700">
        UTC {new Date().toISOString().slice(11, 19)}
      </div>
    </main>
  )
}

function AssimilationCycleBar() {
  const CYCLE_MS = 20 * 60 * 1000; // 20 minutes
  const [elapsed, setElapsed] = useState(0);
  const [flash, setFlash] = useState(false);

  useEffect(() => {
    const start = Date.now();
    const tick = setInterval(() => {
      const ms = (Date.now() - start) % CYCLE_MS;
      if (ms < 600 && elapsed > CYCLE_MS - 1000) {
        setFlash(true);
        setTimeout(() => setFlash(false), 500);
      }
      setElapsed(ms);
    }, 250);
    return () => clearInterval(tick);
  }, []);

  const progress = (elapsed / CYCLE_MS) * 100;
  const minutesLeft = Math.ceil((CYCLE_MS - elapsed) / 60000);

  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between">
        <span className="text-[9px] font-mono text-zinc-500 uppercase tracking-widest">
          Next WM-5c Assimilation Cycle
        </span>
        <span className="text-[9px] font-mono text-zinc-400">{minutesLeft}m</span>
      </div>
      <div className="h-[3px] rounded-full bg-zinc-800 overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-200 ${flash ? 'bg-emerald-400 shadow-[0_0_10px_rgba(52,211,153,0.6)]' : 'bg-emerald-500/70'}`}
          style={{ width: `${progress}%` }}
        />
      </div>
    </div>
  );
}

function ForecastToggle({ 
  activeModel, 
  setActiveModel,
  flash
}: { 
  activeModel: 'ecmwf' | 'wm-5c'
  setActiveModel: (model: 'ecmwf' | 'wm-5c') => void
  flash: boolean
}) {
  const handleEcmwf = useCallback(() => setActiveModel('ecmwf'), [setActiveModel]);
  const handleWm5c = useCallback(() => setActiveModel('wm-5c'), [setActiveModel]);

  const ecmwfVal = pointForecastData.ecmwf_precipitation_mm_hr;
  const wm5cVal = pointForecastData.forecasts[0][0].peak_precipitation_mm_hr;
  const delta = wm5cVal - ecmwfVal;

  return (
    <div className="space-y-3">
      <h3 className="text-xs uppercase tracking-wide text-zinc-500 font-medium">
        Forecast Delta Toggle
      </h3>
      <div className="flex gap-2">
        <button 
          onClick={handleEcmwf}
          className={`flex-1 px-3 py-2 rounded text-xs font-mono transition-all duration-150 border ${
            activeModel === 'ecmwf'
              ? 'bg-emerald-500/10 border-emerald-500/50 text-emerald-400'
              : 'border-zinc-800 bg-transparent text-zinc-500 hover:text-zinc-200 hover:border-zinc-600 hover:bg-zinc-900/50'
          }`}
        >
          ECMWF (6hr lag)
        </button>
        <button 
          onClick={handleWm5c}
          className={`flex-1 px-3 py-2 rounded text-xs font-mono transition-all duration-150 border ${
            activeModel === 'wm-5c'
              ? 'bg-emerald-500/10 border-emerald-500/50 text-emerald-400'
              : 'border-zinc-800 bg-transparent text-zinc-500 hover:text-zinc-200 hover:border-zinc-600 hover:bg-zinc-900/50'
          }`}
        >
          WM-5c (Live)
        </button>
      </div>
      {/* Delta Payoff Comparison */}
      <div className={`p-3 rounded border border-zinc-800 bg-zinc-900/30 space-y-2 transition-all duration-500 ${flash ? 'border-emerald-400/30 bg-emerald-400/5' : ''}`}>
        <div className="flex items-center justify-between text-[11px] font-mono">
          <span className="text-zinc-500">ECMWF:</span>
          <span className="text-zinc-400">{ecmwfVal} mm/hr</span>
        </div>
        <div className="flex items-center justify-between text-[11px] font-mono">
          <span className="text-zinc-500">WM-5c:</span>
          <span className="text-emerald-400 font-bold">{wm5cVal} mm/hr</span>
        </div>
        <div className="h-px bg-zinc-800" />
        <div className="flex items-center justify-between">
          <span className="text-[10px] text-zinc-600 uppercase tracking-wider">WindBorne Δ</span>
          <span className="text-sm font-mono font-bold text-orange-400 animate-pulse drop-shadow-[0_0_8px_rgba(251,146,60,0.5)]">
            +{delta.toFixed(1)} mm/hr
          </span>
        </div>
      </div>
    </div>
  )
}

function ConvergenceGauge({ telemetry }: { telemetry: ReturnType<typeof useLiveTelemetry> }) {
  const tempGap = (telemetry.temperature || 0) - (telemetry.dewpoint_2m || 0);
  const isSaturated = tempGap < 2.0;
  const trendData = pointForecastData.convergenceTrend;

  return (
    <div className={`p-4 rounded-lg border transition-colors duration-500 ease-in-out ${isSaturated ? 'border-orange-500/50 bg-orange-500/10' : 'border-zinc-800 bg-zinc-900/30'} space-y-3`}>
      <h3 className="text-xs uppercase tracking-wide text-zinc-500 font-medium border-b border-zinc-800 pb-2">
        Saturation Convergence
      </h3>
      <div className="flex items-center justify-between">
        <span className="text-xs text-zinc-400 font-mono">Temp / Dewpoint Gap</span>
        <span className={`font-mono text-sm transition-colors duration-300 ${isSaturated ? 'text-orange-400' : 'text-emerald-400'}`}>
          {tempGap.toFixed(1)}°C
        </span>
      </div>
      {/* Convergence Sparkline */}
      <div className="h-[30px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={trendData} margin={{ top: 0, right: 0, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="convergenceGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={isSaturated ? '#f97316' : '#10b981'} stopOpacity={0.4} />
                <stop offset="100%" stopColor={isSaturated ? '#f97316' : '#10b981'} stopOpacity={0} />
              </linearGradient>
            </defs>
            <Area
              type="monotone"
              dataKey="gap"
              stroke={isSaturated ? '#fb923c' : '#34d399'}
              strokeWidth={1.5}
              fill="url(#convergenceGrad)"
              isAnimationActive={false}
              dot={false}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
      <div className="flex justify-between text-[9px] font-mono text-zinc-600">
        <span>-6hr</span>
        <span>NOW</span>
      </div>
      {isSaturated && (
        <div className="text-[10px] font-bold text-orange-500 uppercase tracking-widest animate-pulse border border-orange-500/30 bg-orange-500/10 p-2 rounded text-center">
          ATMOSPHERIC SATURATION IMMINENT
        </div>
      )}
    </div>
  )
}

function AlertCard({ activeModel, flash }: { activeModel: 'ecmwf' | 'wm-5c', flash: boolean }) {
  const latestForecast = pointForecastData.forecasts[0][0];
  const members = latestForecast.ensemble_members;
  const exceedCount = members.filter((m: number) => m > 10).length;

  return activeModel === 'ecmwf' ? (
    <div className="p-4 rounded-lg border border-zinc-800 bg-zinc-900/30 space-y-3">
      <span className="text-xs font-mono text-zinc-500">Waiting for 6hr global sync...</span>
      <h4 className="text-sm font-medium text-zinc-400">Standard Resolution View</h4>
      <p className="text-xs text-zinc-500 leading-relaxed">No high-res micro-cell anomalies identified in global view.</p>
    </div>
  ) : (
    <div className={`p-4 rounded-lg border border-orange-500/30 bg-orange-500/5 space-y-3 transition-all duration-500 ${flash ? 'border-orange-400/60 bg-orange-400/10 shadow-[0_0_15px_rgba(251,146,60,0.1)]' : ''}`}>
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-2">
          <AlertTriangle className="h-4 w-4 text-orange-500" />
          <span className="text-xs font-semibold uppercase tracking-wide text-orange-500">
            Micro-cell Precipitation
          </span>
        </div>
      </div>

      <div className="space-y-1">
        <div className="flex items-center gap-2">
          <CloudRain className="h-4 w-4 text-orange-400" />
          <h4 className="text-sm font-medium text-zinc-200">
            Flash Flood Risk
          </h4>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-mono text-orange-300 bg-orange-500/15 border border-orange-500/20 px-1.5 py-0.5 rounded">
            Ensemble Agreement: {exceedCount}/{members.length}
          </span>
        </div>
        <p className="text-xs text-zinc-400 leading-relaxed">
          Init: {pointForecastData.initializationTime}
        </p>
      </div>

      <div className="flex items-center justify-between pt-2 border-t border-orange-500/20">
        <span className="text-xs text-zinc-500">Peak Precipitation</span>
        <span className={`font-mono text-sm text-orange-400 transition-all duration-500 ${flash ? 'scale-110' : ''}`}>{latestForecast.peak_precipitation_mm_hr} mm/hr</span>
      </div>
    </div>
  )
}

function VarianceRangeBar() {
  const spread = pointForecastData.forecasts[0][0].ensembleSpreadDerived;
  const rangeWidth = spread.range_max - spread.range_min;
  const iqrLeftPct = ((spread.iqr_low - spread.range_min) / rangeWidth) * 100;
  const iqrWidthPct = ((spread.iqr_high - spread.iqr_low) / rangeWidth) * 100;
  const meanPct = ((spread.mean_precipitation - spread.range_min) / rangeWidth) * 100;

  return (
    <div className="space-y-3">
      <h3 className="text-xs uppercase tracking-wide text-zinc-500 font-medium">
        Forecast Variance (WM-5c Ensemble)
      </h3>
      {/* Numeric readouts */}
      <div className="grid grid-cols-3 gap-2 text-center">
        <div>
          <div className="text-[9px] uppercase text-zinc-600 font-mono">Min</div>
          <div className="text-xs font-mono text-zinc-400">{spread.range_min}</div>
        </div>
        <div>
          <div className="text-[9px] uppercase text-emerald-500 font-mono">Mean</div>
          <div className="text-sm font-mono font-bold text-emerald-400">{spread.mean_precipitation}</div>
        </div>
        <div>
          <div className="text-[9px] uppercase text-zinc-600 font-mono">Max</div>
          <div className="text-xs font-mono text-zinc-400">{spread.range_max}</div>
        </div>
      </div>
      {/* Box-and-whisker range bar */}
      <div className="relative h-5 w-full">
        {/* Full spread whisker line */}
        <div className="absolute top-1/2 -translate-y-1/2 left-0 right-0 h-[2px] bg-zinc-700 rounded-full" />
        {/* Left whisker cap */}
        <div className="absolute top-1/2 -translate-y-1/2 left-0 w-[2px] h-2.5 bg-zinc-600 rounded" />
        {/* Right whisker cap */}
        <div className="absolute top-1/2 -translate-y-1/2 right-0 w-[2px] h-2.5 bg-zinc-600 rounded" />
        {/* IQR box */}
        <div
          className="absolute top-1/2 -translate-y-1/2 h-3 bg-emerald-400/20 border border-emerald-400/40 rounded"
          style={{ left: `${iqrLeftPct}%`, width: `${iqrWidthPct}%` }}
        />
        {/* Mean dot */}
        <div
          className="absolute top-1/2 -translate-y-1/2 h-2.5 w-2.5 bg-emerald-400 rounded-full shadow-[0_0_8px_rgba(52,211,153,0.6)] -translate-x-1/2"
          style={{ left: `${meanPct}%` }}
        />
      </div>
      <div className="flex justify-between text-[9px] font-mono text-zinc-600">
        <span>{spread.range_min} mm</span>
        <span>{spread.range_max} mm</span>
      </div>
      {/* Std dev */}
      <div className="flex items-center justify-between text-xs">
        <span className="text-zinc-500">Spread (σ)</span>
        <span className="font-mono text-emerald-400">±{spread.spread_std_dev} mm/hr</span>
      </div>
    </div>
  )
}

function RightSidebar({ 
  activeModel, 
  setActiveModel,
  telemetry
}: {
  activeModel: 'ecmwf' | 'wm-5c'
  setActiveModel: (model: 'ecmwf' | 'wm-5c') => void
  telemetry: ReturnType<typeof useLiveTelemetry>
}) {
  const [page, setPage] = useState<'WRN' | 'ANL'>('WRN');
  const [cycleFlash, setCycleFlash] = useState(false);
  const [elapsedMinutes, setElapsedMinutes] = useState(0);

  useEffect(() => {
    const start = Date.now();
    const CYCLE_MS = 20 * 60 * 1000;
    const tick = setInterval(() => {
      const ms = (Date.now() - start) % CYCLE_MS;
      setElapsedMinutes(Math.floor(ms / 60000));
      if (ms < 600 && ms > 0) {
        setCycleFlash(true);
        setTimeout(() => setCycleFlash(false), 500);
      }
    }, 1000);
    return () => clearInterval(tick);
  }, []);

  // Detect saturation alert for pip pulse
  const tempGap = (telemetry.temperature || 0) - (telemetry.dewpoint_2m || 0);
  const hasUrgentAlert = tempGap < 2.0 || activeModel === 'wm-5c';

  return (
    <aside className="w-[380px] border-l border-zinc-800 bg-zinc-950 flex flex-col shrink-0 z-10" style={{ height: 'calc(100vh - 4rem)' }}>
      {/* ─── PERSISTENT HEADER ─── */}
      <div className="shrink-0 p-4 pb-3 space-y-3 border-b border-zinc-800">
        <AssimilationCycleBar />
        <div className="flex items-center justify-between">
          <h2 className="text-xs font-semibold uppercase tracking-wider text-zinc-300">
            AI Data Assimilation
          </h2>
          <div className="flex items-center gap-2">
            <span className="text-[9px] font-mono text-zinc-600">{page === 'WRN' ? '1' : '2'}/2</span>
            <span className="text-[9px] font-mono text-zinc-500">{elapsedMinutes}m ago</span>
            <div className="flex items-center gap-1">
              <div className="h-1.5 w-1.5 rounded-full bg-emerald-400 status-pulse" />
              <span className="text-[10px] font-mono text-emerald-400">ONLINE</span>
            </div>
          </div>
        </div>
      </div>

      {/* ─── PAGE VIEWPORT ─── */}
      <div className="flex-1 overflow-hidden relative min-h-0">
        <div
          className="absolute inset-0 flex transition-transform duration-300 ease-in-out"
          style={{ transform: page === 'WRN' ? 'translateX(0)' : 'translateX(-100%)' }}
        >
          {/* ═══ PAGE 1: WRN — Warnings ═══ */}
          <div className="w-full shrink-0 p-4 flex flex-col gap-4 overflow-y-auto">
            <ConvergenceGauge telemetry={telemetry} />
            <AlertCard activeModel={activeModel} flash={cycleFlash} />
            
            {/* System Health (compact) */}
            <div className="mt-auto pt-3 border-t border-zinc-800 space-y-2">
              <div className="bg-zinc-900 border border-zinc-800 rounded px-2 py-1.5 flex items-center justify-between">
                <span className="text-[9px] font-mono text-zinc-400 uppercase">Zarr Chunked Array</span>
                <span className="text-[9px] font-mono text-emerald-400">LOADED</span>
              </div>
            </div>
          </div>

          {/* ═══ PAGE 2: ANL — Analysis ═══ */}
          <div className="w-full shrink-0 p-4 flex flex-col gap-4 overflow-y-auto">
            <ForecastToggle activeModel={activeModel} setActiveModel={setActiveModel} flash={cycleFlash} />
            <VarianceRangeBar />

            {/* Grid metadata */}
            <div className="mt-auto pt-3 border-t border-zinc-800">
              <div className="flex items-center justify-between text-[9px] font-mono text-zinc-500">
                <span>GRID: 720×1440</span>
                <span>CHUNK_SIZE: 4MB</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ─── MFD Pip Navigation ─── */}
      <div className="shrink-0 border-t border-zinc-800 p-2 flex gap-2">
        <button
          onClick={() => setPage('WRN')}
          className={`flex-1 py-1.5 text-[10px] font-mono uppercase tracking-widest rounded transition-all duration-150 border ${
            page === 'WRN'
              ? 'bg-orange-500/10 border-orange-500/50 text-orange-400'
              : hasUrgentAlert
                ? 'border-red-500/50 text-red-400 animate-pulse bg-red-500/5'
                : 'border-zinc-800 text-zinc-600 hover:text-zinc-300 hover:border-zinc-600'
          }`}
        >
          ⚠ WRN
        </button>
        <button
          onClick={() => setPage('ANL')}
          className={`flex-1 py-1.5 text-[10px] font-mono uppercase tracking-widest rounded transition-all duration-150 border ${
            page === 'ANL'
              ? 'bg-emerald-500/10 border-emerald-500/50 text-emerald-400'
              : 'border-zinc-800 text-zinc-600 hover:text-zinc-300 hover:border-zinc-600'
          }`}
        >
          ◈ ANL
        </button>
      </div>
    </aside>
  )
}

export default function AgriShieldTerminal() {
  const [activeModel, setActiveModel] = useState<'ecmwf' | 'wm-5c'>('wm-5c')
  const [isTransitioning, setIsTransitioning] = useState(false)
  const telemetry = useLiveTelemetry()

  const handleModelChange = (newModel: 'ecmwf' | 'wm-5c') => {
    if (newModel === activeModel) return;
    setIsTransitioning(true);
    setTimeout(() => {
      setActiveModel(newModel);
      setIsTransitioning(false);
    }, 800); // 800ms loading overlay gap closure
  }

  return (
    <div className="h-screen w-screen overflow-hidden flex flex-col bg-zinc-950">
      <DebugOverlay telemetry={telemetry} />
      <TopNavigation telemetry={telemetry} />
      <div className="flex-1 flex min-h-0">
        <LeftSidebar telemetry={telemetry} />
        <CenterStage activeModel={activeModel} isTransitioning={isTransitioning} telemetry={telemetry} />
        <RightSidebar activeModel={activeModel} setActiveModel={handleModelChange} telemetry={telemetry} />
      </div>
    </div>
  )
}
