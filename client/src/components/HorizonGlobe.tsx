import { useEffect, useRef, useState } from "react";
import { animate } from "animejs";

interface HorizonGlobeProps {
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

export default function HorizonGlobe({ className = "" }: HorizonGlobeProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationFrameRef = useRef<number>(0);
  const isInteractingRef = useRef(false);
  const cleanupRef = useRef<(() => void) | null>(null);
  const globeStateRef = useRef({
    rotationY: 0,
    rotationX: 0,
    zoom: 6,
    scale: 0.8,
  });
  const [hasWebGL, setHasWebGL] = useState(() => checkWebGLSupport());
  const focusedRef = useRef(false);
  const defaultZoom = 6;

  useEffect(() => {
    if (!hasWebGL) return;
    if (!canvasRef.current || !containerRef.current) return;

    const container = containerRef.current;
    const canvas = canvasRef.current;
    let mounted = true;
    const globeState = globeStateRef.current;

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
          50,
          container.clientWidth / container.clientHeight,
          0.1,
          1000
        );
        camera.position.set(0, 0.5, defaultZoom);
        camera.lookAt(0, -1, 0);

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
        controls.maxDistance = 10;
        controls.enablePan = false;
        controls.minPolarAngle = Math.PI * 0.3;
        controls.maxPolarAngle = Math.PI * 0.7;

        controls.addEventListener("start", () => {
          isInteractingRef.current = true;
        });
        controls.addEventListener("end", () => {
          isInteractingRef.current = false;
        });

        const globeGeometry = new THREE.SphereGeometry(2.5, 128, 128);
        
        const globeMaterial = new THREE.ShaderMaterial({
          uniforms: {
            time: { value: 0 },
          },
          vertexShader: `
            varying vec3 vNormal;
            varying vec3 vPosition;
            varying vec2 vUv;
            
            void main() {
              vNormal = normalize(normalMatrix * normal);
              vPosition = position;
              vUv = uv;
              gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
            }
          `,
          fragmentShader: `
            varying vec3 vNormal;
            varying vec3 vPosition;
            varying vec2 vUv;
            uniform float time;
            
            void main() {
              float intensity = pow(0.65 - dot(vNormal, vec3(0.0, 0.0, 1.0)), 2.0);
              
              vec3 oceanColor = vec3(0.02, 0.15, 0.4);
              vec3 landColor = vec3(0.08, 0.35, 0.2);
              vec3 edgeGlow = vec3(0.3, 0.5, 1.0);
              
              float lat = asin(vPosition.y / 2.5);
              float lon = atan(vPosition.z, vPosition.x);
              
              float continent1 = smoothstep(0.4, 0.5, sin(lon * 2.0 + 1.0) * cos(lat * 3.0));
              float continent2 = smoothstep(0.3, 0.4, sin(lon * 1.5 - 0.5) * sin(lat * 2.5 + 0.5));
              float landMask = max(continent1, continent2) * 0.7;
              
              vec3 baseColor = mix(oceanColor, landColor, landMask);
              
              float gridLat = abs(sin(lat * 18.0));
              float gridLon = abs(sin(lon * 36.0));
              float grid = max(gridLat, gridLon);
              grid = smoothstep(0.97, 1.0, grid) * 0.15;
              
              baseColor += vec3(0.2, 0.4, 0.6) * grid;
              
              baseColor = mix(baseColor, edgeGlow, intensity * 0.6);
              
              float alpha = 0.95;
              
              gl_FragColor = vec4(baseColor, alpha);
            }
          `,
          transparent: true,
          side: THREE.FrontSide,
        });

        const globe = new THREE.Mesh(globeGeometry, globeMaterial);
        globe.position.y = -2.5;
        scene.add(globe);

        const atmosphereGeometry = new THREE.SphereGeometry(2.8, 64, 64);
        const atmosphereMaterial = new THREE.ShaderMaterial({
          uniforms: {
            glowIntensity: { value: 1.0 },
          },
          vertexShader: `
            varying vec3 vNormal;
            varying vec3 vPosition;
            void main() {
              vNormal = normalize(normalMatrix * normal);
              vPosition = (modelViewMatrix * vec4(position, 1.0)).xyz;
              gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
            }
          `,
          fragmentShader: `
            varying vec3 vNormal;
            varying vec3 vPosition;
            uniform float glowIntensity;
            
            void main() {
              float intensity = pow(0.7 - dot(vNormal, vec3(0.0, 0.0, 1.0)), 3.0);
              vec3 glowColor = vec3(0.4, 0.6, 1.0);
              gl_FragColor = vec4(glowColor * glowIntensity, intensity * 0.8);
            }
          `,
          blending: THREE.AdditiveBlending,
          side: THREE.BackSide,
          transparent: true,
        });

        const atmosphere = new THREE.Mesh(atmosphereGeometry, atmosphereMaterial);
        atmosphere.position.y = -2.5;
        scene.add(atmosphere);

        const horizonGlowGeometry = new THREE.RingGeometry(2.5, 4.5, 64);
        const horizonGlowMaterial = new THREE.ShaderMaterial({
          uniforms: {
            time: { value: 0 },
          },
          vertexShader: `
            varying vec2 vUv;
            void main() {
              vUv = uv;
              gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
            }
          `,
          fragmentShader: `
            varying vec2 vUv;
            uniform float time;
            
            void main() {
              float dist = length(vUv - 0.5) * 2.0;
              float glow = 1.0 - smoothstep(0.0, 1.0, dist);
              glow = pow(glow, 2.0);
              
              vec3 color = mix(vec3(0.3, 0.5, 1.0), vec3(0.6, 0.8, 1.0), glow);
              float pulse = sin(time * 0.5) * 0.1 + 0.9;
              
              gl_FragColor = vec4(color * pulse, glow * 0.4);
            }
          `,
          transparent: true,
          blending: THREE.AdditiveBlending,
          side: THREE.DoubleSide,
        });

        const horizonGlow = new THREE.Mesh(horizonGlowGeometry, horizonGlowMaterial);
        horizonGlow.rotation.x = -Math.PI / 2;
        horizonGlow.position.y = -2.5;
        scene.add(horizonGlow);

        const ambientLight = new THREE.AmbientLight(0x4466aa, 0.4);
        scene.add(ambientLight);

        const sunLight = new THREE.DirectionalLight(0xffffff, 1.2);
        sunLight.position.set(5, 5, 5);
        scene.add(sunLight);

        const rimLight = new THREE.DirectionalLight(0x6688ff, 0.6);
        rimLight.position.set(-3, 1, -3);
        scene.add(rimLight);

        let time = 0;
        
        animate(globeState, {
          zoom: [defaultZoom + 4, defaultZoom],
          scale: [0.7, 1],
          duration: 2000,
          ease: "outExpo",
        });

        const render = () => {
          if (!mounted) return;
          animationFrameRef.current = requestAnimationFrame(render);
          
          time += 0.01;
          if (globeMaterial.uniforms) {
            globeMaterial.uniforms.time.value = time;
          }
          if (horizonGlowMaterial.uniforms) {
            horizonGlowMaterial.uniforms.time.value = time;
          }

          if (!isInteractingRef.current) {
            globeState.rotationY += 0.002;
          }

          globe.rotation.y = globeState.rotationY;
          globe.rotation.x = globeState.rotationX;
          atmosphere.rotation.y = globeState.rotationY;
          atmosphere.rotation.x = globeState.rotationX;
          
          const s = globeState.scale;
          globe.scale.set(s, s, s);
          atmosphere.scale.set(s, s, s);
          
          camera.position.z = globeState.zoom;
          
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

        const handleMouseEnter = () => {
          animate(globeState, {
            scale: 1.05,
            duration: 400,
            ease: "outQuad",
          });
        };

        const handleMouseLeave = () => {
          animate(globeState, {
            scale: 1,
            duration: 400,
            ease: "outQuad",
          });
        };

        const handleClick = () => {
          focusedRef.current = !focusedRef.current;
          animate(globeState, {
            zoom: focusedRef.current ? defaultZoom - 2 : defaultZoom,
            duration: 600,
            ease: "inOutQuad",
          });
        };

        window.addEventListener("resize", handleResize);
        container.addEventListener("mouseenter", handleMouseEnter);
        container.addEventListener("mouseleave", handleMouseLeave);
        container.addEventListener("click", handleClick);

        cleanupRef.current = () => {
          mounted = false;
          window.removeEventListener("resize", handleResize);
          container.removeEventListener("mouseenter", handleMouseEnter);
          container.removeEventListener("mouseleave", handleMouseLeave);
          container.removeEventListener("click", handleClick);
          cancelAnimationFrame(animationFrameRef.current);
          controls.dispose();
          renderer.dispose();
          globeGeometry.dispose();
          globeMaterial.dispose();
          atmosphereGeometry.dispose();
          atmosphereMaterial.dispose();
          horizonGlowGeometry.dispose();
          horizonGlowMaterial.dispose();
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
        className={`relative w-full h-full ${className}`}
        data-testid="horizon-globe-container"
      >
        <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[600px] h-[300px]">
          <div className="w-full h-full rounded-t-full bg-gradient-to-t from-blue-900/50 via-blue-700/30 to-transparent" />
        </div>
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className={`relative w-full h-full cursor-pointer ${className}`}
      data-testid="horizon-globe-container"
    >
      <canvas
        ref={canvasRef}
        className="w-full h-full cursor-grab active:cursor-grabbing"
        data-testid="horizon-globe-canvas"
      />
    </div>
  );
}
