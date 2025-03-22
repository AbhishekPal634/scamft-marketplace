
import { useEffect, useState } from 'react';
import { useNFTStore, NFT } from '@/services/nftService';
import NFTCard from './NFTCard';
import { Loader2 } from 'lucide-react';

interface RelatedNFTsProps {
  currentNftId: string;
  tags: string[];
}

const RelatedNFTs = ({ currentNftId, tags }: RelatedNFTsProps) => {
  const { nfts, fetchNFTs, isLoading } = useNFTStore();
  const [relatedNFTs, setRelatedNFTs] = useState<NFT[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Get related NFTs based on shared tags, excluding the current NFT
    if (nfts.length > 0) {
      const related = nfts
        .filter(
          (nft) => 
            nft.id !== currentNftId && 
            nft.tags?.some((tag) => tags.includes(tag))
        )
        .slice(0, 4); // Limit to 4 related items
      
      setRelatedNFTs(related);
      setLoading(false);
    } else {
      // Fetch NFTs if not already loaded
      fetchNFTs().then(() => setLoading(false));
    }
  }, [nfts, currentNftId, tags, fetchNFTs]);

  if (loading || isLoading) {
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
