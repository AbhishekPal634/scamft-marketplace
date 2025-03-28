import { useEffect, useState } from 'react';
import { NFT } from '../../services/nftService';
import { findSimilarNFTs } from '../../services/searchService';
import NFTCard from './NFTCard';
import { Loader2 } from 'lucide-react';

interface RelatedNFTsProps {
  currentNftId: string;
  tags: string[];
}

const RelatedNFTs = ({ currentNftId }: RelatedNFTsProps) => {
  const [relatedNFTs, setRelatedNFTs] = useState<NFT[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchRelatedNFTs = async () => {
      try {
        setLoading(true);
        
        // Use vector search to find similar NFTs
        const similarNFTs = await findSimilarNFTs(currentNftId, 4);
        setRelatedNFTs(similarNFTs);
      } catch (error) {
        console.error("Error fetching related NFTs:", error);
      } finally {
        setLoading(false);
      }
    };

    // Fetch related NFTs when the component mounts or currentNftId changes
    if (currentNftId) {
      fetchRelatedNFTs();
    }
  }, [currentNftId]);

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (relatedNFTs.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        No related NFTs found.
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
      {relatedNFTs.map((nft) => (
        <NFTCard key={nft.id} nft={nft} />
      ))}
    </div>
  );
};

export default RelatedNFTs;
