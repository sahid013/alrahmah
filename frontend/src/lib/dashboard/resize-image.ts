/** Accepted poster uploads. */
export const IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
export const MAX_UPLOAD_MB = 10;

/** Throws a user-facing message when the file can't be used as a poster. */
export function checkImageFile(file: File) {
  if (!IMAGE_TYPES.includes(file.type)) throw new Error('Choose a JPG, PNG or WebP image.');
  if (file.size > MAX_UPLOAD_MB * 1024 * 1024)
    throw new Error(`Images must be under ${MAX_UPLOAD_MB} MB.`);
}

/**
 * Browser-only: scale an image down to `max` px on its longest side and re-encode it as WebP.
 * Keeps uploads small (a 5 MB phone photo becomes ~100 KB) before storing or sending them.
 */
export async function resizeImage(file: File, max = 800, quality = 0.85): Promise<Blob> {
  const bitmap = await createImageBitmap(file);
  const scale = Math.min(1, max / Math.max(bitmap.width, bitmap.height));
  const canvas = document.createElement('canvas');
  canvas.width = Math.round(bitmap.width * scale);
  canvas.height = Math.round(bitmap.height * scale);
  canvas.getContext('2d')!.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  bitmap.close();
  return new Promise((resolve, reject) =>
    canvas.toBlob(
      (b) => (b ? resolve(b) : reject(new Error('Could not read this image.'))),
      'image/webp',
      quality,
    ),
  );
}

export const blobToDataUrl = (blob: Blob) =>
  new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(new Error('Could not read this image.'));
    reader.readAsDataURL(blob);
  });
