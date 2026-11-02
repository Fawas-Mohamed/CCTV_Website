import React, { useCallback, useEffect, useRef, useState } from 'react';
import { ArrowLeft, ArrowRight, Pause, Play, Star } from 'lucide-react';
import { reviews } from '../data/reviews.js';

const SLOTS = {
  '-3': { x: 3, y: 50, scale: 0.12, opacity: 0, z: 1 },
  '-2': { x: 15, y: 54, scale: 0.22, opacity: 0.9, z: 2 },
  '-1': { x: 27, y: 60, scale: 0.3, opacity: 1, z: 3 },
  0: { x: 50, y: 38, scale: 1, opacity: 1, z: 6 },
  1: { x: 73, y: 60, scale: 0.3, opacity: 1, z: 3 },
  2: { x: 85, y: 54, scale: 0.22, opacity: 0.9, z: 2 },
  3: { x: 97, y: 50, scale: 0.12, opacity: 0, z: 1 },
};

const slotOf = (index, active, count) => {
  let distance = ((index - active) % count + count) % count;
  if (distance > count / 2) distance -= count;
  return Math.max(-3, Math.min(3, distance));
};

const sizedPhoto = (photo, size) => photo.replace(/\.webp$/, `-${size}.webp`);

function Portrait({ review, size, active, outgoing, slot, onClick, style }) {
  const [fallback, setFallback] = useState(false);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    setFallback(false);
    setFailed(false);
  }, [review.photo, size]);

  const handleError = () => {
    if (!fallback) setFallback(true);
    else setFailed(true);
  };

  return <div
    className={`review-orbit-item${active ? ' is-active' : ''}`}
    style={style}
    data-slot={slot}
    data-outgoing={outgoing ? 'true' : undefined}
  >
    <span className="review-orbit-position">
      <span className="review-orbit-scale">
        <button
          type="button"
          className={`review-portrait${fallback || failed ? ' is-fallback' : ''}`}
          tabIndex={slot === -3 || slot === 3 ? -1 : 0}
          aria-hidden={slot === -3 || slot === 3 ? 'true' : undefined}
          aria-label={active ? `Current review from ${review.name}` : `Show review from ${review.name}`}
          onClick={onClick}
        >
          {!failed
            ? <img src={fallback ? review.photo : sizedPhoto(review.photo, size)} alt="" decoding="async" loading={active ? 'eager' : 'lazy'} onError={handleError} />
            : <span className="review-initials" aria-hidden="true">{review.name.split(/\s+/).map((part) => part[0]).join('').slice(0, 2)}</span>}
        </button>
      </span>
    </span>
  </div>;
}

function ReviewCopy({ review, entering = false, exiting = false }) {
  return <figure
    className={`review-copy-layer${entering ? ' is-entering' : ''}${exiting ? ' is-exiting' : ''}`}
    aria-hidden={exiting ? 'true' : undefined}
  >
    <div className="review-stars" role="img" aria-label={`${review.rating} out of 5 stars`}>
      {Array.from({ length: 5 }, (_, starIndex) => <Star
        key={starIndex}
        className={`review-star${starIndex < review.rating ? ' is-filled' : ''}`}
        size={20}
        fill={starIndex < review.rating ? 'currentColor' : 'none'}
        aria-hidden="true"
      />)}
    </div>
    <blockquote className="review-quote">“{review.quote}”</blockquote>
    <figcaption className="review-by">
      <span className="review-name">{review.name}</span>
      <span className="review-role">{review.role}</span>
    </figcaption>
  </figure>;
}

