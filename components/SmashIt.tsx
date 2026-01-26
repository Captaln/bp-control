import React, { useState } from 'react';
import { ChevronLeft, RotateCcw, Hammer } from 'lucide-react';

interface SmashItProps {
  onBack: () => void;
}

interface Item {
  id: number;
  status: 'intact' | 'broken';
  type: 'plate' | 'vase';
  rotation: number;
  color: string;
}

export const SmashIt: React.FC<SmashItProps> = ({ onBack }) => {
  const [items, setItems] = useState<Item[]>(generateItems());

  function generateItems(): Item[] {
    // Vibrant colors to fix "dull" appearance
    const colors = [
      'bg-rose-500', 
      'bg-blue-500', 
      'bg-emerald-500', 
      'bg-amber-400', 
      'bg-violet-500', 
      'bg-cyan-500',
      'bg-fuchsia-500',
      'bg-orange-500'
    ];
    return Array.from({ length: 12 }, (_, i) => ({
      id: i,
      status: 'intact',
      type: Math.random() > 0.5 ? 'plate' : 'vase',
      rotation: Math.random() * 30 - 15,
      color: colors[Math.floor(Math.random() * colors.length)]
    }));
  }

  const smash = (id: number) => {
    // Haptic feedback
    if (navigator.vibrate) navigator.vibrate([30, 50, 30]);
    
    setItems(prev => prev.map(item => 
      item.id === id ? { ...item, status: 'broken' } : item
    ));
  };

  const reset = () => {
    setItems(generateItems());
  };

  const allSmashed = items.every(item => item.status === 'broken');

  return (
    <div className="h-full w-full bg-slate-50 flex flex-col p-6 pb-24 overflow-hidden relative">
      <div className="flex justify-between items-center w-full mb-6 z-10">
        <div className="flex items-center gap-2">
            <button onClick={onBack} className="p-2 -ml-2 text-slate-500 hover:text-slate-800">
                <ChevronLeft size={24} />
            </button>
            <div>
                <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
                    Smash It <Hammer size={20} className="text-slate-600" />
                </h2>
                <p className="text-xs text-slate-500">Tap to break!</p>
            </div>
        </div>
        <button 
          onClick={reset}
          className="p-2 bg-white rounded-full shadow-sm text-slate-500 hover:text-red-500 transition hover:rotate-180 duration-500"
        >
          <RotateCcw size={20} />
        </button>
      </div>

      <div className="grid grid-cols-3 gap-6 auto-rows-min w-full max-w-sm mx-auto">
        {items.map(item => (
           <div 
             key={item.id} 
             onClick={() => item.status === 'intact' && smash(item.id)}
             className="aspect-square relative flex items-center justify-center cursor-pointer"
           >
             {item.status === 'intact' ? (
                // Intact Item
                <div 
                   className={`w-20 h-20 rounded-full shadow-lg border-4 border-white ${item.color} flex items-center justify-center transition transform hover:scale-105 active:scale-95`}
                   style={{ transform: `rotate(${item.rotation}deg)` }}
                >
                   <div className="w-12 h-12 rounded-full border-2 border-dashed border-white/40"></div>
                </div>
             ) : (
                // Broken Item
                <div className="relative w-full h-full">
                    {/* Shards inherit the item color for a vibrant broken state */}
                    <div className={`absolute top-1/2 left-1/2 w-8 h-8 ${item.color} shadow-sm rounded-none transform -translate-x-1/2 -translate-y-1/2 rotate-12 skew-x-12`} style={{ clipPath: 'polygon(0 0, 100% 0, 50% 100%)'}}></div>
                    <div className={`absolute top-1/4 left-1/4 w-6 h-6 ${item.color} shadow-sm rounded-none transform rotate-45`} style={{ clipPath: 'polygon(20% 0%, 80% 0%, 100% 100%, 0% 100%)'}}></div>
                    <div className={`absolute bottom-1/4 right-1/4 w-7 h-7 ${item.color} shadow-sm rounded-none transform -rotate-12`} style={{ clipPath: 'polygon(50% 0%, 0% 100%, 100% 100%)'}}></div>
                    {/* Small debris */}
                    <div className={`absolute bottom-0 left-1/2 w-3 h-3 ${item.color} transform translate-x-4 rounded-full opacity-60`}></div>
                    <div className={`absolute top-0 right-1/2 w-2 h-2 ${item.color} transform -translate-x-2 rounded-full opacity-60`}></div>
                </div>
             )}
           </div>
        ))}
      </div>
      
      {/* Background decoration */}
      <div className="absolute inset-0 pointer-events-none opacity-30 bg-[radial-gradient(circle_at_top_right,_var(--tw-gradient-stops))] from-blue-100/50 via-transparent to-transparent"></div>

      {/* All Smashed Modal */}
      {allSmashed && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/20 backdrop-blur-sm">
          <div className="bg-white p-6 rounded-2xl shadow-2xl text-center animate-in zoom-in duration-300 border border-slate-100 mx-4 w-full max-w-xs">
             <h3 className="text-2xl font-bold text-slate-800 mb-2">Destruction Complete! 💥</h3>
             <p className="text-slate-500 mb-6 text-sm">Feeling better?</p>
             <button 
               onClick={reset}
               className="px-6 py-3 bg-red-500 text-white rounded-xl font-bold shadow-lg hover:bg-red-600 transition w-full"
             >
               Smash Again
             </button>
          </div>
        </div>
      )}
    </div>
  );
};
