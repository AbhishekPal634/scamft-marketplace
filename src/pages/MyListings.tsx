
import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import NFTCard from "@/components/nft/NFTCard";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader2, PlusCircle } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { NFT } from "@/services/nftService";

const MyListings = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(true);
  const [myNfts, setMyNfts] = useState<NFT[]>([]);
  const [activeTab, setActiveTab] = useState("listings");
  
  useEffect(() => {
    const fetchMyListings = async () => {
      if (!user) return;
      
      try {
        setIsLoading(true);
        
        // First fetch profile details to get creator name
        const { data: profileData } = await supabase
          .from("profiles")
          .select("*")
          .eq("id", user.id)
          .single();
        
        const creatorName = profileData?.full_name || user.user_metadata?.full_name || user.email;
        const creatorAvatar = profileData?.avatar_url || user.user_metadata?.avatar_url || "/placeholder.svg";
        
        // Then fetch the NFTs
        const { data, error } = await supabase
          .from("nfts")
          .select("*")
          .eq("creator_id", user.id)
          .order("created_at", { ascending: false });
        
        if (error) {
          throw new Error(`Failed to fetch listings: ${error.message}`);
        }
        
        // Map the data to match the NFT interface
        const mappedNfts = data.map(nft => ({
          id: nft.id,
          title: nft.title || "Untitled NFT",
          description: nft.description || "",
          price: typeof nft.price === 'number' ? nft.price : parseFloat(String(nft.price)) || 0,
          image: nft.image_url || "/placeholder.svg",
          image_url: nft.image_url || "/placeholder.svg",
          creator: {
            id: nft.creator_id || "0",
            name: creatorName,
            avatar: creatorAvatar,
          },
          createdAt: nft.created_at || new Date().toISOString(),
          tags: nft.tags || [],
          category: nft.category || "Art",
          editions: {
            total: nft.editions_total || 1,
            available: nft.editions_available || 1,
          },
          likes: nft.likes || 0,
          views: nft.views || 0,
          isLiked: false,
          listed: nft.listed !== false, // Add the listed property with default true if not specified
          owner_id: nft.owner_id || nft.creator_id, // Add owner_id property
        }));
        
        setMyNfts(mappedNfts);
        
      } catch (error) {
        console.error("Error fetching listings:", error);
        toast({
          title: "Error",
          description: error instanceof Error ? error.message : "Failed to fetch your listings",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchMyListings();
  }, [user, toast]);
  
  const fetchSales = async () => {
    // Implement this in the future when you have a sales table
    toast({
      title: "Coming Soon",
      description: "Sales tracking will be available in a future update.",
    });
  };
  
  if (!user) {
    return (
      <div className="flex flex-col min-h-screen">
        <Navbar />
        <main className="flex-grow flex items-center justify-center">
          <div className="text-center">
            <h1 className="text-2xl font-medium mb-2">Please Sign In</h1>
            <p className="text-muted-foreground mb-6">
              You need to be signed in to view your listings.
            </p>
            <Button onClick={() => navigate("/login")}>Sign In</Button>
          </div>
        </main>
        <Footer />
      </div>
    );
  }
  
  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />
      <main className="flex-grow">
        <div className="page-container py-10">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8">
            <h1 className="text-3xl font-bold mb-4 md:mb-0">My Listings</h1>
            <Button onClick={() => navigate("/create")} className="flex items-center">
              <PlusCircle className="h-4 w-4 mr-2" />
              Create New Listing
            </Button>
          </div>
          
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="mb-8">
              <TabsTrigger value="listings">My Listings</TabsTrigger>
              <TabsTrigger value="sales">Sales</TabsTrigger>
            </TabsList>
            
            <TabsContent value="listings">
              {isLoading ? (
                <div className="flex justify-center py-12">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
              ) : myNfts.length === 0 ? (
                <div className="text-center py-12">
                  <p className="text-muted-foreground mb-4">
                    You haven't created any NFT listings yet.
                  </p>
                  <Button onClick={() => navigate("/create")}>Create Your First NFT</Button>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                  {myNfts.map((nft) => (
                    <Link to={`/nft/${nft.id}`} key={nft.id}>
                      <NFTCard nft={nft} />
                    </Link>
                  ))}
                </div>
              )}
            </TabsContent>
            
            <TabsContent value="sales">
              <div className="text-center py-12">
                <p className="text-muted-foreground mb-4">
                  Sales tracking will be available in a future update.
                </p>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default MyListings;
