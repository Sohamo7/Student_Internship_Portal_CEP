'use client';

import React from 'react';
import { motion, type HTMLMotionProps } from 'framer-motion';

/* ═══════════════════════════════════════════════════════════
   REUSABLE FRAMER MOTION WRAPPER COMPONENTS
   Provides entrance animations, stagger containers, 
   3D tilt cards, and animated counters.
   ═══════════════════════════════════════════════════════════ */

// ─── Fade-in from bottom ────────────────────────────────────
interface FadeInUpProps extends HTMLMotionProps<'div'> {
  delay?: number;
  children: React.ReactNode;
}

export function FadeInUp({ delay = 0, children, ...props }: FadeInUpProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay, ease: [0.25, 0.46, 0.45, 0.94] }}
      {...props}
    >
      {children}
    </motion.div>
  );
}

// ─── Scale in from center ───────────────────────────────────
interface ScaleInProps extends HTMLMotionProps<'div'> {
  delay?: number;
  children: React.ReactNode;
}

export function ScaleIn({ delay = 0, children, ...props }: ScaleInProps) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.92 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.45, delay, ease: [0.25, 0.46, 0.45, 0.94] }}
      {...props}
    >
      {children}
    </motion.div>
  );
}

// ─── Slide in from left ─────────────────────────────────────
interface SlideInLeftProps extends HTMLMotionProps<'div'> {
  delay?: number;
  children: React.ReactNode;
}

export function SlideInLeft({ delay = 0, children, ...props }: SlideInLeftProps) {
  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.45, delay, ease: 'easeOut' }}
      {...props}
    >
      {children}
    </motion.div>
  );
}

// ─── Stagger container ──────────────────────────────────────
interface StaggerContainerProps {
  children: React.ReactNode;
  className?: string;
  staggerDelay?: number;
}

export function StaggerContainer({ children, className, staggerDelay = 0.08 }: StaggerContainerProps) {
  return (
    <motion.div
      className={className}
      initial="hidden"
      animate="visible"
      variants={{
        hidden: {},
        visible: {
          transition: {
            staggerChildren: staggerDelay,
          },
        },
      }}
    >
      {children}
    </motion.div>
  );
}

// ─── Stagger item (child of StaggerContainer) ──────────────
interface StaggerItemProps {
  children: React.ReactNode;
  className?: string;
}

export function StaggerItem({ children, className }: StaggerItemProps) {
  return (
    <motion.div
      className={className}
      variants={{
        hidden: { opacity: 0, y: 20, scale: 0.97 },
        visible: {
          opacity: 1,
          y: 0,
          scale: 1,
          transition: { duration: 0.4, ease: [0.25, 0.46, 0.45, 0.94] },
        },
      }}
    >
      {children}
    </motion.div>
  );
}

// ─── 3D Tilt Card ───────────────────────────────────────────
interface TiltCardProps {
  children: React.ReactNode;
  className?: string;
  tiltIntensity?: number;
}

export function TiltCard({ children, className = '', tiltIntensity = 8 }: TiltCardProps) {
  const [rotateX, setRotateX] = React.useState(0);
  const [rotateY, setRotateY] = React.useState(0);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;
    setRotateX(((y - centerY) / centerY) * -tiltIntensity);
    setRotateY(((x - centerX) / centerX) * tiltIntensity);
  };

  const handleMouseLeave = () => {
    setRotateX(0);
    setRotateY(0);
  };

  return (
    <motion.div
      className={className}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      animate={{ rotateX, rotateY }}
      transition={{ type: 'spring', stiffness: 300, damping: 20 }}
      style={{ transformStyle: 'preserve-3d', perspective: 1000 }}
    >
      {children}
    </motion.div>
  );
}

// ─── Animated Counter ───────────────────────────────────────
interface AnimatedCounterProps {
  value: number;
  duration?: number;
  className?: string;
  suffix?: string;
  prefix?: string;
}

export function AnimatedCounter({ value, duration = 1.5, className = '', suffix = '', prefix = '' }: AnimatedCounterProps) {
  const [count, setCount] = React.useState(0);

  React.useEffect(() => {
    let startTime: number | null = null;
    let raf: number;

    const animate = (timestamp: number) => {
      if (!startTime) startTime = timestamp;
      const progress = Math.min((timestamp - startTime) / (duration * 1000), 1);
      const eased = 1 - Math.pow(1 - progress, 3); // easeOutCubic
      setCount(Math.floor(eased * value));
      if (progress < 1) {
        raf = requestAnimationFrame(animate);
      }
    };

    raf = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(raf);
  }, [value, duration]);

  return <span className={className}>{prefix}{count}{suffix}</span>;
}

