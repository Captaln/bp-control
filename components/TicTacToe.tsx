import React, { useState, useEffect } from 'react';
import { ChevronLeft, RotateCcw, X, Circle } from 'lucide-react';

interface TicTacToeProps {
  onBack: () => void;
}

type Player = 'X' | 'O' | null;

// Confetti Component for celebration
const Confetti = () => {
  const [particles] = useState(() => 
    Array.from({ length: 60 }).map((_, i) => ({
      id: i,
      left: Math.random() * 100,
      delay: Math.random() * 2,
      duration: 2 + Math.random() * 2,
      color: ['#ef4444', '#3b82f6', '#22c55e', '#eab308', '#a855f7', '#ec4899'][Math.floor(Math.random() * 6)],
      size: 6 + Math.random() * 6,
    }))
  );

  return (
    <div className="absolute inset-0 pointer-events-none z-50 overflow-hidden">
      {particles.map((p) => (
        <div
          key={p.id}
          className="absolute -top-4 rounded-sm"
          style={{
            left: `${p.left}%`,
            width: `${p.size}px`,
            height: `${p.size}px`,
            backgroundColor: p.color,
            animation: `confetti-fall ${p.duration}s linear infinite`,
            animationDelay: `${p.delay}s`
          }}
        />
      ))}
      <style>{`
        @keyframes confetti-fall {
          0% { transform: translateY(-20px) rotate(0deg); opacity: 1; }
          25% { transform: translateY(25vh) rotate(90deg); opacity: 1; }
          100% { transform: translateY(110vh) rotate(720deg); opacity: 0; }
        }
      `}</style>
    </div>
  );
};

