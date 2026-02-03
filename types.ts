
export type BlockType = 
  | 'MOVE_FORWARD' 
  | 'REPEAT' 
  | 'IF_EDGE' 
  | 'IF_ELSE_TOUCHING' 
  | 'SPEAK'
  | 'MOVE_RIGHT'
  | 'MOVE_LEFT'
  | 'MOVE_UP'
  | 'MOVE_DOWN';

export interface Block {
  id: string;
  type: BlockType;
  value?: number | string;
  children?: Block[];
  elseChildren?: Block[];
}

export interface GameState {
  x: number;
  y: number;
  rotation: number;
  message: string | null;
  isRunning: boolean;
  score: number;
  level: number;
  isGameOver: boolean;
  starPositions: { x: number; y: number; id: string }[];
}

export interface Level {
  id: number;
  goal: string;
  description: string;
  initialX: number;
  initialY: number;
  stars: number;
  availableBlocks: BlockType[];
}
