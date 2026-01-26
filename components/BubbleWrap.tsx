import React, { useState, useEffect } from 'react';
import { RotateCcw, Sparkles, ChevronLeft } from 'lucide-react';
import { BubbleState } from '../types';

interface BubbleWrapProps {
  onBack?: () => void;
}

export const BubbleWrap: React.FC<BubbleWrapProps> = ({ onBack }) => {
  const [bubbles, setBubbles] = useState<BubbleState[]>([]);
  const [popCount, setPopCount] = useState(0);

  const initBubbles = () => {
    const colors = [
      'from-rose-300 to-rose-400', 
      'from-sky-300 to-sky-400', 
      'from-emerald-300 to-emerald-400', 
      'from-amber-300 to-amber-400', 
      'from-violet-300 to-violet-400', 
    ];
    
    // Create a mix of sizes for a dynamic grid layout
    const newBubbles: BubbleState[] = Array.from({ length: 20 }, (_, i) => {
      const rand = Math.random();
      let size: 'small' | 'medium' | 'large' = 'small';
      
      // 15% Large, 25% Medium, 60% Small
      if (rand > 0.85) size = 'large'; 
      else if (rand > 0.6) size = 'medium'; 
      
      return {
        id: i,
        popped: false,
        size,
        color: colors[Math.floor(Math.random() * colors.length)]
      };
    });
    setBubbles(newBubbles);
    setPopCount(0);
  };

  useEffect(() => {
    initBubbles();
  }, []);

  const pop = (id: number) => {
    // Vibrate device for tactile feedback
    if (navigator.vibrate) {
      navigator.vibrate(15);
    }
    
    setBubbles(prev => prev.map(b => b.id === id ? { ...b, popped: true } : b));
    setPopCount(c => c + 1);
  };

  const allPopped = bubbles.length > 0 && bubbles.every(b => b.popped);

  return (
    <div className="h-full w-full bg-slate-50 flex flex-col p-6 pb-24 items-center relative">
      <div className="flex justify-between items-center w-full mb-6">
        <div className="flex items-center gap-2">
            {onBack && (
                <button onClick={onBack} className="p-2 -ml-2 text-slate-500 hover:text-slate-800">
                    <ChevronLeft size={24} />
                </button>
            )}
            <div>
                <h2 className="text-2xl font-bold text-slate-700 flex items-center gap-2">
                    Pop It <Sparkles size={20} className="text-yellow-500" />
                </h2>
                <p className="text-xs text-slate-400">Score: {popCount}</p>
            </div>
        </div>
        <button 
          onClick={initBubbles}
          className="p-2 bg-white rounded-full shadow-sm text-slate-500 hover:text-primary transition hover:rotate-180 duration-500"
        >
          <RotateCcw size={20} />
        </button>
      </div>

      <div className="w-full max-w-sm overflow-y-auto no-scrollbar pb-10 px-1">
        <div className="grid grid-cols-4 gap-3 auto-rows-min">
          {bubbles.map((bubble) => {
            let spanClass = 'col-span-1 row-span-1';
            let heightClass = 'h-20'; // Base height for small

            if (bubble.size === 'medium') {
                spanClass = 'col-span-2 row-span-1';
                heightClass = 'h-20';
            }
            if (bubble.size === 'large') {
                spanClass = 'col-span-2 row-span-2';
                // 2 * h-20 (5rem) + gap-3 (0.75rem) = 10.75rem
                heightClass = 'h-[10.75rem]'; 
            }

            return (
              <button
                key={bubble.id}
                onClick={() => !bubble.popped && pop(bubble.id)}
                className={`
                  ${spanClass} ${heightClass}
                  relative rounded-2xl transition-all duration-200 ease-out transform
                  flex items-center justify-center overflow-hidden
                  ${bubble.popped 
                    ? 'scale-[0.96] bg-slate-200 shadow-[inset_0_2px_6px_rgba(0,0,0,0.15)] ring-0' 
                    : `scale-100 bg-gradient-to-br ${bubble.color} shadow-[0_6px_0_rgba(0,0,0,0.1)] hover:brightness-105 active:scale-90 active:shadow-none`
                  }
                `}
              >
                {/* Shine effect for unpopped */}
                {!bubble.popped && (
                   <div className="absolute top-2 right-2 w-1/3 h-1/3 bg-white opacity-40 rounded-full blur-[3px]"></div>
                )}
                
                {/* Popped visual */}
                {bubble.popped && (
                   <div className="absolute inset-0 flex items-center justify-center opacity-30">
                     <div className="w-1/2 h-1/2 rounded-full bg-slate-400 blur-md"></div>
                   </div>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {allPopped && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/20 backdrop-blur-sm">
           <div className="bg-white p-6 rounded-2xl shadow-2xl text-center animate-in zoom-in duration-300 border border-green-100 mx-4 w-full max-w-xs">
            <h3 className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-green-400 to-blue-500 mb-2">
              So Satisfying! 😌
             </h3>
            <p className="text-slate-500 mb-6 text-sm">Every bubble popped.</p>
            <button 
               onClick={initBubbles}
               className="px-6 py-3 bg-gradient-to-r from-green-400 to-blue-500 text-white rounded-xl font-bold shadow-lg transition w-full"
             >
               Pop Again
             </button>
           </div>
        </div>
      )}
    </div>
  );
};
