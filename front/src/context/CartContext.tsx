import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import axios from 'axios';
import { useAuth } from './AuthContext';
import {toast} from "sonner"

// Cum arata un produs IN COS (backend responseDTO)
interface CartItem {
    id: number;          // ID-ul liniei din cos
    productId: number;
    productName: string;
    productUnit: string;
    pricePerUnit: number;
    quantity: number;
    subTotal: number;
    imageUrl?: string; //optional
    brandName?: string; //optional
    calories?: string; //optional
    nearExpiryQuantity?: number; //optional
    stockQuantity?: number; //optional
    freshMode?: boolean; //optional
    basePrice: number; 
}

//ce expunem catre restul aplicatiei mai departe
interface CartContextType {
    cartItems: CartItem[];
    cartCount: number;      // Numarul total de produse (pt bulina rosie de pe navbar)
    addToCart: (productId: number, quantity: number, freshMode?: boolean) => Promise<void>;
    removeFromCart: (itemId: number) => Promise<void>;
    fetchCart: () => Promise<void>; // refresh cart manual
}
const CartContext = createContext<CartContextType | undefined>(undefined);


export const CartProvider = ({ children }: { children: ReactNode }) => {
    const [cartItems, setCartItems] = useState<CartItem[]>([]);
    
    // Avem nevoie de token si sa stim daca e logat din AuthContext
    const { token, isAuthenticated } = useAuth(); 

    // 1. FUNCTIA DE PRELUARE COS (GET) din Backend
    const fetchCart = async () => {
        // Daca nu e logat => cosul e gol local
        if (!isAuthenticated || !token) {
            setCartItems([]);
            return;
        }

        try {
            const apiUrl = import.meta.env.VITE_API_URL;
            const response = await axios.get(`${apiUrl}/cart`, {
                headers: { Authorization: `Bearer ${token}` } // Trimitem tokenul jwt in header
            });
            
            // Backend-ul returneaza un CartResponseDTO care are lista 'items'
            setCartItems(response.data.items || []);
        } catch (error) {
            console.error("Can't load cart: ", error);
        }
    };

    // 2. FUNCTIA DE ADAUGARE (POST) catre Backend
    const addToCart = async (productId: number, quantity: number, freshMode: boolean=false) => {
        if (!isAuthenticated) {
            toast.error("You need to be logged in to add items to the cart.");
            return;
        }

        try {
            const apiUrl = import.meta.env.VITE_API_URL;
            await axios.post(
                `${apiUrl}/cart/items`,
                { productId, quantity, freshMode }, // Body-ul cererii (DTO-ul din Java)
                { headers: { Authorization: `Bearer ${token}` } }
            );
            
            // Dupa ce am adaugat cu succes, recitim cosul de la server ca sa fim sincronizati
            await fetchCart(); 
        } catch (error: any) {
          const msg = error.response?.data?.message || "Eroare de stoc!";
          toast.error(msg); 
        }
    };

    // cand se schimba starea de login (intri/iesi), incercam sa luam cosul
    useEffect(() => {
        fetchCart();
    }, [isAuthenticated, token]);

    //3. REMOVE FROM CART
    const removeFromCart=async (itemId: number) =>
    {
        if(!isAuthenticated || !token) return;
        try{
            const apiUrl=import.meta.env.VITE_API_URL;
            await axios.delete(`${apiUrl}/cart/items/${itemId}`,
                {
                    headers: { Authorization: `Bearer ${token}`}
                }
            )
            await fetchCart(); //refresh cart
        }
        catch(err)
        {
            console.error("error removing item from cart:",err);
        }
    }   

    // Calculam cate produse sunt in total (pentru Navbar)
    const cartCount = cartItems.reduce((acc, item) => acc + item.quantity, 0);

    return (
        <CartContext.Provider value={{ 
            cartItems, 
            cartCount, 
            addToCart, 
            fetchCart,
            removeFromCart
        }}>
            {children}
        </CartContext.Provider>
    );
};

//Hook custom ca sa fie mai usor de folosit
export const useCart = () => {
    const context = useContext(CartContext);
    if (!context) throw new Error("useCart must be used within a CartProvider");
    return context;
};