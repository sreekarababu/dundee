import React, { useState } from 'react';
import { 
  Users, UserPlus, Search, ScanFace, X, Wand2, Loader2, Sparkles, 
  MapPin, Camera, ImageIcon, Upload, Trash2, Plus, Box, RefreshCw 
} from 'lucide-react';
import { Character, LocationModel, AccessoryModel } from '../../types/dundee';

interface CastLocationsTabProps {
  characters: Character[];
  setCharacters: React.Dispatch<React.SetStateAction<Character[]>>;
  locations: LocationModel[];
  setLocations: React.Dispatch<React.SetStateAction<LocationModel[]>>;
  accessories: AccessoryModel[];
  setAccessories: React.Dispatch<React.SetStateAction<AccessoryModel[]>>;
  updateCharacterInfo: (id: number, field: any, value: any) => void;
  generateCharacterPortrait: (id: number, name: string, gender: string, age: string, description: string) => void;
  handleSearchActorName: (id: number | null, name: string) => void;
  generateCharacterBackstory: (id: number) => void;
  handleRemoveCharacterImage: (charId: number, imageIndex: number) => void;
  handleUpdateCharacterImage: (id: number, e: any) => void;
  removeCharacter: (id: number) => void;
  generateLocationImage: (id: number, name: string, description: string) => void;
  handleUpdateLocationImage: (id: number, e: any) => void;
  updateLocationDescription: (id: number, desc: string) => void;
  removeLocation: (id: number) => void;
  generateAccessoryImage: (id: number, name: string, description: string) => void;
  handleUpdateAccessoryImage: (id: number, e: any) => void;
  updateAccessoryDescription: (id: number, desc: string) => void;
  removeAccessory: (id: number) => void;
  enforceLikeness: boolean;
  setEnforceLikeness: (b: boolean) => void;
  generatingIds: Set<string>;
  setFullscreenImage: (s: string | null) => void;
}

