
import React, { useState, useCallback, useEffect, useRef } from 'react';
import { Block, BlockType, GameState, Level } from './types';
import { LEVELS, BLOCK_METADATA } from './constants';
import BlockItem from './components/BlockItem';
import GameStage from './components/GameStage';

// Simple Audio Synthesizer for Game Sounds
const playSound = (type: 'execute' | 'collect' | 'success' | 'start' | 'error') => {
  const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
  if (!AudioContext) return;
  const ctx = new AudioContext();
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();

  osc.connect(gain);
  gain.connect(ctx.destination);

  const now = ctx.currentTime;

  switch (type) {
    case 'execute':
      osc.type = 'sine';
      osc.frequency.setValueAtTime(440, now);
      osc.frequency.exponentialRampToValueAtTime(110, now + 0.1);
      gain.gain.setValueAtTime(0.1, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.1);
      osc.start(now);
      osc.stop(now + 0.1);
      break;
    case 'collect':
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(523.25, now);
      osc.frequency.exponentialRampToValueAtTime(1046.5, now + 0.2);
      gain.gain.setValueAtTime(0.2, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.2);
      osc.start(now);
      osc.stop(now + 0.2);
      break;
    case 'success':
      const playNote = (freq: number, start: number, duration: number) => {
        const o = ctx.createOscillator();
        const g = ctx.createGain();
        o.type = 'square';
        o.frequency.setValueAtTime(freq, start);
        g.gain.setValueAtTime(0.1, start);
        g.gain.exponentialRampToValueAtTime(0.01, start + duration);
        o.connect(g);
        g.connect(ctx.destination);
        o.start(start);
        o.stop(start + duration);
      };
      playNote(523.25, now, 0.1);
      playNote(659.25, now + 0.1, 0.1);
      playNote(783.99, now + 0.2, 0.1);
      playNote(1046.5, now + 0.3, 0.4);
      break;
    case 'start':
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(110, now);
      osc.frequency.exponentialRampToValueAtTime(440, now + 0.3);
      gain.gain.setValueAtTime(0.1, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.3);
      osc.start(now);
      osc.stop(now + 0.3);
      break;
    case 'error':
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(150, now);
      osc.frequency.linearRampToValueAtTime(100, now + 0.2);
      gain.gain.setValueAtTime(0.1, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.2);
      osc.start(now);
      osc.stop(now + 0.2);
      break;
  }
};

