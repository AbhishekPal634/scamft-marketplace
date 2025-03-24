
import { useState } from "react";
import { Link } from "react-router-dom";
import { Heart, Share2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import BlurImage from "@/components/ui/BlurImage";
import { NFT, useNFTStore } from "@/services/nftService";
import { useCartStore } from "@/services/cartService";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/context/AuthContext";

interface NFTCardProps {
  nft: NFT;
  minimal?: boolean;
}

const NFTCard = ({ nft, minimal = false }: NFTCardProps) => {
  const [isHovered, setIsHovered] = useState(false);
  const toggleLike = useNFTStore((state) => state.toggleLike);
  const addToCart = useCartStore((state) => state.addItem);
  const { toast } = useToast();
  const { user } = useAuth();
  
  const handleLike = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (!user) {
      toast({
        title: "Authentication required",
        description: "Please sign in to like this NFT",
        variant: "destructive"
      });
      return;
    }
    
    try {
      // Update local state immediately for UI responsiveness
      toggleLike(nft.id);
      
      // Get current likes count from the database
      const { data: currentNft } = await supabase
        .from('nfts')
        .select('likes')
        .eq('id', nft.id)
        .single();
        
      // Determine new likes count based on whether the user is liking or unliking
      const newLikesCount = nft.isLiked 
        ? Math.max((currentNft?.likes || 0) - 1, 0) // Unliking - subtract 1, but don't go below 0
        : (currentNft?.likes || 0) + 1; // Liking - add 1
        
      // Update the likes count in the database
      await supabase
        .from('nfts')
        .update({ likes: newLikesCount })
        .eq('id', nft.id);
    } catch (error) {
      console.error("Error updating likes:", error);
      
      // Revert the local state change if the API call failed
      toggleLike(nft.id);
      
      toast({
        title: "Error",
        description: "Could not update like status",
        variant: "destructive"
      });
    }
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
              
              {!minimal && nft.creator && nft.creator.name && (
                <div className="flex items-center mt-1">
                  <img
                    src={nft.creator.avatar || "/placeholder.svg"}
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
              <div className="font-medium">${nft.price.toFixed(2)}</div>
            </div>
          </div>
          
          {!minimal && (
            <div className="mt-3 flex justify-between items-center text-xs text-muted-foreground">
              <div className="flex items-center">
                <Heart className={`h-3 w-3 mr-1 ${nft.isLiked ? "fill-red-500 text-red-500" : ""}`} />
                <span>{nft.likes} likes</span>
              </div>
            </div>
          )}
        </div>
      </div>
    </Link>
  );
};

export default NFTCard;