// ─── Floating Geometric Shapes (for backgrounds) ────────────
interface FloatingShapesProps {
  count?: number;
}

export function FloatingShapes({ count = 6 }: FloatingShapesProps) {
  const shapes = React.useMemo(() => {
    return Array.from({ length: count }, (_, i) => ({
      id: i,
      size: 40 + Math.random() * 80,
      left: Math.random() * 100,
      top: Math.random() * 100,
      delay: Math.random() * 4,
      duration: 6 + Math.random() * 8,
      shape: ['circle', 'square', 'triangle'][i % 3],
      color: [
        'rgba(99, 102, 241, 0.08)',
        'rgba(139, 92, 246, 0.06)',
        'rgba(59, 130, 246, 0.07)',
        'rgba(16, 185, 129, 0.05)',
        'rgba(244, 114, 182, 0.05)',
        'rgba(251, 191, 36, 0.06)',
      ][i % 6],
    }));
  }, [count]);

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none" aria-hidden="true">
      {shapes.map((shape) => (
        <motion.div
          key={shape.id}
          className="absolute"
          style={{
            width: shape.size,
            height: shape.size,
            left: `${shape.left}%`,
            top: `${shape.top}%`,
            background: shape.color,
            borderRadius: shape.shape === 'circle' ? '50%' : shape.shape === 'square' ? '16%' : '0',
            clipPath: shape.shape === 'triangle' ? 'polygon(50% 0%, 0% 100%, 100% 100%)' : undefined,
          }}
          animate={{
            y: [0, -30, 0, 20, 0],
            x: [0, 15, -10, 5, 0],
            rotate: [0, 90, 180, 270, 360],
            scale: [1, 1.1, 0.95, 1.05, 1],
          }}
          transition={{
            duration: shape.duration,
            delay: shape.delay,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
        />
      ))}
    </div>
  );
}

// ─── Morphing Blob ──────────────────────────────────────────
interface MorphBlobProps {
  className?: string;
  color?: string;
  size?: number;
}

export function MorphBlob({ className = '', color = 'rgba(99, 102, 241, 0.08)', size = 300 }: MorphBlobProps) {
  return (
    <motion.div
      className={`absolute rounded-full ${className}`}
      style={{
        width: size,
        height: size,
        background: color,
        filter: 'blur(40px)',
      }}
      animate={{
        borderRadius: [
          '60% 40% 30% 70% / 60% 30% 70% 40%',
          '30% 60% 70% 40% / 50% 60% 30% 60%',
          '50% 60% 30% 60% / 40% 70% 50% 60%',
          '60% 40% 60% 40% / 70% 40% 60% 50%',
          '60% 40% 30% 70% / 60% 30% 70% 40%',
        ],
        scale: [1, 1.05, 0.95, 1.02, 1],
      }}
      transition={{ duration: 10, repeat: Infinity, ease: 'easeInOut' }}
    />
  );
}

// ─── Hover Lift (subtle 3D lift on hover) ───────────────────
interface HoverLiftProps {
  children: React.ReactNode;
  className?: string;
  y?: number;
}

export function HoverLift({ children, className = '', y = -6 }: HoverLiftProps) {
  return (
    <motion.div
      className={className}
      whileHover={{
        y,
        boxShadow: '0 20px 40px -12px rgba(0, 0, 0, 0.08), 0 8px 16px -8px rgba(99, 102, 241, 0.06)',
      }}
      transition={{ type: 'spring', stiffness: 300, damping: 20 }}
    >
      {children}
    </motion.div>
  );
}

// ─── Pulse Dot (live indicator) ─────────────────────────────
interface PulseDotProps {
  color?: string;
  size?: number;
}

export function PulseDot({ color = '#10b981', size = 8 }: PulseDotProps) {
  return (
    <span className="relative inline-flex" style={{ width: size, height: size }}>
      <motion.span
        className="absolute inset-0 rounded-full"
        style={{ backgroundColor: color, opacity: 0.4 }}
        animate={{ scale: [1, 2, 1], opacity: [0.4, 0, 0.4] }}
        transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
      />
      <span
        className="relative inline-flex rounded-full"
        style={{ width: size, height: size, backgroundColor: color }}
      />
    </span>
  );
}
