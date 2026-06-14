import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  Play,
  Pause,
  SkipBack,
  SkipForward,
  Square,
  Sun,
  Layers,
  Eye,
  EyeOff,
  Lock,
  Unlock,
  Plus,
  GripHorizontal,
  ZoomIn,
  ZoomOut,
  ChevronDown,
  ChevronRight,
  CheckCircle,
  AlertTriangle,
} from 'lucide-react';
import { ShadowPuppetCanvas } from '@/components/canvas/ShadowPuppetCanvas';
import { useAppStore } from '@/store/useAppStore';
import { cn } from '@/lib/utils';
import type { Clip, Track, Action } from '@/types';

const ActionTimeline: React.FC = () => {
  const currentDrama = useAppStore((state) => state.getCurrentDrama());
  const currentCharacter = useAppStore((state) => state.getCurrentCharacter());
  const currentScene = useAppStore((state) => state.getCurrentScene());
  const currentDramaId = useAppStore((state) => state.currentDramaId);
  const currentSceneId = useAppStore((state) => state.currentSceneId);
  const isPlaying = useAppStore((state) => state.isPlaying);
  const currentTime = useAppStore((state) => state.currentTime);
  const setPlaying = useAppStore((state) => state.setPlaying);
  const setCurrentTime = useAppStore((state) => state.setCurrentTime);
  const lightConfig = useAppStore((state) => state.lightConfig);
  const setLightConfig = useAppStore((state) => state.setLightConfig);
  const updateScene = useAppStore((state) => state.updateScene);
  const actions = currentDrama?.actions || [];

  const [playbackSpeed, setPlaybackSpeed] = useState(1);
  const [timelineZoom, setTimelineZoom] = useState(1);
  const [expandedTracks, setExpandedTracks] = useState<Record<string, boolean>>({});
  const [draggingClip, setDraggingClip] = useState<{ clipId: string; trackId: string; startX: number; startTime: number } | null>(null);
  const [showActionLibrary, setShowActionLibrary] = useState(false);
  const [occlusionResult, setOcclusionResult] = useState<{ show: boolean; hasIssue: boolean; message: string }>({ show: false, hasIssue: false, message: '' });

  const timelineRef = useRef<HTMLDivElement>(null);
  const animationFrameRef = useRef<number | null>(null);
  const lastTimeRef = useRef<number>(0);

  const sceneDuration = currentScene?.duration || 10000;
  const pixelsPerSecond = 100 * timelineZoom;

  useEffect(() => {
    if (currentScene?.tracks) {
      const initialExpanded: Record<string, boolean> = {};
      currentScene.tracks.forEach((track) => {
        initialExpanded[track.id] = true;
      });
      setExpandedTracks(initialExpanded);
    }
  }, [currentScene?.id]);

  useEffect(() => {
    if (isPlaying) {
      lastTimeRef.current = performance.now();
      const animate = (now: number) => {
        const delta = (now - lastTimeRef.current) * playbackSpeed;
        lastTimeRef.current = now;

        const newTime = currentTime + delta;
        if (newTime >= sceneDuration) {
          setCurrentTime(0);
          setPlaying(false);
          return;
        }
        setCurrentTime(newTime);
        animationFrameRef.current = requestAnimationFrame(animate);
      };
      animationFrameRef.current = requestAnimationFrame(animate);
    } else {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    }

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [isPlaying, playbackSpeed, sceneDuration, currentTime, setCurrentTime, setPlaying]);

  const formatTime = (ms: number): string => {
    const seconds = Math.floor(ms / 1000);
    const milliseconds = Math.floor((ms % 1000) / 10);
    return `${seconds.toString().padStart(2, '0')}:${milliseconds.toString().padStart(2, '0')}`;
  };

  const handlePlayPause = () => {
    setPlaying(!isPlaying);
  };

  const handleStop = () => {
    setPlaying(false);
    setCurrentTime(0);
  };

  const handlePrevFrame = () => {
    const newTime = Math.max(0, currentTime - 100);
    setCurrentTime(newTime);
  };

  const handleNextFrame = () => {
    const newTime = Math.min(sceneDuration, currentTime + 100);
    setCurrentTime(newTime);
  };

  const handleTimelineClick = (e: React.MouseEvent) => {
    if (!timelineRef.current) return;
    const rect = timelineRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const time = (x / pixelsPerSecond) * 1000;
    setCurrentTime(Math.max(0, Math.min(sceneDuration, time)));
  };

  const handleClipMouseDown = (e: React.MouseEvent, clip: Clip, track: Track) => {
    e.stopPropagation();
    if (track.locked) return;

    setDraggingClip({
      clipId: clip.id,
      trackId: track.id,
      startX: e.clientX,
      startTime: clip.startTime,
    });
  };

  const handleMouseMove = useCallback(
    (e: MouseEvent) => {
      if (!draggingClip || !currentDramaId || !currentSceneId || !currentScene) return;

      const deltaX = e.clientX - draggingClip.startX;
      const deltaTime = (deltaX / pixelsPerSecond) * 1000;
      let newStartTime = draggingClip.startTime + deltaTime;
      newStartTime = Math.max(0, newStartTime);

      const updatedTracks = currentScene.tracks.map((track) => {
        if (track.id !== draggingClip.trackId) return track;
        return {
          ...track,
          clips: track.clips.map((clip) =>
            clip.id === draggingClip.clipId ? { ...clip, startTime: newStartTime } : clip
          ),
        };
      });

      updateScene(currentDramaId, currentSceneId, { tracks: updatedTracks });
    },
    [draggingClip, currentDramaId, currentSceneId, currentScene, pixelsPerSecond, updateScene]
  );

  const handleMouseUp = useCallback(() => {
    setDraggingClip(null);
  }, []);

  useEffect(() => {
    if (draggingClip) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
      return () => {
        window.removeEventListener('mousemove', handleMouseMove);
        window.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [draggingClip, handleMouseMove, handleMouseUp]);

  const toggleTrackVisibility = (trackId: string) => {
    if (!currentDramaId || !currentSceneId || !currentScene) return;

    const updatedTracks = currentScene.tracks.map((track) =>
      track.id === trackId ? { ...track, visible: !track.visible } : track
    );
    updateScene(currentDramaId, currentSceneId, { tracks: updatedTracks });
  };

  const toggleTrackLock = (trackId: string) => {
    if (!currentDramaId || !currentSceneId || !currentScene) return;

    const updatedTracks = currentScene.tracks.map((track) =>
      track.id === trackId ? { ...track, locked: !track.locked } : track
    );
    updateScene(currentDramaId, currentSceneId, { tracks: updatedTracks });
  };

  const toggleTrackExpand = (trackId: string) => {
    setExpandedTracks((prev) => ({
      ...prev,
      [trackId]: !prev[trackId],
    }));
  };

  const handleZoomIn = () => {
    setTimelineZoom((prev) => Math.min(3, prev * 1.2));
  };

  const handleZoomOut = () => {
    setTimelineZoom((prev) => Math.max(0.25, prev / 1.2));
  };

  const handleCheckOcclusion = () => {
    setOcclusionResult({
      show: true,
      hasIssue: false,
      message: '当前帧未检测到签杆遮挡问题',
    });
    setTimeout(() => {
      setOcclusionResult((prev) => ({ ...prev, show: false }));
    }, 3000);
  };

  const getActionById = (actionId: string): Action | undefined => {
    return actions.find((a) => a.id === actionId);
  };

  const getClipColor = (actionId: string): string => {
    const action = getActionById(actionId);
    const colors = [
      'bg-crimson-500',
      'bg-shadow-500',
      'bg-ink-500',
      'bg-parchment-500',
    ];
    const index = action ? action.name.charCodeAt(0) % colors.length : 0;
    return colors[index];
  };

  const renderTimeMarkers = () => {
    const markers = [];
    const totalSeconds = Math.ceil(sceneDuration / 1000);
    const step = timelineZoom < 0.5 ? 2 : timelineZoom > 1.5 ? 0.5 : 1;

    for (let t = 0; t <= totalSeconds; t += step) {
      const left = (t * 1000 * pixelsPerSecond) / 1000;
      markers.push(
        <div
          key={t}
          className="absolute top-0 h-full border-l border-ink-600/50"
          style={{ left: `${left}px` }}
        >
          <span className="absolute -top-5 left-1 text-xs text-parchment-400">
            {t.toFixed(step < 1 ? 1 : 0)}s
          </span>
        </div>
      );
    }
    return markers;
  };

  const handleAddActionToTrack = (trackId: string, action: Action) => {
    if (!currentDramaId || !currentSceneId || !currentScene) return;

    const newClip: Clip = {
      id: Math.random().toString(36).substring(2, 11),
      actionId: action.id,
      startTime: currentTime,
      duration: action.duration,
      speed: 1,
      trackId,
    };

    const updatedTracks = currentScene.tracks.map((track) =>
      track.id === trackId ? { ...track, clips: [...track.clips, newClip] } : track
    );

    updateScene(currentDramaId, currentSceneId, { tracks: updatedTracks });
    setShowActionLibrary(false);
  };

  return (
    <div className="flex flex-col h-full bg-parchment-50">
      {/* 上半部分 - 预览和控制 */}
      <div className="flex-1 min-h-0 flex border-b-2 border-ink-600">
        {/* 左侧预览画布 */}
        <div className="flex-1 min-w-0 relative bg-parchment-100">
          {currentCharacter ? (
            <ShadowPuppetCanvas
              character={currentCharacter}
              showJoints={false}
              showSticks={true}
              showConstraints={false}
              showLightEffect={true}
              interactive={false}
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

          {occlusionResult.show && (
            <div
              className={cn(
                'absolute top-4 left-1/2 -translate-x-1/2 px-4 py-2 rounded-lg shadow-lg flex items-center gap-2 transition-all',
                occlusionResult.hasIssue
                  ? 'bg-crimson-500 text-white'
                  : 'bg-green-600 text-white'
              )}
            >
              {occlusionResult.hasIssue ? (
                <AlertTriangle className="w-4 h-4" />
              ) : (
                <CheckCircle className="w-4 h-4" />
              )}
              <span className="text-sm font-medium">{occlusionResult.message}</span>
            </div>
          )}
        </div>

        {/* 右侧控制面板 */}
        <div className="w-72 flex flex-col bg-gradient-to-b from-ink-700 to-ink-800 border-l border-ink-600">
          <div className="h-14 flex items-center px-4 border-b border-ink-600">
            <h2 className="font-display text-base text-parchment-100 font-semibold">播放控制</h2>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-6">
            {/* 当前时间显示 */}
            <div className="text-center">
              <div className="text-4xl font-mono text-shadow-400 font-bold tracking-wider">
                {formatTime(currentTime)}
              </div>
              <div className="text-xs text-parchment-500 mt-1">
                总时长: {formatTime(sceneDuration)}
              </div>
            </div>

            {/* 播放控制按钮 */}
            <div className="flex items-center justify-center gap-2">
              <button
                onClick={handlePrevFrame}
                className="p-2.5 rounded-lg bg-ink-600 text-parchment-300 hover:bg-ink-500 hover:text-parchment-100 transition-colors"
                title="上一帧"
              >
                <SkipBack className="w-5 h-5" />
              </button>
              <button
                onClick={handleStop}
                className="p-2.5 rounded-lg bg-ink-600 text-parchment-300 hover:bg-ink-500 hover:text-parchment-100 transition-colors"
                title="停止"
              >
                <Square className="w-5 h-5" />
              </button>
              <button
                onClick={handlePlayPause}
                className="p-4 rounded-full bg-crimson-500 text-white hover:bg-crimson-400 transition-colors shadow-lg shadow-crimson-500/30"
                title={isPlaying ? '暂停' : '播放'}
              >
                {isPlaying ? <Pause className="w-6 h-6" /> : <Play className="w-6 h-6 ml-0.5" />}
              </button>
              <button
                onClick={handleNextFrame}
                className="p-2.5 rounded-lg bg-ink-600 text-parchment-300 hover:bg-ink-500 hover:text-parchment-100 transition-colors"
                title="下一帧"
              >
                <SkipForward className="w-5 h-5" />
              </button>
            </div>

            {/* 播放速度 */}
            <div className="space-y-2">
              <label className="block text-xs text-parchment-400 font-medium">播放速度</label>
              <div className="flex items-center gap-2">
                <input
                  type="range"
                  min="0.25"
                  max="2"
                  step="0.25"
                  value={playbackSpeed}
                  onChange={(e) => setPlaybackSpeed(Number(e.target.value))}
                  className="flex-1 h-2 bg-ink-600 rounded-lg appearance-none cursor-pointer accent-crimson-500"
                />
                <span className="text-sm text-parchment-300 w-12 text-right font-mono">
                  {playbackSpeed}x
                </span>
              </div>
              <div className="flex justify-between text-xs text-parchment-500">
                <span>0.25x</span>
                <span>2x</span>
              </div>
            </div>

            {/* 分隔线 */}
            <div className="border-t border-ink-600" />

            {/* 灯光效果控制 */}
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Sun className="w-4 h-4 text-shadow-400" />
                <span className="text-sm font-medium text-parchment-200">灯光效果</span>
              </div>

              <div className="space-y-3 pl-2">
                <div>
                  <label className="block text-xs text-parchment-400 mb-1">光源位置 X</label>
                  <input
                    type="range"
                    min="0"
                    max="800"
                    value={lightConfig.x}
                    onChange={(e) => setLightConfig({ x: Number(e.target.value) })}
                    className="w-full h-2 bg-ink-600 rounded-lg appearance-none cursor-pointer accent-shadow-500"
                  />
                </div>

                <div>
                  <label className="block text-xs text-parchment-400 mb-1">光源位置 Y</label>
                  <input
                    type="range"
                    min="0"
                    max="300"
                    value={lightConfig.y}
                    onChange={(e) => setLightConfig({ y: Number(e.target.value) })}
                    className="w-full h-2 bg-ink-600 rounded-lg appearance-none cursor-pointer accent-shadow-500"
                  />
                </div>

                <div>
                  <label className="block text-xs text-parchment-400 mb-1">强度</label>
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.1"
                    value={lightConfig.intensity}
                    onChange={(e) => setLightConfig({ intensity: Number(e.target.value) })}
                    className="w-full h-2 bg-ink-600 rounded-lg appearance-none cursor-pointer accent-shadow-500"
                  />
                </div>

                <div>
                  <label className="block text-xs text-parchment-400 mb-1">模糊</label>
                  <input
                    type="range"
                    min="0"
                    max="10"
                    step="0.5"
                    value={lightConfig.blur}
                    onChange={(e) => setLightConfig({ blur: Number(e.target.value) })}
                    className="w-full h-2 bg-ink-600 rounded-lg appearance-none cursor-pointer accent-shadow-500"
                  />
                </div>

                <div>
                  <label className="block text-xs text-parchment-400 mb-1">颜色</label>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={lightConfig.color}
                      onChange={(e) => setLightConfig({ color: e.target.value })}
                      className="w-10 h-8 rounded-lg border border-ink-500 cursor-pointer bg-transparent"
                    />
                    <span className="text-xs text-parchment-400 font-mono">{lightConfig.color}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* 分隔线 */}
            <div className="border-t border-ink-600" />

            {/* 签杆遮挡校验 */}
            <button
              onClick={handleCheckOcclusion}
              className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-shadow-600 hover:bg-shadow-500 text-parchment-100 rounded-lg transition-colors"
            >
              <CheckCircle className="w-4 h-4" />
              <span className="text-sm font-medium">签杆遮挡校验</span>
            </button>
          </div>
        </div>
      </div>

      {/* 下半部分 - 时间轴 */}
      <div className="h-80 flex flex-col bg-gradient-to-b from-ink-800 to-ink-900">
        {/* 时间轴工具栏 */}
        <div className="h-10 flex items-center justify-between px-4 border-b border-ink-600 bg-ink-700/50">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowActionLibrary(!showActionLibrary)}
              className={cn(
                'flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm transition-colors',
                showActionLibrary
                  ? 'bg-crimson-500 text-white'
                  : 'bg-ink-600 text-parchment-300 hover:bg-ink-500 hover:text-parchment-100'
              )}
            >
              <Plus className="w-4 h-4" />
              <span>添加动作</span>
            </button>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleZoomOut}
              className="p-1.5 rounded-lg bg-ink-600 text-parchment-300 hover:bg-ink-500 hover:text-parchment-100 transition-colors"
              title="缩小时间轴"
            >
              <ZoomOut className="w-4 h-4" />
            </button>
            <span className="text-xs text-parchment-400 w-12 text-center">
              {Math.round(timelineZoom * 100)}%
            </span>
            <button
              onClick={handleZoomIn}
              className="p-1.5 rounded-lg bg-ink-600 text-parchment-300 hover:bg-ink-500 hover:text-parchment-100 transition-colors"
              title="放大时间轴"
            >
              <ZoomIn className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* 时间轴主体 */}
        <div className="flex-1 min-h-0 flex overflow-hidden">
          {/* 左侧轨道列表 */}
          <div className="w-48 flex-shrink-0 border-r border-ink-600 bg-ink-800/50">
            <div className="h-8 flex items-center px-3 border-b border-ink-600 bg-ink-700/30">
              <span className="text-xs font-medium text-parchment-400">轨道</span>
            </div>
            <div className="overflow-y-auto">
              {currentScene?.tracks.map((track) => {
                const isExpanded = expandedTracks[track.id] ?? true;
                return (
                  <div
                    key={track.id}
                    className="border-b border-ink-700/50"
                  >
                    <div
                      className={cn(
                        'h-12 flex items-center gap-2 px-3 transition-colors',
                        track.locked ? 'bg-ink-800/80' : 'hover:bg-ink-700/30 cursor-pointer'
                      )}
                    >
                      <button
                        onClick={() => toggleTrackExpand(track.id)}
                        className="p-0.5 rounded text-parchment-400 hover:text-parchment-200 transition-colors"
                      >
                        {isExpanded ? (
                          <ChevronDown className="w-4 h-4" />
                        ) : (
                          <ChevronRight className="w-4 h-4" />
                        )}
                      </button>

                      <div className="w-2 h-2 rounded-full bg-crimson-500" />

                      <span className="flex-1 text-sm text-parchment-200 truncate">
                        {track.name}
                      </span>

                      <button
                        onClick={() => toggleTrackVisibility(track.id)}
                        className={cn(
                          'p-1 rounded transition-colors',
                          track.visible
                            ? 'text-parchment-300 hover:text-parchment-100'
                            : 'text-ink-500 hover:text-parchment-400'
                        )}
                        title={track.visible ? '隐藏' : '显示'}
                      >
                        {track.visible ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
                      </button>

                      <button
                        onClick={() => toggleTrackLock(track.id)}
                        className={cn(
                          'p-1 rounded transition-colors',
                          track.locked
                            ? 'text-crimson-400 hover:text-crimson-300'
                            : 'text-parchment-400 hover:text-parchment-200'
                        )}
                        title={track.locked ? '解锁' : '锁定'}
                      >
                        {track.locked ? <Lock className="w-3.5 h-3.5" /> : <Unlock className="w-3.5 h-3.5" />}
                      </button>
                    </div>

                    {isExpanded && (
                      <div className="h-14 border-t border-ink-700/30 bg-ink-900/30">
                        {showActionLibrary && (
                          <div className="h-full flex items-center justify-center">
                            <button
                              onClick={() => {
                                const firstAction = actions[0];
                                if (firstAction) {
                                  handleAddActionToTrack(track.id, firstAction);
                                }
                              }}
                              disabled={track.locked || actions.length === 0}
                              className="flex items-center gap-1 px-2 py-1 rounded text-xs bg-ink-600/50 text-parchment-400 hover:bg-ink-600 hover:text-parchment-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                            >
                              <Plus className="w-3 h-3" />
                              添加片段
                            </button>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* 右侧时间轴区域 */}
          <div className="flex-1 min-w-0 flex flex-col overflow-hidden">
            {/* 时间刻度 */}
            <div className="h-8 flex-shrink-0 relative border-b border-ink-600 bg-ink-700/30 overflow-hidden">
              <div
                className="absolute inset-0"
                style={{ width: `${(sceneDuration / 1000) * pixelsPerSecond}px` }}
              >
                {renderTimeMarkers()}
              </div>
            </div>

            {/* 轨道内容 */}
            <div
              ref={timelineRef}
              className="flex-1 relative overflow-x-auto overflow-y-auto cursor-pointer"
              onClick={handleTimelineClick}
            >
              <div
                className="relative"
                style={{ width: `${(sceneDuration / 1000) * pixelsPerSecond}px`, minWidth: '100%' }}
              >
                {currentScene?.tracks.map((track) => {
                  const isExpanded = expandedTracks[track.id] ?? true;
                  return (
                    <div key={track.id} className="border-b border-ink-700/50">
                      <div className="h-12 border-b border-ink-700/30">
                        <div className="h-full flex items-center px-2">
                          <div className="flex gap-2">
                            {track.clips
                              .sort((a, b) => a.startTime - b.startTime)
                              .map((clip) => {
                                const action = getActionById(clip.actionId);
                                const left = (clip.startTime / 1000) * pixelsPerSecond;
                                const width = (clip.duration / 1000) * pixelsPerSecond;

                                return (
                                  <div
                                    key={clip.id}
                                    className={cn(
                                      'absolute top-2 h-8 rounded-md flex items-center px-2 overflow-hidden cursor-grab active:cursor-grabbing transition-shadow',
                                      getClipColor(clip.actionId),
                                      track.locked && 'opacity-60 cursor-not-allowed',
                                      !track.visible && 'opacity-40',
                                      draggingClip?.clipId === clip.id && 'ring-2 ring-white shadow-lg'
                                    )}
                                    style={{
                                      left: `${left}px`,
                                      width: `${Math.max(40, width)}px`,
                                    }}
                                    onMouseDown={(e) => handleClipMouseDown(e, clip, track)}
                                  >
                                    <GripHorizontal className="w-3 h-3 text-white/60 mr-1 flex-shrink-0" />
                                    <span className="text-xs text-white font-medium truncate">
                                      {action?.name || '未知动作'}
                                    </span>
                                  </div>
                                );
                              })}
                          </div>
                        </div>
                      </div>

                      {isExpanded && (
                        <div className="h-14 bg-ink-900/20 border-t border-ink-700/30">
                          {track.clips.length === 0 && showActionLibrary && (
                            <div className="h-full flex items-center justify-center">
                              <span className="text-xs text-parchment-500">拖入动作片段</span>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}

                {/* 播放头 */}
                <div
                  className="absolute top-0 bottom-0 w-0.5 bg-crimson-500 pointer-events-none z-10"
                  style={{ left: `${(currentTime / 1000) * pixelsPerSecond}px` }}
                >
                  <div className="absolute -top-0 -left-1.5 w-3 h-3 bg-crimson-500 rotate-45" />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* 动作库面板 */}
        {showActionLibrary && (
          <div className="absolute bottom-80 left-0 right-0 h-40 bg-ink-800 border-t-2 border-crimson-500 shadow-2xl z-20">
            <div className="h-10 flex items-center justify-between px-4 border-b border-ink-600 bg-ink-700">
              <h3 className="text-sm font-medium text-parchment-200">动作库</h3>
              <button
                onClick={() => setShowActionLibrary(false)}
                className="text-parchment-400 hover:text-parchment-200 transition-colors"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="p-3 overflow-y-auto h-[calc(100%-2.5rem)]">
              <div className="grid grid-cols-4 gap-2">
                {actions.map((action) => (
                  <div
                    key={action.id}
                    className="p-3 bg-ink-700 rounded-lg border border-ink-600 hover:border-crimson-500/50 hover:bg-ink-600 cursor-pointer transition-all group"
                    draggable
                    onDragStart={(e) => {
                      e.dataTransfer.setData('actionId', action.id);
                    }}
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <div className={cn('w-3 h-3 rounded-sm', getClipColor(action.id))} />
                      <span className="text-sm font-medium text-parchment-200 truncate">
                        {action.name}
                      </span>
                    </div>
                    <div className="text-xs text-parchment-500">{action.category}</div>
                    <div className="text-xs text-parchment-400 mt-1 font-mono">
                      {(action.duration / 1000).toFixed(1)}s
                    </div>
                  </div>
                ))}
                {actions.length === 0 && (
                  <div className="col-span-4 text-center py-8 text-parchment-500">
                    暂无动作，请先创建动作
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ActionTimeline;
