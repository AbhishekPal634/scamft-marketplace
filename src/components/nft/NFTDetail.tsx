
import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { 
  Heart, 
  Share2, 
  ExternalLink, 
  Eye, 
  Tag, 
  Clock, 
  ShoppingCart,
  Sparkles
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import BlurImage from "@/components/ui/BlurImage";
import { NFT, useNFTStore } from "@/services/nftService";
import { useCartStore } from "@/services/cartService";
import { findSimilarNFTs } from "@/services/searchService";
import NFTCard from "./NFTCard";

const NFTDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { getNFTById, fetchNFTs, toggleLike } = useNFTStore();
  const addToCart = useCartStore((state) => state.addItem);
  const { toast } = useToast();
  
  const [nft, setNft] = useState<NFT | undefined>(undefined);
  const [loading, setLoading] = useState(true);
  const [similarNFTs, setSimilarNFTs] = useState<NFT[]>([]);
  
  useEffect(() => {
    const initPage = async () => {
      setLoading(true);
      
      // Fetch NFTs if not already loaded
      await fetchNFTs();
      
      if (id) {
        const nftData = getNFTById(id);
        if (nftData) {
          setNft(nftData);
          
          // Find similar NFTs using vector search
          const similar = await findSimilarNFTs(id);
          setSimilarNFTs(similar);
        } else {
          navigate('/not-found', { replace: true });
        }
      }
      
      setLoading(false);
    };
    
    initPage();
  }, [id, getNFTById, fetchNFTs, navigate]);
  
  const handleAddToCart = () => {
    if (nft) {
      addToCart(nft);
      toast({
        title: "Added to cart",
        description: `${nft.title} has been added to your cart`,
      });
    }
  };
  
  const handleLike = () => {
    if (nft) {
      toggleLike(nft.id);
    }
  };
  
  const handleShare = () => {
    // In a real app, implement proper sharing functionality
    if (nft) {
      navigator.clipboard.writeText(window.location.href);
      toast({
        title: "Link copied!",
        description: "NFT link copied to clipboard",
      });
    }
  };
  
  if (loading) {
    return (
      <div className="page-container py-32 flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Loading NFT details...</p>
        </div>
      </div>
    );
  }
  
  if (!nft) {
    return (
      <div className="page-container py-32 flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h2 className="text-2xl font-medium">NFT Not Found</h2>
          <p className="mt-2 text-muted-foreground">
            The NFT you're looking for doesn't exist or has been removed.
          </p>
          <Button onClick={() => navigate(-1)} variant="outline" className="mt-6">
            Go Back
          </Button>
        </div>
      </div>
    );
  }
  
  return (
    <div className="page-container py-32 min-h-screen">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
        {/* NFT Image */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="relative"
        >
          <div className="rounded-2xl overflow-hidden glass shadow-lg">
            <BlurImage
              src={nft.image}
              alt={nft.title}
              className="w-full aspect-square object-cover"
            />
          </div>
          
          {/* NFT Details Card - Mobile Only */}
          <div className="block lg:hidden mt-8">
            <NFTDetailsMobile nft={nft} onLike={handleLike} onShare={handleShare} onAddToCart={handleAddToCart} />
          </div>
        </motion.div>
        
        {/* NFT Info */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="hidden lg:block"
        >
          <NFTDetailsDesktop nft={nft} onLike={handleLike} onShare={handleShare} onAddToCart={handleAddToCart} />
        </motion.div>
      </div>
      
      {/* Similar NFTs Section */}
      {similarNFTs.length > 0 && (
        <motion.div
          className="mt-24"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.4 }}
        >
          <div className="flex items-center mb-8">
            <Sparkles className="w-5 h-5 mr-2 text-primary" />
            <h2 className="section-title">Similar NFTs</h2>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {similarNFTs.map((similar) => (
              <NFTCard key={similar.id} nft={similar} />
            ))}
          </div>
        </motion.div>
      )}
    </div>
  );
};

interface NFTDetailsProps {
  nft: NFT;
  onLike: () => void;
  onShare: () => void;
  onAddToCart: () => void;
}

