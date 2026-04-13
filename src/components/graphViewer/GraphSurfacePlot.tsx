import type { ReactElement } from 'react';
import { forwardRef, useEffect, useImperativeHandle, useMemo, useRef, useSyncExternalStore } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import type { GraphMetric, ParsedGraphFile } from '../../types/graphViewer';

export type GraphSurfacePlotHandle = {
  resetView: () => void;
  downloadImage: () => Promise<void>;
};

type GraphSurfacePlotProps = {
  graphData: ParsedGraphFile;
  metric: GraphMetric;
  onRenderStateChange?: (isRendering: boolean) => void;
};

const COLORSCALE: Array<[number, THREE.Color]> = [
  [0, new THREE.Color('#1e3a5f')],
  [0.15, new THREE.Color('#2563eb')],
  [0.35, new THREE.Color('#38bdf8')],
  [0.5, new THREE.Color('#4ade80')],
  [0.65, new THREE.Color('#facc15')],
  [0.8, new THREE.Color('#f97316')],
  [1, new THREE.Color('#dc2626')],
];

function sampleColorscale(t: number): THREE.Color {
  const clamped = Math.max(0, Math.min(1, t));
  for (let i = 1; i < COLORSCALE.length; i++) {
    const [prevStop, prevColor] = COLORSCALE[i - 1];
    const [currStop, currColor] = COLORSCALE[i];
    if (clamped <= currStop) {
      const ratio = (clamped - prevStop) / (currStop - prevStop);
      return new THREE.Color().lerpColors(prevColor, currColor, ratio);
    }
  }
  return COLORSCALE[COLORSCALE.length - 1][1].clone();
}

function getThemeSnapshot(): string {
  return document.documentElement.getAttribute('data-theme') ?? 'light';
}

function subscribeTheme(callback: () => void): () => void {
  const observer = new MutationObserver(callback);
  observer.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });
  return () => observer.disconnect();
}

