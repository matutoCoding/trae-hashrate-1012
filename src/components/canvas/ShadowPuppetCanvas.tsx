import React, { useRef, useState, useCallback, useEffect } from 'react';
import { Character, Joint, Part, Stick, Point, LightConfig } from '../../types';
import { useAppStore } from '../../store/useAppStore';
import { cn, calculateEndPoint, calculateAngle, distance, degreesToRadians } from '../../lib/utils';
import { checkAngleViolation, checkStickOcclusion } from '../../utils/kinematics';

interface ShadowPuppetCanvasProps {
  character: Character;
  showJoints?: boolean;
  showSticks?: boolean;
  showConstraints?: boolean;
  showLightEffect?: boolean;
  interactive?: boolean;
  onJointDrag?: (jointId: string, position: Point) => void;
  onStickDrag?: (stickId: string, position: Point) => void;
  onPartClick?: (partId: string) => void;
  onJointClick?: (jointId: string) => void;
  onStickClick?: (stickId: string) => void;
  className?: string;
}

export const ShadowPuppetCanvas: React.FC<ShadowPuppetCanvasProps> = ({
  character,
  showJoints = true,
  showSticks = true,
  showConstraints = false,
  showLightEffect = true,
  interactive = true,
  onJointDrag,
  onStickDrag,
  onPartClick,
  onJointClick,
  onStickClick,
  className,
}) => {
  const svgRef = useRef<SVGSVGElement>(null);
  const [dragging, setDragging] = useState<{ type: 'joint' | 'stick'; id: string } | null>(null);
  const [viewBox, setViewBox] = useState({ x: -300, y: -200, width: 600, height: 500 });
  
  const lightConfig = useAppStore(state => state.lightConfig);
  const selectedPartId = useAppStore(state => state.selectedPartId);
  const selectedJointId = useAppStore(state => state.selectedJointId);
  const selectedStickId = useAppStore(state => state.selectedStickId);
  const zoom = useAppStore(state => state.zoom);
  const panOffset = useAppStore(state => state.panOffset);

  const getMousePosition = useCallback((e: React.MouseEvent | MouseEvent): Point => {
    if (!svgRef.current) return { x: 0, y: 0 };
    const svg = svgRef.current;
    const rect = svg.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * (viewBox.width / zoom) + viewBox.x + panOffset.x;
    const y = ((e.clientY - rect.top) / rect.height) * (viewBox.height / zoom) + viewBox.y + panOffset.y;
    return { x, y };
  }, [viewBox, zoom, panOffset]);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!dragging || !interactive) return;
    
    const pos = getMousePosition(e);
    
    if (dragging.type === 'joint' && onJointDrag) {
      onJointDrag(dragging.id, pos);
    } else if (dragging.type === 'stick' && onStickDrag) {
      onStickDrag(dragging.id, pos);
    }
  }, [dragging, interactive, getMousePosition, onJointDrag, onStickDrag]);

  const handleMouseUp = useCallback(() => {
    setDragging(null);
  }, []);

  useEffect(() => {
    const handleGlobalMouseUp = () => setDragging(null);
    window.addEventListener('mouseup', handleGlobalMouseUp);
    return () => window.removeEventListener('mouseup', handleGlobalMouseUp);
  }, []);

  const getJointWorldPosition = (joint: Joint): Point => {
    const part = character.parts.find(p => p.id === joint.partId);
    if (!part) return joint.position;
    
    const rad = degreesToRadians(part.transform.rotation);
    const cos = Math.cos(rad);
    const sin = Math.sin(rad);
    
    return {
      x: part.transform.x + joint.position.x * cos - joint.position.y * sin,
      y: part.transform.y + joint.position.x * sin + joint.position.y * cos,
    };
  };

  const sortedParts = [...character.parts].sort((a, b) => a.zIndex - b.zIndex);
  const sortedSticks = [...character.sticks].sort((a, b) => a.zIndex - b.zIndex);
  
  const stickOcclusions = showSticks ? checkStickOcclusion(character.sticks) : [];

  return (
    <div className={cn("relative w-full h-full overflow-hidden bg-parchment-100", className)}>
      <div 
        className="absolute inset-0 opacity-30 pointer-events-none"
        style={{
          backgroundImage: `
            radial-gradient(ellipse at 50% 20%, ${lightConfig.color}40 0%, transparent 50%),
            repeating-linear-gradient(
              0deg,
              transparent,
              transparent 2px,
              rgba(139, 105, 20, 0.03) 2px,
              rgba(139, 105, 20, 0.03) 4px
            )
          `,
        }}
      />
      
      {showLightEffect && (
        <div 
          className="absolute inset-0 pointer-events-none animate-flicker"
          style={{
            background: `radial-gradient(circle at ${lightConfig.x / 8}px ${lightConfig.y / 6}px, ${lightConfig.color}30 0%, transparent 60%)`,
            opacity: lightConfig.intensity,
          }}
        />
      )}

      <svg
        ref={svgRef}
        className="w-full h-full cursor-grab active:cursor-grabbing"
        viewBox={`${viewBox.x + panOffset.x} ${viewBox.y + panOffset.y} ${viewBox.width / zoom} ${viewBox.height / zoom}`}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
      >
        <defs>
          <filter id="shadow-blur" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur in="SourceAlpha" stdDeviation={lightConfig.blur} />
            <feOffset dx="2" dy="2" result="offsetblur" />
            <feComponentTransfer>
              <feFuncA type="linear" slope="0.3" />
            </feComponentTransfer>
            <feMerge>
              <feMergeNode />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
          
          <filter id="glow-effect">
            <feGaussianBlur stdDeviation="2" result="coloredBlur" />
            <feMerge>
              <feMergeNode in="coloredBlur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>

          <filter id="edge-softness">
            <feGaussianBlur in="SourceGraphic" stdDeviation="0.8" />
          </filter>

          <radialGradient id="spotlight" cx="50%" cy="20%" r="60%">
            <stop offset="0%" stopColor={lightConfig.color} stopOpacity="0.15" />
            <stop offset="100%" stopColor="transparent" stopOpacity="0" />
          </radialGradient>
        </defs>

        <rect 
          x={viewBox.x} 
          y={viewBox.y} 
          width={viewBox.width} 
          height={viewBox.height} 
          fill="url(#spotlight)"
          className="pointer-events-none"
        />

        <g className="puppet-group" filter={showLightEffect ? "url(#shadow-blur)" : undefined}>
          {sortedParts.map(part => {
            const isSelected = selectedPartId === part.id;
            const transform = `translate(${part.transform.x}, ${part.transform.y}) rotate(${part.transform.rotation}) scale(${part.transform.scale})`;
            
            return (
              <g 
                key={part.id}
                transform={transform}
                className={cn(
                  "cursor-pointer transition-all duration-150",
                  isSelected && "filter-brightness-110"
                )}
                onClick={(e) => {
                  e.stopPropagation();
                  onPartClick?.(part.id);
                }}
              >
                <path
                  d={part.svgPath}
                  fill={part.color}
                  stroke={isSelected ? '#C9A227' : 'rgba(0,0,0,0.3)'}
                  strokeWidth={isSelected ? 2 : 0.5}
                  className="transition-all duration-150"
                />
                {isSelected && (
                  <path
                    d={part.svgPath}
                    fill="none"
                    stroke="#C9A227"
                    strokeWidth={1}
                    strokeDasharray="4 3"
                    className="animate-pulse"
                  />
                )}
              </g>
            );
          })}
        </g>

        {showJoints && (
          <g className="joints-layer">
            {character.joints.map(joint => {
              const pos = getJointWorldPosition(joint);
              const isSelected = selectedJointId === joint.id;
              const hasViolation = checkAngleViolation(joint.currentAngle, joint.constraints);
              
              return (
                <g key={joint.id}>
                  {showConstraints && (
                    <path
                      d={`M ${pos.x} ${pos.y} L ${pos.x + 30} ${pos.y}`}
                      stroke="#94A3B8"
                      strokeWidth={1}
                      strokeDasharray="3 2"
                      opacity={0.5}
                    />
                  )}
                  
                  {showConstraints && (
                    <path
                      d={describeArc(pos.x, pos.y, 40, joint.constraints.minAngle, joint.constraints.maxAngle)}
                      fill="rgba(201, 162, 39, 0.15)"
                      stroke="#C9A227"
                      strokeWidth={1}
                      strokeDasharray="2 2"
                    />
                  )}
                  
                  <circle
                    cx={pos.x}
                    cy={pos.y}
                    r={isSelected ? 8 : 6}
                    fill={hasViolation ? '#EF4444' : isSelected ? '#C9A227' : '#B8350D'}
                    stroke="white"
                    strokeWidth={2}
                    className={cn(
                      "cursor-pointer transition-all duration-150",
                      interactive && "hover:scale-125",
                      hasViolation && "animate-breathe"
                    )}
                    style={{ transformOrigin: `${pos.x}px ${pos.y}px` }}
                    onClick={(e) => {
                      e.stopPropagation();
                      onJointClick?.(joint.id);
                    }}
                    onMouseDown={(e) => {
                      e.stopPropagation();
                      if (interactive && onJointDrag) {
                        setDragging({ type: 'joint', id: joint.id });
                      }
                    }}
                  />
                  
                  {isSelected && (
                    <circle
                      cx={pos.x}
                      cy={pos.y}
                      r={12}
                      fill="none"
                      stroke="#C9A227"
                      strokeWidth={2}
                      className="animate-ping opacity-50"
                    />
                  )}
                  
                  <text
                    x={pos.x}
                    y={pos.y - 12}
                    textAnchor="middle"
                    fontSize="10"
                    fill="#5D5240"
                    className="pointer-events-none select-none"
                  >
                    {joint.name}
                  </text>
                </g>
              );
            })}
          </g>
        )}

        {showSticks && (
          <g className="sticks-layer">
            {sortedSticks.map(stick => {
              const endPoint = calculateEndPoint(stick.controlPoint, stick.length, stick.angle);
              const isSelected = selectedStickId === stick.id;
              const targetJoint = character.joints.find(j => j.id === stick.targetJointId);
              const targetPos = targetJoint ? getJointWorldPosition(targetJoint) : endPoint;
              
              return (
                <g key={stick.id}>
                  <line
                    x1={stick.controlPoint.x}
                    y1={stick.controlPoint.y}
                    x2={targetPos.x}
                    y2={targetPos.y}
                    stroke={stick.color}
                    strokeWidth={isSelected ? 5 : 3}
                    strokeLinecap="round"
                    className={cn(
                      "cursor-pointer transition-all duration-150",
                      isSelected && "filter drop-shadow-lg"
                    )}
                    onClick={(e) => {
                      e.stopPropagation();
                      onStickClick?.(stick.id);
                    }}
                    onMouseDown={(e) => {
                      e.stopPropagation();
                      if (interactive && onStickDrag) {
                        setDragging({ type: 'stick', id: stick.id });
                      }
                    }}
                  />
                  
                  <circle
                    cx={stick.controlPoint.x}
                    cy={stick.controlPoint.y}
                    r={isSelected ? 10 : 8}
                    fill={isSelected ? '#C9A227' : stick.color}
                    stroke="white"
                    strokeWidth={2}
                    className={cn(
                      "cursor-pointer transition-all duration-150",
                      interactive && "hover:scale-110"
                    )}
                    style={{ transformOrigin: `${stick.controlPoint.x}px ${stick.controlPoint.y}px` }}
                    onMouseDown={(e) => {
                      e.stopPropagation();
                      if (interactive && onStickDrag) {
                        setDragging({ type: 'stick', id: stick.id });
                      }
                    }}
                  />
                  
                  {isSelected && (
                    <circle
                      cx={stick.controlPoint.x}
                      cy={stick.controlPoint.y}
                      r={14}
                      fill="none"
                      stroke="#C9A227"
                      strokeWidth={2}
                      className="animate-ping opacity-50"
                    />
                  )}
                  
                  <text
                    x={stick.controlPoint.x}
                    y={stick.controlPoint.y + 22}
                    textAnchor="middle"
                    fontSize="10"
                    fill="#5D5240"
                    className="pointer-events-none select-none"
                  >
                    {stick.name}
                  </text>
                </g>
              );
            })}
            
            {stickOcclusions.map((occlusion, idx) => (
              <g key={`occlusion-${idx}`}>
                <circle
                  cx={occlusion.point.x}
                  cy={occlusion.point.y}
                  r={6}
                  fill="#EF4444"
                  className="animate-pulse"
                />
                <text
                  x={occlusion.point.x}
                  y={occlusion.point.y - 10}
                  textAnchor="middle"
                  fontSize="9"
                  fill="#EF4444"
                >
                  签杆交叉
                </text>
              </g>
            ))}
          </g>
        )}
      </svg>

      <div className="absolute bottom-3 right-3 flex items-center gap-2 bg-ink-700/60 backdrop-blur-sm rounded-lg px-3 py-1.5">
        <span className="text-xs text-parchment-300">{Math.round(zoom * 100)}%</span>
      </div>
    </div>
  );
};

function describeArc(x: number, y: number, radius: number, startAngle: number, endAngle: number): string {
  const start = polarToCartesian(x, y, radius, endAngle);
  const end = polarToCartesian(x, y, radius, startAngle);
  const largeArcFlag = endAngle - startAngle <= 180 ? '0' : '1';
  
  return [
    'M', x, y,
    'L', start.x, start.y,
    'A', radius, radius, 0, largeArcFlag, 0, end.x, end.y,
    'Z'
  ].join(' ');
}

function polarToCartesian(centerX: number, centerY: number, radius: number, angleInDegrees: number): Point {
  const angleInRadians = (angleInDegrees - 90) * Math.PI / 180.0;
  return {
    x: centerX + (radius * Math.cos(angleInRadians)),
    y: centerY + (radius * Math.sin(angleInRadians)),
  };
}
