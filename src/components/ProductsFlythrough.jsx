import React, { useEffect, useMemo, useRef } from 'react';
import { useReducedMotion } from 'framer-motion';
import { ArrowRight } from 'lucide-react';
import { products } from '../data/shop.js';
import { useCart } from '../context/CartContext.jsx';
import { flyToCart } from '../utils/flyToCart.js';
import { scrollToPosition } from '../utils/scrollToPosition.js';

const START = 0.26;
const END = 0.9;
const clamp = (value, min = 0, max = 1) => Math.min(max, Math.max(min, value));
const lerp = (from, to, amount) => from + (to - from) * amount;
const ease = (value) => value * value * (3 - 2 * value);
const scatterSpots = [
  { x: 47.5, y: 25, tilt: -4 },
  { x: 22.5, y: 40, tilt: 3 },
  { x: 77.5, y: 25, tilt: -2 },
  { x: 75, y: 55, tilt: 4 },
  { x: 20, y: 71, tilt: -3 },
  { x: 48.5, y: 71, tilt: 2 },
];
const featurePositions = [24, 36, 22, 38, 26, 34];
const mobileSpots = [
  { x: 26, y: 58 },
  { x: 74, y: 58 },
  { x: 26, y: 70 },
  { x: 74, y: 70 },
  { x: 26, y: 82 },
  { x: 74, y: 82 },
];

export function featurePose(progress, index, count) {
  const windowSize = (END - START) / count;
  const center = START + (index + 0.5) * windowSize;
  const windowProgress = clamp((progress - (center - windowSize * 0.75)) / (windowSize * 1.5));
  const focus = windowProgress < 0.4
    ? ease(windowProgress / 0.4)
    : windowProgress < 0.6
      ? 1
      : ease((1 - windowProgress) / 0.4);
  const y = windowProgress < 0.4
    ? lerp(60, 0, ease(windowProgress / 0.4))
    : windowProgress < 0.6
      ? 0
      : lerp(0, -60, ease((windowProgress - 0.6) / 0.4));
  return {
    center,
    focus,
    y,
    rotation: lerp(-42, 42, windowProgress),
    z: -420 * (1 - focus),
    blur: 14 * (1 - focus),
    opacity: Math.pow(focus, 0.6),
    scale: 0.9 + 0.1 * focus,
    live: windowProgress > 0 && windowProgress < 1,
  };
}

function ProductButton({ label, onClick, className = '' }) {
  return <button type="button" className={'pf-pill-button ' + className} onClick={onClick}>
    <span>{label}</span><span className="pf-arrow-circle" aria-hidden="true"><ArrowRight size={17} /></span>
  </button>;
}

function FeatureSlide({ product, index, slideRef, onAdd }) {
  const imageRef = useRef(null);
  const [added, setAdded] = React.useState(false);
  const timer = useRef(0);
  useEffect(() => () => window.clearTimeout(timer.current), []);

  const handleAdd = () => {
    onAdd(product);
    flyToCart(imageRef.current);
    setAdded(true);
    window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => setAdded(false), 1400);
  };

  return <article
    ref={slideRef}
    className="pf-feature"
    style={{ '--feature-x': (featurePositions[index] ?? 30) + '%' }}
    data-feature-index={index}
    aria-label={product.name}
    aria-hidden="true"
    inert
  >
    <div className="pf-feature-image-wrap">
      <div className="pf-ground" />
      <img
        ref={imageRef}
        className="pf-feature-image"
        src={'/products/' + product.id + '.webp'}
        alt={product.name}
        loading={index < 2 ? 'eager' : 'lazy'}
        fetchPriority={index < 2 ? 'high' : 'auto'}
        decoding="async"
      />
    </div>
    <div className="pf-feature-copy">
      <span className="pf-specs">{product.specs.join(' · ')}</span>
      <h3>{product.name}</h3>
      <p>{product.description}</p>
      <div className="pf-purchase-row">
        <span className="pf-price">${product.price.toFixed(2)}</span>
        <ProductButton
          label={added ? 'ADDED ✓' : 'ADD TO CART'}
          onClick={handleAdd}
          className="pf-add-button"
        />
      </div>
    </div>
  </article>;
}

