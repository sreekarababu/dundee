import React, { useState, useEffect, useRef } from 'react';
import { 
    Film, Image as ImageIcon, Download, Settings, RefreshCw, Wand2, Loader2, Camera, 
    UserPlus, Upload, X, Users, Plus, Save, Undo2, Trash2, FolderOpen, Cloud, 
    Images, MapPin, File, LayoutTemplate, Aperture, Video, Info, Activity, LayoutDashboard,
    Play, ChevronLeft, ChevronRight, Volume2, Square, Sparkles, SlidersHorizontal, FileText,
    Clapperboard, Boxes, MessageSquareQuote, ListChecks, ChevronDown, ChevronUp,
    User, Box, Crosshair, Navigation, Lightbulb, Star, Maximize, Paintbrush, Eraser, Search, ScanFace
} from 'lucide-react';

const originalFetch = window.fetch;
window.fetch = async (url, options) => {
    if (typeof url === 'string' && url.includes('gemini-2.5-flash-image-preview')) {
        try {
            console.log("INTERCEPTING IMAGE GENERATION FOR IMAGEROUTER.IO");
            let optionsBody = {};
            if (options && options.body) {
                optionsBody = JSON.parse(options.body);
            }
            
            let promptText = '';
            const parts = optionsBody.contents?.[0]?.parts;
            if (Array.isArray(parts)) {
                promptText = parts
                    .filter(p => p.text)
                    .map(p => p.text)
                    .join('\n');
            }
            
            if (!promptText) {
                promptText = "cinematic scene, high quality, masterpiece";
            }
            
            let size = "1024x1024";
            const apiAspectRatio = optionsBody.generationConfig?.imageConfig?.aspectRatio || "1:1";
            if (apiAspectRatio === "16:9") {
                size = "1024x576";
            } else if (apiAspectRatio === "9:16") {
                size = "576x1024";
            } else if (apiAspectRatio === "4:3") {
                size = "1024x768";
            } else if (apiAspectRatio === "3:4") {
                size = "768x1024";
            }
            
            const routerKey = "16c88c0ad44d20615af764b5c41e5edd0f52bcda76796dd32f6f6e9834b1b6dc";
            const routerModel = "google/nano-banana-2:free";
            if (routerModel.includes("nano-banana-2")) {
                size = "512x512";
            }
            const imagerouterUrl = "https://api.imagerouter.io/v1/openai/images/generations";
            
            console.log("Calling imagerouter.io with size:", size, "model:", routerModel);
            
            let useFallback = false;
            let b64Data = '';
            
            try {
                const imagerouterResp = await originalFetch(imagerouterUrl, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${routerKey}`
                    },
                    body: JSON.stringify({
                        prompt: promptText,
                        model: routerModel,
                        size: size,
                        response_format: "b64_json"
                    })
                });
                
                if (imagerouterResp.ok) {
                    const routerResult = await imagerouterResp.json();
                    if (routerResult.error) {
                        console.warn("ImageRouter returned error inside JSON:", routerResult.error);
                        useFallback = true;
                    } else {
                        b64Data = routerResult.data?.[0]?.b64_json || await (async () => {
                            const imgUrl = routerResult.data?.[0]?.url;
                            if (!imgUrl) throw new Error("No image data");
                            const imgResp = await originalFetch(imgUrl);
                            const buffer = await imgResp.arrayBuffer();
                            let binary = '';
                            const bytes = new Uint8Array(buffer);
                            for (let i = 0; i < bytes.byteLength; i++) {
                                binary += String.fromCharCode(bytes[i]);
                            }
                            return window.btoa(binary);
                        })();
                    }
                } else {
                    const errText = await imagerouterResp.text();
                    console.warn("ImageRouter response status not OK:", imagerouterResp.status, errText);
                    useFallback = true;
                }
            } catch (routerErr) {
                console.warn("ImageRouter request threw error:", routerErr);
                useFallback = true;
            }
            
            if (useFallback || !b64Data) {
                console.log("FALLING BACK TO POLLINATIONS.AI (FREE MULTIPLEXER)");
                let w = 1024, h = 1024;
                if (apiAspectRatio === "16:9") { w = 1024; h = 576; }
                else if (apiAspectRatio === "9:16") { w = 576; h = 1024; }
                else if (apiAspectRatio === "4:3") { w = 1024; h = 768; }
                else if (apiAspectRatio === "3:4") { w = 768; h = 1024; }
                
                const pollPrompt = encodeURIComponent(promptText);
                const pollUrl = `https://image.pollinations.ai/prompt/${pollPrompt}?width=${w}&height=${h}&nologo=true&seed=${Math.floor(Math.random() * 1000000)}`;
                
                const pollResp = await originalFetch(pollUrl);
                if (!pollResp.ok) {
                    throw new Error("Both ImageRouter and Pollinations.ai fallback failed.");
                }
                const buffer = await pollResp.arrayBuffer();
                let binary = '';
                const bytes = new Uint8Array(buffer);
                for (let i = 0; i < bytes.byteLength; i++) {
                    binary += String.fromCharCode(bytes[i]);
                }
                b64Data = window.btoa(binary);
            }
            
            const geminiResponse = {
                candidates: [{
                    content: {
                        parts: [{
                            inlineData: {
                                mimeType: "image/png",
                                data: b64Data
                            }
                        }]
                    }
                }]
            };
            
            return new Response(JSON.stringify(geminiResponse), {
                status: 200,
                headers: { 'Content-Type': 'application/json' }
            });
            
        } catch (e) {
            console.error("Image Generation Interceptor Error:", e);
            return new Response(JSON.stringify({
                error: { message: "Image generation failed: " + e.message }
            }), {
                status: 500,
                headers: { 'Content-Type': 'application/json' }
            });
        }
    }
    return originalFetch(url, options);
};

const INITIAL_SCENES = [];

const extractFramesFromVideo = (file, numFrames = 4) => {
    return new Promise((resolve, reject) => {
        const video = document.createElement('video');
        const url = URL.createObjectURL(file);
        let frames = [];
        let currentFrame = 1;
        let interval = 0;

        video.onloadeddata = () => {
            interval = video.duration / (numFrames + 1);
            video.currentTime = interval;
        };

        video.onseeked = () => {
            const canvas = document.createElement('canvas');
            const scale = Math.min(1, 1280 / Math.max(video.videoWidth, video.videoHeight));
            canvas.width = video.videoWidth * scale;
            canvas.height = video.videoHeight * scale;
            const ctx = canvas.getContext('2d');
            ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
            frames.push(canvas.toDataURL('image/jpeg', 0.8));

            if (currentFrame < numFrames) {
                currentFrame++;
                video.currentTime = interval * currentFrame;
            } else {
                URL.revokeObjectURL(url);
                resolve(frames);
            }
        };

        video.onerror = (e) => {
            URL.revokeObjectURL(url);
            reject(new Error("Failed to load video file."));
        };

        video.src = url;
        video.load();
    });
};

const fileToBase64 = (file) => new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(file);
});

const FRAMING_SHOTS = ["Extreme Wide Shot (EWS)", "Wide Shot (WS)", "Full Shot", "Medium Wide Shot", "Cowboy Shot", "Medium Shot (MS)", "Medium Close-Up (MCU)", "Close-Up (CU)", "Extreme Close-Up (ECU)", "Two Shot", "Three Shot", "Group Shot", "Insert Shot", "Cutaway Shot", "Over-The-Shoulder Shot (OTS)", "Point of View Shot (POV)"];
const CAMERA_ANGLES = ["Eye-Level Shot", "Low Angle Shot", "High Angle Shot", "Bird’s Eye View", "Top Shot", "Dutch Angle", "Canted Angle", "Worm’s Eye View", "Shoulder Level Shot", "Hip Level Shot", "Knee Level Shot", "Ground Level Shot"];
const CAMERA_MOVEMENTS = ["Static / None", "Pan Shot", "Tilt Shot", "Dolly Shot", "Tracking Shot", "Truck Shot", "Push-In Shot", "Pull-Out Shot", "Zoom In", "Zoom Out", "Crash Zoom", "Arc Shot", "Crane Shot", "Jib Shot", "Steadicam Shot", "Handheld Shot", "Drone Shot", "Whip Pan", "Roll Shot", "Orbit Shot", "Slider Shot"];
const SPECIALTY_SHOTS = ["None", "Hero Entry Shot", "Silhouette Shot", "Reflection Shot", "Mirror Shot", "Rack Focus Shot", "Split Diopter Shot", "Lens Flare Shot", "Slow Motion Shot", "Time-Lapse Shot", "Hyperlapse Shot", "Freeze Frame", "Bullet Time Shot", "Long Take", "One Shot", "Continuous Shot", "360 Degree Shot", "Hidden Cut Shot", "Macro Shot", "Deep Focus Shot", "Shallow Focus Shot"];
const LIGHTING_STYLES = ["Cinematic Lighting", "Natural Daylight", "Soft Studio", "Silhouette", "Cyberpunk", "High Key", "Low Key", "Neon", "Golden Hour Lighting", "Harsh Sunlight", "Mood Lighting"];
const TIME_OF_DAY = ["Day", "Night", "Golden Hour", "Morning", "Evening", "Twilight", "Midnight", "Dawn", "Dusk", "Unspecified"];

const IMAGE_STYLES = [
    'Cinematic Realism', 'Hyper Realistic', 'Anime Style', 'Graphic Novel',
    'Hollywood Film Look', 'Indian Commercial Cinema', 'Neo Noir', 'Cyberpunk',
    'Vintage Film', 'Black and White', 'Watercolor Concept Art', '3D Pixar Style',
    'Dark Thriller', 'Epic Fantasy', 'Sci-Fi Concept Art', 'Moody Drama',
];

const CINEMATIC_TONES = [
    'None / Default', 'Neo-Noir / Cynical Urban Darkness', 'Dreamlike / Surreal',
    'Hyper-Stylized Cool', 'Whimsical / Storybook', 'Slow Cinema / Meditative',
    'Existential / Philosophical', 'Atmospheric Horror', 'Grand Epic / Spectacle',
    'Mass Masala (Indian)', 'Rustic Raw Realism (Indian)', 'Urban Grit / Gangster Realism (Indian)',
    'Poetic Humanism (Indian)', 'Romantic-Political Lyrical (Mani Ratnam Style)',
    'Spiritual / Philosophical Art Cinema', 'Feel-Good Slice of Life', 'Mythic / Devotional Grandeur'
];

const COLOR_PALETTES = [
    'None / Default', 'Teal & Orange', 'Desaturated Gray / Bleach Bypass',
    'Warm Golden Palette', 'Cold Blue / Cyan Palette', 'Neon Cyberpunk Palette',
    'Earthy Natural Palette', 'High Saturation Pop Palette', 'Green-Tinted Palette',
    'Monochrome / Limited Palette', 'Pastel Palette', 'Dark Contrast / Chiaroscuro',
    'Dusty Desert Palette', 'Telugu/Tamil Mass Cinema', 'Mani Ratnam Romantic Palette',
    'Malayalam Realist Palette'
];

const FILM_STOCKS = [
    'Digital Clean (No Stock)', 'Kodak Vision3 250D', 'Kodak Vision3 500T', 'Kodak Portra 400',
    'Kodak Ektachrome E100', 'CineStill 800T', 'Fuji Eterna 250D', 'Fuji Pro 400H',
    'Ilford HP5 (B&W)', 'Kodak Tri-X (B&W)', 'Polaroid / Instant', 'Technicolor 3-Strip'
];

const DIFFUSION_FILTERS = [
    'None (Clean)', 'Black Pro-Mist 1/8', 'Black Pro-Mist 1/4', 'Black Pro-Mist 1/2',
    'Glimmerglass 1/4', 'Hollywood Black Magic 1/4', 'Classic Soft 1/2',
    'Polarizer (CPL)', 'Split Diopter', 'Vintage Uncoated Flare'
];

const DOF_STYLES = [
    'Auto / Lens-Based', 'Deep Focus (Everything Sharp)', 'Medium Depth', 'Shallow Focus',
    'Razor-Shallow Bokeh', 'Tilt-Shift Miniature', 'Macro Detail'
];

const BOARD_STYLES = [
    'Photoreal Frame', 'Pencil Sketch Storyboard', 'Marker Rendering', 'Black & White Line Art',
    'Color Concept Sketch', 'Ink & Wash', 'Comic / Graphic Panel'
];

const GENRE_PRESETS = [
    { name: 'Noir Thriller', style: 'Neo Noir', tone: 'Neo-Noir / Cynical Urban Darkness', palette: 'Dark Contrast / Chiaroscuro', time: 'Night' },
    { name: 'Mass Action', style: 'Indian Commercial Cinema', tone: 'Mass Masala (Indian)', palette: 'Teal & Orange', time: 'Golden Hour' },
    { name: 'Romance', style: 'Cinematic Realism', tone: 'Romantic-Political Lyrical (Mani Ratnam Style)', palette: 'Mani Ratnam Romantic Palette', time: 'Golden Hour' },
    { name: 'Horror', style: 'Dark Thriller', tone: 'Atmospheric Horror', palette: 'Green-Tinted Palette', time: 'Night' },
    { name: 'Period Drama', style: 'Hollywood Film Look', tone: 'Poetic Humanism (Indian)', palette: 'Warm Golden Palette', time: 'Day' },
    { name: 'Sci-Fi', style: 'Sci-Fi Concept Art', tone: 'Grand Epic / Spectacle', palette: 'Cold Blue / Cyan Palette', time: 'Night' },
    { name: 'Epic Fantasy', style: 'Epic Fantasy', tone: 'Mythic / Devotional Grandeur', palette: 'High Saturation Pop Palette', time: 'Golden Hour' }
];

const AI_DIRECTORS = [
    "None / Auto", "Christopher Nolan", "S.S. Rajamouli", "Denis Villeneuve",
    "Mani Ratnam", "Lokesh Kanagaraj", "Quentin Tarantino", "David Fincher",
    "Wes Anderson", "Sanjay Leela Bhansali", "Vetrimaaran", "Steven Spielberg",
    "Martin Scorsese", "Zack Snyder", "Prashanth Neel"
];

const CAMERAS = [
    "Auto / Any", "ARRI Alexa 35", "ARRI Alexa Mini LF", "ARRI Alexa 65",
    "RED V-Raptor 8K VV", "RED Komodo 6K", "RED Monstro 8K VV",
    "Sony Venice 2", "Sony FX9", "Sony FX3", "Sony A7S III", "Sony A1", "Sony A7R V",
    "Canon C300 Mark III", "Canon C500 Mark II", "Canon EOS R5 C", "Canon EOS R3",
    "Panavision Millennium DXL2", "Blackmagic URSA Mini Pro 12K", "Blackmagic Pocket 6K",
    "Nikon Cinema / Z9", "Leica Z / Cinema", "Hasselblad SL"
];

const LENS_GROUPS = {
    "Cooke (The Cooke Look)": [
        'Cooke S4/i Prime 14mm', 'Cooke S4/i Prime 18mm', 'Cooke S4/i Prime 25mm', 'Cooke S4/i Prime 35mm', 
        'Cooke S4/i Prime 50mm', 'Cooke S4/i Prime 75mm', 'Cooke S4/i Prime 100mm', 'Cooke S4/i Prime 135mm',
        'Cooke Anamorphic/i 32mm', 'Cooke Anamorphic/i 50mm', 'Cooke Anamorphic/i 75mm', 'Cooke Anamorphic/i 100mm',
        'Cooke Panchro/i Classic 32mm', 'Cooke Panchro/i Classic 50mm', 'Cooke Panchro/i Classic 75mm'
    ],
    "ARRI": [
        'ARRI Signature Prime 12mm', 'ARRI Signature Prime 18mm', 'ARRI Signature Prime 21mm', 'ARRI Signature Prime 35mm', 
        'ARRI Signature Prime 47mm', 'ARRI Signature Prime 75mm', 'ARRI Signature Prime 125mm', 
        'ARRI Master Prime 14mm', 'ARRI Master Prime 27mm', 'ARRI Master Prime 50mm', 'ARRI Master Prime 100mm', 'ARRI Master Prime 150mm',
        'ARRI Master Anamorphic 35mm', 'ARRI Master Anamorphic 50mm', 'ARRI Master Anamorphic 75mm', 'ARRI Master Anamorphic 135mm'
    ],
    "Sony": [
        'Sony FE 14mm F1.8 GM', 'Sony FE 24mm F1.4 GM', 'Sony FE 35mm F1.4 GM', 'Sony FE 50mm F1.2 GM', 
        'Sony FE 85mm F1.4 GM', 'Sony FE 135mm F1.8 GM',
        'Sony CineAlta Prime 20mm', 'Sony CineAlta Prime 35mm', 'Sony CineAlta Prime 50mm', 'Sony CineAlta Prime 85mm'
    ],
    "Canon": [
        'Canon CN-E 14mm T3.1', 'Canon CN-E 24mm T1.5', 'Canon CN-E 35mm T1.5', 
        'Canon CN-E 50mm T1.3', 'Canon CN-E 85mm T1.3', 'Canon CN-E 135mm T2.2',
        'Canon RF 15-35mm F2.8 L IS USM', 'Canon RF 28-70mm F2.8 L IS USM', 'Canon RF 50mm F1.2 L USM', 'Canon RF 85mm F1.2 L USM'
    ],
    "Panavision": [
        'Panavision Primo Prime 14.5mm', 'Panavision Primo Prime 27mm', 'Panavision Primo Prime 35mm', 
        'Panavision Primo Prime 50mm', 'Panavision Primo Prime 75mm', 'Panavision Primo Prime 100mm',
        'Panavision Panatar Anamorphic 35mm', 'Panavision Panatar Anamorphic 50mm', 'Panavision Panatar Anamorphic 75mm'
    ],
    "RED": [
        'RED Pro Prime 18mm', 'RED Pro Prime 25mm', 'RED Pro Prime 35mm', 
        'RED Pro Prime 50mm', 'RED Pro Prime 85mm', 'RED Pro Prime 100mm'
    ],
    "Zeiss": [
        'Zeiss Supreme Prime 21mm', 'Zeiss Supreme Prime 29mm', 'Zeiss Supreme Prime 35mm', 
        'Zeiss Supreme Prime 50mm', 'Zeiss Supreme Prime 85mm', 'Zeiss Supreme Prime 100mm',
        'Zeiss CP.3 15mm', 'Zeiss CP.3 25mm', 'Zeiss CP.3 35mm', 'Zeiss CP.3 50mm', 'Zeiss CP.3 85mm'
    ],
    "Leica/Leitz": [
        'Leitz Summilux-C 18mm', 'Leitz Summilux-C 25mm', 'Leitz Summilux-C 35mm', 
        'Leitz Summilux-C 50mm', 'Leitz Summilux-C 75mm', 'Leitz Summilux-C 100mm'
    ]
};

const getFovCategory = (lensString) => {
    if (!lensString) return "Auto";
    const match = lensString.match(/(\d+)mm/);
    if (!match) return "Unknown";
    const mm = parseInt(match[1]);
    if (mm < 24) return "Ultra-Wide";
    if (mm >= 24 && mm < 35) return "Wide";
    if (mm >= 35 && mm <= 55) return "Standard";
    if (mm > 55 && mm <= 85) return "Short Telephoto";
    if (mm > 85) return "Telephoto";
    return "Unknown";
};

const parseDurationSec = (d) => {
    if (typeof d === 'number') return d;
    const m = String(d ?? '').match(/[\d.]+/);
    return m ? parseFloat(m[0]) : 0;
};

const formatRuntime = (totalSec) => {
    const s = Math.round(totalSec);
    const mins = Math.floor(s / 60);
    const rem = s % 60;
    return mins > 0 ? `${mins}m ${rem}s` : `${rem}s`;
};

const getMovementBlurCharacteristics = (movementString) => {
    const lowerMovement = movementString.toLowerCase();
    if (lowerMovement.includes('pan')) return "Apply noticeable horizontal motion blur to the background to simulate a panning camera movement. The subject should remain relatively sharp if tracked.";
    if (lowerMovement.includes('tilt')) return "Apply vertical motion blur to the background to simulate a tilting camera movement.";
    if (lowerMovement.includes('push') || lowerMovement.includes('zoom in')) return "Apply radial motion blur starting from the center outward to simulate a quick push-in or zoom.";
    if (lowerMovement.includes('crash zoom')) return "Apply EXTREME radial motion blur. The image should feel chaotic, fast, and aggressive like a sudden snap-zoom.";
    if (lowerMovement.includes('whip pan')) return "Apply EXTREME horizontal motion blur. The entire image should look like it's smearing sideways due to high-speed panning.";
    if (lowerMovement.includes('handheld')) return "The image should feel slightly imperfect. Add subtle rotational blur or unsteadiness. Do not make it perfectly rigid.";
    if (lowerMovement.includes('tracking') || lowerMovement.includes('dolly')) return "The image should imply motion along an axis. Background elements closer to the lens should have more motion blur than distant elements.";
    return "Keep the image sharp and static with no motion blur.";
};

const getCharactersForShot = (shot, characters) => {
    if (!shot || !shot.characters_present || !Array.isArray(shot.characters_present)) return [];
    return shot.characters_present.map(name => {
        const cleanName = typeof name === 'string' ? name.trim() : String(name).trim();
        const lowerCleanName = cleanName.toLowerCase();
        
        const charObj = characters.find(c => {
            const cName = c.name.toLowerCase();
            const baseName = cName.split('(')[0].trim();
            const bracketMatch = cName.match(/\((.*?)\)/);
            const actorName = bracketMatch ? bracketMatch[1].trim() : '';

            return cName === lowerCleanName || 
                   baseName === lowerCleanName || 
                   cName.includes(lowerCleanName) || 
                   lowerCleanName.includes(baseName) ||
                   (actorName && lowerCleanName.includes(actorName));
        });
        return charObj || { name: cleanName, gender: '', age: '', description: '', images: [] };
    });
};

const getCharactersForShotString = (shot, characters) => {
    const chars = getCharactersForShot(shot, characters);
    if (chars.length === 0) return 'None';
    return chars.map(c => c.name).join(', ');
};

const InpaintingEditor = ({ imageUrl, onClose, onApply, isGenerating }) => {
    const canvasRef = useRef(null);
    const imgRef = useRef(null);
    const [prompt, setPrompt] = useState('');
    const [brushSize, setBrushSize] = useState(40);
    const [isDrawing, setIsDrawing] = useState(false);

    const initCanvas = () => {
        if (imgRef.current && canvasRef.current) {
            canvasRef.current.width = imgRef.current.width;
            canvasRef.current.height = imgRef.current.height;
            const ctx = canvasRef.current.getContext('2d');
            ctx.lineCap = 'round';
            ctx.lineJoin = 'round';
            ctx.strokeStyle = 'rgba(239, 68, 68, 0.6)';
        }
    };

    const startDrawing = (e) => {
        setIsDrawing(true);
        draw(e, true);
    };

    const draw = (e, isFirst = false) => {
        if (!isDrawing && !isFirst) return;
        e.preventDefault(); 
        
        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');
        const rect = canvas.getBoundingClientRect();
        
        const clientX = e.clientX || e.touches?.[0]?.clientX;
        const clientY = e.clientY || e.touches?.[0]?.clientY;
        
        const scaleX = canvas.width / rect.width;
        const scaleY = canvas.height / rect.height;
        
        const x = (clientX - rect.left) * scaleX;
        const y = (clientY - rect.top) * scaleY;

        ctx.lineWidth = brushSize;

        if (isFirst) {
            ctx.beginPath();
            ctx.moveTo(x, y);
        } else {
            ctx.lineTo(x, y);
            ctx.stroke();
        }
    };

    const stopDrawing = () => {
        if (isDrawing) {
            const ctx = canvasRef.current?.getContext('2d');
            if(ctx) ctx.closePath();
            setIsDrawing(false);
        }
    };

    const clearCanvas = () => {
        const canvas = canvasRef.current;
        if(canvas) {
            const ctx = canvas.getContext('2d');
            ctx.clearRect(0, 0, canvas.width, canvas.height);
        }
    };

    const handleApply = () => {
        if (!prompt.trim()) return;
        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');
        const pixelBuffer = new Uint32Array(ctx.getImageData(0, 0, canvas.width, canvas.height).data.buffer);
        const hasDrawn = pixelBuffer.some(color => color !== 0);
        
        const maskDataUrl = hasDrawn ? canvas.toDataURL('image/png') : null;
        onApply(prompt, maskDataUrl);
    };

    return (
        <div className="fixed inset-0 z-[120] bg-black/95 backdrop-blur-xl flex flex-col font-sans">
            <div className="flex items-center justify-between p-4 bg-zinc-950/80 border-b border-zinc-800">
                <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2 px-3 py-1.5 bg-zinc-900 border border-zinc-800 rounded-lg">
                        <Paintbrush className="w-4 h-4 text-zinc-400" />
                        <span className="text-xs font-bold text-zinc-300">Brush Size</span>
                        <input 
                            type="range" min="5" max="150" 
                            value={brushSize} onChange={e => setBrushSize(parseInt(e.target.value))}
                            className="w-24 accent-purple-500"
                        />
                    </div>
                    <button onClick={clearCanvas} className="flex items-center gap-2 px-3 py-1.5 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-300 rounded-lg text-xs font-bold transition-colors">
                        <Eraser className="w-4 h-4" /> Clear Mask
                    </button>
                </div>
                <button onClick={onClose} disabled={isGenerating} className="p-2 bg-zinc-900 hover:bg-red-950/40 hover:text-red-400 text-zinc-400 rounded-lg transition-colors border border-zinc-800 disabled:opacity-50">
                    <X className="w-5 h-5" />
                </button>
            </div>

            <div className="flex-1 relative flex items-center justify-center p-6 overflow-hidden touch-none">
                <div className="relative inline-block max-w-full max-h-full">
                    <img 
                        ref={imgRef} 
                        src={imageUrl} 
                        alt="Target" 
                        className="max-w-full max-h-full object-contain rounded-lg shadow-2xl pointer-events-none" 
                        onLoad={initCanvas}
                    />
                    <canvas 
                        ref={canvasRef}
                        className="absolute top-0 left-0 w-full h-full cursor-crosshair rounded-lg"
                        onMouseDown={startDrawing}
                        onMouseMove={draw}
                        onMouseUp={stopDrawing}
                        onMouseLeave={stopDrawing}
                        onTouchStart={startDrawing}
                        onTouchMove={draw}
                        onTouchEnd={stopDrawing}
                    />
                </div>
            </div>

            <div className="absolute bottom-8 left-1/2 -translate-x-1/2 w-full max-w-2xl px-4 z-20">
                <div className="bg-zinc-900/95 backdrop-blur-xl border border-zinc-700 p-2 rounded-2xl flex items-center gap-2 shadow-[0_20px_50px_rgba(0,0,0,0.8)]">
                    <input 
                        type="text"
                        placeholder="Describe what to change in the red area..."
                        value={prompt}
                        onChange={e => setPrompt(e.target.value)}
                        onKeyDown={e => { if(e.key === 'Enter') handleApply(); }}
                        className="flex-1 bg-transparent text-white px-4 py-2 focus:outline-none placeholder:text-zinc-500 font-medium"
                    />
                    <button 
                        onClick={handleApply}
                        disabled={isGenerating || !prompt.trim()}
                        className="bg-purple-600 hover:bg-purple-500 disabled:bg-zinc-800 disabled:text-zinc-500 text-white px-5 py-3 rounded-xl transition-all shadow-lg flex items-center justify-center gap-2 shrink-0 font-bold text-sm tracking-wider uppercase"
                    >
                        {isGenerating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                        {isGenerating ? 'Applying...' : 'Apply Edits'}
                    </button>
                </div>
            </div>
        </div>
    );
};

const StagingEditor = ({ sceneId, shot, characters, updateShotBlocking, onClose, onApplyBlocking, hasRenderedImage, isGenerating }) => {
    const [elements, setElements] = useState(shot.blockingData?.elements || []);
    const [selectedId, setSelectedId] = useState(null);
    const [dragState, setDragState] = useState(null);
    const boardRef = useRef(null);

    useEffect(() => {
        if (shot.blockingData?.elements) {
            setElements(shot.blockingData.elements);
        }
    }, [shot.blockingData?.elements]);

    useEffect(() => {
        const handleGlobalMouseMove = (e) => {
            if (!dragState || !boardRef.current) return;
            const rect = boardRef.current.getBoundingClientRect();
            let newX = ((e.clientX - rect.left) / rect.width) * 100 - dragState.offsetX;
            let newY = ((e.clientY - rect.top) / rect.height) * 100 - dragState.offsetY;
            newX = Math.max(0, Math.min(100, newX));
            newY = Math.max(0, Math.min(100, newY));

            setElements(prev => prev.map(el => el.id === dragState.id ? { ...el, x: newX, y: newY } : el));
        };

        const handleGlobalMouseUp = () => {
            if (dragState) {
                setDragState(null);
                setElements(prev => {
                    updateShotBlocking(sceneId, shot.id, { elements: prev });
                    return prev;
                });
            }
        };

        if (dragState) {
            window.addEventListener('mousemove', handleGlobalMouseMove);
            window.addEventListener('mouseup', handleGlobalMouseUp);
        }
        return () => {
            window.removeEventListener('mousemove', handleGlobalMouseMove);
            window.removeEventListener('mouseup', handleGlobalMouseUp);
        };
    }, [dragState, sceneId, shot.id, updateShotBlocking]);

    const handleAdd = (type) => {
        setElements(prev => {
            const newEl = {
                id: Date.now(),
                type,
                label: type === 'camera' ? 'CAM A' : type === 'actor' ? 'Actor' : type === 'light' ? 'Key Light' : 'Prop',
                x: 50,
                y: 50,
                rotation: 0,
                color: type === 'camera' ? '#10b981' : type === 'actor' ? '#3b82f6' : type === 'light' ? '#fef08a' : '#a1a1aa',
                height: type === 'camera' ? 1.5 : undefined,
                pitch: type === 'camera' ? 0 : undefined,
                focalLength: type === 'camera' ? 35 : undefined,
                intensity: type === 'light' ? 80 : undefined
            };
            const newElements = [...prev, newEl];
            updateShotBlocking(sceneId, shot.id, { elements: newElements });
            setSelectedId(newEl.id);
            return newElements;
        });
    };

    const updateSelected = (updates) => {
        setElements(prev => {
            const newElements = prev.map(el => el.id === selectedId ? { ...el, ...updates } : el);
            updateShotBlocking(sceneId, shot.id, { elements: newElements });
            return newElements;
        });
    };

    const removeSelected = () => {
        setElements(prev => {
            const newElements = prev.filter(el => el.id !== selectedId);
            updateShotBlocking(sceneId, shot.id, { elements: newElements });
            return newElements;
        });
        setSelectedId(null);
    };

    const selectedElement = elements.find(el => el.id === selectedId);

    return (
        <div className="bg-zinc-950 border border-zinc-800 rounded-xl overflow-hidden shadow-2xl flex flex-col mb-8">
            <div className="bg-zinc-900 border-b border-zinc-800 p-3 flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2 text-zinc-300 font-bold text-sm uppercase tracking-widest px-2">
                        <MapPin className="w-4 h-4 text-emerald-500" /> Overhead Staging
                    </div>
                    <div className="h-5 w-px bg-zinc-700"></div>
                    <button onClick={() => handleAdd('camera')} className="flex items-center gap-2 bg-zinc-800 hover:bg-zinc-700 px-3 py-1.5 rounded-lg text-xs font-bold text-zinc-300 transition-colors"><Camera className="w-3.5 h-3.5 text-emerald-400" /> Camera</button>
                    <button onClick={() => handleAdd('actor')} className="flex items-center gap-2 bg-zinc-800 hover:bg-zinc-700 px-3 py-1.5 rounded-lg text-xs font-bold text-zinc-300 transition-colors"><User className="w-3.5 h-3.5 text-blue-400" /> Actor</button>
                    <button onClick={() => handleAdd('light')} className="flex items-center gap-2 bg-zinc-800 hover:bg-zinc-700 px-3 py-1.5 rounded-lg text-xs font-bold text-zinc-300 transition-colors"><Lightbulb className="w-3.5 h-3.5 text-yellow-400" /> Light</button>
                    <button onClick={() => handleAdd('prop')} className="flex items-center gap-2 bg-zinc-800 hover:bg-zinc-700 px-3 py-1.5 rounded-lg text-xs font-bold text-zinc-300 transition-colors"><Box className="w-3.5 h-3.5 text-zinc-400" /> Prop / Mark</button>
                </div>
                <div className="flex items-center gap-3 pl-4">
                    <button
                        onClick={onApplyBlocking}
                        disabled={!hasRenderedImage || isGenerating}
                        className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 disabled:bg-zinc-800 disabled:text-zinc-500 disabled:border-zinc-700 text-white border border-blue-500/50 px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all shadow-lg"
                        title={!hasRenderedImage ? "Render an initial frame first" : "Apply blocking changes directly to the rendered image"}
                    >
                        {isGenerating ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <RefreshCw className="w-3.5 h-3.5" />}
                        Sync to Image
                    </button>
                    <button onClick={onClose} className="text-zinc-500 hover:text-zinc-300 p-1 rounded-md hover:bg-zinc-800 transition-colors"><X className="w-5 h-5" /></button>
                </div>
            </div>
            
            <div className="flex h-[400px]">
                <div 
                    ref={boardRef}
                    className="flex-1 relative overflow-hidden bg-zinc-900 cursor-crosshair"
                    style={{
                        backgroundImage: `linear-gradient(to right, rgba(255,255,255,0.03) 1px, transparent 1px), linear-gradient(to bottom, rgba(255,255,255,0.03) 1px, transparent 1px)`,
                        backgroundSize: '40px 40px'
                    }}
                    onMouseDown={() => setSelectedId(null)}
                >
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-20">
                        <Crosshair className="w-24 h-24 text-zinc-600" />
                    </div>

                    {elements.map(el => (
                        <div
                            key={el.id}
                            onMouseDown={(e) => {
                                e.stopPropagation();
                                setSelectedId(el.id);
                                const rect = boardRef.current.getBoundingClientRect();
                                setDragState({
                                    id: el.id,
                                    offsetX: ((e.clientX - rect.left) / rect.width) * 100 - el.x,
                                    offsetY: ((e.clientY - rect.top) / rect.height) * 100 - el.y
                                });
                            }}
                            className={`absolute flex items-center justify-center transition-shadow ${selectedId === el.id ? 'ring-2 ring-white rounded-sm scale-110' : ''}`}
                            style={{
                                left: `${el.x}%`,
                                top: `${el.y}%`,
                                transform: `translate(-50%, -50%) rotate(${el.rotation}deg)`,
                                cursor: dragState?.id === el.id ? 'grabbing' : 'grab',
                                zIndex: selectedId === el.id ? 10 : 1,
                                width: '40px',
                                height: '40px'
                            }}
                        >
                            {el.type === 'camera' && (
                                <div className="relative flex flex-col items-center justify-center">
                                    <div className="w-8 h-8 bg-zinc-800 border-2 rounded flex items-center justify-center z-10 shadow-lg" style={{ borderColor: el.color }}>
                                        <Camera className="w-4 h-4" style={{ color: el.color }} />
                                    </div>
                                    <div className="absolute top-[100%] w-0 h-0 border-l-[30px] border-r-[30px] border-t-[80px] border-transparent opacity-30 pointer-events-none" style={{ borderTopColor: el.color }}></div>
                                </div>
                            )}
                            {el.type === 'actor' && (
                                <div className="w-8 h-8 rounded-full border-2 flex items-center justify-center shadow-lg bg-zinc-800" style={{ borderColor: el.color }}>
                                    <span className="text-[10px] font-bold text-white">{el.label.substring(0,2).toUpperCase()}</span>
                                </div>
                            )}
                            {el.type === 'prop' && (
                                <div className="w-8 h-8 rounded bg-zinc-800 border-2 border-dashed flex items-center justify-center shadow-lg" style={{ borderColor: el.color }}>
                                    <Box className="w-4 h-4" style={{ color: el.color }} />
                                </div>
                            )}
                            {el.type === 'light' && (
                                <div className="relative flex flex-col items-center justify-center">
                                    <div className="w-8 h-8 rounded-full bg-zinc-800 border-2 flex items-center justify-center shadow-[0_0_15px_currentColor]" style={{ borderColor: el.color, color: el.color }}>
                                        <Lightbulb className="w-4 h-4" />
                                    </div>
                                    <div className="absolute top-[100%] w-0 h-0 border-l-[30px] border-r-[30px] border-t-[80px] border-transparent opacity-20 pointer-events-none" style={{ borderTopColor: el.color }}></div>
                                </div>
                            )}
                            
                            <div className="absolute -bottom-6 text-[9px] font-bold text-white bg-black/70 backdrop-blur-sm px-1.5 py-0.5 rounded pointer-events-none whitespace-nowrap" style={{ transform: `rotate(${-el.rotation}deg)` }}>
                                {el.label}
                            </div>
                        </div>
                    ))}
                </div>

                {selectedElement ? (
                    <div className="w-64 bg-zinc-950 border-l border-zinc-800 p-5 flex flex-col gap-5 overflow-y-auto custom-scrollbar">
                        <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500 mb-2 border-b border-zinc-800/80 pb-3">Edit Properties</h3>
                        
                        <div>
                            <label className="text-[9px] font-bold text-zinc-500 uppercase tracking-widest block mb-1.5">Label</label>
                            <input 
                                type="text" 
                                value={selectedElement.label} 
                                onChange={(e) => updateSelected({ label: e.target.value })}
                                className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-emerald-500 text-white transition-colors"
                            />
                        </div>

                        {selectedElement.type === 'actor' && characters.length > 0 && (
                            <div>
                                <label className="text-[9px] font-bold text-zinc-500 uppercase tracking-widest block mb-1.5">Link Cast Member</label>
                                <select 
                                    value={selectedElement.label}
                                    onChange={(e) => updateSelected({ label: e.target.value })}
                                    className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-emerald-500 text-white transition-colors"
                                >
                                    <option value="Actor">Generic Actor</option>
                                    {characters.map(c => (
                                        <option key={c.id} value={c.name}>{c.name}</option>
                                    ))}
                                </select>
                            </div>
                        )}

                        <div>
                            <label className="text-[9px] font-bold text-zinc-500 uppercase tracking-widest block mb-2 flex items-center justify-between">
                                Rotation / Heading <span className="text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded">{selectedElement.rotation}°</span>
                            </label>
                            <input 
                                type="range" 
                                min="0" 
                                max="360" 
                                value={selectedElement.rotation} 
                                onChange={(e) => updateSelected({ rotation: parseInt(e.target.value) })}
                                className="w-full accent-emerald-500 cursor-pointer"
                            />
                        </div>

                        {selectedElement.type === 'camera' && (
                            <>
                                <div>
                                    <label className="text-[9px] font-bold text-zinc-500 uppercase tracking-widest block mb-2 flex items-center justify-between">
                                        Height <span className="text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded">{selectedElement.height || 1.5}m</span>
                                    </label>
                                    <input type="range" min="0" max="10" step="0.1" value={selectedElement.height || 1.5} onChange={(e) => updateSelected({ height: parseFloat(e.target.value) })} className="w-full accent-emerald-500 cursor-pointer" />
                                </div>
                                <div>
                                    <label className="text-[9px] font-bold text-zinc-500 uppercase tracking-widest block mb-2 flex items-center justify-between">
                                        Pitch <span className="text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded">{selectedElement.pitch || 0}°</span>
                                    </label>
                                    <input type="range" min="-90" max="90" value={selectedElement.pitch || 0} onChange={(e) => updateSelected({ pitch: parseInt(e.target.value) })} className="w-full accent-emerald-500 cursor-pointer" />
                                </div>
                                <div>
                                    <label className="text-[9px] font-bold text-zinc-500 uppercase tracking-widest block mb-2 flex items-center justify-between">
                                        Focal Length <span className="text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded">{selectedElement.focalLength || 35}mm</span>
                                    </label>
                                    <input type="range" min="10" max="200" value={selectedElement.focalLength || 35} onChange={(e) => updateSelected({ focalLength: parseInt(e.target.value) })} className="w-full accent-emerald-500 cursor-pointer" />
                                </div>
                            </>
                        )}

                        {selectedElement.type === 'light' && (
                            <div>
                                <label className="text-[9px] font-bold text-zinc-500 uppercase tracking-widest block mb-2 flex items-center justify-between">
                                    Intensity <span className="text-yellow-400 bg-yellow-500/10 px-1.5 py-0.5 rounded">{selectedElement.intensity || 50}%</span>
                                </label>
                                <input type="range" min="0" max="100" value={selectedElement.intensity || 50} onChange={(e) => updateSelected({ intensity: parseInt(e.target.value) })} className="w-full accent-yellow-500 cursor-pointer" />
                            </div>
                        )}

                        <div>
                            <label className="text-[9px] font-bold text-zinc-500 uppercase tracking-widest block mb-2">Color Marker</label>
                            <div className="flex flex-wrap gap-2">
                                {['#10b981', '#3b82f6', '#ef4444', '#fef08a', '#f59e0b', '#8b5cf6', '#ec4899', '#a1a1aa'].map(color => (
                                    <button 
                                        key={color} 
                                        onClick={() => updateSelected({ color })}
                                        className={`w-6 h-6 rounded-full border-2 transition-transform hover:scale-110 ${selectedElement.color === color ? 'border-white scale-110' : 'border-transparent'}`}
                                        style={{ backgroundColor: color }}
                                    />
                                ))}
                            </div>
                        </div>

                        <div className="mt-auto pt-4 border-t border-zinc-800/80">
                            <button onClick={removeSelected} className="w-full bg-red-950/40 hover:bg-red-900/60 border border-red-900/50 text-red-400 py-2.5 rounded-lg text-xs font-bold uppercase tracking-wider transition-colors flex items-center justify-center gap-2">
                                <Trash2 className="w-4 h-4" /> Remove
                            </button>
                        </div>
                    </div>
                ) : (
                    <div className="w-64 bg-zinc-950 border-l border-zinc-800 p-4 flex flex-col items-center justify-center text-center opacity-40">
                        <Navigation className="w-10 h-10 mb-3 text-zinc-500" />
                        <span className="text-[10px] uppercase font-bold tracking-widest leading-relaxed">Select an element<br/>to edit properties</span>
                    </div>
                )}
            </div>
        </div>
    );
};

const ShotOrderInput = ({ shot, sceneId, updateShotOrder }) => {
    const [val, setVal] = useState(shot.order ?? shot.id);
    
    useEffect(() => {
        setVal(shot.order ?? shot.id);
    }, [shot.order, shot.id]);

    const handleCommit = () => {
        updateShotOrder(sceneId, shot.id, val);
    };

    return (
        <div className="flex items-center gap-1 bg-zinc-950 border border-zinc-800/80 rounded-md overflow-hidden px-1 cursor-text transition-all focus-within:border-emerald-500/50 focus-within:ring-1 focus-within:ring-emerald-500/20" title="Edit to rearrange shot order">
            <span className="text-zinc-500 text-[9px] font-bold pl-2 pr-1 tracking-widest">SHOT</span>
            <input 
                type="number" 
                value={val}
                onChange={(e) => setVal(e.target.value)}
                onBlur={handleCommit}
                onKeyDown={(e) => { if (e.key === 'Enter') e.target.blur(); }}
                className="w-12 bg-transparent text-zinc-200 py-1 text-sm font-bold focus:outline-none text-center"
                step="any"
            />
        </div>
    );
};

export default function App() {
    const [isAppUnlocked, setIsAppUnlocked] = useState(() => sessionStorage.getItem('app_unlocked') === 'true');
    const [loginUser, setLoginUser] = useState('');
    const [loginPass, setLoginPass] = useState('');
    const [loginError, setLoginError] = useState('');

    const handleLoginSubmit = (e) => {
        e.preventDefault();
        if (loginUser === 'admin' && loginPass === 'test') {
            setIsAppUnlocked(true);
            sessionStorage.setItem('app_unlocked', 'true');
        } else {
            setLoginError('Invalid user ID or password. Please try again.');
        }
    };

    const [script, setScript] = useState('');
    const [parsedScenes, setParsedScenes] = useState(INITIAL_SCENES);
    const parsedScenesRef = useRef(INITIAL_SCENES);

    const [selectedScene, setSelectedScene] = useState(null);
    const [aiStatus, setAiStatus] = useState('Ready');
    
    const [generatedImages, setGeneratedImages] = useState({});
    const generatedImagesRef = useRef({});
    
    const [generatedCollages, setGeneratedCollages] = useState({});
    const [generatedBreakdowns, setGeneratedBreakdowns] = useState({});
    const generatedBreakdownsRef = useRef({});
    
    const [generatedCostumeBoards, setGeneratedCostumeBoards] = useState({});

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
    const [isAnimaticPlaying, setIsAnimaticPlaying] = useState(false);
    const [isDirectorDropdownOpen, setIsDirectorDropdownOpen] = useState(false);
    const [directorSearchQuery, setDirectorSearchQuery] = useState('');
    const [directorSearchResults, setDirectorSearchResults] = useState([]);
    const [isSearchingDirector, setIsSearchingDirector] = useState(false);
    const [scriptLanguage, setScriptLanguage] = useState('Auto-Detect Native Language');
    const apiKey = 'AIzaSyBwWqYggIMOEk4ftwYa3D1mvZpyxdBRCk0'; // User-provided text API key

    const GEMINI_TEXT_MODEL = 'gemini-2.5-flash';
    const GEMINI_IMAGE_MODEL = 'gemini-2.5-flash-image-preview';
    const geminiUrl = (model) => `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;

    const makeFrameId = (sceneId, shotId) => `${sceneId}-${shotId}`;
    const makeLastFrameId = (sceneId, shotId) => `${sceneId}-${shotId}-last`;
    const makeMcFrameId = (sceneId, shotId, mcId) => `${sceneId}-${shotId}-mc-${mcId}`;
    
    const [generatingIds, setGeneratingIds] = useState(new Set());
    const generatingIdsRef = useRef(new Set());
    const [isAutomating, setIsAutomating] = useState(false);
    const isAutomatingRef = useRef(false);
    const [isCompilingAll, setIsCompilingAll] = useState(false);
    
    const [activeInpainting, setActiveInpainting] = useState(null);
    const [characters, setCharacters] = useState([]);
    const [newCharName, setNewCharName] = useState('');
    const [newCharGender, setNewCharGender] = useState('');
    const [newCharAge, setNewCharAge] = useState('');
    const [newCharDescription, setNewCharDescription] = useState('');
    const [newCharImage, setNewCharImage] = useState(null);

    const [locations, setLocations] = useState([]);
    const [newLocationName, setNewLocationName] = useState('');
    const [newLocationImage, setNewLocationImage] = useState(null);
    const [locationEditPrompts, setLocationEditPrompts] = useState({});
    const [imageEditPrompts, setImageEditPrompts] = useState({});
    const [editingLocationId, setEditingLocationId] = useState(null);

    const [expandedChars, setExpandedChars] = useState(new Set());
    const [activeStagingShotId, setActiveStagingShotId] = useState(null);

    const [history, setHistory] = useState([]);
    const [projectName, setProjectName] = useState("My Project");
    const [alertMessage, setAlertMessage] = useState('');
    const [isGoogleLoggedIn, setIsGoogleLoggedIn] = useState(false);
    const [activeTab, setActiveTab] = useState('script');
    const [showExportMenu, setShowExportMenu] = useState(false);

    const [isAnalyzingDna, setIsAnalyzingDna] = useState(false);
    const [dnaUrl, setDnaUrl] = useState('');
    const [extractedDnaStyle, setExtractedDnaStyle] = useState(null);

    const [showAppSlider, setShowAppSlider] = useState(false);
    const [sliderIndex, setSliderIndex] = useState(0);

    const [enforceLikeness, setEnforceLikeness] = useState(false);
    
    const [fullscreenImage, setFullscreenImage] = useState(null);
    const [pendingActorMatch, setPendingActorMatch] = useState(null);

    useEffect(() => { parsedScenesRef.current = parsedScenes; }, [parsedScenes]);
    useEffect(() => { generatedImagesRef.current = generatedImages; }, [generatedImages]);
    useEffect(() => { generatingIdsRef.current = generatingIds; }, [generatingIds]);
    useEffect(() => { generatedBreakdownsRef.current = generatedBreakdowns; }, [generatedBreakdowns]);
    useEffect(() => { isAutomatingRef.current = isAutomating; }, [isAutomating]);

    const identifyActorFromImage = async (base64Data, mimeType) => {
        try {
            const payload = {
                contents: [{
                    role: "user",
                    parts: [
                        { inlineData: { mimeType, data: base64Data } },
                        { text: "Analyze this image. If it contains a recognizable famous actor or celebrity, identify them. Return ONLY a valid JSON object with the following schema: {\"recognized\": true/false, \"name\": \"Full Name\", \"gender\": \"Male/Female\", \"age\": \"approximate age (e.g., 40s)\", \"traits\": \"brief visual description of their typical cinematic look\"}. If no recognizable person is found, return {\"recognized\": false}." }
                    ]
                }],
                generationConfig: { responseMimeType: "application/json" }
            };
            const apiUrl = geminiUrl(GEMINI_TEXT_MODEL);
            const response = await fetch(apiUrl, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
            const result = await response.json();
            if (result.candidates?.[0]?.content?.parts?.[0]) {
                const text = result.candidates[0].content.parts[0].text;
                return parseAIJson(text);
            }
            return { recognized: false };
        } catch (e) {
            console.error("Actor ID failed", e);
            return { recognized: false };
        }
    };

    const searchActorDetails = async (query) => {
        try {
            const payload = {
                contents: [{ role: "user", parts: [{ text: `Search for the actor: ${query}. Return ONLY a valid JSON object: {"recognized": true/false, "name": "Full Exact Name", "gender": "Male/Female", "age": "current age or age range", "traits": "brief visual description of their look"}. If not a real actor, return {"recognized": false}.` }] }],
                tools: [{ "google_search": {} }]
            };
            const apiUrl = geminiUrl(GEMINI_TEXT_MODEL);
            const response = await fetch(apiUrl, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
            const result = await response.json();
            if (result.candidates?.[0]?.content?.parts?.[0]) {
                const text = result.candidates[0].content.parts[0].text;
                return parseAIJson(text);
            }
            return { recognized: false };
        } catch (e) {
            console.error("Actor Search failed", e);
            return { recognized: false };
        }
    };

    const handleSearchActorName = async (id, currentName) => {
        if (!currentName.trim()) return;
        setAiStatus(`Searching database for "${currentName}"...`);
        const result = await searchActorDetails(currentName);
        if (result && result.recognized) {
            setPendingActorMatch({ 
                targetType: id ? 'existing' : 'new', 
                charId: id, 
                currentName: currentName,
                imageDatas: null, 
                detectedInfo: result 
            });
            setAiStatus("Actor found! Waiting for confirmation.");
        } else {
            setAlertMessage(`Could not confidently match "${currentName}" to a known actor.`);
            setAiStatus("Actor search finished.");
        }
    };

    const handleConfirmActorMatch = (applyDetails) => {
        const { targetType, charId, currentName, imageDatas, detectedInfo } = pendingActorMatch;
        
        let finalName = detectedInfo.name;
        if (currentName && currentName.trim() && currentName.trim().toLowerCase() !== detectedInfo.name.toLowerCase()) {
            if (!currentName.includes('(')) {
                finalName = `${currentName.trim()} (${detectedInfo.name})`;
            } else {
                 finalName = currentName; 
            }
        }
        
        if (targetType === 'new') {
            if (applyDetails) {
                setNewCharName(finalName);
                setNewCharGender(detectedInfo.gender);
                setNewCharAge(detectedInfo.age);
                setNewCharDescription(detectedInfo.traits);
            }
            if (imageDatas && imageDatas.length > 0) {
                setNewCharImage(imageDatas[0]);
            }
        } else if (targetType === 'existing') {
            if (applyDetails) {
                setCharacters(prev => prev.map(c => {
                    if (c.id === charId) {
                        return {
                            ...c,
                            name: finalName,
                            gender: detectedInfo.gender,
                            age: detectedInfo.age,
                            description: detectedInfo.traits,
                            images: imageDatas ? [...(c.images || []), ...imageDatas] : c.images
                        };
                    }
                    return c;
                }));
            } else if (imageDatas) {
                setCharacters(prev => prev.map(c => {
                    if (c.id === charId) {
                        return { ...c, images: [...(c.images || []), ...imageDatas] };
                    }
                    return c;
                }));
            }
        }
        
        setPendingActorMatch(null);
        setAiStatus("Character profile updated.");
    };

    useEffect(() => {
        const originalFetch = window.fetch;
        window.fetch = async (...args) => {
            const url = args[0];
            if (typeof url === 'string' && url.includes('generativelanguage.googleapis.com')) {
                for (let i = 0; i < 4; i++) { 
                    const response = await originalFetch(...args);
                    if (response.status === 429) {
                        let waitTime = 15000 * (i + 1); 
                        try {
                            const cloned = response.clone();
                            const errData = await cloned.json();
                            const match = errData.error?.message?.match(/retry in (\d+\.?\d*)s/);
                            if (match && match[1]) {
                                waitTime = parseFloat(match[1]) * 1000 + 2000; 
                            }
                        } catch(e) {}
                        
                        setAiStatus(`API Rate Limit (Free Tier). Pausing for ${Math.ceil(waitTime/1000)}s...`);
                        console.warn(`[Rate Limit 429] API exhausted. Auto-retrying in ${Math.ceil(waitTime/1000)}s...`);
                        
                        await new Promise(r => setTimeout(r, waitTime));
                        setAiStatus('Resuming AI operations...');
                        continue; 
                    }
                    return response;
                }
            }
            return originalFetch(...args);
        };
        return () => { window.fetch = originalFetch; }; 
    }, []);

    const handleScriptUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        const fileName = file.name.toLowerCase();

        if (file.type === 'application/pdf' || fileName.endsWith('.pdf')) {
            setAlertMessage("Sometimes, foreign-language PDFs are created without a proper underlying \"Unicode Map\" (especially if they use legacy fonts like Kruti Dev). If you upload the PDF and it still comes out as gibberish symbols:\n\n• Take screenshots (or export images) of your script pages.\n• Upload those images directly into the script uploader instead of the PDF.\n• The app will automatically run our AI OCR Engine (Optical Character Recognition) on the images, which natively reads almost every language flawlessly regardless of the font used!");
            
            setAiStatus('Loading local PDF parser for large documents...');
            try {
                if (!window.pdfjsLib) {
                    await new Promise((resolve, reject) => {
                        const script = document.createElement('script');
                        script.src = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js';
                        script.onload = () => {
                            window.pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
                            resolve();
                        };
                        script.onerror = reject;
                        document.head.appendChild(script);
                    });
                }

                setAiStatus('Parsing PDF document locally...');
                const arrayBuffer = await file.arrayBuffer();
                const pdf = await window.pdfjsLib.getDocument({ 
                    data: arrayBuffer,
                    cMapUrl: 'https://unpkg.com/pdfjs-dist@3.11.174/cmaps/',
                    cMapPacked: true,
                    standardFontDataUrl: 'https://unpkg.com/pdfjs-dist@3.11.174/standard_fonts/',
                    useSystemFonts: true
                }).promise;
                let fullText = '';

                for (let i = 1; i <= pdf.numPages; i++) {
                    setAiStatus(`Extracting text: Page ${i} of ${pdf.numPages}...`);
                    const page = await pdf.getPage(i);
                    const textContent = await page.getTextContent({ disableCombineTextItems: false });
                    
                    let pageText = '';
                    let lastY = null;
                    
                    textContent.items.forEach(item => {
                        if (lastY !== null && Math.abs(lastY - item.transform[5]) > 5) {
                            pageText += '\n';
                        } else if (lastY !== null && item.hasEOL) {
                            pageText += '\n';
                        } else if (lastY !== null) {
                            pageText += ' '; 
                        }
                        pageText += item.str;
                        lastY = item.transform[5];
                    });
                    
                    fullText += pageText + '\n\n';
                    
                    if (i % 10 === 0) await new Promise(r => setTimeout(r, 10));
                }

                if (fullText.trim().length < 100) {
                    setAlertMessage("This PDF appears to be a scanned document (images) without text layers. Please convert it to text using a dedicated OCR tool first, as large scanned PDFs exceed browser memory limits.");
                    setAiStatus("PDF parsing finished, but no text found.");
                } else {
                    setScript(fullText);
                    setAiStatus('Script loaded from PDF. Ready to extract scenes.');
                }
            } catch (error) {
                console.error("PDF Parsing Error:", error);
                setAiStatus('Failed to parse PDF.');
                setAlertMessage('Could not extract text from the PDF. It might be corrupted, encrypted, or too complex.');
            }
        } else if (file.type.startsWith('image/')) {
            setAiStatus('Running AI OCR on document...');
            try {
                const base64Data = await fileToBase64(file);
                const mimeType = file.type;
                const base64 = base64Data.split(',')[1];

                const payload = {
                    contents: [{
                        role: 'user',
                        parts: [
                            { inlineData: { mimeType, data: base64 } },
                            { text: "Extract ALL the text from this document exactly as written. Act strictly as an OCR. Preserve the original language, formatting, characters, and scene headings. Do not summarize or translate. Output ONLY the extracted text without any markdown wrappers." }
                        ]
                    }]
                };

                const apiUrl = geminiUrl(GEMINI_TEXT_MODEL);

                const response = await fetch(apiUrl, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(payload)
                });

                if (!response.ok) throw new Error("Failed to extract text");

                const result = await response.json();
                if (result.candidates?.[0]?.content?.parts?.[0]?.text) {
                    setScript(result.candidates[0].content.parts[0].text);
                    setAiStatus('Script text extracted via OCR. Ready to extract scenes.');
                } else {
                    throw new Error("No text found");
                }
            } catch (error) {
                console.error("OCR Error:", error);
                setAiStatus('Failed to read Image.');
                setAlertMessage('Could not extract text from the file. Please ensure the API key is valid and the file is readable.');
            }
        } else if (fileName.endsWith('.docx')) {
            setAiStatus('Loading DOCX parser...');
            try {
                if (!window.mammoth) {
                    await new Promise((resolve, reject) => {
                        const script = document.createElement('script');
                        script.src = 'https://cdnjs.cloudflare.com/ajax/libs/mammoth/1.6.0/mammoth.browser.min.js';
                        script.onload = resolve;
                        script.onerror = reject;
                        document.head.appendChild(script);
                    });
                }
                setAiStatus('Parsing DOCX document...');
                const arrayBuffer = await file.arrayBuffer();
                const result = await window.mammoth.extractRawText({ arrayBuffer });
                if (result.value.trim().length > 0) {
                    setScript(result.value);
                    setAiStatus('Script loaded from DOCX. Ready to extract scenes.');
                } else {
                    throw new Error("No text found");
                }
            } catch (error) {
                console.error("DOCX Parsing Error:", error);
                setAiStatus('Failed to parse DOCX.');
                setAlertMessage('Could not extract text from the DOCX file. It might be corrupted.');
            }
        } else if (fileName.endsWith('.doc')) {
             setAlertMessage("The older .doc format is a proprietary binary format not fully supported in the browser. Please open it in your word processor and 'Save As' .docx, .pdf, or .txt.");
             setAiStatus('Unsupported format (.doc)');
        } else {
            const reader = new FileReader();
            reader.onload = (event) => {
                const content = event.target.result;
                setScript(content);
                setAiStatus('Script loaded. Ready to extract scenes.');
            };
            reader.onerror = () => {
                setAiStatus('Failed to read file.');
            };
            reader.readAsText(file);
        }
    };

    const findClosestTone = (moodStr) => {
        if (!moodStr) return 'None / Default';
        const lower = moodStr.toLowerCase();
        if (lower.includes('noir') || lower.includes('cynical') || lower.includes('urban darkness')) return 'Neo-Noir / Cynical Urban Darkness';
        if (lower.includes('dream') || lower.includes('surreal') || lower.includes('lynch')) return 'Dreamlike / Surreal';
        if (lower.includes('hyper') || lower.includes('stylized') || lower.includes('tarantino')) return 'Hyper-Stylized Cool';
        if (lower.includes('whimsical') || lower.includes('storybook') || lower.includes('wes anderson')) return 'Whimsical / Storybook';
        if (lower.includes('slow') || lower.includes('meditative') || lower.includes('tarkovsky')) return 'Slow Cinema / Meditative';
        if (lower.includes('existential') || lower.includes('philosophical')) return 'Existential / Philosophical';
        if (lower.includes('horror') || lower.includes('dread') || lower.includes('scary')) return 'Atmospheric Horror';
        if (lower.includes('epic') || lower.includes('grand') || lower.includes('spectacle') || lower.includes('nolan')) return 'Grand Epic / Spectacle';
        if (lower.includes('mass') || lower.includes('masala')) return 'Mass Masala (Indian)';
        if (lower.includes('rustic') || lower.includes('raw') || lower.includes('realism')) return 'Rustic Raw Realism (Indian)';
        if (lower.includes('grit') || lower.includes('gangster')) return 'Urban Grit / Gangster Realism (Indian)';
        if (lower.includes('romantic') || lower.includes('mani ratnam')) return 'Romantic-Political Lyrical (Mani Ratnam Style)';
        if (lower.includes('slice') || lower.includes('feel-good')) return 'Feel-Good Slice of Life';
        if (lower.includes('mythic') || lower.includes('devotional')) return 'Mythic / Devotional Grandeur';
        return 'None / Default';
    };

    const findClosestPalette = (colorStr) => {
        if (!colorStr) return 'None / Default';
        const lower = colorStr.toLowerCase();
        if (lower.includes('teal') || lower.includes('orange')) return 'Teal & Orange';
        if (lower.includes('desaturated') || lower.includes('bleach') || lower.includes('bypass')) return 'Desaturated Gray / Bleach Bypass';
        if (lower.includes('warm') || lower.includes('golden') || lower.includes('amber')) return 'Warm Golden Palette';
        if (lower.includes('cold') || lower.includes('blue') || lower.includes('cyan') || lower.includes('icy')) return 'Cold Blue / Cyan Palette';
        if (lower.includes('neon') || lower.includes('cyberpunk') || lower.includes('purple')) return 'Neon Cyberpunk Palette';
        if (lower.includes('earthy') || lower.includes('natural') || lower.includes('green') || lower.includes('brown')) return 'Earthy Natural Palette';
        if (lower.includes('pop') || lower.includes('saturated') || lower.includes('vibrant')) return 'High Saturation Pop Palette';
        if (lower.includes('pastel')) return 'Pastel Palette';
        if (lower.includes('chiaroscuro') || lower.includes('dark contrast')) return 'Dark Contrast / Chiaroscuro';
        if (lower.includes('desert') || lower.includes('dusty') || lower.includes('rust')) return 'Dusty Desert Palette';
        if (lower.includes('telugu') || lower.includes('tamil') || lower.includes('mass')) return 'Telugu/Tamil Mass Cinema';
        if (lower.includes('malayalam') || lower.includes('realist')) return 'Malayalam Realist Palette';
        return 'None / Default';
    };

    const handleAnalyzeDna = async (file, url) => {
        if (!file && (!url || !url.trim())) return;
        
        setIsAnalyzingDna(true);
        setAiStatus('Analyzing media for cinematic DNA...');

        try {
            const systemInst = `You are a master cinematographer and colorist analyzing media (an image or a sequence of video frames).
Extract EXTREME, detailed cinematic DNA. We need deep technical analysis that will be used to direct another AI to recreate this exact look, framing, and lighting.
If multiple frames are provided from a video, analyze the progression to determine the overarching dominant visual style, lighting scheme, and color grade.

Return a JSON object STRICTLY matching this structure:
{
  "cameraAngle": "Select the closest match from: [Eye-Level Shot, Low Angle Shot, High Angle Shot, Bird’s Eye View, Top Shot, Dutch Angle, Canted Angle, Worm’s Eye View, Shoulder Level Shot, Hip Level Shot, Knee Level Shot, Ground Level Shot]",
  "shotType": "Select the closest match from: [Extreme Wide Shot (EWS), Wide Shot (WS), Full Shot, Medium Wide Shot, Cowboy Shot, Medium Shot (MS), Medium Close-Up (MCU), Close-Up (CU), Extreme Close-Up (ECU), Two Shot, Three Shot, Group Shot, Insert Shot, Cutaway Shot, Over-The-Shoulder Shot (OTS), Point of View Shot (POV)]",
  "lens": "Estimate the lens used (e.g., 'Cooke S4/i Prime 35mm', 'ARRI Master Anamorphic 50mm'). Be specific.",
  "lighting": "Detailed description of the lighting setup (e.g., 'High contrast chiaroscuro, strong warm key light from top right, subtle cool rim light').",
  "colorGrade": "Detailed description of the color palette and grading (e.g., 'Teal and orange, crushed blacks, lifted midtones, heavy film grain').",
  "mood": "The emotional tone (e.g., 'Gritty, suspenseful, cynical urban darkness')."
}`;
            
            const payload = {
                contents: [{ role: 'user', parts: [] }],
                systemInstruction: { parts: [{ text: systemInst }] },
                generationConfig: { responseMimeType: "application/json" }
            };

            if (file) {
                if (file.type.startsWith('video/')) {
                    setAiStatus('Extracting periodic frames from video...');
                    const frames = await extractFramesFromVideo(file, 5);
                    setAiStatus('Analyzing extracted video frames...');
                    
                    frames.forEach((frameDataUrl, index) => {
                        const base64Data = frameDataUrl.split(',')[1];
                        payload.contents[0].parts.push({ text: `Frame ${index + 1} from video sequence:` });
                        payload.contents[0].parts.push({ inlineData: { mimeType: 'image/jpeg', data: base64Data } });
                    });
                } else {
                    const reader = new FileReader();
                    await new Promise((resolve) => {
                        reader.onloadend = () => resolve();
                        reader.readAsDataURL(file);
                    });
                    const base64Data = reader.result.split(',')[1];
                    payload.contents[0].parts.push({ inlineData: { mimeType: file.type, data: base64Data } });
                }
            } else if (url) {
                 payload.contents[0].parts.push({ text: `Analyze the visual style from this reference: ${url}. If it's a direct image URL, analyze the image. If it's a video link, describe the general cinematic style associated with it.` });
            }

            payload.contents[0].parts.push({ text: "Perform an extreme deep-dive extraction of this media's cinematic DNA." });

            const apiUrl = geminiUrl(GEMINI_TEXT_MODEL);
            const response = await fetch(apiUrl, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
            
            if (!response.ok) throw new Error("DNA Extraction API error");
            
            const result = await response.json();
            if (result.candidates?.[0]?.content?.parts?.[0]) {
                const jsonText = result.candidates[0].content.parts[0].text;
                const parsedData = parseAIJson(jsonText);
                setExtractedDnaStyle(parsedData);
                
                const matchedTone = findClosestTone(parsedData.mood);
                const matchedPalette = findClosestPalette(parsedData.colorGrade);
                
                if (matchedTone !== 'None / Default') setSelectedTone(matchedTone);
                if (matchedPalette !== 'None / Default') setSelectedPalette(matchedPalette);
                
                setAiStatus('Cinematic DNA successfully extracted and loaded!');
                setAlertMessage(`Successfully extracted DNA:\nAngle: ${parsedData.cameraAngle}\nShot: ${parsedData.shotType}\nLens: ${parsedData.lens}\nTone/Mood: ${parsedData.mood}\nColor Grade: ${parsedData.colorGrade}`);
            }
        } catch (error) {
            console.error(error);
            setAiStatus('Failed to extract DNA from media.');
            setAlertMessage('Failed to extract DNA. Ensure the API key is correct and the file/URL is valid.');
        } finally {
            setIsAnalyzingDna(false);
        }
    };

    const toggleChar = (id) => {
        setExpandedChars(prev => {
            const next = new Set(prev);
            if (next.has(id)) next.delete(id);
            else next.add(id);
            return next;
        });
    };

    const sliderFrames = showAppSlider ? (() => {
        const frames = [];
        parsedScenes.forEach(scene => {
            const safeShots = Array.isArray(scene.shots) ? scene.shots : Object.values(scene.shots || {});
            const sortedShots = [...safeShots].sort((a, b) => (a.order ?? a.id) - (b.order ?? b.id));
            sortedShots.forEach(shot => {
                const frameId = makeFrameId(scene.id, shot.id);
                if (generatedImages[frameId]) {
                    frames.push({
                        sceneTitle: scene.title,
                        shotType: shot.type,
                        shotOrder: shot.order ?? shot.id,
                        snippet: shot.script_snippet,
                        duration: parseDurationSec(shot.duration) || 4,
                        image: generatedImages[frameId]
                    });
                }
            });
        });
        return frames;
    })() : [];

    useEffect(() => {
        const handleKeyDown = (e) => {
            if (!showAppSlider) return;
            if (e.key === 'ArrowRight') setSliderIndex(prev => Math.min(prev + 1, sliderFrames.length - 1));
            if (e.key === 'ArrowLeft') setSliderIndex(prev => Math.max(prev - 1, 0));
            if (e.key === 'Escape') setShowAppSlider(false);
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [showAppSlider, sliderFrames.length]);

    useEffect(() => {
        if (!showAppSlider || !isAnimaticPlaying || sliderFrames.length === 0) return;
        const current = sliderFrames[sliderIndex];
        const ms = Math.max(1000, (current?.duration || 4) * 1000);
        const timer = setTimeout(() => {
            setSliderIndex(prev => {
                if (prev >= sliderFrames.length - 1) { setIsAnimaticPlaying(false); return prev; }
                return prev + 1;
            });
        }, ms);
        return () => clearTimeout(timer);
    }, [showAppSlider, isAnimaticPlaying, sliderIndex, sliderFrames.length]);

    useEffect(() => {
        const handleEscapeFullscreen = (e) => {
            if (e.key === 'Escape') setFullscreenImage(null);
        };
        window.addEventListener('keydown', handleEscapeFullscreen);
        return () => window.removeEventListener('keydown', handleEscapeFullscreen);
    }, []);

    const parseAIJson = (text) => {
        let cleanText = text.replace(/```(?:json)?\n?/gi, '').replace(/```/gi, '').trim();
        try {
            return JSON.parse(cleanText);
        } catch (err) {
            const firstBrace = cleanText.indexOf('{');
            const firstBracket = cleanText.indexOf('[');
            let startIdx = -1;
            let isArray = false;
            
            if (firstBrace !== -1 && firstBracket !== -1) {
                startIdx = Math.min(firstBrace, firstBracket);
                isArray = startIdx === firstBracket;
            } else if (firstBrace !== -1) {
                startIdx = firstBrace;
            } else if (firstBracket !== -1) {
                startIdx = firstBracket;
                isArray = true;
            }
            
            if (startIdx !== -1) {
                const openChar = isArray ? '[' : '{';
                const closeChar = isArray ? ']' : '}';
                let depth = 0;
                let inString = false;
                let escape = false;
                let endIdx = -1;
                
                for (let i = startIdx; i < cleanText.length; i++) {
                    const char = cleanText[i];
                    if (inString) {
                        if (escape) escape = false;
                        else if (char === '\\') escape = true;
                        else if (char === '"') inString = false;
                    } else {
                        if (char === '"') inString = true;
                        else if (char === openChar) depth++;
                        else if (char === closeChar) {
                            depth--;
                            if (depth === 0) {
                                endIdx = i;
                                break;
                            }
                        }
                    }
                }
                
                if (endIdx !== -1) {
                    const extracted = cleanText.substring(startIdx, endIdx + 1);
                    return JSON.parse(extracted);
                }
            }
            throw err;
        }
    };

    const updateScenesWithHistory = (updater) => {
        setParsedScenes(prev => {
            const next = typeof updater === 'function' ? updater(prev) : updater;
            parsedScenesRef.current = next;
            setHistory(h => [...h, prev].slice(-20));
            return next;
        });
    };

    const handleUndo = () => {
        if (history.length === 0) return;
        const previousState = history[history.length - 1];
        setParsedScenes(previousState);
        parsedScenesRef.current = previousState;
        setHistory(prev => prev.slice(0, -1));
        setAiStatus('Undo successful');
    };

    const handleReset = () => {
        setHistory(h => [...h, parsedScenes]);
        setScript('');
        setParsedScenes([]);
        parsedScenesRef.current = [];
        setSelectedScene(null);
        setGeneratedImages({});
        generatedImagesRef.current = {};
        setGeneratedCollages({});
        setGeneratedBreakdowns({});
        generatedBreakdownsRef.current = {};
        setGeneratedCostumeBoards({});
        setCharacters([]);
        setLocations([]);
        setProjectName("My Project");
        setExtractedDnaStyle(null);
        setAiStatus('Workspace reset to blank state');
    };

    const handleExportDirectorsBoard = () => setAlertMessage("Director's Board export feature is currently in development.");
    const handleExportCinematographersBoard = () => setAlertMessage("Cinematographer's Board export feature is currently in development.");
    const handleExportProductionBoards = () => setAlertMessage("Production Boards export feature is currently in development.");

    const handleExportProject = () => {
        try {
            const projectData = { parsedScenes, generatedImages, generatedCollages, generatedBreakdowns, generatedCostumeBoards, characters, locations, script, selectedStyle, aspectRatio, selectedTone, selectedPalette, selectedDirector, scriptLanguage, projectName, selectedGlobalTime, selectedGlobalCamera, selectedGlobalLensGroup, selectedFilmStock, selectedDiffusion, selectedDof, selectedBoardStyle, enforceContinuity };
            const jsonStr = JSON.stringify(projectData);
            const blob = new Blob([jsonStr], { type: "application/json" });
            const url = window.URL.createObjectURL(blob);
            
            const downloadAnchorNode = document.createElement('a');
            downloadAnchorNode.style.display = 'none';
            downloadAnchorNode.href = url;
            downloadAnchorNode.download = `${projectName.replace(/[^a-z0-9]/gi, '_')}_backup.json`;
            document.body.appendChild(downloadAnchorNode);
            downloadAnchorNode.click();
            
            setTimeout(() => {
                downloadAnchorNode.remove();
                window.URL.revokeObjectURL(url);
            }, 100);
        } catch (error) {
            console.error("Export error", error);
            setAlertMessage("Failed to export project.");
        }
    };

    const handleImportProject = (e) => {
        const file = e.target.files[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = (event) => {
            try {
                const data = JSON.parse(event.target.result);
                if (data.parsedScenes) setParsedScenes(data.parsedScenes);
                if (data.generatedImages) setGeneratedImages(data.generatedImages);
                if (data.generatedCollages) setGeneratedCollages(data.generatedCollages);
                if (data.generatedBreakdowns) setGeneratedBreakdowns(data.generatedBreakdowns);
                if (data.generatedCostumeBoards) setGeneratedCostumeBoards(data.generatedCostumeBoards);
                
                if (data.characters) {
                    const repairedChars = data.characters.map(c => ({
                        ...c,
                        images: (c.images || []).map(img => {
                            if (img.url && img.url.startsWith('blob:') && img.data) {
                                return { ...img, url: `data:${img.mimeType || 'image/png'};base64,${img.data}` };
                            }
                            return img;
                        })
                    }));
                    setCharacters(repairedChars);
                }
                
                if (data.locations) {
                    const repairedLocs = data.locations.map(l => {
                        if (l.image && l.image.url && l.image.url.startsWith('blob:') && l.image.data) {
                            return { ...l, image: { ...l.image, url: `data:${l.image.mimeType || 'image/png'};base64,${l.image.data}` } };
                        }
                        return l;
                    });
                    setLocations(repairedLocs);
                }

                if (data.script) setScript(data.script);
                if (data.selectedStyle) setSelectedStyle(data.selectedStyle);
                if (data.aspectRatio) setAspectRatio(data.aspectRatio);
                if (data.selectedTone) setSelectedTone(data.selectedTone);
                if (data.selectedPalette) setSelectedPalette(data.selectedPalette);
                if (data.selectedDirector) setSelectedDirector(data.selectedDirector);
                if (data.selectedFilmStock) setSelectedFilmStock(data.selectedFilmStock);
                if (data.selectedDiffusion) setSelectedDiffusion(data.selectedDiffusion);
                if (data.selectedDof) setSelectedDof(data.selectedDof);
                if (data.selectedBoardStyle) setSelectedBoardStyle(data.selectedBoardStyle);
                if (typeof data.enforceContinuity === 'boolean') setEnforceContinuity(data.enforceContinuity);
                if (data.selectedGlobalTime) setSelectedGlobalTime(data.selectedGlobalTime);
                if (data.selectedGlobalCamera) setSelectedGlobalCamera(data.selectedGlobalCamera);
                if (data.selectedGlobalLensGroup) setSelectedGlobalLensGroup(data.selectedGlobalLensGroup);
                if (data.scriptLanguage) setScriptLanguage(data.scriptLanguage);
                if (data.projectName) setProjectName(data.projectName);
                setAiStatus('Project imported successfully!');
                setShowExportMenu(false);
            } catch (err) {
                console.error("Import error", err);
                setAlertMessage('Failed to parse project file.');
            }
        };
        reader.readAsText(file);
    };

    const handleSaveToDrive = () => {
        setAlertMessage("Google Drive integration requires a backend to handle OAuth authentication.");
        setShowExportMenu(false);
    };

    const handleDownloadSingleImage = async (dataUrl, filename) => {
        if (!dataUrl) return;
        
        try {
            const response = await fetch(dataUrl);
            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            
            const a = document.createElement('a');
            a.style.display = 'none';
            a.href = url;
            a.download = filename;
            document.body.appendChild(a);
            a.click();
            
            setTimeout(() => {
                document.body.removeChild(a);
                window.URL.revokeObjectURL(url);
            }, 150);
        } catch (error) {
            console.error("Blob conversion failed, attempting fallback download:", error);
            const a = document.createElement('a');
            a.href = dataUrl;
            a.download = filename;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
        }
    };

    const handleSearchDirectorOrFilm = async (query) => {
        if (!query.trim()) {
            setDirectorSearchResults([]);
            return;
        }

        setIsSearchingDirector(true);
        setAiStatus(`Searching internet & cinematic database for "${query}"...`);

        try {
            const systemInst = `You are a cinematic knowledge base. The user is searching for a film director or a specific movie.
Analyze the query: "${query}". Use Google Search to find accurate, up-to-date information.
If they typed a partial or misspelled name, correct it and find the closest matches.
Return a JSON array of up to 5 highly relevant matching results.
Each result MUST be an object with this exact structure:
{
  "displayName": "Name of Director OR Title of Film (Year)",
  "type": "Director" or "Film",
  "details": "If Director: list 3 notable films. If Film: list the Director and genre.",
  "promptValue": "The string to use for AI prompting (e.g., 'Christopher Nolan' or 'The Wachowskis (Style of The Matrix)')"
}`;

            const payload = {
                contents: [{ role: 'user', parts: [{ text: "Search Query: " + query }] }],
                systemInstruction: { parts: [{ text: systemInst }] },
                tools: [{ "google_search": {} }]
            };

            const apiUrl = geminiUrl(GEMINI_TEXT_MODEL);
            const response = await fetch(apiUrl, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
            
            if (!response.ok) throw new Error("Search API error");
            
            const result = await response.json();
            if (result.candidates?.[0]?.content?.parts?.[0]) {
                const jsonText = result.candidates[0].content.parts[0].text;
                const parsedData = parseAIJson(jsonText);
                let resultsArray = [];
                if (Array.isArray(parsedData)) {
                    resultsArray = parsedData;
                } else if (parsedData.results && Array.isArray(parsedData.results)) {
                    resultsArray = parsedData.results;
                } else if (parsedData.directors && Array.isArray(parsedData.directors)) {
                    resultsArray = parsedData.directors;
                }
                
                const formattedResults = resultsArray.map(item => {
                    if (typeof item === 'string') {
                        return { displayName: item, type: 'Director', details: 'Known for cinematic excellence', promptValue: item };
                    }
                    return item;
                });

                setDirectorSearchResults(formattedResults);
                setAiStatus('Search complete.');
            }
        } catch (error) {
            console.error("Search error:", error);
            setAiStatus('Failed to search cinematic database.');
        } finally {
            setIsSearchingDirector(false);
        }
    };

    const enhanceShotPrompt = async (sceneId, shotId) => {
        const scene = parsedScenesRef.current.find(s => s.id === sceneId);
        const shot = scene?.shots.find(s => s.id === shotId);
        if (!shot || !shot.prompt) return;

        setAiStatus('Enhancing shot description...');
        setGeneratingIds(prev => new Set(prev).add(`enhance-${shotId}`));
        try {
            const systemInst = "You are an expert cinematographer and prompt engineer. Take the user's basic shot description and expand it into a highly detailed, evocative visual prompt suitable for an AI image generator. Include details about lighting, texture, atmosphere, and composition. Keep it under 80 words. Return ONLY the enhanced text.";
            const payload = {
                contents: [{ role: "user", parts: [{ text: `Original prompt: ${shot.prompt}\n\nEnhance this into a highly cinematic description.` }] }],
                systemInstruction: { parts: [{ text: systemInst }] }
            };
            const apiUrl = geminiUrl(GEMINI_TEXT_MODEL);
            const response = await fetch(apiUrl, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
            const result = await response.json();
            if (result.candidates?.[0]?.content?.parts?.[0]?.text) {
                const enhanced = result.candidates[0].content.parts[0].text;
                updateShotPrompt(sceneId, shotId, enhanced.trim());
                setAiStatus('Shot description enhanced!');
            }
        } catch (err) {
            console.error(err);
            setAiStatus('Failed to enhance prompt.');
        } finally {
            setGeneratingIds(prev => { const newSet = new Set(prev); newSet.delete(`enhance-${shotId}`); return newSet; });
        }
    };

    const generateCharacterBackstory = async (charId) => {
        const char = characters.find(c => c.id === charId);
        if (!char) return;

        setAiStatus(`Generating backstory for ${char.name}...`);
        setGeneratingIds(prev => new Set(prev).add(`backstory-${charId}`));
        try {
            const systemInst = "You are an expert screenwriter and casting director. Given a character's name and basic details, write a compelling, concise 2-sentence backstory and list 3 key visual wardrobe/appearance traits. Return ONLY the text without markdown formatting if possible.";
            const payload = {
                contents: [{ role: "user", parts: [{ text: `Character Name: ${char.name}, Gender: ${char.gender || 'Any'}, Age: ${char.age || 'Any'}. Current details: ${char.description || 'None'}\n\nExpand this.` }] }],
                systemInstruction: { parts: [{ text: systemInst }] }
            };
            const apiUrl = geminiUrl(GEMINI_TEXT_MODEL);
            const response = await fetch(apiUrl, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
            const result = await response.json();
            if (result.candidates?.[0]?.content?.parts?.[0]?.text) {
                const enhanced = result.candidates[0].content.parts[0].text;
                updateCharacterInfo(charId, 'description', enhanced.trim());
                setAiStatus(`Backstory generated for ${char.name}!`);
            }
        } catch (err) {
            console.error(err);
            setAiStatus('Failed to generate backstory.');
        } finally {
            setGeneratingIds(prev => { const newSet = new Set(prev); newSet.delete(`backstory-${charId}`); return newSet; });
        }
    };

    const handleDownloadAllImages = async () => {
        if (Object.keys(generatedImages).length === 0) {
            setAiStatus('No images generated yet.');
            return;
        }
        setAiStatus('Packaging images into ZIP...');
        try {
            if (!window.JSZip) {
                await new Promise((resolve, reject) => {
                    const script = document.createElement('script');
                    script.src = 'https://cdnjs.cloudflare.com/ajax/libs/jszip/3.10.1/jszip.min.js';
                    script.onload = resolve;
                    script.onerror = reject;
                    document.head.appendChild(script);
                });
            }
            const zip = new window.JSZip();
            let imageCount = 0;

            for (const loc of locations) {
                if (loc.image) {
                    if (loc.image.data) {
                        const ext = (loc.image.mimeType || 'image/jpeg').split('/')[1] === 'jpeg' ? 'jpg' : (loc.image.mimeType || 'image/jpeg').split('/')[1];
                        const fileName = `Locations/${loc.name.replace(/[^a-z0-9]/gi, '_')}.${ext}`;
                        zip.file(fileName, loc.image.data, { base64: true });
                        imageCount++;
                    } else if (loc.image.url) {
                        const match = loc.image.url.match(/data:image\/(.*?);base64,(.*)/);
                        if (match) {
                            const ext = match[1] === 'jpeg' ? 'jpg' : match[1];
                            const data = match[2];
                            const fileName = `Locations/${loc.name.replace(/[^a-z0-9]/gi, '_')}.${ext}`;
                            zip.file(fileName, data, { base64: true });
                            imageCount++;
                        }
                    }
                }
            }

            for (const scene of parsedScenes) {
                const safeShots = Array.isArray(scene.shots) ? scene.shots : Object.values(scene.shots || {});
                const sortedShotsForZIP = [...safeShots].sort((a, b) => (a.order ?? a.id) - (b.order ?? b.id));
                for (const shot of sortedShotsForZIP) {
                    const frameId = makeFrameId(scene.id, shot.id);
                    const base64Img = generatedImages[frameId];
                    if (base64Img) {
                        const match = base64Img.match(/data:image\/(.*?);base64,(.*)/);
                        if (match) {
                            const ext = match[1] === 'jpeg' ? 'jpg' : match[1];
                            const data = match[2];
                            const fileName = `Scene_${scene.id}_Shot_${shot.order ?? shot.id}.${ext}`;
                            zip.file(fileName, data, { base64: true });
                            imageCount++;
                        }
                    }
                }
                const collages = generatedCollages[scene.id];
                if (collages) {
                    const collageArray = Array.isArray(collages) ? collages : [collages];
                    collageArray.forEach((collageImg, idx) => {
                        const match = collageImg.match(/data:image\/(.*?);base64,(.*)/);
                        if (match) {
                            const ext = match[1] === 'jpeg' ? 'jpg' : match[1];
                            const data = match[2];
                            const fileName = `Scene_${scene.id}_Collage_${idx + 1}.${ext}`;
                            zip.file(fileName, data, { base64: true });
                            imageCount++;
                        }
                    });
                }
            }
            if (imageCount === 0) {
                setAiStatus('No images found in the current scenes.');
                return;
            }
            const content = await zip.generateAsync({ type: "blob" });
            const url = URL.createObjectURL(content);
            const a = document.createElement('a');
            a.href = url;
            a.download = `${projectName.replace(/[^a-z0-9]/gi, '_')}_Images.zip`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
            setAiStatus(`Successfully downloaded ${imageCount} images!`);
        } catch (err) {
            console.error("ZIP Generation failed:", err);
            setAiStatus('Failed to create ZIP file.');
        }
    };

    const handleExportShotList = () => {
        try {
            const esc = (v) => {
                const s = (v === undefined || v === null) ? '' : String(v);
                return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
            };
            const headers = ['Scene #', 'Scene Title', 'Shot Order', 'Framing', 'Angle', 'Movement', 'Specialty', 'Lens', 'Camera', 'Lighting', 'Time of Day', 'Duration (s)', 'Characters', 'Dialogue / Notes', 'Prompt'];
            const rows = [headers.join(',')];
            parsedScenes.forEach(scene => {
                const shots = Array.isArray(scene.shots) ? scene.shots : Object.values(scene.shots || {});
                const sorted = [...shots].sort((a, b) => (a.order ?? a.id) - (b.order ?? b.id));
                sorted.forEach(shot => {
                    rows.push([
                        scene.id, scene.title, (shot.order ?? shot.id),
                        shot.type, shot.cameraAngle, shot.cameraMovement, shot.specialtyShot,
                        shot.lens, shot.camera, shot.lighting, shot.timeOfDay,
                        parseDurationSec(shot.duration),
                        getCharactersForShotString(shot, characters),
                        shot.notes || shot.script_snippet || '',
                        shot.prompt
                    ].map(esc).join(','));
                });
            });
            rows.push('');
            rows.push(esc('TOTAL ESTIMATED RUNTIME') + ',' + esc(formatRuntime(totalRuntimeSec)));
            const blob = new Blob([rows.join('\n')], { type: 'text/csv;charset=utf-8;' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `${(projectName || 'project').replace(/[^a-z0-9]/gi, '_')}_shotlist.csv`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
            setAiStatus('Shot list exported (CSV).');
        } catch (e) {
            console.error('Shot list export failed', e);
            setAlertMessage('Failed to export shot list.');
        }
    };

    const handleExportPDF = async () => {
        if (parsedScenes.length === 0) {
            setAiStatus('No scenes to export.');
            return;
        }
        
        setAiStatus('Generating High-Resolution PDF via Native Canvas (100% Reliable)...');
        setGeneratingIds(prev => new Set(prev).add('exporting-pdf'));
        
        try {
            if (!window.jspdf) {
                await new Promise((resolve, reject) => {
                    const script = document.createElement('script');
                    script.src = 'https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js';
                    script.onload = resolve;
                    script.onerror = reject;
                    document.head.appendChild(script);
                });
            }

            const { jsPDF } = window.jspdf;
            let pdf = null;

            for (const scene of parsedScenes) {
                const sceneTitle = scene.title || `Scene ${scene.id}`;
                const safeShots = Array.isArray(scene.shots) ? scene.shots : Object.values(scene.shots || {});
                const sortedShots = [...safeShots].sort((a, b) => (a.order ?? a.id) - (b.order ?? b.id));
                
                if (sortedShots.length === 0) continue;

                const padding = 60;
                const boardWidth = 1920; 
                const headerHeight = 850; 
                const shotSpacing = 80;
                const shotImgWidth = 600;
                const textPanelWidth = boardWidth - padding * 3 - shotImgWidth;
                const SHOTS_PER_PAGE = 3;

                const shotPages = [];
                for (let i = 0; i < sortedShots.length; i += SHOTS_PER_PAGE) {
                    shotPages.push(sortedShots.slice(i, i + SHOTS_PER_PAGE));
                }

                const loadedImages = {};
                
                const loadShotPromises = sortedShots.map(shot => {
                    const frameId = makeFrameId(scene.id, shot.id);
                    const imgSrc = generatedImages[frameId];
                    if (imgSrc) {
                        return new Promise((resolve) => {
                            const img = new Image();
                            img.onload = () => {
                                loadedImages[frameId] = img;
                                resolve();
                            };
                            img.onerror = () => resolve();
                            img.src = imgSrc;
                        });
                    }
                    return Promise.resolve();
                });

                const sceneLocationIds = scene.locationIds || [];
                const sceneLocations = locations.filter(loc => sceneLocationIds.includes(loc.id));
                const loadLocPromises = sceneLocations.map(loc => {
                    if (loc.image && (loc.image.data || loc.image.url)) {
                        return new Promise((resolve) => {
                            const img = new Image();
                            img.onload = () => {
                                loadedImages[`loc-${loc.id}`] = img;
                                resolve();
                            };
                            img.onerror = () => resolve();
                            img.src = loc.image.data ? `data:${loc.image.mimeType || 'image/jpeg'};base64,${loc.image.data}` : loc.image.url;
                        });
                    }
                    return Promise.resolve();
                });

                let charactersInScene = new Set();
                sortedShots.forEach(shot => {
                    const chars = getCharactersForShot(shot, characters);
                    chars.forEach(c => charactersInScene.add(c));
                });
                const sceneCharactersArray = Array.from(charactersInScene);

                await Promise.all([...loadShotPromises, ...loadLocPromises]);

                for (let pageIndex = 0; pageIndex < shotPages.length; pageIndex++) {
                    const currentShots = shotPages[pageIndex];
                    const shotLayouts = [];
                    let totalHeight = padding;

                    if (pageIndex === 0) {
                        totalHeight += headerHeight;
                    } else {
                        totalHeight += 150; 
                    }

                    const estimateTextHeight = (text, maxWidth, fontStr) => {
                        const dummyCanvas = document.createElement('canvas');
                        const dummyCtx = dummyCanvas.getContext('2d');
                        dummyCtx.font = fontStr;
                        const words = (text || '').split(' ');
                        let lines = 1;
                        let currentLine = '';
                        for (let i = 0; i < words.length; i++) {
                            const testLine = currentLine + words[i] + ' ';
                            const metrics = dummyCtx.measureText(testLine);
                            if (metrics.width > maxWidth && i > 0) {
                                lines++;
                                currentLine = words[i] + ' ';
                            } else {
                                currentLine = testLine;
                            }
                        }
                        return lines * parseInt(fontStr.match(/\d+/)[0]) * 1.5;
                    };

                    for (const shot of currentShots) {
                        const charsInShot = getCharactersForShotString(shot, characters);
                        const promptHeight = estimateTextHeight(shot.prompt || 'No description', textPanelWidth, '24px sans-serif');
                        const snippetHeight = shot.script_snippet ? estimateTextHeight(`"${shot.script_snippet}"`, textPanelWidth, 'italic 24px sans-serif') + 40 : 0;
                        const metaHeight = 250; 
                        const [ratioW, ratioH] = aspectRatio.split(':').map(Number);
                        const expectedImgHeight = (shotImgWidth * ratioH) / ratioW;

                        const contentHeight = Math.max(expectedImgHeight, metaHeight + promptHeight + snippetHeight);
                        
                        shotLayouts.push({
                            shot: shot,
                            height: contentHeight,
                            yStart: totalHeight,
                            charsInShot: charsInShot
                        });

                        totalHeight += contentHeight + shotSpacing;
                    }

                    const canvas = document.createElement('canvas');
                    const ctx = canvas.getContext('2d');
                    canvas.width = boardWidth;
                    canvas.height = totalHeight + padding;

                    ctx.fillStyle = '#ffffff'; 
                    ctx.fillRect(0, 0, canvas.width, canvas.height);

                    const wrapText = (context, text, x, y, maxWidth, lineHeight) => {
                        const words = (text || '').split(' ');
                        let line = '';
                        let tempY = y;
                        for (let n = 0; n < words.length; n++) {
                            const testLine = line + words[n] + ' ';
                            const metrics = context.measureText(testLine);
                            if (metrics.width > maxWidth && n > 0) {
                                context.fillText(line, x, tempY);
                                line = words[n] + ' ';
                                tempY += lineHeight;
                            } else {
                                line = testLine;
                            }
                        }
                        context.fillText(line, x, tempY);
                        return tempY + lineHeight;
                    };

                    let currentHeaderY = padding + 40;

                    if (pageIndex === 0) {
                        ctx.fillStyle = '#000000'; 
                        ctx.font = 'bold 48px sans-serif';
                        ctx.fillText(projectName || 'Project Title', padding, currentHeaderY);
                        
                        currentHeaderY += 60;
                        ctx.fillStyle = '#333333'; 
                        ctx.font = 'bold 36px sans-serif';
                        ctx.fillText(sceneTitle, padding, currentHeaderY);
                        
                        currentHeaderY += 40;
                        ctx.fillStyle = '#555555';
                        ctx.font = 'italic 24px sans-serif';
                        currentHeaderY = wrapText(ctx, scene.description || '', padding, currentHeaderY, boardWidth - (padding * 2), 32);

                        currentHeaderY += 20;

                        if (sceneCharactersArray.length > 0) {
                            ctx.fillStyle = '#111111';
                            ctx.font = 'bold 24px sans-serif';
                            ctx.fillText('Scene Cast:', padding, currentHeaderY);
                            
                            ctx.fillStyle = '#444444';
                            ctx.font = '24px sans-serif';
                            const castNames = sceneCharactersArray.map(c => c.name).join(' | ');
                            ctx.fillText(castNames, padding + 150, currentHeaderY);
                            currentHeaderY += 50;
                        }

                        ctx.fillStyle = '#f4f4f5'; 
                        ctx.fillRect(padding, currentHeaderY, boardWidth - (padding * 2), 120);
                        ctx.strokeStyle = '#e4e4e7';
                        ctx.strokeRect(padding, currentHeaderY, boardWidth - (padding * 2), 120);
                        
                        ctx.fillStyle = '#111111';
                        ctx.font = 'bold 20px sans-serif';
                        ctx.fillText('GLOBAL SCENE STYLES:', padding + 20, currentHeaderY + 35);
                        
                        ctx.font = '20px sans-serif';
                        ctx.fillStyle = '#333333';
                        const colWidth = (boardWidth - (padding * 2) - 40) / 4;
                        ctx.fillText(`Style: ${selectedStyle}`, padding + 20, currentHeaderY + 75);
                        ctx.fillText(`Tone: ${selectedTone}`, padding + 20 + colWidth, currentHeaderY + 75);
                        ctx.fillText(`Palette: ${selectedPalette}`, padding + 20 + (colWidth * 2), currentHeaderY + 75);
                        ctx.fillText(`Aspect Ratio: ${aspectRatio}`, padding + 20 + (colWidth * 3), currentHeaderY + 75);
                        
                        currentHeaderY += 150;

                        if (sceneLocations.length > 0) {
                            ctx.fillStyle = '#111111';
                            ctx.font = 'bold 24px sans-serif';
                            ctx.fillText('Locations:', padding, currentHeaderY);
                            
                            let locX = padding;
                            let maxLocHeight = 0;
                            const locImgWidth = 250;
                            
                            currentHeaderY += 30;

                            sceneLocations.forEach((loc, idx) => {
                                if (locX + locImgWidth > boardWidth - padding) {
                                    locX = padding;
                                    currentHeaderY += maxLocHeight + 30;
                                    maxLocHeight = 0;
                                }

                                ctx.fillStyle = '#333333';
                                ctx.font = 'bold 20px sans-serif';
                                ctx.fillText(loc.name, locX, currentHeaderY);
                                
                                let imgOffset = 25;
                                if (loadedImages[`loc-${loc.id}`]) {
                                    const img = loadedImages[`loc-${loc.id}`];
                                    const imgRatio = img.width / img.height;
                                    const drawHeight = locImgWidth / imgRatio;
                                    
                                    ctx.drawImage(img, locX, currentHeaderY + imgOffset, locImgWidth, drawHeight);
                                    ctx.strokeStyle = '#cccccc';
                                    ctx.strokeRect(locX, currentHeaderY + imgOffset, locImgWidth, drawHeight);
                                    
                                    maxLocHeight = Math.max(maxLocHeight, drawHeight + 40);
                                } else {
                                    ctx.fillStyle = '#f4f4f5';
                                    ctx.fillRect(locX, currentHeaderY + imgOffset, locImgWidth, 140);
                                    ctx.fillStyle = '#888888';
                                    ctx.font = '16px sans-serif';
                                    ctx.fillText('[No Location Image]', locX + 45, currentHeaderY + imgOffset + 75);
                                    maxLocHeight = Math.max(maxLocHeight, 180);
                                }
                                locX += locImgWidth + 30;
                            });
                            currentHeaderY += maxLocHeight + 40;
                        }

                        ctx.strokeStyle = '#dddddd'; 
                        ctx.lineWidth = 2;
                        ctx.beginPath();
                        ctx.moveTo(padding, currentHeaderY);
                        ctx.lineTo(boardWidth - padding, currentHeaderY);
                        ctx.stroke();
                        
                    } else {
                        ctx.fillStyle = '#555555';
                        ctx.font = 'bold 24px sans-serif';
                        ctx.fillText(`${sceneTitle} (Continued) - Page ${pageIndex + 1}`, padding, padding + 30);
                        
                        ctx.strokeStyle = '#dddddd'; 
                        ctx.lineWidth = 2;
                        ctx.beginPath();
                        ctx.moveTo(padding, padding + 60);
                        ctx.lineTo(boardWidth - padding, padding + 60);
                        ctx.stroke();
                    }

                    let shotYOffset = pageIndex === 0 ? currentHeaderY + 40 : padding + 100;

                    for (const layout of shotLayouts) {
                        const { shot, charsInShot } = layout;
                        const frameId = makeFrameId(scene.id, shot.id);
                        const yStart = shotYOffset;
                        
                        ctx.fillStyle = '#f8f8fa'; 
                        ctx.fillRect(padding, yStart, shotImgWidth, layout.height);
                        ctx.strokeStyle = '#cccccc'; 
                        ctx.strokeRect(padding, yStart, shotImgWidth, layout.height);

                        if (loadedImages[frameId]) {
                            const img = loadedImages[frameId];
                            const imgRatio = img.width / img.height;
                            const drawHeight = shotImgWidth / imgRatio;
                            const imgY = yStart + (layout.height - drawHeight) / 2;
                            ctx.drawImage(img, padding, imgY, shotImgWidth, drawHeight);
                        } else {
                            ctx.fillStyle = '#888888';
                            ctx.font = '24px sans-serif';
                            ctx.fillText('[No Image Rendered]', padding + shotImgWidth/2 - 100, yStart + layout.height/2);
                        }

                        const textX = padding + shotImgWidth + 40;
                        let currentTextY = yStart + 30;

                        ctx.fillStyle = '#000000';
                        ctx.font = 'bold 32px sans-serif';
                        ctx.fillText(`Shot ${shot.order ?? shot.id}: ${shot.type || 'Standard'}`, textX, currentTextY);
                        
                        currentTextY += 45;

                        ctx.fillStyle = '#555555';
                        ctx.font = '20px sans-serif';
                        
                        const metaColWidth = textPanelWidth / 2;
                        
                        ctx.fillText(`Camera: ${shot.camera || 'Auto'}`, textX, currentTextY);
                        ctx.fillText(`Lens: ${shot.lens || 'Auto'}`, textX + metaColWidth, currentTextY);
                        currentTextY += 30;
                        
                        ctx.fillText(`Angle: ${shot.cameraAngle || 'Auto'}`, textX, currentTextY);
                        ctx.fillText(`Movement: ${shot.cameraMovement || 'Auto'}`, textX + metaColWidth, currentTextY);
                        currentTextY += 30;
                        
                        ctx.fillText(`Specialty: ${shot.specialtyShot || 'None'}`, textX, currentTextY);
                        ctx.fillText(`Lighting: ${shot.lighting || 'Auto'}`, textX + metaColWidth, currentTextY);
                        currentTextY += 30;
                        
                        const activeTimePdf = (shot.timeOfDay && shot.timeOfDay !== 'Unspecified') ? shot.timeOfDay : (selectedGlobalTime !== 'Unspecified' ? selectedGlobalTime : 'Auto');
                        ctx.fillText(`Time: ${activeTimePdf}`, textX, currentTextY);
                        currentTextY += 40;

                        ctx.fillStyle = '#111111';
                        ctx.font = 'bold 22px sans-serif';
                        ctx.fillText(`Cast in Shot: ${charsInShot}`, textX, currentTextY);
                        currentTextY += 45;

                        if (shot.style || shot.tone || shot.palette) {
                            ctx.fillStyle = '#b45309'; 
                            ctx.font = 'italic 18px sans-serif';
                            const overrides = [];
                            if (shot.style) overrides.push(`Style: ${shot.style}`);
                            if (shot.tone) overrides.push(`Tone: ${shot.tone}`);
                            if (shot.palette) overrides.push(`Palette: ${shot.palette}`);
                            ctx.fillText(`Overrides: ${overrides.join(' | ')}`, textX, currentTextY);
                            currentTextY += 40;
                        }

                        if (shot.script_snippet) {
                            ctx.fillStyle = '#666666';
                            ctx.font = 'bold 16px sans-serif';
                            ctx.fillText('SCRIPT:', textX, currentTextY);
                            currentTextY += 25;
                            
                            ctx.fillStyle = '#222222';
                            ctx.font = 'italic 24px sans-serif';
                            currentTextY = wrapText(ctx, `"${shot.script_snippet}"`, textX, currentTextY, textPanelWidth, 36);
                            currentTextY += 20;
                        }

                        ctx.fillStyle = '#666666';
                        ctx.font = 'bold 16px sans-serif';
                        ctx.fillText('VISUAL DESCRIPTION:', textX, currentTextY);
                        currentTextY += 25;
                        
                        ctx.fillStyle = '#111111';
                        ctx.font = '24px sans-serif';
                        wrapText(ctx, shot.prompt || '', textX, currentTextY, textPanelWidth, 36);

                        shotYOffset += layout.height + shotSpacing;
                    }

                    const canvasData = canvas.toDataURL('image/jpeg', 0.95);
                    const pdfWidth = canvas.width;
                    const pdfHeight = canvas.height;
                    const orientation = pdfWidth > pdfHeight ? 'landscape' : 'portrait';

                    if (!pdf) {
                        pdf = new jsPDF({ orientation: orientation, unit: 'px', format: [pdfWidth, pdfHeight] });
                    } else {
                        pdf.addPage([pdfWidth, pdfHeight], orientation);
                    }
                    pdf.addImage(canvasData, 'JPEG', 0, 0, pdfWidth, pdfHeight);
                }

                if (generatedCollages[scene.id]) {
                    const collages = Array.isArray(generatedCollages[scene.id]) ? generatedCollages[scene.id] : [generatedCollages[scene.id]];
                    
                    for (let i = 0; i < collages.length; i++) {
                        const collageImg = new Image();
                        collageImg.src = collages[i];
                        await new Promise(r => collageImg.onload = r);
                        
                        const cCanvas = document.createElement('canvas');
                        cCanvas.width = boardWidth;
                        const colHeight = (boardWidth / (collageImg.width / collageImg.height)) + 200;
                        cCanvas.height = colHeight;
                        
                        const cCtx = cCanvas.getContext('2d');
                        cCtx.fillStyle = '#ffffff';
                        cCtx.fillRect(0, 0, boardWidth, colHeight);
                        
                        cCtx.fillStyle = '#111111';
                        cCtx.font = 'bold 48px sans-serif';
                        cCtx.fillText(`Scene ${scene.id} Collage ${i + 1}`, padding, 100);
                        
                        cCtx.drawImage(collageImg, padding, 150, boardWidth - (padding * 2), colHeight - 200);
                        
                        const cData = cCanvas.toDataURL('image/jpeg', 0.95);
                        const o = cCanvas.width > cCanvas.height ? 'landscape' : 'portrait';
                        
                        if (!pdf) {
                            pdf = new jsPDF({ orientation: o, unit: 'px', format: [cCanvas.width, cCanvas.height] });
                        } else {
                            pdf.addPage([cCanvas.width, cCanvas.height], o);
                        }
                        pdf.addImage(cData, 'JPEG', 0, 0, cCanvas.width, cCanvas.height);
                    }
                }
            }

            if (pdf) {
                pdf.save(`${projectName.replace(/[^a-z0-9]/gi, '_')}_Storyboard.pdf`);
                setAiStatus('PDF exported successfully without layout errors!');
            } else {
                setAiStatus('No content available to export.');
            }

        } catch (err) {
            console.error("PDF Export failed:", err);
            setAiStatus('Failed to generate PDF. Check console.');
        } finally {
            setGeneratingIds(prev => {
                const newSet = new Set(prev);
                newSet.delete('exporting-pdf');
                return newSet;
            });
        }
    };

    const handleImageUpload = async (e) => {
        const file = e.target.files[0];
        if (file) {
            setAiStatus("Scanning image for known faces...");
            const reader = new FileReader();
            reader.onloadend = async () => {
                const url = reader.result;
                const data = reader.result.split(',')[1];
                const mimeType = file.type;
                const imgObj = { url, data, mimeType };
                
                const idResult = await identifyActorFromImage(data, mimeType);
                if (idResult && idResult.recognized) {
                    setPendingActorMatch({ targetType: 'new', currentName: newCharName, imageDatas: [imgObj], detectedInfo: idResult });
                    setAiStatus("Face recognized! Waiting for confirmation.");
                } else {
                    setNewCharImage(imgObj);
                    setAiStatus("Image uploaded.");
                }
            };
            reader.readAsDataURL(file);
        }
    };

    const handleLocationImageUpload = (e) => {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                setNewLocationImage({ url: reader.result, data: reader.result.split(',')[1], mimeType: file.type });
            };
            reader.readAsDataURL(file);
        }
    };

    const handleAddCharacter = () => {
        const cleanName = newCharName.trim();
        if (cleanName) {
            let targetId = Date.now();
            const existingChar = characters.find(c => c.name.toLowerCase() === cleanName.toLowerCase());
            if (existingChar) targetId = existingChar.id;

            setCharacters((prev) => {
                const existingIdx = prev.findIndex(c => c.id === targetId);
                if (existingIdx >= 0) {
                    const updated = [...prev];
                    updated[existingIdx] = {
                        ...updated[existingIdx],
                        gender: newCharGender || updated[existingIdx].gender,
                        age: newCharAge || updated[existingIdx].age,
                        description: newCharDescription || updated[existingIdx].description,
                        images: newCharImage ? [...(updated[existingIdx].images || []), newCharImage] : (updated[existingIdx].images || [])
                    };
                    return updated;
                }
                return [...prev, { id: targetId, name: cleanName, gender: newCharGender, age: newCharAge, description: newCharDescription, images: newCharImage ? [newCharImage] : [] }];
            });
            
            setExpandedChars(prev => new Set(prev).add(targetId));
            setNewCharName('');
            setNewCharGender('');
            setNewCharAge('');
            setNewCharDescription('');
            setNewCharImage(null);
        }
    };

    const handleAddLocation = () => {
        const cleanName = newLocationName.trim();
        if (cleanName) {
            setLocations((prev) => {
                if (prev.some(l => l.name.toLowerCase() === cleanName.toLowerCase())) return prev;
                return [...prev, { id: Date.now(), name: cleanName, description: '', image: newLocationImage }];
            });
            setNewLocationName('');
            setNewLocationImage(null);
        }
    };

    const updateLocationDescription = (id, desc) => setLocations((prev) => prev.map((l) => l.id === id ? { ...l, description: desc } : l));
    const updateCharacterInfo = (id, field, value) => setCharacters((prev) => prev.map((c) => c.id === id ? { ...c, [field]: value } : c));

    const handleUpdateCharacterImage = async (id, e) => {
        const files = Array.from(e.target.files);
        if (files.length > 0) {
            setAiStatus("Scanning image for known faces...");
            
            const imageDatas = await Promise.all(files.map(file => new Promise((resolve) => {
                const reader = new FileReader();
                reader.onloadend = () => resolve({
                    url: reader.result,
                    data: reader.result.split(',')[1],
                    mimeType: file.type
                });
                reader.readAsDataURL(file);
            })));
            
            const firstImg = imageDatas[0];
            const idResult = await identifyActorFromImage(firstImg.data, firstImg.mimeType);
            
            if (idResult && idResult.recognized) {
                const char = characters.find(c => c.id === id);
                setPendingActorMatch({ 
                    targetType: 'existing', 
                    charId: id, 
                    currentName: char ? char.name : '',
                    imageDatas: imageDatas, 
                    detectedInfo: idResult 
                });
                setAiStatus("Face recognized! Waiting for confirmation.");
            } else {
                setCharacters((prev) => prev.map((c) => {
                    if (c.id === id) {
                        return { ...c, images: [...(c.images || []), ...imageDatas] };
                    }
                    return c;
                }));
                setAiStatus("Image uploaded.");
            }
        }
    };

    const handleRemoveCharacterImage = (charId, imageIndex) => {
        setCharacters(prev => prev.map(c => {
            if (c.id === charId) {
                const newImages = [...(c.images || [])];
                newImages.splice(imageIndex, 1);
                return { ...c, images: newImages };
            }
            return c;
        }));
    };

    const handleUpdateLocationImage = (id, e) => {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                setLocations((prev) => prev.map((l) => l.id === id ? { ...l, image: { url: reader.result, data: reader.result.split(',')[1], mimeType: file.type } } : l));
            };
            reader.readAsDataURL(file);
        }
    };

    const removeCharacter = (id) => setCharacters((prev) => prev.filter((c) => c.id !== id));
    const removeLocation = (id) => setLocations((prev) => prev.filter((l) => l.id !== id));

    const handleRemoveScene = (sceneId) => {
        updateScenesWithHistory((prev) => prev.filter((scene) => scene.id !== sceneId));
        if (selectedScene === sceneId) {
            const remaining = parsedScenesRef.current.filter(s => s.id !== sceneId);
            setSelectedScene(remaining.length > 0 ? remaining[0].id : null);
        }
        
        setGeneratedImages((prev) => {
            const next = { ...prev };
            Object.keys(next).forEach(key => {
                if (key.startsWith(`${sceneId}-`)) delete next[key];
            });
            return next;
        });
        
        setGeneratedCollages((prev) => {
            const next = { ...prev };
            delete next[sceneId];
            return next;
        });

        setGeneratedBreakdowns((prev) => {
            const next = { ...prev };
            Object.keys(next).forEach(key => {
                if (key.startsWith(`${sceneId}-`)) delete next[key];
            });
            return next;
        });

        setAiStatus('Scene deleted.');
    };

    const generateCharacterPortrait = async (id, name, gender, age, description) => {
        setAiStatus(`Designing character profile for ${name}...`);
        try {
            const charBase = `${gender || ''} ${age ? `aged ${age}` : ''}`.trim();
            let promptAddon = charBase ? `, who is a ${charBase}` : '';
            if (description) {
                promptAddon += `. Key visual traits and clothing: ${description}`;
            }
            const payload = {
                contents: [{
                    role: 'user',
                    parts: [{ text: `Create a clear, 4K Ultra HD, extremely high-quality, front-facing studio portrait headshot of a cinematic movie character named ${name}${promptAddon}. Masterpiece, hyper-detailed, sharp focus, professional lighting, neutral dark background, photorealistic concept art. They must look like a real actor. No text.` }]
                }],
                generationConfig: {
                    responseModalities: ['IMAGE'],
                    imageConfig: { aspectRatio: "1:1" }
                }
            };
            
            const apiUrl = geminiUrl(GEMINI_IMAGE_MODEL);

            const response = await fetch(apiUrl, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
            
            if (!response.ok) {
                const err = await response.json();
                console.error("Character Image API Error:", err);
                throw new Error(err.error?.message || "API error");
            }

            const result = await response.json();
            const part = result?.candidates?.[0]?.content?.parts?.find(p => p.inlineData);

            if (part && part.inlineData) {
                const mimeType = part.inlineData.mimeType;
                const data = part.inlineData.data;
                const url = `data:${mimeType};base64,${data}`;
                setCharacters((prev) => prev.map((c) => c.id === id ? { ...c, images: [...(c.images || []), { url, data, mimeType }] } : c));
                setAiStatus(`Character design generated for ${name}!`);
            } else { throw new Error('No image returned'); }
        } catch (error) { 
            console.error(error);
            setAiStatus(`Failed to generate character design for ${name}.`); 
        }
    };

    const generateLocationImage = async (id, name, description) => {
        setAiStatus(`Generating empty location for ${name}...`);
        setGeneratingIds((prev) => new Set(prev).add(`loc-gen-${id}`));
        try {
            const apiAspectRatio = ['1:1', '9:16', '16:9', '3:4', '4:3'].includes(aspectRatio) ? aspectRatio : '16:9';
            const payload = {
                contents: [{
                    role: 'user',
                    parts: [{ text: `Create a 4K Ultra HD, extremely high-quality, hyper-detailed cinematic establishing background shot of an empty location. Name: ${name}. Description: ${description || 'Empty environment'}. NO CHARACTERS. NO PEOPLE. Empty environment only. Global Style: ${selectedStyle}. Tone: ${selectedTone}. Palette: ${selectedPalette}. Masterpiece, sharp focus, professional cinematography.` }]
                }],
                generationConfig: {
                    responseModalities: ['IMAGE'],
                    imageConfig: { aspectRatio: apiAspectRatio }
                }
            };

            const apiUrl = geminiUrl(GEMINI_IMAGE_MODEL);

            const response = await fetch(apiUrl, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
            
            if (!response.ok) throw new Error("API error");

            const result = await response.json();
            const part = result?.candidates?.[0]?.content?.parts?.find(p => p.inlineData);

            if (part && part.inlineData) {
                const mimeType = part.inlineData.mimeType;
                const data = part.inlineData.data;
                const url = `data:${mimeType};base64,${data}`;
                setLocations((prev) => prev.map((l) => l.id === id ? { ...l, image: { url, data, mimeType } } : l));
                setAiStatus(`Empty location generated for ${name}!`);
            } else { throw new Error('No image returned'); }
        } catch (error) { 
            console.error(error);
            setAiStatus(`Failed to generate location for ${name}.`); 
        } finally {
            setGeneratingIds((prev) => { const newSet = new Set(prev); newSet.delete(`loc-gen-${id}`); return newSet; });
        }
    };

    const editLocationImage = async (id) => {
        const loc = locations.find(l => l.id === id);
        if (!loc || !loc.image) return;
        const editPrompt = locationEditPrompts[id];
        if (!editPrompt || !editPrompt.trim()) return;

        setAiStatus(`Applying edits to location ${loc.name}...`);
        setGeneratingIds((prev) => new Set(prev).add(`loc-edit-${id}`));

        try {
            const payload = {
                contents: [{
                    role: "user",
                    parts: [
                        {
                            inlineData: {
                                mimeType: loc.image.mimeType,
                                data: loc.image.data
                            }
                        },
                        { text: `Edit this location image according to the following instruction: ${editPrompt}. Maintain the exact same style, aspect ratio, and composition unless specifically instructed to change them. DO NOT add any people or characters unless explicitly asked.` }
                    ]
                }],
                generationConfig: { 
                    responseModalities: ['TEXT', 'IMAGE']
                }
            };

            const apiUrl = geminiUrl(GEMINI_IMAGE_MODEL);

            const response = await fetch(apiUrl, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
            
            if (!response.ok) {
                const err = await response.json();
                console.error("Image Edit API Error:", err);
                throw new Error(err.error?.message || "API error");
            }

            const result = await response.json();
            const part = result?.candidates?.[0]?.content?.parts?.find((p) => p.inlineData);

            if (part && part.inlineData) {
                const newImageUrl = `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
                setLocations((prev) => prev.map((l) => l.id === id ? { ...l, image: { url: newImageUrl, data: part.inlineData.data, mimeType: part.inlineData.mimeType } } : l));
                setLocationEditPrompts((prev) => ({ ...prev, [id]: '' })); 
                setEditingLocationId(null);
                setAiStatus(`Location edit successfully applied!`);
            } else { throw new Error('No image returned'); }
        } catch (error) {
            console.error("Location edit error:", error);
            setAiStatus('Failed to apply edit. Check console.');
        } finally {
            setGeneratingIds((prev) => { const newSet = new Set(prev); newSet.delete(`loc-edit-${id}`); return newSet; });
        }
    };

    const extractScenes = async (textToParse) => {
        const targetScript = typeof textToParse === 'string' ? textToParse : script;
        if (!targetScript.trim()) { setAiStatus('Please paste a script first.'); return; }
        
        setAiStatus('AI is analyzing script size...');

        try {
            const MAX_CHUNK_LENGTH = 15000;
            const chunks = [];
            let currentChunk = '';
            const lines = targetScript.split('\n');
            
            for (const line of lines) {
                if (currentChunk.length > MAX_CHUNK_LENGTH) {
                    if (/^(INT\.|EXT\.|INT\/EXT\.|I\/E\.|SCENE \d+)/i.test(line.trim())) {
                        chunks.push(currentChunk);
                        currentChunk = line + '\n';
                        continue;
                    } else if (currentChunk.length > MAX_CHUNK_LENGTH + 5000) {
                        chunks.push(currentChunk);
                        currentChunk = line + '\n';
                        continue;
                    }
                }
                currentChunk += line + '\n';
            }
            if (currentChunk.trim()) chunks.push(currentChunk);

            let allScenes = [];
            let allCharacters = new Map();
            let allLocations = new Map();
            let globalSceneId = parsedScenesRef.current.length > 0 ? Math.max(...parsedScenesRef.current.map(s => s.id)) + 1 : 1;

            for (let i = 0; i < chunks.length; i++) {
                setAiStatus(`Extracting scenes (Part ${i + 1} of ${chunks.length})...`);
                
                const systemInstruction = `You are a master screenwriter and expert story editor. Read and analyze the provided screenplay or story text. Use your deep narrative intelligence to natively understand the script and break it down into distinct, logical scenes.

LANGUAGE STRATEGY: ${scriptLanguage}.

CRITICAL INSTRUCTIONS FOR AI SCREENWRITER:
1. INTELLIGENT SCENE DELINEATION: Identify scene boundaries natively. Look for explicit scene headings (e.g., INT/EXT), but if they are missing, poorly formatted, or the text is prose, use your screenwriter intuition to detect shifts in location, time, or major narrative beats to separate scenes logically.
2. COMPLETE COVERAGE: You must extract EVERY SINGLE PART of the text. Do not skip, drop, or summarize any dialogue or action. 
3. SCENE DESCRIPTION (CRITICAL): For the "description" field, provide the EXACT, COMPLETE original text that belongs to that scene. DO NOT summarize, edit, cut, or remove any content. THIS TEXT MUST BE WRITTEN IN THE LANGUAGE SPECIFIED BY THE LANGUAGE STRATEGY. If 'Auto-Detect', DO NOT TRANSLATE IT, keep it exactly in the native script language.
4. SCENE TITLE: Use the exact explicit scene heading as the title. If none exists, invent a professional, concise screenwriter-style slugline (e.g., "INT. KITCHEN - DAY" or "STREET CHASE") that accurately reflects the scene's setting and time based on your understanding of the text.
5. CHARACTERS IN SCENE: For each scene, deduce and list all characters that are physically present or actively speaking as simple strings. ALL CHARACTER NAMES MUST BE TRANSLATED TO AND WRITTEN IN ENGLISH.
6. LOCATIONS: List all distinct locations mentioned or implied in the text as strings.
7. NO HALLUCINATIONS (STRICT): Do NOT invent, hallucinate, or add any story elements, actions, props, or dialogue that are not present in the provided text. Stick strictly to the source material.

Output STRICTLY a valid JSON object matching this schema:
{
  "characters": [
    { "name": "Character Name", "gender": "Male/Female/Etc", "age": "30s", "description": "Visual description" }
  ],
  "locations": [
    { "name": "EXT. LOCATION - DAY", "description": "Brief description" }
  ],
  "scenes": [
    {
      "title": "SCENE 1 - INT. ROOM - DAY",
      "description": "Full unedited text of the scene...",
      "characters_in_scene": ["Character Name"],
      "locations": ["EXT. LOCATION - DAY"]
    }
  ]
}

Output STRICTLY a valid JSON object. No markdown, no extra text.`;

                const payload = {
                    contents: [{ role: 'user', parts: [{ text: "Script Text:\n" + chunks[i] }] }],
                    systemInstruction: { parts: [{ text: systemInstruction }] },
                    generationConfig: { responseMimeType: "application/json" }
                };

                const apiUrl = geminiUrl(GEMINI_TEXT_MODEL);

                const response = await fetch(apiUrl, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
                
                if (!response.ok) {
                    const errorData = await response.json().catch(() => ({}));
                    console.error(`API Error on chunk ${i+1}:`, errorData);
                    setAlertMessage(`API Error: ${errorData.error?.message || response.statusText}. Please ensure you have pasted a valid Gemini API Key from Google AI Studio.`);
                    setAiStatus('Extraction halted due to invalid API Key.');
                    break;
                }

                const result = await response.json();
                
                if (result.candidates?.[0]?.content?.parts?.[0]) {
                    try {
                        const jsonText = result.candidates[0].content.parts[0].text;
                        const parsedResponse = parseAIJson(jsonText);
                        
                        const generatedScenes = (parsedResponse.scenes || []).map(scene => {
                            if (Array.isArray(scene.characters_in_scene)) {
                                scene.characters_in_scene.forEach(c => {
                                    const cleanName = typeof c === 'string' ? c.trim() : String(c).trim();
                                    const lower = cleanName.toLowerCase();
                                    if (lower && !allCharacters.has(lower)) {
                                        allCharacters.set(lower, { name: cleanName, gender: '', age: '', description: '' });
                                    }
                                });
                            }
                            return {
                                title: scene.title,
                                description: scene.description,
                                id: globalSceneId++,
                                shots: [],
                                locationIds: [],
                                _extractedLocations: scene.locations || (scene.location ? [scene.location] : [])
                            };
                        });
                        
                        const extractedCharacters = parsedResponse.characters || [];
                        extractedCharacters.forEach(c => {
                            if (typeof c === 'string') {
                                const cleanName = c.trim();
                                const lower = cleanName.toLowerCase();
                                if (lower && !allCharacters.has(lower)) {
                                    allCharacters.set(lower, { name: cleanName, gender: '', age: '', description: '' });
                                }
                            } else if (c && c.name) {
                                const cleanName = c.name.trim();
                                const lower = cleanName.toLowerCase();
                                if (lower) {
                                    const existing = allCharacters.get(lower) || { name: cleanName, gender: '', age: '', description: '' };
                                    allCharacters.set(lower, {
                                        name: existing.name,
                                        gender: c.gender || existing.gender,
                                        age: (c.age !== undefined && c.age !== null) ? String(c.age) : existing.age,
                                        description: c.description || existing.description
                                    });
                                }
                            }
                        });

                        const extractedLocations = parsedResponse.locations || [];
                        extractedLocations.forEach(locObj => {
                            if (typeof locObj === 'string') {
                                if (!allLocations.has(locObj)) allLocations.set(locObj, '');
                            } else if (locObj && locObj.name) {
                                if (!allLocations.has(locObj.name)) allLocations.set(locObj.name, locObj.description || '');
                            }
                        });
                        
                        allScenes = [...allScenes, ...generatedScenes];
                    } catch (e) {
                        console.error(`JSON Parse Error on chunk ${i+1}:`, e);
                        setAlertMessage(`Failed to parse AI response: ${e.message}`);
                    }
                }
            }

            if (allLocations.size > 0) {
                setLocations(prev => {
                    const existingNames = new Set(prev.map(l => l.name.trim().toLowerCase()));
                    const newLocs = [];
                    let idx = 0;
                    Array.from(allLocations.entries()).forEach(([name, desc]) => {
                        const cleanName = typeof name === 'string' ? name.trim() : String(name).trim();
                        const lowerName = cleanName.toLowerCase();
                        if (cleanName && !existingNames.has(lowerName)) {
                            existingNames.add(lowerName);
                            newLocs.push({ id: Date.now() + 2000 + idx++, name: cleanName, description: desc, image: null });
                        }
                    });
                    
                    const finalLocations = [...prev, ...newLocs];
                    
                    if (allScenes.length > 0) {
                        allScenes = allScenes.map(s => {
                            const locIds = [];
                            if (s._extractedLocations && s._extractedLocations.length > 0) {
                                s._extractedLocations.forEach(locName => {
                                    const match = finalLocations.find(l => l.name.toLowerCase() === locName.toLowerCase());
                                    if (match) locIds.push(match.id);
                                });
                            }
                            return { ...s, locationIds: locIds };
                        });
                    }
                    return finalLocations;
                });
            }

            if (allScenes.length > 0) {
                updateScenesWithHistory(prev => [...prev, ...allScenes]);
                setSelectedScene(allScenes[0].id);
                if (allCharacters.size > 0) {
                    setCharacters(prev => {
                    const existingNames = new Set(prev.map(c => c.name.trim().toLowerCase()));
                    const newChars = [];
                    let idx = 0;
                    Array.from(allCharacters.values()).forEach(charData => {
                        const lowerName = charData.name.toLowerCase();
                        if (charData.name && !existingNames.has(lowerName)) {
                            existingNames.add(lowerName);
                            newChars.push({ 
                                id: Date.now() + 1000 + idx++, 
                                name: charData.name, 
                                gender: charData.gender || '', 
                                age: charData.age || '', 
                                description: charData.description || '', 
                                images: [] 
                            });
                        }
                    });
                    return [...prev, ...newChars];
                });
            }
            setAiStatus(`Extracted ${allScenes.length} scenes, ${allCharacters.size} characters, and ${allLocations.size} locations total!`);
            setActiveTab('assets');
        } else { 
            setAiStatus('No scenes could be generated from the text.'); 
            setAlertMessage('No scenes were extracted. Please ensure your script contains standard formal scene headings (e.g., "INT. ROOM - DAY") or check if the API key is valid.');
            }
        } catch (error) { 
            console.error("Extraction error:", error);
            setAiStatus('Failed to extract scenes.'); 
            setAlertMessage(`Failed to extract scenes: ${error.message}`);
        }
    };

    const generatePropsBreakdown = async (sceneId) => {
        const scene = parsedScenesRef.current.find(s => s.id === sceneId);
        if (!scene || !scene.description) return;
        
        setAiStatus(`Extracting Props & Elements for Scene ${sceneId}...`);
        setGeneratingIds(prev => new Set(prev).add(`props-${sceneId}`));
        
        try {
            const payload = {
                contents: [{ role: 'user', parts: [{ text: "Analyze this scene and extract the required production elements:\n" + scene.description }] }],
                generationConfig: {
                    responseMimeType: "application/json",
                    responseSchema: {
                        type: "OBJECT",
                        properties: {
                            props: { type: "ARRAY", items: { type: "STRING" }, description: "Physical objects actors interact with." },
                            vfx: { type: "ARRAY", items: { type: "STRING" }, description: "Visual effects, CGI, or compositing needed." },
                            sfx: { type: "ARRAY", items: { type: "STRING" }, description: "Special practical effects (weather, explosions, blood)." },
                            wardrobe: { type: "ARRAY", items: { type: "STRING" }, description: "Specific clothing or costume requirements mentioned." }
                        }
                    }
                }
            };
            
            const apiUrl = geminiUrl(GEMINI_TEXT_MODEL);
            
            const response = await fetch(apiUrl, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
            if (!response.ok) throw new Error("API error");
            
            const result = await response.json();
            if (result.candidates?.[0]?.content?.parts?.[0]?.text) {
                const json = result.candidates[0].content.parts[0].text;
                const parsed = JSON.parse(json);
                updateSceneDetails(sceneId, 'propsBreakdown', parsed);
                setAiStatus(`Props & VFX extracted for Scene ${sceneId}.`);
            } else {
                throw new Error("No text returned.");
            }
        } catch (err) {
            console.error(err);
            setAiStatus("Failed to extract breakdown.");
        } finally {
            setGeneratingIds(prev => { const newSet = new Set(prev); newSet.delete(`props-${sceneId}`); return newSet; });
        }
    };

    const suggestShotAlternatives = async (sceneId, shotId) => {
        const scene = parsedScenesRef.current.find(s => s.id === sceneId);
        if (!scene) return;
        const shot = scene.shots.find(s => s.id === shotId);
        if (!shot) return;

        setAiStatus(`Brainstorming shot alternatives...`);
        const frameId = makeFrameId(sceneId, shotId);
        setGeneratingIds(prev => new Set(prev).add(`alts-${frameId}`));
        
        try {
            const systemInstruction = `You are a creative cinematographer. The user has a specific shot planned. Suggest 2 alternative ways to shoot the exact same action to evoke a different emotional response. Keep descriptions extremely brief. Format as a bulleted list.`;
            
            const payload = {
                contents: [{ role: 'user', parts: [{ text: "Action: " + shot.prompt + "\nCurrent Plan: " + shot.type + ", " + shot.cameraAngle + ", " + shot.cameraMovement }] }],
                systemInstruction: { parts: [{ text: systemInstruction }] },
            };
            
            const apiUrl = geminiUrl(GEMINI_TEXT_MODEL);
            
            const response = await fetch(apiUrl, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
            if (!response.ok) throw new Error("API error");
            
            const result = await response.json();
            if (result.candidates?.[0]?.content?.parts?.[0]?.text) {
                const notes = result.candidates[0].content.parts[0].text;
                updateScenesWithHistory((prev) => prev.map((s) => s.id !== sceneId ? s : { ...s, shots: s.shots.map((sh) => sh.id === shotId ? { ...sh, aiIdeas: notes } : sh) }));
                setAiStatus(`Added alternatives to shot.`);
            } else {
                throw new Error("No text returned.");
            }
        } catch (err) {
            console.error(err);
            setAiStatus("Failed to generate alternatives.");
        } finally {
            setGeneratingIds(prev => { const newSet = new Set(prev); newSet.delete(`alts-${frameId}`); return newSet; });
        }
    };

    const generateShotMultiCamOptions = async (sceneId, shotId) => {
        const scene = parsedScenesRef.current.find(s => s.id === sceneId);
        if (!scene) return;
        const shot = scene.shots.find(s => s.id === shotId);
        if (!shot) return;

        setAiStatus(`Designing multi-cam angles for Shot ${shot.order ?? shot.id}...`);
        const genId = `multicam-gen-${sceneId}-${shotId}`;
        setGeneratingIds(prev => new Set(prev).add(genId));
        
        try {
            const systemInstruction = `You are a multi-camera director. The user has a specific shot action. You need to provide 3 simultaneous camera angles covering this exact same moment (e.g., A-Cam Master, B-Cam Medium, C-Cam Close-up).
Return a JSON array of 3 objects matching this schema:
[
  {
    "id": "1",
    "camLabel": "A-Cam (Master)",
    "type": "Select exactly one from: [${FRAMING_SHOTS.join(', ')}]",
    "cameraAngle": "Select exactly one from: [${CAMERA_ANGLES.join(', ')}]",
    "cameraMovement": "Select exactly one from: [${CAMERA_MOVEMENTS.join(', ')}]",
    "specialtyShot": "Select exactly one from: [${SPECIALTY_SHOTS.join(', ')}]",
    "lighting": "Select exactly one from: [${LIGHTING_STYLES.join(', ')}]",
    "lens": "Select an appropriate cinema lens (e.g., Cooke S4/i 35mm)",
    "prompt": "Detailed visual description of this specific angle. Describe the emotional impact."
  }
]`;

            const payload = {
                contents: [{ role: 'user', parts: [{ text: `Original Action/Prompt: ${shot.prompt}\nScript Snippet: ${shot.script_snippet}\nGenerate 3 multi-cam coverage angles for this exact moment.` }] }],
                systemInstruction: { parts: [{ text: systemInstruction }] },
                generationConfig: { responseMimeType: "application/json" }
            };
            
            const apiUrl = geminiUrl(GEMINI_TEXT_MODEL);
            
            const response = await fetch(apiUrl, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
            if (!response.ok) throw new Error("API error");
            
            const result = await response.json();
            if (result.candidates?.[0]?.content?.parts?.[0]?.text) {
                const jsonText = result.candidates[0].content.parts[0].text;
                const parsedData = parseAIJson(jsonText);
                let options = Array.isArray(parsedData) ? parsedData : (parsedData.options || []);
                
                options = options.map((opt, idx) => ({...opt, id: `${Date.now()}-${idx}`}));
                
                updateScenesWithHistory((prev) => prev.map((s) => {
                    if (s.id !== sceneId) return s;
                    return {
                        ...s,
                        shots: s.shots.map(sh => {
                            if (sh.id !== shotId) return sh;
                            return { ...sh, multiCamOptions: options };
                        })
                    };
                }));
                setAiStatus(`Generated multi-cam angles successfully!`);
            } else {
                throw new Error("No text returned.");
            }
        } catch (err) {
            console.error(err);
            setAiStatus("Failed to generate multi-cam angles.");
        } finally {
            setGeneratingIds(prev => { const newSet = new Set(prev); newSet.delete(genId); return newSet; });
        }
    };

    const applyMultiCamAsFinal = (sceneId, shotId, mcOption) => {
        const mcFrameId = makeMcFrameId(sceneId, shotId, mcOption.id);
        const finalFrameId = makeFrameId(sceneId, shotId);

        updateScenesWithHistory(prev => prev.map(scene => {
            if (scene.id !== sceneId) return scene;
            return {
                ...scene,
                shots: scene.shots.map(shot => {
                    if (shot.id !== shotId) return shot;
                    return {
                        ...shot,
                        type: mcOption.type || shot.type,
                        cameraAngle: mcOption.cameraAngle || shot.cameraAngle,
                        cameraMovement: mcOption.cameraMovement || shot.cameraMovement,
                        specialtyShot: mcOption.specialtyShot || shot.specialtyShot,
                        lighting: mcOption.lighting || shot.lighting,
                        lens: mcOption.lens || shot.lens,
                        prompt: mcOption.prompt || shot.prompt
                    };
                })
            };
        }));

        if (generatedImagesRef.current[mcFrameId]) {
             const imgUrl = generatedImagesRef.current[mcFrameId];
             generatedImagesRef.current[finalFrameId] = imgUrl;
             setGeneratedImages(prev => ({ ...prev, [finalFrameId]: imgUrl }));
        }

        setAiStatus(`Applied ${mcOption.camLabel} as the final shot.`);
    };

    const generateStoryboardShots = async (sceneId) => {
        const scene = parsedScenesRef.current.find(s => s.id === sceneId);
        if (!scene) return;
        setAiStatus(`AI is writing descriptions and planning shots for ${scene.title}...`);

        try {
            const mappedLocIds = scene.locationIds || [];
            const sceneLocations = locations.filter(loc => mappedLocIds.includes(loc.id));
            const locDescriptions = sceneLocations.map(l => `- [ID: ${l.id}] ${l.name}: ${l.description || 'No detailed description'}`).join('\n');
            const locContext = locDescriptions ? `\n\nScene Locations & Environment Details:\n${locDescriptions}\n(CRITICAL: Assign the correct location ID to each shot based on where the action occurs. Ensure your shot descriptions strictly align with these location environments. Do not invent contrasting settings.)` : '';

            const directorInstruction = selectedDirector !== 'None / Auto' ? `\n\n*** AI DIRECTOR MODE: ${selectedDirector} ***\nCRITICAL: Act as the legendary film director ${selectedDirector}. Direct this sequence entirely in their signature cinematic style. Frame the shots, choose the lenses, direct the camera movement, pace the cuts, and design the lighting EXACTLY as they would to evoke their distinct emotional rhythm and mass appeal. Your JSON output MUST reflect their unique visual trademarks heavily in the metadata fields and prompt!` : '';

            const availableLensesStr = selectedGlobalLensGroup !== 'Auto / Any' && LENS_GROUPS[selectedGlobalLensGroup]
                ? `Select exactly one from: [${LENS_GROUPS[selectedGlobalLensGroup].join(', ')}]`
                : 'Select an appropriate cinema lens (e.g., Cooke S4/i 35mm)';
            const availableCamerasStr = selectedGlobalCamera !== 'Auto / Any'
                ? `You MUST use this exact camera: ${selectedGlobalCamera}`
                : 'Select a popular cinema camera system';

            const systemInstruction = `You are a veteran film director, screenwriter, and expert cinematographer. 
Analyze the scene's script text (which includes both action descriptions and dialogues) and break it down into a sequence of impactful cinematic shots.
LANGUAGE STRATEGY: ${scriptLanguage}. 
CRITICAL RULES FOR SHOT DIVISION:
1. USE ENTIRE SCENE: You MUST use the ENTIRE scene content provided. Do NOT miss, skip, edit out, or remove any dialogue or action. 
2. PRESERVE EXISTING SHOTS OR INTELLIGENTLY GROUP: If the provided script ALREADY contains explicit shot divisions, numbers, or camera angles (e.g., "Shot 1:", "Angle on:", "Close up:"), YOU MUST PRESERVE THAT EXACT DIVISION 1:1. Do not merge or split them. IF AND ONLY IF the script is standard prose/dialogue without explicit shot divisions, you must act as a veteran editor: group continuous actions/dialogues intelligently into impactful shots (e.g., a fluid Master Shot or a Two-Shot) rather than blindly assigning one shot per line. Let emotional pacing dictate the cuts.
3. COMPLETE BUT CONDENSED COVERAGE: Every part of the script must be represented.
4. CONTINUITY: You must define a consistent dress code for the characters in this scene and apply it to every shot to maintain continuity.
5. NO HALLUCINATIONS (STICK TO THE STORY): DO NOT invent actions, props, or events that are beyond the story text provided. Translate the script into visual shots with high intelligence, but do not hallucinate new narrative beats.
6. EXACT CHARACTER & LOCATION MAPPING: You MUST use the exact Character Names and Location Names in the 'prompt' field. Do not use generic pronouns like "a man" or "he/she" if the character is named.${directorInstruction}

Output STRICTLY a valid JSON object matching this schema:
{
  "scene_dress_code": "Detailed description of outfits for all visible characters in this scene.",
  "shots": [
    {
      "id": 1,
      "category": "Action",
      "script_snippet": "EXACT, UNALTERED quote from the original script text. MUST BE IN THE LANGUAGE SPECIFIED BY THE LANGUAGE STRATEGY. DO NOT TRANSLATE IF AUTO-DETECT IS SET.",
      "type": "Select exactly one from: [${FRAMING_SHOTS.join(', ')}]",
      "cameraAngle": "Select exactly one from: [${CAMERA_ANGLES.join(', ')}]",
      "cameraMovement": "Select exactly one from: [${CAMERA_MOVEMENTS.join(', ')}]",
      "specialtyShot": "Select exactly one from: [${SPECIALTY_SHOTS.join(', ')}]",
      "lighting": "Select exactly one from: [${LIGHTING_STYLES.join(', ')}]",
      "timeOfDay": "Select exactly one from: [${TIME_OF_DAY.join(', ')}]",
      "duration": "3s",
      "prompt": "Highly detailed visual description for this shot. CRITICAL: You MUST use the exact Character Names and Location Names in this description (e.g., 'Jack yells at Rose in the Kitchen' instead of 'A man yells at a woman in a room'). DO NOT add actions beyond the script snippet.",
      "camera": "${availableCamerasStr}",
      "lens": "${availableLensesStr}",
      "location_id": 12345, 
      "characters_present": ["Character1", "Character2"] 
    }
  ]
}

CRITICAL INSTRUCTIONS:
- SELECTIONS MUST MATCH EXACTLY: Do not invent values for type, cameraAngle, cameraMovement, specialtyShot, lighting, or timeOfDay. You MUST pick from the provided list strings.
- STRICT CONTINUITY: Make sure the scene_dress_code comprehensively covers all characters visible in the scene.
- INCORPORATE CHARACTER TRAITS: Ensure you incorporate the specific ages and genders of the Project Characters in your shot descriptions to keep continuity.
- "characters_present": It is absolutely vital that you list the names of the characters that are VISUALLY PRESENT in the frame of each specific shot using logic. Exclude characters who are off-screen or the ones whose POV it is.

Output STRICTLY a valid JSON object. No markdown, no extra text.`;
            
            const charDescriptions = characters.map(c => `${c.name} ${c.gender ? `(${c.gender})` : ''} ${c.age ? `[Age: ${c.age}]` : ''}`).filter(Boolean).join(', ');
            
            const dnaContext = extractedDnaStyle ? `\n\n***EXTRACTED EXTREME CINEMATIC DNA PREFERENCES***:\nYou MUST heavily bias your shot generation and JSON metadata towards this extracted DNA profile. Adopt these styles universally across the scene unless the script dictates otherwise:
- Preferred Camera Angle: ${extractedDnaStyle.cameraAngle || 'Any'}
- Preferred Shot Type/Framing: ${extractedDnaStyle.shotType || 'Any'}
- Preferred Lens: ${extractedDnaStyle.lens || 'Any'}
- Lighting Style to Emulate: ${extractedDnaStyle.lighting || 'Cinematic'}
- Color/Grading Mood: ${extractedDnaStyle.colorGrade || 'Cinematic'}
- Overall Mood/Tone: ${extractedDnaStyle.mood || 'Standard'}
Ensure the ENUM selections (type, cameraAngle, etc) match the required arrays in the schema, but use the 'prompt' field to heavily describe the lighting, lens feel, and color grade extracted here.` : '';

            const promptText = `Scene Title: ${scene.title}\nOriginal Script for this Scene:\n${scene.description}\n\nProject Characters: ${charDescriptions}${locContext}\n\nGlobal Visual Style: ${selectedStyle}\nGlobal Cinematic Tone: ${selectedTone}\nGlobal Color Palette: ${selectedPalette}\nGlobal Time of Day: ${selectedGlobalTime}\nGlobal Camera: ${selectedGlobalCamera}\nGlobal Lens Group: ${selectedGlobalLensGroup}${dnaContext}\n\nPlan the cinematic shots covering the actions and dialogues, and write detailed visual descriptions for each. Ensure every part of the script is covered and matches the specified global style, tone, and color palette (or the Extracted DNA if present).`;
            
            const payload = {
                contents: [{ role: 'user', parts: [{ text: promptText }] }],
                systemInstruction: { parts: [{ text: systemInstruction }] },
                generationConfig: { responseMimeType: "application/json" }
            };

            const apiUrl = geminiUrl(GEMINI_TEXT_MODEL);
            
            const response = await fetch(apiUrl, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
            
            if (!response.ok) {
                const err = await response.json();
                console.error("Shot Planning API Error:", err);
                throw new Error(err.error?.message || "API error");
            }

            const result = await response.json();

            if (result.candidates?.[0]?.content?.parts?.[0]) {
                const jsonText = result.candidates[0].content.parts[0].text;
                const parsedData = parseAIJson(jsonText);
                
                const isArray = Array.isArray(parsedData);
                const dressCode = isArray ? '' : (parsedData.scene_dress_code || '');
                let generatedShots = isArray ? parsedData : (parsedData.shots || []);
                
                if (!Array.isArray(generatedShots)) {
                    generatedShots = typeof generatedShots === 'object' && generatedShots !== null ? Object.values(generatedShots) : [];
                }
                
                if (generatedShots.length > 0) {
                    const shotsWithOrder = generatedShots.map((s, idx) => {
                        const newId = s.id ? parseInt(s.id, 10) || (Date.now() + idx) : (Date.now() + idx);
                        const safePrompt = typeof s.prompt === 'string' ? s.prompt : 'Cinematic shot sequence';
                        
                        return { 
                            ...s, 
                            id: newId,
                            prompt: safePrompt,
                            order: s.order ? parseFloat(s.order) : newId, 
                            tone: s.tone || '', 
                            palette: s.palette || '',
                            camera: s.camera || '',
                            lens: s.lens || '',
                            locationId: s.location_id || null,
                            cameraAngle: s.cameraAngle || CAMERA_ANGLES[0],
                            cameraMovement: s.cameraMovement || CAMERA_MOVEMENTS[0],
                            specialtyShot: s.specialtyShot || SPECIALTY_SHOTS[0],
                            lighting: s.lighting || LIGHTING_STYLES[0],
                            timeOfDay: s.timeOfDay || TIME_OF_DAY[0],
                            type: s.type || FRAMING_SHOTS[0]
                        };
                    });
                    
                    let newDescription = scene.description || '';
                    if (dressCode) {
                        newDescription = newDescription.replace(/\n\n\[SCENE DRESS CODE:[\s\S]*?\]/g, '');
                        newDescription += `\n\n[SCENE DRESS CODE: ${dressCode}]`;
                    }

                    updateScenesWithHistory((prev) => prev.map((s) => (s.id === sceneId ? { ...s, description: newDescription, shots: shotsWithOrder } : s)));
                    setAiStatus(`Shot descriptions generated for ${scene.title}! Ready to render images.`);
                } else { setAiStatus('No shots could be planned.'); }
            } else { throw new Error("Invalid API response"); }
        } catch (error) { 
            console.error("Shot generation error:", error);
            setAiStatus('Failed to plan shots and descriptions.'); 
        }
    };

    const generateMultiCamCoverage = async (sceneId) => {
        const scene = parsedScenesRef.current.find(s => s.id === sceneId);
        if (!scene) return;
        setAiStatus(`AI is designing Multi-Camera Coverage for ${scene.title}...`);

        try {
            const mappedLocIds = scene.locationIds || [];
            const sceneLocations = locations.filter(loc => mappedLocIds.includes(loc.id));
            const locDescriptions = sceneLocations.map(l => `- [ID: ${l.id}] ${l.name}: ${l.description || 'No detailed description'}`).join('\n');
            const locContext = locDescriptions ? `\n\nScene Locations & Environment Details:\n${locDescriptions}\n(CRITICAL: Assign the correct location ID to each shot based on where the action occurs. Ensure your shot descriptions strictly align with these location environments.)` : '';

            const directorInstruction = selectedDirector !== 'None / Auto' ? `\n\n*** AI DIRECTOR MODE: ${selectedDirector} ***\nCRITICAL: Act as the legendary film director ${selectedDirector}. Direct this coverage entirely in their signature cinematic style. Frame the shots, choose the lenses, direct the camera movement, and design the lighting EXACTLY as they would to evoke their distinct emotional rhythm.` : '';

            const availableLensesStr = selectedGlobalLensGroup !== 'Auto / Any' && LENS_GROUPS[selectedGlobalLensGroup]
                ? `Select exactly one from: [${LENS_GROUPS[selectedGlobalLensGroup].join(', ')}]`
                : 'Select an appropriate cinema lens (e.g., Cooke S4/i 35mm)';
            const availableCamerasStr = selectedGlobalCamera !== 'Auto / Any'
                ? `You MUST use this exact camera: ${selectedGlobalCamera}`
                : 'Select a popular cinema camera system';

            const systemInstruction = `You are a veteran multi-camera film director, screenwriter, and expert cinematographer. 
Analyze the scene's script text and design a complete Multi-Camera Coverage Package.
Instead of a linear chronological storyboard, provide the simultaneous or overlapping coverage angles needed to edit this scene flawlessly.
You MUST adhere strictly to the 180-degree rule to ensure edit-safe continuity.

LANGUAGE STRATEGY: ${scriptLanguage}. 

COVERAGE REQUIREMENTS:
1. Master Shot (A-Cam): A wide or extreme wide shot establishing the geography and covering the main action.
2. Coverage Shots (B-Cam/C-Cam): Medium and Over-The-Shoulder (OTS) shots for dialogue delivery. Ensure they cross-shoot correctly.
3. Close-Ups: Tight shots on faces for emotional beats and reactions.
4. Inserts/Cutaways: Close shots of important props, hands, or details.
5. CONTINUITY: You must define a consistent dress code for the characters in this scene.
6. NO HALLUCINATIONS: DO NOT invent actions or story elements that go beyond the script text.
7. EXACT MAPPING: Use the exact Character Names and Location Names in your prompts.${directorInstruction}

Output STRICTLY a valid JSON object matching this schema:
{
  "scene_dress_code": "Detailed description of outfits for all visible characters in this scene.",
  "coverage_plan": "Provide a 2-sentence explanation of your multi-cam setup, where you placed the 180-degree line, and how this ensures edit-safe continuity.",
  "shots": [
    {
      "id": 1,
      "category": "A-Cam Master", 
      "script_snippet": "The portion of script this angle primarily covers.",
      "type": "Select exactly one from: [${FRAMING_SHOTS.join(', ')}]",
      "cameraAngle": "Select exactly one from: [${CAMERA_ANGLES.join(', ')}]",
      "cameraMovement": "Select exactly one from: [${CAMERA_MOVEMENTS.join(', ')}]",
      "specialtyShot": "Select exactly one from: [${SPECIALTY_SHOTS.join(', ')}]",
      "lighting": "Select exactly one from: [${LIGHTING_STYLES.join(', ')}]",
      "timeOfDay": "Select exactly one from: [${TIME_OF_DAY.join(', ')}]",
      "duration": "15s",
      "prompt": "Highly detailed visual description for this shot. CRITICAL: You MUST use the exact Character Names and Location Names in this description (e.g., 'Jack yells at Rose in the Kitchen'). DO NOT add actions beyond the script snippet.",
      "camera": "${availableCamerasStr}",
      "lens": "${availableLensesStr}",
      "location_id": 12345,
      "characters_present": ["Character1"]
    }
  ]
}

CRITICAL INSTRUCTIONS:
- SELECTIONS MUST MATCH EXACTLY: Do not invent values for ENUM arrays.
- "characters_present": List the names of the characters visually present in the frame of each specific shot.

Output STRICTLY a valid JSON object. No markdown, no extra text.`;
            
            const charDescriptions = characters.map(c => `${c.name} ${c.gender ? `(${c.gender})` : ''} ${c.age ? `[Age: ${c.age}]` : ''}`).filter(Boolean).join(', ');
            
            const dnaContext = extractedDnaStyle ? `\n\n***EXTRACTED EXTREME CINEMATIC DNA PREFERENCES***:\nYou MUST heavily bias your shot generation towards this extracted DNA profile:
- Preferred Camera Angle: ${extractedDnaStyle.cameraAngle || 'Any'}
- Preferred Shot Type/Framing: ${extractedDnaStyle.shotType || 'Any'}
- Preferred Lens: ${extractedDnaStyle.lens || 'Any'}
- Lighting Style to Emulate: ${extractedDnaStyle.lighting || 'Cinematic'}
- Color/Grading Mood: ${extractedDnaStyle.colorGrade || 'Cinematic'}
- Overall Mood/Tone: ${extractedDnaStyle.mood || 'Standard'}` : '';

            const promptText = `Scene Title: ${scene.title}\nOriginal Script for this Scene:\n${scene.description}\n\nProject Characters: ${charDescriptions}${locContext}\n\nGlobal Visual Style: ${selectedStyle}\nGlobal Cinematic Tone: ${selectedTone}\nGlobal Color Palette: ${selectedPalette}\nGlobal Time of Day: ${selectedGlobalTime}\nGlobal Camera: ${selectedGlobalCamera}\nGlobal Lens Group: ${selectedGlobalLensGroup}${dnaContext}\n\nDesign the multi-camera coverage package.`;
            
            const payload = {
                contents: [{ role: 'user', parts: [{ text: promptText }] }],
                systemInstruction: { parts: [{ text: systemInstruction }] },
                generationConfig: { responseMimeType: "application/json" }
            };

            const apiUrl = geminiUrl(GEMINI_TEXT_MODEL);
            
            const response = await fetch(apiUrl, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
            
            if (!response.ok) {
                const err = await response.json();
                console.error("Multi-Cam API Error:", err);
                throw new Error(err.error?.message || "API error");
            }

            const result = await response.json();

            if (result.candidates?.[0]?.content?.parts?.[0]) {
                const jsonText = result.candidates[0].content.parts[0].text;
                const parsedData = parseAIJson(jsonText);
                
                const dressCode = parsedData.scene_dress_code || '';
                const coveragePlan = parsedData.coverage_plan || '';
                let generatedShots = parsedData.shots || [];
                
                if (!Array.isArray(generatedShots)) {
                    generatedShots = typeof generatedShots === 'object' && generatedShots !== null ? Object.values(generatedShots) : [];
                }
                
                if (generatedShots.length > 0) {
                    const shotsWithOrder = generatedShots.map((s, idx) => {
                        const newId = s.id ? parseInt(s.id, 10) || (Date.now() + idx) : (Date.now() + idx);
                        const safePrompt = typeof s.prompt === 'string' ? s.prompt : 'Cinematic coverage shot';
                        
                        return { 
                            ...s, 
                            id: newId,
                            prompt: safePrompt,
                            order: s.order ? parseFloat(s.order) : newId, 
                            tone: s.tone || '', 
                            palette: s.palette || '',
                            camera: s.camera || '',
                            lens: s.lens || '',
                            locationId: s.location_id || null,
                            cameraAngle: s.cameraAngle || CAMERA_ANGLES[0],
                            cameraMovement: s.cameraMovement || CAMERA_MOVEMENTS[0],
                            specialtyShot: s.specialtyShot || SPECIALTY_SHOTS[0],
                            lighting: s.lighting || LIGHTING_STYLES[0],
                            timeOfDay: s.timeOfDay || TIME_OF_DAY[0],
                            type: s.type || FRAMING_SHOTS[0]
                        };
                    });
                    
                    let newDescription = scene.description || '';
                    if (dressCode) {
                        newDescription = newDescription.replace(/\n\n\[SCENE DRESS CODE:[\s\S]*?\]/g, '');
                        newDescription += `\n\n[SCENE DRESS CODE: ${dressCode}]`;
                    }
                    
                    updateScenesWithHistory((prev) => prev.map((s) => (s.id === sceneId ? { ...s, description: newDescription, shots: shotsWithOrder } : s)));
                    setAiStatus(`Multi-Cam Coverage generated for ${scene.title}! Ready to render images.`);
                } else { setAiStatus('No coverage shots could be planned.'); }
            } else { throw new Error("Invalid API response"); }
        } catch (error) { 
            console.error("Multi-cam generation error:", error);
            setAiStatus('Failed to generate coverage plan.'); 
        }
    };

    const handleAutomateAll = async () => {
        if (parsedScenesRef.current.length === 0) {
            setAiStatus('No scenes to automate. Upload a script and extract scenes first.');
            return;
        }
        if (isAutomating) {
            setIsAutomating(false);
            isAutomatingRef.current = false;
            setAiStatus('Stopping automation after current task...');
            return;
        }

        setIsAutomating(true);
        isAutomatingRef.current = true;
        setAiStatus('Initializing Full Automation Sequence...');

        try {
            setAiStatus('Phase 1: Planning shots for all sequences...');
            for (let i = 0; i < parsedScenesRef.current.length; i++) {
                if (!isAutomatingRef.current) break;
                
                const currentScene = parsedScenesRef.current[i];

                if (!currentScene.shots || currentScene.shots.length === 0) {
                    setAiStatus(`[Auto] Planning shots for ${currentScene.title}...`);
                    try {
                        const mappedLocIds = currentScene.locationIds || [];
                        const sceneLocations = locations.filter(loc => mappedLocIds.includes(loc.id));
                        const locDescriptions = sceneLocations.map(l => `- [ID: ${l.id}] ${l.name}: ${l.description || 'No detailed description'}`).join('\n');
                        const locContext = locDescriptions ? `\n\nScene Locations & Environment Details:\n${locDescriptions}\n(CRITICAL: Assign the correct location ID to each shot based on where the action occurs.)` : '';

                        const directorInstruction = selectedDirector !== 'None / Auto' ? `\n\n*** AI DIRECTOR MODE: ${selectedDirector} ***\nCRITICAL: Act as the legendary film director ${selectedDirector}. Direct this sequence entirely in their signature cinematic style. Frame the shots, choose the lenses, direct the camera movement, pace the cuts, and design the lighting EXACTLY as they would to evoke their distinct emotional rhythm and mass appeal. Your JSON output MUST reflect their unique visual trademarks heavily in the metadata fields and prompt!` : '';

                        const availableLensesStr = selectedGlobalLensGroup !== 'Auto / Any' && LENS_GROUPS[selectedGlobalLensGroup]
                            ? `Select exactly one from: [${LENS_GROUPS[selectedGlobalLensGroup].join(', ')}]`
                            : 'Select an appropriate cinema lens (e.g., Cooke S4/i 35mm)';
                        const availableCamerasStr = selectedGlobalCamera !== 'Auto / Any'
                            ? `You MUST use this exact camera: ${selectedGlobalCamera}`
                            : 'Select a popular cinema camera system';

                        const systemInstruction = `You are a veteran film director, screenwriter, and expert cinematographer. 
Analyze the scene's script text (which includes both action descriptions and dialogues) and break it down into a sequence of impactful cinematic shots. 
LANGUAGE STRATEGY: ${scriptLanguage}.

CRITICAL RULES FOR SHOT DIVISION:
1. USE ENTIRE SCENE: You MUST use the ENTIRE scene content provided. Do NOT miss, skip, edit out, or remove any dialogue or action. 
2. PRESERVE EXISTING SHOTS OR INTELLIGENTLY GROUP: If the provided script ALREADY contains explicit shot divisions, numbers, or camera angles (e.g., "Shot 1:", "Angle on:", "Close up:"), YOU MUST PRESERVE THAT EXACT DIVISION 1:1. Do not merge or split them. IF AND ONLY IF the script is standard prose/dialogue without explicit shot divisions, you must act as a veteran editor: group continuous actions/dialogues intelligently into impactful shots (e.g., a fluid Master Shot or a Two-Shot) rather than blindly assigning one shot per line. Let emotional pacing dictate the cuts.
3. COMPLETE BUT CONDENSED COVERAGE: Every part of the script must be represented.
4. CONTINUITY: You must define a consistent dress code for the characters in this scene and apply it to every shot to maintain continuity.
5. NO HALLUCINATIONS (STICK TO THE STORY): DO NOT invent actions, props, or events that are beyond the story text provided. Translate the script into visual shots with high intelligence, but do not hallucinate new narrative beats.
6. EXACT CHARACTER & LOCATION MAPPING: You MUST use the exact Character Names and Location Names in the 'prompt' field. Do not use generic pronouns.${directorInstruction}

Output STRICTLY a valid JSON object matching this schema:
{
  "scene_dress_code": "Detailed description of outfits for all visible characters in this scene.",
  "shots": [
    {
      "id": 1,
      "category": "Action",
      "script_snippet": "EXACT, UNALTERED quote from the original script text.",
      "type": "Select exactly one from: [${FRAMING_SHOTS.join(', ')}]",
      "cameraAngle": "Select exactly one from: [${CAMERA_ANGLES.join(', ')}]",
      "cameraMovement": "Select exactly one from: [${CAMERA_MOVEMENTS.join(', ')}]",
      "specialtyShot": "Select exactly one from: [${SPECIALTY_SHOTS.join(', ')}]",
      "lighting": "Select exactly one from: [${LIGHTING_STYLES.join(', ')}]",
      "timeOfDay": "Select exactly one from: [${TIME_OF_DAY.join(', ')}]",
      "duration": "3s",
      "prompt": "Highly detailed visual description for this shot. CRITICAL: You MUST use the exact Character Names and Location Names in this description (e.g., 'Jack yells at Rose in the Kitchen' instead of 'A man yells at a woman in a room'). DO NOT add actions beyond the script snippet.",
      "camera": "${availableCamerasStr}",
      "lens": "${availableLensesStr}",
      "location_id": 12345,
      "characters_present": ["Character1", "Character2"]
    }
  ]
}

Output STRICTLY a valid JSON object. No markdown, no extra text.`;

                        const dnaContext = extractedDnaStyle ? `\n\n***EXTRACTED EXTREME CINEMATIC DNA PREFERENCES***:\nYou MUST heavily bias your shot generation and JSON metadata towards this extracted DNA profile. Adopt these styles universally across the scene unless the script dictates otherwise:
- Preferred Camera Angle: ${extractedDnaStyle.cameraAngle || 'Any'}
- Preferred Shot Type/Framing: ${extractedDnaStyle.shotType || 'Any'}
- Preferred Lens: ${extractedDnaStyle.lens || 'Any'}
- Lighting Style to Emulate: ${extractedDnaStyle.lighting || 'Cinematic'}
- Color/Grading Mood: ${extractedDnaStyle.colorGrade || 'Cinematic'}
- Overall Mood/Tone: ${extractedDnaStyle.mood || 'Standard'}
Ensure the ENUM selections match the required arrays, but use the 'prompt' field to heavily describe the lighting, lens feel, and color grade extracted here.` : '';
                        
                        const charDescriptions = characters.map(c => `${c.name} ${c.gender ? `(${c.gender})` : ''} ${c.age ? `[Age: ${c.age}]` : ''}`).filter(Boolean).join(', ');
                        const promptText = `Scene Title: ${currentScene.title}\nOriginal Script for this Scene:\n${currentScene.description}\n\nProject Characters: ${charDescriptions}${locContext}\nGlobal Time of Day: ${selectedGlobalTime}\nGlobal Camera: ${selectedGlobalCamera}\nGlobal Lens Group: ${selectedGlobalLensGroup}${dnaContext}\n\nPlan the cinematic shots covering the actions and dialogues.`;
                        
                        const payload = {
                            contents: [{ role: 'user', parts: [{ text: promptText }] }],
                            systemInstruction: { parts: [{ text: systemInstruction }] },
                            generationConfig: { responseMimeType: "application/json" }
                        };

                        const apiUrl = geminiUrl(GEMINI_TEXT_MODEL);
                        
                        const response = await fetch(apiUrl, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
                        
                        if (!response.ok) throw new Error("API error");

                        const result = await response.json();
                        if (result.candidates?.[0]?.content?.parts?.[0]) {
                            const jsonText = result.candidates[0].content.parts[0].text;
                            const parsedData = parseAIJson(jsonText);
                            
                            const isArray = Array.isArray(parsedData);
                            const dressCode = isArray ? '' : (parsedData.scene_dress_code || '');
                            let generatedShots = isArray ? parsedData : (parsedData.shots || []);

                            if (!Array.isArray(generatedShots)) {
                                generatedShots = typeof generatedShots === 'object' && generatedShots !== null ? Object.values(generatedShots) : [];
                            }

                            let currentShots = generatedShots.map((s, idx) => {
                                const newId = s.id ? parseInt(s.id, 10) || (Date.now() + idx) : (Date.now() + idx);
                                const safePrompt = typeof s.prompt === 'string' ? s.prompt : 'Cinematic shot sequence';
                                
                                return { 
                                    ...s, 
                                    id: newId,
                                    prompt: safePrompt,
                                    order: s.order ? parseFloat(s.order) : newId, 
                                    tone: s.tone || '', 
                                    palette: s.palette || '',
                                    camera: s.camera || '',
                                    lens: s.lens || '',
                                    locationId: s.location_id || null,
                                    cameraAngle: s.cameraAngle || CAMERA_ANGLES[0],
                                    cameraMovement: s.cameraMovement || CAMERA_MOVEMENTS[0],
                                    specialtyShot: s.specialtyShot || SPECIALTY_SHOTS[0],
                                    lighting: s.lighting || LIGHTING_STYLES[0],
                                    timeOfDay: s.timeOfDay || TIME_OF_DAY[0],
                                    type: s.type || FRAMING_SHOTS[0]
                                };
                            });
                            
                            let newDescription = currentScene.description || '';
                            if (dressCode) {
                                newDescription = newDescription.replace(/\n\n\[SCENE DRESS CODE:[\s\S]*?\]/g, '');
                                newDescription += `\n\n[SCENE DRESS CODE: ${dressCode}]`;
                            }
                            
                            parsedScenesRef.current = parsedScenesRef.current.map((s) => (s.id === currentScene.id ? { ...s, description: newDescription, shots: currentShots } : s));
                            updateScenesWithHistory((prev) => prev.map((s) => (s.id === currentScene.id ? { ...s, description: newDescription, shots: currentShots } : s)));
                            
                            await new Promise(r => setTimeout(r, 2500));
                        } else { throw new Error("Invalid API response"); }
                    } catch (error) {
                        console.error("Auto shot generation error:", error);
                        setAiStatus(`[Auto] Failed to plan shots for ${currentScene.title}. Skipping to next...`);
                        continue;
                    }
                }
            }

            if (!isAutomatingRef.current) return;

            setAiStatus('Phase 2: Rendering images for all scenes...');
            for (let i = 0; i < parsedScenesRef.current.length; i++) {
                if (!isAutomatingRef.current) break;
                
                const currentScene = parsedScenesRef.current[i];
                let currentShots = [...(currentScene.shots || [])];
                
                currentShots.sort((a, b) => (a.order ?? a.id) - (b.order ?? b.id));

                for (let j = 0; j < currentShots.length; j++) {
                    if (!isAutomatingRef.current) break;
                    const shot = currentShots[j];
                    const frameId = makeFrameId(currentScene.id, shot.id);
                    
                    if (!generatedImagesRef.current[frameId] && !generatingIdsRef.current.has(frameId)) {
                        setAiStatus(`[Auto] Generating Image: Scene ${currentScene.id}, Shot ${shot.id}...`);
                        await generateAIImage(currentScene.id, shot.id, shot);
                        await new Promise(r => setTimeout(r, 12500)); 
                    }
                }
            }
            if (isAutomatingRef.current) {
                setAiStatus('Automation Complete! All scenes and shots are ready.');
            } else {
                setAiStatus('Automation Stopped.');
            }
        } catch (error) {
            console.error("Automation fatal error:", error);
            setAiStatus('Automation failed. Check console for details.');
        } finally {
            setIsAutomating(false);
        }
    };

    const generateAIImage = async (sceneId, shotId, shotData, mcId = null, isUpdate = false) => {
        const frameId = mcId ? makeMcFrameId(sceneId, shotId, mcId) : makeFrameId(sceneId, shotId);
        const existingImage = isUpdate ? generatedImagesRef.current[frameId] : null;

        setAiStatus(isUpdate ? 'Updating frame with new parameters...' : 'Generating cinematic storyboard frame...');
        setGeneratingIds((prev) => new Set(prev).add(frameId));
        generatingIdsRef.current.add(frameId);

        try {
            const scene = parsedScenesRef.current.find(s => s.id === sceneId);
            
            const dressCodeMatch = (scene?.description || '').match(/\[SCENE DRESS CODE:([\s\S]*?)\]/i);
            const globalDressCode = dressCodeMatch ? dressCodeMatch[1].trim() : '';
            const cleanDesc = (scene?.description || '').replace(/\[SCENE DRESS CODE:[\s\S]*?\]/gi, '').trim();
            
            const sceneContext = scene ? `SETTING/LOCATION CONTEXT: ${scene.title || ''}. ${cleanDesc}` : "";

            const shotType = shotData.type || 'Standard Shot';
            const activeStyle = shotData.style || selectedStyle;
            const activeTone = shotData.tone || selectedTone;
            const activePalette = shotData.palette || selectedPalette;
            
            const shotCamera = shotData.camera || null;
            const shotLens = shotData.lens || null;
            
            const shotAngle = shotData.cameraAngle || 'Eye-Level';
            const shotMovement = shotData.cameraMovement || 'Static';
            const shotSpecialty = shotData.specialtyShot || 'None';
            const shotLighting = shotData.lighting || 'Cinematic Lighting';
            const shotTimeRaw = shotData.timeOfDay || 'Unspecified';
            const shotTime = shotTimeRaw !== 'Unspecified' ? shotTimeRaw : (selectedGlobalTime !== 'Unspecified' ? selectedGlobalTime : 'Day');
            
            let cameraDetails = `\n\n***CAMERA, LIGHTING & COMPOSITION***:
            - Framing: ${shotType}
            - Camera Angle: ${shotAngle}
            - Camera Movement (Motion context): ${shotMovement}
            - Specialty Technique: ${shotSpecialty}
            - Lighting Setup: ${shotLighting}
            - Time of Day: ${shotTime}`;

            let motionBlurCharacteristics = '';
            if (shotMovement && shotMovement !== 'Static / None') {
                motionBlurCharacteristics = `\n***MOTION BLUR ENGINE***: ${getMovementBlurCharacteristics(shotMovement)} `;
            }

            let cameraCharacteristics = '';
            if (shotCamera && shotCamera !== 'Auto / Any') {
                cameraCharacteristics = `***CAMERA SYSTEM OVERRIDE***: Shot on ${shotCamera}. Emulate the specific color science, dynamic range, contrast, and sensor characteristics of this cinema camera accurately. `;
            }

            let directorCharacteristics = '';
            if (selectedDirector !== 'None / Auto') {
                directorCharacteristics = `*** AI DIRECTOR MODE: ${selectedDirector} ***\nThis image MUST be composed, lit, and directed exactly as if the legendary film director ${selectedDirector} shot it. Replicate their signature visual style, framing logic, color grading, and atmospheric tension perfectly. `;
            }

            let dnaCharacteristics = '';
            if (extractedDnaStyle) {
                dnaCharacteristics = `\n***EXTREME CINEMATIC DNA DEEP SYNTHESIS ENGINE***:
                We have analyzed a high-end reference frame and extracted its deep technical DNA. You MUST forcefully inject this exact aesthetic DNA into this generation:
                - COMPOSITION & FRAMING INFLUENCE: The composition must match the high-end framing of a ${extractedDnaStyle.shotType || 'cinematic setup'} with a ${extractedDnaStyle.cameraAngle || 'eye-level perspective'}.
                - LENS FEEL: Emulate the optical characteristics, soft background roll-off, and shallow depth of field associated with a ${extractedDnaStyle.lens || 'professional prime lens'}.
                - LIGHTING SCHEME: Match this precise lighting direction and quality: "${extractedDnaStyle.lighting || 'Cinematic lighting with high contrast and natural separation'}".
                - COLOR GRADOLOGY: Recreate this exact color grade, contrast curve, and palette: "${extractedDnaStyle.colorGrade || 'Rich, professional movie color palette with deep blacks and textured highlights'}".
                - ATMOSPHERE: Imbue the image with the specific psychological mood of: "${extractedDnaStyle.mood || 'Atmospheric drama'}".
                Absolute stylistic fidelity is required. Replicate the grain, sharpness, and high dynamic range of the DNA source.`;
            }

            let lensCharacteristics = '';
            if (shotLens) {
                lensCharacteristics = `***MANDATORY LENS OPTICS & FRAMING OVERRIDE***: The generated image MUST heavily emphasize the visual traits and framing of a ${shotLens}. `;
                const lowerLens = shotLens.toLowerCase();
                
                if (lowerLens.includes('cooke')) {
                    lensCharacteristics += "You MUST add the legendary 'Cooke Look': organic warmth, smooth focus falloff, creamy dimensional pop, and beautifully rendered natural skin tones. ";
                } else if (lowerLens.includes('sony')) {
                    lensCharacteristics += "You MUST add Sony lens properties: clinical sharpness, high micro-contrast, clean modern aesthetic, and precise edge-to-edge resolution. ";
                } else if (lowerLens.includes('signature')) {
                    lensCharacteristics += "You MUST add Signature Prime properties: smooth organic focus falloff, warm skin tones, and creamy bokeh. ";
                } else if (lowerLens.includes('master prime')) {
                    lensCharacteristics += "You MUST add Master Prime properties: ultra-sharp pristine focus, high micro-contrast, and clean edge-to-edge resolution. ";
                } else if (lowerLens.includes('canon')) {
                    lensCharacteristics += "You MUST add Canon lens properties: pleasing warm skin tones, gentle contrast, and classic cinematic rendering. ";
                } else if (lowerLens.includes('panavision') || lowerLens.includes('primo')) {
                    lensCharacteristics += "You MUST add Panavision Primo properties: classic Hollywood rendering, smooth contrast, and organic sharpness. ";
                } else if (lowerLens.includes('red')) {
                    lensCharacteristics += "You MUST add RED lens properties: high-resolution digital sharpness and neutral color rendition. ";
                }

                if (lowerLens.includes('anamorphic') || lowerLens.includes('panatar')) {
                    lensCharacteristics += "You MUST add strong anamorphic properties: oval bokeh, cinematic widescreen aesthetic, barrel distortion, and horizontal lens flares. ";
                }

                const match = lowerLens.match(/(\d+)mm/);
                if (match) {
                    const mm = parseInt(match[1]);
                    if (mm <= 24) lensCharacteristics += `\nApply an EXTREME ULTRA-WIDE ${mm}mm perspective: Frame this as a WIDE SHOT showing massive amounts of the environment. Create an exaggerated spatial distance, dynamic wide-angle distortion, and deep depth of field.`;
                    else if (mm > 24 && mm <= 47) lensCharacteristics += `\nApply a WIDE/MEDIUM ${mm}mm perspective: Frame this as a MEDIUM WIDE SHOT with a natural field of view.`;
                    else if (mm >= 50 && mm <= 75) lensCharacteristics += `\nApply a STANDARD/SHORT-TELEPHOTO ${mm}mm perspective: Frame this as a MEDIUM CLOSE-UP with shallow depth of field and beautiful subject separation.`;
                    else if (mm > 75) lensCharacteristics += `\nApply a TELEPHOTO ${mm}mm perspective: Frame this as a TIGHT CLOSE-UP. Zoom in heavily on the subject with extreme shallow depth of field, heavy background blur (bokeh), and strong background compression.`;
                }
            }

            let toneCharacteristics = '';
            if (extractedDnaStyle && extractedDnaStyle.mood) {
                toneCharacteristics = `***MANDATORY CINEMATIC TONE OVERRIDE (EXTRACTED FROM DNA)***: You MUST generate this image leaning heavily into this exact mood and tone: "${extractedDnaStyle.mood}". `;
            } else if (activeTone && activeTone !== 'None / Default') {
                const toneMap = {
                    'Neo-Noir / Cynical Urban Darkness': 'Rainy environments, moral ambiguity, high contrast lighting, heavy shadows, cynical urban darkness, inspired by David Fincher and Denis Villeneuve.',
                    'Dreamlike / Surreal': 'Dreamlike, subconscious, surreal imagery, ethereal lighting, inspired by David Lynch and Federico Fellini.',
                    'Hyper-Stylized Cool': 'Hyper-stylized, sharp colors, stylish cinematic violence, pop culture aesthetic, inspired by Quentin Tarantino and Guy Ritchie.',
                    'Whimsical / Storybook': 'Symmetrical framing, pastel color palettes, quirky characters, whimsical storybook world, inspired by Wes Anderson.',
                    'Slow Cinema / Meditative': 'Meditative realism, patience, naturalistic lighting, quiet atmosphere, inspired by Andrei Tarkovsky and Yasujiro Ozu.',
                    'Existential / Philosophical': 'Existential, vast landscapes, philosophical weight, natural light, inspired by Terrence Malick and Ingmar Bergman.',
                    'Atmospheric Horror': 'Atmospheric dread, psychological tension, unsettling framing, shadow-play, inspired by Ari Aster and Robert Eggers.',
                    'Grand Epic / Spectacle': 'Grand scale, huge cinematic spectacle, emotional intensity, monumental framing, inspired by Christopher Nolan and Ridley Scott.',
                    'Mass Masala (Indian)': 'High-energy Mass Masala Indian cinema, hero elevation shots, slow-motion dramatic flair, dynamic crowd moments, inspired by S.S. Rajamouli.',
                    'Rustic Raw Realism (Indian)': 'Grounded rustic realism, natural raw lighting, earthy tones, morally gray, inspired by Vetrimaaran and Nagraj Manjule.',
                    'Urban Grit / Gangster Realism (Indian)': 'Gritty urban gangster realism, handheld camera feel, chaotic street energy, high contrast, inspired by Anurag Kashyap.',
                    'Poetic Humanism (Indian)': 'Poetic humanism, emotionally rich, compassionate observation, literary atmosphere, inspired by Satyajit Ray.',
                    'Romantic-Political Lyrical (Mani Ratnam Style)': 'Lyrical romance against political backdrops, dramatic rain sequences, highly stylized emotional lighting, inspired by Mani Ratnam.',
                    'Spiritual / Philosophical Art Cinema': 'Reflective, highly symbolic, slow-paced existential Indian art cinema, quiet and profound.',
                    'Feel-Good Slice of Life': 'Warm, comforting, middle-class slice of life, soft lighting, relatable and humorous tone, inspired by Hrishikesh Mukherjee.',
                    'Mythic / Devotional Grandeur': 'Larger-than-life mythic grandeur, colorful and devotional epics, classical framing.'
                };
                toneCharacteristics = `***MANDATORY CINEMATIC TONE***: You MUST generate this image heavily leaning into the following tone: ${toneMap[activeTone] || activeTone}. `;
            }

            let colorCharacteristics = '';
            if (extractedDnaStyle && extractedDnaStyle.colorGrade) {
                colorCharacteristics = `***MANDATORY COLOR GRADING OVERRIDE (EXTRACTED FROM DNA)***: You MUST apply this exact color palette and grading style: "${extractedDnaStyle.colorGrade}". `;
            } else if (activePalette && activePalette !== 'None / Default') {
                const colorMap = {
                    'Teal & Orange': 'Teal and orange color grading, vibrant orange skin tones against deep cyan/blue backgrounds, high contrast, action movie aesthetic.',
                    'Desaturated Gray / Bleach Bypass': 'Desaturated gray, bleach bypass look, low saturation, dirty whites, metallic contrast, gritty realism.',
                    'Warm Golden Palette': 'Warm golden palette, amber and yellow hues, sunset warmth, honey tones, glowing lighting.',
                    'Cold Blue / Cyan Palette': 'Cold blue and cyan palette, icy tones, cool shadows, futuristic and isolated atmosphere.',
                    'Neon Cyberpunk Palette': 'Neon cyberpunk palette, vibrant magenta, purple, and cyan, bright neon signs, wet reflective surfaces.',
                    'Earthy Natural Palette': 'Earthy natural palette, organic greens and browns, soft sunlight, natural textures, realistic grading.',
                    'High Saturation Pop Palette': 'High saturation pop palette, extremely vibrant colors, bright reds and yellows, candy-like fantasy look.',
                    'Green-Tinted Palette': 'Sickly green-tinted palette, fluorescent lighting, matrix-like industrial green cast, unsettling atmosphere.',
                    'Monochrome / Limited Palette': 'Monochrome or limited palette, highly stylized, graphic intensity, dominated by a single hue or black and white.',
                    'Pastel Palette': 'Soft pastel palette, powdery pinks, blues, and creams, gentle colors, low contrast, whimsical feel.',
                    'Dark Contrast / Chiaroscuro': 'Dark contrast chiaroscuro lighting, deep black shadows, bright selective highlights, painterly drama.',
                    'Dusty Desert Palette': 'Dusty desert palette, tan, beige, rust, dry yellows, heat haze, harsh sunburnt look.',
                    'Telugu/Tamil Mass Cinema': 'Telugu/Tamil Mass Cinema grading, strong warm highlights, rich red and gold tones, dramatic deep blacks, high energy.',
                    'Mani Ratnam Romantic Palette': 'Mani Ratnam romantic grading, soft diffused warmth, rainy blues, earthy organic greens, lyrical and poetic.',
                    'Malayalam Realist Palette': 'Malayalam realist cinema grading, natural greens, soft diffuse daylight, low saturation, grounded slice-of-life look.'
                };
                colorCharacteristics = `***MANDATORY COLOR GRADING***: You MUST apply this specific color palette and grading style: ${colorMap[activePalette] || activePalette}. `;
            }

            let filmStockCharacteristics = '';
            if (selectedFilmStock && selectedFilmStock !== 'Digital Clean (No Stock)') {
                filmStockCharacteristics = `***FILM STOCK EMULATION***: Emulate the look of ${selectedFilmStock} \u2014 replicate its characteristic grain structure, color response, contrast curve, halation, and dynamic range. `;
            }

            let diffusionCharacteristics = '';
            if (selectedDiffusion && selectedDiffusion !== 'None (Clean)') {
                diffusionCharacteristics = `***LENS FILTRATION***: Apply the optical look of a ${selectedDiffusion} filter \u2014 adjust highlight bloom, halation, contrast, and atmosphere accordingly while keeping the subject readable. `;
            }

            let dofCharacteristics = '';
            if (selectedDof && selectedDof !== 'Auto / Lens-Based') {
                const dofMap = {
                    'Deep Focus (Everything Sharp)': 'Render with deep depth of field: foreground, midground, and background all in crisp focus.',
                    'Medium Depth': 'Render with a moderate depth of field; subject sharp with a gently soft background.',
                    'Shallow Focus': 'Render with shallow depth of field: subject in sharp focus with a softly blurred background.',
                    'Razor-Shallow Bokeh': 'Render with extremely shallow depth of field and heavy creamy bokeh; only a thin focal plane is sharp.',
                    'Tilt-Shift Miniature': 'Render with a tilt-shift miniature effect: a narrow band of focus that makes the scene look like a small physical model.',
                    'Macro Detail': 'Render as an extreme macro close-up with razor-thin focus and magnified fine detail.'
                };
                dofCharacteristics = `***DEPTH OF FIELD***: ${dofMap[selectedDof] || selectedDof} `;
            }

            const cinematicRatios = { '2.39:1': 'an anamorphic 2.39:1 ultra-widescreen scope frame', '1.85:1': 'a 1.85:1 theatrical widescreen frame', '2:1': 'a 2:1 (Univisium) widescreen frame', '1.66:1': 'a 1.66:1 European widescreen frame', '21:9': 'a 21:9 ultra-wide cinematic frame' };
            let aspectCharacteristics = '';
            if (cinematicRatios[aspectRatio]) {
                aspectCharacteristics = `***FRAMING ASPECT***: Compose this image for ${cinematicRatios[aspectRatio]}. Add subtle cinematic letterboxing (thin black bars) and frame the composition deliberately for that wider ratio. `;
            }

            let boardStyleCharacteristics = '';
            if (selectedBoardStyle && selectedBoardStyle !== 'Photoreal Frame') {
                const boardMap = {
                    'Pencil Sketch Storyboard': 'a hand-drawn pencil storyboard panel with graphite sketch lines, loose shading, and visible paper texture',
                    'Marker Rendering': 'a marker-and-ink storyboard illustration with bold strokes and flat color fills',
                    'Black & White Line Art': 'clean black-and-white inked line art with no photographic shading',
                    'Color Concept Sketch': 'a painterly color concept sketch with visible brush and pencil strokes',
                    'Ink & Wash': 'an ink-and-wash illustration with expressive linework and tonal washes',
                    'Comic / Graphic Panel': 'a comic-book / graphic-novel panel with bold inking, cel shading, and halftone texture'
                };
                boardStyleCharacteristics = `\n\n***BOARD RENDER STYLE OVERRIDE (HIGHEST PRIORITY)***: Render this image as ${boardMap[selectedBoardStyle] || selectedBoardStyle}. This OVERRIDES any photorealism, "4K", or "movie still" instruction stated earlier \u2014 the final output MUST be illustrated in this style, NOT a photograph.`;
            }

            const safePrompt = shotData.prompt || '';
            const snippetText = shotData.script_snippet || '';
            
            const relevantCharacters = getCharactersForShot(shotData, characters);
            const relevantCharactersWithImages = relevantCharacters.filter(char => char.images && char.images.length > 0);
            
            let basePrompt = (isUpdate && existingImage)
                ? `Update the lighting, camera angle, time of day, and aesthetic style of this existing storyboard frame to exactly match the following new parameters in a ${shotType}.`
                : (activeStyle === 'Indian Commercial Cinema' 
                    ? `Create an ultra-photorealistic, 4K resolution, extremely high-quality movie still for Indian Commercial Cinema in a ${shotType}. Masterpiece, real photography, highly detailed, dramatic lighting.` 
                    : `Create a 4K resolution, extremely high-quality ${activeStyle} cinematic storyboard frame in a ${shotType}. Masterpiece, hyper-detailed movie still, sharp focus, dramatic lighting.`);

            if (relevantCharactersWithImages.length > 0 && !isUpdate) {
                basePrompt += ` This image MUST feature the exact same person/people shown in the provided subject reference images.`;
            }
            
            const isMasterOrCityShot = shotType.toLowerCase().includes('wide') || shotType.toLowerCase().includes('master') || safePrompt.toLowerCase().includes('city') || safePrompt.toLowerCase().includes('street') || safePrompt.toLowerCase().includes('market') || safePrompt.toLowerCase().includes('crowd') || safePrompt.toLowerCase().includes('establishing');
            const isEmptyExplicit = safePrompt.toLowerCase().includes('empty') || safePrompt.toLowerCase().includes('abandoned') || safePrompt.toLowerCase().includes('desolate') || safePrompt.toLowerCase().includes('alone');
            const shouldAddCrowd = isMasterOrCityShot && !isEmptyExplicit;

            let charInfoText = '';
            if (relevantCharacters.length > 0) {
                charInfoText = "***CRITICAL CHARACTER MAPPING IN THIS SHOT***:\n" + 
                relevantCharacters.map(c => `[CHARACTER NAME: ${c.name}] -> Demographic: ${c.gender || 'Unspecified'}, Age: ${c.age ? c.age : 'Unspecified'}. Appearance: ${c.description || 'Standard'}.`).join('\n') + 
                "\n(CRITICAL INSTRUCTION: You MUST visually map the actions in the prompt to these EXACT character names. If a reference image is attached below for a character, their FACIAL FEATURES, ETHNICITY, AND IDENTITY MUST MATCH THE REFERENCE EXACTLY. DO NOT generate random faces for named characters!).\n\n";
                
                if (globalDressCode) {
                    charInfoText += `***SCENE WARDROBE/DRESS CODE***: ${globalDressCode}\n(CRITICAL INSTRUCTION: Apply this wardrobe ONLY to the specific characters listed above. DO NOT generate other characters that might be mentioned in this dress code!).\n\n`;
                }
            } else {
                if (shouldAddCrowd) {
                    charInfoText = "***MAIN CHARACTERS PRESENT IN THIS SHOT***: NONE. (However, background extras and crowds MUST be included to populate this establishing shot).\n\n";
                } else {
                    charInfoText = "***CHARACTERS PRESENT IN THIS SHOT***: NONE. This is an empty/environmental shot. DO NOT INCLUDE ANY PEOPLE.\n\n";
                }
            }

            let isolationInstruction = '';
            if (shouldAddCrowd) {
                isolationInstruction = `***CROWD & EXTRAS DIRECTIVE (MASTER SHOT)***: Because this is a wide establishing or city shot, you MUST actively populate the background and midground with a realistic, context-appropriate crowd of extras (pedestrians, vehicles, etc.) to make the environment feel alive and bustling. Ensure any main characters listed above are the focal point, but surround them with a lively populated world. DO NOT leave the background empty unless explicitly instructed in the prompt.`;
            } else {
                isolationInstruction = `***CRITICAL CASTING RULE***: ONLY generate the characters explicitly listed in 'CHARACTERS PRESENT IN THIS SHOT'. Do NOT generate any other characters that might be mentioned in the scene context, setting, or dress code. If the 'CHARACTERS PRESENT' list is NONE, the image MUST NOT have any people in it.`;
            }
            
            const cinematographerInstruction = `***VETERAN CINEMATOGRAPHER DIRECTIVE***: Act as a veteran cinematographer. Meticulously compose and frame this shot. Carefully position the subjects/artists within the location, utilize dynamic camera angles, and deliberately use foreground, midground, and background elements to create deep cinematic depth. Ensure the lighting and framing deeply enhance the emotional impact and spatial dimensionality of the scene.`;
            
            const scaleInstruction = `***CRITICAL SCALE & PROPORTION DIRECTIVE***: You MUST strictly maintain realistic physical proportions. Characters MUST NOT be oversized or appear like giants compared to the background environment (e.g., characters cannot be taller than houses, trees, or rooms). Ground characters accurately within the depth and scale of the scene.`;

            const timingInstruction = `***ABSOLUTE RULE: ZERO DUPLICATION***: Depict a SINGLE, FROZEN snapshot in time. Capture ONLY the exact STARTING POSTURE of the action. You are STRICTLY FORBIDDEN from generating multiple instances, ghosts, trails, or "clones" of the same character to show motion. Each character listed MUST appear exactly ONCE and only once in the entire image. If the prompt describes movement, ignore the path and ONLY draw them at the beginning of the movement.`;

            const charNames = relevantCharactersWithImages.map(c => c.name).join(', ');
            let characterInstruction = relevantCharactersWithImages.length > 0 
                ? (enforceLikeness 
                    ? `***CRITICAL STRICT ACTOR LIKENESS ENFORCEMENT (AUTHORIZED PRO USE)***:\nThe user has enabled STRICT 100% FACIAL MATCH and holds professional authorization. You MUST generate the characters to look EXACTLY like the specific actors provided in the multiple reference images. Synthesize the multi-angle references to reconstruct their exact biometric facial structure, nose shape, jawline, eyes, and identity. This overrides all other lighting or atmospheric instructions if they conflict. DO NOT generate a generic face.` 
                    : `***CASTING & ACTOR LIKENESS***:\nThe roles in this scene are played by specific actors provided in the reference images. Please try to generate the characters to look like the actors provided where possible.`)
                : "***FACES***: Generate detailed original characters based on context.";

            let mappedLocIds = [];
            if (shotData && shotData.locationId) {
                mappedLocIds = [shotData.locationId];
            } else {
                mappedLocIds = scene?.locationIds || (scene?.locationId ? [scene.locationId] : []);
            }
            
            const sceneLocations = locations.filter(loc => mappedLocIds.includes(loc.id));
            const sceneLocationsWithImage = sceneLocations.filter(loc => loc.image);

            const activeLocationNames = sceneLocations.map(l => l.name).join(', ');
            const activeLocationDescriptions = sceneLocations.map(l => `${l.name} (${l.description || 'No specific details'})`).join(' | ');
            const envContext = activeLocationNames ? `\n*** ACTIVE LOCATION SETTING ***: ${activeLocationDescriptions}\n(The background and environment MUST reflect this location explicitly).` : '';

            const crowdInstruction = sceneLocations.length > 0 
                ? `\n\n***CROWD/ENVIRONMENT CONTEXT***: The background extras, crowds, and architectural details MUST accurately reflect the cultural, ethnic, and geographical context of this location: ${activeLocationNames}. If this implies a specific city or region, ensure the background faces, clothing, and environment look absolutely authentic to that region.`
                : "";
            
            const envInstruction = sceneLocationsWithImage.length > 0 
                ? `***ABSOLUTE CRITICAL ENVIRONMENT LOCK***: You are STRICTLY FORBIDDEN from generating any new or different background. You MUST map the characters and action directly into the exact environment provided in the 'Location Reference' image(s) attached. Ignore any environmental descriptions in the text prompt that contradict the visual reference.`
                : "";

            let blockingInstructions = '';
            if (shotData.blockingData && shotData.blockingData.elements) {
                const cams = shotData.blockingData.elements.filter(e => e.type === 'camera');
                const lights = shotData.blockingData.elements.filter(e => e.type === 'light');

                if (cams.length > 0 || lights.length > 0) {
                    blockingInstructions = `\n\n***EXACT OVERRIDE: USER DEFINED BLOCKING & CAMERA PARAMETERS***:\nYou MUST rigorously adhere to these precise physical parameters defined by the user in the blocking map:`;
                    if (cams.length > 0) {
                        const c = cams[0];
                        blockingInstructions += `\n- CAMERA RIG: Set camera height to ${c.height || 1.5} meters. Pitch angle is ${c.pitch || 0} degrees. Focal length is ${c.focalLength || 35}mm. Frame the shot accurately reflecting this physical placement.`;
                    }
                    if (lights.length > 0) {
                        blockingInstructions += `\n- SCENE LIGHTS:`;
                        lights.forEach(l => {
                            blockingInstructions += `\n  * ${l.label}: Emits a light with color ${l.color} at ${l.intensity || 50}% intensity. Direct this light according to a top-down rotation of ${l.rotation} degrees.`;
                        });
                        blockingInstructions += `\n(Ensure these exact lights cast visible illumination, shadows, and rim highlights on the subjects and environment).`;
                    }
                }
            }

            const fullPrompt = `${basePrompt}\n\n${envContext}\n\n${sceneContext}\n\n*** SHOT ACTION / MAIN VISUAL DESCRIPTION ***:\n${safePrompt}\n\n${cameraDetails}${directorCharacteristics ? '\n\n' + directorCharacteristics : ''}${dnaCharacteristics ? '\n\n' + dnaCharacteristics : ''}${cameraCharacteristics ? '\n\n' + cameraCharacteristics : ''}${lensCharacteristics ? '\n\n' + lensCharacteristics : ''}${motionBlurCharacteristics ? '\n\n' + motionBlurCharacteristics : ''}${toneCharacteristics ? '\n\n' + toneCharacteristics : ''}${colorCharacteristics ? '\n\n' + colorCharacteristics : ''}${filmStockCharacteristics ? '\n\n' + filmStockCharacteristics : ''}${diffusionCharacteristics ? '\n\n' + diffusionCharacteristics : ''}${dofCharacteristics ? '\n\n' + dofCharacteristics : ''}${aspectCharacteristics ? '\n\n' + aspectCharacteristics : ''}${crowdInstruction ? '\n\n' + crowdInstruction : ''}\n\n${charInfoText}${isolationInstruction}\n\n${scaleInstruction}\n\n${timingInstruction}\n\n${cinematographerInstruction}\n\n***CRITICAL WARDROBE & CONTINUITY LOCK***:\n1. CLOTHING: You must read the prompt and scene context to generate the exact clothing described for the PRESENT characters. DO NOT change their outfits mid-scene. If a face reference image has different clothes, IGNORE the reference image's clothes and use the clothes described in the text prompt!\n2. ENVIRONMENT: Maintain strict visual consistency for the background.\n\n${envInstruction}\n\n${characterInstruction}${blockingInstructions}${boardStyleCharacteristics}`;
            
            const generationParts = [];

            if (isUpdate && existingImage) {
                const match = existingImage.match(/data:(image\/.*?);base64,(.*)/);
                if (match) {
                    generationParts.push({
                        inlineData: { mimeType: match[1], data: match[2] }
                    });
                    generationParts.push({ text: "INLINE IMAGE MODIFICATION: Edit this exact image to perfectly reflect the updated lighting, camera, and style parameters provided below. Maintain the exact same environment, character identities, clothing, and aspect ratio. ONLY alter the aesthetic parameters and lighting to match these new settings:\n\n" });
                }
            } else {
                let hasReferenceImages = false;
                if (sceneLocationsWithImage.length > 0 || relevantCharactersWithImages.length > 0) {
                    hasReferenceImages = true;
                    generationParts.push({ text: "*** REFERENCE IMAGES FOR CONTEXT ***\n" });
                    
                    if (sceneLocationsWithImage.length > 0) {
                       sceneLocationsWithImage.forEach(loc => {
                           if (loc.image) {
                               generationParts.push({ text: `[LOCATION VISUAL REFERENCE FOR: ${loc.name}] - The background environment MUST look exactly like this.` });
                               generationParts.push({ inlineData: { mimeType: loc.image.mimeType, data: loc.image.data } });
                           }
                       });
                    }
                    
                    if (relevantCharactersWithImages.length > 0) {
                        relevantCharactersWithImages.forEach(char => {
                            if (char.images && char.images.length > 0) {
                                let matchText = enforceLikeness 
                                    ? `[BIOMETRIC MATCH REQUIRED FOR: ${char.name}] - Generate "${char.name}" with a 100% EXACT 1:1 BIOMETRIC MATCH to these reference photos. You have permission to replicate this real person.` 
                                    : `[SUBJECT REFERENCE FOR: ${char.name}] - The character named ${char.name} MUST look exactly like this person's face.`;
                                
                                generationParts.push({ text: matchText });
                                
                                char.images.slice(0, 3).forEach((img, idx) => {
                                    generationParts.push({ text: `Reference Angle ${idx + 1}:` });
                                    generationParts.push({ inlineData: { mimeType: img.mimeType, data: img.data } });
                                });
                            }
                        });
                    }
                    generationParts.push({ text: "\n*** END OF REFERENCES. NOW GENERATE THE FINAL IMAGE USING THE PROMPT BELOW: ***\n\n" });
                }
            }

            if (enforceContinuity && !(isUpdate && existingImage)) {
                const contScene = parsedScenesRef.current.find(s => s.id === sceneId);
                const contShots = contScene ? (Array.isArray(contScene.shots) ? contScene.shots : Object.values(contScene.shots || {})) : [];
                const contSorted = [...contShots].sort((a, b) => (a.order ?? a.id) - (b.order ?? b.id));
                const contIdx = contSorted.findIndex(s => s.id === shotId);
                const prevShot = contIdx > 0 ? contSorted[contIdx - 1] : null;
                const prevImg = prevShot ? generatedImagesRef.current[makeFrameId(sceneId, prevShot.id)] : null;
                if (prevImg) {
                    const cm = prevImg.match(/data:(image\/.*?);base64,(.*)/);
                    if (cm) {
                        generationParts.push({ text: "*** PREVIOUS SHOT (CONTINUITY REFERENCE) ***\nMaintain strict visual continuity with the previous frame shown below: same characters, wardrobe, lighting mood, color grade, and environment. Do NOT copy its composition \u2014 apply THIS shot's framing and camera angle instead.\n" });
                        generationParts.push({ inlineData: { mimeType: cm[1], data: cm[2] } });
                        generationParts.push({ text: "\n*** END CONTINUITY REFERENCE ***\n\n" });
                    }
                }
            }

            generationParts.push({ text: fullPrompt + `\n\n[Internal Variation Seed: ${Math.floor(Math.random() * 1000000)}]` });

            const apiAspectRatio = ['1:1', '9:16', '16:9', '3:4', '4:3'].includes(aspectRatio) ? aspectRatio : '16:9';

            const payload = {
                contents: [{ role: 'user', parts: generationParts }],
                generationConfig: { 
                    responseModalities: (isUpdate && existingImage) ? ['TEXT', 'IMAGE'] : ['IMAGE']
                }
            };
            
            if (!isUpdate || !existingImage) {
                payload.generationConfig.imageConfig = { aspectRatio: apiAspectRatio };
            }

            const apiUrl = geminiUrl(GEMINI_IMAGE_MODEL);

            let result = null;
            let data = null;
            let mimeType = 'image/png';

            try {
                const response = await fetch(apiUrl, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
                if (!response.ok) {
                    const err = await response.json();
                    console.warn("Image request failed:", err);
                    if (response.status === 429) {
                        throw new Error("Rate limit exceeded (429). Please check your API quota or wait a minute before retrying.");
                    }
                    throw new Error(err.error?.message || "API error during image generation");
                } 
                result = await response.json();
                const part = result?.candidates?.[0]?.content?.parts?.find((p) => p.inlineData);
                data = part?.inlineData?.data;
                mimeType = part?.inlineData?.mimeType || 'image/png';
            } catch (err) {
                console.warn("Fetch error:", err);
                throw err;
            }

            if (data) {
                const imageUrl = `data:${mimeType};base64,${data}`;
                generatedImagesRef.current[frameId] = imageUrl;
                setGeneratedImages((prev) => ({ ...prev, [frameId]: imageUrl }));
                setAiStatus(`Generated ${activeStyle} frame successfully!`);
            } else {
                console.warn("API Response did not contain an image.", result);
                let errorMessage = 'No image returned by AI. Prompt might be too complex or blocked by safety filters.';
                if(result && result.promptFeedback && result.promptFeedback.blockReason) {
                     errorMessage = `Blocked by safety filter: ${result.promptFeedback.blockReason}`;
                }
                throw new Error(errorMessage);
            }
        } catch (error) { 
            console.error("Image generation error:", error);
            setAiStatus(`Image generation failed: ${error.message || 'Check console.'}`); 
        } finally {
            generatingIdsRef.current.delete(frameId);
            setGeneratingIds((prev) => { const newSet = new Set(prev); newSet.delete(frameId); return newSet; });
        }
    };

    const editAIImage = async (sceneId, shotId, editPrompt, maskDataUrl) => {
        const frameId = makeFrameId(sceneId, shotId);
        if (!editPrompt || !editPrompt.trim()) return;

        setAiStatus(`Applying localized edits to frame...`);
        setGeneratingIds((prev) => new Set(prev).add(frameId));
        generatingIdsRef.current.add(frameId);

        try {
            const currentImageUrl = generatedImagesRef.current[frameId];
            const match = currentImageUrl.match(/data:(image\/.*?);base64,(.*)/);
            if (!match) throw new Error("Invalid image format for editing");

            const mimeType = match[1];
            const base64Data = match[2];
            
            let instruction = `Edit this image according to the following instruction: ${editPrompt}.`;
            const parts = [
                { inlineData: { mimeType: mimeType, data: base64Data } }
            ];

            if (maskDataUrl) {
                const maskMatch = maskDataUrl.match(/data:(image\/.*?);base64,(.*)/);
                if (maskMatch) {
                    parts.push({ inlineData: { mimeType: maskMatch[1], data: maskMatch[2] } });
                    instruction += `\nCRITICAL INPAINTING INSTRUCTION: The SECOND image provided is a spatial mask. Isolate your edits STRICTLY to the drawn/highlighted regions in the mask image. Do not alter any other part of the image. Maintain the exact same background, characters, and lighting outside of this region.`;
                }
            } else {
                instruction += `\nMaintain the exact same style, aspect ratio, and composition unless specifically instructed to change them.`;
            }

            parts.push({ text: instruction });

            const payload = {
                contents: [{
                    role: "user",
                    parts: parts
                }],
                generationConfig: {
                    responseModalities: ['TEXT', 'IMAGE']
                }
            };

            const apiUrl = geminiUrl(GEMINI_IMAGE_MODEL);

            const response = await fetch(apiUrl, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
            
            if (!response.ok) {
                const err = await response.json();
                console.error("Image Edit API Error:", err);
                throw new Error(err.error?.message || "API error");
            }

            const result = await response.json();
            const part = result?.candidates?.[0]?.content?.parts?.find((p) => p.inlineData);

            if (part && part.inlineData) {
                const newImageUrl = `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
                generatedImagesRef.current[frameId] = newImageUrl;
                setGeneratedImages((prev) => ({ ...prev, [frameId]: newImageUrl }));
                setAiStatus(`Edit successfully applied!`);
            } else { throw new Error('No image returned'); }
        } catch (error) {
            console.error("Image edit error:", error);
            setAiStatus('Failed to apply edit. Check console.');
        } finally {
            setGeneratingIds((prev) => { const newSet = new Set(prev); newSet.delete(frameId); return newSet; });
            generatingIdsRef.current.delete(frameId);
        }
    };

    const handleTextEdit = async (sceneId, shotId, frameId) => {
        const prompt = imageEditPrompts[frameId];
        if (!prompt || !prompt.trim()) return;
        await editAIImage(sceneId, shotId, prompt, null);
        setImageEditPrompts(prev => ({ ...prev, [frameId]: '' }));
    };

    const generateLastFrame = async (sceneId, shotId, shotData) => {
        const firstFrameId = makeFrameId(sceneId, shotId);
        const lastFrameId = makeLastFrameId(sceneId, shotId);
        const firstFrameImg = generatedImagesRef.current[firstFrameId];

        if (!firstFrameImg) return;

        setAiStatus('Generating final frame of the shot...');
        setGeneratingIds((prev) => new Set(prev).add(lastFrameId));
        generatingIdsRef.current.add(lastFrameId);

        try {
            const match = firstFrameImg.match(/data:(image\/.*?);base64,(.*)/);
            if (!match) throw new Error("Invalid image format");

            const mimeType = match[1];
            const base64Data = match[2];

            const movement = shotData.cameraMovement || 'Static';
            const action = shotData.prompt || '';
            const lens = shotData.lens || 'Auto';
            const shotType = shotData.type || 'Standard';

            let movementInstruction = '';
            if (movement.toLowerCase().includes('pan')) movementInstruction = "CAMERA: The camera has panned horizontally. The background should shift accordingly, and the subject might be in a different part of the frame or a new subject might be revealed.";
            else if (movement.toLowerCase().includes('tilt')) movementInstruction = "CAMERA: The camera has tilted vertically. The framing should be higher or lower than the first frame.";
            else if (movement.toLowerCase().includes('push') || movement.toLowerCase().includes('zoom in')) movementInstruction = "CAMERA: The camera has pushed in. The final frame must be a tighter, closer shot of the main subject/action.";
            else if (movement.toLowerCase().includes('pull') || movement.toLowerCase().includes('zoom out')) movementInstruction = "CAMERA: The camera has pulled out. The final frame must be a wider shot showing more of the environment.";
            else if (movement.toLowerCase().includes('tracking') || movement.toLowerCase().includes('dolly') || movement.toLowerCase().includes('truck')) movementInstruction = "CAMERA: The camera has physically tracked through the space. The perspective and background should reflect this 3D movement.";
            else movementInstruction = "CAMERA: The camera is mostly static, but time has passed. Show the completion of the action described.";

            const promptText = `This image is the STARTING FRAME of a cinematic shot. 
You must deeply analyze the description to deduce both the CAMERA MOVEMENT and the CHARACTER MOVEMENT to generate the FINAL (LAST) FRAME of this exact same shot.

*** SHOT DESCRIPTION & ACTION (CRITICAL TO UNDERSTAND) ***
Action taking place: "${action}"
--------------------------------------------------
You MUST read the action description above carefully. Understand the timeline of this specific shot. 
- Track the physical movement of the characters/artists from the start of the action to the end.
- Where do the characters move to? Do they walk closer, turn away, sit down, or stand up?
- What action is completed by the end of this shot?
- What is their final pose, interaction, or expression?
Visually depict the exact end-state of this described action.

*** CAMERA & LENS PROPERTIES ***
Camera Movement: ${movement}
Lens: ${lens}
Shot Type: ${shotType}

*** FINAL FRAME INSTRUCTIONS ***
1. ${movementInstruction}
2. CHARACTER/ARTIST MOVEMENT: You MUST update the subjects' physical positions, blocking, poses, and expressions strictly based on the completion of the "Action taking place" described above. 
3. ABSOLUTE RULE - NO CLONES: You are STRICTLY FORBIDDEN from duplicating characters. Do not show a "ghost" or "trail" of where they came from. Show exactly ONE instance of each character at their FINAL destination. If they walked across the room, show them ONLY at the end of the room.
4. CONTINUITY: Maintain the exact same character identities, wardrobe, lighting style, environment, and aspect ratio. ONLY change the framing (based on camera movement) and the subjects' state (based on the character movement).`;

            const payload = {
                contents: [{
                    role: "user",
                    parts: [
                        { inlineData: { mimeType: mimeType, data: base64Data } },
                        { text: promptText }
                    ]
                }],
                generationConfig: {
                    responseModalities: ['IMAGE']
                }
            };

            const apiUrl = geminiUrl(GEMINI_IMAGE_MODEL);

            const response = await fetch(apiUrl, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
            
            if (!response.ok) throw new Error("API error");

            const result = await response.json();
            const part = result?.candidates?.[0]?.content?.parts?.find((p) => p.inlineData);

            if (part && part.inlineData) {
                const newImageUrl = `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
                generatedImagesRef.current[lastFrameId] = newImageUrl;
                setGeneratedImages((prev) => ({ ...prev, [lastFrameId]: newImageUrl }));
                setAiStatus(`Last frame generated successfully!`);
            } else { throw new Error('No image returned'); }
        } catch (error) {
            console.error("Last frame error:", error);
            setAiStatus('Failed to generate last frame.');
        } finally {
            setGeneratingIds((prev) => { const newSet = new Set(prev); newSet.delete(lastFrameId); return newSet; });
            generatingIdsRef.current.delete(lastFrameId);
        }
    };

    const generateBlockingMap = async (sceneId, shotId) => {
        const frameId = makeFrameId(sceneId, shotId);
        const currentImageUrl = generatedImagesRef.current[frameId];
        
        if (!currentImageUrl) {
            setAlertMessage("Please render an image first before generating a blocking map.");
            return;
        }

        setAiStatus(`Analyzing rendered image to build blocking map...`);
        setGeneratingIds((prev) => new Set(prev).add(`blocking-${frameId}`));
        generatingIdsRef.current.add(`blocking-${frameId}`);

        try {
            const match = currentImageUrl.match(/data:(image\/.*?);base64,(.*)/);
            if (!match) throw new Error("Invalid image format");

            const visionApiUrl = geminiUrl(GEMINI_TEXT_MODEL);
            const blockingPayload = {
                contents: [{
                    role: "user",
                    parts: [
                        { inlineData: { mimeType: match[1], data: match[2] } },
                        { text: `Analyze this scene and estimate the overhead top-down blocking map. Where are the camera, actors, and lights located?
Assume a 100x100 grid where (50,50) is the center.
Respond ONLY with a JSON object matching this schema:
{
  "elements": [
    { "id": 1, "type": "camera", "label": "CAM A", "x": 50, "y": 80, "rotation": 0, "color": "#10b981", "height": 1.5, "pitch": 0, "focalLength": 35 },
    { "id": 2, "type": "actor", "label": "Main Subject", "x": 50, "y": 50, "rotation": 180, "color": "#3b82f6" },
    { "id": 3, "type": "light", "label": "Key Light", "x": 30, "y": 40, "rotation": 45, "color": "#fef08a", "intensity": 80 }
  ]
}
Ensure rotation is in degrees (0-360). Identify the main lighting sources you see in the image and add them as "light" elements.` }
                    ]
                }],
                generationConfig: { responseMimeType: "application/json" }
            };

            const bResp = await fetch(visionApiUrl, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(blockingPayload) });
            if (bResp.ok) {
                const bRes = await bResp.json();
                if (bRes.candidates?.[0]?.content?.parts?.[0]) {
                    const bData = parseAIJson(bRes.candidates[0].content.parts[0].text);
                    if (bData && bData.elements) {
                        const safeElements = bData.elements.map((el, i) => ({ ...el, id: Date.now() + i }));
                        updateShotBlocking(sceneId, shotId, { elements: safeElements });
                        setAiStatus(`Blocking Map generated successfully!`);
                    }
                }
            } else {
                 throw new Error("API error");
            }
        } catch (e) {
            console.error("Blocking map generation failed:", e);
            setAiStatus(`Failed to generate blocking map.`);
            setAlertMessage(`Failed to generate blocking map. Check console for details.`);
        } finally {
            setGeneratingIds((prev) => { const newSet = new Set(prev); newSet.delete(`blocking-${frameId}`); return newSet; });
            generatingIdsRef.current.delete(`blocking-${frameId}`);
        }
    };

    const applyBlockingToImage = async (sceneId, shotId) => {
        const frameId = makeFrameId(sceneId, shotId);
        const currentImageUrl = generatedImagesRef.current[frameId];
        
        if (!currentImageUrl) {
            setAlertMessage("Please render an initial frame first before applying blocking map changes to it.");
            return;
        }

        const scene = parsedScenesRef.current.find(s => s.id === sceneId);
        const shot = scene?.shots.find(s => s.id === shotId);
        
        if (!shot || !shot.blockingData || !shot.blockingData.elements || shot.blockingData.elements.length === 0) {
            setAlertMessage("No elements found in the blocking map. Add cameras, actors, or lights first.");
            return;
        }

        setAiStatus(`Syncing Blocking Map to Image...`);
        setGeneratingIds((prev) => new Set(prev).add(frameId));
        generatingIdsRef.current.add(frameId);

        try {
            const match = currentImageUrl.match(/data:(image\/.*?);base64,(.*)/);
            if (!match) throw new Error("Invalid image format for editing");

            const mimeType = match[1];
            const base64Data = match[2];

            let blockingInstructions = `\n\n*** EXACT OVERRIDE: USER DEFINED BLOCKING & STAGING MAP ***\n`;
            blockingInstructions += `You MUST rigorously adhere to these precise physical parameters from the overhead staging map. Re-frame and re-light the scene to match perfectly:\n`;
            
            const cams = shot.blockingData.elements.filter(e => e.type === 'camera');
            const lights = shot.blockingData.elements.filter(e => e.type === 'light');
            const actors = shot.blockingData.elements.filter(e => e.type === 'actor');
            const props = shot.blockingData.elements.filter(e => e.type === 'prop');

            if (cams.length > 0) {
                const c = cams[0];
                blockingInstructions += `- CAMERA LOCATION: Height ${c.height || 1.5}m, Pitch ${c.pitch || 0}°, Focal Length ${c.focalLength || 35}mm. Pan/Heading is ${c.rotation}°.\n`;
            }
            if (lights.length > 0) {
                blockingInstructions += `- SCENE LIGHTING RIGS:\n`;
                lights.forEach(l => {
                    blockingInstructions += `  * ${l.label}: Color ${l.color}, Intensity ${l.intensity || 50}%, Directed at ${l.rotation}°.\n`;
                });
            }
            if (actors.length > 0) {
                blockingInstructions += `- ACTORS / TALENT POSITIONING:\n`;
                actors.forEach(a => {
                    blockingInstructions += `  * ${a.label} is physically positioned at X:${Math.round(a.x)}% Y:${Math.round(a.y)}% on the floor plan, facing ${a.rotation}°.\n`;
                });
            }
            if (props.length > 0) {
                blockingInstructions += `- PROPS / MARKS:\n`;
                props.forEach(p => {
                    blockingInstructions += `  * ${p.label} located at X:${Math.round(p.x)}% Y:${Math.round(p.y)}%.\n`;
                });
            }

            const promptText = `INLINE IMAGE MODIFICATION: Edit this exact image to perfectly reflect the updated physical blocking, lighting, and camera positions provided below. Maintain the exact same environment, character identities, clothing, global style, and aspect ratio. ONLY alter the camera perspective, field of view, shadows, lighting direction, and subject placement to mathematically match these new coordinates:\n${blockingInstructions}\n\nCRITICAL CONTEXT TO MAINTAIN:\nOriginal Action: ${shot.prompt}\nStyle: ${selectedStyle || 'Cinematic'}\nTone: ${selectedTone || 'Standard'}\n(Do not forget what this scene is about! The characters must still be performing this original action, just viewed from the new camera angle/blocking).`;

            const payload = {
                contents: [{
                    role: "user",
                    parts: [
                        {
                            inlineData: {
                                mimeType: mimeType,
                                data: base64Data
                            }
                        },
                        { text: promptText }
                    ]
                }],
                generationConfig: {
                    responseModalities: ['TEXT', 'IMAGE']
                }
            };

            const apiUrl = geminiUrl(GEMINI_IMAGE_MODEL);

            const response = await fetch(apiUrl, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
            
            if (!response.ok) {
                const err = await response.json();
                console.error("Image Edit API Error:", err);
                throw new Error(err.error?.message || "API error");
            }

            const result = await response.json();
            const part = result?.candidates?.[0]?.content?.parts?.find((p) => p.inlineData);

            if (part && part.inlineData) {
                const newImageUrl = `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
                generatedImagesRef.current[frameId] = newImageUrl;
                setGeneratedImages((prev) => ({ ...prev, [frameId]: newImageUrl }));
                setAiStatus(`Blocking synchronized to image successfully!`);
            } else { throw new Error('No image returned'); }
        } catch (error) {
            console.error("Blocking sync error:", error);
            setAiStatus('Failed to sync blocking. Check console.');
        } finally {
            setGeneratingIds((prev) => { const newSet = new Set(prev); newSet.delete(frameId); return newSet; });
            generatingIdsRef.current.delete(frameId);
        }
    };

    const generateTechBreakdown = async (sceneId, shotId, shotData) => {
        const frameId = makeFrameId(sceneId, shotId);
        const currentImageUrl = generatedImagesRef.current[frameId];
        if (!currentImageUrl) return;

        setAiStatus(`Generating Technical Breakdown Board for Shot ${shotId}...`);
        const genId = `breakdown-${frameId}`;
        setGeneratingIds(prev => new Set(prev).add(genId));
        generatingIdsRef.current.add(genId);

        try {
            const match = currentImageUrl.match(/data:(image\/.*?);base64,(.*)/);
            if (!match) throw new Error("Invalid image format");

            const getSimRules = () => {
                const m = (shotData.cameraMovement || '').toLowerCase();
                if (m.includes('push') || m.includes('zoom in')) return "Frame 1 (START): Wide view. Frame 2 & 3: Camera moves physically closer. Frame 4 (END): Tight close-up on the center subject.";
                if (m.includes('pull') || m.includes('zoom out')) return "Frame 1 (START): Tight close-up on the subject. Frame 2 & 3: Camera moves further away. Frame 4 (END): Wide establishing view.";
                if (m.includes('pan')) return "Frame 1 (START): Camera pointed left of the subject. Frame 2 & 3: Panning across. Frame 4 (END): Camera pointed right of the subject.";
                if (m.includes('tilt')) return "Frame 1 (START): Camera pointed downwards. Frame 2 & 3: Tilting upwards. Frame 4 (END): Camera pointed upwards.";
                if (m.includes('tracking') || m.includes('dolly') || m.includes('truck')) return "Simulate lateral movement: Generate 4 virtual shots showing the subject from slightly different horizontal angles as the camera physically moves sideways through the space.";
                return "Frame 1 to 4: Maintain the exact same static composition, but show slight variations in the subject's pose, micro-expressions, or environment (like wind blowing) to simulate a live take over time.";
            };

            const simRules = getSimRules();

            const promptText = `Take the provided source image and embed it into a highly detailed, ultra-professional 'Cinematography Breakdown Dashboard'. Create a sleek, dark-mode technical layout around the image.

CRITICAL RULES:
1. DO NOT scale, crop, stretch, or alter the original provided image in any way for the MAIN VIEWER. It MUST maintain its exact original aspect ratio and composition. Embed it cleanly into the large central 'Viewer' panel. Add a subtle rule-of-thirds grid overlay, a green focus tracking box/bracket on the main subject's face/eyes, AND a prominent 'Motion Path' overlay (e.g., colored dashed outlines and arrows) directly on this main image to map the camera's sequence from START to END.
2. The surrounding layout must be ultra-premium: OLED black backgrounds (#000000 to #111111), sharp 1px dark gray grid borders, minimal spacing, and small professional monospace typography. DO NOT include fake UI buttons, top header bars, title bars, or navigation tabs (like export, share, or menu bars). Start immediately with the dashboard panels at the very top edge.
3. DEEP LIGHTING ANALYSIS: You MUST perform a deep visual analysis of the provided source image to deduce the ACTUAL lighting setup used. Look closely at the direction of shadows, specular highlights on the subject, rim lighting on edges, background illumination, and overall contrast ratio. Derive the exact placement, intensity, and color temperature of the Key, Fill, Back, and Ambient lights based ONLY on what you see in this specific image.
4. You MUST include ALL of the following specific panels organized perfectly, matching the layout of professional cinematography analysis tools:

- TOP LEFT ('UPLOAD / INPUT'): A small thumbnail of the source image and camera sensor info.
- MIDDLE LEFT ('CAMERA MOVEMENT DETECTION'): A list of movement types (Dolly In, Static Shot, Push In, Handheld, Arc Shot, Gimbal Tracking, Drone Shot) with green/yellow confidence horizontal bar charts and percentages. Highlight "${shotData.cameraMovement || 'Static'}" as the highest confidence movement.
- MIDDLE LEFT 2 ('MOVEMENT PATH PREVIEW'): A 2D grid diagram showing a camera icon, a subject icon, and a dashed arrow path simulating the movement.
- BOTTOM LEFT ('SHOT INFORMATION'): A detailed text table listing Shot Type (${shotData.type || 'Standard'}), Framing, Focal Length (Est.), Camera Height (${shotData.cameraAngle || 'Eye Level'}), Angle, Lens (${shotData.lens || 'Prime'}), Depth of Field, Focus, Stabilization, Aspect Ratio.
- CENTER METADATA STRIP (Just below the main central image): A horizontal dark bar with distinct data blocks for CAMERA (${shotData.camera || 'ARRI ALEXA LF'}), LENS (${shotData.lens || '50mm Prime'}), T-STOP (T2.0), ISO (800), SHUTTER (1/50), WB (3200K), COLOR (${shotData.palette || 'Warm'}), PROFILE (e.g., ARRI Log C3).
- CENTER BOTTOM ('CAMERA MOVEMENT SIMULATION'): A horizontal film strip showing exactly 4 sequential frames. 
  CRITICAL RULE: Instead of strictly cropping the main image, GENERATE 4 SEPARATE VIRTUAL SHOTS that accurately simulate the "${shotData.cameraMovement || 'Static'}" motion through the environment. They should look like 4 progressive frames from a real video timeline.
  PROGRESSION RULES: ${simRules}
  Label the frames clearly as "START", "MID 1", "MID 2", and "END". Add highly visible, colored UI overlays on these sequence frames (such as neon directional arrows, center crosshairs, or motion vectors) to emphasize the camera movement.
- TOP RIGHT ('LIGHTING ANALYSIS'): A 3D/Isometric wireframe diagram or top-down plot showing the EXACT light placements you deduced from the deep analysis of the source image. Include Key light, Fill light, Back light, Rim light, Practicals, and Ambient. Give each a distinct color icon (e.g., Key=Yellow, Fill=Blue, Back=Red, Rim=Purple, Practical=Orange) and show their intensity percentages, direction angles, and types (e.g., Softbox / 45°).
- MIDDLE RIGHT ('LIGHTING DETAILS'): A 2-column text list breaking down your deduced lighting setup: Key Light, Fill, Back Light, Rim Light, Ambient, Color Temperature, Contrast Ratio, Shadow Quality, Motivation, and Atmosphere.
- BOTTOM HORIZONTAL STRIP (Split into 4 sections from left to right):
    1. 'EXTENDED LOCATION SKETCH': A wide conceptual sketch of the expanded environment showing a yellow framing box indicating the current camera view.
    2. 'TOP VIEW FLOOR PLAN': A top-down 2D blueprint of the room, camera, subject, light positions (color-coded), windows, and movement path.
    3. 'SIDE VIEW DIAGRAM': A side-profile diagram showing the camera's height relative to the seated/standing subject and light angles.
    4. 'CINEMATOGRAPHY NOTES': A bulleted list of 5 qualitative notes explaining the visual mood, lighting motivation, depth of field, and stylistic choices.`;

            const payload = {
                contents: [{
                    role: "user",
                    parts: [
                        { inlineData: { mimeType: match[1], data: match[2] } },
                        { text: promptText + "\n\nAspect Ratio: Ensure the dashboard is generated in a 16:9 widescreen format." }
                    ]
                }],
                generationConfig: {
                    responseModalities: ['TEXT', 'IMAGE']
                }
            };

            const apiUrl = geminiUrl(GEMINI_IMAGE_MODEL);

            const response = await fetch(apiUrl, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
            
            if (!response.ok) throw new Error("API error");

            const result = await response.json();
            const part = result?.candidates?.[0]?.content?.parts?.find((p) => p.inlineData);

            if (part && part.inlineData) {
                const newImageUrl = `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
                setGeneratedBreakdowns(prev => ({ ...prev, [frameId]: newImageUrl }));
                setAiStatus(`Tech Breakdown Board generated successfully!`);
            } else { throw new Error('No image returned'); }

        } catch (error) {
            console.error("Breakdown generation error:", error);
            setAiStatus('Failed to generate Breakdown Board.');
        } finally {
            setGeneratingIds(prev => { const newSet = new Set(prev); newSet.delete(genId); return newSet; });
            generatingIdsRef.current.delete(genId);
        }
    };

    const generateCollages = async (sceneId) => {
        const scene = parsedScenesRef.current.find(s => s.id === sceneId);
        if (!scene) return;
        
        setAiStatus(`Compiling Storyboard Grid for Scene ${sceneId}...`);
        setGeneratingIds(prev => new Set(prev).add(`collages-${sceneId}`));
        
        try {
            const safeShots = Array.isArray(scene.shots) ? scene.shots : Object.values(scene.shots || {});
            const sortedShots = [...safeShots].sort((a, b) => (a.order ?? a.id) - (b.order ?? b.id));
            const frameImages = [];
            for (const shot of sortedShots) {
                const frameId = makeFrameId(sceneId, shot.id);
                if (generatedImagesRef.current[frameId]) {
                    const img = new Image();
                    img.src = generatedImagesRef.current[frameId];
                    await new Promise(r => img.onload = r);
                    frameImages.push(img);
                }
            }

            if (frameImages.length === 0) throw new Error("No rendered frames found. Render frames first.");

            const cols = 2;
            const rows = Math.ceil(frameImages.length / cols);
            const imgW = frameImages[0].width;
            const imgH = frameImages[0].height;
            const padding = 40;
            
            const canvas = document.createElement('canvas');
            canvas.width = (imgW * cols) + (padding * (cols + 1));
            canvas.height = (imgH * rows) + (padding * (rows + 1));
            const ctx = canvas.getContext('2d');
            
            ctx.fillStyle = '#0a0a0a';
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            
            frameImages.forEach((img, idx) => {
                const col = idx % cols;
                const row = Math.floor(idx / cols);
                const x = padding + (col * (imgW + padding));
                const y = padding + (row * (imgH + padding));
                ctx.drawImage(img, x, y, imgW, imgH);
                ctx.strokeStyle = '#1f1f1f';
                ctx.lineWidth = 4;
                ctx.strokeRect(x, y, imgW, imgH);
            });

            const dataUrl = canvas.toDataURL('image/jpeg', 0.9);
            setGeneratedCollages(prev => ({ ...prev, [sceneId]: [dataUrl] }));
            setAiStatus(`Storyboard compiled successfully!`);
        } catch (e) {
            console.error(e);
            setAiStatus(`Failed to compile boards: ${e.message}`);
        } finally {
            setGeneratingIds(prev => { const newSet = new Set(prev); newSet.delete(`collages-${sceneId}`); return newSet; });
        }
    };

    const handleGenerateAllBoards = async () => {
        if (parsedScenesRef.current.length === 0) {
            setAiStatus('No scenes to compile.');
            return;
        }
        setIsCompilingAll(true);
        setAiStatus('Compiling all boards and analysis dashboards...');
        try {
            for (let i = 0; i < parsedScenesRef.current.length; i++) {
                const scene = parsedScenesRef.current[i];
                const safeShots = Array.isArray(scene.shots) ? scene.shots : Object.values(scene.shots || {});
                const hasImages = safeShots.some(shot => generatedImagesRef.current[makeFrameId(scene.id, shot.id)]);
                
                if (hasImages) {
                    if (!generatedCostumeBoards[scene.id]) {
                        await generateCostumeBoard(scene.id);
                    }
                    
                    if (!generatedCollages[scene.id]) {
                        await generateCollages(scene.id);
                    }

                    for (let j = 0; j < safeShots.length; j++) {
                        const shot = safeShots[j];
                        const frameId = makeFrameId(scene.id, shot.id);
                        if (generatedImagesRef.current[frameId] && !generatedBreakdownsRef.current[frameId]) {
                            await generateTechBreakdown(scene.id, shot.id, shot);
                        }
                    }
                }
            }
            setAiStatus('All boards and analysis generated successfully!');
        } catch (err) {
            console.error("Board compilation error:", err);
            setAiStatus('Failed to compile all boards.');
        } finally {
            setIsCompilingAll(false);
        }
    };

    const generateCostumeBoard = async (sceneId) => {
        const scene = parsedScenesRef.current.find(s => s.id === sceneId);
        if (!scene) return;

        setAiStatus(`Generating Wardrobe & Props Turnaround for Scene ${sceneId}...`);
        const genId = `costume-board-${sceneId}`;
        setGeneratingIds(prev => new Set(prev).add(genId));
        generatingIdsRef.current.add(genId);

        try {
            const safeShots = Array.isArray(scene.shots) ? scene.shots : Object.values(scene.shots || {});
            
            const charsInSceneMap = new Map();
            safeShots.forEach(shot => {
                const shotChars = getCharactersForShot(shot, characters);
                shotChars.forEach(c => {
                    if (c && c.name && !charsInSceneMap.has(c.name)) {
                        charsInSceneMap.set(c.name, c);
                    }
                });
            });
            const charsInScene = Array.from(charsInSceneMap.values());
            const charNames = charsInScene.map(c => c.name).join(', ') || 'Main Characters';
            
            const charDescriptions = charsInScene.map(c => 
                `- ${c.name}: ${c.gender || 'Unspecified'}, ${c.age ? `Age ${c.age}` : 'Unspecified age'}. ${c.description ? `Base traits: ${c.description}` : ''}`
            ).join('\n');

            const props = scene.propsBreakdown?.props?.join(', ') || 'Standard scene items';
            
            let dressCode = '';
            const dressCodeMatch = (scene.description || '').match(/\[SCENE DRESS CODE:([\s\S]*?)\]/i);
            if (dressCodeMatch) {
                dressCode = dressCodeMatch[1].trim();
            } else if (scene.propsBreakdown?.wardrobe) {
                dressCode = scene.propsBreakdown.wardrobe.join(', ');
            }

            const promptText = `Create a highly professional 'Costume & Prop Breakdown Chart' for a film production.
            Layout: A sleek, dark-mode presentation dashboard. 
            Content: Highly detailed concept art character turnarounds showing BOTH FULL-BODY FRONT AND BACK views of the actors' outfits.
            
            ***SCENE CHARACTERS***:
            ${charDescriptions || 'Main Characters'}
            
            ***MANDATORY WARDROBE/DRESS CODE***: 
            ${dressCode || 'Standard cinematic outfits based on scene description: ' + scene.description.substring(0, 100)}
            
            ***PROPS TO INCLUDE***: 
            ${props}

            ***GLOBAL STYLE***:
            Style: ${selectedStyle}
            Tone: ${selectedTone}
            Palette: ${selectedPalette}
            Time of Day: ${selectedGlobalTime}

            CRITICAL INSTRUCTIONS:
            1. You MUST dress the characters EXACTLY as described in the Mandatory Wardrobe/Dress Code. Do not invent new outfits.
            2. If character reference images are provided below, you MUST match their faces and identities perfectly, synthesizing all provided angles.
            3. Ensure the visual style matches the global style, tone, and color palette.
            4. Style the output as a Masterpiece, ultra-detailed digital concept art, technical layout with annotations.`;

            const parts = [{ text: promptText }];

            const charsWithImages = charsInScene.filter(char => char.images && char.images.length > 0);
            if (charsWithImages.length > 0) {
                parts.push({ text: "==============================================\n[MANDATORY CHARACTER LIKENESS REFERENCES]\nYou MUST use the attached reference images as the exact faces and identities for the characters.\n==============================================" });
                charsWithImages.forEach(char => {
                    parts.push({ text: `ACTOR PLAYING "${char.name}": Generate "${char.name}" with a 100% EXACT BIOMETRIC MATCH to these faces.` });
                    char.images.slice(0, 3).forEach((img, idx) => {
                        parts.push({ inlineData: { mimeType: img.mimeType, data: img.data } });
                    });
                });
            }
            
            parts.push({ text: "\n\nAspect Ratio: Ensure the layout is in a 16:9 widescreen format." });

            const payload = {
                contents: [{ role: 'user', parts: parts }],
                generationConfig: { responseModalities: ['TEXT', 'IMAGE'] }
            };

            const apiUrl = geminiUrl(GEMINI_IMAGE_MODEL);

            const response = await fetch(apiUrl, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
            
            if (!response.ok) throw new Error("API error");

            const result = await response.json();
            const part = result?.candidates?.[0]?.content?.parts?.find((p) => p.inlineData);

            if (part && part.inlineData) {
                const newImageUrl = `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
                setGeneratedCostumeBoards(prev => ({ ...prev, [sceneId]: newImageUrl }));
                setAiStatus(`Costume Board generated successfully!`);
            } else { throw new Error('No image returned'); }

        } catch (error) {
            console.error("Costume board error:", error);
            setAiStatus('Failed to generate Costume Board.');
        } finally {
            setGeneratingIds(prev => { const newSet = new Set(prev); newSet.delete(genId); return newSet; });
            generatingIdsRef.current.delete(genId);
        }
    };

    const applyLensToImage = async (sceneId, shotId, newLens) => {
        const frameId = makeFrameId(sceneId, shotId);
        const currentImageUrl = generatedImagesRef.current[frameId];
        
        if (currentImageUrl && newLens && !generatingIdsRef.current.has(frameId)) {
            setAiStatus(`Applying ${newLens} optical properties to existing image...`);
            setGeneratingIds((prev) => new Set(prev).add(frameId));
            generatingIdsRef.current.add(frameId);

            try {
                let lensCharacteristics = `***MANDATORY LENS OPTICS & FRAMING OVERRIDE***: Change the optical perspective to a ${newLens}. `;
                const lowerLens = newLens.toLowerCase();
                
                if (lowerLens.includes('anamorphic')) lensCharacteristics += "You MUST add strong anamorphic properties: oval bokeh, cinematic widescreen aesthetic, barrel distortion, and horizontal lens flares. ";
                else if (lowerLens.includes('signature')) lensCharacteristics += "You MUST add Signature Prime properties: smooth organic focus falloff, warm skin tones, and creamy bokeh. ";
                else if (lowerLens.includes('master')) lensCharacteristics += "You MUST add Master Prime properties: ultra-sharp pristine focus, high micro-contrast, and clean edge-to-edge resolution. ";

                const match = lowerLens.match(/(\d+)mm/);
                if (match) {
                    const mm = parseInt(match[1]);
                    if (mm <= 24) lensCharacteristics += `You MUST apply an EXTREME ULTRA-WIDE ${mm}mm perspective: RE-FRAME AND ZOOM OUT to a WIDE SHOT showing massive amounts of the environment. Create exaggerated spatial distance, dynamic wide-angle distortion, and deep depth of field.`;
                    else if (mm > 24 && mm <= 47) lensCharacteristics += `You MUST apply a WIDE/MEDIUM ${mm}mm perspective: RE-FRAME to a MEDIUM WIDE SHOT with a natural field of view.`;
                    else if (mm >= 50 && mm <= 75) lensCharacteristics += `You MUST apply a STANDARD/SHORT-TELEPHOTO ${mm}mm perspective: RE-FRAME to a MEDIUM CLOSE-UP with shallow depth of field and beautiful subject separation.`;
                    else if (mm > 75) lensCharacteristics += `You MUST apply a TELEPHOTO ${mm}mm perspective: RE-FRAME AND ZOOM IN to a TIGHT CLOSE-UP. Show the subject extremely close with extreme shallow depth of field, heavy bokeh, and strong background compression.`;
                }

                const imgMatch = currentImageUrl.match(/data:(image\/.*?);base64,(.*)/);
                if (!imgMatch) throw new Error("Invalid image format for editing");

                const payload = {
                    contents: [{
                        role: "user",
                        parts: [
                            {
                                inlineData: {
                                    mimeType: imgMatch[1],
                                    data: imgMatch[2]
                                }
                            },
                            { text: `Edit this exact image to perfectly simulate the specified camera lens. Keep the character's identity, clothing, and setting identical. However, YOU MUST ALTER THE FRAMING, ZOOM LEVEL, AND FIELD OF VIEW to accurately reflect this focal length: ${lensCharacteristics}` }
                        ]
                    }],
                    generationConfig: {
                        responseModalities: ['TEXT', 'IMAGE']
                    }
                };

                const apiUrl = geminiUrl(GEMINI_IMAGE_MODEL);

                const response = await fetch(apiUrl, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
                
                if (!response.ok) throw new Error("API error");

                const result = await response.json();
                const part = result?.candidates?.[0]?.content?.parts?.find((p) => p.inlineData);

                if (part && part.inlineData) {
                    const newImageUrl = `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
                    generatedImagesRef.current[frameId] = newImageUrl;
                    setGeneratedImages((prev) => ({ ...prev, [frameId]: newImageUrl }));
                    setAiStatus(`Applied ${newLens} successfully!`);
                } else { throw new Error('No image returned'); }
            } catch (error) {
                console.error("Lens edit error:", error);
                setAiStatus('Failed to apply lens edit.');
            } finally {
                setGeneratingIds((prev) => { const newSet = new Set(prev); newSet.delete(frameId); return newSet; });
                generatingIdsRef.current.delete(frameId);
            }
        }
    };

    const updateShotCamera = (sceneId, shotId, newCamera) => updateScenesWithHistory((prev) => prev.map((scene) => scene.id !== sceneId ? scene : { ...scene, shots: scene.shots.map((shot) => shot.id === shotId ? { ...shot, camera: newCamera } : shot) }));
    const updateShotLens = (sceneId, shotId, newLens) => updateScenesWithHistory((prev) => prev.map((scene) => scene.id !== sceneId ? scene : { ...scene, shots: scene.shots.map((shot) => shot.id === shotId ? { ...shot, lens: newLens } : shot) }));
    const updateShotStyle = (sceneId, shotId, newStyle) => updateScenesWithHistory((prev) => prev.map((scene) => scene.id !== sceneId ? scene : { ...scene, shots: scene.shots.map((shot) => shot.id === shotId ? { ...shot, style: newStyle } : shot) }));
    const updateShotTone = (sceneId, shotId, newTone) => updateScenesWithHistory((prev) => prev.map((scene) => scene.id !== sceneId ? scene : { ...scene, shots: scene.shots.map((shot) => shot.id === shotId ? { ...shot, tone: newTone } : shot) }));
    const updateShotPalette = (sceneId, shotId, newPalette) => updateScenesWithHistory((prev) => prev.map((scene) => scene.id !== sceneId ? scene : { ...scene, shots: scene.shots.map((shot) => shot.id === shotId ? { ...shot, palette: newPalette } : shot) }));
    const updateShotType = (sceneId, shotId, newType) => updateScenesWithHistory((prev) => prev.map((scene) => scene.id !== sceneId ? scene : { ...scene, shots: scene.shots.map((shot) => shot.id === shotId ? { ...shot, type: newType } : shot) }));
    const updateShotAngle = (sceneId, shotId, newAngle) => updateScenesWithHistory((prev) => prev.map((scene) => scene.id !== sceneId ? scene : { ...scene, shots: scene.shots.map((shot) => shot.id === shotId ? { ...shot, cameraAngle: newAngle } : shot) }));
    const updateShotMovement = (sceneId, shotId, newMovement) => updateScenesWithHistory((prev) => prev.map((scene) => scene.id !== sceneId ? scene : { ...scene, shots: scene.shots.map((shot) => shot.id === shotId ? { ...shot, cameraMovement: newMovement } : shot) }));
    const updateShotSpecialty = (sceneId, shotId, newSpecialty) => updateScenesWithHistory((prev) => prev.map((scene) => scene.id !== sceneId ? scene : { ...scene, shots: scene.shots.map((shot) => shot.id === shotId ? { ...shot, specialtyShot: newSpecialty } : shot) }));
    const updateShotLighting = (sceneId, shotId, newLighting) => updateScenesWithHistory((prev) => prev.map((scene) => scene.id !== sceneId ? scene : { ...scene, shots: scene.shots.map((shot) => shot.id === shotId ? { ...shot, lighting: newLighting } : shot) }));
    const updateShotTimeOfDay = (sceneId, shotId, newTime) => updateScenesWithHistory((prev) => prev.map((scene) => scene.id !== sceneId ? scene : { ...scene, shots: scene.shots.map((shot) => shot.id === shotId ? { ...shot, timeOfDay: newTime } : shot) }));
    const updateShotPrompt = (sceneId, shotId, newPrompt) => updateScenesWithHistory((prev) => prev.map((scene) => scene.id !== sceneId ? scene : { ...scene, shots: scene.shots.map((shot) => shot.id === shotId ? { ...shot, prompt: newPrompt } : shot) }));
    const updateShotDuration = (sceneId, shotId, newDuration) => updateScenesWithHistory((prev) => prev.map((scene) => scene.id !== sceneId ? scene : { ...scene, shots: scene.shots.map((shot) => shot.id === shotId ? { ...shot, duration: newDuration } : shot) }));
    const updateShotNotes = (sceneId, shotId, newNotes) => updateScenesWithHistory((prev) => prev.map((scene) => scene.id !== sceneId ? scene : { ...scene, shots: scene.shots.map((shot) => shot.id === shotId ? { ...shot, notes: newNotes } : shot) }));

    const applyGenrePreset = (preset) => {
        setSelectedStyle(preset.style);
        setSelectedTone(preset.tone);
        setSelectedPalette(preset.palette);
        setSelectedGlobalTime(preset.time);
        setAiStatus(`Applied "${preset.name}" genre preset.`);
    };

    const totalRuntimeSec = parsedScenes.reduce((tot, scene) => {
        const shots = Array.isArray(scene.shots) ? scene.shots : Object.values(scene.shots || {});
        return tot + shots.reduce((s, sh) => s + parseDurationSec(sh.duration), 0);
    }, 0);
    const updateShotLocation = (sceneId, shotId, newLocId) => updateScenesWithHistory((prev) => prev.map((scene) => scene.id !== sceneId ? scene : { ...scene, shots: scene.shots.map((shot) => shot.id === shotId ? { ...shot, locationId: newLocId ? parseInt(newLocId) : null } : shot) }));
    const updateSceneDetails = (sceneId, field, value) => updateScenesWithHistory((prev) => prev.map((scene) => (scene.id === sceneId ? { ...scene, [field]: value } : scene)));
    
    const handleImportDressCode = (targetSceneId, sourceSceneId) => {
        const sourceScene = parsedScenesRef.current.find(s => s.id === sourceSceneId);
        const targetScene = parsedScenesRef.current.find(s => s.id === targetSceneId);
        if (!sourceScene || !targetScene) return;

        const dressCodeMatch = (sourceScene.description || '').match(/\[SCENE DRESS CODE:([\s\S]*?)\]/i);
        if (dressCodeMatch) {
            const dressCodeStr = dressCodeMatch[1].trim();
            
            let targetChars = new Set();
            targetScene.shots.forEach(shot => {
                const chars = getCharactersForShot(shot, characters);
                chars.forEach(c => targetChars.add(c.name));
            });
            const targetCharNames = Array.from(targetChars);

            let filteredDressCode = '';
            if (targetCharNames.length > 0) {
                 const lines = dressCodeStr.split('\n');
                 const matchingLines = lines.filter(line => {
                     return targetCharNames.some(charName => line.toLowerCase().includes(charName.toLowerCase()));
                 });
                 if (matchingLines.length > 0) {
                     filteredDressCode = `[SCENE DRESS CODE:\n${matchingLines.join('\n')}\n]`;
                 } else {
                     setAlertMessage(`No matching character dress codes found in Scene ${sourceSceneId} for characters in Scene ${targetSceneId}.`);
                     return;
                 }
            } else {
                setAlertMessage(`No characters found in target Scene ${targetSceneId}. Add characters to shots before importing dress code.`);
                return;
            }

            let newTargetDesc = (targetScene.description || '').replace(/\n\n\[SCENE DRESS CODE:[\s\S]*?\]/gi, '').replace(/\[SCENE DRESS CODE:[\s\S]*?\]/gi, '').trim();
            newTargetDesc += `\n\n${filteredDressCode}`;
            updateSceneDetails(targetSceneId, 'description', newTargetDesc);
            setAiStatus(`Imported and filtered dress code from Scene ${sourceSceneId}`);
        } else {
            setAlertMessage('No dress code found in the selected scene.');
        }
    };

    const updateShotBlocking = (sceneId, shotId, blockingData) => updateScenesWithHistory((prev) => prev.map((scene) => scene.id !== sceneId ? scene : { ...scene, shots: scene.shots.map((shot) => shot.id === shotId ? { ...shot, blockingData } : shot) }));

    const updateShotOrder = (sceneId, shotId, newOrderVal) => {
        const newOrder = parseFloat(newOrderVal);
        if (isNaN(newOrder)) return;
        
        updateScenesWithHistory((prev) => prev.map((scene) => {
            if (scene.id !== sceneId) return scene;
            const updatedShots = scene.shots.map((shot) => shot.id === shotId ? { ...shot, order: newOrder } : shot);
            updatedShots.sort((a, b) => (a.order ?? a.id) - (b.order ?? b.id));
            return { ...scene, shots: updatedShots };
        }));
    };

    const addNewScene = () => {
        const newId = parsedScenes.length > 0 ? Math.max(...parsedScenes.map(s => s.id)) + 1 : 1;
        const newScene = { id: newId, title: `SCENE ${newId} - EXT. LOCATION - DAY`, description: 'Brief description...', locationIds: [], shots: [{ id: 1, order: 1, type: 'Wide Shot (WS)', duration: '5s', prompt: 'Detailed prompt...', style: '', tone: '', palette: '', lens: '', camera: '', cameraAngle: 'Eye-Level Shot', cameraMovement: 'Static / None', specialtyShot: 'None', lighting: 'Cinematic Lighting', timeOfDay: 'Day', locationId: null }] };
        updateScenesWithHistory(prev => [...prev, newScene]);
        setSelectedScene(newId);
        setAiStatus('New manual scene added');
    };

    const addNewShot = (sceneId) => {
        updateScenesWithHistory(prev => prev.map(scene => {
            if (scene.id !== sceneId) return scene;
            const newShotId = scene.shots.length > 0 ? Math.max(...scene.shots.map(s => s.id)) + 1 : 1;
            const newOrder = scene.shots.length > 0 ? Math.max(...scene.shots.map(s => s.order ?? s.id)) + 1 : 1;
            return { ...scene, shots: [...scene.shots, { id: newShotId, order: newOrder, type: 'Medium Shot (MS)', duration: '3s', prompt: 'New shot...', style: '', tone: '', palette: '', lens: '', camera: '', cameraAngle: 'Eye-Level Shot', cameraMovement: 'Static / None', specialtyShot: 'None', lighting: 'Cinematic Lighting', timeOfDay: 'Day', locationId: null }] };
        }));
    };

    const removeShot = (sceneId, shotId) => {
        updateScenesWithHistory(prev => prev.map(scene => {
            if (scene.id !== sceneId) return scene;
            return { ...scene, shots: scene.shots.filter(s => s.id !== shotId) };
        }));
    };

    if (!isAppUnlocked) {
        return (
            <div className="bg-zinc-950 text-zinc-300 font-sans antialiased min-h-screen flex items-center justify-center p-4 relative overflow-hidden selection:bg-zinc-700 selection:text-white">
                {/* Background decorative blur elements */}
                <div className="absolute top-1/4 left-1/4 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-purple-500/10 rounded-full blur-[120px] pointer-events-none animate-pulse"></div>
                <div className="absolute bottom-1/4 right-1/4 translate-x-1/2 translate-y-1/2 w-96 h-96 bg-emerald-500/10 rounded-full blur-[120px] pointer-events-none animate-pulse"></div>

                <div className="w-full max-w-md relative z-10">
                    <div className="bg-zinc-900/60 backdrop-blur-xl border border-zinc-800/85 rounded-3xl p-8 shadow-2xl flex flex-col gap-6">
                        <div className="flex flex-col items-center gap-3 text-center">
                            <div className="w-16 h-16 bg-gradient-to-tr from-purple-600 to-indigo-600 rounded-2xl flex items-center justify-center shadow-lg shadow-purple-500/15">
                                <Clapperboard className="w-8 h-8 text-white animate-pulse" />
                            </div>
                            <div>
                                <h1 className="text-2xl font-black text-white tracking-tight bg-gradient-to-r from-zinc-100 to-zinc-400 bg-clip-text text-transparent">Dundee Pre-Viz Studio</h1>
                                <p className="text-xs text-zinc-500 font-semibold uppercase tracking-widest mt-1">Workspace Authentication</p>
                            </div>
                        </div>

                        <form onSubmit={handleLoginSubmit} className="space-y-4">
                            <div className="space-y-2">
                                <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest block">User ID</label>
                                <input 
                                    type="text" 
                                    value={loginUser}
                                    onChange={(e) => setLoginUser(e.target.value)}
                                    placeholder="Enter your User ID..."
                                    className="w-full bg-zinc-950/50 border border-zinc-800/80 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500/20 text-zinc-200 transition-all placeholder:text-zinc-600"
                                    required
                                />
                            </div>

                            <div className="space-y-2">
                                <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest block">Password</label>
                                <input 
                                    type="password" 
                                    value={loginPass}
                                    onChange={(e) => setLoginPass(e.target.value)}
                                    placeholder="Enter your Password..."
                                    className="w-full bg-zinc-950/50 border border-zinc-800/80 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500/20 text-zinc-200 transition-all placeholder:text-zinc-600"
                                    required
                                />
                            </div>

                            {loginError && (
                                <p className="text-xs text-red-400 font-medium leading-relaxed bg-red-950/30 border border-red-900/50 px-3.5 py-2.5 rounded-xl">{loginError}</p>
                            )}

                            <button 
                                type="submit"
                                className="w-full bg-zinc-100 hover:bg-white active:scale-[0.98] text-zinc-950 font-bold rounded-xl py-3 text-xs uppercase tracking-wider transition-all flex items-center justify-center gap-2 shadow-md shadow-black/10 mt-6"
                            >
                                <Play className="w-4 h-4 text-zinc-950 fill-zinc-950" /> Access Studio
                            </button>
                        </form>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="bg-zinc-950 text-zinc-300 font-sans antialiased h-screen overflow-y-auto overflow-x-hidden flex flex-col w-full relative selection:bg-zinc-700 custom-scrollbar">
            
            <style>{`
                ::-webkit-scrollbar { width: 8px; height: 8px; }
                ::-webkit-scrollbar-track { background: transparent; }
                ::-webkit-scrollbar-thumb { background-color: rgba(255,255,255,0.1); border-radius: 4px; }
                ::-webkit-scrollbar-thumb:hover { background-color: rgba(255,255,255,0.2); }
                .custom-scrollbar::-webkit-scrollbar { width: 6px; height: 6px; }
                .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
                .custom-scrollbar::-webkit-scrollbar-thumb { background-color: rgba(255,255,255,0.05); border-radius: 4px; }
                .custom-scrollbar::-webkit-scrollbar-thumb:hover { background-color: rgba(255,255,255,0.15); }
                input[type="number"]::-webkit-inner-spin-button, 
                input[type="number"]::-webkit-outer-spin-button { -webkit-appearance: none; margin: 0; }
                input[type="number"] { -moz-appearance: textfield; }
                select { -webkit-appearance: none; -moz-appearance: none; appearance: none; background-image: url("data:image/svg+xml;charset=US-ASCII,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%22292.4%22%20height%3D%22292.4%22%3E%3Cpath%20fill%3D%22%23999999%22%20d%3D%22M287%2069.4a17.6%2017.6%200%200%200-13-5.4H18.4c-5%200-9.3%201.8-12.9%205.4A17.6%2017.6%200%200%200%200%2082.2c0%205%201.8%209.3%205.4%2012.9l128%20127.9c3.6%203.6%207.8%205.4%2012.8%205.4s9.2-1.8%2012.8-5.4L287%2095c3.5-3.5%205.4-7.8%205.4-12.8%200-5-1.9-9.2-5.5-12.8z%22%2F%3E%3C%2Fsvg%3E"); background-repeat: no-repeat; background-position: right 0.75rem top 50%; background-size: 0.65rem auto; }
                option { background-color: #27272a; color: #f4f4f5; }
                optgroup { background-color: #18181b; color: #34d399; font-weight: bold; }
            `}</style>

            {alertMessage && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-md">
                    <div className="bg-zinc-900 border border-zinc-800/80 rounded-2xl p-6 max-w-md w-full shadow-2xl">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="p-2 bg-blue-500/20 rounded-full">
                                <Info className="text-blue-400 w-5 h-5" />
                            </div>
                            <h3 className="text-lg font-bold text-white">Notice</h3>
                        </div>
                        <p className="text-zinc-400 mb-6 text-sm leading-relaxed whitespace-pre-wrap">{alertMessage}</p>
                        <button onClick={() => setAlertMessage('')} className="w-full bg-zinc-100 hover:bg-white text-zinc-950 font-bold py-3 px-4 rounded-xl transition-colors text-sm">
                            Understood
                        </button>
                    </div>
                </div>
            )}

            {/* Top Navigation Bar */}
            <div className="sticky top-0 z-40 bg-zinc-950/80 backdrop-blur-xl border-b border-zinc-800/50">
                <div className="max-w-[1800px] mx-auto px-4 md:px-6 py-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-emerald-500/10 rounded-xl border border-emerald-500/20">
                            <Clapperboard className="text-emerald-400 w-6 h-6" />
                        </div>
                        <div>
                            <h1 className="text-xl md:text-2xl font-black tracking-tight text-zinc-100 uppercase">Dundee</h1>
                            <p className="text-zinc-500 text-xs font-medium tracking-wide uppercase">
                                <a href="https://dundee.in" target="_blank" rel="noopener noreferrer" className="hover:text-emerald-400 transition-colors">Dundee.in</a> - Storyboard & Prev-Viz Engine
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Second Action Header */}
            <div className="bg-zinc-900/50 border-b border-zinc-800/60 shadow-sm sticky top-[73px] z-30">
                <div className="max-w-[1800px] mx-auto px-4 md:px-6 py-2.5 flex flex-wrap items-center justify-between gap-4">
                    
                    {/* AI Status Bar (Moved to Header) */}
                    <div className="flex items-center gap-3 bg-zinc-950/50 border border-zinc-800/60 rounded-lg px-4 py-2 flex-1 max-w-xl min-w-[250px] shadow-inner">
                        <div className={`w-2 h-2 shrink-0 rounded-full shadow-[0_0_8px_currentColor] ${aiStatus.includes('failed') ? 'bg-red-500 text-red-500' : aiStatus.includes('Generating') || aiStatus.includes('analyzing') || aiStatus.includes('Extracting') || aiStatus.includes('Applying') || aiStatus.includes('Writing') ? 'bg-blue-400 text-blue-400 animate-pulse' : 'bg-emerald-400 text-emerald-400'}`} />
                        <span className="font-mono text-xs text-zinc-300 truncate w-full">{aiStatus}</span>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex flex-wrap items-center gap-2.5">
                        <button onClick={handleAutomateAll} className={`${isAutomating ? 'bg-red-500 hover:bg-red-400 text-white' : 'bg-emerald-500 hover:bg-emerald-400 text-zinc-950'} px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 shadow-[0_0_20px_rgba(16,185,129,0.15)]`}>
                            {isAutomating ? <Square className="w-4 h-4" /> : <Wand2 className="w-4 h-4" />} 
                            <span className="hidden md:inline">{isAutomating ? 'Stop Auto' : 'Automation'}</span>
                            <span className="md:hidden">{isAutomating ? 'Stop' : 'Automate'}</span>
                        </button>

                        <button onClick={handleGenerateAllBoards} disabled={isCompilingAll || isAutomating} className="bg-blue-500 hover:bg-blue-400 disabled:opacity-50 text-zinc-950 px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 shadow-[0_0_20px_rgba(59,130,246,0.15)]">
                            {isCompilingAll ? <Loader2 className="w-4 h-4 animate-spin" /> : <LayoutTemplate className="w-4 h-4" />}
                            <span className="hidden md:inline">{isCompilingAll ? 'Compiling...' : 'Gen All Boards'}</span>
                            <span className="md:hidden">Boards</span>
                        </button>
                        
                        <div className="w-px h-5 bg-zinc-800/60 mx-1"></div>
                        <button onClick={() => setShowExportMenu(!showExportMenu)} className="bg-zinc-800 hover:bg-zinc-700 text-zinc-100 px-4 py-2 rounded-xl text-[10px] transition-all flex items-center gap-2 relative z-50">
                            <Download className="w-4 h-4" /> 
                            <span className="hidden md:inline font-bold uppercase tracking-wider">File / Export</span>
                            <ChevronDown className={`w-3.5 h-3.5 transition-transform ${showExportMenu ? 'rotate-180' : ''}`} />
                        </button>
                        {showExportMenu && (
                            <div className="absolute right-0 top-full mt-2 w-72 bg-zinc-950/95 backdrop-blur-xl border border-zinc-800/80 rounded-2xl shadow-[0_10px_40px_rgba(0,0,0,0.8)] z-50 overflow-hidden flex flex-col p-2">
                                <div className="px-3 py-2 text-[10px] uppercase tracking-widest font-black text-zinc-500 mb-1">Project Files</div>
                                <label className="cursor-pointer px-3 py-2.5 rounded-xl text-left text-xs text-zinc-300 hover:bg-zinc-900 hover:text-emerald-400 font-bold flex items-center gap-3 transition-all group">
                                    <div className="p-1.5 bg-zinc-900 group-hover:bg-emerald-500/10 rounded-lg border border-zinc-800 group-hover:border-emerald-500/20 transition-colors">
                                        <FolderOpen className="w-3.5 h-3.5" />
                                    </div> 
                                    Import Project (.json)
                                    <input type="file" accept=".json" className="hidden" onChange={handleImportProject} />
                                </label>
                                <button onClick={() => { setShowExportMenu(false); handleExportProject(); }} className="px-3 py-2.5 rounded-xl text-left text-xs text-zinc-300 hover:bg-zinc-900 hover:text-emerald-400 font-bold flex items-center gap-3 transition-all group">
                                    <div className="p-1.5 bg-zinc-900 group-hover:bg-emerald-500/10 rounded-lg border border-zinc-800 group-hover:border-emerald-500/20 transition-colors">
                                        <Save className="w-3.5 h-3.5" />
                                    </div> 
                                    Save Local Backup (.json)
                                </button>
                                <button onClick={() => { setShowExportMenu(false); handleSaveToDrive(); }} className="px-3 py-2.5 rounded-xl text-left text-xs text-zinc-300 hover:bg-zinc-900 hover:text-blue-400 font-bold flex items-center gap-3 transition-all group mb-2">
                                    <div className="p-1.5 bg-zinc-900 group-hover:bg-blue-500/10 rounded-lg border border-zinc-800 group-hover:border-blue-500/20 transition-colors">
                                        <Cloud className="w-3.5 h-3.5 text-blue-400 group-hover:text-blue-400" />
                                    </div> 
                                    Save to Google Drive
                                </button>
                                
                                <div className="h-px w-full bg-zinc-800/80 my-1"></div>
                                
                                <div className="px-3 py-2 text-[10px] uppercase tracking-widest font-black text-zinc-500 mt-1 mb-1">Visual Deliverables</div>
                                <button onClick={() => { setShowExportMenu(false); handleExportPDF(); }} className="px-3 py-2.5 rounded-xl text-left text-xs text-zinc-300 hover:bg-zinc-900 hover:text-emerald-400 font-bold flex items-center gap-3 transition-all group">
                                    <div className="p-1.5 bg-zinc-900 group-hover:bg-emerald-500/10 rounded-lg border border-zinc-800 group-hover:border-emerald-500/20 transition-colors">
                                        <File className="w-3.5 h-3.5" />
                                    </div> 
                                    Export PDF Document
                                </button>
                                <button onClick={() => { setShowExportMenu(false); handleExportDirectorsBoard(); }} className="px-3 py-2.5 rounded-xl text-left text-xs text-zinc-300 hover:bg-zinc-900 hover:text-emerald-400 font-bold flex items-center gap-3 transition-all group">
                                    <div className="p-1.5 bg-zinc-900 group-hover:bg-emerald-500/10 rounded-lg border border-zinc-800 group-hover:border-emerald-500/20 transition-colors">
                                        <LayoutDashboard className="w-3.5 h-3.5" />
                                    </div> 
                                    Export Director's Board
                                </button>
                                <button onClick={() => { setShowExportMenu(false); handleExportCinematographersBoard(); }} className="px-3 py-2.5 rounded-xl text-left text-xs text-zinc-300 hover:bg-zinc-900 hover:text-emerald-400 font-bold flex items-center gap-3 transition-all group">
                                    <div className="p-1.5 bg-zinc-900 group-hover:bg-emerald-500/10 rounded-lg border border-zinc-800 group-hover:border-emerald-500/20 transition-colors">
                                        <Aperture className="w-3.5 h-3.5" />
                                    </div> 
                                    Export Cinematographer's Board
                                </button>
                                <button onClick={() => { setShowExportMenu(false); handleExportProductionBoards(); }} className="px-3 py-2.5 rounded-xl text-left text-xs text-zinc-300 hover:bg-zinc-900 hover:text-emerald-400 font-bold flex items-center gap-3 transition-all group">
                                    <div className="p-1.5 bg-zinc-900 group-hover:bg-emerald-500/10 rounded-lg border border-zinc-800 group-hover:border-emerald-500/20 transition-colors">
                                        <LayoutTemplate className="w-3.5 h-3.5" />
                                    </div> 
                                    Export Production Boards
                                </button>
                                <button onClick={() => { setShowExportMenu(false); handleDownloadAllImages(); }} className="px-3 py-2.5 rounded-xl text-left text-xs text-zinc-300 hover:bg-zinc-900 hover:text-emerald-400 font-bold flex items-center gap-3 transition-all group">
                                    <div className="p-1.5 bg-zinc-900 group-hover:bg-emerald-500/10 rounded-lg border border-zinc-800 group-hover:border-emerald-500/20 transition-colors">
                                        <Images className="w-3.5 h-3.5" />
                                    </div> 
                                    Download Raw Images (ZIP)
                                </button>
                                <button onClick={() => { setShowExportMenu(false); handleExportShotList(); }} className="px-3 py-2.5 rounded-xl text-left text-xs text-zinc-300 hover:bg-zinc-900 hover:text-emerald-400 font-bold flex items-center gap-3 transition-all group">
                                    <div className="p-1.5 bg-zinc-900 group-hover:bg-emerald-500/10 rounded-lg border border-zinc-800 group-hover:border-emerald-500/20 transition-colors">
                                        <ListChecks className="w-3.5 h-3.5" />
                                    </div>
                                    Export Shot List (CSV)
                                </button>
                            </div>
                        )}
                        
                        <div className="w-px h-5 bg-zinc-800/60 mx-1"></div>
                        
                        <button onClick={handleUndo} disabled={history.length === 0} className="bg-zinc-900 hover:bg-zinc-800 border border-zinc-700/50 disabled:opacity-50 text-zinc-400 p-2 rounded-xl transition-colors">
                            <Undo2 className="w-4 h-4" />
                        </button>
                        <button onClick={handleReset} className="bg-zinc-900 hover:bg-red-950/40 border border-zinc-700/50 hover:border-red-900/50 hover:text-red-400 text-zinc-500 p-2 rounded-xl transition-colors">
                            <Trash2 className="w-4 h-4" />
                        </button>
                    </div>
                </div>
            </div>

            {/* TABS NAVIGATION */}
            <div className="max-w-[1800px] mx-auto w-full px-4 md:px-6 mt-6">
                <div className="flex border-b border-zinc-800/60 overflow-x-auto custom-scrollbar gap-2">
                    <button onClick={() => setActiveTab('script')} className={`px-5 py-3 font-bold text-[11px] tracking-widest uppercase border-b-2 transition-all flex items-center gap-2 whitespace-nowrap ${activeTab === 'script' ? 'border-emerald-500 text-emerald-400 bg-emerald-500/10 rounded-t-lg' : 'border-transparent text-zinc-500 hover:text-zinc-300 hover:bg-zinc-900/50 rounded-t-lg'}`}>
                        <FileText className="w-4 h-4"/> Setup & Script
                    </button>
                    <button onClick={() => setActiveTab('assets')} className={`px-5 py-3 font-bold text-[11px] tracking-widest uppercase border-b-2 transition-all flex items-center gap-2 whitespace-nowrap ${activeTab === 'assets' ? 'border-emerald-500 text-emerald-400 bg-emerald-500/10 rounded-t-lg' : 'border-transparent text-zinc-500 hover:text-zinc-300 hover:bg-zinc-900/50 rounded-t-lg'}`}>
                        <Users className="w-4 h-4"/> Cast & Locations
                    </button>
                    <button onClick={() => setActiveTab('storyboard')} className={`px-5 py-3 font-bold text-[11px] tracking-widest uppercase border-b-2 transition-all flex items-center gap-2 whitespace-nowrap ${activeTab === 'storyboard' ? 'border-emerald-500 text-emerald-400 bg-emerald-500/10 rounded-t-lg' : 'border-transparent text-zinc-500 hover:text-zinc-300 hover:bg-zinc-900/50 rounded-t-lg'}`}>
                        <Clapperboard className="w-4 h-4"/> Storyboard Workspace
                    </button>
                </div>
            </div>

            <div className="max-w-[1800px] mx-auto w-full px-4 md:px-6 flex flex-col gap-6 flex-1 pt-6 pb-10">
                
                {activeTab === 'script' && (
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start h-full">
                        
                        {/* LEFT: Script & Project */}
                        <div className="lg:col-span-5 bg-zinc-900/40 backdrop-blur-md border border-zinc-800/60 rounded-2xl p-5 flex flex-col shrink-0">
                            <div className="flex items-center justify-between mb-5">
                                <h2 className="text-xs font-black flex items-center gap-2 text-zinc-300 uppercase tracking-widest">
                                    <FileText className="w-4 h-4 text-zinc-500" /> Source Data
                                </h2>
                                <label className="cursor-pointer bg-zinc-800 hover:bg-zinc-700 text-zinc-200 px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-colors flex items-center gap-1.5 border border-zinc-700/50">
                                    <Upload className="w-3.5 h-3.5" /> Upload File
                                    <input type="file" accept=".txt,.md,.csv,.fountain,.pdf,.doc,.docx,image/*" className="hidden" onChange={handleScriptUpload} />
                                </label>
                            </div>
                            
                            <div className="space-y-4">
                                <div>
                                    <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest block mb-2">Project Title</label>
                                    <input 
                                        type="text" 
                                        value={projectName} 
                                        onChange={(e) => setProjectName(e.target.value)}
                                        className="w-full bg-zinc-950/50 border border-zinc-800/80 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-zinc-500 focus:ring-1 focus:ring-zinc-500/20 text-zinc-200 transition-all"
                                        placeholder="Untitled Project"
                                    />
                                </div>
                                <div>
                                    <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest block mb-2">Script Language</label>
                                    <select 
                                        value={scriptLanguage} 
                                        onChange={(e) => setScriptLanguage(e.target.value)} 
                                        className="w-full bg-zinc-700 border border-zinc-600 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-zinc-500 focus:ring-1 focus:ring-zinc-500/20 text-white transition-all"
                                    >
                                        <option value="Auto-Detect Native Language">Auto-Detect / Keep Original</option>
                                        <option value="English">English</option>
                                        <option value="Spanish">Spanish</option>
                                        <option value="French">French</option>
                                        <option value="Hindi">Hindi</option>
                                        <option value="Tamil">Tamil</option>
                                        <option value="Telugu">Telugu</option>
                                        <option value="Malayalam">Malayalam</option>
                                        <option value="Korean">Korean</option>
                                        <option value="Japanese">Japanese</option>
                                        <option value="Mandarin">Mandarin</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest block mb-2">Screenplay Parsing</label>
                                    <textarea
                                        value={script}
                                        onChange={(e) => setScript(e.target.value)}
                                        placeholder="Paste text/fountain..."
                                        className="flex-1 w-full min-h-[300px] bg-zinc-950/50 border border-zinc-800/80 rounded-xl p-4 text-[13px] focus:outline-none focus:border-zinc-500 focus:ring-1 focus:ring-zinc-500/20 resize-y custom-scrollbar transition-all text-zinc-300 font-mono leading-relaxed"
                                    />
                                </div>
                                <button onClick={() => extractScenes(script)} className="w-full bg-zinc-100 hover:bg-white text-zinc-950 font-bold rounded-xl py-4 text-xs uppercase tracking-wider transition-all flex items-center justify-center gap-2 shadow-sm">
                                    <Wand2 className="w-4 h-4" /> Extract Scenes & Auto-Cast
                                </button>
                            </div>
                        </div>

                        {/* RIGHT: Visual Styles & DNA */}
                        <div className="lg:col-span-7 flex flex-col gap-6">
                            
                            {/* DNA Analyzer */}
                            <div className="bg-zinc-900/40 backdrop-blur-md border border-zinc-800/60 rounded-2xl p-6 flex flex-col shrink-0">
                                <div className="flex items-center gap-2 mb-2">
                                    <Activity className="w-5 h-5 text-emerald-500" />
                                    <span className="text-[12px] font-black text-emerald-400 uppercase tracking-widest">Extract DNA & Cinematography</span>
                                </div>
                                <p className="text-[11px] text-zinc-400 mb-5 leading-relaxed">Upload a reference video/image or paste a link to extract characters, camera framing, color grades, and lighting. We will forcefully apply this style to your storyboard.</p>
                                <div className="flex flex-col gap-4">
                                    <div className="flex gap-2">
                                        <input 
                                            type="text" 
                                            placeholder="Paste URL (e.g., YouTube Link or Image Link)..." 
                                            value={dnaUrl} 
                                            onChange={(e) => setDnaUrl(e.target.value)} 
                                            className="flex-1 bg-zinc-950/50 border border-zinc-800 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-emerald-500/50 text-zinc-200"
                                        />
                                        <button 
                                            onClick={() => handleAnalyzeDna(null, dnaUrl)} 
                                            disabled={isAnalyzingDna || !dnaUrl.trim()}
                                            className="bg-zinc-800 hover:bg-zinc-700 disabled:opacity-50 text-zinc-300 px-5 py-3 rounded-xl text-xs font-bold uppercase tracking-wider transition-colors border border-zinc-700"
                                        >
                                            Scan Link
                                        </button>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <div className="flex-1 h-px bg-zinc-800"></div>
                                        <span className="text-[10px] text-zinc-600 font-bold uppercase tracking-widest">OR</span>
                                        <div className="flex-1 h-px bg-zinc-800"></div>
                                    </div>
                                    <label className="cursor-pointer bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 px-4 py-3.5 rounded-xl text-xs font-bold uppercase tracking-wider transition-colors flex items-center justify-center gap-2 border border-emerald-500/30">
                                        <Upload className="w-4 h-4" /> Upload Media Reference (Video/Img)
                                        <input 
                                            type="file" 
                                            accept="video/*,image/*" 
                                            className="hidden" 
                                            onChange={(e) => {
                                                handleAnalyzeDna(e.target.files[0], null);
                                                e.target.value = null;
                                            }} 
                                        />
                                    </label>
                                </div>
                                {isAnalyzingDna && (
                                    <div className="mt-5 flex items-center justify-center gap-2 text-xs text-emerald-400 font-bold uppercase tracking-widest bg-emerald-500/5 py-3 rounded-xl border border-emerald-500/10">
                                        <Loader2 className="w-4 h-4 animate-spin" /> Sequencing Cinematic DNA Data...
                                    </div>
                                )}
                            </div>

                            {/* Global Style Rules */}
                            <div className="bg-zinc-900/40 backdrop-blur-md border border-zinc-800/60 rounded-2xl p-6 flex flex-col shrink-0">
                                <h2 className="text-sm font-black flex items-center gap-2 mb-6 text-zinc-300 uppercase tracking-widest">
                                    <LayoutTemplate className="w-5 h-5 text-zinc-500" /> Global Style Directives
                                </h2>
                                <div className="space-y-5">
                                    
                                    {/* AI Director Mode */}
                                    <div className="bg-emerald-950/20 border border-emerald-900/30 rounded-xl p-4 shadow-inner">
                                        <label className="text-xs font-bold text-emerald-500 uppercase tracking-widest block mb-3 flex items-center gap-1.5">
                                            <Star className="w-4 h-4" /> AI Director Mode
                                        </label>
                                        <div className="relative">
                                            <div className="flex gap-2">
                                                <input 
                                                    type="text"
                                                    value={isDirectorDropdownOpen ? directorSearchQuery : (selectedDirector === 'None / Auto' ? '' : selectedDirector)}
                                                    onChange={(e) => {
                                                        setDirectorSearchQuery(e.target.value);
                                                        if (!isDirectorDropdownOpen) setIsDirectorDropdownOpen(true);
                                                    }}
                                                    onFocus={() => {
                                                        setIsDirectorDropdownOpen(true);
                                                        setDirectorSearchQuery(selectedDirector === 'None / Auto' ? '' : selectedDirector);
                                                    }}
                                                    onKeyDown={(e) => {
                                                        if (e.key === 'Enter') {
                                                            e.preventDefault();
                                                            handleSearchDirectorOrFilm(directorSearchQuery);
                                                        }
                                                    }}
                                                    placeholder="Search legendary director or film style..."
                                                    className="flex-1 bg-zinc-950 border border-emerald-900/50 rounded-xl pl-4 pr-10 py-3.5 text-sm font-bold text-emerald-400 focus:outline-none focus:border-emerald-500 transition-all shadow-[0_0_15px_rgba(16,185,129,0.05)] placeholder:text-zinc-600 placeholder:font-normal"
                                                />
                                                <button 
                                                    onClick={() => handleSearchDirectorOrFilm(directorSearchQuery)}
                                                    disabled={isSearchingDirector || !directorSearchQuery.trim()}
                                                    className="bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-400 px-4 rounded-xl flex items-center justify-center border border-emerald-500/30 disabled:opacity-50 transition-colors"
                                                    title="Search AI Database"
                                                >
                                                    {isSearchingDirector ? <Loader2 className="w-5 h-5 animate-spin" /> : <Sparkles className="w-5 h-5" />}
                                                </button>
                                            </div>
                                            {selectedDirector !== 'None / Auto' && !isDirectorDropdownOpen && (
                                                <button 
                                                    className="absolute right-16 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-emerald-400 p-1.5 bg-zinc-950 rounded-md"
                                                    onClick={() => { setSelectedDirector('None / Auto'); setDirectorSearchQuery(''); }}
                                                    title="Clear Director"
                                                >
                                                    <X className="w-4 h-4" />
                                                </button>
                                            )}
                                            
                                            {isDirectorDropdownOpen && (
                                                <div className="absolute z-50 w-full mt-2 bg-zinc-900 border border-emerald-900/50 rounded-xl shadow-2xl max-h-72 overflow-y-auto custom-scrollbar flex flex-col">
                                                    <div className="flex justify-between items-center px-4 py-3 border-b border-zinc-800">
                                                        <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Select Reference</span>
                                                        <button onClick={() => setIsDirectorDropdownOpen(false)} className="text-zinc-400 hover:text-white"><X className="w-4 h-4" /></button>
                                                    </div>

                                                    <div 
                                                        className="px-4 py-3 text-sm font-bold text-zinc-400 hover:bg-emerald-900/40 hover:text-emerald-400 cursor-pointer transition-colors border-b border-zinc-800/50"
                                                        onClick={() => { setSelectedDirector('None / Auto'); setIsDirectorDropdownOpen(false); setDirectorSearchQuery(''); }}
                                                    >
                                                        None / Auto
                                                    </div>

                                                    {directorSearchResults.length > 0 ? (
                                                        <>
                                                            <div className="px-4 py-2 text-[10px] font-black text-emerald-500 bg-emerald-500/5 uppercase tracking-widest border-b border-zinc-800/50">AI Search Results</div>
                                                            {directorSearchResults.map((res, idx) => (
                                                                <div 
                                                                    key={`search-${idx}`}
                                                                    className="px-4 py-3 text-sm hover:bg-emerald-900/40 cursor-pointer transition-colors border-b border-zinc-800/30 flex flex-col gap-1.5"
                                                                    onClick={() => { 
                                                                        setSelectedDirector(res.promptValue); 
                                                                        setIsDirectorDropdownOpen(false); 
                                                                        setDirectorSearchQuery(res.promptValue);
                                                                    }}
                                                                >
                                                                    <div className="flex items-center gap-2">
                                                                        <span className="font-bold text-emerald-300">{res.displayName}</span>
                                                                        <span className="text-[9px] font-bold uppercase tracking-widest text-emerald-500/70 bg-emerald-950/50 border border-emerald-900/50 px-1.5 py-0.5 rounded">{res.type}</span>
                                                                    </div>
                                                                    <span className="text-xs text-zinc-400 leading-tight pr-2">{res.details}</span>
                                                                </div>
                                                            ))}
                                                        </>
                                                    ) : null}

                                                    <div className="px-4 py-2 text-[10px] font-black text-zinc-500 bg-zinc-950/50 uppercase tracking-widest border-b border-zinc-800/50">Quick Picks</div>
                                                    {AI_DIRECTORS.filter(d => d !== 'None / Auto' && d.toLowerCase().includes(directorSearchQuery.toLowerCase())).map(director => (
                                                        <div 
                                                            key={director}
                                                            className="px-4 py-3 text-sm text-zinc-300 hover:bg-emerald-900/40 hover:text-emerald-400 cursor-pointer transition-colors"
                                                            onClick={() => { setSelectedDirector(director); setIsDirectorDropdownOpen(false); }}
                                                        >
                                                            {director}
                                                        </div>
                                                    ))}

                                                    {directorSearchQuery.trim() !== '' && !AI_DIRECTORS.some(d => d.toLowerCase() === directorSearchQuery.toLowerCase()) && !directorSearchResults.some(d => (d.promptValue || '').toLowerCase() === directorSearchQuery.toLowerCase() || (d.displayName || '').toLowerCase() === directorSearchQuery.toLowerCase()) && (
                                                        <div 
                                                            className="px-4 py-3 text-sm font-bold text-emerald-400 bg-emerald-950/30 border-t border-emerald-900/50 cursor-pointer hover:bg-emerald-900/50 transition-colors flex items-center justify-between"
                                                            onClick={() => { setSelectedDirector(directorSearchQuery.trim()); setIsDirectorDropdownOpen(false); }}
                                                        >
                                                            <span>Use exact text: "{directorSearchQuery}"</span>
                                                            <Sparkles className="w-4 h-4" />
                                                        </div>
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                        <p className="text-[10px] text-emerald-500/70 mt-3 leading-relaxed">Search for a film name or director to emulate their specific visual style, shot pacing, and emotional rhythm universally across the project.</p>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div>
                                            <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest block mb-2">Aesthetic Base</label>
                                            <select value={selectedStyle} onChange={(e) => setSelectedStyle(e.target.value)} className="w-full bg-zinc-700 border border-zinc-600 rounded-xl px-4 py-3.5 text-sm focus:outline-none focus:border-zinc-500 text-white transition-all">
                                                {IMAGE_STYLES.map((style) => <option key={style} value={style}>{style}</option>)}
                                            </select>
                                        </div>
                                        <div>
                                            <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest block mb-2">Format Ratio</label>
                                            <select value={aspectRatio} onChange={(e) => setAspectRatio(e.target.value)} className="w-full bg-zinc-700 border border-zinc-600 rounded-xl px-4 py-3.5 text-sm focus:outline-none focus:border-zinc-500 text-white transition-all">
                                                {['2.39:1', '1.85:1', '21:9', '2:1', '16:9', '1.66:1', '4:3', '3:4', '9:16', '1:1'].map((ratio) => <option key={ratio} value={ratio}>{ratio}</option>)}
                                            </select>
                                        </div>
                                        <div>
                                            <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest block mb-2">Cinematic Tone</label>
                                            <select value={selectedTone} onChange={(e) => setSelectedTone(e.target.value)} className="w-full bg-zinc-700 border border-zinc-600 rounded-xl px-4 py-3.5 text-sm focus:outline-none focus:border-zinc-500 text-white transition-all">
                                                {CINEMATIC_TONES.map((tone) => <option key={tone} value={tone}>{tone}</option>)}
                                            </select>
                                        </div>
                                        <div>
                                            <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest block mb-2">Color Grading</label>
                                            <select value={selectedPalette} onChange={(e) => setSelectedPalette(e.target.value)} className="w-full bg-zinc-700 border border-zinc-600 rounded-xl px-4 py-3.5 text-sm focus:outline-none focus:border-zinc-500 text-white transition-all">
                                                {COLOR_PALETTES.map((palette) => <option key={palette} value={palette}>{palette}</option>)}
                                            </select>
                                        </div>
                                    </div>
                                    
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div>
                                            <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest block mb-2">Global Camera</label>
                                            <select value={selectedGlobalCamera} onChange={(e) => setSelectedGlobalCamera(e.target.value)} className="w-full bg-zinc-700 border border-zinc-600 rounded-xl px-4 py-3.5 text-sm focus:outline-none focus:border-zinc-500 text-white transition-all">
                                                {CAMERAS.map((c) => <option key={c} value={c}>{c}</option>)}
                                            </select>
                                        </div>
                                        <div>
                                            <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest block mb-2">Global Lens Group</label>
                                            <select value={selectedGlobalLensGroup} onChange={(e) => setSelectedGlobalLensGroup(e.target.value)} className="w-full bg-zinc-700 border border-zinc-600 rounded-xl px-4 py-3.5 text-sm focus:outline-none focus:border-zinc-500 text-white transition-all">
                                                <option value="Auto / Any">Auto / Any</option>
                                                {Object.keys(LENS_GROUPS).map((group) => <option key={group} value={group}>{group}</option>)}
                                            </select>
                                        </div>
                                    </div>

                                    <div>
                                        <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest block mb-2">Global Time of Day</label>
                                        <select value={selectedGlobalTime} onChange={(e) => setSelectedGlobalTime(e.target.value)} className="w-full bg-zinc-700 border border-zinc-600 rounded-xl px-4 py-3.5 text-sm focus:outline-none focus:border-zinc-500 text-white transition-all">
                                            {TIME_OF_DAY.map((time) => <option key={time} value={time}>{time}</option>)}
                                        </select>
                                    </div>

                                    <div className="pt-2">
                                        <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest block mb-2">Genre Presets (one-tap look)</label>
                                        <div className="flex flex-wrap gap-2">
                                            {GENRE_PRESETS.map((preset) => (
                                                <button
                                                    key={preset.name}
                                                    onClick={() => applyGenrePreset(preset)}
                                                    className="bg-zinc-800 hover:bg-emerald-500/20 border border-zinc-700 hover:border-emerald-500/40 text-zinc-300 hover:text-emerald-300 px-3 py-2 rounded-lg text-[11px] font-bold uppercase tracking-wider transition-all"
                                                    title={`Style: ${preset.style} | Tone: ${preset.tone} | Palette: ${preset.palette}`}
                                                >
                                                    {preset.name}
                                                </button>
                                            ))}
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div>
                                            <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest block mb-2">Film Stock / Emulation</label>
                                            <select value={selectedFilmStock} onChange={(e) => setSelectedFilmStock(e.target.value)} className="w-full bg-zinc-700 border border-zinc-600 rounded-xl px-4 py-3.5 text-sm focus:outline-none focus:border-zinc-500 text-white transition-all">
                                                {FILM_STOCKS.map((s) => <option key={s} value={s}>{s}</option>)}
                                            </select>
                                        </div>
                                        <div>
                                            <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest block mb-2">Diffusion / Filtration</label>
                                            <select value={selectedDiffusion} onChange={(e) => setSelectedDiffusion(e.target.value)} className="w-full bg-zinc-700 border border-zinc-600 rounded-xl px-4 py-3.5 text-sm focus:outline-none focus:border-zinc-500 text-white transition-all">
                                                {DIFFUSION_FILTERS.map((s) => <option key={s} value={s}>{s}</option>)}
                                            </select>
                                        </div>
                                        <div>
                                            <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest block mb-2">Depth of Field</label>
                                            <select value={selectedDof} onChange={(e) => setSelectedDof(e.target.value)} className="w-full bg-zinc-700 border border-zinc-600 rounded-xl px-4 py-3.5 text-sm focus:outline-none focus:border-zinc-500 text-white transition-all">
                                                {DOF_STYLES.map((s) => <option key={s} value={s}>{s}</option>)}
                                            </select>
                                        </div>
                                        <div>
                                            <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest block mb-2">Board Render Style</label>
                                            <select value={selectedBoardStyle} onChange={(e) => setSelectedBoardStyle(e.target.value)} className="w-full bg-zinc-700 border border-zinc-600 rounded-xl px-4 py-3.5 text-sm focus:outline-none focus:border-zinc-500 text-white transition-all">
                                                {BOARD_STYLES.map((s) => <option key={s} value={s}>{s}</option>)}
                                            </select>
                                        </div>
                                    </div>

                                    <div className="flex items-center justify-between bg-zinc-900/60 border border-zinc-700/60 rounded-xl px-4 py-3.5">
                                        <div>
                                            <p className="text-sm font-bold text-zinc-200">Shot-to-Shot Continuity</p>
                                            <p className="text-[10px] text-zinc-500 leading-relaxed mt-0.5">Feed the previous rendered frame as a reference so characters, wardrobe & lighting stay consistent.</p>
                                        </div>
                                        <button
                                            onClick={() => setEnforceContinuity(v => !v)}
                                            className={`shrink-0 ml-4 w-12 h-7 rounded-full transition-all relative ${enforceContinuity ? 'bg-emerald-500' : 'bg-zinc-700'}`}
                                            title="Toggle continuity chaining"
                                        >
                                            <span className={`absolute top-1 w-5 h-5 bg-white rounded-full transition-all ${enforceContinuity ? 'left-6' : 'left-1'}`}></span>
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {activeTab === 'assets' && (
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start h-full">
                        
                        {/* LEFT: Cast Models */}
                        <div className="lg:col-span-4 bg-zinc-900/40 backdrop-blur-md border border-zinc-800/60 rounded-2xl p-6 flex flex-col shrink-0 mb-8 lg:mb-0">
                            <h2 className="text-sm font-black flex items-center gap-2 mb-6 text-zinc-300 uppercase tracking-widest">
                                <Users className="w-5 h-5 text-purple-400" /> Cast Models
                            </h2>

                            <div className="flex flex-col gap-4 mb-6">
                                <div className="flex gap-3">
                                    <div className="flex-1 relative flex items-center">
                                        <input type="text" placeholder="Character Name" value={newCharName} onChange={(e) => setNewCharName(e.target.value)} className="w-full bg-zinc-950/50 border border-zinc-800/80 rounded-xl pl-4 pr-10 py-3.5 text-sm focus:outline-none focus:border-purple-500/50 text-zinc-200 transition-all"/>
                                        <button 
                                            onClick={() => handleSearchActorName(null, newCharName)}
                                            disabled={!newCharName.trim() || isSearchingDirector}
                                            className="absolute right-2 text-zinc-500 hover:text-purple-400 p-1.5 rounded-lg disabled:opacity-50 transition-colors"
                                            title="Search Actor DB via text"
                                        >
                                            <Search className="w-4 h-4" />
                                        </button>
                                    </div>
                                    {newCharImage ? (
                                        <div className="relative w-[50px] h-[50px] shrink-0 group/newchar">
                                            <img 
                                                src={newCharImage.url} 
                                                alt="New Character Thumbnail" 
                                                className="w-full h-full object-cover rounded-xl cursor-pointer border-2 border-zinc-700 hover:border-purple-500 transition-all"
                                                onClick={(e) => { e.stopPropagation(); setFullscreenImage(newCharImage.url); }}
                                                title="Click to view full size"
                                            />
                                            <label className="absolute -bottom-2 -right-2 bg-zinc-800 hover:bg-zinc-700 p-1.5 rounded-full cursor-pointer shadow-lg border border-zinc-600 transition-all z-10" title="Change Photo">
                                                <ScanFace className="w-3 h-3 text-purple-400" />
                                                <input type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
                                            </label>
                                            <button 
                                                onClick={(e) => { e.stopPropagation(); setNewCharImage(null); }}
                                                className="absolute -top-2 -right-2 bg-red-500 hover:bg-red-600 p-1 rounded-full text-white shadow-lg opacity-0 group-hover/newchar:opacity-100 transition-all z-10"
                                                title="Remove Photo"
                                            >
                                                <X className="w-2.5 h-2.5" />
                                            </button>
                                        </div>
                                    ) : (
                                        <label className="cursor-pointer bg-zinc-800 hover:bg-zinc-700 border border-zinc-700/50 text-zinc-300 px-4 py-3 rounded-xl transition-colors flex items-center justify-center min-w-[54px]" title="Upload Photo & Auto-Detect Face">
                                            <ScanFace className="w-5 h-5 text-purple-400" />
                                            <input type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
                                        </label>
                                    )}
                                </div>
                                <div className="flex gap-3">
                                    <select value={newCharGender} onChange={(e) => setNewCharGender(e.target.value)} className="flex-1 bg-zinc-700 border border-zinc-600 rounded-xl px-4 py-3.5 text-sm focus:outline-none text-white transition-all">
                                        <option value="">Gender</option>
                                        <option value="Male">Male</option>
                                        <option value="Female">Female</option>
                                        <option value="Non-Binary">Non-Binary</option>
                                    </select>
                                    <input type="number" placeholder="Age" value={newCharAge} onChange={(e) => setNewCharAge(e.target.value)} className="w-24 bg-zinc-950/50 border border-zinc-800/80 rounded-xl px-4 py-3.5 text-sm focus:outline-none text-zinc-300 text-center transition-all" />
                                </div>
                                <textarea placeholder="Visual Traits & Wardrobe..." value={newCharDescription} onChange={(e) => setNewCharDescription(e.target.value)} className="w-full bg-zinc-950/50 border border-zinc-800/80 rounded-xl px-4 py-3.5 text-sm focus:outline-none focus:border-purple-500/50 text-zinc-300 resize-none h-24 custom-scrollbar transition-all" />
                                <button onClick={handleAddCharacter} disabled={!newCharName.trim()} className="w-full bg-zinc-800 hover:bg-zinc-700 border border-zinc-700/50 disabled:opacity-50 text-zinc-100 py-3.5 rounded-xl text-xs font-bold uppercase tracking-wider transition-colors flex items-center justify-center gap-2 mt-2">
                                    <UserPlus className="w-4 h-4" /> Add Character
                                </button>
                            </div>
                            
                            <div className="flex flex-col gap-3 w-full max-h-[500px] overflow-y-auto custom-scrollbar pr-2">
                                {characters.map(char => {
                                    const isExpanded = expandedChars.has(char.id);
                                    return (
                                        <div key={char.id} className="flex flex-col bg-zinc-950/80 border border-zinc-800/60 rounded-xl group shadow-sm transition-all duration-200">
                                            <div 
                                                className="flex items-center justify-between p-4 cursor-pointer hover:bg-zinc-900/50 transition-colors"
                                                onClick={() => toggleChar(char.id)}
                                            >
                                                <div className="flex items-center gap-4">
                                                    {char.images && char.images.length > 0 ? (
                                                        <div className="flex gap-1.5 shadow-sm">
                                                            {char.images.slice(0, 3).map((img, idx) => (
                                                                <div key={idx} className="relative group/charimg">
                                                                    <img 
                                                                        src={img.url} 
                                                                        alt={`${char.name} ref ${idx}`} 
                                                                        className="w-10 h-10 rounded-full object-cover border-2 border-zinc-800 hover:border-purple-500 shrink-0 cursor-pointer transition-colors" 
                                                                        onClick={(e) => { e.stopPropagation(); setFullscreenImage(img.url); }}
                                                                        title="Click to view large"
                                                                    />
                                                                    <button 
                                                                        onClick={(e) => { e.stopPropagation(); handleRemoveCharacterImage(char.id, idx); }}
                                                                        className="absolute -top-1 -right-1 bg-red-500 hover:bg-red-600 rounded-full p-0.5 items-center justify-center hidden group-hover/charimg:flex transition-all shadow-md z-10"
                                                                        title="Remove Image"
                                                                    >
                                                                        <X className="w-3 h-3 text-white" />
                                                                    </button>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    ) : (
                                                        <div className="w-10 h-10 rounded-full bg-zinc-800 border-2 border-zinc-700 flex items-center justify-center shrink-0 shadow-sm"><span className="text-sm font-black text-zinc-400">{char.name.charAt(0).toUpperCase()}</span></div>
                                                    )}
                                                    <div className="flex items-center gap-1.5">
                                                        <input 
                                                            type="text" 
                                                            value={char.name} 
                                                            onChange={(e) => updateCharacterInfo(char.id, 'name', e.target.value)}
                                                            onClick={(e) => e.stopPropagation()}
                                                            className="bg-transparent border-none text-[15px] font-bold truncate max-w-[120px] text-zinc-100 focus:outline-none focus:border-b focus:border-purple-500/50 pb-0.5"
                                                            placeholder="Name"
                                                        />
                                                        <button 
                                                            onClick={(e) => { e.stopPropagation(); handleSearchActorName(char.id, char.name); }}
                                                            className="text-zinc-500 hover:text-purple-400 p-1.5 rounded-md transition-colors"
                                                            title="Search Actor Details"
                                                        >
                                                            <Search className="w-4 h-4" />
                                                        </button>
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-2 opacity-100 lg:opacity-0 group-hover:opacity-100 transition-opacity">
                                                    <button onClick={(e) => { e.stopPropagation(); generateCharacterPortrait(char.id, char.name, char.gender, char.age, char.description); }} className="text-zinc-400 hover:text-purple-400 p-2 rounded-lg hover:bg-zinc-800 transition-colors" title="Auto-Gen Face">
                                                        <Wand2 className="w-4 h-4" />
                                                    </button>
                                                    <label onClick={(e) => e.stopPropagation()} className="cursor-pointer text-zinc-400 hover:text-purple-400 p-2 rounded-lg hover:bg-zinc-800 transition-colors" title="Upload Image & Detect Face">
                                                        <ScanFace className="w-4 h-4" />
                                                        <input type="file" accept="image/*" multiple className="hidden" onChange={(e) => handleUpdateCharacterImage(char.id, e)} />
                                                    </label>
                                                    <button onClick={(e) => { e.stopPropagation(); removeCharacter(char.id); }} className="text-zinc-500 hover:text-red-400 p-2 rounded-lg hover:bg-red-950/30 transition-colors"><X className="w-4 h-4" /></button>
                                                    <div className="w-px h-5 bg-zinc-700 mx-1"></div>
                                                    <button onClick={(e) => { e.stopPropagation(); toggleChar(char.id); }} className="text-zinc-500 hover:text-zinc-300 p-2 rounded-lg hover:bg-zinc-800 transition-colors">
                                                        {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                                                    </button>
                                                </div>
                                            </div>
                                            
                                            {isExpanded && (
                                                <div className="flex flex-col gap-3 p-4 pt-0 border-t border-zinc-800/50 mt-2">
                                                    <div className="flex gap-3 mt-3">
                                                        <select 
                                                            value={char.gender || ''} 
                                                            onChange={(e) => updateCharacterInfo(char.id, 'gender', e.target.value)} 
                                                            className="flex-1 bg-zinc-700 border border-zinc-600 rounded-xl px-3 py-2 text-sm focus:outline-none text-white"
                                                        >
                                                            <option value="">Gender</option>
                                                            <option value="Male">Male</option>
                                                            <option value="Female">Female</option>
                                                            <option value="Non-Binary">Non-Binary</option>
                                                        </select>
                                                        <input 
                                                            type="text" 
                                                            placeholder="Age" 
                                                            value={char.age || ''} 
                                                            onChange={(e) => updateCharacterInfo(char.id, 'age', e.target.value)} 
                                                            className="w-20 bg-zinc-900 border border-zinc-800/80 rounded-xl px-3 py-2 text-sm focus:outline-none text-zinc-300 text-center" 
                                                        />
                                                    </div>
                                                    <div className="flex items-center justify-between mt-2 mb-1">
                                                        <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest block px-1">Visual Traits & Background</span>
                                                        <button 
                                                            onClick={() => generateCharacterBackstory(char.id)}
                                                            disabled={generatingIds.has(`backstory-${char.id}`)}
                                                            className="text-[10px] bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 px-3 py-1.5 rounded-lg border border-blue-500/30 transition-colors flex items-center gap-1.5 disabled:opacity-50"
                                                            title="Use AI to generate a backstory and visual traits"
                                                        >
                                                             {generatingIds.has(`backstory-${char.id}`) ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
                                                             Auto-Write
                                                        </button>
                                                    </div>
                                                    <textarea 
                                                        placeholder="Visual Traits & Clothing..." 
                                                        value={char.description || ''} 
                                                        onChange={(e) => updateCharacterInfo(char.id, 'description', e.target.value)} 
                                                        className="w-full bg-zinc-900 border border-zinc-800/80 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-zinc-600 text-zinc-300 min-h-[80px] resize-y custom-scrollbar" 
                                                    />
                                                </div>
                                            )}
                                        </div>
                                    );
                                })}
                                <label className="flex items-center gap-3 mt-4 cursor-pointer text-sm font-medium text-zinc-400 hover:text-zinc-200 transition-colors p-2 bg-zinc-900/50 rounded-xl border border-zinc-800">
                                    <input 
                                        type="checkbox" 
                                        checked={enforceLikeness} 
                                        onChange={(e) => setEnforceLikeness(e.target.checked)} 
                                        className="rounded border-zinc-700 bg-zinc-800 text-purple-500 focus:ring-purple-500/20 focus:ring-offset-zinc-900 w-5 h-5 ml-2"
                                    />
                                    Enforce Strict Actor Likeness 
                                </label>
                            </div>
                        </div>

                        {/* RIGHT: Environment Models */}
                        <div className="lg:col-span-8 bg-zinc-900/40 backdrop-blur-md border border-zinc-800/60 rounded-2xl p-6 flex flex-col shrink-0 shadow-sm h-full">
                            <h2 className="text-sm font-black uppercase tracking-widest flex items-center gap-2 mb-6 text-zinc-200">
                                <MapPin className="w-5 h-5 text-emerald-500" /> Environment Models
                            </h2>
                            
                            <div className="flex flex-col md:flex-row gap-4 items-end">
                                <div className="flex-1 w-full flex gap-3">
                                    <input type="text" placeholder="Location Name (e.g. EXT. STREET)" value={newLocationName} onChange={(e) => setNewLocationName(e.target.value)} className="flex-1 bg-zinc-950/50 border border-zinc-800/80 rounded-xl px-4 py-3.5 text-sm focus:outline-none focus:border-emerald-500/50 text-zinc-200 transition-all"/>
                                    <label className="cursor-pointer bg-zinc-800 hover:bg-zinc-700 border border-zinc-700/50 text-zinc-300 px-4 py-3 rounded-xl transition-colors flex items-center justify-center min-w-[54px]">
                                        {newLocationImage ? <ImageIcon className="w-5 h-5 text-emerald-400" /> : <Camera className="w-5 h-5" />}
                                        <input type="file" accept="image/*" className="hidden" onChange={handleLocationImageUpload} />
                                    </label>
                                    <button onClick={handleAddLocation} disabled={!newLocationName.trim()} className="bg-zinc-800 hover:bg-zinc-700 border border-zinc-700/50 disabled:opacity-50 text-zinc-100 px-8 py-3.5 rounded-xl text-xs font-bold uppercase tracking-wider transition-colors flex items-center justify-center gap-2 whitespace-nowrap">
                                        <Plus className="w-4 h-4" /> Add Location
                                    </button>
                                </div>
                            </div>

                            {locations.length > 0 ? (
                                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-2 2xl:grid-cols-3 gap-6 overflow-y-auto custom-scrollbar pr-2 max-h-[700px] mt-8 pt-2">
                                    {locations.map(loc => {
                                        const isLocGenerating = generatingIds.has(`loc-gen-${loc.id}`) || generatingIds.has(`loc-edit-${loc.id}`);
                                        return (
                                            <div key={loc.id} className="flex flex-col bg-zinc-950/80 border border-zinc-800/60 rounded-2xl overflow-hidden group shadow-md hover:border-zinc-700/80 transition-all">
                                                <div className="relative w-full aspect-video bg-zinc-900 border-b border-zinc-800/60 flex items-center justify-center overflow-hidden">
                                                    {isLocGenerating && (
                                                        <div className="absolute inset-0 flex flex-col items-center justify-center bg-zinc-950/80 backdrop-blur-md z-10">
                                                            <Loader2 className="w-8 h-8 text-emerald-400 mb-3 animate-spin" />
                                                            <span className="text-[10px] uppercase tracking-widest font-bold text-zinc-400">Processing</span>
                                                        </div>
                                                    )}
                                                    {loc.image ? (
                                                        <>
                                                            <img src={loc.image.url} alt={loc.name} className="w-full h-full object-cover" />
                                                            <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-all duration-300 flex items-center justify-center gap-3 backdrop-blur-sm">
                                                                <button onClick={() => generateLocationImage(loc.id, loc.name, loc.description)} disabled={isLocGenerating} className="bg-zinc-800/90 text-zinc-200 p-3.5 rounded-xl hover:bg-zinc-700 transition-colors shadow-lg" title="Regenerate"><RefreshCw className="w-5 h-5" /></button>
                                                                <label className="cursor-pointer bg-zinc-800/90 text-zinc-200 p-3.5 rounded-xl hover:bg-zinc-700 transition-colors shadow-lg" title="Upload Reference">
                                                                    <Upload className="w-5 h-5" />
                                                                    <input type="file" accept="image/*" className="hidden" onChange={(e) => handleUpdateLocationImage(loc.id, e)} />
                                                                </label>
                                                                <button onClick={() => setLocations(prev => prev.map(l => l.id === loc.id ? {...l, image: null} : l))} className="bg-red-950/80 text-red-400 p-3.5 rounded-xl hover:bg-red-900 transition-colors shadow-lg" title="Remove"><X className="w-5 h-5" /></button>
                                                            </div>
                                                        </>
                                                    ) : (
                                                        <div className="flex flex-col items-center p-6 text-center">
                                                            <MapPin className="w-10 h-10 text-zinc-700 mb-5" />
                                                            <div className="flex gap-2">
                                                                <button onClick={() => generateLocationImage(loc.id, loc.name, loc.description)} disabled={isLocGenerating} className="bg-zinc-800 hover:bg-zinc-700 border border-zinc-700/50 text-zinc-200 px-4 py-2 rounded-xl text-[11px] font-bold uppercase tracking-wider transition-all flex items-center gap-2 disabled:opacity-50 shadow-sm">
                                                                    <Wand2 className="w-3.5 h-3.5" /> Auto-Gen
                                                                </button>
                                                                <label className="cursor-pointer bg-zinc-800 hover:bg-zinc-700 border border-zinc-700/50 text-zinc-200 px-4 py-2 rounded-xl text-[11px] font-bold uppercase tracking-wider transition-all flex items-center gap-2 shadow-sm">
                                                                    <Upload className="w-3.5 h-3.5" /> Upload
                                                                    <input type="file" accept="image/*" className="hidden" onChange={(e) => handleUpdateLocationImage(loc.id, e)} />
                                                                </label>
                                                            </div>
                                                        </div>
                                                    )}
                                                </div>
                                                <div className="p-5 flex flex-col gap-4">
                                                    <div className="flex items-center justify-between gap-3">
                                                        <span className="text-base font-black tracking-wide truncate flex-1 text-zinc-100 uppercase">{loc.name}</span>
                                                        <button onClick={() => removeLocation(loc.id)} className="text-zinc-500 hover:text-red-400 p-2 rounded-lg hover:bg-red-950/30 transition-colors">
                                                            <Trash2 className="w-4 h-4" />
                                                        </button>
                                                    </div>
                                                    <textarea
                                                        value={loc.description || ''}
                                                        onChange={(e) => updateLocationDescription(loc.id, e.target.value)}
                                                        placeholder="Add location details..."
                                                        className="w-full bg-zinc-900 border border-zinc-800/80 rounded-xl px-4 py-3 text-sm text-zinc-400 focus:outline-none focus:border-zinc-600 resize-none h-[70px] custom-scrollbar"
                                                    />
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            ) : (
                                <div className="flex-1 flex flex-col items-center justify-center opacity-40 py-20 mt-8 border-2 border-dashed border-zinc-800/60 rounded-2xl">
                                     <MapPin className="w-16 h-16 text-zinc-600 mb-4" />
                                     <h3 className="text-sm font-bold uppercase tracking-widest text-zinc-400">No Locations Set</h3>
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {activeTab === 'storyboard' && (
                    <div className="flex flex-col gap-6 h-full">
                        
                        {/* Scene Selector */}
                        <div className="bg-zinc-900/40 backdrop-blur-md border border-zinc-800/60 rounded-2xl p-2.5 flex items-center gap-3 overflow-x-auto custom-scrollbar shadow-sm">
                            <button onClick={addNewScene} className="shrink-0 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 p-3 rounded-xl transition-colors border border-zinc-700/50 flex items-center justify-center min-w-[48px]" title="Add Manual Scene"><Plus className="w-5 h-5" /></button>
                            <div className="w-px h-8 bg-zinc-800/60 mx-1 shrink-0"></div>
                            {parsedScenes.length === 0 ? (
                                <div className="text-zinc-500 text-sm px-4 font-bold uppercase tracking-widest flex items-center gap-2">
                                    <Clapperboard className="w-4 h-4" /> No Sequences Active
                                </div>
                            ) : (
                                parsedScenes.map((scene) => (
                                    <button key={scene.id} onClick={() => setSelectedScene(scene.id)} className={`shrink-0 px-6 py-3 rounded-xl transition-all whitespace-nowrap text-xs font-bold tracking-wider border ${selectedScene === scene.id ? 'bg-zinc-100 border-white text-zinc-950 shadow-md' : 'bg-zinc-950/50 border-zinc-800/80 text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200'}`}>
                                        {(scene.title || '').split(' - ')[0] || `Scene ${scene.id}`}
                                    </button>
                                ))
                            )}
                        </div>

                        {/* Active Scene Panel */}
                        <div className="bg-zinc-900/40 backdrop-blur-md border border-zinc-800/60 rounded-2xl p-6 md:p-8 shadow-sm flex-1 flex flex-col min-h-[800px]">
                            {parsedScenes.length === 0 ? (
                                <div className="flex-1 flex flex-col items-center justify-center text-center opacity-40 py-32">
                                    <Clapperboard className="w-24 h-24 text-zinc-600 mb-8" />
                                    <h2 className="text-2xl font-black text-zinc-300 uppercase tracking-widest">Workspace Empty</h2>
                                    <p className="mt-4 text-base text-zinc-500 font-medium">Extract scenes from a script (in the Setup tab) or add one manually here.</p>
                                </div>
                            ) : (
                                parsedScenes.filter((scene) => scene.id === selectedScene).map((scene) => (
                                    <div key={scene.id} className="h-full flex flex-col">
                                        
                                        {/* Scene Header & Meta */}
                                        <div className="mb-10 pb-10 flex flex-col xl:flex-row xl:items-start justify-between gap-8 border-b border-zinc-800/60">
                                            <div className="flex-1 space-y-5">
                                                <input 
                                                    type="text" 
                                                    value={scene.title || ''} 
                                                    onChange={(e) => updateSceneDetails(scene.id, 'title', e.target.value)} 
                                                    className="w-full bg-transparent text-3xl font-black tracking-wide text-zinc-100 focus:outline-none focus:border-b-2 focus:border-emerald-500/50 pb-2 uppercase transition-all" 
                                                    placeholder="SEQUENCE NAME" 
                                                />
                                                
                                                {locations.length > 0 && (
                                                    <div className="flex items-center gap-2 flex-wrap bg-zinc-950/40 p-2.5 rounded-xl border border-zinc-800/50 w-max max-w-full">
                                                        <MapPin className="w-4 h-4 text-emerald-500 ml-1.5" />
                                                        {(scene.locationIds || []).map(locId => {
                                                            const loc = locations.find(l => l.id === locId);
                                                            if (!loc) return null;
                                                            return (
                                                                <div key={locId} className="flex items-center gap-1.5 bg-zinc-800 border border-zinc-700/50 rounded-lg px-3 py-1.5 text-[11px] font-bold text-zinc-300 tracking-wider shadow-sm">
                                                                    {loc.name}
                                                                    <button onClick={() => updateSceneDetails(scene.id, 'locationIds', scene.locationIds.filter(id => id !== locId))} className="text-zinc-500 hover:text-red-400">
                                                                        <X className="w-3.5 h-3.5" />
                                                                    </button>
                                                                </div>
                                                            );
                                                        })}
                                                        <select 
                                                            value="" 
                                                            onChange={(e) => {
                                                                if (!e.target.value) return;
                                                                const newId = Number(e.target.value);
                                                                const currentIds = scene.locationIds || [];
                                                                if (!currentIds.includes(newId)) {
                                                                    updateSceneDetails(scene.id, 'locationIds', [...currentIds, newId]);
                                                                }
                                                            }}
                                                            className="bg-zinc-700 border border-dashed border-zinc-500 hover:border-zinc-400 rounded-lg px-4 py-1.5 text-[11px] font-bold text-white focus:outline-none appearance-none cursor-pointer transition-colors"
                                                        >
                                                            <option value="">+ Assign Location</option>
                                                            {locations.filter(l => !(scene.locationIds || []).includes(l.id)).map(loc => (
                                                                <option key={loc.id} value={loc.id}>{loc.name}</option>
                                                            ))}
                                                        </select>
                                                    </div>
                                                )}

                                                <div className="flex flex-col gap-5">
                                                    <div className="flex flex-col gap-2">
                                                        <div className="flex items-center justify-between px-1">
                                                            <span className="text-[11px] font-bold text-zinc-500 uppercase tracking-widest flex items-center gap-1.5">
                                                                <FileText className="w-4 h-4" /> Scene Script & Description
                                                            </span>
                                                            <select
                                                                value=""
                                                                onChange={(e) => {
                                                                    if(e.target.value) handleImportDressCode(scene.id, parseInt(e.target.value));
                                                                }}
                                                                className="bg-zinc-900 border border-zinc-800 rounded-md px-3 py-1.5 text-[10px] font-bold text-zinc-400 focus:outline-none focus:border-emerald-500/50 transition-colors cursor-pointer"
                                                            >
                                                                <option value="">Import Dress Code...</option>
                                                                {parsedScenes.filter(s => s.id !== scene.id && s.description?.match(/\[SCENE DRESS CODE:[\s\S]*?\]/i)).map(s => (
                                                                    <option key={s.id} value={s.id}>From: {(s.title || '').split(' - ')[0] || `Scene ${s.id}`}</option>
                                                                ))}
                                                            </select>
                                                        </div>
                                                        <div className="relative group">
                                                            <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-zinc-800 rounded-l-xl group-focus-within:bg-emerald-500/50 transition-colors"></div>
                                                            <textarea 
                                                                value={scene.description || ''} 
                                                                onChange={(e) => updateSceneDetails(scene.id, 'description', e.target.value)} 
                                                                className="w-full bg-zinc-950/80 text-zinc-400 text-sm font-mono leading-relaxed resize-y focus:outline-none rounded-xl pl-6 p-5 min-h-[140px] border border-zinc-800/80 focus:border-emerald-500/30 transition-all custom-scrollbar shadow-inner" 
                                                                placeholder="Sequence action/dialogue data..." 
                                                            />
                                                        </div>
                                                    </div>
                                                    
                                                    {/* Asset Breakdown Panel */}
                                                    <div className="flex flex-col gap-4 bg-zinc-950/80 p-5 rounded-2xl border border-blue-900/30 shadow-inner">
                                                        <div className="flex items-center gap-2 mb-1">
                                                            <Boxes className="w-4 h-4 text-blue-400" />
                                                            <span className="text-[11px] uppercase tracking-widest font-bold text-blue-500/80">Asset Breakdown (Props, VFX, SFX)</span>
                                                        </div>
                                                        {scene.propsBreakdown ? (
                                                            <div className="text-[12px] text-blue-300/80 font-mono space-y-2 overflow-y-auto max-h-[100px] custom-scrollbar">
                                                                {scene.propsBreakdown.props?.length > 0 && <p><strong className="text-blue-400">Props:</strong> {scene.propsBreakdown.props.join(', ')}</p>}
                                                                {scene.propsBreakdown.vfx?.length > 0 && <p><strong className="text-blue-400">VFX:</strong> {scene.propsBreakdown.vfx.join(', ')}</p>}
                                                                {scene.propsBreakdown.sfx?.length > 0 && <p><strong className="text-blue-400">SFX:</strong> {scene.propsBreakdown.sfx.join(', ')}</p>}
                                                                {scene.propsBreakdown.wardrobe?.length > 0 && <p><strong className="text-blue-400">Wardrobe:</strong> {scene.propsBreakdown.wardrobe.join(', ')}</p>}
                                                                {(!scene.propsBreakdown.props?.length && !scene.propsBreakdown.vfx?.length && !scene.propsBreakdown.sfx?.length && !scene.propsBreakdown.wardrobe?.length) && <p className="italic opacity-50">No special assets detected.</p>}
                                                            </div>
                                                        ) : (
                                                            <div className="flex items-center justify-center h-[90px] text-[11px] text-blue-500/40 font-mono italic">
                                                                Click 'Extract Elements' to generate breakdown...
                                                            </div>
                                                        )}
                                                        <div className="flex flex-wrap gap-3 pt-4 border-t border-blue-900/20 mt-auto">
                                                            <button 
                                                                onClick={() => generatePropsBreakdown(scene.id)} 
                                                                disabled={generatingIds.has(`props-${scene.id}`)}
                                                                className="bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 px-5 py-2.5 rounded-lg text-[11px] font-bold uppercase tracking-wider transition-colors flex items-center gap-2 border border-blue-500/30 disabled:opacity-50"
                                                            >
                                                                {generatingIds.has(`props-${scene.id}`) ? <Loader2 className="w-4 h-4 animate-spin" /> : <ListChecks className="w-4 h-4" />}
                                                                Extract Elements
                                                            </button>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="flex shrink-0 gap-3 flex-wrap w-full xl:w-auto justify-start xl:justify-end items-start mt-2">
                                                <button onClick={() => generateStoryboardShots(scene.id)} className="bg-zinc-100 hover:bg-white text-zinc-950 px-6 py-4 rounded-xl text-xs font-black uppercase tracking-widest transition-all flex items-center justify-center gap-2 shadow-md"><Wand2 className="w-5 h-5" /> Auto-Plan Shots</button>
                                                <button onClick={() => generateMultiCamCoverage(scene.id)} className="bg-blue-600 hover:bg-blue-500 text-white px-6 py-4 rounded-xl text-xs font-black uppercase tracking-widest transition-all flex items-center justify-center gap-2 shadow-md"><Video className="w-5 h-5" /> Multi-Cam Coverage</button>
                                                <button onClick={() => addNewShot(scene.id)} className="bg-zinc-800 hover:bg-zinc-700 border border-zinc-700/50 text-zinc-100 px-6 py-4 rounded-xl text-xs font-black uppercase tracking-widest transition-all flex items-center justify-center gap-2"><Plus className="w-5 h-5" /> Add Frame</button>
                                                <button onClick={() => handleRemoveScene(scene.id)} className="bg-transparent hover:bg-red-950/40 border border-transparent hover:border-red-900/50 text-zinc-500 hover:text-red-400 px-5 py-4 rounded-xl transition-all flex items-center justify-center" title="Delete Sequence"><Trash2 className="w-5 h-5" /></button>
                                            </div>
                                        </div>

                                        {/* Shots List */}
                                        <div className="space-y-10 overflow-y-auto custom-scrollbar pb-10 pr-2">
                                            {scene.shots.length === 0 ? (
                                                <div className="flex flex-col items-center justify-center py-24 px-4 text-center bg-zinc-950/50 rounded-3xl border-2 border-dashed border-zinc-800">
                                                    <div className="bg-zinc-900 p-5 rounded-full mb-6">
                                                        <Aperture className="w-12 h-12 text-emerald-500/50" />
                                                    </div>
                                                    <h3 className="text-lg font-black text-zinc-300 uppercase tracking-widest mb-4">No Frames Synthesized</h3>
                                            <p className="text-base text-zinc-500 mb-8 max-w-lg leading-relaxed">The AI needs to read the script above to plan the perfect cinematic shots, or you can add them manually.</p>
                                            <div className="flex flex-col sm:flex-row gap-4">
                                                <button onClick={() => generateStoryboardShots(scene.id)} className="bg-zinc-100 hover:bg-white text-zinc-950 px-8 py-4 rounded-xl text-sm font-black uppercase tracking-widest transition-all flex items-center gap-2 shadow-lg hover:shadow-xl"><Wand2 className="w-5 h-5" /> Run AI Breakdown</button>
                                                <button onClick={() => generateMultiCamCoverage(scene.id)} className="bg-blue-600 hover:bg-blue-500 text-white px-8 py-4 rounded-xl text-sm font-black uppercase tracking-widest transition-all flex items-center gap-2 shadow-lg hover:shadow-xl"><Video className="w-5 h-5" /> Gen Multi-Cam Coverage</button>
                                            </div>
                                        </div>
                                    ) : (
                                        [...(Array.isArray(scene.shots) ? scene.shots : Object.values(scene.shots || {}))].sort((a, b) => (a.order ?? a.id) - (b.order ?? b.id)).map((shot) => {
                                            const frameId = makeFrameId(scene.id, shot.id);
                                            const isGenerating = generatingIds.has(frameId);
                                                    const hasImage = !!generatedImages[frameId];
                                                    const safePrompt = shot.prompt || '';
                                                    
                                                    return (
                                                        <div key={shot.id} className="bg-zinc-950/80 border border-zinc-800/80 rounded-2xl p-6 md:p-8 group relative shadow-lg hover:border-zinc-700/80 transition-colors">
                                                            
                                                            {/* Shot Header */}
                                                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-5 mb-8 pb-5 border-b border-zinc-800/60">
                                                                <div className="flex flex-wrap items-center gap-4">
                                                                    <ShotOrderInput shot={shot} sceneId={scene.id} updateShotOrder={updateShotOrder} />
                                                                    <div className="h-5 w-px bg-zinc-700/50"></div>
                                                                    <span className="text-emerald-400 text-xs font-mono font-bold tracking-widest bg-emerald-500/10 px-3 py-1.5 rounded-lg border border-emerald-500/20">{shot.duration}</span>
                                                                    {shot.category && (
                                                                        <span className="text-[11px] font-bold px-3 py-1.5 rounded-lg border border-zinc-700 text-zinc-300 uppercase tracking-widest bg-zinc-800">
                                                                            {shot.category}
                                                                        </span>
                                                                    )}
                                                                </div>
                                                                <div className="flex items-center gap-3">
                                                                    <button 
                                                                        onClick={() => setActiveStagingShotId(activeStagingShotId === shot.id ? null : shot.id)}
                                                                        className={`flex items-center gap-2 px-4 py-2 rounded-xl text-[11px] font-bold uppercase tracking-wider transition-colors border shadow-sm ${activeStagingShotId === shot.id ? 'bg-emerald-500 text-zinc-950 border-emerald-500' : 'bg-zinc-900 text-zinc-400 border-zinc-700 hover:bg-zinc-800 hover:text-zinc-200'}`}
                                                                    >
                                                                        <MapPin className="w-4 h-4" /> Blocking Map
                                                                    </button>
                                                                    {activeStagingShotId === shot.id && (
                                                                        <button 
                                                                            onClick={() => generateBlockingMap(scene.id, shot.id)}
                                                                            disabled={generatingIds.has(`blocking-${scene.id}-${shot.id}`)}
                                                                            className="flex items-center gap-2 px-4 py-2 rounded-xl text-[11px] font-bold uppercase tracking-wider transition-colors border bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 border-blue-500/30 disabled:opacity-50 shadow-sm"
                                                                            title="Auto-generate blocking map from current image"
                                                                        >
                                                                            {generatingIds.has(`blocking-${scene.id}-${shot.id}`) ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />} Auto-Gen Map
                                                                        </button>
                                                                    )}
                                                                    <button onClick={() => removeShot(scene.id, shot.id)} className="text-zinc-600 hover:text-red-400 transition-colors p-2.5 rounded-xl hover:bg-red-950/30">
                                                                        <X className="w-5 h-5" />
                                                                    </button>
                                                                </div>
                                                            </div>

                                                            {/* Blocking Editor Injection */}
                                                            {activeStagingShotId === shot.id && (
                                                                <StagingEditor 
                                                                    sceneId={scene.id} 
                                                                    shot={shot} 
                                                                    characters={characters} 
                                                                    updateShotBlocking={updateShotBlocking} 
                                                                    onClose={() => setActiveStagingShotId(null)} 
                                                                    onApplyBlocking={() => applyBlockingToImage(scene.id, shot.id)}
                                                                    hasRenderedImage={hasImage}
                                                                    isGenerating={isGenerating}
                                                                />
                                                            )}
                                                            
                                                            <div className="grid grid-cols-1 xl:grid-cols-12 gap-10">
                                                                
                                                                {/* LEFT COLUMN: Metadata & Prompt */}
                                                                <div className="xl:col-span-5 flex flex-col gap-6">
                                                                    {/* Optical Setup */}
                                                                    <div className="bg-zinc-900/60 p-5 rounded-2xl border border-zinc-800/80 space-y-5">
                                                                        <div className="flex items-center gap-2 mb-2">
                                                                            <Camera className="w-5 h-5 text-zinc-500" />
                                                                            <span className="text-xs font-black text-zinc-400 uppercase tracking-widest">Optical Setup</span>
                                                                        </div>
                                                                        <div className="grid grid-cols-2 gap-4">
                                                                            <div className="flex flex-col gap-2">
                                                                                <span className="text-[10px] uppercase tracking-[0.15em] text-zinc-500 font-bold">Framing</span>
                                                                                <select value={shot.type || 'Medium Shot (MS)'} onChange={(e) => updateShotType(scene.id, shot.id, e.target.value)} className="bg-zinc-700 border border-zinc-600 text-xs text-white rounded-xl px-3 py-2.5 focus:outline-none focus:border-zinc-500 focus:ring-1 focus:ring-zinc-500/20 transition-all">
                                                                                    {FRAMING_SHOTS.map(o => <option key={o} value={o} className="bg-zinc-800 text-zinc-100">{o}</option>)}
                                                                                </select>
                                                                            </div>
                                                                            <div className="flex flex-col gap-2">
                                                                                <span className="text-[10px] uppercase tracking-[0.15em] text-zinc-500 font-bold">Angle</span>
                                                                                <select value={shot.cameraAngle || 'Eye-Level Shot'} onChange={(e) => updateShotAngle(scene.id, shot.id, e.target.value)} className="bg-zinc-700 border border-zinc-600 text-xs text-white rounded-xl px-3 py-2.5 focus:outline-none focus:border-zinc-500 focus:ring-1 focus:ring-zinc-500/20 transition-all">
                                                                                    {CAMERA_ANGLES.map(o => <option key={o} value={o} className="bg-zinc-800 text-zinc-100">{o}</option>)}
                                                                                </select>
                                                                            </div>
                                                                            <div className="flex flex-col gap-2">
                                                                                <span className="text-[10px] uppercase tracking-[0.15em] text-zinc-500 font-bold">Motion</span>
                                                                                <select value={shot.cameraMovement || 'Static / None'} onChange={(e) => updateShotMovement(scene.id, shot.id, e.target.value)} className="bg-zinc-700 border border-zinc-600 text-xs text-white rounded-xl px-3 py-2.5 focus:outline-none focus:border-zinc-500 focus:ring-1 focus:ring-zinc-500/20 transition-all">
                                                                                    {CAMERA_MOVEMENTS.map(o => <option key={o} value={o} className="bg-zinc-800 text-zinc-100">{o}</option>)}
                                                                                </select>
                                                                            </div>
                                                                            <div className="flex flex-col gap-2">
                                                                                <span className="text-[10px] uppercase tracking-[0.15em] text-zinc-500 font-bold">Lens Data</span>
                                                                                <select 
                                                                                    value={shot.lens || ''} 
                                                                                    onChange={(e) => updateShotLens(scene.id, shot.id, e.target.value)} 
                                                                                    className="bg-zinc-700 border border-zinc-600 text-xs font-medium text-white rounded-xl px-3 py-2.5 focus:outline-none focus:border-zinc-500 focus:ring-1 focus:ring-zinc-500/20 transition-all"
                                                                                >
                                                                                    <option value="" className="bg-zinc-800 text-zinc-100">Auto Lens</option>
                                                                                    {Object.entries(LENS_GROUPS).map(([groupName, lenses]) => (
                                                                                        <optgroup key={groupName} label={groupName} className="bg-zinc-900 font-bold text-emerald-400">
                                                                                            {lenses.map((lens) => (
                                                                                                <option key={lens} value={lens} className="text-zinc-100 font-normal bg-zinc-800">{lens}</option>
                                                                                            ))}
                                                                                        </optgroup>
                                                                                    ))}
                                                                                </select>
                                                                            </div>
                                                                            <div className="flex flex-col gap-2">
                                                                                <span className="text-[10px] uppercase tracking-[0.15em] text-zinc-500 font-bold">Duration (sec)</span>
                                                                                <input type="number" min="0" step="0.5" value={parseDurationSec(shot.duration) || ''} onChange={(e) => updateShotDuration(scene.id, shot.id, e.target.value ? `${e.target.value}s` : '')} placeholder="e.g. 4" className="bg-zinc-700 border border-zinc-600 text-xs text-white rounded-xl px-3 py-2.5 focus:outline-none focus:border-zinc-500 focus:ring-1 focus:ring-zinc-500/20 transition-all" />
                                                                            </div>
                                                                            <div className="flex flex-col gap-2">
                                                                                <span className="text-[10px] uppercase tracking-[0.15em] text-zinc-500 font-bold">Director Notes</span>
                                                                                <input type="text" value={shot.notes || ''} onChange={(e) => updateShotNotes(scene.id, shot.id, e.target.value)} placeholder="Optional note" className="bg-zinc-700 border border-zinc-600 text-xs text-white rounded-xl px-3 py-2.5 focus:outline-none focus:border-zinc-500 focus:ring-1 focus:ring-zinc-500/20 transition-all" />
                                                                            </div>
                                                                        </div>
                                                                        <div className="flex items-center gap-4 mt-3">
                                                                            <select 
                                                                                value={shot.camera || ''} 
                                                                                onChange={(e) => updateShotCamera(scene.id, shot.id, e.target.value)} 
                                                                                className="bg-zinc-700 border border-zinc-600 text-xs font-medium text-white rounded-xl px-4 py-3 focus:outline-none focus:border-zinc-500 transition-all w-full"
                                                                            >
                                                                                <option value="" className="bg-zinc-800 text-zinc-100">Auto Camera</option>
                                                                                {CAMERAS.filter(c => c !== "Auto / Any").map((cameraName) => <option key={cameraName} value={cameraName} className="bg-zinc-800 text-zinc-100">{cameraName}</option>)}
                                                                            </select>
                                                                            <select 
                                                                                value={shot.locationId || ''} 
                                                                                onChange={(e) => updateShotLocation(scene.id, shot.id, e.target.value)} 
                                                                                className="bg-zinc-700 border border-zinc-600 text-xs font-medium text-white rounded-xl px-4 py-3 focus:outline-none focus:border-zinc-500 transition-all w-full"
                                                                            >
                                                                                <option value="" className="bg-zinc-800 text-zinc-100">Sequence Location</option>
                                                                                {locations.map((loc) => <option key={loc.id} value={loc.id} className="bg-zinc-800 text-zinc-100">Lock: {loc.name}</option>)}
                                                                            </select>
                                                                        </div>
                                                                    </div>

                                                                    {/* Text Data */}
                                                                    <div className="flex flex-col gap-4 flex-1">
                                                                        {shot.script_snippet && (
                                                                            <div className="bg-zinc-900/40 border border-zinc-800 p-4 rounded-xl border-l-4 border-l-emerald-500">
                                                                                <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest block mb-2 flex items-center gap-1.5"><FileText className="w-4 h-4" /> Source Anchor</span>
                                                                                <textarea 
                                                                                    value={shot.script_snippet} 
                                                                                    onChange={(e) => updateScenesWithHistory((prev) => prev.map((s) => s.id !== scene.id ? s : { ...s, shots: s.shots.map((sh) => sh.id === shot.id ? { ...sh, script_snippet: e.target.value } : sh) }))}
                                                                                    className="w-full bg-transparent text-[13px] font-serif italic text-zinc-300 focus:outline-none resize-none custom-scrollbar min-h-[50px]" 
                                                                                />
                                                                            </div>
                                                                        )}
                                                                        <div className="flex-1 flex flex-col relative group">
                                                                            <div className="flex items-center justify-between mb-3 px-1">
                                                                                <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest block">Visual Generation Prompt</span>
                                                                                <button 
                                                                                    onClick={() => enhanceShotPrompt(scene.id, shot.id)}
                                                                                    disabled={generatingIds.has(`enhance-${shot.id}`)}
                                                                                    className="text-[10px] bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 px-3 py-1.5 rounded-md border border-emerald-500/30 transition-colors flex items-center gap-1.5 disabled:opacity-50"
                                                                                    title="Enhance this description using AI"
                                                                                >
                                                                                    {generatingIds.has(`enhance-${shot.id}`) ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Wand2 className="w-3.5 h-3.5" />}
                                                                                    Enhance Prompt
                                                                                </button>
                                                                            </div>
                                                                            <textarea 
                                                                                value={safePrompt} 
                                                                                onChange={(e) => updateShotPrompt(scene.id, shot.id, e.target.value)} 
                                                                                className="flex-1 w-full min-h-[160px] bg-zinc-950 border border-zinc-800 rounded-2xl p-5 text-[13px] text-zinc-300 focus:outline-none focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/20 resize-none font-mono leading-relaxed transition-all shadow-inner"
                                                                            />
                                                                        </div>
                                                                    </div>
                                                                </div>

                                                                {/* RIGHT COLUMN: Output Buffer */}
                                                                <div className="xl:col-span-7 flex flex-col gap-5">
                                                                    
                                                                    {/* Render Actions */}
                                                                    <div className="flex flex-col sm:flex-row items-center justify-between bg-zinc-900/60 p-3 rounded-2xl border border-zinc-800/80 shadow-sm gap-4">
                                                                        <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto">
                                                                            <div className="bg-zinc-700 hover:bg-zinc-600 transition-colors border border-zinc-600 rounded-xl px-3 flex items-center gap-2">
                                                                                <select value={shot.lighting || 'Cinematic Lighting'} onChange={(e) => updateShotLighting(scene.id, shot.id, e.target.value)} className="bg-transparent border-none text-[11px] font-bold text-white py-2.5 focus:outline-none appearance-none cursor-pointer w-full">
                                                                                    {LIGHTING_STYLES.map(o => <option key={o} value={o} className="bg-zinc-800 text-white">{o}</option>)}
                                                                                </select>
                                                                            </div>
                                                                            <div className="bg-zinc-700 hover:bg-zinc-600 transition-colors border border-zinc-600 rounded-xl px-3 flex items-center gap-2">
                                                                                <select value={shot.timeOfDay || 'Unspecified'} onChange={(e) => updateShotTimeOfDay(scene.id, shot.id, e.target.value)} className="bg-transparent border-none text-[11px] font-bold text-white py-2.5 focus:outline-none appearance-none cursor-pointer w-full">
                                                                                    {TIME_OF_DAY.map(o => <option key={o} value={o} className="bg-zinc-800 text-white">{o}</option>)}
                                                                                </select>
                                                                            </div>
                                                                            <div className="bg-zinc-700 hover:bg-zinc-600 transition-colors border border-zinc-600 rounded-xl px-3 flex items-center gap-2 hidden sm:flex">
                                                                                <select value={shot.specialtyShot || 'None'} onChange={(e) => updateShotSpecialty(scene.id, shot.id, e.target.value)} className="bg-transparent border-none text-[11px] font-bold text-white py-2.5 focus:outline-none appearance-none cursor-pointer w-full">
                                                                                    {SPECIALTY_SHOTS.map(o => <option key={o} value={o} className="bg-zinc-800 text-white">{o}</option>)}
                                                                                </select>
                                                                            </div>
                                                                        </div>
                                                                        <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
                                                                            {hasImage && (
                                                                                <button onClick={() => generateAIImage(scene.id, shot.id, shot, null, true)} disabled={isGenerating} className="bg-blue-600 text-white hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all px-5 py-3 rounded-xl text-xs font-black uppercase tracking-widest flex items-center justify-center gap-2 shadow-md">
                                                                                    {isGenerating ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />} Update
                                                                                </button>
                                                                            )}
                                                                            <button onClick={() => generateAIImage(scene.id, shot.id, shot, null, false)} disabled={isGenerating} className="bg-zinc-100 text-zinc-950 hover:bg-white disabled:opacity-50 disabled:cursor-not-allowed transition-all px-5 py-3 rounded-xl text-xs font-black uppercase tracking-widest flex items-center justify-center gap-2 shadow-md">
                                                                                {isGenerating ? (
                                                                                    <><Loader2 className="w-4 h-4 animate-spin" /> Rendering</>
                                                                                ) : hasImage ? (
                                                                                    <><Wand2 className="w-4 h-4" /> New Reroll</>
                                                                                ) : (
                                                                                    <><Camera className="w-4 h-4" /> Render</>
                                                                                )}
                                                                            </button>
                                                                        </div>
                                                                    </div>

                                                                    {/* Image Buffer */}
                                                                    <div className="rounded-2xl border-2 border-zinc-800/80 bg-zinc-950 overflow-hidden relative flex items-center justify-center mx-auto shadow-2xl w-full" style={{ aspectRatio: aspectRatio.replace(':', '/'), maxHeight: '600px' }}>
                                                                        {isGenerating && (
                                                                            <div className="absolute inset-0 flex flex-col items-center justify-center bg-zinc-950/80 backdrop-blur-md z-10">
                                                                                <div className="relative">
                                                                                    <div className="absolute inset-0 border-4 border-emerald-500/20 rounded-full animate-ping"></div>
                                                                                    <Loader2 className="w-12 h-12 text-emerald-400 mb-5 animate-spin relative z-10" />
                                                                                </div>
                                                                                <span className="text-sm font-black text-emerald-400 uppercase tracking-[0.2em]">Synthesizing Pixels</span>
                                                                            </div>
                                                                        )}
                                                                        {hasImage ? (
                                                                            <span className="w-full h-full flex items-center justify-center group/img">
                                                                                <img src={generatedImages[frameId]} alt={`Frame ${shot.id}`} className="w-full h-full object-cover"/>
                                                                                <div className="absolute inset-0 bg-black/70 opacity-0 group-hover/img:opacity-100 transition-all duration-300 flex items-center justify-center gap-4 backdrop-blur-sm">
                                                                                    <button onClick={() => generateAIImage(scene.id, shot.id, shot)} className="bg-zinc-800 text-zinc-200 p-4 rounded-xl border border-zinc-700 hover:bg-zinc-700 hover:text-white transition-all transform hover:scale-105 shadow-xl" title="Reroll"><RefreshCw className="w-6 h-6" /></button>
                                                                                    <button onClick={(e) => { e.preventDefault(); handleDownloadSingleImage(generatedImages[frameId], `frame_s${scene.id}_${shot.id}.png`); }} className="bg-emerald-500/20 text-emerald-400 p-4 rounded-xl border border-emerald-500/30 hover:bg-emerald-500/30 transition-all transform hover:scale-105 shadow-xl" title="Download"><Download className="w-6 h-6" /></button>
                                                                                    <button onClick={(e) => { e.preventDefault(); setFullscreenImage(generatedImages[frameId]); }} className="bg-blue-500/20 text-blue-400 p-4 rounded-xl border border-blue-500/30 hover:bg-blue-500/30 transition-all transform hover:scale-105 shadow-xl" title="View Fullscreen"><Maximize className="w-6 h-6" /></button>
                                                                                </div>
                                                                            </span>
                                                                        ) : (
                                                                            <div className="flex flex-col items-center text-center p-10 opacity-20">
                                                                                <div className="w-20 h-20 rounded-3xl bg-zinc-900 border-2 border-zinc-800 flex items-center justify-center mb-5"><ImageIcon className="w-10 h-10 text-zinc-500" /></div>
                                                                                <span className="font-bold uppercase tracking-widest text-base">Buffer Empty</span>
                                                                            </div>
                                                                        )}
                                                                    </div>
                                                                    
                                                                    {/* Post-Process Tools */}
                                                                    {hasImage && (
                                                                        <div className="flex flex-col gap-5 mt-3">
                                                                            
                                                                            {/* End Frame Generation Panel */}
                                                                            <div className="w-full bg-zinc-900/60 p-4 rounded-2xl border border-zinc-800/80 shadow-sm flex flex-col gap-3">
                                                                                <div className="flex items-center justify-between">
                                                                                    <div className="flex flex-col">
                                                                                        <span className="text-[11px] font-bold text-zinc-300 uppercase tracking-widest flex items-center gap-1.5"><Video className="w-4 h-4 text-blue-400" /> Motion / End Frame</span>
                                                                                        <span className="text-[10px] text-zinc-500 mt-0.5">Generate the final frame based on camera & artist movement</span>
                                                                                    </div>
                                                                                    <button 
                                                                                        onClick={() => generateLastFrame(scene.id, shot.id, shot)} 
                                                                                        disabled={generatingIds.has(makeLastFrameId(scene.id, shot.id))} 
                                                                                        className="bg-blue-500/10 hover:bg-blue-500/20 disabled:opacity-50 text-blue-400 px-4 py-2 rounded-xl text-[10px] font-bold tracking-widest uppercase flex items-center gap-2 border border-blue-500/30 transition-colors shrink-0"
                                                                                    >
                                                                                        {generatingIds.has(makeLastFrameId(scene.id, shot.id)) ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Play className="w-3.5 h-3.5" />} Gen Last Frame
                                                                                    </button>
                                                                                </div>
                                                                                
                                                                                {generatedImages[makeLastFrameId(scene.id, shot.id)] ? (
                                                                                    <div className="rounded-xl border border-zinc-800 bg-black overflow-hidden relative group/lastframe w-full mt-2" style={{ aspectRatio: aspectRatio.replace(':', '/') }}>
                                                                                        <img src={generatedImages[makeLastFrameId(scene.id, shot.id)]} className="w-full h-full object-cover" alt="Last frame" />
                                                                                        <div className="absolute top-2 left-2 bg-black/70 backdrop-blur-md text-[10px] font-black text-white px-2 py-1 rounded tracking-widest border border-zinc-700">END FRAME</div>
                                                                                        <div className="absolute inset-0 bg-black/70 opacity-0 group-hover/lastframe:opacity-100 transition-all flex items-center justify-center gap-4 backdrop-blur-sm">
                                                                                            <button onClick={(e) => { e.preventDefault(); handleDownloadSingleImage(generatedImages[makeLastFrameId(scene.id, shot.id)], `last_frame_s${scene.id}_${shot.id}.png`); }} className="bg-emerald-500/20 text-emerald-400 p-3 rounded-xl border border-emerald-500/30 hover:bg-emerald-500/30 transition-all transform hover:scale-105 shadow-xl" title="Download"><Download className="w-5 h-5" /></button>
                                                                                            <button onClick={(e) => { e.preventDefault(); setFullscreenImage(generatedImages[makeLastFrameId(scene.id, shot.id)]); }} className="bg-blue-500/20 text-blue-400 p-3 rounded-xl border border-blue-500/30 hover:bg-blue-500/30 transition-all transform hover:scale-105 shadow-xl" title="View Fullscreen"><Maximize className="w-5 h-5" /></button>
                                                                                        </div>
                                                                                    </div>
                                                                                ) : null}
                                                                            </div>

                                                                            <div className="flex flex-col xl:flex-row gap-4">
                                                                                <div className="flex-1 bg-zinc-900/60 p-4 rounded-2xl border border-zinc-800/80 flex flex-col items-center justify-center text-center gap-3 min-h-[140px] shadow-sm">
                                                                                    <div className="p-2.5 bg-purple-500/10 rounded-full">
                                                                                        <Paintbrush className="w-5 h-5 text-purple-400" />
                                                                                    </div>
                                                                                    <div className="flex flex-col gap-1 w-full">
                                                                                        <span className="text-[12px] font-black text-zinc-300 uppercase tracking-widest">Image Editor</span>
                                                                                        <span className="text-[10px] text-zinc-500 leading-relaxed">Draw a mask or use text prompts</span>
                                                                                    </div>
                                                                                    <button 
                                                                                        onClick={() => setActiveInpainting({ sceneId: scene.id, shotId: shot.id, frameId, imageUrl: generatedImages[frameId] })}
                                                                                        className="bg-purple-600 hover:bg-purple-500 text-white px-5 py-3 rounded-xl text-[11px] font-bold uppercase tracking-wider transition-colors shadow-md w-full mt-2 flex items-center justify-center gap-2"
                                                                                    >
                                                                                        <Paintbrush className="w-4 h-4" /> Open Paint Editor
                                                                                    </button>
                                                                                    <div className="w-full h-px bg-zinc-800/80 my-2"></div>
                                                                                    <div className="w-full flex gap-2">
                                                                                        <input
                                                                                            type="text"
                                                                                            placeholder="Or type edit instruction..."
                                                                                            value={imageEditPrompts[frameId] || ''}
                                                                                            onChange={(e) => setImageEditPrompts(prev => ({ ...prev, [frameId]: e.target.value }))}
                                                                                            onKeyDown={(e) => { if (e.key === 'Enter') handleTextEdit(scene.id, shot.id, frameId); }}
                                                                                            className="flex-1 bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-2.5 text-xs text-zinc-300 focus:outline-none focus:border-purple-500/50"
                                                                                        />
                                                                                        <button
                                                                                            onClick={() => handleTextEdit(scene.id, shot.id, frameId)}
                                                                                            disabled={isGenerating || !(imageEditPrompts[frameId]?.trim())}
                                                                                            className="bg-purple-500/20 hover:bg-purple-500/30 text-purple-400 px-4 rounded-xl border border-purple-500/30 disabled:opacity-50 transition-colors flex items-center justify-center"
                                                                                            title="Apply text edit"
                                                                                        >
                                                                                            {isGenerating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Wand2 className="w-4 h-4" />}
                                                                                        </button>
                                                                                    </div>
                                                                                </div>

                                                                                <div className="flex-1 bg-zinc-900/60 p-4 rounded-2xl border border-zinc-800/80 flex flex-col gap-3 shadow-sm">
                                                                                    <div className="flex items-center justify-between">
                                                                                        <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest flex items-center gap-1.5"><MessageSquareQuote className="w-4 h-4" /> AI Director Suggestions</span>
                                                                                        <button onClick={() => suggestShotAlternatives(scene.id, shot.id)} disabled={generatingIds.has(`alts-${frameId}`)} className="bg-zinc-800 hover:bg-zinc-700 disabled:opacity-50 text-amber-400 px-4 py-2 rounded-xl text-[10px] font-bold tracking-widest uppercase flex items-center gap-1.5 border border-zinc-700 transition-colors">
                                                                                            {generatingIds.has(`alts-${frameId}`) ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Wand2 className="w-3.5 h-3.5" />} Gen Ideas
                                                                                        </button>
                                                                                    </div>
                                                                                    {shot.aiIdeas ? (
                                                                                        <div className="text-[11px] text-amber-300/80 font-mono overflow-y-auto max-h-[100px] custom-scrollbar whitespace-pre-wrap pr-1">{shot.aiIdeas}</div>
                                                                                    ) : (
                                                                                        <div className="flex items-center justify-center h-[80px] text-[11px] text-amber-500/30 font-mono italic">Need framing ideas? Click 'Gen Ideas'.</div>
                                                                                    )}
                                                                                </div>
                                                                            </div>

                                                                            <div className="w-full bg-zinc-900/80 p-6 rounded-2xl border border-emerald-900/30 flex flex-col gap-5 shadow-inner">
                                                                                <div className="flex items-center justify-between border-b border-zinc-800/60 pb-4">
                                                                                    <span className="text-[12px] font-black text-emerald-500 uppercase tracking-widest flex items-center gap-2"><LayoutDashboard className="w-5 h-5" /> Telemetry & Technical Analysis</span>
                                                                                    <button 
                                                                                        onClick={() => generateTechBreakdown(scene.id, shot.id, shot)}
                                                                                        disabled={generatingIds.has(`breakdown-${frameId}`)}
                                                                                        className="bg-emerald-500/10 hover:bg-emerald-500/20 disabled:opacity-50 text-emerald-400 px-5 py-2.5 rounded-xl text-[11px] font-bold tracking-widest uppercase flex items-center gap-2 border border-emerald-500/30 transition-colors shadow-sm"
                                                                                    >
                                                                                        {generatingIds.has(`breakdown-${frameId}`) ? <Loader2 className="w-4 h-4 animate-spin" /> : <Activity className="w-4 h-4" />}
                                                                                        Gen Dashboard
                                                                                    </button>
                                                                                </div>
                                                                                
                                                                                {generatedBreakdowns[frameId] ? (
                                                                                    <div className="rounded-xl border border-emerald-500/40 bg-black overflow-hidden relative group/dash shadow-lg w-full">
                                                                                        <img src={generatedBreakdowns[frameId]} className="w-full h-auto max-h-[800px] object-contain" alt="Tech Specs Board" />
                                                                                        <div className="absolute inset-0 bg-black/70 opacity-0 group-hover/dash:opacity-100 transition-all flex items-center justify-center gap-4 backdrop-blur-sm">
                                                                                            <button onClick={(e) => { e.preventDefault(); handleDownloadSingleImage(generatedBreakdowns[frameId], `tech_specs_s${scene.id}_${shot.id}.png`); }} className="bg-emerald-500/20 hover:bg-emerald-500/40 text-emerald-400 hover:text-white px-8 py-4 rounded-xl border border-emerald-500/50 font-bold text-sm uppercase tracking-wider flex items-center gap-2 transition-all transform hover:scale-105 shadow-xl"><Download className="w-5 h-5" /> Download Full Res</button>
                                                                                            <button onClick={(e) => { e.preventDefault(); setFullscreenImage(generatedBreakdowns[frameId]); }} className="bg-blue-500/20 hover:bg-blue-500/40 text-blue-400 hover:text-white px-8 py-4 rounded-xl border border-blue-500/50 font-bold text-sm uppercase tracking-wider flex items-center gap-2 transition-all transform hover:scale-105 shadow-xl"><Maximize className="w-5 h-5" /> View Large</button>
                                                                                        </div>
                                                                                    </div>
                                                                                ) : (
                                                                                    <div className="flex flex-col items-center justify-center h-[160px] bg-zinc-950 border border-dashed border-zinc-800/80 rounded-2xl text-zinc-600">
                                                                                        <Activity className="w-10 h-10 mb-4 opacity-40 text-emerald-500" />
                                                                                        <span className="text-[11px] uppercase tracking-widest font-bold">No Telemetry Data Synthesized</span>
                                                                                    </div>
                                                                                )}
                                                                            </div>
                                                                        </div>
                                                                    )}
                                                                </div>
                                                            </div>
                                                            
                                                            {/* Multi-Cam Coverage Section (Available for every shot) */}
                                                            <div className="mt-8 pt-8 border-t border-zinc-800/60">
                                                                <div className="flex items-center justify-between mb-5">
                                                                    <span className="text-xs font-bold text-zinc-400 uppercase tracking-widest flex items-center gap-2">
                                                                        <Video className="w-5 h-5 text-blue-500" /> Multi-Cam Variations
                                                                    </span>
                                                                    <button
                                                                        onClick={() => generateShotMultiCamOptions(scene.id, shot.id)}
                                                                        disabled={generatingIds.has(`multicam-gen-${scene.id}-${shot.id}`)}
                                                                        className="bg-blue-500/10 hover:bg-blue-500/20 border border-blue-500/30 text-blue-400 px-4 py-2 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-colors flex items-center gap-2 disabled:opacity-50"
                                                                    >
                                                                        {generatingIds.has(`multicam-gen-${scene.id}-${shot.id}`) ? <Loader2 className="w-4 h-4 animate-spin" /> : <Video className="w-4 h-4" />}
                                                                        Generate Coverage Angles
                                                                    </button>
                                                                </div>

                                                                {shot.multiCamOptions && shot.multiCamOptions.length > 0 && (
                                                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                                                                        {shot.multiCamOptions.map(mc => {
                                                                            const mcFrameId = makeMcFrameId(scene.id, shot.id, mc.id);
                                                                            const isMcGen = generatingIds.has(mcFrameId);
                                                                            const hasMcImg = !!generatedImages[mcFrameId];

                                                                            return (
                                                                                <div key={mc.id} className="bg-zinc-900 border border-zinc-800/80 rounded-2xl p-4 flex flex-col gap-4 shadow-sm">
                                                                                    <div className="flex items-center justify-between">
                                                                                        <span className="text-sm font-bold text-zinc-300 truncate pr-2">{mc.camLabel}</span>
                                                                                        <button
                                                                                            onClick={() => applyMultiCamAsFinal(scene.id, shot.id, mc)}
                                                                                            className="bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30 px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-colors shrink-0"
                                                                                        >
                                                                                            Set as Final
                                                                                        </button>
                                                                                    </div>
                                                                                    <div className="text-[11px] text-zinc-500 flex flex-col gap-1.5 font-mono">
                                                                                        <span className="truncate">{mc.type} | {mc.cameraAngle}</span>
                                                                                        <span className="truncate text-blue-400/70">{mc.lens}</span>
                                                                                    </div>
                                                                                    <div className="rounded-xl bg-black relative flex items-center justify-center overflow-hidden border border-zinc-800 group/mcimg" style={{ aspectRatio: aspectRatio.replace(':', '/') }}>
                                                                                        {isMcGen && <Loader2 className="w-8 h-8 text-emerald-400 animate-spin absolute z-10" />}
                                                                                        {hasMcImg ? (
                                                                                            <>
                                                                                                <img src={generatedImages[mcFrameId]} className="w-full h-full object-cover" />
                                                                                                <div className="absolute inset-0 bg-black/70 opacity-0 group-hover/mcimg:opacity-100 transition-all duration-300 flex items-center justify-center gap-3 backdrop-blur-sm">
                                                                                                    <button onClick={(e) => { e.preventDefault(); handleDownloadSingleImage(generatedImages[mcFrameId], `mc_frame_s${scene.id}_${shot.id}.png`); }} className="bg-emerald-500/20 text-emerald-400 p-3 rounded-xl border border-emerald-500/30 hover:bg-emerald-500/30 transition-all transform hover:scale-105 shadow-xl" title="Download"><Download className="w-4 h-4" /></button>
                                                                                                    <button onClick={(e) => { e.preventDefault(); setFullscreenImage(generatedImages[mcFrameId]); }} className="bg-blue-500/20 text-blue-400 p-3 rounded-xl border border-blue-500/30 hover:bg-blue-500/30 transition-all transform hover:scale-105 shadow-xl" title="View Fullscreen"><Maximize className="w-4 h-4" /></button>
                                                                                                </div>
                                                                                            </>
                                                                                        ) : (
                                                                                            !isMcGen && <Video className="w-8 h-8 text-zinc-700" />
                                                                                        )}
                                                                                    </div>
                                                                                    <button
                                                                                        onClick={() => generateAIImage(scene.id, shot.id, {...shot, ...mc}, mc.id)}
                                                                                        disabled={isMcGen}
                                                                                        className="bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-[11px] font-bold uppercase py-3 rounded-xl transition-colors w-full"
                                                                                    >
                                                                                        {hasMcImg ? 'Reroll Angle' : 'Render Angle'}
                                                                                    </button>
                                                                                </div>
                                                                            )
                                                                        })}
                                                                    </div>
                                                                )}
                                                            </div>
                                                        </div>
                                                    );
                                                })
                                        )}
                                        </div>
                                        
                                        {scene.shots.length > 0 && (
                                            <div className="mt-10 pt-8 border-t border-[#1f1f1f] flex flex-col gap-10">
                                                
                                                {/* Costume & Prop Breakdown Chart Section */}
                                                <div>
                                                    <div className="flex items-center justify-between mb-5">
                                                        <span className="text-[12px] font-bold text-zinc-400 uppercase tracking-widest flex items-center gap-2">
                                                            <Users className="w-5 h-5 text-purple-500" /> Costume & Prop Breakdown Chart
                                                        </span>
                                                        <button 
                                                            onClick={() => generateCostumeBoard(scene.id)} 
                                                            disabled={generatingIds.has(`costume-board-${scene.id}`)}
                                                            className="bg-purple-500/10 hover:bg-purple-500/20 border border-purple-500/30 text-purple-400 px-4 py-2 rounded-lg text-[11px] font-bold uppercase tracking-wider transition-colors flex items-center gap-2 disabled:opacity-50"
                                                        >
                                                            {generatingIds.has(`costume-board-${scene.id}`) ? (
                                                                <><Loader2 className="w-4 h-4 animate-spin" /> Generating</>
                                                            ) : (
                                                                <><Wand2 className="w-4 h-4" /> Gen Wardrobe Board</>
                                                            )}
                                                        </button>
                                                    </div>
                                                    
                                                    {generatedCostumeBoards[scene.id] ? (
                                                        <div className="rounded-xl border border-purple-500/30 bg-[#000000] overflow-hidden relative group shadow-lg">
                                                            <img src={generatedCostumeBoards[scene.id]} alt="Costume Board" className="w-full h-auto object-contain" />
                                                            <div className="absolute inset-0 bg-black/80 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-4 backdrop-blur-sm">
                                                                <button onClick={(e) => { e.preventDefault(); handleDownloadSingleImage(generatedCostumeBoards[scene.id], `costume_s${scene.id}.png`); }} className="bg-[#111] text-zinc-300 px-5 py-3 rounded-lg border border-[#333] hover:bg-[#222] flex items-center gap-2 text-sm font-bold uppercase tracking-wider"><Download className="w-5 h-5" /> Download</button>
                                                            </div>
                                                        </div>
                                                    ) : (
                                                        <div className="bg-[#050505] border border-dashed border-[#1f1f1f] rounded-2xl p-8 flex flex-col items-center justify-center text-center">
                                                            <span className="text-[11px] text-zinc-600 uppercase tracking-widest font-bold">No Costume Board</span>
                                                        </div>
                                                    )}
                                                </div>

                                                {/* Compiled Boards Section */}
                                                <div>
                                                    <div className="flex items-center justify-between mb-5">
                                                        <span className="text-[12px] font-bold text-zinc-400 uppercase tracking-widest flex items-center gap-2">
                                                            <Images className="w-5 h-5 text-emerald-500" /> Compiled Storyboards
                                                        </span>
                                                        <button 
                                                            onClick={() => generateCollages(scene.id)} 
                                                            disabled={generatingIds.has(`collages-${scene.id}`)}
                                                            className="bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 px-4 py-2 rounded-lg text-[11px] font-bold uppercase tracking-wider transition-colors flex items-center gap-2 disabled:opacity-50"
                                                        >
                                                            {generatingIds.has(`collages-${scene.id}`) ? (
                                                                <><Loader2 className="w-4 h-4 animate-spin" /> Compiling</>
                                                            ) : (
                                                                <><Wand2 className="w-4 h-4" /> Gen Storyboard Grid</>
                                                            )}
                                                        </button>
                                                    </div>
                                                    
                                                    {generatedCollages[scene.id] && Array.isArray(generatedCollages[scene.id]) && generatedCollages[scene.id].length > 0 ? (
                                                        <div className="space-y-5">
                                                            {generatedCollages[scene.id].map((collageSrc, idx) => (
                                                                <div key={idx} className="rounded-xl border border-emerald-500/30 bg-[#000000] overflow-hidden relative group shadow-lg">
                                                                    <div className="absolute top-3 left-3 bg-[#050505]/90 text-zinc-400 px-3 py-1 rounded text-[10px] font-bold tracking-widest border border-[#222] z-10">Grid Part {idx + 1}</div>
                                                                    <img src={collageSrc} alt={`Board ${idx + 1}`} className="w-full h-auto object-contain" />
                                                                    <div className="absolute inset-0 bg-black/80 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-4 backdrop-blur-sm">
                                                                        <button onClick={(e) => { e.preventDefault(); handleDownloadSingleImage(collageSrc, `board_s${scene.id}_${idx+1}.png`); }} className="bg-[#111] text-zinc-300 px-5 py-3 rounded-lg border border-[#333] hover:bg-[#222] flex items-center gap-2 text-sm font-bold uppercase tracking-wider"><Download className="w-5 h-5" /> Download</button>
                                                                    </div>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    ) : generatedCollages[scene.id] && typeof generatedCollages[scene.id] === 'string' ? (
                                                        <div className="rounded-xl border border-emerald-500/30 bg-[#000000] overflow-hidden relative group shadow-lg">
                                                            <img src={generatedCollages[scene.id]} alt={`Board`} className="w-full h-auto object-contain" />
                                                            <div className="absolute inset-0 bg-black/80 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-4 backdrop-blur-sm">
                                                                <button onClick={(e) => { e.preventDefault(); handleDownloadSingleImage(generatedCollages[scene.id], `board_s${scene.id}.png`); }} className="bg-[#111] text-zinc-300 px-5 py-3 rounded-lg border border-[#333] hover:bg-[#222] flex items-center gap-2 text-sm font-bold uppercase tracking-wider"><Download className="w-5 h-5" /> Download</button>
                                                            </div>
                                                        </div>
                                                    ) : (
                                                        <div className="bg-[#050505] border border-dashed border-[#1f1f1f] rounded-2xl p-8 flex flex-col items-center justify-center text-center">
                                                            <span className="text-[11px] text-zinc-600 uppercase tracking-widest font-bold">Awaiting Compilation</span>
                                                        </div>
                                                    )}
                                                </div>

                                            </div>
                                        )}
                                    </div>
                            ))
                            )}
                        </div>
                    </div>
                )}
            </div>

            {/* Fullscreen Slider Overlay */}
                {showAppSlider && (
                    <div className="fixed inset-0 z-[100] bg-zinc-950 flex flex-col backdrop-blur-3xl">
                        <div className="flex items-center justify-between p-5 border-b border-zinc-800/80 bg-zinc-950/80 backdrop-blur-md">
                            <div className="flex items-center gap-4">
                                <div className="p-2.5 bg-emerald-500/10 rounded-xl border border-emerald-500/20 shadow-[0_0_15px_rgba(16,185,129,0.2)]">
                                    <Play className="w-5 h-5 text-emerald-400 fill-emerald-400" />
                                </div>
                                <div>
                                    <h2 className="text-xl font-black text-white tracking-widest uppercase">{projectName || 'Project Storyboard'}</h2>
                                    <p className="text-zinc-500 text-xs font-bold uppercase tracking-wider">Presentation Mode</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-6">
                                <button
                                    onClick={() => setIsAnimaticPlaying(v => !v)}
                                    disabled={sliderFrames.length === 0}
                                    className={`p-3 rounded-xl border transition-all shadow-sm disabled:opacity-40 ${isAnimaticPlaying ? 'bg-emerald-500 border-emerald-400 text-zinc-950' : 'bg-zinc-900 border-zinc-800 text-zinc-300 hover:bg-zinc-800 hover:text-white'}`}
                                    title={isAnimaticPlaying ? 'Pause animatic' : 'Play animatic (uses each shot duration)'}
                                >
                                    {isAnimaticPlaying ? <Square className="w-5 h-5" /> : <Play className="w-5 h-5" />}
                                </button>
                                <div className="bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-2 shadow-inner">
                                    <span className="text-sm font-black text-zinc-300 font-mono">{sliderFrames.length > 0 ? sliderIndex + 1 : 0} <span className="text-zinc-600">/ {sliderFrames.length}</span></span>
                                </div>
                                <button onClick={() => { setIsAnimaticPlaying(false); setShowAppSlider(false); }} className="bg-zinc-900 hover:bg-zinc-800 hover:text-white border border-zinc-800 text-zinc-400 p-3 rounded-xl transition-all shadow-sm">
                                    <X className="w-5 h-5" />
                                </button>
                            </div>
                        </div>
                        
                        <div className="flex-1 flex items-center justify-center relative overflow-hidden bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-zinc-900 via-zinc-950 to-black">
                            {sliderFrames.length > 0 ? (
                                <>
                                    <button 
                                        onClick={() => setSliderIndex(prev => Math.max(prev - 1, 0))}
                                        disabled={sliderIndex === 0}
                                        className="absolute left-6 z-10 bg-zinc-900/50 hover:bg-zinc-800 text-white p-5 rounded-2xl backdrop-blur-md border border-zinc-700/50 disabled:opacity-30 transition-all shadow-2xl hover:scale-105"
                                    >
                                        <ChevronLeft className="w-8 h-8" />
                                    </button>
                                    
                                    <div className="w-full max-w-[90vw] max-h-full flex flex-col items-center justify-center p-8">
                                        <div className="relative group">
                                            <div className="absolute -inset-1 bg-gradient-to-r from-emerald-500/20 to-blue-500/20 rounded-xl blur opacity-25 group-hover:opacity-50 transition duration-1000 group-hover:duration-200"></div>
                                            <img src={sliderFrames[sliderIndex].image} className="relative max-w-full max-h-[70vh] object-contain shadow-2xl rounded-xl border border-zinc-800 bg-zinc-950" />
                                        </div>
                                        <div className="mt-10 text-center max-w-4xl bg-zinc-950/50 border border-zinc-800/80 p-6 rounded-2xl backdrop-blur-sm shadow-xl">
                                            <h3 className="text-2xl font-black text-white mb-2 uppercase tracking-wide">{sliderFrames[sliderIndex].sceneTitle} <span className="text-zinc-600">|</span> Shot {sliderFrames[sliderIndex].shotOrder}</h3>
                                            <p className="text-emerald-400 font-black text-xs uppercase tracking-[0.2em] mb-4 bg-emerald-500/10 inline-block px-3 py-1 rounded-md border border-emerald-500/20">{sliderFrames[sliderIndex].shotType}</p>
                                            {sliderFrames[sliderIndex].snippet && (
                                                <p className="text-zinc-300 text-xl font-serif italic border-l-4 border-zinc-700 pl-6 py-2 mx-auto leading-relaxed shadow-inner">"{sliderFrames[sliderIndex].snippet}"</p>
                                            )}
                                        </div>
                                    </div>

                                    <button 
                                        onClick={() => setSliderIndex(prev => Math.min(prev + 1, sliderFrames.length - 1))}
                                        disabled={sliderIndex === sliderFrames.length - 1}
                                        className="absolute right-6 z-10 bg-zinc-900/50 hover:bg-zinc-800 text-white p-5 rounded-2xl backdrop-blur-md border border-zinc-700/50 disabled:opacity-30 transition-all shadow-2xl hover:scale-105"
                                    >
                                        <ChevronRight className="w-8 h-8" />
                                    </button>
                                </>
                            ) : (
                                <div className="text-center flex flex-col items-center bg-zinc-900/50 border border-zinc-800 p-12 rounded-3xl backdrop-blur-sm">
                                    <div className="p-5 bg-zinc-800 rounded-full mb-6">
                                        <Images className="w-16 h-16 text-zinc-500" />
                                    </div>
                                    <p className="text-white font-black uppercase tracking-widest text-xl mb-3">No Generated Imagery</p>
                                    <p className="text-zinc-500 text-sm max-w-sm leading-relaxed">Run the AI Breakdown process and render the frames to visualize them in presentation mode.</p>
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {/* Interactive Inpainting Modal */}
                {activeInpainting && (
                    <InpaintingEditor
                        imageUrl={activeInpainting.imageUrl}
                        onClose={() => setActiveInpainting(null)}
                        isGenerating={generatingIds.has(activeInpainting.frameId)}
                        onApply={async (prompt, maskDataUrl) => {
                            await editAIImage(activeInpainting.sceneId, activeInpainting.shotId, prompt, maskDataUrl);
                            setActiveInpainting(null);
                        }}
                    />
                )}

                {/* Fullscreen Image Pop-up */}
                {fullscreenImage && (
                    <div 
                        className="fixed inset-0 z-[130] bg-black/95 backdrop-blur-xl flex flex-col items-center justify-center p-4 md:p-8 cursor-zoom-out"
                        onClick={() => setFullscreenImage(null)}
                    >
                        <button 
                            onClick={() => setFullscreenImage(null)}
                            className="absolute top-6 right-6 bg-zinc-800/80 hover:bg-zinc-700 text-white p-3 rounded-full transition-all z-50 border border-zinc-700"
                        >
                            <X className="w-6 h-6" />
                        </button>
                        <img 
                            src={fullscreenImage} 
                            alt="Expanded Fullscreen View" 
                            className="max-w-full max-h-full object-contain rounded-xl shadow-[0_0_50px_rgba(0,0,0,0.5)] cursor-default" 
                            onClick={(e) => e.stopPropagation()} 
                        />
                    </div>
                )}

                {/* Actor Match Confirmation Modal */}
                {pendingActorMatch && (
                    <div className="fixed inset-0 z-[150] bg-black/90 backdrop-blur-md flex items-center justify-center p-4">
                        <div className="bg-zinc-900 border border-emerald-500/30 rounded-2xl p-6 max-w-md w-full shadow-2xl">
                            <div className="flex items-center gap-3 mb-4">
                                <Sparkles className="text-emerald-400 w-6 h-6" />
                                <h3 className="text-xl font-black text-white uppercase tracking-widest">Actor Match Found</h3>
                            </div>
                            
                            {pendingActorMatch.imageDatas && pendingActorMatch.imageDatas.length > 0 && (
                                <img src={pendingActorMatch.imageDatas[0].url} className="w-full h-48 object-cover rounded-xl mb-4 border border-zinc-700" alt="Detected face" />
                            )}
                            
                            <p className="text-zinc-300 text-sm mb-4 leading-relaxed">
                                We identified <strong className="text-emerald-400">{pendingActorMatch.detectedInfo.name}</strong>. Do you want to automatically link this actor's identity and visual traits to this character profile?
                            </p>
                            
                            <div className="bg-zinc-950 rounded-xl p-4 text-xs font-mono text-zinc-400 mb-6 space-y-2">
                                <p><span className="text-zinc-500 font-bold uppercase">Name:</span> {pendingActorMatch.detectedInfo.name}</p>
                                <p><span className="text-zinc-500 font-bold uppercase">Gender:</span> {pendingActorMatch.detectedInfo.gender}</p>
                                <p><span className="text-zinc-500 font-bold uppercase">Age:</span> {pendingActorMatch.detectedInfo.age}</p>
                                <p><span className="text-zinc-500 font-bold uppercase">Traits:</span> {pendingActorMatch.detectedInfo.traits}</p>
                            </div>
                            
                            <div className="flex flex-col gap-3">
                                <button 
                                    onClick={() => handleConfirmActorMatch(true)} 
                                    className="w-full bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-bold py-3 px-4 rounded-xl transition-colors flex items-center justify-center gap-2"
                                >
                                    <UserPlus className="w-4 h-4" /> Yes, Link Actor Profile
                                </button>
                                <button 
                                    onClick={() => handleConfirmActorMatch(false)} 
                                    className="w-full bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-bold py-3 px-4 rounded-xl transition-colors"
                                >
                                    No, Keep Original Inputs
                                </button>
                            </div>
                        </div>
                    </div>
                )}

            </div>
    );
}