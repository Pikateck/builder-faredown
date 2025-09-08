import React, { useState, useRef, useEffect, memo } from 'react';
import { cn } from '@/lib/utils';

interface OptimizedImageProps extends Omit<React.ImgHTMLAttributes<HTMLImageElement>, 'loading'> {
  src: string;
  alt: string;
  width?: number;
  height?: number;
  placeholder?: string;
  blurDataURL?: string;
  className?: string;
  priority?: boolean;
  quality?: number;
  onLoadingComplete?: () => void;
  onError?: () => void;
}

export const OptimizedImage = memo<OptimizedImageProps>(function OptimizedImage({
  src,
  alt,
  width,
  height,
  placeholder = 'blur',
  blurDataURL,
  className,
  priority = false,
  quality = 75,
  onLoadingComplete,
  onError,
  ...props
}) {
  const [isLoaded, setIsLoaded] = useState(false);
  const [isError, setIsError] = useState(false);
  const [isInView, setIsInView] = useState(priority);
  const imgRef = useRef<HTMLImageElement>(null);
  const observerRef = useRef<IntersectionObserver | null>(null);

  // Intersection Observer for lazy loading
  useEffect(() => {
    if (priority || isInView) return;

    observerRef.current = new IntersectionObserver(
      (entries) => {
        const [entry] = entries;
        if (entry.isIntersecting) {
          setIsInView(true);
          observerRef.current?.disconnect();
        }
      },
      {
        rootMargin: '50px', // Start loading 50px before image comes into view
        threshold: 0.1,
      }
    );

    if (imgRef.current) {
      observerRef.current.observe(imgRef.current);
    }

    return () => {
      observerRef.current?.disconnect();
    };
  }, [priority, isInView]);

  // Generate optimized src URL (you can customize this for your CDN)
  const getOptimizedSrc = (originalSrc: string) => {
    if (!originalSrc) return '';
    
    // Check if it's already an optimized URL or external URL
    if (originalSrc.includes('?') || originalSrc.startsWith('http')) {
      return originalSrc;
    }
    
    // Add optimization parameters for your image service
    const params = new URLSearchParams();
    if (width) params.append('w', width.toString());
    if (height) params.append('h', height.toString());
    if (quality) params.append('q', quality.toString());
    params.append('f', 'webp'); // Prefer WebP format
    
    return `${originalSrc}?${params.toString()}`;
  };

  // Generate blur placeholder
  const getBlurPlaceholder = () => {
    if (blurDataURL) return blurDataURL;
    
    // Generate a simple blur placeholder
    return `data:image/svg+xml;base64,${btoa(`
      <svg width="${width || 400}" height="${height || 300}" xmlns="http://www.w3.org/2000/svg">
        <rect width="100%" height="100%" fill="#f3f4f6"/>
        <text x="50%" y="50%" text-anchor="middle" dy=".3em" fill="#9ca3af" font-family="Arial, sans-serif" font-size="14">
          Loading...
        </text>
      </svg>
    `)}`;
  };

  const handleLoad = () => {
    setIsLoaded(true);
    onLoadingComplete?.();
  };

  const handleError = () => {
    setIsError(true);
    onError?.();
  };

  // Error fallback
  if (isError) {
    return (
      <div 
        className={cn(
          'flex items-center justify-center bg-gray-100 text-gray-400',
          className
        )}
        style={{ width, height }}
      >
        <svg 
          className="w-8 h-8" 
          fill="none" 
          stroke="currentColor" 
          viewBox="0 0 24 24"
        >
          <path 
            strokeLinecap="round" 
            strokeLinejoin="round" 
            strokeWidth={2} 
            d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" 
          />
        </svg>
      </div>
    );
  }

  return (
    <div 
      ref={imgRef}
      className={cn('relative overflow-hidden', className)}
      style={{ width, height }}
    >
      {/* Blur placeholder */}
      {!isLoaded && placeholder === 'blur' && (
        <img
          src={getBlurPlaceholder()}
          alt=""
          className="absolute inset-0 w-full h-full object-cover filter blur-sm scale-105"
          style={{ width, height }}
        />
      )}
      
      {/* Loading skeleton */}
      {!isLoaded && placeholder === 'skeleton' && (
        <div className="absolute inset-0 bg-gray-200 animate-pulse" />
      )}
      
      {/* Actual image */}
      {isInView && (
        <img
          src={getOptimizedSrc(src)}
          alt={alt}
          width={width}
          height={height}
          className={cn(
            'transition-opacity duration-300',
            isLoaded ? 'opacity-100' : 'opacity-0'
          )}
          onLoad={handleLoad}
          onError={handleError}
          loading={priority ? 'eager' : 'lazy'}
          decoding="async"
          {...props}
        />
      )}
      
      {/* Loading indicator */}
      {!isLoaded && !isError && (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-6 h-6 border-2 border-gray-300 border-t-gray-600 rounded-full animate-spin" />
        </div>
      )}
    </div>
  );
});

// Preload critical images
export const preloadImage = (src: string, priority: boolean = false) => {
  const link = document.createElement('link');
  link.rel = priority ? 'preload' : 'prefetch';
  link.as = 'image';
  link.href = src;
  document.head.appendChild(link);
};

// Hook for batch image preloading
export const useImagePreloader = (images: string[], priority: boolean = false) => {
  useEffect(() => {
    images.forEach(src => preloadImage(src, priority));
  }, [images, priority]);
};
