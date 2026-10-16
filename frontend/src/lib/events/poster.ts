/**
 * Prepares a poster in the browser before upload: scaled to at most 1000px wide (posters are
 * shown no wider) and saved as WebP (JPEG where the browser can't make WebP). Returns the image
 * and its size, which the site needs to show posters at their natural height.
 */
const MAX_WIDTH = 1000;

export async function preparePoster(
  file: File,
): Promise<{ blob: Blob; width: number; height: number }> {
  if (!file.type.startsWith('image/')) throw new Error('Choose an image file (JPG, PNG or WebP).');
  const bitmap = await createImageBitmap(file).catch(() => {
    throw new Error('That image could not be read. Try a JPG or PNG.');
  });
  const scale = Math.min(1, MAX_WIDTH / bitmap.width);
  const width = Math.round(bitmap.width * scale);
  const height = Math.round(bitmap.height * scale);
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  canvas.getContext('2d')!.drawImage(bitmap, 0, 0, width, height);
  bitmap.close();

  const encode = (type: string) =>
    new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, type, 0.85));
  let blob = await encode('image/webp');
  if (!blob || blob.type !== 'image/webp') blob = await encode('image/jpeg');
  if (!blob) throw new Error('That image could not be prepared.');
  if (blob.size > 5 * 1024 * 1024) throw new Error('That image is too large (over 5 MB).');
  return { blob, width, height };
}
