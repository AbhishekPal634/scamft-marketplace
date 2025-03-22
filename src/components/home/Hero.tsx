
import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import BlurImage from "@/components/ui/BlurImage";
import { useNFTStore, NFT } from "@/services/nftService";

const Hero = () => {
  const { nfts, fetchNFTs, isLoading } = useNFTStore();
  const [featuredNFTs, setFeaturedNFTs] = useState<NFT[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    if (nfts.length === 0) {
      fetchNFTs().then(data => {
        setFeaturedNFTs(data.slice(0, 3));
      });
    } else {
      // Select 3 NFTs for the hero carousel
      setFeaturedNFTs(nfts.slice(0, 3));
    }
  }, [nfts, fetchNFTs]);

  useEffect(() => {
    if (featuredNFTs.length === 0) return;
    
    // Auto-rotate featured NFTs every 5 seconds
    const interval = setInterval(() => {
      setCurrentIndex((prevIndex) => 
        prevIndex === featuredNFTs.length - 1 ? 0 : prevIndex + 1
      );
    }, 5000);
    
    return () => clearInterval(interval);
  }, [featuredNFTs]);

  const currentNFT = featuredNFTs[currentIndex];

  return (
    <section className="relative w-full overflow-hidden">
      {/* Gradient Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-secondary via-background to-background opacity-70 z-10" />
      
      {/* Background Image (blurred and dimmed) */}
      {currentNFT && (
        <div className="absolute inset-0 z-0">
          <img 
            src={currentNFT.image}
            alt="Background"
            className="w-full h-full object-cover scale-110 blur-xl opacity-40"
          />
        </div>
      )}
      
      <div className="relative z-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 min-h-[75vh] flex items-center">
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-8 items-center">
          {/* Text Content - Centered vertically */}
          <div className="lg:col-span-3 space-y-6 flex flex-col justify-center">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, ease: "easeOut" }}
            >
              <span className="inline-block px-3 py-1 rounded-full text-xs font-medium bg-primary/10 text-primary mb-4">
                Welcome to ScamFT Marketplace
              </span>
              
              <h1 className="text-4xl sm:text-5xl font-medium tracking-tight leading-tight md:leading-tight">
                Discover, Collect, and Sell Extraordinary NFTs
              </h1>
              
              <p className="mt-4 text-muted-foreground text-lg">
                Explore our curated collection of premium digital art NFTs from top creators around the world.
              </p>
            </motion.div>
            
            <motion.div 
              className="flex flex-wrap gap-4 pt-4"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2, ease: "easeOut" }}
            >
              <Button asChild size="lg" className="rounded-full px-6">
                <Link to="/explore">
                  Explore Collection
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
              
              <Button asChild variant="outline" size="lg" className="rounded-full px-6">
                <Link to="/about">Learn More</Link>
              </Button>
            </motion.div>
            
            {/* Stats Section - Moved up to be part of the text section */}
            <motion.div 
              className="mt-8 grid grid-cols-2 sm:grid-cols-4 gap-4"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.3, ease: "easeOut" }}
            >
              {[
                { label: "Artists", value: "3.2K+" },
                { label: "Artworks", value: "12K+" },
                { label: "Sales", value: "$8.2M+" },
                { label: "Community", value: "15K+" },
              ].map((stat, index) => (
                <motion.div
                  key={stat.label}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: 0.3 + index * 0.1, ease: "easeOut" }}
                  className="text-center"
                >
                  <div className="font-medium text-xl sm:text-2xl">{stat.value}</div>
                  <div className="text-muted-foreground text-sm">{stat.label}</div>
                </motion.div>
              ))}
            </motion.div>
          </div>
          
          {/* Featured NFT Display */}
          <motion.div
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
            className="relative lg:col-span-2"
          >
            {currentNFT && (
              <div className="glass rounded-2xl overflow-hidden shadow-xl">
                <BlurImage
                  src={currentNFT.image}
                  alt={currentNFT.title}
                  className="aspect-square w-full object-cover"
                />
                
                <div className="p-4">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="font-medium text-lg">{currentNFT.title}</h3>
                      <div className="flex items-center mt-1">
                        <img 
                          src={currentNFT.creator.avatar} 
                          alt={currentNFT.creator.name}
                          className="w-5 h-5 rounded-full mr-2"
                        />
                        <span className="text-xs text-muted-foreground">
                          {currentNFT.creator.name}
                        </span>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-xs text-muted-foreground">Price</div>
                      <div className="font-medium text-sm">${currentNFT.price.toFixed(2)}</div>
                    </div>
                  </div>
                </div>
              </div>
            )}
            
            {/* Carousel Indicators */}
            <div className="flex justify-center space-x-2 mt-3">
              {featuredNFTs.map((_, index) => (
                <button
                  key={index}
                  className={`w-2 h-2 rounded-full transition-all duration-300 ${
                    index === currentIndex 
                      ? "bg-primary w-4" 
                      : "bg-muted-foreground/30 hover:bg-muted-foreground/50"
                  }`}
                  onClick={() => setCurrentIndex(index)}
                  aria-label={`View featured NFT ${index + 1}`}
                />
              ))}
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
};

export default Hero;
