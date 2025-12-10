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
    zoom: 5,
    scale: 0.8,
  });
  const [hasWebGL, setHasWebGL] = useState(() => checkWebGLSupport());
  const focusedRef = useRef(false);
  const defaultZoom = 5;

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
          45,
          container.clientWidth / container.clientHeight,
          0.1,
          1000
        );
        camera.position.set(0, 0.3, defaultZoom);
        camera.lookAt(0, -1.5, 0);

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
        controls.minDistance = 3.5;
        controls.maxDistance = 8;
        controls.enablePan = false;
        controls.minPolarAngle = Math.PI * 0.35;
        controls.maxPolarAngle = Math.PI * 0.65;

        controls.addEventListener("start", () => {
          isInteractingRef.current = true;
        });
        controls.addEventListener("end", () => {
          isInteractingRef.current = false;
        });

        const globeGeometry = new THREE.SphereGeometry(3, 128, 128);
        
        const globeMaterial = new THREE.ShaderMaterial({
          uniforms: {
            time: { value: 0 },
          },
          vertexShader: `
            varying vec3 vNormal;
            varying vec3 vPosition;
            varying vec2 vUv;
            varying vec3 vWorldPosition;
            
            void main() {
              vNormal = normalize(normalMatrix * normal);
              vPosition = position;
              vUv = uv;
              vWorldPosition = (modelMatrix * vec4(position, 1.0)).xyz;
              gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
            }
          `,
          fragmentShader: `
            varying vec3 vNormal;
            varying vec3 vPosition;
            varying vec2 vUv;
            varying vec3 vWorldPosition;
            uniform float time;
            
            // Simplex noise for clouds
            vec3 mod289(vec3 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
            vec4 mod289(vec4 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
            vec4 permute(vec4 x) { return mod289(((x*34.0)+1.0)*x); }
            vec4 taylorInvSqrt(vec4 r) { return 1.79284291400159 - 0.85373472095314 * r; }
            
            float snoise(vec3 v) {
              const vec2 C = vec2(1.0/6.0, 1.0/3.0);
              const vec4 D = vec4(0.0, 0.5, 1.0, 2.0);
              vec3 i = floor(v + dot(v, C.yyy));
              vec3 x0 = v - i + dot(i, C.xxx);
              vec3 g = step(x0.yzx, x0.xyz);
              vec3 l = 1.0 - g;
              vec3 i1 = min(g.xyz, l.zxy);
              vec3 i2 = max(g.xyz, l.zxy);
              vec3 x1 = x0 - i1 + C.xxx;
              vec3 x2 = x0 - i2 + C.yyy;
              vec3 x3 = x0 - D.yyy;
              i = mod289(i);
              vec4 p = permute(permute(permute(i.z + vec4(0.0, i1.z, i2.z, 1.0)) + i.y + vec4(0.0, i1.y, i2.y, 1.0)) + i.x + vec4(0.0, i1.x, i2.x, 1.0));
              float n_ = 0.142857142857;
              vec3 ns = n_ * D.wyz - D.xzx;
              vec4 j = p - 49.0 * floor(p * ns.z * ns.z);
              vec4 x_ = floor(j * ns.z);
              vec4 y_ = floor(j - 7.0 * x_);
              vec4 x = x_ *ns.x + ns.yyyy;
              vec4 y = y_ *ns.x + ns.yyyy;
              vec4 h = 1.0 - abs(x) - abs(y);
              vec4 b0 = vec4(x.xy, y.xy);
              vec4 b1 = vec4(x.zw, y.zw);
              vec4 s0 = floor(b0)*2.0 + 1.0;
              vec4 s1 = floor(b1)*2.0 + 1.0;
              vec4 sh = -step(h, vec4(0.0));
              vec4 a0 = b0.xzyw + s0.xzyw*sh.xxyy;
              vec4 a1 = b1.xzyw + s1.xzyw*sh.zzww;
              vec3 p0 = vec3(a0.xy, h.x);
              vec3 p1 = vec3(a0.zw, h.y);
              vec3 p2 = vec3(a1.xy, h.z);
              vec3 p3 = vec3(a1.zw, h.w);
              vec4 norm = taylorInvSqrt(vec4(dot(p0,p0), dot(p1,p1), dot(p2,p2), dot(p3,p3)));
              p0 *= norm.x; p1 *= norm.y; p2 *= norm.z; p3 *= norm.w;
              vec4 m = max(0.6 - vec4(dot(x0,x0), dot(x1,x1), dot(x2,x2), dot(x3,x3)), 0.0);
              m = m * m;
              return 42.0 * dot(m*m, vec4(dot(p0,x0), dot(p1,x1), dot(p2,x2), dot(p3,x3)));
            }
            
            void main() {
              float rimIntensity = pow(1.0 - abs(dot(vNormal, vec3(0.0, 0.0, 1.0))), 2.5);
              
              // Ocean colors - deep blue
              vec3 deepOcean = vec3(0.01, 0.04, 0.12);
              vec3 shallowOcean = vec3(0.02, 0.08, 0.2);
              
              // Land colors
              vec3 landGreen = vec3(0.08, 0.18, 0.08);
              vec3 landBrown = vec3(0.12, 0.1, 0.06);
              vec3 snow = vec3(0.85, 0.88, 0.9);
              
              float lat = asin(vPosition.y / 3.0);
              float lon = atan(vPosition.z, vPosition.x);
              
              // Continent shapes using noise
              float continentNoise = snoise(vPosition * 0.8) * 0.5 + 0.5;
              float detailNoise = snoise(vPosition * 2.0) * 0.3;
              float landMask = smoothstep(0.45, 0.55, continentNoise + detailNoise);
              
              // Ice caps
              float iceCap = smoothstep(0.7, 0.85, abs(lat / 1.57));
              
              // Cloud layer
              float cloudNoise = snoise(vPosition * 1.5 + time * 0.02) * 0.5 + 0.5;
              float clouds = smoothstep(0.4, 0.6, cloudNoise) * 0.6;
              
              // Base ocean color with depth variation
              vec3 oceanColor = mix(deepOcean, shallowOcean, rimIntensity * 0.5);
              
              // Land with vegetation gradient
              vec3 landColor = mix(landGreen, landBrown, abs(lat) * 0.8);
              landColor = mix(landColor, snow, iceCap);
              
              // Combine ocean and land
              vec3 surfaceColor = mix(oceanColor, landColor, landMask);
              
              // Add clouds
              surfaceColor = mix(surfaceColor, vec3(0.9, 0.92, 0.95), clouds);
              
              // Lighting - simulate sun from upper right
              vec3 lightDir = normalize(vec3(0.5, 0.3, 1.0));
              float diffuse = max(dot(vNormal, lightDir), 0.0);
              float ambient = 0.15;
              
              // Terminator (day/night boundary)
              float dayNight = smoothstep(-0.1, 0.3, dot(vNormal, lightDir));
              
              // Night side glow (city lights effect)
              vec3 nightColor = vec3(0.01, 0.02, 0.04);
              float cityLights = snoise(vPosition * 4.0) * 0.5 + 0.5;
              cityLights = pow(cityLights, 3.0) * 0.15 * landMask;
              nightColor += vec3(1.0, 0.8, 0.4) * cityLights;
              
              // Final color with day/night
              vec3 dayColor = surfaceColor * (ambient + diffuse * 0.85);
              vec3 finalColor = mix(nightColor, dayColor, dayNight);
              
              // Atmospheric rim lighting (strong blue glow)
              vec3 atmosphereColor = vec3(0.4, 0.7, 1.0);
              finalColor += atmosphereColor * rimIntensity * 0.4;
              
              gl_FragColor = vec4(finalColor, 1.0);
            }
          `,
          transparent: false,
          side: THREE.FrontSide,
        });

        const globe = new THREE.Mesh(globeGeometry, globeMaterial);
        globe.position.y = -3.2;
        scene.add(globe);

        // Inner atmosphere glow
        const innerAtmoGeometry = new THREE.SphereGeometry(3.05, 64, 64);
        const innerAtmoMaterial = new THREE.ShaderMaterial({
          uniforms: {
            glowIntensity: { value: 1.0 },
          },
          vertexShader: `
            varying vec3 vNormal;
            void main() {
              vNormal = normalize(normalMatrix * normal);
              gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
            }
          `,
          fragmentShader: `
            varying vec3 vNormal;
            uniform float glowIntensity;
            
            void main() {
              float intensity = pow(1.0 - abs(dot(vNormal, vec3(0.0, 0.0, 1.0))), 4.0);
              vec3 glowColor = vec3(0.3, 0.6, 1.0);
              gl_FragColor = vec4(glowColor * glowIntensity, intensity * 0.5);
            }
          `,
          blending: THREE.AdditiveBlending,
          side: THREE.FrontSide,
          transparent: true,
          depthWrite: false,
        });

        const innerAtmo = new THREE.Mesh(innerAtmoGeometry, innerAtmoMaterial);
        innerAtmo.position.y = -3.2;
        scene.add(innerAtmo);

        // Outer atmosphere (strong blue rim glow like the image)
        const outerAtmoGeometry = new THREE.SphereGeometry(3.4, 64, 64);
        const outerAtmoMaterial = new THREE.ShaderMaterial({
          uniforms: {
            glowIntensity: { value: 1.0 },
          },
          vertexShader: `
            varying vec3 vNormal;
            varying vec3 vViewPosition;
            void main() {
              vNormal = normalize(normalMatrix * normal);
              vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
              vViewPosition = -mvPosition.xyz;
              gl_Position = projectionMatrix * mvPosition;
            }
          `,
          fragmentShader: `
            varying vec3 vNormal;
            varying vec3 vViewPosition;
            uniform float glowIntensity;
            
            void main() {
              vec3 viewDir = normalize(vViewPosition);
              float intensity = pow(1.0 - abs(dot(vNormal, viewDir)), 3.0);
              
              // Bright cyan-blue atmosphere glow
              vec3 innerGlow = vec3(0.5, 0.8, 1.0);
              vec3 outerGlow = vec3(0.2, 0.5, 0.9);
              vec3 glowColor = mix(outerGlow, innerGlow, intensity);
              
              gl_FragColor = vec4(glowColor * glowIntensity * 1.5, intensity * 0.7);
            }
          `,
          blending: THREE.AdditiveBlending,
          side: THREE.BackSide,
          transparent: true,
          depthWrite: false,
        });

        const outerAtmo = new THREE.Mesh(outerAtmoGeometry, outerAtmoMaterial);
        outerAtmo.position.y = -3.2;
        scene.add(outerAtmo);

        // Horizon glow line (the bright blue line at the edge)
        const horizonGeometry = new THREE.TorusGeometry(3.1, 0.08, 16, 100);
        const horizonMaterial = new THREE.ShaderMaterial({
          uniforms: {
            time: { value: 0 },
          },
          vertexShader: `
            varying vec3 vNormal;
            void main() {
              vNormal = normalize(normalMatrix * normal);
              gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
            }
          `,
          fragmentShader: `
            varying vec3 vNormal;
            uniform float time;
            
            void main() {
              float intensity = pow(1.0 - abs(dot(vNormal, vec3(0.0, 0.0, 1.0))), 1.5);
              vec3 color = vec3(0.6, 0.85, 1.0);
              float pulse = 0.9 + sin(time * 0.5) * 0.1;
              gl_FragColor = vec4(color * pulse * 1.2, intensity * 0.9);
            }
          `,
          blending: THREE.AdditiveBlending,
          transparent: true,
          depthWrite: false,
        });

        const horizonGlow = new THREE.Mesh(horizonGeometry, horizonMaterial);
        horizonGlow.rotation.x = Math.PI / 2;
        horizonGlow.position.y = -3.2;
        scene.add(horizonGlow);

        // Ambient light
        const ambientLight = new THREE.AmbientLight(0x334466, 0.3);
        scene.add(ambientLight);

        // Sun light from upper-right
        const sunLight = new THREE.DirectionalLight(0xffffff, 1.0);
        sunLight.position.set(5, 3, 5);
        scene.add(sunLight);

        // Subtle fill light
        const fillLight = new THREE.DirectionalLight(0x4488ff, 0.2);
        fillLight.position.set(-3, 1, 2);
        scene.add(fillLight);

        let time = 0;
        
        animate(globeState, {
          zoom: [defaultZoom + 3, defaultZoom],
          scale: [0.7, 1],
          duration: 2500,
          ease: "outExpo",
        });

        const render = () => {
          if (!mounted) return;
          animationFrameRef.current = requestAnimationFrame(render);
          
          time += 0.005;
          if (globeMaterial.uniforms) {
            globeMaterial.uniforms.time.value = time;
          }
          if (horizonMaterial.uniforms) {
            horizonMaterial.uniforms.time.value = time;
          }

          if (!isInteractingRef.current) {
            globeState.rotationY += 0.001;
          }

          globe.rotation.y = globeState.rotationY;
          globe.rotation.x = globeState.rotationX;
          innerAtmo.rotation.y = globeState.rotationY;
          innerAtmo.rotation.x = globeState.rotationX;
          outerAtmo.rotation.y = globeState.rotationY * 0.5;
          horizonGlow.rotation.y = globeState.rotationY;
          
          const s = globeState.scale;
          globe.scale.set(s, s, s);
          innerAtmo.scale.set(s, s, s);
          outerAtmo.scale.set(s, s, s);
          horizonGlow.scale.set(s, s, s);
          
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
            scale: 1.03,
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
            zoom: focusedRef.current ? defaultZoom - 1.5 : defaultZoom,
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
          innerAtmoGeometry.dispose();
          innerAtmoMaterial.dispose();
          outerAtmoGeometry.dispose();
          outerAtmoMaterial.dispose();
          horizonGeometry.dispose();
          horizonMaterial.dispose();
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
        <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px]">
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
