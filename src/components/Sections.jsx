import React, { useEffect, useMemo, useRef } from 'react';
import { motion, useReducedMotion, useScroll, useTransform } from 'framer-motion';
import { ArrowDownRight, ArrowRight, CirclePlay, Shield, Star } from 'lucide-react';
import { categories, reviews, services } from '../data/shop.js';

const frame = (number) => '/frames/CCTV_frames_30fps/frame_' + number + '.jpg';

export function SectionTag({ children, camera = 'CAM 02' }) {
  return <div className="section-tag"><span className="tag-corners" /><span className="tag-rec"><i className="rec-dot" /> REC</span><span>{camera} · {children}</span></div>;
}

export function Seam({ from = '#05070B', to = '#030813', beam = '48%' }) {
  return <div className="seam" aria-hidden="true">
    <svg className="seam-svg" viewBox="0 0 1440 180" preserveAspectRatio="none">
      <path d="M0 0H1440V55L1290 72 1180 65 1050 95 930 82 810 120 680 100 545 130 420 104 300 119 180 82 70 96 0 76Z" fill={from} />
      <path d="M0 76 70 96 180 82 300 119 420 104 545 130 680 100 810 120 930 82 1050 95 1180 65 1290 72 1440 55V180H0Z" fill={to} />
      <path d="M0 76 70 96 180 82 300 119 420 104 545 130 680 100 810 120 930 82 1050 95 1180 65 1290 72 1440 55" className="seam-edge" />
      {[16, 42, 79].map((n) => <circle key={n} cx={n * 18} cy={76 + n % 3 * 9} r="3" className="seam-led" />)}
    </svg>
    {beam !== 'none' && <div className="seam-beam" style={{ left: beam }}><i /><i /><i /><i /></div>}
  </div>;
}

export function Reveal({ children, className = '', delay = 0 }) {
  const reduce = useReducedMotion();
  return <motion.div className={className} initial={reduce ? false : { opacity: 0, y: 28 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: '-50px' }} transition={{ duration: reduce ? 0 : 0.7, ease: [0.25, 0.1, 0.25, 1], delay }}>{children}</motion.div>;
}

function CategoryCard({ category, index, onChoose }) {
  const cardRef = useRef(null);
  const videoRef = useRef(null);
  const reduce = useReducedMotion();

  useEffect(() => {
    const video = videoRef.current;
    if (!video || reduce) return;
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) video.play().catch(() => {});
      else video.pause();
    }, { threshold: 0.2 });
    observer.observe(cardRef.current);
    return () => { observer.disconnect(); video.pause(); };
  }, [reduce]);

  return <motion.article ref={cardRef} className="category-card" initial={reduce ? false : { opacity: 0, y: 48 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, amount: 0.1 }} transition={{ duration: reduce ? 0 : 0.8, delay: index * 0.13 }}>
    <video ref={videoRef} className="category-video" src={category.video} poster={category.poster} autoPlay={!reduce} loop muted playsInline preload="none" aria-label={category.title + ' security camera video'} />
    <div className="category-shade" />
    <div className="category-top"><span>0{index + 1} / 03</span><ArrowDownRight size={19} /></div>
    <h3>{category.name}</h3>
    <button className="pill-button" onClick={() => onChoose(category.filter)}>Shop {category.name} <ArrowRight size={15} /></button>
  </motion.article>;
}

export function Categories({ onChoose }) {
  return <section className="categories-section" id="categories">
    <SectionTag>CAMERAS · CATEGORIES</SectionTag>
    <div className="section-intro categories-intro"><div><span className="overline">FIND YOUR VIEW</span><h2 className="section-title">Protection for <em>every place.</em></h2></div><p>Considered cameras and systems for the people and spaces you want to protect.</p></div>
    <div className="category-grid">{categories.map((category, index) => <CategoryCard key={category.id} category={category} index={index} onChoose={onChoose} />)}</div>
  </section>;
}

