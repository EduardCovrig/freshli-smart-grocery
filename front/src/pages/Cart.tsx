import {useCart } from "@/context/CartContext"
import {Button} from "@/components/ui/button"
import { Link } from "react-router-dom";
import { Trash2, Plus, Minus, ArrowRight, ShoppingBag, Sparkles, AlertTriangle, Store } from "lucide-react";
import { useState,useEffect } from "react";
import axios from "axios"; // Adaugam axios
import { useAuth } from "@/context/AuthContext"; // Adaugam token-ul
import ProductCard from "@/components/ProductCard";
import { Product } from "@/types"; // Tipul pentru produse
import calorieIcon from "@/assets/calorie.png";

export default function Cart()
{
    {/* return <div className="px-10 text-2xl font-bold">Aici e cart-ul</div> */}

    const {cartItems, addToCart, removeFromCart}=useCart(); //extragere date din context
    const [isUpdating,setIsUpdating]=useState(false); //state local pentru a face butonul disabled in timpul 
    //unui request la server, ca sa nu se dea spam si sa se strice ceva.

    const { token } = useAuth(); // Extragem token-ul
    const [recommendations, setRecommendations] = useState<Product[]>([]);

    useEffect(() => {
        const fetchRecommendations = async () => {
            try {
                const apiUrl = import.meta.env.VITE_API_URL;
                const config = token ? { headers: { Authorization: `Bearer ${token}` } } : {};
                
                // Chemam API-ul de recomandari (exact ca in Home)
                const res = await axios.get(`${apiUrl}/recommendations`, config);
                // Luam doar primele 4 produse
                setRecommendations(res.data.slice(0, 4));
            } catch (err) {
                console.error("Failed to fetch recommendations for cart", err);
            }
        };

        fetchRecommendations();
    }, [token]);

    const totalPrice=cartItems.reduce((acc,item) => acc +item.subTotal,0);
    //pretul total din cos

    //FUNCTII AJUTATOARE
    
    const handleIncrement = async(itemId: number) => {
        const item = cartItems.find(x => x.id === itemId)
        if(!item) return;
        
        // LIMITAM BUTONUL DIN UI: Daca e redus si a ajuns la limita de stoc, nu mai face nimic.
        // PENTRU FRESH: Calculam limita din stocul total minus ce e expirat
        const expiringStockTotal = item.nearExpiryQuantity || 0;
        const freshStockTotal = (item.stockQuantity || 0) - expiringStockTotal;

        if (!item.freshMode && item.quantity >= expiringStockTotal) {
            return;
        }
        if (item.freshMode && item.quantity >= freshStockTotal) {
            return;
        }

        setIsUpdating(true);
        await addToCart(item.productId, 1, item.freshMode); // Trimitem exact starea pe care o are randul
        setIsUpdating(false);
    }

    const handleDecrement = async(itemId: number) => {
        const item = cartItems.find(x => x.id === itemId)
        if(!item) return;

        if (item.quantity === 1) {
            await handleRemove(item.id);
            return;
        }

        setIsUpdating(true);
        await addToCart(item.productId, -1, item.freshMode); // Trimitem exact starea pe care o are randul
        setIsUpdating(false);
    }

    const handleRemove=async(itemId: number) =>
    {
        await removeFromCart(itemId);
        //poate modal in viitor aici, acum mi-e lene
    }

    // --- FUNCTIE INTELIGENTA PENTRU UNITATI ---
    // Returneaza ce sa scrie langa pret si ce sa scrie langa calorii
    const getDisplayUnits = (unit: string | undefined) => { 
        if (!unit) return { priceUnit: 'buc', nutritionUnit: '100g' };
        
        const u = unit.toLowerCase().trim();
        
        // Daca in db e lichid, il afisam la bucata (o sticla), dar tabelul ramane la 100ml
        if (u === 'l' || u === 'ml' || u === 'litru' || u === 'litri') {
            return { priceUnit: 'buc', nutritionUnit: '100ml' };
        }
        
        // Daca in db e solid vrac, pretul este per 100g
        if (u === 'g' || u === 'gr' || u === 'gram' || u === 'kg' || u === 'kilogram') {
             return { priceUnit: '100g', nutritionUnit: '100g' }; 
        }
        
        // Orice altceva e la bucata, iar caloriile la 100g
        if (u === 'buc' || u === 'bucata') {
            return { priceUnit: 'buc', nutritionUnit: '100g' };
        }
        
        return { priceUnit: unit, nutritionUnit: '100g' }; // fallback
    };

    // Cos gol (varianta simpla de UI)
   if(cartItems.length === 0) {
        return (
            <div className="min-h-[90vh] bg-[#f8fafc] flex flex-col items-center justify-center p-4">
                <div className="bg-white max-w-xl w-full p-10 md:p-14 rounded-[3rem] shadow-xl shadow-blue-900/5 border border-gray-100 flex flex-col items-center text-center animate-in zoom-in-95 fade-in duration-500 relative overflow-hidden">
                    
                    {/* Efect decorativ subtil de glow pe fundal */}
                    <div className="absolute top-0 left-0 w-64 h-64 bg-blue-400/10 rounded-full blur-[60px] -translate-x-1/3 -translate-y-1/2 pointer-events-none"></div>

                    <div className="p-8 bg-gray-50 rounded-full mb-8 shadow-inner relative z-10">
                        <ShoppingBag size={64} className="text-gray-300" />
                    </div>
                    
                    <h1 className="text-4xl font-black text-gray-900 mb-4 tracking-tight relative z-10">
                        Your cart is empty
                    </h1>
                    
                    <div className="text-gray-500 mb-10 text-lg leading-relaxed relative z-10">
                        <p>It looks like you haven't added anything yet.</p> 
                        <p>Fill your cart by exploring our <strong className="text-[#134c9c]">fresh</strong> groceries.</p>
                    </div>
                    
                    <Link to='/' className="w-full relative z-10">
                        <Button className="w-full h-14 rounded-2xl bg-[#134c9c] hover:bg-[#0f3d7d] text-white font-black text-lg shadow-xl shadow-blue-900/20 hover:-translate-y-1 transition-all flex items-center justify-center gap-3">
                            <Store size={24} />
                            Search for your favourite groceries
                        </Button>
                    </Link>
                </div>
            </div>
        );
    }

    //cazul normal (TO DO)
    const sortedItems = [...cartItems].sort((a, b) => a.id - b.id); //sortare dupa id mai mare din cartitem

    return (
        <div className="min-h-[93vh] bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
            <div className="max-w-7xl mx-auto">
                {/* 1. HEADER */}
                <h1 className="text-3xl font-black text-gray-900 mb-8 flex items-center gap-3">
                    Shopping Cart
                    <span className="text-lg font-medium text-gray-500 bg-white border-gray-200 px-3 py-1 rounded-full hover:bg-gray-500 hover:text-white transition-colors duration-300">{cartItems.length} items</span>
                </h1>
                {/* 2. Grid-ul Principal stanga: produse, dreapta: total */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-12 items-start">

                    {/*COLOANA STANGA: LISTA PRODUSE */}
                    <div className="lg:col-span-2 space-y-3">
                        {/* am folosit sortedItems pt ca inainte cand foloseam butoanele de + - se schimba
                        random ordinea la produse, asa ramane constanta */}
                        {sortedItems.map((item) => {
                            
                            // Daca e produs care expira, il stilizam diferit
                            const isReduced = !item.freshMode && (item.nearExpiryQuantity || 0) > 0;
                            
                            // Verificam daca am atins limita de reduceri pentru acest rand
                            const expiringStockTotal = item.nearExpiryQuantity || 0;
                            const freshStockTotal = (item.stockQuantity || 0) - expiringStockTotal;
                            
                            const limitReached = isReduced 
                                ? item.quantity >= expiringStockTotal 
                                : item.quantity >= freshStockTotal;

                            // Aplicam functia aici pentru afisarea unitatii corecte
                            const { priceUnit, nutritionUnit } = getDisplayUnits(item.productUnit);

                            return ( 
                                <div key={item.id} className={`bg-white p-4 sm:p-6 rounded-3xl border shadow-sm flex flex-col sm:flex-row gap-6 items-center hover:shadow-md transition-shadow relative overflow-hidden ${isReduced ? "border-orange-200" : "border-blue-100"}`}>
                                    
                                    {/* Eticheta Sus Stanga */}
                                    {isReduced ? (
                                        <div className="absolute top-0 left-0 bg-orange-100 text-orange-700 text-[10px] font-bold px-3 py-1/2 rounded-br-xl z-10 border-b border-r border-orange-500 flex items-center gap-1">
                                            <AlertTriangle size={10} /> Clearance
                                        </div>
                                    ) : (
                                        <div className="absolute top-0 left-0 bg-blue-100 text-blue-700 text-[10px] font-bold px-3 py-1/2 rounded-br-xl z-10 border-b border-r border-blue-500 flex items-center gap-1">
                                            <Sparkles size={10} /> Fresh
                                        </div>
                                    )}

                                    {/* Imaginea produsului */}
                                    <Link className="min-w-16 h-24 bg-gray-50 rounded-xl flex-shrink-0 flex items-center justify-center overflow-hidden border border-[#134c9c]
                                    hover:border-2 transition-all duration-100" 
                                    to={`/product/${item.productId}`}>
                                        {item.imageUrl ? (
                                            <img src={item.imageUrl} alt={item.productName} className="h-full object-contain" />
                                        ) : (
                                            <ShoppingBag className="text-gray-300" size={32} /> //fall back iconita shoppingback daca nu gaseste url-ul
                                        )}
                                    </Link>

                                    {/* B. Detalii produs  */}
                                    <div className="flex-1 text-center sm:text-left w-full flex flex-col justify-center h-full">
                                        {/* Brand (mic, gri, uppercase) */}
                                        <Link className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1 mt-2 sm:mt-0 hover:text-[#134c9c] hover:underline transition-colors" 
                                        to={`/?brand=${item.brandName}`}>
                                            {item.brandName || "Generic Brand"}
                                        </Link>
                                    
                                        {/* Nume Produs */}
                                        <Link className="text-lg font-extrabold text-gray-900 leading-tight mb-2 hover:text-[#134c9c] transition-colors"
                                        to={`/product/${item.productId}`}>
                                            {item.productName}
                                        </Link>

                                        {/* Zona Pret, Calorii */}
                                        <div className="flex items-center gap-3 justify-center sm:justify-start">
                                           {/* Pretul pe unitate (cu rosu daca e redus) */}
                                            <div className="flex flex-col justify-center">
                                                {item.basePrice > item.pricePerUnit && (
                                                    <span className="text-xs text-gray-400 line-through font-bold mb-0.5">
                                                        {item.basePrice.toFixed(2)} Lei
                                                    </span>
                                                )}
                                                <div className={`${item.basePrice > item.pricePerUnit ? 'text-red-600' : 'text-[#134c9c]'} font-black text-lg leading-none`}>
                                                    {item.pricePerUnit.toFixed(2)} 
                                                    <span className="text-sm font-bold text-gray-500 ml-1">
                                                        Lei / {priceUnit}
                                                    </span>
                                                </div>
                                            </div>

                                            {/* Calorii */}
                                            {item.calories && (
                                                <div className="bg-orange-50 text-orange-700 text-xs ml-2 font-bold px-2 py-1 rounded-md border border-orange-100 flex items-center gap-1">
                                                    <img src={calorieIcon} alt="kcal" className="w-5 h-5 object-contain" />
                                                    {item.calories} / {nutritionUnit}
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    {/* C. +,-,delete */}
                                    <div className="flex items-center gap-6 mt-4 sm:mt-0 w-full sm:w-auto justify-between sm:justify-end">
                                        <div className="flex items-center justify-between border border-gray-200 rounded-lg bg-gray-50 h-10 w-[120px] sm:w-[140px]">
                                            <button className="px-3 h-full text-gray-400 border-r border-gray-200 flex items-center justify-center transition-all hover:bg-red-200 hover:bg-opacity-50 hover:text-black"
                                                    onClick={()=> handleDecrement(item.id)}
                                                    disabled={isUpdating}
                                                    title={limitReached ? "Cannot reduce further, minimum stock reached" : ""}
                                                    >
                                                                        
                                                <Minus size={14} />
                                            </button>
                                            
                                            {/* w-full pe text ca sa ocupe spatiul ramas */}
                                            <span className="flex-1 text-center font-bold text-gray-900 text-sm select-none">
                                                {item.quantity}
                                            </span>
                                            
                                            <button 
                                                onClick={() => handleIncrement(item.id)}
                                                disabled={isUpdating || limitReached} // Se dezactiveaza daca e redus si am atins limita
                                                className="px-3 h-full text-blue-600 hover:bg-blue-100 transition-colors border-l border-gray-200 flex items-center justify-center disabled:opacity-30 disabled:hover:bg-transparent"
                                                title={limitReached ? "Out of stock for this category" : ""}
                                            >
                                                <Plus size={14} />
                                            </button>
                                        </div>

                                        <div className="text-right min-w-[60px] sm:min-w-[80px]">
                                            <p className="text-xl font-black text-gray-900">
                                                {item.subTotal.toFixed(2)} <span className="text-xs font-bold text-gray-500">LEI</span>
                                            </p>
                                        </div>

                                        <button 
                                            onClick={() => handleRemove(item.id)}
                                            className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                            title="Remove item"
                                        >
                                            <Trash2 size={20} />
                                        </button>
                                    </div>
                                </div>
                            );
                        })}

                        {/* --- ZONA RECOMANDARI --- */}
                        {recommendations.length > 0 && (
                            <div className="mt-16 mb-8">
                                <div className="flex items-center gap-3 mb-6 mt-16">
                                    <div className="w-10 h-10 rounded-full flex items-center justify-center bg-gradient-to-br from-[#134c9c] to-blue-400 text-white shadow-sm">
                                        <Sparkles size={20} />
                                    </div>
                                    <h2 className="text-2xl font-black text-gray-900 tracking-tight">Recommended For You</h2>
                                </div>
                                
                                {/* Afisam primele 4 produse intr-un grid */}
                                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                                    {recommendations.map((product) => (
                                        <ProductCard key={product.id} product={product} />
                                    ))}
                                </div>
                            </div>
                        )}

                      </div>
                      
                      {/* --- COLOANA DREAPTA: SUMAR COMANDA (Sticky) --- */}
                    <div className="lg:col-span-1 sticky top-28">
                        <div className="bg-white p-8 rounded-2xl border border-gray-100 shadow-xl shadow-blue-900/5">
                            <h2 className="text-2xl font-black text-gray-900 mb-6">Order Summary</h2>
                            
                            <div className="space-y-4 mb-8">
                                <div className="flex justify-between text-gray-600">
                                    <span>Subtotal</span>
                                    <span className="font-bold text-gray-900">{totalPrice.toFixed(2)} Lei</span>
                                </div>
                                <div className="flex justify-between text-gray-600">
                                    <span>Delivery</span>
                                    <span className="text-green-600 font-bold">Free</span>
                                </div>
                                <div className="flex justify-between text-gray-600">
                                    <span>Taxes & TVA </span>
                                    <span className="text-gray-400 text-sm">Included</span>
                                </div>
                                <div className="h-px bg-gray-100 my-4"></div>
                                <div className="flex justify-between items-end">
                                    <span className="text-lg font-bold text-gray-900">Total</span>
                                    <span className="text-4xl font-black text-[#134c9c] tracking-tighter">
                                        {totalPrice.toFixed(2)} <span className="text-lg text-gray-500 font-bold">LEI</span>
                                    </span>
                                </div>
                            </div>

                            <Link to="/checkout">
                                <Button className="w-full h-14 rounded-xl bg-green-600 hover:bg-green-700 text-white font-bold text-xl shadow-lg shadow-green-900/20 hover:shadow-green-900/40 transition-all flex items-center justify-center gap-2">
                                    Proceed to Checkout <ArrowRight size={24} />
                                </Button>
                            </Link>
                            
                            <p className="text-xs text-center text-gray-400 mt-4 leading-tight">
                                Order will be shipped within 1-2 business days. You can review your order and apply discounts at checkout.
                            </p>
                        </div>
                    </div>
                 </div>
            </div>
        </div>
    )
}