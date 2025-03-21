
import { useState } from "react";
import { Link } from "react-router-dom";
import { Trash2, Minus, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import BlurImage from "@/components/ui/BlurImage";
import { CartItem as CartItemType } from "@/services/cartService";

interface CartItemProps {
  item: CartItemType;
  onRemove: (id: string) => void;
  onUpdateQuantity: (id: string, quantity: number) => void;
}

const CartItem = ({ item, onRemove, onUpdateQuantity }: CartItemProps) => {
  const [isRemoving, setIsRemoving] = useState(false);
  
  const handleRemove = () => {
    setIsRemoving(true);
    // Add a small delay to allow animation to play
    setTimeout(() => {
      onRemove(item.nft.id);
    }, 300);
  };
  
  const decreaseQuantity = () => {
    if (item.quantity > 1) {
      onUpdateQuantity(item.nft.id, item.quantity - 1);
    } else {
      handleRemove();
    }
  };
  
  const increaseQuantity = () => {
    // Don't allow quantity to exceed available editions
    if (item.quantity < item.nft.editions.available) {
      onUpdateQuantity(item.nft.id, item.quantity + 1);
    }
  };
  
  return (
    <div 
      className={`flex gap-4 p-4 rounded-lg border border-border transition-all duration-300 ${
        isRemoving ? "opacity-0 transform translate-x-4" : "opacity-100"
      }`}
    >
      {/* NFT Image */}
      <Link to={`/nft/${item.nft.id}`} className="flex-shrink-0">
        <div className="h-20 w-20 sm:h-24 sm:w-24 rounded-md overflow-hidden">
          <BlurImage
            src={item.nft.image}
            alt={item.nft.title}
            className="h-full w-full object-cover"
          />
        </div>
      </Link>
      
      {/* NFT Details */}
      <div className="flex-1 min-w-0 flex flex-col justify-between">
        <div>
          <Link to={`/nft/${item.nft.id}`} className="hover:text-primary transition-colors">
            <h3 className="font-medium truncate">{item.nft.title}</h3>
          </Link>
          <p className="text-xs text-muted-foreground mt-1">
            by {item.nft.creator.name}
          </p>
        </div>
        
        <div className="flex items-center mt-2">
          <div className="text-xs text-muted-foreground mr-4">
            Available: {item.nft.editions.available} of {item.nft.editions.total}
          </div>
        </div>
      </div>
      
      {/* Quantity Controls */}
      <div className="flex flex-col items-end justify-between">
        <div className="text-right">
          <div className="font-medium">{item.nft.price} ETH</div>
          <div className="text-xs text-muted-foreground">
            ≈ ${(item.nft.price * item.quantity * 2150).toFixed(2)}
          </div>
        </div>
        
        <div className="flex items-center space-x-1 mt-2">
          <Button
            variant="outline"
            size="icon"
            className="h-7 w-7 rounded-full"
            onClick={decreaseQuantity}
            disabled={isRemoving}
          >
            <Minus className="h-3 w-3" />
          </Button>
          
          <span className="w-8 text-center text-sm">{item.quantity}</span>
          
          <Button
            variant="outline"
            size="icon"
            className="h-7 w-7 rounded-full"
            onClick={increaseQuantity}
            disabled={isRemoving || item.quantity >= item.nft.editions.available}
          >
            <Plus className="h-3 w-3" />
          </Button>
          
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7 rounded-full text-muted-foreground hover:text-destructive ml-2"
            onClick={handleRemove}
            disabled={isRemoving}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
};

export default CartItem;
