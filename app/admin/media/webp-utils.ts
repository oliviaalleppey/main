/**
 * Converts an image file to WebP in the browser using Canvas API.
 * Falls back gracefully if the browser doesn't support WebP encoding.
 */
export async function toWebPClient(file: File): Promise<File> {
    return new Promise((resolve, reject) => {
        const img = new window.Image();
        const objectUrl = URL.createObjectURL(file);

        img.onload = () => {
            URL.revokeObjectURL(objectUrl);
            const canvas = document.createElement('canvas');

            const MAX_WIDTH = 1920;
            let width = img.naturalWidth;
            let height = img.naturalHeight;

            if (width > MAX_WIDTH) {
                height = Math.round((height * MAX_WIDTH) / width);
                width = MAX_WIDTH;
            }

            canvas.width = width;
            canvas.height = height;

            const ctx = canvas.getContext('2d');
            if (!ctx) { reject(new Error('Canvas not available')); return; }

            ctx.drawImage(img, 0, 0, width, height);

            canvas.toBlob(
                (blob) => {
                    if (!blob) { reject(new Error('WebP conversion failed')); return; }
                    const actualType = blob.type === 'image/webp' ? 'image/webp' : blob.type;
                    const ext = actualType === 'image/webp' ? '.webp' : (actualType === 'image/png' ? '.png' : '.jpg');
                    const newName = file.name.replace(/\.[^.]+$/, ext);
                    resolve(new File([blob], newName, { type: actualType }));
                },
                'image/webp',
                0.85
            );
        };

        img.onerror = () => {
            URL.revokeObjectURL(objectUrl);
            reject(new Error('Could not read this image. HEIC/HEIF files must be converted to JPG or PNG first.'));
        };

        img.src = objectUrl;
    });
}
