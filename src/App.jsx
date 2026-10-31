import React, { useEffect, useRef, useState } from 'react';
import Lenis from 'lenis';
import { useReducedMotion } from 'framer-motion';
import Header from './components/Header.jsx';
import Hero from './components/Hero.jsx';
import { ProductsFlythrough } from './components/ProductsFlythrough.jsx';
import { Categories, Footer, Reviews, Seam, Services } from './components/Sections.jsx';
import { CartProvider } from './context/CartContext.jsx';
import { registerLenis } from './utils/scrollToPosition.js';

function MotionSystems() {
  const reduce = useReducedMotion();
  const glowRef = useRef(null);

  useEffect(() => {
    if (reduce || !window.matchMedia('(pointer: fine)').matches) return;
    let targetX = window.innerWidth * .5;
    let targetY = window.innerHeight * .4;
    let x = targetX, y = targetY, raf = 0;
    const onMove = (event) => { targetX = event.clientX; targetY = event.clientY; };
    const animate = () => {
      x += (targetX - x) * .12; y += (targetY - y) * .12;
      if (glowRef.current) { glowRef.current.style.left = x + 'px'; glowRef.current.style.top = y + 'px'; }
      raf = requestAnimationFrame(animate);
    };
    window.addEventListener('pointermove', onMove, { passive: true });
    raf = requestAnimationFrame(animate);
    return () => { window.removeEventListener('pointermove', onMove); cancelAnimationFrame(raf); };
  }, [reduce]);

  useEffect(() => {
    if (reduce) return;
    const lenis = new Lenis({ lerp: .09, smoothWheel: true, syncTouch: false });
    const unregisterLenis = registerLenis(lenis);
    let raf = 0;
    const tick = (time) => { lenis.raf(time); raf = requestAnimationFrame(tick); };
    raf = requestAnimationFrame(tick);
    return () => { cancelAnimationFrame(raf); unregisterLenis(); lenis.destroy(); };
  }, [reduce]);

  return <div className="lens-glow" ref={glowRef} aria-hidden="true" />;
}

function Shop() {
  const [filter, setFilter] = useState('All');
  const reduce = useReducedMotion();
  const chooseCategory = (category) => {
    setFilter(category);
    document.getElementById('products')?.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'start' });
  };

  return <CartProvider>
    <MotionSystems />
    <div className="atmosphere" aria-hidden="true"><i /><i /><i /></div>
    <Header />
    <main>
      <Hero />
      <Seam from="#05070b" to="#030813" beam="48%" />
      <Categories onChoose={chooseCategory} />
      <Seam from="#1C2227" to="#1C2227" beam="30%" />
      <ProductsFlythrough filter={filter} setFilter={setFilter} />
      <Seam from="#FFFFFF" to="#E7E7E7" beam="66%" />
      <Services />
      <Seam from="#040a14" to="#071427" beam="42%" />
      <Reviews />
      <Seam from="#071427" to="#030813" beam="none" />
      <Footer />
    </main>
  </CartProvider>;
}

export default function App() {
  return <Shop />;
}