const NFTDetailsDesktop = ({ nft, onLike, onShare, onAddToCart }: NFTDetailsProps) => (
  <div className="space-y-8">
    <div>
      <div className="flex items-center mb-2">
        <div className="text-sm text-muted-foreground">Created by</div>
        <div className="flex items-center ml-2">
          <img
            src={nft.creator.avatar}
            alt={nft.creator.name}
            className="w-6 h-6 rounded-full mr-2"
          />
          <span className="font-medium">{nft.creator.name}</span>
        </div>
      </div>
      
      <h1 className="text-3xl font-medium">{nft.title}</h1>
      
      <div className="flex items-center mt-4 space-x-4 text-sm">
        <div className="flex items-center">
          <Eye className="w-4 h-4 mr-1.5 text-muted-foreground" />
          <span>{nft.views} views</span>
        </div>
        <div className="flex items-center">
          <Heart className={`w-4 h-4 mr-1.5 ${nft.isLiked ? "text-red-500 fill-red-500" : "text-muted-foreground"}`} />
          <span>{nft.likes} likes</span>
        </div>
        <div className="flex items-center">
          <Clock className="w-4 h-4 mr-1.5 text-muted-foreground" />
          <span>{new Date(nft.createdAt).toLocaleDateString()}</span>
        </div>
      </div>
    </div>
    
    <div className="glass rounded-xl p-6">
      <div className="flex items-center justify-between">
        <div>
          <div className="text-sm text-muted-foreground">Current Price</div>
          <div className="text-3xl font-medium mt-1">{nft.price} ETH</div>
          <div className="text-sm text-muted-foreground mt-1">≈ ${(nft.price * 2150).toFixed(2)} USD</div>
        </div>
        
        <div>
          <div className="text-sm text-muted-foreground">Editions</div>
          <div className="text-xl font-medium mt-1">
            {nft.editions.available} of {nft.editions.total}
          </div>
        </div>
      </div>
      
      <div className="mt-6 flex space-x-4">
        <Button 
          onClick={onAddToCart} 
          className="flex-1 rounded-full"
          size="lg"
        >
          <ShoppingCart className="mr-2 h-4 w-4" />
          Add to Cart
        </Button>
        
        <Button
          onClick={onLike}
          variant={nft.isLiked ? "default" : "outline"}
          size="icon"
          className={`rounded-full h-12 w-12 ${
            nft.isLiked ? "bg-primary/10 text-primary hover:bg-primary/20" : ""
          }`}
        >
          <Heart className={`h-5 w-5 ${nft.isLiked ? "fill-current" : ""}`} />
        </Button>
        
        <Button
          onClick={onShare}
          variant="outline"
          size="icon"
          className="rounded-full h-12 w-12"
        >
          <Share2 className="h-5 w-5" />
        </Button>
      </div>
    </div>
    
    <div>
      <h2 className="text-xl font-medium mb-4">Description</h2>
      <p className="text-muted-foreground leading-relaxed">{nft.description}</p>
    </div>
    
    <div>
      <h2 className="text-xl font-medium mb-4">Details</h2>
      <div className="space-y-3">
        <div className="flex items-center justify-between py-2 border-b border-border">
          <div className="flex items-center text-muted-foreground">
            <Tag className="w-4 h-4 mr-2" />
            Category
          </div>
          <div className="font-medium capitalize">{nft.category}</div>
        </div>
        
        <div className="flex items-start justify-between py-2 border-b border-border">
          <div className="flex items-center text-muted-foreground">
            <Tag className="w-4 h-4 mr-2" />
            Tags
          </div>
          <div className="text-right">
            <div className="flex flex-wrap justify-end gap-2">
              {nft.tags.map((tag) => (
                <span 
                  key={tag} 
                  className="inline-block px-2.5 py-0.5 bg-secondary text-xs rounded-full"
                >
                  {tag}
                </span>
              ))}
            </div>
          </div>
        </div>
        
        <div className="flex items-center justify-between py-2 border-b border-border">
          <div className="flex items-center text-muted-foreground">
            <Clock className="w-4 h-4 mr-2" />
            Created
          </div>
          <div className="font-medium">
            {new Date(nft.createdAt).toLocaleDateString(undefined, {
              year: "numeric",
              month: "long",
              day: "numeric",
            })}
          </div>
        </div>
      </div>
    </div>
  </div>
);

const NFTDetailsMobile = ({ nft, onLike, onShare, onAddToCart }: NFTDetailsProps) => (
  <div className="glass rounded-xl p-5 space-y-5">
    <div>
      <div className="flex items-center mb-1">
        <img
          src={nft.creator.avatar}
          alt={nft.creator.name}
          className="w-5 h-5 rounded-full mr-1.5"
        />
        <span className="text-sm">{nft.creator.name}</span>
      </div>
      
      <h1 className="text-xl font-medium">{nft.title}</h1>
      
      <div className="flex items-center mt-2 space-x-3 text-xs text-muted-foreground">
        <div className="flex items-center">
          <Eye className="w-3.5 h-3.5 mr-1" />
          <span>{nft.views}</span>
        </div>
        <div className="flex items-center">
          <Heart className={`w-3.5 h-3.5 mr-1 ${nft.isLiked ? "text-red-500 fill-red-500" : ""}`} />
          <span>{nft.likes}</span>
        </div>
      </div>
    </div>
    
    <div className="flex items-center justify-between">
      <div>
        <div className="text-xs text-muted-foreground">Price</div>
        <div className="text-xl font-medium">{nft.price} ETH</div>
        <div className="text-xs text-muted-foreground">≈ ${(nft.price * 2150).toFixed(2)}</div>
      </div>
      
      <div className="text-right">
        <div className="text-xs text-muted-foreground">Editions</div>
        <div className="font-medium">
          {nft.editions.available} of {nft.editions.total}
        </div>
      </div>
    </div>
    
    <div className="pt-1 flex space-x-3">
      <Button 
        onClick={onAddToCart} 
        className="flex-1"
        size="sm"
      >
        <ShoppingCart className="mr-1.5 h-4 w-4" />
        Add to Cart
      </Button>
      
      <Button
        onClick={onLike}
        variant={nft.isLiked ? "default" : "outline"}
        size="icon"
        className={`h-9 w-9 ${
          nft.isLiked ? "bg-primary/10 text-primary hover:bg-primary/20" : ""
        }`}
      >
        <Heart className={`h-4 w-4 ${nft.isLiked ? "fill-current" : ""}`} />
      </Button>
      
      <Button
        onClick={onShare}
        variant="outline"
        size="icon"
        className="h-9 w-9"
      >
        <Share2 className="h-4 w-4" />
      </Button>
    </div>
    
    <div>
      <h2 className="text-sm font-medium mb-1.5">Description</h2>
      <p className="text-xs text-muted-foreground">{nft.description}</p>
    </div>
    
    <div className="flex flex-wrap gap-1.5">
      {nft.tags.map((tag) => (
        <span 
          key={tag} 
          className="inline-block px-2 py-0.5 bg-secondary text-xs rounded-full"
        >
          {tag}
        </span>
      ))}
    </div>
  </div>
);

export default NFTDetail;
