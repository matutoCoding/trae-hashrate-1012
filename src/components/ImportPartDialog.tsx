import React, { useState } from 'react';
import { X, Upload } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { PartType } from '@/types';

const PART_TYPES: { value: PartType; label: string }[] = [
  { value: 'head', label: '头部' },
  { value: 'neck', label: '颈部' },
  { value: 'body', label: '身体' },
  { value: 'arm_upper_l', label: '左上臂' },
  { value: 'arm_lower_l', label: '左下臂' },
  { value: 'arm_upper_r', label: '右上臂' },
  { value: 'arm_lower_r', label: '右下臂' },
  { value: 'hand_l', label: '左手' },
  { value: 'hand_r', label: '右手' },
  { value: 'leg_upper_l', label: '左大腿' },
  { value: 'leg_lower_l', label: '左小腿' },
  { value: 'leg_upper_r', label: '右大腿' },
  { value: 'leg_lower_r', label: '右小腿' },
  { value: 'foot_l', label: '左脚' },
  { value: 'foot_r', label: '右脚' },
  { value: 'other', label: '其他' },
];

interface ImportPartDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: {
    name: string;
    type: PartType;
    color: string;
    zIndex: number;
  }) => void;
  defaultName: string;
  defaultZIndex: number;
  defaultColor: string;
  svgPath: string;
}

export const ImportPartDialog: React.FC<ImportPartDialogProps> = ({
  isOpen,
  onClose,
  onSubmit,
  defaultName,
  defaultZIndex,
  defaultColor,
  svgPath,
}) => {
  const [name, setName] = useState(defaultName);
  const [type, setType] = useState<PartType>('other');
  const [color, setColor] = useState(defaultColor);
  const [zIndex, setZIndex] = useState(defaultZIndex);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (name.trim()) {
      onSubmit({
        name: name.trim(),
        type,
        color,
        zIndex,
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
            <Upload className="w-5 h-5 text-crimson-500" />
            导入 SVG 部件
          </h2>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-ink-400 hover:text-ink-600 hover:bg-parchment-200 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-5 space-y-4">
          <div className="flex justify-center">
            <div className="w-32 h-32 bg-parchment-100 rounded-lg border-2 border-dashed border-shadow-300 flex items-center justify-center overflow-hidden">
              <svg viewBox="-50 -50 100 100" className="w-full h-full">
                <path d={svgPath} fill={color} stroke="#1A0702" strokeWidth="0.5" />
              </svg>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-ink-600 mb-1.5">
                部件名称 <span className="text-crimson-500">*</span>
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="请输入部件名称"
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
                部件类型 <span className="text-crimson-500">*</span>
              </label>
              <select
                value={type}
                onChange={(e) => setType(e.target.value as PartType)}
                className={cn(
                  'w-full px-4 py-2.5 rounded-lg',
                  'bg-parchment-100 border border-shadow-300',
                  'text-ink-700',
                  'focus:outline-none focus:ring-2 focus:ring-crimson-400/50 focus:border-crimson-400',
                  'transition-all duration-200'
                )}
              >
                {PART_TYPES.map((pt) => (
                  <option key={pt.value} value={pt.value}>
                    {pt.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-ink-600 mb-1.5">
                  颜色
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={color}
                    onChange={(e) => setColor(e.target.value)}
                    className="w-12 h-10 rounded-lg border border-shadow-300 cursor-pointer bg-transparent"
                  />
                  <input
                    type="text"
                    value={color}
                    onChange={(e) => setColor(e.target.value)}
                    className={cn(
                      'flex-1 px-3 py-2 rounded-lg text-sm',
                      'bg-parchment-100 border border-shadow-300',
                      'text-ink-700',
                      'focus:outline-none focus:ring-2 focus:ring-crimson-400/50 focus:border-crimson-400',
                      'transition-all duration-200'
                    )}
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-ink-600 mb-1.5">
                  Z 层级
                </label>
                <input
                  type="number"
                  value={zIndex}
                  onChange={(e) => setZIndex(Number(e.target.value))}
                  className={cn(
                    'w-full px-4 py-2.5 rounded-lg',
                    'bg-parchment-100 border border-shadow-300',
                    'text-ink-700',
                    'focus:outline-none focus:ring-2 focus:ring-crimson-400/50 focus:border-crimson-400',
                    'transition-all duration-200'
                  )}
                />
              </div>
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
                导入
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};
