import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { reviews } from '../data/reviews.js';

const PALETTE = [
  { background: '#F2F1ED', ink: '#121417', star: '#F2A900', chip: '#B4FF00', chipInk: '#121417' },
  { background: '#B4FF00', ink: '#121417', star: '#121417', chip: '#121417', chipInk: '#FFFFFF' },
  { background: '#2B254B', ink: '#FFFFFF', star: '#B4FF00', chip: '#B4FF00', chipInk: '#121417' },
  { background: '#F2ECDE', ink: '#121417', star: '#F2A900', chip: '#2B254B', chipInk: '#FFFFFF' },
  { background: '#1C2227', ink: '#EEEEEE', star: '#B4FF00', chip: '#B4FF00', chipInk: '#121417' },
  { background: '#C62420', ink: '#FFFFFF', star: '#FFFFFF', chip: '#121417', chipInk: '#FFFFFF' },
  { background: '#E7E7E7', ink: '#121417', star: '#F2A900', chip: '#B4FF00', chipInk: '#121417' },
  { background: '#121417', ink: '#FFFFFF', star: '#B4FF00', chip: '#B4FF00', chipInk: '#121417' },
];
const PALETTE_ORDER = [0, 2, 1, 4, 6, 5, 3, 7, 1, 0];
const BOOK_COUNT = 10;
const STEP_X = -1.3;
const STEP_Z = -0.36;

const clamp = (value, min, max) => Math.min(max, Math.max(min, value));

function hexToRgb(hex) {
  return {
    r: parseInt(hex.slice(1, 3), 16),
    g: parseInt(hex.slice(3, 5), 16),
    b: parseInt(hex.slice(5, 7), 16),
  };
}

function shade(hex, amount) {
  const { r, g, b } = hexToRgb(hex);
  return new THREE.Color((r / 255) * amount, (g / 255) * amount, (b / 255) * amount);
}

function wrapText(context, text, maxWidth) {
  const words = text.split(/\s+/);
  const lines = [];
  let line = '';

  words.forEach((word) => {
    const candidate = line ? `${line} ${word}` : word;
    if (line && context.measureText(candidate).width > maxWidth) {
      lines.push(line);
      line = word;
    } else {
      line = candidate;
    }
  });
  if (line) lines.push(line);
  return lines;
}

function drawStar(context, centerX, centerY, radius) {
  context.beginPath();
  for (let point = 0; point < 10; point += 1) {
    const pointRadius = point % 2 === 0 ? radius : radius * 0.44;
    const angle = -Math.PI / 2 + point * Math.PI / 5;
    const x = centerX + Math.cos(angle) * pointRadius;
    const y = centerY + Math.sin(angle) * pointRadius;
    if (point === 0) context.moveTo(x, y);
    else context.lineTo(x, y);
  }
  context.closePath();
  context.fill();
}

function getInitials(name) {
  return name.split(/\s+/).map((part) => part.replace(/[^\p{L}]/gu, '')[0] || '').join('').slice(0, 2).toUpperCase();
}

