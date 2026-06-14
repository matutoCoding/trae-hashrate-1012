import { useState, useMemo, useEffect, useRef } from 'react';
import {
  Play,
  Pause,
  Square,
  Search,
  Plus,
  Edit2,
  Trash2,
  Copy,
  Layers,
  Clock,
  Repeat,
  Star,
  X,
  Film,
  User,
} from 'lucide-react';
import { useAppStore } from '@/store/useAppStore';
import { cn } from '@/lib/utils';
import { generateId } from '@/utils/defaultData';
import { ShadowPuppetCanvas } from '@/components/canvas/ShadowPuppetCanvas';
import { Action, Character, JointState, StickState } from '@/types';
import { lerp, lerpPoint, applyEasing } from '@/utils/kinematics';

const CATEGORIES = [
  { id: 'all', name: '全部', icon: Layers },
  { id: '基本身段', name: '基本身段', icon: Star },
  { id: '台步', name: '台步', icon: Film },
  { id: '手势', name: '手势', icon: User },
  { id: '表情', name: '表情', icon: Star },
  { id: '武打', name: '武打', icon: Film },
  { id: '自定义', name: '自定义', icon: Layers },
];

const PRESET_ACTIONS = [
  { name: '走路', category: '基本身段', description: '标准台步，左右脚交替前行', duration: 2000 },
  { name: '作揖', category: '基本身段', description: '双手抱拳躬身行礼', duration: 1000 },
  { name: '万福', category: '基本身段', description: '女子行礼，双手交叠于腰侧', duration: 900 },
  { name: '抱拳', category: '基本身段', description: '左手抱右拳，拱手为礼', duration: 800 },
  { name: '亮相', category: '基本身段', description: '雕塑式定型姿势', duration: 500 },
  { name: '云手', category: '基本身段', description: '双手如云般划圆舞动', duration: 1500 },
  { name: '圆场', category: '台步', description: '快速圆场走步', duration: 3000 },
  { name: '蹉步', category: '台步', description: '小步快速移动', duration: 1500 },
  { name: '剑指', category: '手势', description: '食指中指并拢伸出', duration: 600 },
  { name: '兰花指', category: '手势', description: '五指微曲如兰花', duration: 500 },
  { name: '笑', category: '表情', description: '微笑表情', duration: 800 },
  { name: '怒', category: '表情', description: '愤怒表情', duration: 600 },
  { name: '翻跟头', category: '武打', description: '空翻动作', duration: 1200 },
  { name: '踢腿', category: '武打', description: '高踢腿动作', duration: 800 },
];

function formatDuration(ms: number): string {
  const seconds = Math.floor(ms / 1000);
  const remainingMs = ms % 1000;
  return `${seconds}.${Math.floor(remainingMs / 100)}s`;
}

function getColorIndex(id: string, count: number): number {
  let hash = 0;
  for (let i = 0; i < id.length; i++) {
    hash = ((hash << 5) - hash) + id.charCodeAt(i);
    hash = hash & hash;
  }
  return Math.abs(hash) % count;
}

function ActionThumbnail({ action }: { action: Action }) {
  const colors = [
    { primary: '#B8350D', secondary: '#D9703C', accent: '#C9A227' },
    { primary: '#701E08', secondary: '#B8350D', accent: '#D4B078' },
    { primary: '#8B6914', secondary: '#C9A227', accent: '#E8D0A8' },
    { primary: '#4F1506', secondary: '#93280A', accent: '#B8860B' },
  ];
  const colorIndex = getColorIndex(action.id, colors.length);
  const { primary, secondary, accent } = colors[colorIndex];

  return (
    <svg
      viewBox="0 0 160 120"
      className="w-full h-full"
      style={{ background: 'linear-gradient(180deg, #FDF8E8 0%, #F3E3B0 100%)' }}
    >
      <defs>
        <filter id={`thumb-shadow-${action.id}`} x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow dx="2" dy="3" stdDeviation="2" floodOpacity="0.3" />
        </filter>
      </defs>
      <g filter={`url(#thumb-shadow-${action.id})`}>
        <ellipse cx="80" cy="28" rx="14" ry="18" fill={primary} />
        <ellipse cx="80" cy="28" rx="11" ry="14" fill={secondary} opacity="0.6" />
        <circle cx="75" cy="26" r="1.5" fill="#1A0702" />
        <circle cx="85" cy="26" r="1.5" fill="#1A0702" />
        <path d="M77 34 Q80 37 83 34" stroke="#1A0702" strokeWidth="1.2" fill="none" />
        <path d="M80 46 L80 72" stroke={primary} strokeWidth="8" strokeLinecap="round" />
        <path d="M80 52 L58 68" stroke={primary} strokeWidth="6" strokeLinecap="round" />
        <path d="M80 52 L102 60" stroke={primary} strokeWidth="6" strokeLinecap="round" />
        <ellipse cx="54" cy="70" rx="6" ry="4" fill={primary} />
        <ellipse cx="106" cy="62" rx="6" ry="4" fill={primary} />
        <path d="M80 72 L68 104" stroke={primary} strokeWidth="7" strokeLinecap="round" />
        <path d="M80 72 L92 104" stroke={primary} strokeWidth="7" strokeLinecap="round" />
        <ellipse cx="66" cy="106" rx="8" ry="4" fill={primary} />
        <ellipse cx="94" cy="106" rx="8" ry="4" fill={primary} />
      </g>
      <path d="M58 68 Q32 80 24 76" stroke={accent} strokeWidth="1.5" fill="none" opacity="0.7" />
      <circle cx="24" cy="76" r="3" fill={accent} opacity="0.7" />
      <path d="M102 60 Q128 64 136 56" stroke={accent} strokeWidth="1.5" fill="none" opacity="0.7" />
      <circle cx="136" cy="56" r="3" fill={accent} opacity="0.7" />
    </svg>
  );
}