export const GraphSurfacePlot = forwardRef<GraphSurfacePlotHandle, GraphSurfacePlotProps>(
  function GraphSurfacePlot({ graphData, metric, onRenderStateChange }, ref): ReactElement {
    const theme = useSyncExternalStore(subscribeTheme, getThemeSnapshot);
    const isDark = theme === 'dark';
    const containerRef = useRef<HTMLDivElement | null>(null);
    const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
    const sceneRef = useRef<THREE.Scene | null>(null);
    const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
    const controlsRef = useRef<OrbitControls | null>(null);
    const frameRef = useRef<number>(0);
    const onRenderStateChangeRef = useRef(onRenderStateChange);
    onRenderStateChangeRef.current = onRenderStateChange;

    const metricGrid = graphData.zValues[metric];

    const geometry = useMemo(() => {
      const numericValues = metricGrid.flat().filter((v) => Number.isFinite(v));
      const minValue = Math.min(...numericValues);
      const maxValue = Math.max(...numericValues);
      const valueRange = Math.max(maxValue - minValue, 1);
      const baseRadius = valueRange * 0.9;
      const rows = metricGrid.length;
      const cols = metricGrid[0]?.length ?? 0;

      // Build vertices + colors
      const positions: number[] = [];
      const colors: number[] = [];
      const indices: number[] = [];

      for (let row = 0; row < rows; row++) {
        for (let col = 0; col < cols; col++) {
          const value = metricGrid[row][col];
          const theta = (graphData.thetaGrid[row][col] * Math.PI) / 180;
          const phi = (graphData.phiGrid[row][col] * Math.PI) / 180;
          const radius = baseRadius + (value - minValue);

          const x = radius * Math.sin(theta) * Math.cos(phi);
          const y = radius * Math.cos(theta);
          const z = radius * Math.sin(theta) * Math.sin(phi);

          positions.push(x, y, z);

          const t = (value - minValue) / valueRange;
          const color = sampleColorscale(t);
          colors.push(color.r, color.g, color.b);
        }
      }

      // Build triangles
      for (let row = 0; row < rows - 1; row++) {
        for (let col = 0; col < cols - 1; col++) {
          const a = row * cols + col;
          const b = row * cols + col + 1;
          const c = (row + 1) * cols + col;
          const d = (row + 1) * cols + col + 1;
          indices.push(a, b, d);
          indices.push(a, d, c);
        }
      }

      // Build wireframe lines (theta rings + phi meridians)
      // Each line segment = 2 vertices (start, end) for LineSegments
      const wirePositions: number[] = [];

      const v = (row: number, col: number): [number, number, number] => {
        const i = (row * cols + col) * 3;
        return [positions[i], positions[i + 1], positions[i + 2]];
      };

      // Theta rings — every row (latitude circles)
      for (let row = 0; row < rows; row++) {
        for (let col = 0; col < cols; col++) {
          const nextCol = (col + 1) % cols;
          const [ax, ay, az] = v(row, col);
          const [bx, by, bz] = v(row, nextCol);
          wirePositions.push(ax, ay, az, bx, by, bz);
        }
      }

      // Phi meridians — every ~15 degrees (longitude lines)
      const meridianStep = Math.max(1, Math.round(cols / 24));
      for (let col = 0; col < cols; col += meridianStep) {
        for (let row = 0; row < rows - 1; row++) {
          const [ax, ay, az] = v(row, col);
          const [bx, by, bz] = v(row + 1, col);
          wirePositions.push(ax, ay, az, bx, by, bz);
        }
      }

      // Compute bounding radius for camera positioning
      let maxRadius = 0;
      for (let i = 0; i < positions.length; i += 3) {
        const r = Math.sqrt(positions[i] ** 2 + positions[i + 1] ** 2 + positions[i + 2] ** 2);
        if (r > maxRadius) maxRadius = r;
      }

      return { positions, colors, indices, wirePositions, minValue, maxValue, maxRadius };
    }, [graphData.phiGrid, graphData.thetaGrid, metricGrid]);

    // Setup scene
    useEffect(() => {
      const container = containerRef.current;
      if (!container) return;

      onRenderStateChangeRef.current?.(true);

      // Renderer
      const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
      renderer.setPixelRatio(window.devicePixelRatio);
      renderer.setSize(container.clientWidth, container.clientHeight);
      container.appendChild(renderer.domElement);
      rendererRef.current = renderer;

      // Scene
      const scene = new THREE.Scene();
      sceneRef.current = scene;

      // Camera
      const camera = new THREE.PerspectiveCamera(
        45,
        container.clientWidth / container.clientHeight,
        0.1,
        geometry.maxRadius * 20,
      );
      // Fit bounding sphere into canvas
      const aspect = container.clientWidth / container.clientHeight;
      const fovRad = THREE.MathUtils.degToRad(45);
      const effectiveFov = aspect < 1 ? 2 * Math.atan(Math.tan(fovRad / 2) * aspect) : fovRad;
      const fitDist = geometry.maxRadius / Math.sin(effectiveFov / 2);
      const camDist = fitDist * 1.05;
      camera.position.set(camDist * 0.65, camDist * 0.45, camDist * 0.55);
      camera.lookAt(0, 0, 0);
      cameraRef.current = camera;

      // Controls
      const controls = new OrbitControls(camera, renderer.domElement);
      controls.enableDamping = true;
      controls.dampingFactor = 0.08;
      controls.rotateSpeed = 0.8;
      controls.zoomSpeed = 1.0;
      controls.panSpeed = 0.6;
      controls.enablePan = true;
      controlsRef.current = controls;

      // Lighting — scaled by theme
      const ld = geometry.maxRadius * 2;
      const ambientIntensity = isDark ? 2.0 : 3.0;
      const dirIntensity = isDark ? 0.3 : 0.5;
      const ambientLight = new THREE.AmbientLight(0xffffff, ambientIntensity);
      scene.add(ambientLight);

      const lightPositions: [number, number, number][] = [
        [ld, ld, ld],
        [-ld, ld, -ld],
        [ld, -ld, -ld],
        [-ld, -ld, ld],
        [0, ld * 1.5, 0],
        [0, -ld * 1.5, 0],
      ];

      for (const pos of lightPositions) {
        const light = new THREE.DirectionalLight(0xffffff, dirIntensity);
        light.position.set(...pos);
        scene.add(light);
      }

      // Surface mesh
      const surfaceGeom = new THREE.BufferGeometry();
      surfaceGeom.setAttribute('position', new THREE.Float32BufferAttribute(geometry.positions, 3));
      surfaceGeom.setAttribute('color', new THREE.Float32BufferAttribute(geometry.colors, 3));
      surfaceGeom.setIndex(geometry.indices);
      surfaceGeom.computeVertexNormals();

      const surfaceMat = new THREE.MeshLambertMaterial({
        vertexColors: true,
        side: THREE.DoubleSide,
      });

      const surfaceMesh = new THREE.Mesh(surfaceGeom, surfaceMat);
      scene.add(surfaceMesh);

      // Wireframe grid lines
      const wireGeom = new THREE.BufferGeometry();
      wireGeom.setAttribute('position', new THREE.Float32BufferAttribute(geometry.wirePositions, 3));

      const wireMat = new THREE.LineBasicMaterial({
        color: new THREE.Color(0x102040),
        opacity: 0.4,
        transparent: true,
        depthTest: true,
      });

      const wireLines = new THREE.LineSegments(wireGeom, wireMat);
      scene.add(wireLines);

      // Animation loop
      function animate(): void {
        frameRef.current = requestAnimationFrame(animate);
        controls.update();
        renderer.render(scene, camera);
      }
      frameRef.current = requestAnimationFrame(animate);

      // Resize
      const resizeObserver = new ResizeObserver(() => {
        const w = container.clientWidth;
        const h = container.clientHeight;
        if (w === 0 || h === 0) return;
        camera.aspect = w / h;
        camera.updateProjectionMatrix();
        renderer.setSize(w, h);
      });
      resizeObserver.observe(container);

      onRenderStateChangeRef.current?.(false);

      return () => {
        resizeObserver.disconnect();
        cancelAnimationFrame(frameRef.current);
        controls.dispose();
        renderer.dispose();
        surfaceGeom.dispose();
        surfaceMat.dispose();
        wireGeom.dispose();
        wireMat.dispose();
        if (container.contains(renderer.domElement)) {
          container.removeChild(renderer.domElement);
        }
        rendererRef.current = null;
        sceneRef.current = null;
        cameraRef.current = null;
        controlsRef.current = null;
      };
    }, [geometry, isDark]);

    // Update background on theme change
    useEffect(() => {
      const renderer = rendererRef.current;
      if (!renderer) return;
      if (isDark) {
        renderer.setClearColor(0x111111, 1);
      } else {
        renderer.setClearColor(0x000000, 0);
      }
    }, [isDark]);

    useImperativeHandle(ref, () => ({
      resetView: () => {
        const camera = cameraRef.current;
        const controls = controlsRef.current;
        const container = containerRef.current;
        if (!camera || !controls || !container) return;

        // Fit bounding sphere into canvas
        const aspect = container.clientWidth / container.clientHeight;
        const fovRad = THREE.MathUtils.degToRad(camera.fov);
        const effectiveFov = aspect < 1 ? 2 * Math.atan(Math.tan(fovRad / 2) * aspect) : fovRad;
        const fitDist = geometry.maxRadius / Math.sin(effectiveFov / 2);
        const camDist = fitDist * 1.05; // 5% breathing room

        camera.position.set(camDist * 0.65, camDist * 0.45, camDist * 0.55);
        camera.lookAt(0, 0, 0);
        controls.target.set(0, 0, 0);
        controls.update();
      },
      downloadImage: async () => {
        const renderer = rendererRef.current;
        const scene = sceneRef.current;
        const camera = cameraRef.current;
        if (!renderer || !scene || !camera) return;

        // Render at higher resolution
        const w = 1600;
        const h = 1200;
        const prevSize = renderer.getSize(new THREE.Vector2());
        renderer.setSize(w, h);
        camera.aspect = w / h;
        camera.updateProjectionMatrix();
        renderer.render(scene, camera);

        const dataUrl = renderer.domElement.toDataURL('image/png');

        // Restore original size
        renderer.setSize(prevSize.x, prevSize.y);
        camera.aspect = prevSize.x / prevSize.y;
        camera.updateProjectionMatrix();

        const anchor = document.createElement('a');
        anchor.href = dataUrl;
        anchor.download = '3d-radiation-pattern.png';
        document.body.appendChild(anchor);
        anchor.click();
        document.body.removeChild(anchor);
      },
    }), []);

    return <div className="graph-surface-plot" ref={containerRef} />;
  },
);
