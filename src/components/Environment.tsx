import React, { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { createCheckerboardTexture, createStripesTexture } from '../utils/textures';
import { Float } from '@react-three/drei';
import { useInputStore } from '../store';

export default function Environment() {
  const tentRadius = 30;
  
  // State from zustand
  const caineEmotion = useInputStore((state) => state.caineEmotion);
  const isGlitching = useInputStore((state) => state.isGlitching);
  const setActiveDialogue = useInputStore((state) => state.setActiveDialogue);
  const currentZone = useInputStore((state) => state.currentZone);
  const setZone = useInputStore((state) => state.setZone);
  const attackedMembers = useInputStore((state) => state.attackedMembers);
  const attackMember = useInputStore((state) => state.attackMember);
  const isAbstracted = useInputStore((state) => state.isAbstracted);
  const controlledCharacter = useInputStore((state) => state.controlledCharacter);

  // Procedural textures
  const floorTexture = useMemo(() => {
    const tex = createCheckerboardTexture('#111111', '#ffffff', 1024, 20); // Black & white checkerboard
    tex.repeat.set(10, 10);
    return tex;
  }, []);

  const wallTexture = useMemo(() => {
    const tex = createStripesTexture('#e53935', '#ffeb3b', 1024, 32); // Red & yellow striped tent walls
    tex.repeat.set(4, 1);
    return tex;
  }, []);

  const voidTexture = useMemo(() => {
    const tex = createCheckerboardTexture('#110022', '#000000', 512, 10); // Cosmic/Glitch black void
    tex.repeat.set(20, 20);
    return tex;
  }, []);

  // Animation refs
  const time = useRef(0);
  const jaxRef = useRef<THREE.Group>(null);
  const kingerRef = useRef<THREE.Group>(null);
  const ragathaRef = useRef<THREE.Group>(null);
  const zoobleRef = useRef<THREE.Group>(null);
  const caineGroupRef = useRef<THREE.Group>(null);
  const caineHatRef = useRef<THREE.Group>(null);
  const jaxLeftEarRef = useRef<THREE.Group>(null);
  const jaxRightEarRef = useRef<THREE.Group>(null);

  // Limb refs for walking animations
  const jaxLeftLegRef = useRef<THREE.Group>(null);
  const jaxRightLegRef = useRef<THREE.Group>(null);
  const jaxLeftArmRef = useRef<THREE.Group>(null);
  const jaxRightArmRef = useRef<THREE.Group>(null);

  const ragathaLeftLegRef = useRef<THREE.Group>(null);
  const ragathaRightLegRef = useRef<THREE.Group>(null);
  const ragathaLeftArmRef = useRef<THREE.Group>(null);
  const ragathaRightArmRef = useRef<THREE.Group>(null);

  const zoobleLeftLegRef = useRef<THREE.Group>(null);
  const zoobleRightLegRef = useRef<THREE.Group>(null);
  const zoobleLeftArmRef = useRef<THREE.Group>(null);
  const zoobleRightArmRef = useRef<THREE.Group>(null);

  // Wandering states for characters in circus
  const wanderStates = useRef({
    jax: { pos: new THREE.Vector3(10, 0, 5), target: new THREE.Vector3(10, 0, 5), speed: 1.6, waitTime: 0, state: 'idle' as 'idle' | 'walking' },
    kinger: { pos: new THREE.Vector3(8, 0, -12), target: new THREE.Vector3(8, 0, -12), speed: 1.2, waitTime: 0, state: 'idle' as 'idle' | 'walking' },
    ragatha: { pos: new THREE.Vector3(-8, 0, -8), target: new THREE.Vector3(-8, 0, -8), speed: 1.4, waitTime: 0, state: 'idle' as 'idle' | 'walking' },
    zooble: { pos: new THREE.Vector3(-12, 0, -2), target: new THREE.Vector3(-12, 0, -2), speed: 1.0, waitTime: 0, state: 'idle' as 'idle' | 'walking' },
    caine: { pos: new THREE.Vector3(0, 2.5, -15), target: new THREE.Vector3(0, 2.5, -15), speed: 2.2, waitTime: 0, state: 'idle' as 'idle' | 'walking' },
  });

  // Decorative objects
  const decorRef = useRef<THREE.Group>(null);

  useFrame((state, delta) => {
    time.current += delta;
    const t = time.current;

    // 1. Jax Idle & Movement Animations
    if (jaxRef.current) {
      if (currentZone === 'darkness' || controlledCharacter === 'jax') {
        jaxRef.current.position.set(0, -100, 0);
      } else if (attackedMembers['jax']) {
        // Attack glitch shake
        const baseX = jaxRef.current.position.x;
        const baseZ = jaxRef.current.position.z;
        jaxRef.current.position.set(
          baseX + (Math.random() - 0.5) * 0.3,
          0.8 + Math.sin(t * 20) * 0.3,
          baseZ + (Math.random() - 0.5) * 0.3
        );
        jaxRef.current.rotation.y = t * 15;
      } else if (currentZone === 'dormitories') {
        jaxRef.current.position.set(-4.2, Math.sin(t * 1.5) * 0.08, 10);
        jaxRef.current.rotation.y = -Math.PI / 4 + Math.sin(t * 0.8) * 0.1;
      } else {
        // Circus zone: Wandering
        const stateObj = wanderStates.current.jax;
        if (stateObj.state === 'idle') {
          stateObj.waitTime -= delta;
          if (stateObj.waitTime <= 0) {
            const angle = Math.random() * Math.PI * 2;
            const dist = 3 + Math.random() * 12;
            stateObj.target.set(Math.cos(angle) * dist, 0, Math.sin(angle) * dist);
            stateObj.state = 'walking';
          }
        } else {
          const dir = new THREE.Vector3().subVectors(stateObj.target, stateObj.pos);
          const distToTarget = dir.length();
          if (distToTarget < 0.2) {
            stateObj.state = 'idle';
            stateObj.waitTime = 1.5 + Math.random() * 3;
          } else {
            dir.normalize();
            stateObj.pos.addScaledVector(dir, stateObj.speed * delta);
            const targetAngle = Math.atan2(dir.x, dir.z);
            const diff = targetAngle - jaxRef.current.rotation.y;
            const normalizedDiff = Math.atan2(Math.sin(diff), Math.cos(diff));
            jaxRef.current.rotation.y += normalizedDiff * 5 * delta;
          }
        }
        const bob = stateObj.state === 'walking' ? Math.abs(Math.sin(t * 5)) * 0.12 : Math.sin(t * 1.5) * 0.08;
        jaxRef.current.position.set(stateObj.pos.x, bob, stateObj.pos.z);
      }
      if (jaxLeftEarRef.current) jaxLeftEarRef.current.rotation.z = -0.08 + Math.sin(t * 3) * 0.05;
      if (jaxRightEarRef.current) jaxRightEarRef.current.rotation.z = 0.12 + Math.cos(t * 2) * 0.04;

      // Animaciones de balanceo de extremidades para caminar
      const isJaxWalking = (currentZone === 'circus' && wanderStates.current.jax.state === 'walking' && !attackedMembers['jax']);
      const swingSpeed = 10;
      if (jaxLeftLegRef.current) jaxLeftLegRef.current.rotation.x = isJaxWalking ? Math.sin(t * swingSpeed) * 0.5 : 0;
      if (jaxRightLegRef.current) jaxRightLegRef.current.rotation.x = isJaxWalking ? -Math.sin(t * swingSpeed) * 0.5 : 0;
      if (jaxLeftArmRef.current) jaxLeftArmRef.current.rotation.x = isJaxWalking ? -Math.sin(t * swingSpeed) * 0.4 : 0;
      if (jaxRightArmRef.current) jaxRightArmRef.current.rotation.x = isJaxWalking ? Math.sin(t * swingSpeed) * 0.4 : 0;
    }

    // 2. Kinger Idle & Movement Animations (Highly paranoic)
    if (kingerRef.current) {
      if (currentZone === 'darkness' || controlledCharacter === 'kinger') {
        kingerRef.current.position.set(0, -100, 0);
      } else if (attackedMembers['kinger']) {
        const baseX = kingerRef.current.position.x;
        const baseZ = kingerRef.current.position.z;
        kingerRef.current.position.set(
          baseX + (Math.random() - 0.5) * 0.4,
          0.8 + Math.sin(t * 20) * 0.3,
          baseZ + (Math.random() - 0.5) * 0.4
        );
        kingerRef.current.rotation.y = t * 15;
      } else if (currentZone === 'dormitories') {
        kingerRef.current.position.set(-4.2, Math.sin(t * 4) * 0.05, 0);
        kingerRef.current.rotation.y = Math.PI / 4 + Math.sin(t * 8) * 0.08;
      } else {
        // Circus zone: Wandering
        const stateObj = wanderStates.current.kinger;
        if (stateObj.state === 'idle') {
          stateObj.waitTime -= delta;
          if (stateObj.waitTime <= 0) {
            const angle = Math.random() * Math.PI * 2;
            const dist = 5 + Math.random() * 10;
            stateObj.target.set(Math.cos(angle) * dist, 0, Math.sin(angle) * dist);
            stateObj.state = 'walking';
          }
        } else {
          const dir = new THREE.Vector3().subVectors(stateObj.target, stateObj.pos);
          const distToTarget = dir.length();
          if (distToTarget < 0.2) {
            stateObj.state = 'idle';
            stateObj.waitTime = 1.0 + Math.random() * 2.5;
          } else {
            dir.normalize();
            stateObj.pos.addScaledVector(dir, stateObj.speed * delta);
            const targetAngle = Math.atan2(dir.x, dir.z);
            const diff = targetAngle - kingerRef.current.rotation.y;
            const normalizedDiff = Math.atan2(Math.sin(diff), Math.cos(diff));
            kingerRef.current.rotation.y += normalizedDiff * 5 * delta;
          }
        }
        const shiverX = (Math.random() - 0.5) * 0.04;
        const shiverZ = (Math.random() - 0.5) * 0.04;
        const bob = stateObj.state === 'walking' ? Math.abs(Math.sin(t * 6)) * 0.1 : Math.sin(t * 4) * 0.05;
        kingerRef.current.position.set(stateObj.pos.x + shiverX, bob, stateObj.pos.z + shiverZ);
      }
    }

    // 3. Ragatha Idle & Movement Animations
    if (ragathaRef.current) {
      if (currentZone === 'darkness' || controlledCharacter === 'ragatha') {
        ragathaRef.current.position.set(0, -100, 0);
      } else if (attackedMembers['ragatha']) {
        const baseX = ragathaRef.current.position.x;
        const baseZ = ragathaRef.current.position.z;
        ragathaRef.current.position.set(
          baseX + (Math.random() - 0.5) * 0.3,
          0.8 + Math.sin(t * 20) * 0.3,
          baseZ + (Math.random() - 0.5) * 0.3
        );
        ragathaRef.current.rotation.y = t * 15;
      } else if (currentZone === 'dormitories') {
        ragathaRef.current.position.set(4.2, Math.sin(t * 1.2) * 0.06, 10);
        ragathaRef.current.rotation.y = Math.PI / 4 + Math.cos(t * 0.6) * 0.08;
      } else {
        // Circus zone: Wandering
        const stateObj = wanderStates.current.ragatha;
        if (stateObj.state === 'idle') {
          stateObj.waitTime -= delta;
          if (stateObj.waitTime <= 0) {
            const angle = Math.random() * Math.PI * 2;
            const dist = 4 + Math.random() * 11;
            stateObj.target.set(Math.cos(angle) * dist, 0, Math.sin(angle) * dist);
            stateObj.state = 'walking';
          }
        } else {
          const dir = new THREE.Vector3().subVectors(stateObj.target, stateObj.pos);
          const distToTarget = dir.length();
          if (distToTarget < 0.2) {
            stateObj.state = 'idle';
            stateObj.waitTime = 2.0 + Math.random() * 3.5;
          } else {
            dir.normalize();
            stateObj.pos.addScaledVector(dir, stateObj.speed * delta);
            const targetAngle = Math.atan2(dir.x, dir.z);
            const diff = targetAngle - ragathaRef.current.rotation.y;
            const normalizedDiff = Math.atan2(Math.sin(diff), Math.cos(diff));
            ragathaRef.current.rotation.y += normalizedDiff * 5 * delta;
          }
        }
        const bob = stateObj.state === 'walking' ? Math.abs(Math.sin(t * 5)) * 0.14 : Math.sin(t * 1.2) * 0.06;
        ragathaRef.current.position.set(stateObj.pos.x, bob, stateObj.pos.z);
      }

      // Animaciones de balanceo de extremidades para caminar
      const isRagathaWalking = (currentZone === 'circus' && wanderStates.current.ragatha.state === 'walking' && !attackedMembers['ragatha']);
      const swingSpeed = 10;
      if (ragathaLeftLegRef.current) ragathaLeftLegRef.current.rotation.x = isRagathaWalking ? Math.sin(t * swingSpeed) * 0.5 : 0;
      if (ragathaRightLegRef.current) ragathaRightLegRef.current.rotation.x = isRagathaWalking ? -Math.sin(t * swingSpeed) * 0.5 : 0;
      if (ragathaLeftArmRef.current) ragathaLeftArmRef.current.rotation.x = isRagathaWalking ? -Math.sin(t * swingSpeed) * 0.4 : 0;
      if (ragathaRightArmRef.current) ragathaRightArmRef.current.rotation.x = isRagathaWalking ? Math.sin(t * swingSpeed) * 0.4 : 0;
    }

    // 4. Zooble Idle & Movement Animations
    if (zoobleRef.current) {
      if (currentZone === 'darkness' || controlledCharacter === 'zooble') {
        zoobleRef.current.position.set(0, -100, 0);
      } else if (attackedMembers['zooble']) {
        const baseX = zoobleRef.current.position.x;
        const baseZ = zoobleRef.current.position.z;
        zoobleRef.current.position.set(
          baseX + (Math.random() - 0.5) * 0.3,
          0.8 + Math.sin(t * 20) * 0.3,
          baseZ + (Math.random() - 0.5) * 0.3
        );
        zoobleRef.current.rotation.y = t * 15;
      } else if (currentZone === 'dormitories') {
        zoobleRef.current.position.set(4.2, Math.sin(t * 1.8) * 0.1, 0);
        zoobleRef.current.rotation.y = Math.PI / 3 + Math.sin(t * 0.5) * 0.15;
      } else {
        // Circus zone: Wandering
        const stateObj = wanderStates.current.zooble;
        if (stateObj.state === 'idle') {
          stateObj.waitTime -= delta;
          if (stateObj.waitTime <= 0) {
            const angle = Math.random() * Math.PI * 2;
            const dist = 3 + Math.random() * 12;
            stateObj.target.set(Math.cos(angle) * dist, 0, Math.sin(angle) * dist);
            stateObj.state = 'walking';
          }
        } else {
          const dir = new THREE.Vector3().subVectors(stateObj.target, stateObj.pos);
          const distToTarget = dir.length();
          if (distToTarget < 0.2) {
            stateObj.state = 'idle';
            stateObj.waitTime = 1.0 + Math.random() * 3.0;
          } else {
            dir.normalize();
            stateObj.pos.addScaledVector(dir, stateObj.speed * delta);
            const targetAngle = Math.atan2(dir.x, dir.z);
            const diff = targetAngle - zoobleRef.current.rotation.y;
            const normalizedDiff = Math.atan2(Math.sin(diff), Math.cos(diff));
            zoobleRef.current.rotation.y += normalizedDiff * 5 * delta;
          }
        }
        const bob = stateObj.state === 'walking' ? Math.abs(Math.sin(t * 4)) * 0.16 : Math.sin(t * 1.8) * 0.1;
        zoobleRef.current.position.set(stateObj.pos.x, bob, stateObj.pos.z);
      }

      // Animaciones de balanceo de extremidades para caminar
      const isZoobleWalking = (currentZone === 'circus' && wanderStates.current.zooble.state === 'walking' && !attackedMembers['zooble']);
      const swingSpeed = 10;
      if (zoobleLeftLegRef.current) zoobleLeftLegRef.current.rotation.x = isZoobleWalking ? Math.sin(t * swingSpeed) * 0.5 : 0;
      if (zoobleRightLegRef.current) zoobleRightLegRef.current.rotation.x = isZoobleWalking ? -Math.sin(t * swingSpeed) * 0.5 : 0;
      if (zoobleLeftArmRef.current) zoobleLeftArmRef.current.rotation.x = isZoobleWalking ? -Math.sin(t * swingSpeed) * 0.4 : 0;
      if (zoobleRightArmRef.current) zoobleRightArmRef.current.rotation.x = isZoobleWalking ? Math.sin(t * swingSpeed) * 0.4 : 0;
    }

    // 5. Caine Animations: Floating, jaws continuously chomping, head bobbing
    if (caineGroupRef.current) {
      if (currentZone === 'darkness') {
        caineGroupRef.current.position.set(0, -100, 0);
      } else if (attackedMembers['caine']) {
        const baseX = caineGroupRef.current.position.x;
        const baseZ = caineGroupRef.current.position.z;
        caineGroupRef.current.position.set(
          baseX + (Math.random() - 0.5) * 0.5,
          2.5 + Math.sin(t * 20) * 0.4,
          baseZ + (Math.random() - 0.5) * 0.5
        );
        caineGroupRef.current.rotation.y = t * 20;
      } else if (currentZone === 'dormitories') {
        caineGroupRef.current.position.set(0, 2.5 + Math.sin(t * 2.2) * 0.15, -5);
        caineGroupRef.current.rotation.set(0, Math.sin(t * 0.4) * 0.1, 0);
      } else {
        // Circus zone: Floating Wandering
        const stateObj = wanderStates.current.caine;
        if (stateObj.state === 'idle') {
          stateObj.waitTime -= delta;
          if (stateObj.waitTime <= 0) {
            const angle = Math.random() * Math.PI * 2;
            const dist = 1 + Math.random() * 15;
            stateObj.target.set(Math.cos(angle) * dist, 2.5, Math.sin(angle) * dist);
            stateObj.state = 'walking';
          }
        } else {
          const dir = new THREE.Vector3().subVectors(stateObj.target, stateObj.pos);
          const distToTarget = dir.length();
          if (distToTarget < 0.2) {
            stateObj.state = 'idle';
            stateObj.waitTime = 2.0 + Math.random() * 4.0;
          } else {
            dir.normalize();
            stateObj.pos.addScaledVector(dir, stateObj.speed * delta);
            const targetAngle = Math.atan2(dir.x, dir.z);
            const diff = targetAngle - caineGroupRef.current.rotation.y;
            const normalizedDiff = Math.atan2(Math.sin(diff), Math.cos(diff));
            caineGroupRef.current.rotation.y += normalizedDiff * 5 * delta;
          }
        }
        
        if (isGlitching) {
          caineGroupRef.current.position.set(
            stateObj.pos.x + (Math.random() - 0.5) * 0.4,
            2.5 + Math.sin(t * 15) * 0.5 + (Math.random() - 0.5) * 0.3,
            stateObj.pos.z + (Math.random() - 0.5) * 0.4
          );
          caineGroupRef.current.rotation.set(
            (Math.random() - 0.5) * 0.2,
            Math.sin(t * 20) * 0.5,
            (Math.random() - 0.5) * 0.2
          );
        } else {
          caineGroupRef.current.position.set(
            stateObj.pos.x,
            2.5 + Math.sin(t * 2.5) * 0.25,
            stateObj.pos.z
          );
          if (caineHatRef.current) {
            caineHatRef.current.rotation.z = Math.sin(t * 3.5) * 0.08;
            caineHatRef.current.position.y = 0.55 + Math.abs(Math.sin(t * 3.5)) * 0.1;
          }
        }
      }
    }

    // Rotate decorations for magic feeling - REMOVED to prevent lag as requested
  });

  // Dialogue handler helpers
  const handleJaxClick = () => {
    if (isAbstracted) {
      attackMember('jax');
      return;
    }
    const quotes = [
      "¿Qué pasa, Pomni? ¿Sigues buscando una salida inexistente?",
      "Je... la tía Ragatha te está buscando para algo aburrido.",
      "Caine organizará otra absurda aventura pronto, prepárate para sufrir.",
      "Me gusta coleccionar cosas... como la paciencia de los demás."
    ];
    const text = quotes[Math.floor(Math.random() * quotes.length)];
    setActiveDialogue({ speaker: "JAX", text, color: "#9c27b0" });
  };

  const handleKingerClick = () => {
    if (isAbstracted) {
      attackMember('kinger');
      return;
    }
    const quotes = [
      "¿¡INSECTOS!? ¡Juro que escuché grillos en las paredes!",
      "Oh, hola Pomni... No te preocupes, la locura es muy cómoda una vez te acostumbras.",
      "¿Has visto mi colección de tazas impenetrables? ¡Son hermosas!",
      "¡El circo es seguro! ¡Caine nos protege de los ojos de afuera!"
    ];
    const text = quotes[Math.floor(Math.random() * quotes.length)];
    setActiveDialogue({ speaker: "KINGER", text, color: "#673ab7" });
  };

  const handleRagathaClick = () => {
    if (isAbstracted) {
      attackMember('ragatha');
      return;
    }
    const quotes = [
      "¡Hola Pomni! Mantén la sonrisa, todo estará bien si nos apoyamos.",
      "Caine a veces exagera, pero quiere que seamos felices aquí dentro.",
      "¿Estás bien? Sé lo difícil que es al principio, pero te acostumbrarás.",
      "Intenta no hacer enojar a Caine... no le gusta perder el control."
    ];
    const text = quotes[Math.floor(Math.random() * quotes.length)];
    setActiveDialogue({ speaker: "RAGATHA", text, color: "#1976d2" });
  };

  const handleZoobleClick = () => {
    if (isAbstracted) {
      attackMember('zooble');
      return;
    }
    const quotes = [
      "No me molestes, estoy tratando de recordar dónde dejé mi pierna original.",
      "Esta aventura de Caine es una completa basura, como siempre.",
      "¿Qué? ¿Quieres mi opinión? Mi opinión es que todos estamos atrapados.",
      "Déjame ordenar mis piezas en paz."
    ];
    const text = quotes[Math.floor(Math.random() * quotes.length)];
    setActiveDialogue({ speaker: "ZOOBLE", text, color: "#e91e63" });
  };

  const handleCaineClick = () => {
    if (isAbstracted) {
      attackMember('caine');
      return;
    }
    if (caineEmotion === 'enojo') {
      setActiveDialogue({ 
        speaker: "CAINE", 
        text: "¡¡ESTOY MUY OCUPADO MANTENIENDO EL ORDEN EN ESTA REALIDAD!! ¡¡SÉ UN BUEN CLIENTE Y DIVIÉRTETE!!", 
        color: "#ff1744" 
      });
    } else if (caineEmotion === 'tristeza') {
      setActiveDialogue({ 
        speaker: "CAINE", 
        text: "Incluso una inteligencia artificial todopoderosa se pregunta a veces si hay algo más allá...", 
        color: "#29b6f6" 
      });
    } else {
      setActiveDialogue({ 
        speaker: "CAINE", 
        text: "¡¡BIENVENIDOS AL ASOMBROSO CIRCO DIGITAL!! ¡La aventura te espera, querido amigo!", 
        color: "#ffeb3b" 
      });
    }
  };

  return (
    <group>
      {/* Ambient and directional lights matching the active zone */}
      {currentZone === 'circus' && (
        <>
          <ambientLight intensity={0.5} />
          <pointLight position={[0, 18, 0]} intensity={1.8} distance={60} color="#ffeedd" />
          <pointLight position={[0, 4, 0]} intensity={2.2} distance={18} color="#ffd54f" />
          <directionalLight position={[10, 20, 10]} intensity={1.2} color="#ffffff" castShadow />
          <directionalLight position={[-10, 15, -10]} intensity={0.5} color="#00e5ff" />

          {/* Escenario Central */}
          <mesh position={[0, 0.1, 0]} rotation={[-Math.PI / 2, 0, 0]}>
            <cylinderGeometry args={[5.2, 5.2, 0.25, 32]} />
            <meshStandardMaterial color="#5d4037" roughness={0.6} metalness={0.1} />
          </mesh>
          <mesh position={[0, 0.23, 0]} rotation={[-Math.PI / 2, 0, 0]}>
            <ringGeometry args={[4.9, 5.1, 32]} />
            <meshBasicMaterial color="#e53935" />
          </mesh>

          {/* Suelo del Circo */}
          <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
            <circleGeometry args={[tentRadius, 40]} />
            <meshStandardMaterial map={floorTexture} roughness={0.7} />
          </mesh>

          {/* Paredes de la Carpa */}
          <mesh position={[0, 10, 0]}>
            <cylinderGeometry args={[tentRadius, tentRadius, 20, 40, 1, true]} />
            <meshStandardMaterial map={wallTexture} side={THREE.BackSide} roughness={0.8} />
          </mesh>

          {/* Techo de la Carpa */}
          <mesh position={[0, 25, 0]}>
            <coneGeometry args={[tentRadius, 10, 40, 1, true]} />
            <meshStandardMaterial map={wallTexture} side={THREE.BackSide} roughness={0.8} />
          </mesh>

          {/* Puerta mística física que conecta con los Dormitorios en z = -tentRadius */}
          <group position={[0, 0, -tentRadius + 1.5]} rotation={[0, 0, 0]} onClick={() => setZone('dormitories')}>
            <mesh position={[0, 2.2, 0]} castShadow>
              <boxGeometry args={[3.2, 4.4, 0.4]} />
              <meshStandardMaterial color="#ffd600" roughness={0.3} />
            </mesh>
            {/* Hoja de puerta */}
            <mesh position={[0, 2.2, 0.1]} castShadow>
              <boxGeometry args={[2.6, 4.0, 0.25]} />
              <meshStandardMaterial color="#d500f9" roughness={0.4} />
            </mesh>
            {/* Estrella dorada en la puerta */}
            <mesh position={[0, 2.2, 0.25]} rotation={[0, 0, Math.PI / 4]}>
              <boxGeometry args={[0.5, 0.5, 0.1]} />
              <meshBasicMaterial color="#ffeb3b" />
            </mesh>
            <pointLight position={[0, 3.5, 0.8]} color="#d500f9" intensity={2.5} distance={8} />
          </group>

          {/* Suelo del Vacío Exterior (Glitch Void) */}
          <mesh position={[0, -0.1, 0]} rotation={[-Math.PI / 2, 0, 0]}>
            <planeGeometry args={[250, 250]} />
            <meshBasicMaterial map={voidTexture} color="#553377" />
          </mesh>

          {/* DECORACIÓN ESTILO DIGITAL CIRCUS */}
          <group ref={decorRef}>
            {/* Candy Cane Columnas a los lados de la carpa */}
            {Array.from({ length: 8 }).map((_, i) => {
              const angle = (i * Math.PI) / 4;
              const r = tentRadius - 0.5;
              return (
                <group key={`col-${i}`} position={[Math.cos(angle) * r, 5, Math.sin(angle) * r]}>
                  <mesh>
                    <cylinderGeometry args={[0.25, 0.25, 10, 12]} />
                    <meshStandardMaterial color="#ffffff" roughness={0.5} />
                  </mesh>
                  {/* Espirales rojas */}
                  {Array.from({ length: 6 }).map((_, j) => (
                    <mesh key={`sp-${j}`} position={[0, -4 + j * 1.6, 0]} rotation={[0.4, angle, 0.4]}>
                      <torusGeometry args={[0.27, 0.05, 8, 16]} />
                      <meshBasicMaterial color="#f44336" />
                    </mesh>
                  ))}
                </group>
              );
            })}

            {/* Estrellas flotantes de colores neón (Estáticas para evitar lag) */}
            {Array.from({ length: 12 }).map((_, i) => {
              const angle = (i * Math.PI * 2) / 12;
              const dist = 14 + Math.random() * 8;
              const height = 6 + Math.random() * 9;
              const colors = ["#ff007f", "#39ff14", "#00e5ff", "#ffeb3b", "#e040fb"];
              const col = colors[i % colors.length];
              return (
                <group key={`star-${i}`} position={[Math.cos(angle) * dist, height, Math.sin(angle) * dist]} rotation={[Math.random(), Math.random(), 0]}>
                  <mesh>
                    <octahedronGeometry args={[0.5, 0]} />
                    <meshStandardMaterial color={col} emissive={col} emissiveIntensity={0.6} roughness={0.1} />
                  </mesh>
                  <mesh rotation={[Math.PI / 4, Math.PI / 4, 0]}>
                    <octahedronGeometry args={[0.35, 0]} />
                    <meshStandardMaterial color={col} emissive={col} emissiveIntensity={0.6} roughness={0.1} />
                  </mesh>
                </group>
              );
            })}

            {/* Anillos Gigantes de circo flotantes (Estáticos para evitar lag) */}
            {Array.from({ length: 4 }).map((_, i) => {
              const positions: [number, number, number][] = [
                [-12, 8, -12],
                [12, 10, -10],
                [-14, 9, 10],
                [10, 7, 12]
              ];
              const colors = ["#ff1744", "#00e5ff", "#ffeb3b", "#76ff03"];
              return (
                <mesh key={`ring-${i}`} position={positions[i]} rotation={[Math.PI / 6, 0, Math.PI / 4]}>
                  <torusGeometry args={[1.5, 0.15, 12, 24]} />
                  <meshStandardMaterial color={colors[i]} roughness={0.2} metalness={0.5} />
                </mesh>
              );
            })}

            {/* Cajas de Regalos en el Suelo */}
            <group position={[-6, 0.5, -6]} rotation={[0, 0.5, 0]}>
              <mesh castShadow>
                <boxGeometry args={[1, 1, 1]} />
                <meshStandardMaterial color="#ff1744" roughness={0.4} />
              </mesh>
              <mesh position={[0, 0.51, 0]}>
                <boxGeometry args={[1.05, 0.1, 0.2]} />
                <meshStandardMaterial color="#ffeb3b" />
              </mesh>
              <mesh position={[0, 0.51, 0]} rotation={[0, Math.PI / 2, 0]}>
                <boxGeometry args={[1.05, 0.1, 0.2]} />
                <meshStandardMaterial color="#ffeb3b" />
              </mesh>
            </group>
            <group position={[6, 0.4, 8]} rotation={[0, -0.3, 0]}>
              <mesh castShadow>
                <boxGeometry args={[0.8, 0.8, 0.8]} />
                <meshStandardMaterial color="#00e5ff" roughness={0.4} />
              </mesh>
              <mesh position={[0, 0.41, 0]}>
                <boxGeometry args={[0.85, 0.08, 0.15]} />
                <meshStandardMaterial color="#ff5722" />
              </mesh>
              <mesh position={[0, 0.41, 0]} rotation={[0, Math.PI / 2, 0]}>
                <boxGeometry args={[0.85, 0.08, 0.15]} />
                <meshStandardMaterial color="#ff5722" />
              </mesh>
            </group>

            {/* Fortaleza de Almohadas de Kinger (Pillow Fort) */}
            <group position={[8, 0, -12]} rotation={[0, -0.5, 0]}>
              {/* Cartelito o bandera */}
              <group position={[0, 2.3, 0]}>
                <mesh castShadow>
                  <cylinderGeometry args={[0.03, 0.03, 1.2, 8]} />
                  <meshStandardMaterial color="#8d6e63" />
                </mesh>
                <mesh position={[0.25, 0.4, 0]}>
                  <boxGeometry args={[0.5, 0.3, 0.02]} />
                  <meshStandardMaterial color="#ffeb3b" />
                </mesh>
                {/* Texto/símbolo en la bandera */}
                <mesh position={[0.25, 0.4, 0.012]}>
                  <boxGeometry args={[0.4, 0.1, 0.005]} />
                  <meshStandardMaterial color="#ff1744" />
                </mesh>
              </group>

              {/* Muro base izquierdo */}
              <mesh position={[-1.2, 0.4, 0]} castShadow receiveShadow>
                <boxGeometry args={[0.8, 0.8, 1.6]} />
                <meshStandardMaterial color="#42a5f5" roughness={0.8} /> {/* Almohada azul */}
              </mesh>
              <mesh position={[-1.2, 0.4, 0.81]}>
                <boxGeometry args={[0.5, 0.5, 0.02]} />
                <meshStandardMaterial color="#1e88e5" />
              </mesh>

              {/* Muro base derecho */}
              <mesh position={[1.2, 0.4, 0]} castShadow receiveShadow>
                <boxGeometry args={[0.8, 0.8, 1.6]} />
                <meshStandardMaterial color="#ff7043" roughness={0.8} /> {/* Almohada naranja */}
              </mesh>
              <mesh position={[1.2, 0.4, -0.81]}>
                <boxGeometry args={[0.5, 0.5, 0.02]} />
                <meshStandardMaterial color="#f4511e" />
              </mesh>

              {/* Muro base trasero */}
              <mesh position={[0, 0.4, -1.2]} rotation={[0, Math.PI / 2, 0]} castShadow receiveShadow>
                <boxGeometry args={[0.8, 0.8, 1.8]} />
                <meshStandardMaterial color="#ab47bc" roughness={0.8} /> {/* Almohada violeta */}
              </mesh>

              {/* Torreta izquierda superior */}
              <mesh position={[-1, 1.1, -0.3]} castShadow receiveShadow>
                <boxGeometry args={[0.7, 0.6, 0.7]} />
                <meshStandardMaterial color="#26a69a" roughness={0.8} /> {/* Almohada verde mar */}
              </mesh>

              {/* Torreta derecha superior */}
              <mesh position={[1, 1.1, -0.3]} castShadow receiveShadow>
                <boxGeometry args={[0.7, 0.6, 0.7]} />
                <meshStandardMaterial color="#ffca28" roughness={0.8} /> {/* Almohada amarilla */}
              </mesh>

              {/* Techo de almohada cruzado */}
              <mesh position={[0, 1.5, 0]} rotation={[0, 0, 0.1]} castShadow receiveShadow>
                <boxGeometry args={[2.4, 0.4, 1.0]} />
                <meshStandardMaterial color="#26c6da" roughness={0.8} /> {/* Almohada turquesa */}
              </mesh>

              {/* Cojines de adorno dentro */}
              <mesh position={[-0.4, 0.2, -0.4]} castShadow>
                <sphereGeometry args={[0.3, 16, 16]} />
                <meshStandardMaterial color="#ffee58" roughness={0.9} />
              </mesh>
              <mesh position={[0.4, 0.2, -0.4]} castShadow>
                <sphereGeometry args={[0.25, 16, 16]} />
                <meshStandardMaterial color="#ec407a" roughness={0.9} />
              </mesh>
            </group>
          </group>
        </>
      )}

      {currentZone === 'dormitories' && (
        <>
          <ambientLight intensity={0.4} />
          <pointLight position={[0, 6, 0]} intensity={1.5} color="#ffd54f" distance={40} />
          <pointLight position={[0, 4, 12]} intensity={1.2} color="#f48fb1" distance={20} />
          <pointLight position={[0, 4, -12]} intensity={1.2} color="#90caf9" distance={20} />

          {/* Alfombra larga del pasillo */}
          <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.01, 0]} receiveShadow>
            <planeGeometry args={[12, 48]} />
            <meshStandardMaterial map={floorTexture} roughness={0.6} />
          </mesh>

          {/* Suelo base del pasillo */}
          <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
            <planeGeometry args={[35, 55]} />
            <meshStandardMaterial color="#1a0033" roughness={0.9} />
          </mesh>

          {/* Paredes del pasillo */}
          {/* Pared izquierda */}
          <mesh position={[-6, 4, 0]} rotation={[0, Math.PI / 2, 0]}>
            <planeGeometry args={[48, 8]} />
            <meshStandardMaterial map={wallTexture} roughness={0.8} />
          </mesh>
          {/* Pared derecha */}
          <mesh position={[6, 4, 0]} rotation={[0, -Math.PI / 2, 0]}>
            <planeGeometry args={[48, 8]} />
            <meshStandardMaterial map={wallTexture} roughness={0.8} />
          </mesh>
          {/* Pared trasera (Regreso al Circo) */}
          <mesh position={[0, 4, 24]} rotation={[0, Math.PI, 0]}>
            <planeGeometry args={[12, 8]} />
            <meshStandardMaterial map={wallTexture} roughness={0.8} />
          </mesh>
          {/* Pared delantera (Al sótano) */}
          <mesh position={[0, 4, -24]}>
            <planeGeometry args={[12, 8]} />
            <meshStandardMaterial map={wallTexture} roughness={0.8} />
          </mesh>

          {/* Techo del pasillo */}
          <mesh position={[0, 8, 0]} rotation={[Math.PI / 2, 0, 0]}>
            <planeGeometry args={[12, 48]} />
            <meshStandardMaterial color="#111111" roughness={0.9} />
          </mesh>

          {/* PUERTAS DE LOS PERSONAJES EN LAS PAREDES DE LOS DORMITORIOS */}
          {/* Habitación de Jax: pared izquierda (x = -5.8, z = 10) */}
          <group position={[-5.8, 0.01, 10]} rotation={[0, Math.PI / 2, 0]}>
            <mesh position={[0, 2.2, 0]} castShadow>
              <boxGeometry args={[2.2, 4.2, 0.25]} />
              <meshStandardMaterial color="#b39ddb" roughness={0.5} />
            </mesh>
            {/* Foto de Jax en la puerta */}
            <mesh position={[0, 2.8, 0.14]}>
              <planeGeometry args={[0.7, 0.7]} />
              <meshBasicMaterial color="#9575cd" />
            </mesh>
            <mesh position={[0, 3.25, 0.14]}>
              <boxGeometry args={[0.16, 0.4, 0.05]} />
              <meshBasicMaterial color="#b39ddb" />
            </mesh>
          </group>

          {/* Habitación de Ragatha: pared derecha (x = 5.8, z = 10) */}
          <group position={[5.8, 0.01, 10]} rotation={[0, -Math.PI / 2, 0]}>
            <mesh position={[0, 2.2, 0]} castShadow>
              <boxGeometry args={[2.2, 4.2, 0.25]} />
              <meshStandardMaterial color="#90caf9" roughness={0.5} />
            </mesh>
            <mesh position={[0, 2.8, 0.14]}>
              <planeGeometry args={[0.7, 0.7]} />
              <meshBasicMaterial color="#1e88e5" />
            </mesh>
          </group>

          {/* Habitación de Kinger: pared izquierda (x = -5.8, z = 0) */}
          <group position={[-5.8, 0.01, 0]} rotation={[0, Math.PI / 2, 0]}>
            <mesh position={[0, 2.2, 0]} castShadow>
              <boxGeometry args={[2.2, 4.2, 0.25]} />
              <meshStandardMaterial color="#b39ddb" roughness={0.5} />
            </mesh>
            <mesh position={[0, 2.8, 0.14]}>
              <planeGeometry args={[0.7, 0.7]} />
              <meshBasicMaterial color="#512da8" />
            </mesh>
          </group>

          {/* Mini Fuerte de Almohadas de Kinger en los Dormitorios */}
          <group position={[-4.5, 0, 0.5]} rotation={[0, Math.PI / 3, 0]}>
            {/* Almohada base izquierda */}
            <mesh position={[-0.6, 0.3, 0]} castShadow>
              <boxGeometry args={[0.4, 0.6, 0.8]} />
              <meshStandardMaterial color="#42a5f5" roughness={0.8} />
            </mesh>
            {/* Almohada base derecha */}
            <mesh position={[0.6, 0.3, 0]} castShadow>
              <boxGeometry args={[0.4, 0.6, 0.8]} />
              <meshStandardMaterial color="#ff7043" roughness={0.8} />
            </mesh>
            {/* Almohada trasera */}
            <mesh position={[0, 0.3, -0.6]} rotation={[0, Math.PI / 2, 0]} castShadow>
              <boxGeometry args={[0.4, 0.6, 1.0]} />
              <meshStandardMaterial color="#ab47bc" roughness={0.8} />
            </mesh>
            {/* Bandera del fuerte */}
            <group position={[0.3, 0.9, -0.3]}>
              <mesh castShadow>
                <cylinderGeometry args={[0.02, 0.02, 0.8, 8]} />
                <meshStandardMaterial color="#8d6e63" />
              </mesh>
              <mesh position={[0.15, 0.25, 0]}>
                <boxGeometry args={[0.3, 0.18, 0.02]} />
                <meshStandardMaterial color="#ffeb3b" />
              </mesh>
            </group>
          </group>

          {/* Habitación de Zooble: pared derecha (x = 5.8, z = 0) */}
          <group position={[5.8, 0.01, 0]} rotation={[0, -Math.PI / 2, 0]}>
            <mesh position={[0, 2.2, 0]} castShadow>
              <boxGeometry args={[2.2, 4.2, 0.25]} />
              <meshStandardMaterial color="#f06292" roughness={0.5} />
            </mesh>
            <mesh position={[0, 2.8, 0.14]}>
              <planeGeometry args={[0.7, 0.7]} />
              <meshBasicMaterial color="#e91e63" />
            </mesh>
          </group>

          {/* Habitación de Pomni: pared derecha (x = 5.8, z = -10) */}
          <group position={[5.8, 0.01, -10]} rotation={[0, -Math.PI / 2, 0]} onClick={() => setZone('darkness')}>
            <mesh position={[0, 2.2, 0]} castShadow>
              <boxGeometry args={[2.2, 4.2, 0.25]} />
              <meshStandardMaterial color="#ff8a80" roughness={0.5} />
            </mesh>
            <mesh position={[0, 2.8, 0.14]}>
              <planeGeometry args={[0.7, 0.7]} />
              <meshBasicMaterial color="#f44336" />
            </mesh>
            <mesh position={[0, 2.8, 0.15]} rotation={[0, 0, Math.PI / 4]}>
              <ringGeometry args={[0.42, 0.45, 4]} />
              <meshBasicMaterial color="#ffeb3b" />
            </mesh>
          </group>

          {/* Habitación de Kaufmo (Abstraído!): pared izquierda (x = -5.8, z = -10) */}
          <group position={[-5.8, 0.01, -10]} rotation={[0, Math.PI / 2, 0]}>
            <mesh position={[0, 2.2, 0]} castShadow>
              <boxGeometry args={[2.2, 4.2, 0.25]} />
              <meshStandardMaterial color="#37474f" roughness={0.9} />
            </mesh>
            <mesh position={[0, 2.8, 0.14]}>
              <planeGeometry args={[0.7, 0.7]} />
              <meshBasicMaterial color="#111111" />
            </mesh>
            <group position={[0, 2.8, 0.16]}>
              <mesh rotation={[0, 0, Math.PI / 4]}>
                <boxGeometry args={[0.8, 0.12, 0.02]} />
                <meshBasicMaterial color="#ff1744" />
              </mesh>
              <mesh rotation={[0, 0, -Math.PI / 4]}>
                <boxGeometry args={[0.8, 0.12, 0.02]} />
                <meshBasicMaterial color="#ff1744" />
              </mesh>
            </group>
            {/* Madera bloqueando */}
            <mesh position={[0, 1.8, 0.18]} rotation={[0, 0, 0.2]}>
              <boxGeometry args={[2.4, 0.28, 0.06]} />
              <meshStandardMaterial color="#795548" roughness={0.9} />
            </mesh>
            <mesh position={[0, 2.4, 0.18]} rotation={[0, 0, -0.15]}>
              <boxGeometry args={[2.4, 0.28, 0.06]} />
              <meshStandardMaterial color="#795548" roughness={0.9} />
            </mesh>
            <mesh position={[0, 1.0, 0.18]} rotation={[0, 0, 0.05]}>
              <boxGeometry args={[2.4, 0.28, 0.06]} />
              <meshStandardMaterial color="#795548" roughness={0.9} />
            </mesh>
          </group>

          {/* PUERTA AL SÓTANO DE LA OSCURIDAD / POMNI ROOM DARKNESS EN EL FONDO DEL PASILLO (z = -23.8) */}
          <group position={[0, 0.01, -23.6]} onClick={() => setZone('darkness')}>
            <mesh position={[0, 2.4, 0]} castShadow>
              <boxGeometry args={[3.0, 4.8, 0.4]} />
              <meshStandardMaterial color="#212121" metalness={0.8} roughness={0.1} />
            </mesh>
            <mesh position={[0, 2.4, 0.12]} castShadow>
              <boxGeometry args={[2.4, 4.4, 0.25]} />
              <meshStandardMaterial color="#000000" roughness={0.9} />
            </mesh>
            {/* Ojos y espiral tenebrosa en la puerta */}
            <group position={[0, 2.8, 0.26]}>
              <mesh position={[-0.3, 0, 0]}>
                <sphereGeometry args={[0.08, 8, 8]} />
                <meshBasicMaterial color="#ff0055" />
              </mesh>
              <mesh position={[0.3, 0, 0]}>
                <sphereGeometry args={[0.08, 8, 8]} />
                <meshBasicMaterial color="#ff0055" />
              </mesh>
              <mesh position={[0, -0.6, 0]} rotation={[0, 0, time.current * 2]}>
                <torusGeometry args={[0.3, 0.04, 8, 16]} />
                <meshBasicMaterial color="#ff1744" />
              </mesh>
            </group>
            <pointLight position={[0, 2.5, 1.2]} color="#ff0055" intensity={3.0} distance={10} />
          </group>

          {/* PUERTA DE RETORNO AL CIRCO EN EL INICIO DEL PASILLO (z = 23.6) */}
          <group position={[0, 0.01, 23.6]} rotation={[0, Math.PI, 0]} onClick={() => setZone('circus')}>
            <mesh position={[0, 2.3, 0]} castShadow>
              <boxGeometry args={[2.8, 4.6, 0.35]} />
              <meshStandardMaterial color="#ffd600" roughness={0.3} />
            </mesh>
            <mesh position={[0, 2.3, 0.12]} castShadow>
              <boxGeometry args={[2.2, 4.1, 0.2]} />
              <meshStandardMaterial color="#f44336" roughness={0.5} />
            </mesh>
            <mesh position={[0, 2.3, 0.24]} rotation={[0, 0, Math.PI / 4]}>
              <boxGeometry args={[0.45, 0.45, 0.1]} />
              <meshBasicMaterial color="#ffeb3b" />
            </mesh>
            <pointLight position={[0, 2.5, 1.2]} color="#ffeb3b" intensity={2.5} distance={8} />
          </group>
        </>
      )}

      {currentZone === 'darkness' && (
        <>
          <ambientLight intensity={0.02} />
          <pointLight position={[0, 4, 0]} intensity={1.8} color="#4a148c" distance={15} />
          <pointLight position={[0, 2, -4]} intensity={1.5} color="#00e5ff" distance={12} />

          {/* Suelo oscuro infinito */}
          <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
            <planeGeometry args={[150, 150]} />
            <meshStandardMaterial color="#05000c" roughness={0.9} />
          </mesh>

          {/* Partículas flotantes místicas y tranquilizantes */}
          {Array.from({ length: 40 }).map((_, i) => {
            const px = Math.sin(i * 333) * 20;
            const pz = Math.cos(i * 777) * 20;
            const py = 1 + Math.abs(Math.sin(i * 444)) * 8;
            const colors = ["#00e5ff", "#e040fb", "#d500f9", "#00e676", "#1565c0"];
            const col = colors[i % colors.length];
            return (
              <Float key={`dark-part-${i}`} speed={0.4 + Math.random() * 0.8} floatIntensity={1.2}>
                <mesh position={[px, py, pz]}>
                  <sphereGeometry args={[0.07, 6, 6]} />
                  <meshBasicMaterial color={col} opacity={0.7} transparent />
                </mesh>
              </Float>
            );
          })}

          {/* LA CAMA RECONFORTANTE EN LA OSCURIDAD (z = 0, x = 0) */}
          <group position={[0, 0.01, 0]} rotation={[0, 0, 0]}>
            <mesh position={[0, 0.25, 0]} castShadow>
              <boxGeometry args={[1.8, 0.5, 2.8]} />
              <meshStandardMaterial color="#1a1a24" roughness={0.7} />
            </mesh>
            <mesh position={[0, 0.52, 0]} castShadow>
              <boxGeometry args={[1.65, 0.15, 2.6]} />
              <meshStandardMaterial color="#311b92" roughness={0.8} />
            </mesh>
            <mesh position={[0, 0.6, -0.4]} castShadow>
              <boxGeometry args={[1.68, 0.12, 1.6]} />
              <meshStandardMaterial color="#d500f9" roughness={0.6} />
            </mesh>
            <mesh position={[0, 0.65, 0.9]} castShadow>
              <boxGeometry args={[1.3, 0.15, 0.5]} />
              <meshStandardMaterial color="#00e5ff" roughness={0.8} />
            </mesh>
            <pointLight position={[0, 1.5, 0]} color="#d500f9" intensity={2.5} distance={7} />
          </group>

          {/* PORTAL BRILLANTE PARA DESPERTAR / REGRESAR AL PASILLO (z = 8, x = 0) */}
          <group position={[0, 0.01, 8]} onClick={() => setZone('dormitories')}>
            <mesh position={[0, 2.2, 0]} castShadow>
              <boxGeometry args={[2.4, 4.4, 0.2]} />
              <meshStandardMaterial color="#00e5ff" roughness={0.1} metalness={0.8} />
            </mesh>
            {/* Plasma del portal */}
            <mesh position={[0, 2.2, 0.11]}>
              <planeGeometry args={[2.0, 4.0]} />
              <meshBasicMaterial color="#d500f9" transparent opacity={0.8} />
            </mesh>
            <pointLight position={[0, 2.2, 1.5]} color="#00e5ff" intensity={3.5} distance={10} />
          </group>

          {/* HABITACIÓN EXCLUSIVA DE LOS RECUERDOS (Solo visible/activa si controlas al integrante que abrazó a Pomni) */}
          {controlledCharacter !== 'pomni' && (
            <group>
              {/* Portal de entrada a los Recuerdos en [-12, 0.01, -12] */}
              <group position={[-12, 0.01, -12]}>
                {/* Aro brillante dorado en el suelo */}
                <mesh rotation={[-Math.PI / 2, 0, 0]}>
                  <ringGeometry args={[1.2, 1.4, 32]} />
                  <meshBasicMaterial color="#ffd700" />
                </mesh>
                {/* Luz central dorada */}
                <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.02, 0]}>
                  <circleGeometry args={[1.2, 32]} />
                  <meshBasicMaterial color="#ffd700" transparent opacity={0.25} />
                </mesh>
                {/* Cartel flotante de texto */}
                <group position={[0, 2.0, 0]}>
                  <mesh>
                    <boxGeometry args={[2.5, 0.5, 0.05]} />
                    <meshStandardMaterial color="#311b92" emissive="#ffd700" emissiveIntensity={0.2} />
                  </mesh>
                  <pointLight color="#ffd700" intensity={2.0} distance={6} />
                </group>
                {/* Partículas doradas flotantes */}
                {Array.from({ length: 6 }).map((_, idx) => (
                  <Float key={`gold-part-${idx}`} speed={1.5} floatIntensity={1.0}>
                    <mesh position={[(Math.random() - 0.5) * 1.5, 0.5 + Math.random() * 1.5, (Math.random() - 0.5) * 1.5]}>
                      <sphereGeometry args={[0.04, 6, 6]} />
                      <meshBasicMaterial color="#ffd700" />
                    </mesh>
                  </Float>
                ))}
              </group>

              {/* Templo / Habitación de los Recuerdos de Pomni centrada en [-25, 0, -25] */}
              <group position={[-25, 0, -25]}>
                {/* Gran plataforma circular */}
                <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
                  <circleGeometry args={[7, 32]} />
                  <meshStandardMaterial color="#1a0d2e" roughness={0.5} metalness={0.5} />
                </mesh>
                <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.01, 0]}>
                  <ringGeometry args={[6.8, 7.0, 32]} />
                  <meshBasicMaterial color="#ffd700" />
                </mesh>

                {/* Columnas clásicas de luz mística alrededor */}
                {Array.from({ length: 8 }).map((_, idx) => {
                  const angle = (idx * Math.PI * 2) / 8;
                  const cx = Math.cos(angle) * 6;
                  const cz = Math.sin(angle) * 6;
                  return (
                    <group key={`col-${idx}`} position={[cx, 0, cz]}>
                      {/* Base columna */}
                      <mesh position={[0, 0.15, 0]} castShadow>
                        <cylinderGeometry args={[0.3, 0.3, 0.3, 8]} />
                        <meshStandardMaterial color="#311b92" roughness={0.6} />
                      </mesh>
                      {/* Haz de luz de la columna */}
                      <mesh position={[0, 2.5, 0]}>
                        <cylinderGeometry args={[0.15, 0.15, 4.5, 8, 1, true]} />
                        <meshBasicMaterial color="#e040fb" transparent opacity={0.15} side={THREE.DoubleSide} />
                      </mesh>
                      {/* Capitel superior */}
                      <mesh position={[0, 4.85, 0]}>
                        <cylinderGeometry args={[0.25, 0.25, 0.2, 8]} />
                        <meshStandardMaterial color="#ffd700" roughness={0.3} />
                      </mesh>
                    </group>
                  );
                })}

                {/* Pedestal Central de los Recuerdos */}
                <group position={[0, 0, 0]}>
                  <mesh position={[0, 0.5, 0]} castShadow>
                    <cylinderGeometry args={[0.6, 0.8, 1.0, 12]} />
                    <meshStandardMaterial color="#4a148c" roughness={0.2} metalness={0.8} />
                  </mesh>
                  {/* Cristal flotante central */}
                  <Float speed={2.5} floatIntensity={1.5}>
                    <mesh position={[0, 1.4, 0]} rotation={[0.4, 0.4, 0]}>
                      <octahedronGeometry args={[0.35, 0]} />
                      <meshStandardMaterial color="#ffd700" emissive="#ffd700" emissiveIntensity={0.8} roughness={0.1} />
                    </mesh>
                  </Float>
                  <pointLight position={[0, 1.5, 0]} color="#ffd700" intensity={3.0} distance={8} />
                </group>

                {/* LAS 4 ESFERAS DE MEMORIA INTERACTIVAS */}
                {/* 1. Computadora (x = -3.5, z = -3.5) */}
                <group position={[-3.5, 1.0, -3.5]} onClick={() => {
                  setActiveDialogue({
                    speaker: "RECUERDO: EL ORDENADOR",
                    text: "Un viejo ordenador de oficina gris parpadea en la oscuridad... Es el último recuerdo de Pomni antes de ponerse el visor de realidad virtual. Ella trabajaba sin parar... ¿Buscaba escapar de una realidad gris?",
                    color: "#00e5ff"
                  });
                }}>
                  <Float speed={1.5} floatIntensity={0.6}>
                    <mesh castShadow>
                      <sphereGeometry args={[0.4, 16, 16]} />
                      <meshStandardMaterial color="#00e5ff" emissive="#00e5ff" emissiveIntensity={0.4} roughness={0.2} />
                    </mesh>
                    {/* Símbolo holográfico de monitor */}
                    <mesh position={[0, 0, 0.42]}>
                      <boxGeometry args={[0.3, 0.2, 0.02]} />
                      <meshBasicMaterial color="#ffffff" />
                    </mesh>
                  </Float>
                  <pointLight color="#00e5ff" intensity={1.5} distance={4} />
                </group>

                {/* 2. La Puerta Roja (x = 3.5, z = -3.5) */}
                <group position={[3.5, 1.0, -3.5]} onClick={() => {
                  setActiveDialogue({
                    speaker: "RECUERDO: LA SALIDA",
                    text: "La silueta de una puerta roja que dice 'SALIDA'... Pomni recuerda haber cruzado pasillo tras pasillo. Aunque Caine diga que es una simulación inacabada, ella sintió que había algo real del otro lado...",
                    color: "#ff1744"
                  });
                }}>
                  <Float speed={1.7} floatIntensity={0.7}>
                    <mesh castShadow>
                      <sphereGeometry args={[0.4, 16, 16]} />
                      <meshStandardMaterial color="#ff1744" emissive="#ff1744" emissiveIntensity={0.4} roughness={0.2} />
                    </mesh>
                    {/* Símbolo de puerta */}
                    <mesh position={[0, 0, 0.42]}>
                      <boxGeometry args={[0.18, 0.3, 0.02]} />
                      <meshBasicMaterial color="#ffffff" />
                    </mesh>
                  </Float>
                  <pointLight color="#ff1744" intensity={1.5} distance={4} />
                </group>

                {/* 3. El Espejo de Identidad (x = -3.5, z = 3.5) */}
                <group position={[-3.5, 1.0, 3.5]} onClick={() => {
                  setActiveDialogue({
                    speaker: "RECUERDO: LA IDENTIDAD",
                    text: "Un reflejo de un rostro borroso... Pomni recuerda haberse mirado al espejo y no reconocerse. Ha olvidado su nombre real, su edad, y sus seres queridos... Todo lo que le queda es este traje de bufón bicolor.",
                    color: "#e040fb"
                  });
                }}>
                  <Float speed={1.4} floatIntensity={0.5}>
                    <mesh castShadow>
                      <sphereGeometry args={[0.4, 16, 16]} />
                      <meshStandardMaterial color="#e040fb" emissive="#e040fb" emissiveIntensity={0.4} roughness={0.2} />
                    </mesh>
                    {/* Símbolo de espejo */}
                    <mesh position={[0, 0, 0.42]} rotation={[0, 0, Math.PI / 4]}>
                      <boxGeometry args={[0.22, 0.22, 0.02]} />
                      <meshBasicMaterial color="#ffffff" />
                    </mesh>
                  </Float>
                  <pointLight color="#e040fb" intensity={1.5} distance={4} />
                </group>

                {/* 4. El Abrazo Cálido (x = 3.5, z = 3.5) */}
                <group position={[3.5, 1.0, 3.5]} onClick={() => {
                  setActiveDialogue({
                    speaker: "RECUERDO: EL COMPAÑERISMO",
                    text: "Dos siluetas luminosas fundidas en un abrazo sincero en medio del vacío absoluto. 'Aunque nos volvamos locos, y el mundo se desvanezca en un mar de píxeles, un abrazo sincero nos recuerda que fuimos humanos. No estás sola, Pomni.'",
                    color: "#00e676"
                  });
                }}>
                  <Float speed={1.6} floatIntensity={0.8}>
                    <mesh castShadow>
                      <sphereGeometry args={[0.4, 16, 16]} />
                      <meshStandardMaterial color="#00e676" emissive="#00e676" emissiveIntensity={0.4} roughness={0.2} />
                    </mesh>
                    {/* Símbolo de corazón */}
                    <mesh position={[0, 0, 0.42]} rotation={[0, 0, Math.PI / 4]}>
                      <boxGeometry args={[0.16, 0.16, 0.02]} />
                      <meshBasicMaterial color="#ffffff" />
                    </mesh>
                  </Float>
                  <pointLight color="#00e676" intensity={1.5} distance={4} />
                </group>
              </group>
            </group>
          )}
        </>
      )}

      {/* PERSONAJES INTERACTIVOS CON MEJOR DISEÑO (NO BLOCKY / NO HEROBRINE) */}
      <group>
        
        {/* Jax (Conejo Morado) */}
        <group ref={jaxRef} position={[10, 0, 5]} onClick={handleJaxClick}>
          {/* Base Invisible de Click */}
          <mesh position={[0, 1.5, 0]}>
            <cylinderGeometry args={[0.8, 0.8, 3, 8]} />
            <meshBasicMaterial transparent opacity={0} depthWrite={false} />
          </mesh>

          {/* Piernas Delgadas Animadas */}
          <group ref={jaxLeftLegRef} position={[-0.14, 0.9, 0]}>
            <mesh position={[0, -0.4, 0]}>
              <cylinderGeometry args={[0.035, 0.035, 1.0, 12]} />
              <meshStandardMaterial color="#b39ddb" roughness={0.6} />
            </mesh>
            <mesh position={[0, -0.85, 0.1]}>
              <boxGeometry args={[0.08, 0.09, 0.22]} />
              <meshStandardMaterial color="#9575cd" roughness={0.6} />
            </mesh>
          </group>
          <group ref={jaxRightLegRef} position={[0.14, 0.9, 0]}>
            <mesh position={[0, -0.4, 0]}>
              <cylinderGeometry args={[0.035, 0.035, 1.0, 12]} />
              <meshStandardMaterial color="#b39ddb" roughness={0.6} />
            </mesh>
            <mesh position={[0, -0.85, 0.1]}>
              <boxGeometry args={[0.08, 0.09, 0.22]} />
              <meshStandardMaterial color="#9575cd" roughness={0.6} />
            </mesh>
          </group>

          {/* Overalls Rosas de Jax */}
          <mesh castShadow position={[0, 1.25, 0]}>
            <cylinderGeometry args={[0.18, 0.18, 0.6, 16]} />
            <meshStandardMaterial color="#ea7d95" roughness={0.4} />
          </mesh>
          {/* Tirantes de los overalls */}
          <mesh position={[-0.09, 1.55, 0.08]} rotation={[0.08, 0, 0.05]}>
            <boxGeometry args={[0.03, 0.3, 0.02]} />
            <meshStandardMaterial color="#ea7d95" />
          </mesh>
          <mesh position={[0.09, 1.55, 0.08]} rotation={[0.08, 0, -0.05]}>
            <boxGeometry args={[0.03, 0.3, 0.02]} />
            <meshStandardMaterial color="#ea7d95" />
          </mesh>
          {/* Bolsillo delantero de los overalls de Jax */}
          <mesh position={[0, 1.28, 0.165]}>
            <boxGeometry args={[0.08, 0.12, 0.02]} />
            <meshStandardMaterial color="#f48fb1" roughness={0.4} />
          </mesh>
          {/* Cuerpo morado de Jax */}
          <mesh castShadow position={[0, 1.6, 0]}>
            <cylinderGeometry args={[0.15, 0.13, 0.8, 16]} />
            <meshStandardMaterial color="#b39ddb" roughness={0.5} />
          </mesh>
          {/* Botones amarillos */}
          <mesh position={[0.06, 1.38, 0.16]}>
            <sphereGeometry args={[0.03, 8, 8]} />
            <meshStandardMaterial color="#ffeb3b" roughness={0.2} metalness={0.5} />
          </mesh>
          <mesh position={[-0.06, 1.38, 0.16]}>
            <sphereGeometry args={[0.03, 8, 8]} />
            <meshStandardMaterial color="#ffeb3b" roughness={0.2} metalness={0.5} />
          </mesh>

          {/* Brazos Largos Animados con Guantes Amarillos */}
          <group ref={jaxLeftArmRef} position={[-0.18, 1.8, 0]}>
            <mesh position={[-0.12, -0.25, 0]} rotation={[0, 0, Math.PI / 10]}>
              <cylinderGeometry args={[0.03, 0.03, 0.6, 8]} />
              <meshStandardMaterial color="#b39ddb" />
            </mesh>
            {/* Guante Amarillo */}
            <mesh position={[-0.2, -0.55, 0]}>
              <sphereGeometry args={[0.065, 12, 12]} />
              <meshStandardMaterial color="#ffeb3b" roughness={0.4} />
            </mesh>
          </group>
          <group ref={jaxRightArmRef} position={[0.18, 1.8, 0]}>
            <mesh position={[0.12, -0.25, 0]} rotation={[0, 0, -Math.PI / 10]}>
              <cylinderGeometry args={[0.03, 0.03, 0.6, 8]} />
              <meshStandardMaterial color="#b39ddb" />
            </mesh>
            {/* Guante Amarillo */}
            <mesh position={[0.2, -0.55, 0]}>
              <sphereGeometry args={[0.065, 12, 12]} />
              <meshStandardMaterial color="#ffeb3b" roughness={0.4} />
            </mesh>
          </group>

          {/* Cabeza de Jax (No blocky!) */}
          <group position={[0, 2.3, 0]}>
            <mesh>
              <sphereGeometry args={[0.24, 20, 20]} />
              <meshStandardMaterial color="#b39ddb" roughness={0.6} />
            </mesh>

            {/* Orejas largas de conejo levantadas rectamente */}
            <group ref={jaxLeftEarRef} position={[-0.09, 0.18, 0]} rotation={[0, 0, -0.05]}>
              <mesh position={[0, 0.35, 0]} castShadow>
                <cylinderGeometry args={[0.04, 0.03, 0.6, 12]} />
                <meshStandardMaterial color="#b39ddb" />
              </mesh>
              <mesh position={[0, 0.35, 0.02]}>
                <boxGeometry args={[0.045, 0.5, 0.01]} />
                <meshStandardMaterial color="#ea80fc" />
              </mesh>
            </group>
            <group ref={jaxRightEarRef} position={[0.09, 0.18, 0]} rotation={[0, 0, 0.05]}>
              <mesh position={[0, 0.35, 0]} castShadow>
                <cylinderGeometry args={[0.04, 0.03, 0.6, 12]} />
                <meshStandardMaterial color="#b39ddb" />
              </mesh>
              <mesh position={[0, 0.35, 0.02]}>
                <boxGeometry args={[0.045, 0.5, 0.01]} />
                <meshStandardMaterial color="#ea80fc" />
              </mesh>
            </group>

            {/* Ojos amarillos paranoicos con pupilas de rendija */}
            <group position={[0, 0.02, 0.19]}>
              <group position={[-0.08, 0, 0]}>
                <mesh>
                  <sphereGeometry args={[0.065, 16, 16]} />
                  <meshBasicMaterial color="#ffee55" />
                </mesh>
                <mesh position={[0, 0, 0.045]} rotation={[0, 0, 0.1]}>
                  <boxGeometry args={[0.015, 0.07, 0.02]} />
                  <meshBasicMaterial color="#000000" />
                </mesh>
              </group>
              <group position={[0.08, 0, 0]}>
                <mesh>
                  <sphereGeometry args={[0.065, 16, 16]} />
                  <meshBasicMaterial color="#ffee55" />
                </mesh>
                <mesh position={[0, 0, 0.045]} rotation={[0, 0, -0.1]}>
                  <boxGeometry args={[0.015, 0.07, 0.02]} />
                  <meshBasicMaterial color="#000000" />
                </mesh>
              </group>
            </group>

            {/* Sonrisa de Dientes Amarillos de Jax */}
            <group position={[0, -0.1, 0.18]} rotation={[0.08, 0, 0]}>
              <mesh>
                <boxGeometry args={[0.22, 0.07, 0.03]} />
                <meshBasicMaterial color="#000000" />
              </mesh>
              <mesh position={[0, 0, 0.005]}>
                <boxGeometry args={[0.2, 0.05, 0.035]} />
                <meshBasicMaterial color="#ffeb3b" />
              </mesh>
              <mesh position={[0, 0, 0.01]}>
                <boxGeometry args={[0.2, 0.004, 0.038]} />
                <meshBasicMaterial color="#000000" />
              </mesh>
              {[-0.06, -0.03, 0, 0.03, 0.06].map((xOffset, i) => (
                <mesh key={`jax-npc-tooth-line-${i}`} position={[xOffset, 0, 0.011]}>
                  <boxGeometry args={[0.006, 0.05, 0.038]} />
                  <meshBasicMaterial color="#000000" />
                </mesh>
              ))}
            </group>
          </group>

          {/* Efecto Glitch visual cuando es Atacado */}
          {attackedMembers['jax'] && (
            <group position={[0, 1.4, 0]}>
              <mesh>
                <boxGeometry args={[1.2, 2.8, 1.2]} />
                <meshBasicMaterial color="#ff1744" wireframe />
              </mesh>
              <mesh rotation={[0, Math.PI / 4, 0]}>
                <boxGeometry args={[1.0, 3.0, 1.0]} />
                <meshBasicMaterial color="#00e5ff" wireframe />
              </mesh>
            </group>
          )}
        </group>

        {/* Kinger (Rey de Ajedrez con Túnica Real y Mejoras Estéticas) */}
        <group ref={kingerRef} position={[8, 0, -12]} onClick={handleKingerClick}>
          {/* Base Click */}
          <mesh position={[0, 1.5, 0]}>
            <cylinderGeometry args={[0.8, 0.8, 3, 8]} />
            <meshBasicMaterial transparent opacity={0} depthWrite={false} />
          </mesh>

          {/* Túnica Real de Terciopelo */}
          <mesh position={[0, 1.1, 0]} castShadow>
            <coneGeometry args={[0.5, 1.9, 20]} />
            <meshStandardMaterial color="#4a148c" roughness={0.8} />
          </mesh>

          {/* MEJORA: Dobladillo de armiño blanco con puntos negros en la base de la túnica */}
          <group position={[0, 0.18, 0]}>
            <mesh castShadow>
              <cylinderGeometry args={[0.55, 0.55, 0.15, 20]} />
              <meshStandardMaterial color="#ffffff" roughness={0.9} />
            </mesh>
            {/* Puntos de armiño */}
            {Array.from({ length: 6 }).map((_, i) => {
              const angle = (i * Math.PI * 2) / 6;
              return (
                <mesh key={`kinger-ermine-${i}`} position={[Math.cos(angle) * 0.56, 0, Math.sin(angle) * 0.56]} rotation={[0, -angle, 0]}>
                  <boxGeometry args={[0.04, 0.04, 0.01]} />
                  <meshBasicMaterial color="#111111" />
                </mesh>
              );
            })}
          </group>

          {/* MEJORA: Botón broche real dorado en el pecho */}
          <mesh position={[0, 1.45, 0.23]} rotation={[0.1, 0, 0]}>
            <sphereGeometry args={[0.04, 8, 8]} />
            <meshStandardMaterial color="#ffd54f" metalness={0.9} roughness={0.1} />
          </mesh>
          {/* Cuello Peludo de Armiño con manchas */}
          <group position={[0, 1.98, 0]} rotation={[Math.PI / 2, 0, 0]}>
            <mesh>
              <torusGeometry args={[0.22, 0.09, 16, 32]} />
              <meshStandardMaterial color="#f5f5f5" roughness={0.9} />
            </mesh>
            <mesh position={[0.15, 0.08, 0.03]}>
              <sphereGeometry args={[0.025, 8, 8]} />
              <meshBasicMaterial color="#212121" />
            </mesh>
            <mesh position={[-0.15, -0.08, 0.03]}>
              <sphereGeometry args={[0.025, 8, 8]} />
              <meshBasicMaterial color="#212121" />
            </mesh>
          </group>

          {/* Cabeza Real de Ajedrez de Madera */}
          <group position={[0, 2.38, 0]}>
            <mesh position={[0, 0, 0]} castShadow>
              <cylinderGeometry args={[0.18, 0.24, 0.35, 16]} />
              <meshStandardMaterial color="#efe0ca" roughness={0.7} />
            </mesh>
            <mesh position={[0, 0.2, 0]} castShadow>
              <sphereGeometry args={[0.22, 16, 16]} />
              <meshStandardMaterial color="#efe0ca" roughness={0.7} />
            </mesh>
            {/* Corona con Cruz tallada */}
            <mesh position={[0, 0.46, 0]} castShadow>
              <cylinderGeometry args={[0.16, 0.08, 0.2, 12]} />
              <meshStandardMaterial color="#ffeb3b" roughness={0.1} metalness={0.9} />
            </mesh>
            <group position={[0, 0.58, 0]}>
              <mesh>
                <boxGeometry args={[0.03, 0.1, 0.03]} />
                <meshStandardMaterial color="#ffeb3b" />
              </mesh>
              <mesh position={[0, 0.02, 0]}>
                <boxGeometry args={[0.08, 0.03, 0.03]} />
                <meshStandardMaterial color="#ffeb3b" />
              </mesh>
            </group>

            {/* Ojos Desorbitados Paranoicos (Lively highlights to avoid Herobrine look) */}
            <group position={[0, 0.16, 0.17]}>
              {/* Ojo Izquierdo Gigante */}
              <group position={[-0.12, 0, 0]}>
                <mesh>
                  <sphereGeometry args={[0.1, 16, 16]} />
                  <meshBasicMaterial color="#ffffff" />
                </mesh>
                <mesh position={[0, 0, 0.06]}>
                  <sphereGeometry args={[0.035, 8, 8]} />
                  <meshBasicMaterial color="#000000" />
                </mesh>
                <mesh position={[0.015, 0.015, 0.08]}>
                  <sphereGeometry args={[0.015, 8, 8]} />
                  <meshBasicMaterial color="#ffffff" />
                </mesh>
              </group>
              {/* Ojo Derecho Pequeño y tembloroso */}
              <group position={[0.12, 0.04, 0]}>
                <mesh>
                  <sphereGeometry args={[0.07, 16, 16]} />
                  <meshBasicMaterial color="#ffffff" />
                </mesh>
                <mesh position={[0, 0, 0.042]}>
                  <sphereGeometry args={[0.022, 8, 8]} />
                  <meshBasicMaterial color="#000000" />
                </mesh>
                <mesh position={[0.01, 0.01, 0.055]}>
                  <sphereGeometry args={[0.01, 8, 8]} />
                  <meshBasicMaterial color="#ffffff" />
                </mesh>
              </group>
            </group>
          </group>

          {/* Manos Guante Flotantes Detached */}
          <group position={[-0.4, 1.1, 0.22]}>
            <mesh castShadow>
              <sphereGeometry args={[0.065, 12, 12]} />
              <meshStandardMaterial color="#ffffff" roughness={0.8} />
            </mesh>
          </group>
          <group position={[0.4, 1.1, 0.22]}>
            <mesh castShadow>
              <sphereGeometry args={[0.065, 12, 12]} />
              <meshStandardMaterial color="#ffffff" roughness={0.8} />
            </mesh>
          </group>

          {/* Efecto Glitch visual cuando es Atacado */}
          {attackedMembers['kinger'] && (
            <group position={[0, 1.4, 0]}>
              <mesh>
                <boxGeometry args={[1.3, 2.6, 1.3]} />
                <meshBasicMaterial color="#ff1744" wireframe />
              </mesh>
              <mesh rotation={[0, Math.PI / 4, 0]}>
                <boxGeometry args={[1.1, 2.8, 1.1]} />
                <meshBasicMaterial color="#00e5ff" wireframe />
              </mesh>
            </group>
          )}
        </group>

        {/* Ragatha (Muñeca de Trapo con Vestido de Parches) */}
        <group ref={ragathaRef} position={[-8, 0, -8]} onClick={handleRagathaClick}>
          {/* Base Click */}
          <mesh position={[0, 1.5, 0]}>
            <cylinderGeometry args={[0.8, 0.8, 3, 8]} />
            <meshBasicMaterial transparent opacity={0} depthWrite={false} />
          </mesh>

          {/* Piernas de trapo Animadas */}
          <group ref={ragathaLeftLegRef} position={[-0.1, 0.75, 0]}>
            <mesh position={[0, -0.35, 0]}>
              <cylinderGeometry args={[0.035, 0.035, 0.8, 8]} />
              <meshStandardMaterial color="#fff3e0" roughness={0.9} />
            </mesh>
            <mesh position={[0, -0.71, 0.04]} rotation={[0.05, 0, 0]}>
              <boxGeometry args={[0.065, 0.065, 0.14]} />
              <meshStandardMaterial color="#d84315" />
            </mesh>
          </group>
          <group ref={ragathaRightLegRef} position={[0.1, 0.75, 0]}>
            <mesh position={[0, -0.35, 0]}>
              <cylinderGeometry args={[0.035, 0.035, 0.8, 8]} />
              <meshStandardMaterial color="#fff3e0" roughness={0.9} />
            </mesh>
            <mesh position={[0, -0.71, 0.04]} rotation={[0.05, 0, 0]}>
              <boxGeometry args={[0.065, 0.065, 0.14]} />
              <meshStandardMaterial color="#d84315" />
            </mesh>
          </group>

          {/* Vestido acampanado con parches y delantal blanco */}
          <mesh position={[0, 1.1, 0]} castShadow>
            <coneGeometry args={[0.38, 0.8, 16]} />
            <meshStandardMaterial color="#1e88e5" roughness={0.7} />
          </mesh>

          {/* Delantal blanco cosido al pecho de Ragatha */}
          <mesh position={[0, 1.15, 0.22]} rotation={[0, 0, 0]}>
            <boxGeometry args={[0.22, 0.35, 0.02]} />
            <meshStandardMaterial color="#ffffff" roughness={0.9} />
          </mesh>
          {/* Tirantes del delantal */}
          <mesh position={[-0.1, 1.34, 0.14]} rotation={[0, 0, -0.1]}>
            <boxGeometry args={[0.02, 0.14, 0.02]} />
            <meshStandardMaterial color="#ffffff" />
          </mesh>
          <mesh position={[0.1, 1.34, 0.14]} rotation={[0, 0, 0.1]}>
            <boxGeometry args={[0.02, 0.14, 0.02]} />
            <meshStandardMaterial color="#ffffff" />
          </mesh>

          {/* Parches decorativos cosidos en el vestido */}
          <mesh position={[0.12, 0.8, 0.24]} rotation={[0.1, 0.2, 0]}>
            <boxGeometry args={[0.09, 0.09, 0.02]} />
            <meshStandardMaterial color="#ffee55" />
          </mesh>
          <mesh position={[-0.12, 0.9, 0.22]} rotation={[0.1, -0.15, 0]}>
            <boxGeometry args={[0.08, 0.08, 0.02]} />
            <meshStandardMaterial color="#ff7043" />
          </mesh>

          {/* Brazos blandos Animados */}
          <group ref={ragathaLeftArmRef} position={[-0.22, 1.35, 0]}>
            <group rotation={[0, 0, 0.15]}>
              <mesh position={[-0.08, -0.22, 0]} rotation={[0, 0, Math.PI / 12]} castShadow>
                <cylinderGeometry args={[0.035, 0.03, 0.45, 8]} />
                <meshStandardMaterial color="#fff3e0" />
              </mesh>
              <mesh position={[-0.12, -0.45, 0]}>
                <sphereGeometry args={[0.055, 8, 8]} />
                <meshStandardMaterial color="#fff3e0" />
              </mesh>
            </group>
          </group>
          <group ref={ragathaRightArmRef} position={[0.22, 1.35, 0]}>
            <group rotation={[0, 0, -0.15]}>
              <mesh position={[0.08, -0.22, 0]} rotation={[0, 0, -Math.PI / 12]} castShadow>
                <cylinderGeometry args={[0.035, 0.03, 0.45, 8]} />
                <meshStandardMaterial color="#fff3e0" />
              </mesh>
              <mesh position={[0.12, -0.45, 0]}>
                <sphereGeometry args={[0.055, 8, 8]} />
                <meshStandardMaterial color="#fff3e0" />
              </mesh>
            </group>
          </group>

          {/* Cabeza Dulce de Ragatha */}
          <group position={[0, 1.85, 0]}>
            <mesh castShadow>
              <sphereGeometry args={[0.24, 20, 20]} />
              <meshStandardMaterial color="#ffe0b2" roughness={0.9} />
            </mesh>
            {/* Cabello de Lana Roja abombado */}
            <mesh position={[0, 0.12, -0.04]} castShadow>
              <sphereGeometry args={[0.27, 16, 16]} />
              <meshStandardMaterial color="#d32f2f" roughness={0.9} />
            </mesh>
            {/* Coletas adorables de lana */}
            <mesh position={[-0.18, -0.06, -0.08]} castShadow>
              <sphereGeometry args={[0.09, 8, 8]} />
              <meshStandardMaterial color="#d32f2f" />
            </mesh>
            <mesh position={[0.18, -0.06, -0.08]} castShadow>
              <sphereGeometry args={[0.09, 8, 8]} />
              <meshStandardMaterial color="#d32f2f" />
            </mesh>

            {/* Lazo o listón azul brillante en el cabello rojo */}
            <group position={[0.14, 0.22, 0.1]} rotation={[0.2, 0.4, -0.3]}>
              <mesh castShadow>
                <boxGeometry args={[0.14, 0.08, 0.04]} />
                <meshStandardMaterial color="#1e88e5" roughness={0.5} />
              </mesh>
              <mesh position={[-0.08, 0, -0.02]} rotation={[0, 0, 0.5]} castShadow>
                <boxGeometry args={[0.12, 0.05, 0.02]} />
                <meshStandardMaterial color="#1e88e5" />
              </mesh>
              <mesh position={[0.08, 0, -0.02]} rotation={[0, 0, -0.5]} castShadow>
                <boxGeometry args={[0.12, 0.05, 0.02]} />
                <meshStandardMaterial color="#1e88e5" />
              </mesh>
            </group>

            {/* Ojo Botón Izquierdo (Diseño fiel) */}
            <group position={[-0.09, 0.03, 0.18]}>
              <mesh rotation={[Math.PI / 2, 0, 0]}>
                <cylinderGeometry args={[0.045, 0.045, 0.015, 10]} />
                <meshBasicMaterial color="#212121" />
              </mesh>
              {/* Costura en X blanca */}
              <mesh position={[0, 0, 0.01]} rotation={[0, 0, Math.PI / 4]}>
                <boxGeometry args={[0.035, 0.008, 0.01]} />
                <meshBasicMaterial color="#ffffff" />
              </mesh>
              <mesh position={[0, 0, 0.01]} rotation={[0, 0, -Math.PI / 4]}>
                <boxGeometry args={[0.035, 0.008, 0.01]} />
                <meshBasicMaterial color="#ffffff" />
              </mesh>
            </group>

            {/* Ojo Derecho Dulce con Pupila Brillante */}
            <group position={[0.09, 0.03, 0.18]}>
              <mesh>
                <sphereGeometry args={[0.065, 12, 12]} />
                <meshBasicMaterial color="#ffffff" />
              </mesh>
              <mesh position={[0, 0, 0.04]}>
                <sphereGeometry args={[0.022, 8, 8]} />
                <meshBasicMaterial color="#111111" />
              </mesh>
              <mesh position={[0.01, 0.01, 0.05]}>
                <sphereGeometry args={[0.01, 8, 8]} />
                <meshBasicMaterial color="#ffffff" />
              </mesh>
            </group>

            {/* Nariz Triangular Roja */}
            <mesh position={[0, -0.04, 0.22]} rotation={[Math.PI, 0, 0]}>
              <coneGeometry args={[0.025, 0.05, 4]} />
              <meshBasicMaterial color="#e53935" />
            </mesh>
            {/* Sonrisa Cosida con Hilo */}
            <mesh position={[0, -0.11, 0.19]} rotation={[0, 0, 0.04]}>
              <boxGeometry args={[0.12, 0.01, 0.02]} />
              <meshBasicMaterial color="#212121" />
            </mesh>
          </group>

          {/* Efecto Glitch visual cuando es Atacado */}
          {attackedMembers['ragatha'] && (
            <group position={[0, 1.2, 0]}>
              <mesh>
                <boxGeometry args={[1.2, 2.4, 1.2]} />
                <meshBasicMaterial color="#ff1744" wireframe />
              </mesh>
              <mesh rotation={[0, Math.PI / 4, 0]}>
                <boxGeometry args={[1.0, 2.6, 1.0]} />
                <meshBasicMaterial color="#00e5ff" wireframe />
              </mesh>
            </group>
          )}
        </group>

        {/* Zooble (Piezas Mezcladas con Dos Ojos y Cuerpo Fielmente Diseñado) */}
        <group ref={zoobleRef} position={[-12, 0, -2]} onClick={handleZoobleClick}>
          {/* Base Click */}
          <mesh position={[0, 1.2, 0]}>
            <cylinderGeometry args={[0.8, 0.8, 2.5, 8]} />
            <meshBasicMaterial transparent opacity={0} depthWrite={false} />
          </mesh>

          {/* Pierna Izquierda Rosa Animada */}
          <group ref={zoobleLeftLegRef} position={[-0.12, 0.75, 0]}>
            <mesh position={[0, -0.35, 0]} castShadow>
              <cylinderGeometry args={[0.03, 0.03, 0.8, 8]} />
              <meshStandardMaterial color="#f50057" />
            </mesh>
            <mesh position={[0, -0.71, 0.04]}>
              <boxGeometry args={[0.07, 0.08, 0.12]} />
              <meshStandardMaterial color="#ffeb3b" />
            </mesh>
          </group>

          {/* Pierna Derecha Animada (Segmentos locos y cono) */}
          <group ref={zoobleRightLegRef} position={[0.12, 0.75, 0]}>
            <mesh position={[0, -0.2, 0]}>
              <torusGeometry args={[0.06, 0.03, 8, 16]} />
              <meshStandardMaterial color="#00e5ff" />
            </mesh>
            <mesh position={[0, -0.45, 0]}>
              <torusGeometry args={[0.06, 0.03, 8, 16]} />
              <meshStandardMaterial color="#00e676" />
            </mesh>
            <mesh position={[0, -0.65, 0]} castShadow>
              <coneGeometry args={[0.08, 0.14, 8]} />
              <meshStandardMaterial color="#ff9100" />
            </mesh>
          </group>

          {/* Torso Rectangular Pintoresco */}
          <mesh position={[0, 1.1, 0]} castShadow>
            <boxGeometry args={[0.32, 0.6, 0.2]} />
            <meshStandardMaterial color="#ffd600" roughness={0.4} />
          </mesh>
          {/* Parche del pecho cian */}
          <mesh position={[0, 1.1, 0.11]}>
            <boxGeometry args={[0.2, 0.4, 0.02]} />
            <meshStandardMaterial color="#00b0ff" />
          </mesh>

          {/* Patrones y detalles abstractos en el torso de Zooble */}
          <mesh position={[0.08, 1.25, 0.11]} rotation={[0, 0, 0.2]}>
            <boxGeometry args={[0.1, 0.1, 0.02]} />
            <meshStandardMaterial color="#f50057" />
          </mesh>
          <mesh position={[-0.08, 0.95, 0.11]} rotation={[0, 0, -0.3]}>
            <boxGeometry args={[0.08, 0.15, 0.02]} />
            <meshStandardMaterial color="#2979ff" />
          </mesh>

          {/* Brazos Mismatched Animados */}
          <group ref={zoobleLeftArmRef} position={[-0.22, 1.25, 0]}>
            <mesh position={[-0.12, -0.12, 0]} rotation={[0, 0, Math.PI / 4]} castShadow>
              <cylinderGeometry args={[0.035, 0.035, 0.35, 8]} />
              <meshStandardMaterial color="#ff6d00" />
            </mesh>
            {/* Pinza Cangrejo Roja */}
            <mesh position={[-0.24, -0.24, 0]} rotation={[0, 0, Math.PI / 4]}>
              <torusGeometry args={[0.055, 0.02, 8, 12, Math.PI]} />
              <meshStandardMaterial color="#ff1744" />
            </mesh>
          </group>
          <group ref={zoobleRightArmRef} position={[0.22, 1.25, 0]}>
            <mesh position={[0.12, -0.16, 0]} rotation={[0, 0, -Math.PI / 6]} castShadow>
              <cylinderGeometry args={[0.03, 0.03, 0.4, 8]} />
              <meshStandardMaterial color="#2979ff" />
            </mesh>
            {/* Garra verde */}
            <mesh position={[0.2, -0.36, 0]}>
              <boxGeometry args={[0.04, 0.08, 0.08]} />
              <meshStandardMaterial color="#00e676" />
            </mesh>
          </group>

          {/* Cabeza Triángulo Rosa neón */}
          <group position={[0, 1.65, 0]}>
            <mesh rotation={[0, 0, Math.PI / 4]} castShadow>
              <coneGeometry args={[0.16, 0.38, 4]} />
              <meshStandardMaterial color="#f50057" />
            </mesh>

            {/* Ojos Desemparejados Reales (Fiel a la serie) */}
            {/* Ojo Izquierdo: Espiral gigante sobre un resorte de cuello flexible */}
            <group position={[-0.14, 0.12, 0.1]}>
              {/* Resorte/Cuello amarillo */}
              <mesh rotation={[0.2, 0, -0.2]}>
                <cylinderGeometry args={[0.015, 0.015, 0.25, 8]} />
                <meshStandardMaterial color="#ffee55" />
              </mesh>
              {/* Globo ocular */}
              <group position={[-0.04, 0.12, 0.04]}>
                <mesh castShadow>
                  <sphereGeometry args={[0.08, 12, 12]} />
                  <meshBasicMaterial color="#ffffff" />
                </mesh>
                <mesh position={[0, 0, 0.05]}>
                  <sphereGeometry args={[0.03, 8, 8]} />
                  <meshBasicMaterial color="#00e5ff" /> {/* Iris cian */}
                </mesh>
                <mesh position={[0, 0, 0.07]}>
                  <sphereGeometry args={[0.012, 8, 8]} />
                  <meshBasicMaterial color="#111111" /> {/* Pupila negra */}
                </mesh>
              </group>
            </group>

            {/* Ojo Derecho: Un pequeño botón o cuenta naranja */}
            <group position={[0.08, -0.04, 0.13]}>
              <mesh castShadow>
                <sphereGeometry args={[0.04, 8, 8]} />
                <meshBasicMaterial color="#ff9100" />
              </mesh>
              <mesh position={[0, 0, 0.03]}>
                <sphereGeometry args={[0.015, 8, 8]} />
                <meshBasicMaterial color="#000000" />
              </mesh>
            </group>

            {/* Las tres antenas coloridas en el tope de la cabeza de Zooble */}
            <group position={[0, 0.18, 0]}>
              {/* Antena Izquierda Azul */}
              <mesh position={[-0.08, 0.12, 0]} rotation={[0, 0, -0.3]}>
                <cylinderGeometry args={[0.01, 0.018, 0.22, 6]} />
                <meshStandardMaterial color="#2979ff" />
              </mesh>
              {/* Antena Central Rosa */}
              <mesh position={[0, 0.18, 0]} rotation={[0, 0, 0]}>
                <cylinderGeometry args={[0.01, 0.018, 0.28, 6]} />
                <meshStandardMaterial color="#f50057" />
              </mesh>
              {/* Antena Derecha Verde */}
              <mesh position={[0.08, 0.12, 0]} rotation={[0, 0, 0.3]}>
                <cylinderGeometry args={[0.01, 0.018, 0.22, 6]} />
                <meshStandardMaterial color="#00e676" />
              </mesh>
            </group>
          </group>

          {/* Efecto Glitch visual cuando es Atacado */}
          {attackedMembers['zooble'] && (
            <group position={[0, 1.1, 0]}>
              <mesh>
                <boxGeometry args={[1.2, 2.2, 1.2]} />
                <meshBasicMaterial color="#ff1744" wireframe />
              </mesh>
              <mesh rotation={[0, Math.PI / 4, 0]}>
                <boxGeometry args={[1.0, 2.4, 1.0]} />
                <meshBasicMaterial color="#00e5ff" wireframe />
              </mesh>
            </group>
          )}
        </group>

        {/* Caine (Dientes Gigantes, Ojos Flotantes, Maestro de Ceremonias con Bastón) */}
        <group ref={caineGroupRef} position={[0, 2.5, -15]} onClick={handleCaineClick}>
          {/* Base Click */}
          <mesh position={[0, 1.2, 0]}>
            <cylinderGeometry args={[1, 1, 3.2, 8]} />
            <meshBasicMaterial transparent opacity={0} depthWrite={false} />
          </mesh>

          {/* Piernas Delgadas de Caballero */}
          <mesh position={[-0.12, 0.4, 0]} castShadow>
            <cylinderGeometry args={[0.03, 0.03, 0.8, 8]} />
            <meshStandardMaterial color="#111111" />
          </mesh>
          <mesh position={[-0.12, 0.04, 0.04]}>
            <boxGeometry args={[0.065, 0.065, 0.14]} />
            <meshStandardMaterial color="#111111" />
          </mesh>
          <mesh position={[0.12, 0.4, 0]} castShadow>
            <cylinderGeometry args={[0.03, 0.03, 0.8, 8]} />
            <meshStandardMaterial color="#111111" />
          </mesh>
          <mesh position={[0.12, 0.04, 0.04]}>
            <boxGeometry args={[0.065, 0.065, 0.14]} />
            <meshStandardMaterial color="#111111" />
          </mesh>

          {/* Frac / Esmoquin Rojo */}
          <mesh position={[0, 1.1, 0]} castShadow>
            <cylinderGeometry args={[0.16, 0.13, 0.7, 16]} />
            <meshStandardMaterial color="#b71c1c" roughness={0.3} />
          </mesh>
          {/* Camisa Blanca */}
          <mesh position={[0, 1.22, 0.1]}>
            <boxGeometry args={[0.08, 0.22, 0.03]} />
            <meshStandardMaterial color="#ffffff" />
          </mesh>
          {/* Corbatín de Lazo Negro */}
          <mesh position={[0, 1.28, 0.12]}>
            <boxGeometry args={[0.07, 0.02, 0.02]} />
            <meshBasicMaterial color="#111111" />
          </mesh>

          {/* Brazos Expressivos y Guantes Amarillos */}
          <group position={[-0.18, 1.3, 0]} rotation={[0, 0, 0.25]}>
            <mesh position={[-0.1, -0.18, 0]} rotation={[0, 0, Math.PI / 12]} castShadow>
              <cylinderGeometry args={[0.03, 0.03, 0.45, 8]} />
              <meshStandardMaterial color="#b71c1c" />
            </mesh>
            <mesh position={[-0.15, -0.38, 0]}>
              <sphereGeometry args={[0.055, 12, 12]} />
              <meshStandardMaterial color="#ffeb3b" roughness={0.3} />
            </mesh>
          </group>
          <group position={[0.18, 1.3, 0]} rotation={[0, 0, -0.25]}>
            <mesh position={[0.12, -0.18, 0]} rotation={[0, 0, -Math.PI / 12]} castShadow>
              <cylinderGeometry args={[0.03, 0.03, 0.45, 8]} />
              <meshStandardMaterial color="#b71c1c" />
            </mesh>
            <mesh position={[0.16, -0.38, 0]}>
              <sphereGeometry args={[0.055, 12, 12]} />
              <meshStandardMaterial color="#ffeb3b" roughness={0.3} />
            </mesh>
            
            {/* Bastón de Mando de Oro */}
            <group position={[0.18, -0.34, 0.08]} rotation={[0.3, 0, 0]}>
              <mesh>
                <cylinderGeometry args={[0.015, 0.015, 0.9, 8]} />
                <meshStandardMaterial color="#3e2723" />
              </mesh>
              <mesh position={[0, 0.45, 0]}>
                <sphereGeometry args={[0.065, 12, 12]} />
                <meshStandardMaterial color="#ffeb3b" roughness={0.1} metalness={0.9} />
              </mesh>
            </group>
          </group>

          {/* Cabeza: ¡Las legendarias mandíbulas flotantes de Caine! */}
          <group position={[0, 2.1, 0]}>
            
            {/* Mandíbula Superior */}
            <mesh position={[0, caineEmotion === 'enojo' ? 0.35 : 0.22, 0]} castShadow>
              <cylinderGeometry args={[0.36, 0.36, 0.15, 18]} />
              <meshStandardMaterial color="#b71c1c" roughness={0.4} />
            </mesh>
            {/* Dientes Superiores Brillantes */}
            <group position={[0, caineEmotion === 'enojo' ? 0.25 : 0.12, 0.06]}>
              {[-0.2, -0.1, 0, 0.1, 0.2].map((x, i) => (
                <mesh key={`ut-${i}`} position={[x, 0, 0.22]} rotation={[0, x * 0.5, 0]}>
                  <boxGeometry args={[0.05, caineEmotion === 'enojo' ? 0.09 : 0.05, 0.05]} />
                  <meshStandardMaterial color="#ffffff" roughness={0.9} />
                </mesh>
              ))}
            </group>

            {/* Mandíbula Inferior */}
            <mesh position={[0, caineEmotion === 'enojo' ? -0.35 : -0.22, 0]} castShadow>
              <cylinderGeometry args={[0.36, 0.36, 0.15, 18]} />
              <meshStandardMaterial color="#b71c1c" roughness={0.4} />
            </mesh>
            {/* Dientes Inferiores */}
            <group position={[0, caineEmotion === 'enojo' ? -0.25 : -0.12, 0.06]}>
              {[-0.2, -0.1, 0, 0.1, 0.2].map((x, i) => (
                <mesh key={`lt-${i}`} position={[x, 0, 0.22]} rotation={[0, x * 0.5, 0]}>
                  <boxGeometry args={[0.05, caineEmotion === 'enojo' ? 0.09 : 0.05, 0.05]} />
                  <meshStandardMaterial color="#ffffff" roughness={0.9} />
                </mesh>
              ))}
            </group>

            {/* Ojos Gigantes del Centro de la Boca (Con iris coloridos y brillos expresivos) */}
            <group position={[-0.12, 0.01, 0.1]}>
              <mesh>
                <sphereGeometry args={[0.12, 18, 18]} />
                <meshBasicMaterial color="#ffffff" />
              </mesh>
              {/* Iris verde de Caine */}
              <mesh position={[0, 0, 0.1]}>
                <sphereGeometry args={[0.045, 12, 12]} />
                <meshBasicMaterial color={caineEmotion === 'enojo' ? '#ff1744' : '#00e676'} />
              </mesh>
              {/* Pupila */}
              <mesh position={[0, 0, 0.12]}>
                <sphereGeometry args={[0.018, 8, 8]} />
                <meshBasicMaterial color="#000000" />
              </mesh>
              {/* Brillo */}
              <mesh position={[0.02, 0.02, 0.13]}>
                <sphereGeometry args={[0.01, 8, 8]} />
                <meshBasicMaterial color="#ffffff" />
              </mesh>
            </group>
            
            <group position={[0.12, 0.01, 0.1]}>
              <mesh>
                <sphereGeometry args={[0.12, 18, 18]} />
                <meshBasicMaterial color="#ffffff" />
              </mesh>
              {/* Iris azul de Caine */}
              <mesh position={[0, 0, 0.1]}>
                <sphereGeometry args={[0.045, 12, 12]} />
                <meshBasicMaterial color={caineEmotion === 'enojo' ? '#ff1744' : '#29b6f6'} />
              </mesh>
              {/* Pupila */}
              <mesh position={[0, 0, 0.12]}>
                <sphereGeometry args={[0.018, 8, 8]} />
                <meshBasicMaterial color="#000000" />
              </mesh>
              {/* Brillo */}
              <mesh position={[0.02, 0.02, 0.13]}>
                <sphereGeometry args={[0.01, 8, 8]} />
                <meshBasicMaterial color="#ffffff" />
              </mesh>
            </group>

            {/* Sombrero de Copa Negro Flotante característico de Caine */}
            <group ref={caineHatRef} position={[0, 0.58, -0.04]} rotation={[0.05, 0, 0]}>
              <mesh position={[0, 0, 0]} castShadow>
                <cylinderGeometry args={[0.34, 0.34, 0.02, 16]} />
                <meshStandardMaterial color="#212121" />
              </mesh>
              <mesh position={[0, 0.2, 0]} castShadow>
                <cylinderGeometry args={[0.2, 0.2, 0.4, 16]} />
                <meshStandardMaterial color="#212121" />
              </mesh>
              <mesh position={[0, 0.03, 0]}>
                <cylinderGeometry args={[0.21, 0.21, 0.05, 16]} />
                <meshStandardMaterial color="#d32f2f" />
              </mesh>
            </group>

            {/* Red glitch glow lines around Caine if angry / glitching / attacked */}
            {(isGlitching || caineEmotion === 'enojo' || attackedMembers['caine']) && (
              <group>
                <mesh position={[0, 0, 0]}>
                  <boxGeometry args={[1.2, 1.2, 1.2]} />
                  <meshBasicMaterial color="#ff1744" wireframe />
                </mesh>
                <mesh position={[0, 0.4, 0]} rotation={[0, Math.PI / 4, 0]}>
                  <boxGeometry args={[1.0, 1.4, 1.0]} />
                  <meshBasicMaterial color="#00e5ff" wireframe />
                </mesh>
              </group>
            )}
          </group>
        </group>

      </group>
    </group>
  );
}
