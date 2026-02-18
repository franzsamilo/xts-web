"use client";

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { UploadIcon } from '@/components/icons';
import { Button } from '@/components/ui/Button';
import { cn } from '@/lib/utils';
import { FileText, X, CheckCircle2 } from 'lucide-react';

export const UploadZone = () => {
  const [dragActive, setDragActive] = useState(false);
  const [files, setFiles] = useState<File[]>([]);

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const newFiles = Array.from(e.dataTransfer.files);
      setFiles(prev => [...prev, ...newFiles]);
    }
  };

  const removeFile = (name: string) => {
    setFiles(prev => prev.filter(f => f.name !== name));
  };

  return (
    <div className="w-full max-w-2xl mx-auto">
      {/* Metal 'In-Tray' Container */}
      <div 
        className={cn(
          "relative p-8 border-4 border-zinc-600 bg-zinc-800 shadow-[inset_0_4px_10px_rgba(0,0,0,0.5),0_10px_0_0_#3f3f46] rounded-sm transition-all",
          dragActive ? "border-safety-orange bg-zinc-700/50" : ""
        )}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
      >
        {/* Metal Rivets */}
        <div className="absolute top-2 left-2 w-2 h-2 rounded-full bg-zinc-500 shadow-inner" />
        <div className="absolute top-2 right-2 w-2 h-2 rounded-full bg-zinc-500 shadow-inner" />
        <div className="absolute bottom-2 left-2 w-2 h-2 rounded-full bg-zinc-500 shadow-inner" />
        <div className="absolute bottom-2 right-2 w-2 h-2 rounded-full bg-zinc-500 shadow-inner" />

        <div className="flex flex-col items-center text-center py-12">
          <div className="w-20 h-20 bg-zinc-900 rounded-sm flex items-center justify-center mb-6 shadow-lg border border-white/5">
            <UploadIcon className={cn("w-10 h-10 transition-colors", dragActive ? "text-safety-orange" : "text-zinc-500")} />
          </div>
          <h3 className="text-2xl font-black text-white uppercase tracking-tighter mb-2">FABRICATION IN-TRAY</h3>
          <p className="text-zinc-500 font-handwriting text-lg mb-8">Drop STL, DXF, or Gerber files here</p>
          
          <input 
            type="file" 
            multiple 
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
            onChange={(e) => e.target.files && setFiles(prev => [...prev, ...Array.from(e.target.files!)])}
          />
          
          <Button variant="secondary" size="md">Select Files</Button>
        </div>

        {/* File List */}
        {files.length > 0 && (
          <div className="mt-8 space-y-3">
            {files.map((file) => (
              <motion.div 
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                key={file.name} 
                className="flex items-center justify-between p-3 bg-zinc-900 border border-white/5 rounded-sm"
              >
                <div className="flex items-center gap-3">
                  <FileText className="w-5 h-5 text-safety-orange" />
                  <span className="text-zinc-300 font-bold text-sm truncate max-w-[200px]">{file.name}</span>
                  <span className="text-zinc-600 text-[10px] uppercase font-black">{(file.size / 1024 / 1024).toFixed(2)} MB</span>
                </div>
                <button 
                  onClick={() => removeFile(file.name)}
                  className="text-zinc-500 hover:text-red-500 transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </motion.div>
            ))}
          </div>
        )}
      </div>

      <div className="mt-12 flex flex-col items-center">
        <Button 
          variant="primary" 
          size="lg" 
          className="w-full bg-safety-orange py-6 text-xl shadow-[0_6px_0_0_#995400] active:shadow-none active:translate-y-1 transition-all"
          disabled={files.length === 0}
        >
          REQUEST QUOTE
        </Button>
        <p className="mt-4 font-handwriting text-zinc-500 text-sm italic">
          * Engineering review takes approximately 2-4 hours.
        </p>
      </div>
    </div>
  );
};
