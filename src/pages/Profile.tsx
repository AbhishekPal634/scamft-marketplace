
import { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { useNFTStore, NFT, Purchase } from "@/services/nftService";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import NFTCard from "@/components/nft/NFTCard";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader2, Download } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Link, useSearchParams } from "react-router-dom";

const Profile = () => {
  const { user } = useAuth();
  const { getUserNfts, getUserPurchases } = useNFTStore();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [userNfts, setUserNfts] = useState<NFT[]>([]);
  const [purchases, setPurchases] = useState<Purchase[]>([]);
  const [activeTab, setActiveTab] = useState("collection");
  const [searchParams] = useSearchParams();
  
  useEffect(() => {
    const fetchUserData = async () => {
      if (user) {
        try {
          setLoading(true);
          
          // Get user's NFTs from purchases
          const nfts = await getUserNfts(user.id);
          console.log("Fetched user NFTs:", nfts);
          setUserNfts(nfts);
          
          // Get user's purchase history
          const purchaseHistory = await getUserPurchases(user.id);
          console.log("Fetched purchase history:", purchaseHistory);
          setPurchases(purchaseHistory);
          
          // Check for success parameter in URL
          if (searchParams.get('success') === 'true') {
            toast({
              title: "Purchase Complete!",
              description: "Your NFTs have been added to your collection."
            });
            
            // Set active tab to show purchases if coming from successful checkout
            setActiveTab("purchases");
          }
        } catch (error) {
          console.error("Error fetching user data:", error);
          toast({
            title: "Error",
            description: "Failed to load your profile data. Please try again.",
            variant: "destructive"
          });
        } finally {
          setLoading(false);
        }
      }
    };
    
    fetchUserData();
  }, [user, getUserNfts, getUserPurchases, toast, searchParams]);
  
  const handleDownloadNFT = async (nft: NFT) => {
    try {
      // First check if image URL is from Supabase storage
      if (nft.image && nft.image.includes("ntmogcnenelmbggucipy.supabase.co")) {
        const imagePath = nft.image.split("/").pop();
        
        if (!imagePath) {
          throw new Error("Invalid image URL");
        }
        
        // Download from Supabase storage
        const { data, error } = await supabase.storage
          .from("nft-images")
          .download(imagePath);
          
        if (error) {
          throw error;
        }
        
        // Create download link
        const url = URL.createObjectURL(data);
        const a = document.createElement("a");
        a.href = url;
        a.download = `${nft.title.replace(/\s+/g, "_")}.png`;
        document.body.appendChild(a);
        a.click();
        
        // Clean up
        URL.revokeObjectURL(url);
        document.body.removeChild(a);
      } else {
        // For external images, open in new tab
        window.open(nft.image, "_blank");
      }
      
      toast({
        title: "Success",
        description: "Your NFT image has been downloaded.",
      });
    } catch (error) {
      console.error("Error downloading NFT:", error);
      toast({
        title: "Download Failed",
        description: "There was an error downloading your NFT.",
        variant: "destructive",
      });
    }
  };
  
  if (!user) {
    return (
      <div className="flex flex-col min-h-screen">
        <Navbar />
        <main className="flex-grow flex items-center justify-center">
          <div className="text-center">
            <h1 className="text-2xl font-medium mb-2">Please Sign In</h1>
            <p className="text-muted-foreground mb-6">
              You need to be signed in to view your profile.
            </p>
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
          {/* Profile Header */}
          <div className="mb-10">
            <div className="flex flex-col md:flex-row items-center md:items-start gap-6">
              <div className="rounded-full overflow-hidden w-24 h-24 bg-secondary">
                <img
                  src={user.user_metadata?.avatar_url || "/placeholder.svg"}
                  alt={user.user_metadata?.full_name || "User"}
                  className="w-full h-full object-cover"
                />
              </div>
              
              <div className="text-center md:text-left">
                <h1 className="text-3xl font-medium mb-2">
                  {user.user_metadata?.full_name || "User"}
                </h1>
                <p className="text-muted-foreground mb-3">
                  {user.email}
                </p>
                <div className="flex flex-wrap gap-4 justify-center md:justify-start">
                  <div className="text-center px-4">
                    <p className="font-medium text-xl">{userNfts.length}</p>
                    <p className="text-sm text-muted-foreground">NFTs</p>
                  </div>
                  <div className="text-center px-4">
                    <p className="font-medium text-xl">{purchases.length}</p>
                    <p className="text-sm text-muted-foreground">Purchases</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          {/* Tabs */}
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="mb-8">
              <TabsTrigger value="collection">My Collection</TabsTrigger>
              <TabsTrigger value="purchases">Purchase History</TabsTrigger>
            </TabsList>
            
            <TabsContent value="collection">
              {loading ? (
                <div className="flex justify-center py-12">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
              ) : userNfts.length === 0 ? (
                <div className="text-center py-12">
                  <p className="text-muted-foreground mb-4">
                    You don't have any NFTs in your collection yet.
                  </p>
                  <Button variant="outline" asChild>
                    <Link to="/explore">Browse Marketplace</Link>
                  </Button>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                  {userNfts.map((nft) => (
                    <div key={nft.id} className="group relative">
                      <Link to={`/nft/${nft.id}`}>
                        <NFTCard nft={nft} />
                      </Link>
                      <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-center justify-center">
                        <Button 
                          variant="secondary" 
                          size="sm" 
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            handleDownloadNFT(nft);
                          }}
                          className="backdrop-blur-sm bg-white/20 hover:bg-white/40"
                        >
                          <Download className="h-4 w-4 mr-2" />
                          Download
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </TabsContent>
            
            <TabsContent value="purchases">
              {loading ? (
                <div className="flex justify-center py-12">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
              ) : purchases.length === 0 ? (
                <div className="text-center py-12">
                  <p className="text-muted-foreground mb-4">
                    You haven't made any purchases yet.
                  </p>
                  <Button variant="outline" asChild>
                    <Link to="/explore">Browse Marketplace</Link>
                  </Button>
                </div>
              ) : (
                <div className="space-y-6">
                  {purchases.map((purchase) => (
                    <div key={purchase.id} className="border rounded-lg p-6">
                      <div className="flex flex-col md:flex-row justify-between mb-4">
                        <div>
                          <p className="text-sm text-muted-foreground">
                            Order ID: {purchase.id.substring(0, 8)}...
                          </p>
                          <p className="text-sm text-muted-foreground">
                            Date: {new Date(purchase.created_at).toLocaleDateString()}
                          </p>
                        </div>
                        <div className="md:text-right mt-2 md:mt-0">
                          <p className="font-medium">${parseFloat(purchase.total_amount.toString()).toFixed(2)}</p>
                          <span className="inline-block px-2 py-1 text-xs rounded-full bg-green-100 text-green-800">
                            {purchase.status}
                          </span>
                        </div>
                      </div>
                      
                      <div className="divide-y">
                        {purchase.items.map((item) => (
                          <div key={item.id} className="py-4 flex flex-col sm:flex-row gap-4">
                            <div className="w-full sm:w-24 h-24 bg-secondary rounded-md overflow-hidden">
                              <img
                                src={item.nft?.image || "/placeholder.svg"}
                                alt={item.nft?.title || "NFT"}
                                className="w-full h-full object-cover"
                              />
                            </div>
                            <div className="flex-grow flex flex-col sm:flex-row sm:justify-between">
                              <div>
                                <h3 className="font-medium">
                                  <Link to={`/nft/${item.nft_id}`} className="hover:text-primary transition-colors">
                                    {item.nft?.title || "NFT"}
                                  </Link>
                                </h3>
                                <p className="text-sm text-muted-foreground line-clamp-1">
                                  {item.nft?.description || "No description available"}
                                </p>
                                <p className="text-sm">
                                  Quantity: {item.quantity}
                                </p>
                              </div>
                              <div className="mt-2 sm:mt-0 sm:text-right">
                                <p className="font-medium">${parseFloat(item.price_per_item.toString()).toFixed(2)}</p>
                                <Button 
                                  variant="outline" 
                                  size="sm"
                                  className="mt-2"
                                  onClick={() => item.nft && handleDownloadNFT(item.nft)}
                                >
                                  <Download className="h-4 w-4 mr-2" />
                                  Download
                                </Button>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </TabsContent>
          </Tabs>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default Profile;
