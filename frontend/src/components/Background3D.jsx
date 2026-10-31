import { Component, useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { PALETTE } from '../config/palette';
import { isWebGLAvailable } from '../utils/webgl';

/**
 * Lightweight CSS-only animated background fallback.
 * Keeps the dark #070707 background with a soft green radial glow from the top-right.
 * Adds a very light CSS animated gradient so the canvas feels alive without WebGL.
 */
export const CSSBackgroundFallback = () => (
  <div
    aria-hidden="true"
    className="fixed inset-0 pointer-events-none -z-10 overflow-hidden"
    style={{
      background:
        'radial-gradient(ellipse 80% 60% at 90% 10%, rgba(51, 188, 101, 0.22) 0%, rgba(18, 220, 239, 0.05) 45%, transparent 72%)',
    }}
  >
    <div
      className="absolute inset-0 opacity-40 pointer-events-none css-fallback-pulse"
      style={{
        background:
          'radial-gradient(circle at 86% 14%, rgba(93, 255, 217, 0.14) 0%, rgba(51, 188, 101, 0.04) 40%, transparent 65%)',
        animation: 'bgPulse 9s ease-in-out infinite alternate',
      }}
    />
  </div>
);

/**
 * Dedicated Error Boundary for the Background layer.
 * Catches any render or lifecycle error from Three.js and gracefully falls back
 * to CSSBackgroundFallback so errors NEVER reach the app-level ErrorBoundary.
 */
export class BackgroundErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    console.warn(
      'Three.js Background caught error in local boundary, falling back to CSS background:',
      error,
      errorInfo
    );
  }

  render() {
    if (this.state.hasError) {
      return <CSSBackgroundFallback />;
    }
    return this.props.children;
  }
}

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
 * Background3DScene:
 * Managed Three.js scene with strict context leak prevention:
 * - Creates canvas dynamically inside container (single canvas guarantee, StrictMode safe)
 * - Lower-risk renderer config (antialias: false, high-performance, alpha: true)
 * - webglcontextlost / webglcontextrestored event handling
 * - Clean teardown on unmount (geometries, materials, textures, listeners, DOM canvas removal)
 */
