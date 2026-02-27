"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { XTSLogo, ShopIcon, FabricationIcon, ConsultationIcon, CommunityIcon } from '@/components/icons';
import { Button } from '@/components/ui/Button';
import { cn } from '@/lib/utils';
import { Menu, X, ShoppingCart, LogOut, User as UserIcon, LayoutDashboard, Loader2, MessageCircle, Wrench } from 'lucide-react';
import { useSession, signOut } from 'next-auth/react';
import { useCart } from '@/lib/cart-context';
import { ThemeToggle } from '@/components/providers/ThemeProvider';

const navLinks = [
  { name: 'Shop', href: '/shop', icon: ShopIcon },
  { name: 'Services', href: '/services', icon: FabricationIcon },
  { name: 'Experts', href: '/consultation', icon: ConsultationIcon },
  { name: 'Community', href: '/community', icon: CommunityIcon },
];

export const Navbar = () => {
  const { data: session } = useSession();
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);
  const { cartCount } = useCart();

  useEffect(() => {
    setMounted(true);
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleSignOut = async () => {
    setLoggingOut(true);
    await signOut({ callbackUrl: '/' });
  };

  const navClasses = mounted && isScrolled
    ? "bg-[var(--nav-bg)] backdrop-blur-md py-3 border-b border-[var(--border-primary)] shadow-xl"
    : "bg-[var(--nav-bg-transparent)] py-5";

  return (
    <nav className={cn(
      "fixed top-0 left-0 w-full z-50 transition-all duration-300",
      navClasses
    )}>
      <div className="container mx-auto px-4 sm:px-6 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2 sm:gap-3 group">
          <XTSLogo className="w-10 h-10 sm:w-12 sm:h-12 group-hover:rotate-12 transition-transform" />
          <span className="text-xl sm:text-2xl md:text-3xl font-black tracking-tighter text-[var(--text-primary)]">XTS WEB</span>
        </Link>

        {/* Desktop Nav */}
        <div className="hidden lg:flex items-center gap-6">
          {navLinks.map((link) => (
            <Link
              key={link.name}
              href={link.href}
              className="group flex items-center gap-2 text-[var(--text-secondary)] hover:text-safety-orange transition-colors"
            >
              <link.icon className="w-4 h-4 group-hover:scale-110 transition-transform" />
              <span className="text-sm font-bold uppercase tracking-tight">{link.name}</span>
            </Link>
          ))}
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2 sm:gap-3">
          <ThemeToggle />

          <Link href="/chat" className="hidden md:inline-flex relative p-2 text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors" title="Messages">
            <MessageCircle className="w-5 h-5 sm:w-6 sm:h-6" />
          </Link>

          <Link href="/cart" className="relative p-2 text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors">
            <ShoppingCart className="w-5 h-5 sm:w-6 sm:h-6" />
            {cartCount > 0 && (
              <motion.span
                key={cartCount}
                initial={{ scale: 0.5 }}
                animate={{ scale: 1 }}
                className="absolute top-0 right-0 bg-safety-orange text-white text-[10px] font-bold min-w-[16px] h-4 flex items-center justify-center rounded-full leading-none px-1"
              >
                {cartCount > 99 ? '99+' : cartCount}
              </motion.span>
            )}
          </Link>

          <div className="hidden md:flex items-center gap-3">
            {session ? (
              <div className="flex items-center gap-3">
                {((session.user as any)?.role?.includes('admin') || (session.user as any)?.role?.includes('expert')) && (
                  <Link href="/admin" className="mr-1">
                    <Button variant="outline" size="sm" className={cn(
                      "border-[var(--border-primary)] text-[var(--text-secondary)] hover:bg-[var(--bg-surface)]",
                      (session.user as any)?.role?.includes('admin') && "border-red-500/50 text-red-500 hover:bg-red-500/10"
                    )}>
                      {(session.user as any)?.role?.includes('admin') ? 'Terminal' : 'Portal'}
                    </Button>
                  </Link>
                )}
                {((session.user as any)?.role?.includes('admin') || (session.user as any)?.role?.includes('seller')) && (
                  <Link href="/seller">
                    <Button variant="outline" size="sm" className="border-blue-500/50 text-blue-500 hover:bg-blue-500/10">
                      Seller
                    </Button>
                  </Link>
                )}
                <Link href="/dashboard" className="flex items-center gap-2 group">
                  {session.user?.image ? (
                    <img src={session.user.image} alt="Profile" className="w-8 h-8 rounded-full border border-[var(--border-primary)]" />
                  ) : (
                    <div className="w-8 h-8 rounded-full bg-[var(--bg-surface)] flex items-center justify-center border border-[var(--border-primary)]">
                      <UserIcon className="w-4 h-4 text-[var(--text-primary)]" />
                    </div>
                  )}
                  <div className="flex flex-col">
                    <span className="text-[10px] font-black uppercase text-[var(--text-muted)] leading-none mb-1">Authenticated</span>
                    <span className="text-xs font-bold text-[var(--text-primary)] leading-none">{session.user?.name?.split(' ')[0]}</span>
                  </div>
                </Link>
                <button
                  onClick={handleSignOut}
                  disabled={loggingOut}
                  className="p-2 text-[var(--text-muted)] hover:text-red-500 transition-colors disabled:opacity-50"
                  title="Sign Out"
                >
                  {loggingOut ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <LogOut className="w-4 h-4" />
                  )}
                </button>
              </div>
            ) : (
              <Link href="/login">
                <Button size="md" variant="outline">Sign In</Button>
              </Link>
            )}
          </div>

          <button
            className="lg:hidden text-[var(--text-primary)]"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            {mobileMenuOpen ? <X /> : <Menu />}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="lg:hidden bg-[var(--bg-secondary)] border-b border-[var(--border-primary)] overflow-hidden"
          >
            <div className="container mx-auto px-4 py-6 flex flex-col gap-5">
              {session && (
                <div className="flex items-center gap-4 mb-2 p-4 bg-[var(--bg-surface)] rounded-sm">
                   {session.user?.image ? (
                    <img src={session.user.image} alt="Profile" className="w-12 h-12 rounded-full" />
                  ) : (
                    <div className="w-12 h-12 rounded-full bg-[var(--bg-surface-elevated)] flex items-center justify-center">
                      <UserIcon className="w-6 h-6 text-[var(--text-primary)]" />
                    </div>
                  )}
                  <div>
                    <h4 className="text-[var(--text-primary)] font-bold">{session.user?.name}</h4>
                    <p className="text-[var(--text-muted)] text-xs">{session.user?.email}</p>
                  </div>
                </div>
              )}
              {navLinks.map((link) => (
                <Link
                  key={link.name}
                  href={link.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center gap-4 text-lg font-black uppercase tracking-tighter text-[var(--text-primary)] hover:text-safety-orange transition-colors"
                >
                  <link.icon className="w-5 h-5" />
                  {link.name}
                </Link>
              ))}

              <Link
                href="/cart"
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center gap-4 text-lg font-black uppercase tracking-tighter text-[var(--text-primary)] hover:text-safety-orange transition-colors"
              >
                <ShoppingCart className="w-5 h-5" />
                Cart {cartCount > 0 && `(${cartCount})`}
              </Link>

              <Link
                href="/chat"
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center gap-4 text-lg font-black uppercase tracking-tighter text-[var(--text-primary)] hover:text-safety-orange transition-colors"
              >
                <MessageCircle className="w-5 h-5" />
                Messages
              </Link>

              {session && ((session.user as any)?.role?.includes('admin') || (session.user as any)?.role?.includes('expert')) && (
                <Link
                  href="/admin"
                  onClick={() => setMobileMenuOpen(false)}
                  className={cn(
                    "flex items-center gap-4 text-lg font-black uppercase tracking-tighter transition-colors",
                    (session.user as any)?.role?.includes('admin') ? "text-red-500 hover:text-red-400" : "text-safety-orange hover:text-safety-orange/80"
                  )}
                >
                  <LayoutDashboard className="w-5 h-5" />
                  {(session.user as any)?.role?.includes('admin') ? 'Terminal' : 'Expert Portal'}
                </Link>
              )}

              {session && ((session.user as any)?.role?.includes('admin') || (session.user as any)?.role?.includes('seller')) && (
                <Link
                  href="/seller"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center gap-4 text-lg font-black uppercase tracking-tighter text-blue-500 hover:text-blue-400 transition-colors"
                >
                  <Wrench className="w-5 h-5" />
                  Seller Portal
                </Link>
              )}

              <hr className="border-[var(--border-primary)]" />
              {session ? (
                <Button
                  className="w-full flex items-center justify-center gap-2"
                  variant="danger"
                  onClick={handleSignOut}
                  disabled={loggingOut}
                >
                  {loggingOut ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" /> Signing Out...
                    </>
                  ) : (
                    'Sign Out'
                  )}
                </Button>
              ) : (
                <Link href="/login" onClick={() => setMobileMenuOpen(false)}>
                  <Button className="w-full">Sign In</Button>
                </Link>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
};
