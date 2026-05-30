export const fileToBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
};

export const extractFramesFromVideo = (file: File, numFrames: number = 4): Promise<string[]> => {
  return new Promise((resolve, reject) => {
    const video = document.createElement('video');
    const url = URL.createObjectURL(file);
    const frames: string[] = [];
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
      if (ctx) {
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        frames.push(canvas.toDataURL('image/jpeg', 0.8));
      }

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

export const handleDownloadSingleImage = async (dataUrl: string, filename: string) => {
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
    console.warn("Blob conversion failed, attempting direct fallback download:", error);
    const a = document.createElement('a');
    a.href = dataUrl;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  }
};
