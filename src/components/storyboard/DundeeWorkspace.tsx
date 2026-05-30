import React, { useState, useEffect } from 'react';
import { 
  Clapperboard, Play, Sparkles, Sliders, ChevronRight, Download, Maximize, 
  Settings, Undo2, LogOut, Loader2, Compass, Film, Trash2, Camera, X, RefreshCw, Box
} from 'lucide-react';

import useDundeeState from '../../hooks/useDundeeState';
import { geminiApi } from '../../api/geminiApi';
import { extractFramesFromVideo, fileToBase64, handleDownloadSingleImage } from '../../services/imageService';

import SetupTab from './SetupTab';
import CastLocationsTab from './CastLocationsTab';
import StoryboardTab from './StoryboardTab';
import InpaintingEditor from './InpaintingEditor';
import SettingsTab from './SettingsTab';
import APIHealthMonitor from '../APIHealthMonitor';

import { 
  CINEMATIC_TONES, COLOR_PALETTES, TIME_OF_DAY, 
  CAMERAS, LENS_GROUPS, FILM_STOCKS 
} from '../../constants/dundee';
import { Character, Scene, Shot } from '../../types/dundee';

interface DundeeWorkspaceProps {
  userSession: any;
  onRefreshUser: () => void;
  onBackToDashboard: () => void;
}

