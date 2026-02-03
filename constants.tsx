
import { BlockType, Level } from './types';

const COMMON_BLOCKS: BlockType[] = ['MOVE_RIGHT', 'MOVE_LEFT', 'MOVE_UP', 'MOVE_DOWN'];

export const LEVELS: Level[] = [
  {
    id: 1,
    title: "Basics",
    goal: "Fly to the edge!",
    description: "Learn the fundamentals of moving Nova across the moon's surface. Watch out for space dust!",
    initialX: 50,
    initialY: 50,
    stars: 1,
    availableBlocks: [...COMMON_BLOCKS, 'SPEAK'],
    theme: 'space'
  },
  {
    id: 2,
    title: "Loops",
    goal: "Deep Sea Discovery",
    description: "Master the power of 'Repeat' blocks to collect precious pearls efficiently in the deep ocean!",
    initialX: 20,
    initialY: 80,
    stars: 3,
    availableBlocks: ['REPEAT', ...COMMON_BLOCKS, 'SPEAK'],
    theme: 'ocean'
  },
  {
    id: 3,
    title: "Conditions",
    goal: "Jungle Expedition",
    description: "Understand 'Sensors' to react instantly when Nova touches objects in the dense jungle!",
    initialX: 50,
    initialY: 50,
    stars: 6,
    availableBlocks: ['REPEAT', 'IF_EDGE', 'IF_ELSE_TOUCHING', ...COMMON_BLOCKS, 'SPEAK'],
    theme: 'jungle'
  }
];

export const BLOCK_METADATA: Record<BlockType, { label: string; color: string; icon: string }> = {
  MOVE_FORWARD: { label: 'Move Forward', color: 'bg-blue-500', icon: '🚀' },
  MOVE_RIGHT: { label: 'Move Right', color: 'bg-indigo-500', icon: '➡️' },
  MOVE_LEFT: { label: 'Move Left', color: 'bg-indigo-500', icon: '⬅️' },
  MOVE_UP: { label: 'Move Up', color: 'bg-indigo-500', icon: '⬆️' },
  MOVE_DOWN: { label: 'Move Down', color: 'bg-indigo-500', icon: '⬇️' },
  REPEAT: { label: 'Repeat', color: 'bg-purple-500', icon: '🔁' },
  IF_EDGE: { label: 'When touching edge...', color: 'bg-yellow-500', icon: '🧱' },
  IF_ELSE_TOUCHING: { label: 'If touching object...', color: 'bg-orange-500', icon: '⭐' },
  SPEAK: { label: 'Speak', color: 'bg-green-500', icon: '💬' },
};
