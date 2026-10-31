import React, { useEffect, useRef, useState } from 'react';
import { Menu, ShoppingCart, X, ArrowRight, Minus, Plus, Trash2, Globe, ChevronDown } from 'lucide-react';
import { useCart } from '../context/CartContext.jsx';
import { products } from '../data/shop.js';

const money = (amount) => '$' + amount.toFixed(2);

function CartDrawer({ open, onClose }) {
  const { items, total, setQty, remove } = useCart();
  const drawerRef = useRef(null);
  const [checkout, setCheckout] = useState(false);

  useEffect(() => {
    if (!open) return;
    const previous = document.activeElement;
    drawerRef.current?.focus();
    const onKey = (event) => {
      if (event.key === 'Escape') onClose();
      if (event.key === 'Tab' && drawerRef.current) {
        const nodes = drawerRef.current.querySelectorAll('button:not([disabled]), a[href], input');
        if (!nodes.length) return;
        const first = nodes[0];
        const last = nodes[nodes.length - 1];
        if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
        else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
      }
    };
    document.addEventListener('keydown', onKey);
    return () => { document.removeEventListener('keydown', onKey); previous?.focus?.(); };
  }, [open, onClose]);

  if (!open) return null;
  return <div className="drawer-backdrop" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}>
    <aside className="cart-drawer" role="dialog" aria-modal="true" aria-labelledby="cart-title" tabIndex={-1} ref={drawerRef}>
      <div className="drawer-head"><div><span className="eyebrow-small">SECUREVIEW SHOP</span><h2 id="cart-title">Your cart <span>({items.length})</span></h2></div><button className="icon-button dark" onClick={onClose} aria-label="Close cart"><X /></button></div>
      {items.length ? <>
        <div className="cart-lines">{items.map((item) => {
          const product = products.find((entry) => entry.id === item.id);
          return <article className="cart-line" key={item.id}>
            <div className="cart-thumb"><img src="/products/showcase.png" alt="" style={{ objectPosition: product?.thumb || '50% 50%' }} /></div>
            <div className="cart-line-info"><strong>{item.name}</strong><span>{money(item.price)}</span><div className="qty-control"><button onClick={() => setQty(item.id, item.qty - 1)} aria-label={'Decrease ' + item.name}><Minus size={14} /></button><span>{item.qty}</span><button onClick={() => setQty(item.id, item.qty + 1)} aria-label={'Increase ' + item.name}><Plus size={14} /></button></div></div>
            <button className="remove-button" onClick={() => remove(item.id)} aria-label={'Remove ' + item.name}><Trash2 size={17} /></button>
          </article>;
        })}</div>
        <div className="cart-total"><div><span>Subtotal</span><strong>{money(total)}</strong></div><small>Shipping and taxes are calculated at checkout.</small><button className="checkout-button" onClick={() => setCheckout(true)}>Checkout <ArrowRight size={17} /></button>{checkout && <p className="checkout-note">Checkout is ready to connect to your payment provider.</p>}</div>
      </> : <div className="cart-empty"><span className="empty-icon"><ShoppingCart /></span><h3>Your cart is empty</h3><p>Explore the camera range and choose a system for your space.</p><button className="btn-primary dark-text" onClick={onClose}>Explore cameras <ArrowRight size={16} /></button></div>}
    </aside>
  </div>;
}

export default function Header() {
  const { count } = useCart();
  const [cartOpen, setCartOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [activeSection, setActiveSection] = useState('#home');
  const menuRef = useRef(null);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    const targets = ['home', 'categories', 'services', 'reviews', 'contact', 'products']
      .map((id) => document.getElementById(id))
      .filter(Boolean);
    if (!targets.length) return undefined;
    const observer = new IntersectionObserver(() => {
      const cutoff = window.innerHeight * 0.4;
      const current = targets
        .map((target) => ({ id: target.id, rect: target.getBoundingClientRect() }))
        .filter(({ rect }) => rect.top < cutoff && rect.bottom > 64)
        .sort((a, b) => b.rect.top - a.rect.top)[0];
      setActiveSection(current?.id === 'products' ? null : '#' + (current?.id || 'home'));
    }, { rootMargin: '-64px 0px -60% 0px' });
    targets.forEach((target) => observer.observe(target));
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!menuOpen) return;
    const onKey = (event) => { if (event.key === 'Escape') setMenuOpen(false); };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [menuOpen]);

  const links = [['Home', '#home'], ['About', '#categories'], ['Services', '#services'], ['FAQ', '#reviews'], ['Contact Us', '#contact']];
  return <>
    <header className={'shop-header' + (scrolled ? ' is-scrolled' : '')}>
      <a className="wordmark" href="#home" aria-label="SecureView home">
        <svg className="brand-shield" viewBox="0 0 32 36" aria-hidden="true">
          <path d="M16 1 30 7v10c0 8-5.3 14-14 18C7.3 31 2 25 2 17V7l14-6Z" />
          <circle cx="16" cy="17" r="6" />
        </svg>
        <span>Secure<span className="wordmark-view">View</span></span>
      </a>
      <nav className={'primary-nav' + (menuOpen ? ' is-open' : '')} aria-label="Main navigation" ref={menuRef}>
        <div className="mobile-nav-top"><a className="mobile-nav-brand" href="#home" onClick={() => setMenuOpen(false)}>Secure<span>View</span></a><button className="icon-button" onClick={() => setMenuOpen(false)} aria-label="Close menu"><X /></button></div>
        {links.map(([label, href]) => <a key={label} className={activeSection === href ? 'is-active' : ''} href={href} aria-current={activeSection === href ? 'page' : undefined} onClick={() => setMenuOpen(false)}>{label}</a>)}
        <a className="mobile-join" href="#products" onClick={() => setMenuOpen(false)}>Join Now <ArrowRight size={16} /></a>
      </nav>
      <div className="header-actions">
        <span className="header-language" aria-label="Language: English"><Globe /><span>EN</span><ChevronDown size={13} /></span>
        <button className="icon-button cart-button" onClick={() => setCartOpen(true)} aria-label={'Open cart, ' + count + ' items'}><ShoppingCart /><span key={count} className="cart-count">{count}</span></button>
        <a className="header-join" href="#products">Join Now <ArrowRight size={16} /></a>
        <button className="icon-button menu-button" onClick={() => setMenuOpen(true)} aria-label="Open menu"><Menu /></button>
      </div>
    </header>
    <CartDrawer open={cartOpen} onClose={() => setCartOpen(false)} />
  </>;
}