export function ProductsFlythrough({ filter, setFilter }) {
  const reduceMotion = useReducedMotion();
  const { add } = useCart();
  const trackRef = useRef(null);
  const stageRef = useRef(null);
  const whiteRef = useRef(null);
  const scatterTitleRef = useRef(null);
  const scatterCopyRef = useRef(null);
  const scatterButtonsRef = useRef([]);
  const featureRefs = useRef([]);
  const pointer = useRef({ x: 0, y: 0 });
  const visibleProducts = useMemo(
    () => products.filter((product) => filter === 'All' || product.categories.includes(filter)),
    [filter],
  );
  const count = visibleProducts.length;
  const filters = ['All', 'Home', 'Business', 'Outdoor'];

  useEffect(() => {
    const preloadLinks = visibleProducts.slice(0, 2).map((product) => {
      const link = document.createElement('link');
      link.rel = 'preload';
      link.as = 'image';
      link.href = '/products/' + product.id + '.webp';
      document.head.append(link);
      return link;
    });
    return () => preloadLinks.forEach((link) => link.remove());
  }, [visibleProducts]);

  useEffect(() => {
    const track = trackRef.current;
    const stage = stageRef.current;
    if (!track || !stage || reduceMotion) return undefined;
    let raf = 0;
    const onScroll = () => {
      if (!raf) raf = window.requestAnimationFrame(update);
    };
    const update = () => {
      raf = 0;
      const range = Math.max(1, track.offsetHeight - stage.clientHeight);
      const headerHeight = parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--header-h')) || 0;
      const progress = clamp((headerHeight - track.getBoundingClientRect().top) / range);
      const reveal = ease(clamp(progress / 0.1));
      if (whiteRef.current) {
        whiteRef.current.style.clipPath = `ellipse(${76 * reveal}% ${76 * reveal}% at 50% 50%)`;
        whiteRef.current.setAttribute('aria-hidden', String(progress < 0.1));
      }

      const scatterVisibility = 1 - ease(clamp((progress - 0.2) / 0.06));
      const scatterBlur = 12 * (1 - scatterVisibility);
      [scatterTitleRef.current, scatterCopyRef.current].forEach((element) => {
        if (!element) return;
        element.style.opacity = String(scatterVisibility);
        element.style.filter = `blur(${scatterBlur}px)`;
        element.setAttribute('aria-hidden', String(scatterVisibility <= 0.05));
      });
      const shopButton = scatterCopyRef.current?.querySelector('button');
      if (shopButton) shopButton.tabIndex = scatterVisibility > 0.05 ? 0 : -1;

      const scatterScale = 0.72 + 0.28 * scatterVisibility;
      scatterButtonsRef.current.forEach((button, index) => {
        if (!button) return;
        const mobilePortrait = window.innerWidth <= 899 && window.innerHeight > 520;
        const spot = mobilePortrait
          ? mobileSpots[index] ?? mobileSpots[mobileSpots.length - 1]
          : scatterSpots[index] ?? scatterSpots[scatterSpots.length - 1];
        const floatX = Math.sin(progress * Math.PI * 2 + index * 1.7) * 10;
        const floatY = Math.cos(progress * Math.PI * 2 + index * 1.3) * 8;
        const pointerX = pointer.current.x * 10 * (spot.y / 100);
        const pointerY = pointer.current.y * 8 * (spot.x / 100);
        button.style.opacity = String(scatterVisibility);
        button.style.filter = `blur(${scatterBlur}px)`;
        button.style.transform = `translate3d(${floatX + pointerX}px, ${floatY + pointerY}px, 0) translate(-50%, -50%) scale(${scatterScale}) rotateY(${pointer.current.x * 6 * (spot.y / 100)}deg)`;
        button.style.pointerEvents = scatterVisibility > 0.05 ? 'auto' : 'none';
        button.tabIndex = scatterVisibility > 0.05 ? 0 : -1;
        button.setAttribute('aria-hidden', String(scatterVisibility <= 0.05));
      });

      featureRefs.current.forEach((slide, index) => {
        if (!slide) return;
        const pose = featurePose(progress, index, count);
        slide.style.transform = `translate3d(0, ${pose.y}vh, ${pose.z}px) rotateY(${pose.rotation}deg) scale(${pose.scale})`;
        slide.style.opacity = String(pose.opacity);
        slide.style.visibility = pose.live ? 'visible' : 'hidden';
        slide.style.pointerEvents = pose.focus > 0.95 ? 'auto' : 'none';
        slide.style.willChange = pose.live ? 'transform, filter, opacity' : 'auto';
        slide.setAttribute('aria-hidden', String(!pose.live));
        if (pose.live) slide.removeAttribute('inert');
        else slide.setAttribute('inert', '');
        const addButton = slide.querySelector('button');
        if (addButton) addButton.disabled = pose.focus <= 0.95;

        const blur = `${pose.blur}px`;
        slide.style.filter = `blur(${blur})`;
        const copy = slide.querySelector('.pf-feature-copy');
        if (copy) {
          copy.style.opacity = String(pose.opacity);
          copy.style.filter = `blur(${10 * (1 - pose.focus)}px)`;
          copy.style.translate = `${(1 - pose.focus) * 28}px 0`;
        }
        const ground = slide.querySelector('.pf-ground');
        if (ground) ground.style.opacity = String(pose.focus * 0.8);
      });
    };
    const onPointerMove = (event) => {
      if (!window.matchMedia('(pointer: fine)').matches) return;
      pointer.current.x = (event.clientX / window.innerWidth - 0.5) * 2;
      pointer.current.y = (event.clientY / window.innerHeight - 0.5) * 2;
      onScroll();
    };

    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll, { passive: true });
    window.addEventListener('pointermove', onPointerMove, { passive: true });
    onScroll();
    return () => {
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onScroll);
      window.removeEventListener('pointermove', onPointerMove);
      window.cancelAnimationFrame(raf);
    };
  }, [count, reduceMotion]);

  const scrollToFeature = (index) => {
    const track = trackRef.current;
    const stage = stageRef.current;
    if (!track || !stage || !count) return;
    const { center } = featurePose(0, index, count);
    const range = Math.max(0, track.offsetHeight - stage.clientHeight);
    const headerHeight = parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--header-h')) || 0;
    scrollToPosition(window.scrollY + track.getBoundingClientRect().top - headerHeight + center * range);
  };

  const trackStyle = reduceMotion
    ? undefined
    : { '--pf-count': count, height: `calc((1.8 + ${count} * 0.9) * 100svh)` };

  return <section
    id="products"
    ref={trackRef}
    className={'pf-track' + (reduceMotion ? ' pf-reduced' : '')}
    style={trackStyle}
  >
    <div className="pf-stage" ref={stageRef}>
      <div className="pf-intro">
        <span className="pf-kicker">SMARTER BY DESIGN · CAM 03</span>
        <h2>Secure <em>Your World</em></h2>
        <p>PREMIUM CCTV SECURITY CAMERAS FOR A SAFER TOMORROW</p>
        <div className="pf-filters" role="group" aria-label="Filter cameras">
          {filters.map((item) => <button
            key={item}
            type="button"
            className={filter === item ? 'is-active' : ''}
            aria-pressed={filter === item}
            onClick={() => setFilter(item)}
          >{item}</button>)}
        </div>
      </div>
      {!reduceMotion && <div className="pf-white" ref={whiteRef} aria-hidden="true">
        <div className="pf-scene">
          <div className="pf-section-tag">CAM 03 · PRODUCTS</div>
          <div className="pf-scatter-title" ref={scatterTitleRef}>
            <h2>Secure <em>Your</em><br /><span>World</span></h2>
            <p>PREMIUM CCTV SECURITY CAMERAS<br />FOR A SAFER TOMORROW</p>
          </div>
          <div className="pf-corner pf-corner-top"><strong>4K</strong><span>ULTRA-CLEAR VIDEO,<br />DAY AND NIGHT</span></div>
          <div className="pf-corner pf-corner-bottom-left"><strong>{String(count).padStart(2, '0')}</strong><span>CAMERAS</span></div>
          {visibleProducts.map((product, index) => {
            const spot = scatterSpots[index] ?? scatterSpots[scatterSpots.length - 1];
            return <button
              key={product.id}
              ref={(node) => { scatterButtonsRef.current[index] = node; }}
              type="button"
              className="pf-scatter-button"
              style={{ '--spot-x': spot.x + '%', '--spot-y': spot.y + '%' }}
              aria-label={'Go to ' + product.name}
              onClick={() => scrollToFeature(index)}
            >
              <span className="pf-scatter-float" style={{ animationDelay: `${index * -0.8}s`, animationDuration: `${5 + index * 0.35}s`, '--pf-tilt': spot.tilt + 'deg' }}>
                <img src={'/products/' + product.id + '.webp'} alt="" loading={index < 2 ? 'eager' : 'lazy'} decoding="async" />
              </span>
            </button>;
          })}
          <div className="pf-scatter-copy" ref={scatterCopyRef}>
            <p>PROTECT YOUR HOME OR BUSINESS 24/7. WHETHER YOU NEED A DISCREET DOME OR A 360° VIEW.</p>
            <ProductButton label="SHOP COLLECTION" onClick={() => scrollToFeature(0)} />
          </div>
          {visibleProducts.map((product, index) => <FeatureSlide
            key={product.id}
            product={product}
            index={index}
            onAdd={add}
            slideRef={(node) => { featureRefs.current[index] = node; }}
          />)}
        </div>
      </div>}
      {reduceMotion && <div className="pf-reduced-list">
        {visibleProducts.map((product) => <ReducedProduct key={product.id} product={product} onAdd={add} />)}
      </div>}
    </div>
  </section>;
}

function ReducedProduct({ product, onAdd }) {
  const imageRef = useRef(null);
  const [added, setAdded] = React.useState(false);
  const timer = useRef(0);
  useEffect(() => () => window.clearTimeout(timer.current), []);
  const handleAdd = () => {
    onAdd(product);
    flyToCart(imageRef.current);
    setAdded(true);
    window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => setAdded(false), 1400);
  };
  return <article className="pf-reduced-product">
    <img ref={imageRef} src={'/products/' + product.id + '.webp'} alt={product.name} loading="lazy" decoding="async" />
    <div><span className="pf-specs">{product.specs.join(' · ')}</span><h3>{product.name}</h3><p>{product.description}</p>
      <div className="pf-purchase-row"><span className="pf-price">${product.price.toFixed(2)}</span><ProductButton label={added ? 'ADDED ✓' : 'ADD TO CART'} onClick={handleAdd} className="pf-add-button" /></div>
    </div>
  </article>;
}