export const TicTacToe: React.FC<TicTacToeProps> = ({ onBack }) => {
  const [board, setBoard] = useState<Player[]>(Array(9).fill(null));
  const [isPlayerTurn, setIsPlayerTurn] = useState(true); // Player is always X
  const [winner, setWinner] = useState<Player | 'Draw' | null>(null);

  const checkWinner = (squares: Player[]) => {
    const lines = [
      [0, 1, 2], [3, 4, 5], [6, 7, 8], // Rows
      [0, 3, 6], [1, 4, 7], [2, 5, 8], // Cols
      [0, 4, 8], [2, 4, 6]             // Diagonals
    ];

    for (let i = 0; i < lines.length; i++) {
      const [a, b, c] = lines[i];
      if (squares[a] && squares[a] === squares[b] && squares[a] === squares[c]) {
        return squares[a];
      }
    }
    return squares.includes(null) ? null : 'Draw';
  };

  const handleClick = (index: number) => {
    if (board[index] || winner || !isPlayerTurn) return;

    const newBoard = [...board];
    newBoard[index] = 'X';
    setBoard(newBoard);
    
    const gameResult = checkWinner(newBoard);
    if (gameResult) {
      setWinner(gameResult);
    } else {
      setIsPlayerTurn(false);
    }
  };

  // AI Turn
  useEffect(() => {
    if (!isPlayerTurn && !winner) {
      const timer = setTimeout(() => {
        // Smart AI Logic
        let moveIndex = -1;
        
        const lines = [
            [0, 1, 2], [3, 4, 5], [6, 7, 8],
            [0, 3, 6], [1, 4, 7], [2, 5, 8],
            [0, 4, 8], [2, 4, 6]
        ];

        // Helper to find winning or blocking line
        const findBestMove = (player: Player) => {
             for (let i = 0; i < lines.length; i++) {
                const [a, b, c] = lines[i];
                const line = [board[a], board[b], board[c]];
                const count = line.filter(cell => cell === player).length;
                const empty = line.filter(cell => cell === null).length;
                
                if (count === 2 && empty === 1) {
                    if (board[a] === null) return a;
                    if (board[b] === null) return b;
                    if (board[c] === null) return c;
                }
            }
            return -1;
        }

        // 1. Try to win immediately
        moveIndex = findBestMove('O');

        // 2. Block player from winning
        if (moveIndex === -1) {
            moveIndex = findBestMove('X');
        }

        // 3. Take center if available (strategic advantage)
        if (moveIndex === -1 && board[4] === null) {
            moveIndex = 4;
        }

        // 4. Random move from remaining empty spots
        if (moveIndex === -1) {
             const emptyIndices = board.map((val, idx) => val === null ? idx : null).filter(val => val !== null) as number[];
             if (emptyIndices.length > 0) {
                moveIndex = emptyIndices[Math.floor(Math.random() * emptyIndices.length)];
             }
        }
        
        if (moveIndex !== -1) {
          const newBoard = [...board];
          newBoard[moveIndex] = 'O';
          setBoard(newBoard);
          
          const gameResult = checkWinner(newBoard);
          if (gameResult) {
            setWinner(gameResult);
          } else {
            setIsPlayerTurn(true);
          }
        }
      }, 600); // Delay for realism
      return () => clearTimeout(timer);
    }
  }, [isPlayerTurn, winner, board]);

  const resetGame = () => {
    setBoard(Array(9).fill(null));
    setWinner(null);
    setIsPlayerTurn(true);
  };

  return (
    <div className="h-full w-full bg-slate-50 flex flex-col p-6 pb-24 relative overflow-hidden">
      
      {/* Celebration Confetti */}
      {(winner === 'X' || winner === 'Draw') && <Confetti />}

      <div className="flex justify-between items-center w-full mb-8 z-10">
        <div className="flex items-center gap-2">
            <button onClick={onBack} className="p-2 -ml-2 text-slate-500 hover:text-slate-800">
                <ChevronLeft size={24} />
            </button>
            <div>
                <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
                    Tic Tac Toe <X size={20} className="text-blue-500" />
                </h2>
                <p className="text-xs text-slate-500">Classic distraction</p>
            </div>
        </div>
        <button 
          onClick={resetGame}
          className="p-2 bg-white rounded-full shadow-sm text-slate-500 hover:text-primary transition hover:rotate-180 duration-500"
        >
          <RotateCcw size={20} />
        </button>
      </div>

      <div className="flex-1 flex flex-col items-center justify-center z-10">
        {/* Status Indicator */}
        <div className="mb-8 px-6 py-2 bg-white rounded-full shadow-sm border border-slate-200">
           {winner ? (
             <span className={`font-bold text-lg ${winner === 'X' ? 'text-green-500' : winner === 'O' ? 'text-red-500' : 'text-slate-500'}`}>
               {winner === 'X' ? 'You Won! 🎉' : winner === 'O' ? 'CPU Won 🤖' : 'It\'s a Draw 🤝'}
             </span>
           ) : (
             <span className="text-slate-500 font-medium">
               {isPlayerTurn ? "Your Turn (X)" : "CPU Thinking..."}
             </span>
           )}
        </div>

        {/* Game Board */}
        <div className="bg-white p-4 rounded-2xl shadow-lg border border-slate-100">
          <div className="grid grid-cols-3 gap-2">
            {board.map((cell, i) => (
              <button
                key={i}
                onClick={() => handleClick(i)}
                disabled={!!cell || !!winner || !isPlayerTurn}
                className={`
                  w-20 h-20 sm:w-24 sm:h-24 rounded-xl flex items-center justify-center text-4xl transition-all
                  ${!cell && !winner && isPlayerTurn ? 'hover:bg-slate-50 active:scale-95' : ''}
                  ${cell === 'X' ? 'bg-blue-50 text-blue-500' : cell === 'O' ? 'bg-rose-50 text-rose-500' : 'bg-slate-100'}
                `}
              >
                {cell === 'X' && <X size={40} strokeWidth={2.5} className="animate-in zoom-in spin-in-12 duration-300" />}
                {cell === 'O' && <Circle size={36} strokeWidth={3} className="animate-in zoom-in duration-300" />}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Game Over Modal */}
      {winner && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/20 backdrop-blur-sm">
          <div className="bg-white p-6 rounded-2xl shadow-2xl text-center animate-in zoom-in duration-300 border border-slate-100 mx-4 w-full max-w-xs">
             <h3 className="text-2xl font-bold text-slate-800 mb-2">
               {winner === 'X' ? 'You Won! 🎉' : winner === 'O' ? 'CPU Won 🤖' : 'Draw 🤝'}
             </h3>
             <p className="text-slate-500 mb-6 text-sm">
                {winner === 'X' ? 'Great focus!' : winner === 'O' ? 'Better luck next time.' : 'Well played.'}
             </p>
             <button 
               onClick={resetGame}
               className="px-6 py-3 bg-primary text-white rounded-xl font-bold shadow-lg hover:bg-sky-600 transition w-full"
             >
               Play Again
             </button>
          </div>
        </div>
      )}
    </div>
  );
};
