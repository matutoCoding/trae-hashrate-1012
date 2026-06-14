import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  AlertTriangle,
  AlertCircle,
  CheckCircle,
  Lock,
  Unlock,
  RotateCcw,
  Zap,
  Settings,
  ChevronDown,
  ChevronRight,
} from 'lucide-react';
import { ShadowPuppetCanvas } from '@/components/canvas/ShadowPuppetCanvas';
import { useAppStore } from '@/store/useAppStore';
import { cn } from '@/lib/utils';
import { checkAngleViolation } from '@/utils/kinematics';
import type { Joint, ConstraintWarning } from '@/types';

type JointStatus = 'normal' | 'warning' | 'error';
type GroupKey = 'headNeck' | 'leftArm' | 'rightArm' | 'leftLeg' | 'rightLeg';

interface JointGroup {
  key: GroupKey;
  name: string;
  jointNames: string[];
}

const JOINT_GROUPS: JointGroup[] = [
  {
    key: 'headNeck',
    name: '头部颈部',
    jointNames: ['颈部', '躯干顶'],
  },
  {
    key: 'leftArm',
    name: '左臂',
    jointNames: ['左肩', '左肘', '左腕'],
  },
  {
    key: 'rightArm',
    name: '右臂',
    jointNames: ['右肩', '右肘', '右腕'],
  },
  {
    key: 'leftLeg',
    name: '左腿',
    jointNames: ['左胯', '左膝', '左踝'],
  },
  {
    key: 'rightLeg',
    name: '右腿',
    jointNames: ['右胯', '右膝', '右踝'],
  },
];

function getJointGroupKey(jointName: string): GroupKey | null {
  if (jointName.startsWith('左') && /[肩肘腕]/.test(jointName)) {
    return 'leftArm';
  }
  if (jointName.startsWith('右') && /[肩肘腕]/.test(jointName)) {
    return 'rightArm';
  }
  if (jointName.startsWith('左') && /[胯膝踝]/.test(jointName)) {
    return 'leftLeg';
  }
  if (jointName.startsWith('右') && /[胯膝踝]/.test(jointName)) {
    return 'rightLeg';
  }
  if (jointName.includes('颈') || jointName.includes('躯干')) {
    return 'headNeck';
  }
  return null;
}

interface JointNodeProps {
  joint: Joint;
  status: JointStatus;
  isSelected: boolean;
  onSelect: (id: string) => void;
  level: number;
}

const JointNode: React.FC<JointNodeProps> = ({
  joint,
  status,
  isSelected,
  onSelect,
  level,
}) => {
  const StatusIcon = status === 'error' ? AlertCircle : status === 'warning' ? AlertTriangle : CheckCircle;
  const statusColor = status === 'error' ? 'text-crimson-500' : status === 'warning' ? 'text-shadow-500' : 'text-emerald-500';

  return (
    <div
      className={cn(
        'flex items-center gap-2 px-2 py-1.5 rounded-md cursor-pointer transition-all duration-150',
        isSelected
          ? 'bg-crimson-500/20 text-crimson-300'
          : 'hover:bg-ink-600/50 text-parchment-200 hover:text-parchment-100'
      )}
      style={{ paddingLeft: `${level * 16 + 8}px` }}
      onClick={() => onSelect(joint.id)}
    >
      <div className="w-5" />
      <StatusIcon className={cn('w-4 h-4 flex-shrink-0', statusColor)} />
      <span className="text-sm font-medium truncate">{joint.name}</span>
    </div>
  );
};

interface GroupNodeProps {
  group: JointGroup;
  joints: Joint[];
  isExpanded: boolean;
  isSelected: boolean;
  groupStatus: JointStatus;
  selectedJointId: string | null;
  onToggle: (key: GroupKey) => void;
  onSelectJoint: (id: string) => void;
  level: number;
}

