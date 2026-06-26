import React, { useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { useInputStore } from '../store';

export default function Player() {
  const { camera } = useThree();
  const playerRef = useRef<THREE.Group>(null);
  const modelRef = useRef<THREE.Group>(null);
  
  // Limbs reference for animation
  const leftLegRef = useRef<THREE.Group>(null);
  const rightLegRef = useRef<THREE.Group>(null);
  const leftArmRef = useRef<THREE.Group>(null);
  const rightArmRef = useRef<THREE.Group>(null);
  const hatLeftRef = useRef<THREE.Group>(null);
  const hatRightRef = useRef<THREE.Group>(null);
  const headRef = useRef<THREE.Group>(null);
  const lastActiveTime = useRef(0);
  const isAutoSleeping = useRef(false);
  
  // Variables de control de cámara y jugador
  const yaw = useRef(0);
  const pitch = useRef(0.2); // Ligeramente inclinado hacia abajo inicialmente
  const currentPos = useRef(new THREE.Vector3(0, 0.05, 10)); // Posición inicial
  const velocity = useRef(new THREE.Vector3());

  // Parámetros de ajuste
  const moveSpeed = 10.0;
  const tentRadius = 29; // Ligeramente menor que la carpa para no atravesar la pared

  const pomniEmotion = useInputStore((state) => state.pomniEmotion);
  const cameraFocusTarget = useInputStore((state) => state.cameraFocusTarget);
  const currentZone = useInputStore((state) => state.currentZone);
  const isSleeping = useInputStore((state) => state.isSleeping);
  const isAbstracted = useInputStore((state) => state.isAbstracted);
  const controlledCharacter = useInputStore((state) => state.controlledCharacter);

  useFrame((state, delta) => {
    if (!playerRef.current || !modelRef.current) return;

    // Obtener inputs sin suscribirse al store (para rendimiento)
    const { move, look } = useInputStore.getState();

    // Inactividad y auto-dormir en dormitorios
    const currentTime = state.clock.getElapsedTime();
    const hasMoveInput = Math.abs(move.x) > 0.05 || Math.abs(move.y) > 0.05;
    const hasLookInput = Math.abs(look.x) > 0.005 || Math.abs(look.y) > 0.005;

    if (hasMoveInput || hasLookInput) {
      if (isAutoSleeping.current) {
        isAutoSleeping.current = false;
        useInputStore.getState().setActiveDialogue({
          speaker: "POMNI",
          text: "¡Ah! Me quedé dormida de pie... Debo seguir buscando la salida.",
          color: "#e1f5fe"
        });
        setTimeout(() => {
          const act = useInputStore.getState().activeDialogue;
          if (act && act.speaker === "POMNI" && act.text.includes("dormida de pie")) {
            useInputStore.getState().setActiveDialogue(null);
          }
        }, 4000);
      }
      lastActiveTime.current = currentTime;
    }

    const inactivityLimit = 6.0; // 6 segundos de inactividad
    if (currentZone === 'dormitories' && !isSleeping && !isAbstracted) {
      if (currentTime - lastActiveTime.current > inactivityLimit) {
        if (!isAutoSleeping.current) {
          isAutoSleeping.current = true;
          useInputStore.getState().setActiveDialogue({
            speaker: "SISTEMA",
            text: "Pomni se ha quedado dormida de pie debido al cansancio en los dormitorios...",
            color: "#9c27b0"
          });
        }
      }
    } else {
      isAutoSleeping.current = false;
    }

    // 0. Manejo del Estado de Sueño (Dormir en la cama)
    if (isSleeping) {
      // Asegurarse de que esté alineado en la cama [0, 0.65, 0]
      currentPos.current.set(0, 0.65, 0);
      velocity.current.set(0, 0, 0);
      playerRef.current.position.copy(currentPos.current);
      
      // Acostada boca arriba
      modelRef.current.rotation.set(-Math.PI / 2, 0, Math.PI);

      // Despertar automático al presionar los controles de movimiento
      if (Math.abs(move.x) > 0.1 || Math.abs(move.y) > 0.1) {
        useInputStore.getState().setSleeping(false);
      }

      // Cámara tranquila flotando desde arriba enfocando la cama
      const targetCamPos = new THREE.Vector3(0, 3.8, 3.2);
      camera.position.lerp(targetCamPos, 6 * delta);
      camera.lookAt(0, 0.5, 0);
      return; // Omitir el resto de física y movimiento mientras duerme
    } else {
      // Restablecer rotaciones de acostado a vertical cuando se despierta
      if (modelRef.current.rotation.x !== 0) {
        modelRef.current.rotation.set(0, modelRef.current.rotation.y, 0);
      }
    }

    // 1. Actualizar rotación de cámara (Look)
    if (!cameraFocusTarget) {
      yaw.current -= look.x;
      pitch.current -= look.y;
      // Limitar el cabeceo (pitch) para no girar la cámara completamente
      pitch.current = Math.max(-Math.PI / 3, Math.min(Math.PI / 3, pitch.current));
    }

    // Resetear look después de procesarlo para evitar giro continuo si el dedo se detiene
    useInputStore.getState().setLook(0, 0);

    // 2. Calcular movimiento (Move)
    // El movimiento es relativo a donde mira la cámara en el eje Y (yaw)
    const forward = new THREE.Vector3(0, 0, -1).applyAxisAngle(new THREE.Vector3(0, 1, 0), yaw.current);
    const right = new THREE.Vector3(1, 0, 0).applyAxisAngle(new THREE.Vector3(0, 1, 0), yaw.current);

    // Si está abstraído, se mueve un poco más caóticamente rápido; en la oscuridad se mueve lento
    const activeSpeed = isAbstracted 
      ? moveSpeed * 1.35 
      : (currentZone === 'darkness' ? moveSpeed * 0.65 : moveSpeed);

    const moveDirection = new THREE.Vector3()
      .addScaledVector(forward, -move.y) // move.y negativo es hacia adelante en joystick
      .addScaledVector(right, move.x)
      .normalize();

    // Suavizar velocidad (Aceleración / Fricción básica)
    if (moveDirection.length() > 0) {
      velocity.current.lerp(moveDirection.multiplyScalar(activeSpeed), 10 * delta);
      
      // Rotar suavemente el modelo hacia la dirección de movimiento
      const targetRotation = Math.atan2(velocity.current.x, velocity.current.z);
      const diff = targetRotation - modelRef.current.rotation.y;
      const normalizedDiff = Math.atan2(Math.sin(diff), Math.cos(diff));
      modelRef.current.rotation.y += normalizedDiff * 10 * delta;
    } else {
      velocity.current.lerp(new THREE.Vector3(0, 0, 0), 15 * delta);
    }

    // Actualizar posición
    currentPos.current.x += velocity.current.x * delta;
    currentPos.current.z += velocity.current.z * delta;

    // 2.1 Colisiones Dinámicas y Transición Física de Portales según Zona
    if (currentZone === 'circus') {
      const distFromCenter = Math.sqrt(currentPos.current.x ** 2 + currentPos.current.z ** 2);
      if (distFromCenter > tentRadius) {
        // ¿Está cerca de la puerta mística hacia los Dormitorios? (z ≈ -tentRadius, x ≈ 0)
        if (currentPos.current.z < -tentRadius + 2.5 && Math.abs(currentPos.current.x) < 3.2) {
          useInputStore.getState().setZone('dormitories');
          currentPos.current.set(0, 0.05, 21.0); // Aparece al inicio del pasillo
        } else {
          // Rebotar contra la pared de la carpa
          const angle = Math.atan2(currentPos.current.z, currentPos.current.x);
          currentPos.current.x = Math.cos(angle) * tentRadius;
          currentPos.current.z = Math.sin(angle) * tentRadius;
        }
      }
    } else if (currentZone === 'dormitories') {
      // Límites rectangulares del largo pasillo de dormitorios: x [-5.4, 5.4], z [-23.6, 23.6]
      currentPos.current.x = Math.max(-5.4, Math.min(5.4, currentPos.current.x));
      
      if (currentPos.current.z < -23.0) {
        // Cruza la puerta del sótano oscuro
        useInputStore.getState().setZone('darkness');
        currentPos.current.set(0, 0.05, 5.5); // Aparece enfrente del portal de regreso en el vacío
      } else if (currentPos.current.z > 23.0) {
        // Cruza la puerta de regreso al circo
        useInputStore.getState().setZone('circus');
        currentPos.current.set(0, 0.05, -tentRadius + 3.0); // Aparece cerca de la entrada del circo
      } else {
        currentPos.current.z = Math.max(-23.4, Math.min(23.4, currentPos.current.z));
      }
    } else if (currentZone === 'darkness') {
      // Vacío circular grande
      const darkRadius = 45.0;
      const dist = Math.sqrt(currentPos.current.x ** 2 + currentPos.current.z ** 2);
      if (dist > darkRadius) {
        const angle = Math.atan2(currentPos.current.z, currentPos.current.x);
        currentPos.current.x = Math.cos(angle) * darkRadius;
        currentPos.current.z = Math.sin(angle) * darkRadius;
      }

      // ¿Se acerca al portal de plasma para despertar/volver? (en [0, 0, 8])
      const distToPortal = Math.sqrt(currentPos.current.x ** 2 + (currentPos.current.z - 8) ** 2);
      if (distToPortal < 1.3) {
        useInputStore.getState().setZone('dormitories');
        currentPos.current.set(5.0, 0.05, -10.0); // Aparece enfrente de la puerta de Pomni
      }
    }

    playerRef.current.position.copy(currentPos.current);

    // 3. Animaciones de caminata y balanceo (Legs and Arms)
    const cycle = state.clock.getElapsedTime() * 12;
    const isMoving = velocity.current.length() > 0.5;

    if (isMoving) {
      // Movimiento coordinado de piernas
      if (leftLegRef.current) leftLegRef.current.rotation.x = Math.sin(cycle) * 0.6;
      if (rightLegRef.current) rightLegRef.current.rotation.x = -Math.sin(cycle) * 0.6;
      
      // Movimiento coordinado de brazos
      if (leftArmRef.current) leftArmRef.current.rotation.x = -Math.sin(cycle) * 0.5;
      if (rightArmRef.current) rightArmRef.current.rotation.x = Math.sin(cycle) * 0.5;

      // Movimiento sutil de los cascabeles del sombrero al correr
      if (hatLeftRef.current) hatLeftRef.current.rotation.z = 0.5 + Math.sin(cycle) * 0.15;
      if (hatRightRef.current) hatRightRef.current.rotation.z = -0.5 - Math.sin(cycle) * 0.15;
    } else {
      // Reposo o Sueño automático
      if (isAutoSleeping.current) {
        const sleepBreath = Math.sin(state.clock.getElapsedTime() * 1.5) * 0.04;
        
        // Caer cabeza (inclinar adelante y un poco al lado)
        if (headRef.current) {
          headRef.current.rotation.x = THREE.MathUtils.lerp(headRef.current.rotation.x, 0.45 + sleepBreath, 4 * delta);
          headRef.current.rotation.z = THREE.MathUtils.lerp(headRef.current.rotation.z, 0.1, 4 * delta);
        }
        
        // Piernas quietas
        if (leftLegRef.current) leftLegRef.current.rotation.x = 0;
        if (rightLegRef.current) rightLegRef.current.rotation.x = 0;

        // Brazos colgando cansados
        if (leftArmRef.current) {
          leftArmRef.current.rotation.x = THREE.MathUtils.lerp(leftArmRef.current.rotation.x, 0.15, 4 * delta);
          leftArmRef.current.rotation.z = THREE.MathUtils.lerp(leftArmRef.current.rotation.z, 0.04, 4 * delta);
        }
        if (rightArmRef.current) {
          rightArmRef.current.rotation.x = THREE.MathUtils.lerp(rightArmRef.current.rotation.x, 0.15, 4 * delta);
          rightArmRef.current.rotation.z = THREE.MathUtils.lerp(rightArmRef.current.rotation.z, -0.04, 4 * delta);
        }

        // Puntas del sombrero caídas
        if (hatLeftRef.current) hatLeftRef.current.rotation.z = THREE.MathUtils.lerp(hatLeftRef.current.rotation.z, 0.72 + sleepBreath * 0.5, 4 * delta);
        if (hatRightRef.current) hatRightRef.current.rotation.z = THREE.MathUtils.lerp(hatRightRef.current.rotation.z, -0.72 - sleepBreath * 0.5, 4 * delta);

        // Movimiento respiratorio de todo el cuerpo
        if (modelRef.current) {
          modelRef.current.position.y = THREE.MathUtils.lerp(modelRef.current.position.y, -0.05 + sleepBreath * 0.4, 4 * delta);
        }
      } else {
        // Reposo normal (Breathing animation)
        const breath = Math.sin(state.clock.getElapsedTime() * 3) * 0.05;
        if (modelRef.current) modelRef.current.position.y = THREE.MathUtils.lerp(modelRef.current.position.y, 0, 8 * delta);
        if (headRef.current) {
          headRef.current.rotation.x = THREE.MathUtils.lerp(headRef.current.rotation.x, 0, 8 * delta);
          headRef.current.rotation.z = THREE.MathUtils.lerp(headRef.current.rotation.z, 0, 8 * delta);
        }
        if (leftLegRef.current) leftLegRef.current.rotation.x = 0;
        if (rightLegRef.current) rightLegRef.current.rotation.x = 0;
        if (leftArmRef.current) {
          leftArmRef.current.rotation.x = THREE.MathUtils.lerp(leftArmRef.current.rotation.x, breath, 8 * delta);
          leftArmRef.current.rotation.z = THREE.MathUtils.lerp(leftArmRef.current.rotation.z, 0.1 + breath * 0.5, 8 * delta);
        }
        if (rightArmRef.current) {
          rightArmRef.current.rotation.x = THREE.MathUtils.lerp(rightArmRef.current.rotation.x, -breath, 8 * delta);
          rightArmRef.current.rotation.z = THREE.MathUtils.lerp(rightArmRef.current.rotation.z, -0.1 - breath * 0.5, 8 * delta);
        }
        if (hatLeftRef.current) hatLeftRef.current.rotation.z = THREE.MathUtils.lerp(hatLeftRef.current.rotation.z, 0.5 + breath * 0.3, 8 * delta);
        if (hatRightRef.current) hatRightRef.current.rotation.z = THREE.MathUtils.lerp(hatRightRef.current.rotation.z, -0.5 - breath * 0.3, 8 * delta);
      }
    }

    // 4. Actualizar Cámara
    if (cameraFocusTarget) {
      // Enfocar cámara en el objetivo override (por ejemplo, Caine durante el glitch)
      const targetVec = new THREE.Vector3(...cameraFocusTarget);
      const idealCamPos = new THREE.Vector3(currentPos.current.x, currentPos.current.y + 4, currentPos.current.z + 5);
      camera.position.lerp(idealCamPos, 5 * delta);
      camera.lookAt(targetVec);
    } else {
      // Tercera persona normal detrás de Pomni
      const cameraOffset = new THREE.Vector3(0, 3, 5.5); // Altura y distancia
      cameraOffset.applyAxisAngle(new THREE.Vector3(1, 0, 0), pitch.current);
      cameraOffset.applyAxisAngle(new THREE.Vector3(0, 1, 0), yaw.current);

      const targetCamPos = currentPos.current.clone().add(cameraOffset);
      camera.position.lerp(targetCamPos, 10 * delta);
      camera.lookAt(currentPos.current.x, currentPos.current.y + 1, currentPos.current.z);
    }
  });

  return (
    <group ref={playerRef}>
      <group ref={modelRef} position={[0, 0, 0]}>
        {controlledCharacter !== 'pomni' ? (
          <group position={[0, 0.45, 0]}>
            {/* CHARACTER AVATAR REPLACEMENT */}
            {controlledCharacter === 'jax' && (
              <group>
                {/* Overalls Rosas de Jax */}
                <mesh castShadow position={[0, 0.3, 0]}>
                  <cylinderGeometry args={[0.18, 0.18, 0.5, 16]} />
                  <meshStandardMaterial color="#ea7d95" roughness={0.4} />
                </mesh>
                {/* Tirantes de los overalls */}
                <mesh position={[-0.09, 0.55, 0.08]} rotation={[0.08, 0, 0.05]}>
                  <boxGeometry args={[0.03, 0.25, 0.02]} />
                  <meshStandardMaterial color="#ea7d95" />
                </mesh>
                <mesh position={[0.09, 0.55, 0.08]} rotation={[0.08, 0, -0.05]}>
                  <boxGeometry args={[0.03, 0.25, 0.02]} />
                  <meshStandardMaterial color="#ea7d95" />
                </mesh>
                {/* Bolsillo delantero de los overalls de Jax */}
                <mesh position={[0, 0.32, 0.165]}>
                  <boxGeometry args={[0.08, 0.12, 0.02]} />
                  <meshStandardMaterial color="#f48fb1" roughness={0.4} />
                </mesh>
                {/* Cuerpo morado de Jax */}
                <mesh castShadow position={[0, 0.65, 0]}>
                  <cylinderGeometry args={[0.15, 0.13, 0.8, 16]} />
                  <meshStandardMaterial color="#b39ddb" roughness={0.5} />
                </mesh>
                {/* Botones amarillos */}
                <mesh position={[0.06, 0.42, 0.16]}>
                  <sphereGeometry args={[0.03, 8, 8]} />
                  <meshStandardMaterial color="#ffeb3b" roughness={0.2} metalness={0.5} />
                </mesh>
                <mesh position={[-0.06, 0.42, 0.16]}>
                  <sphereGeometry args={[0.03, 8, 8]} />
                  <meshStandardMaterial color="#ffeb3b" roughness={0.2} metalness={0.5} />
                </mesh>
                {/* Cabeza Jax */}
                <group position={[0, 1.25, 0]}>
                  <mesh castShadow>
                    <sphereGeometry args={[0.24, 16, 16]} />
                    <meshStandardMaterial color="#b39ddb" roughness={0.6} />
                  </mesh>
                  {/* Ojos amarillos paranoicos con pupilas verticales de rendija */}
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
                      <mesh key={`jax-tooth-line-${i}`} position={[xOffset, 0, 0.011]}>
                        <boxGeometry args={[0.006, 0.05, 0.038]} />
                        <meshBasicMaterial color="#000000" />
                      </mesh>
                    ))}
                  </group>
                  {/* Orejas largas de conejo levantadas rectamente */}
                  <group position={[-0.09, 0.18, 0]} rotation={[0, 0, -0.05]}>
                    <mesh position={[0, 0.35, 0]} castShadow>
                      <cylinderGeometry args={[0.04, 0.03, 0.6, 12]} />
                      <meshStandardMaterial color="#b39ddb" />
                    </mesh>
                    <mesh position={[0, 0.35, 0.02]}>
                      <boxGeometry args={[0.045, 0.5, 0.01]} />
                      <meshStandardMaterial color="#ea80fc" />
                    </mesh>
                  </group>
                  <group position={[0.09, 0.18, 0]} rotation={[0, 0, 0.05]}>
                    <mesh position={[0, 0.35, 0]} castShadow>
                      <cylinderGeometry args={[0.04, 0.03, 0.6, 12]} />
                      <meshStandardMaterial color="#b39ddb" />
                    </mesh>
                    <mesh position={[0, 0.35, 0.02]}>
                      <boxGeometry args={[0.045, 0.5, 0.01]} />
                      <meshStandardMaterial color="#ea80fc" />
                    </mesh>
                  </group>
                </group>
                {/* Piernas largas */}
                <group position={[-0.1, 0, 0]}>
                  <mesh castShadow position={[0, 0.15, 0]}>
                    <cylinderGeometry args={[0.03, 0.03, 0.45, 8]} />
                    <meshStandardMaterial color="#b39ddb" />
                  </mesh>
                  {/* Bota / Pie morado */}
                  <mesh position={[0, -0.05, 0.04]} castShadow>
                    <boxGeometry args={[0.07, 0.08, 0.16]} />
                    <meshStandardMaterial color="#9575cd" />
                  </mesh>
                </group>
                <group position={[0.1, 0, 0]}>
                  <mesh castShadow position={[0, 0.15, 0]}>
                    <cylinderGeometry args={[0.03, 0.03, 0.45, 8]} />
                    <meshStandardMaterial color="#b39ddb" />
                  </mesh>
                  {/* Bota / Pie morado */}
                  <mesh position={[0, -0.05, 0.04]} castShadow>
                    <boxGeometry args={[0.07, 0.08, 0.16]} />
                    <meshStandardMaterial color="#9575cd" />
                  </mesh>
                </group>
                {/* Brazos flacos de Jax con guantes amarillos */}
                <mesh position={[-0.22, 0.7, 0]} rotation={[0, 0, 0.15]} castShadow>
                  <cylinderGeometry args={[0.03, 0.03, 0.45, 8]} />
                  <meshStandardMaterial color="#b39ddb" />
                </mesh>
                <mesh position={[-0.28, 0.45, 0]} castShadow>
                  <sphereGeometry args={[0.065, 12, 12]} />
                  <meshStandardMaterial color="#ffeb3b" roughness={0.4} />
                </mesh>
                <mesh position={[0.22, 0.7, 0]} rotation={[0, 0, -0.15]} castShadow>
                  <cylinderGeometry args={[0.03, 0.03, 0.45, 8]} />
                  <meshStandardMaterial color="#b39ddb" />
                </mesh>
                <mesh position={[0.28, 0.45, 0]} castShadow>
                  <sphereGeometry args={[0.065, 12, 12]} />
                  <meshStandardMaterial color="#ffeb3b" roughness={0.4} />
                </mesh>
              </group>
            )}

            {controlledCharacter === 'ragatha' && (
              <group>
                {/* Vestido azul acampanado */}
                <mesh castShadow position={[0, 0.45, 0]}>
                  <coneGeometry args={[0.28, 0.75, 16]} />
                  <meshStandardMaterial color="#1e88e5" roughness={0.6} />
                </mesh>
                {/* Cabeza Ragatha */}
                <group position={[0, 0.95, 0]}>
                  <mesh castShadow>
                    <sphereGeometry args={[0.22, 16, 16]} />
                    <meshStandardMaterial color="#ffe0bd" roughness={0.8} />
                  </mesh>
                  {/* Cabello de lana roja con flequillo */}
                  <mesh position={[0, 0.1, -0.04]} castShadow>
                    <sphereGeometry args={[0.24, 16, 12]} />
                    <meshStandardMaterial color="#d32f2f" roughness={0.9} />
                  </mesh>
                  {/* Ojo de botón azul */}
                  <mesh position={[-0.07, 0.02, 0.19]} rotation={[0, 0.1, 0]}>
                    <cylinderGeometry args={[0.04, 0.04, 0.02, 8]} />
                    <meshStandardMaterial color="#311b92" />
                  </mesh>
                  {/* Ojo normal blanco pintado */}
                  <mesh position={[0.07, 0.02, 0.19]}>
                    <sphereGeometry args={[0.04, 8, 8]} />
                    <meshBasicMaterial color="#ffffff" />
                  </mesh>
                  <mesh position={[0.07, 0.02, 0.21]}>
                    <sphereGeometry args={[0.015, 6, 6]} />
                    <meshBasicMaterial color="#000000" />
                  </mesh>
                </group>
                {/* Piernas de trapo */}
                <mesh position={[-0.08, 0.05, 0]} castShadow>
                  <cylinderGeometry args={[0.035, 0.035, 0.35, 8]} />
                  <meshStandardMaterial color="#ffe0bd" />
                </mesh>
                <mesh position={[0.08, 0.05, 0]} castShadow>
                  <cylinderGeometry args={[0.035, 0.035, 0.35, 8]} />
                  <meshStandardMaterial color="#ffe0bd" />
                </mesh>
              </group>
            )}

            {controlledCharacter === 'kinger' && (
              <group>
                {/* Cuerpo de Rey de Ajedrez */}
                <mesh castShadow position={[0, 0.55, 0]}>
                  <cylinderGeometry args={[0.13, 0.25, 0.9, 16]} />
                  <meshStandardMaterial color="#e0d4cc" roughness={0.5} />
                </mesh>
                {/* Capa de Rey de terciopelo Púrpura */}
                <mesh castShadow position={[0, 0.5, 0]} scale={[1.15, 1.0, 1.15]}>
                  <cylinderGeometry args={[0.14, 0.28, 0.85, 16, 1, true]} />
                  <meshStandardMaterial color="#4a148c" side={THREE.DoubleSide} />
                </mesh>
                {/* Corona Dorada */}
                <group position={[0, 1.1, 0]}>
                  <mesh castShadow>
                    <cylinderGeometry args={[0.15, 0.12, 0.15, 12]} />
                    <meshStandardMaterial color="#ffb300" metalness={0.8} roughness={0.2} />
                  </mesh>
                </group>
                {/* Ojos saltones paranoicos */}
                <group position={[0, 0.85, 0]}>
                  <mesh position={[-0.08, 0, 0.15]} castShadow>
                    <sphereGeometry args={[0.07, 12, 12]} />
                    <meshBasicMaterial color="#ffffff" />
                  </mesh>
                  <mesh position={[-0.08, 0, 0.2]} >
                    <sphereGeometry args={[0.025, 8, 8]} />
                    <meshBasicMaterial color="#000000" />
                  </mesh>
                  <mesh position={[0.08, 0, 0.15]} castShadow>
                    <sphereGeometry args={[0.07, 12, 12]} />
                    <meshBasicMaterial color="#ffffff" />
                  </mesh>
                  <mesh position={[0.08, 0, 0.2]} >
                    <sphereGeometry args={[0.025, 8, 8]} />
                    <meshBasicMaterial color="#000000" />
                  </mesh>
                </group>
                {/* Manos flotantes blancas */}
                <mesh position={[-0.28, 0.45, 0.15]} castShadow>
                  <sphereGeometry args={[0.06, 8, 8]} />
                  <meshStandardMaterial color="#ffffff" roughness={0.9} />
                </mesh>
                <mesh position={[0.28, 0.45, 0.15]} castShadow>
                  <sphereGeometry args={[0.06, 8, 8]} />
                  <meshStandardMaterial color="#ffffff" roughness={0.9} />
                </mesh>
              </group>
            )}

            {controlledCharacter === 'zooble' && (
              <group>
                {/* Torso geométrico triangular rosa */}
                <mesh castShadow position={[0, 0.55, 0]} rotation={[0, 0, Math.PI]}>
                  <coneGeometry args={[0.18, 0.7, 4]} />
                  <meshStandardMaterial color="#ff4081" roughness={0.3} />
                </mesh>
                {/* Pierna Izquierda amarilla */}
                <mesh position={[-0.1, 0.15, 0]} castShadow>
                  <cylinderGeometry args={[0.025, 0.025, 0.35, 8]} />
                  <meshStandardMaterial color="#ffeb3b" />
                </mesh>
                {/* Pierna Derecha pata naranja */}
                <mesh position={[0.1, 0.1, 0]} castShadow>
                  <boxGeometry args={[0.04, 0.25, 0.04]} />
                  <meshStandardMaterial color="#ff5722" />
                </mesh>
                <mesh position={[0.1, 0, 0.04]} castShadow>
                  <boxGeometry args={[0.08, 0.02, 0.1]} />
                  <meshStandardMaterial color="#ff5722" />
                </mesh>
                {/* Cabeza azul de antena abstracta */}
                <group position={[0, 1.0, 0]}>
                  <mesh castShadow>
                    <sphereGeometry args={[0.14, 8, 8]} />
                    <meshStandardMaterial color="#00e5ff" />
                  </mesh>
                  {/* Antena en espiral morada */}
                  <mesh position={[0, 0.2, 0]}>
                    <cylinderGeometry args={[0.015, 0.015, 0.25, 8]} />
                    <meshStandardMaterial color="#e040fb" />
                  </mesh>
                  {/* Ojo gigante de platillo */}
                  <mesh position={[0, 0, 0.12]}>
                    <sphereGeometry args={[0.06, 12, 12]} />
                    <meshBasicMaterial color="#ffffff" />
                  </mesh>
                  <mesh position={[0, 0, 0.16]}>
                    <sphereGeometry args={[0.018, 8, 8]} />
                    <meshBasicMaterial color="#e040fb" />
                  </mesh>
                </group>
              </group>
            )}
          </group>
        ) : isAbstracted ? (
          <group position={[0, 0.65, 0]}>
            {/* Mass of black spheres and cubes */}
            <mesh castShadow>
              <sphereGeometry args={[0.42, 16, 16]} />
              <meshStandardMaterial color="#050505" roughness={0.9} />
            </mesh>
            <mesh position={[0.08, 0.15, 0.08]} rotation={[0.5, 0.2, 0.4]}>
              <boxGeometry args={[0.55, 0.55, 0.55]} />
              <meshStandardMaterial color="#000000" roughness={0.9} wireframe />
            </mesh>
            <mesh position={[-0.12, -0.1, -0.08]} rotation={[-0.2, 0.5, 0.1]}>
              <sphereGeometry args={[0.35, 12, 12]} />
              <meshBasicMaterial color="#111111" />
            </mesh>
            {/* Multiples ojos flotantes de colores neón */}
            <group position={[0, 0.1, 0.28]}>
              <mesh position={[-0.14, 0.08, 0]}>
                <sphereGeometry args={[0.08, 8, 8]} />
                <meshBasicMaterial color="#ff0055" />
              </mesh>
              <mesh position={[0.14, -0.06, 0.03]}>
                <sphereGeometry args={[0.1, 8, 8]} />
                <meshBasicMaterial color="#39ff14" />
              </mesh>
              <mesh position={[0, 0.2, -0.06]}>
                <sphereGeometry args={[0.06, 8, 8]} />
                <meshBasicMaterial color="#00e5ff" />
              </mesh>
              <mesh position={[-0.06, -0.12, 0.01]}>
                <sphereGeometry args={[0.07, 8, 8]} />
                <meshBasicMaterial color="#ffeb3b" />
              </mesh>
            </group>
            {/* Wires/Glitches coming out */}
            {Array.from({ length: 6 }).map((_, i) => (
              <mesh 
                key={`beast-wire-${i}`} 
                position={[Math.sin(i * 2.1) * 0.25, Math.cos(i * 3.1) * 0.25, Math.sin(i * 5.1) * 0.25]}
                rotation={[i * 0.7, i * 1.3, 0]}
              >
                <boxGeometry args={[0.85, 0.03, 0.03]} />
                <meshBasicMaterial color={i % 2 === 0 ? "#ff0055" : "#00e5ff"} />
              </mesh>
            ))}
          </group>
        ) : (
          <>
            {/* Cuerpo (Torso) */}
            <group position={[0, 0.6, 0]}>
              <mesh castShadow>
                <cylinderGeometry args={[0.22, 0.32, 0.6, 16]} />
                <meshStandardMaterial color="#f44336" roughness={0.4} />
              </mesh>
              <mesh castShadow>
                <cylinderGeometry args={[0.23, 0.33, 0.6, 16, 1, false, 0, Math.PI]} />
                <meshStandardMaterial color="#2196f3" roughness={0.4} />
              </mesh>
              {/* Botones amarillos en el pecho */}
              <mesh position={[0, 0.15, 0.28]}>
                <sphereGeometry args={[0.045, 8, 8]} />
                <meshStandardMaterial color="#ffeb3b" metalness={0.5} roughness={0.2} />
              </mesh>
              <mesh position={[0, -0.15, 0.28]}>
                <sphereGeometry args={[0.045, 8, 8]} />
                <meshStandardMaterial color="#ffeb3b" metalness={0.5} roughness={0.2} />
              </mesh>
            </group>

            {/* Cuello de Bufón Amarillo con picos */}
            <group position={[0, 0.92, 0]}>
              <mesh>
                <cylinderGeometry args={[0.24, 0.2, 0.08, 12]} />
                <meshStandardMaterial color="#ffd54f" roughness={0.3} />
              </mesh>
              {/* Picos del cuello de Pomni */}
              {Array.from({ length: 6 }).map((_, i) => {
                const angle = (i * Math.PI * 2) / 6;
                return (
                  <mesh
                    key={`collar-point-${i}`}
                    position={[Math.cos(angle) * 0.22, -0.04, Math.sin(angle) * 0.22]}
                    rotation={[0.3, -angle, 0]}
                  >
                    <coneGeometry args={[0.07, 0.14, 4]} />
                    <meshStandardMaterial color="#ffd54f" roughness={0.3} />
                  </mesh>
                );
              })}
            </group>

            {/* Piernas */}
            {/* Pierna Izquierda (Azul / Viewer Derecho) */}
            <group ref={leftLegRef} position={[-0.14, 0.45, 0]}>
              {/* Pantalón bombacho azul (puffy shorts) */}
              <mesh castShadow position={[0, 0, 0]}>
                <sphereGeometry args={[0.13, 12, 12]} />
                <meshStandardMaterial color="#2196f3" roughness={0.4} />
              </mesh>
              {/* Detalle dorado/amarillo al final del bombacho */}
              <mesh position={[0, -0.08, 0]}>
                <cylinderGeometry args={[0.09, 0.09, 0.03, 12]} />
                <meshStandardMaterial color="#ffd54f" />
              </mesh>
              {/* Pierna delgada blanca */}
              <mesh position={[0, -0.25, 0]} castShadow>
                <cylinderGeometry args={[0.035, 0.035, 0.3, 8]} />
                <meshStandardMaterial color="#ffffff" roughness={0.5} />
              </mesh>
              {/* Zapato/Bota Azul con punta curvada y borde amarillo */}
              <mesh position={[0, -0.4, 0.06]} castShadow>
                <capsuleGeometry args={[0.065, 0.12, 8, 8]} />
                <meshStandardMaterial color="#2196f3" roughness={0.5} />
              </mesh>
              {/* Borde amarillo superior de la bota */}
              <mesh position={[0, -0.34, 0]}>
                <cylinderGeometry args={[0.075, 0.075, 0.03, 12]} />
                <meshStandardMaterial color="#ffd54f" />
              </mesh>
            </group>

            {/* Pierna Derecha (Roja / Viewer Izquierdo) */}
            <group ref={rightLegRef} position={[0.14, 0.45, 0]}>
              {/* Pantalón bombacho rojo (puffy shorts) */}
              <mesh castShadow position={[0, 0, 0]}>
                <sphereGeometry args={[0.13, 12, 12]} />
                <meshStandardMaterial color="#f44336" roughness={0.4} />
              </mesh>
              {/* Detalle dorado/amarillo al final del bombacho */}
              <mesh position={[0, -0.08, 0]}>
                <cylinderGeometry args={[0.09, 0.09, 0.03, 12]} />
                <meshStandardMaterial color="#ffd54f" />
              </mesh>
              {/* Pierna delgada blanca */}
              <mesh position={[0, -0.25, 0]} castShadow>
                <cylinderGeometry args={[0.035, 0.035, 0.3, 8]} />
                <meshStandardMaterial color="#ffffff" roughness={0.5} />
              </mesh>
              {/* Zapato/Bota Roja con punta curvada y borde amarillo */}
              <mesh position={[0, -0.4, 0.06]} castShadow>
                <capsuleGeometry args={[0.065, 0.12, 8, 8]} />
                <meshStandardMaterial color="#f44336" roughness={0.5} />
              </mesh>
              {/* Borde amarillo superior de la bota */}
              <mesh position={[0, -0.34, 0]}>
                <cylinderGeometry args={[0.075, 0.075, 0.03, 12]} />
                <meshStandardMaterial color="#ffd54f" />
              </mesh>
            </group>

            {/* Brazos */}
            {/* Brazo Izquierdo / Viewer Izquierdo (Rojo) */}
            <group ref={leftArmRef} position={[-0.28, 0.75, 0]}>
              {/* Hombro abombado bufón (Puff sleeve) */}
              <mesh castShadow>
                <sphereGeometry args={[0.13, 12, 12]} />
                <meshStandardMaterial color="#f44336" roughness={0.4} />
              </mesh>
              {/* Detalle amarillo del hombro */}
              <mesh position={[-0.05, -0.06, 0]} rotation={[0, 0, Math.PI / 6]}>
                <cylinderGeometry args={[0.08, 0.08, 0.03, 12]} />
                <meshStandardMaterial color="#ffd54f" />
              </mesh>
              {/* Brazo blanco */}
              <mesh position={[-0.1, -0.15, 0]} rotation={[0, 0, Math.PI / 6]} castShadow>
                <cylinderGeometry args={[0.035, 0.03, 0.35, 8]} />
                <meshStandardMaterial color="#ffffff" roughness={0.6} />
              </mesh>
              {/* Manga final con puño amarillo */}
              <mesh position={[-0.16, -0.26, 0]} rotation={[0, 0, Math.PI / 6]}>
                <cylinderGeometry args={[0.05, 0.05, 0.08, 8]} />
                <meshStandardMaterial color="#ffd54f" />
              </mesh>
              {/* Mano Guante Rojo */}
              <mesh position={[-0.22, -0.34, 0]} castShadow>
                <sphereGeometry args={[0.075, 12, 12]} />
                <meshStandardMaterial color="#f44336" roughness={0.5} />
              </mesh>
            </group>
            
            {/* Brazo Derecho / Viewer Derecho (Azul) */}
            <group ref={rightArmRef} position={[0.28, 0.75, 0]}>
              {/* Hombro abombado bufón (Puff sleeve) */}
              <mesh castShadow>
                <sphereGeometry args={[0.13, 12, 12]} />
                <meshStandardMaterial color="#2196f3" roughness={0.4} />
              </mesh>
              {/* Detalle amarillo del hombro */}
              <mesh position={[0.05, -0.06, 0]} rotation={[0, 0, -Math.PI / 6]}>
                <cylinderGeometry args={[0.08, 0.08, 0.03, 12]} />
                <meshStandardMaterial color="#ffd54f" />
              </mesh>
              {/* Brazo blanco */}
              <mesh position={[0.1, -0.15, 0]} rotation={[0, 0, -Math.PI / 6]} castShadow>
                <cylinderGeometry args={[0.035, 0.03, 0.35, 8]} />
                <meshStandardMaterial color="#ffffff" roughness={0.6} />
              </mesh>
              {/* Manga final con puño amarillo */}
              <mesh position={[0.16, -0.26, 0]} rotation={[0, 0, -Math.PI / 6]}>
                <cylinderGeometry args={[0.05, 0.05, 0.08, 8]} />
                <meshStandardMaterial color="#ffd54f" />
              </mesh>
              {/* Mano Guante Azul */}
              <mesh position={[0.22, -0.34, 0]} castShadow>
                <sphereGeometry args={[0.075, 12, 12]} />
                <meshStandardMaterial color="#2196f3" roughness={0.5} />
              </mesh>
            </group>

            {/* Cabeza de Pomni */}
            <group ref={headRef} position={[0, 1.15, 0]}>
              {/* Rostro base */}
              <mesh castShadow>
                <sphereGeometry args={[0.32, 24, 24]} />
                <meshStandardMaterial color="#ffffff" roughness={0.8} />
              </mesh>
          
          {/* Cabello Castaño con flequillo bob y mechones */}
          <group>
            <mesh position={[-0.24, 0.08, -0.05]}>
              <sphereGeometry args={[0.16, 12, 12]} />
              <meshStandardMaterial color="#4e342e" roughness={0.9} />
            </mesh>
            <mesh position={[0.24, 0.08, -0.05]}>
              <sphereGeometry args={[0.16, 12, 12]} />
              <meshStandardMaterial color="#4e342e" roughness={0.9} />
            </mesh>
            <mesh position={[0, 0.22, -0.1]}>
              <sphereGeometry args={[0.26, 16, 16]} />
              <meshStandardMaterial color="#4e342e" roughness={0.9} />
            </mesh>
            <mesh position={[0, 0, -0.18]}>
              <boxGeometry args={[0.55, 0.45, 0.2]} />
              <meshStandardMaterial color="#4e342e" roughness={0.9} />
            </mesh>
            {/* Mechones al lado del rostro */}
            <mesh position={[-0.28, -0.15, 0.12]} rotation={[0, 0.2, 0.1]}>
              <coneGeometry args={[0.08, 0.35, 8]} />
              <meshStandardMaterial color="#4e342e" />
            </mesh>
            <mesh position={[0.28, -0.15, 0.12]} rotation={[0, -0.2, -0.1]}>
              <coneGeometry args={[0.08, 0.35, 8]} />
              <meshStandardMaterial color="#4e342e" />
            </mesh>

            {/* Flequillo frontal 3D (Bangs) inspirado en la imagen */}
            <mesh position={[-0.08, 0.15, 0.23]} rotation={[0.2, 0.1, -0.1]}>
              <boxGeometry args={[0.12, 0.12, 0.05]} />
              <meshStandardMaterial color="#4e342e" roughness={0.9} />
            </mesh>
            <mesh position={[0.08, 0.15, 0.23]} rotation={[0.2, -0.1, 0.1]}>
              <boxGeometry args={[0.12, 0.12, 0.05]} />
              <meshStandardMaterial color="#4e342e" roughness={0.9} />
            </mesh>
            <mesh position={[-0.18, 0.08, 0.22]} rotation={[0.1, 0.1, -0.05]}>
              <boxGeometry args={[0.08, 0.15, 0.05]} />
              <meshStandardMaterial color="#4e342e" roughness={0.9} />
            </mesh>
            <mesh position={[0.18, 0.08, 0.22]} rotation={[0.1, -0.1, 0.05]}>
              <boxGeometry args={[0.08, 0.15, 0.05]} />
              <meshStandardMaterial color="#4e342e" roughness={0.9} />
            </mesh>
          </group>

          {/* Rostro Interactivo según EMOCIONES */}
          <group position={[0, 0, 0.25]}>
            {/* Ojos Gigantes Anhelantes (Pinwheels de la imagen con delineado negro) */}
            <group position={[-0.11, 0.02, 0]}>
              {/* Contorno / Delineado negro alrededor del ojo */}
              <mesh position={[0, 0, -0.005]}>
                <circleGeometry args={[0.098, 32]} />
                <meshBasicMaterial color="#000000" />
              </mesh>
              <mesh>
                <sphereGeometry args={[0.09, 16, 16]} />
                <meshBasicMaterial color="#ffffff" />
              </mesh>
              {/* Iris/Windmill Azul y Rojo Pomni (Pinwheel) */}
              <mesh position={[0, 0, 0.065]}>
                <circleGeometry args={[0.05, 16]} />
                <meshBasicMaterial color={pomniEmotion === 'enojo' ? '#d32f2f' : '#0288d1'} />
              </mesh>
              {/* Aspas de la rueda pinwheel cruzadas para formar 8 sectores alternantes */}
              {Array.from({ length: 4 }).map((_, idx) => {
                const angle = (idx * Math.PI) / 4;
                return (
                  <mesh key={`l-spoke-${idx}`} position={[0, 0, 0.066]} rotation={[0, 0, angle]}>
                    <boxGeometry args={[0.1, 0.02, 0.002]} />
                    <meshBasicMaterial color={pomniEmotion === 'enojo' ? '#ffeb3b' : '#d32f2f'} />
                  </mesh>
                );
              })}
              {/* Pupila negra central */}
              <mesh position={[0, 0, 0.068]}>
                <circleGeometry args={[0.015, 12]} />
                <meshBasicMaterial color="#000000" />
              </mesh>
            </group>
            
            <group position={[0.11, 0.02, 0]}>
              {/* Contorno / Delineado negro alrededor del ojo */}
              <mesh position={[0, 0, -0.005]}>
                <circleGeometry args={[0.098, 32]} />
                <meshBasicMaterial color="#000000" />
              </mesh>
              <mesh>
                <sphereGeometry args={[0.09, 16, 16]} />
                <meshBasicMaterial color="#ffffff" />
              </mesh>
              {/* Iris/Windmill */}
              <mesh position={[0, 0, 0.065]}>
                <circleGeometry args={[0.05, 16]} />
                <meshBasicMaterial color={pomniEmotion === 'enojo' ? '#0288d1' : '#d32f2f'} />
              </mesh>
              {/* Aspas de la rueda pinwheel cruzadas para formar 8 sectores alternantes */}
              {Array.from({ length: 4 }).map((_, idx) => {
                const angle = (idx * Math.PI) / 4;
                return (
                  <mesh key={`r-spoke-${idx}`} position={[0, 0, 0.066]} rotation={[0, 0, angle]}>
                    <boxGeometry args={[0.1, 0.02, 0.002]} />
                    <meshBasicMaterial color={pomniEmotion === 'enojo' ? '#ffeb3b' : '#0288d1'} />
                  </mesh>
                );
              })}
              {/* Pupila negra central */}
              <mesh position={[0, 0, 0.068]}>
                <circleGeometry args={[0.015, 12]} />
                <meshBasicMaterial color="#000000" />
              </mesh>
            </group>

            {/* Mejillas Rosadas (Blush) adorables bajo los ojos */}
            <mesh position={[-0.17, -0.1, 0.04]} scale={[1, 0.65, 0.1]}>
              <sphereGeometry args={[0.04, 16, 16]} />
              <meshBasicMaterial color="#e91e63" transparent opacity={0.65} />
            </mesh>
            <mesh position={[0.17, -0.1, 0.04]} scale={[1, 0.65, 0.1]}>
              <sphereGeometry args={[0.04, 16, 16]} />
              <meshBasicMaterial color="#e91e63" transparent opacity={0.65} />
            </mesh>

            {/* Cejas Dinámicas */}
            {pomniEmotion === 'felicidad' && (
              <>
                <mesh position={[-0.12, 0.14, 0.05]} rotation={[0, 0, 0.1]}>
                  <boxGeometry args={[0.09, 0.025, 0.02]} />
                  <meshBasicMaterial color="#4e342e" />
                </mesh>
                <mesh position={[0.12, 0.14, 0.05]} rotation={[0, 0, -0.1]}>
                  <boxGeometry args={[0.09, 0.025, 0.02]} />
                  <meshBasicMaterial color="#4e342e" />
                </mesh>
              </>
            )}
            {pomniEmotion === 'enojo' && (
              <>
                <mesh position={[-0.12, 0.12, 0.05]} rotation={[0, 0, -0.25]}>
                  <boxGeometry args={[0.09, 0.03, 0.02]} />
                  <meshBasicMaterial color="#b71c1c" />
                </mesh>
                <mesh position={[0.12, 0.12, 0.05]} rotation={[0, 0, 0.25]}>
                  <boxGeometry args={[0.09, 0.03, 0.02]} />
                  <meshBasicMaterial color="#b71c1c" />
                </mesh>
              </>
            )}
            {(pomniEmotion === 'tristeza' || pomniEmotion === 'solitaria') && (
              <>
                <mesh position={[-0.12, 0.16, 0.05]} rotation={[0, 0, 0.35]}>
                  <boxGeometry args={[0.09, 0.025, 0.02]} />
                  <meshBasicMaterial color="#4e342e" />
                </mesh>
                <mesh position={[0.12, 0.16, 0.05]} rotation={[0, 0, -0.35]}>
                  <boxGeometry args={[0.09, 0.025, 0.02]} />
                  <meshBasicMaterial color="#4e342e" />
                </mesh>
              </>
            )}

            {/* Boca Dinámica */}
            {pomniEmotion === 'felicidad' && (
              <mesh position={[0, -0.14, 0.02]} rotation={[0, 0, 0]}>
                <torusGeometry args={[0.06, 0.015, 8, 16, Math.PI]} />
                <meshBasicMaterial color="#000000" />
              </mesh>
            )}
            {pomniEmotion === 'enojo' && (
              <mesh position={[0, -0.12, 0.02]} rotation={[Math.PI, 0, 0]}>
                <torusGeometry args={[0.07, 0.015, 8, 16, Math.PI]} />
                <meshBasicMaterial color="#000000" />
              </mesh>
            )}
            {pomniEmotion === 'tristeza' && (
              <group>
                <mesh position={[0, -0.14, 0.02]} rotation={[Math.PI, 0, 0]}>
                  <torusGeometry args={[0.07, 0.015, 8, 16, Math.PI]} />
                  <meshBasicMaterial color="#000000" />
                </mesh>
                {/* Lágrima digital azul flotando */}
                <mesh position={[-0.11, -0.12, 0.04]}>
                  <sphereGeometry args={[0.025, 8, 8]} />
                  <meshBasicMaterial color="#00b0ff" />
                </mesh>
              </group>
            )}
            {pomniEmotion === 'solitaria' && (
              <mesh position={[0, -0.14, 0.02]}>
                <boxGeometry args={[0.12, 0.015, 0.02]} />
                <meshBasicMaterial color="#000000" />
              </mesh>
            )}
          </group>

          {/* Sombrero de Bufón de Dos Puntas */}
          <group position={[0, 0.26, 0]}>
            {/* Base bicolor */}
            <mesh>
              <cylinderGeometry args={[0.31, 0.31, 0.1, 16]} />
              <meshStandardMaterial color="#f44336" roughness={0.4} />
            </mesh>
            <mesh>
              <cylinderGeometry args={[0.32, 0.32, 0.1, 16, 1, false, 0, Math.PI]} />
              <meshStandardMaterial color="#2196f3" roughness={0.4} />
            </mesh>

            {/* Borde Amarillo Brillante de la base del sombrero (Brim de bufón) */}
            <mesh position={[0, -0.05, 0]} rotation={[Math.PI / 2, 0, 0]}>
              <torusGeometry args={[0.315, 0.025, 8, 32]} />
              <meshStandardMaterial color="#ffd54f" roughness={0.3} />
            </mesh>
            
            {/* Punta Izquierda Caída (Roja) */}
            <group ref={hatLeftRef} position={[-0.22, 0.04, 0]} rotation={[0, 0, 0.5]}>
              <mesh position={[-0.18, -0.08, 0]} rotation={[0, 0, -Math.PI / 6]} castShadow>
                <coneGeometry args={[0.1, 0.45, 16]} />
                <meshStandardMaterial color="#f44336" roughness={0.4} />
              </mesh>
              {/* Cascabel Amarillo Brillante */}
              <mesh position={[-0.28, -0.26, 0]} castShadow>
                <sphereGeometry args={[0.065, 12, 12]} />
                <meshStandardMaterial color="#ffeb3b" roughness={0.1} metalness={0.9} />
              </mesh>
            </group>

            {/* Punta Derecha Caída (Azul) */}
            <group ref={hatRightRef} position={[0.22, 0.04, 0]} rotation={[0, 0, -0.5]}>
              <mesh position={[0.18, -0.08, 0]} rotation={[0, 0, Math.PI / 6]} castShadow>
                <coneGeometry args={[0.1, 0.45, 16]} />
                <meshStandardMaterial color="#2196f3" roughness={0.4} />
              </mesh>
              {/* Cascabel Amarillo Brillante */}
              <mesh position={[0.28, -0.26, 0]} castShadow>
                <sphereGeometry args={[0.065, 12, 12]} />
                <meshStandardMaterial color="#ffeb3b" roughness={0.1} metalness={0.9} />
              </mesh>
            </group>
          </group>
        </group>
      </>
      )}
    </group>
  </group>
  );
}
