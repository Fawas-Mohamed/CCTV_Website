import React, { lazy, Suspense, useEffect, useRef, useState } from 'react';
import { motion, useReducedMotion, useScroll, useTransform } from 'framer-motion';
import { ArrowDownRight, ArrowRight, Shield } from 'lucide-react';
import { categories, services } from '../data/shop.js';

const ReviewsBooks = lazy(() => import('./ReviewsBooks.jsx'));

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

export function Reviews() {
  const [inView, setInView] = useState(false);
  const [hasStarted, setHasStarted] = useState(false);
  const sectionRef = useRef(null);
  const wordmarkRef = useRef(null);
  const linksRef = useRef(null);
  const topRowRef = useRef(null);
  const reduce = useReducedMotion();

  useEffect(() => {
    const section = sectionRef.current;
    if (!section) return undefined;

    const observer = new IntersectionObserver(([entry]) => {
      const visible = Boolean(entry?.isIntersecting && entry.intersectionRatio >= 0.35);
      setInView(visible);
      if (visible) setHasStarted(true);
    }, { threshold: [0, 0.35, 0.5] });

    observer.observe(section);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const section = sectionRef.current;
    if (!section) return undefined;
    section.dispatchEvent(new Event('reviews-view-change'));
    return undefined;
  }, [inView]);

  useEffect(() => {
    if (!hasStarted) return undefined;
    const wordmark = wordmarkRef.current;
    const links = linksRef.current;
    const topRow = topRowRef.current;
    if (!wordmark || !links || !topRow) return undefined;

    if (reduce || typeof wordmark.animate !== 'function') {
      [wordmark, links, topRow].forEach((element) => {
        element.style.opacity = '1';
        element.style.filter = 'none';
        element.style.transform = '';
      });
      return undefined;
    }

    const animations = [
      wordmark.animate([
        { opacity: 0, transform: 'translate(-1cqw, 4cqh)', filter: 'blur(14px)' },
        { opacity: 1, transform: 'translate(-1cqw, 0)', filter: 'blur(0px)' },
      ], { duration: 1400, delay: 150, easing: 'cubic-bezier(.2,.8,.2,1)', fill: 'both' }),
      topRow.animate([
        { opacity: 0, transform: 'translateY(-1.2cqh)' },
        { opacity: 1, transform: 'translateY(0)' },
      ], { duration: 900, delay: 700, easing: 'cubic-bezier(.2,.8,.2,1)', fill: 'both' }),
      links.animate([
        { opacity: 0, transform: 'translateY(1.2cqh)' },
        { opacity: 1, transform: 'translateY(0)' },
      ], { duration: 900, delay: 850, easing: 'cubic-bezier(.2,.8,.2,1)', fill: 'both' }),
    ];

    return () => animations.forEach((animation) => animation.cancel());
  }, [hasStarted, reduce]);

  return <section className="reviews-section" id="reviews" ref={sectionRef}>
    <div className="reviews-visual">
      <div className="reviews-wordmark" ref={wordmarkRef}>Reviews</div>
      <div className="reviews-links" aria-label="Customer types" ref={linksRef}>
        <span>Homeowners</span>
        <span>Business Owners</span>
        <span>Installation</span>
        <span>Night Vision</span>
        <span>Mobile App</span>
        <span>Support</span>
      </div>
      <div className="reviews-canvas-wrap">
        {hasStarted && (
          <Suspense fallback={null}>
            <ReviewsBooks inView={inView} reducedMotion={reduce} />
          </Suspense>
        )}
      </div>
      <div className="reviews-top-row" ref={topRowRef}>
        <SectionTag camera="CAM 05">REVIEWS</SectionTag>
        <span className="review-trust-badge">SAMPLE REVIEWS</span>
        <a className="review-explore" href="#contact">
          <span className="review-explore-full">Explore Customer Stories →</span>
          <span className="review-explore-short">Customer Stories →</span>
        </a>
      </div>
    </div>
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
