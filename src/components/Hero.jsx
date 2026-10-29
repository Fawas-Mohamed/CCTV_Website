import React, { useEffect, useRef, useState } from 'react';
import { ArrowDown, ArrowRight, ShieldCheck } from 'lucide-react';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';

const FRAME_COUNT = 240;
const FRAME_ROOT = '/frames/CCTV_frames_30fps';
const clamp = (value, min, max) => Math.min(max, Math.max(min, value));

export default function Hero() {
  const trackRef = useRef(null);
  const stageRef = useRef(null);
  const canvasRef = useRef(null);
  const [progress, setProgress] = useState(0);
  const reduceMotion = useReducedMotion();

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return undefined;
    const context = canvas.getContext('2d', { alpha: false });
    if (!context) return undefined;
    const frames = Array.from({ length: FRAME_COUNT }, () => new Image());
    let activeFrame = 0;
    let lastFrame = 0;
    let raf = 0;
    let width = 0;
    let height = 0;
    let disposed = false;

    function load(index) {
      if (index < 0 || index >= FRAME_COUNT) return;
      const image = frames[index];
      if (image.src) return;
      image.decoding = 'async';
      image.fetchPriority = index === activeFrame ? 'high' : 'low';
      image.onload = draw;
      image.onerror = () => { image.onload = null; };
      image.src = FRAME_ROOT + '/frame_' + String(index + 1).padStart(4, '0') + '.jpg';
    }

    function loadNear() {
      const direction = activeFrame >= lastFrame ? 1 : -1;
      load(activeFrame);
      for (let offset = 1; offset <= 12; offset += 1) load(activeFrame + offset * direction);
      for (let offset = 1; offset <= 3; offset += 1) load(activeFrame - offset * direction);
      lastFrame = activeFrame;
    }

    function draw() {
      if (!width || !height) return;
      let image = frames[activeFrame]?.complete && frames[activeFrame].naturalWidth ? frames[activeFrame] : null;
      for (let distance = 1; distance < FRAME_COUNT && !image; distance += 1) {
        const before = frames[Math.max(0, activeFrame - distance)];
        const after = frames[Math.min(FRAME_COUNT - 1, activeFrame + distance)];
        if (before?.complete && before.naturalWidth) image = before;
        else if (after?.complete && after.naturalWidth) image = after;
      }
      if (!image) return;
      const scale = Math.max(width / image.naturalWidth, height / image.naturalHeight);
      const w = image.naturalWidth * scale;
      const h = image.naturalHeight * scale;
      context.clearRect(0, 0, width, height);
      context.drawImage(image, (width - w) / 2, (height - h) / 2, w, h);
    }

    function measure() {
      const stage = stageRef.current;
      if (disposed || !stage) return;
      const rect = stage.getBoundingClientRect();
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      width = rect.width;
      height = rect.height;
      canvas.width = Math.max(1, Math.round(width * dpr));
      canvas.height = Math.max(1, Math.round(height * dpr));
      context.setTransform(dpr, 0, 0, dpr, 0, 0);
      context.imageSmoothingEnabled = true;
      context.imageSmoothingQuality = 'high';
      draw();
      update();
    }

    function update() {
      raf = 0;
      if (disposed) return;
      const track = trackRef.current;
      const stage = stageRef.current;
      if (!track || !stage) return;
      const range = Math.max(1, track.offsetHeight - stage.clientHeight);
      const nextProgress = reduceMotion ? 0 : clamp(-track.getBoundingClientRect().top / range, 0, 1);
      activeFrame = reduceMotion ? 0 : Math.round(nextProgress * (FRAME_COUNT - 1));
      loadNear();
      draw();
      setProgress((current) => Math.abs(current - nextProgress) > 0.003 ? nextProgress : current);
    }

    function onScroll() {
      if (!disposed && !raf) raf = window.requestAnimationFrame(update);
    }

    const resizeObserver = new ResizeObserver(measure);
    if (stageRef.current) resizeObserver.observe(stageRef.current);
    window.addEventListener('resize', measure, { passive: true });
    window.visualViewport?.addEventListener('resize', measure, { passive: true });
    window.addEventListener('scroll', onScroll, { passive: true });
    measure();

    return () => {
      disposed = true;
      resizeObserver.disconnect();
      window.removeEventListener('resize', measure);
      window.visualViewport?.removeEventListener('resize', measure);
      window.removeEventListener('scroll', onScroll);
      window.cancelAnimationFrame(raf);
      frames.forEach((image) => { image.onload = null; image.onerror = null; image.src = ''; });
    };
  }, [reduceMotion]);

  const chapter = progress < 0.28 ? 0 : progress < 0.58 ? 1 : 2;
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
      <div className={'scroll-prompt' + (progress > 0.05 ? ' is-hidden' : '')}><span>SCROLL</span><i><b /></i></div>
      {chapter === 2 && <div className="hero-camera-label">CAM 01 <span>FRONT DOOR</span></div>}
    </div>
  </section>;
}