interface ActionCardProps {
  action: Action;
  isSelected: boolean;
  onClick: () => void;
  onEdit: () => void;
  onDelete: () => void;
  onDuplicate: () => void;
}

function ActionCard({ action, isSelected, onClick, onEdit, onDelete, onDuplicate }: ActionCardProps) {
  return (
    <div
      className={cn(
        'group relative bg-parchment-50 rounded-xl overflow-hidden cursor-pointer',
        'shadow-shadow-puppet',
        'transition-all duration-300 ease-out',
        'hover:scale-105 hover:shadow-warm-glow',
        'border border-shadow-200',
        isSelected && 'ring-2 ring-crimson-400 border-crimson-400'
      )}
      onClick={onClick}
    >
      <div className="relative h-32 overflow-hidden bg-parchment-200">
        <ActionThumbnail action={action} />
        <div className="absolute inset-0 bg-gradient-to-t from-ink-900/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
        <div className="absolute top-2 right-2 flex gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
          <button
            onClick={(e) => {
              e.stopPropagation();
              onDuplicate();
            }}
            className={cn(
              'p-1.5 rounded-full',
              'bg-parchment-100/90 backdrop-blur-sm',
              'text-ink-600 hover:text-crimson-500 hover:bg-parchment-50',
              'transition-colors duration-200',
              'shadow-md'
            )}
            title="复制"
          >
            <Copy className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onEdit();
            }}
            className={cn(
              'p-1.5 rounded-full',
              'bg-parchment-100/90 backdrop-blur-sm',
              'text-ink-600 hover:text-crimson-500 hover:bg-parchment-50',
              'transition-colors duration-200',
              'shadow-md'
            )}
            title="编辑"
          >
            <Edit2 className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onDelete();
            }}
            className={cn(
              'p-1.5 rounded-full',
              'bg-parchment-100/90 backdrop-blur-sm',
              'text-ink-600 hover:text-crimson-500 hover:bg-parchment-50',
              'transition-colors duration-200',
              'shadow-md'
            )}
            title="删除"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
        <div className="absolute bottom-2 left-2">
          <span className={cn(
            'px-2 py-0.5 rounded-full text-xs font-medium',
            'bg-parchment-100/90 backdrop-blur-sm text-ink-600'
          )}>
            {action.category}
          </span>
        </div>
      </div>
      <div className="p-3">
        <h3 className="text-sm font-display font-bold text-ink-800 mb-1 truncate">
          {action.name}
        </h3>
        <p className="text-xs text-ink-500 mb-2 line-clamp-1">
          {action.description || '暂无描述'}
        </p>
        <div className="flex items-center justify-between text-xs text-ink-400">
          <span className="flex items-center gap-1">
            <Clock className="w-3 h-3" />
            {formatDuration(action.duration)}
          </span>
          <span className="flex items-center gap-1">
            <Layers className="w-3 h-3" />
            {action.keyframes.length} 帧
          </span>
        </div>
      </div>
    </div>
  );
}

interface ActionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (action: Partial<Action>) => void;
  mode: 'create' | 'edit';
  initialAction?: Action | null;
}

