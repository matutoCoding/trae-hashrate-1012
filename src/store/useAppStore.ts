import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { Drama, Character, Action, Scene, Joint, Stick, Part, LightConfig, ConstraintWarning } from '../types';
import { createDemoDramas, generateId, createDefaultCharacter } from '../utils/defaultData';

interface AppState {
  dramas: Drama[];
  currentDramaId: string | null;
  currentCharacterId: string | null;
  currentSceneId: string | null;
  currentPage: 'drama' | 'binding' | 'constraints' | 'timeline' | 'library';
  selectedPartId: string | null;
  selectedJointId: string | null;
  selectedStickId: string | null;
  isPlaying: boolean;
  currentTime: number;
  lightConfig: LightConfig;
  constraintWarnings: ConstraintWarning[];
  zoom: number;
  panOffset: { x: number; y: number };

  setCurrentPage: (page: AppState['currentPage']) => void;
  setCurrentDrama: (dramaId: string | null) => void;
  setCurrentCharacter: (characterId: string | null) => void;
  setCurrentScene: (sceneId: string | null) => void;
  
  getCurrentDrama: () => Drama | undefined;
  getCurrentCharacter: () => Character | undefined;
  getCurrentScene: () => Scene | undefined;
  
  addDrama: (drama: Drama) => void;
  updateDrama: (dramaId: string, updates: Partial<Drama>) => void;
  deleteDrama: (dramaId: string) => void;
  createNewDrama: (name: string, description: string) => void;
  
  addCharacter: (dramaId: string, character: Character) => void;
  updateCharacter: (dramaId: string, characterId: string, updates: Partial<Character>) => void;
  deleteCharacter: (dramaId: string, characterId: string) => void;
  addNewCharacter: (dramaId: string, name: string, role: string) => void;
  
  updatePart: (dramaId: string, characterId: string, partId: string, updates: Partial<Part>) => void;
  
  updateJoint: (dramaId: string, characterId: string, jointId: string, updates: Partial<Joint>) => void;
  setJointAngle: (dramaId: string, characterId: string, jointId: string, angle: number) => void;
  
  updateStick: (dramaId: string, characterId: string, stickId: string, updates: Partial<Stick>) => void;
  
  addAction: (dramaId: string, action: Action) => void;
  updateAction: (dramaId: string, actionId: string, updates: Partial<Action>) => void;
  deleteAction: (dramaId: string, actionId: string) => void;
  
  addScene: (dramaId: string, scene: Scene) => void;
  updateScene: (dramaId: string, sceneId: string, updates: Partial<Scene>) => void;
  deleteScene: (dramaId: string, sceneId: string) => void;
  
  setSelectedPart: (partId: string | null) => void;
  setSelectedJoint: (jointId: string | null) => void;
  setSelectedStick: (stickId: string | null) => void;
  
  setPlaying: (playing: boolean) => void;
  setCurrentTime: (time: number) => void;
  
  setLightConfig: (config: Partial<LightConfig>) => void;
  setConstraintWarnings: (warnings: ConstraintWarning[]) => void;
  
  setZoom: (zoom: number) => void;
  setPanOffset: (offset: { x: number; y: number }) => void;
}

