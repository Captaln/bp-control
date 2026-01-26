import React, { useState, useEffect, useRef } from 'react';
import { ChevronLeft, RotateCcw, Frown, Smile, Zap } from 'lucide-react';

interface WhackAMoodProps {
  onBack: () => void;
}

interface Mole {
  id: number;
  status: 'hidden' | 'angry' | 'happy';
}

export const WhackAMood: React.FC<WhackAMoodProps> = ({ onBack }) => {
  const [grid, setGrid] = useState<Mole[]>(Array.from({ length: 9 }, (_, i) => ({ id: i, status: 'hidden' })));
  const [score, setScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(30);
  const [isPlaying, setIsPlaying] = useState(false);
  const timerRef = useRef<number | null>(null);
  const gameLoopRef = useRef<number | null>(null);

  useEffect(() => {
    return () => stopGame();
  }, []);

  const startGame = () => {
    if (isPlaying) return;
    setScore(0);
    setTimeLeft(30);
    setIsPlaying(true);
    setGrid(grid.map(g => ({ ...g, status: 'hidden' })));

    // Countdown Timer
    timerRef.current = window.setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          stopGame();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    // Mole Spawning Loop
    gameLoopRef.current = window.setInterval(() => {
        spawnMole();
    }, 600);
  };

  const stopGame = () => {
    setIsPlaying(false);
    if (timerRef.current !== null) {
      window.clearInterval(timerRef.current);
      timerRef.current = null;
    }
    if (gameLoopRef.current !== null) {
      window.clearInterval(gameLoopRef.current);
      gameLoopRef.current = null;
    }
  };

  const spawnMole = () => {
    setGrid(currentGrid => {
       // Hide existing angry moles occasionally to make it dynamic
       const nextGrid = currentGrid.map(cell => 
         cell.status === 'angry' && Math.random() > 0.6 ? { ...cell, status: 'hidden' as const } : cell
       );
       
       // Pick a random hidden spot
       const hiddenIndices = nextGrid
         .map((cell, idx) => cell.status === 'hidden' ? idx : -1)
         .filter(idx => idx !== -1);
       
       if (hiddenIndices.length > 0) {
         const randomIndex = hiddenIndices[Math.floor(Math.random() * hiddenIndices.length)];
         nextGrid[randomIndex] = { ...nextGrid[randomIndex], status: 'angry' };
       }
       return nextGrid;
    });
  };

  const whack = (index: number) => {
    if (!isPlaying || grid[index].status !== 'angry') return;

    if (navigator.vibrate) navigator.vibrate(40);
    setScore(s => s + 1);

    setGrid(prev => {
      const newGrid = [...prev];
      newGrid[index] = { ...newGrid[index], status: 'happy' };
      return newGrid;
    });

    // Reset back to hidden shortly after whack
    setTimeout(() => {
        if (!isPlaying) return;
        setGrid(prev => {
            const newGrid = [...prev];
            // Only hide if it's still happy (hasn't been respawned as angry)
            if (newGrid[index].status === 'happy') {
                newGrid[index] = { ...newGrid[index], status: 'hidden' };
            }
            return newGrid;
        });
    }, 400);
  };

  return (
    <div className="h-full w-full bg-slate-50 flex flex-col p-6 pb-24 relative overflow-hidden">
      <div className="flex justify-between items-center w-full mb-6 z-10">
        <div className="flex items-center gap-2">
            <button onClick={onBack} className="p-2 -ml-2 text-slate-500 hover:text-slate-800">
                <ChevronLeft size={24} />
            </button>
            <div>
                <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
                    Whack-a-Mood <Zap size={20} className="text-yellow-500" />
                </h2>
                <div className="flex gap-3 text-xs text-slate-500 font-medium">
                    <span>Score: {score}</span>
                    <span>Time: {timeLeft}s</span>
                </div>
            </div>
        </div>
        <button 
          onClick={startGame}
          className={`p-2 rounded-full shadow-sm transition hover:rotate-180 duration-500 ${isPlaying ? 'bg-slate-200 text-slate-400' : 'bg-white text-primary'}`}
        >
          <RotateCcw size={20} />
        </button>
      </div>

      <div className="flex-1 flex flex-col items-center justify-center">
        {!isPlaying && timeLeft === 0 ? (
           <div className="bg-white p-8 rounded-2xl shadow-xl text-center animate-in zoom-in mb-8">
             <p className="text-slate-400 text-sm uppercase font-bold tracking-wide">Game Over</p>
             <h3 className="text-4xl font-bold text-slate-800 my-2">{score}</h3>
             <p className="text-slate-500 mb-6">Bad moods busted!</p>
             <button onClick={startGame} className="px-6 py-3 bg-primary text-white rounded-xl font-bold shadow-lg active:scale-95 transition">
               Play Again
             </button>
           </div>
        ) : !isPlaying && timeLeft === 30 ? (
            <div className="text-center mb-8">
                <div className="w-20 h-20 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-4 animate-bounce">
                    <Zap size={32} className="text-yellow-600" />
                </div>
                <p className="text-slate-500 mb-6 max-w-[200px]">Tap the angry faces to turn them happy!</p>
                <button onClick={startGame} className="px-8 py-3 bg-primary text-white rounded-xl font-bold shadow-lg active:scale-95 transition text-lg">
                    Start
                </button>
            </div>
        ) : (
            <div className="grid grid-cols-3 gap-4 w-full max-w-xs aspect-square">
            {grid.map((cell, i) => (
                <button
                key={i}
                onClick={() => whack(i)}
                className={`
                    relative rounded-2xl flex items-center justify-center transition-all duration-100
                    ${cell.status === 'hidden' ? 'bg-slate-200' : cell.status === 'angry' ? 'bg-red-500 shadow-[0_4px_0_rgb(153,27,27)] translate-y-0' : 'bg-green-400 scale-95'}
                `}
                >
                <div className="absolute inset-0 bg-black/5 rounded-2xl pointer-events-none"></div> {/* Depth shade */}
                
                {cell.status === 'angry' && (
                    <Frown size={40} className="text-white animate-in zoom-in duration-200" strokeWidth={2.5} />
                )}
                {cell.status === 'happy' && (
                    <Smile size={40} className="text-white animate-in spin-in-12 duration-200" strokeWidth={2.5} />
                )}
                </button>
            ))}
            </div>
        )}
      </div>
    </div>
  );
};