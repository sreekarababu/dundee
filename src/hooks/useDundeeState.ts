import { useState, useEffect } from 'react';
import { Scene, Shot, Character, LocationModel, AccessoryModel, BlockingData, PropsBreakdown } from '../types/dundee';

export function useDundeeState() {
  const [script, setScript] = useState('');
  const [parsedScenes, setParsedScenes] = useState<Scene[]>([]);
  const [selectedScene, setSelectedScene] = useState<number | null>(null);
  const [generatedImages, setGeneratedImages] = useState<Record<string, string>>({});
  const [generatedCollages, setGeneratedCollages] = useState<Record<number, string[] | string>>({});
  const [generatedBreakdowns, setGeneratedBreakdowns] = useState<Record<string, string>>({});
  const [generatedCostumeBoards, setGeneratedCostumeBoards] = useState<Record<number, string>>({});
  
  const [characters, setCharacters] = useState<Character[]>([]);
  const [locations, setLocations] = useState<LocationModel[]>([]);
  const [accessories, setAccessories] = useState<AccessoryModel[]>([]);
  
  const [selectedStyle, setSelectedStyle] = useState('Cinematic Realism');
  const [aspectRatio, setAspectRatio] = useState('16:9');
  const [selectedTone, setSelectedTone] = useState('None / Default');
  const [selectedPalette, setSelectedPalette] = useState('None / Default');
  const [selectedGlobalTime, setSelectedGlobalTime] = useState('Unspecified');
  const [selectedGlobalCamera, setSelectedGlobalCamera] = useState('Auto / Any');
  const [selectedGlobalLensGroup, setSelectedGlobalLensGroup] = useState('Auto / Any');
  const [selectedDirector, setSelectedDirector] = useState('None / Auto');
  const [selectedFilmStock, setSelectedFilmStock] = useState('Digital Clean (No Stock)');
  const [selectedDiffusion, setSelectedDiffusion] = useState('None (Clean)');
  const [selectedDof, setSelectedDof] = useState('Auto / Lens-Based');
  const [selectedBoardStyle, setSelectedBoardStyle] = useState('Photoreal Frame');
  const [enforceContinuity, setEnforceContinuity] = useState(false);
  const [enforceLikeness, setEnforceLikeness] = useState(false);
  const [projectName, setProjectName] = useState("My Project");
  const [scriptLanguage, setScriptLanguage] = useState('Auto-Detect Native Language');
  const [activeTab, setActiveTab] = useState<'script' | 'assets' | 'storyboard'>('script');

  const [autosaveEnabled, setAutosaveEnabled] = useState(() => {
    return localStorage.getItem('dundee_autosave_enabled') !== 'false';
  });

  const [history, setHistory] = useState<Scene[][]>([]);

  // 1. Listen for global autosave toggle events from the status bar
  useEffect(() => {
    const syncAutosaveConfig = () => {
      const mode = localStorage.getItem('dundee_autosave_enabled') !== 'false';
      setAutosaveEnabled(mode);
    };
    window.addEventListener('dundee_autosave_change', syncAutosaveConfig);
    window.addEventListener('storage', syncAutosaveConfig);
    return () => {
      window.removeEventListener('dundee_autosave_change', syncAutosaveConfig);
      window.removeEventListener('storage', syncAutosaveConfig);
    };
  }, []);

  // 2. Load draft state on initial parse
  useEffect(() => {
    try {
      const saved = localStorage.getItem('dundee_project_autosave');
      if (saved) {
        const data = JSON.parse(saved);
        if (data.script !== undefined) setScript(data.script);
        if (data.parsedScenes !== undefined) setParsedScenes(data.parsedScenes);
        if (data.generatedImages !== undefined) setGeneratedImages(data.generatedImages);
        if (data.generatedCollages !== undefined) setGeneratedCollages(data.generatedCollages);
        if (data.generatedBreakdowns !== undefined) setGeneratedBreakdowns(data.generatedBreakdowns);
        if (data.generatedCostumeBoards !== undefined) setGeneratedCostumeBoards(data.generatedCostumeBoards);
        if (data.characters !== undefined) setCharacters(data.characters);
        if (data.locations !== undefined) setLocations(data.locations);
        if (data.accessories !== undefined) setAccessories(data.accessories);
        if (data.projectName !== undefined) setProjectName(data.projectName);
        if (data.selectedStyle !== undefined) setSelectedStyle(data.selectedStyle);
        if (data.aspectRatio !== undefined) setAspectRatio(data.aspectRatio);
        if (data.selectedTone !== undefined) setSelectedTone(data.selectedTone);
        if (data.selectedPalette !== undefined) setSelectedPalette(data.selectedPalette);
        if (data.selectedGlobalTime !== undefined) setSelectedGlobalTime(data.selectedGlobalTime);
        if (data.selectedGlobalCamera !== undefined) setSelectedGlobalCamera(data.selectedGlobalCamera);
        if (data.selectedGlobalLensGroup !== undefined) setSelectedGlobalLensGroup(data.selectedGlobalLensGroup);
        if (data.selectedDirector !== undefined) setSelectedDirector(data.selectedDirector);
        if (data.selectedFilmStock !== undefined) setSelectedFilmStock(data.selectedFilmStock);
        if (data.selectedDiffusion !== undefined) setSelectedDiffusion(data.selectedDiffusion);
        if (data.selectedDof !== undefined) setSelectedDof(data.selectedDof);
        if (data.selectedBoardStyle !== undefined) setSelectedBoardStyle(data.selectedBoardStyle);
        if (data.enforceContinuity !== undefined) setEnforceContinuity(data.enforceContinuity);
        if (data.enforceLikeness !== undefined) setEnforceLikeness(data.enforceLikeness);
        if (data.scriptLanguage !== undefined) setScriptLanguage(data.scriptLanguage);
        if (data.activeTab !== undefined) setActiveTab(data.activeTab);
      }
    } catch (e) {
      console.error('Failed restoring Dundee Project autosave payload:', e);
    }
  }, []);

  // 3. Persistent autosave effect block
  useEffect(() => {
    if (!autosaveEnabled) return;
    
    // Ignore initial clean state to prevent writing empty data if loading is pending
    const isStateCleanAndEmpty = 
      projectName === 'My Project' && 
      script === '' && 
      parsedScenes.length === 0 && 
      characters.length === 0;

    if (isStateCleanAndEmpty) return;

    const serializeData = {
      script,
      parsedScenes,
      generatedImages,
      generatedCollages,
      generatedBreakdowns,
      generatedCostumeBoards,
      characters,
      locations,
      accessories,
      projectName,
      selectedStyle,
      aspectRatio,
      selectedTone,
      selectedPalette,
      selectedGlobalTime,
      selectedGlobalCamera,
      selectedGlobalLensGroup,
      selectedDirector,
      selectedFilmStock,
      selectedDiffusion,
      selectedDof,
      selectedBoardStyle,
      enforceContinuity,
      enforceLikeness,
      scriptLanguage,
      activeTab,
    };

    localStorage.setItem('dundee_project_autosave', JSON.stringify(serializeData));
    
    // Dispatch instant save event notice to the status bar.
    window.dispatchEvent(new Event('dundee_autosaved'));
  }, [
    autosaveEnabled,
    script,
    parsedScenes,
    generatedImages,
    generatedCollages,
    generatedBreakdowns,
    generatedCostumeBoards,
    characters,
    locations,
    accessories,
    projectName,
    selectedStyle,
    aspectRatio,
    selectedTone,
    selectedPalette,
    selectedGlobalTime,
    selectedGlobalCamera,
    selectedGlobalLensGroup,
    selectedDirector,
    selectedFilmStock,
    selectedDiffusion,
    selectedDof,
    selectedBoardStyle,
    enforceContinuity,
    enforceLikeness,
    scriptLanguage,
    activeTab,
  ]);

  const pushToHistory = (curr: Scene[]) => {
    setHistory(h => [...h, curr].slice(-20));
  };

  const updateScenesWithHistory = (updater: Scene[] | ((prev: Scene[]) => Scene[])) => {
    setParsedScenes(prev => {
      const next = typeof updater === 'function' ? updater(prev) : updater;
      pushToHistory(prev);
      return next;
    });
  };

  const updateSceneDetails = (sceneId: number, field: keyof Scene, value: any) => {
    updateScenesWithHistory(prev => prev.map(scene => 
      scene.id === sceneId ? { ...scene, [field]: value } : scene
    ));
  };

  const updateShotOrder = (sceneId: number, shotId: number, newOrderVal: string) => {
    const newOrder = parseFloat(newOrderVal);
    if (isNaN(newOrder)) return;
    
    updateScenesWithHistory(prev => prev.map(scene => {
      if (scene.id !== sceneId) return scene;
      const updatedShots = scene.shots.map(shot => 
        shot.id === shotId ? { ...shot, order: newOrder } : shot
      );
      updatedShots.sort((a, b) => (a.order ?? a.id) - (b.order ?? b.id));
      return { ...scene, shots: updatedShots };
    }));
  };

  const updateShotBlocking = (sceneId: number, shotId: number, blockingData: BlockingData) => {
    updateScenesWithHistory(prev => prev.map(scene => {
      if (scene.id !== sceneId) return scene;
      return {
        ...scene,
        shots: scene.shots.map(shot => 
          shot.id === shotId ? { ...shot, blockingData } : shot
        )
      };
    }));
  };

  const handleUndo = () => {
    if (history.length === 0) return false;
    const previousState = history[history.length - 1];
    setParsedScenes(previousState);
    setHistory(prev => prev.slice(0, -1));
    return true;
  };

  const resetAllState = () => {
    setHistory([]);
    setScript('');
    setParsedScenes([]);
    setSelectedScene(null);
    setGeneratedImages({});
    setGeneratedCollages({});
    setGeneratedBreakdowns({});
    setGeneratedCostumeBoards({});
    setCharacters([]);
    setLocations([]);
    setAccessories([]);
    setProjectName("My Project");
  };

  return {
    script, setScript,
    parsedScenes, setParsedScenes, updateScenesWithHistory,
    selectedScene, setSelectedScene,
    generatedImages, setGeneratedImages,
    generatedCollages, setGeneratedCollages,
    generatedBreakdowns, setGeneratedBreakdowns,
    generatedCostumeBoards, setGeneratedCostumeBoards,
    characters, setCharacters,
    locations, setLocations,
    accessories, setAccessories,
    selectedStyle, setSelectedStyle,
    aspectRatio, setAspectRatio,
    selectedTone, setSelectedTone,
    selectedPalette, setSelectedPalette,
    selectedGlobalTime, setSelectedGlobalTime,
    selectedGlobalCamera, setSelectedGlobalCamera,
    selectedGlobalLensGroup, setSelectedGlobalLensGroup,
    selectedDirector, setSelectedDirector,
    selectedFilmStock, setSelectedFilmStock,
    selectedDiffusion, setSelectedDiffusion,
    selectedDof, setSelectedDof,
    selectedBoardStyle, setSelectedBoardStyle,
    enforceContinuity, setEnforceContinuity,
    enforceLikeness, setEnforceLikeness,
    projectName, setProjectName,
    scriptLanguage, setScriptLanguage,
    activeTab, setActiveTab,
    autosaveEnabled, setAutosaveEnabled,
    history, handleUndo, resetAllState,
    updateSceneDetails, updateShotOrder, updateShotBlocking
  };
}
export default useDundeeState;