const App: React.FC = () => {
  const [levelIdx, setLevelIdx] = useState(0);
  const currentLevel = LEVELS[levelIdx];
  
  const [blocks, setBlocks] = useState<Block[]>([]);
  const [activeBlockId, setActiveBlockId] = useState<string | null>(null);
  const cancelExecutionRef = useRef(false);

  // Helper to generate grid-aligned stars (at centers: 5, 15, 25... 95)
  const generateAlignedStars = (count: number) => {
    const used = new Set<string>();
    const stars = [];
    for (let i = 0; i < count; i++) {
      let x, y, key;
      do {
        x = (Math.floor(Math.random() * 10)) * 10 + 5;
        y = (Math.floor(Math.random() * 10)) * 10 + 5;
        key = `${x}-${y}`;
      } while (used.has(key) || (x === currentLevel.initialX && y === currentLevel.initialY));
      used.add(key);
      stars.push({ id: `star-${i}-${Date.now()}`, x, y });
    }
    return stars;
  };

  const [gameState, setGameState] = useState<GameState>({
    x: currentLevel.initialX,
    y: currentLevel.initialY,
    rotation: 0,
    message: null,
    isRunning: false,
    score: 0,
    level: currentLevel.id,
    isGameOver: false,
    starPositions: generateAlignedStars(currentLevel.stars)
  });

  useEffect(() => {
    resetGame();
  }, [levelIdx]);

  const resetGame = () => {
    cancelExecutionRef.current = true;
    setActiveBlockId(null);
    setGameState({
      x: currentLevel.initialX,
      y: currentLevel.initialY,
      rotation: 0,
      message: null,
      isRunning: false,
      score: 0,
      level: currentLevel.id,
      isGameOver: false,
      starPositions: generateAlignedStars(currentLevel.stars)
    });
    setBlocks([]);
  };

  const handleNextLevel = () => {
    if (levelIdx < LEVELS.length - 1) {
      setLevelIdx(p => p + 1);
    } else {
      setLevelIdx(0);
    }
  };

  const addBlockToWorkspace = (type: BlockType, parentId?: string) => {
    const isMoveBlock = ['MOVE_RIGHT', 'MOVE_LEFT', 'MOVE_UP', 'MOVE_DOWN'].includes(type);
    let defaultValue: any = undefined;
    
    if (type === 'REPEAT') defaultValue = 4;
    else if (isMoveBlock) defaultValue = 10;
    else if (type === 'SPEAK') defaultValue = "Hello! 🚀";
    else if (type === 'IF_EDGE') defaultValue = "any";

    const newBlock: Block = { 
      id: Math.random().toString(36).substr(2, 9), 
      type, 
      children: [], 
      value: defaultValue 
    };
    
    if (!parentId) {
      setBlocks(prev => [...prev, newBlock]);
    } else {
      const updateChildren = (list: Block[]): Block[] => {
        return list.map(b => {
          if (b.id === parentId) return { ...b, children: [...(b.children || []), newBlock] };
          if (b.children) return { ...b, children: updateChildren(b.children) };
          return b;
        });
      };
      setBlocks(prev => updateChildren(prev));
    }
    playSound('execute'); 
  };

  const updateBlockValue = (id: string, value: number | string) => {
    const updateRecursive = (list: Block[]): Block[] => {
      return list.map(b => {
        if (b.id === id) return { ...b, value };
        if (b.children) return { ...b, children: updateRecursive(b.children) };
        return b;
      });
    };
    setBlocks(prev => updateRecursive(prev));
  };

  const removeBlock = (id: string) => {
    const filterBlocks = (list: Block[]): Block[] => {
      return list.filter(b => b.id !== id).map(b => ({
        ...b,
        children: b.children ? filterBlocks(b.children) : []
      }));
    };
    setBlocks(prev => filterBlocks(prev));
    playSound('error'); 
  };

  const executeCode = async () => {
    if (gameState.isRunning) return;
    cancelExecutionRef.current = false;
    playSound('start');
    setGameState(prev => ({ ...prev, isRunning: true, message: null, isGameOver: false }));
    
    let currentX = gameState.x;
    let currentY = gameState.y;
    let currentScore = 0;
    let starsLeft = [...gameState.starPositions];

    const checkWinCondition = (x: number, y: number, stars: typeof starsLeft) => {
      // Goal logic based on level
      const isAtEdge = x <= 5 || x >= 95 || y <= 5 || y >= 95;
      if (currentLevel.id === 1) return isAtEdge;
      if (currentLevel.stars > 0) return stars.length === 0;
      return false;
    };

    const runSequence = async (sequence: Block[]): Promise<boolean> => {
      for (const block of sequence) {
        if (cancelExecutionRef.current) return true;
        setActiveBlockId(block.id);
        
        let waitTime = 350; // Snappy block-by-block movement
        let isControlBlock = false;
        let isActionBlock = false;
        const oldX = currentX;
        const oldY = currentY;

        if (block.type === 'MOVE_RIGHT') { currentX += 10; isActionBlock = true; playSound('execute'); }
        else if (block.type === 'MOVE_LEFT') { currentX -= 10; isActionBlock = true; playSound('execute'); }
        else if (block.type === 'MOVE_UP') { currentY += 10; isActionBlock = true; playSound('execute'); }
        else if (block.type === 'MOVE_DOWN') { currentY -= 10; isActionBlock = true; playSound('execute'); }
        else if (block.type === 'SPEAK') {
          setGameState(prev => ({ ...prev, message: String(block.value || "Hello!") }));
          await new Promise(r => setTimeout(r, 1200));
          if (cancelExecutionRef.current) return true;
          setGameState(prev => ({ ...prev, message: null }));
          waitTime = 0; 
        } else if (block.type === 'REPEAT') {
          isControlBlock = true;
          const iterations = Number(block.value ?? 4);
          for (let i = 0; i < iterations; i++) {
            if (cancelExecutionRef.current) return true;
            const stop = await runSequence(block.children || []);
            if (stop) return true;
          }
        } else if (block.type === 'IF_EDGE') {
          isControlBlock = true;
          const edge = block.value ?? 'any';
          let met = false;
          if (edge === 'any') met = currentX <= 5 || currentX >= 95 || currentY <= 5 || currentY >= 95;
          else if (edge === 'left') met = currentX <= 5;
          else if (edge === 'right') met = currentX >= 95;
          else if (edge === 'top') met = currentY >= 95;
          else if (edge === 'bottom') met = currentY <= 5;

          if (met) { if (await runSequence(block.children || [])) return true; }
        }

        if (isActionBlock) {
          // Clamp to board and check if it actually changed
          currentX = Math.max(5, Math.min(95, currentX));
          currentY = Math.max(5, Math.min(95, currentY));
          if (currentX === oldX && currentY === oldY) waitTime = 0;

          // Star collision check
          const initialCount = starsLeft.length;
          starsLeft = starsLeft.filter(s => Math.abs(s.x - currentX) >= 5 || Math.abs(s.y - currentY) >= 5);
          if (starsLeft.length < initialCount) {
            playSound('collect');
            currentScore += (initialCount - starsLeft.length);
          }

          setGameState(prev => ({ ...prev, x: currentX, y: currentY, score: currentScore, starPositions: starsLeft }));

          if (checkWinCondition(currentX, currentY, starsLeft)) {
            cancelExecutionRef.current = true;
            playSound('success');
            setGameState(prev => ({ ...prev, isGameOver: true, isRunning: false }));
            setActiveBlockId(null);
            return true;
          }
          if (waitTime > 0 && !cancelExecutionRef.current) await new Promise(r => setTimeout(r, waitTime));
        } else if (!isControlBlock) {
          if (waitTime > 0 && !cancelExecutionRef.current) await new Promise(r => setTimeout(r, waitTime));
        }
        if (cancelExecutionRef.current) return true;
      }
      return false;
    };

    await runSequence(blocks);
    setActiveBlockId(null);
    setGameState(prev => ({ ...prev, isRunning: false }));
  };

  const renderWorkspaceBlocks = (blockList: Block[], parentId?: string) => {
    return blockList.map(block => (
      <div key={block.id} className="relative group">
        <button onClick={() => removeBlock(block.id)} className="absolute -top-1 -right-1 bg-red-500 text-white w-5 h-5 rounded-full text-[10px] font-bold opacity-0 group-hover:opacity-100 transition-opacity z-20 shadow-md flex items-center justify-center">✕</button>
        <div onDragOver={(e) => { e.preventDefault(); e.currentTarget.classList.add('block-drag-over'); }} onDragLeave={(e) => e.currentTarget.classList.remove('block-drag-over')} onDrop={(e) => {
            e.preventDefault(); e.stopPropagation(); e.currentTarget.classList.remove('block-drag-over');
            const type = e.dataTransfer.getData('blockType') as BlockType;
            if (type) addBlockToWorkspace(type, block.id);
          }}>
          <BlockItem type={block.type} block={block} onValueChange={updateBlockValue} isActive={activeBlockId === block.id} renderChildren={(children) => renderWorkspaceBlocks(children, block.id)} />
        </div>
      </div>
    ));
  };

  return (
    <div className="flex flex-col h-screen bg-slate-900 overflow-hidden text-slate-100 p-4 md:p-6 select-none font-fredoka">
      <header className="flex justify-between items-center mb-6">
        <div className="flex items-center gap-3">
          <div className="bg-indigo-600 p-2 rounded-2xl shadow-lg shadow-indigo-500/20 animate-pulse">
            <span className="text-3xl">🧑‍🚀</span>
          </div>
          <div>
            <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-white italic">CodeQuest <span className="text-indigo-400">Jr.</span></h1>
            <p className="text-xs md:text-sm text-slate-400 font-medium">Mission {currentLevel.id}: {currentLevel.goal}</p>
          </div>
        </div>
        
        <div className="flex gap-2">
           <button onClick={() => { setLevelIdx(p => Math.max(0, p - 1)); resetGame(); }} className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 font-bold transition-all text-sm border border-slate-700">Prev</button>
           <button onClick={() => { handleNextLevel(); resetGame(); }} className={`px-4 py-2 rounded-xl font-bold transition-all text-sm border ${gameState.isGameOver ? 'bg-indigo-600 hover:bg-indigo-500 border-indigo-400 shadow-indigo-500/20 shadow-lg' : 'bg-slate-800 border-slate-700 opacity-50'}`}>Next Level</button>
        </div>
      </header>

      <main className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-6 min-h-0">
        <div className="lg:col-span-2 flex flex-col gap-4 overflow-y-auto pr-2 custom-scrollbar">
          <div className="bg-slate-800/50 backdrop-blur-md rounded-3xl p-5 border border-slate-700/50">
            <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
              <span className="p-1 bg-yellow-500 rounded-lg text-xs">🛠️</span> Toolbox
            </h3>
            <div className="grid grid-cols-1 gap-2">
              {currentLevel.availableBlocks.map(type => (
                <BlockItem key={type} type={type} onDragStart={(e) => e.dataTransfer.setData('blockType', type)} />
              ))}
            </div>
          </div>
        </div>

        <div className="lg:col-span-3 flex flex-col bg-slate-800/50 rounded-3xl border border-slate-700/50 overflow-hidden shadow-inner">
          <div className="p-5 border-b border-slate-700/50 bg-slate-800/80 flex justify-between items-center">
            <h3 className="text-lg font-bold flex items-center gap-2 text-indigo-300 uppercase tracking-widest text-sm">
              <span className="p-1 bg-indigo-500 rounded-lg text-xs text-white">📝</span> Workspace
            </h3>
            <button onClick={() => { setBlocks([]); setActiveBlockId(null); }} className="text-xs text-slate-400 hover:text-red-400 font-bold transition-colors uppercase tracking-widest">Clear</button>
          </div>
          <div className="flex-1 p-5 overflow-y-auto custom-scrollbar bg-[radial-gradient(#334155_1px,transparent_1px)] [background-size:24px_24px]" onDragOver={(e) => e.preventDefault()} onDrop={(e) => {
              e.preventDefault();
              const type = e.dataTransfer.getData('blockType') as BlockType;
              if (type) addBlockToWorkspace(type);
            }}>
            {blocks.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-slate-500 gap-4 opacity-40 border-4 border-dashed border-slate-700 rounded-3xl p-4 text-center">
                 <div className="text-4xl animate-bounce">🚀</div>
                 <p className="font-bold text-sm leading-tight">Drag and drop blocks here!</p>
              </div>
            ) : renderWorkspaceBlocks(blocks)}
          </div>
        </div>

        <div className="lg:col-span-7 flex flex-col gap-6">
           <div className="flex-1 relative">
             <GameStage state={gameState} level={currentLevel} onNextLevel={handleNextLevel} />
           </div>
           <div className="flex gap-4 p-3 bg-slate-800/50 rounded-3xl border border-slate-700/50 backdrop-blur-sm shadow-2xl">
             <button onClick={executeCode} disabled={gameState.isRunning || blocks.length === 0} className={`flex-1 flex items-center justify-center gap-3 py-4 rounded-2xl text-xl font-bold transition-all shadow-lg active:scale-95 ${gameState.isRunning || blocks.length === 0 ? 'bg-slate-700 text-slate-500 cursor-not-allowed border-b-4 border-slate-900' : 'bg-green-500 hover:bg-green-400 text-white border-b-4 border-green-700 shadow-green-500/20'}`}>
               {gameState.isRunning ? 'Running...' : 'Run Code ▶️'}
             </button>
             <button onClick={resetGame} className="px-8 py-4 bg-orange-500 hover:bg-orange-400 text-white rounded-2xl text-xl font-bold transition-all border-b-4 border-orange-700 shadow-lg shadow-orange-500/20 active:scale-95">Reset 🔄</button>
           </div>
        </div>
      </main>

      <footer className="mt-6 flex justify-between items-center text-slate-500 text-xs px-2 font-fredoka">
        <div className="flex gap-4">
          <span className="flex items-center gap-1 font-mono uppercase tracking-widest"><span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span> Terminal Active</span>
        </div>
        <p className="font-medium opacity-60 uppercase tracking-tighter">CodeQuest Junior Propulsion Systems v1.2.0</p>
      </footer>
    </div>
  );
};

export default App;
