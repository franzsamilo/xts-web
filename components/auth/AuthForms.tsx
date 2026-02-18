"use client";

import React, { useState } from 'react';
import Link from 'next/link';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { XTSLogo } from '@/components/icons';
import { SectionHeading } from '@/components/ui/SectionHeading';

import { signIn } from "next-auth/react";

export const LoginForm = () => {
  const [isLogin, setIsLogin] = useState(true);

  const handleGoogleLogin = () => {
    signIn("google", { callbackUrl: "/dashboard" });
  };

  return (
    <div className="w-full max-w-md mx-auto">
      <SectionHeading 
        title={isLogin ? "Authenticate" : "Join XTS"} 
        annotation={isLogin ? "Return to Workbench" : "Start Building"} 
        dark={true}
        className="text-center"
      />
      
      <Card className="p-10 shadow-2xl relative overflow-hidden">
        {/* Decorative corner element */}
        <div className="absolute -top-10 -left-10 w-20 h-20 bg-safety-orange/10 rotate-45" />
        
        <div className="flex flex-col items-center mb-10">
          <XTSLogo className="w-16 h-16 mb-4" />
          <p className="text-zinc-500 font-bold uppercase tracking-widest text-[10px]">Secure Engineering Portal</p>
        </div>

        <div className="space-y-4">
          <Button 
            variant="outline" 
            className="w-full py-4 text-xs tracking-widest uppercase font-black border-zinc-200 text-esd-dark hover:bg-zinc-100 flex gap-3"
            onClick={handleGoogleLogin}
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
            </svg>
            Continue with Google
          </Button>

          <div className="relative my-8">
            <div className="absolute inset-0 flex items-center"><span className="w-full border-t border-zinc-200"></span></div>
            <div className="relative flex justify-center text-xs uppercase"><span className="bg-white px-2 text-zinc-500 font-bold">Or use Access Token</span></div>
          </div>

          <form className="space-y-6" onSubmit={(e) => e.preventDefault()}>
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase text-zinc-500 tracking-wider">Work Email</label>
              <Input type="email" placeholder="engineer@xts-web.com" className="bg-white border-zinc-200 text-esd-dark" />
            </div>

            <Button type="submit" disabled className="w-full py-4 text-sm tracking-widest uppercase font-black opacity-50">
              Email Login Coming Soon
            </Button>
          </form>
        </div>

        <div className="mt-8 pt-8 border-t border-black/5 text-center">
            <button 
              onClick={() => setIsLogin(!isLogin)}
              className="text-xs font-bold text-zinc-500 hover:text-safety-orange transition-colors uppercase tracking-widest"
            >
              {isLogin ? "Need an Authorization Token? Sign Up" : "Already have access? Sign In"}
            </button>
        </div>
      </Card>

      <div className="mt-8 text-center">
        <p className="font-handwriting text-zinc-500 text-sm">
          "System security is paramount. Logins are encrypted via XTS-SEC-4."
        </p>
      </div>
    </div>
  );
};
