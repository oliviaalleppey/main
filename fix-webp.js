const fs = require('fs');
const path = require('path');

function findFiles(dir) {
  let results = [];
  const list = fs.readdirSync(dir);
  list.forEach(file => {
    file = path.join(dir, file);
    const stat = fs.statSync(file);
    if (stat && stat.isDirectory()) { 
      if (!file.includes('node_modules') && !file.includes('.git') && !file.includes('.next')) {
        results = results.concat(findFiles(file));
      }
    } else {
      if (file.endsWith('.tsx') || file.endsWith('.ts')) results.push(file);
    }
  });
  return results;
}

const files = findFiles(process.cwd());

const newCode = `async function toWebPClient(file: File): Promise<File> {
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
            
            // Draw with white background in case of transparency -> jpeg issues
            ctx.drawImage(img, 0, 0, width, height);
            
            canvas.toBlob(
                (blob) => {
                    if (!blob) { reject(new Error('WebP conversion failed')); return; }
                    const actualType = blob.type === 'image/webp' ? 'image/webp' : blob.type;
                    const ext = actualType === 'image/webp' ? '.webp' : (actualType === 'image/png' ? '.png' : '.jpg');
                    const newName = file.name.replace(/\\.[^.]+$/, ext);
                    resolve(new File([blob], newName, { type: actualType }));
                },
                'image/webp',
                0.85
            );
        };

        img.onerror = () => {
            URL.revokeObjectURL(objectUrl);
            reject(new Error('Failed to load image'));
        };

        img.src = objectUrl;
    });
}`;

let updated = 0;
files.forEach(f => {
  let content = fs.readFileSync(f, 'utf8');
  const regex = /async function toWebPClient\(file: File\): Promise<File> \{[\s\S]*?img\.src = objectUrl;\n    \}\);\n\}/;
  if (regex.test(content)) {
     content = content.replace(regex, newCode);
     fs.writeFileSync(f, content);
     console.log('Updated', f);
     updated++;
  }
});
console.log('Total updated:', updated);
