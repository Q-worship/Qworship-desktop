import { Request, Response } from 'express';
import { Media } from './media.model.js';
import path from 'path';
import fs from 'fs';
import { objectStorage } from './s3.service.js';
import sharp from 'sharp';

// 1. Upload User Media
export const uploadMedia = async (req: Request, res: Response) => {
  try {
    const files = req.files as Express.Multer.File[];
    if (!files || files.length === 0) {
      return res.status(400).json({ message: 'No files uploaded' });
    }

    const uploadedRecords = [];

    for (let index = 0; index < files.length; index++) {
      const file = files[index];
      const { originalname, mimetype, size, filename, path: uploadPath } = file;

      // Extract metadata from frontend mapping
      let metadata: any = {};
      try {
        if (req.body[`metadata_${index}`]) {
          metadata = JSON.parse(req.body[`metadata_${index}`]);
        }
      } catch (e) {
        console.warn(`Could not parse metadata for file ${index}`);
      }

      const type = mimetype.startsWith('video') ? 'video' : 'image';
      const title = metadata.title || originalname;
      
      let finalFileSize = size;

      // Compress Images
      if (type === 'image') {
        try {
          // Generate a safe temporary path with the original extension so sharp infers format
          const tempPath = path.join(path.dirname(uploadPath), 'tmp-' + path.basename(uploadPath));
          
          await sharp(uploadPath)
            .resize({ width: 1920, withoutEnlargement: true })
            .jpeg({ quality: 80, force: false })
            .webp({ quality: 80, force: false })
            .png({ quality: 80, force: false })
            .withMetadata()
            .toFile(tempPath);
            
          // Replace the original with the compressed version
          fs.unlinkSync(uploadPath);
          fs.renameSync(tempPath, uploadPath);
          
          // Re-measure file size
          const stats = fs.statSync(uploadPath);
          finalFileSize = stats.size;
        } catch (err) {
          console.error(`Error compressing image ${filename}:`, err);
          // If compression fails, we still have the original file, we just proceed.
        }
      }

      const newMedia = new Media({
        title,
        description: metadata.description || '',
        tags: metadata.tags || [],
        categories: metadata.categories || [],
        type,
        fileType: mimetype,
        fileName: filename,
        filePath: uploadPath,
        fileSize: finalFileSize,
        uploadedBy: (req as any).user._id,
        usageCount: 0,
      });

      await newMedia.save();
      uploadedRecords.push(newMedia);
    }

    res.status(201).json({ assets: uploadedRecords });

  } catch (error) {
    console.error('Error uploading media:', error);
    res.status(500).json({ message: 'Failed to upload media' });
  }
};

// 2. List User Media
export const listUserMedia = async (req: Request, res: Response) => {
  try {
    const assets = await Media.find({ 
      isCloud: { $ne: true },
      uploadedBy: req.user._id 
    }).sort({ createdAt: -1 });
    res.json({ assets });
  } catch (error) {
    console.error('Error fetching user media:', error);
    res.status(500).json({ message: 'Server Error' });
  }
};

// 3. Get Media File (Stream or Download)
export const getMediaFile = async (req: Request, res: Response) => {
  try {
    const media = await Media.findById(req.params.id);
    if (!media || !media.filePath) {
      return res.status(404).json({ message: 'Media not found' });
    }

    if (fs.existsSync(media.filePath)) {
      res.sendFile(path.resolve(media.filePath));
    } else {
      res.status(404).json({ message: 'File physically missing from server' });
    }
  } catch (error) {
    console.error('Error fetching media file:', error);
    res.status(500).json({ message: 'Server Error' });
  }
};

// 4. Get Media Thumbnail
export const getMediaThumbnail = async (req: Request, res: Response) => {
  try {
    const media = await Media.findById(req.params.id);
    if (!media) {
      return res.status(404).json({ message: 'Media not found' });
    }

    if (media.thumbnail && fs.existsSync(media.thumbnail)) {
      // 1) explicitly generated local thumbnail
      res.sendFile(path.resolve(media.thumbnail));
    } else if (media.type === 'video') {
      // 2) The browser Frontend is now robustly handling video meta extraction
      // Do NOT send the massive RAW mp4 file down as a thumbnail,
      // Just 404, instructing the frontend video component to use its own engine
      res.status(404).json({ message: 'Video thumbnail extraction handled by client' });
    } else if (media.filePath && fs.existsSync(media.filePath)) {
      // 3) it's an image, so the file itself serves as the perfect thumbnail
      res.sendFile(path.resolve(media.filePath));
    } else {
      res.status(404).json({ message: 'Thumbnail not available' });
    }
  } catch (error) {
    console.error('Error fetching media thumbnail:', error);
    res.status(500).json({ message: 'Server Error' });
  }
};

// 5. Delete User Media
export const deleteMedia = async (req: Request, res: Response) => {
  try {
    const media = await Media.findById(req.params.id);
    if (!media) {
      return res.status(404).json({ message: 'Media not found' });
    }

    // Remove from disk
    if (media.filePath && fs.existsSync(media.filePath)) {
      fs.unlinkSync(media.filePath);
    }

    await Media.findByIdAndDelete(req.params.id);
    res.json({ message: 'Media deleted successfully' });
  } catch (error) {
    console.error('Error deleting media:', error);
    res.status(500).json({ message: 'Server Error' });
  }
};

