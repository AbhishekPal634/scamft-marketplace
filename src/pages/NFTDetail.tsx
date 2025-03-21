
import { useEffect } from "react";
import { useParams } from "react-router-dom";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import NFTDetailComponent from "@/components/nft/NFTDetail";
import { useNFTStore } from "@/services/nftService";

const NFTDetail = () => {
  const { id } = useParams<{ id: string }>();
  const { fetchNFTs } = useNFTStore();
  
  useEffect(() => {
    // Ensure NFTs are loaded when viewing details
    fetchNFTs();
  }, [fetchNFTs]);
  
  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />
      <main className="flex-grow">
        <NFTDetailComponent />
      </main>
      <Footer />
    </div>
  );
};

export default NFTDetail;
