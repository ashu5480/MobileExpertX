'use client';

import { Canvas, useFrame } from '@react-three/fiber';
import { Float, RoundedBox } from '@react-three/drei';
import { useMemo, useRef } from 'react';
import * as THREE from 'three';
import { usePrefersReducedMotion } from '@/components/providers/MotionProvider';

/**
 * ────────────────────────────────────────────────────────────────────────────
 *  HeroPhoneScene
 * ────────────────────────────────────────────────────────────────────────────
 *  The real WebGL hero — the one place Three.js genuinely earns its weight.
 *
 *  Performance decisions:
 *  • The whole `<Canvas>` sits behind a `next/dynamic` import with
 *    `ssr: false`, so Three.js never enters any other page's bundle.
 *  • `dpr` is capped; `antialias` is off (the glow hides the aliasing and it
 *    is a large fill-rate saving on mobile).
 *  • Geometry and material data are memoised; nothing allocates per frame.
 *  • The particle field is a single `BufferGeometry` drawn as one `Points`.
 *  • A reduced-motion visitor renders a single frame and then stops entirely.
 */

interface PhoneSceneProps {
  color?: string;
  accent?: string;
}

/** Slowly rotating phone with a glass back and a gently pulsing screen. */
function PhoneMesh({ color = '#1B2233', accent = '#10B981' }: PhoneSceneProps) {
  const group = useRef<THREE.Group>(null);
  const screen = useRef<THREE.Mesh>(null);
  const reduced = usePrefersReducedMotion();

  useFrame((state) => {
    if (reduced || !group.current) return;
    const t = state.clock.elapsedTime;
    // Gentle, non-linear drift so it never reads as a turntable demo.
    group.current.rotation.y = Math.sin(t * 0.35) * 0.42 + 0.28;
    group.current.rotation.x = Math.cos(t * 0.28) * 0.1 - 0.06;
    group.current.position.y = Math.sin(t * 0.7) * 0.07;
    if (screen.current) {
      const mat = screen.current.material as THREE.MeshBasicMaterial;
      mat.opacity = 0.82 + Math.sin(t * 1.6) * 0.08;
    }
  });

  return (
    <group ref={group} rotation={[0, 0.3, 0]}>
      <RoundedBox args={[2.1, 4.2, 0.24]} radius={0.3} smoothness={6}>
        <meshPhysicalMaterial
          color={color}
          metalness={0.85}
          roughness={0.22}
          clearcoat={1}
          clearcoatRoughness={0.12}
          envMapIntensity={1.5}
        />
      </RoundedBox>

      <mesh ref={screen} position={[0, 0, 0.135]}>
        <planeGeometry args={[1.92, 4]} />
        <meshBasicMaterial color={accent} transparent opacity={0.88} />
      </mesh>

      {/* Angled sheen that reads as glass */}
      <mesh position={[0, 0, 0.14]} rotation={[0, 0, 0.4]}>
        <planeGeometry args={[0.55, 4.3]} />
        <meshBasicMaterial color="#FFFFFF" transparent opacity={0.08} />
      </mesh>

      {/* Camera bump on the back */}
      <RoundedBox
        args={[0.95, 0.95, 0.1]}
        radius={0.22}
        smoothness={4}
        position={[-0.52, 1.35, -0.16]}
      >
        <meshPhysicalMaterial color="#0E1220" metalness={0.7} roughness={0.35} />
      </RoundedBox>
      {([
        [-0.72, 1.55],
        [-0.34, 1.55],
        [-0.53, 1.17],
      ] as Array<[number, number]>).map(([x, y], i) => (
        <mesh key={i} position={[x, y, -0.23]} rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[0.16, 0.16, 0.06, 24]} />
          <meshPhysicalMaterial color="#05070C" metalness={0.9} roughness={0.1} />
        </mesh>
      ))}

      {[0.5, 0.15, -0.2].map((y, i) => (
        <mesh key={i} position={[1.07, y, 0]} rotation={[0, 0, Math.PI / 2]}>
          <cylinderGeometry args={[0.045, 0.045, 0.22, 12]} />
          <meshPhysicalMaterial color={color} metalness={0.9} roughness={0.25} />
        </mesh>
      ))}
    </group>
  );
}

/** Floating particle field — one draw call, no per-frame allocation. */
function Particles({ count = 260 }: { count?: number }) {
  const points = useRef<THREE.Points>(null);
  const reduced = usePrefersReducedMotion();

  const positions = useMemo(() => {
    const pos = new Float32Array(count * 3);
    for (let i = 0; i < count; i += 1) {
      // Flattened ellipsoid so the field wraps the device without crowding it.
      pos[i * 3] = (Math.random() - 0.5) * 12;
      pos[i * 3 + 1] = (Math.random() - 0.5) * 9;
      pos[i * 3 + 2] = (Math.random() - 0.5) * 6 - 1;
    }
    return pos;
  }, [count]);

  useFrame((_, delta) => {
    if (reduced || !points.current) return;
    points.current.rotation.y += delta * 0.035;
    points.current.rotation.x += delta * 0.012;
  });

  return (
    <points ref={points}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
      </bufferGeometry>
      <pointsMaterial
        size={0.035}
        color="#8FB4FF"
        transparent
        opacity={0.55}
        sizeAttenuation
        depthWrite={false}
        blending={THREE.AdditiveBlending}
      />
    </points>
  );
}

/** The exported canvas. Imported dynamically so Three.js stays optional. */
export default function HeroPhoneScene({ color, accent }: PhoneSceneProps) {
  const reduced = usePrefersReducedMotion();

  return (
    <Canvas
      dpr={[1, 1.75]}
      gl={{
        antialias: false,
        alpha: true,
        powerPreference: 'high-performance',
        preserveDrawingBuffer: false,
      }}
      camera={{ position: [0, 0, 7.4], fov: 38 }}
      // A reduced-motion visitor gets one painted frame, then we stop.
      frameloop={reduced ? 'demand' : 'always'}
      style={{ width: '100%', height: '100%' }}
    >
      <ambientLight intensity={0.6} />
      <directionalLight position={[4, 6, 5]} intensity={1.5} color="#FFFFFF" />
      <pointLight position={[-4, -2, 3]} intensity={22} color="#10B981" distance={16} />
      <pointLight position={[3, 2, -3]} intensity={16} color="#0D9488" distance={14} />
      <pointLight position={[0, -4, 2]} intensity={10} color="#6EE7B3" distance={12} />

      <Float
        speed={reduced ? 0 : 1.4}
        rotationIntensity={reduced ? 0 : 0.12}
        floatIntensity={reduced ? 0 : 0.45}
        floatingRange={[-0.12, 0.12]}
      >
        <PhoneMesh color={color} accent={accent} />
      </Float>

      <Particles count={reduced ? 90 : 260} />
    </Canvas>
  );
}
