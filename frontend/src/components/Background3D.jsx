import { useState, useEffect, useRef, Suspense } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import * as THREE from 'three';

// Check WebGL availability
function checkWebGLSupport() {
  if (typeof window === 'undefined') return false;
  try {
    const canvas = document.createElement('canvas');
    return Boolean(
      window.WebGLRenderingContext &&
      (canvas.getContext('webgl') || canvas.getContext('experimental-webgl'))
    );
  } catch {
    return false;
  }
}

// Deterministic PRNG to generate starfield positions purely without Math.random during render
function generateParticlePositions(count, seed = 12345) {
  const pos = new Float32Array(count * 3);
  let s = seed;
  const nextFloat = () => {
    s = (1103515245 * s + 12345) & 0x7fffffff;
    return s / 0x7fffffff;
  };
  for (let i = 0; i < count; i++) {
    const i3 = i * 3;
    pos[i3] = (nextFloat() - 0.5) * 35;
    pos[i3 + 1] = (nextFloat() - 0.5) * 35;
    pos[i3 + 2] = (nextFloat() - 0.5) * 25;
  }
  return pos;
}

const DESKTOP_PARTICLES = generateParticlePositions(1000, 42);
const MOBILE_PARTICLES = generateParticlePositions(350, 99);

// Particle field (Starfield layer)
function ParticleField({ count = 1000, opacity = 0.35, speed = 0.05, isMobile = false }) {
  const pointsRef = useRef();
  const positions = isMobile ? MOBILE_PARTICLES : DESKTOP_PARTICLES;

  useFrame((state, delta) => {
    if (!pointsRef.current) return;
    pointsRef.current.rotation.y += delta * speed * 0.2;
    pointsRef.current.rotation.x += delta * speed * 0.1;
  });

  return (
    <points ref={pointsRef}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          count={count}
          array={positions}
          itemSize={3}
        />
      </bufferGeometry>
      <pointsMaterial
        size={0.06}
        color="#F5F3FF"
        transparent
        opacity={opacity}
        depthWrite={false}
        blending={THREE.AdditiveBlending}
      />
    </points>
  );
}