const Background3DScene = () => {
  const containerRef = useRef(null);
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    // StrictMode / Double-mount hygiene: purge any lingering canvas in container
    while (container.firstChild) {
      container.removeChild(container.firstChild);
    }

    // Create exactly one canvas dynamically
    const canvas = document.createElement('canvas');
    canvas.style.position = 'fixed';
    canvas.style.inset = '0';
    canvas.style.width = '100vw';
    canvas.style.height = '100vh';
    canvas.style.pointerEvents = 'none';
    canvas.style.zIndex = '-1';
    canvas.setAttribute('data-bg-3d', 'true');
    container.appendChild(canvas);

    // 2. Lower-risk renderer configuration wrapped in try/catch
    let renderer = null;
    try {
      renderer = new THREE.WebGLRenderer({
        canvas,
        alpha: true,
        antialias: false,
        powerPreference: 'high-performance',
      });
      renderer.setClearColor(0x000000, 0); // Completely transparent
      renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
      renderer.setSize(window.innerWidth, window.innerHeight);
    } catch (err) {
      console.warn('THREE.WebGLRenderer creation failed gracefully:', err);
      if (canvas.parentNode) canvas.parentNode.removeChild(canvas);
      queueMicrotask(() => {
        setHasError(true);
      });
      return;
    }

    let animId = null;
    let isPaused = false;
    let isContextLost = false;
    let lastTime = performance.now();

    const isMobile = window.innerWidth < 768;
    const motionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    let prefersReducedMotion = motionQuery.matches;

    // 3. Scene with Fog #070707
    const scene = new THREE.Scene();
    scene.fog = new THREE.Fog(PALETTE.bg, 10, 32);

    // 4. Camera & Camera Group (for parallax)
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

    // 5. Particle Texture & Particle Field
    const particleTexture = createParticleTexture();
    const particleCount = isMobile ? 850 : 2200;
    const positions = new Float32Array(particleCount * 3);
    const colors = new Float32Array(particleCount * 3);

    const colorPrimary = new THREE.Color(PALETTE.primary);
    const colorAccent = new THREE.Color(PALETTE.accent);
    const colorGlow = new THREE.Color(PALETTE.glow);

    for (let i = 0; i < particleCount; i++) {
      const i3 = i * 3;
      positions[i3] = (Math.random() - 0.5) * 28;
      positions[i3 + 1] = (Math.random() - 0.5) * 20;
      positions[i3 + 2] = (Math.random() - 0.5) * 16;

      const roll = Math.random();
      let chosenColor;
      if (roll < 0.72) {
        chosenColor = colorPrimary;
      } else if (roll < 0.90) {
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
      size: isMobile ? 0.28 : 0.36,
      map: particleTexture || undefined,
      transparent: true,
      vertexColors: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      opacity: 0.42,
    });

    const particlePoints = new THREE.Points(particleGeometry, particleMaterial);
    scene.add(particlePoints);

    // 6. Focal Wireframe Element (Top-Right green glow region)
    const focalGroup = new THREE.Group();
    focalGroup.position.set(4.2, 2.4, -3.0);
    scene.add(focalGroup);

    const icoGeometry = new THREE.IcosahedronGeometry(2.1, 1);
    const icoMaterial = new THREE.MeshBasicMaterial({
      color: new THREE.Color(PALETTE.glow),
      wireframe: true,
      transparent: true,
      opacity: 0.32,
    });
    const icosahedron = new THREE.Mesh(icoGeometry, icoMaterial);
    focalGroup.add(icosahedron);

    const glowGeometry = new THREE.IcosahedronGeometry(2.35, 1);
    const glowMaterial = new THREE.MeshBasicMaterial({
      color: new THREE.Color(PALETTE.accent),
      wireframe: true,
      transparent: true,
      opacity: 0.12,
    });
    const glowShell = new THREE.Mesh(glowGeometry, glowMaterial);
    focalGroup.add(glowShell);

    // 7. Parallax & Mouse tracking
    const mouse = { x: 0, y: 0, targetX: 0, targetY: 0 };
    const handlePointerMove = (e) => {
      const nx = (e.clientX / window.innerWidth) * 2 - 1;
      const ny = -(e.clientY / window.innerHeight) * 2 + 1;
      mouse.targetX = nx * 0.7;
      mouse.targetY = ny * 0.5;
    };
    window.addEventListener('pointermove', handlePointerMove, { passive: true });

    // 8. Scroll tracking
    let scrollY = window.scrollY || 0;
    const handleScroll = () => {
      scrollY = window.scrollY || 0;
    };
    window.addEventListener('scroll', handleScroll, { passive: true });

    // 9. Resize listener
    const handleResize = () => {
      if (!renderer || isContextLost) return;
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
      renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    };
    window.addEventListener('resize', handleResize, { passive: true });

    // 10. Tab visibility listener
    const handleVisibility = () => {
      isPaused = document.hidden;
      if (!isPaused && !prefersReducedMotion && !isContextLost) {
        lastTime = performance.now();
        if (!animId) animId = requestAnimationFrame(animate);
      }
    };
    document.addEventListener('visibilitychange', handleVisibility);

    // 11. Motion change listener
    const handleMotionChange = (e) => {
      prefersReducedMotion = e.matches;
      if (prefersReducedMotion) {
        if (animId) {
          cancelAnimationFrame(animId);
          animId = null;
        }
        if (!isContextLost) renderer.render(scene, camera);
      } else if (!isPaused && !isContextLost) {
        lastTime = performance.now();
        animId = requestAnimationFrame(animate);
      }
    };
    motionQuery.addEventListener('change', handleMotionChange);

    // 12. WebGL Context Loss & Restoration handlers
    const handleContextLost = (e) => {
      e.preventDefault();
      isContextLost = true;
      if (animId) {
        cancelAnimationFrame(animId);
        animId = null;
      }
      console.warn('WebGL context lost. Render loop halted.');
    };

    const handleContextRestored = () => {
      isContextLost = false;
      console.info('WebGL context restored.');
      if (!prefersReducedMotion && !isPaused) {
        lastTime = performance.now();
        animId = requestAnimationFrame(animate);
      } else {
        renderer.render(scene, camera);
      }
    };

    canvas.addEventListener('webglcontextlost', handleContextLost, false);
    canvas.addEventListener('webglcontextrestored', handleContextRestored, false);

    // 13. Animation loop
    const animate = (currentTime) => {
      if (isPaused || isContextLost || prefersReducedMotion) return;

      const delta = Math.min((currentTime - lastTime) / 1000, 0.1);
      lastTime = currentTime;

      // Mouse parallax easing
      mouse.x += (mouse.targetX * 0.45 - mouse.x) * 0.04;
      mouse.y += (mouse.targetY * 0.35 - mouse.y) * 0.04;

      const scrollOffset = -scrollY * 0.0008;
      cameraGroup.position.x = mouse.x;
      cameraGroup.position.y = mouse.y + scrollOffset;

      // Particle slow drift
      particlePoints.rotation.y += delta * 0.025;
      particlePoints.rotation.x += delta * 0.012;

      // Focal wireframe rotation
      if (!isMobile) {
        focalGroup.rotation.x += delta * 0.08;
        focalGroup.rotation.y += delta * 0.12;
      } else {
        focalGroup.rotation.y += delta * 0.03;
      }

      renderer.render(scene, camera);
      animId = requestAnimationFrame(animate);
    };

    if (prefersReducedMotion) {
      renderer.render(scene, camera);
    } else {
      animId = requestAnimationFrame(animate);
    }

    // 14. Comprehensive cleanup on unmount
    return () => {
      if (animId) cancelAnimationFrame(animId);

      canvas.removeEventListener('webglcontextlost', handleContextLost);
      canvas.removeEventListener('webglcontextrestored', handleContextRestored);
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

      if (renderer) {
        renderer.dispose();
        if (renderer.forceContextLoss) {
          renderer.forceContextLoss();
        }
      }

      if (canvas.parentNode) {
        canvas.parentNode.removeChild(canvas);
      }
    };
  }, []);

  if (hasError) {
    return <CSSBackgroundFallback />;
  }

  return (
    <div
      ref={containerRef}
      aria-hidden="true"
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: -1,
        pointerEvents: 'none',
        overflow: 'hidden',
      }}
    />
  );
};

export const Background3D = () => {
  const isAvailable = isWebGLAvailable();
  if (!isAvailable) {
    return <CSSBackgroundFallback />;
  }

  return (
    <BackgroundErrorBoundary>
      <Background3DScene />
    </BackgroundErrorBoundary>
  );
};

export default Background3D;
