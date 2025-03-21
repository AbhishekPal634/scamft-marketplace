
import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";

interface BlurImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  containerClassName?: string;
}

const BlurImage = ({ 
  src, 
  alt, 
  className, 
  containerClassName, 
  ...props 
}: BlurImageProps) => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [imgSrc, setImgSrc] = useState<string | undefined>(undefined);

  useEffect(() => {
    // Reset loading state when src changes
    if (src) {
      setIsLoaded(false);
      
      const img = new Image();
      img.src = src;
      img.onload = () => {
        setImgSrc(src);
        setIsLoaded(true);
      };
      img.onerror = () => {
        console.error(`Failed to load image: ${src}`);
        setIsLoaded(true); // Still mark as "loaded" to remove blur effect
      };
    }
  }, [src]);

  return (
    <div className={cn("relative overflow-hidden", containerClassName)}>
      {/* Low quality placeholder */}
      <div 
        className={cn(
          "absolute inset-0 bg-muted animate-pulse",
          isLoaded && "animate-none opacity-0 transition-opacity duration-300"
        )} 
      />
      
      {/* Main image */}
      {imgSrc && (
        <img
          src={imgSrc}
          alt={alt || ""}
          className={cn(
            "transition-all duration-500 ease-in-out",
            !isLoaded && "scale-110 blur-md",
            isLoaded && "scale-100 blur-0",
            className
          )}
          {...props}
        />
      )}
    </div>
  );
};

export default BlurImage;
