import { useEffect, useState, useRef } from "react";
import { useParams, Navigate, Link, useLocation } from "react-router-dom";
import axios from "axios";
import { Product } from "@/types";
import { Button } from "@/components/ui/button";
import { ShoppingBasket, Loader2, Plus, Minus, Clock, CheckCircle2, Hourglass, Info, Zap, Sparkles } from "lucide-react";
import { useCart } from "@/context/CartContext";
import { useAuth } from "@/context/AuthContext";
import ProductCard from "@/components/ProductCard";

export default function ProductDetails() {
    const { id } = useParams();
    const { addToCart, cartItems } = useCart();
    const location = useLocation();

    const { token } = useAuth();
    const [recommendations, setRecommendations] = useState<Product[]>([]); 
    
    const [product, setProduct] = useState<Product | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [selectedImage, setSelectedImage] = useState<string>("");
    const shuffledOnceForId = useRef<string | undefined>(undefined);

    const [isAddingToCart,setIsAddingToCart]=useState(false)

    // 'reduced' = tab-ul cu produse la reducere
    // 'fresh' = tab-ul cu produse la pret intreg
    const [buyingMode, setBuyingMode] = useState<'reduced' | 'fresh'>('reduced');

    // Cantitatea selectata (resetata la 1)
    const [quantity, setQuantity] = useState(1);

    // ------------------------------------------

   useEffect(() => {
        const loadPageData = async () => {
            try {
                setIsLoading(true);
                const apiUrl = import.meta.env.VITE_API_URL;
                if (!id) return;
                
                
                // 1. PRELUAM PRODUSUL CURENT
                const prodRes = await axios.get(`${apiUrl}/products/${id}`);
                const productData = prodRes.data;
                setProduct(productData);

                //Setam imaginea default si tab-ul (fresh/reduced)
                if (productData.imageUrls && productData.imageUrls.length > 0) {
                    setSelectedImage(productData.imageUrls[0]);
                } else {
                    setSelectedImage("https://placehold.co/600?text=No+Image"); //daca nu gaseste imaginea in baza de date, ia un placeholder
                }
               // Daca venim de pe un Link care ne spune exact ce tab sa deschidem, adica din search bar
                if (location.state?.autoSelectMode) {
                    setBuyingMode(location.state.autoSelectMode);
                } 
                // Altfel, fallback la comportamentul standard
                else if (!productData.nearExpiryQuantity || productData.nearExpiryQuantity === 0) {
                    setBuyingMode('fresh');
                } else {
                    setBuyingMode('reduced');
                }

                // 2. PRELUAM RECOMANDARILE DE LA AI
                const config = token ? { headers: { Authorization: `Bearer ${token}` } } : {};
                const recRes = await axios.get(`${apiUrl}/recommendations`, config);
                
                //facem operatii pe lista obtinuta: 
                //A. Excludem produsul curent din lista
                let allRecs = recRes.data.filter((p: Product) => p.id.toString() !== id);
                
                //B. Filtram (prioritizam acelasi brand sau aceeasi categorie)
                let contextRecs = allRecs.filter((p: Product) => 
                    p.categoryName === productData.categoryName || p.brandName === productData.brandName
                );
                
                //C. Fallback: Daca nu avem macar 3 produse similare contextual, folosim lista intreaga.
                let poolToUse = contextRecs.length >= 3 ? contextRecs : allRecs;
                
                //D. Luam primele 10 cele mai relevant
                let top10 = poolToUse.slice(0, 10);
                // Verificare daca nu s-a facut deja amestecarea pentru ID-ul curent
                if (shuffledOnceForId.current !== id) {
                    // e prima data cand incarcam date pentru acest produs
                    // E. Le punem random
                    let shuffled = [...top10].sort(() => 0.5 - Math.random());
                    
                    // F. Afisam fix 3
                    setRecommendations(shuffled.slice(0, 3));
                    
                    // salvam id-ul curent in ref ca sa nu mai dam shuffle iar daca useEffect-ul e apelat la schimbarea tokenului.
                    shuffledOnceForId.current = id;
                }
                
                

            } catch (err) {
                console.error("Eroare la incarcarea datelor:", err);
            } finally {
                setIsLoading(false);
            }
        };

        loadPageData();
    }, [id, token]);
    // FUNCTIE PENTRU UNITATI
    // Returneaza ce sa scrie langa pret si ce sa scrie la tabelul nutritional
    const getDisplayUnits = (unit: string | undefined) => {
        if (!unit) return { priceUnit: 'buc', nutritionUnit: '100g' };
        
        const u = unit.toLowerCase().trim();
        
        // Daca in DB e lichid (L, ml), il vindem la BUCATA,  
        // dar tabelul nutritional e pe 100ml.
        if (u === 'l' || u === 'ml' || u === 'litru' || u === 'litri') {
            return { priceUnit: 'buc', nutritionUnit: '100ml' };
        }
        
        // Daca in DB e la kg, vrem sa afisam pretul per 100g, 
        // iar tabelul ramane pe 100g.
        if (u === 'kg' || u === 'kilogram' || u === 'g' || u === 'gr' || u === 'grame') {
             return { priceUnit: '100g', nutritionUnit: '100g' };
        }
        
        // Orice altceva (paine, ciocolata) e la bucata si tabel la 100g.
        return { priceUnit: 'buc', nutritionUnit: '100g' };
    };

    const { nutritionUnit } = getDisplayUnits(product?.unitOfMeasure);

    //  LOGICA DE STOCURI (SEPARARE STRICTA) 
    const cartItemReduced = cartItems.find(item => Number(item.productId) === Number(product?.id) && !item.freshMode);
    const quantityInCartReduced = cartItemReduced ? cartItemReduced.quantity : 0;

    const cartItemFresh = cartItems.find(item => Number(item.productId) === Number(product?.id) && item.freshMode);
    const quantityInCartFresh = cartItemFresh ? cartItemFresh.quantity : 0;

    const expiringStockTotal = product?.nearExpiryQuantity || 0;
    const remainingReducedStock = Math.max(0, expiringStockTotal - quantityInCartReduced);
    
    const freshStockTotal = (product?.stockQuantity || 0) - expiringStockTotal;
    const remainingFreshStock = Math.max(0, freshStockTotal - quantityInCartFresh);
    
    const isReducedOutOfStock = remainingReducedStock <= 0;
    const freshModeOutOfStock = remainingFreshStock <= 0;

    const maxQuantityForCurrentMode = buyingMode === 'reduced' 
        ? remainingReducedStock 
        : remainingFreshStock;

    const discountPercentage = product?.hasActiveDiscount && product.price > 0
        ? Math.round(((product.price - product.currentPrice) / product.price) * 100)
        : 0;
    
    const handleTabChange = (mode: 'reduced' | 'fresh') => {
        setBuyingMode(mode);
        setQuantity(1);
    };

    const handleDecrease = () => {
        if (quantity > 1) setQuantity(prev => prev - 1);
    };

    const handleIncrease = () => {
        if (quantity < maxQuantityForCurrentMode) {
            setQuantity(prev => prev + 1);
        }
    };

    const handleAddToCartClick = () => {
        if (!product) return;
        const isFreshMode = buyingMode === 'fresh';
        finalizeAddToCart(quantity, isFreshMode);
    };

    const finalizeAddToCart = async (qtyToAdd: number, isFreshMode: boolean=false ) => {
       if (!product) return;
        setIsAddingToCart(true);
        await new Promise(resolve => setTimeout(resolve, 300));
        await addToCart(product.id, qtyToAdd, isFreshMode);
        setIsAddingToCart(false);
        setQuantity(1);
    };

    if (isLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <Loader2 size={40} className="animate-spin text-blue-600" />
            </div>
        );
    }

    if (!product) {
        return <Navigate to="/notfound" replace />;
    }

    const hasExpiryStock = (product.nearExpiryQuantity || 0) > 0;

    return (
        <div className="min-h-screen bg-white py-10 px-4 sm:px-6 lg:px-8 relative">
            <div className="max-w-7xl mx-auto">
                
                {/* NAVIGATION */}
                <div className="mb-6 text-sm font-medium text-gray-500 flex items-center gap-2">
                    <Link to="/" className="hover:text-[#80c4e8]">Home</Link>
                    <span>/</span>
                    <Link to={`/?category=${encodeURIComponent(product.categoryName)}`} className="hover:text-[#80c4e8] text-gray-900 font-bold uppercase">
                        {product.categoryName}
                    </Link>
                    <span>/</span>
                    <Link to={`/?brand=${encodeURIComponent(product.brandName)}`} className="hover:text-[#80c4e8] text-gray-900 font-bold uppercase">
                        {product.brandName}
                    </Link>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-start">
                    
                    {/* COL #1: GALERIE & NUTRITION */}
                    <div className="flex flex-col gap-10">
                        <div className="flex gap-4">
                            <div className="flex flex-col gap-3">
                                {product.imageUrls && product.imageUrls.map((url, index) => (
                                    <button 
                                        key={index}
                                        onClick={() => setSelectedImage(url)}
                                        className={`w-20 h-20 border rounded-lg overflow-hidden p-1 transition-all ${selectedImage === url ? "border-blue-600 ring-1 ring-blue-600" : "border-gray-200 hover:border-gray-400"}`}
                                    >
                                        <img src={url} alt={`Thumbnail ${index}`} className="w-full h-full object-contain" />
                                    </button>
                                ))}
                            </div>
                           <div className="flex-1 bg-white rounded-[2rem] border border-gray-100 flex items-center justify-center h-[500px] relative p-8 shadow-sm">
                                
                                {/* BADGE REDUCERE PROCENTUALA (Stanga-Sus) */}
                                {product.hasActiveDiscount && discountPercentage > 0 && (
                                    <div className="absolute top-6 left-6 bg-gradient-to-tr from-rose-500 to-red-600 text-white px-4 py-1.5 rounded-full font-black text-sm z-20 shadow-lg shadow-red-600/20 flex items-center justify-center">
                                        -{discountPercentage}%
                                    </div>
                                )}

                                {/* BADGE CLEARANCE ACTIVE (Dreapta-Sus) */}
                                {hasExpiryStock && (
                                    <div className="absolute top-6 right-6 bg-gradient-to-r from-orange-500 to-red-500 text-white px-4 py-1.5 rounded-full font-black text-xs uppercase tracking-widest flex items-center gap-2 z-20 shadow-lg shadow-orange-500/20">
                                        <Clock size={14} strokeWidth={3} />
                                        Clearance
                                    </div>
                                )}
                                
                                <img src={selectedImage} alt={product.name} className="w-full h-full object-contain" />
                            </div>
                        </div>
                        <div>
                            <h3 className="text-lg font-bold text-gray-900 mb-2 border-b pb-2 flex flex-row items-center gap-2">
                                <Info size={20} className="text-[#134c9c]" />
                                Product Description</h3>
                        
                            <p className="text-gray-600 leading-relaxed text-base">{product.description || "No description available."}</p>
                        </div>

                        {/* Nutritional Values */}
                        <div>
                            {/* NOU: Aici folosim valoarea calculata in functie de lichid/solid */}
                            <h3 className="text-lg font-bold text-gray-900 mb-3 border-b pb-2 flex flex-row gap-2 items-center">
                                <Zap size={20} className="text-amber-500" />
                                Nutritional Values ({nutritionUnit}):
                            </h3>
                            {product.attributes && Object.keys(product.attributes).length > 0 ? (
                                <div className="space-y-2">
                                    {Object.entries(product.attributes).map(([key, value]) => (
                                        <div key={key} className="flex justify-between items-center py-2 border-b border-gray-100 last:border-0 hover:bg-gray-50 px-2 rounded">
                                            <span className="text-gray-600 font-medium capitalize">{key}</span>
                                            <span className="text-gray-900 font-bold">{value}</span>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <p className="text-gray-400 italic text-sm">Not available.</p>
                            )}
                        </div>
                    </div>

                    {/* COL #2: INFO & BUYING AREA */}
                    <div className="space-y-4">
                        <div>
                            <h1 className="text-3xl font-black text-gray-900 leading-tight">{product.name}</h1>
                            <Link className="hover:text-[#80c4e8]" to={`/?brand=${product.brandName}`}>{product.brandName}</Link>
                        </div>

                      {/* --- ZONA DE CUMPARARE DUALA --- */}
                        <div className="bg-gray-50 p-6 rounded-xl border border-gray-100 flex flex-col gap-6 relative overflow-hidden">
                            
                           {hasExpiryStock && (
                                <div className="flex gap-1 bg-gray-200 p-1 rounded-lg mb-2">
                                    <button 
                                        onClick={() => handleTabChange('reduced')}
                                        disabled={isReducedOutOfStock}
                                        className={`flex-1 py-2 px-1 text-xs sm:text-sm font-bold tracking-tight rounded-md flex items-center justify-center gap-1 transition-all ${
                                            buyingMode === 'reduced' 
                                            ? "bg-white text-orange-600 shadow-sm" 
                                            : "text-gray-500 hover:text-gray-700 disabled:opacity-50"
                                        }`}
                                    >
                                        <Hourglass size={14} className="shrink-0" />
                                        <span className="truncate">Clearance</span>
                                        <span className="hidden sm:inline truncate">(Reduced)</span>
                                    </button>
                                    <button 
                                        onClick={() => handleTabChange('fresh')}
                                        disabled={freshModeOutOfStock}
                                        className={`flex-1 py-2 px-1 text-xs sm:text-sm font-bold tracking-tight rounded-md flex items-center justify-center gap-1 transition-all ${
                                            buyingMode === 'fresh' 
                                            ? "bg-white text-blue-600 shadow-sm" 
                                            : "text-gray-500 hover:text-gray-700 disabled:opacity-50"
                                        }`}
                                    >
                                        <CheckCircle2 size={14} className="shrink-0" />
                                        <span className="truncate">Fresh</span>
                                        <span className="hidden sm:inline truncate">(Full Price)</span>
                                    </button>
                                </div>
                            )}

                            <div className="flex items-end justify-between w-full">
                                <div>
                                    {(buyingMode === 'reduced' && product.hasActiveDiscount) || (!hasExpiryStock && product.hasActiveDiscount) ? (
                                        <>
                                            <div className={`text-4xl font-black tracking-tighter ${hasExpiryStock ? "text-orange-600" : "text-red-600"}`}>
                                                {product.currentPrice.toFixed(2)}<span className="text-lg font-bold ml-1">LEI</span>
                                            </div>
                                            <span className="text-sm text-gray-400 line-through">was {product.price.toFixed(2)} Lei</span>
                                            
                                            {hasExpiryStock ? (
                                                <p className="text-xs text-orange-600 mt-1 font-bold">Expires soon!</p>
                                            ) : (
                                                <p className="text-xs text-red-600 mt-1 font-bold">Special Offer</p>
                                            )}
                                        </>
                                    ) : (
                                        <>
                                            <div className="text-4xl font-black tracking-tighter text-gray-900">
                                                {product.price.toFixed(2)}<span className="text-lg font-bold ml-1">LEI</span>
                                            </div>
                                            {hasExpiryStock && <p className="text-xs text-blue-600 mt-1 font-bold">Guaranteed fresh.</p>}
                                        </>
                                    )}
                                </div>

                                <div className={`flex items-center gap-3 bg-white px-3 py-2 rounded-lg border border-gray-200 shadow-sm ${(buyingMode === 'reduced' && isReducedOutOfStock) || (buyingMode === 'fresh' && freshModeOutOfStock) ? "opacity-50 pointer-events-none" : ""}`}>
                                    <button onClick={handleDecrease} disabled={quantity <= 1} className="p-2 rounded-md bg-gray-100 text-gray-600 hover:bg-gray-200 transition-colors disabled:opacity-50">
                                        <Minus size={18} strokeWidth={3} />
                                    </button>
                                    <span className="text-xl font-bold w-8 text-center text-gray-800">{quantity}</span>
                                    <button onClick={handleIncrease} disabled={quantity >= maxQuantityForCurrentMode} className="p-2 rounded-md bg-gray-100 text-gray-600 hover:bg-gray-200 transition-colors disabled:opacity-50">
                                        <Plus size={18} strokeWidth={3} />
                                    </button>
                                </div>
                            </div>

                            <Button 
                                onClick={handleAddToCartClick}
                                disabled={(buyingMode === 'reduced' && isReducedOutOfStock) || (buyingMode === 'fresh' && freshModeOutOfStock) || isAddingToCart}
                                className={`w-full h-12 rounded-lg font-bold text-lg flex items-center justify-center gap-2 shadow-sm transition-all 
                                    ${(buyingMode === 'reduced' && isReducedOutOfStock) || (buyingMode === 'fresh' && freshModeOutOfStock)
                                        ? "bg-gray-200 text-gray-500 cursor-not-allowed" 
                                        : buyingMode === 'reduced' 
                                            ? "bg-orange-600 hover:bg-orange-700 text-white"
                                            : "bg-[#134c9c] hover:bg-[#80c4e8] duration-100 hover:text-gray-800"
                                    }`}
                            >
                                {isAddingToCart ? (
                                    <>
                                        <Loader2 size={24} className="animate-spin" />
                                        Adding...
                                    </>
                                ) : (
                                    <>
                                        <ShoppingBasket size={20} />
                                        {(buyingMode === 'reduced' && isReducedOutOfStock) || (buyingMode === 'fresh' && freshModeOutOfStock) 
                                            ? "OUT OF STOCK" 
                                            : hasExpiryStock 
                                                ? (buyingMode === 'reduced' ? "Add Reduced Items" : "Add Fresh Items")
                                                : "Add to Cart"
                                        }
                                    </>
                                )}
                            </Button>
                        </div>
                        {/* <div> (MUTAT MAI SUS IN COD, CA SA FIE SUB POZA, NU SUB PRET)
                            <h3 className="text-lg font-bold text-gray-900 mb-2">Product Description</h3>
                            <p className="text-gray-600 leading-relaxed text-sm">{product.description || "No description available."}</p>
                        </div> */}
                        {recommendations.length > 0 && (
                            <div className="mt-8 pt-6 border-t border-gray-100 animate-in fade-in">
                                <h3 className="text-lg font-black text-gray-900 mb-4 tracking-tight flex flex-row items-center gap-2">
                                    <Sparkles size={20} className="text-[#134c9c]" />
                                    Customers also considered</h3>
                            
                                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                                    {recommendations.map(rec => (
                                        <ProductCard key={rec.id} product={rec} />
                                    ))}
                                </div>
                            </div>
                        )}
                        
                    </div>
                </div>
            </div>
        </div>
    );
}