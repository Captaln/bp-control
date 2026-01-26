import React, { useRef, useEffect, useState } from 'react';
import { ChevronLeft, Info } from 'lucide-react';

interface ZenFlowProps {
  onBack: () => void;
}

class Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  color: string;
  size: number;
  friction: number = 0.95;

  constructor(w: number, h: number) {
    this.x = Math.random() * w;
    this.y = Math.random() * h;
    this.vx = 0;
    this.vy = 0;
    this.size = Math.random() * 2 + 1;
    
    // Neon palette
    const colors = ['#0ea5e9', '#6366f1', '#14b8a6', '#f43f5e', '#8b5cf6'];
    this.color = colors[Math.floor(Math.random() * colors.length)];
  }

  update(mouse: { x: number, y: number, active: boolean }) {
    // Mouse interaction
    if (mouse.active) {
      const dx = mouse.x - this.x;
      const dy = mouse.y - this.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      
      // Push away slightly, create swirl
      if (dist < 100) {
        const force = (100 - dist) / 100;
        this.vx -= (dx / dist) * force * 2;
        this.vy -= (dy / dist) * force * 2;
      }
    }

    // Velocity & Friction
    this.vx *= this.friction;
    this.vy *= this.friction;

    this.x += this.vx;
    this.y += this.vy;

    // Movement noise (brownian motion) for "alive" feel
    this.x += (Math.random() - 0.5) * 0.5;
    this.y += (Math.random() - 0.5) * 0.5;
  }

  draw(ctx: CanvasRenderingContext2D) {
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
    ctx.fillStyle = this.color;
    ctx.fill();
  }
  
  checkBounds(w: number, h: number) {
      if (this.x < 0) this.x = w;
      if (this.x > w) this.x = 0;
      if (this.y < 0) this.y = h;
      if (this.y > h) this.y = 0;
  }
}

export const ZenFlow: React.FC<ZenFlowProps> = ({ onBack }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [showHint, setShowHint] = useState(true);
  
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    let particles: Particle[] = [];
    let mouse = { x: 0, y: 0, active: false };

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      
      // Re-init particles on resize
      particles = [];
      const count = Math.min(window.innerWidth / 2, 400); // Responsive count
      for (let i = 0; i < count; i++) {
        particles.push(new Particle(canvas.width, canvas.height));
      }
    };

    const animate = () => {
      ctx.fillStyle = 'rgba(15, 23, 42, 0.2)'; // Trail effect
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      particles.forEach(p => {
        p.update(mouse);
        p.checkBounds(canvas.width, canvas.height);
        p.draw(ctx);
      });

      animationFrameId = requestAnimationFrame(animate);
    };

    // Event Listeners
    const handleStart = (e: MouseEvent | TouchEvent) => {
       mouse.active = true;
       setShowHint(false);
       handleMove(e);
    };
    
    const handleEnd = () => {
        mouse.active = false;
    };
    
    const handleMove = (e: MouseEvent | TouchEvent) => {
        if (!mouse.active) return;
        let clientX, clientY;
        if ('touches' in e) {
            clientX = e.touches[0].clientX;
            clientY = e.touches[0].clientY;
        } else {
            clientX = (e as MouseEvent).clientX;
            clientY = (e as MouseEvent).clientY;
        }
        
        // Adjust for canvas position if not fullscreen (though it is fixed)
        mouse.x = clientX;
        mouse.y = clientY;
    };

    window.addEventListener('resize', resize);
    canvas.addEventListener('mousedown', handleStart);
    canvas.addEventListener('touchstart', handleStart);
    canvas.addEventListener('mouseup', handleEnd);
    canvas.addEventListener('touchend', handleEnd);
    canvas.addEventListener('mousemove', handleMove);
    canvas.addEventListener('touchmove', handleMove);

    resize();
    animate();

    return () => {
      window.removeEventListener('resize', resize);
      cancelAnimationFrame(animationFrameId);
      canvas.removeEventListener('mousedown', handleStart);
      canvas.removeEventListener('touchstart', handleStart);
      canvas.removeEventListener('mouseup', handleEnd);
      canvas.removeEventListener('touchend', handleEnd);
      canvas.removeEventListener('mousemove', handleMove);
      canvas.removeEventListener('touchmove', handleMove);
    };
  }, []);

  return (
    <div className="fixed inset-0 bg-slate-900 z-50 flex flex-col items-center justify-center">
      <canvas ref={canvasRef} className="absolute inset-0 block touch-none" />
      
      {/* UI Overlay */}
      <div className="absolute top-6 left-6 z-10">
        <button onClick={onBack} className="p-3 bg-white/10 backdrop-blur-md rounded-full text-white hover:bg-white/20">
            <ChevronLeft size={24} />
        </button>
      </div>
      
      {showHint && (
          <div className="absolute pointer-events-none flex flex-col items-center text-white/50 animate-pulse">
              <div className="w-12 h-12 rounded-full border-2 border-white/30 flex items-center justify-center mb-2">
                  <div className="w-2 h-2 bg-white rounded-full"></div>
              </div>
              <p className="text-sm font-medium">Touch and drag to flow</p>
          </div>
      )}
    </div>
  );
};