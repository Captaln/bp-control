import React, { useState, useEffect, useRef } from 'react';
import { Sparkles, RefreshCw, Wind, Circle, Activity, Moon } from 'lucide-react';
import { getAffirmation } from '../services/geminiService';

type PatternType = 'Box' | '4-7-8' | 'Coherence';

interface Phase {
  name: string;
  duration: number;
  instruction: string;
}

const PATTERNS: Record<PatternType, { name: string; icon: any; description: string; phases: Phase[] }> = {
  'Box': {
    name: 'Box',
    icon: Circle,
    description: 'Focus & Control',
    phases: [
      { name: 'Inhale', duration: 4, instruction: 'Breathe In...' },
      { name: 'Hold', duration: 4, instruction: 'Hold...' },
      { name: 'Exhale', duration: 4, instruction: 'Breathe Out...' },
      { name: 'Hold', duration: 4, instruction: 'Hold...' },
    ]
  },
  '4-7-8': {
    name: '4-7-8',
    icon: Moon,
    description: 'Anxiety & Sleep',
    phases: [
      { name: 'Inhale', duration: 4, instruction: 'Breathe In...' },
      { name: 'Hold', duration: 7, instruction: 'Hold...' },
      { name: 'Exhale', duration: 8, instruction: 'Whoosh Out...' },
    ]
  },
  'Coherence': {
    name: 'Coherence',
    icon: Activity,
    description: 'Heart Balance',
    phases: [
      { name: 'Inhale', duration: 5, instruction: 'Breathe In...' },
      { name: 'Exhale', duration: 5, instruction: 'Breathe Out...' },
    ]
  }
};

