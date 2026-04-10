'use client';
import { useRef, useMemo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Text, Float } from '@react-three/drei';
import * as THREE from 'three';

function DataBar({ position, height, color, label, value }) {
  const ref = useRef();
  const targetHeight = height;

  useFrame(() => {
    if (ref.current.scale.y < targetHeight) {
      ref.current.scale.y += (targetHeight - ref.current.scale.y) * 0.1;
    }
  });

  return (
    <group position={position}>
      <Float speed={1.5} rotationIntensity={0.2} floatIntensity={0.3}>
        <mesh ref={ref} position={[0, targetHeight / 2, 0]} scale={[1, 0.1, 1]}>
          <boxGeometry args={[0.6, 1, 0.6]} />
          <meshStandardMaterial
            color={color}
            emissive={color}
            emissiveIntensity={0.3}
            metalness={0.8}
            roughness={0.2}
          />
        </mesh>
        
        <Text
          position={[0, targetHeight + 0.3, 0]}
          fontSize={0.2}
          color="white"
          anchorX="center"
          anchorY="middle"
        >
          {value}
        </Text>
        
        <Text
          position={[0, -0.3, 0]}
          fontSize={0.15}
          color="#94a3b8"
          anchorX="center"
          anchorY="middle"
        >
          {label}
        </Text>
      </Float>
    </group>
  );
}

function GridFloor() {
  return (
    <gridHelper args={[10, 10, '#1e293b', '#0f172a']} position={[0, 0, 0]} />
  );
}

export default function Chart3D({ data = [] }) {
  const maxValue = useMemo(() => Math.max(...data.map(d => d.value), 1), [data]);
  
  const bars = useMemo(() => {
    return data.map((item, i) => ({
      ...item,
      position: [(i - data.length / 2) * 1.2, 0, 0],
      height: (item.value / maxValue) * 3,
    }));
  }, [data, maxValue]);

  return (
    <div style={{ width: '100%', height: 400, borderRadius: 16, overflow: 'hidden', background: 'rgba(0,0,0,0.2)' }}>
      <Canvas camera={{ position: [0, 3, 6], fov: 50 }}>
        <ambientLight intensity={0.4} />
        <pointLight position={[10, 10, 10]} intensity={1} color="#6366f1" />
        <pointLight position={[-10, 10, -10]} intensity={0.5} color="#8b5cf6" />
        <spotLight position={[0, 10, 0]} angle={0.3} penumbra={1} intensity={1} />
        
        <GridFloor />
        
        {bars.map((bar, i) => (
          <DataBar
            key={i}
            position={bar.position}
            height={bar.height}
            color={bar.color || '#6366f1'}
            label={bar.label}
            value={bar.value}
          />
        ))}
      </Canvas>
    </div>
  );
}
