
import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Loader2, User, Plus, Settings, ShoppingBag } from "lucide-react";
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

const Profile = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [userNFTs, setUserNFTs] = useState<NFT[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchProfile();
      fetchUserNFTs();
    }
  }, [user]);

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
      // For now, use the mock NFTs
      // In a real app, you would fetch from Supabase
      setUserNFTs([]);
    } catch (error: any) {
      console.error("Error fetching NFTs:", error.message);
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
                      <NFTCard key={nft.id} nft={nft} />
                    ))}
                  </div>
                )}
              </TabsContent>
              
              <TabsContent value="purchases" className="text-center py-12 glass rounded-lg">
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
