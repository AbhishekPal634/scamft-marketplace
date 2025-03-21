
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNFTStore, NFT } from "@/services/nftService";
import NFTCard from "@/components/nft/NFTCard";

const FeaturedNFTs = () => {
  const { nfts, fetchNFTs } = useNFTStore();
  const [featured, setFeatured] = useState<NFT[]>([]);
  
  useEffect(() => {
    if (nfts.length === 0) {
      fetchNFTs().then(data => {
        setFeatured(data.slice(0, 4));
      });
    } else {
      setFeatured(nfts.slice(0, 4));
    }
  }, [nfts, fetchNFTs]);
  
  // Animation variants for staggered children
  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
      }
    }
  };
  
  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0, transition: { duration: 0.5, ease: "easeOut" } }
  };

  return (
    <section className="page-section">
      <div className="page-container">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-10">
          <div>
            <motion.h2 
              className="section-title"
              initial={{ opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5 }}
            >
              Featured Artworks
            </motion.h2>
            <motion.p 
              className="section-description"
              initial={{ opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.1 }}
            >
              Discover our curated selection of unique digital collectibles
            </motion.p>
          </div>
          
          <motion.div
            initial={{ opacity: 0, x: -10 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            <Button asChild variant="ghost" className="group">
              <Link to="/explore">
                View All
                <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
              </Link>
            </Button>
          </motion.div>
        </div>
        
        <motion.div 
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6"
          variants={containerVariants}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, margin: "-100px" }}
        >
          {featured.map((nft) => (
            <motion.div key={nft.id} variants={itemVariants}>
              <NFTCard nft={nft} />
            </motion.div>
          ))}
        </motion.div>
        
        {/* Simplified categories section */}
        <motion.div 
          className="mt-16 grid grid-cols-2 sm:grid-cols-4 gap-4"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.6, delay: 0.3 }}
        >
          {[
            { name: "Art", count: "1.2K+" },
            { name: "Photography", count: "800+" },
            { name: "Music", count: "350+" },
            { name: "Collectibles", count: "620+" }
          ].map((category) => (
            <Link 
              key={category.name}
              to={`/explore?category=${category.name.toLowerCase()}`}
              className="relative overflow-hidden rounded-xl h-28 flex items-center justify-center group transition-all hover:shadow-md"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-primary/10 to-secondary z-0" />
              <div className="relative z-10 text-center">
                <h3 className="font-medium text-lg">{category.name}</h3>
                <p className="text-sm text-muted-foreground">{category.count} items</p>
              </div>
              <div className="absolute inset-0 bg-primary/5 opacity-0 group-hover:opacity-100 transition-opacity" />
            </Link>
          ))}
        </motion.div>
      </div>
    </section>
  );
};

export default FeaturedNFTs;
