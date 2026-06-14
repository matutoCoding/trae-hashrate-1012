import { useState, useMemo } from 'react';
import {
  Theater,
  Plus,
  Search,
  Users,
  Film,
  Clock,
  Trash2,
  Edit,
  X,
} from 'lucide-react';
import { useAppStore } from '@/store/useAppStore';
import { cn } from '@/lib/utils';

function formatDate(timestamp: number): string {
  const date = new Date(timestamp);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

function ShadowPuppetCover({ dramaId }: { dramaId: string }) {
  const colors = [
    { primary: '#B8350D', secondary: '#D9703C', accent: '#C9A227' },
    { primary: '#701E08', secondary: '#B8350D', accent: '#D4B078' },
    { primary: '#8B6914', secondary: '#C9A227', accent: '#E8D0A8' },
    { primary: '#4F1506', secondary: '#93280A', accent: '#B8860B' },
  ];
  let hash = 0;
  for (let i = 0; i < dramaId.length; i++) {
    hash = ((hash << 5) - hash) + dramaId.charCodeAt(i);
    hash = hash & hash;
  }
  const colorIndex = Math.abs(hash) % colors.length;
  const { primary, secondary, accent } = colors[colorIndex];

  return (
    <svg
      viewBox="0 0 200 140"
      className="w-full h-full"
      style={{ background: 'linear-gradient(180deg, #FDF8E8 0%, #F3E3B0 100%)' }}
    >
      <defs>
        <filter id={`shadow-${dramaId}`} x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow dx="2" dy="4" stdDeviation="3" floodOpacity="0.3" />
        </filter>
      </defs>
      <g filter={`url(#shadow-${dramaId})`}>
        <ellipse cx="100" cy="35" rx="18" ry="22" fill={primary} />
        <ellipse cx="100" cy="35" rx="14" ry="18" fill={secondary} opacity="0.6" />
        <circle cx="94" cy="32" r="2" fill="#1A0702" />
        <circle cx="106" cy="32" r="2" fill="#1A0702" />
        <path d="M96 42 Q100 46 104 42" stroke="#1A0702" strokeWidth="1.5" fill="none" />
        <path d="M100 57 L100 90" stroke={primary} strokeWidth="10" strokeLinecap="round" />
        <path d="M100 65 L70 85" stroke={primary} strokeWidth="7" strokeLinecap="round" />
        <path d="M100 65 L130 75" stroke={primary} strokeWidth="7" strokeLinecap="round" />
        <ellipse cx="65" cy="88" rx="8" ry="5" fill={primary} />
        <ellipse cx="135" cy="78" rx="8" ry="5" fill={primary} />
        <path d="M100 90 L85 130" stroke={primary} strokeWidth="8" strokeLinecap="round" />
        <path d="M100 90 L115 130" stroke={primary} strokeWidth="8" strokeLinecap="round" />
        <ellipse cx="82" cy="133" rx="10" ry="5" fill={primary} />
        <ellipse cx="118" cy="133" rx="10" ry="5" fill={primary} />
      </g>
      <path d="M70 85 Q40 100 30 95" stroke={accent} strokeWidth="2" fill="none" opacity="0.7" />
      <circle cx="30" cy="95" r="4" fill={accent} opacity="0.7" />
      <path d="M130 75 Q160 80 170 70" stroke={accent} strokeWidth="2" fill="none" opacity="0.7" />
      <circle cx="170" cy="70" r="4" fill={accent} opacity="0.7" />
    </svg>
  );
}

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center py-20 px-4">
      <div className="w-32 h-32 mb-6 rounded-full bg-parchment-100 flex items-center justify-center shadow-paper">
        <Theater className="w-16 h-16 text-shadow-400" />
      </div>
      <h3 className="text-xl font-display font-bold text-ink-700 mb-2">
        暂无剧目
      </h3>
      <p className="text-ink-500 text-center mb-6 max-w-sm">
        点击上方「新建剧目」按钮，开始创作你的第一个皮影戏剧目
      </p>
    </div>
  );
}

interface DramaCardProps {
  drama: {
    id: string;
    name: string;
    description: string;
    cover?: string;
    createdAt: number;
    updatedAt: number;
    characters: any[];
    actions: any[];
    scenes: any[];
  };
  onClick: () => void;
  onDelete: () => void;
  onEdit: () => void;
}

function DramaCard({ drama, onClick, onDelete, onEdit }: DramaCardProps) {
  return (
    <div
      className={cn(
        'group relative bg-parchment-50 rounded-xl overflow-hidden cursor-pointer',
        'shadow-shadow-puppet',
        'transition-all duration-300 ease-out',
        'hover:scale-105 hover:shadow-warm-glow',
        'border border-shadow-200'
      )}
      onClick={onClick}
    >
      <div className="relative h-44 overflow-hidden bg-parchment-200">
        <ShadowPuppetCover dramaId={drama.id} />
        <div className="absolute inset-0 bg-gradient-to-t from-ink-900/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
        <div className="absolute top-3 right-3 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
          <button
            onClick={(e) => {
              e.stopPropagation();
              onEdit();
            }}
            className={cn(
              'p-2 rounded-full',
              'bg-parchment-100/90 backdrop-blur-sm',
              'text-ink-600 hover:text-crimson-500 hover:bg-parchment-50',
              'transition-colors duration-200',
              'shadow-md'
            )}
          >
            <Edit className="w-4 h-4" />
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onDelete();
            }}
            className={cn(
              'p-2 rounded-full',
              'bg-parchment-100/90 backdrop-blur-sm',
              'text-ink-600 hover:text-crimson-500 hover:bg-parchment-50',
              'transition-colors duration-200',
              'shadow-md'
            )}
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>
      <div className="p-4">
        <h3 className="text-lg font-display font-bold text-ink-800 mb-1 truncate">
          {drama.name}
        </h3>
        <p className="text-sm text-ink-500 mb-3 line-clamp-2 h-10">
          {drama.description || '暂无描述'}
        </p>
        <div className="flex items-center justify-between text-xs text-ink-400">
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1">
              <Users className="w-3.5 h-3.5 text-shadow-500" />
              {drama.characters.length}
            </span>
            <span className="flex items-center gap-1">
              <Film className="w-3.5 h-3.5 text-crimson-400" />
              {drama.actions.length}
            </span>
          </div>
          <span className="flex items-center gap-1">
            <Clock className="w-3.5 h-3.5 text-ink-400" />
            {formatDate(drama.updatedAt)}
          </span>
        </div>
      </div>
    </div>
  );
}

