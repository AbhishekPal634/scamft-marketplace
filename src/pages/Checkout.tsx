
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { 
  ArrowLeft, 
  CreditCard, 
  WalletCards, 
  Shield, 
  CheckCircle2,
  Loader2
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/components/ui/use-toast";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import { useCartStore } from "@/services/cartService";

const Checkout = () => {
  const navigate = useNavigate();
  const { items, getTotal, clearCart } = useCartStore();
  const { toast } = useToast();
  
  const [paymentMethod, setPaymentMethod] = useState<string>("wallet");
  const [processing, setProcessing] = useState<boolean>(false);
  const [completed, setCompleted] = useState<boolean>(false);
  
  // If cart is empty, redirect to cart page
  if (items.length === 0 && !completed) {
    navigate("/cart");
    return null;
  }
  
  // Calculate totals
  const subtotal = getTotal();
  const serviceFee = subtotal * 0.025; // 2.5% service fee
  const total = subtotal + serviceFee;
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Show processing state
    setProcessing(true);
    
    // Simulate payment processing
    setTimeout(() => {
      setProcessing(false);
      setCompleted(true);
      clearCart();
      
      toast({
        title: "Purchase successful!",
        description: "Your NFTs have been added to your collection.",
      });
    }, 2000);
  };
  
  if (completed) {
    return (
      <div className="flex flex-col min-h-screen">
        <Navbar />
        <main className="flex-grow pt-32 pb-16 flex items-center justify-center">
          <motion.div 
            className="max-w-md w-full text-center glass p-8 rounded-xl space-y-6"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5 }}
          >
            <div className="rounded-full bg-primary/10 p-4 mx-auto w-20 h-20 flex items-center justify-center">
              <CheckCircle2 className="h-10 w-10 text-primary" />
            </div>
            
            <h1 className="text-2xl font-medium">Purchase Complete!</h1>
            
            <p className="text-muted-foreground">
              Thank you for your purchase. Your NFTs have been successfully added to your collection.
            </p>
            
            <div className="pt-4 flex flex-col sm:flex-row gap-4 justify-center">
              <Button
                variant="outline"
                onClick={() => navigate("/explore")}
              >
                Continue Shopping
              </Button>
              
              <Button onClick={() => navigate("/profile")}>
                View My Collection
              </Button>
            </div>
          </motion.div>
        </main>
        <Footer />
      </div>
    );
  }
  
  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />
      <main className="flex-grow pt-28 pb-16">
        <div className="page-container max-w-4xl">
          {/* Back Button */}
          <button
            onClick={() => navigate(-1)}
            className="flex items-center text-sm text-muted-foreground hover:text-foreground mb-6 transition-colors"
          >
            <ArrowLeft className="h-4 w-4 mr-1" />
            Back to Cart
          </button>
          
          <h1 className="text-2xl font-medium mb-8">Checkout</h1>
          
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Main Checkout Form */}
            <div className="lg:col-span-2">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
              >
                <form onSubmit={handleSubmit} className="space-y-8">
                  {/* Payment Method */}
                  <div className="glass rounded-xl p-6 space-y-4">
                    <h2 className="text-lg font-medium">Payment Method</h2>
                    
                    <RadioGroup 
                      defaultValue="wallet" 
                      value={paymentMethod}
                      onValueChange={setPaymentMethod}
                      className="space-y-3"
                    >
                      <div className="flex items-center space-x-3 p-3 rounded-lg border border-border hover:bg-secondary/20 transition-colors cursor-pointer">
                        <RadioGroupItem value="wallet" id="wallet" />
                        <Label htmlFor="wallet" className="flex items-center cursor-pointer flex-1">
                          <WalletCards className="h-5 w-5 mr-3 text-primary" />
                          <div>
                            <div>Crypto Wallet</div>
                            <div className="text-xs text-muted-foreground mt-1">
                              Connect with MetaMask or another web3 wallet
                            </div>
                          </div>
                        </Label>
                      </div>
                      
                      <div className="flex items-center space-x-3 p-3 rounded-lg border border-border hover:bg-secondary/20 transition-colors cursor-pointer">
                        <RadioGroupItem value="card" id="card" />
                        <Label htmlFor="card" className="flex items-center cursor-pointer flex-1">
                          <CreditCard className="h-5 w-5 mr-3 text-primary" />
                          <div>
                            <div>Credit / Debit Card</div>
                            <div className="text-xs text-muted-foreground mt-1">
                              Pay with Visa, Mastercard, or American Express
                            </div>
                          </div>
                        </Label>
                      </div>
                    </RadioGroup>
                  </div>
                  
                  {/* Billing Details */}
                  <div className="glass rounded-xl p-6 space-y-4">
                    <h2 className="text-lg font-medium">Billing Information</h2>
                    
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="firstName">First Name</Label>
                        <Input id="firstName" required />
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="lastName">Last Name</Label>
                        <Input id="lastName" required />
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="email">Email Address</Label>
                      <Input id="email" type="email" required />
                    </div>
                    
                    {paymentMethod === "card" && (
                      <>
                        <div className="space-y-2">
                          <Label htmlFor="cardNumber">Card Number</Label>
                          <Input id="cardNumber" placeholder="•••• •••• •••• ••••" required />
                        </div>
                        
                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label htmlFor="expiry">Expiry Date</Label>
                            <Input id="expiry" placeholder="MM/YY" required />
                          </div>
                          
                          <div className="space-y-2">
                            <Label htmlFor="cvc">CVC</Label>
                            <Input id="cvc" placeholder="•••" required />
                          </div>
                        </div>
                      </>
                    )}
                  </div>
                  
                  {/* Submit Button */}
                  <Button 
                    type="submit" 
                    className="w-full rounded-full"
                    size="lg"
                    disabled={processing}
                  >
                    {processing ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Processing Payment...
                      </>
                    ) : (
                      <>Complete Purchase</>
                    )}
                  </Button>
                </form>
              </motion.div>
            </div>
            
            {/* Order Summary */}
            <div className="lg:col-span-1">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.2 }}
                className="glass rounded-xl p-6 space-y-4 sticky top-28"
              >
                <h2 className="text-lg font-medium">Order Summary</h2>
                
                {/* Order Items */}
                <div className="space-y-3 my-4">
                  {items.map((item) => (
                    <div key={item.nft.id} className="flex justify-between text-sm">
                      <div className="flex-1">
                        <div className="font-medium">{item.nft.title}</div>
                        <div className="text-xs text-muted-foreground">
                          Qty: {item.quantity}
                        </div>
                      </div>
                      <div className="text-right">
                        {(item.nft.price * item.quantity).toFixed(4)} ETH
                      </div>
                    </div>
                  ))}
                </div>
                
                <Separator />
                
                {/* Order Totals */}
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Subtotal</span>
                    <span>{subtotal.toFixed(4)} ETH</span>
                  </div>
                  
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Service Fee (2.5%)</span>
                    <span>{serviceFee.toFixed(4)} ETH</span>
                  </div>
                  
                  <Separator className="my-2" />
                  
                  <div className="flex justify-between font-medium">
                    <span>Total</span>
                    <div className="text-right">
                      <div>{total.toFixed(4)} ETH</div>
                      <div className="text-xs text-muted-foreground">
                        ≈ ${(total * 2150).toFixed(2)} USD
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="pt-4">
                  <div className="flex items-center text-xs text-muted-foreground">
                    <Shield className="h-3.5 w-3.5 mr-1 flex-shrink-0" />
                    <span>All transactions are secure and encrypted</span>
                  </div>
                </div>
              </motion.div>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default Checkout;
