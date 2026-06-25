import { create } from 'zustand';
import * as THREE from 'three';

export type EmotionType = 'felicidad' | 'enojo' | 'tristeza' | 'solitaria';
export type CaineEmotionType = 'felicidad' | 'enojo' | 'tristeza';
export type ZoneType = 'circus' | 'dormitories' | 'darkness';

interface GameState {
  move: { x: number; y: number };
  look: { x: number; y: number };
  setMove: (x: number, y: number) => void;
  setLook: (x: number, y: number) => void;

  // Emotional states
  pomniEmotion: EmotionType;
  caineEmotion: CaineEmotionType;
  setPomniEmotion: (emotion: EmotionType) => void;
  setCaineEmotion: (emotion: CaineEmotionType) => void;

  // Dialogue system
  activeDialogue: { speaker: string; text: string; color: string } | null;
  setActiveDialogue: (dialogue: { speaker: string; text: string; color: string } | null) => void;

  // Glitch event and camera overrides
  isGlitching: boolean;
  cameraFocusTarget: [number, number, number] | null;
  triggerCaineAngerEvent: () => void;

  // --- NEW FEATURES FOR CIRCUS EXPANSION ---
  currentZone: ZoneType;
  isAbstracted: boolean;
  isSleeping: boolean;
  calmness: number; // 0 to 100, restored in darkness, decreases outside
  attackedMembers: Record<string, boolean>; // track who is glitched/attacked
  isTabletSupportActive: boolean;
  joystickRadius: number;
  touchSensitivity: number;
  setZone: (zone: ZoneType) => void;
  setAbstracted: (abstracted: boolean) => void;
  setSleeping: (sleeping: boolean) => void;
  setTabletSupportActive: (active: boolean) => void;
  setJoystickRadius: (radius: number) => void;
  setTouchSensitivity: (sensitivity: number) => void;
  attackMember: (memberId: string) => void;
  wakeUp: () => void;
  resetAttacks: () => void;

  // --- ACT III NARRATIVE SYSTEM ---
  huggedByMember: 'jax' | 'kinger' | 'ragatha' | 'zooble' | null;
  controlledCharacter: 'pomni' | 'jax' | 'kinger' | 'ragatha' | 'zooble';
  isEnteringEventActive: boolean;
  isHugEventActive: boolean;
  isAbstractionEventActive: boolean;
  closeEnteringEvent: () => void;
  triggerHugEvent: () => void;
  closeHugEvent: () => void;
  triggerAbstractionEvent: () => void;
  closeAbstractionEvent: () => void;
  setControlledCharacter: (character: 'pomni' | 'jax' | 'kinger' | 'ragatha' | 'zooble') => void;
  resetAllNarrative: () => void;
}

