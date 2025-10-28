import { Injectable, Logger } from '@nestjs/common';
import * as sharp from 'sharp';
import { pdfToPng } from 'pdf-to-png-converter';

@Injectable()
export class ImageEnhancementService {
  private readonly logger = new Logger(ImageEnhancementService.name);

  /**
   * Convert PDF to array of image buffers (one per page)
   */
  async convertPdfToImages(buffer: Buffer): Promise<Buffer[]> {
    this.logger.log('Converting PDF to images...');
    
    try {
      // Use pdf-to-png-converter - much simpler and more reliable
      const options = {
        outputFileMask: 'page',
        disableFontFace: false,
        useSystemFonts: false,
        enableXfa: false,
        viewportScale: 2.0, // High quality
        outputFolder: undefined, // We want buffers, not files
      };

      this.logger.log('Starting PDF to PNG conversion...');
      const pngPages = await pdfToPng(buffer, options);
      
      this.logger.log(`PDF converted to ${pngPages.length} pages`);
      
      const images: Buffer[] = [];
      for (let i = 0; i < pngPages.length; i++) {
        const pageBuffer = pngPages[i].content;
        
        // Validate the buffer
        if (!pageBuffer || pageBuffer.length === 0) {
          throw new Error(`Failed to convert page ${i + 1} to buffer`);
        }
        
        images.push(pageBuffer);
        this.logger.log(`Converted page ${i + 1}/${pngPages.length} (${Math.round(pageBuffer.length / 1024)}KB)`);
      }

      return images;
    } catch (error) {
      this.logger.error(`PDF conversion failed: ${error.message}`);
      throw new Error(`PDF conversion failed: ${error.message}`);
    }
  }

  /**
   * Enhance image for better OCR
   * Pipeline optimized for handwritten documents with Claude's 5MB limit
   */
  async enhance(buffer: Buffer, mimeType: string): Promise<Buffer> {
    this.logger.log('Enhancing image...');
    
    try {
      // Validate buffer
      if (!buffer || buffer.length === 0) {
        throw new Error('Invalid buffer provided');
      }

      let image = sharp(buffer);
      
      // Get image metadata and validate
      const metadata = await image.metadata();
      if (!metadata.width || !metadata.height) {
        throw new Error('Unable to read image dimensions');
      }
      
      this.logger.log(`Original image: ${metadata.width}x${metadata.height}, ${metadata.format}`);

      // Calculate optimal size to stay under 5MB limit for Claude
      // Target around 2-3MB after compression to be safe
      const maxWidth = 2400; // Reduced from 3000 to control file size
      const targetSizeBytes = 3 * 1024 * 1024; // 3MB target

      // Enhancement pipeline
      const enhanced = await image
        // 1. Convert to grayscale (removes color noise and reduces size)
        .grayscale()
        
        // 2. Smart resize to balance quality and file size
        .resize({
          width: maxWidth,
          fit: 'inside',
          withoutEnlargement: false,
          kernel: 'lanczos3', // Best quality interpolation
        })
        
        // 3. Auto-adjust levels
        .normalize()
        
        // 4. Sharpen to enhance edges (helps with handwriting)
        .sharpen({
          sigma: 1.0, // Reduced sharpening to avoid artifacts
          m1: 0.8,
          m2: 0.5,
        })
        
        // 5. Adjust brightness slightly
        .modulate({
          brightness: 1.05, // Reduced adjustment
        })
        
        // 6. Convert to JPEG with quality optimization for size control
        .jpeg({ 
          quality: 85, // Good quality but smaller size than PNG
          progressive: true,
          mozjpeg: true 
        })
        .toBuffer();

      // Check if result is still too large
      if (enhanced.length > 4.5 * 1024 * 1024) { // 4.5MB safety margin
        this.logger.warn(`Enhanced image still too large (${Math.round(enhanced.length / 1024 / 1024)}MB), reducing quality`);
        
        // Fallback: more aggressive compression
        const compressedImage = await sharp(buffer)
          .grayscale()
          .resize({
            width: 1800, // Even smaller
            fit: 'inside',
            withoutEnlargement: false,
          })
          .normalize()
          .jpeg({ quality: 75 })
          .toBuffer();
          
        this.logger.log(`Compressed image size: ${Math.round(compressedImage.length / 1024 / 1024)}MB`);
        return compressedImage;
      }

      this.logger.log(`Enhanced image size: ${Math.round(enhanced.length / 1024 / 1024)}MB`);
      return enhanced;
      
    } catch (error) {
      this.logger.error(`Image enhancement failed: ${error.message}`);
      throw new Error(`Image enhancement failed: ${error.message}`);
    }
  }
}