const GroupNode: React.FC<GroupNodeProps> = ({
  group,
  joints,
  isExpanded,
  isSelected,
  groupStatus,
  selectedJointId,
  onToggle,
  onSelectJoint,
  level,
}) => {
  const StatusIcon = groupStatus === 'error' ? AlertCircle : groupStatus === 'warning' ? AlertTriangle : CheckCircle;
  const statusColor = groupStatus === 'error' ? 'text-crimson-500' : groupStatus === 'warning' ? 'text-shadow-500' : 'text-emerald-500';

  const groupJoints = useMemo(() => {
    return group.jointNames
      .map(name => joints.find(j => j.name === name))
      .filter((j): j is Joint => j !== undefined);
  }, [group.jointNames, joints]);

  return (
    <div>
      <div
        className={cn(
          'flex items-center gap-2 px-2 py-1.5 rounded-md cursor-pointer transition-all duration-150',
          isSelected
            ? 'bg-crimson-500/20 text-crimson-300'
            : 'hover:bg-ink-600/50 text-parchment-200 hover:text-parchment-100'
        )}
        style={{ paddingLeft: `${level * 16 + 8}px` }}
        onClick={() => onToggle(group.key)}
      >
        <button
          className="p-0.5 rounded hover:bg-ink-500/50 text-parchment-400"
          onClick={(e) => {
            e.stopPropagation();
            onToggle(group.key);
          }}
        >
          {isExpanded ? (
            <ChevronDown className="w-4 h-4" />
          ) : (
            <ChevronRight className="w-4 h-4" />
          )}
        </button>
        <StatusIcon className={cn('w-4 h-4 flex-shrink-0', statusColor)} />
        <span className="text-sm font-medium flex-1">{group.name}</span>
        <span className="text-xs text-parchment-400 font-mono">
          {groupJoints.length}
        </span>
      </div>
      {isExpanded && (
        <div className="mt-0.5">
          {groupJoints.map(joint => (
            <JointNode
              key={joint.id}
              joint={joint}
              status={getJointStatus(joint)}
              isSelected={selectedJointId === joint.id}
              onSelect={onSelectJoint}
              level={level + 1}
            />
          ))}
        </div>
      )}
    </div>
  );
};

function getJointStatus(joint: Joint): JointStatus {
  if (joint.constraints.locked) return 'normal';
  const hasViolation = checkAngleViolation(joint.currentAngle, joint.constraints);
  if (hasViolation) {
    const range = Math.abs(joint.constraints.maxAngle - joint.constraints.minAngle);
    const midAngle = (joint.constraints.minAngle + joint.constraints.maxAngle) / 2;
    const deviation = Math.abs(joint.currentAngle - midAngle);
    return deviation > range * 0.8 ? 'error' : 'warning';
  }
  return 'normal';
}

const presets = [
  { id: 'ergonomic', name: '人体工学默认', icon: Settings },
  { id: 'performance', name: '表演模式', icon: Zap },
  { id: 'locked', name: '全部锁定', icon: Lock },
];

const ergonomicPresets: Record<string, { minAngle: number; maxAngle: number; locked: boolean; reverseAllowed: boolean }> = {
  '颈部': { minAngle: -45, maxAngle: 45, locked: false, reverseAllowed: false },
  '躯干顶': { minAngle: -15, maxAngle: 15, locked: false, reverseAllowed: false },
  '左肩': { minAngle: -90, maxAngle: 120, locked: false, reverseAllowed: false },
  '左肘': { minAngle: 0, maxAngle: 150, locked: false, reverseAllowed: false },
  '左腕': { minAngle: -45, maxAngle: 45, locked: false, reverseAllowed: false },
  '右肩': { minAngle: -120, maxAngle: 90, locked: false, reverseAllowed: false },
  '右肘': { minAngle: -150, maxAngle: 0, locked: false, reverseAllowed: false },
  '右腕': { minAngle: -45, maxAngle: 45, locked: false, reverseAllowed: false },
  '左胯': { minAngle: -45, maxAngle: 90, locked: false, reverseAllowed: false },
  '左膝': { minAngle: 0, maxAngle: 130, locked: false, reverseAllowed: false },
  '左踝': { minAngle: -30, maxAngle: 30, locked: false, reverseAllowed: false },
  '右胯': { minAngle: -90, maxAngle: 45, locked: false, reverseAllowed: false },
  '右膝': { minAngle: -130, maxAngle: 0, locked: false, reverseAllowed: false },
  '右踝': { minAngle: -30, maxAngle: 30, locked: false, reverseAllowed: false },
};

