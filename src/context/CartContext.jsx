import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';

const CartContext = createContext(null);
const CART_KEY = 'secureview-cart';

export function CartProvider({ children }) {
  const [items, setItems] = useState(() => {
    try { return JSON.parse(localStorage.getItem(CART_KEY) || '[]'); }
    catch { return []; }
  });

  useEffect(() => {
    try { localStorage.setItem(CART_KEY, JSON.stringify(items)); } catch { /* storage may be unavailable */ }
  }, [items]);

  const value = useMemo(() => ({
    items,
    count: items.reduce((sum, item) => sum + item.qty, 0),
    total: items.reduce((sum, item) => sum + item.price * item.qty, 0),
    add(product, qty = 1) {
      setItems((current) => {
        const found = current.find((item) => item.id === product.id);
        return found
          ? current.map((item) => item.id === product.id ? { ...item, qty: item.qty + qty } : item)
          : [...current, { id: product.id, name: product.name, price: product.price, qty, image: '/products/showcase.png' }];
      });
    },
    setQty(id, qty) {
      setItems((current) => qty < 1 ? current.filter((item) => item.id !== id) : current.map((item) => item.id === id ? { ...item, qty } : item));
    },
    remove(id) { setItems((current) => current.filter((item) => item.id !== id)); },
    clear() { setItems([]); },
  }), [items]);

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const value = useContext(CartContext);
  if (!value) throw new Error('useCart must be used inside CartProvider');
  return value;
}
