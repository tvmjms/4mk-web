// lib/mediaOptimizer.ts
// Sustainable media optimization for environmental responsibility and performance

export interface OptimizationOptions {
  maxWidth: number;
  maxHeight: number;
  quality: number; // 0.1 to 1.0
  format?: 'webp' | 'jpeg' | 'png';
  progressive?: boolean;
}

export interface OptimizationResult {
  originalSize: number;
  optimizedSize: number;
  compressionRatio: number;
  dimensions: { width: number; height: number };
  format: string;
  optimizedBlob: Blob;
  sustainabilityImpact: {
    bandwidthSaved: number;
    carbonFootprintReduction: string;
    storageSpaceSaved: number;
  };
}

class MediaOptimizer {
  // Preset optimization profiles for different use cases
  private readonly OPTIMIZATION_PRESETS = {
    // Thumbnails for grid views - highly compressed
    thumbnail: {
      maxWidth: 200,
      maxHeight: 200,
      quality: 0.7,
      format: 'webp' as const,
      progressive: true
    },
    // Medium resolution for modal previews
    preview: {
      maxWidth: 800,
      maxHeight: 600,
      quality: 0.8,
      format: 'webp' as const,
      progressive: true
    },
    // Full resolution but still optimized
    full: {
      maxWidth: 1920,
      maxHeight: 1080,
      quality: 0.85,
      format: 'webp' as const,
      progressive: true
    },
    // Document images - prioritize readability
    document: {
      maxWidth: 1200,
      maxHeight: 1600,
      quality: 0.9,
      format: 'jpeg' as const,
      progressive: true
    }
  };

  // Video optimization settings
  private readonly VIDEO_PRESETS = {
    preview: {
      maxWidth: 640,
      maxHeight: 480,
      bitrate: '800k',
      fps: 24
    },
    standard: {
      maxWidth: 1280,
      maxHeight: 720,
      bitrate: '1500k',
      fps: 30
    }
  };

  /**
   * Optimize an image file for sustainable storage and fast loading
   */
  async optimizeImage(
    file: File, 
    preset: keyof typeof this.OPTIMIZATION_PRESETS = 'preview'
  ): Promise<OptimizationResult> {
    const options = this.OPTIMIZATION_PRESETS[preset];
    const originalSize = file.size;

    try {
      // Create canvas for image processing
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      if (!ctx) throw new Error('Canvas not supported');

      // Load image
      const img = await this.loadImage(file);
      
      // Calculate optimal dimensions maintaining aspect ratio
      const { width, height } = this.calculateOptimalDimensions(
        img.width, 
        img.height, 
        options.maxWidth, 
        options.maxHeight
      );

      // Set canvas size
      canvas.width = width;
      canvas.height = height;

      // Enable image smoothing for better quality
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'high';

      // Draw resized image
      ctx.drawImage(img, 0, 0, width, height);

      // Convert to optimized format
      const optimizedBlob = await new Promise<Blob>((resolve, reject) => {
        canvas.toBlob(
          (blob) => {
            if (blob) resolve(blob);
            else reject(new Error('Failed to create optimized image'));
          },
          `image/${options.format}`,
          options.quality
        );
      });

      const optimizedSize = optimizedBlob.size;
      const compressionRatio = originalSize / optimizedSize;
      const bandwidthSaved = originalSize - optimizedSize;

      return {
        originalSize,
        optimizedSize,
        compressionRatio,
        dimensions: { width, height },
        format: options.format,
        optimizedBlob,
        sustainabilityImpact: {
          bandwidthSaved,
          carbonFootprintReduction: this.calculateCarbonSavings(bandwidthSaved),
          storageSpaceSaved: bandwidthSaved
        }
      };

    } catch (error) {
      console.error('Image optimization error:', error);
      throw new Error(`Image optimization failed: ${error}`);
    }
  }

  /**
   * Create multiple optimized versions for responsive display
   */
  async createResponsiveVariants(file: File): Promise<{
    thumbnail: OptimizationResult;
    preview: OptimizationResult;
    full: OptimizationResult;
    totalSavings: {
      bandwidthSaved: number;
      carbonFootprintReduction: string;
      compressionRatio: number;
    };
  }> {
    try {
      const [thumbnail, preview, full] = await Promise.all([
        this.optimizeImage(file, 'thumbnail'),
        this.optimizeImage(file, 'preview'), 
        this.optimizeImage(file, 'full')
      ]);

      const totalBandwidthSaved = thumbnail.sustainabilityImpact.bandwidthSaved + 
                                 preview.sustainabilityImpact.bandwidthSaved + 
                                 full.sustainabilityImpact.bandwidthSaved;

      const averageCompressionRatio = (thumbnail.compressionRatio + 
                                     preview.compressionRatio + 
                                     full.compressionRatio) / 3;

      return {
        thumbnail,
        preview,
        full,
        totalSavings: {
          bandwidthSaved: totalBandwidthSaved,
          carbonFootprintReduction: this.calculateCarbonSavings(totalBandwidthSaved),
          compressionRatio: averageCompressionRatio
        }
      };
    } catch (error) {
      console.error('Responsive variant creation error:', error);
      throw error;
    }
  }

