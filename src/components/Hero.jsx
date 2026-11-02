import React, { useEffect, useRef, useState } from 'react';
import { ArrowRight, ShieldCheck } from 'lucide-react';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';

const FRAME_COUNT = 299;
const FRAME_ROOT = '/frames';
const clamp = (value, min, max) => Math.min(max, Math.max(min, value));

export default function Hero() {
  const trackRef = useRef(null);
  const stageRef = useRef(null);
  const canvasRef = useRef(null);
  const progressRef = useRef(0);
  const chapterRef = useRef(0);
  const promptRef = useRef(null);
  const [chapter, setChapter] = useState(0);
  const [isTouch, setIsTouch] = useState(false);
  const reduceMotion = useReducedMotion();

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return undefined;
    const context = canvas.getContext('2d', { alpha: false });
    if (!context) return undefined;

    const frames = Array.from({ length: FRAME_COUNT }, () => new Image());
    const frameSources = Array.from({ length: FRAME_COUNT }, () => '');
    const phoneQuery = window.matchMedia('(max-width: 820px) and (orientation: portrait)');
    const tabletQuery = window.matchMedia('(max-width: 1280px)');
    const touchQuery = window.matchMedia('(pointer: coarse)');
    const readMode = () => (phoneQuery.matches ? 'phone' : tabletQuery.matches ? 'tablet' : 'desktop');
    let mode = readMode();
    let isTouchDevice = touchQuery.matches;
    let activeFrame = 0;
    let lastLoadedFrame = -1;
    let lastEvictionFrame = 0;
    let raf = 0;
    let width = 0;
    let height = 0;
    let trackTop = 0;
    let scrollRange = 1;
    let disposed = false;
    let measureTimer = 0;
    let idleCallback = 0;
    let idleTimer = 0;
    let pendingProgress = null;
    let isWithinHero = false;
    let hasPassedPreloadFrames = false;
    let lastRect = null;

    function load(index) {
      if (index < 0 || index >= FRAME_COUNT) return;
      const image = frames[index];
      const source = `${FRAME_ROOT}/${mode === 'phone' ? 'm' : mode === 'tablet' ? 't' : 'd'}/frame_${String(index + 1).padStart(4, '0')}.jpg`;
      if (frameSources[index] === source) {
        if (index === activeFrame) image.fetchPriority = 'high';
        return;
      }
      frameSources[index] = source;
      image.decoding = 'async';
      image.fetchPriority = index === activeFrame ? 'high' : 'low';
      image.onload = () => {
        if (index === activeFrame) draw();
      };
      image.onerror = () => {
        image.onload = null;
        console.error(`Failed to load hero frame ${index + 1}: ${source}`);
      };
      image.src = source;
    }

    function loadNear() {
      const lookAhead = mode === 'phone' ? 10 : 16;
      const keepMin = Math.max(0, activeFrame - 4);
      const keepMax = Math.min(FRAME_COUNT - 1, activeFrame + lookAhead);
      if (activeFrame >= 20) hasPassedPreloadFrames = true;

      if (hasPassedPreloadFrames && Math.abs(activeFrame - lastEvictionFrame) >= 8) {
        for (let index = 0; index < FRAME_COUNT; index += 1) {
          if ((index < keepMin || index > keepMax) && frameSources[index]) {
            frames[index].onload = null;
            frames[index].onerror = null;
            frameSources[index] = '';
            frames[index].removeAttribute('src');
          }
        }
        lastEvictionFrame = activeFrame;
      }

      load(activeFrame);
      for (let index = activeFrame + 1; index <= keepMax; index += 1) load(index);
      for (let index = activeFrame - 1; index >= keepMin; index -= 1) load(index);
    }

    function draw() {
      if (!width || !height) return;
      let image = frames[activeFrame]?.complete && frames[activeFrame].naturalWidth ? frames[activeFrame] : null;
      let imageIndex = activeFrame;
      for (let distance = 1; distance < FRAME_COUNT && !image; distance += 1) {
        const beforeIndex = Math.max(0, activeFrame - distance);
        const afterIndex = Math.min(FRAME_COUNT - 1, activeFrame + distance);
        const before = frames[beforeIndex];
        const after = frames[afterIndex];
        if (before?.complete && before.naturalWidth) {
          image = before;
          imageIndex = beforeIndex;
        } else if (after?.complete && after.naturalWidth) {
          image = after;
          imageIndex = afterIndex;
        }
      }
      if (!image) return;

      const scale = Math.max(width / image.naturalWidth, height / image.naturalHeight);
      const drawWidth = image.naturalWidth * scale;
      const drawHeight = image.naturalHeight * scale;
      const drawX = (width - drawWidth) / 2;
      const drawY = (height - drawHeight) / 2;

      context.drawImage(image, drawX, drawY, drawWidth, drawHeight);
      canvas.__drawnFrameIndex = imageIndex;
      canvas.__drawnFrameSet = mode === 'phone' ? 'm' : mode === 'tablet' ? 't' : 'd';
    }

    function measure() {
      const stage = stageRef.current;
      if (disposed || !stage) return;
      const rect = stage.getBoundingClientRect();
      const track = trackRef.current;
      if (!track) return;
      trackTop = track.getBoundingClientRect().top + window.scrollY;
      scrollRange = Math.max(1, track.offsetHeight - stage.clientHeight);
      const positionRestored = pendingProgress !== null;
      if (positionRestored) {
        window.scrollTo({
          top: trackTop + pendingProgress * scrollRange,
          left: 0,
          behavior: 'instant',
        });
        pendingProgress = null;
      }
      const nextRect = { width: rect.width, height: rect.height };
      const widthChanged = !lastRect || Math.abs(lastRect.width - nextRect.width) > 0.5;
      const heightChanged = !lastRect || Math.abs(lastRect.height - nextRect.height) > 80;
      if (lastRect && !widthChanged && !heightChanged) {
        if (positionRestored) update();
        return;
      }
      lastRect = nextRect;

      const dpr = Math.min(window.devicePixelRatio || 1, isTouchDevice ? 1 : 2);
      width = rect.width;
      height = rect.height;
      canvas.width = Math.max(1, Math.round(width * dpr));
      canvas.height = Math.max(1, Math.round(height * dpr));
      canvas.__drawnFrameIndex = -1;
      canvas.__drawnFrameSet = '';
      context.setTransform(dpr, 0, 0, dpr, 0, 0);
      context.imageSmoothingEnabled = true;
      context.imageSmoothingQuality = mode === 'phone' ? 'medium' : 'high';
      draw();
      update();
    }

    function update() {
      raf = 0;
      if (disposed) return;
      if (!trackRef.current || !stageRef.current) return;
      const nextProgress = reduceMotion ? 0 : clamp((window.scrollY - trackTop) / scrollRange, 0, 1);
      isWithinHero = window.scrollY >= trackTop && window.scrollY <= trackTop + scrollRange;
      progressRef.current = nextProgress;
      const nextFrame = reduceMotion ? 0 : Math.round(nextProgress * (FRAME_COUNT - 1));
      const frameChanged = nextFrame !== activeFrame;
      activeFrame = nextFrame;
      if (frameChanged || lastLoadedFrame < 0) {
        loadNear();
        lastLoadedFrame = activeFrame;
      }
      if (frameChanged) draw();
      const nextChapter = nextProgress < 0.28 ? 0 : nextProgress < 0.58 ? 1 : 2;
      if (chapterRef.current !== nextChapter) {
        chapterRef.current = nextChapter;
        setChapter(nextChapter);
      }
      if (promptRef.current) {
        promptRef.current.classList.toggle('is-hidden', nextProgress > 0.05);
      }
    }

    function scheduleMeasure() {
      if (pendingProgress === null && isWithinHero) {
        pendingProgress = clamp((window.scrollY - trackTop) / scrollRange, 0, 1);
      }
      clearTimeout(measureTimer);
      measureTimer = window.setTimeout(() => {
        measure();
      }, 120);
    }

    function clearFrames() {
      canvas.__drawnFrameIndex = -1;
      canvas.__drawnFrameSet = '';
      frames.forEach((image, index) => {
        image.onload = null;
        image.onerror = null;
        frameSources[index] = '';
        image.removeAttribute('src');
      });
    }

    function handleViewportChange() {
      const nextIsTouchDevice = touchQuery.matches;
      if (nextIsTouchDevice !== isTouchDevice) {
        isTouchDevice = nextIsTouchDevice;
        setIsTouch(nextIsTouchDevice);
      }
      const nextMode = readMode();
      if (nextMode === mode) return;
      if (pendingProgress === null && isWithinHero) {
        pendingProgress = clamp((window.scrollY - trackTop) / scrollRange, 0, 1);
      }
      mode = nextMode;
      clearFrames();
      lastEvictionFrame = activeFrame;
      load(activeFrame);
      loadNear();
      scheduleMeasure();
    }

    function preloadInitialFrames() {
      for (let index = 0; index < Math.min(20, FRAME_COUNT); index += 1) load(index);
    }

    function scheduleInitialPreload() {
      if (typeof window.requestIdleCallback === 'function') {
        idleCallback = window.requestIdleCallback(preloadInitialFrames, { timeout: 2000 });
      } else {
        idleTimer = window.setTimeout(preloadInitialFrames, 0);
      }
    }

    function onScroll() {
      if (!disposed && !raf) raf = window.requestAnimationFrame(update);
    }

    const resizeObserver = new ResizeObserver(() => {
      scheduleMeasure();
    });

    if (stageRef.current) resizeObserver.observe(stageRef.current);
    if (trackRef.current) resizeObserver.observe(trackRef.current);
    window.addEventListener('resize', scheduleMeasure, { passive: true });
    window.visualViewport?.addEventListener('resize', scheduleMeasure, { passive: true });
    window.addEventListener('scroll', onScroll, { passive: true });
    phoneQuery.addEventListener('change', handleViewportChange);
    tabletQuery.addEventListener('change', handleViewportChange);
    touchQuery.addEventListener('change', handleViewportChange);
    frames[0].addEventListener('load', scheduleInitialPreload, { once: true });
    setIsTouch(isTouchDevice);
    load(0);
    measure();

    return () => {
      disposed = true;
      clearTimeout(measureTimer);
      clearTimeout(idleTimer);
      if (idleCallback && typeof window.cancelIdleCallback === 'function') window.cancelIdleCallback(idleCallback);
      resizeObserver.disconnect();
      window.removeEventListener('resize', scheduleMeasure);
      window.visualViewport?.removeEventListener('resize', scheduleMeasure);
      window.removeEventListener('scroll', onScroll);
      phoneQuery.removeEventListener('change', handleViewportChange);
      tabletQuery.removeEventListener('change', handleViewportChange);
      touchQuery.removeEventListener('change', handleViewportChange);
      frames[0].removeEventListener('load', scheduleInitialPreload);
      window.cancelAnimationFrame(raf);
      clearFrames();
    };
  }, [reduceMotion]);

  const copy = [
    { label: 'PREMIUM CCTV SECURITY', title: <>Secure <em>Your World</em></>, text: 'Premium CCTV security cameras for a safer tomorrow.' },
    { label: 'BUILT TO WATCH · BUILT TO LAST', title: <>Clarity <em>after dark.</em></>, text: 'Weatherproof cameras, 4K detail, and dependable night vision.' },
    { label: 'CAM 01 · FRONT DOOR', title: <>See more.<br /><em>Know sooner.</em></>, text: 'Get a clearer view and stay aware when something needs your attention.' },
  ];

  return <section className="hero-track" ref={trackRef} id="home">
    <div className="hero-stage" ref={stageRef}>
      <canvas ref={canvasRef} className="hero-canvas" aria-label="CCTV camera scroll animation" />
      <div className="hero-vignette" />
      <div className="hero-hud"><span><i className="rec-dot" /> REC</span><span className="battery">▰▰▰▱ 78%</span></div>
      <div className="hero-copy">
        <AnimatePresence mode="wait">
          <motion.div key={chapter} className="hero-copy-inner"
            initial={reduceMotion ? false : { y: 28, clipPath: 'inset(0 0 100% 0)' }}
            animate={{ y: 0, clipPath: 'inset(0 0 0% 0)' }}
            exit={reduceMotion ? undefined : { y: -20, clipPath: 'inset(100% 0 0 0)' }}
            transition={{ duration: reduceMotion ? 0 : 0.65, ease: [0.2, 0.8, 0.2, 1] }}>
            <span className="hero-kicker"><i className="rec-dot" /> {copy[chapter].label}</span>
            <h1>{copy[chapter].title}</h1>
            <p>{copy[chapter].text}</p>
            <div className="hero-actions">
              <a className="btn-primary" href="#products"><ShieldCheck size={18} /> Secure Your Home <span className="btn-arrow"><ArrowRight size={16} /></span></a>
              <a className="btn-ghost" href="#services">Book a Survey</a>
            </div>
          </motion.div>
        </AnimatePresence>
      </div>
      <div ref={promptRef} className="scroll-prompt"><span>{isTouch ? 'SWIPE UP' : 'SCROLL'}</span><i><b /></i></div>
      {chapter === 2 && <div className="hero-camera-label">CAM 01 <span>FRONT DOOR</span></div>}
    </div>
  </section>;
}
