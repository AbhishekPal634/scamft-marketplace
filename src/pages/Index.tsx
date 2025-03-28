import { useEffect } from "react";
import { useNFTStore } from "../services/nftService";
import Navbar from "../components/layout/Navbar";
import Footer from "../components/layout/Footer";
import Hero from "../components/home/Hero";
import FeaturedNFTs from "../components/home/FeaturedNFTs";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { Button } from "../components/ui/button";
import { ArrowRight, Rocket, Shield, Zap } from "lucide-react";

const Index = () => {
  const { fetchNFTs } = useNFTStore();
  
  useEffect(() => {
    // Pre-fetch NFTs when the home page loads
    fetchNFTs();
  }, [fetchNFTs]);

  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />
      
      <main className="flex-grow">
        {/* Hero Section */}
        <Hero />
        
        {/* How It Works Section - Moved up to be right after Hero */}
        <section className="page-section bg-gradient-to-b from-background to-secondary/30">
          <div className="page-container">
            <div className="text-left max-w-3xl mb-12">
              <motion.h2 
                className="section-title"
                initial={{ opacity: 0, y: 10 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5 }}
              >
                How ScamFT Works
              </motion.h2>
              <motion.p 
                className="section-description"
                initial={{ opacity: 0, y: 10 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: 0.1 }}
              >
                Buy, sell, and discover exclusive digital assets in just a few simple steps
              </motion.p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {[
                {
                  icon: <Rocket className="h-8 w-8" />,
                  title: "Discover NFTs",
                  description: "Browse through our curated collection of premium digital art from top creators worldwide."
                },
                {
                  icon: <Shield className="h-8 w-8" />,
                  title: "Buy Securely",
                  description: "Purchase NFTs with confidence using our secure payment system. Every transaction is safe and transparent."
                },
                {
                  icon: <Zap className="h-8 w-8" />,
                  title: "Grow Your Collection",
                  description: "Build your digital art collection and track your NFT portfolio as values evolve over time."
                }
              ].map((step, index) => (
                <motion.div
                  key={step.title}
                  className="glass p-6 rounded-xl"
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: 0.2 + index * 0.1 }}
                >
                  <div className="rounded-full bg-primary/10 p-3 inline-block text-primary mb-4">
                    {step.icon}
                  </div>
                  <h3 className="text-xl font-medium mb-2">{step.title}</h3>
                  <p className="text-muted-foreground">{step.description}</p>
                </motion.div>
              ))}
            </div>
            
            <div className="mt-12 text-center">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: 0.5 }}
              >
                <Button asChild size="lg" className="rounded-full px-8">
                  <Link to="/explore">
                    Start Exploring
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
              </motion.div>
            </div>
          </div>
        </section>
        
        {/* Featured NFTs */}
        <FeaturedNFTs />
        
        {/* CTA Banner */}
        <section className="page-section">
          <div className="page-container">
            <motion.div
              className="glass rounded-2xl p-10 sm:p-16 bg-gradient-to-br from-primary/5 to-secondary/10 border border-white/10 relative overflow-hidden"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
            >
              {/* Background blur elements */}
              <div className="absolute -top-24 -right-24 w-64 h-64 rounded-full bg-primary/10 blur-3xl opacity-60" />
              <div className="absolute -bottom-32 -left-32 w-80 h-80 rounded-full bg-primary/5 blur-3xl opacity-60" />
              
              <div className="relative z-10 text-center max-w-2xl mx-auto space-y-6">
                <h2 className="text-3xl sm:text-4xl font-medium">Ready to start your NFT journey?</h2>
                <p className="text-muted-foreground text-lg">
                  Join thousands of collectors and artists in the world's most elegant digital art marketplace
                </p>
                <div className="flex flex-wrap justify-center gap-4 pt-2">
                  <Button asChild size="lg" className="rounded-full px-8">
                    <Link to="/explore">Explore Marketplace</Link>
                  </Button>
                  <Button asChild variant="outline" size="lg" className="rounded-full px-8">
                    <Link to="/about">Learn More</Link>
                  </Button>
                </div>
              </div>
            </motion.div>
          </div>
        </section>
      </main>
      
      <Footer />
    </div>
  );
};

export default Index;
