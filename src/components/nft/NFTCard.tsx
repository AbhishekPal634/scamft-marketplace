
import { useState } from "react";
import { Link } from "react-router-dom";
import { Heart, Share2, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import BlurImage from "@/components/ui/BlurImage";
import { NFT, useNFTStore } from "@/services/nftService";
import { useCartStore } from "@/services/cartService";

interface NFTCardProps {
  nft: NFT;
  minimal?: boolean;
}

const NFTCard = ({ nft, minimal = false }: NFTCardProps) => {
  const [isHovered, setIsHovered] = useState(false);
  const toggleLike = useNFTStore((state) => state.toggleLike);
  const addToCart = useCartStore((state) => state.addItem);
  const { toast } = useToast();
  
  const handleLike = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    toggleLike(nft.id);
  };
  
  const handleShare = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    // In a real app, implement proper sharing functionality
    navigator.clipboard.writeText(window.location.origin + `/nft/${nft.id}`);
    
    toast({
      title: "Link copied!",
      description: "NFT link copied to clipboard",
    });
  };
  
  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    addToCart(nft);
    
    toast({
      title: "Added to cart",
      description: `${nft.title} has been added to your cart`,
    });
  };
  
  return (
    <Link
      to={`/nft/${nft.id}`}
      className="block"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div 
        className={`group rounded-xl overflow-hidden transition-all duration-300 border border-border hover:border-primary/20 hover:shadow-lg ${
          isHovered ? "shadow-md" : ""
        }`}
      >
        {/* NFT Image */}
        <div className="relative aspect-square overflow-hidden bg-secondary/30">
          <BlurImage
            src={nft.image}
            alt={nft.title}
            className={`w-full h-full object-cover transition-transform duration-500 ${
              isHovered ? "scale-105" : "scale-100"
            }`}
          />
          
          {/* Overlay on hover with actions */}
          <div className={`absolute inset-0 bg-black/40 flex items-center justify-center transition-opacity duration-300 ${
            isHovered ? "opacity-100" : "opacity-0"
          }`}>
            {!minimal && (
              <div className="flex space-x-2">
                <Button
                  onClick={handleAddToCart}
                  variant="secondary"
                  size="sm"
                  className="backdrop-blur-md bg-white/20 border-white/10 text-white hover:bg-white/30"
                >
                  Add to Cart
                </Button>
                <Button
                  onClick={handleShare}
                  variant="outline"
                  size="icon"
                  className="backdrop-blur-md bg-white/10 border-white/10 text-white hover:bg-white/20"
                >
                  <Share2 className="h-4 w-4" />
                </Button>
              </div>
            )}
          </div>
          
          {/* Like button */}
          <Button
            onClick={handleLike}
            variant="outline"
            size="icon"
            className={`absolute top-3 right-3 h-8 w-8 rounded-full backdrop-blur-md ${
              nft.isLiked
                ? "bg-white text-red-500 border-white/10 hover:bg-white/90"
                : "bg-white/10 text-white border-white/10 hover:bg-white/30"
            }`}
          >
            <Heart className={`h-4 w-4 ${nft.isLiked ? "fill-current" : ""}`} />
          </Button>
        </div>
        
        {/* Card content */}
        <div className="p-4">
          <div className="flex items-start justify-between">
            <div>
              <h3 className="font-medium line-clamp-1">{nft.title}</h3>
              
              {!minimal && (
                <div className="flex items-center mt-1">
                  <img
                    src={nft.creator.avatar}
                    alt={nft.creator.name}
                    className="w-5 h-5 rounded-full mr-1.5"
                  />
                  <span className="text-xs text-muted-foreground">
                    {nft.creator.name}
                  </span>
                </div>
              )}
            </div>
            
            <div className="text-right">
              <div className="text-xs text-muted-foreground">Price</div>
              <div className="font-medium">{nft.price} ETH</div>
            </div>
          </div>
          
          {!minimal && (
            <div className="mt-3 flex justify-between items-center text-xs text-muted-foreground">
              <div>Edition {nft.editions.available} of {nft.editions.total}</div>
              <div className="flex items-center space-x-3">
                <span>{nft.likes} likes</span>
                <span>{nft.views} views</span>
              </div>
            </div>
          )}
        </div>
      </div>
    </Link>
  );
};

export default NFTCard;