export const useInputStore = create<GameState>((set, get) => ({
  move: { x: 0, y: 0 },
  look: { x: 0, y: 0 },
  setMove: (x, y) => set({ move: { x, y } }),
  setLook: (x, y) => set({ look: { x, y } }),

  pomniEmotion: 'felicidad',
  caineEmotion: 'felicidad',
  setPomniEmotion: (emotion) => set({ pomniEmotion: emotion }),
  setCaineEmotion: (emotion) => set({ caineEmotion: emotion }),

  activeDialogue: null,
  setActiveDialogue: (dialogue) => set({ activeDialogue: dialogue }),

  isGlitching: false,
  cameraFocusTarget: null,
  triggerCaineAngerEvent: () => {
    set({ 
      cameraFocusTarget: [0, 4.2, -15], 
      isGlitching: true,
      activeDialogue: { speaker: "SISTEMA", text: "ERROR: Sobrecarga Digital detectada...", color: "#ff1744" }
    });
    
    setTimeout(() => {
      set({ 
        caineEmotion: 'enojo',
        activeDialogue: { speaker: "CAINE", text: "¡¡NO HAY SALIDA!! ¡¡EL CIRCO ES PERFECTO!!", color: "#d50000" }
      });
    }, 2500);

    setTimeout(() => {
      set({ isGlitching: false });
    }, 5000);

    setTimeout(() => {
      set({ cameraFocusTarget: null });
    }, 7000);
  },

  // --- NEW STATES INITIALIZATION ---
  currentZone: 'circus',
  isAbstracted: false,
  isSleeping: false,
  calmness: 50,
  attackedMembers: {},
  isTabletSupportActive: false,
  joystickRadius: 65,
  touchSensitivity: 1.0,

  // --- ACT III NARRATIVE INITIALIZATION ---
  huggedByMember: null,
  controlledCharacter: 'pomni',
  isEnteringEventActive: true, // Show entering cinematic on startup
  isHugEventActive: false,
  isAbstractionEventActive: false,

  closeEnteringEvent: () => set({ isEnteringEventActive: false }),

  triggerHugEvent: () => {
    const members: ('jax' | 'kinger' | 'ragatha' | 'zooble')[] = ['jax', 'kinger', 'ragatha', 'zooble'];
    const randomMember = members[Math.floor(Math.random() * members.length)];
    set({
      huggedByMember: randomMember,
      isHugEventActive: true
    });
  },

  closeHugEvent: () => set({ isHugEventActive: false }),

  triggerAbstractionEvent: () => {
    set({
      isAbstracted: true,
      isAbstractionEventActive: true,
      pomniEmotion: 'solitaria'
    });
  },

  closeAbstractionEvent: () => set({ isAbstractionEventActive: false }),

  setControlledCharacter: (character) => {
    set({ controlledCharacter: character });
    set({
      activeDialogue: {
        speaker: "SISTEMA",
        text: `¡Ahora controlas a ${character.toUpperCase()}! Explora el vacío para encontrar la Habitación de los Recuerdos.`,
        color: "#e040fb"
      }
    });
  },

  resetAllNarrative: () => {
    set({
      huggedByMember: null,
      controlledCharacter: 'pomni',
      isEnteringEventActive: false,
      isHugEventActive: false,
      isAbstractionEventActive: false,
      isAbstracted: false,
      currentZone: 'circus',
      calmness: 50,
      attackedMembers: {}
    });
  },

  setTabletSupportActive: (active) => set({ isTabletSupportActive: active }),
  setJoystickRadius: (radius) => set({ joystickRadius: radius }),
  setTouchSensitivity: (sensitivity) => set({ touchSensitivity: sensitivity }),

  setZone: (zone) => {
    set({ currentZone: zone });
    if (zone === 'darkness') {
      set({
        activeDialogue: {
          speaker: "SISTEMA",
          text: "Has entrado en la Profunda Oscuridad de los Dormitorios... El silencio y la negrura te rodean. Sientes una profunda tranquilidad...",
          color: "#9c27b0"
        }
      });
      // Darkness calms Pomni down
      const interval = setInterval(() => {
        const state = get();
        if (state.currentZone !== 'darkness') {
          clearInterval(interval);
          return;
        }
        if (state.calmness < 100) {
          const nextCalm = Math.min(100, state.calmness + 10);
          set({ calmness: nextCalm });
          if (nextCalm === 100 && state.isAbstracted) {
            set({ 
              activeDialogue: {
                speaker: "SISTEMA",
                text: "Estás en calma, pero la abstracción digital es permanente e irreversible...",
                color: "#ff1744"
              }
            });
          }
        }
      }, 1500);
    } else {
      set({
        activeDialogue: {
          speaker: "SISTEMA",
          text: `Te encuentras en: ${zone === 'circus' ? 'El Escenario Principal' : 'El Pasillo de los Dormitorios'}`,
          color: "#00e5ff"
        }
      });
    }
  },

  setAbstracted: (abstracted) => {
    set({ isAbstracted: abstracted });
    if (abstracted) {
      set({
        pomniEmotion: 'solitaria',
        activeDialogue: {
          speaker: "POMNI ABSTRAÍDA",
          text: "¡¡GgRRR... KAUFMO... NO HAY SALIDA... ERROR 404!!",
          color: "#ff1744"
        }
      });
    } else {
      set({
        activeDialogue: {
          speaker: "POMNI",
          text: "He recuperado mi forma... Menos mal. No quiero ser un monstruo glitcheado para siempre.",
          color: "#00e676"
        }
      });
    }
  },

  setSleeping: (sleeping) => {
    set({ isSleeping: sleeping });
    if (sleeping) {
      set({
        activeDialogue: {
          speaker: "SISTEMA",
          text: "Pomni se ha quedado dormida en la reconfortante oscuridad... Soñando con una salida inexistente...",
          color: "#ffffff"
        }
      });
    } else {
      set({
        activeDialogue: {
          speaker: "POMNI",
          text: "Ah... ¡Qué sueño tan extraño! Sigo en este maldito circo digital...",
          color: "#e1f5fe"
        }
      });
    }
  },

  attackMember: (memberId) => {
    const state = get();
    if (!state.isAbstracted) {
      set({
        activeDialogue: {
          speaker: "SISTEMA",
          text: "Solo puedes atacar a los integrantes del circo si estás ABSTRAÍDA (transformada en monstruo).",
          color: "#ffeb3b"
        }
      });
      return;
    }

    // Set member as glitched/attacked
    const updatedAttacked = { ...state.attackedMembers, [memberId]: true };
    set({ attackedMembers: updatedAttacked });

    // Dialogue reactions depending on who is attacked
    const speaker = memberId.toUpperCase();
    let reactionText = "";
    let reactionColor = "#ffffff";

    switch (memberId) {
      case 'jax':
        reactionText = "¡Oye, fenómeno de feria glitcheado! ¡Mantén tus garras de pixel lejos de mí!";
        reactionColor = "#9c27b0";
        break;
      case 'kinger':
        reactionText = "¡¡AAAARRGGHH!! ¡¡INSECTOS GIGANTES CON MIL OJOS!! ¡¡A SALVO EN MI TORRE!!";
        reactionColor = "#673ab7";
        break;
      case 'ragatha':
        reactionText = "¡Pomni, por favor reacciona! ¡No te dejes llevar por la abstracción como Kaufmo!";
        reactionColor = "#1976d2";
        break;
      case 'zooble':
        reactionText = "¡Grandioso, otra pieza de mi cuerpo rota por culpa de un loco abstracto! ¡Te odio!";
        reactionColor = "#e91e63";
        break;
      case 'caine':
        reactionText = "¡¡ALERTA DE SEGURIDAD!! ¡¡UN INTEGRANTE COMPLEMENTARIO SE HA ABSTRAÍDO TOTALMENTE!! ¡¡ENVIANDO AL SÓTANO!!";
        reactionColor = "#ff1744";
        break;
    }

    set({
      activeDialogue: {
        speaker,
        text: reactionText,
        color: reactionColor
      }
    });

    // Automatically recover the member after 8 seconds
    setTimeout(() => {
      const current = get().attackedMembers;
      if (current[memberId]) {
        const next = { ...current };
        delete next[memberId];
        set({ attackedMembers: next });
      }
    }, 8000);
  },

  wakeUp: () => {
    const state = get();
    if (state.isSleeping) {
      set({ isSleeping: false });
    }
    // Wake up from sleep & return from darkness to the dorm corridors
    set({ currentZone: 'dormitories' });
    set({
      activeDialogue: {
        speaker: "POMNI",
        text: "Me desperté y salí de la oscuridad. El pasillo de los dormitorios se ve un poco más familiar.",
        color: "#2196f3"
      }
    });
  },

  resetAttacks: () => {
    set({ attackedMembers: {} });
  }
}));

