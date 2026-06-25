import * as THREE from 'three';

// Genera una textura de tablero de ajedrez optimizada
export function createCheckerboardTexture(color1: string, color2: string, size: number = 512, divisions: number = 8) {
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d');
  
  if (ctx) {
    const step = size / divisions;
    for (let y = 0; y < divisions; y++) {
      for (let x = 0; x < divisions; x++) {
        ctx.fillStyle = (x + y) % 2 === 0 ? color1 : color2;
        ctx.fillRect(x * step, y * step, step, step);
      }
    }
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.magFilter = THREE.NearestFilter; // Aspecto retro/nítido
  return texture;
}

// Genera franjas verticales para la carpa del circo
export function createStripesTexture(color1: string, color2: string, size: number = 512, stripes: number = 16) {
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d');
  
  if (ctx) {
    const step = size / stripes;
    for (let x = 0; x < stripes; x++) {
      ctx.fillStyle = x % 2 === 0 ? color1 : color2;
      ctx.fillRect(x * step, 0, step, size);
    }
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  return texture;
}
