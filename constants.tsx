
import { BlockType, Level } from './types';

const COMMON_BLOCKS: BlockType[] = ['MOVE_RIGHT', 'MOVE_LEFT', 'MOVE_UP', 'MOVE_DOWN'];

export const LEVELS: Level[] = [
  {
    id: 1,
    goal: "Fly to the edge!",
    description: "Great job! You used basic movement blocks to help Nova navigate through space to the edge of the screen.",
    initialX: 55,
    initialY: 55,
    stars: 0,
    availableBlocks: [...COMMON_BLOCKS, 'SPEAK']
  },
  {
    id: 2,
    goal: "Star Collector",
    description: "Success! You used a 'Repeat' block to do the same task multiple times, making your code shorter and smarter.",
    initialX: 15,
    initialY: 85,
    stars: 3,
    availableBlocks: ['REPEAT', ...COMMON_BLOCKS, 'SPEAK']
  },
  {
    id: 3,
    goal: "The Space Patrol",
    description: "Mission Accomplished! You combined 'Repeat' and 'If touching edge' to make Nova react to the environment automatically.",
    initialX: 45,
    initialY: 45,
    stars: 4,
    availableBlocks: ['REPEAT', 'IF_EDGE', ...COMMON_BLOCKS, 'SPEAK']
  }
];

export const BLOCK_METADATA: Record<BlockType, { label: string; color: string; icon: string }> = {
  MOVE_FORWARD: { label: 'Move Forward', color: 'bg-blue-500', icon: '🚀' },
  MOVE_RIGHT: { label: 'Move Right', color: 'bg-indigo-500', icon: '➡️' },
  MOVE_LEFT: { label: 'Move Left', color: 'bg-indigo-500', icon: '⬅️' },
  MOVE_UP: { label: 'Move Up', color: 'bg-indigo-500', icon: '⬆️' },
  MOVE_DOWN: { label: 'Move Down', color: 'bg-indigo-500', icon: '⬇️' },
  REPEAT: { label: 'Repeat', color: 'bg-purple-500', icon: '🔁' },
  IF_EDGE: { label: 'If touching edge...', color: 'bg-yellow-500', icon: '🧱' },
  IF_ELSE_TOUCHING: { label: 'If touching star...', color: 'bg-orange-500', icon: '⭐' },
  SPEAK: { label: 'Speak', color: 'bg-green-500', icon: '💬' },
};
