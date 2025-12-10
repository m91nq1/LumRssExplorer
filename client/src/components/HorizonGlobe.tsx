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
            sunDirection: { value: new THREE.Vector3(0.6, 0.3, 0.8).normalize() },
          },
          vertexShader: `
            varying vec3 vNormal;
            varying vec3 vPosition;
            varying vec2 vUv;
            varying vec3 vWorldNormal;
            
            void main() {
              vNormal = normalize(normalMatrix * normal);
              vPosition = position;
              vUv = uv;
              vWorldNormal = normalize((modelMatrix * vec4(normal, 0.0)).xyz);
              gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
            }
          `,
          fragmentShader: `
            varying vec3 vNormal;
            varying vec3 vPosition;
            varying vec2 vUv;
            varying vec3 vWorldNormal;
            uniform float time;
            uniform vec3 sunDirection;
            
            // Hash functions for noise
            float hash(vec2 p) {
              return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453);
            }
            
            float hash3(vec3 p) {
              return fract(sin(dot(p, vec3(127.1, 311.7, 74.7))) * 43758.5453);
            }
            
            // Smooth noise
            float noise(vec2 p) {
              vec2 i = floor(p);
              vec2 f = fract(p);
              f = f * f * (3.0 - 2.0 * f);
              
              float a = hash(i);
              float b = hash(i + vec2(1.0, 0.0));
              float c = hash(i + vec2(0.0, 1.0));
              float d = hash(i + vec2(1.0, 1.0));
              
              return mix(mix(a, b, f.x), mix(c, d, f.x), f.y);
            }
            
            // 3D noise for clouds
            float noise3D(vec3 p) {
              vec3 i = floor(p);
              vec3 f = fract(p);
              f = f * f * (3.0 - 2.0 * f);
              
              float n = mix(
                mix(mix(hash3(i), hash3(i + vec3(1,0,0)), f.x),
                    mix(hash3(i + vec3(0,1,0)), hash3(i + vec3(1,1,0)), f.x), f.y),
                mix(mix(hash3(i + vec3(0,0,1)), hash3(i + vec3(1,0,1)), f.x),
                    mix(hash3(i + vec3(0,1,1)), hash3(i + vec3(1,1,1)), f.x), f.y),
                f.z
              );
              return n;
            }
            
            // FBM for terrain
            float fbm(vec2 p) {
              float value = 0.0;
              float amplitude = 0.5;
              for(int i = 0; i < 5; i++) {
                value += amplitude * noise(p);
                p *= 2.0;
                amplitude *= 0.5;
              }
              return value;
            }
            
            // City lights pattern
            float cityLights(vec3 pos, float landMask) {
              if(landMask < 0.3) return 0.0;
              
              // Multiple scales for city distribution
              float cities = 0.0;
              
              // Large cities (fewer, brighter)
              float largeCity = noise(pos.xz * 15.0) * noise(pos.xy * 12.0);
              largeCity = pow(max(largeCity - 0.4, 0.0) * 2.5, 2.0);
              cities += largeCity * 1.5;
              
              // Medium cities
              float medCity = noise(pos.xz * 30.0) * noise(pos.zy * 25.0);
              medCity = pow(max(medCity - 0.45, 0.0) * 3.0, 2.0);
              cities += medCity * 0.8;
              
              // Small towns and roads
              float smallTown = noise(pos.xz * 60.0) * noise(pos.xy * 50.0);
              smallTown = pow(max(smallTown - 0.5, 0.0) * 4.0, 2.0);
              cities += smallTown * 0.4;
              
              // Coastal concentration
              float coastalBonus = smoothstep(0.3, 0.5, landMask) * (1.0 - smoothstep(0.5, 0.8, landMask));
              cities *= 1.0 + coastalBonus * 0.5;
              
              return cities * landMask;
            }
            
            void main() {
              // Fresnel for rim lighting
              float fresnel = pow(1.0 - abs(dot(vNormal, vec3(0.0, 0.0, 1.0))), 2.0);
              
              // Spherical coordinates
              float lat = asin(vPosition.y / 3.0);
              float lon = atan(vPosition.z, vPosition.x);
              vec2 sphereCoord = vec2(lon / 3.14159 * 0.5 + 0.5, lat / 3.14159 + 0.5);
              
              // Generate terrain
              float terrain = fbm(sphereCoord * 8.0 + vec2(1.5, 0.8));
              float detail = fbm(sphereCoord * 20.0);
              float landMask = smoothstep(0.35, 0.5, terrain + detail * 0.2);
              
              // Ice caps
              float iceCap = smoothstep(0.75, 0.9, abs(lat / 1.57));
              
              // Ocean colors - deep realistic blue
              vec3 deepOcean = vec3(0.01, 0.03, 0.08);
              vec3 shallowOcean = vec3(0.02, 0.08, 0.18);
              vec3 oceanColor = mix(deepOcean, shallowOcean, fresnel * 0.3);
              
              // Add ocean specular
              float oceanSpec = pow(max(dot(reflect(-sunDirection, vWorldNormal), vec3(0,0,1)), 0.0), 20.0);
              oceanColor += vec3(0.1, 0.15, 0.2) * oceanSpec * (1.0 - landMask);
              
              // Land colors
              vec3 forest = vec3(0.02, 0.08, 0.02);
              vec3 grassland = vec3(0.06, 0.12, 0.04);
              vec3 desert = vec3(0.15, 0.12, 0.08);
              vec3 mountain = vec3(0.08, 0.07, 0.06);
              vec3 snow = vec3(0.9, 0.92, 0.95);
              
              // Biome selection based on latitude and noise
              float biomeNoise = noise(sphereCoord * 15.0);
              float latFactor = abs(lat);
              vec3 landColor = mix(forest, grassland, biomeNoise);
              landColor = mix(landColor, desert, smoothstep(0.2, 0.5, latFactor) * (1.0 - biomeNoise));
              landColor = mix(landColor, mountain, smoothstep(0.6, 0.8, terrain));
              landColor = mix(landColor, snow, iceCap);
              
              // Combine ocean and land
              vec3 surfaceColor = mix(oceanColor, landColor, landMask);
              
              // Cloud layer - wispy and realistic
              float cloudNoise1 = noise3D(vPosition * 2.0 + vec3(time * 0.01, 0, 0));
              float cloudNoise2 = noise3D(vPosition * 4.0 + vec3(0, time * 0.015, 0));
              float clouds = cloudNoise1 * cloudNoise2;
              clouds = smoothstep(0.2, 0.5, clouds);
              vec3 cloudColor = vec3(0.95, 0.97, 1.0);
              
              // Day/night calculation
              float daylight = dot(vWorldNormal, sunDirection);
              float dayMask = smoothstep(-0.1, 0.2, daylight);
              
              // Lighting
              float ambient = 0.08;
              float diffuse = max(daylight, 0.0);
              
              // Day side
              vec3 dayColor = surfaceColor * (ambient + diffuse * 0.9);
              dayColor = mix(dayColor, cloudColor, clouds * 0.7 * dayMask);
              
              // Night side with city lights
              vec3 nightBase = surfaceColor * 0.02;
              
              // City lights - golden/orange glow
              float cities = cityLights(vPosition, landMask);
              vec3 cityGlow = vec3(1.0, 0.8, 0.4) * cities * 2.0;
              
              // Add twinkling effect
              float twinkle = noise(vPosition.xz * 100.0 + time * 2.0);
              cityGlow *= 0.7 + twinkle * 0.3;
              
              // Bloom effect for cities
              float cityBloom = cities * 0.3;
              cityGlow += vec3(1.0, 0.6, 0.2) * cityBloom;
              
              vec3 nightColor = nightBase + cityGlow;
              
              // Blend day and night
              vec3 finalColor = mix(nightColor, dayColor, dayMask);
              
              // Atmospheric rim glow - stronger blue
              vec3 atmosphereDay = vec3(0.4, 0.7, 1.0);
              vec3 atmosphereNight = vec3(0.1, 0.2, 0.4);
              vec3 atmosphere = mix(atmosphereNight, atmosphereDay, dayMask);
              finalColor += atmosphere * fresnel * 0.5;
              
              // Terminator glow (sunrise/sunset)
              float terminator = 1.0 - abs(daylight);
              terminator = pow(terminator, 8.0) * smoothstep(-0.2, 0.1, daylight);
              finalColor += vec3(1.0, 0.4, 0.2) * terminator * 0.3;
              
              gl_FragColor = vec4(finalColor, 1.0);
            }
          `,
          transparent: false,
          side: THREE.FrontSide,
        });

        const globe = new THREE.Mesh(globeGeometry, globeMaterial);
        globe.position.y = -3.2;
        globe.rotation.x = 0.1;
        scene.add(globe);

        // Inner atmosphere
        const innerAtmoGeometry = new THREE.SphereGeometry(3.02, 64, 64);
        const innerAtmoMaterial = new THREE.ShaderMaterial({
          uniforms: {
            sunDirection: { value: new THREE.Vector3(0.6, 0.3, 0.8).normalize() },
          },
          vertexShader: `
            varying vec3 vNormal;
            varying vec3 vWorldNormal;
            void main() {
              vNormal = normalize(normalMatrix * normal);
              vWorldNormal = normalize((modelMatrix * vec4(normal, 0.0)).xyz);
              gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
            }
          `,
          fragmentShader: `
            varying vec3 vNormal;
            varying vec3 vWorldNormal;
            uniform vec3 sunDirection;
            
            void main() {
              float fresnel = pow(1.0 - abs(dot(vNormal, vec3(0.0, 0.0, 1.0))), 5.0);
              float daylight = max(dot(vWorldNormal, sunDirection), 0.0);
              vec3 glowColor = mix(vec3(0.1, 0.2, 0.5), vec3(0.3, 0.6, 1.0), daylight);
              gl_FragColor = vec4(glowColor, fresnel * 0.4);
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

        // Outer atmosphere glow
        const outerAtmoGeometry = new THREE.SphereGeometry(3.3, 64, 64);
        const outerAtmoMaterial = new THREE.ShaderMaterial({
          uniforms: {
            sunDirection: { value: new THREE.Vector3(0.6, 0.3, 0.8).normalize() },
          },
          vertexShader: `
            varying vec3 vNormal;
            varying vec3 vViewPosition;
            varying vec3 vWorldNormal;
            void main() {
              vNormal = normalize(normalMatrix * normal);
              vWorldNormal = normalize((modelMatrix * vec4(normal, 0.0)).xyz);
              vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
              vViewPosition = -mvPosition.xyz;
              gl_Position = projectionMatrix * mvPosition;
            }
          `,
          fragmentShader: `
            varying vec3 vNormal;
            varying vec3 vViewPosition;
            varying vec3 vWorldNormal;
            uniform vec3 sunDirection;
            
            void main() {
              vec3 viewDir = normalize(vViewPosition);
              float fresnel = pow(1.0 - abs(dot(vNormal, viewDir)), 3.0);
              float daylight = max(dot(vWorldNormal, sunDirection) + 0.3, 0.0);
              
              vec3 dayGlow = vec3(0.4, 0.7, 1.0);
              vec3 nightGlow = vec3(0.05, 0.1, 0.2);
              vec3 glowColor = mix(nightGlow, dayGlow, daylight);
              
              gl_FragColor = vec4(glowColor * 1.5, fresnel * 0.6);
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

        // Ambient light
        const ambientLight = new THREE.AmbientLight(0x112233, 0.2);
        scene.add(ambientLight);

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
          
          time += 0.008;
          if (globeMaterial.uniforms) {
            globeMaterial.uniforms.time.value = time;
          }

          if (!isInteractingRef.current) {
            globeState.rotationY += 0.0008;
          }

          globe.rotation.y = globeState.rotationY;
          innerAtmo.rotation.y = globeState.rotationY;
          outerAtmo.rotation.y = globeState.rotationY * 0.5;
          
          const s = globeState.scale;
          globe.scale.set(s, s, s);
          innerAtmo.scale.set(s, s, s);
          outerAtmo.scale.set(s, s, s);
          
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
