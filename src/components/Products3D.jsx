import React, { useEffect, useRef, useState } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { ContactShadows, Html } from '@react-three/drei';
import { Aperture, ArrowRight, Camera, Check, ChevronLeft, ChevronRight, CloudSun, Crosshair, Eye, Home as HomeIcon, Minus, Plus, ShoppingCart, Star, X } from 'lucide-react';
import { products } from '../data/shop.js';
import { useCart } from '../context/CartContext.jsx';

const iconMap = { sun: CloudSun, eye: Eye, target: Crosshair, camera: Camera, home: HomeIcon, aperture: Aperture };
const money = (amount) => '$' + amount.toFixed(2);

function SectionTag({ children, camera = 'CAM 03' }) {
  return <div className="section-tag"><span className="tag-corners" /><span className="tag-rec"><i className="rec-dot" /> REC</span><span>{camera} · {children}</span></div>;
}

function Reveal({ children, className = '' }) {
  const reduce = useReducedMotion();
  return <motion.div className={className} initial={reduce ? false : { opacity: 0, y: 24 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: reduce ? 0 : .7 }}>{children}</motion.div>;
}
function CameraDevice({ product, position, angle, selected, muted, onSelect, onHover }) {
  const group = useRef(null);
  const Icon = iconMap[product.icon] || Camera;
  const lightness = product.color.startsWith('#f') || product.color.startsWith('#e');
  useFrame((_, dt) => {
    if (!group.current) return;
    const targetScale = selected ? 1.18 : 1;
    group.current.scale.lerp({ x: targetScale, y: targetScale, z: targetScale }, 1 - Math.exp(-dt * 8));
  });

  const materialColor = product.color;
  return <group ref={group} position={position} rotation={[0, angle, 0]} onClick={(event) => { event.stopPropagation(); onSelect(product); }} onPointerOver={() => onHover(product.id)} onPointerOut={() => onHover(null)}>
    {product.id === 'bullet' || product.id === 'ip' ? <>
      <mesh castShadow><cylinderGeometry args={[0.36, 0.45, 1.25, 32]} /><meshStandardMaterial color={materialColor} metalness={0.58} roughness={0.28} transparent opacity={muted ? 0.25 : 1} /></mesh>
      <mesh position={[0, 0, 0.68]} rotation={[Math.PI / 2, 0, 0]}><cylinderGeometry args={[0.27, 0.32, 0.17, 32]} /><meshStandardMaterial color="#090e17" metalness={0.75} roughness={0.2} /></mesh>
      <mesh position={[0, 0, 0.78]}><circleGeometry args={[0.17, 32]} /><meshBasicMaterial color="#061326" /></mesh>
      <mesh position={[0, 0.3, 0.35]}><sphereGeometry args={[0.035, 12, 12]} /><meshBasicMaterial color="#ff2d2d" /></mesh>
      <mesh position={[0, -0.3, 0.35]}><sphereGeometry args={[0.035, 12, 12]} /><meshBasicMaterial color="#ff2d2d" /></mesh>
      <mesh position={[0, -0.72, -0.08]}><cylinderGeometry args={[0.13, 0.13, 0.36, 20]} /><meshStandardMaterial color="#4c5968" metalness={0.7} roughness={0.35} /></mesh>
    </> : product.id === 'dome' || product.id === 'fisheye' ? <>
      <mesh position={[0, 0.25, 0]} castShadow><cylinderGeometry args={[0.58, 0.58, 0.28, 40]} /><meshStandardMaterial color={materialColor} metalness={0.65} roughness={0.22} transparent opacity={muted ? 0.25 : 1} /></mesh>
      <mesh position={[0, -0.03, 0]}><sphereGeometry args={[0.49, 36, 24, 0, Math.PI * 2, 0, Math.PI / 2]} /><meshStandardMaterial color="#151d29" metalness={0.5} roughness={0.16} transparent opacity={0.94} /></mesh>
      <mesh position={[0, -0.12, 0.34]}><sphereGeometry args={[0.14, 24, 20]} /><meshStandardMaterial color="#05090f" metalness={0.8} roughness={0.15} /></mesh>
      <mesh position={[0, -0.12, 0.48]}><sphereGeometry args={[0.07, 18, 18]} /><meshBasicMaterial color="#113c68" /></mesh>
      <mesh position={[0.3, -0.08, 0.35]}><sphereGeometry args={[0.035, 12, 12]} /><meshBasicMaterial color="#ff2d2d" /></mesh>
      <mesh position={[-0.3, -0.08, 0.35]}><sphereGeometry args={[0.035, 12, 12]} /><meshBasicMaterial color="#ff2d2d" /></mesh>
    </> : product.id === 'ptz' ? <>
      <mesh position={[0, 0.52, 0]} castShadow><boxGeometry args={[0.68, 0.3, 0.74]} /><meshStandardMaterial color={materialColor} metalness={0.5} roughness={0.25} transparent opacity={muted ? 0.25 : 1} /></mesh>
      <mesh position={[0, -0.12, 0]}><sphereGeometry args={[0.5, 32, 24]} /><meshStandardMaterial color="#111824" metalness={0.65} roughness={0.18} /></mesh>
      <mesh position={[0, -0.18, 0.43]}><sphereGeometry args={[0.18, 24, 24]} /><meshStandardMaterial color="#050a12" metalness={0.85} roughness={0.12} /></mesh>
      <mesh position={[0, -0.18, 0.57]}><sphereGeometry args={[0.08, 18, 18]} /><meshBasicMaterial color="#102d51" /></mesh>
      <mesh position={[0.25, -0.12, 0.4]}><sphereGeometry args={[0.035, 12, 12]} /><meshBasicMaterial color="#ff2d2d" /></mesh>
    </> : <>
      <mesh position={[0, 0.18, 0]} castShadow><boxGeometry args={[0.72, 1.05, 0.5]} /><meshStandardMaterial color={materialColor} metalness={0.32} roughness={0.26} transparent opacity={muted ? 0.25 : 1} /></mesh>
      <mesh position={[0, 0.16, 0.27]}><boxGeometry args={[0.53, 0.66, 0.05]} /><meshStandardMaterial color="#080d16" metalness={0.55} roughness={0.18} /></mesh>
      <mesh position={[0, 0.22, 0.31]}><sphereGeometry args={[0.13, 20, 20]} /><meshBasicMaterial color="#123c65" /></mesh>
      <mesh position={[0, -0.65, 0]}><cylinderGeometry args={[0.42, 0.48, 0.2, 32]} /><meshStandardMaterial color={materialColor} metalness={0.4} roughness={0.3} /></mesh>
      <mesh position={[0, -0.1, 0.34]}><sphereGeometry args={[0.035, 12, 12]} /><meshBasicMaterial color="#ff2d2d" /></mesh>
    </>}
    <Html position={[0, -0.95, 0]} center distanceFactor={8} style={{ pointerEvents: 'none' }}>
      <div className={'model-label' + (lightness ? ' label-dark' : '')}><Icon size={16} /><strong>{product.name}</strong><span>{product.specs.join('  |  ')}</span></div>
    </Html>
  </group>;
}

