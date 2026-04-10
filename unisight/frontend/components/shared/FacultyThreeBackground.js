'use client';
import { useEffect, useRef } from 'react';
import * as THREE from 'three';

export default function FacultyThreeBackground() {
  const containerRef = useRef(null);

  useEffect(() => {
    if (!containerRef.current) return;
    let renderer;
    try {
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true, failIfMajorPerformanceCaveat: true });
    
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    containerRef.current.appendChild(renderer.domElement);

    // Create particles
    const particlesGeometry = new THREE.BufferGeometry();
    const particlesCount = 1500;
    const posArray = new Float32Array(particlesCount * 3);
    const colorArray = new Float32Array(particlesCount * 3);

    const colors = [
      new THREE.Color('#10b981'),
      new THREE.Color('#34d399'),
      new THREE.Color('#6366f1'),
      new THREE.Color('#0ea5e9'),
    ];

    for (let i = 0; i < particlesCount; i++) {
      posArray[i * 3] = (Math.random() - 0.5) * 15;
      posArray[i * 3 + 1] = (Math.random() - 0.5) * 15;
      posArray[i * 3 + 2] = (Math.random() - 0.5) * 15;
      
      const color = colors[Math.floor(Math.random() * colors.length)];
      colorArray[i * 3] = color.r;
      colorArray[i * 3 + 1] = color.g;
      colorArray[i * 3 + 2] = color.b;
    }

    particlesGeometry.setAttribute('position', new THREE.BufferAttribute(posArray, 3));
    particlesGeometry.setAttribute('color', new THREE.BufferAttribute(colorArray, 3));

    const particlesMaterial = new THREE.PointsMaterial({
      size: 0.018,
      vertexColors: true,
      transparent: true,
      opacity: 0.7,
      blending: THREE.AdditiveBlending,
    });

    const particlesMesh = new THREE.Points(particlesGeometry, particlesMaterial);
    scene.add(particlesMesh);

    // Create floating geometric shapes
    const shapes = [];
    
    // Octahedrons - representing education/faculty
    const octaGeometry = new THREE.OctahedronGeometry(0.25, 0);
    const octaMaterial = new THREE.MeshBasicMaterial({
      color: '#10b981',
      wireframe: true,
      transparent: true,
      opacity: 0.2,
    });

    for (let i = 0; i < 8; i++) {
      const octa = new THREE.Mesh(octaGeometry.clone(), octaMaterial.clone());
      octa.position.set(
        (Math.random() - 0.5) * 10,
        (Math.random() - 0.5) * 10,
        (Math.random() - 0.5) * 10
      );
      octa.userData = {
        rotSpeed: {
          x: (Math.random() - 0.5) * 0.008,
          y: (Math.random() - 0.5) * 0.008,
          z: (Math.random() - 0.5) * 0.008
        },
        floatSpeed: Math.random() * 0.4 + 0.3,
        floatOffset: Math.random() * Math.PI * 2
      };
      shapes.push(octa);
      scene.add(octa);
    }

    // Add rings
    const ringGeometry = new THREE.TorusGeometry(0.8, 0.015, 16, 100);
    const ringMaterial = new THREE.MeshBasicMaterial({
      color: '#10b981',
      transparent: true,
      opacity: 0.12,
    });

    const rings = [];
    for (let i = 0; i < 4; i++) {
      const ring = new THREE.Mesh(ringGeometry.clone(), ringMaterial.clone());
      ring.position.set(
        (Math.random() - 0.5) * 8,
        (Math.random() - 0.5) * 8,
        (Math.random() - 0.5) * 8
      );
      ring.rotation.x = Math.random() * Math.PI;
      ring.rotation.y = Math.random() * Math.PI;
      ring.userData = {
        rotSpeed: (Math.random() - 0.5) * 0.003,
        scale: Math.random() * 0.5 + 0.3
      };
      ring.scale.setScalar(ring.userData.scale);
      rings.push(ring);
      scene.add(ring);
    }

    camera.position.z = 5;

    let mouseX = 0;
    let mouseY = 0;
    let targetX = 0;
    let targetY = 0;

    const handleMouseMove = (event) => {
      mouseX = (event.clientX / window.innerWidth) * 2 - 1;
      mouseY = -(event.clientY / window.innerHeight) * 2 + 1;
    };

    window.addEventListener('mousemove', handleMouseMove);

    const clock = new THREE.Clock();

    const animate = () => {
      const elapsedTime = clock.getElapsedTime();

      // Rotate particles
      particlesMesh.rotation.y = elapsedTime * 0.02;
      particlesMesh.rotation.x = elapsedTime * 0.015;

      // Animate shapes
      shapes.forEach((shape) => {
        shape.rotation.x += shape.userData.rotSpeed.x;
        shape.rotation.y += shape.userData.rotSpeed.y;
        shape.rotation.z += shape.userData.rotSpeed.z;
        shape.position.y = Math.sin(elapsedTime * shape.userData.floatSpeed + shape.userData.floatOffset) * 0.4;
      });

      // Animate rings
      rings.forEach((ring) => {
        ring.rotation.z += ring.userData.rotSpeed;
        ring.rotation.x += ring.userData.rotSpeed * 0.5;
      });

      // Smooth camera movement based on mouse
      targetX += (mouseX * 0.4 - targetX) * 0.02;
      targetY += (mouseY * 0.4 - targetY) * 0.02;
      camera.position.x = targetX;
      camera.position.y = targetY;
      camera.lookAt(scene.position);

      renderer.render(scene, camera);
      requestAnimationFrame(animate);
    };

    animate();

    const handleResize = () => {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
    };

    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('resize', handleResize);
      if (containerRef.current && renderer && renderer.domElement) {
        try { containerRef.current.removeChild(renderer.domElement); } catch (_) {}
      }
      renderer && renderer.dispose();
    };
    } catch (err) {
      console.warn('[FacultyThreeBackground] WebGL unavailable:', err.message);
    }
  }, []);

  return (
    <div
      ref={containerRef}
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        zIndex: 0,
        pointerEvents: 'none',
        opacity: 0.35,
      }}
    />
  );
}
