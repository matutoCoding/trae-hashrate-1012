import React, { useState, useRef } from 'react';
import {
  Layers,
  Eye,
  EyeOff,
  Settings,
  Plus,
  Upload,
  Move,
  RotateCcw,
  ChevronDown,
  ChevronRight,
} from 'lucide-react';
import { ShadowPuppetCanvas } from '@/components/canvas/ShadowPuppetCanvas';
import { ImportPartDialog } from '@/components/ImportPartDialog';
import { useAppStore } from '@/store/useAppStore';
import { cn } from '@/lib/utils';
import { parseSVG, getRandomShadowColor, extractFileNameWithoutExtension } from '@/utils/svgParser';
import { generateId } from '@/utils/defaultData';
import type { Part, Joint, Stick, PartType } from '@/types';

const PartBinding: React.FC = () => {
  const currentDrama = useAppStore((state) => state.getCurrentDrama());
  const currentCharacter = useAppStore((state) => state.getCurrentCharacter());
  const currentDramaId = useAppStore((state) => state.currentDramaId);
  const currentCharacterId = useAppStore((state) => state.currentCharacterId);
  const setCurrentCharacter = useAppStore((state) => state.setCurrentCharacter);
  const selectedPartId = useAppStore((state) => state.selectedPartId);
  const selectedJointId = useAppStore((state) => state.selectedJointId);
  const selectedStickId = useAppStore((state) => state.selectedStickId);
  const setSelectedPart = useAppStore((state) => state.setSelectedPart);
  const setSelectedJoint = useAppStore((state) => state.setSelectedJoint);
  const setSelectedStick = useAppStore((state) => state.setSelectedStick);
  const updatePart = useAppStore((state) => state.updatePart);
  const addPart = useAppStore((state) => state.addPart);
  const updateJoint = useAppStore((state) => state.updateJoint);
  const updateStick = useAppStore((state) => state.updateStick);
  const setZoom = useAppStore((state) => state.setZoom);
  const setPanOffset = useAppStore((state) => state.setPanOffset);
  const zoom = useAppStore((state) => state.zoom);

  const [showJoints, setShowJoints] = useState(true);
  const [showSticks, setShowSticks] = useState(true);
  const [partsExpanded, setPartsExpanded] = useState(true);
  const [jointsExpanded, setJointsExpanded] = useState(true);
  const [sticksExpanded, setSticksExpanded] = useState(true);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [showImportDialog, setShowImportDialog] = useState(false);
  const [pendingImport, setPendingImport] = useState<{
    svgPath: string;
    fileName: string;
  } | null>(null);

  const selectedPart = currentCharacter?.parts.find((p) => p.id === selectedPartId);
  const selectedJoint = currentCharacter?.joints.find((j) => j.id === selectedJointId);
  const selectedStick = currentCharacter?.sticks.find((s) => s.id === selectedStickId);

  const handlePartClick = (partId: string) => {
    setSelectedPart(partId);
  };

  const handleJointClick = (jointId: string) => {
    setSelectedJoint(jointId);
  };

  const handleStickClick = (stickId: string) => {
    setSelectedStick(stickId);
  };

  const handlePartUpdate = (partId: string, updates: Partial<Part>) => {
    if (currentDramaId && currentCharacterId) {
      updatePart(currentDramaId, currentCharacterId, partId, updates);
    }
  };

  const handleJointUpdate = (jointId: string, updates: Partial<Joint>) => {
    if (currentDramaId && currentCharacterId) {
      updateJoint(currentDramaId, currentCharacterId, jointId, updates);
    }
  };

  const handleStickUpdate = (stickId: string, updates: Partial<Stick>) => {
    if (currentDramaId && currentCharacterId) {
      updateStick(currentDramaId, currentCharacterId, stickId, updates);
    }
  };

  const handleImportSVG = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      try {
        const text = await file.text();
        const { svgPath } = parseSVG(text);
        setPendingImport({
          svgPath,
          fileName: file.name,
        });
        setShowImportDialog(true);
      } catch (error) {
        console.error('解析 SVG 失败:', error);
        alert('SVG 文件解析失败，请检查文件格式');
      }
    }
    e.target.value = '';
  };

  const handleImportSubmit = (data: {
    name: string;
    type: PartType;
    color: string;
    zIndex: number;
  }) => {
    if (!pendingImport || !currentDramaId || !currentCharacterId) return;

    const newPart: Part = {
      id: generateId(),
      name: data.name,
      type: data.type,
      svgPath: pendingImport.svgPath,
      transform: {
        x: 0,
        y: 0,
        rotation: 0,
        scale: 1,
      },
      zIndex: data.zIndex,
      color: data.color,
    };

    addPart(currentDramaId, currentCharacterId, newPart);
    setSelectedPart(newPart.id);
    setPendingImport(null);
  };

  const getDefaultZIndex = (): number => {
    if (!currentCharacter?.parts || currentCharacter.parts.length === 0) {
      return 1;
    }
    const maxZ = Math.max(...currentCharacter.parts.map(p => p.zIndex));
    return maxZ + 1;
  };

  const handleAddJoint = () => {
    alert('添加关节（模拟功能）');
  };

  const handleResetView = () => {
    setZoom(1);
    setPanOffset({ x: 0, y: 0 });
  };

  const handleZoomIn = () => {
    setZoom(zoom * 1.2);
  };

  const handleZoomOut = () => {
    setZoom(zoom / 1.2);
  };

  const sortedParts = currentCharacter?.parts
    ? [...currentCharacter.parts].sort((a, b) => a.zIndex - b.zIndex)
    : [];

  return (
    <div className="flex h-full bg-parchment-50">
      {/* 左侧面板 - 部件列表 */}
      <div className="w-64 flex flex-col bg-gradient-to-b from-ink-700 to-ink-800 border-r border-ink-600">
        <div className="h-14 flex items-center justify-between px-4 border-b border-ink-600">
          <h2 className="font-display text-base text-parchment-100 font-semibold">部件图层</h2>
          <div className="flex items-center gap-1">
            <button
              onClick={handleImportSVG}
              className="p-1.5 rounded-lg hover:bg-ink-600 text-parchment-300 hover:text-parchment-100 transition-colors"
              title="导入SVG"
            >
              <Upload className="w-4 h-4" />
            </button>
            <button
              onClick={handleAddJoint}
              className="p-1.5 rounded-lg hover:bg-ink-600 text-parchment-300 hover:text-parchment-100 transition-colors"
              title="添加关节"
            >
              <Plus className="w-4 h-4" />
            </button>
          </div>
        </div>
        <input
          ref={fileInputRef}
          type="file"
          accept=".svg"
          onChange={handleFileChange}
          className="hidden"
        />

        <div className="flex-1 overflow-y-auto py-2">
          {/* 部件列表 */}
          <div className="px-2 mb-2">
            <button
              onClick={() => setPartsExpanded(!partsExpanded)}
              className="w-full flex items-center gap-2 px-2 py-1.5 text-parchment-300 hover:text-parchment-100 transition-colors"
            >
              {partsExpanded ? (
                <ChevronDown className="w-4 h-4" />
              ) : (
                <ChevronRight className="w-4 h-4" />
              )}
              <Layers className="w-4 h-4 text-crimson-400" />
              <span className="text-sm font-medium">部件</span>
              <span className="ml-auto text-xs text-parchment-500">
                {sortedParts.length}
              </span>
            </button>
            {partsExpanded && (
              <div className="mt-1 space-y-0.5">
                {sortedParts.map((part) => (
                  <button
                    key={part.id}
                    onClick={() => handlePartClick(part.id)}
                    className={cn(
                      'w-full flex items-center gap-2 px-3 py-2 rounded-lg text-left transition-all duration-150',
                      selectedPartId === part.id
                        ? 'bg-crimson-500/20 text-crimson-300'
                        : 'text-parchment-300 hover:bg-ink-600/50 hover:text-parchment-100'
                    )}
                  >
                    <div
                      className="w-3 h-3 rounded-sm border border-ink-500"
                      style={{ backgroundColor: part.color }}
                    />
                    <span className="text-sm truncate flex-1">{part.name}</span>
                    <span className="text-xs text-parchment-500">{part.zIndex}</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* 关节列表 */}
          <div className="px-2 mb-2">
            <button
              onClick={() => setJointsExpanded(!jointsExpanded)}
              className="w-full flex items-center gap-2 px-2 py-1.5 text-parchment-300 hover:text-parchment-100 transition-colors"
            >
              {jointsExpanded ? (
                <ChevronDown className="w-4 h-4" />
              ) : (
                <ChevronRight className="w-4 h-4" />
              )}
              <Settings className="w-4 h-4 text-shadow-400" />
              <span className="text-sm font-medium">关节</span>
              <span className="ml-auto text-xs text-parchment-500">
                {currentCharacter?.joints.length || 0}
              </span>
            </button>
            {jointsExpanded && (
              <div className="mt-1 space-y-0.5">
                {currentCharacter?.joints.map((joint) => (
                  <button
                    key={joint.id}
                    onClick={() => handleJointClick(joint.id)}
                    className={cn(
                      'w-full flex items-center gap-2 px-3 py-2 rounded-lg text-left transition-all duration-150',
                      selectedJointId === joint.id
                        ? 'bg-shadow-500/20 text-shadow-300'
                        : 'text-parchment-300 hover:bg-ink-600/50 hover:text-parchment-100'
                    )}
                  >
                    <div className="w-3 h-3 rounded-full bg-crimson-400 border border-ink-500" />
                    <span className="text-sm truncate flex-1">{joint.name}</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* 签杆列表 */}
          <div className="px-2">
            <button
              onClick={() => setSticksExpanded(!sticksExpanded)}
              className="w-full flex items-center gap-2 px-2 py-1.5 text-parchment-300 hover:text-parchment-100 transition-colors"
            >
              {sticksExpanded ? (
                <ChevronDown className="w-4 h-4" />
              ) : (
                <ChevronRight className="w-4 h-4" />
              )}
              <Move className="w-4 h-4 text-parchment-400" />
              <span className="text-sm font-medium">签杆</span>
              <span className="ml-auto text-xs text-parchment-500">
                {currentCharacter?.sticks.length || 0}
              </span>
            </button>
            {sticksExpanded && (
              <div className="mt-1 space-y-0.5">
                {currentCharacter?.sticks.map((stick) => (
                  <button
                    key={stick.id}
                    onClick={() => handleStickClick(stick.id)}
                    className={cn(
                      'w-full flex items-center gap-2 px-3 py-2 rounded-lg text-left transition-all duration-150',
                      selectedStickId === stick.id
                        ? 'bg-shadow-500/20 text-shadow-300'
                        : 'text-parchment-300 hover:bg-ink-600/50 hover:text-parchment-100'
                    )}
                  >
                    <div
                      className="w-1 h-4 rounded-sm"
                      style={{ backgroundColor: stick.color }}
                    />
                    <span className="text-sm truncate flex-1">{stick.name}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* 底部工具栏 */}
        <div className="p-3 border-t border-ink-600 space-y-2">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowJoints(!showJoints)}
              className={cn(
                'flex-1 flex items-center justify-center gap-1.5 px-2 py-1.5 rounded-lg text-xs transition-colors',
                showJoints
                  ? 'bg-ink-600 text-parchment-100'
                  : 'bg-ink-700 text-parchment-400 hover:bg-ink-600 hover:text-parchment-300'
              )}
            >
              {showJoints ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
              关节
            </button>
            <button
              onClick={() => setShowSticks(!showSticks)}
              className={cn(
                'flex-1 flex items-center justify-center gap-1.5 px-2 py-1.5 rounded-lg text-xs transition-colors',
                showSticks
                  ? 'bg-ink-600 text-parchment-100'
                  : 'bg-ink-700 text-parchment-400 hover:bg-ink-600 hover:text-parchment-300'
              )}
            >
              {showSticks ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
              签杆
            </button>
          </div>
        </div>
      </div>

      {/* 中间画布区域 */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* 顶部工具栏 */}
        <div className="h-14 flex items-center justify-between px-4 bg-gradient-to-r from-ink-700 via-ink-750 to-ink-700 border-b border-ink-600">
          <div className="flex items-center gap-3">
            <label className="text-xs text-parchment-400">角色：</label>
            <select
              value={currentCharacterId || ''}
              onChange={(e) => setCurrentCharacter(e.target.value || null)}
              className="bg-ink-600 text-parchment-100 text-sm px-3 py-1.5 rounded-lg border border-ink-500 focus:outline-none focus:ring-2 focus:ring-crimson-500/50 cursor-pointer"
            >
              {currentDrama?.characters.map((char) => (
                <option key={char.id} value={char.id}>
                  {char.name} ({char.role})
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleZoomOut}
              className="p-1.5 rounded-lg bg-ink-600 text-parchment-300 hover:bg-ink-500 hover:text-parchment-100 transition-colors"
              title="缩小"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="11" cy="11" r="8" />
                <line x1="21" y1="21" x2="16.65" y2="16.65" />
                <line x1="8" y1="11" x2="14" y2="11" />
              </svg>
            </button>
            <span className="text-xs text-parchment-400 w-14 text-center">
              {Math.round(zoom * 100)}%
            </span>
            <button
              onClick={handleZoomIn}
              className="p-1.5 rounded-lg bg-ink-600 text-parchment-300 hover:bg-ink-500 hover:text-parchment-100 transition-colors"
              title="放大"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="11" cy="11" r="8" />
                <line x1="21" y1="21" x2="16.65" y2="16.65" />
                <line x1="11" y1="8" x2="11" y2="14" />
                <line x1="8" y1="11" x2="14" y2="11" />
              </svg>
            </button>
            <button
              onClick={handleResetView}
              className="p-1.5 rounded-lg bg-ink-600 text-parchment-300 hover:bg-ink-500 hover:text-parchment-100 transition-colors ml-1"
              title="重置视图"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* 画布 */}
        <div className="flex-1 relative bg-parchment-100">
          {currentCharacter ? (
            <ShadowPuppetCanvas
              character={currentCharacter}
              showJoints={showJoints}
              showSticks={showSticks}
              showConstraints={false}
              showLightEffect={true}
              interactive={true}
              onPartClick={handlePartClick}
              onJointClick={handleJointClick}
              onStickClick={handleStickClick}
              className="w-full h-full"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <div className="text-center">
                <Layers className="w-16 h-16 text-parchment-300 mx-auto mb-4" />
                <p className="text-parchment-500">请先选择一个角色</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* 右侧属性面板 */}
      <div className="w-72 flex flex-col bg-gradient-to-b from-ink-700 to-ink-800 border-l border-ink-600">
        <div className="h-14 flex items-center px-4 border-b border-ink-600">
          <h2 className="font-display text-base text-parchment-100 font-semibold">属性面板</h2>
        </div>

        <div className="flex-1 overflow-y-auto p-4">
          {selectedPart && (
            <div className="space-y-4">
              <div className="flex items-center gap-2 pb-3 border-b border-ink-600">
                <div
                  className="w-4 h-4 rounded-sm border border-ink-500"
                  style={{ backgroundColor: selectedPart.color }}
                />
                <h3 className="font-medium text-parchment-100">部件属性</h3>
              </div>

              <div className="space-y-3">
                <div>
                  <label className="block text-xs text-parchment-400 mb-1">名称</label>
                  <input
                    type="text"
                    value={selectedPart.name}
                    onChange={(e) => handlePartUpdate(selectedPart.id, { name: e.target.value })}
                    className="w-full bg-ink-600 text-parchment-100 text-sm px-3 py-2 rounded-lg border border-ink-500 focus:outline-none focus:ring-2 focus:ring-crimson-500/50"
                  />
                </div>

                <div>
                  <label className="block text-xs text-parchment-400 mb-1">类型</label>
                  <input
                    type="text"
                    value={selectedPart.type}
                    disabled
                    className="w-full bg-ink-800 text-parchment-500 text-sm px-3 py-2 rounded-lg border border-ink-600 cursor-not-allowed"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs text-parchment-400 mb-1">X 位置</label>
                    <input
                      type="number"
                      value={selectedPart.transform.x}
                      onChange={(e) =>
                        handlePartUpdate(selectedPart.id, {
                          transform: { ...selectedPart.transform, x: Number(e.target.value) },
                        })
                      }
                      className="w-full bg-ink-600 text-parchment-100 text-sm px-3 py-2 rounded-lg border border-ink-500 focus:outline-none focus:ring-2 focus:ring-crimson-500/50"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-parchment-400 mb-1">Y 位置</label>
                    <input
                      type="number"
                      value={selectedPart.transform.y}
                      onChange={(e) =>
                        handlePartUpdate(selectedPart.id, {
                          transform: { ...selectedPart.transform, y: Number(e.target.value) },
                        })
                      }
                      className="w-full bg-ink-600 text-parchment-100 text-sm px-3 py-2 rounded-lg border border-ink-500 focus:outline-none focus:ring-2 focus:ring-crimson-500/50"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs text-parchment-400 mb-1">旋转 (°)</label>
                    <input
                      type="number"
                      value={selectedPart.transform.rotation}
                      onChange={(e) =>
                        handlePartUpdate(selectedPart.id, {
                          transform: { ...selectedPart.transform, rotation: Number(e.target.value) },
                        })
                      }
                      className="w-full bg-ink-600 text-parchment-100 text-sm px-3 py-2 rounded-lg border border-ink-500 focus:outline-none focus:ring-2 focus:ring-crimson-500/50"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-parchment-400 mb-1">缩放</label>
                    <input
                      type="number"
                      step="0.1"
                      value={selectedPart.transform.scale}
                      onChange={(e) =>
                        handlePartUpdate(selectedPart.id, {
                          transform: { ...selectedPart.transform, scale: Number(e.target.value) },
                        })
                      }
                      className="w-full bg-ink-600 text-parchment-100 text-sm px-3 py-2 rounded-lg border border-ink-500 focus:outline-none focus:ring-2 focus:ring-crimson-500/50"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs text-parchment-400 mb-1">Z 层级</label>
                    <input
                      type="number"
                      value={selectedPart.zIndex}
                      onChange={(e) =>
                        handlePartUpdate(selectedPart.id, { zIndex: Number(e.target.value) })
                      }
                      className="w-full bg-ink-600 text-parchment-100 text-sm px-3 py-2 rounded-lg border border-ink-500 focus:outline-none focus:ring-2 focus:ring-crimson-500/50"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-parchment-400 mb-1">颜色</label>
                    <div className="flex items-center gap-2">
                      <input
                        type="color"
                        value={selectedPart.color}
                        onChange={(e) => handlePartUpdate(selectedPart.id, { color: e.target.value })}
                        className="w-10 h-9 rounded-lg border border-ink-500 cursor-pointer bg-transparent"
                      />
                      <input
                        type="text"
                        value={selectedPart.color}
                        onChange={(e) => handlePartUpdate(selectedPart.id, { color: e.target.value })}
                        className="flex-1 bg-ink-600 text-parchment-100 text-xs px-2 py-2 rounded-lg border border-ink-500 focus:outline-none focus:ring-2 focus:ring-crimson-500/50"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {selectedJoint && (
            <div className="space-y-4">
              <div className="flex items-center gap-2 pb-3 border-b border-ink-600">
                <div className="w-4 h-4 rounded-full bg-crimson-400 border border-ink-500" />
                <h3 className="font-medium text-parchment-100">关节属性</h3>
              </div>

              <div className="space-y-3">
                <div>
                  <label className="block text-xs text-parchment-400 mb-1">名称</label>
                  <input
                    type="text"
                    value={selectedJoint.name}
                    onChange={(e) => handleJointUpdate(selectedJoint.id, { name: e.target.value })}
                    className="w-full bg-ink-600 text-parchment-100 text-sm px-3 py-2 rounded-lg border border-ink-500 focus:outline-none focus:ring-2 focus:ring-crimson-500/50"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs text-parchment-400 mb-1">X 位置</label>
                    <input
                      type="number"
                      value={selectedJoint.position.x}
                      onChange={(e) =>
                        handleJointUpdate(selectedJoint.id, {
                          position: { ...selectedJoint.position, x: Number(e.target.value) },
                        })
                      }
                      className="w-full bg-ink-600 text-parchment-100 text-sm px-3 py-2 rounded-lg border border-ink-500 focus:outline-none focus:ring-2 focus:ring-crimson-500/50"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-parchment-400 mb-1">Y 位置</label>
                    <input
                      type="number"
                      value={selectedJoint.position.y}
                      onChange={(e) =>
                        handleJointUpdate(selectedJoint.id, {
                          position: { ...selectedJoint.position, y: Number(e.target.value) },
                        })
                      }
                      className="w-full bg-ink-600 text-parchment-100 text-sm px-3 py-2 rounded-lg border border-ink-500 focus:outline-none focus:ring-2 focus:ring-crimson-500/50"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs text-parchment-400 mb-1">当前角度 (°)</label>
                  <input
                    type="number"
                    value={selectedJoint.currentAngle}
                    onChange={(e) =>
                      handleJointUpdate(selectedJoint.id, { currentAngle: Number(e.target.value) })
                    }
                    className="w-full bg-ink-600 text-parchment-100 text-sm px-3 py-2 rounded-lg border border-ink-500 focus:outline-none focus:ring-2 focus:ring-crimson-500/50"
                  />
                </div>

                <div className="p-3 bg-ink-800/50 rounded-lg">
                  <p className="text-xs text-parchment-400 mb-2 font-medium">约束设置</p>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-parchment-300">锁定</span>
                      <button
                        onClick={() =>
                          handleJointUpdate(selectedJoint.id, {
                            constraints: {
                              ...selectedJoint.constraints,
                              locked: !selectedJoint.constraints.locked,
                            },
                          })
                        }
                        className={cn(
                          'w-10 h-5 rounded-full transition-colors relative',
                          selectedJoint.constraints.locked ? 'bg-crimson-500' : 'bg-ink-500'
                        )}
                      >
                        <div
                          className={cn(
                            'absolute top-0.5 w-4 h-4 rounded-full bg-white transition-transform',
                            selectedJoint.constraints.locked ? 'left-5' : 'left-0.5'
                          )}
                        />
                      </button>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="block text-xs text-parchment-500 mb-1">最小角度</label>
                        <input
                          type="number"
                          value={selectedJoint.constraints.minAngle}
                          onChange={(e) =>
                            handleJointUpdate(selectedJoint.id, {
                              constraints: {
                                ...selectedJoint.constraints,
                                minAngle: Number(e.target.value),
                              },
                            })
                          }
                          className="w-full bg-ink-700 text-parchment-200 text-xs px-2 py-1.5 rounded border border-ink-600 focus:outline-none focus:ring-1 focus:ring-crimson-500/50"
                        />
                      </div>
                      <div>
                        <label className="block text-xs text-parchment-500 mb-1">最大角度</label>
                        <input
                          type="number"
                          value={selectedJoint.constraints.maxAngle}
                          onChange={(e) =>
                            handleJointUpdate(selectedJoint.id, {
                              constraints: {
                                ...selectedJoint.constraints,
                                maxAngle: Number(e.target.value),
                              },
                            })
                          }
                          className="w-full bg-ink-700 text-parchment-200 text-xs px-2 py-1.5 rounded border border-ink-600 focus:outline-none focus:ring-1 focus:ring-crimson-500/50"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {selectedStick && (
            <div className="space-y-4">
              <div className="flex items-center gap-2 pb-3 border-b border-ink-600">
                <div
                  className="w-1.5 h-5 rounded-sm"
                  style={{ backgroundColor: selectedStick.color }}
                />
                <h3 className="font-medium text-parchment-100">签杆属性</h3>
              </div>

              <div className="space-y-3">
                <div>
                  <label className="block text-xs text-parchment-400 mb-1">名称</label>
                  <input
                    type="text"
                    value={selectedStick.name}
                    onChange={(e) => handleStickUpdate(selectedStick.id, { name: e.target.value })}
                    className="w-full bg-ink-600 text-parchment-100 text-sm px-3 py-2 rounded-lg border border-ink-500 focus:outline-none focus:ring-2 focus:ring-crimson-500/50"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs text-parchment-400 mb-1">控制点 X</label>
                    <input
                      type="number"
                      value={selectedStick.controlPoint.x}
                      onChange={(e) =>
                        handleStickUpdate(selectedStick.id, {
                          controlPoint: {
                            ...selectedStick.controlPoint,
                            x: Number(e.target.value),
                          },
                        })
                      }
                      className="w-full bg-ink-600 text-parchment-100 text-sm px-3 py-2 rounded-lg border border-ink-500 focus:outline-none focus:ring-2 focus:ring-crimson-500/50"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-parchment-400 mb-1">控制点 Y</label>
                    <input
                      type="number"
                      value={selectedStick.controlPoint.y}
                      onChange={(e) =>
                        handleStickUpdate(selectedStick.id, {
                          controlPoint: {
                            ...selectedStick.controlPoint,
                            y: Number(e.target.value),
                          },
                        })
                      }
                      className="w-full bg-ink-600 text-parchment-100 text-sm px-3 py-2 rounded-lg border border-ink-500 focus:outline-none focus:ring-2 focus:ring-crimson-500/50"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs text-parchment-400 mb-1">长度</label>
                    <input
                      type="number"
                      value={selectedStick.length}
                      onChange={(e) =>
                        handleStickUpdate(selectedStick.id, { length: Number(e.target.value) })
                      }
                      className="w-full bg-ink-600 text-parchment-100 text-sm px-3 py-2 rounded-lg border border-ink-500 focus:outline-none focus:ring-2 focus:ring-crimson-500/50"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-parchment-400 mb-1">角度 (°)</label>
                    <input
                      type="number"
                      value={selectedStick.angle}
                      onChange={(e) =>
                        handleStickUpdate(selectedStick.id, { angle: Number(e.target.value) })
                      }
                      className="w-full bg-ink-600 text-parchment-100 text-sm px-3 py-2 rounded-lg border border-ink-500 focus:outline-none focus:ring-2 focus:ring-crimson-500/50"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs text-parchment-400 mb-1">Z 层级</label>
                    <input
                      type="number"
                      value={selectedStick.zIndex}
                      onChange={(e) =>
                        handleStickUpdate(selectedStick.id, { zIndex: Number(e.target.value) })
                      }
                      className="w-full bg-ink-600 text-parchment-100 text-sm px-3 py-2 rounded-lg border border-ink-500 focus:outline-none focus:ring-2 focus:ring-crimson-500/50"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-parchment-400 mb-1">颜色</label>
                    <div className="flex items-center gap-2">
                      <input
                        type="color"
                        value={selectedStick.color}
                        onChange={(e) => handleStickUpdate(selectedStick.id, { color: e.target.value })}
                        className="w-10 h-9 rounded-lg border border-ink-500 cursor-pointer bg-transparent"
                      />
                      <input
                        type="text"
                        value={selectedStick.color}
                        onChange={(e) => handleStickUpdate(selectedStick.id, { color: e.target.value })}
                        className="flex-1 bg-ink-600 text-parchment-100 text-xs px-2 py-2 rounded-lg border border-ink-500 focus:outline-none focus:ring-2 focus:ring-crimson-500/50"
                      />
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-xs text-parchment-400 mb-1">目标关节</label>
                  <select
                    value={selectedStick.targetJointId}
                    onChange={(e) =>
                      handleStickUpdate(selectedStick.id, { targetJointId: e.target.value })
                    }
                    className="w-full bg-ink-600 text-parchment-100 text-sm px-3 py-2 rounded-lg border border-ink-500 focus:outline-none focus:ring-2 focus:ring-crimson-500/50 cursor-pointer"
                  >
                    {currentCharacter?.joints.map((joint) => (
                      <option key={joint.id} value={joint.id}>
                        {joint.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          )}

          {!selectedPart && !selectedJoint && !selectedStick && (
            <div className="flex flex-col items-center justify-center h-full text-center py-12">
              <Settings className="w-12 h-12 text-parchment-600 mb-3" />
              <p className="text-parchment-500 text-sm">选择部件、关节或签杆</p>
              <p className="text-parchment-600 text-xs mt-1">以编辑其属性</p>
            </div>
          )}
        </div>
      </div>

      {pendingImport && (
        <ImportPartDialog
          isOpen={showImportDialog}
          onClose={() => {
            setShowImportDialog(false);
            setPendingImport(null);
          }}
          onSubmit={handleImportSubmit}
          defaultName={extractFileNameWithoutExtension(pendingImport.fileName)}
          defaultZIndex={getDefaultZIndex()}
          defaultColor={getRandomShadowColor()}
          svgPath={pendingImport.svgPath}
        />
      )}
    </div>
  );
};

export default PartBinding;
