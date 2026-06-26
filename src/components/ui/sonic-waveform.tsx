"use client";

import React, { useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { ArrowRight, BarChart2 } from 'lucide-react';
import Link from 'next/link';

const cn = (...classes: (string | undefined | false | null)[]) => classes.filter(Boolean).join(' ');

const SonicWaveformCanvas = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    const mouse = { x: canvas.width / 2, y: canvas.height / 2 };
    let time = 0;

    const resizeCanvas = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };

    const draw = () => {
      ctx.fillStyle = 'rgba(0, 0, 0, 0.1)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      const lineCount = 60;
      const segmentCount = 80;
      const height = canvas.height / 2;

      for (let i = 0; i < lineCount; i++) {
        ctx.beginPath();
        const progress = i / lineCount;
        const colorIntensity = Math.sin(progress * Math.PI);
        ctx.strokeStyle = `rgba(0, 255, 192, ${colorIntensity * 0.5})`;
        ctx.lineWidth = 1.5;

        for (let j = 0; j < segmentCount + 1; j++) {
          const x = (j / segmentCount) * canvas.width;
          const distToMouse = Math.hypot(x - mouse.x, height - mouse.y);
          const mouseEffect = Math.max(0, 1 - distToMouse / 400);
          const noise = Math.sin(j * 0.1 + time + i * 0.2) * 20;
          const spike = Math.cos(j * 0.2 + time + i * 0.1) * Math.sin(j * 0.05 + time) * 50;
          const y = height + noise + spike * (1 + mouseEffect * 2);
          if (j === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        }
        ctx.stroke();
      }

      time += 0.02;
      animationFrameId = requestAnimationFrame(draw);
    };

    const handleMouseMove = (event: MouseEvent) => {
      mouse.x = event.clientX;
      mouse.y = event.clientY;
    };

    window.addEventListener('resize', resizeCanvas);
    window.addEventListener('mousemove', handleMouseMove);
    resizeCanvas();
    draw();

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('resize', resizeCanvas);
      window.removeEventListener('mousemove', handleMouseMove);
    };
  }, []);

  return <canvas ref={canvasRef} className="absolute inset-0 z-0 w-full h-full bg-black" />;
};

const stats = [
  { value: "50K+",  label: "Independent Producers" },
  { value: "2M+",   label: "Beats Sold" },
  { value: "$12M+", label: "Producer Earnings" },
  { value: "500K+", label: "Licenses Purchased" },
];

const SonicWaveformHero = () => {
  const fadeUp = {
    hidden: { opacity: 0, y: 24 },
    visible: (i: number) => ({
      opacity: 1,
      y: 0,
      transition: { delay: i * 0.15 + 0.3, duration: 0.7, ease: "easeOut" as const },
    }),
  };

  return (
    <div className="relative min-h-screen w-full flex flex-col items-center justify-center overflow-hidden">
      <SonicWaveformCanvas />

      {/* Bottom fade into page */}
      <div className="absolute inset-0 bg-gradient-to-t from-gray-950 via-black/40 to-transparent z-10 pointer-events-none" />

      <div className="relative z-20 text-center px-4 sm:px-6 lg:px-8 py-20 max-w-6xl mx-auto w-full">
        {/* Badge */}
        <motion.div
          custom={0} variants={fadeUp} initial="hidden" animate="visible"
          className="inline-flex items-center gap-2 bg-teal-500/10 border border-teal-500/25 rounded-full px-4 py-1.5 mb-8 backdrop-blur-sm"
        >
          <div className="w-1.5 h-1.5 bg-teal-400 rounded-full animate-pulse" />
          <span className="text-teal-300 text-sm font-bold uppercase tracking-wider">
            The #1 Marketplace for Independent Producers
          </span>
        </motion.div>

        {/* Headline */}
        <motion.h1
          custom={1} variants={fadeUp} initial="hidden" animate="visible"
          className="text-5xl sm:text-6xl lg:text-7xl font-black leading-tight tracking-tight mb-6"
        >
          <span className="text-white">Sell Your Beats,</span>
          <br />
          <span className="bg-gradient-to-r from-teal-400 to-blue-500 bg-clip-text text-transparent">
            Own Your Sound
          </span>
        </motion.h1>

        {/* Subheadline */}
        <motion.p
          custom={2} variants={fadeUp} initial="hidden" animate="visible"
          className="text-gray-400 text-lg sm:text-xl max-w-2xl mx-auto mb-10 leading-relaxed"
        >
          The premier marketplace for independent producers. List your instrumentals,
          sell flexible licenses, drop merch, and track every dollar — all in one place.
        </motion.p>

        {/* CTAs */}
        <motion.div
          custom={3} variants={fadeUp} initial="hidden" animate="visible"
          className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-16"
        >
          <Link
            href="/signup"
            className="bg-teal-500 hover:bg-teal-400 text-black font-bold px-8 py-4 rounded-full text-lg shadow-lg shadow-teal-500/30 transition-all hover:-translate-y-0.5 flex items-center gap-2"
          >
            Start for Free <ArrowRight className="h-5 w-5" />
          </Link>
          <Link
            href="/marketplace"
            className="border border-gray-600 hover:border-teal-500/60 text-gray-300 hover:text-white font-semibold px-8 py-4 rounded-full text-lg transition-all backdrop-blur-sm"
          >
            Browse Beats →
          </Link>
        </motion.div>

        {/* Stats */}
        <motion.div
          custom={4} variants={fadeUp} initial="hidden" animate="visible"
          className="grid grid-cols-2 sm:grid-cols-4 gap-6 max-w-3xl mx-auto"
        >
          {stats.map((s) => (
            <div key={s.label} className="text-center">
              <div className="text-2xl sm:text-3xl font-black text-white mb-1">{s.value}</div>
              <div className="text-gray-500 text-xs font-medium">{s.label}</div>
            </div>
          ))}
        </motion.div>
      </div>
    </div>
  );
};

export default SonicWaveformHero;
