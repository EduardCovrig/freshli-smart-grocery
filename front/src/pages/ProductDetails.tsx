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
                else {
                    // Daca are clearance stoc in DB, default intra pe Clearance. Daca nu, intra pe Fresh.
                    if (productData.nearExpiryQuantity > 0) {
                        setBuyingMode('reduced');
                    } else {
                        setBuyingMode('fresh');
                    }
                }

               // 2. PRELUAM RECOMANDARILE DE LA AI
                const config = token ? { headers: { Authorization: `Bearer ${token}` } } : {};
                const recRes = await axios.get(`${apiUrl}/recommendations`, config);
                
                // A. Excludem produsul curent din lista totala primita.
                let allRecs = recRes.data.filter((p: Product) => p.id.toString() !== id);
                
                // Verificam daca nu s-a calculat deja pentru produsul curent
                if (shuffledOnceForId.current !== id) {
                    
                    // amestecam ca sa fie diferite la fiecare refresh
                    let shuffledRecs = [...allRecs].sort(() => 0.5 - Math.random());

                    // grupam ceea ce ne intereseaza
                    let sameCategory = shuffledRecs.filter((p: Product) => p.categoryName === productData.categoryName);
                    let sameBrand = shuffledRecs.filter((p: Product) => p.brandName === productData.brandName);
                    
                    let finalRecs: Product[] = [];

                    //Luam fix 1 produs din aceeasi categorie
                    let categoryPick = sameCategory.length > 0 ? sameCategory[0] : null;
                    if (categoryPick) {
                        finalRecs.push(categoryPick);
                    }

                    //Luam 2 produse de la acelasi brand (fara sa il punem iar pe cel luat anterior daca s-a nimerit sa fie si acelasi brand)
                    let brandPicks = sameBrand.filter(p => p.id !== categoryPick?.id).slice(0, 2);
                    finalRecs.push(...brandPicks);

                    // Fallback: Daca magazinul nu are destule produse de la acelasi brand/categorie, completam pana la 3 cu orice altceva
                    if (finalRecs.length < 3) {
                        let usedIds = new Set(finalRecs.map(f => f.id)); // ca sa nu dublam nimic
                        let leftovers = shuffledRecs.filter(p => !usedIds.has(p.id));
                        let needed = 3 - finalRecs.length;
                        finalRecs.push(...leftovers.slice(0, needed));
                    }

                    setRecommendations(finalRecs);
                    shuffledOnceForId.current = id; // Blocam recalcularea pe durata renderului
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
        if (!unit) return { priceUnit: 'piece', nutritionUnit: '100g' };
        
        const u = unit.toLowerCase().trim();
        
        // 1. LICHIDE: pretul e pe sticla (piece), tabelul pe 100ml
        if (u === 'l' || u === 'ml' || u === 'litru' || u === 'litri') {
            return { priceUnit: 'piece', nutritionUnit: '100ml' };
        }
        
        // 2. VRAC: pretul per 100g, tabelul pe 100g
        if (u === 'g' || u === 'gr' || u === 'gram' || u === 'kg' || u === 'kilogram') {
             return { priceUnit: '100g', nutritionUnit: '100g' };
        }
        
        // 3. BUCATA: buc -> piece
        if (u === 'buc' || u === 'bucata') {
            return { priceUnit: 'piece', nutritionUnit: '100g' };
        }
        
        return { priceUnit: unit, nutritionUnit: '100g' }; // fallback
    };

    const {nutritionUnit } = getDisplayUnits(product?.unitOfMeasure);

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

    const activePrice = buyingMode === 'reduced' ? product?.currentPrice : (product?.freshPrice || product?.price);
    const activeDiscountPercent = (product && activePrice && activePrice < product.price)
    ? Math.round(((product.price - activePrice) / product.price) * 100)
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
                    <div className="flex flex-col gap-8 lg:gap-10">
                        <div className="flex flex-col-reverse lg:flex-row gap-4">
                            {/* Thumbnails: Orizontal pe mobil, Vertical pe Desktop */}
                            <div className="flex flex-row lg:flex-col gap-3 overflow-x-auto pb-2 lg:pb-0 scrollbar-hide">
                                {product.imageUrls && product.imageUrls.map((url, index) => (
                                    <button 
                                        key={index}
                                        onClick={() => setSelectedImage(url)}
                                        className={`w-16 h-16 lg:w-20 lg:h-20 shrink-0 border rounded-lg overflow-hidden p-1 transition-all ${selectedImage === url ? "border-blue-600 ring-1 ring-blue-600" : "border-gray-200 hover:border-gray-400"}`}
                                    >
                                        <img src={url} alt={`Thumbnail ${index}`} className="w-full h-full object-contain" />
                                    </button>
                                ))}
                            </div>
                            {/* Poza Principala */}
                           <div className="flex-1 bg-white rounded-[2rem] border border-gray-100 flex items-center justify-center h-[320px] lg:h-[500px] w-full relative p-4 lg:p-8 shadow-sm">
                                
                                {/* BADGE REDUCERE PROCENTUALA (Stanga-Sus) */}
                                {activeDiscountPercent > 0 && (
                                    <div className="absolute top-6 left-6 bg-gradient-to-tr from-rose-500 to-red-600 text-white px-4 py-1.5 rounded-full font-black text-sm z-20 shadow-lg shadow-red-600/20 flex items-center justify-center transition-all">
                                        -{activeDiscountPercent}%
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
                            
                            {/* AFISAM DUAL TABS DOAR DACA EXISTA STOC DE CLEARANCE SI STOC FRESH. 
                                Daca e doar una, nu afisam tab-urile deloc. */}
                            {hasExpiryStock && (product.stockQuantity - (product.nearExpiryQuantity || 0) > 0) && (
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

                            {/* Daca are DOAR stoc de clearance (si 0 fresh), afisam un mesaj de avertizare in loc de tab-uri */}
                            {hasExpiryStock && (product.stockQuantity - (product.nearExpiryQuantity || 0) <= 0) && (
                                <div className="bg-orange-100 text-orange-800 p-3 rounded-lg flex items-center gap-2 text-sm font-bold border border-orange-200 mb-2">
                                   <Clock size={18} /> Only Clearance stock available!
                                </div>
                            )}

                            <div className="flex items-end justify-between w-full">
                                <div>
                                {activeDiscountPercent > 0 ? (
                                    <>
                                        <div className={`text-4xl font-black tracking-tighter ${buyingMode === 'reduced' ? "text-orange-600" : "text-red-600"}`}>
                                            {activePrice!.toFixed(2)}<span className="text-lg font-bold ml-1">LEI</span>
                                        </div>
                                        <span className="text-sm text-gray-400 line-through">was {product.price.toFixed(2)} Lei</span>

                                        {buyingMode === 'reduced' ? (
                                            <p className="text-xs text-orange-600 mt-1 font-bold">Clearance Price</p>
                                        ) : (
                                            <p className="text-xs text-red-600 mt-1 font-bold">Special Promo</p>
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

                               {/* Selector Cantitate */}
                                <div className={`flex items-center justify-between border border-gray-200 rounded-xl overflow-hidden bg-gray-50 h-12 w-[140px] shadow-sm transition-opacity ${(buyingMode === 'reduced' && isReducedOutOfStock) || (buyingMode === 'fresh' && freshModeOutOfStock) ? "opacity-50 pointer-events-none" : ""}`}>
                                    <button 
                                        onClick={handleDecrease} 
                                        disabled={quantity <= 1} 
                                        className="px-3 h-full text-gray-400 border-r border-gray-200 flex items-center justify-center transition-all hover:bg-red-200 hover:bg-opacity-50 hover:text-black disabled:opacity-30 disabled:hover:bg-transparent"
                                    >
                                        <Minus size={16} strokeWidth={3} />
                                    </button>
                                    
                                    {/* w-full pe text ca sa ocupe spatiul ramas */}
                                    <span className="flex-1 text-center font-bold text-gray-900 bg-white py-3 text-lg select-none h-full flex items-center justify-center">
                                        {quantity}
                                    </span>
                                    
                                    <button 
                                        onClick={handleIncrease} 
                                        disabled={quantity >= maxQuantityForCurrentMode} 
                                        className="px-3 h-full text-blue-600 hover:bg-blue-100 transition-colors border-l border-gray-200 flex items-center justify-center disabled:opacity-30 disabled:hover:bg-transparent"
                                    >
                                        <Plus size={16} strokeWidth={3} />
                                    </button>
                                </div>
                            </div>

                            {/* Buton Add to Cart */}
                            <Button 
                                onClick={handleAddToCartClick}
                                disabled={(buyingMode === 'reduced' && isReducedOutOfStock) || (buyingMode === 'fresh' && freshModeOutOfStock) || isAddingToCart}
                                className={`w-full h-14 rounded-2xl font-black text-lg flex items-center justify-center gap-2 transition-all duration-300
                                    ${(buyingMode === 'reduced' && isReducedOutOfStock) || (buyingMode === 'fresh' && freshModeOutOfStock)
                                        ? "bg-gray-200 text-gray-500 cursor-not-allowed shadow-none" 
                                        : buyingMode === 'reduced' 
                                            ? "bg-orange-600 hover:bg-orange-700 text-white shadow-md shadow-orange-600/20"
                                            : "bg-[#134c9c] hover:bg-[#0f3d7d] text-white shadow-md shadow-blue-900/20"
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
                                        <ProductCard key={rec.id} product={rec} compact={true} />
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