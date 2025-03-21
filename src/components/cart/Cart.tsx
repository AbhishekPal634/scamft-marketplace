
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { ShoppingCart, ArrowRight, ShoppingBag, CreditCard } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/components/ui/use-toast";
import { useCartStore } from "@/services/cartService";
import CartItem from "./CartItem";

const Cart = () => {
  const { items, removeItem, updateQuantity, clearCart, getTotal } = useCartStore();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isCheckingOut, setIsCheckingOut] = useState(false);
  
  const handleCheckout = () => {
    setIsCheckingOut(true);
    
    // Simulate checkout process
    setTimeout(() => {
      navigate("/checkout");
      setIsCheckingOut(false);
    }, 800);
  };
  
  const handleClearCart = () => {
    // Confirmation before clearing cart
    if (window.confirm("Are you sure you want to clear your cart?")) {
      clearCart();
      toast({
        title: "Cart cleared",
        description: "All items have been removed from your cart",
      });
    }
  };
  
  if (items.length === 0) {
    return (
      <motion.div 
        className="flex flex-col items-center justify-center py-16 px-4 text-center"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div className="rounded-full bg-secondary p-6 mb-6">
          <ShoppingBag className="h-8 w-8 text-muted-foreground" />
        </div>
        <h2 className="text-2xl font-medium mb-2">Your cart is empty</h2>
        <p className="text-muted-foreground max-w-md mb-6">
          Looks like you haven't added any NFTs to your cart yet. Explore our marketplace to find unique digital art.
        </p>
        <Button asChild>
          <a href="/explore">
            Browse NFTs
            <ArrowRight className="ml-2 h-4 w-4" />
          </a>
        </Button>
      </motion.div>
    );
  }
  
  // Calculate totals
  const subtotal = getTotal();
  const serviceFee = subtotal * 0.025; // 2.5% service fee
  const total = subtotal + serviceFee;
  
  return (
    <motion.div 
      className="space-y-8"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
    >
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-medium flex items-center">
          <ShoppingCart className="mr-2 h-5 w-5" />
          Your Cart ({items.length})
        </h2>
        
        {items.length > 1 && (
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={handleClearCart}
            className="text-muted-foreground hover:text-destructive"
          >
            Clear Cart
          </Button>
        )}
      </div>
      
      {/* Cart Items */}
      <div className="space-y-4">
        {items.map(item => (
          <CartItem
            key={item.nft.id}
            item={item}
            onRemove={removeItem}
            onUpdateQuantity={updateQuantity}
          />
        ))}
      </div>
      
      {/* Order Summary */}
      <div className="mt-8 glass rounded-xl p-6">
        <h3 className="font-medium mb-4 text-lg">Order Summary</h3>
        
        <div className="space-y-2">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Subtotal</span>
            <span>{subtotal.toFixed(4)} ETH</span>
          </div>
          
          <div className="flex justify-between">
            <span className="text-muted-foreground">Service Fee (2.5%)</span>
            <span>{serviceFee.toFixed(4)} ETH</span>
          </div>
          
          <Separator className="my-3" />
          
          <div className="flex justify-between font-medium">
            <span>Total</span>
            <div className="text-right">
              <div>{total.toFixed(4)} ETH</div>
              <div className="text-xs text-muted-foreground">≈ ${(total * 2150).toFixed(2)} USD</div>
            </div>
          </div>
        </div>
        
        <Button 
          className="w-full mt-6 rounded-full"
          size="lg"
          onClick={handleCheckout}
          disabled={isCheckingOut}
        >
          {isCheckingOut ? (
            <>
              <span className="mr-2">Processing...</span>
              <span className="animate-spin h-4 w-4 border-2 border-current border-t-transparent rounded-full" />
            </>
          ) : (
            <>
              <CreditCard className="mr-2 h-4 w-4" />
              Checkout
            </>
          )}
        </Button>
        
        <p className="text-xs text-center text-muted-foreground mt-4">
          Secure checkout powered by Ethereum blockchain. All transactions are final.
        </p>
      </div>
    </motion.div>
  );
};

export default Cart;
