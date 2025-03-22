import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowLeft, Heart, Share2, Download, ShoppingCart, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/components/ui/use-toast";
import BlurImage from "@/components/ui/BlurImage";
import { useNFTStore, NFT } from "@/services/nftService";
import { useCartStore } from "@/services/cartService";
import { useAuth } from "@/context/AuthContext";
import RelatedNFTs from "./RelatedNFTs";

const NFTDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { nfts, isLoading } = useNFTStore();
  const { addItem } = useCartStore();
  const { user } = useAuth();
  
  const [nft, setNft] = useState<NFT | null>(null);
  const [isLiked, setIsLiked] = useState(false);
  const [isAddingToCart, setIsAddingToCart] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  
  useEffect(() => {
    if (nfts.length > 0 && id) {
      const foundNFT = nfts.find(item => item.id === id);
      if (foundNFT) {
        setNft(foundNFT);
      } else {
        // NFT not found, redirect to 404
        navigate("/404");
      }
    }
  }, [nfts, id, navigate]);
  
  const handleAddToCart = () => {
    if (!nft) return;
    
    setIsAddingToCart(true);
    
    // Simulate API call delay
    setTimeout(() => {
      addItem(nft);
      
      toast({
        title: "Added to cart",
        description: `${nft.title} has been added to your cart.`,
      });
      
      setIsAddingToCart(false);
    }, 600);
  };
  
  const handleLike = () => {
    setIsLiked(!isLiked);
    
    toast({
      title: isLiked ? "Removed from favorites" : "Added to favorites",
      description: isLiked 
        ? `${nft?.title} has been removed from your favorites.`
        : `${nft?.title} has been added to your favorites.`,
    });
  };
  
  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: nft?.title,
        text: `Check out this amazing NFT: ${nft?.title}`,
        url: window.location.href,
      }).catch(console.error);
    } else {
      // Fallback for browsers that don't support the Web Share API
      navigator.clipboard.writeText(window.location.href);
      
      toast({
        title: "Link copied",
        description: "NFT link has been copied to clipboard.",
      });
    }
  };
  
  const handleDownload = async () => {
    if (!nft) return;
    
    // Check if user is authenticated
    if (!user) {
      toast({
        title: "Authentication required",
        description: "Please sign in to download this NFT.",
        variant: "destructive",
      });
      navigate("/login");
      return;
    }
    
    setIsDownloading(true);
    
    try {
      // In a real app, you would check if the user has purchased this NFT
      // For now, we'll just simulate a download
      
      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Download the image
      const link = document.createElement('a');
      link.href = nft.image;
      link.download = `${nft.title.replace(/\s+/g, '-').toLowerCase()}.jpg`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      toast({
        title: "Download started",
        description: "Your NFT is being downloaded.",
      });
    } catch (error) {
      toast({
        title: "Download failed",
        description: "There was an error downloading the NFT. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsDownloading(false);
    }
  };
  
  if (isLoading || !nft) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }
  
  return (
    <div className="page-container pt-28 pb-16">
      {/* Back Button */}
      <button
        onClick={() => navigate(-1)}
        className="flex items-center text-sm text-muted-foreground hover:text-foreground mb-6 transition-colors"
      >
        <ArrowLeft className="h-4 w-4 mr-1" />
        Back
      </button>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12">
        {/* NFT Image */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div className="glass rounded-2xl overflow-hidden">
            <BlurImage
              src={nft.image}
              alt={nft.title}
              className="w-full aspect-square object-cover"
            />
          </div>
        </motion.div>
        
        {/* NFT Details */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="space-y-6"
        >
          <div>
            <div className="flex items-start justify-between">
              <div>
                <h1 className="text-3xl font-medium">{nft.title}</h1>
                <div className="flex items-center mt-2">
                  <img 
                    src={nft.creator.avatar} 
                    alt={nft.creator.name}
                    className="w-6 h-6 rounded-full mr-2"
                  />
                  <span className="text-sm text-muted-foreground">
                    Created by <span className="text-foreground">{nft.creator.name}</span>
                  </span>
                </div>
              </div>
              
              <div className="flex space-x-2">
                <Button
                  variant="outline"
                  size="icon"
                  className="rounded-full"
                  onClick={handleLike}
                >
                  <Heart className={`h-4 w-4 ${isLiked ? 'fill-primary text-primary' : ''}`} />
                </Button>
                <Button
                  variant="outline"
                  size="icon"
                  className="rounded-full"
                  onClick={handleShare}
                >
                  <Share2 className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="icon"
                  className="rounded-full"
                  onClick={handleDownload}
                  disabled={isDownloading}
                >
                  {isDownloading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Download className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </div>
            
            <div className="flex flex-wrap gap-2 mt-4">
              {nft.tags?.map((tag) => (
                <Badge key={tag} variant="secondary">
                  {tag}
                </Badge>
              ))}
            </div>
          </div>
          
          <Separator />
          
          {/* Price and Purchase */}
          <div className="glass rounded-xl p-4">
            <div className="flex justify-between items-center">
              <div>
                <div className="text-sm text-muted-foreground">Current Price</div>
                <div className="text-2xl font-medium">{nft.price} ETH</div>
                <div className="text-sm text-muted-foreground">
                  ≈ ${(nft.price * 1800).toFixed(2)} USD
                </div>
              </div>
              
              <div className="flex gap-3">
                <Button
                  variant="outline"
                  className="rounded-full"
                  onClick={() => navigate("/checkout")}
                >
                  Buy Now
                </Button>
                <Button
                  className="rounded-full"
                  onClick={handleAddToCart}
                  disabled={isAddingToCart}
                >
                  {isAddingToCart ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Adding...
                    </>
                  ) : (
                    <>
                      <ShoppingCart className="mr-2 h-4 w-4" />
                      Add to Cart
                    </>
                  )}
                </Button>
              </div>
            </div>
          </div>
          
          {/* Tabs for Description, Details, etc. */}
          <Tabs defaultValue="description" className="mt-6">
            <TabsList>
              <TabsTrigger value="description">Description</TabsTrigger>
              <TabsTrigger value="details">Details</TabsTrigger>
              <TabsTrigger value="history">History</TabsTrigger>
            </TabsList>
            
            <TabsContent value="description" className="space-y-4 mt-4">
              <p className="text-muted-foreground">
                {nft.description}
              </p>
            </TabsContent>
            
            <TabsContent value="details" className="space-y-4 mt-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="glass rounded-lg p-4">
                  <div className="text-sm text-muted-foreground">Contract Address</div>
                  <div className="font-mono text-sm truncate">0x1a2b3c4d5e6f7g8h9i0j1k2l3m4n5o6p7q8r9s0t</div>
                </div>
                
                <div className="glass rounded-lg p-4">
                  <div className="text-sm text-muted-foreground">Token ID</div>
                  <div className="font-mono text-sm">{nft.id.substring(0, 8)}</div>
                </div>
                
                <div className="glass rounded-lg p-4">
                  <div className="text-sm text-muted-foreground">Token Standard</div>
                  <div>ERC-721</div>
                </div>
                
                <div className="glass rounded-lg p-4">
                  <div className="text-sm text-muted-foreground">Blockchain</div>
                  <div>Ethereum</div>
                </div>
              </div>
            </TabsContent>
            
            <TabsContent value="history" className="space-y-4 mt-4">
              <div className="glass rounded-lg divide-y divide-border">
                <div className="p-4 flex justify-between items-center">
                  <div className="flex items-center">
                    <img 
                      src={nft.creator.avatar} 
                      alt={nft.creator.name}
                      className="w-8 h-8 rounded-full mr-3"
                    />
                    <div>
                      <div className="font-medium">Minted</div>
                      <div className="text-sm text-muted-foreground">by {nft.creator.name}</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm text-muted-foreground">2 months ago</div>
                  </div>
                </div>
                
                <div className="p-4 flex justify-between items-center">
                  <div className="flex items-center">
                    <img 
                      src="https://api.dicebear.com/7.x/avataaars/svg?seed=Felix"
                      alt="User"
                      className="w-8 h-8 rounded-full mr-3"
                    />
                    <div>
                      <div className="font-medium">Listed</div>
                      <div className="text-sm text-muted-foreground">for {nft.price} ETH</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm text-muted-foreground">1 month ago</div>
                  </div>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </motion.div>
      </div>
      
      {/* Related NFTs */}
      <div className="mt-16">
        <h2 className="text-2xl font-medium mb-6">More like this</h2>
        <RelatedNFTs currentNftId={nft.id} tags={nft.tags || []} />
      </div>
    </div>
  );
};

export default NFTDetail;
