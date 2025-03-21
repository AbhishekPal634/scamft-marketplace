
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import CartComponent from "@/components/cart/Cart";

const Cart = () => {
  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />
      <main className="flex-grow pt-28 pb-16">
        <div className="page-container max-w-4xl">
          <CartComponent />
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default Cart;
