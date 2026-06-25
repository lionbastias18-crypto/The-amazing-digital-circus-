import React, { useRef, useState } from 'react';
import { useInputStore } from '../store';

export default function TouchControls() {
  const setMove = useInputStore((state) => state.setMove);
  const joystickRadius = useInputStore((state) => state.joystickRadius);

  const maxRadius = joystickRadius;
  const sizePx = maxRadius * 2;
  const centerCoord = maxRadius;

  // Estados locales para renderizar el UI del joystick
  const [joystickPos, setJoystickPos] = useState({ x: centerCoord, y: centerCoord });
  const [joystickActive, setJoystickActive] = useState(false);
  const joystickPointerId = useRef<number | null>(null);
  const leftZoneRef = useRef<HTMLDivElement>(null);

  // Manejo del joystick (Lado Izquierdo)
  const handleMoveDown = (e: React.PointerEvent) => {
    e.stopPropagation(); // Evita que se active el giro de cámara al tocar el joystick
    if (joystickPointerId.current !== null) return;
    if (!leftZoneRef.current) return;
    
    try {
      e.currentTarget.setPointerCapture(e.pointerId);
    } catch (err) {
      // Ignorar si falla
    }

    joystickPointerId.current = e.pointerId;
    const rect = leftZoneRef.current.getBoundingClientRect();
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;
    
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    let dx = x - centerX;
    let dy = y - centerY;
    
    const distance = Math.sqrt(dx * dx + dy * dy);
    if (distance > maxRadius) {
      dx = (dx / distance) * maxRadius;
      dy = (dy / distance) * maxRadius;
    }
    
    setJoystickPos({ x: centerX + dx, y: centerY + dy });
    setJoystickActive(true);
    setMove(dx / maxRadius, dy / maxRadius);
  };

  const handleMove = (e: React.PointerEvent) => {
    e.stopPropagation();
    if (!joystickActive || e.pointerId !== joystickPointerId.current || !leftZoneRef.current) return;
    const rect = leftZoneRef.current.getBoundingClientRect();
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;
    
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    let dx = x - centerX;
    let dy = y - centerY;
    
    const distance = Math.sqrt(dx * dx + dy * dy);
    if (distance > maxRadius) {
      dx = (dx / distance) * maxRadius;
      dy = (dy / distance) * maxRadius;
    }
    
    setJoystickPos({ x: centerX + dx, y: centerY + dy });
    setMove(dx / maxRadius, dy / maxRadius);
  };

  const handleMoveUp = (e: React.PointerEvent) => {
    e.stopPropagation();
    if (e.pointerId === joystickPointerId.current) {
      try {
        e.currentTarget.releasePointerCapture(e.pointerId);
      } catch (err) {
        // Ignorar
      }
      joystickPointerId.current = null;
      setJoystickActive(false);
      setJoystickPos({ x: centerCoord, y: centerCoord }); // Centrar
      setMove(0, 0);
    }
  };

  // El knob se renderiza centrado en (centerCoord, centerCoord) por defecto
  const currentKnobPos = joystickActive ? joystickPos : { x: centerCoord, y: centerCoord };

  return (
    <div className="absolute inset-0 z-40 select-none touch-none pointer-events-none">
      {/* Joystick circular en la parte inferior izquierda */}
      <div 
        ref={leftZoneRef}
        className="absolute bottom-6 left-6 rounded-full bg-black/60 border-2 border-cyan-500/40 backdrop-blur-md z-50 pointer-events-auto cursor-pointer shadow-[0_0_15px_rgba(6,182,212,0.15)] hover:border-cyan-400 active:border-cyan-300 transition-colors duration-150"
        style={{
          width: `${sizePx}px`,
          height: `${sizePx}px`,
        }}
        onPointerDown={handleMoveDown}
        onPointerMove={handleMove}
        onPointerUp={handleMoveUp}
        onPointerCancel={handleMoveUp}
      >
        {/* Anillo decorativo interior */}
        <div className="absolute inset-2 rounded-full border border-cyan-500/10 pointer-events-none" />

        {/* Knob de arrastre con brillo cyan-púrpura */}
        <div 
          className="absolute bg-gradient-to-br from-cyan-400 to-purple-500 rounded-full w-12 h-12 shadow-[0_0_15px_rgba(6,182,212,0.4)] transition-colors duration-150 pointer-events-none flex items-center justify-center border border-white/20"
          style={{
            left: currentKnobPos.x - 24,
            top: currentKnobPos.y - 24,
          }}
        >
          {/* Brillo interno */}
          <div className="w-4 h-4 rounded-full bg-white/40 blur-[1px]" />
        </div>
      </div>
    </div>
  );
}
