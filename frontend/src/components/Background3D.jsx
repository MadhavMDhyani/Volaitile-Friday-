import { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { PALETTE } from '../config/palette';

/**
 * Creates a circular soft radial gradient sprite for particle rendering.
 * Avoids square pixel artifacts with zero external asset dependencies.
 */
function createParticleTexture() {
  const canvas = document.createElement('canvas');
  canvas.width = 64;
  canvas.height = 64;
  const ctx = canvas.getContext('2d');
  if (!ctx) return null;

  const gradient = ctx.createRadialGradient(32, 32, 0, 32, 32, 32);
  gradient.addColorStop(0, 'rgba(255, 255, 255, 1)');
  gradient.addColorStop(0.2, 'rgba(255, 255, 255, 0.8)');
  gradient.addColorStop(0.5, 'rgba(255, 255, 255, 0.25)');
  gradient.addColorStop(0.85, 'rgba(255, 255, 255, 0.05)');
  gradient.addColorStop(1, 'rgba(255, 255, 255, 0)');

  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, 64, 64);

  const texture = new THREE.CanvasTexture(canvas);
  texture.needsUpdate = true;
  return texture;
}

/**
 * Background3D:
 * Fixed full-viewport Three.js scene blending into the palette.
 * - Transparent renderer (alpha: true, no scene background colour)
 * - Fog colour #070707 (PALETTE.bg)
 * - Particle field with additive blending in a mix of #33BC65, #12DCEF, #5DFFD9
 * - Slowly rotating wireframe icosahedron in #5DFFD9 with faint #12DCEF glow top-right
 * - Mouse parallax & optional scroll drift
 * - Reduced motion support (single static frame)
 * - Mobile optimization (<768px: -60% particle count, minimal rotation)
 * - Tab hidden pause via visibilitychange
 * - Memory leak free disposal
 */
