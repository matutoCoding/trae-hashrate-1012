import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
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
  Save,
  Trash2,
  Copy,
  Gauge,
  X,
  MoveHorizontal,
  Info,
  Scan,
  Wrench,
  ArrowUpDown,
} from 'lucide-react';
import { ShadowPuppetCanvas } from '@/components/canvas/ShadowPuppetCanvas';
import { useAppStore } from '@/store/useAppStore';
import { cn, generateId } from '@/lib/utils';
import { interpolateKeyframes, checkStickOcclusion, autoFixOcclusion } from '@/utils/kinematics';
import type { Clip, Track, Action, Character, JointState, StickState, OcclusionInfo } from '@/types';

interface DragState {
  type: 'move' | 'resize-left' | 'resize-right';
  clipId: string;
  trackId: string;
  startX: number;
  startTime: number;
  startDuration: number;
}

interface ContextMenuState {
  show: boolean;
  x: number;
  y: number;
  clip: Clip | null;
  track: Track | null;
}

interface HoverInfo {
  show: boolean;
  x: number;
  y: number;
  clip: Clip | null;
}

interface TrackCharacterState {
  [characterId: string]: {
    joints: Record<string, JointState>;
    sticks: Record<string, StickState>;
  };
}

const TRACK_COLORS = [
  'bg-crimson-500',
  'bg-shadow-500',
  'bg-ink-500',
  'bg-emerald-500',
  'bg-amber-500',
  'bg-purple-500',
  'bg-rose-500',
  'bg-cyan-500',
];

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
  const updateDrama = useAppStore((state) => state.updateDrama);
  const updateCharacter = useAppStore((state) => state.updateCharacter);
  const setJointAngle = useAppStore((state) => state.setJointAngle);
  const updateStick = useAppStore((state) => state.updateStick);
  const actions = currentDrama?.actions || [];
  const characters = currentDrama?.characters || [];

  const [playbackSpeed, setPlaybackSpeed] = useState(1);
  const [timelineZoom, setTimelineZoom] = useState(1);
  const [expandedTracks, setExpandedTracks] = useState<Record<string, boolean>>({});
  const [showActionDropdown, setShowActionDropdown] = useState(false);
  const [showTrackDialog, setShowTrackDialog] = useState(false);
  const [selectedActionForAdd, setSelectedActionForAdd] = useState<Action | null>(null);
  const [dragState, setDragState] = useState<DragState | null>(null);
  const [dragTimeIndicator, setDragTimeIndicator] = useState<number | null>(null);
  const [contextMenu, setContextMenu] = useState<ContextMenuState>({ show: false, x: 0, y: 0, clip: null, track: null });
  const [hoverInfo, setHoverInfo] = useState<HoverInfo>({ show: false, x: 0, y: 0, clip: null });
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [draggingPlayhead, setDraggingPlayhead] = useState(false);
  const [characterStates, setCharacterStates] = useState<TrackCharacterState>({});
  const [showOcclusionPanel, setShowOcclusionPanel] = useState(false);
  const [occlusionResults, setOcclusionResults] = useState<OcclusionInfo[]>([]);
  const [occlusionChecked, setOcclusionChecked] = useState(false);

  const timelineRef = useRef<HTMLDivElement>(null);
  const animationFrameRef = useRef<number | null>(null);
  const lastTimeRef = useRef<number>(0);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const sceneDuration = currentScene?.duration || 10000;
  const pixelsPerSecond = 100 * timelineZoom;
  const pixelsPerMs = pixelsPerSecond / 1000;

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
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setShowActionDropdown(false);
      }
      if (contextMenu.show) {
        setContextMenu({ show: false, x: 0, y: 0, clip: null, track: null });
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [contextMenu.show]);

  const applyAnimationToCharacter = useCallback(
    (characterId: string, joints: Record<string, JointState>, sticks: Record<string, StickState>) => {
      if (!currentDramaId) return;

      Object.entries(joints).forEach(([jointId, state]) => {
        setJointAngle(currentDramaId, characterId, jointId, state.angle);
      });

      Object.entries(sticks).forEach(([stickId, state]) => {
        updateStick(currentDramaId, characterId, stickId, {
          angle: state.angle,
          controlPoint: state.controlPoint,
        });
      });
    },
    [currentDramaId, setJointAngle, updateStick]
  );

  useEffect(() => {
    if (!isPlaying || !currentScene) return;

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

      const newCharacterStates: TrackCharacterState = {};

      currentScene.tracks.forEach((track) => {
        if (!track.visible || track.locked) return;

        track.clips.forEach((clip) => {
          const clipEndTime = clip.startTime + clip.duration;
          if (newTime >= clip.startTime && newTime <= clipEndTime) {
            const action = actions.find((a) => a.id === clip.actionId);
            if (!action) return;

            const relativeTime = (newTime - clip.startTime) * clip.speed;
            const clampedTime = Math.max(0, Math.min(action.duration, relativeTime));
            const interpolated = interpolateKeyframes(action.keyframes, clampedTime);

            if (!newCharacterStates[track.characterId]) {
              newCharacterStates[track.characterId] = { joints: {}, sticks: {} };
            }

            Object.entries(interpolated.joints).forEach(([jointId, state]) => {
              newCharacterStates[track.characterId].joints[jointId] = state;
            });
            Object.entries(interpolated.sticks).forEach(([stickId, state]) => {
              newCharacterStates[track.characterId].sticks[stickId] = state;
            });
          }
        });
      });

      Object.entries(newCharacterStates).forEach(([characterId, states]) => {
        applyAnimationToCharacter(characterId, states.joints, states.sticks);
      });

      setCharacterStates(newCharacterStates);
      animationFrameRef.current = requestAnimationFrame(animate);
    };
    animationFrameRef.current = requestAnimationFrame(animate);

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [isPlaying, playbackSpeed, sceneDuration, currentTime, currentScene, actions, setCurrentTime, setPlaying, applyAnimationToCharacter]);

  useEffect(() => {
    if (isPlaying || !currentScene) return;

    const newCharacterStates: TrackCharacterState = {};

    currentScene.tracks.forEach((track) => {
      if (!track.visible) return;

      track.clips.forEach((clip) => {
        const clipEndTime = clip.startTime + clip.duration;
        if (currentTime >= clip.startTime && currentTime <= clipEndTime) {
          const action = actions.find((a) => a.id === clip.actionId);
          if (!action) return;

          const relativeTime = (currentTime - clip.startTime) * clip.speed;
          const clampedTime = Math.max(0, Math.min(action.duration, relativeTime));
          const interpolated = interpolateKeyframes(action.keyframes, clampedTime);

          if (!newCharacterStates[track.characterId]) {
            newCharacterStates[track.characterId] = { joints: {}, sticks: {} };
          }

          Object.entries(interpolated.joints).forEach(([jointId, state]) => {
            newCharacterStates[track.characterId].joints[jointId] = state;
          });
          Object.entries(interpolated.sticks).forEach(([stickId, state]) => {
            newCharacterStates[track.characterId].sticks[stickId] = state;
          });
        }
      });
    });

    Object.entries(newCharacterStates).forEach(([characterId, states]) => {
      applyAnimationToCharacter(characterId, states.joints, states.sticks);
    });

    setCharacterStates(newCharacterStates);
  }, [currentTime, isPlaying, currentScene, actions, applyAnimationToCharacter]);

  const formatTime = (ms: number): string => {
    const totalSeconds = Math.floor(ms / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    const milliseconds = Math.floor((ms % 1000) / 10);
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}.${milliseconds.toString().padStart(2, '0')}`;
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
    if (draggingPlayhead || dragState) return;
    if (!timelineRef.current) return;
    const rect = timelineRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left + timelineRef.current.scrollLeft;
    const time = x / pixelsPerMs;
    setCurrentTime(Math.max(0, Math.min(sceneDuration, time)));
  };

  const handlePlayheadMouseDown = (e: React.MouseEvent) => {
    e.stopPropagation();
    setDraggingPlayhead(true);
  };

  const handlePlayheadDrag = useCallback(
    (e: MouseEvent) => {
      if (!draggingPlayhead || !timelineRef.current) return;
      const rect = timelineRef.current.getBoundingClientRect();
      const x = e.clientX - rect.left + timelineRef.current.scrollLeft;
      const time = x / pixelsPerMs;
      setCurrentTime(Math.max(0, Math.min(sceneDuration, time)));
    },
    [draggingPlayhead, pixelsPerMs, sceneDuration, setCurrentTime]
  );

  const handlePlayheadDragEnd = useCallback(() => {
    setDraggingPlayhead(false);
  }, []);

  useEffect(() => {
    if (draggingPlayhead) {
      window.addEventListener('mousemove', handlePlayheadDrag);
      window.addEventListener('mouseup', handlePlayheadDragEnd);
      return () => {
        window.removeEventListener('mousemove', handlePlayheadDrag);
        window.removeEventListener('mouseup', handlePlayheadDragEnd);
      };
    }
  }, [draggingPlayhead, handlePlayheadDrag, handlePlayheadDragEnd]);

  const handleClipMouseDown = (e: React.MouseEvent, clip: Clip, track: Track, type: 'move' | 'resize-left' | 'resize-right') => {
    e.stopPropagation();
    if (track.locked) return;

    setDragState({
      type,
      clipId: clip.id,
      trackId: track.id,
      startX: e.clientX,
      startTime: clip.startTime,
      startDuration: clip.duration,
    });
  };

  const handleMouseMove = useCallback(
    (e: MouseEvent) => {
      if (!dragState || !currentDramaId || !currentSceneId || !currentScene) return;

      const deltaX = e.clientX - dragState.startX;
      const deltaTime = deltaX / pixelsPerMs;
      setDragTimeIndicator(dragState.startTime + deltaTime);

      const updatedTracks = currentScene.tracks.map((track) => {
        if (track.id !== dragState.trackId) return track;

        return {
          ...track,
          clips: track.clips.map((clip) => {
            if (clip.id !== dragState.clipId) return clip;

            if (dragState.type === 'move') {
              let newStartTime = dragState.startTime + deltaTime;
              newStartTime = Math.max(0, Math.min(sceneDuration - clip.duration, newStartTime));
              return { ...clip, startTime: newStartTime };
            } else if (dragState.type === 'resize-left') {
              let newStartTime = dragState.startTime + deltaTime;
              let newDuration = dragState.startDuration - deltaTime;
              newStartTime = Math.max(0, newStartTime);
              newDuration = Math.max(100, newDuration);
              if (newStartTime + newDuration > sceneDuration) {
                newDuration = sceneDuration - newStartTime;
              }
              return { ...clip, startTime: newStartTime, duration: newDuration };
            } else if (dragState.type === 'resize-right') {
              let newDuration = dragState.startDuration + deltaTime;
              newDuration = Math.max(100, newDuration);
              if (dragState.startTime + newDuration > sceneDuration) {
                newDuration = sceneDuration - dragState.startTime;
              }
              return { ...clip, duration: newDuration };
            }
            return clip;
          }),
        };
      });

      updateScene(currentDramaId, currentSceneId, { tracks: updatedTracks });
    },
    [dragState, currentDramaId, currentSceneId, currentScene, pixelsPerMs, sceneDuration, updateScene]
  );

  const handleMouseUp = useCallback(() => {
    setDragState(null);
    setDragTimeIndicator(null);
  }, []);

  useEffect(() => {
    if (dragState) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
      return () => {
        window.removeEventListener('mousemove', handleMouseMove);
        window.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [dragState, handleMouseMove, handleMouseUp]);

  const handleContextMenu = (e: React.MouseEvent, clip: Clip, track: Track) => {
    e.preventDefault();
    e.stopPropagation();
    if (track.locked) return;
    setContextMenu({
      show: true,
      x: e.clientX,
      y: e.clientY,
      clip,
      track,
    });
  };

  const handleDeleteClip = () => {
    if (!contextMenu.clip || !contextMenu.track || !currentDramaId || !currentSceneId || !currentScene) return;

    const updatedTracks = currentScene.tracks.map((track) => {
      if (track.id !== contextMenu.track!.id) return track;
      return {
        ...track,
        clips: track.clips.filter((clip) => clip.id !== contextMenu.clip!.id),
      };
    });

    updateScene(currentDramaId, currentSceneId, { tracks: updatedTracks });
    setContextMenu({ show: false, x: 0, y: 0, clip: null, track: null });
  };

  const handleDuplicateClip = () => {
    if (!contextMenu.clip || !contextMenu.track || !currentDramaId || !currentSceneId || !currentScene) return;

    const newClip: Clip = {
      ...contextMenu.clip,
      id: generateId(),
      startTime: contextMenu.clip.startTime + 500,
    };

    const updatedTracks = currentScene.tracks.map((track) => {
      if (track.id !== contextMenu.track!.id) return track;
      return {
        ...track,
        clips: [...track.clips, newClip],
      };
    });

    updateScene(currentDramaId, currentSceneId, { tracks: updatedTracks });
    setContextMenu({ show: false, x: 0, y: 0, clip: null, track: null });
  };

  const handleAdjustSpeed = (speed: number) => {
    if (!contextMenu.clip || !contextMenu.track || !currentDramaId || !currentSceneId || !currentScene) return;

    const updatedTracks = currentScene.tracks.map((track) => {
      if (track.id !== contextMenu.track!.id) return track;
      return {
        ...track,
        clips: track.clips.map((clip) =>
          clip.id === contextMenu.clip!.id ? { ...clip, speed } : clip
        ),
      };
    });

    updateScene(currentDramaId, currentSceneId, { tracks: updatedTracks });
    setContextMenu({ show: false, x: 0, y: 0, clip: null, track: null });
  };

  const handleClipHover = (e: React.MouseEvent, clip: Clip) => {
    const rect = timelineRef.current?.getBoundingClientRect();
    if (!rect) return;
    setHoverInfo({
      show: true,
      x: e.clientX - rect.left + 10,
      y: e.clientY - rect.top - 60,
      clip,
    });
  };

  const handleClipLeave = () => {
    setHoverInfo({ show: false, x: 0, y: 0, clip: null });
  };

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

  const handleAddActionClick = (action: Action) => {
    setSelectedActionForAdd(action);
    setShowActionDropdown(false);
    setShowTrackDialog(true);
  };

  const handleSelectTrack = (trackId: string) => {
    if (!selectedActionForAdd || !currentDramaId || !currentSceneId || !currentScene) return;

    const newClip: Clip = {
      id: generateId(),
      actionId: selectedActionForAdd.id,
      startTime: currentTime,
      duration: selectedActionForAdd.duration,
      speed: 1,
      trackId,
    };

    const updatedTracks = currentScene.tracks.map((track) =>
      track.id === trackId ? { ...track, clips: [...track.clips, newClip] } : track
    );

    updateScene(currentDramaId, currentSceneId, { tracks: updatedTracks });
    setShowTrackDialog(false);
    setSelectedActionForAdd(null);
  };

  const handleSaveScene = () => {
    if (!currentDramaId || !currentSceneId || !currentScene) return;

    updateScene(currentDramaId, currentSceneId, {
      tracks: currentScene.tracks,
    });

    updateDrama(currentDramaId, {
      updatedAt: Date.now(),
    });

    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 2000);
  };

  const handleCheckOcclusion = () => {
    if (!displayCharacter) return;

    const results = checkStickOcclusion(displayCharacter.sticks, displayCharacter);
    setOcclusionResults(results);
    setOcclusionChecked(true);
    setShowOcclusionPanel(true);
  };

  const handleAutoFixOcclusion = () => {
    if (!displayCharacter || !currentDramaId) return;

    const fixedSticks = autoFixOcclusion(displayCharacter.sticks, occlusionResults);
    
    fixedSticks.forEach(stick => {
      updateStick(currentDramaId, displayCharacter.id, stick.id, {
        zIndex: stick.zIndex,
      });
    });

    setTimeout(() => {
      const updatedCharacter = characters.find(c => c.id === displayCharacter.id);
      if (updatedCharacter) {
        const newResults = checkStickOcclusion(updatedCharacter.sticks, updatedCharacter);
        setOcclusionResults(newResults);
      }
    }, 100);
  };

  const getActionById = (actionId: string): Action | undefined => {
    return actions.find((a) => a.id === actionId);
  };

  const getCharacterById = (characterId: string): Character | undefined => {
    return characters.find((c) => c.id === characterId);
  };

  const getTrackColor = (track: Track): string => {
    const character = getCharacterById(track.characterId);
    if (character) {
      const index = character.name.charCodeAt(0) % TRACK_COLORS.length;
      return TRACK_COLORS[index];
    }
    const index = track.name.charCodeAt(0) % TRACK_COLORS.length;
    return TRACK_COLORS[index];
  };

  const getClipColor = (actionId: string): string => {
    const action = getActionById(actionId);
    const index = action ? action.name.charCodeAt(0) % TRACK_COLORS.length : 0;
    return TRACK_COLORS[index];
  };

  const renderTimeMarkers = () => {
    const markers = [];
    const totalMs = sceneDuration;
    const majorStep = 1000;
    const minorStep = 100;

    for (let t = 0; t <= totalMs; t += minorStep) {
      const left = t * pixelsPerMs;
      const isMajor = t % majorStep === 0;

      markers.push(
        <div
          key={t}
          className={cn(
            'absolute top-0 border-l',
            isMajor ? 'h-full border-ink-400/60' : 'h-3 border-ink-600/40'
          )}
          style={{ left: `${left}px` }}
        >
          {isMajor && (
            <span className="absolute -top-5 left-1 text-xs text-parchment-400 font-mono">
              {formatTime(t)}
            </span>
          )}
        </div>
      );
    }
    return markers;
  };

  const displayCharacter = useMemo(() => {
    if (currentCharacter) return currentCharacter;
    if (characters.length > 0) return characters[0];
    return null;
  }, [currentCharacter, characters]);

  return (
    <div className="flex flex-col h-full bg-parchment-50">
      <div className="flex-1 min-h-0 flex border-b-2 border-ink-600">
        <div className="flex-1 min-w-0 relative bg-parchment-100">
          {displayCharacter ? (
            <ShadowPuppetCanvas
              character={displayCharacter}
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

          {saveSuccess && (
            <div className="absolute top-4 left-1/2 -translate-x-1/2 px-4 py-2 rounded-lg shadow-lg bg-green-600 text-white flex items-center gap-2 animate-fade-in">
              <CheckCircle className="w-4 h-4" />
              <span className="text-sm font-medium">场次保存成功</span>
            </div>
          )}
        </div>

        <div className="w-72 flex flex-col bg-gradient-to-b from-ink-700 to-ink-800 border-l border-ink-600">
          <div className="h-14 flex items-center px-4 border-b border-ink-600">
            <h2 className="font-display text-base text-parchment-100 font-semibold">播放控制</h2>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-6">
            <div className="text-center">
              <div className="text-4xl font-mono text-shadow-400 font-bold tracking-wider">
                {formatTime(currentTime)}
              </div>
              <div className="text-xs text-parchment-500 mt-1">
                总时长: {formatTime(sceneDuration)}
              </div>
            </div>

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

            <div className="border-t border-ink-600" />

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

            <div className="border-t border-ink-600" />

            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Scan className="w-4 h-4 text-shadow-400" />
                <span className="text-sm font-medium text-parchment-200">签杆遮挡校验</span>
              </div>

              <button
                onClick={handleCheckOcclusion}
                className={cn(
                  'w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg transition-colors shadow-lg',
                  occlusionChecked && occlusionResults.length > 0 && occlusionResults.some(o => !o.isCorrect)
                    ? 'bg-amber-500 hover:bg-amber-400 text-white shadow-amber-500/20'
                    : 'bg-ink-600 hover:bg-ink-500 text-parchment-200'
                )}
              >
                <Scan className="w-4 h-4" />
                <span className="text-sm font-medium">
                  {occlusionChecked
                    ? occlusionResults.length > 0
                      ? `检测到 ${occlusionResults.length} 处交叉`
                      : '未检测到交叉'
                    : '开始校验'}
                </span>
              </button>

              {occlusionChecked && occlusionResults.length > 0 && (
                <div className="space-y-2">
                  {occlusionResults.some(o => !o.isCorrect) ? (
                    <button
                      onClick={handleAutoFixOcclusion}
                      className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-crimson-500 hover:bg-crimson-400 text-white rounded-lg transition-colors shadow-lg shadow-crimson-500/20"
                    >
                      <Wrench className="w-4 h-4" />
                      <span className="text-sm font-medium">自动修复</span>
                    </button>
                  ) : (
                    <div className="flex items-center justify-center gap-2 px-3 py-2 bg-green-600/20 text-green-400 rounded-lg">
                      <CheckCircle className="w-4 h-4" />
                      <span className="text-xs font-medium">所有交叉层级正确</span>
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className="border-t border-ink-600" />

            <button
              onClick={handleSaveScene}
              className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-crimson-500 hover:bg-crimson-400 text-white rounded-lg transition-colors shadow-lg shadow-crimson-500/20"
            >
              <Save className="w-4 h-4" />
              <span className="text-sm font-medium">保存场次</span>
            </button>
          </div>
        </div>
      </div>

      <div className="h-96 flex flex-col bg-gradient-to-b from-ink-800 to-ink-900 relative">
        <div className="h-12 flex items-center justify-between px-4 border-b border-ink-600 bg-ink-700/50">
          <div className="flex items-center gap-2">
            <div className="relative" ref={dropdownRef}>
              <button
                onClick={() => setShowActionDropdown(!showActionDropdown)}
                className={cn(
                  'flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm transition-colors',
                  showActionDropdown
                    ? 'bg-crimson-500 text-white'
                    : 'bg-ink-600 text-parchment-300 hover:bg-ink-500 hover:text-parchment-100'
                )}
              >
                <Plus className="w-4 h-4" />
                <span>添加动作</span>
                <ChevronDown className="w-3 h-3" />
              </button>

              {showActionDropdown && (
                <div className="absolute top-full left-0 mt-1 w-64 bg-ink-700 border border-ink-600 rounded-lg shadow-xl z-50 max-h-80 overflow-y-auto">
                  {actions.length > 0 ? (
                    actions.map((action) => (
                      <button
                        key={action.id}
                        onClick={() => handleAddActionClick(action)}
                        className="w-full flex items-center gap-2 px-3 py-2 hover:bg-ink-600 transition-colors text-left"
                      >
                        <div className={cn('w-3 h-3 rounded-sm', getClipColor(action.id))} />
                        <div className="flex-1 min-w-0">
                          <div className="text-sm text-parchment-200 truncate">{action.name}</div>
                          <div className="text-xs text-parchment-500">
                            {action.category} · {(action.duration / 1000).toFixed(1)}s
                          </div>
                        </div>
                      </button>
                    ))
                  ) : (
                    <div className="px-3 py-4 text-center text-parchment-500 text-sm">
                      暂无动作，请先创建动作
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleZoomOut}
              className="p-1.5 rounded-lg bg-ink-600 text-parchment-300 hover:bg-ink-500 hover:text-parchment-100 transition-colors"
              title="缩小时间轴"
            >
              <ZoomOut className="w-4 h-4" />
            </button>
            <span className="text-xs text-parchment-400 w-12 text-center font-mono">
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

        <div className="flex-1 min-h-0 flex overflow-hidden">
          <div className="w-52 flex-shrink-0 border-r border-ink-600 bg-ink-800/50">
            <div className="h-10 flex items-center px-3 border-b border-ink-600 bg-ink-700/30">
              <span className="text-xs font-medium text-parchment-400">轨道</span>
            </div>
            <div className="overflow-y-auto">
              {currentScene?.tracks.map((track) => {
                const isExpanded = expandedTracks[track.id] ?? true;
                const character = getCharacterById(track.characterId);
                return (
                  <div key={track.id} className="border-b border-ink-700/50">
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

                      <div className={cn('w-2 h-2 rounded-full', getTrackColor(track))} />

                      <div className="flex-1 min-w-0">
                        <span className="text-sm text-parchment-200 truncate block">
                          {track.name}
                        </span>
                        {character && (
                          <span className="text-xs text-parchment-500 truncate block">
                            {character.name}
                          </span>
                        )}
                      </div>

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
                      <div className="h-16 border-t border-ink-700/30 bg-ink-900/30" />
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          <div className="flex-1 min-w-0 flex flex-col overflow-hidden">
            <div className="h-10 flex-shrink-0 relative border-b border-ink-600 bg-ink-700/30 overflow-hidden">
              <div
                className="absolute inset-0"
                style={{ width: `${sceneDuration * pixelsPerMs}px` }}
              >
                {renderTimeMarkers()}
              </div>
            </div>

            <div
              ref={timelineRef}
              className="flex-1 relative overflow-x-auto overflow-y-auto cursor-pointer"
              onClick={handleTimelineClick}
            >
              <div
                className="relative"
                style={{ width: `${sceneDuration * pixelsPerMs}px`, minWidth: '100%' }}
              >
                {currentScene?.tracks.map((track) => {
                  const isExpanded = expandedTracks[track.id] ?? true;
                  return (
                    <div key={track.id} className="border-b border-ink-700/50">
                      <div className="h-12 border-b border-ink-700/30 relative">
                        {track.clips
                          .sort((a, b) => a.startTime - b.startTime)
                          .map((clip) => {
                            const action = getActionById(clip.actionId);
                            const left = clip.startTime * pixelsPerMs;
                            const width = clip.duration * pixelsPerMs;
                            const isDragging = dragState?.clipId === clip.id;

                            return (
                              <div
                                key={clip.id}
                                className={cn(
                                  'absolute top-2 h-8 rounded-md flex items-center px-2 overflow-hidden cursor-grab active:cursor-grabbing transition-shadow group',
                                  getClipColor(clip.actionId),
                                  track.locked && 'opacity-60 cursor-not-allowed',
                                  !track.visible && 'opacity-40',
                                  isDragging && 'ring-2 ring-white shadow-lg z-10'
                                )}
                                style={{
                                  left: `${left}px`,
                                  width: `${Math.max(40, width)}px`,
                                }}
                                onMouseDown={(e) => handleClipMouseDown(e, clip, track, 'move')}
                                onContextMenu={(e) => handleContextMenu(e, clip, track)}
                                onMouseEnter={(e) => handleClipHover(e, clip)}
                                onMouseMove={(e) => handleClipHover(e, clip)}
                                onMouseLeave={handleClipLeave}
                              >
                                <div
                                  className="absolute left-0 top-0 bottom-0 w-2 cursor-ew-resize hover:bg-white/30 rounded-l-md transition-colors"
                                  onMouseDown={(e) => handleClipMouseDown(e, clip, track, 'resize-left')}
                                />
                                <div
                                  className="absolute right-0 top-0 bottom-0 w-2 cursor-ew-resize hover:bg-white/30 rounded-r-md transition-colors"
                                  onMouseDown={(e) => handleClipMouseDown(e, clip, track, 'resize-right')}
                                />

                                <GripHorizontal className="w-3 h-3 text-white/60 mr-1 flex-shrink-0" />
                                <span className="text-xs text-white font-medium truncate flex-1">
                                  {action?.name || '未知动作'}
                                </span>
                                <span className="text-xs text-white/70 font-mono ml-1 flex-shrink-0">
                                  {(clip.duration / 1000).toFixed(1)}s
                                </span>
                                {clip.speed !== 1 && (
                                  <span className="text-xs text-white/70 font-mono ml-1 flex-shrink-0">
                                    {clip.speed}x
                                  </span>
                                )}
                              </div>
                            );
                          })}
                      </div>

                      {isExpanded && (
                        <div className="h-16 bg-ink-900/20 border-t border-ink-700/30" />
                      )}
                    </div>
                  );
                })}

                <div
                  className="absolute top-0 bottom-0 w-0.5 bg-crimson-500 pointer-events-none z-20"
                  style={{ left: `${currentTime * pixelsPerMs}px` }}
                >
                  <div
                    className="absolute -top-0 -left-1.5 w-3 h-3 bg-crimson-500 rotate-45 cursor-ew-resize pointer-events-auto hover:scale-110 transition-transform"
                    onMouseDown={handlePlayheadMouseDown}
                  />
                </div>

                {dragTimeIndicator !== null && (
                  <div
                    className="absolute top-0 bottom-0 w-px bg-yellow-400 pointer-events-none z-30"
                    style={{ left: `${dragTimeIndicator * pixelsPerMs}px` }}
                  >
                    <div className="absolute -top-6 left-1/2 -translate-x-1/2 px-2 py-0.5 bg-yellow-400 text-ink-900 text-xs font-mono rounded whitespace-nowrap">
                      {formatTime(dragTimeIndicator)}
                    </div>
                  </div>
                )}

                {hoverInfo.show && hoverInfo.clip && (
                  <div
                    className="absolute z-40 px-3 py-2 bg-ink-700 border border-ink-600 rounded-lg shadow-xl pointer-events-none"
                    style={{ left: `${hoverInfo.x}px`, top: `${hoverInfo.y}px` }}
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <Info className="w-3 h-3 text-shadow-400" />
                      <span className="text-sm font-medium text-parchment-200">
                        {getActionById(hoverInfo.clip.actionId)?.name || '未知动作'}
                      </span>
                    </div>
                    <div className="text-xs text-parchment-400 space-y-0.5 font-mono">
                      <div>开始: {formatTime(hoverInfo.clip.startTime)}</div>
                      <div>结束: {formatTime(hoverInfo.clip.startTime + hoverInfo.clip.duration)}</div>
                      <div>时长: {(hoverInfo.clip.duration / 1000).toFixed(2)}s</div>
                      <div>速度: {hoverInfo.clip.speed}x</div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {showTrackDialog && selectedActionForAdd && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-ink-800 border border-ink-600 rounded-xl shadow-2xl w-96 max-h-[80vh] overflow-hidden">
            <div className="flex items-center justify-between px-4 py-3 border-b border-ink-600 bg-ink-700">
              <h3 className="text-sm font-medium text-parchment-200">选择轨道</h3>
              <button
                onClick={() => {
                  setShowTrackDialog(false);
                  setSelectedActionForAdd(null);
                }}
                className="text-parchment-400 hover:text-parchment-200 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="p-4">
              <div className="mb-3 p-3 bg-ink-700/50 rounded-lg">
                <div className="flex items-center gap-2 mb-1">
                  <div className={cn('w-3 h-3 rounded-sm', getClipColor(selectedActionForAdd.id))} />
                  <span className="text-sm font-medium text-parchment-200">{selectedActionForAdd.name}</span>
                </div>
                <div className="text-xs text-parchment-400">
                  时长: {(selectedActionForAdd.duration / 1000).toFixed(1)}s · 将添加到 {formatTime(currentTime)}
                </div>
              </div>
              <div className="space-y-1 max-h-60 overflow-y-auto">
                {currentScene?.tracks.map((track) => {
                  const character = getCharacterById(track.characterId);
                  return (
                    <button
                      key={track.id}
                      onClick={() => handleSelectTrack(track.id)}
                      disabled={track.locked}
                      className={cn(
                        'w-full flex items-center gap-2 px-3 py-2 rounded-lg transition-colors text-left',
                        track.locked
                          ? 'bg-ink-700/30 opacity-50 cursor-not-allowed'
                          : 'bg-ink-700 hover:bg-ink-600 cursor-pointer'
                      )}
                    >
                      <div className={cn('w-2 h-2 rounded-full', getTrackColor(track))} />
                      <div className="flex-1 min-w-0">
                        <div className="text-sm text-parchment-200 truncate">{track.name}</div>
                        {character && (
                          <div className="text-xs text-parchment-500 truncate">{character.name}</div>
                        )}
                      </div>
                      {track.locked && <Lock className="w-3 h-3 text-crimson-400" />}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}

      {contextMenu.show && contextMenu.clip && (
        <div
          className="fixed z-50 bg-ink-700 border border-ink-600 rounded-lg shadow-xl py-1 min-w-40"
          style={{ left: `${contextMenu.x}px`, top: `${contextMenu.y}px` }}
        >
          <button
            onClick={handleDeleteClip}
            className="w-full flex items-center gap-2 px-3 py-2 text-sm text-parchment-200 hover:bg-ink-600 transition-colors"
          >
            <Trash2 className="w-4 h-4 text-crimson-400" />
            <span>删除</span>
          </button>
          <button
            onClick={handleDuplicateClip}
            className="w-full flex items-center gap-2 px-3 py-2 text-sm text-parchment-200 hover:bg-ink-600 transition-colors"
          >
            <Copy className="w-4 h-4 text-shadow-400" />
            <span>复制</span>
          </button>
          <div className="border-t border-ink-600 my-1" />
          <div className="px-3 py-1">
            <div className="flex items-center gap-2 mb-1">
              <Gauge className="w-3 h-3 text-parchment-400" />
              <span className="text-xs text-parchment-400">调整速度</span>
            </div>
            <div className="grid grid-cols-4 gap-1">
              {[0.5, 0.75, 1, 1.25, 1.5, 2].map((speed) => (
                <button
                  key={speed}
                  onClick={() => handleAdjustSpeed(speed)}
                  className={cn(
                    'px-2 py-1 text-xs rounded transition-colors',
                    contextMenu.clip!.speed === speed
                      ? 'bg-crimson-500 text-white'
                      : 'bg-ink-600 text-parchment-300 hover:bg-ink-500'
                  )}
                >
                  {speed}x
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {showOcclusionPanel && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-ink-800 border border-ink-600 rounded-xl shadow-2xl w-[500px] max-h-[80vh] overflow-hidden">
            <div className="flex items-center justify-between px-4 py-3 border-b border-ink-600 bg-ink-700">
              <div className="flex items-center gap-2">
                <Scan className="w-5 h-5 text-shadow-400" />
                <h3 className="text-sm font-medium text-parchment-200">签杆遮挡校验结果</h3>
              </div>
              <button
                onClick={() => setShowOcclusionPanel(false)}
                className="text-parchment-400 hover:text-parchment-200 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-4 overflow-y-auto max-h-[60vh]">
              {occlusionResults.length === 0 ? (
                <div className="text-center py-8">
                  <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-3" />
                  <p className="text-parchment-300 text-sm">未检测到签杆交叉</p>
                  <p className="text-parchment-500 text-xs mt-1">所有签杆布局正常</p>
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="flex items-center justify-between px-3 py-2 bg-ink-700/50 rounded-lg">
                    <span className="text-xs text-parchment-400">
                      共检测到 {occlusionResults.length} 处交叉
                    </span>
                    <span className="text-xs text-parchment-400">
                      {occlusionResults.filter(o => !o.isCorrect).length} 处需要修复
                    </span>
                  </div>

                  {occlusionResults.map((occlusion, index) => (
                    <div
                      key={index}
                      className={cn(
                        'p-4 rounded-lg border transition-colors',
                        occlusion.isCorrect
                          ? 'bg-green-900/20 border-green-800/50'
                          : 'bg-amber-900/20 border-amber-800/50'
                      )}
                    >
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center gap-2">
                          {occlusion.isCorrect ? (
                            <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0 mt-0.5" />
                          ) : (
                            <AlertTriangle className="w-4 h-4 text-amber-500 flex-shrink-0 mt-0.5" />
                          )}
                          <span className="text-sm font-medium text-parchment-200">
                            {occlusion.stickName1} <span className="text-parchment-500">vs</span> {occlusion.stickName2}
                          </span>
                        </div>
                        <span className={cn(
                          'text-xs px-2 py-0.5 rounded-full font-medium',
                          occlusion.isCorrect
                            ? 'bg-green-600/30 text-green-400'
                            : 'bg-amber-600/30 text-amber-400'
                        )}>
                          {occlusion.isCorrect ? '层级正确' : '层级错误'}
                        </span>
                      </div>

                      <div className="space-y-2 text-xs">
                        <div className="flex items-center gap-2 text-parchment-400">
                          <Info className="w-3 h-3" />
                          <span>
                            交点坐标: ({occlusion.intersectionPoint.x.toFixed(1)}, {occlusion.intersectionPoint.y.toFixed(1)})
                          </span>
                        </div>

                        <div className="flex items-center gap-2 text-parchment-400">
                          <ArrowUpDown className="w-3 h-3" />
                          <span>
                            应在前面: <span className="text-parchment-200 font-medium">
                              {occlusion.frontStickId === occlusion.stickId1 ? occlusion.stickName1 : occlusion.stickName2}
                            </span>
                          </span>
                        </div>

                        <div className="mt-2 p-2 bg-ink-900/50 rounded text-parchment-300">
                          <span className="text-parchment-500">建议: </span>
                          {occlusion.suggestion}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="px-4 py-3 border-t border-ink-600 bg-ink-700/50 flex items-center justify-between">
              <button
                onClick={handleCheckOcclusion}
                className="flex items-center gap-2 px-4 py-2 bg-ink-600 hover:bg-ink-500 text-parchment-200 rounded-lg transition-colors text-sm"
              >
                <Scan className="w-4 h-4" />
                <span>重新校验</span>
              </button>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setShowOcclusionPanel(false)}
                  className="px-4 py-2 bg-ink-600 hover:bg-ink-500 text-parchment-200 rounded-lg transition-colors text-sm"
                >
                  关闭
                </button>

                {occlusionResults.length > 0 && occlusionResults.some(o => !o.isCorrect) && (
                  <button
                    onClick={() => {
                      handleAutoFixOcclusion();
                    }}
                    className="flex items-center gap-2 px-4 py-2 bg-crimson-500 hover:bg-crimson-400 text-white rounded-lg transition-colors text-sm shadow-lg shadow-crimson-500/20"
                  >
                    <Wrench className="w-4 h-4" />
                    <span>自动修复</span>
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ActionTimeline;