// Floating 3D Geometries
function FloatingShapes({ isLanding, isMobile }) {
  const groupRef = useRef();
  const shape1Ref = useRef();
  const shape2Ref = useRef();
  const shape3Ref = useRef();
  const turboRef = useRef();

  const scrollYRef = useRef(0);
  const mouseRef = useRef({ x: 0, y: 0, targetX: 0, targetY: 0 });

  useEffect(() => {
    const handleScroll = () => {
      scrollYRef.current = window.scrollY;
    };
    const handleMouseMove = (e) => {
      mouseRef.current.targetX = (e.clientX / window.innerWidth) * 2 - 1;
      mouseRef.current.targetY = -(e.clientY / window.innerHeight) * 2 + 1;
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    window.addEventListener('mousemove', handleMouseMove, { passive: true });
    return () => {
      window.removeEventListener('scroll', handleScroll);
      window.removeEventListener('mousemove', handleMouseMove);
    };
  }, []);

  const motionSpeed = isLanding ? 1.0 : 0.35;
  const violetOpacity = isLanding ? 0.45 : 0.18;
  const turboOpacity = isLanding ? 0.70 : 0.30;

  useFrame((state, delta) => {
    // Smooth mouse parallax
    mouseRef.current.x += (mouseRef.current.targetX - mouseRef.current.x) * 0.04;
    mouseRef.current.y += (mouseRef.current.targetY - mouseRef.current.y) * 0.04;

    // Camera drift with mouse and scroll
    const targetCamX = mouseRef.current.x * 0.8;
    const targetCamY = mouseRef.current.y * 0.6 - (scrollYRef.current * 0.0012);
    state.camera.position.x += (targetCamX - state.camera.position.x) * 0.05;
    state.camera.position.y += (targetCamY - state.camera.position.y) * 0.05;
    state.camera.lookAt(0, 0, 0);

    // Shape 1: Icosahedron
    if (shape1Ref.current) {
      shape1Ref.current.rotation.x += delta * 0.15 * motionSpeed;
      shape1Ref.current.rotation.y += delta * 0.22 * motionSpeed;
      shape1Ref.current.position.y = 2.2 + Math.sin(state.clock.elapsedTime * 0.4 * motionSpeed) * 0.35;
    }

    // Shape 2: Torus Knot
    if (shape2Ref.current) {
      shape2Ref.current.rotation.x += delta * 0.12 * motionSpeed;
      shape2Ref.current.rotation.z += delta * 0.18 * motionSpeed;
      shape2Ref.current.position.y = -2.0 + Math.cos(state.clock.elapsedTime * 0.35 * motionSpeed) * 0.3;
    }

    // Shape 3: Octahedron
    if (shape3Ref.current) {
      shape3Ref.current.rotation.y += delta * 0.2 * motionSpeed;
      shape3Ref.current.rotation.z += delta * 0.15 * motionSpeed;
      shape3Ref.current.position.y = 0.5 + Math.sin(state.clock.elapsedTime * 0.5 * motionSpeed + 1) * 0.25;
    }

    // Small Turbo accent shape
    if (turboRef.current) {
      turboRef.current.rotation.x += delta * 0.3 * motionSpeed;
      turboRef.current.rotation.y += delta * 0.35 * motionSpeed;
      turboRef.current.position.x = 2.8 + Math.cos(state.clock.elapsedTime * 0.4 * motionSpeed) * 0.2;
      turboRef.current.position.y = -0.6 + Math.sin(state.clock.elapsedTime * 0.45 * motionSpeed) * 0.25;
    }
  });

  return (
    <group ref={groupRef}>
      {/* 1. Large Icosahedron (Electric Violet Wireframe) */}
      <mesh ref={shape1Ref} position={[-3.2, 2.2, -4]}>
        <icosahedronGeometry args={[1.8, 1]} />
        <meshStandardMaterial
          color="#834DFB"
          wireframe
          transparent
          opacity={violetOpacity}
          roughness={0.2}
          metalness={0.8}
        />
      </mesh>

      {/* 2. Torus Knot (Electric Violet Wireframe) */}
      <mesh ref={shape2Ref} position={[3.6, -2.0, -3.5]}>
        <torusKnotGeometry args={[1.2, 0.35, 64, 16]} />
        <meshStandardMaterial
          color="#834DFB"
          wireframe
          transparent
          opacity={violetOpacity * 0.9}
          roughness={0.3}
          metalness={0.7}
        />
      </mesh>

      {/* 3. Octahedron (Electric Violet Wireframe) - desktop only if small screen */}
      {!isMobile && (
        <mesh ref={shape3Ref} position={[-2.5, -1.8, -2]}>
          <octahedronGeometry args={[1.1, 0]} />
          <meshStandardMaterial
            color="#A98BFF"
            wireframe
            transparent
            opacity={violetOpacity * 0.8}
            roughness={0.2}
            metalness={0.9}
          />
        </mesh>
      )}

      {/* 4. Small Turbo Accent Shape */}
      <mesh ref={turboRef} position={[2.8, -0.6, -1.5]}>
        <octahedronGeometry args={[0.42, 0]} />
        <meshStandardMaterial
          color="#F0E100"
          wireframe
          transparent
          opacity={turboOpacity}
          emissive="#F0E100"
          emissiveIntensity={isLanding ? 0.4 : 0.2}
          roughness={0.1}
          metalness={0.9}
        />
      </mesh>
    </group>
  );
}

// Internal WebGL Scene wrapper
function SceneContainer({ isLanding, isMobile, isTabHidden }) {
  const particleCount = isMobile ? 350 : isLanding ? 1000 : 400;
  const particleOpacity = isLanding ? 0.35 : 0.12;

  return (
    <Canvas
      frameloop={isTabHidden ? 'never' : 'always'}
      dpr={Math.min(window.devicePixelRatio || 1, 1.5)}
      camera={{ position: [0, 0, 8], fov: 50, near: 0.1, far: 50 }}
      gl={{ alpha: true, antialias: true, powerPreference: 'high-performance' }}
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        pointerEvents: 'none',
        zIndex: 0,
      }}
    >
      {/* Background fog in Haiti */}
      <fog attach="fog" args={['#18102B', 6, 26]} />

      {/* Lighting */}
      <ambientLight color="#2A1B52" intensity={isLanding ? 0.7 : 0.3} />
      <pointLight
        position={[4, 5, 4]}
        color="#834DFB"
        intensity={isLanding ? 2.2 : 0.8}
        distance={25}
      />
      <pointLight
        position={[-5, -4, -2]}
        color="#F0E100"
        intensity={isLanding ? 0.45 : 0.15}
        distance={20}
      />
      <directionalLight
        position={[0, 8, 5]}
        color="#F5F3FF"
        intensity={isLanding ? 0.3 : 0.1}
      />

      {/* Shapes and Starfield */}
      <FloatingShapes isLanding={isLanding} isMobile={isMobile} />
      <ParticleField
        count={particleCount}
        opacity={particleOpacity}
        speed={isLanding ? 0.05 : 0.02}
        isMobile={isMobile}
      />
    </Canvas>
  );
}

