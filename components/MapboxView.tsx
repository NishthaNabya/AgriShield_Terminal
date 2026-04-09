"use client";

import React, { useEffect, useRef, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';

// This pulls your public token from .env.local
const mapboxToken = process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN;
if (mapboxToken) {
  mapboxgl.accessToken = mapboxToken;
}

export default function MapboxView({ 
  activeModel = 'wm-5c',
  externalTelemetry,
  ensembleSpreadDerived
}: { 
  activeModel?: 'ecmwf' | 'wm-5c',
  externalTelemetry?: {
    lat: number,
    lng: number,
    tick: number,
    predictedTrajectory?: number[][]
  },
  ensembleSpreadDerived?: {
    mean_precipitation: number,
    spread_std_dev: number
  }
}) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<mapboxgl.Map | null>(null);
  const pulseMarkerRef = useRef<mapboxgl.Marker | null>(null);
  const [isUserInteracting, setIsUserInteracting] = useState(false);

  useEffect(() => {
    if (!mapContainerRef.current) return;

    // Create the custom HTML Pulse Marker once
    const el = document.createElement('div');
    el.className = 'h-4 w-4 bg-orange-500 rounded-full animate-pulse shadow-[0_0_15px_rgba(249,115,22,0.8)] border border-orange-200';
    pulseMarkerRef.current = new mapboxgl.Marker({ element: el })
      .setLngLat([36.0726, 0.5143]); // Nakuru, Kenya

    // Initialize Mapbox
    const map = new mapboxgl.Map({
      container: mapContainerRef.current,
      style: 'mapbox://styles/mapbox/navigation-night-v1', // High-visibility dark theme
      center: [36.0726, 0.5143], // Nakuru Sector
      zoom: 8.5,
      pitch: 45, // Angled for a more tactical look
      attributionControl: false,
      transformRequest: (url, resourceType) => {
        // Intercept and nullify traffic tile requests to bypass 403 SKU restrictions
        if (url.includes('mapbox-traffic-v1')) {
          return { url: 'data:application/x-protobuf;base64,' };
        }
        return { url };
      }
    });

    mapRef.current = map;

    // Setup user interaction flags
    const handleInteractStart = () => setIsUserInteracting(true);
    const handleInteractEnd = () => setTimeout(() => setIsUserInteracting(false), 3000); // 3s cooldown

    map.on('dragstart', handleInteractStart);
    map.on('touchstart', handleInteractStart);
    map.on('mousedown', handleInteractStart);
    map.on('dragend', handleInteractEnd);
    map.on('touchend', handleInteractEnd);
    map.on('mouseup', handleInteractEnd);

    map.on('load', () => {
      // Inject the GeoJSON source for the micro-cell
      map.addSource('micro-cell-source', {
        type: 'geojson',
        data: {
          type: 'Feature',
          geometry: {
            type: 'Point',
            coordinates: [36.0726, 0.5143]
          },
          properties: {}
        }
      });

      // Add the visual circle layer heavily blurred for uncertainty
      const spreadBlur = ensembleSpreadDerived ? Math.min(1.0, ensembleSpreadDerived.spread_std_dev / 5) : 0.8;
      const spreadRadius = ensembleSpreadDerived ? Math.max(120, ensembleSpreadDerived.spread_std_dev * 40) : 120;
      const spreadColor = `rgba(249, 115, 22, ${ensembleSpreadDerived ? Math.min(0.8, ensembleSpreadDerived.mean_precipitation / 25) : 0.5})`;

      map.addLayer({
        id: 'micro-cell-layer',
        type: 'circle',
        source: 'micro-cell-source',
        paint: {
          'circle-radius': spreadRadius,
          'circle-color': spreadColor,
          'circle-blur': spreadBlur,
          'circle-stroke-width': 0
        },
        layout: {
          visibility: 'visible' 
        }
      });

      // Inject the GeoJSON source for the trajectory
      map.addSource('predicted-trajectory-source', {
        type: 'geojson',
        data: {
          type: 'Feature',
          geometry: {
            type: 'LineString',
            coordinates: []
          },
          properties: {}
        }
      });

      map.addLayer({
        id: 'predicted-trajectory-layer',
        type: 'line',
        source: 'predicted-trajectory-source',
        paint: {
          'line-color': '#10b981', // emerald-400
          'line-width': 2,
          'line-dasharray': [2, 4],
          'line-opacity': 0.8
        },
        layout: {
          visibility: 'visible'
        }
      });

      // Synchronize initial state just in case it loads during a toggle
      if (activeModel === 'wm-5c' && pulseMarkerRef.current) {
        pulseMarkerRef.current.addTo(map);
      }
    });

    // Clean up on unmount
    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
      }
    };
  }, []);

  // Effect to handle toggling the model states natively
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !pulseMarkerRef.current) return;

    if (activeModel === 'wm-5c') {
      pulseMarkerRef.current.addTo(map);
      if (map.isStyleLoaded()) {
        if (map.getLayer('micro-cell-layer')) {
          map.setLayoutProperty('micro-cell-layer', 'visibility', 'visible');
        }
        if (map.getLayer('predicted-trajectory-layer')) {
          map.setLayoutProperty('predicted-trajectory-layer', 'visibility', 'visible');
        }
      }
    } else {
      pulseMarkerRef.current.remove();
      if (map.isStyleLoaded()) {
        if (map.getLayer('micro-cell-layer')) {
          map.setLayoutProperty('micro-cell-layer', 'visibility', 'none');
        }
        if (map.getLayer('predicted-trajectory-layer')) {
          map.setLayoutProperty('predicted-trajectory-layer', 'visibility', 'none');
        }
      }
    }
  }, [activeModel]);

  // Effect for Mutable Ref Data Overwrites
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !externalTelemetry || !map.isStyleLoaded()) return;

    // Mutably set pulse marker
    if (pulseMarkerRef.current) {
      pulseMarkerRef.current.setLngLat([externalTelemetry.lng, externalTelemetry.lat]);
    }

    // Mutably set mapbox datasets
    const microCellSource = map.getSource('micro-cell-source') as mapboxgl.GeoJSONSource;
    if (microCellSource) {
      microCellSource.setData({
        type: 'Feature',
        geometry: {
          type: 'Point',
          coordinates: [externalTelemetry.lng, externalTelemetry.lat]
        },
        properties: {}
      });
    }

    const trajSource = map.getSource('predicted-trajectory-source') as mapboxgl.GeoJSONSource;
    if (trajSource && externalTelemetry.predictedTrajectory) {
      trajSource.setData({
        type: 'Feature',
        geometry: {
          type: 'LineString',
          coordinates: externalTelemetry.predictedTrajectory
        },
        properties: {}
      });
    }

    // Track user camera without flyTo interrupting drag
    if (!isUserInteracting) {
      map.easeTo({
        center: [externalTelemetry.lng, externalTelemetry.lat],
        duration: 1000
      });
    }

  }, [externalTelemetry, isUserInteracting]);

  return (
    <div className="relative h-full w-full min-h-[400px] bg-zinc-950">
      {/* The actual Mapbox canvas */}
      <div 
        ref={mapContainerRef} 
        style={{ height: '100%', width: '100%' }}
        className="absolute inset-0 grayscale-[10%] contrast-[110%]" 
      />
      
      {/* HUD Coordinate Overlay - Styled to match your GSB Telemetry sidebar */}
      <div className={`absolute top-6 left-6 z-10 bg-zinc-950/80 backdrop-blur-md border ${externalTelemetry?.tick && externalTelemetry.tick % 2 === 0 ? 'border-emerald-400/50 shadow-[0_0_15px_rgba(52,211,153,0.15)] bg-emerald-400/5' : 'border-zinc-800'} transition-all duration-300 p-3 font-mono text-[11px] shadow-2xl`}>
        <div className="flex flex-col gap-1.5">
          <div className="flex justify-between gap-4">
            <span className="text-zinc-500 uppercase">Sector</span>
            <span className="text-emerald-400">NAKURU_01</span>
          </div>
          <div className="flex justify-between gap-4">
            <span className="text-zinc-500 uppercase">Lat/Long</span>
            <span className="text-emerald-400">
              {externalTelemetry?.lat.toFixed(4)}°S / {externalTelemetry?.lng.toFixed(4)}°E
            </span>
          </div>
          <div className="w-full h-[1px] bg-zinc-800 my-1" />
          <div className="text-[9px] text-zinc-600 animate-pulse">
            AWAITING WEATHERMESH™ DATA STREAM...
          </div>
        </div>
      </div>

      {/* Zarr Array Footer */}
      <div className="absolute bottom-6 right-6 z-10 bg-zinc-950/80 backdrop-blur-sm border border-zinc-800 px-3 py-1 font-mono text-[9px] text-zinc-500 flex gap-4">
        <span>SOURCE: WM-5c</span>
        <span>FORMAT: Zarr</span>
        <span>CHUNK_ID: 720x1440</span>
      </div>

      {/* Subtle Scanline Texture Overlay */}
      <div className="absolute inset-0 pointer-events-none bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.1)_50%),linear-gradient(90deg,rgba(255,0,0,0.02),rgba(0,255,0,0.01),rgba(0,0,255,0.02))] bg-[length:100%_2px,3px_100%]"></div>
    </div>
  );
}