
import { create } from "zustand";
import { persist } from "zustand/middleware";
import { NFT } from "./nftService";

export interface CartItem {
  nft: NFT;
  quantity: number;
}

interface CartStore {
  items: CartItem[];
  addItem: (nft: NFT) => void;
  removeItem: (nftId: string) => void;
  updateQuantity: (nftId: string, quantity: number) => void;
  clearCart: () => void;
  getTotal: () => number;
  getItemCount: () => number;
}

export const useCartStore = create<CartStore>()(
  persist(
    (set, get) => ({
      items: [],
      
      addItem: (nft: NFT) => {
        set((state) => {
          // Check if the item is already in the cart
          const existingItemIndex = state.items.findIndex(
            (item) => item.nft.id === nft.id
          );
          
          if (existingItemIndex >= 0) {
            // If item exists, clone the items array and update the quantity
            const updatedItems = [...state.items];
            updatedItems[existingItemIndex] = {
              ...updatedItems[existingItemIndex],
              quantity: updatedItems[existingItemIndex].quantity + 1,
            };
            
            return { items: updatedItems };
          } else {
            // If item doesn't exist, add it with quantity 1
            return { items: [...state.items, { nft, quantity: 1 }] };
          }
        });
      },
      
      removeItem: (nftId: string) => {
        set((state) => ({
          items: state.items.filter((item) => item.nft.id !== nftId),
        }));
      },
      
      updateQuantity: (nftId: string, quantity: number) => {
        if (quantity <= 0) {
          get().removeItem(nftId);
          return;
        }
        
        set((state) => ({
          items: state.items.map((item) =>
            item.nft.id === nftId ? { ...item, quantity } : item
          ),
        }));
      },
      
      clearCart: () => {
        set({ items: [] });
      },
      
      getTotal: () => {
        return get().items.reduce(
          (total, item) => total + item.nft.price * item.quantity,
          0
        );
      },
      
      getItemCount: () => {
        return get().items.reduce(
          (count, item) => count + item.quantity, 
          0
        );
      },
    }),
    {
      name: "scamft-cart", // name for the localStorage key
    }
  )
);
