import React, { useEffect, useState } from 'react';
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

  useEffect(() => {
    if (reduce || !window.matchMedia('(pointer: fine)').matches) return undefined;
    const lenis = new Lenis({ lerp: .09, smoothWheel: true, syncTouch: false });
    const unregisterLenis = registerLenis(lenis);
    let raf = 0;
    const tick = (time) => { lenis.raf(time); raf = requestAnimationFrame(tick); };
    raf = requestAnimationFrame(tick);
    return () => { cancelAnimationFrame(raf); unregisterLenis(); lenis.destroy(); };
  }, [reduce]);

  return null;
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
      <Seam from="#0E1213" to="#0E1213" beam="48%" />
      <Categories onChoose={chooseCategory} />
      <Seam from="#0E1213" to="#0E1213" beam="30%" />
      <ProductsFlythrough filter={filter} setFilter={setFilter} />
      <Seam from="#FFFFFF" to="#EA6600" beam="66%" />
      <Services />
      <Seam from="#C55404" to="#FFFFFF" beam="42%" />
      <Reviews />
      <Seam from="#FFFFFF" to="#0E1213" beam="none" />
      <Footer />
    </main>
  </CartProvider>;
}

export default function App() {
  return <Shop />;
}