// 6. List Cloud Media
export const listCloudMedia = async (req: Request, res: Response) => {
  try {
    const filter: any = { isCloud: true };
    // Only super admins should see unpublished/draft media
    if (req.query.adminKey !== 'qworship-superadmin-2025') {
      filter.isPublished = true;
    }
    
    const assets = await Media.find(filter).sort({ createdAt: -1 });
    
    // Map backend document fields directly to frontend expected interface
    const mappedAssets = assets.map(a => {
      const asset = a.toObject();
      let mappedFileType = 'DOCUMENT';
      
      const typeStr = asset.fileType || asset.type || '';
      if (typeStr.toLowerCase().startsWith('image')) mappedFileType = 'IMAGE';
      else if (typeStr.toLowerCase().startsWith('video')) mappedFileType = 'VIDEO';
      else if (typeStr.toLowerCase().startsWith('audio')) mappedFileType = 'AUDIO';

      return {
        ...asset,
        id: a._id.toString(),
        mimeType: asset.fileType || 'application/octet-stream',
        fileType: mappedFileType,
        filePath: `/api/cloud-media/${a._id}/file`,
        thumbnailPath: `/api/cloud-media/${a._id}/thumbnail`
      };
    });

    res.json(mappedAssets);
  } catch (error) {
    console.error('Error fetching cloud media:', error);
    res.status(500).json({ message: 'Server Error' });
  }
};

// 7. Get Cloud Media Thumbnail
export const getCloudMediaThumbnail = async (req: Request, res: Response) => {
  try {
    const asset = await Media.findById(req.params.id);
    if (!asset || !asset.cloudKey) {
      if (asset && asset.fileUrl) {
         return res.redirect(asset.fileUrl);
      }
      return res.status(404).json({ message: 'Not found' });
    }
    
    // Generate secure pre-signed URL on demand
    const signedUrl = await objectStorage.getSignedDownloadUrl(asset.cloudKey, 3600);
    res.redirect(signedUrl);
  } catch (error) {
    console.error('Error fetching cloud media thumbnail:', error);
    res.status(500).json({ message: 'Server Error' });
  }
};

// 8. Get Cloud Media File
export const getCloudMediaFile = async (req: Request, res: Response) => {
  try {
    const asset = await Media.findById(req.params.id);
    if (asset && asset.cloudKey) {
      const signedUrl = await objectStorage.getSignedDownloadUrl(asset.cloudKey, 3600);
      return res.redirect(signedUrl);
    } else if (asset && asset.fileUrl) {
      return res.redirect(asset.fileUrl);
    } else {
      res.status(404).json({ message: 'Not found' });
    }
  } catch (error) {
    console.error('Error fetching cloud media file:', error);
    res.status(500).json({ message: 'Server Error' });
  }
};

// 9. Upload Cloud Media directly to S3/R2 (Super Admin)
export const uploadCloudMedia = async (req: Request, res: Response) => {
  try {
    const files = req.files as Express.Multer.File[];
    if (!files || files.length === 0) {
      return res.status(400).json({ message: 'No files uploaded' });
    }

    // Admins pass metadata via formData.append('metadata', JSON.stringify(...))
    let metadata: any = {};
    if (req.body.metadata) {
      try {
        metadata = JSON.parse(req.body.metadata);
      } catch (e) {
        console.warn('Could not parse metadata object');
      }
    }

    const uploadedRecords = [];

    // Loop through uploaded files
    for (const file of files) {
      const { originalname, mimetype, size, buffer } = file;
      const type = mimetype.startsWith('video') ? 'video' : 'image';
      // Use metadata title if provided, else fallback to filename
      const title = metadata.title || originalname;

      let processedBuffer = buffer;
      let finalFileSize = size;
      
      // Compress Images
      if (type === 'image') {
        try {
          processedBuffer = await sharp(buffer)
            .resize({ width: 1920, withoutEnlargement: true })
            .jpeg({ quality: 80, force: false })
            .webp({ quality: 80, force: false })
            .png({ quality: 80, force: false })
            .withMetadata()
            .toBuffer();
          finalFileSize = processedBuffer.length;
        } catch (err) {
          console.error(`Error compressing cloud image ${originalname}:`, err);
          // If compression fails, we still have the original buffer, proceed
        }
      }

      // Push buffer to S3 directly
      const { key, fileUrl } = await objectStorage.uploadCloudMedia(originalname, processedBuffer, mimetype);

      // Persist as a Cloud Media entity
      const newMedia = new Media({
        title,
        description: metadata.description || '',
        type,
        fileType: mimetype,
        fileName: originalname,
        cloudKey: key,         // The S3 / R2 Object key
        fileUrl: fileUrl,      // Public / verifiable link
        thumbnailUrl: fileUrl, // Let the frontend optimize thumbnail pulling for images using width parameters
        fileSize: finalFileSize,
        categoryId: metadata.categoryId,
        categoryIds: metadata.categoryIds || [],
        collectionIds: metadata.collectionIds || [],
        uploadedBy: (req as any).user._id, 
        isCloud: true,         // Very important to differentiate from local uploads
        isPremium: metadata.isPremium || false,
        usageCount: 0,
      });

      await newMedia.save();
      uploadedRecords.push(newMedia);
    }
    
    // Return the array of newly uploaded cloud media documents
    res.status(201).json(uploadedRecords);
  } catch (error) {
    console.error('Error uploading cloud media to R2:', error);
    res.status(500).json({ message: 'Failed to upload cloud media' });
  }
};

// 10. Update Cloud Media metadata (for Draft/Premium toggles)
export const updateCloudMedia = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const updates = req.body;
    
    // Attempt update natively by ID safely
    const updatedMedia = await Media.findByIdAndUpdate(
      id,
      { $set: updates },
      { new: true }
    );

    if (!updatedMedia) {
      return res.status(404).json({ message: 'Cloud media not found' });
    }

    res.json(updatedMedia);
  } catch (error) {
    console.error('Error updating cloud media:', error);
    res.status(500).json({ message: 'Server Error' });
  }
};