// Static Fallback for reduced-motion or non-WebGL environments
export const StaticGradientBackground = () => (
  <div
    aria-hidden="true"
    className="fixed inset-0 pointer-events-none"
    style={{
      zIndex: 0,
      background: 'radial-gradient(circle at 50% 35%, rgba(131, 77, 251, 0.12) 0%, rgba(24, 16, 43, 0.95) 70%, #18102B 100%)',
    }}
  />
);

export const Background3D = () => {
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(() =>
    typeof window !== 'undefined'
      ? window.matchMedia('(prefers-reduced-motion: reduce)').matches
      : false
  );
  const [webglSupported] = useState(() => checkWebGLSupport());
  const [isTabHidden, setIsTabHidden] = useState(() =>
    typeof document !== 'undefined' ? document.hidden : false
  );
  const [isMobile, setIsMobile] = useState(() =>
    typeof window !== 'undefined' ? window.innerWidth < 768 : false
  );
  const [pathname, setPathname] = useState(() =>
    typeof window !== 'undefined' ? window.location.pathname : '/'
  );

  useEffect(() => {
    // 1. Accessibility: reduced motion query listener
    const motionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    const onMotionChange = (e) => setPrefersReducedMotion(e.matches);
    motionQuery.addEventListener('change', onMotionChange);

    // 2. Viewport width listener
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', checkMobile);

    // 3. Tab visibility listener
    const onVisibility = () => setIsTabHidden(document.hidden);
    document.addEventListener('visibilitychange', onVisibility);

    // 4. Track route pathname for Landing vs App page intensity
    const updatePath = () => setPathname(window.location.pathname);
    window.addEventListener('popstate', updatePath);
    const interval = setInterval(updatePath, 300);

    return () => {
      motionQuery.removeEventListener('change', onMotionChange);
      window.removeEventListener('resize', checkMobile);
      document.removeEventListener('visibilitychange', onVisibility);
      window.removeEventListener('popstate', updatePath);
      clearInterval(interval);
    };
  }, []);

  if (prefersReducedMotion || !webglSupported) {
    return <StaticGradientBackground />;
  }

  const isLanding =
    pathname === '/' ||
    pathname === '/welcome' ||
    pathname === '/about' ||
    pathname === '/features' ||
    pathname === '/how-it-works' ||
    pathname === '/why-friday' ||
    pathname === '/faq';

  return (
    <Suspense fallback={<StaticGradientBackground />}>
      <SceneContainer isLanding={isLanding} isMobile={isMobile} isTabHidden={isTabHidden} />
    </Suspense>
  );
};

export default Background3D;