interface NewDramaModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (name: string, description: string) => void;
  mode?: 'create' | 'edit';
  initialName?: string;
  initialDescription?: string;
}

function DramaModal({
  isOpen,
  onClose,
  onSubmit,
  mode = 'create',
  initialName = '',
  initialDescription = '',
}: NewDramaModalProps) {
  const [name, setName] = useState(initialName);
  const [description, setDescription] = useState(initialDescription);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (name.trim()) {
      onSubmit(name.trim(), description.trim());
      setName('');
      setDescription('');
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
            <Theater className="w-5 h-5 text-crimson-500" />
            {mode === 'create' ? '新建剧目' : '编辑剧目'}
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
              剧目名称 <span className="text-crimson-500">*</span>
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="请输入剧目名称"
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
              剧目描述
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="请输入剧目描述"
              rows={4}
              className={cn(
                'w-full px-4 py-2.5 rounded-lg resize-none',
                'bg-parchment-100 border border-shadow-300',
                'text-ink-700 placeholder-ink-300',
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

export default function DramaManagement() {
  const {
    dramas,
    setCurrentDrama,
    createNewDrama,
    deleteDrama,
    updateDrama,
    setCurrentPage,
  } = useAppStore();

  const [searchQuery, setSearchQuery] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingDrama, setEditingDrama] = useState<{
    id: string;
    name: string;
    description: string;
  } | null>(null);

  const filteredDramas = useMemo(() => {
    if (!searchQuery.trim()) return dramas;
    const query = searchQuery.toLowerCase();
    return dramas.filter(
      (drama) =>
        drama.name.toLowerCase().includes(query) ||
        drama.description.toLowerCase().includes(query)
    );
  }, [dramas, searchQuery]);

  const handleCardClick = (dramaId: string) => {
    setCurrentDrama(dramaId);
    setCurrentPage('binding');
  };

  const handleCreateDrama = (name: string, description: string) => {
    createNewDrama(name, description);
  };

  const handleDeleteDrama = (dramaId: string, dramaName: string) => {
    if (window.confirm(`确定要删除剧目「${dramaName}」吗？此操作不可撤销。`)) {
      deleteDrama(dramaId);
    }
  };

  const handleEditDrama = (drama: {
    id: string;
    name: string;
    description: string;
  }) => {
    setEditingDrama(drama);
    setIsModalOpen(true);
  };

  const handleUpdateDrama = (name: string, description: string) => {
    if (editingDrama) {
      updateDrama(editingDrama.id, { name, description });
      setEditingDrama(null);
    }
  };

  const handleOpenCreateModal = () => {
    setEditingDrama(null);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingDrama(null);
  };

  return (
    <div className="min-h-screen bg-parchment-100">
      <div className="max-w-6xl mx-auto px-6 py-8">
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2.5 rounded-xl bg-crimson-500 text-parchment-50 shadow-shadow-puppet">
              <Theater className="w-6 h-6" />
            </div>
            <h1 className="text-3xl font-display font-bold text-ink-800">
              剧目管理
            </h1>
          </div>
          <p className="text-ink-500 ml-14">
            管理你的皮影戏剧目，开始创作精彩的皮影戏表演
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-4 mb-8">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-ink-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="搜索剧目名称或描述..."
              className={cn(
                'w-full pl-12 pr-4 py-3 rounded-xl',
                'bg-parchment-50 border border-shadow-200',
                'text-ink-700 placeholder-ink-300',
                'focus:outline-none focus:ring-2 focus:ring-crimson-400/50 focus:border-crimson-400',
                'transition-all duration-200',
                'shadow-sm'
              )}
            />
          </div>
          <button
            onClick={handleOpenCreateModal}
            className={cn(
              'flex items-center justify-center gap-2 px-6 py-3 rounded-xl',
              'bg-crimson-500 text-parchment-50 font-medium',
              'hover:bg-crimson-600',
              'transition-all duration-200',
              'shadow-shadow-puppet hover:shadow-warm-glow'
            )}
          >
            <Plus className="w-5 h-5" />
            新建剧目
          </button>
        </div>

        {filteredDramas.length === 0 ? (
          <EmptyState />
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredDramas.map((drama) => (
              <DramaCard
                key={drama.id}
                drama={drama}
                onClick={() => handleCardClick(drama.id)}
                onDelete={() => handleDeleteDrama(drama.id, drama.name)}
                onEdit={() =>
                  handleEditDrama({
                    id: drama.id,
                    name: drama.name,
                    description: drama.description,
                  })
                }
              />
            ))}
          </div>
        )}
      </div>

      <DramaModal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        onSubmit={editingDrama ? handleUpdateDrama : handleCreateDrama}
        mode={editingDrama ? 'edit' : 'create'}
        initialName={editingDrama?.name || ''}
        initialDescription={editingDrama?.description || ''}
      />
    </div>
  );
}