function getGroupStatus(group: JointGroup, joints: Joint[]): JointStatus {
  const groupJoints = group.jointNames
    .map(name => joints.find(j => j.name === name))
    .filter((j): j is Joint => j !== undefined);
  
  let status: JointStatus = 'normal';
  for (const joint of groupJoints) {
    const jointStatus = getJointStatus(joint);
    if (jointStatus === 'error') {
      return 'error';
    }
    if (jointStatus === 'warning') {
      status = 'warning';
    }
  }
  return status;
}

export default function JointConstraints() {
  const currentDrama = useAppStore(state => state.getCurrentDrama());
  const currentCharacter = useAppStore(state => state.getCurrentCharacter());
  const currentDramaId = useAppStore(state => state.currentDramaId);
  const currentCharacterId = useAppStore(state => state.currentCharacterId);
  const selectedJointId = useAppStore(state => state.selectedJointId);
  const setSelectedJoint = useAppStore(state => state.setSelectedJoint);
  const updateJoint = useAppStore(state => state.updateJoint);
  const constraintWarnings = useAppStore(state => state.constraintWarnings);
  const setConstraintWarnings = useAppStore(state => state.setConstraintWarnings);
  const setJointAngle = useAppStore(state => state.setJointAngle);

  const [expandedGroups, setExpandedGroups] = useState<Set<GroupKey>>(new Set(['headNeck', 'leftArm', 'rightArm', 'leftLeg', 'rightLeg']));
  const [testMode, setTestMode] = useState(false);

  const selectedJoint = currentCharacter?.joints.find(j => j.id === selectedJointId);

  useEffect(() => {
    if (!currentCharacter) return;

    const warnings: ConstraintWarning[] = [];
    currentCharacter.joints.forEach(joint => {
      if (joint.constraints.locked) return;
      const hasViolation = checkAngleViolation(joint.currentAngle, joint.constraints);
      if (hasViolation) {
        const range = Math.abs(joint.constraints.maxAngle - joint.constraints.minAngle);
        const midAngle = (joint.constraints.minAngle + joint.constraints.maxAngle) / 2;
        const deviation = Math.abs(joint.currentAngle - midAngle);
        const severity = deviation > range * 0.8 ? 'error' : 'warning';
        warnings.push({
          jointId: joint.id,
          jointName: joint.name,
          message: `角度 ${joint.currentAngle.toFixed(1)}° 超出约束范围 [${joint.constraints.minAngle}°, ${joint.constraints.maxAngle}°]`,
          severity,
        });
      }
    });
    setConstraintWarnings(warnings);
  }, [currentCharacter, setConstraintWarnings]);

  useEffect(() => {
    if (!selectedJointId || !currentCharacter) return;
    
    const joint = currentCharacter.joints.find(j => j.id === selectedJointId);
    if (joint) {
      const groupKey = getJointGroupKey(joint.name);
      if (groupKey && !expandedGroups.has(groupKey)) {
        setExpandedGroups(prev => {
          const next = new Set(prev);
          next.add(groupKey);
          return next;
        });
      }
    }
  }, [selectedJointId, currentCharacter, expandedGroups]);

  const toggleGroup = useCallback((key: GroupKey) => {
    setExpandedGroups(prev => {
      const next = new Set(prev);
      if (next.has(key)) {
        next.delete(key);
      } else {
        next.add(key);
      }
      return next;
    });
  }, []);

  const handleSelectJoint = useCallback((jointId: string) => {
    setSelectedJoint(jointId);
  }, [setSelectedJoint]);

  const handleMinAngleChange = (value: number) => {
    if (!selectedJointId || !currentDramaId || !currentCharacterId) return;
    updateJoint(currentDramaId, currentCharacterId, selectedJointId, {
      constraints: {
        ...selectedJoint!.constraints,
        minAngle: value,
      },
    });
  };

  const handleMaxAngleChange = (value: number) => {
    if (!selectedJointId || !currentDramaId || !currentCharacterId) return;
    updateJoint(currentDramaId, currentCharacterId, selectedJointId, {
      constraints: {
        ...selectedJoint!.constraints,
        maxAngle: value,
      },
    });
  };

  const handleLockedChange = (locked: boolean) => {
    if (!selectedJointId || !currentDramaId || !currentCharacterId) return;
    updateJoint(currentDramaId, currentCharacterId, selectedJointId, {
      constraints: {
        ...selectedJoint!.constraints,
        locked,
      },
    });
  };

  const handleReverseAllowedChange = (reverseAllowed: boolean) => {
    if (!selectedJointId || !currentDramaId || !currentCharacterId) return;
    updateJoint(currentDramaId, currentCharacterId, selectedJointId, {
      constraints: {
        ...selectedJoint!.constraints,
        reverseAllowed,
      },
    });
  };

  const applyPreset = (presetId: string) => {
    if (!currentDramaId || !currentCharacterId || !currentCharacter) return;

    currentCharacter.joints.forEach(joint => {
      let newConstraints = { ...joint.constraints };

      switch (presetId) {
        case 'ergonomic': {
          const preset = ergonomicPresets[joint.name];
          if (preset) {
            newConstraints = preset;
          }
          break;
        }
        case 'performance': {
          newConstraints = {
            minAngle: -180,
            maxAngle: 180,
            locked: false,
            reverseAllowed: true,
          };
          break;
        }
        case 'locked': {
          newConstraints = {
            ...joint.constraints,
            locked: true,
          };
          break;
        }
      }

      updateJoint(currentDramaId, currentCharacterId, joint.id, {
        constraints: newConstraints,
      });
    });
  };

  const resetJoint = () => {
    if (!selectedJointId || !currentDramaId || !currentCharacterId) return;
    setJointAngle(currentDramaId, currentCharacterId, selectedJointId, 0);
  };

  if (!currentCharacter) {
    return (
      <div className="flex items-center justify-center h-full bg-parchment-100">
        <p className="text-ink-500">请先选择一个角色</p>
      </div>
    );
  }

  return (
    <div className="flex h-full bg-parchment-50">
      <div className="w-64 flex flex-col bg-gradient-to-b from-ink-700 to-ink-800 border-r border-ink-600">
        <div className="p-4 border-b border-ink-600">
          <h2 className="font-display text-lg text-parchment-100 font-bold">关节列表</h2>
          <p className="text-xs text-parchment-400 mt-1">
            {currentCharacter.joints.length} 个关节
          </p>
        </div>

        <div className="flex-1 overflow-y-auto p-2 space-y-1">
          {JOINT_GROUPS.map(group => (
            <GroupNode
              key={group.key}
              group={group}
              joints={currentCharacter.joints}
              isExpanded={expandedGroups.has(group.key)}
              isSelected={false}
              groupStatus={getGroupStatus(group, currentCharacter.joints)}
              selectedJointId={selectedJointId}
              onToggle={toggleGroup}
              onSelectJoint={handleSelectJoint}
              level={0}
            />
          ))}
        </div>

        <div className="p-3 border-t border-ink-600">
          <div className="flex items-center gap-2 text-xs text-parchment-400">
            <CheckCircle className="w-3.5 h-3.5 text-emerald-500" />
            <span>正常</span>
            <AlertTriangle className="w-3.5 h-3.5 text-shadow-500 ml-2" />
            <span>警告</span>
            <AlertCircle className="w-3.5 h-3.5 text-crimson-500 ml-2" />
            <span>错误</span>
          </div>
        </div>
      </div>

      <div className="flex-1 flex flex-col">
        <div className="h-12 bg-ink-700 border-b border-ink-600 flex items-center px-4 gap-3">
          <button
            className={cn(
              'flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium transition-all duration-150',
              testMode
                ? 'bg-crimson-500 text-parchment-100 shadow-warm-glow'
                : 'bg-ink-600 text-parchment-300 hover:bg-ink-500 hover:text-parchment-100'
            )}
            onClick={() => setTestMode(!testMode)}
          >
            <Zap className="w-4 h-4" />
            测试模式
          </button>

          <div className="flex-1" />

          <div className="text-sm text-parchment-300">
            {constraintWarnings.length > 0 ? (
              <span className="flex items-center gap-1.5 text-crimson-400">
                <AlertTriangle className="w-4 h-4" />
                {constraintWarnings.length} 个约束警告
              </span>
            ) : (
              <span className="flex items-center gap-1.5 text-emerald-400">
                <CheckCircle className="w-4 h-4" />
                所有关节约束正常
              </span>
            )}
          </div>
        </div>

        <div className="flex-1 relative">
          <ShadowPuppetCanvas
            character={currentCharacter}
            showConstraints={true}
            showSticks={false}
            interactive={testMode}
            onJointClick={setSelectedJoint}
            onJointDrag={(jointId, position) => {
              if (!currentDramaId || !currentCharacterId) return;
              const joint = currentCharacter.joints.find(j => j.id === jointId);
              if (!joint || joint.constraints.locked) return;
            }}
            className="h-full"
          />

          {testMode && (
            <div className="absolute top-3 left-3 bg-crimson-500/90 backdrop-blur-sm rounded-lg px-3 py-1.5 text-parchment-100 text-sm font-medium">
              测试模式 - 拖动关节测试约束效果
            </div>
          )}
        </div>

        {constraintWarnings.length > 0 && (
          <div className="bg-ink-700/90 backdrop-blur-sm border-t border-ink-600 max-h-40 overflow-y-auto">
            <div className="px-4 py-2 border-b border-ink-600 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-shadow-400" />
              <span className="text-sm font-medium text-parchment-200">约束警告</span>
              <span className="text-xs text-parchment-400">({constraintWarnings.length})</span>
            </div>
            <div className="p-2 space-y-1">
              {constraintWarnings.map((warning, idx) => (
                <div
                  key={`${warning.jointId}-${idx}`}
                  className={cn(
                    'flex items-start gap-2 px-2 py-1.5 rounded-md cursor-pointer transition-colors',
                    warning.severity === 'error'
                      ? 'bg-crimson-500/10 hover:bg-crimson-500/20'
                      : 'bg-shadow-500/10 hover:bg-shadow-500/20'
                  )}
                  onClick={() => setSelectedJoint(warning.jointId)}
                >
                  {warning.severity === 'error' ? (
                    <AlertCircle className="w-4 h-4 text-crimson-400 flex-shrink-0 mt-0.5" />
                  ) : (
                    <AlertTriangle className="w-4 h-4 text-shadow-400 flex-shrink-0 mt-0.5" />
                  )}
                  <div>
                    <p className="text-sm text-parchment-200 font-medium">{warning.jointName}</p>
                    <p className="text-xs text-parchment-400">{warning.message}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      <div className="w-80 flex flex-col bg-gradient-to-b from-ink-700 to-ink-800 border-l border-ink-600">
        <div className="p-4 border-b border-ink-600">
          <h2 className="font-display text-lg text-parchment-100 font-bold">约束参数</h2>
          {selectedJoint ? (
            <p className="text-sm text-parchment-300 mt-1">{selectedJoint.name}</p>
          ) : (
            <p className="text-xs text-parchment-400 mt-1">请选择一个关节</p>
          )}
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-6">
          {selectedJoint ? (
            <>
              <div className="bg-ink-600/50 rounded-lg p-4">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-sm text-parchment-300 font-medium">当前角度</span>
                  <span className="text-2xl font-display font-bold text-crimson-300">
                    {selectedJoint.currentAngle.toFixed(1)}°
                  </span>
                </div>
                <button
                  className="w-full flex items-center justify-center gap-2 py-2 rounded-md bg-ink-500 text-parchment-300 hover:bg-ink-400 hover:text-parchment-100 transition-colors text-sm"
                  onClick={resetJoint}
                >
                  <RotateCcw className="w-4 h-4" />
                  重置为 0°
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-sm text-parchment-300 font-medium">最小角度</label>
                    <span className="text-sm font-mono text-crimson-300">
                      {selectedJoint.constraints.minAngle}°
                    </span>
                  </div>
                  <input
                    type="range"
                    min="-180"
                    max="180"
                    value={selectedJoint.constraints.minAngle}
                    onChange={(e) => handleMinAngleChange(Number(e.target.value))}
                    className="w-full h-2 bg-ink-600 rounded-lg appearance-none cursor-pointer accent-crimson-500"
                  />
                  <div className="flex justify-between mt-1">
                    <span className="text-xs text-parchment-500">-180°</span>
                    <span className="text-xs text-parchment-500">180°</span>
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-sm text-parchment-300 font-medium">最大角度</label>
                    <span className="text-sm font-mono text-crimson-300">
                      {selectedJoint.constraints.maxAngle}°
                    </span>
                  </div>
                  <input
                    type="range"
                    min="-180"
                    max="180"
                    value={selectedJoint.constraints.maxAngle}
                    onChange={(e) => handleMaxAngleChange(Number(e.target.value))}
                    className="w-full h-2 bg-ink-600 rounded-lg appearance-none cursor-pointer accent-crimson-500"
                  />
                  <div className="flex justify-between mt-1">
                    <span className="text-xs text-parchment-500">-180°</span>
                    <span className="text-xs text-parchment-500">180°</span>
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 bg-ink-600/30 rounded-lg">
                  <div className="flex items-center gap-3">
                    {selectedJoint.constraints.locked ? (
                      <Lock className="w-5 h-5 text-crimson-400" />
                    ) : (
                      <Unlock className="w-5 h-5 text-emerald-400" />
                    )}
                    <div>
                      <p className="text-sm text-parchment-200 font-medium">锁定关节</p>
                      <p className="text-xs text-parchment-400">禁止关节旋转</p>
                    </div>
                  </div>
                  <button
                    className={cn(
                      'relative w-12 h-6 rounded-full transition-colors duration-200',
                      selectedJoint.constraints.locked
                        ? 'bg-crimson-500'
                        : 'bg-ink-500'
                    )}
                    onClick={() => handleLockedChange(!selectedJoint.constraints.locked)}
                  >
                    <div
                      className={cn(
                        'absolute top-0.5 w-5 h-5 rounded-full bg-parchment-100 transition-transform duration-200 shadow-md',
                        selectedJoint.constraints.locked
                          ? 'translate-x-6'
                          : 'translate-x-0.5'
                      )}
                    />
                  </button>
                </div>

                <div className="flex items-center justify-between p-3 bg-ink-600/30 rounded-lg">
                  <div className="flex items-center gap-3">
                    <RotateCcw className={cn(
                      'w-5 h-5',
                      selectedJoint.constraints.reverseAllowed ? 'text-shadow-400' : 'text-parchment-500'
                    )} />
                    <div>
                      <p className="text-sm text-parchment-200 font-medium">允许反向折弯</p>
                      <p className="text-xs text-parchment-400">关节可向反方向弯曲</p>
                    </div>
                  </div>
                  <button
                    className={cn(
                      'relative w-12 h-6 rounded-full transition-colors duration-200',
                      selectedJoint.constraints.reverseAllowed
                        ? 'bg-shadow-500'
                        : 'bg-ink-500'
                    )}
                    onClick={() => handleReverseAllowedChange(!selectedJoint.constraints.reverseAllowed)}
                  >
                    <div
                      className={cn(
                        'absolute top-0.5 w-5 h-5 rounded-full bg-parchment-100 transition-transform duration-200 shadow-md',
                        selectedJoint.constraints.reverseAllowed
                          ? 'translate-x-6'
                          : 'translate-x-0.5'
                      )}
                    />
                  </button>
                </div>
              </div>
            </>
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-parchment-400">
              <Settings className="w-12 h-12 mb-3 opacity-30" />
              <p className="text-sm">选择关节以编辑约束</p>
            </div>
          )}
        </div>

        <div className="p-4 border-t border-ink-600">
          <p className="text-xs text-parchment-400 mb-3">预设约束方案</p>
          <div className="space-y-2">
            {presets.map(preset => {
              const Icon = preset.icon;
              return (
                <button
                  key={preset.id}
                  className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg bg-ink-600/50 text-parchment-300 hover:bg-ink-500 hover:text-parchment-100 transition-all duration-150 text-sm"
                  onClick={() => applyPreset(preset.id)}
                >
                  <Icon className="w-4 h-4 text-crimson-400" />
                  <span>{preset.name}</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
