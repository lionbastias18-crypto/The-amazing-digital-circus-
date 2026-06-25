/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { Suspense } from 'react';
import { Canvas } from '@react-three/fiber';
import { Loader } from '@react-three/drei';
import Environment from './components/Environment';
import Player from './components/Player';
import TouchControls from './components/TouchControls';
import HUD from './components/HUD';
import TabletSupportPanel from './components/TabletSupportPanel';
import { useInputStore } from './store';

// Encapsular el contenido principal del juego para poder renderizarlo fullscreen o simulado
function MainAppContent() {
  const setLook = useInputStore((state) => state.setLook);
  const touchSensitivity = useInputStore((state) => state.touchSensitivity);

  const lastLookPos = React.useRef({ x: 0, y: 0 });
  const lookPointerId = React.useRef<number | null>(null);
  const [lookActive, setLookActive] = React.useState(false);

  const handleLookDown = (e: React.PointerEvent) => {
    if (lookPointerId.current !== null) return;
    try {
      e.currentTarget.setPointerCapture(e.pointerId);
    } catch (err) {
      // Ignorar si falla la captura de puntero en algún navegador antiguo
    }
    lookPointerId.current = e.pointerId;
    lastLookPos.current = { x: e.clientX, y: e.clientY };
    setLookActive(true);
  };

  const handleLook = (e: React.PointerEvent) => {
    if (!lookActive || e.pointerId !== lookPointerId.current) return;
    const dx = e.clientX - lastLookPos.current.x;
    const dy = e.clientY - lastLookPos.current.y;
    lastLookPos.current = { x: e.clientX, y: e.clientY };
    setLook(dx * 0.005 * touchSensitivity, dy * 0.005 * touchSensitivity);
  };

  const handleLookUp = (e: React.PointerEvent) => {
    if (e.pointerId === lookPointerId.current) {
      try {
        e.currentTarget.releasePointerCapture(e.pointerId);
      } catch (err) {
        // Ignorar
      }
      lookPointerId.current = null;
      setLookActive(false);
      setLook(0, 0);
    }
  };

  return (
    <div 
      className="w-full h-full relative overflow-hidden bg-[#050505]"
      onPointerDown={handleLookDown}
      onPointerMove={handleLook}
      onPointerUp={handleLookUp}
      onPointerCancel={handleLookUp}
    >
      {/* HUD overlay de emociones, glitch y diálogos */}
      <HUD />

      {/* Overlay UI para Controles Táctiles Fluidos */}
      <TouchControls />
      
      {/* Interfaz Superior Fija */}
      <div className="absolute top-4 left-4 z-20 pointer-events-none">
        <h1 className="text-xl sm:text-2xl font-black text-yellow-400 drop-shadow-[0_2px_2px_rgba(0,0,0,0.8)] tracking-wider uppercase">
          Digital Circus
        </h1>
        <p className="text-xs sm:text-sm text-red-400 font-bold drop-shadow-[0_1px_1px_rgba(0,0,0,0.8)]">
          ÚLTIMO ACTO III
        </p>
      </div>

      <div className="absolute top-4 right-4 z-20 pointer-events-none text-right hidden md:block">
        <p className="text-xs text-gray-300 drop-shadow-md bg-black/40 px-3 py-1 rounded-full backdrop-blur-sm">
          Izquierda: Mover | Derecha: Mirar
        </p>
      </div>

      {/* Canvas 3D Optimizada (Low Load) */}
      <Canvas 
        shadows={false} // Desactivado para maximizar rendimiento en tablets de 4GB RAM
        camera={{ fov: 75 }}
        gl={{ antialias: false, powerPreference: "high-performance" }} // Antialias off para mejor rendimiento móvil
        className="w-full h-full"
      >
        <color attach="background" args={['#050505']} />
        <Suspense fallback={null}>
          <Environment />
          <Player />
        </Suspense>
      </Canvas>
    </div>
  );
}