export const Background3D = () => {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    // 1. Renderer — transparent background, capped dpr at 2
    let renderer;
    try {
      renderer = new THREE.WebGLRenderer({
        canvas,
        alpha: true,
        antialias: true,
        powerPreference: 'low-power',
      });
    } catch (e) {
      console.warn('Three.js WebGLRenderer initialization skipped or unavailable:', e);
      return;
    }

    if (!renderer) return;

    let animId = null;
    let isPaused = false;
    let lastTime = performance.now();

    const isMobile = window.innerWidth < 768;
    const motionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    let prefersReducedMotion = motionQuery.matches;

    renderer.setClearColor(0x000000, 0); // Completely transparent
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.setSize(window.innerWidth, window.innerHeight);

    // 2. Scene with Fog #070707
    const scene = new THREE.Scene();
    scene.fog = new THREE.Fog(PALETTE.bg, 10, 32);

    // 3. Camera & Camera Group (for parallax)
    const cameraGroup = new THREE.Group();
    scene.add(cameraGroup);

    const camera = new THREE.PerspectiveCamera(
      52,
      window.innerWidth / window.innerHeight,
      0.1,
      50
    );
    camera.position.set(0, 0, 11);
    cameraGroup.add(camera);

    // 4. Particle Texture
    const particleTexture = createParticleTexture();

    // 5. Particle Field
    // Cut particle count by ~60% on small screens (<768px)
    const particleCount = isMobile ? 850 : 2200;
    const positions = new Float32Array(particleCount * 3);
    const colors = new Float32Array(particleCount * 3);

    const colorPrimary = new THREE.Color(PALETTE.primary);
    const colorAccent = new THREE.Color(PALETTE.accent);
    const colorGlow = new THREE.Color(PALETTE.glow);

    for (let i = 0; i < particleCount; i++) {
      const i3 = i * 3;

      // Distribute particles across a wide 3D volume
      positions[i3] = (Math.random() - 0.5) * 36;
      positions[i3 + 1] = (Math.random() - 0.5) * 30;
      positions[i3 + 2] = (Math.random() - 0.5) * 24 - 2;

      // Mix of colors: ~72% primary green, ~18% accent cyan, ~10% glow mint
      const rand = Math.random();
      let chosenColor;
      if (rand < 0.72) {
        chosenColor = colorPrimary;
      } else if (rand < 0.90) {
        chosenColor = colorAccent;
      } else {
        chosenColor = colorGlow;
      }

      colors[i3] = chosenColor.r;
      colors[i3 + 1] = chosenColor.g;
      colors[i3 + 2] = chosenColor.b;
    }

    const particleGeometry = new THREE.BufferGeometry();
    particleGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    particleGeometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));

    const particleMaterial = new THREE.PointsMaterial({
      size: isMobile ? 0.16 : 0.20,
      map: particleTexture,
      transparent: true,
      opacity: 0.42,
      vertexColors: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });

    const particlePoints = new THREE.Points(particleGeometry, particleMaterial);
    scene.add(particlePoints);

    // 6. Focal Element: Wireframe icosahedron in #5DFFD9 + faint #12DCEF glow shell
    // Positioned toward top-right where the CSS radial glow is brightest
    const focalGroup = new THREE.Group();
    const aspect = window.innerWidth / Math.max(window.innerHeight, 1);
    const focalX = Math.min(Math.max(aspect * 2.6, 2.0), 4.2);
    const focalY = 2.4;
    const focalZ = -3.0;
    focalGroup.position.set(focalX, focalY, focalZ);

    // Core icosahedron
    const icoGeometry = new THREE.IcosahedronGeometry(1.9, 1);
    const icoMaterial = new THREE.MeshBasicMaterial({
      color: colorGlow,
      wireframe: true,
      transparent: true,
      opacity: 0.20,
      depthWrite: false,
    });
    const icoMesh = new THREE.Mesh(icoGeometry, icoMaterial);
    focalGroup.add(icoMesh);

    // Outer faint glow shell in #12DCEF
    const glowGeometry = new THREE.IcosahedronGeometry(2.05, 1);
    const glowMaterial = new THREE.MeshBasicMaterial({
      color: colorAccent,
      wireframe: true,
      transparent: true,
      opacity: 0.08,
      depthWrite: false,
    });
    const glowMesh = new THREE.Mesh(glowGeometry, glowMaterial);
    focalGroup.add(glowMesh);

    scene.add(focalGroup);

    // 7. Mouse Parallax & Scroll Drift
    const mouse = { x: 0, y: 0, targetX: 0, targetY: 0 };
    let scrollY = window.scrollY;

    const handlePointerMove = (e) => {
      mouse.targetX = (e.clientX / window.innerWidth) * 2 - 1;
      mouse.targetY = -(e.clientY / window.innerHeight) * 2 + 1;
    };

    const handleScroll = () => {
      scrollY = window.scrollY;
    };

    window.addEventListener('pointermove', handlePointerMove, { passive: true });
    window.addEventListener('scroll', handleScroll, { passive: true });

    // 8. Resize Handler
    const handleResize = () => {
      const width = window.innerWidth;
      const height = window.innerHeight;
      camera.aspect = width / Math.max(height, 1);
      camera.updateProjectionMatrix();
      renderer.setSize(width, height);
      renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));

      // Re-align focal group to top right based on aspect ratio
      const newAspect = width / Math.max(height, 1);
      focalGroup.position.x = Math.min(Math.max(newAspect * 2.6, 1.8), 4.2);

      if (prefersReducedMotion) {
        renderer.render(scene, camera);
      }
    };
    window.addEventListener('resize', handleResize, { passive: true });

    // 9. Tab Visibility (pause when tab hidden)
    const handleVisibility = () => {
      if (document.hidden) {
        isPaused = true;
        if (animId) cancelAnimationFrame(animId);
      } else {
        isPaused = false;
        lastTime = performance.now();
        if (!prefersReducedMotion) {
          animId = requestAnimationFrame(animate);
        }
      }
    };
    document.addEventListener('visibilitychange', handleVisibility);

    // 10. Prefers Reduced Motion listener
    const handleMotionChange = (e) => {
      prefersReducedMotion = e.matches;
      if (prefersReducedMotion) {
        if (animId) cancelAnimationFrame(animId);
        renderer.render(scene, camera);
      } else if (!document.hidden) {
        lastTime = performance.now();
        animId = requestAnimationFrame(animate);
      }
    };
    motionQuery.addEventListener('change', handleMotionChange);

    // 11. Animation Loop
    const animate = (currentTime) => {
      if (isPaused) return;

      const delta = Math.min((currentTime - lastTime) / 1000, 0.1);
      lastTime = currentTime;

      // Subtle mouse parallax easing
      mouse.x += (mouse.targetX * 0.45 - mouse.x) * 0.04;
      mouse.y += (mouse.targetY * 0.35 - mouse.y) * 0.04;

      const scrollOffset = -scrollY * 0.0008;
      cameraGroup.position.x = mouse.x;
      cameraGroup.position.y = mouse.y + scrollOffset;

      // Particle slow drift
      particlePoints.rotation.y += delta * 0.025;
      particlePoints.rotation.x += delta * 0.012;

      // Focal wireframe rotation: smooth on desktop, minimal/light on mobile
      if (!isMobile) {
        focalGroup.rotation.x += delta * 0.08;
        focalGroup.rotation.y += delta * 0.12;
      } else {
        focalGroup.rotation.y += delta * 0.03;
      }

      renderer.render(scene, camera);
      animId = requestAnimationFrame(animate);
    };

    // If reduced motion, render single static frame and exit; otherwise start loop
    if (prefersReducedMotion) {
      renderer.render(scene, camera);
    } else {
      animId = requestAnimationFrame(animate);
    }

    // 12. Cleanup on unmount — dispose geometries, materials, renderer & listeners
    return () => {
      if (animId) cancelAnimationFrame(animId);

      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('scroll', handleScroll);
      window.removeEventListener('resize', handleResize);
      document.removeEventListener('visibilitychange', handleVisibility);
      motionQuery.removeEventListener('change', handleMotionChange);

      particleGeometry.dispose();
      particleMaterial.dispose();
      if (particleTexture) particleTexture.dispose();

      icoGeometry.dispose();
      icoMaterial.dispose();
      glowGeometry.dispose();
      glowMaterial.dispose();

      renderer.dispose();
      if (renderer.forceContextLoss) {
        renderer.forceContextLoss();
      }
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: -1,
        pointerEvents: 'none',
        width: '100vw',
        height: '100vh',
      }}
    />
  );
};

export default Background3D;
