
import React from 'react';
import { GameState, Level } from '../types';

interface GameStageProps {
  state: GameState;
  level: Level;
  onNextLevel?: () => void;
}

const GameStage: React.FC<GameStageProps> = ({ state, level, onNextLevel }) => {
  // Generate grid lines every 10 units
  const gridLines = Array.from({ length: 11 }, (_, i) => i * 10);

  return (
    <div className="relative w-full h-full bg-[#0b0e14] rounded-3xl overflow-hidden border-4 border-indigo-500 shadow-2xl">
      {/* Space Background with subtle stars */}
      <div className="absolute inset-0 opacity-20">
        {[...Array(30)].map((_, i) => (
          <div 
            key={i} 
            className="absolute bg-white rounded-full" 
            style={{ 
              width: Math.random() * 2 + 'px', 
              height: Math.random() * 2 + 'px', 
              top: Math.random() * 100 + '%', 
              left: Math.random() * 100 + '%' 
            }}
          />
        ))}
      </div>

      {/* Coordinate Grid Reference */}
      <div className="absolute inset-0 pointer-events-none">
        {gridLines.map(line => (
          <React.Fragment key={line}>
            {/* Vertical Lines */}
            <div 
              className="absolute h-full border-l border-white/5" 
              style={{ left: `${line}%` }} 
            />
            {/* Horizontal Lines */}
            <div 
              className="absolute w-full border-t border-white/5" 
              style={{ top: `${line}%` }} 
            />
            
            {/* Axes Labels (Reference points) */}
            {line % 20 === 0 && (
              <>
                <span 
                  className="absolute text-[10px] text-indigo-400 font-mono opacity-40 select-none"
                  style={{ left: `${line}%`, bottom: '4px', transform: 'translateX(-50%)' }}
                >
                  {line}
                </span>
                <span 
                  className="absolute text-[10px] text-indigo-400 font-mono opacity-40 select-none"
                  style={{ top: `${line}%`, left: '4px', transform: 'translateY(-50%)' }}
                >
                  {100 - line}
                </span>
              </>
            )}
          </React.Fragment>
        ))}
      </div>

      {/* Collectible Stars */}
      {state.starPositions.map(star => (
        <div
          key={star.id}
          className="absolute text-yellow-300 text-3xl animate-pulse z-10 drop-shadow-[0_0_10px_rgba(253,224,71,0.6)]"
          style={{
            left: `${star.x}%`,
            top: `${100 - star.y}%`,
            transform: 'translate(-50%, -50%)'
          }}
        >
          ⭐
        </div>
      ))}

      {/* Sprite: Nova the Astronaut */}
      <div
        className="absolute transition-all duration-300 ease-linear flex flex-col items-center z-20"
        style={{
          left: `${state.x}%`,
          top: `${100 - state.y}%`,
          transform: `translate(-50%, -50%) rotate(${state.rotation}deg)`,
        }}
      >
        {state.message && (
          <div className="absolute -top-16 bg-white text-indigo-900 px-4 py-2 rounded-2xl text-sm font-bold shadow-2xl whitespace-nowrap animate-bounce border-2 border-indigo-100">
            {state.message}
            <div className="absolute bottom-[-8px] left-1/2 -translate-x-1/2 w-0 h-0 border-l-[8px] border-l-transparent border-r-[8px] border-r-transparent border-t-[8px] border-t-white" />
          </div>
        )}
        <div className="text-4xl drop-shadow-[0_0_15px_rgba(99,102,241,0.6)] animate-float">👨‍🚀</div>
      </div>

      {/* HUD Info */}
      <div className="absolute top-4 left-4 flex gap-2 z-30">
        <div className="bg-indigo-900/60 backdrop-blur-md text-white px-4 py-2 rounded-2xl shadow-lg border border-white/10 flex items-center gap-2">
           <span className="text-yellow-400 font-bold">⭐</span>
           <span className="font-mono text-xl">{state.score}</span>
        </div>
        <div className="bg-slate-900/60 backdrop-blur-md text-slate-300 px-4 py-2 rounded-2xl shadow-lg border border-white/10 text-xs font-mono flex items-center gap-2">
           X: {Math.round(state.x)} Y: {Math.round(state.y)}
        </div>
      </div>

      {state.isGameOver && (
        <div className="absolute inset-0 bg-slate-950/90 backdrop-blur-md flex flex-col items-center justify-center text-white z-50 p-6 overflow-hidden">
          <div className="absolute inset-0 pointer-events-none opacity-40">
            {[...Array(15)].map((_, i) => (
              <div 
                key={i} 
                className="absolute text-5xl animate-float" 
                style={{ 
                  top: Math.random() * 80 + 10 + '%', 
                  left: Math.random() * 80 + 10 + '%',
                  animationDelay: `${Math.random() * 2}s`
                }}
              >
                {['✨', '🚀', '⭐', '🎈', '🪐'][Math.floor(Math.random() * 5)]}
              </div>
            ))}
          </div>

          <div className="relative bg-indigo-900/50 p-12 rounded-[48px] border-4 border-indigo-400/50 shadow-[0_0_60px_rgba(99,102,241,0.5)] flex flex-col items-center max-w-lg w-full transform scale-100 transition-transform">
            <div className="text-9xl mb-6 filter drop-shadow-[0_0_20px_rgba(251,191,36,0.6)] animate-bounce">🏆</div>
            <h2 className="text-4xl md:text-5xl font-black mb-4 text-center bg-gradient-to-b from-yellow-200 via-yellow-400 to-orange-500 bg-clip-text text-transparent uppercase tracking-tight">
              Mission Success!
            </h2>
            
            <div className="bg-white/10 p-6 rounded-3xl mb-8 w-full text-center border border-white/5">
              <p className="text-lg text-indigo-100 font-medium opacity-90 leading-relaxed italic">
                "{level.description}"
              </p>
            </div>
            
            <div className="flex flex-col gap-4 w-full">
              <div className="flex items-center justify-center gap-3 bg-white/5 py-3 px-6 rounded-2xl border border-white/5 self-center">
                <span className="text-3xl text-yellow-400">⭐</span>
                <span className="text-3xl font-bold font-fredoka text-yellow-400">{state.score} Stars Collected</span>
              </div>
              
              {onNextLevel && (
                <button 
                  onClick={onNextLevel}
                  className="mt-4 w-full bg-green-500 hover:bg-green-400 text-white py-6 rounded-3xl text-3xl font-bold shadow-[0_12px_0_rgb(21,128,61)] hover:shadow-[0_8px_0_rgb(21,128,61)] active:shadow-none active:translate-y-[12px] transition-all flex items-center justify-center gap-3 group"
                >
                  Next Mission 🚀
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default GameStage;
