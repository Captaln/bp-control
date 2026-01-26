import React, { useState } from 'react';
import { Eye, Hand, Ear, Sparkles, ChevronLeft, Check, Coffee } from 'lucide-react';

interface GroundingProps {
  onBack: () => void;
}

const STEPS = [
  {
    count: 5,
    icon: Eye,
    color: 'text-blue-500',
    bg: 'bg-blue-100',
    title: 'Look Around',
    desc: 'Find 5 things you can SEE',
    examples: 'A shadow, a crack in the wall, a color...'
  },
  {
    count: 4,
    icon: Hand,
    color: 'text-emerald-500',
    bg: 'bg-emerald-100',
    title: 'Reach Out',
    desc: 'Find 4 things you can TOUCH',
    examples: 'The texture of your pants, a cool table, your hair...'
  },
  {
    count: 3,
    icon: Ear,
    color: 'text-purple-500',
    bg: 'bg-purple-100',
    title: 'Listen Close',
    desc: 'Find 3 things you can HEAR',
    examples: 'A distant car, computer hum, your own breath...'
  },
  {
    count: 2,
    icon: Sparkles,
    color: 'text-orange-500',
    bg: 'bg-orange-100',
    title: 'Breathe In',
    desc: 'Find 2 things you can SMELL',
    examples: 'Coffee, fresh air, soap (or imagine a favorite smell)...'
  },
  {
    count: 1,
    icon: Coffee,
    color: 'text-rose-500',
    bg: 'bg-rose-100',
    title: 'Taste',
    desc: 'Find 1 thing you can TASTE',
    examples: 'Mint gum, coffee aftertaste, or just note your mouth...'
  }
];

export const Grounding: React.FC<GroundingProps> = ({ onBack }) => {
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [itemsFound, setItemsFound] = useState(0);
  const [isCompleted, setIsCompleted] = useState(false);

  const step = STEPS[currentStepIndex];

  const handleFound = () => {
    // Vibrate for feedback
    if (navigator.vibrate) navigator.vibrate(20);

    if (itemsFound + 1 >= step.count) {
      // Step complete
      if (currentStepIndex + 1 >= STEPS.length) {
        setIsCompleted(true);
      } else {
        setTimeout(() => {
            setCurrentStepIndex(prev => prev + 1);
            setItemsFound(0);
        }, 300);
      }
    } else {
      setItemsFound(prev => prev + 1);
    }
  };

  const Icon = step.icon;

  if (isCompleted) {
      return (
        <div className="h-full w-full bg-slate-50 flex flex-col p-6 items-center justify-center text-center">
            <div className="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center mb-6 animate-in zoom-in">
                <Check size={48} className="text-green-600" />
            </div>
            <h2 className="text-3xl font-bold text-slate-800 mb-2">You are here.</h2>
            <p className="text-slate-500 mb-8 max-w-xs">Great job grounding yourself in the present moment.</p>
            <button 
                onClick={onBack}
                className="px-8 py-3 bg-slate-800 text-white rounded-xl font-bold shadow-lg hover:bg-slate-700 transition"
            >
                Back to Play
            </button>
        </div>
      );
  }

  return (
    <div className="h-full w-full bg-slate-50 flex flex-col p-6 pb-24 relative overflow-hidden">
      {/* Header */}
      <div className="flex justify-between items-center w-full mb-8 z-10">
        <button onClick={onBack} className="p-2 -ml-2 text-slate-500 hover:text-slate-800">
            <ChevronLeft size={24} />
        </button>
        <div className="flex gap-1">
             {STEPS.map((_, i) => (
                 <div key={i} className={`h-1.5 w-6 rounded-full transition-colors ${i <= currentStepIndex ? 'bg-primary' : 'bg-slate-200'}`}></div>
             ))}
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col items-center justify-center max-w-sm mx-auto w-full animate-in slide-in-from-right duration-300" key={currentStepIndex}>
         <div className={`w-32 h-32 ${step.bg} rounded-full flex items-center justify-center mb-8 shadow-sm`}>
             <Icon size={64} className={step.color} strokeWidth={1.5} />
         </div>
         
         <h2 className="text-4xl font-bold text-slate-800 mb-2">{step.count}</h2>
         <h3 className="text-xl font-bold text-slate-700 mb-4 uppercase tracking-wide">{step.title}</h3>
         <p className="text-center text-slate-600 font-medium text-lg mb-2">{step.desc}</p>
         <p className="text-center text-slate-400 text-sm italic mb-12 h-10">{step.examples}</p>

         {/* Interactive Counter Buttons */}
         <div className="flex gap-3 mb-8">
             {Array.from({ length: step.count }).map((_, i) => (
                 <div 
                    key={i} 
                    className={`w-4 h-4 rounded-full transition-all duration-300 ${i < itemsFound ? `${step.bg.replace('100', '500')} scale-110` : 'bg-slate-200'}`}
                 ></div>
             ))}
         </div>

         <button
            onClick={handleFound}
            className={`w-full py-4 rounded-xl font-bold text-lg shadow-lg transition transform active:scale-95 bg-white border-2 border-slate-100 text-slate-700 hover:bg-slate-50`}
         >
             I Found One
         </button>
      </div>
    </div>
  );
};
