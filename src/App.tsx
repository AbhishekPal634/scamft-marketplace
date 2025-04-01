
import { Routes, Route } from "react-router-dom";
import { Toaster } from "sonner"; // Use Sonner's toaster component
import { AuthProvider } from "./context/AuthContext";
import Index from "./pages/Index";
import Explore from "./pages/Explore";
import NFTDetail from "./pages/NFTDetail";
import Cart from "./pages/Cart";
import Checkout from "./pages/Checkout";
import Login from "./pages/Login";
import Register from "./pages/Register";
import NotFound from "./pages/NotFound";
import ProtectedRoute from "./components/auth/ProtectedRoute";
import Profile from "./pages/Profile";
import CreateListing from "./pages/CreateListing";
import MyListings from "./pages/MyListings";

function App() {
  return (
    <AuthProvider>
      <Routes>
        <Route path="/" element={<Index />} />
        <Route path="/explore" element={<Explore />} />
        <Route path="/nft/:id" element={<NFTDetail />} />
        <Route path="/cart" element={<Cart />} />
        <Route path="/checkout" element={
          <ProtectedRoute>
            <Checkout />
          </ProtectedRoute>
        } />
        <Route path="/profile" element={
          <ProtectedRoute>
            <Profile />
          </ProtectedRoute>
        } />
        <Route path="/create" element={
          <ProtectedRoute>
            <CreateListing />
          </ProtectedRoute>
        } />
        <Route path="/my-listings" element={
          <ProtectedRoute>
            <MyListings />
          </ProtectedRoute>
        } />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
      <Toaster richColors position="top-right" />
    </AuthProvider>
  );
}

export default App;
