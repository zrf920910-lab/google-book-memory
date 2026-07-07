function createProceduralAudioNode(ctx: AudioContext, frequency: number, duration: number, dest: AudioNode) {
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  
  osc.type = 'triangle';
  osc.frequency.setValueAtTime(frequency, ctx.currentTime);
  
  gain.gain.setValueAtTime(0.08, ctx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);
  
  osc.connect(gain);
  gain.connect(dest);
  
  osc.start();
  osc.stop(ctx.currentTime + duration);
}

export async function exportStoryVideo(
  bookTitle: string,
  pages: { imageBlob?: Blob; imageUrl?: string }[],
  audioBlobs: { [pageIndex: number]: Blob },
  childName: string,
  childAge: string,
  bgMusicType: 'none' | 'piano' | 'musicbox' | 'forest' | 'rain',
  bgVolume: number,
  onProgress: (percent: number) => void
): Promise<Blob> {
  const canvas = document.createElement('canvas');
  canvas.width = 1080;
  canvas.height = 1080;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Could not establish Canvas 2D raster engine.');

  const stream = canvas.captureStream(30);
  const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
  const audioCtx = new AudioContextClass();
  const destAudio = audioCtx.createMediaStreamDestination();

  let bgOscInterval: NodeJS.Timeout | null = null;
  if (bgMusicType !== 'none') {
    const bgGain = audioCtx.createGain();
    bgGain.gain.setValueAtTime(bgVolume * 0.15, audioCtx.currentTime);
    bgGain.connect(destAudio);

    let step = 0;
    const melody = [261.63, 293.66, 329.63, 349.23, 392.00, 440.00, 493.88, 523.25];
    bgOscInterval = setInterval(() => {
      const freq = melody[step % melody.length];
      createProceduralAudioNode(audioCtx, freq, 1.5, bgGain);
      step++;
    }, 1000);
  }

  const combinedStream = new MediaStream();
  combinedStream.addTrack(stream.getVideoTracks()[0]);
  if (destAudio.stream.getAudioTracks().length > 0) {
    combinedStream.addTrack(destAudio.stream.getAudioTracks()[0]);
  }

  const recordedChunks: Blob[] = [];
  const options = { mimeType: 'video/webm;codecs=vp9,opus' };
  let mediaRecorder: MediaRecorder;
  
  try {
    mediaRecorder = new MediaRecorder(combinedStream, options);
  } catch {
    mediaRecorder = new MediaRecorder(combinedStream, { mimeType: 'video/webm' });
  }

  mediaRecorder.ondataavailable = (event) => {
    if (event.data && event.data.size > 0) {
      recordedChunks.push(event.data);
    }
  };

  const loadImg = (url: string): Promise<HTMLImageElement> => {
    return new Promise((res, rej) => {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.src = url;
      img.onload = () => res(img);
      img.onerror = () => rej(new Error(`Image resource load failed: ${url}`));
    });
  };

  const drawPage = (img: HTMLImageElement | null, titleStr: string, subtitleStr: string, textStr: string) => {
    ctx.fillStyle = '#faf8f5';
    ctx.fillRect(0, 0, 1080, 1080);

    ctx.strokeStyle = '#e6dec9';
    ctx.lineWidth = 16;
    ctx.strokeRect(40, 40, 1000, 1000);

    if (img) {
      const photoWidth = 840;
      const photoHeight = 630;
      const photoX = 120;
      const photoY = 120;

      ctx.fillStyle = '#ffffff';
      ctx.fillRect(photoX - 20, photoY - 20, photoWidth + 40, photoHeight + 80);
      ctx.strokeStyle = '#e6dec9';
      ctx.lineWidth = 1;
      ctx.strokeRect(photoX - 20, photoY - 20, photoWidth + 40, photoHeight + 80);

      const iw = img.width;
      const ih = img.height;
      const aspect = iw / ih;
      const targetAspect = photoWidth / photoHeight;
      let dw, dh, dx, dy;

      if (aspect > targetAspect) {
        dw = photoWidth;
        dh = photoWidth / aspect;
        dx = photoX;
        dy = photoY + (photoHeight - dh) / 2;
      } else {
        dh = photoHeight;
        dw = photoHeight * aspect;
        dx = photoX + (photoWidth - dw) / 2;
        dy = photoY;
      }

      ctx.drawImage(img, dx, dy, dw, dh);

      ctx.fillStyle = '#3a332e';
      ctx.font = 'italic bold 28px "Georgia", serif';
      ctx.textAlign = 'center';
      ctx.fillText(textStr, 540, 880);
    } else {
      ctx.fillStyle = '#3a332e';
      ctx.font = 'bold 56px "Georgia", serif';
      ctx.textAlign = 'center';
      ctx.fillText(titleStr, 540, 360);

      ctx.strokeStyle = '#8c7e6b';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(340, 440);
      ctx.lineTo(740, 440);
      ctx.stroke();

      ctx.font = '36px "Georgia", serif';
      ctx.fillStyle = '#5c5246';
      ctx.fillText(subtitleStr, 540, 520);

      ctx.fillStyle = '#8c7e6b';
      ctx.font = '24px "Georgia", serif';
      const today = new Date();
      ctx.fillText(`声音记录器 | ${today.getFullYear()}年${today.getMonth() + 1}月`, 540, 780);
    }
  };

  return new Promise<Blob>(async (resolve, reject) => {
    try {
      mediaRecorder.start();

      drawPage(null, `《${bookTitle}》`, `${childName} (${childAge})`, '');
      let coverTimer = 0;
      const coverInterval = setInterval(() => {
        drawPage(null, `《${bookTitle}》`, `${childName} (${childAge})`, '');
        coverTimer += 100;
        if (coverTimer >= 3500) {
          clearInterval(coverInterval);
          playPageSequence();
        }
      }, 100);

      const playPageSequence = async () => {
        for (let i = 0; i < pages.length; i++) {
          onProgress(Math.round(((i + 1) / pages.length) * 100));
          const page = pages[i];
          const imgUrl = page.imageBlob ? URL.createObjectURL(page.imageBlob) : page.imageUrl || '';
          const img = await loadImg(imgUrl);

          const voiceBlob = audioBlobs[i];
          let durationMs = 3000;

          let voiceSource: AudioBufferSourceNode | null = null;
          if (voiceBlob) {
            const arrayBuffer = await voiceBlob.arrayBuffer();
            const audioBuffer = await audioCtx.decodeAudioData(arrayBuffer);
            durationMs = Math.max(audioBuffer.duration * 1000 + 400, 3000);

            voiceSource = audioCtx.createBufferSource();
            voiceSource.buffer = audioBuffer;
            voiceSource.connect(destAudio);
            voiceSource.start();
          }

          let elapsed = 0;
          await new Promise<void>((frameResolve) => {
            const pageLoop = setInterval(() => {
              drawPage(img, '', '', `第 ${i + 1} / ${pages.length} 页`);
              elapsed += 100;
              if (elapsed >= durationMs) {
                clearInterval(pageLoop);
                frameResolve();
              }
            }, 100);
          });

          if (voiceSource) {
            voiceSource.stop();
          }
          if (page.imageBlob) {
            URL.revokeObjectURL(imgUrl);
          }
        }

        if (bgOscInterval) clearInterval(bgOscInterval);
        mediaRecorder.stop();
        
        mediaRecorder.onstop = () => {
          audioCtx.close();
          const finalBlob = new Blob(recordedChunks, { type: 'video/mp4' });
          resolve(finalBlob);
        };
      };
    } catch (e) {
      if (bgOscInterval) clearInterval(bgOscInterval);
      audioCtx.close();
      reject(e);
    }
  });
}