function ServiceCard({ service, index }) {
  const ref = useRef(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start end', 'end start'] });
  const scale = useTransform(scrollYProgress, [0, 1], [1, 1 - (services.length - 1 - index) * 0.03]);
  return <div ref={ref} className="service-card-wrap" style={{ top: 'calc(86px + ' + index * 26 + 'px)' }}>
    <motion.article className="service-card" style={{ scale }}>
      <div className="service-card-head"><span className="service-number">{service.number}</span><div><span>{service.category}</span><h3>{service.name}</h3></div><a className="service-book" href="#contact">Book service <ArrowRight size={15} /></a></div>
      <p className="service-description">{service.copy}</p>
      <div className="service-image-grid">
        <img src={frame(service.images[0])} loading="lazy" alt={service.name + ' security camera detail'} />
        <img src={frame(service.images[1])} loading="lazy" alt="CCTV camera coverage example" />
        <img src={frame(service.images[2])} loading="lazy" alt="SecureView installation and camera footage" />
      </div>
    </motion.article>
  </div>;
}

export function Services() {
  return <section className="services-section" id="services">
    <SectionTag camera="CAM 04">INSTALLATION · CARE</SectionTag>
    <Reveal className="services-heading"><span className="overline">A CLEARER PLAN</span><h2 className="section-title">Services</h2><p>From first walkthrough to ongoing care, let’s make your system work for your space.</p></Reveal>
    <div className="services-stack">{services.map((service, index) => <ServiceCard key={service.number} service={service} index={index} />)}</div>
  </section>;
}

function ReviewCard({ review, index }) {
  const tilt = (index % 5 - 2) * 1.1;
  return <article className="review-card" style={{ '--tilt': tilt + 'deg', '--lift': (Math.abs(index % 7 - 3) * 8) + 'px' }}>
    <div className="review-media"><img src={frame(review.frame)} alt="" loading="lazy" /><span className="review-play"><CirclePlay size={25} /></span></div>
    <p>“{review.quote}”</p>
    <div className="review-stars" aria-label="5 out of 5 stars">{[1,2,3,4,5].map((n) => <Star key={n} size={13} fill="currentColor" />)}</div>
    <div className="review-author"><span>{review.name.split(' ').map((part) => part[0]).join('')}</span><div><strong>{review.name}</strong><small>{review.role}</small></div></div>
  </article>;
}

export function Reviews() {
  const railRef = useRef(null);
  const pause = useRef(false);
  const pointer = useRef({ x: 0, down: false });
  const reduce = useReducedMotion();
  const doubleReviews = useMemo(() => [...reviews, ...reviews], []);

  useEffect(() => {
    const rail = railRef.current;
    if (!rail || reduce) return;
    let raf = 0;
    let last = performance.now();
    const tick = (now) => {
      const dt = Math.min(40, now - last);
      last = now;
      if (!pause.current && !pointer.current.down) {
        rail.scrollLeft += dt * 0.026;
        if (rail.scrollLeft >= rail.scrollWidth / 2) rail.scrollLeft -= rail.scrollWidth / 2;
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [reduce]);

  const onDown = (event) => { pointer.current = { x: event.clientX, down: true }; railRef.current.setPointerCapture(event.pointerId); pause.current = true; };
  const onMove = (event) => { if (!pointer.current.down) return; railRef.current.scrollLeft -= event.clientX - pointer.current.x; pointer.current.x = event.clientX; };
  const onUp = () => { pointer.current.down = false; pause.current = false; };

  return <section className="reviews-section" id="reviews">
    <SectionTag camera="CAM 05">CUSTOMER STORIES</SectionTag>
    <div className="reviews-heading"><span className="trust-badge"><i /> Trusted by 120,000+ happy customers</span><h2>Real People.<br /><em>Real Security Stories.</em></h2><p>Our customers trust our CCTV cameras to protect their homes and businesses. Here’s what they have to say about their experience.</p></div>
    <div className="review-notes"><span>Real people. Real experiences.<svg viewBox="0 0 120 65"><path d="M6 10c35-4 44 10 53 42m0 0 5-17m-5 17-16-8" /></svg></span><span>See what our customers say<svg viewBox="0 0 120 65"><path d="M113 9C78 5 68 20 59 52m0 0-5-17m5 17 16-8" /></svg></span></div>
    <div className="review-rail-wrap">
      <div className="review-rail" ref={railRef} onPointerDown={onDown} onPointerMove={onMove} onPointerUp={onUp} onPointerCancel={onUp} onPointerLeave={onUp} onMouseEnter={() => { pause.current = true; }} onMouseLeave={() => { pause.current = false; }}>
        {doubleReviews.map((review, index) => <ReviewCard key={index} review={review} index={index % reviews.length} />)}
      </div>
    </div>
    <a className="review-cta" href="#services"><span />Explore Customer Stories <ArrowRight size={16} /><span /></a>
  </section>;
}

export function Footer() {
  return <footer className="site-footer" id="contact">
    <div className="footer-top"><div><span className="overline">SECUREVIEW CCTV SHOP</span><h2>Secure <em>Your World.</em></h2><p>Thoughtful cameras and practical support for a safer tomorrow.</p></div><a className="btn-primary" href="#services">Get a free site survey <ArrowRight size={18} /></a></div>
    <div className="footer-links">
      <div><strong>SHOP</strong><a href="#categories">Home cameras</a><a href="#categories">Business systems</a><a href="#products">All cameras</a></div>
      <div><strong>SERVICES</strong><a href="#services">Site survey</a><a href="#services">Installation</a><a href="#services">Maintenance</a></div>
      <div><strong>SUPPORT</strong><a href="#reviews">Customer stories</a><a href="#home">Security tips</a><a href="#contact">Get in touch</a></div>
      <div className="footer-contact"><span><Shield size={17} /> Your security, considered.</span><span>Camera systems · Installation · Support</span></div>
    </div>
    <div className="footer-bottom"><a className="wordmark footer-wordmark" href="#home"><span className="brand-lens"><i /></span><span>SECUREVIEW</span></a><span>© 2026 SecureView CCTV Shop</span><span className="footer-rec"><i className="rec-dot" /> SYSTEM READY</span></div>
  </footer>;
}
