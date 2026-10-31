import React, { useEffect, useState } from 'react';
import { ArrowRight, MoonStar, PersonStanding, Play, Smartphone, Users } from 'lucide-react';

export default function IntroCover() {
  const [on, setOn] = useState(() => window.scrollY <= 8);

  useEffect(() => {
    const check = () => setOn((previous) => (previous ? window.scrollY <= 8 : window.scrollY <= 1));
    check();
    window.addEventListener('scroll', check, { passive: true });
    window.addEventListener('pageshow', check);
    return () => {
      window.removeEventListener('scroll', check);
      window.removeEventListener('pageshow', check);
    };
  }, []);

  useEffect(() => {
    document.documentElement.dataset.cover = on ? 'on' : 'off';
    return () => {
      delete document.documentElement.dataset.cover;
    };
  }, [on]);

  const watch = () => {
    const track = document.getElementById('home');
    if (track) {
      window.scrollTo({
        top: track.offsetTop + (track.offsetHeight - window.innerHeight) * 0.08,
        behavior: 'smooth',
      });
    }
  };
  return <section className={'cover' + (on ? '' : ' is-away')} aria-hidden={!on} inert={!on}>
    <picture>
      <source media="(max-width: 767px)" srcSet="/hero/cover-bg-mobile.webp" type="image/webp" />
      <img className="cover-background" src="/hero/cover-bg.webp" srcSet="/hero/cover-bg-mobile.webp 1080w, /hero/cover-bg.webp 1365w" sizes="100vw" alt="" />
    </picture>
    <div className="cover-wash" />
    <svg className="cover-decoration" viewBox="0 0 100 300" preserveAspectRatio="none" aria-hidden="true">
      <circle cx="-70" cy="340" r="100" />
      <circle cx="-70" cy="340" r="120" />
      <circle cx="-70" cy="340" r="140" />
    </svg>
    <span className="cover-corner-block" aria-hidden="true" />
    <div className="cover-copy">
      <div className="cover-eyebrow"><i /> OUTDOOR SECURITY CAMERA</div>
      <h1><strong>Smarter Security</strong><span>for a Safer Tomorrow</span></h1>
      <p>Our advanced CCTV cameras keep your home and business protected 24/7 with crystal-clear video, intelligent alerts and complete peace of mind.</p>
      <div className="cover-features">
        <div className="cover-feature">
          <span className="cover-feature-icon"><span className="cover-hd-mark">HD</span></span>
          <span className="cover-feature-label"><span>HD</span><span>Video Quality</span></span>
        </div>
        <div className="cover-feature">
          <span className="cover-feature-icon"><MoonStar /></span>
          <span className="cover-feature-label"><span>Night Vision</span><span>Up to 50m</span></span>
        </div>
        <div className="cover-feature">
          <span className="cover-feature-icon"><PersonStanding /></span>
          <span className="cover-feature-label"><span>Motion</span><span>Detection</span></span>
        </div>
        <div className="cover-feature">
          <span className="cover-feature-icon"><Smartphone /></span>
          <span className="cover-feature-label"><span>Remote</span><span>Access</span></span>
        </div>
      </div>
      <div className="cover-buttons">
        <a className="cover-button" href="#products"><span>Explore Our Cameras</span><ArrowRight size={18} /></a>
        <button className="cover-watch" type="button" onClick={watch}><span className="cover-play"><Play /></span><span>Watch Video</span></button>
      </div>
      <div className="cover-trust"><Users /><span>Trusted by 120,000+<br />Happy Customers</span></div>
    </div>
  </section>;
}
