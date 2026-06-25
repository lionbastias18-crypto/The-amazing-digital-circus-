import React, { useEffect } from 'react';
import { useInputStore, EmotionType, CaineEmotionType, ZoneType } from '../store';

export default function HUD() {
  const pomniEmotion = useInputStore((state) => state.pomniEmotion);
  const setPomniEmotion = useInputStore((state) => state.setPomniEmotion);
  
  const caineEmotion = useInputStore((state) => state.caineEmotion);
  const setCaineEmotion = useInputStore((state) => state.setCaineEmotion);

  const activeDialogue = useInputStore((state) => state.activeDialogue);
  const setActiveDialogue = useInputStore((state) => state.setActiveDialogue);

  const isGlitching = useInputStore((state) => state.isGlitching);
  const triggerCaineAngerEvent = useInputStore((state) => state.triggerCaineAngerEvent);

  // Expanded zone & state bindings
  const currentZone = useInputStore((state) => state.currentZone);
  const setZone = useInputStore((state) => state.setZone);
  const isAbstracted = useInputStore((state) => state.isAbstracted);
  const setAbstracted = useInputStore((state) => state.setAbstracted);
  const isSleeping = useInputStore((state) => state.isSleeping);
  const setSleeping = useInputStore((state) => state.setSleeping);
  const calmness = useInputStore((state) => state.calmness);
  const wakeUp = useInputStore((state) => state.wakeUp);

  // --- ACT III NARRATIVE STATES & ACTIONS ---
  const huggedByMember = useInputStore((state) => state.huggedByMember);
  const controlledCharacter = useInputStore((state) => state.controlledCharacter);
  const isEnteringEventActive = useInputStore((state) => state.isEnteringEventActive);
  const isHugEventActive = useInputStore((state) => state.isHugEventActive);
  const isAbstractionEventActive = useInputStore((state) => state.isAbstractionEventActive);

  const closeEnteringEvent = useInputStore((state) => state.closeEnteringEvent);
  const triggerHugEvent = useInputStore((state) => state.triggerHugEvent);
  const closeHugEvent = useInputStore((state) => state.closeHugEvent);
  const triggerAbstractionEvent = useInputStore((state) => state.triggerAbstractionEvent);
  const closeAbstractionEvent = useInputStore((state) => state.closeAbstractionEvent);
  const setControlledCharacter = useInputStore((state) => state.setControlledCharacter);
  const resetAllNarrative = useInputStore((state) => state.resetAllNarrative);

  const [pomniOpen, setPomniOpen] = React.useState(true);
  const [caineOpen, setCaineOpen] = React.useState(false);
  const [spacesOpen, setSpacesOpen] = React.useState(false);
  const [guideOpen, setGuideOpen] = React.useState(false);

  // Clear dialogue after 5 seconds automatically unless it is a system glitch dialogue
  useEffect(() => {
    if (activeDialogue && activeDialogue.speaker !== "SISTEMA") {
      const timer = setTimeout(() => {
        setActiveDialogue(null);
      }, 5500);
      return () => clearTimeout(timer);
    }
  }, [activeDialogue]);

  useEffect(() => {
    if (window.innerHeight < 600) {
      setPomniOpen(true);
      setCaineOpen(false);
      setSpacesOpen(false);
      setGuideOpen(false);
    } else {
      setPomniOpen(true);
      setCaineOpen(true);
      setSpacesOpen(true);
      setGuideOpen(true);
    }
  }, []);

  return (
    <div className="absolute inset-0 pointer-events-none z-30 select-none">
      
      {/* 0. EFECTO ABSTRAÍDO DE BESTIA GLITCH (Bordes de pantalla distorsionados si estás abstraído) */}
      {isAbstracted && !isSleeping && (
        <div className="absolute inset-0 pointer-events-none border-[14px] border-red-600/80 shadow-[inset_0_0_100px_rgba(255,0,0,0.85)] z-20 animate-pulse">
          <div className="absolute top-2 left-1/2 -translate-x-1/2 bg-red-600 text-white text-[11px] font-black uppercase px-4 py-1.5 rounded-b-md shadow-md tracking-wider border-x-2 border-b-2 border-yellow-400">
            🔥 MODO BESTIA ABSTRAÍDA - CLICA EN LOS PERSONAJES PARA ATACARLOS 🔥
          </div>
        </div>
      )}

      {/* OVERLAY DE SUEÑO (Cuando Pomni duerme en el Vacío Oscuro) */}
      {isSleeping && (
        <div className="absolute inset-0 bg-[#05010a]/95 flex flex-col items-center justify-center pointer-events-auto z-50 text-center">
          {/* Zzz floating animations */}
          <div className="relative mb-6 flex justify-center items-center">
            <span className="text-4xl font-black text-purple-400 absolute animate-[sleep_3s_infinite_0s] opacity-0" style={{ transform: 'translate(-40px, -40px)' }}>Z</span>
            <span className="text-3xl font-black text-cyan-400 absolute animate-[sleep_3s_infinite_1s] opacity-0" style={{ transform: 'translate(40px, -55px)' }}>z</span>
            <span className="text-2xl font-black text-pink-400 absolute animate-[sleep_3s_infinite_2s] opacity-0" style={{ transform: 'translate(-20px, -65px)' }}>z</span>
            <span className="text-7xl">😴</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-black text-purple-400 uppercase tracking-widest animate-pulse">Dormida en la Oscuridad...</h2>
          <p className="text-gray-400 text-xs sm:text-sm mt-3 max-w-sm px-6">
            La oscuridad tranquila cura tus glitches de abstracción y restaura tu mente.
          </p>
          
          <div className="mt-5 w-48 bg-purple-950/40 border border-purple-500/30 p-2 rounded-xl">
            <div className="flex justify-between text-[10px] font-bold text-gray-300 mb-1">
              <span>🧘 CALMA RESTAURADA</span>
              <span className="text-cyan-400">{calmness}%</span>
            </div>
            <div className="w-full bg-purple-950 h-2 rounded-full overflow-hidden">
              <div className="bg-cyan-400 h-full" style={{ width: `${calmness}%` }} />
            </div>
          </div>

          <button 
            onClick={wakeUp}
            className="mt-8 px-6 py-3 bg-gradient-to-r from-purple-600 to-cyan-500 border-2 border-white rounded-xl text-white font-extrabold shadow-xl hover:scale-105 active:scale-95 transition-all text-xs uppercase tracking-wider"
          >
            ⏰ DESPERTAR Y VOLVER AL PASILLO
          </button>
        </div>
      )}

      {/* 1. EFECTO DE GLITCH DE PANTALLA COMPLETA (CAINE EVENT) */}
      {isGlitching && (
        <div className="absolute inset-0 bg-red-950/40 pointer-events-none mix-blend-difference animate-pulse z-40">
          {/* Scanlines / Ruido Digital */}
          <div className="absolute inset-0 opacity-40 bg-[linear-gradient(rgba(18,16,16,0)_50%,_rgba(0,0,0,0.25)_50%),_linear-gradient(90deg,_rgba(255,0,0,0.06),_rgba(0,255,0,0.02),_rgba(0,0,255,0.06))] bg-[length:100%_4px,_6px_100%] animate-[flicker_0.15s_infinite]" />
          
          {/* Alerta de Error Glitch */}
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <div className="bg-red-600/90 border-4 border-yellow-400 text-white font-mono px-6 py-4 rounded-lg shadow-[0_0_30px_rgba(255,0,0,0.8)] animate-bounce max-w-sm text-center">
              <h2 className="text-xl font-black uppercase tracking-wider text-yellow-300">⚠️ ADVERTENCIA ⚠️</h2>
              <p className="text-sm mt-2 font-bold">SOBRECARGA DETECTADA EN EL CORE DE CAINE</p>
              <div className="w-full bg-red-950 h-2 mt-3 rounded-full overflow-hidden">
                <div className="bg-yellow-400 h-full animate-[progress_2.5s_linear_infinite]" style={{ width: '100%' }} />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 2. CONTROLES DE EMOCIONES DE LOS PERSONAJES (Izquierda superior) */}
      <div className="absolute top-14 left-3 sm:top-20 sm:left-4 pointer-events-auto flex flex-col gap-1.5 sm:gap-3 max-w-[280px]">
        {/* Panel Pomni */}
        <div className="bg-black/70 border border-red-500/50 rounded-xl p-2 sm:p-3 backdrop-blur-md shadow-lg transition-all duration-300">
          <button 
            onClick={() => setPomniOpen(!pomniOpen)}
            className="w-full flex items-center justify-between text-left focus:outline-none pointer-events-auto"
          >
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
              <span className="text-[10px] sm:text-xs font-black tracking-wider text-red-400 uppercase">Pomni Emotion</span>
            </div>
            <span className="text-gray-400 text-[9px] sm:text-xs font-bold leading-none">{pomniOpen ? '▲' : '▼'}</span>
          </button>
          
          {pomniOpen && (
            <div className="grid grid-cols-2 gap-1 mt-2 animate-[panelFadeInUp_0.2s_ease-out]">
              {[
                { id: 'felicidad', label: '😊 Alegre', color: 'hover:bg-green-600 border-green-500' },
                { id: 'enojo', label: '😡 Enojada', color: 'hover:bg-red-600 border-red-500' },
                { id: 'tristeza', label: '😢 Triste', color: 'hover:bg-blue-600 border-blue-500' },
                { id: 'solitaria', label: '🌀 Ansiosa', color: 'hover:bg-purple-600 border-purple-500' }
              ].map((emo) => (
                <button
                  key={emo.id}
                  onClick={() => setPomniEmotion(emo.id as EmotionType)}
                  className={`text-[9px] sm:text-xs py-1 px-1.5 rounded border bg-black/40 font-bold transition-all duration-200 uppercase ${emo.color} ${
                    pomniEmotion === emo.id 
                      ? 'bg-red-600 border-yellow-400 text-white scale-[1.02] shadow-[0_0_8px_rgba(239,68,68,0.5)]' 
                      : 'text-gray-300'
                  }`}
                >
                  {emo.label}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Panel Caine */}
        <div className="bg-black/70 border border-yellow-500/50 rounded-xl p-2 sm:p-3 backdrop-blur-md shadow-lg transition-all duration-300">
          <button 
            onClick={() => setCaineOpen(!caineOpen)}
            className="w-full flex items-center justify-between text-left focus:outline-none pointer-events-auto"
          >
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-yellow-500 animate-pulse" />
              <span className="text-[10px] sm:text-xs font-black tracking-wider text-yellow-400 uppercase">Caine Emotion</span>
            </div>
            <span className="text-gray-400 text-[9px] sm:text-xs font-bold leading-none">{caineOpen ? '▲' : '▼'}</span>
          </button>
          
          {caineOpen && (
            <div className="flex flex-col gap-1 mt-2 animate-[panelFadeInUp_0.2s_ease-out]">
              {[
                { id: 'felicidad', label: '😁 Feliz / Anfitrión', color: 'hover:bg-yellow-600 border-yellow-500' },
                { id: 'tristeza', label: '😢 Triste / Melancólico', color: 'hover:bg-blue-600 border-blue-500' },
                { id: 'enojo', label: '👹 Enojado / Desquiciado', color: 'hover:bg-red-600 border-red-500' }
              ].map((emo) => (
                <button
                  key={emo.id}
                  onClick={() => setCaineEmotion(emo.id as CaineEmotionType)}
                  className={`text-[9px] sm:text-xs py-1 px-2 rounded border bg-black/40 font-bold transition-all duration-200 uppercase text-left ${emo.color} ${
                    caineEmotion === emo.id 
                      ? 'bg-yellow-500 border-white text-black scale-[1.02] shadow-[0_0_8px_rgba(234,179,8,0.5)]' 
                      : 'text-gray-300'
                  }`}
                >
                  {emo.label}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Panel de Espacios, Calma y Abstracción */}
        <div className="bg-black/70 border border-purple-500/50 rounded-xl p-2 sm:p-3 backdrop-blur-md shadow-lg transition-all duration-300">
          <button 
            onClick={() => setSpacesOpen(!spacesOpen)}
            className="w-full flex items-center justify-between text-left focus:outline-none pointer-events-auto"
          >
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-purple-500 animate-pulse" />
              <span className="text-[10px] sm:text-xs font-black tracking-wider text-purple-400 uppercase">Espacios & Calma</span>
            </div>
            <span className="text-gray-400 text-[9px] sm:text-xs font-bold leading-none">{spacesOpen ? '▲' : '▼'}</span>
          </button>
          
          {spacesOpen && (
            <div className="mt-2 space-y-2 animate-[panelFadeInUp_0.2s_ease-out]">
              <div className="flex justify-between items-center bg-black/30 px-1.5 py-1 rounded border border-purple-900/20">
                <span className="text-[9px] font-bold text-gray-400 uppercase">ZONA ACTUAL:</span>
                <span className="text-[9px] font-mono text-cyan-400 uppercase font-extrabold">
                  {currentZone === 'circus' ? '🎪 Circo' : currentZone === 'dormitories' ? '🚪 Cuartos' : '🌌 Vacío'}
                </span>
              </div>

              {/* Calmness indicator bar */}
              <div className="bg-black/40 p-1.5 rounded border border-purple-900/30">
                <div className="flex justify-between text-[8px] sm:text-[9px] font-bold text-gray-300 mb-0.5">
                  <span>🧘 CALMA</span>
                  <span className="text-cyan-400 font-black">{calmness}%</span>
                </div>
                <div className="w-full bg-purple-950 h-1.5 sm:h-2 rounded-full overflow-hidden border border-purple-800">
                  <div 
                    className="bg-gradient-to-r from-purple-500 to-cyan-400 h-full transition-all duration-500" 
                    style={{ width: `${calmness}%` }} 
                  />
                </div>
                <p className="text-[8px] text-gray-400 mt-0.5 leading-tight">
                  {isAbstracted
                    ? '💀 Abstraída. Locura irreversible.'
                    : currentZone === 'darkness' 
                      ? '🌌 La oscuridad te calma.' 
                      : '🎪 El ruido te agita.'}
                </p>
              </div>

              {/* Zone Selection Buttons */}
              <div className="flex flex-col gap-0.5">
                <span className="text-[8px] font-bold text-gray-400 uppercase">Viaje rápido de Zonas:</span>
                <div className="grid grid-cols-3 gap-1">
                  {[
                    { id: 'circus', label: '🎪 Circo' },
                    { id: 'dormitories', label: '🚪 Cuartos' },
                    { id: 'darkness', label: '🌌 Vacío' }
                  ].map((zone) => (
                    <button
                      key={zone.id}
                      onClick={() => setZone(zone.id as ZoneType)}
                      className={`text-[8px] py-1 px-0.5 rounded font-black border transition-all duration-200 uppercase leading-none ${
                        currentZone === zone.id 
                          ? 'bg-purple-600 border-yellow-400 text-white scale-[1.02] shadow' 
                          : 'bg-black/40 border-purple-900/50 text-gray-300 hover:bg-purple-950/40'
                      }`}
                    >
                      {zone.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Abstraction Toggler Button */}
              <div className="pt-2 border-t border-purple-500/20">
                <button
                  onClick={() => {
                    if (!isAbstracted) {
                      setAbstracted(true);
                    }
                  }}
                  disabled={isAbstracted}
                  className={`w-full py-1.5 px-2 rounded border-2 text-[10px] font-black transition-all duration-300 uppercase ${
                    isAbstracted
                      ? 'bg-gradient-to-r from-red-950 to-neutral-900 border-red-950/40 text-red-500/60 cursor-not-allowed scale-95 opacity-80'
                      : 'bg-black/60 border-purple-500 hover:bg-purple-900/40 text-purple-300 hover:text-white hover:scale-[1.02]'
                  }`}
                >
                  {isAbstracted ? '💀 ABSTRACCIÓN IRREVERSIBLE' : '🧬 ABSTRAERSE (BESTIA)'}
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Panel Acto III: El Despertar de la Consciencia */}
        <div className="bg-black/85 border border-yellow-500/50 rounded-xl p-2 sm:p-3 backdrop-blur-md shadow-lg transition-all duration-300">
          <div className="flex items-center gap-2 mb-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-yellow-400 animate-ping" />
            <span className="text-[10px] sm:text-xs font-black tracking-wider text-yellow-400 uppercase">Acto III: El Despertar</span>
          </div>
          
          <div className="space-y-1.5 text-[9px] sm:text-[10px]">
            <div className="flex justify-between items-center bg-yellow-950/20 px-1.5 py-1 rounded border border-yellow-800/30">
              <span className="text-gray-400 uppercase font-bold text-[8px]">Personaje Jugable:</span>
              <span className="text-yellow-400 font-extrabold uppercase text-[10px]">{controlledCharacter}</span>
            </div>

            {controlledCharacter !== 'pomni' && (
              <button
                onClick={() => setControlledCharacter('pomni')}
                className="w-full py-1 px-1.5 bg-yellow-600 hover:bg-yellow-500 border border-white rounded text-white font-bold uppercase transition-all shadow pointer-events-auto"
              >
                🔙 Volver a Pomni
              </button>
            )}

            <div className="grid grid-cols-2 gap-1 pt-0.5">
              <button
                onClick={() => {
                  triggerHugEvent();
                  setZone('darkness'); // Hug happens in darkness
                }}
                className="py-1 px-0.5 bg-gradient-to-r from-purple-800 to-pink-700 hover:from-purple-700 hover:to-pink-600 border border-purple-500/40 rounded text-white font-extrabold uppercase transition-all text-center leading-normal pointer-events-auto"
                title="Un integrante te abraza aleatoriamente en la oscuridad"
              >
                🤝 Hug Event
              </button>
              <button
                onClick={triggerAbstractionEvent}
                className="py-1 px-0.5 bg-gradient-to-r from-red-800 to-amber-700 hover:from-red-700 hover:to-amber-600 border border-red-500/40 rounded text-white font-extrabold uppercase transition-all text-center leading-normal pointer-events-auto"
                title="Muestra el destino final de Pomni abstraída"
              >
                🌀 Abstraerse
              </button>
            </div>

            <button
              onClick={() => {
                resetAllNarrative();
                setZone('circus');
              }}
              className="w-full py-1 bg-neutral-800 hover:bg-neutral-700 border border-neutral-600 rounded text-gray-300 font-bold uppercase tracking-wider transition-all mt-1 pointer-events-auto text-[8px]"
            >
              🔄 Reiniciar Acto III
            </button>
          </div>
        </div>
      </div>

      {/* 3. BOTÓN DE EVENTO DE SOBRECARGA DRAMÁTICO (Derecha superior) */}
      <div className="absolute top-20 right-4 pointer-events-auto flex flex-col gap-3.5 items-end">
        <button
          onClick={triggerCaineAngerEvent}
          disabled={isGlitching}
          className={`flex flex-col items-center justify-center p-3 rounded-xl border-2 font-black tracking-wider shadow-2xl transition-all duration-300 max-w-[200px] text-center ${
            isGlitching
              ? 'bg-red-950/80 border-gray-700 text-gray-500 cursor-not-allowed scale-95'
              : 'bg-gradient-to-br from-red-600 to-yellow-600 border-yellow-400 text-white hover:scale-105 active:scale-95 animate-[pulse_1.5s_infinite] shadow-[0_0_20px_rgba(220,38,38,0.6)]'
          }`}
        >
          <span className="text-xs uppercase">💥 Evento Especial 💥</span>
          <span className="text-sm uppercase font-extrabold mt-1">SOBRECARGA CAINE</span>
          <span className="text-[9px] font-mono opacity-80 mt-1 uppercase">MIRA A CAINE Y GLITCHEA</span>
        </button>

        {/* Panel especial cuando se está en la Oscuridad */}
        {currentZone === 'darkness' && (
          <div className="bg-black/80 border border-cyan-500/50 p-3 rounded-xl max-w-[200px] shadow-lg text-center animate-fade-in pointer-events-auto">
            <span className="text-[10px] font-black text-cyan-400 uppercase tracking-wide">🛌 OPCIONES DE SUEÑO</span>
            <p className="text-[9px] text-gray-400 mt-1 leading-tight mb-2">Duerme en la cama mística de Pomni para restaurar tu mente totalmente.</p>
            <button
              onClick={() => setSleeping(!isSleeping)}
              className="w-full py-1.5 px-2 bg-cyan-600 border border-white rounded-lg text-white text-[11px] font-black uppercase tracking-wider hover:bg-cyan-500 transition-all active:scale-95"
            >
              {isSleeping ? '⏰ DESPERTAR' : '🛌 DORMIRSE'}
            </button>
          </div>
        )}
      </div>

      {/* Guía del Circo (Colapsable interactiva) - recolocada en la esquina inferior derecha para evitar encimar el joystick de movimiento */}
      <div className="absolute bottom-4 right-3 sm:bottom-6 sm:right-4 pointer-events-auto z-30">
        {!guideOpen ? (
          <button
            onClick={() => setGuideOpen(true)}
            className="flex items-center gap-1.5 px-2.5 py-1 bg-black/80 border border-yellow-500/60 rounded-lg text-yellow-400 hover:text-white font-black text-[9px] sm:text-[10px] uppercase shadow-lg hover:scale-[1.02] active:scale-95 transition-all pointer-events-auto"
          >
            <span>📖</span> Ver Guía
          </button>
        ) : (
          <div className="relative text-left opacity-95 font-mono text-[8px] sm:text-[10px] text-gray-300 bg-black/85 p-2 sm:p-3 rounded-xl border border-yellow-500/40 max-w-[220px] sm:max-w-xs backdrop-blur-md shadow-2xl animate-[panelFadeInUp_0.2s_ease-out] pointer-events-auto">
            <div className="flex justify-between items-center mb-1 pb-1 border-b border-gray-800/50">
              <span className="font-black text-yellow-400 uppercase text-[9px] sm:text-[11px] tracking-wide">Guía Acto III</span>
              <button 
                onClick={() => setGuideOpen(false)}
                className="text-gray-400 hover:text-white font-bold text-[8px] sm:text-[10px] px-1 bg-white/10 hover:bg-white/20 rounded pointer-events-auto"
              >
                Ocultar
              </button>
            </div>
            <div className="space-y-1 mt-1 leading-normal">
              <p>• Haz click sobre un personaje para hablar.</p>
              <p>• Transfórmate en <span className="text-red-400 font-bold">🧬 BESTIA ABSTRAÍDA</span> y clica en alguien para atacarle.</p>
              <p>• Ve a los <span className="text-purple-400 font-bold">Dormitorios</span> o a la <span className="text-cyan-400 font-bold">Oscuridad</span> cruzando puertas o rápido en el panel.</p>
              <p>• Duerme en la cama oscura para sanar.</p>
            </div>
          </div>
        )}
      </div>

      {/* 4. CAJA DE DIÁLOGO DE CÓMIC DINÁMICO */}
      {activeDialogue && (
        <div className="absolute bottom-10 left-1/2 -translate-x-1/2 w-[90%] max-w-[550px] pointer-events-auto animate-[fadeInUp_0.3s_ease-out]">
          <div 
            className="bg-black/90 border-4 p-4 rounded-2xl shadow-[0_10px_25px_rgba(0,0,0,0.8)] backdrop-blur-md relative"
            style={{ borderColor: activeDialogue.color }}
          >
            {/* Esquina decorativa tipo cómic */}
            <div 
              className="absolute -top-3 left-6 px-3 py-0.5 rounded-full text-xs font-black uppercase tracking-wider text-black shadow-md border-2 border-black"
              style={{ backgroundColor: activeDialogue.color }}
            >
              {activeDialogue.speaker}
            </div>

            <div className="pt-2 text-sm sm:text-base font-bold text-white tracking-wide pr-8">
              "{activeDialogue.text}"
            </div>

            {/* Cerrar diálogo */}
            <button
              onClick={() => setActiveDialogue(null)}
              className="absolute top-2 right-2.5 w-6 h-6 flex items-center justify-center rounded-full bg-white/10 hover:bg-white/30 text-white transition-all text-xs font-black"
            >
              ✕
            </button>
          </div>
        </div>
      )}

      {/* ======================================================= */}
      {/* 5. OVERLAYS NARRATIVOS DE EVENTOS DEL ACTO III */}
      {/* ======================================================= */}

      {/* OVERLAY 1: BIENVENIDA / ENTRANDO AL CIRCO */}
      {isEnteringEventActive && (
        <div className="absolute inset-0 bg-black/95 backdrop-blur-md flex flex-col items-center justify-center pointer-events-auto z-50 p-4 sm:p-8 overflow-y-auto">
          <div className="max-w-2xl w-full bg-[#120024] border-4 border-yellow-400 rounded-3xl p-5 sm:p-8 text-center shadow-[0_0_50px_rgba(234,179,8,0.3)] flex flex-col items-center animate-[panelFadeInUp_0.4s_ease-out]">
            <span className="text-[11px] font-black text-yellow-400 uppercase tracking-[0.2em] mb-1">🎭 ACTO III: EL DESPERTAR DE LA CONSCIENCIA 🎭</span>
            <h1 className="text-xl sm:text-3xl font-black text-white uppercase tracking-tight mb-4">ENTRANDO AL ASOMBROSO CIRCO DIGITAL</h1>
            
            {/* Imagen Digital Circus */}
            <div className="w-full aspect-video rounded-2xl overflow-hidden border-2 border-purple-500 shadow-inner mb-6 relative">
              <img 
                src="/src/assets/images/digital_circus_1782396759127.jpg" 
                alt="Entering Digital Circus" 
                className="w-full h-full object-cover"
                referrerPolicy="no-referrer"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#120024] via-transparent to-transparent opacity-40" />
            </div>

            <p className="text-gray-300 text-xs sm:text-sm leading-relaxed max-w-lg mb-6">
              Pomni acaba de cruzar el umbral hacia una dimensión desconocida de fantasía desquiciada. El escenario brilla con una calidez artificial, pero el aire se siente saturado de códigos y glitches... Con su mente fragmentándose, busca desesperadamente un rincón de cordura o un abrazo místico en la oscuridad.
            </p>

            <button
              onClick={closeEnteringEvent}
              className="px-8 py-3 bg-gradient-to-r from-yellow-500 via-red-500 to-pink-500 border-2 border-white rounded-2xl text-white font-extrabold shadow-xl hover:scale-105 active:scale-95 transition-all text-xs uppercase tracking-wider animate-[pulse_1.5s_infinite]"
            >
              👁️ EMPEZAR NAVEGACIÓN EN ACTO III
            </button>
          </div>
        </div>
      )}

      {/* OVERLAY 2: EL ABRAZO DE UN INTEGRANTE EN LA OSCURIDAD */}
      {isHugEventActive && (
        <div className="absolute inset-0 bg-black/95 backdrop-blur-md flex flex-col items-center justify-center pointer-events-auto z-50 p-4 sm:p-8 overflow-y-auto">
          <div className="max-w-2xl w-full bg-[#1b0a2a] border-4 border-purple-500 rounded-3xl p-5 sm:p-8 text-center shadow-[0_0_50px_rgba(168,85,247,0.4)] flex flex-col items-center animate-[panelFadeInUp_0.4s_ease-out]">
            <span className="text-[11px] font-black text-purple-400 uppercase tracking-[0.2em] mb-1">🤝 ENCUENTRO EN EL VACÍO OSCURO 🤝</span>
            <h1 className="text-xl sm:text-3xl font-black text-white uppercase tracking-tight mb-4">
              ¡ABRAZO EN LA OSCURIDAD!
            </h1>
            
            {/* Imagen Digital Circus 2 - El Abrazo */}
            <div className="w-full aspect-video rounded-2xl overflow-hidden border-2 border-pink-500 shadow-inner mb-6 relative">
              <img 
                src="/src/assets/images/digital_circus_2_1782396786705.jpg" 
                alt="Pomni Hug" 
                className="w-full h-full object-cover"
                referrerPolicy="no-referrer"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#1b0a2a] via-transparent to-transparent opacity-40" />
            </div>

            <div className="bg-purple-950/40 border border-purple-800 px-4 py-3 rounded-xl mb-6 max-w-lg">
              <p className="text-gray-300 text-xs sm:text-sm leading-relaxed">
                En medio de la abrumadora nada del vacío, una figura corre hacia Pomni para darle un cálido abrazo sincero. Ese integrante aleatorio que ha decidido apoyarla para no perder la cabeza es <span className="text-pink-400 font-extrabold uppercase text-sm">{huggedByMember}</span>.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 w-full justify-center">
              <button
                onClick={() => {
                  if (huggedByMember) {
                    setControlledCharacter(huggedByMember);
                  }
                  closeHugEvent();
                }}
                className="px-6 py-3 bg-gradient-to-r from-pink-500 to-purple-600 border-2 border-white rounded-2xl text-white font-extrabold shadow-xl hover:scale-105 active:scale-95 transition-all text-xs uppercase tracking-wider"
              >
                🧬 CONTROLAR A {huggedByMember?.toUpperCase()} EN LA HABITACIÓN DE RECUERDOS
              </button>
              <button
                onClick={closeHugEvent}
                className="px-5 py-3 bg-neutral-800 border border-neutral-600 rounded-2xl text-gray-300 hover:text-white transition-all text-xs uppercase font-bold"
              >
                Volver
              </button>
            </div>
          </div>
        </div>
      )}

      {/* OVERLAY 3: LA ABSTRACCIÓN DE POMNI */}
      {isAbstractionEventActive && (
        <div className="absolute inset-0 bg-black/95 backdrop-blur-md flex flex-col items-center justify-center pointer-events-auto z-50 p-4 sm:p-8 overflow-y-auto">
          <div className="max-w-2xl w-full bg-[#1a0505] border-4 border-red-500 rounded-3xl p-5 sm:p-8 text-center shadow-[0_0_50px_rgba(239,68,68,0.4)] flex flex-col items-center animate-[panelFadeInUp_0.4s_ease-out]">
            <span className="text-[11px] font-black text-red-500 uppercase tracking-[0.2em] mb-1">💀 COLAPSO PSICOLÓGICO TOTAL 💀</span>
            <h1 className="text-xl sm:text-3xl font-black text-white uppercase tracking-tight mb-4">POMNI SE HA ABSTRAÍDO</h1>
            
            {/* Imagen Digital Circus 1 - Pomni Abstraída */}
            <div className="w-full aspect-video rounded-2xl overflow-hidden border-2 border-red-500 shadow-inner mb-6 relative">
              <img 
                src="/src/assets/images/digital_circus_1_1782396772231.jpg" 
                alt="Pomni Abstraction" 
                className="w-full h-full object-cover"
                referrerPolicy="no-referrer"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#1a0505] via-transparent to-transparent opacity-40" />
            </div>

            <p className="text-gray-300 text-xs sm:text-sm leading-relaxed max-w-lg mb-6">
              El dolor de olvidar su vida humana y estar atrapada para siempre en la simulación ha sobrecargado a Pomni. Su mente colapsa y se abstrae por completo, convirtiéndose en una bestia colosal de múltiples ojos neón, cables y glitchs...
            </p>

            <button
              onClick={closeAbstractionEvent}
              className="px-6 py-3 bg-gradient-to-r from-red-600 to-amber-600 border-2 border-white rounded-2xl text-white font-extrabold shadow-xl hover:scale-105 active:scale-95 transition-all text-xs uppercase tracking-wider"
            >
              Cerrar y jugar como Bestia
            </button>
          </div>
        </div>
      )}

      {/* CSS Animaciones Especiales */}
      <style>{`
        @keyframes panelFadeInUp {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translate(-50%, 20px);
          }
          to {
            opacity: 1;
            transform: translate(-50%, 0);
          }
        }
        @keyframes flicker {
          0% { opacity: 0.38; }
          50% { opacity: 0.42; }
          100% { opacity: 0.38; }
        }
        @keyframes progress {
          0% { width: 0%; }
          100% { width: 100%; }
        }
        @keyframes sleep {
          0% {
            opacity: 0;
            transform: translate(0, 0) scale(0.6);
          }
          50% {
            opacity: 0.8;
          }
          100% {
            opacity: 0;
            transform: translate(15px, -35px) scale(1.1);
          }
        }
      `}</style>
    </div>
  );
}