function drawCover(review, n) {
  const canvas = document.createElement('canvas');
  canvas.width = 640;
  canvas.height = 960;
  const context = canvas.getContext('2d');
  if (!context) throw new Error('Unable to create a 2D context for a review cover.');

  const { background, ink, star, chip, chipInk } = PALETTE[PALETTE_ORDER[n]];
  let photoDisposed = false;
  let image;

  const drawAvatar = () => {
    context.fillStyle = '#D8D8D8';
    context.fillRect(36, 36, 568, 430);
    context.fillStyle = chip;
    context.beginPath();
    context.arc(320, 251, 132, 0, Math.PI * 2);
    context.fill();
    context.fillStyle = chipInk;
    context.font = '700 120px Inter';
    context.textAlign = 'center';
    context.textBaseline = 'middle';
    context.fillText(getInitials(review.name), 320, 251);
  };

  const drawPhoto = (photo) => {
    context.fillStyle = background;
    context.fillRect(0, 0, 640, 960);
    context.save();
    context.beginPath();
    context.roundRect(36, 36, 568, 430, 24);
    context.clip();
    if (photo) {
      const scale = Math.max(568 / photo.naturalWidth, 430 / photo.naturalHeight);
      const width = photo.naturalWidth * scale;
      const height = photo.naturalHeight * scale;
      context.drawImage(photo, 36 + (568 - width) / 2, 36 + (430 - height) / 2, width, height);
    } else {
      drawAvatar();
    }
    context.restore();

    const chipText = review.placeholder ? 'SAMPLE REVIEW' : 'VERIFIED CUSTOMER';
    context.font = '600 16px Inter';
    context.letterSpacing = '.1em';
    const chipWidth = context.measureText(chipText).width + 32;
    context.fillStyle = chip;
    context.beginPath();
    context.roundRect(56, 416, chipWidth, 34, 17);
    context.fill();
    context.fillStyle = chipInk;
    context.textAlign = 'left';
    context.textBaseline = 'middle';
    context.fillText(chipText, 72, 433);
    context.letterSpacing = '0';

    for (let index = 0; index < 5; index += 1) {
      context.globalAlpha = index < review.rating ? 1 : 0.25;
      context.fillStyle = index < review.rating ? star : ink;
      drawStar(context, 56 + index * 48, 526, 20);
    }
    context.globalAlpha = 1;
    context.fillStyle = ink;
    context.font = '600 28px Inter';
    context.textAlign = 'right';
    context.textBaseline = 'middle';
    context.fillText(review.rating.toFixed(1), 604, 526);

    const quotedReview = `“${review.quote}”`;
    let quoteLines;
    let quoteSize;
    let quoteLineHeight;
    for (const [size, lineHeight] of [[44, 52], [40, 48], [36, 44]]) {
      context.font = `400 ${size}px "Libre Caslon Display"`;
      const lines = wrapText(context, quotedReview, 568);
      if (lines.length <= 5) {
        quoteLines = lines;
        quoteSize = size;
        quoteLineHeight = lineHeight;
        break;
      }
    }
    if (!quoteLines) throw new Error(`Review quote for ${review.name} does not fit on its cover.`);
    context.fillStyle = ink;
    context.font = `400 ${quoteSize}px "Libre Caslon Display"`;
    context.textAlign = 'left';
    context.textBaseline = 'top';
    quoteLines.forEach((line, index) => context.fillText(line, 36, 596 + index * quoteLineHeight, 568));

    context.globalAlpha = 0.3;
    context.fillStyle = ink;
    context.fillRect(36, 880, 568, 1.5);
    context.globalAlpha = 1;
    context.fillStyle = ink;
    context.font = '600 24px Inter';
    context.letterSpacing = '.12em';
    context.textBaseline = 'alphabetic';
    context.fillText(review.name.toUpperCase(), 36, 914);
    context.letterSpacing = '0';
    context.globalAlpha = 0.7;
    context.font = '400 20px Inter';
    context.fillText(review.role, 36, 942);
    context.globalAlpha = 1;
  };

  context.fillStyle = background;
  context.fillRect(0, 0, 640, 960);
  drawPhoto(null);
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.generateMipmaps = true;
  texture.minFilter = THREE.LinearMipmapLinearFilter;
  texture.magFilter = THREE.LinearFilter;
  texture.needsUpdate = true;
  image = new Image();
  image.crossOrigin = 'anonymous';
  image.decoding = 'async';
  image.onload = () => {
    if (photoDisposed) return;
    drawPhoto(image);
    texture.needsUpdate = true;
  };
  image.onerror = () => {
    if (photoDisposed) return;
    console.warn(`Reviewer photo unavailable for ${review.name}; using initials avatar.`);
  };
  image.src = review.photo;
  return {
    texture,
    background,
    cleanup: () => {
      photoDisposed = true;
      image.onload = null;
      image.onerror = null;
    },
  };
}

