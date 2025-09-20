import sharp from 'sharp';
import path from 'path';

const MAX_SIZE = 10 * 1024 * 1024; // 10MB
const IMAGE_EXTENSIONS = ['.jpg', '.jpeg', '.png', '.webp'];


export async function resizeImageIfNeeded(
  originalPath: string,
  originalName: string,
  fileSize: number
): Promise<{ uploadPath: string; tempFilesToDelete: string[] }> {
  
  const ext = path.extname(originalName).toLowerCase();

  if (fileSize <= MAX_SIZE) {  
    return { 
        uploadPath: originalPath,
        tempFilesToDelete: [] 
    };
  }

  if(IMAGE_EXTENSIONS.includes(ext)){
    const resizedPath = `uploads/resized-${Date.now()}{ext}`;

    await sharp(originalPath)
      .resize({
        width: 1920,
        withoutEnlargement: true
      })
      .toFormat(
        ext === '.png' ? 'png' :ext === '.webp' ? 'webp' : 'jpeg',
        {quality: 80}
      )
      .toFile(resizedPath);

      return {
        uploadPath: resizedPath, 
        tempFilesToDelete: [originalPath, resizedPath]
      };
  }
  return{
    uploadPath: originalPath,
    tempFilesToDelete: []
  }
}
