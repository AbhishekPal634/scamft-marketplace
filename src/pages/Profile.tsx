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
import { useCartStore } from "@/services/cartService";

interface PurchaseNFT {
  id: string;
  title: string;
  description: string;
  image_url: string;
}

interface PurchaseItem {
  id: string;
  purchase_id: string;
  nft_id: string;
  quantity: number;
  price_per_item: number;
  nft?: PurchaseNFT;
}

const Profile = () => {
  const { user } = useAuth();
  const { getUserNfts, getUserPurchases } = useNFTStore();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [userNfts, setUserNfts] = useState<NFT[]>([]);
  const [purchases, setPurchases] = useState<Purchase[]>([]);
  const [purchaseItems, setPurchaseItems] = useState<
    Record<string, PurchaseItem[]>
  >({});
  const [activeTab, setActiveTab] = useState("collection");
  const [searchParams] = useSearchParams();
  const { clearCart } = useCartStore();

  useEffect(() => {
    const fetchUserData = async () => {
      if (user) {
        try {
          setLoading(true);

          // Get user's NFTs from purchases
          const nfts = await getUserNfts(user.id);
          setUserNfts(nfts);

          // Get user's purchase history
          const purchaseHistory = await getUserPurchases(user.id);
          setPurchases(purchaseHistory);

          // Check for success parameter in URL
          if (searchParams.get("success") === "true") {
            // Clear cart after successful purchase
            clearCart();

            // Refresh NFT data with a small delay to ensure database updates are complete
            setTimeout(async () => {
              const updatedNfts = await getUserNfts(user.id);
              const updatedPurchases = await getUserPurchases(user.id);
              setUserNfts(updatedNfts);
              setPurchases(updatedPurchases);
            }, 1000);

            toast({
              title: "Purchase Complete!",
              description: "Your NFTs have been added to your collection.",
            });

            // Set active tab to show purchases if coming from successful checkout
            setActiveTab("purchases");
          }
        } catch (error) {
          console.error("Error fetching user data:", error);
          toast({
            title: "Error",
            description: "Failed to load your profile data. Please try again.",
            variant: "destructive",
          });
        } finally {
          setLoading(false);
        }
      }
    };

    fetchUserData();
  }, [user, getUserNfts, getUserPurchases, toast, searchParams, clearCart]);

  useEffect(() => {
    const fetchPurchases = async () => {
      if (!user) return;

      try {
        // Fetch purchases
        const { data: purchasesData, error: purchasesError } = await supabase
          .from("purchases")
          .select("*")
          .eq("user_id", user.id)
          .order("created_at", { ascending: false });

        if (purchasesError) throw purchasesError;

        setPurchases(purchasesData || []);

        // Fetch purchase items for each purchase
        const purchaseIds = purchasesData?.map((p) => p.id) || [];
        if (purchaseIds.length > 0) {
          const { data: itemsData, error: itemsError } = await supabase
            .from("purchase_items")
            .select(
              `
              id,
              purchase_id,
              nft_id,
              quantity,
              price_per_item,
              nft:nfts!inner (
                id,
                title,
                description,
                image_url
              )
            `
            )
            .in("purchase_id", purchaseIds)
            .order("created_at", { ascending: false });

          if (itemsError) throw itemsError;

          // Group items by purchase_id
          const itemsByPurchase = itemsData?.reduce((acc, item: any) => {
            if (!acc[item.purchase_id]) {
              acc[item.purchase_id] = [];
            }

            // Transform the item to match our types
            const purchaseItem: PurchaseItem = {
              id: item.id,
              purchase_id: item.purchase_id,
              nft_id: item.nft_id,
              quantity: item.quantity,
              price_per_item: item.price_per_item,
              nft: item.nft && {
                id: item.nft.id,
                title: item.nft.title,
                description: item.nft.description || "",
                image_url: item.nft.image_url,
              },
            };

            acc[item.purchase_id].push(purchaseItem);
            return acc;
          }, {} as Record<string, PurchaseItem[]>);

          setPurchaseItems(itemsByPurchase || {});
        }
      } catch (error) {
        console.error("Error fetching purchases:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchPurchases();
  }, [user]);

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
                <p className="text-muted-foreground mb-3">{user.email}</p>
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
          <Tabs
            value={activeTab}
            onValueChange={setActiveTab}
            className="w-full"
          >
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
                    <div
                      key={nft.id}
                      className="group relative aspect-square overflow-hidden rounded-xl bg-gray-100"
                    >
                      <img
                        src={nft.image_url}
                        alt={nft.title}
                        className="h-full w-full object-cover transition-transform group-hover:scale-105"
                      />
                      <div className="absolute inset-0 flex items-end bg-gradient-to-t from-black/60 to-transparent p-4 opacity-0 transition-opacity group-hover:opacity-100">
                        <div className="flex w-full items-center justify-between">
                          <div className="flex-1">
                            <h3 className="font-semibold text-white">
                              {nft.title}
                            </h3>
                          </div>
                          <Button
                            variant="secondary"
                            size="sm"
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              if (nft.image_url) {
                                window.open(nft.image_url, "_blank");
                              }
                            }}
                            className="backdrop-blur-sm bg-white/20 hover:bg-white/40"
                          >
                            <Download className="h-4 w-4" />
                          </Button>
                        </div>
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
                <div className="space-y-4">
                  {purchases.map((purchase) => (
                    <div
                      key={purchase.id}
                      className="bg-white rounded-lg shadow overflow-hidden"
                    >
                      {/* Purchase Header */}
                      <div className="p-4 border-b">
                        <div className="flex justify-between items-start">
                          <div>
                            <p className="text-sm text-gray-600">
                              Order ID: {purchase.id}
                            </p>
                            <p className="text-sm text-gray-600 mt-1">
                              Date:{" "}
                              {new Date(
                                purchase.created_at
                              ).toLocaleDateString()}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="text-xl font-semibold">
                              $
                              {parseFloat(
                                purchase.total_amount.toString()
                              ).toFixed(2)}
                            </p>
                          </div>
                        </div>
                      </div>

                      {/* Purchase Items */}
                      <div className="divide-y divide-gray-100">
                        {purchaseItems[purchase.id]?.map((item) => (
                          <div key={item.id} className="p-6">
                            <div className="flex items-start gap-6">
                              {/* NFT Image */}
                              <div className="relative w-32 h-32 flex-shrink-0">
                                <Link to={`/nft/${item.nft_id}`}>
                                  <img
                                    src={
                                      item.nft?.image_url || "/placeholder.svg"
                                    }
                                    alt={item.nft?.title || "NFT"}
                                    className="w-full h-full object-cover rounded-lg"
                                  />
                                </Link>
                                <Button
                                  variant="secondary"
                                  size="sm"
                                  onClick={(e) => {
                                    e.preventDefault();
                                    e.stopPropagation();
                                    if (item.nft?.image_url) {
                                      window.open(item.nft.image_url, "_blank");
                                    }
                                  }}
                                  className="absolute bottom-2 right-2 backdrop-blur-sm bg-black/50 hover:bg-black/70 text-white"
                                >
                                  <Download className="h-4 w-4" />
                                </Button>
                              </div>

                              {/* NFT Details */}
                              <div className="flex-grow">
                                <Link
                                  to={`/nft/${item.nft_id}`}
                                  className="text-lg font-medium hover:text-primary transition-colors"
                                >
                                  {item.nft?.title || "NFT"}
                                </Link>
                                <p className="text-sm text-gray-600 mt-1">
                                  Quantity: {item.quantity} × $
                                  {parseFloat(
                                    item.price_per_item.toString()
                                  ).toFixed(2)}
                                </p>
                                {item.nft?.description && (
                                  <p className="text-sm text-gray-600 mt-2 line-clamp-2">
                                    {item.nft.description}
                                  </p>
                                )}
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
