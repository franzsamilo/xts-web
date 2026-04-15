"use client";

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useSession } from 'next-auth/react';

interface CartItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
  category?: string;
  sku?: string;
  tag?: string;
  imageUrl?: string;
  sellerId?: string;
}

interface CartContextType {
  items: CartItem[];
  addToCart: (item: Omit<CartItem, 'quantity'>) => void;
  removeFromCart: (id: string) => void;
  updateQuantity: (id: string, quantity: number) => void;
  clearCart: () => void;
  cartCount: number;
  cartTotal: number;
}

const CartContext = createContext<CartContextType>({
  items: [],
  addToCart: () => {},
  removeFromCart: () => {},
  updateQuantity: () => {},
  clearCart: () => {},
  cartCount: 0,
  cartTotal: 0,
});

export const useCart = () => useContext(CartContext);

const STORAGE_PREFIX = 'xts-cart-';
export const PENDING_GCASH_ORDER_KEY = 'xts-pending-gcash-order';

export const CartProvider = ({ children }: { children: React.ReactNode }) => {
  const { data: session } = useSession();
  const [items, setItems] = useState<CartItem[]>([]);
  const [mounted, setMounted] = useState(false);
  const [currentKey, setCurrentKey] = useState<string | null>(null);

  // Derive per-user storage key from session email
  useEffect(() => {
    if (session?.user?.email) {
      const key = STORAGE_PREFIX + session.user.email;
      setCurrentKey(key);
      try {
        const saved = localStorage.getItem(key);
        if (saved) setItems(JSON.parse(saved));
        else setItems([]);
      } catch {}
    } else {
      // Not logged in — use a guest key
      const guestKey = STORAGE_PREFIX + 'guest';
      setCurrentKey(guestKey);
      try {
        const saved = localStorage.getItem(guestKey);
        if (saved) setItems(JSON.parse(saved));
        else setItems([]);
      } catch {}
    }
    setMounted(true);
  }, [session?.user?.email]);

  // After a GCash redirect, the user returns with cart still populated.
  // If their pending order has been confirmed paid (webhook fired), clear the cart.
  // If it failed, also clear the marker — they'll need to place a new order.
  useEffect(() => {
    if (!mounted || !session?.user?.email) return;
    let cancelled = false;
    const checkPendingPayment = async () => {
      let pendingOrderId: string | null = null;
      try {
        pendingOrderId = localStorage.getItem(PENDING_GCASH_ORDER_KEY);
      } catch {}
      if (!pendingOrderId) return;
      try {
        const res = await fetch('/api/orders');
        if (!res.ok) return;
        const orders = (await res.json()) as Array<{ id: string; paymentStatus?: string }>;
        const order = orders.find((o) => o.id === pendingOrderId);
        if (cancelled || !order) return;
        if (order.paymentStatus === 'paid') {
          setItems([]);
          try { localStorage.removeItem(PENDING_GCASH_ORDER_KEY); } catch {}
        } else if (order.paymentStatus === 'failed') {
          try { localStorage.removeItem(PENDING_GCASH_ORDER_KEY); } catch {}
        }
      } catch {}
    };
    checkPendingPayment();
    return () => { cancelled = true; };
  }, [mounted, session?.user?.email]);

  // Save to localStorage whenever items change
  useEffect(() => {
    if (mounted && currentKey) {
      localStorage.setItem(currentKey, JSON.stringify(items));
    }
  }, [items, mounted, currentKey]);

  const addToCart = useCallback((item: Omit<CartItem, 'quantity'>) => {
    setItems(prev => {
      const existing = prev.find(i => i.id === item.id);
      if (existing) {
        return prev.map(i => i.id === item.id ? { ...i, quantity: i.quantity + 1 } : i);
      }
      return [...prev, { ...item, quantity: 1 }];
    });
  }, []);

  const removeFromCart = useCallback((id: string) => {
    setItems(prev => prev.filter(i => i.id !== id));
  }, []);

  const updateQuantity = useCallback((id: string, quantity: number) => {
    if (quantity <= 0) {
      setItems(prev => prev.filter(i => i.id !== id));
      return;
    }
    setItems(prev => prev.map(i => i.id === id ? { ...i, quantity } : i));
  }, []);

  const clearCart = useCallback(() => setItems([]), []);

  const cartCount = items.reduce((sum, i) => sum + i.quantity, 0);
  const cartTotal = items.reduce((sum, i) => sum + (i.price * i.quantity), 0);

  return (
    <CartContext.Provider value={{ items, addToCart, removeFromCart, updateQuantity, clearCart, cartCount, cartTotal }}>
      {children}
    </CartContext.Provider>
  );
};