export default function App() {
  const isTabletSupportActive = useInputStore((state) => state.isTabletSupportActive);
  
  // Detect portrait/landscape orientation dynamically
  const [isPortrait, setIsPortrait] = React.useState(
    typeof window !== 'undefined' ? window.innerWidth < window.innerHeight : false
  );

  React.useEffect(() => {
    const handleResize = () => {
      setIsPortrait(window.innerWidth < window.innerHeight);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return (
    <div className="w-screen h-screen bg-[#07050d] flex items-center justify-center p-1 sm:p-4 select-none overflow-hidden relative font-sans text-white">
      {/* Fondo digital ambientado */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(88,28,135,0.12)_0%,rgba(0,0,0,0.95)_100%)] pointer-events-none" />

      {isTabletSupportActive ? (
        /* Redmi Pad SE 8.7 Premium Mock Frame (Auto-Adaptive Orientation) */
        <div 
          className="relative bg-black border-[6px] sm:border-[12px] md:border-[16px] border-[#1d1d23] rounded-[18px] sm:rounded-[30px] shadow-[0_0_50px_rgba(168,85,247,0.35)] flex flex-col overflow-hidden animate-[pulseTablet_3s_infinite_alternate] z-10"
          style={{
            aspectRatio: isPortrait ? '0.597' : '1.675',
            width: isPortrait ? 'min(100%, calc((100vh - 32px) * 0.597))' : '100%',
            height: isPortrait ? '100%' : 'auto',
            maxWidth: isPortrait ? 'calc((100vh - 32px) * 0.597)' : 'calc((100vh - 48px) * 1.675)',
            maxHeight: isPortrait ? 'calc(100vh - 32px)' : 'calc(100vh - 48px)'
          }}
        >
          
          {/* Bezel details (Camera, sensors, speaker) based on dynamic orientation */}
          {isPortrait ? (
            /* Front Camera for Portrait Mode */
            <div className="absolute top-1.5 sm:top-2.5 left-1/2 -translate-x-1/2 w-2 h-2 bg-neutral-950 rounded-full border border-neutral-700/60 z-50 pointer-events-none flex items-center justify-center">
              <div className="w-0.5 h-0.5 bg-blue-500/70 rounded-full" />
            </div>
          ) : (
            /* Front Camera for Landscape Mode */
            <div className="absolute top-1/2 left-2 sm:left-3.5 -translate-y-1/2 w-2 h-2 bg-neutral-950 rounded-full border border-neutral-700/60 z-50 pointer-events-none flex items-center justify-center">
              <div className="w-0.5 h-0.5 bg-blue-500/70 rounded-full" />
            </div>
          )}

          {/* Speaker grills on left/right edges */}
          {!isPortrait && (
            <>
              <div className="absolute top-12 left-0.5 w-0.5 h-6 bg-neutral-900 rounded-r border-r border-neutral-800 z-50 pointer-events-none" />
              <div className="absolute bottom-12 left-0.5 w-0.5 h-6 bg-neutral-900 rounded-r border-r border-neutral-800 z-50 pointer-events-none" />
              <div className="absolute top-12 right-0.5 w-0.5 h-6 bg-neutral-900 rounded-l border-l border-neutral-800 z-50 pointer-events-none" />
              <div className="absolute bottom-12 right-0.5 w-0.5 h-6 bg-neutral-900 rounded-l border-l border-neutral-800 z-50 pointer-events-none" />
            </>
          )}

          {/* Glass glare effect overlay */}
          <div className="absolute inset-0 bg-gradient-to-tr from-white/0 via-white/[0.015] to-white/[0.04] pointer-events-none z-30" />

          {/* Actual Viewport Content inside Redmi Pad SE 8.7 Screen */}
          <div className="w-full h-full relative overflow-hidden bg-[#050505] rounded-[6px] sm:rounded-[14px]">
            <MainAppContent />
          </div>

          {/* Brand watermark on bottom bezel */}
          <div className="absolute bottom-1 right-8 text-[7px] text-neutral-600 font-mono tracking-widest uppercase pointer-events-none z-50 select-none hidden sm:block">
            REDMI PAD SE 8.7"
          </div>
        </div>
      ) : (
        /* Fullscreen direct mode */
        <div className="w-full h-full relative overflow-hidden bg-black">
          <MainAppContent />
        </div>
      )}

      {/* Panel de Control flotante para Tablet */}
      <TabletSupportPanel />
      
      {/* Pantalla de carga simplificada */}
      <Loader 
        containerStyles={{ background: '#000' }} 
        innerStyles={{ width: '200px' }} 
        barStyles={{ background: '#f44336' }} 
        dataStyles={{ color: '#fff' }} 
      />

      <style>{`
        @keyframes pulseTablet {
          0% { box-shadow: 0 0 45px rgba(168,85,247,0.2); }
          50% { box-shadow: 0 0 60px rgba(34,211,238,0.25); }
          100% { box-shadow: 0 0 45px rgba(168,85,247,0.2); }
        }
      `}</style>
    </div>
  );
}

