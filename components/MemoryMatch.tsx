import React, { useState, useEffect } from 'react';
import { ChevronLeft, RotateCcw, BrainCircuit } from 'lucide-react';

interface MemoryMatchProps {
  onBack: () => void;
}

interface Card {
  id: number;
  content: string;
  isFlipped: boolean;
  isMatched: boolean;
}

const EMOJIS = ['🐶', '🐱', '🐼', '🦊', '🐸', '🦄', '🦋', '🐝'];

export const MemoryMatch: React.FC<MemoryMatchProps> = ({ onBack }) => {
  const [cards, setCards] = useState<Card[]>([]);
  const [flippedIndices, setFlippedIndices] = useState<number[]>([]);
  const [moves, setMoves] = useState(0);
  const [isLocked, setIsLocked] = useState(false);

  useEffect(() => {
    initGame();
  }, []);

  const initGame = () => {
    // Duplicate emojis to make pairs
    const gameEmojis = [...EMOJIS, ...EMOJIS];
    
    // Shuffle
    for (let i = gameEmojis.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [gameEmojis[i], gameEmojis[j]] = [gameEmojis[j], gameEmojis[i]];
    }

    setCards(gameEmojis.map((emoji, index) => ({
      id: index,
      content: emoji,
      isFlipped: false,
      isMatched: false
    })));
    setFlippedIndices([]);
    setMoves(0);
    setIsLocked(false);
  };

  const handleCardClick = (index: number) => {
    if (isLocked || cards[index].isFlipped || cards[index].isMatched) return;

    const newCards = [...cards];
    newCards[index].isFlipped = true;
    setCards(newCards);

    const newFlipped = [...flippedIndices, index];
    setFlippedIndices(newFlipped);

    if (newFlipped.length === 2) {
      setIsLocked(true);
      setMoves(m => m + 1);
      checkForMatch(newFlipped, newCards);
    }
  };

  const checkForMatch = (indices: number[], currentCards: Card[]) => {
    const [first, second] = indices;
    
    if (currentCards[first].content === currentCards[second].content) {
      // Match found
      setTimeout(() => {
        const matchedCards = [...currentCards];
        matchedCards[first].isMatched = true;
        matchedCards[second].isMatched = true;
        setCards(matchedCards);
        setFlippedIndices([]);
        setIsLocked(false);
        if (navigator.vibrate) navigator.vibrate(50);
      }, 500);
    } else {
      // No match
      setTimeout(() => {
        const resetCards = [...currentCards];
        resetCards[first].isFlipped = false;
        resetCards[second].isFlipped = false;
        setCards(resetCards);
        setFlippedIndices([]);
        setIsLocked(false);
      }, 1000);
    }
  };

  const isWon = cards.length > 0 && cards.every(c => c.isMatched);

  return (
    <div className="h-full w-full bg-slate-50 flex flex-col p-6 pb-24 relative">
      <div className="flex justify-between items-center w-full mb-6 z-10">
        <div className="flex items-center gap-2">
            <button onClick={onBack} className="p-2 -ml-2 text-slate-500 hover:text-slate-800">
                <ChevronLeft size={24} />
            </button>
            <div>
                <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
                    Mind Match <BrainCircuit size={20} className="text-purple-500" />
                </h2>
                <p className="text-xs text-slate-500">Moves: {moves}</p>
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
        <div className="grid grid-cols-4 gap-3 w-full max-w-sm aspect-square">
          {cards.map((card, index) => (
            <div 
              key={card.id}
              onClick={() => handleCardClick(index)}
              className="relative aspect-square cursor-pointer perspective-1000"
            >
              <div className={`w-full h-full transition-all duration-500 transform style-preserve-3d ${card.isFlipped || card.isMatched ? 'rotate-y-180' : ''}`}>
                
                {/* Back of Card */}
                <div className="absolute inset-0 backface-hidden bg-slate-200 rounded-xl border-b-4 border-slate-300 flex items-center justify-center shadow-sm hover:brightness-105">
                   <div className="w-6 h-6 rounded-full bg-slate-300/50"></div>
                </div>

                {/* Front of Card */}
                <div className={`absolute inset-0 backface-hidden rotate-y-180 rounded-xl border-b-4 flex items-center justify-center shadow-sm text-3xl
                   ${card.isMatched ? 'bg-green-100 border-green-200' : 'bg-white border-slate-100'}`}
                >
                  {card.content}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {isWon && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/20 backdrop-blur-sm">
           <div className="bg-white p-6 rounded-2xl shadow-2xl text-center animate-in zoom-in duration-300 border border-purple-100 mx-4 w-full max-w-xs">
            <h3 className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-500 to-pink-500 mb-2">
               Memory Master! 🧠
             </h3>
            <p className="text-slate-500 mb-6 text-sm">Solved in {moves} moves</p>
            <button 
               onClick={initGame}
               className="px-6 py-3 bg-purple-500 text-white rounded-xl font-bold shadow-lg hover:bg-purple-600 transition w-full"
             >
               Play Again
             </button>
           </div>
        </div>
      )}
      
       <style>{`
        .rotate-y-180 { transform: rotateY(180deg); }
        .style-preserve-3d { transform-style: preserve-3d; }
        .backface-hidden { backface-visibility: hidden; }
        .perspective-1000 { perspective: 1000px; }
      `}</style>
    </div>
  );
};