export default function CastLocationsTab({
  characters, setCharacters,
  locations, setLocations,
  accessories, setAccessories,
  updateCharacterInfo,
  generateCharacterPortrait,
  handleSearchActorName,
  generateCharacterBackstory,
  handleRemoveCharacterImage,
  handleUpdateCharacterImage,
  removeCharacter,
  generateLocationImage,
  handleUpdateLocationImage,
  updateLocationDescription,
  removeLocation,
  generateAccessoryImage,
  handleUpdateAccessoryImage,
  updateAccessoryDescription,
  removeAccessory,
  enforceLikeness, setEnforceLikeness,
  generatingIds,
  setFullscreenImage
}: CastLocationsTabProps) {
  // Local temporary inputs
  const [newCharName, setNewCharName] = useState('');
  const [newCharGender, setNewCharGender] = useState('');
  const [newCharAge, setNewCharAge] = useState('');
  const [newCharDescription, setNewCharDescription] = useState('');
  const [newCharImage, setNewCharImage] = useState<any>(null);

  const [newLocationName, setNewLocationName] = useState('');
  const [newLocationDescription, setNewLocationDescription] = useState('');
  const [newLocationImage, setNewLocationImage] = useState<any>(null);

  const [newAccessoryName, setNewAccessoryName] = useState('');
  const [newAccessoryDescription, setNewAccessoryDescription] = useState('');
  const [newAccessoryImage, setNewAccessoryImage] = useState<any>(null);

  const [expandedChars, setExpandedChars] = useState<Set<number>>(new Set());

  const toggleChar = (id: number) => {
    setExpandedChars(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const fileToBase64Loader = (file: File) => {
    return new Promise<string>((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.readAsDataURL(file);
    });
  };

  const handleImageUploadLocal = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const url = await fileToBase64Loader(file);
      setNewCharImage({ url, data: url.split(',')[1], mimeType: file.type });
    }
  };

  const handleLocationImageUploadLocal = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const url = await fileToBase64Loader(file);
      setNewLocationImage({ url, data: url.split(',')[1], mimeType: file.type });
    }
  };

  const handleAccessoryImageUploadLocal = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const url = await fileToBase64Loader(file);
      setNewAccessoryImage({ url, data: url.split(',')[1], mimeType: file.type });
    }
  };

  const handleAddCharacterLocal = () => {
    const name = newCharName.trim();
    if (name) {
      let targetId = Date.now();
      const existing = characters.find(c => c.name.toLowerCase() === name.toLowerCase());
      if (existing) targetId = existing.id;

      setCharacters(prev => {
        const idx = prev.findIndex(c => c.id === targetId);
        if (idx >= 0) {
          const updated = [...prev];
          updated[idx] = {
            ...updated[idx],
            gender: newCharGender || updated[idx].gender,
            age: newCharAge || updated[idx].age,
            description: newCharDescription || updated[idx].description,
            images: newCharImage ? [...(updated[idx].images || []), newCharImage] : (updated[idx].images || [])
          };
          return updated;
        }
        return [...prev, {
          id: targetId,
          name,
          gender: newCharGender,
          age: newCharAge,
          description: newCharDescription,
          images: newCharImage ? [newCharImage] : []
        }];
      });
      setExpandedChars(prev => new Set(prev).add(targetId));
      setNewCharName('');
      setNewCharGender('');
      setNewCharAge('');
      setNewCharDescription('');
      setNewCharImage(null);
    }
  };

  const handleAddLocationLocal = () => {
    const name = newLocationName.trim();
    if (name) {
      setLocations(prev => {
        if (prev.some(l => l.name.toLowerCase() === name.toLowerCase())) return prev;
        return [...prev, { id: Date.now(), name, description: newLocationDescription, image: newLocationImage }];
      });
      setNewLocationName('');
      setNewLocationDescription('');
      setNewLocationImage(null);
    }
  };

  const handleAddAccessoryLocal = () => {
    const name = newAccessoryName.trim();
    if (name) {
      setAccessories(prev => {
        if (prev.some(a => a.name.toLowerCase() === name.toLowerCase())) return prev;
        return [...prev, { id: Date.now(), name, description: newAccessoryDescription, image: newAccessoryImage }];
      });
      setNewAccessoryName('');
      setNewAccessoryDescription('');
      setNewAccessoryImage(null);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start h-full">
      {/* LEFT COLUMN: Cast Management */}
      <div className="lg:col-span-4 bg-zinc-900/40 backdrop-blur-md border border-zinc-800/60 rounded-2xl p-6 flex flex-col shrink-0 mb-8 lg:mb-0">
        <h2 className="text-sm font-black flex items-center gap-2 mb-6 text-zinc-300 uppercase tracking-widest">
          <Users className="w-5 h-5 text-purple-400" /> Cast Models
        </h2>

        <div className="flex flex-col gap-4 mb-6">
          <div className="flex gap-3">
            <div className="flex-1 relative flex items-center">
              <input 
                type="text" 
                placeholder="Character Name" 
                value={newCharName} 
                onChange={(e) => setNewCharName(e.target.value)} 
                className="w-full bg-zinc-950/50 border border-zinc-800/80 rounded-xl pl-4 pr-10 py-3.5 text-sm focus:outline-none focus:border-purple-500/50 text-zinc-200 transition-all font-bold"
              />
              <button 
                onClick={() => handleSearchActorName(null, newCharName)}
                disabled={!newCharName.trim()}
                className="absolute right-2 text-zinc-500 hover:text-purple-400 p-1.5 rounded-lg disabled:opacity-50 transition-colors"
                title="Search Actor Name"
              >
                <Search className="w-4 h-4" />
              </button>
            </div>
            {newCharImage ? (
              <div className="relative w-[50px] h-[50px] shrink-0 group/newchar">
                <img 
                  src={newCharImage.url} 
                  alt="Avatar" 
                  className="w-full h-full object-cover rounded-xl cursor-pointer border-2 border-zinc-750 hover:border-purple-500 transition-all"
                  onClick={() => setFullscreenImage(newCharImage.url)}
                />
                <button 
                  onClick={() => setNewCharImage(null)}
                  className="absolute -top-1.5 -right-1.5 bg-red-500 hover:bg-red-600 p-1 rounded-full text-white shadow-lg transition-all z-10"
                >
                  <X className="w-2.5 h-2.5" />
                </button>
              </div>
            ) : (
              <label className="cursor-pointer bg-zinc-800 hover:bg-zinc-700 border border-zinc-700/50 text-zinc-300 px-4 py-3 rounded-xl transition-colors flex items-center justify-center min-w-[54px]">
                <ScanFace className="w-5 h-4 text-purple-400" />
                <input type="file" accept="image/*" className="hidden" onChange={handleImageUploadLocal} />
              </label>
            )}
          </div>

          <div className="flex gap-3">
            <select 
              value={newCharGender} 
              onChange={(e) => setNewCharGender(e.target.value)} 
              className="flex-1 bg-zinc-700 border border-zinc-600 rounded-xl px-4 py-3.5 text-sm focus:outline-none text-white font-medium"
            >
              <option value="">Gender</option>
              <option value="Male">Male</option>
              <option value="Female">Female</option>
              <option value="Non-Binary">Non-Binary</option>
            </select>
            <input 
              type="text" 
              placeholder="Age" 
              value={newCharAge} 
              onChange={(e) => setNewCharAge(e.target.value)} 
              className="w-24 bg-zinc-950/50 border border-zinc-800/80 rounded-xl px-4 py-3.5 text-sm focus:outline-none text-zinc-300 text-center font-bold" 
            />
          </div>

          <textarea 
            placeholder="Visual traits, wardrobe & look styles..." 
            value={newCharDescription} 
            onChange={(e) => setNewCharDescription(e.target.value)} 
            className="w-full bg-zinc-950/50 border border-zinc-800/80 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-purple-500/50 text-zinc-300 resize-none h-24 custom-scrollbar" 
          />

          <button onClick={handleAddCharacterLocal} disabled={!newCharName.trim()} className="w-full bg-zinc-850 hover:bg-zinc-750 border border-zinc-700/60 disabled:opacity-50 text-zinc-100 py-3.5 rounded-xl text-xs font-bold uppercase tracking-wider transition-all flex items-center justify-center gap-2">
            <UserPlus className="w-4 h-4" /> Add Cast Member
          </button>
        </div>

        {/* Characters List details */}
        <div className="flex flex-col gap-3 w-full max-h-[500px] overflow-y-auto custom-scrollbar pr-2">
          {characters.map(char => {
            const isExpanded = expandedChars.has(char.id);
            const isBackstoryGen = generatingIds.has(`backstory-${char.id}`);

            return (
              <div key={char.id} className="flex flex-col bg-zinc-950/80 border border-zinc-800/60 rounded-xl transition-all">
                <div className="flex items-center justify-between p-3.5 cursor-pointer hover:bg-zinc-900/40" onClick={() => toggleChar(char.id)}>
                  <div className="flex items-center gap-3">
                    {char.images && char.images.length > 0 ? (
                      <div className="flex gap-1">
                        {char.images.slice(0, 3).map((img, idx) => (
                          <img 
                            key={idx} 
                            src={img.url} 
                            alt={`${char.name}`} 
                            className="w-8 h-8 rounded-full object-cover border border-zinc-800 cursor-pointer" 
                            onClick={(e) => { e.stopPropagation(); setFullscreenImage(img.url); }}
                          />
                        ))}
                      </div>
                    ) : (
                      <div className="w-8 h-8 rounded-full bg-zinc-800 border border-zinc-700 flex items-center justify-center text-xs font-black text-zinc-400 capitalize">
                        {char.name.charAt(0)}
                      </div>
                    )}
                    <span className="font-bold text-sm text-zinc-200">{char.name}</span>
                  </div>
                  <div className="flex items-center gap-2 select-none">
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        generateCharacterPortrait(char.id, char.name, char.gender, char.age, char.description);
                      }} 
                      className="text-zinc-500 hover:text-purple-400 p-1 rounded hover:bg-zinc-800 transition-colors"
                      title="Generate Face Profile Sketch"
                    >
                      <Wand2 className="w-4 h-4" />
                    </button>
                    <label onClick={(e) => e.stopPropagation()} className="cursor-pointer text-zinc-500 hover:text-purple-400 p-1 rounded hover:bg-zinc-800 transition-colors" title="Upload actor image">
                      <ScanFace className="w-4 h-4" />
                      <input type="file" accept="image/*" className="hidden" onChange={(e) => handleUpdateCharacterImage(char.id, e)} />
                    </label>
                    <button 
                      onClick={(e) => { e.stopPropagation(); removeCharacter(char.id); }} 
                      className="text-zinc-500 hover:text-red-400 p-1 rounded"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {isExpanded && (
                  <div className="p-3.5 pt-0 border-t border-zinc-800/40 space-y-3">
                    <div className="flex gap-2 mt-3">
                      <input 
                        type="text" 
                        value={char.gender || ''} 
                        onChange={(e) => updateCharacterInfo(char.id, 'gender', e.target.value)} 
                        placeholder="Gender"
                        className="bg-zinc-900 border border-zinc-800 rounded-lg px-2.5 py-1.5 text-xs text-white flex-1"
                      />
                      <input 
                        type="text" 
                        value={char.age || ''} 
                        onChange={(e) => updateCharacterInfo(char.id, 'age', e.target.value)} 
                        placeholder="Age"
                        className="bg-zinc-900 border border-zinc-800 rounded-lg px-2.5 py-1.5 text-xs text-white w-16 text-center"
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-[9px] uppercase tracking-wider font-bold text-zinc-500">Character Description</span>
                      <button 
                        onClick={() => generateCharacterBackstory(char.id)}
                        disabled={isBackstoryGen}
                        className="text-[9px] bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 border border-blue-500/30 rounded px-2 py-1 flex items-center gap-1"
                      >
                        {isBackstoryGen ? <Loader2 className="w-2.5 h-2.5 animate-spin" /> : <Sparkles className="w-2.5 h-2.5" />}
                        Generate Backstory
                      </button>
                    </div>
                    <textarea 
                      value={char.description || ''} 
                      onChange={(e) => updateCharacterInfo(char.id, 'description', e.target.value)}
                      placeholder="Cast description..."
                      className="w-full bg-zinc-900 border border-zinc-800 rounded-xl p-3 text-xs text-zinc-300 resize-y h-20"
                    />
                  </div>
                )}
              </div>
            );
          })}
        </div>

        <label className="flex items-center gap-2 mt-4 cursor-pointer text-xs font-semibold text-zinc-400 hover:text-zinc-200 transition-colors p-2 bg-zinc-950/40 rounded-xl border border-zinc-800 shadow-inner">
          <input 
            type="checkbox" 
            checked={enforceLikeness} 
            onChange={(e) => setEnforceLikeness(e.target.checked)} 
            className="rounded border-zinc-700 bg-zinc-800 text-purple-500 focus:ring-purple-500/20 focus:ring-offset-zinc-900 w-4 h-4 ml-1"
          />
          Enforce Strict Actor Facematch
        </label>
      </div>

      {/* RIGHT COLUMN: Environments & Accessories */}
      <div className="lg:col-span-8 flex flex-col gap-6 w-full">
        {/* Environment Models */}
        <div className="bg-zinc-900/40 backdrop-blur-md border border-zinc-800/60 rounded-2xl p-6 shadow-sm">
          <h2 className="text-sm font-black uppercase tracking-widest flex items-center gap-2 mb-6 text-zinc-200">
            <MapPin className="w-5 h-5 text-emerald-500" /> Environment Models
          </h2>

          <div className="flex flex-col gap-4">
            <div className="flex gap-3">
              <input 
                type="text" 
                placeholder="Location Name (e.g. INT. STUDY ROOM - DAY)" 
                value={newLocationName} 
                onChange={(e) => setNewLocationName(e.target.value)} 
                className="flex-1 bg-zinc-950/50 border border-zinc-800/80 rounded-xl px-4 py-3.5 text-sm focus:outline-none focus:border-emerald-500/50 text-zinc-200 transition-all font-bold"
              />
              {newLocationImage ? (
                <div className="relative w-[50px] h-[50px] shrink-0 group/newloc">
                  <img src={newLocationImage.url} alt="Env thumbnail" className="w-full h-full object-cover rounded-xl" />
                  <button onClick={() => setNewLocationImage(null)} className="absolute -top-1.5 -right-1.5 bg-red-500 text-white p-1 rounded-full"><X className="w-2.5 h-2.5" /></button>
                </div>
              ) : (
                <label className="cursor-pointer bg-zinc-800 hover:bg-zinc-700 border border-zinc-700/50 text-zinc-300 px-4 py-3 rounded-xl transition-colors flex items-center justify-center min-w-[54px]" title="Upload reference photo">
                  <Camera className="w-5 h-5 text-emerald-400" />
                  <input type="file" accept="image/*" className="hidden" onChange={handleLocationImageUploadLocal} />
                </label>
              )}
            </div>
            <div className="flex flex-col sm:flex-row gap-3">
              <textarea 
                placeholder="Environment architecture, props, details, context description..." 
                value={newLocationDescription} 
                onChange={(e) => setNewLocationDescription(e.target.value)} 
                className="flex-1 bg-zinc-950/50 border border-zinc-800/80 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-emerald-500/50 text-zinc-200 transition-all resize-none h-[52px] custom-scrollbar" 
              />
              <button onClick={handleAddLocationLocal} disabled={!newLocationName.trim()} className="bg-zinc-800 hover:bg-zinc-700 border border-zinc-700/50 disabled:opacity-50 text-zinc-100 px-8 py-3 rounded-xl text-xs font-bold uppercase tracking-wider transition-colors flex items-center justify-center gap-2 whitespace-nowrap h-[52px]">
                <Plus className="w-4 h-4" /> Add Location
              </button>
            </div>
          </div>

          {/* Locations Rendering grid */}
          {locations.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-8 max-h-[450px] overflow-y-auto custom-scrollbar pr-2">
              {locations.map(loc => {
                const isLocGenerating = generatingIds.has(`loc-gen-${loc.id}`);
                return (
                  <div key={loc.id} className="flex flex-col bg-zinc-950/80 border border-zinc-800/60 rounded-2xl overflow-hidden group shadow">
                    <div className="relative aspect-video bg-zinc-900 flex items-center justify-center overflow-hidden min-h-[170px]">
                      {isLocGenerating && (
                        <div className="absolute inset-0 bg-zinc-950/80 backdrop-blur-md flex flex-col items-center justify-center z-10 text-emerald-400 font-bold uppercase text-[9px] tracking-widest">
                          <Loader2 className="w-6 h-6 animate-spin mb-1" /> Generating Studio Still
                        </div>
                      )}
                      {loc.image ? (
                        <>
                          <img src={loc.image.url} alt={loc.name} className="w-full h-full object-cover" />
                          <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex items-center justify-center gap-3 backdrop-blur-sm transition-all duration-200">
                            <button onClick={() => generateLocationImage(loc.id, loc.name, loc.description)} disabled={isLocGenerating} className="bg-zinc-800/90 text-zinc-200 p-2.5 rounded-xl hover:bg-zinc-700"><RefreshCw className="w-4 h-4" /></button>
                            <label className="cursor-pointer bg-zinc-800/90 text-zinc-250 p-2.5 rounded-xl hover:bg-zinc-700">
                              <Upload className="w-4 h-4" />
                              <input type="file" accept="image/*" className="hidden" onChange={(e) => handleUpdateLocationImage(loc.id, e)} />
                            </label>
                            <button onClick={() => setLocations(prev => prev.map(l => l.id === loc.id ? { ...l, image: null } : l))} className="bg-red-950/80 text-red-400 p-2.5 rounded-xl hover:bg-red-900"><X className="w-4 h-4" /></button>
                          </div>
                        </>
                      ) : (
                        <div className="flex flex-col items-center text-center p-4">
                          <MapPin className="w-8 h-8 text-zinc-700 mb-3" />
                          <div className="flex gap-2">
                            <button onClick={() => generateLocationImage(loc.id, loc.name, loc.description)} disabled={isLocGenerating} className="bg-zinc-800 text-xs px-3.5 py-2 rounded-lg border border-zinc-700 text-zinc-300 flex items-center gap-1 font-bold">
                              <Wand2 className="w-3.5 h-3.5" /> Auto-Gen Still
                            </button>
                            <label className="cursor-pointer bg-zinc-800 text-xs px-3.5 py-2 rounded-lg border border-zinc-700 text-zinc-300 flex items-center gap-1 font-bold">
                              <Upload className="w-3.5 h-3.5" /> Upload
                              <input type="file" accept="image/*" className="hidden" onChange={(e) => handleUpdateLocationImage(loc.id, e)} />
                            </label>
                          </div>
                        </div>
                      )}
                    </div>
                    <div className="p-4 flex flex-col gap-3">
                      <div className="flex items-center justify-between gap-3">
                        <span className="text-base font-black truncate text-zinc-200 uppercase">{loc.name}</span>
                        <button onClick={() => removeLocation(loc.id)} className="text-zinc-500 hover:text-red-450 p-1.5 rounded"><Trash2 className="w-4 h-4" /></button>
                      </div>
                      <textarea
                        value={loc.description || ''}
                        onChange={(e) => updateLocationDescription(loc.id, e.target.value)}
                        placeholder="Environment features..."
                        className="w-full bg-zinc-900 border border-zinc-800/80 rounded-xl px-3 py-2 text-xs text-zinc-300 resize-none h-16 custom-scrollbar"
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="opacity-30 border-2 border-dashed border-zinc-800 text-center py-10 rounded-xl mt-6 font-mono text-xs uppercase tracking-widest text-zinc-500">
               No environments mapped
            </div>
          )}
        </div>

        {/* Hero Props */}
        <div className="bg-zinc-900/40 backdrop-blur-md border border-zinc-800/60 rounded-2xl p-6 shadow-sm">
          <h2 className="text-sm font-black uppercase tracking-widest flex items-center gap-2 mb-6 text-zinc-200">
            <Box className="w-5 h-5 text-blue-500" /> Key Accessories & Props
          </h2>

          <div className="flex flex-col gap-4">
            <div className="flex gap-3">
              <input 
                type="text" 
                placeholder="Accessory / Prop Name (e.g. Gold Pocket Watch)" 
                value={newAccessoryName} 
                onChange={(e) => setNewAccessoryName(e.target.value)} 
                className="flex-1 bg-zinc-950/50 border border-zinc-800/80 rounded-xl px-4 py-3.5 text-sm focus:outline-none focus:border-blue-500/50 text-zinc-200 transition-all font-bold"
              />
              {newAccessoryImage ? (
                <div className="relative w-[50px] h-[50px] shrink-0 group/newacc">
                  <img src={newAccessoryImage.url} alt="Prop template" className="w-full h-full object-cover rounded-xl" />
                  <button onClick={() => setNewAccessoryImage(null)} className="absolute -top-1.5 -right-1.5 bg-red-500 text-white p-1 rounded-full"><X className="w-2.5 h-2.5" /></button>
                </div>
              ) : (
                <label className="cursor-pointer bg-zinc-800 hover:bg-zinc-700 border border-zinc-700/50 text-zinc-300 px-4 py-3 rounded-xl transition-colors flex items-center justify-center min-w-[54px]">
                  <Camera className="w-5 h-5 text-blue-400" />
                  <input type="file" accept="image/*" className="hidden" onChange={handleAccessoryImageUploadLocal} />
                </label>
              )}
            </div>
            <div className="flex flex-col sm:flex-row gap-3">
              <textarea 
                placeholder="Hero prop visual details, mechanical characteristics..." 
                value={newAccessoryDescription} 
                onChange={(e) => setNewAccessoryDescription(e.target.value)} 
                className="flex-1 bg-zinc-950/50 border border-zinc-800/80 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-blue-500/50 text-zinc-200 transition-all resize-none h-[52px] custom-scrollbar" 
              />
              <button onClick={handleAddAccessoryLocal} disabled={!newAccessoryName.trim()} className="bg-zinc-800 hover:bg-zinc-700 border border-zinc-700/50 disabled:opacity-50 text-zinc-100 px-8 py-3 rounded-xl text-xs font-bold uppercase tracking-wider transition-colors flex items-center justify-center gap-2 whitespace-nowrap h-[52px]">
                <Plus className="w-4 h-4" /> Add Item
              </button>
            </div>
          </div>

          {/* Table list of Accessories */}
          {accessories.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-8 max-h-[400px] overflow-y-auto custom-scrollbar pr-2">
              {accessories.map(acc => {
                const isAccGenerating = generatingIds.has(`acc-gen-${acc.id}`);
                return (
                  <div key={acc.id} className="flex flex-col bg-zinc-950/80 border border-zinc-800/60 rounded-2xl overflow-hidden group shadow">
                    <div className="relative aspect-video bg-zinc-900 flex items-center justify-center overflow-hidden min-h-[170px]">
                      {isAccGenerating && (
                        <div className="absolute inset-0 bg-zinc-950/80 backdrop-blur-md flex flex-col items-center justify-center z-10 text-blue-400 font-bold uppercase text-[9px] tracking-widest">
                          <Loader2 className="w-6 h-6 animate-spin mb-1" /> Generating Concept Art
                        </div>
                      )}
                      {acc.image ? (
                        <>
                          <img src={acc.image.url} alt={acc.name} className="w-full h-full object-cover" />
                          <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex items-center justify-center gap-3 backdrop-blur-sm transition-all duration-200">
                            <button onClick={() => generateAccessoryImage(acc.id, acc.name, acc.description)} disabled={isAccGenerating} className="bg-zinc-800/90 text-zinc-200 p-2.5 rounded-xl hover:bg-zinc-700"><RefreshCw className="w-4 h-4" /></button>
                            <label className="cursor-pointer bg-zinc-800/90 text-zinc-250 p-2.5 rounded-xl hover:bg-zinc-700">
                              <Upload className="w-4 h-4" />
                              <input type="file" accept="image/*" className="hidden" onChange={(e) => handleUpdateAccessoryImage(acc.id, e)} />
                            </label>
                            <button onClick={() => setAccessories(prev => prev.map(a => a.id === acc.id ? { ...a, image: null } : a))} className="bg-red-950/80 text-red-400 p-2.5 rounded-xl hover:bg-red-900"><X className="w-4 h-4" /></button>
                          </div>
                        </>
                      ) : (
                        <div className="flex flex-col items-center text-center p-4">
                          <Box className="w-8 h-8 text-zinc-700 mb-3" />
                          <div className="flex gap-2">
                            <button onClick={() => generateAccessoryImage(acc.id, acc.name, acc.description)} disabled={isAccGenerating} className="bg-zinc-800 text-xs px-3.5 py-2 rounded-lg border border-zinc-700 text-zinc-300 flex items-center gap-1 font-bold">
                              <Wand2 className="w-3.5 h-3.5" /> Auto-Gen Prop
                            </button>
                            <label className="cursor-pointer bg-zinc-800 text-xs px-3.5 py-2 rounded-lg border border-zinc-700 text-zinc-300 flex items-center gap-1 font-bold">
                              <Upload className="w-3.5 h-3.5" /> Upload
                              <input type="file" accept="image/*" className="hidden" onChange={(e) => handleUpdateAccessoryImage(acc.id, e)} />
                            </label>
                          </div>
                        </div>
                      )}
                    </div>
                    <div className="p-4 flex flex-col gap-3">
                      <div className="flex items-center justify-between gap-3">
                        <span className="text-base font-black truncate text-zinc-200 uppercase">{acc.name}</span>
                        <button onClick={() => removeAccessory(acc.id)} className="text-zinc-500 hover:text-red-450 p-1.5 rounded"><Trash2 className="w-4 h-4" /></button>
                      </div>
                      <textarea
                        value={acc.description || ''}
                        onChange={(e) => updateAccessoryDescription(acc.id, e.target.value)}
                        placeholder="Prop detail metadata..."
                        className="w-full bg-zinc-900 border border-zinc-800/80 rounded-xl px-3 py-2 text-xs text-zinc-300 resize-none h-16 custom-scrollbar"
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="opacity-30 border-2 border-dashed border-zinc-800 text-center py-10 rounded-xl mt-6 font-mono text-xs uppercase tracking-widest text-zinc-500">
               No hero accessories set
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