function OrbitRig({ rotation, dragging, selected, filter, onSelect, onHover }) {
  const rig = useRef(null);
  const reduce = useReducedMotion();
  const viewport = useThree((state) => state.viewport);
  useFrame((_, dt) => {
    if (!rig.current) return;
    if (!dragging.current && !selected && !reduce) rotation.current += dt * 0.12;
    rig.current.rotation.y = rotation.current;
  });
  const radius = viewport.width < 5.5 ? 2.35 : 3.55;
  return <group ref={rig}>
    {products.map((product, index) => {
      const angle = index / products.length * Math.PI * 2;
      const filtered = filter === 'All' || product.categories.includes(filter);
      return <CameraDevice key={product.id} product={product} angle={angle} selected={selected?.id === product.id} muted={!filtered} onSelect={onSelect} onHover={onHover} position={[Math.sin(angle) * radius, 0.15, Math.cos(angle) * radius]} />;
    })}
  </group>;
}

function ProductDetail({ product, onClose }) {
  const { add } = useCart();
  const [qty, setQty] = useState(1);
  const [added, setAdded] = useState(false);
  useEffect(() => { setQty(1); setAdded(false); }, [product?.id]);
  useEffect(() => {
    if (!product) return;
    const onKey = (event) => {
      if (event.key === 'Escape') onClose();
      if (event.key === 'ArrowRight') document.querySelector('[data-next-product]')?.click();
      if (event.key === 'ArrowLeft') document.querySelector('[data-prev-product]')?.click();
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [product, onClose]);

  if (!product) return null;
  const handleAdd = () => { add(product, qty); setAdded(true); window.setTimeout(() => setAdded(false), 1400); };
  return <motion.aside className="product-detail" role="dialog" aria-modal="true" aria-label={product.name} initial={{ x: 36, opacity: 0 }} animate={{ x: 0, opacity: 1 }} exit={{ x: 36, opacity: 0 }} transition={{ duration: 0.35 }}>
    <button className="detail-close icon-button" onClick={onClose} aria-label="Close product details"><X /></button>
    <span className="product-chip">{product.categories[0]} camera</span><h3>{product.name}</h3>
    <div className="detail-rating"><span>{[1,2,3,4,5].map((n) => <Star key={n} size={14} fill="currentColor" />)}</span><b>4.9</b><small>Customer rating</small></div>
    <p>{product.description}</p>
    <div className="spec-chips">{product.specs.map((spec) => <span key={spec}>{spec}</span>)}</div>
    <div className="detail-price">{money(product.price)} <small>USD</small></div>
    <div className="detail-buy"><div className="qty-control"><button onClick={() => setQty((value) => Math.max(1, value - 1))} aria-label="Decrease quantity"><Minus size={14} /></button><span>{qty}</span><button onClick={() => setQty((value) => value + 1)} aria-label="Increase quantity"><Plus size={14} /></button></div><button className="add-cart-button" onClick={handleAdd}>{added ? <><Check size={17} /> Added</> : <><ShoppingCart size={17} /> Add to cart</>}</button></div>
    <a className="spec-link" href="#services" onClick={onClose}>View installation services <ArrowRight size={15} /></a>
  </motion.aside>;
}

export function Products3D({ filter, setFilter }) {
  const [selected, setSelected] = useState(null);
  const [hovered, setHovered] = useState(null);
  const stageRef = useRef(null);
  const [inView, setInView] = useState(false);
  const reduce = useReducedMotion();
  useEffect(() => {
    const observer = new IntersectionObserver(([entry]) => setInView(entry.isIntersecting), { threshold: 0.08 });
    if (stageRef.current) observer.observe(stageRef.current);
    return () => observer.disconnect();
  }, []);
  const rotation = useRef(0);
  const dragging = useRef(false);
  const pointer = useRef({ x: 0, moved: false });

  const onPointerDown = (event) => {
    dragging.current = true;
    pointer.current = { x: event.clientX, moved: false };
    event.currentTarget.setPointerCapture?.(event.pointerId);
  };
  const onPointerMove = (event) => {
    if (!dragging.current) return;
    const dx = event.clientX - pointer.current.x;
    if (Math.abs(dx) > 2) pointer.current.moved = true;
    rotation.current += dx * 0.006;
    pointer.current.x = event.clientX;
  };
  const onPointerUp = () => { dragging.current = false; window.setTimeout(() => { pointer.current.moved = false; }, 60); };

  return <section className="products-section">
    <SectionTag>CAM 03 · PRODUCTS</SectionTag>
    <div className="products-heading">
      <span className="overline">SMARTER BY DESIGN</span>
      <h2 className="showcase-title">Secure <em>Your World</em></h2>
      <p>PREMIUM CCTV SECURITY CAMERAS<br className="mobile-break" /> FOR A SAFER TOMORROW</p>
    </div>
    <div className="filter-row" role="group" aria-label="Filter cameras">
      {['All', 'Home', 'Business', 'Outdoor'].map((item) => <button key={item} className={filter === item ? 'filter-chip active' : 'filter-chip'} onClick={() => setFilter(item)}>{item}</button>)}
    </div>
    <div ref={stageRef} className={'product-stage' + (selected ? ' has-selection' : '')}
      onPointerDown={onPointerDown} onPointerMove={onPointerMove} onPointerUp={onPointerUp} onPointerCancel={onPointerUp}
      onPointerLeave={onPointerUp} style={{ touchAction: 'pan-y' }}>
      <Canvas frameloop={!inView ? "never" : reduce ? "demand" : "always"} dpr={[1, 2]} camera={{ position: [0, 1.05, 9], fov: 38 }} gl={{ antialias: true, alpha: true }}>
        <color attach="background" args={['#071427']} />
        <fog attach="fog" args={['#071427', 10, 24]} />
        <ambientLight intensity={1.1} />
        <directionalLight position={[2, 5, 5]} intensity={2.2} color="#8cc8ff" />
        <pointLight position={[-3, 1, 2]} intensity={0.9} color="#4da3ff" />
        <pointLight position={[0, 0, 4]} intensity={0.5} color="#ff2d2d" />
        <OrbitRig rotation={rotation} dragging={dragging} selected={selected} filter={filter} onSelect={(product) => { if (!pointer.current.moved) setSelected(product); }} onHover={setHovered} />
        <ContactShadows position={[0, -1.4, 0]} opacity={0.34} scale={13} blur={2.6} far={5} />
      </Canvas>
      <div className="orbit-hint"><span className="drag-dot" /> Drag to rotate · Select a camera</div>
      <AnimateBackdrop selected={selected} onClose={() => setSelected(null)} />
      {selected && <ProductDetail product={selected} onClose={() => setSelected(null)} />}
      {selected && <div className="product-nav-controls"><button data-prev-product aria-label="Previous camera" onClick={() => { const i = products.findIndex((p) => p.id === selected.id); setSelected(products[(i + products.length - 1) % products.length]); }}><ChevronLeft /></button><button data-next-product aria-label="Next camera" onClick={() => { const i = products.findIndex((p) => p.id === selected.id); setSelected(products[(i + 1) % products.length]); }}><ChevronRight /></button></div>}
    </div>
    <Reveal className="showcase-image-wrap"><img src="/products/showcase.png" alt="Six SecureView CCTV camera styles: outdoor bullet, dome, PTZ, IP, indoor, and fisheye" loading="lazy" /><span>THE SECUREVIEW CAMERA RANGE · 4K DETAIL, DESIGNED AROUND YOUR SPACE</span></Reveal>
  </section>;
}

function AnimateBackdrop({ selected, onClose }) {
  return selected ? <button className="detail-backdrop" onClick={onClose} aria-label="Close camera details" /> : null;
}

