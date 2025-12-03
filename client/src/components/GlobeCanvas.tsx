import { useEffect, useRef, useState } from "react";

interface GlobeCanvasProps {
  className?: string;
}

function checkWebGLSupport(): boolean {
  if (typeof window === "undefined") return false;
  if (typeof document === "undefined") return false;
  
  try {
    const testCanvas = document.createElement("canvas");
    if (!testCanvas || typeof testCanvas.getContext !== "function") {
      return false;
    }
    const gl = testCanvas.getContext("webgl") || testCanvas.getContext("experimental-webgl");
    return !!gl;
  } catch (e) {
    return false;
  }
}

export default function GlobeCanvas({ className = "" }: GlobeCanvasProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationFrameRef = useRef<number>(0);
  const isInteractingRef = useRef(false);
  const cleanupRef = useRef<(() => void) | null>(null);
  const [isHovered, setIsHovered] = useState(false);
  const [hasWebGL, setHasWebGL] = useState(() => checkWebGLSupport());

  useEffect(() => {
    if (!hasWebGL) return;
    if (!canvasRef.current || !containerRef.current) return;

    const container = containerRef.current;
    const canvas = canvasRef.current;
    let mounted = true;

    const initScene = async () => {
      let THREE: typeof import("three");
      let OrbitControlsClass: typeof import("three/examples/jsm/controls/OrbitControls.js").OrbitControls;
      
      try {
        const threeModule = await import("three");
        const orbitModule = await import("three/examples/jsm/controls/OrbitControls.js");
        THREE = threeModule;
        OrbitControlsClass = orbitModule.OrbitControls;
      } catch (e) {
        console.warn("Failed to load Three.js:", e);
        if (mounted) setHasWebGL(false);
        return;
      }

      if (!mounted) return;

      try {
        const scene = new THREE.Scene();

        const camera = new THREE.PerspectiveCamera(
          45,
          container.clientWidth / container.clientHeight,
          0.1,
          1000
        );
        camera.position.z = 8;

        const renderer = new THREE.WebGLRenderer({
          canvas,
          antialias: true,
          alpha: true,
        });
        renderer.setSize(container.clientWidth, container.clientHeight);
        renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        renderer.setClearColor(0x000000, 0);

        const controls = new OrbitControlsClass(camera, canvas);
        controls.enableDamping = true;
        controls.dampingFactor = 0.05;
        controls.minDistance = 4;
        controls.maxDistance = 12;
        controls.enablePan = false;

        controls.addEventListener("start", () => {
          isInteractingRef.current = true;
        });
        controls.addEventListener("end", () => {
          isInteractingRef.current = false;
        });

        const globeGeometry = new THREE.SphereGeometry(2, 64, 64);
        
        const globeMaterial = new THREE.ShaderMaterial({
          uniforms: {
            time: { value: 0 },
          },
          vertexShader: `
            varying vec3 vNormal;
            varying vec3 vPosition;
            
            void main() {
              vNormal = normalize(normalMatrix * normal);
              vPosition = position;
              gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
            }
          `,
          fragmentShader: `
            varying vec3 vNormal;
            varying vec3 vPosition;
            uniform float time;
            
            void main() {
              float intensity = pow(0.7 - dot(vNormal, vec3(0.0, 0.0, 1.0)), 2.0);
              
              vec3 coreColor = vec3(0.1, 0.3, 0.8);
              vec3 edgeColor = vec3(0.4, 0.2, 0.9);
              vec3 glowColor = vec3(0.5, 0.3, 1.0);
              
              float lat = asin(vPosition.y / 2.0);
              float lon = atan(vPosition.z, vPosition.x);
              
              float gridLat = abs(sin(lat * 12.0));
              float gridLon = abs(sin(lon * 24.0));
              float grid = max(gridLat, gridLon);
              grid = smoothstep(0.95, 1.0, grid);
              
              vec3 baseColor = mix(coreColor, edgeColor, intensity);
              baseColor = mix(baseColor, glowColor, grid * 0.4);
              
              float pulse = sin(time * 2.0) * 0.1 + 0.9;
              baseColor *= pulse;
              
              float alpha = 0.85 + intensity * 0.15;
              
              gl_FragColor = vec4(baseColor, alpha);
            }
          `,
          transparent: true,
          side: THREE.FrontSide,
        });

        const globe = new THREE.Mesh(globeGeometry, globeMaterial);
        scene.add(globe);

        const atmosphereGeometry = new THREE.SphereGeometry(2.3, 64, 64);
        const atmosphereMaterial = new THREE.ShaderMaterial({
          vertexShader: `
            varying vec3 vNormal;
            void main() {
              vNormal = normalize(normalMatrix * normal);
              gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
            }
          `,
          fragmentShader: `
            varying vec3 vNormal;
            void main() {
              float intensity = pow(0.65 - dot(vNormal, vec3(0.0, 0.0, 1.0)), 2.0);
              vec3 atmosphereColor = vec3(0.4, 0.3, 1.0);
              gl_FragColor = vec4(atmosphereColor, intensity * 0.6);
            }
          `,
          blending: THREE.AdditiveBlending,
          side: THREE.BackSide,
          transparent: true,
        });

        const atmosphere = new THREE.Mesh(atmosphereGeometry, atmosphereMaterial);
        scene.add(atmosphere);

        const ambientLight = new THREE.AmbientLight(0x4444ff, 0.3);
        scene.add(ambientLight);

        const directionalLight = new THREE.DirectionalLight(0x8866ff, 0.8);
        directionalLight.position.set(5, 3, 5);
        scene.add(directionalLight);

        const pointLight = new THREE.PointLight(0x6644ff, 1, 100);
        pointLight.position.set(-5, -3, 5);
        scene.add(pointLight);

        let time = 0;
        let currentScale = 0.8;
        
        const render = () => {
          if (!mounted) return;
          animationFrameRef.current = requestAnimationFrame(render);
          
          time += 0.01;
          if (globeMaterial.uniforms) {
            globeMaterial.uniforms.time.value = time;
          }

          if (!isInteractingRef.current) {
            globe.rotation.y += 0.002;
            atmosphere.rotation.y += 0.002;
          }

          currentScale += (1 - currentScale) * 0.1;
          globe.scale.set(currentScale, currentScale, currentScale);
          atmosphere.scale.set(currentScale, currentScale, currentScale);
          
          controls.update();
          renderer.render(scene, camera);
        };

        render();

        const handleResize = () => {
          if (!container || !mounted) return;
          const width = container.clientWidth;
          const height = container.clientHeight;
          
          camera.aspect = width / height;
          camera.updateProjectionMatrix();
          renderer.setSize(width, height);
        };

        window.addEventListener("resize", handleResize);

        cleanupRef.current = () => {
          mounted = false;
          window.removeEventListener("resize", handleResize);
          cancelAnimationFrame(animationFrameRef.current);
          controls.dispose();
          renderer.dispose();
          globeGeometry.dispose();
          globeMaterial.dispose();
          atmosphereGeometry.dispose();
          atmosphereMaterial.dispose();
        };
      } catch (error) {
        console.warn("WebGL initialization failed:", error);
        if (mounted) setHasWebGL(false);
      }
    };

    initScene();

    return () => {
      mounted = false;
      if (cleanupRef.current) {
        cleanupRef.current();
      }
    };
  }, [hasWebGL]);

  if (!hasWebGL) {
    return (
      <div
        className={`relative w-full h-full flex items-center justify-center ${className}`}
        data-testid="globe-container"
      >
        <div className="w-48 h-48 rounded-full bg-gradient-to-br from-indigo-500/30 via-purple-500/20 to-blue-500/30 animate-pulse flex items-center justify-center">
          <div className="w-32 h-32 rounded-full bg-gradient-to-br from-indigo-600/40 via-purple-600/30 to-blue-600/40" />
        </div>
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className={`relative w-full h-full transition-transform duration-300 ${isHovered ? "scale-[1.02]" : "scale-100"} ${className}`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      data-testid="globe-container"
    >
      <canvas
        ref={canvasRef}
        className="w-full h-full cursor-grab active:cursor-grabbing"
        data-testid="globe-canvas"
      />
    </div>
  );
}
