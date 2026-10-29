import React, { lazy, Suspense, useEffect, useRef, useState } from 'react';
import Lenis from 'lenis';
import { useReducedMotion } from 'framer-motion';
import Header from './components/Header.jsx';
import Hero from './components/Hero.jsx';
import { Categories, Footer, Reviews, Seam, Services } from './components/Sections.jsx';
import { CartProvider } from './context/CartContext.jsx';

const Products3D = lazy(() => import('./components/Products3D.jsx').then((module) => ({ default: module.Products3D })));

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
    let raf = 0;
    const tick = (time) => { lenis.raf(time); raf = requestAnimationFrame(tick); };
    raf = requestAnimationFrame(tick);
    return () => { cancelAnimationFrame(raf); lenis.destroy(); };
  }, [reduce]);

  return <div className="lens-glow" ref={glowRef} aria-hidden="true" />;
}

function ProductsLoader({ filter, setFilter }) {
  const ref = useRef(null);
  const [ready, setReady] = useState(false);
  useEffect(() => {
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) { setReady(true); observer.disconnect(); }
    }, { rootMargin: '900px 0px' });
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, []);
  return <div id="products" className="products-loader" ref={ref}>
    {ready ? <Suspense fallback={<div className="products-placeholder">Preparing the camera studio…</div>}><Products3D filter={filter} setFilter={setFilter} /></Suspense> : <div className="products-placeholder" aria-hidden="true" />}
  </div>;
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
      <Seam from="#030813" to="#071427" beam="30%" />
      <ProductsLoader filter={filter} setFilter={setFilter} />
      <Seam from="#071427" to="#040a14" beam="66%" />
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