  /**
   * Optimize video for web delivery (client-side compression)
   */
  async optimizeVideo(file: File): Promise<{
    originalSize: number;
    estimatedOptimizedSize: number;
    sustainabilityImpact: {
      estimatedBandwidthSaved: number;
      carbonFootprintReduction: string;
    };
    recommendations: string[];
  }> {
    const originalSize = file.size;
    
    // Client-side video optimization is limited, but we can provide analysis
    const videoElement = document.createElement('video');
    const url = URL.createObjectURL(file);
    
    return new Promise((resolve) => {
      videoElement.onloadedmetadata = () => {
        const duration = videoElement.duration;
        const estimatedBitrate = (originalSize * 8) / duration; // bits per second
        
        // Estimate optimized size based on standard compression ratios
        const targetBitrate = Math.min(estimatedBitrate, 2000000); // Max 2Mbps
        const estimatedOptimizedSize = (targetBitrate * duration) / 8;
        const estimatedSavings = Math.max(0, originalSize - estimatedOptimizedSize);
        
        const recommendations = [];
        
        if (videoElement.videoWidth > 1280) {
          recommendations.push(`Resize from ${videoElement.videoWidth}x${videoElement.videoHeight} to 1280x720 for web`);
        }
        
        if (estimatedBitrate > 3000000) {
          recommendations.push(`Reduce bitrate from ${(estimatedBitrate/1000000).toFixed(1)}Mbps to 2Mbps`);
        }
        
        if (duration > 60) {
          recommendations.push('Consider shorter clips (under 60 seconds) for better user engagement');
        }

        recommendations.push('Use H.264 codec with MP4 container for best compatibility');
        
        URL.revokeObjectURL(url);
        
        resolve({
          originalSize,
          estimatedOptimizedSize,
          sustainabilityImpact: {
            estimatedBandwidthSaved: estimatedSavings,
            carbonFootprintReduction: this.calculateCarbonSavings(estimatedSavings)
          },
          recommendations
        });
      };
      
      videoElement.onerror = () => {
        URL.revokeObjectURL(url);
        resolve({
          originalSize,
          estimatedOptimizedSize: originalSize * 0.7, // Assume 30% savings
          sustainabilityImpact: {
            estimatedBandwidthSaved: originalSize * 0.3,
            carbonFootprintReduction: this.calculateCarbonSavings(originalSize * 0.3)
          },
          recommendations: ['Video analysis failed - consider standard web optimization']
        });
      };
      
      videoElement.src = url;
    });
  }

  /**
   * Load image from file
   */
  private loadImage(file: File): Promise<HTMLImageElement> {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => {
        URL.revokeObjectURL(img.src);
        resolve(img);
      };
      img.onerror = () => {
        URL.revokeObjectURL(img.src);
        reject(new Error('Failed to load image'));
      };
      img.src = URL.createObjectURL(file);
    });
  }

  /**
   * Calculate optimal dimensions maintaining aspect ratio
   */
  private calculateOptimalDimensions(
    originalWidth: number, 
    originalHeight: number, 
    maxWidth: number, 
    maxHeight: number
  ): { width: number; height: number } {
    const aspectRatio = originalWidth / originalHeight;
    
    let width = originalWidth;
    let height = originalHeight;
    
    // If image is larger than max dimensions, scale it down
    if (width > maxWidth) {
      width = maxWidth;
      height = width / aspectRatio;
    }
    
    if (height > maxHeight) {
      height = maxHeight;
      width = height * aspectRatio;
    }
    
    // Ensure dimensions are integers
    return {
      width: Math.round(width),
      height: Math.round(height)
    };
  }

  /**
   * Calculate estimated carbon footprint reduction
   */
  private calculateCarbonSavings(bytesSaved: number): string {
    // Rough estimate: 1GB transfer = ~6g CO2 (varies by region/energy source)
    const gbSaved = bytesSaved / (1024 * 1024 * 1024);
    const co2SavedGrams = gbSaved * 6;
    
    if (co2SavedGrams < 1) {
      return `${(co2SavedGrams * 1000).toFixed(0)}mg CO2`;
    } else if (co2SavedGrams < 1000) {
      return `${co2SavedGrams.toFixed(1)}g CO2`;
    } else {
      return `${(co2SavedGrams / 1000).toFixed(2)}kg CO2`;
    }
  }

  /**
   * Analyze file and recommend optimization
   */
  analyzeFile(file: File): {
    needsOptimization: boolean;
    currentImpact: string;
    recommendations: string[];
    sustainabilityScore: 'excellent' | 'good' | 'fair' | 'poor';
  } {
    const sizeMB = file.size / (1024 * 1024);
    const recommendations = [];
    let sustainabilityScore: 'excellent' | 'good' | 'fair' | 'poor' = 'excellent';
    
    // Image analysis
    if (file.type.startsWith('image/')) {
      if (sizeMB > 5) {
        recommendations.push('Large image - compress to under 2MB');
        sustainabilityScore = 'poor';
      } else if (sizeMB > 2) {
        recommendations.push('Consider compression for faster loading');
        sustainabilityScore = 'fair';
      } else if (sizeMB > 0.5) {
        sustainabilityScore = 'good';
      }
      
      if (!file.type.includes('webp')) {
        recommendations.push('Convert to WebP format for better compression');
      }
    }
    
    // Video analysis
    if (file.type.startsWith('video/')) {
      if (sizeMB > 25) {
        recommendations.push('Large video - consider shorter duration or lower resolution');
        sustainabilityScore = 'poor';
      } else if (sizeMB > 10) {
        recommendations.push('Compress video to reduce bandwidth usage');
        sustainabilityScore = 'fair';
      } else if (sizeMB > 5) {
        sustainabilityScore = 'good';
      }
    }
    
    const needsOptimization = recommendations.length > 0;
    const currentImpact = this.calculateCarbonSavings(file.size);
    
    return {
      needsOptimization,
      currentImpact,
      recommendations,
      sustainabilityScore
    };
  }
}

export const mediaOptimizer = new MediaOptimizer();