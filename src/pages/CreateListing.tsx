import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { supabase } from "../integrations/supabase/client";
import Navbar from "../components/layout/Navbar";
import Footer from "../components/layout/Footer";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Textarea } from "../components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../components/ui/select";
import { Loader2, Upload } from "lucide-react";
import { useToast } from "../components/ui/use-toast";

const CreateListing = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState("");
  const [category, setCategory] = useState("art");
  const [tags, setTags] = useState("");
  const [prompt, setPrompt] = useState("");
  const [editionsTotal, setEditionsTotal] = useState("1");
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  
  const categories = [
    { value: "art", label: "Art" },
    { value: "photography", label: "Photography" },
    { value: "music", label: "Music" },
    { value: "collectible", label: "Collectible" },
    { value: "video", label: "Video" }
  ];
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user) {
      toast({
        title: "Authentication Required",
        description: "You must be logged in to create an NFT listing.",
        variant: "destructive",
      });
      return;
    }
    
    if (!title || !description || !price || !prompt) {
      toast({
        title: "Missing Fields",
        description: "Please fill in all required fields.",
        variant: "destructive",
      });
      return;
    }
    
    try {
      setIsLoading(true);
      
      // Generate a UUID for the NFT
      const nftId = crypto.randomUUID();
      
      // Generate image using Hugging Face API via edge function
      toast({
        title: "Generating NFT Image",
        description: "This may take a moment...",
      });
      
      const { data: imageData, error: imageError } = await supabase.functions.invoke("generate-nft-image", {
        body: { prompt, nftId }
      });
      
      if (imageError) {
        throw new Error(`Failed to generate image: ${imageError.message}`);
      }
      
      const imageUrl = imageData.imageUrl;
      
      // Process tags
      const tagArray = tags.split(",").map(tag => tag.trim()).filter(tag => tag.length > 0);
      
      // Insert NFT into database
      const { error: insertError } = await supabase
        .from("nfts")
        .insert([{
          id: nftId,
          title,
          description,
          price: parseFloat(price),
          creator_id: user.id,
          image_url: imageUrl,
          category,
          tags: tagArray,
          editions_total: parseInt(editionsTotal),
          editions_available: parseInt(editionsTotal),
        }]);
      
      if (insertError) {
        throw new Error(`Failed to create NFT: ${insertError.message}`);
      }
      
      // Generate embedding for search
      const { error: embeddingError } = await supabase.functions.invoke("generate-embedding", {
        body: { 
          nftId, 
          title, 
          description, 
          tags: tagArray 
        }
      });
      
      if (embeddingError) {
        console.error("Warning: Failed to generate embedding:", embeddingError);
        // Continue anyway as this is not critical
      }
      
      toast({
        title: "Success",
        description: "Your NFT has been listed successfully.",
      });
      
      // Navigate to the NFT detail page
      navigate(`/nft/${nftId}`);
      
    } catch (error) {
      console.error("Error creating NFT:", error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to create NFT",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  const generatePreview = async () => {
    if (!prompt) {
      toast({
        title: "Missing Prompt",
        description: "Please enter an image prompt first.",
        variant: "destructive",
      });
      return;
    }
    
    try {
      setIsLoading(true);
      
      const { data, error } = await supabase.functions.invoke("generate-nft-image", {
        body: { prompt, nftId: "preview" }
      });
      
      if (error) {
        throw new Error(`Failed to generate preview: ${error.message}`);
      }
      
      setPreviewImage(data.imageUrl);
      
      toast({
        title: "Preview Generated",
        description: "Your image preview has been generated.",
      });
    } catch (error) {
      console.error("Error generating preview:", error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to generate preview",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
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
              You need to be signed in to create an NFT listing.
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
          <h1 className="text-3xl font-bold mb-8">Create NFT Listing</h1>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
            <div>
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="title">Title</Label>
                  <Input
                    id="title"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="Enter NFT title"
                    required
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Describe your NFT"
                    rows={4}
                    required
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="price">Price (ETH)</Label>
                  <Input
                    id="price"
                    type="number"
                    value={price}
                    onChange={(e) => setPrice(e.target.value)}
                    placeholder="0.05"
                    step="0.01"
                    min="0.01"
                    required
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="category">Category</Label>
                  <Select value={category} onValueChange={setCategory}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a category" />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map((cat) => (
                        <SelectItem key={cat.value} value={cat.value}>
                          {cat.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="tags">Tags (comma separated)</Label>
                  <Input
                    id="tags"
                    value={tags}
                    onChange={(e) => setTags(e.target.value)}
                    placeholder="digital, art, abstract"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="editions">Number of Editions</Label>
                  <Input
                    id="editions"
                    type="number"
                    value={editionsTotal}
                    onChange={(e) => setEditionsTotal(e.target.value)}
                    placeholder="1"
                    min="1"
                    max="100"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="prompt">Image Generation Prompt</Label>
                  <Textarea
                    id="prompt"
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    placeholder="Describe the image you want to generate for your NFT"
                    rows={3}
                    required
                  />
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={generatePreview}
                    disabled={isLoading || !prompt}
                  >
                    {isLoading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                    Generate Preview
                  </Button>
                </div>
                
                <Button type="submit" className="w-full" disabled={isLoading}>
                  {isLoading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                  Create NFT Listing
                </Button>
              </form>
            </div>
            
            <div className="flex flex-col items-center">
              <div className="w-full max-w-md aspect-square bg-secondary rounded-lg overflow-hidden mb-4">
                {previewImage ? (
                  <img 
                    src={previewImage} 
                    alt="NFT Preview" 
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex flex-col items-center justify-center p-6 text-center">
                    <Upload className="h-16 w-16 mb-4 text-muted-foreground" />
                    <p className="text-muted-foreground">
                      Enter a prompt and click "Generate Preview" to see your NFT image
                    </p>
                  </div>
                )}
              </div>
              
              <div className="text-center">
                <h3 className="font-medium">Preview</h3>
                <p className="text-sm text-muted-foreground">
                  This is how your NFT will appear in the marketplace
                </p>
              </div>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default CreateListing;