export default function DundeeWorkspace({ userSession, onRefreshUser, onBackToDashboard }: DundeeWorkspaceProps) {
  const dundeeState = useDundeeState();
  const {
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
    handleUndo, resetAllState,
    exportWorkspace, importWorkspace
  } = dundeeState;

  // Loader / Processing States
  const [generatingIds, setGeneratingIds] = useState<Set<string>>(new Set());
  const [fullscreenImage, setFullscreenImage] = useState<string | null>(null);
  const [activeInpainting, setActiveInpainting] = useState<{ sceneId: number; shotId: number; frameId: string; imageUrl: string } | null>(null);
  const [imageEditPrompts, setImageEditPrompts] = useState<Record<string, string>>({});
  
  // Presentation / Play Mode
  const [isPlaying, setIsPlaying] = useState(false);
  const [activePlayIdx, setActivePlayIdx] = useState(0);

  // DNA State
  const [dnaUrl, setDnaUrl] = useState('');
  const [isAnalyzingDna, setIsAnalyzingDna] = useState(false);

  // Active Staging Shot
  const [activeStagingShotId, setActiveStagingShotId] = useState<number | null>(null);

  // Live System Clock State
  const [currentTime, setCurrentTime] = useState<string>('');

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setCurrentTime(now.toLocaleTimeString(undefined, { hour12: false }));
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  const startGen = (id: string) => setGeneratingIds(prev => new Set(prev).add(id));
  const stopGen = (id: string) => setGeneratingIds(prev => {
    const next = new Set(prev);
    next.delete(id);
    return next;
  });

  // 1. Screenplay parsing to Scenes
  const extractScenes = async (textToParse: string) => {
    if (!textToParse.trim()) return;
    const loadId = 'extracting-scenes';
    startGen(loadId);
    try {
      const response = await geminiApi.generateText({
        contents: `Read and parse this screenplay script block. Break it down into clear, numbered scenes. Each scene should have:
- title (e.g. "INT. LIVING ROOM - NIGHT")
- description (summary of screenplay actions)
- characters_present (list of names strictly present or mentioned in this scene)
- shots: an array of 2-5 planned shot cards. Each shot should have:
   * order: a number incrementing shot sequence (1, 2, 3...)
   * duration: estimated run-time in seconds (e.g. "3s")
   * type: optical framing look (e.g. "Close-Up Shot")
   * cameraAngle: camera view angle (e.g. "Low Angle Shot")
   * cameraMovement: camera travel dynamic (e.g. "Tracking Shot")
   * lighting: visual lighting setup (e.g. "High-Key Lighting")
   * timeOfDay: time of day of shot (e.g. "Day" or "Night")
   * script_snippet: strict quote dialogue or specific dramatic action text from script
   * prompt: descriptive image generation prompt to draw the shot's cinematic board visual. Avoid abstract words, describe characters, composition, lighting, style, setting, and actions clearly.

Script block:
${textToParse}

Respond with a clean structural JSON matches the schema. Output nothing but the raw JSON object.`,
        responseMimeType: 'application/json',
        responseSchema: {
          type: 'OBJECT',
          properties: {
            scenes: {
              type: 'ARRAY',
              items: {
                type: 'OBJECT',
                properties: {
                  id: { type: 'INTEGER' },
                  title: { type: 'STRING' },
                  description: { type: 'STRING' },
                  characters_present: { type: 'ARRAY', items: { type: 'STRING' } },
                  shots: {
                    type: 'ARRAY',
                    items: {
                      type: 'OBJECT',
                      properties: {
                        id: { type: 'INTEGER' },
                        order: { type: 'INTEGER' },
                        duration: { type: 'STRING' },
                        type: { type: 'STRING' },
                        cameraAngle: { type: 'STRING' },
                        cameraMovement: { type: 'STRING' },
                        lighting: { type: 'STRING' },
                        timeOfDay: { type: 'STRING' },
                        script_snippet: { type: 'STRING' },
                        prompt: { type: 'STRING' }
                      }
                    }
                  }
                },
                required: ['id', 'title', 'description', 'characters_present', 'shots']
              }
            }
          },
          required: ['scenes']
        }
      });

      const parsed = JSON.parse(response.text);
      if (parsed.scenes && parsed.scenes.length > 0) {
        setParsedScenes(parsed.scenes);
        setSelectedScene(parsed.scenes[0].id);
        
        // Auto-extract unique characters
        const uniqueChars = new Set<string>();
        parsed.scenes.forEach((s: any) => {
          if (s.characters_present) {
            s.characters_present.forEach((c: string) => {
              if (c.trim()) uniqueChars.add(c.trim().toUpperCase());
            });
          }
        });

        if (uniqueChars.size > 0) {
          setCharacters(Array.from(uniqueChars).map((name, idx) => ({
            id: Date.now() + idx,
            name,
            gender: '',
            age: '',
            description: `Character extracted from screenplay: ${name}`,
            images: []
          })));
        }
        
        setActiveTab('storyboard');
        onRefreshUser();
      }
    } catch (err) {
      console.error(err);
      alert('Screenplay parsing failed. Please verify keys and connection.');
    } finally {
      stopGen(loadId);
    }
  };

  // 1b. Upload handles
  const handleScriptUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      if (file.type.startsWith('image/')) {
        // Run OCR parsing via Gemini API multimodal helper
        const base64 = await fileToBase64(file);
        const dataStr = base64.split(',')[1];
        startGen('ocr-analysis');
        try {
          const res = await geminiApi.generateText({
            contents: [
              { text: "Extract all screenplays, shooting lists, or notes visible in this script page or scene draft sheet, and format it clearly." },
              { inlineData: { data: dataStr, mimeType: file.type } }
            ]
          });
          setScript(res.text);
        } catch (ocrErr) {
          console.error(ocrErr);
          alert('OCR image parsing failed.');
        } finally {
          stopGen('ocr-analysis');
        }
      } else {
        const text = await file.text();
        setScript(text);
      }
    } catch (err) {
      console.error(err);
      alert('Failed to read draft file.');
    }
  };

  const handleExportLocalData = () => {
    const data = exportWorkspace();
    const jsonString = JSON.stringify(data, null, 2);
    const blob = new Blob([jsonString], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `dundee_workspace_${new Date().getTime()}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // 2. DNA Extraction Analyst
  const handleAnalyzeDna = async (file: File | null, url: string) => {
    setIsAnalyzingDna(true);
    let payload_contents: any = [];

    try {
      if (file) {
        const base64 = await fileToBase64(file);
        const rawBase = base64.split(',')[1];
        if (file.type.startsWith('image/')) {
          payload_contents = [
            { text: "Analyze the composition, lighting, analog texture, aspect ratio, camera shot angle, depth of field, and color palettes of this frame. Generate a clean set of styled metadata style commands, a list of cameras/filters matching this aesthetic, and a short recommended prompt suffix." },
            { inlineData: { data: rawBase, mimeType: file.type } }
          ];
        } else if (file.type.startsWith('video/')) {
          const frames = await extractFramesFromVideo(file, 3);
          payload_contents = [
            { text: "Here are sequential sample frames of a film scene sequence. Extract the camera dynamics, lens behavior, analog grain profiles, lighting setups, and visual palettes. List the cinematic dna metadata properties to replicate this exact look." }
          ];
          frames.forEach((fm, idx) => {
            payload_contents.push({ inlineData: { data: fm.split(',')[1], mimeType: 'image/jpeg' } });
          });
        }
      } else if (url) {
        payload_contents = [
          { text: `Analyze the video/artwork referenced at URL: ${url}. Provide technical cinematic breakdown parameters: style base, specific cameras (like Arri Alexa 35 or RED), lens groupings, lighting mood, depth of field, and color grade specifications.` }
        ];
      }

      const res = await geminiApi.generateText({ contents: payload_contents });
      
      // Post analytics extraction: Match parsed choices
      const reply = res.text.toLowerCase();
      if (reply.includes('teal') || reply.includes('orange')) setSelectedPalette('Teal & Orange');
      else if (reply.includes('neon') || reply.includes('cyber')) setSelectedPalette('Neon Cyberpunk');
      else if (reply.includes('noir') || reply.includes('mono')) setSelectedPalette('Noir Monochrome');
      
      if (reply.includes('low-key') || reply.includes('ambient')) setSelectedTone('Mood Low-Key Ambient');
      else if (reply.includes('pastel') || reply.includes('dream')) setSelectedTone('Dreamy Pastel Glow');

      if (reply.includes('anamorphic')) setSelectedGlobalLensGroup('Anamorphic primes (Wide, Oval lens flares)');
      else if (reply.includes('vintage')) setSelectedGlobalLensGroup('Vintage glass (Coated flares, softer edges)');

      if (reply.includes('arri') || reply.includes('alexa')) setSelectedGlobalCamera('Arri Alexa 35 (Ultimate realism)');
      else if (reply.includes('red') || reply.includes('raptor')) setSelectedGlobalCamera('RED V-Raptor (Ultra high-contrast)');

      alert('Cinematic DNA analysis complete! Aesthetics values have been updated automatically.');
      onRefreshUser();
    } catch (err) {
      console.error(err);
      alert('DNA analytics sequencing failed.');
    } finally {
      setIsAnalyzingDna(false);
    }
  };

  // 3. Auto-Plan Scenes manually
  const addNewScene = () => {
    updateScenesWithHistory(prev => {
      const nextId = prev.length > 0 ? Math.max(...prev.map(s => s.id)) + 1 : 1;
      return [...prev, {
        id: nextId,
        title: `SCENE ${nextId} - INT/EXT. SETTING - DAY`,
        description: "",
        characters_present: [],
        shots: []
      }];
    });
  };

  const handleRemoveScene = (sceneId: number) => {
    updateScenesWithHistory(prev => {
      const updated = prev.filter(s => s.id !== sceneId);
      if (selectedScene === sceneId) {
        setSelectedScene(updated.length > 0 ? updated[0].id : null);
      }
      return updated;
    });
  };

  const updateSceneDetailsField = (sceneId: number, field: keyof Scene, value: any) => {
    updateScenesWithHistory(prev => prev.map(scene => 
      scene.id === sceneId ? { ...scene, [field]: value } : scene
    ));
  };

  // 4. CRUD for Shot Frames
  const addNewShot = (sceneId: number) => {
    updateScenesWithHistory(prev => prev.map(scene => {
      if (scene.id !== sceneId) return scene;
      const shots = scene.shots || [];
      const newId = shots.length > 0 ? Math.max(...shots.map(s => s.id)) + 1 : 1;
      const newShot: Shot = {
        id: newId,
        order: newId,
        duration: "3s",
        type: "Medium Shot (MS)",
        cameraAngle: "Eye-Level Shot",
        cameraMovement: "Static / None",
        lighting: "Cinematic Realistic",
        timeOfDay: "Day",
        prompt: "Shot description...",
        script_snippet: "",
        characters_present: []
      };
      return { ...scene, shots: [...shots, newShot] };
    }));
  };

  const removeShot = (sceneId: number, shotId: number) => {
    updateScenesWithHistory(prev => prev.map(scene => {
      if (scene.id !== sceneId) return scene;
      return {
        ...scene,
        shots: (scene.shots || []).filter(s => s.id !== shotId)
      };
    }));
  };

  const updateShotOrderField = (sceneId: number, shotId: number, ordVal: string) => {
    const ordNum = parseFloat(ordVal);
    if (isNaN(ordNum)) return;
    updateScenesWithHistory(prev => prev.map(scene => {
      if (scene.id !== sceneId) return scene;
      const updated = (scene.shots || []).map(shot => 
        shot.id === shotId ? { ...shot, order: ordNum } : shot
      );
      updated.sort((a,b) => (a.order ?? a.id) - (b.order ?? b.id));
      return { ...scene, shots: updated };
    }));
  };

  const updateShotBlockingField = (sceneId: number, shotId: number, data: any) => {
    updateScenesWithHistory(prev => prev.map(scene => {
      if (scene.id !== sceneId) return scene;
      return {
        ...scene,
        shots: (scene.shots || []).map(shot => 
          shot.id === shotId ? { ...shot, blockingData: data } : shot
        )
      };
    }));
  };

  // Optical field adjustments
  const updateShotField = (sceneId: number, shotId: number, key: keyof Shot, val: any) => {
    updateScenesWithHistory(prev => prev.map(scene => {
      if (scene.id !== sceneId) return scene;
      return {
        ...scene,
        shots: (scene.shots || []).map(shot => 
          shot.id === shotId ? { ...shot, [key]: val } : shot
        )
      };
    }));
  };

  // 5. ENHANCE prompt specs via LLM
  const enhanceShotPrompt = async (sceneId: number, shotId: number) => {
    const actId = `enhance-${shotId}`;
    startGen(actId);
    try {
      const activeSc = parsedScenes.find(s => s.id === sceneId);
      const shot = activeSc?.shots.find(s => s.id === shotId);
      if (!shot) return;

      const res = await geminiApi.generateText({
        contents: `Enhance this storyboard prompt into a highly descriptive painting/photo directive for cinematic illustration. Describe framing, color harmony, atmosphere, realistic actor facial traits, wardrobe details, camera focal depths, and dramatic action.
Original Prompt: "${shot.prompt}"
Context dialogue snippet: "${shot.script_snippet || ''}"

Return only the optimized prompt text - do not include preambles.`
      });

      if (res.text) {
        updateShotField(sceneId, shotId, 'prompt', res.text);
      }
    } catch (err) {
      console.error(err);
    } finally {
      stopGen(actId);
    }
  };

  // 6. Suggest alternatives
  const suggestShotAlternatives = async (sceneId: number, shotId: number) => {
    const actId = `alts-${sceneId}-${shotId}`;
    startGen(actId);
    try {
      const activeSc = parsedScenes.find(s => s.id === sceneId);
      const shot = activeSc?.shots.find(s => s.id === shotId);
      if (!shot) return;

      const res = await geminiApi.generateText({
        contents: `Act as a legendary film director. Given the movie scene sequence and this specific shot, suggest 3 creative alternate cameras framing setups, lensing focus choices, and character spatial interactions.
Shot framing setting: ${shot.type}, ${shot.cameraAngle}, ${shot.cameraMovement}
Context details: ${shot.script_snippet || shot.prompt}

List the ideas as short direct bullet points.`
      });

      if (res.text) {
        updateShotField(sceneId, shotId, 'aiIdeas', res.text);
      }
    } catch (err) {
      console.error(err);
    } finally {
      stopGen(actId);
    }
  };

  // 7. Multi-Cam options setups
  const generateShotMultiCamOptions = async (sceneId: number, shotId: number) => {
    const actId = `multicam-gen-${sceneId}-${shotId}`;
    startGen(actId);
    try {
      const activeSc = parsedScenes.find(s => s.id === sceneId);
      const shot = activeSc?.shots.find(s => s.id === shotId);
      if (!shot) return;

      const res = await geminiApi.generateText({
        contents: `Design 3 distinct multi-camera staging covers / angles for this scene frame setup. Name them uniquely e.g., "CAM B - OVER-THE-SHOULDER", "CAM C - MEDIUM TIGHT CLOSE-UP", etc. Provide optimized prompts to render each angle.
Shot details: ${shot.prompt}

Output a raw structural JSON object matching the schema.`,
        responseMimeType: 'application/json',
        responseSchema: {
          type: 'OBJECT',
          properties: {
            options: {
              type: 'ARRAY',
              items: {
                type: 'OBJECT',
                properties: {
                  id: { type: 'STRING' },
                  camLabel: { type: 'STRING' },
                  type: { type: 'STRING' },
                  lens: { type: 'STRING' },
                  prompt: { type: 'STRING' }
                },
                required: ['id', 'camLabel', 'type', 'lens', 'prompt']
              }
            }
          },
          required: ['options']
        }
      });

      const parsed = JSON.parse(res.text);
      if (parsed.options) {
        updateShotField(sceneId, shotId, 'multiCamOptions', parsed.options);
      }
    } catch (err) {
      console.error(err);
    } finally {
      stopGen(actId);
    }
  };

  const applyMultiCamAsFinal = (sceneId: number, shotId: number, mcOption: any) => {
    updateScenesWithHistory(prev => prev.map(scene => {
      if (scene.id !== sceneId) return scene;
      return {
        ...scene,
        shots: (scene.shots || []).map(shot => {
          if (shot.id !== shotId) return shot;
          const frameId = `${sceneId}-${shotId}`;
          const mcFrameId = `${sceneId}-${shotId}-mc-${mcOption.id}`;
          
          if (generatedImages[mcFrameId]) {
            setGeneratedImages(prevImgs => ({ ...prevImgs, [frameId]: generatedImages[mcFrameId] }));
          }

          return {
            ...shot,
            type: mcOption.type,
            lens: mcOption.lens,
            prompt: mcOption.prompt,
            multiCamOptions: []
          };
        })
      };
    }));
  };

  // 8. Overhead blocking map generators
  const generateBlockingMap = async (sceneId: number, shotId: number) => {
    const actId = `blocking-${sceneId}-${shotId}`;
    startGen(actId);
    try {
      const activeSc = parsedScenes.find(s => s.id === sceneId);
      const shot = activeSc?.shots.find(s => s.id === shotId);
      if (!shot) return;

      const res = await geminiApi.generateText({
        contents: `Create a logical set of overhead stage elements for this frame. Position actors, lights, props, and standard camera setups. Respond with standard coordinates (0-100 x/y) suitable for UI placement.
Shot details: ${shot.type}, ${shot.cameraAngle}, ${shot.prompt}

Output a clean JSON with array elements.`,
        responseMimeType: 'application/json',
        responseSchema: {
          type: 'OBJECT',
          properties: {
            elements: {
              type: 'ARRAY',
              items: {
                type: 'OBJECT',
                properties: {
                  id: { type: 'INTEGER' },
                  type: { type: 'STRING' }, // camera, actor, light, prop
                  label: { type: 'STRING' },
                  x: { type: 'NUMBER' },
                  y: { type: 'NUMBER' },
                  rotation: { type: 'NUMBER' },
                  color: { type: 'STRING' }
                },
                required: ['id', 'type', 'label', 'x', 'y', 'rotation', 'color']
              }
            }
          },
          required: ['elements']
        }
      });

      const parsed = JSON.parse(res.text);
      if (parsed.elements) {
        updateShotField(sceneId, shotId, 'blockingData', { elements: parsed.elements });
      }
    } catch (err) {
      console.error(err);
    } finally {
      stopGen(actId);
    }
  };

  const applyBlockingToImage = async (sceneId: number, shotId: number) => {
    const frameId = `${sceneId}-${shotId}`;
    const imgUrl = generatedImages[frameId];
    if (!imgUrl) return;

    startGen(frameId);
    try {
      const activeSc = parsedScenes.find(s => s.id === sceneId);
      const shot = activeSc?.shots.find(s => s.id === shotId);
      if (!shot) return;

      const elementsStr = JSON.stringify(shot.blockingData?.elements || []);
      const base64 = imgUrl.split(',')[1];

      // Request a modifications on key frames
      const res = await geminiApi.generateImage({
        contents: [
          { text: `Modify composition of characters, camera depth focal points, and lighting to match this overhead staging layout setup: ${elementsStr}. Maintain exact character likeness, styles, settings, and cinematic themes.` },
          { inlineData: { data: base64, mimeType: 'image/png' } }
        ],
        aspectRatio: aspectRatio.replace(':', '_')
      });

      if (res.image) {
        setGeneratedImages(prev => ({ ...prev, [frameId]: res.image }));
        onRefreshUser();
      }
    } catch (err) {
      console.error(err);
      alert('Failed to sync staging blocking changes onto the visual canvas. Retrying.');
    } finally {
      stopGen(frameId);
    }
  };

  // 9. Veo Video Generation
  const generateVeoVideo = async (sceneId: number, shotId: number, options: { prompt: string; startFrameUrl: string | null; endFrameUrl: string | null; duration: string; size: string }) => {
    const frameId = `${sceneId}-${shotId}`;
    startGen(`veo-${frameId}`);
    try {
      if (userSession && userSession.tokens_remaining < 500) {
        alert("You need at least 500 credits to generate a video. Upgrade in Billings tab!");
        return;
      }

      const res = await geminiApi.generateVideo({
        prompt: options.prompt,
        startImageBase64: options.startFrameUrl ? options.startFrameUrl.split(',')[1] : undefined,
        endImageBase64: options.endFrameUrl ? options.endFrameUrl.split(',')[1] : undefined,
        duration: options.duration,
        aspectRatio: options.size,
      });

      if (res.videoUrl) {
        setGeneratedVideos(prev => ({ ...prev, [frameId]: res.videoUrl }));
        onRefreshUser();
      }
    } catch (err) {
      console.error(err);
      alert('Video generation failed. Ensure backend has Veo mocked or implemented.');
    } finally {
      stopGen(`veo-${frameId}`);
    }
  };

  // 10. Technical Specs chart overlays (Infographics overlays)
  const generateTechBreakdown = async (sceneId: number, shotId: number, shotData: Shot) => {
    const frameId = `${sceneId}-${shotId}`;
    const url = generatedImages[frameId];
    if (!url) return;

    startGen(`breakdown-${frameId}`);
    try {
      const base64 = url.split(',')[1];
      const res = await geminiApi.generateImage({
        contents: [
          { text: `Draw a high-contrast technical cinematography telemetry specs overlay. Overlay detailed infographics metadata values (e.g. ARRI Alexa 35 sensor, 35mm lens, f2.8 opening, color grading, shot framing MS, lighting configurations, vectorscopes, waveform charts, crop guides). Do not hide the original photo, draw the text specs beautifully in light-cyan or bright-yellow text on top of the edges.` },
          { inlineData: { data: base64, mimeType: 'image/png' } }
        ],
        aspectRatio: aspectRatio.replace(':', '_')
      });

      if (res.image) {
        setGeneratedBreakdowns(prev => ({ ...prev, [frameId]: res.image }));
        onRefreshUser();
      }
    } catch (err) {
      console.error(err);
    } finally {
      stopGen(`breakdown-${frameId}`);
    }
  };

  // 10. Sequential Collage compiles
  const generateCollages = async (sceneId: number) => {
    const actId = `collages-${sceneId}`;
    startGen(actId);
    try {
      const activeSc = parsedScenes.find(s => s.id === sceneId);
      if (!activeSc) return;

      const imagesToTile = (activeSc.shots || [])
        .map(s => generatedImages[`${sceneId}-${s.id}`])
        .filter(Boolean);

      if (imagesToTile.length === 0) {
        alert('Please render some initial frames first before compiling storyboard tiles!');
        return;
      }

      const contents: any = [
        { text: "Arrange and tile these storyboard scene frames into a high-resolution 2x2 or 3x3 uniform director's layout grid page. Maintain realistic quality, distinct borders, frame number stamps (Shot 1, Shot 2...) underneath each image card, and nice cinematic ratios." }
      ];

      imagesToTile.slice(0, 4).forEach((img, idx) => {
        contents.push({ inlineData: { data: img.split(',')[1], mimeType: 'image/png' } });
      });

      const res = await geminiApi.generateImage({
        contents,
        aspectRatio: '16:9'
      });

      if (res.image) {
        setGeneratedCollages(prev => ({ ...prev, [sceneId]: res.image }));
        onRefreshUser();
      }
    } catch (err) {
      console.error(err);
      alert('Fail compilation tiles.');
    } finally {
      stopGen(actId);
    }
  };

  // Costume Spec sheets
  const generateCostumeBoard = async (sceneId: number) => {
    const actId = `costume-board-${sceneId}`;
    startGen(actId);
    try {
      const activeSc = parsedScenes.find(s => s.id === sceneId);
      if (!activeSc) return;

      const contents: any = [
        { text: "Draw a detailed costume turnaround specs sheet. Display front profile, side profile, and back profile of the characters in this scene sequence. Label wardrobe options, textiles, material accessories, and close-up jewelry details. High-end professional film pre-production turnaround draft sheets." }
      ];

      characters.slice(0, 2).forEach(c => {
        if (c.images && c.images.length > 0) {
          contents.push({ inlineData: { data: c.images[0].url.split(',')[1], mimeType: 'image/jpeg' } });
        }
      });

      const res = await geminiApi.generateImage({
        contents,
        aspectRatio: '16:9'
      });

      if (res.image) {
        setGeneratedCostumeBoards(prev => ({ ...prev, [sceneId]: res.image }));
        onRefreshUser();
      }
    } catch (err) {
      console.error(err);
    } finally {
      stopGen(actId);
    }
  };

  // Props analysis
  const generatePropsBreakdown = async (sceneId: number) => {
    const actId = `props-${sceneId}`;
    startGen(actId);
    try {
      const activeSc = parsedScenes.find(s => s.id === sceneId);
      if (!activeSc) return;

      const res = await geminiApi.generateText({
        contents: `Analyze this screenplay scene script block and list all specificProps, Visual Effects (VFX), Audio Sound Effects (SFX), and Costume Wardrobe required for shooting.
Script:
${activeSc.description || ''}

Output a clean JSON matching the schema.`,
        responseMimeType: 'application/json',
        responseSchema: {
          type: 'OBJECT',
          properties: {
            props: { type: 'ARRAY', items: { type: 'STRING' } },
            vfx: { type: 'ARRAY', items: { type: 'STRING' } },
            sfx: { type: 'ARRAY', items: { type: 'STRING' } },
            wardrobe: { type: 'ARRAY', items: { type: 'STRING' } }
          },
          required: ['props', 'vfx', 'sfx', 'wardrobe']
        }
      });

      const parsed = JSON.parse(res.text);
      if (parsed) {
         updateSceneDetailsField(sceneId, 'propsBreakdown', parsed);
         onRefreshUser();
      }
    } catch (err) {
      console.error(err);
    } finally {
      stopGen(actId);
    }
  };

  const handleImportDressCode = (targetSceneId: number, sourceSceneId: number) => {
    const src = parsedScenes.find(s => s.id === sourceSceneId);
    const target = parsedScenes.find(s => s.id === targetSceneId);
    if (!src || !target) return;
    
    const matches = src.description?.match(/\[SCENE DRESS CODE:([\s\S]*?)\]/i);
    if (matches && matches[0]) {
      const cleanDesc = (target.description || '').replace(/\[SCENE DRESS CODE:[\s\S]*?\]/gi, '').trim();
      updateScenesWithHistory(prev => prev.map(s => 
        s.id === targetSceneId ? { ...s, description: `${cleanDesc}\n\n${matches[0]}` } : s
      ));
    }
  }

  // 11. Core Image Generation (Sync & Render)
  const generateAIImage = async (sceneId: number, shotId: number, shotData: Shot, mcId: string | null = null, isUpdate: boolean = false) => {
    const frameId = mcId ? `${sceneId}-${shotId}-mc-${mcId}` : `${sceneId}-${shotId}`;
    
    // Check tokens remaining from user Session
    if (userSession && userSession.tokens_remaining < 25) {
      alert("You need at least 25 credits to perform this rendering operation. Upgrade in Billings tab!");
      return;
    }

    startGen(frameId);
    try {
      const activeSc = parsedScenes.find(s => s.id === sceneId);
      const isContinuityOn = enforceContinuity;
      const isFaceMatchOn = enforceLikeness;

      // Construct powerful visual directives
      let promptBuilder = `Style: ${selectedStyle}. Board Render: ${selectedBoardStyle}. Film Style: ${selectedDirector !== 'None / Auto' ? selectedDirector + ' direction style, composition, staging.' : ''} Format aspect: ${aspectRatio}. Framing setup: ${shotData.type}. Angle: ${shotData.cameraAngle}. Camera Motion: ${shotData.cameraMovement}. Lens optics glass: ${selectedGlobalLensGroup !== 'Auto / Any' ? selectedGlobalLensGroup : ''}. Camera Sensor: ${selectedGlobalCamera !== 'Auto / Any' ? selectedGlobalCamera : ''}. Color grading look: ${selectedPalette !== 'None / Default' ? selectedPalette : ''}. Film grain emulation: ${selectedFilmStock !== 'Digital Clean (No Stock)' ? selectedFilmStock : ''}. Diffusion glass filter: ${selectedDiffusion !== 'None (Clean)' ? selectedDiffusion : ''}. DOF opening: ${selectedDof !== 'Auto / Lens-Based' ? selectedDof : ''}. Lighting details: ${shotData.lighting || 'Cinematic'}. Time of day state: ${shotData.timeOfDay !== 'Unspecified' ? shotData.timeOfDay : selectedGlobalTime !== 'Unspecified' ? selectedGlobalTime : ''}. Location set characteristics: ${selectedTone !== 'None / Default' ? selectedTone : ''}.

Visual core description: ${shotData.prompt}.

STRICT GUIDELINES:
- No watermark, logos, copyrights, black margins, or multi-frame collage bounds.
- Draw a single unified cinematic photo frame representing the sequence scene frame.`;

      const payload_contents: any = [{ text: promptBuilder }];

      // Feed sequential previous frame for continuation
      if (isContinuityOn) {
        const sortedShots = [...(activeSc?.shots || [])].sort((a,b) => (a.order ?? a.id) - (b.order ?? b.id));
        const currIdx = sortedShots.findIndex(s => s.id === shotId);
        if (currIdx > 0) {
          const prevShot = sortedShots[currIdx - 1];
          const prevImgUrl = generatedImages[`${sceneId}-${prevShot.id}`];
          if (prevImgUrl) {
            promptBuilder += `\n- Maintain visual spatial alignment, camera depth, lights, and character look matching this sequence reference photo.`;
            payload_contents.push({ inlineData: { data: prevImgUrl.split(',')[1], mimeType: 'image/png' } });
          }
        }
      }

      // Biometric face matching
      if (isFaceMatchOn && characters.length > 0) {
        characters.forEach(char => {
          if (char.images && char.images.length > 0) {
            promptBuilder += `\n- Match exact character face & features representing the character ${char.name} from reference.`;
            payload_contents.push({ inlineData: { data: char.images[0].url.split(',')[1], mimeType: 'image/jpeg' } });
          }
        });
      }

      const res = await geminiApi.generateImage({
        contents: payload_contents,
        aspectRatio: aspectRatio.replace(':', '_')
      });

      if (res.image) {
        setGeneratedImages(prev => ({ ...prev, [frameId]: res.image }));
        onRefreshUser();
      }
    } catch (err: any) {
      console.error(err);
      alert(err.message || 'Rendering canvas frame failed. Verify keys.');
    } finally {
      stopGen(frameId);
    }
  };

  // Inpaint applying edit
  const editAIImage = async (sceneId: number, shotId: number, editPrompt: string, maskDataUrl: string | null) => {
    const frameId = `${sceneId}-${shotId}`;
    const url = generatedImages[frameId];
    if (!url) return;

    startGen(frameId);
    try {
      const originalBase64 = url.split(',')[1];
      const payload_contents: any = [
        { text: `Modify the target areas in the coordinate layout. Detail changes: ${editPrompt}. Maintain absolute photo consistency, actor facial likeness, focal depth, color harmonies, and lighting properties.` },
        { inlineData: { data: originalBase64, mimeType: 'image/png' } }
      ];

      if (maskDataUrl) {
        const maskBase64 = maskDataUrl.split(',')[1];
        payload_contents.push({ inlineData: { data: maskBase64, mimeType: 'image/png' } });
      }

      const res = await geminiApi.generateImage({
        contents: payload_contents,
        aspectRatio: aspectRatio.replace(':', '_')
      });

      if (res.image) {
        setGeneratedImages(prev => ({ ...prev, [frameId]: res.image }));
        setActiveInpainting(null);
        onRefreshUser();
      }
    } catch (err: any) {
      console.error(err);
      alert('Fail to apply inpainting areas.');
    } finally {
      stopGen(frameId);
    }
  };

  // Generate Motion / Last Frame (End frame of shot)
  const generateLastFrame = async (sceneId: number, shotId: number, shotData: Shot) => {
    const startFrameId = `${sceneId}-${shotId}`;
    const startImgUrl = generatedImages[startFrameId];
    if (!startImgUrl) return;

    const frameId = `${sceneId}-${shotId}-last`;
    startGen(frameId);
    try {
      const originalBase64 = startImgUrl.split(',')[1];
      const res = await geminiApi.generateImage({
        contents: [
          { text: `Draw the exact next sequential frame (ending frame) of this shot. Dynamic camera movement traveling direction: ${shotData.cameraMovement || 'Static / Zooming'}. Character actions has slightly advanced. Maintain absolute rendering traits, character likeness, colors, and lighting context.` },
          { inlineData: { data: originalBase64, mimeType: 'image/png' } }
        ],
        aspectRatio: aspectRatio.replace(':', '_')
      });

      if (res.image) {
        setGeneratedImages(prev => ({ ...prev, [frameId]: res.image }));
        onRefreshUser();
      }
    } catch (err) {
      console.error(err);
    } finally {
      stopGen(frameId);
    }
  };

  // 12. Character Biometrics & backstory generators
  const generateCharacterPortrait = async (id: number, name: string, gender: string, age: string, description: string) => {
    const charId = `char-gen-${id}`;
    startGen(charId);
    try {
      const res = await geminiApi.generateImage({
        contents: [
          { text: `Draw a professional pre-production model turnaround face profile photo sketch of the character: ${name}. Gender: ${gender}. Age: ${age || 'adult'}. Visual traits: ${description}. Single high-detail studio face photo, clean soft-box backdrop lighting.` }
        ],
        aspectRatio: '1:1'
      });

      if (res.image) {
        setCharacters(prev => prev.map(c => 
          c.id === id ? { ...c, images: [{ url: res.image, data: res.image.split(',')[1], mimeType: 'image/jpeg' }] } : c
        ));
        onRefreshUser();
        alert(`Profile sketch generated successfully for ${name}!`);
      }
    } catch (err) {
      console.error(err);
    } finally {
      stopGen(charId);
    }
  };

  const handleSearchActorName = async (id: number | null, name: string) => {
    if (!name.trim()) return;
    const targetId = id || Date.now();
    const loadId = `backstory-${targetId}`;
    startGen(loadId);
    try {
      const res = await geminiApi.generateText({
        contents: `Provide visual wardrobe choices, facial features, actor likeness suggestions, and key traits to design a production-ready character model for: "${name}". Detail their typical cinematic look.`
      });

      if (res.text) {
        setCharacters(prev => {
          const idx = prev.findIndex(c => c.id === targetId);
          if (idx >= 0) {
            const updated = [...prev];
            updated[idx] = { ...updated[idx], description: res.text };
            return updated;
          }
          return [...prev, {
            id: targetId,
            name,
            gender: '',
            age: '',
            description: res.text,
            images: []
          }];
        });
        alert(`Extracted actor reference insights for ${name}!`);
      }
    } catch (err) {
      console.error(err);
    } finally {
      stopGen(loadId);
    }
  };

  const generateCharacterBackstory = async (id: number) => {
    const actId = `backstory-${id}`;
    startGen(actId);
    try {
      const char = characters.find(c => c.id === id);
      if (!char) return;

      const res = await geminiApi.generateText({
        contents: `Create a professional movie screenplay character backstory, bio, key motives, and wardrobe aesthetic profiles for: "${char.name}".`
      });

      if (res.text) {
        setCharacters(prev => prev.map(c => 
          c.id === id ? { ...c, description: `${c.description}\n\nBIO & BACKSTORY:\n${res.text}` } : c
        ));
      }
    } catch (err) {
      console.error(err);
    } finally {
      stopGen(actId);
    }
  };

  const handleUpdateCharacterImage = async (id: number, e: any) => {
    const file = e.target.files?.[0];
    if (file) {
      const base64 = await fileToBase64(file);
      setCharacters(prev => prev.map(c => 
        c.id === id ? {
          ...c,
          images: [...(c.images || []), { url: base64, data: base64.split(',')[1], mimeType: file.type }]
        } : c
      ));
    }
  };

  const removeCharacter = (id: number) => {
    setCharacters(prev => prev.filter(c => c.id !== id));
  };

  // 13. Environments Models
  const generateLocationImage = async (id: number, name: string, description: string) => {
    const loadId = `loc-gen-${id}`;
    startGen(loadId);
    try {
      const res = await geminiApi.generateImage({
        contents: [
          { text: `Pre-viz conceptual environment design studio sketch still: ${name}. Context: ${description}. Soft ambient cinema volumetric illumination, detailed set decoration layout. Single architectural wide-angle plate.` }
        ],
        aspectRatio: '16:9'
      });

      if (res.image) {
        setLocations(prev => prev.map(l => 
          l.id === id ? { ...l, image: { url: res.image, data: res.image.split(',')[1], mimeType: 'image/png' } } : l
        ));
        onRefreshUser();
      }
    } catch (err) {
      console.error(err);
    } finally {
      stopGen(loadId);
    }
  };

  const handleUpdateLocationImage = async (id: number, e: any) => {
    const file = e.target.files?.[0];
    if (file) {
      const base64 = await fileToBase64(file);
      setLocations(prev => prev.map(l => 
        l.id === id ? { ...l, image: { url: base64, data: base64.split(',')[1], mimeType: file.type } } : l
      ));
    }
  };

  const removeLocation = (id: number) => {
    setLocations(prev => prev.filter(l => l.id !== id));
  };

  // 14. Accessories & Props Models
  const generateAccessoryImage = async (id: number, name: string, description: string) => {
    const loadId = `acc-gen-${id}`;
    startGen(loadId);
    try {
      const res = await geminiApi.generateImage({
        contents: [
          { text: `Prop and visual asset turnaround concept artwork still: ${name}. Detail features: ${description}. Single artifact centered design, solid background studio layout.` }
        ],
        aspectRatio: '16:9'
      });

      if (res.image) {
        setAccessories(prev => prev.map(a => 
          a.id === id ? { ...a, image: { url: res.image, data: res.image.split(',')[1], mimeType: 'image/png' } } : a
        ));
        onRefreshUser();
      }
    } catch (err) {
      console.error(err);
    } finally {
      stopGen(loadId);
    }
  };

  const handleUpdateAccessoryImage = async (id: number, e: any) => {
    const file = e.target.files?.[0];
    if (file) {
      const base64 = await fileToBase64(file);
      setAccessories(prev => prev.map(a => 
        a.id === id ? { ...a, image: { url: base64, data: base64.split(',')[1], mimeType: file.type } } : a
      ));
    }
  };

  const removeAccessory = (id: number) => {
    setAccessories(prev => prev.filter(a => a.id !== id));
  };

  // Character removal
  const handleRemoveCharacterImage = (charId: number, imageIndex: number) => {
    setCharacters(prev => prev.map(c => {
      if (c.id !== charId) return c;
      const images = [...(c.images || [])];
      images.splice(imageIndex, 1);
      return { ...c, images };
    }));
  };

  // Multicam coverage sequences
  const generateMultiCamCoverage = async (sceneId: number) => {
    const actId = `scene-multicam-${sceneId}`;
    startGen(actId);
    try {
      const activeSc = parsedScenes.find(s => s.id === sceneId);
      if (!activeSc) return;

      const res = await geminiApi.generateText({
        contents: `Create standard multicam coverage (A Cam, B Cam, C Cam over-the-shoulders) setups for each shot in this sequence:
Sequence details:
${activeSc.description || ''}

Output a clean structural JSON matches the schema.`,
        responseMimeType: 'application/json',
        responseSchema: {
          type: 'OBJECT',
          properties: {
            shotsCoverages: {
              type: 'ARRAY',
              items: {
                type: 'OBJECT',
                properties: {
                  shotId: { type: 'INTEGER' },
                  options: {
                    type: 'ARRAY',
                    items: {
                      type: 'OBJECT',
                      properties: {
                        id: { type: 'STRING' },
                        camLabel: { type: 'STRING' },
                        type: { type: 'STRING' },
                        lens: { type: 'STRING' },
                        prompt: { type: 'STRING' }
                      },
                      required: ['id', 'camLabel', 'type', 'lens', 'prompt']
                    }
                  }
                },
                required: ['shotId', 'options']
              }
            }
          },
          required: ['shotsCoverages']
        }
      });

      const parsed = JSON.parse(res.text);
      if (parsed.shotsCoverages) {
        updateScenesWithHistory(prev => prev.map(scene => {
          if (scene.id !== sceneId) return scene;
          return {
            ...scene,
            shots: (scene.shots || []).map(shot => {
              const cover = parsed.shotsCoverages.find((sc: any) => sc.shotId === shot.id);
              if (cover) {
                return { ...shot, multiCamOptions: cover.options };
              }
              return shot;
            })
          };
        }));
        alert('Simultaneous multi-cam coverage angles planned! Render them below.');
        onRefreshUser();
      }
    } catch (err) {
      console.error(err);
      alert('Coverage calculation failed.');
    } finally {
      stopGen(actId);
    }
  };

  // Planning Storyboard Shots automatically
  const generateStoryboardShots = async (sceneId: number) => {
    const actId = `scene-planning-${sceneId}`;
    startGen(actId);
    try {
      const activeSc = parsedScenes.find(s => s.id === sceneId);
      if (!activeSc) return;

      const res = await geminiApi.generateText({
        contents: `Analyze this scene setting description and plan 4 logical visual storyboards shot boards. Focus on cinematic visual storytelling, optical configurations, framing, and dynamic motion.
Title: ${activeSc.title}
Scene Action / Narrative description:
${activeSc.description || ''}

Output a clean JSON matching the schema.`,
        responseMimeType: 'application/json',
        responseSchema: {
          type: 'OBJECT',
          properties: {
            shots: {
              type: 'ARRAY',
              items: {
                type: 'OBJECT',
                properties: {
                  id: { type: 'INTEGER' },
                  order: { type: 'INTEGER' },
                  duration: { type: 'STRING' },
                  type: { type: 'STRING' },
                  cameraAngle: { type: 'STRING' },
                  cameraMovement: { type: 'STRING' },
                  lighting: { type: 'STRING' },
                  timeOfDay: { type: 'STRING' },
                  script_snippet: { type: 'STRING' },
                  prompt: { type: 'STRING' }
                },
                required: ['id', 'order', 'duration', 'type', 'cameraAngle', 'cameraMovement', 'lighting', 'timeOfDay', 'script_snippet', 'prompt']
              }
            }
          },
          required: ['shots']
        }
      });

      const parsed = JSON.parse(res.text);
      if (parsed.shots) {
        updateScenesWithHistory(prev => prev.map(scene => 
          scene.id === sceneId ? { ...scene, shots: parsed.shots } : scene
        ));
        onRefreshUser();
      }
    } catch (err) {
      console.error(err);
      alert('Auto shot planning failed.');
    } finally {
      stopGen(actId);
    }
  };

  // Compiled playable list for slideshow presentation
  const getPlayableSlides = (): { image: string; text: string; subText: string; index: number }[] => {
    const list: any[] = [];
    if (selectedScene !== null) {
      const scene = parsedScenes.find(s => s.id === selectedScene);
      if (scene) {
        [...(scene.shots || [])]
          .sort((a,b) => (a.order ?? a.id) - (b.order ?? b.id))
          .forEach((shot, index) => {
            const fId = `${scene.id}-${shot.id}`;
            if (generatedImages[fId]) {
              list.push({
                image: generatedImages[fId],
                text: `Shot ${shot.order ?? shot.id} - ${shot.type}`,
                subText: shot.script_snippet ? `"${shot.script_snippet}"` : shot.prompt,
                index
              });
            }
          });
      }
    }
    return list;
  };

  const slides = getPlayableSlides();
  const totalShots = parsedScenes.reduce((count, scene) => count + (scene.shots?.length || 0), 0);
  const totalCharacters = characters.length;
  const totalLocations = locations.length;
  const totalAccessories = accessories.length;

  return (
    <div className="min-h-screen pb-8 bg-black text-zinc-100 flex flex-col antialiased font-sans transition-colors selection:bg-emerald-500 selection:text-black">
      <APIHealthMonitor componentName="Storyboard Workspace" onDismiss={() => {}} />
      
      {/* Dynamic Header */}
      <header className="sticky top-0 z-40 bg-zinc-950/85 backdrop-blur-md border-b border-zinc-800/80 px-6 py-4 flex items-center justify-between shadow-md">
        <div className="flex items-center gap-4">
          <button 
            onClick={onBackToDashboard} 
            className="p-1 px-3 bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-white rounded-lg text-xs font-bold transition-all flex items-center gap-1.5"
          >
            ← Back
          </button>
          <div className="h-5 w-px bg-zinc-800"></div>
          <div className="flex items-center gap-2">
            <Compass className="w-5 h-5 text-emerald-400 animate-pulse" />
            <span className="text-sm font-black uppercase tracking-[0.25em] text-emerald-400">Dundee</span>
            <span className="hidden xl:inline text-xs text-zinc-500 font-bold uppercase tracking-wider">Storyboard Studio</span>
          </div>
        </div>

        {/* Centered Navigation Tabs */}
        <nav className="hidden lg:flex items-center gap-1.5 bg-zinc-900 p-1 rounded-xl border border-zinc-850 shadow-inner absolute left-1/2 -translate-x-1/2">
          <button 
            onClick={() => setActiveTab('script')} 
            className={`px-4 py-2 rounded-lg text-xs font-black uppercase tracking-wider transition-all ${activeTab === 'script' ? 'bg-[#000] text-white border border-[#2e2e2e] shadow-sm' : 'text-zinc-400 hover:text-white bg-transparent border border-transparent'}`}
          >
            Setup
          </button>
          <button 
            onClick={() => setActiveTab('assets')} 
            className={`px-4 py-2 rounded-lg text-xs font-black uppercase tracking-wider transition-all ${activeTab === 'assets' ? 'bg-[#000] text-white border border-[#2e2e2e] shadow-sm' : 'text-zinc-400 hover:text-white bg-transparent border border-transparent'}`}
          >
            Cast
          </button>
          <button 
            onClick={() => {
              if (parsedScenes.length > 0 && selectedScene === null) {
                setSelectedScene(parsedScenes[0].id);
              }
              setActiveTab('storyboard');
            }} 
            className={`px-4 py-2 rounded-lg text-xs font-black uppercase tracking-wider transition-all ${activeTab === 'storyboard' ? 'bg-[#000] text-white border border-[#2e2e2e] shadow-sm' : 'text-zinc-400 hover:text-white bg-transparent border border-transparent'}`}
          >
            Canvas
          </button>
          <button 
            onClick={() => setActiveTab('settings')} 
            className={`px-4 py-2 rounded-lg text-xs font-black uppercase tracking-wider transition-all ${activeTab === 'settings' ? 'bg-[#000] text-white border border-[#2e2e2e] shadow-sm' : 'text-zinc-400 hover:text-white bg-transparent border border-transparent'}`}
          >
            Settings
          </button>
        </nav>

        {/* Action controls */}
        <div className="flex items-center gap-3">
          <div className="hidden md:flex items-center gap-2 mr-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping"></span>
            <span className="text-[10px] font-bold tracking-widest text-[#999] uppercase bg-[#141414] border border-[#2d2d2d] px-2.5 py-1.5 rounded-lg">
              SAAS REST API: <span className="text-emerald-400 font-mono font-bold ml-1">{userSession?.tokens_remaining ?? 0} CREDITS</span>
            </span>
          </div>

          <button onClick={handleUndo} className="p-2.5 bg-zinc-900 border border-zinc-850 hover:bg-zinc-800 text-zinc-300 rounded-xl transition-all" title="Undo change">
            <Undo2 className="w-4 h-4" />
          </button>

          {slides.length > 0 && (
            <button 
              onClick={() => { setActivePlayIdx(0); setIsPlaying(true); }}
              className="bg-emerald-500 hover:bg-emerald-450 text-zinc-950 px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all flex items-center gap-1.5 shadow"
            >
              <Play className="w-4 h-4 text-zinc-950 fill-zinc-950" /> Play Reel
            </button>
          )}

          <button onClick={resetAllState} className="p-2.5 bg-zinc-900 border border-zinc-850 hover:bg-red-950/20 hover:border-red-900/30 text-zinc-500 hover:text-red-400 rounded-xl transition-all" title="Clear All Workspace Data">
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </header>

      <main className="flex-1 p-6 md:p-8 overflow-y-auto custom-scrollbar">
        {activeTab === 'script' && (
          <SetupTab 
            script={script} setScript={setScript}
            projectName={projectName} setProjectName={setProjectName}
            scriptLanguage={scriptLanguage} setScriptLanguage={setScriptLanguage}
            selectedStyle={selectedStyle} setSelectedStyle={setSelectedStyle}
            aspectRatio={aspectRatio} setAspectRatio={setAspectRatio}
            selectedTone={selectedTone} setSelectedTone={setSelectedTone}
            selectedPalette={selectedPalette} setSelectedPalette={setSelectedPalette}
            selectedGlobalCamera={selectedGlobalCamera} setSelectedGlobalCamera={setSelectedGlobalCamera}
            selectedGlobalLensGroup={selectedGlobalLensGroup} setSelectedGlobalLensGroup={setSelectedGlobalLensGroup}
            selectedGlobalTime={selectedGlobalTime} setSelectedGlobalTime={setSelectedGlobalTime}
            selectedDirector={selectedDirector} setSelectedDirector={setSelectedDirector}
            selectedFilmStock={selectedFilmStock} setSelectedFilmStock={setSelectedFilmStock}
            selectedDiffusion={selectedDiffusion} setSelectedDiffusion={setSelectedDiffusion}
            selectedDof={selectedDof} setSelectedDof={setSelectedDof}
            selectedBoardStyle={selectedBoardStyle} setSelectedBoardStyle={setSelectedBoardStyle}
            enforceContinuity={enforceContinuity} setEnforceContinuity={setEnforceContinuity}
            extractScenes={extractScenes}
            isAnalyzingDna={isAnalyzingDna}
            dnaUrl={dnaUrl} setDnaUrl={setDnaUrl}
            handleAnalyzeDna={handleAnalyzeDna}
            handleScriptUpload={handleScriptUpload}
          />
        )}

        {activeTab === 'assets' && (
          <CastLocationsTab 
            characters={characters} setCharacters={setCharacters}
            locations={locations} setLocations={setLocations}
            accessories={accessories} setAccessories={setAccessories}
            updateCharacterInfo={updateCharacterField}
            generateCharacterPortrait={generateCharacterPortrait}
            handleSearchActorName={handleSearchActorName}
            generateCharacterBackstory={generateCharacterBackstory}
            handleRemoveCharacterImage={handleRemoveCharacterImage}
            handleUpdateCharacterImage={handleUpdateCharacterImage}
            removeCharacter={removeCharacter}
            generateLocationImage={generateLocationImage}
            handleUpdateLocationImage={handleUpdateLocationImage}
            updateLocationDescription={updateLocationDescription}
            removeLocation={removeLocation}
            generateAccessoryImage={generateAccessoryImage}
            handleUpdateAccessoryImage={handleUpdateAccessoryImage}
            updateAccessoryDescription={updateAccessoryDescription}
            removeAccessory={removeAccessory}
            enforceLikeness={enforceLikeness} setEnforceLikeness={setEnforceLikeness}
            generatingIds={generatingIds}
            setFullscreenImage={setFullscreenImage}
          />
        )}

        {activeTab === 'storyboard' && (
          <StoryboardTab 
            parsedScenes={parsedScenes}
            selectedScene={selectedScene}
            setSelectedScene={setSelectedScene}
            generatedImages={generatedImages}
            generatedCollages={generatedCollages}
            generatedBreakdowns={generatedBreakdowns}
            generatedCostumeBoards={generatedCostumeBoards}
            generatedVideos={generatedVideos}
            characters={characters}
            locations={locations}
            accessories={accessories}
            selectedStyle={selectedStyle}
            selectedTone={selectedTone}
            selectedPalette={selectedPalette}
            selectedGlobalTime={selectedGlobalTime}
            aspectRatio={aspectRatio}
            generatingIds={generatingIds}
            activeStagingShotId={activeStagingShotId}
            setActiveStagingShotId={setActiveStagingShotId}
            setFullscreenImage={setFullscreenImage}
            setActiveInpainting={setActiveInpainting}
            imageEditPrompts={imageEditPrompts}
            setImageEditPrompts={setImageEditPrompts}

            addNewScene={addNewScene}
            addNewShot={addNewShot}
            removeShot={removeShot}
            handleRemoveScene={handleRemoveScene}
            updateSceneDetails={updateSceneDetailsField}
            updateShotOrder={updateShotOrderField}
            updateShotBlocking={updateShotBlockingField}
            generateStoryboardShots={generateStoryboardShots}
            generateMultiCamCoverage={generateMultiCamCoverage}
            generatePropsBreakdown={generatePropsBreakdown}
            enhanceShotPrompt={enhanceShotPrompt}
            suggestShotAlternatives={suggestShotAlternatives}
            generateShotMultiCamOptions={generateShotMultiCamOptions}
            applyMultiCamAsFinal={applyMultiCamAsFinal}
            generateLastFrame={generateLastFrame}
            generateBlockingMap={generateBlockingMap}
            applyBlockingToImage={applyBlockingToImage}
            generateTechBreakdown={generateTechBreakdown}
            generateCollages={generateCollages}
            generateCostumeBoard={generateCostumeBoard}
            generateAIImage={generateAIImage}
            generateVeoVideo={generateVeoVideo}
            editAIImage={editAIImage}
            handleImportDressCode={handleImportDressCode}

            updateShotCamera={(s, sh, val) => updateShotField(s, sh, 'camera', val)}
            updateShotLens={(s, sh, val) => updateShotField(s, sh, 'lens', val)}
            updateShotType={(s, sh, val) => updateShotField(s, sh, 'type', val)}
            updateShotAngle={(s, sh, val) => updateShotField(s, sh, 'cameraAngle', val)}
            updateShotMovement={(s, sh, val) => updateShotField(s, sh, 'cameraMovement', val)}
            updateShotSpecialty={(s, sh, val) => updateShotField(s, sh, 'specialtyShot', val)}
            updateShotDuration={(s, sh, val) => updateShotField(s, sh, 'duration', val)}
            updateShotNotes={(s, sh, val) => updateShotField(s, sh, 'notes', val)}
            updateShotPrompt={(s, sh, val) => updateShotField(s, sh, 'prompt', val)}
            updateShotLighting={(s, sh, val) => updateShotField(s, sh, 'lighting', val)}
            updateShotTimeOfDay={(s, sh, val) => updateShotField(s, sh, 'timeOfDay', val)}
            updateShotLocation={(s, sh, val) => updateShotField(s, sh, 'locationId', val)}
          />
        )}

        {activeTab === 'settings' && (
          <SettingsTab 
            onExportLocalData={handleExportLocalData}
            getWorkspaceData={exportWorkspace}
            onImportWorkspaceData={importWorkspace}
          />
        )}
      </main>

      {/* Visual Workspace Status Bar */}
      <footer className="bg-zinc-950 border-t border-zinc-900/60 px-6 py-2.5 flex flex-wrap gap-y-2 items-center justify-between text-xs text-zinc-400 select-none font-mono" id="dundee-workspace-footer-status">
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-1.5">
            <span className="text-zinc-500 uppercase tracking-widest text-[9px] font-bold">Project:</span>
            <span className="text-zinc-200 font-bold max-w-[200px] truncate">{projectName || "Untitled Production"}</span>
          </div>
          <div className="hidden sm:flex items-center gap-1.5">
            <span className="text-zinc-500 uppercase tracking-widest text-[9px] font-bold">Aspect:</span>
            <span className="text-emerald-400 font-bold">{aspectRatio}</span>
          </div>
          <div className="hidden md:flex items-center gap-1.5">
            <span className="text-zinc-500 uppercase tracking-widest text-[9px] font-bold">Aesthetic:</span>
            <span className="text-zinc-300">{selectedStyle || "Standard"}</span>
          </div>
        </div>

        <div className="flex items-center gap-6">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1">
              <span className="text-zinc-500 text-[9px] uppercase font-bold">Scenes:</span>
              <span className="text-zinc-200 font-bold">{parsedScenes.length}</span>
            </div>
            <div className="flex items-center gap-1">
              <span className="text-zinc-500 text-[9px] uppercase font-bold">Shots:</span>
              <span className="text-zinc-200 font-bold">{totalShots}</span>
            </div>
            <div className="hidden sm:flex items-center gap-3 border-l border-zinc-800 pl-3">
              <span className="text-zinc-500 text-[9px] uppercase font-bold">Assets:</span>
              <span className="text-zinc-300">
                {totalCharacters} Cast / {totalLocations} Set / {totalAccessories} Props
              </span>
            </div>
          </div>

          <div className="flex items-center gap-4 border-l border-zinc-800 pl-4">
            {userSession && (
              <div className="text-[10px] uppercase tracking-wider text-emerald-400 font-bold bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-0.5 rounded-full">
                {userSession.tokens_remaining} CREDITS
              </div>
            )}
            <div className="text-zinc-500 font-bold tabular-nums tracking-wider select-none bg-zinc-900 border border-zinc-850 px-2 py-0.5 rounded-lg text-[11px]">
              {currentTime || "--:--:--"}
            </div>
          </div>
        </div>
      </footer>

      {/* Presentation Fullscreen Override */}
      {isPlaying && slides.length > 0 && (
        <div className="fixed inset-0 z-[150] bg-black flex flex-col items-center justify-center p-6 select-none font-sans">
          <button 
            onClick={() => setIsPlaying(false)} 
            className="absolute top-6 right-6 p-2 bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-white rounded-xl shadow-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="w-full max-w-5xl flex-1 flex flex-col items-center justify-center relative select-none">
            <img 
              src={slides[activePlayIdx].image} 
              alt="Slide" 
              className="max-w-full max-h-[75vh] object-contain rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.9)] border border-zinc-800"
            />
            <div className="absolute inset-y-0 left-0 w-32 flex items-center justify-start">
              <button 
                onClick={() => setActivePlayIdx(prev => Math.max(0, prev - 1))}
                className="p-3 bg-black/60 hover:bg-black/90 text-white rounded-r-xl border-r border-y border-zinc-800/80 transition-all opacity-0 hover:opacity-100 h-24"
              >
                ‹
              </button>
            </div>
            <div className="absolute inset-y-0 right-0 w-32 flex items-center justify-end">
              <button 
                onClick={() => setActivePlayIdx(prev => Math.min(slides.length - 1, prev + 1))}
                className="p-3 bg-black/60 hover:bg-black/90 text-white rounded-l-xl border-l border-y border-zinc-800/80 transition-all opacity-0 hover:opacity-100 h-24"
              >
                ›
              </button>
            </div>
          </div>

          <div className="w-full max-w-3xl text-center bg-zinc-950 p-5 rounded-2xl border border-zinc-850 mt-4 shadow-xl">
            <h2 className="text-emerald-400 text-lg font-black uppercase tracking-wider">{slides[activePlayIdx].text}</h2>
            <p className="text-zinc-300 text-sm italic font-serif mt-2 leading-relaxed">{slides[activePlayIdx].subText}</p>
            <div className="flex items-center justify-center gap-3 mt-4">
              <span className="text-xs font-mono font-bold text-zinc-650 bg-zinc-900 px-3 py-1 rounded-md border border-zinc-850">
                {activePlayIdx + 1} / {slides.length} PLANNED FRAMES
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Normal Fullscreen Image */}
      {fullscreenImage && (
        <div className="fixed inset-0 z-[160] bg-black/95 flex items-center justify-center p-6" onClick={() => setFullscreenImage(null)}>
          <button onClick={() => setFullscreenImage(null)} className="absolute top-6 right-6 p-2.5 bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-white rounded-xl shadow-lg transition-colors"><X className="w-5 h-5" /></button>
          <img src={fullscreenImage} alt="Fullscreen View" className="max-w-full max-h-full object-contain rounded-2xl border border-zinc-800 shadow-2xl" />
        </div>
      )}

      {/* Canvas Inpaint Area Overlay */}
      {activeInpainting && (
        <InpaintingEditor 
          imageUrl={activeInpainting.imageUrl} 
          isGenerating={generatingIds.has(activeInpainting.frameId)} 
          onClose={() => setActiveInpainting(null)} 
          onApply={(prompt, maskDataUrl) => editAIImage(activeInpainting.sceneId, activeInpainting.shotId, prompt, maskDataUrl)}
        />
      )}
    </div>
  );

  function updateCharacterField(id: number, field: keyof Character, value: any) {
    setCharacters(prev => prev.map(c => 
      c.id === id ? { ...c, [field]: value } : c
    ));
  }

  function updateLocationDescription(id: number, desc: string) {
    setLocations(prev => prev.map(l => 
      l.id === id ? { ...l, description: desc } : l
    ));
  }

  function updateAccessoryDescription(id: number, desc: string) {
    setAccessories(prev => prev.map(a => 
      a.id === id ? { ...a, description: desc } : a
    ));
  }
}
export {};