export default function ReviewsCarousel({ SectionTag }) {
  const [activeIndex, setActiveIndex] = useState(0);
  const [previousIndex, setPreviousIndex] = useState(null);
  const [hasStarted, setHasStarted] = useState(false);
  const [hasMoved, setHasMoved] = useState(false);
  const [inView, setInView] = useState(false);
  const [animating, setAnimating] = useState(false);
  const [zSwapped, setZSwapped] = useState(false);
  const [userPaused, setUserPaused] = useState(false);
  const [tick, setTick] = useState(0);
  const [nudgeDirection, setNudgeDirection] = useState('next');
  const sectionRef = useRef(null);
  const activeRef = useRef(0);
  const lockRef = useRef(false);
  const pointerStartRef = useRef(null);
  const draggedRef = useRef(false);
  const pausedRef = useRef({
    drag: false,
    hidden: document.hidden,
    offscreen: true,
    manualUntil: 0,
    userPaused: false,
  });
  const transitionTimersRef = useRef(new Set());
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  const clearTransitionTimers = useCallback(() => {
    transitionTimersRef.current.forEach(window.clearTimeout);
    transitionTimersRef.current.clear();
  }, []);

  const moveTo = useCallback((nextIndex, manual = true) => {
    if (lockRef.current || nextIndex === activeRef.current) return;

    clearTransitionTimers();
    const oldIndex = activeRef.current;
    const distance = (nextIndex - oldIndex + reviews.length) % reviews.length;
    setNudgeDirection(distance <= reviews.length / 2 ? 'next' : 'prev');
    setHasMoved(true);
    lockRef.current = true;
    activeRef.current = nextIndex;
    setPreviousIndex(oldIndex);
    setActiveIndex(nextIndex);
    setAnimating(true);
    setZSwapped(false);

    const transitionDuration = reduceMotion ? 250 : 800;
    const buttonUnlockTimer = window.setTimeout(() => {
      transitionTimersRef.current.delete(buttonUnlockTimer);
      setAnimating(false);
    }, reduceMotion ? 250 : 700);
    transitionTimersRef.current.add(buttonUnlockTimer);
    if (!reduceMotion) {
      const zTimer = window.setTimeout(() => {
        transitionTimersRef.current.delete(zTimer);
        setZSwapped(true);
      }, 330);
      transitionTimersRef.current.add(zTimer);
    }
    const endTimer = window.setTimeout(() => {
      transitionTimersRef.current.delete(endTimer);
      setPreviousIndex(null);
      setZSwapped(false);
      setAnimating(false);
      lockRef.current = false;
    }, transitionDuration);
    transitionTimersRef.current.add(endTimer);

    if (manual) pausedRef.current.manualUntil = Date.now() + 8000;
  }, [clearTransitionTimers, reduceMotion]);

  useEffect(() => {
    const section = sectionRef.current;
    if (!section) return undefined;
    const updateVisibility = () => {
      const bounds = section.getBoundingClientRect();
      const visibleHeight = Math.max(0, Math.min(window.innerHeight, bounds.bottom) - Math.max(0, bounds.top));
      const visible = bounds.height > 0 && visibleHeight / bounds.height >= 0.2;
      pausedRef.current.offscreen = !visible;
      setInView(visible);
      if (visible) setHasStarted(true);
    };
    const observer = new IntersectionObserver(updateVisibility, { threshold: [0, 0.2, 0.5] });
    observer.observe(section);
    window.addEventListener('scroll', updateVisibility, { passive: true });
    window.addEventListener('resize', updateVisibility);
    updateVisibility();
    const onVisibilityChange = () => {
      pausedRef.current.hidden = document.hidden;
      setTick((current) => current + 1);
    };
    document.addEventListener('visibilitychange', onVisibilityChange);
    onVisibilityChange();
    return () => {
      observer.disconnect();
      window.removeEventListener('scroll', updateVisibility);
      window.removeEventListener('resize', updateVisibility);
      document.removeEventListener('visibilitychange', onVisibilityChange);
    };
  }, []);

  useEffect(() => () => clearTransitionTimers(), [clearTransitionTimers]);

  useEffect(() => {
    if (!inView) return undefined;
    const interval = reduceMotion ? 7000 : 4500;
    const manualPauseRemaining = pausedRef.current.manualUntil - Date.now();
    const delay = manualPauseRemaining > 0 ? Math.min(interval, manualPauseRemaining) : interval;
    const timer = window.setTimeout(() => {
      const pause = pausedRef.current;
      if (pause.drag || pause.hidden || pause.offscreen || pause.userPaused || Date.now() < pause.manualUntil) {
        setTick((current) => current + 1);
        return;
      }
      moveTo((activeRef.current + 1) % reviews.length, false);
    }, delay);
    return () => window.clearTimeout(timer);
  }, [activeIndex, inView, reduceMotion, tick, moveTo]);

  useEffect(() => {
    if (!inView) return undefined;
    const preload = [1, 2].map((offset) => {
      const review = reviews[(activeIndex + offset) % reviews.length];
      const image = new Image();
      image.decoding = 'async';
      image.src = sizedPhoto(review.photo, 640);
      return image;
    });
    return () => preload.forEach((image) => image.removeAttribute('src'));
  }, [activeIndex, inView]);

  const go = useCallback((direction) => {
    moveTo((activeRef.current + direction + reviews.length) % reviews.length);
  }, [moveTo]);

  const handlePointerDown = (event) => {
    if (event.button !== 0 || event.target.closest('.reviews-controls, .reviews-explore')) return;
    draggedRef.current = false;
    pointerStartRef.current = { x: event.clientX, y: event.clientY };
    pausedRef.current.drag = true;
  };

  const handlePointerUp = (event) => {
    const start = pointerStartRef.current;
    pointerStartRef.current = null;
    pausedRef.current.drag = false;
    if (start) setTick((current) => current + 1);
    if (!start || Math.abs(event.clientX - start.x) < 40 || Math.abs(event.clientY - start.y) > Math.abs(event.clientX - start.x)) return;
    draggedRef.current = true;
    moveTo((activeRef.current + (event.clientX < start.x ? 1 : -1) + reviews.length) % reviews.length);
  };

  const handleKeyDown = (event) => {
    if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') {
      event.preventDefault();
      go(event.key === 'ArrowRight' ? 1 : -1);
    }
  };

  const activeReview = reviews[activeIndex];
  const currentSlot = (index) => slotOf(index, activeIndex, reviews.length);

  return <section
    className={`reviews-section${hasStarted ? ' has-started' : ''}${inView ? ' is-in-view' : ''}${hasMoved ? ' has-moved' : ''}${animating ? ' is-moving' : ''}${reduceMotion ? ' is-reduced' : ''}`}
    id="reviews"
    ref={sectionRef}
    data-direction={nudgeDirection}
  >
    <SectionTag camera="CAM 05">CUSTOMER REVIEWS</SectionTag>
    <div
      className="reviews-stage"
      role="region"
      aria-roledescription="carousel"
      aria-label="Customer reviews"
      tabIndex={0}
      onKeyDown={handleKeyDown}
      onPointerDown={handlePointerDown}
      onPointerUp={handlePointerUp}
      onPointerCancel={() => {
        pointerStartRef.current = null;
        draggedRef.current = false;
        pausedRef.current.drag = false;
        setTick((current) => current + 1);
      }}
    >
      <div className="reviews-headline-mask" aria-hidden="true">
        <h2 className="reviews-headline">REVIEWS</h2>
      </div>

      <div className="review-orbit" role="group" aria-label="Choose a reviewer">
        {reviews.map((review, index) => {
          const slot = currentSlot(index);
          const position = SLOTS[slot];
          const isActive = index === activeIndex;
          const isOutgoing = index === previousIndex;
          const zIndex = isActive && previousIndex !== null && !zSwapped ? 3 : isOutgoing && !zSwapped ? 6 : position.z;
          return <Portrait
            key={review.photo}
            review={review}
            size={isActive ? 640 : 200}
            active={isActive}
            slot={slot}
            outgoing={index === previousIndex}
            onClick={() => {
              if (draggedRef.current) {
                draggedRef.current = false;
                return;
              }
              moveTo(index);
            }}
            style={{
              '--slot-x': `${position.x}cqw`,
              '--slot-y': `${position.y}cqh`,
              '--slot-scale': position.scale,
              '--slot-opacity': position.opacity,
              '--slot-z': zIndex,
              '--bob-delay': `${(index % 5) * -0.8}s`,
              '--entry-delay': `${1600 + Math.abs(slot) * 80}ms`,
            }}
          />;
        })}
      </div>

      <div className="review-copy" aria-live="off">
        {previousIndex !== null && <ReviewCopy key={`exit-${previousIndex}`} review={reviews[previousIndex]} exiting />}
        <ReviewCopy key={`active-${activeIndex}`} review={activeReview} entering={hasStarted && previousIndex !== null} />
      </div>

      <div className="reviews-bottom-left">
        <div className="reviews-trust-copy">
          <strong>TRUSTED BY 120,000+ CUSTOMERS</strong>
          <p>Real stories from homeowners and business owners who protect what matters with SecureView.</p>
        </div>
        <div className="reviews-controls">
          <button type="button" className="review-control" aria-label="Previous review" disabled={animating} onClick={() => go(-1)}><ArrowLeft size={18} /></button>
          <button type="button" className="review-control" aria-label="Next review" disabled={animating} onClick={() => go(1)}><ArrowRight size={18} /></button>
          <button
            type="button"
            className="review-control review-auto-toggle"
            aria-label={userPaused ? 'Play automatic change' : 'Pause automatic change'}
            onClick={() => {
              const nextPaused = !pausedRef.current.userPaused;
              pausedRef.current.userPaused = nextPaused;
              setUserPaused(nextPaused);
              setTick((current) => current + 1);
            }}
          >
            {userPaused ? <Play size={16} /> : <Pause size={16} />}
          </button>
          <span className="review-counter">{String(activeIndex + 1).padStart(2, '0')} / {String(reviews.length).padStart(2, '0')}</span>
        </div>
      </div>

      <a className="reviews-explore" href="#contact">
        <span>EXPLORE STORIES</span><ArrowRight size={18} aria-hidden="true" />
      </a>
      <span className="reviews-live" aria-live="polite" aria-atomic="true">
        Review {activeIndex + 1} of {reviews.length}: {activeReview.name}, {activeReview.rating} stars
      </span>
    </div>
  </section>;
}
