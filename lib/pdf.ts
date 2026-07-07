export async function splitPDFToImages(
  file: File,
  onProgress: (percent: number) => void
): Promise<Blob[]> {
  const pdfjsLib = (window as any)['pdfjs-dist/build/pdf'];
  if (!pdfjsLib) {
    await new Promise<void>((resolve, reject) => {
      const script = document.createElement('script');
      script.src = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.4.120/pdf.min.js';
      script.onload = () => {
        const workerScript = document.createElement('script');
        workerScript.src = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.4.120/pdf.worker.min.js';
        workerScript.onload = () => resolve();
        workerScript.onerror = () => reject(new Error('PDFJS local WebWorker dynamic configuration failed.'));
        document.head.appendChild(workerScript);
      };
      script.onerror = () => reject(new Error('PDFJS core rendering engine script load failed.'));
      document.head.appendChild(script);
    });
  }

  const globalPdfjs = (window as any)['pdfjs-dist/build/pdf'];
  globalPdfjs.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.4.120/pdf.worker.min.js';

  const arrayBuffer = await file.arrayBuffer();
  const pdf = await globalPdfjs.getDocument({ data: arrayBuffer }).promise;
  const pageCount = pdf.numPages;
  const imageBlobs: Blob[] = [];

  for (let i = 1; i <= pageCount; i++) {
    const page = await pdf.getPage(i);
    const viewport = page.getViewport({ scale: 2.0 });
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) continue;

    canvas.width = viewport.width;
    canvas.height = viewport.height;

    await page.render({ canvasContext: ctx, viewport }).promise;

    const blob = await new Promise<Blob | null>((res) => canvas.toBlob(res, 'image/jpeg', 0.8));
    if (blob) {
      imageBlobs.push(blob);
    }
    onProgress(Math.round((i / pageCount) * 100));
  }
  return imageBlobs;
}