export const Breathe: React.FC = () => {
  const [selectedPattern, setSelectedPattern] = useState<PatternType>('Box');
  const [isActive, setIsActive] = useState(false);
  const [phaseIndex, setPhaseIndex] = useState(0);
  const [timeLeft, setTimeLeft] = useState(4);
  
  // State to control the "Look here!" animation
  const [highlightedTab, setHighlightedTab] = useState<PatternType | null>(null);
  
  const [affirmation, setAffirmation] = useState<string>("Breathe in peace, breathe out stress.");
  const [loadingAffirmation, setLoadingAffirmation] = useState(false);
  
  const currentPattern = PATTERNS[selectedPattern];
  const currentPhase = currentPattern.phases[phaseIndex];

  // Intro Animation: Highlight tabs one by one on mount
  useEffect(() => {
    const sequence: PatternType[] = ['Box', '4-7-8', 'Coherence'];
    let index = 0;

    // Start delay
    const startTimeout = setTimeout(() => {
      const interval = setInterval(() => {
        if (index >= sequence.length) {
            setHighlightedTab(null);
            clearInterval(interval);
        } else {
            setHighlightedTab(sequence[index]);
            index++;
        }
      }, 700); // 700ms highlight per tab

      return () => clearInterval(interval);
    }, 500); 

    return () => clearTimeout(startTimeout);
  }, []);

  // Timer Logic
  useEffect(() => {
    let interval: any;
    if (isActive) {
      interval = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
             // Move to next phase
             setPhaseIndex((current) => (current + 1) % currentPattern.phases.length);
             // Return duration of NEXT phase
             const nextIndex = (phaseIndex + 1) % currentPattern.phases.length;
             return currentPattern.phases[nextIndex].duration;
          }
          return prev - 1;
        });
      }, 1000);
    } else {
       // Reset
       setPhaseIndex(0);
       setTimeLeft(currentPattern.phases[0].duration);
    }
    return () => clearInterval(interval);
  }, [isActive, phaseIndex, currentPattern]);

  // Reset when pattern changes
  useEffect(() => {
      setIsActive(false);
      setPhaseIndex(0);
      setTimeLeft(PATTERNS[selectedPattern].phases[0].duration);
  }, [selectedPattern]);

  const fetchNewAffirmation = async () => {
    setLoadingAffirmation(true);
    const text = await getAffirmation();
    setAffirmation(text);
    setLoadingAffirmation(false);
  };

  useEffect(() => {
    fetchNewAffirmation();
  }, []);

  const getCircleScale = () => {
    if (!isActive) return 'scale-100';
    if (currentPhase.name === 'Inhale') return 'scale-125';
    if (currentPhase.name === 'Exhale') return 'scale-75';
    return 'scale-100'; // Hold
  };

  return (
    <div className="h-full w-full flex flex-col p-6 pb-24 relative overflow-hidden bg-teal-50">
      {/* Background ambient blobs */}
      <div className="absolute top-0 left-0 w-64 h-64 bg-teal-200 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob"></div>
      <div className="absolute bottom-0 right-0 w-64 h-64 bg-blue-200 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob animation-delay-2000"></div>

      {/* Header & Pattern Selector */}
      <div className="z-10 w-full mb-6">
          <h2 className="text-2xl font-bold text-teal-800 text-center mb-4">Breathing Space</h2>
          
          <div className="flex gap-3 justify-center">
             {(Object.keys(PATTERNS) as PatternType[]).map((type) => {
                 const P = PATTERNS[type];
                 const Icon = P.icon;
                 const isSelected = selectedPattern === type;
                 const isHighlighted = highlightedTab === type;

                 return (
                    <button
                        key={type}
                        onClick={() => setSelectedPattern(type)}
                        className={`
                          flex-1 flex flex-col items-center justify-center py-4 px-2 rounded-2xl transition-all duration-300 relative overflow-hidden
                          ${isSelected 
                            ? 'bg-white text-teal-700 shadow-md transform scale-105 ring-2 ring-teal-100' 
                            : 'bg-white/40 text-teal-600/70 hover:bg-white/60'
                          }
                          ${isHighlighted ? 'ring-4 ring-teal-300 scale-110 z-20 shadow-lg bg-white' : ''}
                        `}
                    >
                        {/* Animation Pulse */}
                        {isHighlighted && (
                           <span className="absolute inset-0 bg-teal-400/20 animate-pulse rounded-2xl"></span>
                        )}
                        
                        <div className="relative z-10 flex flex-col items-center">
                            <Icon size={isHighlighted ? 26 : 24} className={`mb-2 transition-all ${isHighlighted ? 'text-teal-600' : ''}`} strokeWidth={isSelected || isHighlighted ? 2.5 : 2} />
                            <span className="text-[11px] font-bold uppercase tracking-wider">{P.name}</span>
                        </div>
                    </button>
                 );
             })}
          </div>
          
          <div className="flex justify-center mt-4 h-6">
             <p className={`text-center text-xs font-bold text-teal-700 bg-teal-100 px-4 py-1.5 rounded-full transition-all duration-500 shadow-sm ${highlightedTab ? 'opacity-50 scale-90' : 'opacity-100 scale-100'}`}>
                {currentPattern.description}
             </p>
          </div>
      </div>

      {/* Main Breathing Circle */}
      <div className="flex-1 flex items-center justify-center z-10 min-h-[300px]">
        <div className="relative w-64 h-64 flex items-center justify-center">
            {/* Animated Rings */}
            {isActive && (
            <div className={`absolute inset-0 bg-teal-300 rounded-full opacity-20 transition-transform duration-[4000ms] ease-in-out ${getCircleScale()}`}></div>
            )}
            {isActive && (
            <div className={`absolute inset-8 bg-teal-400 rounded-full opacity-20 transition-transform duration-[4000ms] ease-in-out ${getCircleScale()}`} style={{ transitionDelay: '100ms' }}></div>
            )}

            {/* Central Circle */}
            <div className={`relative z-10 w-48 h-48 bg-white rounded-full shadow-xl flex flex-col items-center justify-center transition-all duration-[4000ms] ease-in-out ${getCircleScale()}`}>
            {isActive ? (
                <>
                <span className="text-4xl font-bold text-teal-600 transition-all">{timeLeft}</span>
                <span className="text-lg text-teal-400 font-medium uppercase tracking-widest mt-2 animate-pulse">
                    {currentPhase.instruction}
                </span>
                </>
            ) : (
                <div onClick={() => setIsActive(true)} className="cursor-pointer flex flex-col items-center group">
                    <div className="bg-teal-50 p-4 rounded-full mb-3 group-hover:scale-110 transition-transform shadow-sm">
                       <Wind size={36} className="text-teal-500" />
                    </div>
                    <span className="text-teal-600 font-bold text-lg">Tap to Start</span>
                </div>
            )}
            </div>
        </div>
      </div>

      {/* Controls & Affirmation */}
      <div className="flex flex-col items-center gap-4 w-full z-10 mt-auto">
        <button
            onClick={() => setIsActive(!isActive)}
            className={`w-full py-4 rounded-xl font-bold text-lg shadow-lg transition transform active:scale-95 ${
            isActive 
                ? 'bg-white text-slate-800 border-2 border-slate-200' 
                : 'bg-teal-600 text-white'
            }`}
        >
            {isActive ? 'Pause Session' : 'Start Session'}
        </button>

        {/* Affirmation Card */}
        <div className="w-full bg-white/60 backdrop-blur-md rounded-2xl p-4 text-center border border-teal-100 shadow-sm relative overflow-hidden group">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-teal-300 to-blue-300"></div>
            
            <div className="flex items-center justify-center gap-2 mb-2 text-teal-600 opacity-80">
                <Sparkles size={14} />
                <span className="text-[10px] font-bold uppercase tracking-widest">Mindful Thought</span>
            </div>
            
            <p className="text-slate-700 font-medium italic text-lg leading-tight min-h-[3rem] flex items-center justify-center px-2">
                {loadingAffirmation ? (
                    <span className="animate-pulse not-italic text-slate-400 text-sm">Asking the universe...</span>
                ) : (
                    `"${affirmation}"`
                )}
            </p>

            <button
                onClick={fetchNewAffirmation}
                disabled={loadingAffirmation}
                className="mt-3 text-xs text-teal-500 hover:text-teal-700 flex items-center justify-center gap-1 mx-auto transition-colors"
            >
                <RefreshCw size={12} className={loadingAffirmation ? 'animate-spin' : ''} />
                <span>New Affirmation</span>
            </button>
        </div>
      </div>
    </div>
  );
};