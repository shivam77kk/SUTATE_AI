'use client';
import { useRef, useMemo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Float, MeshDistortMaterial, Sphere, Torus, MeshTransmissionMaterial } from '@react-three/drei';
import * as THREE from 'three';

function Particles({ count = 800 }) {
  const mesh = useRef();
  const [positions, colors] = useMemo(() => {
    const pos = new Float32Array(count * 3);
    const col = new Float32Array(count * 3);
    const palette = [
      new THREE.Color('#6366f1'),
      new THREE.Color('#8b5cf6'),
      new THREE.Color('#10b981'),
      new THREE.Color('#0ea5e9'),
    ];
    for (let i = 0; i < count; i++) {
      pos[i * 3] = (Math.random() - 0.5) * 20;
      pos[i * 3 + 1] = (Math.random() - 0.5) * 20;
      pos[i * 3 + 2] = (Math.random() - 0.5) * 20;
      const c = palette[Math.floor(Math.random() * palette.length)];
      col[i * 3] = c.r;
      col[i * 3 + 1] = c.g;
      col[i * 3 + 2] = c.b;
    }
    return [pos, col];
  }, [count]);

  useFrame((state) => {
    if (mesh.current) {
      mesh.current.rotation.y = state.clock.elapsedTime * 0.02;
      mesh.current.rotation.x = Math.sin(state.clock.elapsedTime * 0.05) * 0.1;
    }
  });

  return (
    <points ref={mesh}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" count={count} array={positions} itemSize={3} />
        <bufferAttribute attach="attributes-color" count={count} array={colors} itemSize={3} />
      </bufferGeometry>
      <pointsMaterial size={0.03} vertexColors transparent opacity={0.7} blending={THREE.AdditiveBlending} sizeAttenuation />
    </points>
  );
}

function GlassSphere() {
  const ref = useRef();
  useFrame((state) => {
    if (ref.current) {
      ref.current.rotation.y = state.clock.elapsedTime * 0.15;
      ref.current.rotation.x = Math.sin(state.clock.elapsedTime * 0.1) * 0.2;
    }
  });

  return (
    <Float speed={1.5} rotationIntensity={0.4} floatIntensity={1.2}>
      <Sphere ref={ref} args={[1.4, 64, 64]} position={[2, 0.5, -2]}>
        <MeshDistortMaterial
          color="#6366f1"
          transparent
          opacity={0.15}
          distort={0.3}
          speed={2}
          roughness={0.1}
          metalness={0.8}
          wireframe
        />
      </Sphere>
    </Float>
  );
}

function GlassTorus() {
  const ref = useRef();
  useFrame((state) => {
    if (ref.current) {
      ref.current.rotation.x = state.clock.elapsedTime * 0.2;
      ref.current.rotation.z = state.clock.elapsedTime * 0.1;
    }
  });

  return (
    <Float speed={1} rotationIntensity={0.3} floatIntensity={0.8}>
      <Torus ref={ref} args={[1, 0.05, 16, 100]} position={[-2, -0.5, -1]}>
        <meshBasicMaterial color="#10b981" transparent opacity={0.2} />
      </Torus>
    </Float>
  );
}

function FloatingIco() {
  const ref = useRef();
  useFrame((state) => {
    if (ref.current) {
      ref.current.rotation.y = state.clock.elapsedTime * 0.3;
      ref.current.rotation.z = state.clock.elapsedTime * 0.15;
    }
  });

  return (
    <Float speed={2} rotationIntensity={0.6} floatIntensity={1}>
      <mesh ref={ref} position={[-3, 1.5, -3]}>
        <icosahedronGeometry args={[0.5, 0]} />
        <meshBasicMaterial color="#f59e0b" wireframe transparent opacity={0.2} />
      </mesh>
    </Float>
  );
}

function FloatingOcta() {
  const ref = useRef();
  useFrame((state) => {
    if (ref.current) {
      ref.current.rotation.x = state.clock.elapsedTime * 0.25;
      ref.current.rotation.y = state.clock.elapsedTime * 0.15;
    }
  });

  return (
    <Float speed={1.8} rotationIntensity={0.5} floatIntensity={1.2}>
      <mesh ref={ref} position={[3, -1, -2]}>
        <octahedronGeometry args={[0.4, 0]} />
        <meshBasicMaterial color="#8b5cf6" wireframe transparent opacity={0.25} />
      </mesh>
    </Float>
  );
}

export default function HeroScene() {
  return (
    <div style={{ position: 'absolute', inset: 0, zIndex: 0, pointerEvents: 'none' }}>
      <Canvas
        camera={{ position: [0, 0, 6], fov: 60 }}
        dpr={[1, 1.5]}
        style={{ background: 'transparent' }}
        gl={{ alpha: true, antialias: true }}
      >
        <ambientLight intensity={0.2} />
        <pointLight position={[5, 5, 5]} intensity={0.3} color="#6366f1" />
        <pointLight position={[-5, -3, 3]} intensity={0.2} color="#10b981" />
        <Particles />
        <GlassSphere />
        <GlassTorus />
        <FloatingIco />
        <FloatingOcta />
      </Canvas>
    </div>
  );
}