function createPageTexture(vertical = false) {
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 256;
  const context = canvas.getContext('2d');
  if (!context) throw new Error('Unable to create a 2D context for book pages.');
  context.fillStyle = '#EFE7D6';
  context.fillRect(0, 0, 256, 256);
  context.strokeStyle = 'rgba(92, 63, 37, .12)';
  context.lineWidth = 1;
  for (let position = 1; position < 256; position += 2) {
    context.beginPath();
    if (vertical) {
      context.moveTo(position, 0);
      context.lineTo(position, 256);
    } else {
      context.moveTo(0, position);
      context.lineTo(256, position);
    }
    context.stroke();
  }
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.generateMipmaps = true;
  texture.minFilter = THREE.LinearMipmapLinearFilter;
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  return texture;
}

export default function ReviewsBooks({ inView, reducedMotion }) {
  const canvasRef = useRef(null);
  const inViewRef = useRef(inView);
  const reducedMotionRef = useRef(reducedMotion);
  inViewRef.current = inView;
  reducedMotionRef.current = reducedMotion;

  useEffect(() => {
    const canvas = canvasRef.current;
    const section = canvas?.closest('.reviews-section');
    if (!canvas || !section) return undefined;

    let disposed = false;
    let initialized = false;
    let frameId = 0;
    let running = false;
    let lastTime = 0;
    let elapsed = 0;
    let lastActivity = performance.now() / 1000;
    let pointerInside = false;
    let blurred = false;
    let pointerX = 0;
    let pointerY = 0;
    let renderer;
    let scene;
    let camera;
    let bookGeometry;
    let pageTexture;
    let pageSideTexture;
    let environment;
    let pmrem;
    let books = [];
    const rayPoint = new THREE.Vector3(0, 0.1, 0);
    const projectedPoint = new THREE.Vector3();
    const lookAt = new THREE.Vector3(-0.9, -0.9, -0.9);
    const baseCameraPosition = new THREE.Vector3(7.26, 1.5, 10.46);

    const onPointerMove = (event) => {
      const rect = section.getBoundingClientRect();
      pointerX = event.clientX - rect.left;
      pointerY = event.clientY - rect.top;
      pointerInside = pointerX >= 0 && pointerX <= rect.width && pointerY >= 0 && pointerY <= rect.height;
      lastActivity = performance.now() / 1000;
    };
    const onWindowBlur = () => { blurred = true; };
    const onWindowFocus = () => { blurred = false; };

    const resize = () => {
      if (disposed || !renderer || !camera) return;
      const rect = section.getBoundingClientRect();
      const width = rect.width;
      const height = rect.height;
      if (!width || !height) return;
      renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
      renderer.setSize(width, height, false);
      const aspect = width / height;
      camera.aspect = aspect;
      camera.fov = width < height ? 40 : 19.5;
      camera.updateProjectionMatrix();
      const distanceScale = aspect < 1.6 ? 1 + (1.6 - aspect) * 0.5 : 1;
      camera.position.copy(baseCameraPosition).sub(lookAt).multiplyScalar(distanceScale).add(lookAt);
      camera.lookAt(lookAt);
      if (reducedMotionRef.current && initialized && inViewRef.current && !document.hidden) renderer.render(scene, camera);
    };

    const dispose = () => {
      disposed = true;
      if (frameId) window.cancelAnimationFrame(frameId);
      window.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('blur', onWindowBlur);
      window.removeEventListener('focus', onWindowFocus);
      window.removeEventListener('resize', resize);
      document.removeEventListener('visibilitychange', updateLoop);
      section.removeEventListener('reviews-view-change', updateLoop);
      section.removeEventListener('reviews-motion-change', updateMotion);
      resizeObserver.disconnect();

      if (bookGeometry) bookGeometry.dispose();
      books.forEach((book) => {
        book.photoCleanup();
        book.materials.forEach((material) => material.dispose());
        book.coverTexture.dispose();
      });
      pageTexture?.dispose();
      pageSideTexture?.dispose();
      environment?.dispose();
      pmrem?.dispose();
      renderer?.dispose();
    };

    const resizeObserver = new ResizeObserver(resize);
    resizeObserver.observe(section);
    window.addEventListener('resize', resize, { passive: true });
    window.addEventListener('pointermove', onPointerMove, { passive: true });
    window.addEventListener('blur', onWindowBlur);
    window.addEventListener('focus', onWindowFocus);
    document.addEventListener('visibilitychange', updateLoop);
    section.addEventListener('reviews-view-change', updateLoop);
    section.addEventListener('reviews-motion-change', updateMotion);

    function updateLoop() {
      if (disposed || !initialized) return;
      const shouldRun = inViewRef.current && !document.hidden && !reducedMotionRef.current;
      if (shouldRun && !running) {
        running = true;
        lastTime = performance.now();
        frameId = window.requestAnimationFrame(render);
      } else if (!shouldRun && running) {
        running = false;
        window.cancelAnimationFrame(frameId);
        frameId = 0;
      }
      if (inViewRef.current && !document.hidden && reducedMotionRef.current) renderer.render(scene, camera);
    }

    function updateMotion() {
      if (!initialized) return;
      if (reducedMotionRef.current) {
        running = false;
        if (frameId) window.cancelAnimationFrame(frameId);
        frameId = 0;
        books.forEach((book) => {
          book.y = 0;
          book.z = 0;
          book.vy = 0;
          book.vz = 0;
          book.mesh.position.set(0, 0, 0);
          book.mesh.rotation.set(0, 0, 0);
        });
        updateLoop();
        return;
      }

      elapsed = 0;
      books.forEach((book) => {
        book.y = -3;
        book.z = 0;
        book.vy = 0;
        book.vz = 0;
        book.mesh.position.set(0, -3, 0);
        book.mesh.rotation.set(0, 0, 0);
      });
      updateLoop();
    }

    function render(now) {
      if (disposed || !running || !renderer || !camera || !scene) return;
      const dt = Math.min(Math.max(0, (now - lastTime) / 1000), 0.05);
      lastTime = now;
      elapsed += dt;
      const h = dt / 4;
      const rect = section.getBoundingClientRect();

      if (!reducedMotionRef.current) {
        scene.updateMatrixWorld(true);
        const projectedBooks = books.map((book) => {
          projectedPoint.copy(rayPoint).applyMatrix4(book.mesh.matrixWorld).project(camera);
          return {
            x: (projectedPoint.x * 0.5 + 0.5) * rect.width,
            y: (-projectedPoint.y * 0.5 + 0.5) * rect.height,
          };
        });

        const idle = performance.now() / 1000 - lastActivity >= 4;
        const coarsePointer = window.matchMedia('(pointer: coarse)').matches;
        let px = pointerX;
        let py = pointerY;
        let hasPointer = pointerInside && !blurred;
        if (coarsePointer || idle) {
          const from = projectedBooks[7];
          const to = projectedBooks[1];
          const u = (Math.sin(elapsed * 0.45) + 1) / 2;
          px = from.x + (to.x - from.x) * u;
          py = from.y + (to.y - from.y) * u;
          hasPointer = !blurred;
        }

        const influenceScale = Math.max(rect.width, rect.height) * 0.11;
        books.forEach((book, index) => {
          const introDelay = 0.25 + (BOOK_COUNT - index) * 0.11;
          const introReady = elapsed > introDelay;
          const point = projectedBooks[index];
          const dx = point.x - px;
          const dy = (point.y - py) * 0.55;
          const influence = hasPointer
            ? Math.exp(-((dx * dx + dy * dy) / (influenceScale * influenceScale)))
            : 0;
          const lift = 0.78 * influence;
          book.ty = introReady ? lift : -3;
          book.tz = introReady ? lift * 0.35 : 0;

          for (let step = 0; step < 4; step += 1) {
            book.vy += ((book.ty - book.y) * 70 - book.vy * 12.5) * h;
            book.y += book.vy * h;
            book.vz += ((book.tz - book.z) * 70 - book.vz * 12.5) * h;
            book.z += book.vz * h;
          }
          book.vy = clamp(book.vy, -8, 8);
          book.vz = clamp(book.vz, -8, 8);
          book.mesh.position.set(0, book.y, book.z);
          book.mesh.rotation.x = clamp(-book.vy * 0.012, -0.12, 0.12);
        });
      }

      renderer.render(scene, camera);
      frameId = window.requestAnimationFrame(render);
    }

    async function initialize() {
      const fontFaces = [
        '400 44px Libre Caslon Display',
        '600 24px Inter',
        '400 20px Inter',
        '700 120px Inter',
      ];
      if (document.fonts) {
        await Promise.all(fontFaces.map((font) => document.fonts.load(font)));
      }
      if (disposed) return;

      renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true, powerPreference: 'high-performance' });
      renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
      renderer.outputColorSpace = THREE.SRGBColorSpace;
      renderer.toneMapping = THREE.ACESFilmicToneMapping;
      renderer.toneMappingExposure = 1.05;
      renderer.setClearColor(0x000000, 0);

      scene = new THREE.Scene();
      scene.environmentIntensity = 0.55;
      pmrem = new THREE.PMREMGenerator(renderer);
      const room = new RoomEnvironment();
      environment = pmrem.fromScene(room, 0.04).texture;
      room.dispose();
      scene.environment = environment;

      const keyLight = new THREE.DirectionalLight(0xfff3e4, 2.0);
      keyLight.position.set(-4, 6, 6);
      scene.add(keyLight);
      const rimLight = new THREE.DirectionalLight(0xbfd2ff, 1.1);
      rimLight.position.set(6, 3, -4);
      scene.add(rimLight);
      scene.add(new THREE.AmbientLight(0xffffff, 0.12));

      camera = new THREE.PerspectiveCamera(19.5, 1, 0.1, 100);
      resize();
      bookGeometry = new THREE.BoxGeometry(1, 1.5, 0.2);
      pageTexture = createPageTexture(false);
      pageSideTexture = createPageTexture(true);
      pageTexture.anisotropy = renderer.capabilities.getMaxAnisotropy();
      pageSideTexture.anisotropy = renderer.capabilities.getMaxAnisotropy();

      if (reviews.length !== BOOK_COUNT) {
        throw new Error(`Expected ${BOOK_COUNT} review records, found ${reviews.length}.`);
      }
      reviews.forEach((review, index) => {
        const { texture, background, cleanup } = drawCover(review, index);
        texture.anisotropy = renderer.capabilities.getMaxAnisotropy();
        const spineColor = shade(background, 0.62);
        const foreEdge = new THREE.MeshStandardMaterial({ map: pageTexture, roughness: 0.9 });
        const spine = new THREE.MeshPhysicalMaterial({ color: spineColor, roughness: 0.55, clearcoat: 0.3 });
        const pagesTop = new THREE.MeshStandardMaterial({ map: pageSideTexture, roughness: 0.9 });
        const pagesBottom = new THREE.MeshStandardMaterial({ map: pageSideTexture, roughness: 0.9 });
        const cover = new THREE.MeshPhysicalMaterial({ map: texture, roughness: 0.42, clearcoat: 0.35, clearcoatRoughness: 0.35 });
        const back = new THREE.MeshStandardMaterial({ color: spineColor, roughness: 0.6 });
        const materials = [foreEdge, spine, pagesTop, pagesBottom, cover, back];

        const group = new THREE.Group();
        group.position.set(1.55 + index * STEP_X, -1.12, 0.9 + index * STEP_Z);
        group.rotation.y = 0.32;
        const mesh = new THREE.Mesh(bookGeometry, materials);
        mesh.position.set(0, reducedMotionRef.current ? 0 : -3, 0);
        group.add(mesh);
        scene.add(group);
        books.push({
          group,
          mesh,
          materials,
          coverTexture: texture,
          photoCleanup: cleanup,
          review,
          y: reducedMotionRef.current ? 0 : -3,
          z: 0,
          vy: 0,
          vz: 0,
          ty: 0,
          tz: 0,
        });
      });

      initialized = true;
      updateLoop();
    }

    initialize().catch((error) => {
      if (!disposed) {
        dispose();
        throw error;
      }
    });

    return () => {
      dispose();
    };
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    const section = canvas?.closest('.reviews-section');
    section?.dispatchEvent(new Event('reviews-motion-change'));
  }, [reducedMotion]);

  useEffect(() => {
    const canvas = canvasRef.current;
    const section = canvas?.closest('.reviews-section');
    section?.dispatchEvent(new Event('reviews-view-change'));
  }, [inView]);

  return <canvas ref={canvasRef} className="reviews-canvas" aria-label="Customer review books" />;
}