export const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
      dramas: createDemoDramas(),
      currentDramaId: null,
      currentCharacterId: null,
      currentSceneId: null,
      currentPage: 'drama',
      selectedPartId: null,
      selectedJointId: null,
      selectedStickId: null,
      isPlaying: false,
      currentTime: 0,
      lightConfig: {
        x: 400,
        y: 50,
        intensity: 0.8,
        blur: 3,
        color: '#FFE4B5',
      },
      constraintWarnings: [],
      zoom: 1,
      panOffset: { x: 0, y: 0 },

      setCurrentPage: (page) => set({ currentPage: page }),
      
      setCurrentDrama: (dramaId) => {
        const dramas = get().dramas;
        const drama = dramas.find(d => d.id === dramaId);
        set({
          currentDramaId: dramaId,
          currentCharacterId: drama?.characters[0]?.id || null,
          currentSceneId: drama?.scenes[0]?.id || null,
        });
      },
      
      setCurrentCharacter: (characterId) => set({ currentCharacterId: characterId }),
      setCurrentScene: (sceneId) => set({ currentSceneId: sceneId }),
      
      getCurrentDrama: () => {
        const { dramas, currentDramaId } = get();
        return dramas.find(d => d.id === currentDramaId);
      },
      
      getCurrentCharacter: () => {
        const drama = get().getCurrentDrama();
        const currentCharacterId = get().currentCharacterId;
        return drama?.characters.find(c => c.id === currentCharacterId);
      },
      
      getCurrentScene: () => {
        const drama = get().getCurrentDrama();
        const currentSceneId = get().currentSceneId;
        return drama?.scenes.find(s => s.id === currentSceneId);
      },
      
      addDrama: (drama) => set(state => ({ dramas: [...state.dramas, drama] })),
      
      updateDrama: (dramaId, updates) => set(state => ({
        dramas: state.dramas.map(d =>
          d.id === dramaId ? { ...d, ...updates, updatedAt: Date.now() } : d
        ),
      })),
      
      deleteDrama: (dramaId) => set(state => ({
        dramas: state.dramas.filter(d => d.id !== dramaId),
        currentDramaId: state.currentDramaId === dramaId ? null : state.currentDramaId,
      })),
      
      createNewDrama: (name, description) => {
        const newDrama: Drama = {
          id: generateId(),
          name,
          description,
          createdAt: Date.now(),
          updatedAt: Date.now(),
          characters: [],
          actions: [],
          scenes: [],
        };
        set(state => ({ dramas: [...state.dramas, newDrama] }));
      },
      
      addCharacter: (dramaId, character) => set(state => ({
        dramas: state.dramas.map(d =>
          d.id === dramaId
            ? { ...d, characters: [...d.characters, character], updatedAt: Date.now() }
            : d
        ),
      })),
      
      updateCharacter: (dramaId, characterId, updates) => set(state => ({
        dramas: state.dramas.map(d =>
          d.id === dramaId
            ? {
                ...d,
                characters: d.characters.map(c =>
                  c.id === characterId ? { ...c, ...updates } : c
                ),
                updatedAt: Date.now(),
              }
            : d
        ),
      })),
      
      deleteCharacter: (dramaId, characterId) => set(state => ({
        dramas: state.dramas.map(d =>
          d.id === dramaId
            ? {
                ...d,
                characters: d.characters.filter(c => c.id !== characterId),
                updatedAt: Date.now(),
              }
            : d
        ),
      })),
      
      addNewCharacter: (dramaId, name, role) => {
        const character = createDefaultCharacter();
        character.name = name;
        character.role = role;
        get().addCharacter(dramaId, character);
      },
      
      updatePart: (dramaId, characterId, partId, updates) => set(state => ({
        dramas: state.dramas.map(d =>
          d.id === dramaId
            ? {
                ...d,
                characters: d.characters.map(c =>
                  c.id === characterId
                    ? {
                        ...c,
                        parts: c.parts.map(p =>
                          p.id === partId ? { ...p, ...updates } : p
                        ),
                      }
                    : c
                ),
                updatedAt: Date.now(),
              }
            : d
        ),
      })),
      
      updateJoint: (dramaId, characterId, jointId, updates) => set(state => ({
        dramas: state.dramas.map(d =>
          d.id === dramaId
            ? {
                ...d,
                characters: d.characters.map(c =>
                  c.id === characterId
                    ? {
                        ...c,
                        joints: c.joints.map(j =>
                          j.id === jointId ? { ...j, ...updates } : j
                        ),
                      }
                    : c
                ),
                updatedAt: Date.now(),
              }
            : d
        ),
      })),
      
      setJointAngle: (dramaId, characterId, jointId, angle) => {
        get().updateJoint(dramaId, characterId, jointId, { currentAngle: angle });
      },
      
      updateStick: (dramaId, characterId, stickId, updates) => set(state => ({
        dramas: state.dramas.map(d =>
          d.id === dramaId
            ? {
                ...d,
                characters: d.characters.map(c =>
                  c.id === characterId
                    ? {
                        ...c,
                        sticks: c.sticks.map(s =>
                          s.id === stickId ? { ...s, ...updates } : s
                        ),
                      }
                    : c
                ),
                updatedAt: Date.now(),
              }
            : d
        ),
      })),
      
      addAction: (dramaId, action) => set(state => ({
        dramas: state.dramas.map(d =>
          d.id === dramaId
            ? { ...d, actions: [...d.actions, action], updatedAt: Date.now() }
            : d
        ),
      })),
      
      updateAction: (dramaId, actionId, updates) => set(state => ({
        dramas: state.dramas.map(d =>
          d.id === dramaId
            ? {
                ...d,
                actions: d.actions.map(a =>
                  a.id === actionId ? { ...a, ...updates } : a
                ),
                updatedAt: Date.now(),
              }
            : d
        ),
      })),
      
      deleteAction: (dramaId, actionId) => set(state => ({
        dramas: state.dramas.map(d =>
          d.id === dramaId
            ? {
                ...d,
                actions: d.actions.filter(a => a.id !== actionId),
                updatedAt: Date.now(),
              }
            : d
        ),
      })),
      
      addScene: (dramaId, scene) => set(state => ({
        dramas: state.dramas.map(d =>
          d.id === dramaId
            ? { ...d, scenes: [...d.scenes, scene], updatedAt: Date.now() }
            : d
        ),
      })),
      
      updateScene: (dramaId, sceneId, updates) => set(state => ({
        dramas: state.dramas.map(d =>
          d.id === dramaId
            ? {
                ...d,
                scenes: d.scenes.map(s =>
                  s.id === sceneId ? { ...s, ...updates } : s
                ),
                updatedAt: Date.now(),
              }
            : d
        ),
      })),
      
      deleteScene: (dramaId, sceneId) => set(state => ({
        dramas: state.dramas.map(d =>
          d.id === dramaId
            ? {
                ...d,
                scenes: d.scenes.filter(s => s.id !== sceneId),
                updatedAt: Date.now(),
              }
            : d
        ),
      })),
      
      setSelectedPart: (partId) => set({ selectedPartId: partId, selectedJointId: null, selectedStickId: null }),
      setSelectedJoint: (jointId) => set({ selectedJointId: jointId, selectedPartId: null, selectedStickId: null }),
      setSelectedStick: (stickId) => set({ selectedStickId: stickId, selectedPartId: null, selectedJointId: null }),
      
      setPlaying: (playing) => set({ isPlaying: playing }),
      setCurrentTime: (time) => set({ currentTime: time }),
      
      setLightConfig: (config) => set(state => ({
        lightConfig: { ...state.lightConfig, ...config },
      })),
      
      setConstraintWarnings: (warnings) => set({ constraintWarnings: warnings }),
      
      setZoom: (zoom) => set({ zoom: Math.max(0.25, Math.min(3, zoom)) }),
      setPanOffset: (offset) => set({ panOffset: offset }),
    }),
    {
      name: 'shadow-puppet-storage',
    }
  )
);
