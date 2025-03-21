
import { Link } from "react-router-dom";
import { Twitter, Instagram, Github, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/components/ui/use-toast";

const Footer = () => {
  const { toast } = useToast();
  
  const handleSubscribe = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    toast({
      title: "Thank you for subscribing!",
      description: "You'll receive our newsletter with the latest updates.",
    });
    const form = e.target as HTMLFormElement;
    form.reset();
  };
  
  return (
    <footer className="bg-secondary/50 border-t border-border">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-16 pb-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12">
          {/* Brand & About */}
          <div className="space-y-4 md:col-span-1">
            <Link to="/" className="text-xl font-semibold inline-flex items-center">
              <span className="bg-primary/10 text-primary px-2 py-1 rounded-md mr-1">Scam</span>
              <span>FT</span>
            </Link>
            <p className="text-muted-foreground text-sm mt-4">
              Your marketplace for unique digital art NFTs. Find, collect, and trade exclusive digital assets.
            </p>
            <div className="flex space-x-4 pt-2">
              <Button variant="ghost" size="icon" className="rounded-full h-8 w-8">
                <Twitter className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="icon" className="rounded-full h-8 w-8">
                <Instagram className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="icon" className="rounded-full h-8 w-8">
                <Github className="h-4 w-4" />
              </Button>
            </div>
          </div>
          
          {/* Navigation */}
          <div>
            <h3 className="font-medium text-sm mb-4 text-foreground">Marketplace</h3>
            <ul className="space-y-3">
              {["All NFTs", "Art", "Photography", "Music", "Video"].map((item) => (
                <li key={item}>
                  <Link 
                    to="/explore" 
                    className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {item}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
          
          <div>
            <h3 className="font-medium text-sm mb-4 text-foreground">Account</h3>
            <ul className="space-y-3">
              {["Profile", "Favorites", "Watchlist", "My Collections", "Settings"].map((item) => (
                <li key={item}>
                  <Link 
                    to="/" 
                    className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {item}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
          
          {/* Newsletter */}
          <div className="md:col-span-1">
            <h3 className="font-medium text-sm mb-4 text-foreground">Stay Updated</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Subscribe to our newsletter for updates on new drops and features.
            </p>
            <form onSubmit={handleSubscribe} className="space-y-2">
              <Input
                type="email"
                placeholder="Enter your email"
                required
                className="bg-background/50"
              />
              <Button type="submit" className="w-full">
                Subscribe
              </Button>
            </form>
          </div>
        </div>
        
        <div className="border-t border-border mt-12 pt-8 flex flex-col sm:flex-row justify-between items-center">
          <p className="text-xs text-muted-foreground">
            © {new Date().getFullYear()} ScamFT. All rights reserved.
          </p>
          <div className="flex flex-wrap justify-center gap-4 mt-4 sm:mt-0">
            {["Terms", "Privacy", "Support"].map((item) => (
              <Link 
                key={item}
                to="/" 
                className="text-xs text-muted-foreground hover:text-foreground transition-colors"
              >
                {item}
              </Link>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
