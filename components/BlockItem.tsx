
import React from 'react';
import { BlockType, Block } from '../types';
import { BLOCK_METADATA } from '../constants';

interface BlockItemProps {
  type: BlockType;
  isDragging?: boolean;
  onDragStart?: (e: React.DragEvent) => void;
  block?: Block;
  renderChildren?: (children: Block[]) => React.ReactNode;
  onValueChange?: (id: string, value: number | string) => void;
  isActive?: boolean;
}

const BlockItem: React.FC<BlockItemProps> = ({ 
  type, 
  onDragStart, 
  block, 
  renderChildren, 
  onValueChange,
  isActive 
}) => {
  const metadata = BLOCK_METADATA[type];
  
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    if (block && onValueChange) {
      const rawValue = e.target.value;
      if (type === 'REPEAT') {
        const val = parseInt(rawValue, 10);
        onValueChange(block.id, isNaN(val) ? 1 : val);
      } else {
        onValueChange(block.id, rawValue);
      }
    }
  };

  const stopPropagation = (e: React.MouseEvent | React.KeyboardEvent | React.DragEvent) => {
    e.stopPropagation();
  };

  const isMoveBlock = ['MOVE_FORWARD', 'MOVE_RIGHT', 'MOVE_LEFT', 'MOVE_UP', 'MOVE_DOWN'].includes(type);

  return (
    <div
      draggable={!!onDragStart}
      onDragStart={onDragStart}
      className={`${metadata.color} text-white p-3 mb-2 rounded-xl shadow-md cursor-grab active:cursor-grabbing flex flex-col gap-1 transition-all duration-200 border-b-4 border-black border-opacity-20 ${isActive ? 'ring-4 ring-yellow-400 scale-105 shadow-xl' : 'hover:scale-[1.01]'}`}
    >
      <div className="flex items-center gap-2 font-bold text-sm md:text-base">
        <span>{metadata.icon}</span>
        <div className="flex items-center gap-2 flex-wrap">
          {isMoveBlock && block ? (
            <>
              <span className="whitespace-nowrap">{metadata.label}</span>
              <span className="bg-black/30 px-2 py-0.5 rounded font-bold text-sm border border-white/10">1 block</span>
            </>
          ) : type === 'REPEAT' && block ? (
            <>
              <span>Repeat</span>
              <input 
                type="number" 
                min="1"
                max="99"
                value={block.value ?? 4} 
                onChange={handleInputChange}
                onMouseDown={stopPropagation}
                className="w-12 px-1 rounded bg-black/30 border border-white/20 text-center font-bold focus:outline-none focus:ring-2 focus:ring-white text-white appearance-none text-sm"
              />
              <span className="text-[10px] opacity-80 uppercase tracking-tighter">times</span>
            </>
          ) : type === 'SPEAK' && block ? (
            <>
              <span>{metadata.label}</span>
              <input 
                type="text" 
                value={block.value || ""} 
                onChange={handleInputChange}
                onMouseDown={stopPropagation}
                placeholder="Message..."
                className="bg-black/30 px-2 py-0.5 rounded font-bold text-sm border border-white/10 italic focus:outline-none focus:ring-2 focus:ring-white text-white min-w-[80px] max-w-[120px]"
              />
            </>
          ) : type === 'IF_EDGE' && block ? (
            <>
              <span>If touching</span>
              <select 
                value={block.value ?? 'any'} 
                onChange={handleInputChange}
                onMouseDown={stopPropagation}
                className="bg-black/30 px-2 py-0.5 rounded font-bold text-sm border border-white/10 focus:outline-none focus:ring-2 focus:ring-white text-white cursor-pointer"
              >
                <option value="any" className="text-black">Any Edge</option>
                <option value="top" className="text-black">Top Edge</option>
                <option value="bottom" className="text-black">Bottom Edge</option>
                <option value="left" className="text-black">Left Edge</option>
                <option value="right" className="text-black">Right Edge</option>
              </select>
            </>
          ) : (
            <span>{metadata.label}</span>
          )}
        </div>
      </div>
      
      {block && (block.type === 'REPEAT' || block.type === 'IF_EDGE') && (
        <div 
          className="bg-black/20 rounded-lg p-2 min-h-[48px] border-l-4 border-white border-opacity-40 mt-1"
          onDragOver={(e) => e.preventDefault()}
        >
           {renderChildren && renderChildren(block.children || [])}
           {block.children?.length === 0 && <div className="text-[10px] uppercase tracking-widest font-bold opacity-30 italic py-2">Drop moves here</div>}
        </div>
      )}
    </div>
  );
};

export default BlockItem;
