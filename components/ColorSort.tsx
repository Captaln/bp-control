import React, { useState, useEffect } from 'react';
import { ChevronLeft, RotateCcw, Beaker } from 'lucide-react';

interface ColorSortProps {
  onBack: () => void;
}

const COLORS = ['bg-red-500', 'bg-blue-500', 'bg-yellow-400', 'bg-green-500'];
const TUBE_CAPACITY = 4;

export const ColorSort: React.FC<ColorSortProps> = ({ onBack }) => {
  const [tubes, setTubes] = useState<string[][]>([]);
  const [selectedTubeIndex, setSelectedTubeIndex] = useState<number | null>(null);
  const [won, setWon] = useState(false);

  useEffect(() => {
    initGame();
  }, []);

  const initGame = () => {
    // 4 colors, 4 items each = 16 items.
    // 4 full tubes + 2 empty tubes = 6 tubes.
    const fullTubes = COLORS.map(c => Array(4).fill(c));
    let allItems: string[] = [];
    fullTubes.forEach(t => allItems.push(...t));
    
    // Shuffle
    for (let i = allItems.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [allItems[i], allItems[j]] = [allItems[j], allItems[i]];
    }

    // Distribute back into 4 tubes
    const newTubes: string[][] = [];
    for (let i = 0; i < 4; i++) {
      newTubes.push(allItems.slice(i * 4, (i + 1) * 4));
    }
    // Add 2 empty tubes
    newTubes.push([]);
    newTubes.push([]);

    setTubes(newTubes);
    setWon(false);
    setSelectedTubeIndex(null);
  };

  const handleTubeClick = (index: number) => {
    if (won) return;

    // If nothing selected, select source
    if (selectedTubeIndex === null) {
      if (tubes[index].length === 0) return; // Can't select empty tube
      setSelectedTubeIndex(index);
    } else {
      // If same tube selected, deselect
      if (selectedTubeIndex === index) {
        setSelectedTubeIndex(null);
      } else {
        // Attempt move
        attemptMove(selectedTubeIndex, index);
      }
    }
  };

  const attemptMove = (from: number, to: number) => {
    const sourceTube = [...tubes[from]];
    const destTube = [...tubes[to]];

    if (destTube.length >= TUBE_CAPACITY) {
      setSelectedTubeIndex(null); // Dest full
      return;
    }

    const colorToMove = sourceTube[sourceTube.length - 1];
    const colorAtDest = destTube.length > 0 ? destTube[destTube.length - 1] : null;

    // Valid move: Dest is empty OR colors match
    if (!colorAtDest || colorAtDest === colorToMove) {
      // Move logic
      sourceTube.pop();
      destTube.push(colorToMove);

      const newTubes = [...tubes];
      newTubes[from] = sourceTube;
      newTubes[to] = destTube;

      setTubes(newTubes);
      checkWin(newTubes);
    }
    
    setSelectedTubeIndex(null);
  };

  const checkWin = (currentTubes: string[][]) => {
    const isWon = currentTubes.every(tube => {
      if (tube.length === 0) return true;
      if (tube.length !== TUBE_CAPACITY) return false;
      const firstColor = tube[0];
      return tube.every(c => c === firstColor);
    });

    if (isWon) {
      setWon(true);
      if (navigator.vibrate) navigator.vibrate([100, 50, 100]);
    }
  };

  return (
    <div className="h-full w-full bg-slate-50 flex flex-col p-6 pb-24 relative overflow-hidden">
      <div className="flex justify-between items-center w-full mb-8 z-10">
        <div className="flex items-center gap-2">
            <button onClick={onBack} className="p-2 -ml-2 text-slate-500 hover:text-slate-800">
                <ChevronLeft size={24} />
            </button>
            <div>
                <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
                    Liquid Logic <Beaker size={20} className="text-blue-500" />
                </h2>
                <p className="text-xs text-slate-500">Sort colors to organize your mind</p>
            </div>
        </div>
        <button 
          onClick={initGame}
          className="p-2 bg-white rounded-full shadow-sm text-slate-500 hover:text-primary transition hover:rotate-180 duration-500"
        >
          <RotateCcw size={20} />
        </button>
      </div>

      <div className="flex-1 flex items-center justify-center">
        <div className="grid grid-cols-3 gap-x-8 gap-y-12 max-w-sm">
          {tubes.map((tube, i) => (
            <div 
              key={i}
              onClick={() => handleTubeClick(i)}
              className={`
                relative w-14 h-40 border-2 rounded-b-3xl transition-all cursor-pointer
                flex flex-col-reverse overflow-hidden bg-white/50 backdrop-blur-sm
                ${selectedTubeIndex === i ? 'border-primary -translate-y-4 shadow-xl' : 'border-slate-300 shadow-sm'}
              `}
            >
              {tube.map((color, colorIndex) => (
                <div 
                  key={colorIndex} 
                  className={`w-full h-[25%] ${color} transition-all duration-300 border-t border-white/10`}
                ></div>
              ))}
            </div>
          ))}
        </div>
      </div>

      {won && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/20 backdrop-blur-sm">
          <div className="bg-white p-8 rounded-2xl shadow-2xl text-center animate-in zoom-in duration-300">
            <h3 className="text-3xl font-bold text-slate-800 mb-2">Sorted! 🎉</h3>
            <p className="text-slate-500 mb-6">Order restored.</p>
            <button 
              onClick={initGame}
              className="px-6 py-3 bg-primary text-white rounded-xl font-bold shadow-lg hover:bg-sky-600 transition"
            >
              Play Again
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