function ActionModal({ isOpen, onClose, onSubmit, mode, initialAction }: ActionModalProps) {
  const [name, setName] = useState('');
  const [category, setCategory] = useState('自定义');
  const [description, setDescription] = useState('');
  const [duration, setDuration] = useState(1000);

  useEffect(() => {
    if (initialAction) {
      setName(initialAction.name);
      setCategory(initialAction.category);
      setDescription(initialAction.description);
      setDuration(initialAction.duration);
    } else {
      setName('');
      setCategory('自定义');
      setDescription('');
      setDuration(1000);
    }
  }, [initialAction, isOpen]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (name.trim()) {
      onSubmit({
        name: name.trim(),
        category,
        description: description.trim(),
        duration,
      });
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-ink-900/60 backdrop-blur-sm"
        onClick={onClose}
      />
      <div className="relative w-full max-w-md bg-parchment-50 rounded-2xl shadow-shadow-puppet border border-shadow-200 overflow-hidden">
        <div className="flex items-center justify-between p-5 border-b border-shadow-200">
          <h2 className="text-xl font-display font-bold text-ink-800 flex items-center gap-2">
            <Film className="w-5 h-5 text-crimson-500" />
            {mode === 'create' ? '新建动作' : '编辑动作'}
          </h2>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-ink-400 hover:text-ink-600 hover:bg-parchment-200 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div>
            <label className="block text-sm font-medium text-ink-600 mb-1.5">
              动作名称 <span className="text-crimson-500">*</span>
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="请输入动作名称"
              className={cn(
                'w-full px-4 py-2.5 rounded-lg',
                'bg-parchment-100 border border-shadow-300',
                'text-ink-700 placeholder-ink-300',
                'focus:outline-none focus:ring-2 focus:ring-crimson-400/50 focus:border-crimson-400',
                'transition-all duration-200'
              )}
              autoFocus
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-ink-600 mb-1.5">
              动作分类
            </label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className={cn(
                'w-full px-4 py-2.5 rounded-lg',
                'bg-parchment-100 border border-shadow-300',
                'text-ink-700',
                'focus:outline-none focus:ring-2 focus:ring-crimson-400/50 focus:border-crimson-400',
                'transition-all duration-200'
              )}
            >
              <option value="基本身段">基本身段</option>
              <option value="台步">台步</option>
              <option value="手势">手势</option>
              <option value="表情">表情</option>
              <option value="武打">武打</option>
              <option value="自定义">自定义</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-ink-600 mb-1.5">
              动作描述
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="请输入动作描述"
              rows={3}
              className={cn(
                'w-full px-4 py-2.5 rounded-lg resize-none',
                'bg-parchment-100 border border-shadow-300',
                'text-ink-700 placeholder-ink-300',
                'focus:outline-none focus:ring-2 focus:ring-crimson-400/50 focus:border-crimson-400',
                'transition-all duration-200'
              )}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-ink-600 mb-1.5">
              时长 (毫秒)
            </label>
            <input
              type="number"
              value={duration}
              onChange={(e) => setDuration(Math.max(100, parseInt(e.target.value) || 0))}
              min={100}
              step={100}
              className={cn(
                'w-full px-4 py-2.5 rounded-lg',
                'bg-parchment-100 border border-shadow-300',
                'text-ink-700',
                'focus:outline-none focus:ring-2 focus:ring-crimson-400/50 focus:border-crimson-400',
                'transition-all duration-200'
              )}
            />
          </div>
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className={cn(
                'flex-1 px-4 py-2.5 rounded-lg font-medium',
                'bg-parchment-200 text-ink-600',
                'hover:bg-parchment-300',
                'transition-colors duration-200'
              )}
            >
              取消
            </button>
            <button
              type="submit"
              disabled={!name.trim()}
              className={cn(
                'flex-1 px-4 py-2.5 rounded-lg font-medium',
                'bg-crimson-500 text-parchment-50',
                'hover:bg-crimson-600',
                'disabled:opacity-50 disabled:cursor-not-allowed',
                'transition-colors duration-200',
                'shadow-shadow-puppet'
              )}
            >
              {mode === 'create' ? '创建' : '保存'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

interface PreviewPanelProps {
  action: Action | null;
  character: Character | undefined;
  isPlaying: boolean;
  isLooping: boolean;
  currentTime: number;
  onPlay: () => void;
  onPause: () => void;
  onStop: () => void;
  onToggleLoop: () => void;
  onSeek: (time: number) => void;
  onApply: () => void;
  onEdit: () => void;
  onDelete: () => void;
}

function PreviewPanel({
  action,
  character,
  isPlaying,
  isLooping,
  currentTime,
  onPlay,
  onPause,
  onStop,
  onToggleLoop,
  onSeek,
  onApply,
  onEdit,
  onDelete,
}: PreviewPanelProps) {
  if (!action || !character) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-ink-400">
        <div className="w-20 h-20 mb-4 rounded-full bg-parchment-200 flex items-center justify-center">
          <Film className="w-10 h-10 text-shadow-400" />
        </div>
        <p className="text-center">选择一个动作查看预览</p>
      </div>
    );
  }

  const progress = action.duration > 0 ? (currentTime / action.duration) * 100 : 0;

  return (
    <div className="flex flex-col h-full">
      <div className="relative h-64 bg-parchment-100 rounded-xl overflow-hidden border border-shadow-200 mb-4">
        <ShadowPuppetCanvas
          character={character}
          showJoints={false}
          showSticks={false}
          showConstraints={false}
          showLightEffect={true}
          interactive={false}
        />
        <div className="absolute bottom-2 right-2 px-2 py-1 bg-ink-700/60 backdrop-blur-sm rounded text-xs text-parchment-300">
          {formatDuration(currentTime)} / {formatDuration(action.duration)}
        </div>
      </div>

      <div className="flex items-center gap-3 mb-4">
        <button
          onClick={isPlaying ? onPause : onPlay}
          className={cn(
            'w-12 h-12 rounded-full flex items-center justify-center',
            'bg-crimson-500 text-parchment-50',
            'hover:bg-crimson-600',
            'transition-colors duration-200',
            'shadow-shadow-puppet'
          )}
          title={isPlaying ? '暂停' : '播放'}
        >
          {isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5 ml-0.5" />}
        </button>
        <button
          onClick={onStop}
          className={cn(
            'w-10 h-10 rounded-full flex items-center justify-center',
            'bg-parchment-200 text-ink-600',
            'hover:bg-parchment-300',
            'transition-colors duration-200'
          )}
          title="停止"
        >
          <Square className="w-4 h-4" />
        </button>
        <div className="flex-1">
          <div
            className="h-2 bg-parchment-200 rounded-full cursor-pointer overflow-hidden relative"
            onClick={(e) => {
              const rect = e.currentTarget.getBoundingClientRect();
              const x = e.clientX - rect.left;
              const percentage = x / rect.width;
              onSeek(percentage * action.duration);
            }}
            onMouseDown={(e) => {
              const target = e.currentTarget;
              const handleMove = (moveEvent: MouseEvent) => {
                const rect = target.getBoundingClientRect();
                const x = moveEvent.clientX - rect.left;
                const percentage = Math.max(0, Math.min(1, x / rect.width));
                onSeek(percentage * action.duration);
              };
              const handleUp = () => {
                document.removeEventListener('mousemove', handleMove);
                document.removeEventListener('mouseup', handleUp);
              };
              document.addEventListener('mousemove', handleMove);
              document.addEventListener('mouseup', handleUp);
            }}
          >
            <div
              className="h-full bg-crimson-500 rounded-full transition-all duration-100"
              style={{ width: `${progress}%` }}
            />
            <div
              className="absolute top-1/2 -translate-y-1/2 w-4 h-4 bg-white rounded-full shadow-md border-2 border-crimson-500 transition-all duration-100"
              style={{ left: `calc(${progress}% - 8px)` }}
            />
          </div>
        </div>
        <button
          onClick={onToggleLoop}
          className={cn(
            'p-2 rounded-lg',
            isLooping
              ? 'bg-crimson-500 text-parchment-50'
              : 'bg-parchment-200 text-ink-500 hover:bg-parchment-300',
            'transition-colors duration-200'
          )}
          title="循环播放"
        >
          <Repeat className="w-4 h-4" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto space-y-4">
        <div>
          <h3 className="text-lg font-display font-bold text-ink-800 mb-1">
            {action.name}
          </h3>
          <span className={cn(
            'inline-block px-2.5 py-0.5 rounded-full text-xs font-medium',
            'bg-shadow-100 text-shadow-700'
          )}>
            {action.category}
          </span>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="bg-parchment-100 rounded-lg p-3 border border-shadow-200">
            <div className="text-xs text-ink-400 mb-1">时长</div>
            <div className="text-lg font-bold text-ink-700 flex items-center gap-2">
              <Clock className="w-4 h-4 text-crimson-500" />
              {formatDuration(action.duration)}
            </div>
          </div>
          <div className="bg-parchment-100 rounded-lg p-3 border border-shadow-200">
            <div className="text-xs text-ink-400 mb-1">关键帧</div>
            <div className="text-lg font-bold text-ink-700 flex items-center gap-2">
              <Layers className="w-4 h-4 text-crimson-500" />
              {action.keyframes.length} 帧
            </div>
          </div>
        </div>

        <div>
          <h4 className="text-sm font-medium text-ink-600 mb-2">动作描述</h4>
          <p className="text-sm text-ink-500 leading-relaxed">
            {action.description || '暂无描述'}
          </p>
        </div>
      </div>

      <div className="flex gap-2 pt-4 border-t border-shadow-200 mt-4">
        <button
          onClick={onApply}
          className={cn(
            'flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg font-medium',
            'bg-crimson-500 text-parchment-50',
            'hover:bg-crimson-600',
            'transition-colors duration-200',
            'shadow-shadow-puppet'
          )}
        >
          <Plus className="w-4 h-4" />
          应用到时间轴
        </button>
        <button
          onClick={onEdit}
          className={cn(
            'px-4 py-2.5 rounded-lg font-medium',
            'bg-parchment-200 text-ink-600',
            'hover:bg-parchment-300',
            'transition-colors duration-200'
          )}
          title="编辑"
        >
          <Edit2 className="w-4 h-4" />
        </button>
        <button
          onClick={onDelete}
          className={cn(
            'px-4 py-2.5 rounded-lg font-medium',
            'bg-parchment-200 text-ink-600',
            'hover:bg-red-100 hover:text-red-600',
            'transition-colors duration-200'
          )}
          title="删除"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}

interface AnimationState {
  joints: Record<string, number>;
  sticks: Record<string, { angle: number; controlPoint: { x: number; y: number } }>;
}

export default function ActionLibrary() {
  const {
    getCurrentDrama,
    getCurrentCharacter,
    currentDramaId,
    currentCharacterId,
    addAction,
    updateAction,
    deleteAction,
    setCharacterJointAngle,
    setStickState,
  } = useAppStore();

  const drama = getCurrentDrama();
  const character = getCurrentCharacter();
  const actions = useMemo(() => drama?.actions || [], [drama]);

  const [selectedCategory, setSelectedCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedAction, setSelectedAction] = useState<Action | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingAction, setEditingAction] = useState<Action | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLooping, setIsLooping] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [initialState, setInitialState] = useState<AnimationState | null>(null);
  const animationRef = useRef<number | null>(null);
  const lastTimeRef = useRef<number>(0);
  const selectedActionIdRef = useRef<string | null>(null);
  const isPlayingRef = useRef(false);
  const currentTimeRef = useRef(0);
  const selectedActionRef = useRef<Action | null>(null);
  const characterRef = useRef<Character | undefined>(undefined);

  const filteredActions = useMemo(() => {
    let result = actions;

    if (selectedCategory !== 'all') {
      result = result.filter((a) => a.category === selectedCategory);
    }

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      result = result.filter(
        (a) =>
          a.name.toLowerCase().includes(query) ||
          a.description.toLowerCase().includes(query)
      );
    }

    return result;
  }, [actions, selectedCategory, searchQuery]);

  useEffect(() => {
    selectedActionIdRef.current = selectedAction?.id || null;
    selectedActionRef.current = selectedAction;
  }, [selectedAction]);

  useEffect(() => {
    characterRef.current = character;
  }, [character]);

  useEffect(() => {
    isPlayingRef.current = isPlaying;
  }, [isPlaying]);

  useEffect(() => {
    currentTimeRef.current = currentTime;
  }, [currentTime]);

  useEffect(() => {
    const actionId = selectedActionIdRef.current;
    if (actionId) {
      const updated = actions.find((a) => a.id === actionId);
      if (updated) {
        setSelectedAction(updated);
        selectedActionRef.current = updated;
      }
    }
  }, [actions]);

  useEffect(() => {
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
      restoreInitialState();
    };
  }, []);

  function saveInitialState(char: Character) {
    const state: AnimationState = {
      joints: {},
      sticks: {},
    };
    char.joints.forEach((joint) => {
      state.joints[joint.id] = joint.currentAngle;
    });
    char.sticks.forEach((stick) => {
      state.sticks[stick.id] = {
        angle: stick.angle,
        controlPoint: { ...stick.controlPoint },
      };
    });
    setInitialState(state);
  }

  function restoreInitialState() {
    if (!initialState || !currentCharacterId) return;
    
    Object.entries(initialState.joints).forEach(([jointId, angle]) => {
      setCharacterJointAngle(currentCharacterId, jointId, angle);
    });
    
    Object.entries(initialState.sticks).forEach(([stickId, state]) => {
      setStickState(currentCharacterId, stickId, {
        angle: state.angle,
        controlPoint: state.controlPoint,
      });
    });
  }

  function findSurroundingKeyframes(keyframes: any[], time: number) {
    if (keyframes.length === 0) return null;
    
    const sorted = [...keyframes].sort((a, b) => a.time - b.time);
    
    if (time <= sorted[0].time) {
      return { prev: sorted[0], next: sorted[0], t: 0 };
    }
    
    if (time >= sorted[sorted.length - 1].time) {
      return { prev: sorted[sorted.length - 1], next: sorted[sorted.length - 1], t: 1 };
    }
    
    for (let i = 0; i < sorted.length - 1; i++) {
      if (time >= sorted[i].time && time <= sorted[i + 1].time) {
        const duration = sorted[i + 1].time - sorted[i].time;
        const t = duration > 0 ? (time - sorted[i].time) / duration : 0;
        return { prev: sorted[i], next: sorted[i + 1], t };
      }
    }
    
    return null;
  }

  function interpolateJointState(prev: JointState, next: JointState, t: number): JointState {
    return {
      angle: lerp(prev.angle, next.angle, t),
      position: lerpPoint(prev.position, next.position, t),
    };
  }

  function interpolateStickState(prev: StickState, next: StickState, t: number): StickState {
    return {
      angle: lerp(prev.angle, next.angle, t),
      controlPoint: lerpPoint(prev.controlPoint, next.controlPoint, t),
    };
  }

  function applyAnimationState(time: number) {
    const action = selectedActionRef.current;
    const char = characterRef.current;
    
    if (!action || !char || !currentCharacterId) return;
    if (action.keyframes.length === 0) return;
    
    const surrounding = findSurroundingKeyframes(action.keyframes, time);
    if (!surrounding) return;
    
    const { prev, next, t } = surrounding;
    const easing = prev.easing || 'linear';
    const easedT = applyEasing(t, easing);
    
    const jointIds = new Set([
      ...Object.keys(prev.joints || {}),
      ...Object.keys(next.joints || {}),
    ]);
    
    jointIds.forEach((jointId) => {
      const prevJoint = prev.joints[jointId];
      const nextJoint = next.joints[jointId];
      
      if (prevJoint && nextJoint) {
        const interpolated = interpolateJointState(prevJoint, nextJoint, easedT);
        setCharacterJointAngle(currentCharacterId, jointId, interpolated.angle);
      } else if (prevJoint) {
        setCharacterJointAngle(currentCharacterId, jointId, prevJoint.angle);
      } else if (nextJoint) {
        setCharacterJointAngle(currentCharacterId, jointId, nextJoint.angle);
      }
    });
    
    const stickIds = new Set([
      ...Object.keys(prev.sticks || {}),
      ...Object.keys(next.sticks || {}),
    ]);
    
    stickIds.forEach((stickId) => {
      const prevStick = prev.sticks[stickId];
      const nextStick = next.sticks[stickId];
      
      if (prevStick && nextStick) {
        const interpolated = interpolateStickState(prevStick, nextStick, easedT);
        setStickState(currentCharacterId, stickId, {
          angle: interpolated.angle,
          controlPoint: interpolated.controlPoint,
        });
      } else if (prevStick) {
        setStickState(currentCharacterId, stickId, {
          angle: prevStick.angle,
          controlPoint: prevStick.controlPoint,
        });
      } else if (nextStick) {
        setStickState(currentCharacterId, stickId, {
          angle: nextStick.angle,
          controlPoint: nextStick.controlPoint,
        });
      }
    });
  }

  useEffect(() => {
    if (!isPlaying || !selectedAction) {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
        animationRef.current = null;
      }
      return;
    }

    const animate = (timestamp: number) => {
      if (!lastTimeRef.current) {
        lastTimeRef.current = timestamp;
      }

      const delta = timestamp - lastTimeRef.current;
      lastTimeRef.current = timestamp;

      const currentTime = currentTimeRef.current;
      const action = selectedActionRef.current;
      
      if (!action) return;

      let next = currentTime + delta;
      let shouldStop = false;
      
      if (next >= action.duration) {
        if (isLooping) {
          next = 0;
        } else {
          next = action.duration;
          shouldStop = true;
        }
      }

      setCurrentTime(next);
      currentTimeRef.current = next;
      applyAnimationState(next);

      if (shouldStop) {
        setIsPlaying(false);
        isPlayingRef.current = false;
        setTimeout(() => {
          restoreInitialState();
        }, 100);
        return;
      }

      if (isPlayingRef.current) {
        animationRef.current = requestAnimationFrame(animate);
      }
    };

    animationRef.current = requestAnimationFrame(animate);

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [isPlaying, selectedAction, isLooping]);

  const handlePlay = () => {
    if (!selectedAction || !character) return;
    
    if (!initialState) {
      saveInitialState(character);
    }
    
    if (currentTime >= selectedAction.duration) {
      setCurrentTime(0);
      currentTimeRef.current = 0;
    }
    lastTimeRef.current = 0;
    setIsPlaying(true);
    isPlayingRef.current = true;
  };

  const handlePause = () => {
    setIsPlaying(false);
    isPlayingRef.current = false;
  };

  const handleStop = () => {
    setIsPlaying(false);
    isPlayingRef.current = false;
    setCurrentTime(0);
    currentTimeRef.current = 0;
    setTimeout(() => {
      restoreInitialState();
    }, 50);
  };

  const handleSeek = (time: number) => {
    const newTime = Math.max(0, Math.min(time, selectedAction?.duration || 0));
    setCurrentTime(newTime);
    currentTimeRef.current = newTime;
    
    if (selectedAction && character) {
      if (!initialState) {
        saveInitialState(character);
      }
      applyAnimationState(newTime);
    }
  };

  const handleToggleLoop = () => {
    setIsLooping(!isLooping);
  };

  const handleCreateAction = () => {
    setEditingAction(null);
    setIsModalOpen(true);
  };

  const handleEditAction = (action: Action) => {
    setEditingAction(action);
    setIsModalOpen(true);
  };

  const handleDeleteAction = (action: Action) => {
    if (window.confirm(`确定要删除动作「${action.name}」吗？此操作不可撤销。`)) {
      if (currentDramaId) {
        deleteAction(currentDramaId, action.id);
        if (selectedAction?.id === action.id) {
          setSelectedAction(null);
          setIsPlaying(false);
          setCurrentTime(0);
        }
      }
    }
  };

  const handleDuplicateAction = (action: Action) => {
    if (currentDramaId && currentCharacterId) {
      const newAction: Action = {
        ...action,
        id: generateId(),
        name: `${action.name} - 副本`,
        createdAt: Date.now(),
      };
      addAction(currentDramaId, newAction);
    }
  };

  const handleSubmitAction = (actionData: Partial<Action>) => {
    if (!currentDramaId || !currentCharacterId) return;

    if (editingAction) {
      updateAction(currentDramaId, editingAction.id, actionData);
    } else {
      const newAction: Action = {
        id: generateId(),
        name: actionData.name || '',
        category: actionData.category || '自定义',
        characterId: currentCharacterId,
        duration: actionData.duration || 1000,
        keyframes: [
          {
            id: generateId(),
            time: 0,
            joints: {},
            sticks: {},
            easing: 'ease-in-out',
          },
        ],
        description: actionData.description || '',
        createdAt: Date.now(),
      };
      addAction(currentDramaId, newAction);
    }
  };

  const handleApplyToTimeline = () => {
    alert('已应用到时间轴（功能待实现）');
  };

  const handleActionClick = (action: Action) => {
    if (isPlaying) {
      handleStop();
    }
    setSelectedAction(action);
    setCurrentTime(0);
    currentTimeRef.current = 0;
    setInitialState(null);
  };

  return (
    <div className="h-screen bg-parchment-100 flex flex-col overflow-hidden">
      <div className="px-6 py-4 border-b border-shadow-200 bg-parchment-50">
        <div className="flex items-center gap-3 mb-2">
          <div className="p-2 rounded-xl bg-crimson-500 text-parchment-50 shadow-shadow-puppet">
            <Film className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-xl font-display font-bold text-ink-800">
              动作库
            </h1>
            <p className="text-sm text-ink-500">
              管理皮影戏动作素材，支持预设和自定义动作
            </p>
          </div>
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden">
        <div className="w-[55%] flex flex-col border-r border-shadow-200 overflow-hidden">
          <div className="p-4 border-b border-shadow-200 bg-parchment-50">
            <div className="flex flex-wrap gap-2 mb-4">
              {CATEGORIES.map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => setSelectedCategory(cat.id)}
                  className={cn(
                    'px-3 py-1.5 rounded-lg text-sm font-medium',
                    'transition-all duration-200',
                    selectedCategory === cat.id
                      ? 'bg-crimson-500 text-parchment-50 shadow-shadow-puppet'
                      : 'bg-parchment-200 text-ink-600 hover:bg-parchment-300'
                  )}
                >
                  {cat.name}
                </button>
              ))}
            </div>

            <div className="flex gap-3">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-ink-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="搜索动作名称或描述..."
                  className={cn(
                    'w-full pl-9 pr-4 py-2 rounded-lg',
                    'bg-parchment-100 border border-shadow-300',
                    'text-ink-700 placeholder-ink-300 text-sm',
                    'focus:outline-none focus:ring-2 focus:ring-crimson-400/50 focus:border-crimson-400',
                    'transition-all duration-200'
                  )}
                />
              </div>
              <button
                onClick={handleCreateAction}
                className={cn(
                  'flex items-center gap-2 px-4 py-2 rounded-lg',
                  'bg-crimson-500 text-parchment-50 font-medium text-sm',
                  'hover:bg-crimson-600',
                  'transition-all duration-200',
                  'shadow-shadow-puppet hover:shadow-warm-glow'
                )}
              >
                <Plus className="w-4 h-4" />
                新建动作
              </button>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-4">
            {filteredActions.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 px-4">
                <div className="w-20 h-20 mb-4 rounded-full bg-parchment-200 flex items-center justify-center">
                  <Film className="w-10 h-10 text-shadow-400" />
                </div>
                <h3 className="text-lg font-display font-bold text-ink-700 mb-2">
                  暂无动作
                </h3>
                <p className="text-ink-500 text-center mb-4 text-sm">
                  点击「新建动作」按钮创建你的第一个动作
                </p>
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2 w-full max-w-lg">
                  {PRESET_ACTIONS.slice(0, 8).map((preset) => (
                    <button
                      key={preset.name}
                      onClick={() => {
                        if (currentDramaId && currentCharacterId && character) {
                          let newAction: Action;
                          
                          const jointMap = new Map(character.joints.map(j => [j.name, j.id]));
                          const stickMap = new Map(character.sticks.map(s => [s.name, s.id]));
                          
                          const leftShoulderId = jointMap.get('左肩');
                          const leftElbowId = jointMap.get('左肘');
                          const rightShoulderId = jointMap.get('右肩');
                          const rightElbowId = jointMap.get('右肘');
                          const leftHipId = jointMap.get('左胯');
                          const leftKneeId = jointMap.get('左膝');
                          const rightHipId = jointMap.get('右胯');
                          const rightKneeId = jointMap.get('右膝');
                          const bodyTopId = jointMap.get('躯干顶');
                          const mainStickId = stickMap.get('主签杆');
                          const leftStickId = stickMap.get('左手签');
                          const rightStickId = stickMap.get('右手签');
                          
                          const createJointState = (jointId: string | undefined, angle: number) => {
                            if (!jointId) return null;
                            const joint = character.joints.find(j => j.id === jointId);
                            return joint ? { angle, position: joint.position } : null;
                          };
                          
                          const createStickState = (stickId: string | undefined, angle: number, controlPoint?: { x: number; y: number }) => {
                            if (!stickId) return null;
                            const stick = character.sticks.find(s => s.id === stickId);
                            return stick ? { angle, controlPoint: controlPoint || stick.controlPoint } : null;
                          };
                          
                          const buildJointsObject = (states: Array<[string | undefined, number]>) => {
                            const result: Record<string, any> = {};
                            states.forEach(([id, angle]) => {
                              if (id) {
                                const state = createJointState(id, angle);
                                if (state) result[id] = state;
                              }
                            });
                            return result;
                          };
                          
                          const buildSticksObject = (states: Array<[string | undefined, number, { x: number; y: number } | undefined]>) => {
                            const result: Record<string, any> = {};
                            states.forEach(([id, angle, cp]) => {
                              if (id) {
                                const state = createStickState(id, angle, cp);
                                if (state) result[id] = state;
                              }
                            });
                            return result;
                          };
                          
                          let keyframes: any[] = [];
                          
                          if (preset.name === '走路') {
                            keyframes = [
                              {
                                id: generateId(),
                                time: 0,
                                joints: buildJointsObject([
                                  [leftHipId, 20],
                                  [leftKneeId, -10],
                                  [rightHipId, -10],
                                  [rightKneeId, 15],
                                  [leftShoulderId, -20],
                                  [rightShoulderId, 20],
                                ]),
                                sticks: buildSticksObject([
                                  [mainStickId, -90, undefined],
                                  [leftStickId, -80, undefined],
                                  [rightStickId, -100, undefined],
                                ]),
                                easing: 'ease-in-out',
                              },
                              {
                                id: generateId(),
                                time: 1000,
                                joints: buildJointsObject([
                                  [leftHipId, -10],
                                  [leftKneeId, 15],
                                  [rightHipId, 20],
                                  [rightKneeId, -10],
                                  [leftShoulderId, 20],
                                  [rightShoulderId, -20],
                                ]),
                                sticks: buildSticksObject([
                                  [mainStickId, -90, undefined],
                                  [leftStickId, -60, undefined],
                                  [rightStickId, -120, undefined],
                                ]),
                                easing: 'ease-in-out',
                              },
                              {
                                id: generateId(),
                                time: 2000,
                                joints: buildJointsObject([
                                  [leftHipId, 20],
                                  [leftKneeId, -10],
                                  [rightHipId, -10],
                                  [rightKneeId, 15],
                                  [leftShoulderId, -20],
                                  [rightShoulderId, 20],
                                ]),
                                sticks: buildSticksObject([
                                  [mainStickId, -90, undefined],
                                  [leftStickId, -80, undefined],
                                  [rightStickId, -100, undefined],
                                ]),
                                easing: 'ease-in-out',
                              },
                            ];
                          } else if (preset.name === '作揖') {
                            keyframes = [
                              {
                                id: generateId(),
                                time: 0,
                                joints: buildJointsObject([
                                  [leftShoulderId, 30],
                                  [leftElbowId, 40],
                                  [rightShoulderId, -30],
                                  [rightElbowId, -40],
                                  [bodyTopId, 0],
                                ]),
                                sticks: buildSticksObject([
                                  [mainStickId, -90, undefined],
                                  [leftStickId, -70, undefined],
                                  [rightStickId, -110, undefined],
                                ]),
                                easing: 'ease-out',
                              },
                              {
                                id: generateId(),
                                time: 500,
                                joints: buildJointsObject([
                                  [leftShoulderId, 10],
                                  [leftElbowId, 80],
                                  [rightShoulderId, -10],
                                  [rightElbowId, -80],
                                  [bodyTopId, 15],
                                ]),
                                sticks: buildSticksObject([
                                  [mainStickId, -75, undefined],
                                  [leftStickId, -45, { x: -50, y: 150 }],
                                  [rightStickId, -135, { x: 50, y: 150 }],
                                ]),
                                easing: 'ease-in-out',
                              },
                              {
                                id: generateId(),
                                time: 1000,
                                joints: buildJointsObject([
                                  [leftShoulderId, 30],
                                  [leftElbowId, 40],
                                  [rightShoulderId, -30],
                                  [rightElbowId, -40],
                                  [bodyTopId, 0],
                                ]),
                                sticks: buildSticksObject([
                                  [mainStickId, -90, undefined],
                                  [leftStickId, -70, undefined],
                                  [rightStickId, -110, undefined],
                                ]),
                                easing: 'ease-in',
                              },
                            ];
                          } else if (preset.name === '抱拳') {
                            keyframes = [
                              {
                                id: generateId(),
                                time: 0,
                                joints: buildJointsObject([
                                  [leftShoulderId, 30],
                                  [leftElbowId, 40],
                                  [rightShoulderId, -30],
                                  [rightElbowId, -40],
                                  [bodyTopId, 0],
                                ]),
                                sticks: buildSticksObject([
                                  [mainStickId, -90, undefined],
                                  [leftStickId, -70, undefined],
                                  [rightStickId, -110, undefined],
                                ]),
                                easing: 'ease-out',
                              },
                              {
                                id: generateId(),
                                time: 400,
                                joints: buildJointsObject([
                                  [leftShoulderId, 60],
                                  [leftElbowId, 80],
                                  [rightShoulderId, 0],
                                  [rightElbowId, -80],
                                  [bodyTopId, 0],
                                ]),
                                sticks: buildSticksObject([
                                  [mainStickId, -90, undefined],
                                  [leftStickId, -50, { x: -40, y: 150 }],
                                  [rightStickId, -130, { x: 40, y: 150 }],
                                ]),
                                easing: 'ease-in-out',
                              },
                              {
                                id: generateId(),
                                time: 800,
                                joints: buildJointsObject([
                                  [leftShoulderId, 30],
                                  [leftElbowId, 40],
                                  [rightShoulderId, -30],
                                  [rightElbowId, -40],
                                  [bodyTopId, 0],
                                ]),
                                sticks: buildSticksObject([
                                  [mainStickId, -90, undefined],
                                  [leftStickId, -70, undefined],
                                  [rightStickId, -110, undefined],
                                ]),
                                easing: 'ease-in',
                              },
                            ];
                          } else {
                            keyframes = [
                              {
                                id: generateId(),
                                time: 0,
                                joints: {},
                                sticks: {},
                                easing: 'ease-in-out',
                              },
                            ];
                          }
                          
                          newAction = {
                            id: generateId(),
                            name: preset.name,
                            category: preset.category,
                            characterId: currentCharacterId,
                            duration: preset.duration,
                            keyframes,
                            description: preset.description,
                            createdAt: Date.now(),
                          };
                          addAction(currentDramaId, newAction);
                        }
                      }}
                      className={cn(
                        'px-3 py-2 rounded-lg text-xs',
                        'bg-parchment-200 text-ink-600',
                        'hover:bg-crimson-100 hover:text-crimson-700',
                        'transition-colors duration-200'
                      )}
                    >
                      + {preset.name}
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                {filteredActions.map((action) => (
                  <ActionCard
                    key={action.id}
                    action={action}
                    isSelected={selectedAction?.id === action.id}
                    onClick={() => handleActionClick(action)}
                    onEdit={() => handleEditAction(action)}
                    onDelete={() => handleDeleteAction(action)}
                    onDuplicate={() => handleDuplicateAction(action)}
                  />
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="flex-1 flex flex-col bg-parchment-50 p-4 overflow-hidden">
          <PreviewPanel
            action={selectedAction}
            character={character}
            isPlaying={isPlaying}
            isLooping={isLooping}
            currentTime={currentTime}
            onPlay={handlePlay}
            onPause={handlePause}
            onStop={handleStop}
            onToggleLoop={handleToggleLoop}
            onSeek={handleSeek}
            onApply={handleApplyToTimeline}
            onEdit={() => selectedAction && handleEditAction(selectedAction)}
            onDelete={() => selectedAction && handleDeleteAction(selectedAction)}
          />
        </div>
      </div>

      <ActionModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setEditingAction(null);
        }}
        onSubmit={handleSubmitAction}
        mode={editingAction ? 'edit' : 'create'}
        initialAction={editingAction}
      />
    </div>
  );
}
