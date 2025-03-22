
import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Loader2, User, Plus, Settings, ShoppingBag, Download } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import NFTCard from "@/components/nft/NFTCard";
import { NFT } from "@/services/nftService";

interface Profile {
  id: string;
  username: string;
  full_name: string;
  avatar_url: string;
}

interface SupabaseNFT {
  id: string;
  title: string;
  description: string | null;
  price: number;
  image_url: string;
  category: string | null;
  tags: string[] | null;
  created_at: string | null;
  editions_total: number | null;
  editions_available: number | null;
  likes: number | null;
  views: number | null;
  creator_id: string | null;
}

interface PurchaseItem {
  id: string;
  nft_id: string;
  price_per_item: number;
  quantity: number;
  nft: SupabaseNFT;
}

interface Purchase {
  id: string;
  created_at: string;
  total_amount: number;
  status: string;
  items: PurchaseItem[];
}

const Profile = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [userNFTs, setUserNFTs] = useState<NFT[]>([]);
  const [purchases, setPurchases] = useState<Purchase[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchProfile();
      fetchUserNFTs();
      fetchUserPurchases();
    }
  }, [user]);

  // Helper function to map Supabase NFT to frontend NFT model
  const mapSupabaseNFTtoModel = (supabaseNFT: SupabaseNFT): NFT => {
    return {
      id: supabaseNFT.id,
      title: supabaseNFT.title,
      description: supabaseNFT.description || "",
      price: supabaseNFT.price,
      image: supabaseNFT.image_url,
      image_url: supabaseNFT.image_url, // Keep this for compatibility
      category: (supabaseNFT.category as "art" | "photography" | "music" | "video" | "collectible") || "art",
      tags: supabaseNFT.tags || [],
      createdAt: supabaseNFT.created_at || new Date().toISOString(),
      created_at: supabaseNFT.created_at, // Keep this for compatibility
      editions: {
        total: supabaseNFT.editions_total || 1,
        available: supabaseNFT.editions_available || 0
      },
      editions_total: supabaseNFT.editions_total, // Keep this for compatibility
      editions_available: supabaseNFT.editions_available, // Keep this for compatibility
      likes: supabaseNFT.likes || 0,
      views: supabaseNFT.views || 0,
      creator: {
        id: supabaseNFT.creator_id || "unknown",
        name: "Artist", // Default value, ideally you'd fetch the creator name
        avatar: "https://i.pravatar.cc/150?img=1" // Default avatar
      }
    };
  };

  const fetchProfile = async () => {
    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user?.id)
        .single();

      if (error) throw error;
      
      if (data) {
        setProfile(data);
      }
    } catch (error: any) {
      console.error("Error fetching profile:", error.message);
      toast({
        title: "Error fetching profile",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchUserNFTs = async () => {
    try {
      // Fetch NFTs that the user has purchased
      const { data: purchaseItems, error } = await supabase
        .from("purchase_items")
        .select(`
          id,
          nft_id,
          purchase:purchases(user_id, status)
        `)
        .eq("purchase.user_id", user?.id)
        .eq("purchase.status", "completed");

      if (error) throw error;

      if (purchaseItems && purchaseItems.length > 0) {
        // Extract unique NFT IDs
        const nftIds = [...new Set(purchaseItems.map(item => item.nft_id))];
        
        // Fetch the actual NFT data
        const { data: nftsData, error: nftsError } = await supabase
          .from("nfts")
          .select("*")
          .in("id", nftIds);

        if (nftsError) throw nftsError;
        
        if (nftsData) {
          // Map Supabase NFTs to our frontend model
          const mappedNFTs = nftsData.map(nft => mapSupabaseNFTtoModel(nft));
          setUserNFTs(mappedNFTs);
        }
      } else {
        setUserNFTs([]);
      }
    } catch (error: any) {
      console.error("Error fetching user NFTs:", error.message);
      toast({
        title: "Error fetching your NFTs",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const fetchUserPurchases = async () => {
    try {
      // Fetch all purchases by the user
      const { data: purchasesData, error } = await supabase
        .from("purchases")
        .select("*")
        .eq("user_id", user?.id)
        .order("created_at", { ascending: false });

      if (error) throw error;

      if (purchasesData && purchasesData.length > 0) {
        // For each purchase, fetch the related items
        const purchasesWithItems = await Promise.all(
          purchasesData.map(async (purchase) => {
            const { data: items, error: itemsError } = await supabase
              .from("purchase_items")
              .select(`
                id,
                nft_id,
                price_per_item,
                quantity,
                nft:nfts(*)
              `)
              .eq("purchase_id", purchase.id);

            if (itemsError) throw itemsError;

            return {
              ...purchase,
              items: items || [],
            };
          })
        );

        setPurchases(purchasesWithItems);
      } else {
        setPurchases([]);
      }
    } catch (error: any) {
      console.error("Error fetching user purchases:", error.message);
      toast({
        title: "Error fetching your purchases",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleDownloadNFT = async (nft: any) => {
    try {
      // In a real app, you might generate and download a certificate or token
      // Here we'll just download the image
      const image = nft.image_url || nft.image;
      const link = document.createElement('a');
      link.href = image;
      link.download = `${nft.title.replace(/\s+/g, '-').toLowerCase()}.jpg`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      toast({
        title: "NFT Downloaded",
        description: `${nft.title} has been downloaded successfully.`,
      });
    } catch (error: any) {
      toast({
        title: "Download Failed",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col min-h-screen">
        <Navbar />
        <main className="flex-grow flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />
      <main className="flex-grow pt-28 pb-16">
        <div className="container px-4 mx-auto">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5 }}
          >
            {/* Profile Header */}
            <div className="flex flex-col md:flex-row items-center md:items-start gap-6 mb-10">
              <div className="flex-shrink-0">
                <div className="w-24 h-24 md:w-32 md:h-32 rounded-full overflow-hidden bg-gray-200 border-4 border-primary/20">
                  {profile?.avatar_url ? (
                    <img 
                      src={profile.avatar_url} 
                      alt={profile.username || "User"} 
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-secondary text-muted-foreground">
                      <User className="h-12 w-12" />
                    </div>
                  )}
                </div>
              </div>
              
              <div className="flex-1 text-center md:text-left">
                <h1 className="text-2xl md:text-3xl font-bold">
                  {profile?.full_name || "NFT Collector"}
                </h1>
                <div className="text-muted-foreground">
                  @{profile?.username || user?.email?.split('@')[0]}
                </div>
                
                <div className="mt-4 flex flex-wrap gap-2 justify-center md:justify-start">
                  <Button variant="outline" size="sm">
                    <Settings className="mr-2 h-4 w-4" />
                    Edit Profile
                  </Button>
                </div>
              </div>
            </div>
            
            {/* Profile Content */}
            <Tabs defaultValue="collection" className="space-y-4">
              <TabsList className="space-x-2">
                <TabsTrigger value="collection">My Collection</TabsTrigger>
                <TabsTrigger value="purchases">Purchases</TabsTrigger>
                <TabsTrigger value="favorites">Favorites</TabsTrigger>
              </TabsList>
              
              <TabsContent value="collection" className="space-y-6">
                {userNFTs.length === 0 ? (
                  <div className="text-center py-12 glass rounded-lg">
                    <ShoppingBag className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-xl font-medium mb-2">No NFTs yet</h3>
                    <p className="text-muted-foreground mb-6">
                      Your NFT collection will appear here once you purchase or create NFTs.
                    </p>
                    <Button 
                      className="rounded-full"
                      onClick={() => location.href = "/explore"}
                    >
                      <Plus className="mr-2 h-4 w-4" />
                      Browse NFTs
                    </Button>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                    {userNFTs.map((nft) => (
                      <div key={nft.id} className="relative group">
                        <NFTCard nft={nft} />
                        <div className="absolute inset-0 bg-black/70 rounded-lg opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity duration-200">
                          <Button 
                            variant="outline" 
                            size="sm" 
                            className="rounded-full"
                            onClick={() => handleDownloadNFT(nft)}
                          >
                            <Download className="mr-2 h-4 w-4" />
                            Download
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </TabsContent>
              
              <TabsContent value="purchases" className="space-y-6">
                {purchases.length === 0 ? (
                  <div className="text-center py-12 glass rounded-lg">
                    <ShoppingBag className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-xl font-medium mb-2">No purchases yet</h3>
                    <p className="text-muted-foreground mb-6">
                      Your purchase history will appear here once you buy NFTs.
                    </p>
                    <Button 
                      className="rounded-full"
                      onClick={() => location.href = "/explore"}
                    >
                      Start Shopping
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-8">
                    {purchases.map((purchase) => (
                      <div key={purchase.id} className="glass rounded-xl overflow-hidden">
                        <div className="bg-secondary/30 p-4 flex justify-between items-center">
                          <div>
                            <span className="text-xs text-muted-foreground">Order ID</span>
                            <h3 className="font-medium">{purchase.id.split('-')[0]}...</h3>
                          </div>
                          <div>
                            <span className="text-xs text-muted-foreground">Date</span>
                            <p className="font-medium">
                              {new Date(purchase.created_at).toLocaleDateString()}
                            </p>
                          </div>
                          <div>
                            <span className="text-xs text-muted-foreground">Total</span>
                            <p className="font-medium">${purchase.total_amount.toFixed(2)}</p>
                          </div>
                          <div>
                            <span className={`px-2 py-1 rounded-full text-xs ${
                              purchase.status === 'completed' 
                                ? 'bg-green-500/10 text-green-500' 
                                : 'bg-yellow-500/10 text-yellow-500'
                            }`}>
                              {purchase.status === 'completed' ? 'Completed' : 'Processing'}
                            </span>
                          </div>
                        </div>
                        
                        <div className="p-4">
                          <h4 className="text-sm font-medium mb-3">Items</h4>
                          <div className="space-y-3">
                            {purchase.items.map((item) => (
                              <div key={item.id} className="flex items-center gap-4 p-2 rounded-lg hover:bg-secondary/20">
                                <div className="h-12 w-12 rounded overflow-hidden">
                                  <img 
                                    src={item.nft?.image_url} 
                                    alt={item.nft?.title || 'NFT'} 
                                    className="h-full w-full object-cover"
                                  />
                                </div>
                                <div className="flex-1 min-w-0">
                                  <h5 className="font-medium truncate">
                                    {item.nft?.title || 'NFT'}
                                  </h5>
                                  <p className="text-xs text-muted-foreground">
                                    Qty: {item.quantity} × ${item.price_per_item}
                                  </p>
                                </div>
                                <Button 
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleDownloadNFT(item.nft)}
                                  className="rounded-full"
                                >
                                  <Download className="h-4 w-4" />
                                </Button>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </TabsContent>
              
              <TabsContent value="favorites" className="text-center py-12 glass rounded-lg">
                <div className="h-12 w-12 text-muted-foreground mx-auto mb-4">❤️</div>
                <h3 className="text-xl font-medium mb-2">No favorites yet</h3>
                <p className="text-muted-foreground mb-6">
                  NFTs you like will appear here.
                </p>
                <Button 
                  className="rounded-full"
                  onClick={() => location.href = "/explore"}
                >
                  Explore NFTs
                </Button>
              </TabsContent>
            </Tabs>
          </motion.div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default Profile;
