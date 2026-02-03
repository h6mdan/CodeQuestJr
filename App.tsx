
import React, { useState, useCallback, useEffect, useRef } from 'react';
import { Block, BlockType, GameState, Level } from './types';
import { LEVELS, BLOCK_METADATA } from './constants';
import BlockItem from './components/BlockItem';
import GameStage from './components/GameStage';

const playSound = (type: 'execute' | 'collect' | 'success' | 'start' | 'error' | 'click') => {
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
    case 'click':
      osc.type = 'sine';
      osc.frequency.setValueAtTime(660, now);
      gain.gain.setValueAtTime(0.05, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.05);
      osc.start(now);
      osc.stop(now + 0.05);
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

const LOGO_URL = "/Million-Coders-White-text.svg";

const App: React.FC = () => {
  const [currentView, setCurrentView] = useState<'menu' | 'game'>('menu');
  const [levelIdx, setLevelIdx] = useState(0);
  const currentLevel = LEVELS[levelIdx];
  const [blocks, setBlocks] = useState<Block[]>([]);
  const [activeBlockId, setActiveBlockId] = useState<string | null>(null);
  const cancelExecutionRef = useRef(false);
  const isHandlingSensorRef = useRef(false);

  const generateAlignedStars = (level: Level) => {
    const used = new Set<string>();
    const stars = [];
    for (let i = 0; i < level.stars; i++) {
      let x, y, key;
      do {
        x = (Math.floor(Math.random() * 9) + 1) * 10;
        y = (Math.floor(Math.random() * 9) + 1) * 10;
        key = `${x}-${y}`;
      } while (used.has(key) || (x === level.initialX && y === level.initialY));
      used.add(key);
      stars.push({ id: `star-${i}-${Date.now()}`, x, y });
    }
    return stars;
  };

  const [gameState, setGameState] = useState<GameState>({
    x: LEVELS[0].initialX,
    y: LEVELS[0].initialY,
    rotation: 0,
    message: null,
    isRunning: false,
    score: 0,
    level: LEVELS[0].id,
    isGameOver: false,
    starPositions: generateAlignedStars(LEVELS[0])
  });

  const stopExecution = () => {
    cancelExecutionRef.current = true;
    setActiveBlockId(null);
  };

  useEffect(() => {
    setBlocks([]);
    resetGame(true);
  }, [levelIdx]);

  const resetGame = (isHardReset: boolean = false) => {
    stopExecution();
    const newStars = isHardReset ? generateAlignedStars(currentLevel) : gameState.starPositions;
    setGameState(prev => ({
      ...prev,
      x: currentLevel.initialX,
      y: currentLevel.initialY,
      rotation: 0,
      message: null,
      isRunning: false,
      score: 0,
      isGameOver: false,
      starPositions: isHardReset ? newStars : prev.starPositions
    }));
  };

  const handleNextLevel = () => {
    if (levelIdx < LEVELS.length - 1) {
        setLevelIdx(p => p + 1);
    } else {
        setCurrentView('menu');
    }
  };

  const addBlockToWorkspace = (type: BlockType, parentId?: string) => {
    const isMoveBlock = ['MOVE_RIGHT', 'MOVE_LEFT', 'MOVE_UP', 'MOVE_DOWN'].includes(type);
    let defaultValue: any = undefined;
    if (type === 'REPEAT') defaultValue = 4;
    else if (isMoveBlock) defaultValue = 10;
    else if (type === 'SPEAK') defaultValue = "Hello! 🚀";
    else if (type === 'IF_EDGE') defaultValue = "any";

    const newBlock: Block = { id: Math.random().toString(36).substr(2, 9), type, children: [], value: defaultValue };
    if (!parentId) setBlocks(prev => [...prev, newBlock]);
    else {
      const updateChildren = (list: Block[]): Block[] => list.map(b => b.id === parentId ? { ...b, children: [...(b.children || []), newBlock] } : { ...b, children: b.children ? updateChildren(b.children) : [] });
      setBlocks(prev => updateChildren(prev));
    }
    playSound('execute'); 
  };

  const updateBlockValue = (id: string, value: number | string) => {
    const updateRecursive = (list: Block[]): Block[] => list.map(b => b.id === id ? { ...b, value } : { ...b, children: b.children ? updateRecursive(b.children) : [] });
    setBlocks(prev => updateRecursive(prev));
  };

  const removeBlock = (id: string) => {
    const filterBlocks = (list: Block[]): Block[] => list.filter(b => b.id !== id).map(b => ({ ...b, children: b.children ? filterBlocks(b.children) : [] }));
    setBlocks(prev => filterBlocks(prev));
    playSound('error'); 
  };

  const executeCode = async () => {
    if (gameState.isRunning) return;
    cancelExecutionRef.current = false;
    isHandlingSensorRef.current = false;
    playSound('start');
    
    let currentX = gameState.x;
    let currentY = gameState.y;
    let currentScore = 0;
    let starsRemaining = [...gameState.starPositions];
    
    setGameState(prev => ({ ...prev, isRunning: true, message: null, isGameOver: false }));

    const getAllSensors = (list: Block[]): Block[] => {
      let sensors: Block[] = [];
      list.forEach(b => {
        if (b.type === 'IF_EDGE' || b.type === 'IF_ELSE_TOUCHING') sensors.push(b);
        if (b.children) sensors = [...sensors, ...getAllSensors(b.children)];
      });
      return sensors;
    };
    const activeSensors = getAllSensors(blocks);

    const checkWinCondition = (x: number, y: number, stars: any[]) => {
      const isAtEdge = x <= 5 || x >= 95 || y <= 5 || y >= 95;
      if (currentLevel.id === 1 && isAtEdge) return true;
      if (currentLevel.stars > 0 && stars.length === 0) return true;
      return false;
    };

    const runSequence = async (sequence: Block[], isFromSensor = false): Promise<boolean> => {
      for (const block of sequence) {
        if (cancelExecutionRef.current) return true;
        if (!isFromSensor && (block.type === 'IF_EDGE' || block.type === 'IF_ELSE_TOUCHING')) continue;

        setActiveBlockId(block.id);
        let waitTime = 500;
        let isMoving = false;

        if (block.type === 'MOVE_RIGHT') { currentX += 10; isMoving = true; playSound('execute'); }
        else if (block.type === 'MOVE_LEFT') { currentX -= 10; isMoving = true; playSound('execute'); }
        else if (block.type === 'MOVE_UP') { currentY += 10; isMoving = true; playSound('execute'); }
        else if (block.type === 'MOVE_DOWN') { currentY -= 10; isMoving = true; playSound('execute'); }
        else if (block.type === 'SPEAK') {
          setGameState(prev => ({ ...prev, message: String(block.value || "Hello!") }));
          await new Promise(r => setTimeout(r, 1200));
          setGameState(prev => ({ ...prev, message: null }));
          waitTime = 0;
        } else if (block.type === 'REPEAT') {
          const iterations = Number(block.value ?? 4);
          for (let i = 0; i < iterations; i++) {
            if (cancelExecutionRef.current) return true;
            if (await runSequence(block.children || [], isFromSensor)) return true;
          }
        }

        if (isMoving) {
          currentX = Math.max(0, Math.min(100, currentX));
          currentY = Math.max(0, Math.min(100, currentY));
          setGameState(prev => ({ ...prev, x: currentX, y: currentY }));
          if (waitTime > 0) await new Promise(r => setTimeout(r, waitTime));

          const newlyCollected = starsRemaining.filter(s => Math.abs(s.x - currentX) < 5 && Math.abs(s.y - currentY) < 5);
          if (newlyCollected.length > 0) {
            playSound('collect');
            currentScore += newlyCollected.length;
            const collectedIds = newlyCollected.map(s => s.id);
            starsRemaining = starsRemaining.filter(s => !collectedIds.includes(s.id));
            setGameState(prev => ({ ...prev, score: currentScore, starPositions: starsRemaining }));
          }

          if (!isHandlingSensorRef.current) {
            isHandlingSensorRef.current = true;
            for (const sensor of activeSensors) {
              let met = false;
              if (sensor.type === 'IF_EDGE') {
                const edge = sensor.value ?? 'any';
                const L = currentX <= 5, R = currentX >= 95, B = currentY <= 5, T = currentY >= 95;
                met = (edge === 'any' && (L || R || B || T)) || (edge === 'left' && L) || (edge === 'right' && R) || (edge === 'top' && T) || (edge === 'bottom' && B);
              } else if (sensor.type === 'IF_ELSE_TOUCHING') {
                met = newlyCollected.length > 0;
              }
              if (met) await runSequence(sensor.children || [], true);
            }
            isHandlingSensorRef.current = false;
          }

          if (checkWinCondition(currentX, currentY, starsRemaining)) {
            playSound('success');
            setGameState(prev => ({ ...prev, isGameOver: true, isRunning: false }));
            cancelExecutionRef.current = true;
            return true;
          }
        }
      }
      return false;
    };

    const actionSequence = blocks.filter(b => b.type !== 'IF_EDGE' && b.type !== 'IF_ELSE_TOUCHING');
    await runSequence(actionSequence);
    setActiveBlockId(null);
    setGameState(prev => ({ ...prev, isRunning: false }));
  };

  const renderWorkspaceBlocks = (blockList: Block[]) => {
    return blockList.map(block => (
      <div key={block.id} className="relative group">
        <button onClick={() => removeBlock(block.id)} className="absolute -top-1 -right-1 bg-red-500 text-white w-5 h-5 rounded-full text-[10px] font-bold opacity-0 group-hover:opacity-100 transition-opacity z-20 shadow-md flex items-center justify-center">✕</button>
        <div onDragOver={e => { e.preventDefault(); e.currentTarget.classList.add('block-drag-over'); }} onDragLeave={e => e.currentTarget.classList.remove('block-drag-over')} onDrop={e => { e.preventDefault(); e.stopPropagation(); e.currentTarget.classList.remove('block-drag-over'); const type = e.dataTransfer.getData('blockType') as BlockType; if (type) addBlockToWorkspace(type, block.id); }}>
          <BlockItem type={block.type} block={block} onValueChange={updateBlockValue} isActive={activeBlockId === block.id} renderChildren={renderWorkspaceBlocks} />
        </div>
      </div>
    ));
  };

  if (currentView === 'menu') {
    return (
      <div className="flex flex-col h-screen bg-[#0f172a] text-white p-6 select-none font-fredoka overflow-hidden items-center justify-center relative">
        {/* Million Coders Logo at Top Left */}
        <div className="absolute top-6 left-6 z-20">
          <img 
            src={LOGO_URL} 
            alt="Million Coders" 
            className="h-14 md:h-20 w-auto object-contain drop-shadow-lg"
          />
        </div>

        {/* Animated Background Decoration */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none opacity-20">
          {[...Array(20)].map((_, i) => (
            <div
              key={i}
              className="absolute animate-float text-4xl"
              style={{
                top: `${Math.random() * 100}%`,
                left: `${Math.random() * 100}%`,
                animationDelay: `${Math.random() * 5}s`,
                animationDuration: `${3 + Math.random() * 4}s`
              }}
            >
              {['✨', '⭐', '🪐', '💫', '🛸', '🌈'][Math.floor(Math.random() * 6)]}
            </div>
          ))}
        </div>

        <div className="max-w-4xl w-full text-center mb-8 relative z-10">
          <div className="relative inline-block mb-6">
            <div className="absolute inset-0 bg-yellow-400 rounded-full blur-2xl opacity-20 animate-pulse"></div>
            <div className="relative p-4 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-[32px] shadow-2xl border-4 border-white/20 animate-float">
               <span className="text-6xl drop-shadow-lg">🚀</span>
            </div>
          </div>
          <h1 className="text-6xl md:text-8xl font-black tracking-tighter mb-2 text-white drop-shadow-[0_5px_0_rgba(79,70,229,1)]">
            CodeQuest <span className="text-yellow-400">Jr.</span>
          </h1>
          <p className="text-xl md:text-2xl text-indigo-200 max-w-xl mx-auto font-medium drop-shadow-sm">
             Become a cosmic coder and explore the galaxy!
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl w-full px-4 mb-8 relative z-10">
          {LEVELS.map((level, idx) => {
             const icons = { space: '🚀', ocean: '🐙', jungle: '🐒' };
             const secondaryIcons = { space: '🪐', ocean: '🐚', jungle: '🍌' };
             const colors = { 
               space: 'from-indigo-500 to-purple-700 border-indigo-400 shadow-indigo-500/40', 
               ocean: 'from-blue-500 to-cyan-700 border-blue-400 shadow-blue-500/40', 
               jungle: 'from-green-500 to-emerald-800 border-green-400 shadow-green-500/40' 
             };
             
             return (
               <button 
                key={level.id}
                onClick={() => { playSound('click'); setLevelIdx(idx); setCurrentView('game'); }}
                className={`group relative flex flex-col items-center p-8 rounded-[48px] bg-gradient-to-b ${colors[level.theme]} border-b-[8px] border-l-[4px] border-r-[4px] border-t-[4px] transition-all hover:-translate-y-4 hover:rotate-2 active:translate-y-2 active:border-b-[4px] shadow-2xl overflow-hidden`}
               >
                 {/* Thematic Background Elements */}
                 <div className="absolute top-[-10%] right-[-10%] text-9xl opacity-10 group-hover:opacity-20 transition-all rotate-12 group-hover:rotate-45">
                    {secondaryIcons[level.theme]}
                 </div>
                 
                 <div className="relative mb-6">
                    <div className="absolute inset-0 bg-white/20 rounded-full blur-xl group-hover:scale-150 transition-all"></div>
                    <div className="relative text-6xl transform group-hover:scale-125 group-hover:rotate-12 transition-all duration-300">
                      {icons[level.theme]}
                    </div>
                 </div>

                 <h2 className="text-3xl font-black mb-1 uppercase tracking-tight text-white drop-shadow-md">
                   {level.title}
                 </h2>
                 
                 <div className="h-1 w-12 bg-white/30 rounded-full mb-3 group-hover:w-20 transition-all"></div>
                 
                 <p className="text-sm font-bold text-white/90 mb-6 text-center leading-tight">
                   {level.goal}
                 </p>
                 
                 <div className="mt-auto bg-white text-slate-900 px-8 py-3 rounded-2xl font-black text-sm uppercase tracking-widest shadow-[0_4px_0_rgba(0,0,0,0.2)] group-hover:bg-yellow-400 group-hover:shadow-[0_4px_0_rgba(234,179,8,1)] transition-all flex items-center gap-2">
                   Go! <span>✨</span>
                 </div>
               </button>
             )
          })}
        </div>
        
        <div className="flex items-center gap-4 bg-white/5 backdrop-blur-sm px-6 py-2 rounded-full border border-white/10 opacity-60 group hover:opacity-100 transition-opacity">
          <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
          <span className="text-[10px] font-mono uppercase tracking-[0.3em] font-bold">Systems Ready for Adventure</span>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen bg-slate-900 overflow-hidden text-slate-100 p-4 md:p-6 select-none font-fredoka">
      <header className="flex justify-between items-center mb-6">
        <div className="flex items-center gap-3">
          <button 
            onClick={() => { playSound('click'); setCurrentView('menu'); }}
            className="bg-slate-800 p-2.5 rounded-2xl border border-slate-700 hover:bg-slate-700 transition-all mr-2 group"
          >
            <span className="text-xl group-hover:scale-125 inline-block transition-transform">🏠</span>
          </button>
          <div className="bg-indigo-600 p-1.5 rounded-xl shadow-lg shadow-indigo-500/20">
            <img src={LOGO_URL} alt="Logo" className="h-8 md:h-10 w-auto object-contain" />
          </div>
          <div>
            <h1 className="text-xl md:text-2xl font-bold tracking-tight text-white">
              {currentLevel.title}
            </h1>
            <p className="text-[10px] md:text-xs text-slate-400 font-medium uppercase tracking-widest">
              Mission {currentLevel.id}: {currentLevel.goal}
            </p>
          </div>
        </div>
        <div className="flex gap-2">
           <button onClick={() => setLevelIdx(p => Math.max(0, p - 1))} className={`px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 font-bold transition-all text-sm border border-slate-700 ${levelIdx === 0 ? 'opacity-30 pointer-events-none' : ''}`}>Prev</button>
           <button onClick={handleNextLevel} className={`px-4 py-2 rounded-xl font-bold transition-all text-sm border ${gameState.isGameOver ? 'bg-indigo-600 hover:bg-indigo-500 border-indigo-400 shadow-indigo-500/20 shadow-lg' : 'bg-slate-800 border-slate-700 opacity-50'}`}>
            {levelIdx < LEVELS.length - 1 ? 'Next Level' : 'Finish'}
           </button>
        </div>
      </header>
      <main className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-6 min-h-0">
        <div className="lg:col-span-2 flex flex-col gap-4 overflow-y-auto pr-2 custom-scrollbar">
          <div className="bg-slate-800/50 backdrop-blur-md rounded-3xl p-5 border border-slate-700/50">
            <h3 className="text-lg font-bold mb-4 flex items-center gap-2"><span className="p-1 bg-yellow-500 rounded-lg text-xs">🛠️</span> Toolbox</h3>
            <div className="grid grid-cols-1 gap-2">
              {currentLevel.availableBlocks.map(type => (
                <BlockItem 
                  key={type} 
                  type={type} 
                  onDragStart={e => { e.dataTransfer.setData('blockType', type); }} 
                  onClick={() => addBlockToWorkspace(type)}
                />
              ))}
            </div>
          </div>
        </div>
        <div className="lg:col-span-3 flex flex-col bg-slate-800/50 rounded-3xl border border-slate-700/50 overflow-hidden shadow-inner">
          <div className="p-5 border-b border-slate-700/50 bg-slate-800/80 flex justify-between items-center">
            <h3 className="text-lg font-bold flex items-center gap-2 text-indigo-300 uppercase tracking-widest text-sm"><span className="p-1 bg-indigo-500 rounded-lg text-xs text-white">📝</span> Workspace</h3>
            <button onClick={() => { setBlocks([]); setActiveBlockId(null); }} className="text-xs text-slate-400 hover:text-red-400 font-bold transition-colors uppercase tracking-widest">Clear</button>
          </div>
          <div className="flex-1 p-5 overflow-y-auto custom-scrollbar bg-[radial-gradient(#334155_1px,transparent_1px)] [background-size:24px_24px]" onDragOver={e => { e.preventDefault(); e.currentTarget.classList.add('block-drag-over'); }} onDragLeave={e => e.currentTarget.classList.remove('block-drag-over')} onDrop={e => { e.preventDefault(); e.currentTarget.classList.remove('block-drag-over'); const type = e.dataTransfer.getData('blockType') as BlockType; if (type) addBlockToWorkspace(type); }}>
            {blocks.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-slate-500 gap-4 opacity-40 border-4 border-dashed border-slate-700 rounded-3xl p-4 text-center">
                 <div className="text-4xl animate-bounce">🎨</div>
                 <p className="font-bold text-sm leading-tight">Drag and drop blocks here!</p>
              </div>
            ) : renderWorkspaceBlocks(blocks)}
          </div>
        </div>
        <div className="lg:col-span-7 flex flex-col gap-6">
           <div className="flex-1 relative">
             <GameStage
  state={gameState}
  level={currentLevel}
  onNextLevel={handleNextLevel}
/>

           </div>
           <div className="flex gap-4 p-3 bg-slate-800/50 rounded-3xl border border-slate-700/50 backdrop-blur-sm shadow-2xl">
             <button onClick={executeCode} disabled={gameState.isRunning || blocks.length === 0} className={`flex-1 flex items-center justify-center gap-3 py-4 rounded-2xl text-xl font-bold transition-all shadow-lg active:scale-95 ${gameState.isRunning || blocks.length === 0 ? 'bg-slate-700 text-slate-500 cursor-not-allowed border-b-4 border-slate-900' : 'bg-green-500 hover:bg-green-400 text-white border-b-4 border-green-700 shadow-green-500/20'}`}>{gameState.isRunning ? 'Running...' : 'Run Code ▶️'}</button>
             <button onClick={() => resetGame(false)} className="px-8 py-4 bg-orange-500 hover:bg-orange-400 text-white rounded-2xl text-xl font-bold transition-all border-b-4 border-orange-700 shadow-lg shadow-orange-500/20 active:scale-95">Restore 🔄</button>
           </div>
        </div>
      </main>
      <footer className="mt-6 flex justify-between items-center text-slate-500 text-xs px-2">
        <div className="flex gap-4"><span className="flex items-center gap-1 font-mono uppercase tracking-widest"><span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span> Terminal Active</span></div>
        <p className="font-medium opacity-60 uppercase tracking-tighter">CodeQuest Junior Multi-Biomedical OS v2.1.0</p>
      </footer>
    </div>
  );
};

export default App;
