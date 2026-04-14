import { Product } from "@/types";
import { Link } from "react-router-dom";
import { ShoppingBasket, Leaf, Loader2, Clock, Hourglass, Plus, Minus, Trash2 } from "lucide-react";
import { Button } from "./ui/button";
import { useCart } from "@/context/CartContext";
import { useState, useEffect } from "react";

interface ProductCardProps {
    product: Product;
    compact?: boolean;
}

export default function ProductCard({ product, compact = false }: ProductCardProps) {
    const imageToDisplay = product.imageUrls?.[0] || "https://placehold.co/400?text=No+Image";
    const { addToCart, cartItems, removeFromCart } = useCart();

    const [addingType, setAddingType] = useState<'fresh' | 'reduced' | null>(null);

    // --- STATE-URI PENTRU UI-UL TEMPORAR (+ / -) ---
    // Pastram starea pentru a sti ce a adaugat recent (fresh sau reduced)
    const [recentActionMode, setRecentActionMode] = useState<'fresh' | 'reduced' | null>(null);

    // Calculam reducerea maxima
    const discountPercentage = product.currentPrice < product.price
        ? Math.round(((product.price - product.currentPrice) / product.price) * 100)
        : 0;

    const freshDiscountPercentage = (product.freshPrice && product.freshPrice < product.price)
        ? Math.round(((product.price - product.freshPrice) / product.price) * 100)
        : 0;

    // --- LOGICA DE STOCURI ---
    const expiringStock = product.nearExpiryQuantity || 0;
    const freshStock = product.stockQuantity - expiringStock;

    const hasReduced = expiringStock > 0;
    const hasFresh = freshStock > 0;
    const isOutOfStock = product.stockQuantity <= 0;

    // --- CAUTAM PRODUSUL IN COS (Daca exista) ---
    const cartItemReduced = cartItems.find(item => item.productId === product.id && !item.freshMode);
    const cartItemFresh = cartItems.find(item => item.productId === product.id && item.freshMode);

    const qtyInCartReduced = cartItemReduced?.quantity || 0;
    const qtyInCartFresh = cartItemFresh?.quantity || 0;

    const limitReachedReduced = qtyInCartReduced >= expiringStock;
    const limitReachedFresh = qtyInCartFresh >= freshStock;


    // --- TIMEOUT PENTRU RESETAREA LA BUTOANELE INITIALE ---
    useEffect(() => {
        if (recentActionMode) {
            const timer = setTimeout(() => {
                setRecentActionMode(null);
            }, 5000); // Revine la butoanele normale dupa 5 secunde de inactivitate
            return () => clearTimeout(timer);
        }
    }, [recentActionMode, qtyInCartReduced, qtyInCartFresh]);


    // --- HANDLERS ---
    const handleInitialAdd = async (e: React.MouseEvent, isFresh: boolean) => {
        e.preventDefault();
        e.stopPropagation();

        if (addingType !== null) return;
        setAddingType(isFresh ? 'fresh' : 'reduced');

        try {
            await addToCart(product.id, 1, isFresh);
            // Dupa ce se adauga cu succes, schimbam UI-ul
            setRecentActionMode(isFresh ? 'fresh' : 'reduced');
        } catch (error) {
            // Erorile sunt tratate de toast
        } finally {
            setAddingType(null);
        }
    };

    const handleIncrement = async (e: React.MouseEvent, isFresh: boolean) => {
        e.preventDefault();
        e.stopPropagation();
        
        // Resetam timer-ul
        setRecentActionMode(isFresh ? 'fresh' : 'reduced');
        
        if (addingType !== null) return;
        
        // Verificam limitele inainte de request
        if (!isFresh && limitReachedReduced) return;
        if (isFresh && limitReachedFresh) return;

        setAddingType(isFresh ? 'fresh' : 'reduced');
        try {
            await addToCart(product.id, 1, isFresh);
        } finally {
            setAddingType(null);
        }
    };

    const handleDecrement = async (e: React.MouseEvent, isFresh: boolean, cartItemId: number, currentQty: number) => {
        e.preventDefault();
        e.stopPropagation();
        
        // Resetam timer-ul
        setRecentActionMode(isFresh ? 'fresh' : 'reduced');

        if (addingType !== null) return;
        setAddingType(isFresh ? 'fresh' : 'reduced');

        try {
            if (currentQty <= 1) {
                // Daca e 1 si dam minus/stergere, il stergem de tot si inchidem UI-ul temporar
                await removeFromCart(cartItemId);
                setRecentActionMode(null);
            } else {
                await addToCart(product.id, -1, isFresh);
            }
        } finally {
            setAddingType(null);
        }
    };

    const handleRemoveDirectly = async (e: React.MouseEvent, cartItemId: number) => {
        e.preventDefault();
        e.stopPropagation();
        
        if (addingType !== null) return;
        setAddingType(recentActionMode);
        try {
            await removeFromCart(cartItemId);
            setRecentActionMode(null);
        } finally {
            setAddingType(null);
        }
    }


    // --- RENDER AJUTATOR PENTRU STEPPER ---
    const renderStepper = (isFresh: boolean, cartItem: any, currentQty: number, isLimitReached: boolean) => {
        const themeClass = isFresh ? "bg-blue-50 border-blue-200 text-[#134c9c]" : "bg-orange-50 border-orange-200 text-orange-600";
        const btnHoverClass = isFresh ? "hover:bg-blue-100 hover:text-blue-800" : "hover:bg-orange-100 hover:text-orange-800";

        return (
            <div className={`h-11 w-full rounded-xl border flex items-center justify-between overflow-hidden shadow-sm animate-in fade-in zoom-in duration-300 transition-all ${themeClass}`} onClick={(e) => { e.preventDefault(); e.stopPropagation(); }}>
                {currentQty === 1 ? (
                    <button 
                        onClick={(e) => handleRemoveDirectly(e, cartItem.id)}
                        disabled={addingType !== null}
                        className={`w-9 sm:w-12 h-full flex items-center justify-center transition-colors disabled:opacity-50 text-red-500 hover:bg-red-100 hover:text-red-700 shrink-0`}
                    >
                         {addingType !== null ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={16} strokeWidth={2.5} />}
                    </button>
                ) : (
                    <button 
                        onClick={(e) => handleDecrement(e, isFresh, cartItem.id, currentQty)}
                        disabled={addingType !== null}
                        className={`w-9 sm:w-12 h-full flex items-center justify-center transition-colors disabled:opacity-50 border-r ${isFresh ? 'border-blue-200' : 'border-orange-200'} ${btnHoverClass} shrink-0`}
                    >
                         {addingType !== null ? <Loader2 size={14} className="animate-spin" /> : <Minus size={16} strokeWidth={2.5} />}
                    </button>
                )}
                
                <span className="font-black text-sm sm:text-base flex-1 text-center bg-white h-full flex items-center justify-center select-none">
                    {currentQty} 
                    {/* Am adaugat hidden pe "in cart" pana la breakpoint-ul sm (tableta/pc) */}
                    {!compact && <span className="text-[10px] font-bold text-gray-400 ml-1 uppercase hidden sm:inline">in cart</span>}
                </span>

                <button 
                    onClick={(e) => handleIncrement(e, isFresh)}
                    disabled={addingType !== null || isLimitReached}
                    title={isLimitReached ? "Maximum stock reached" : ""}
                    // Am schimbat de la w-12 la w-9 pe mobil (sm:w-12)
                    className={`w-9 sm:w-12 h-full flex items-center justify-center transition-colors disabled:opacity-30 border-l ${isFresh ? 'border-blue-200' : 'border-orange-200'} ${btnHoverClass} shrink-0 disabled:hover:bg-transparent`}
                >
                     {addingType !== null ? <Loader2 size={14} className="animate-spin" /> : <Plus size={16} strokeWidth={2.5} />}
                </button>
            </div>
        );
    };


    return (
        <Link
            to={`/product/${product.id}`}
            className="group flex flex-col h-full bg-white rounded-2xl transition-all duration-300 shadow-sm hover:shadow-xl hover:shadow-black/5 overflow-hidden relative border border-transparent"
        >
            {/* ZONA IMAGINE */}
            <div className="relative h-36 sm:h-52 w-full p-3 sm:p-4 flex items-center justify-center">
                {/* BADGE REDUCERE PROCENTUALA */}
                {product.hasActiveDiscount && discountPercentage > 0 && (
                    <div className={`absolute ${compact ? 'top-2 left-2 px-1.5 py-0.5 text-[9px]' : 'top-2 left-2 sm:top-3 sm:left-3 px-2 sm:px-3 py-0.5 sm:py-1 text-[10px] sm:text-[11px]'} bg-gradient-to-tr from-rose-500 to-red-600 text-white rounded-full font-black z-20 shadow-md shadow-red-600/20 flex items-center justify-center`}>
                        -{discountPercentage}%
                    </div>
                )}

                {/* BADGE CLEARANCE ACTIVE */}
                {hasReduced && (
                    <div className={`absolute ${compact ? 'top-2 right-2 px-1 py-0.5 text-[7px] gap-0.5' : 'top-2 right-2 sm:top-3 sm:right-3 px-1.5 sm:px-3 py-0.5 sm:py-1 text-[8px] sm:text-[9px] gap-0.5 sm:gap-1.5 tracking-tight sm:tracking-widest'} bg-gradient-to-r from-orange-500 to-red-500 text-white rounded-full font-black uppercase flex items-center z-20 shadow-md shadow-orange-500/20`}>
                        <Clock className={compact ? "w-2 h-2" : "w-2.5 h-2.5 sm:w-3 sm:h-3"} strokeWidth={3} />
                        Clearance
                    </div>
                )}

                <img
                    src={imageToDisplay}
                    alt={product.name}
                    loading="lazy"
                    className="h-full w-full object-contain transition-transform duration-500 group-hover:scale-105"
                />
            </div>

            {/* ZONA INFO */}
            <div className="flex flex-col flex-grow p-4 pt-2">
                <div className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">
                    {product.brandName}
                </div>

                <h3 className="text-sm sm:text-lg font-extrabold text-gray-900 leading-tight line-clamp-2 mb-1 sm:mb-2 group-hover:text-[#134c9c]">
                    {product.name}
                </h3>

                {/* ZONA PRET */}
                <div className="mt-auto">
                    {product.currentPrice < product.price && (
                        <div className="text-sm text-gray-400 line-through font-medium mb-1">
                            {product.price.toFixed(2)} Lei
                        </div>
                    )}
                    <div className="flex items-baseline gap-2">
                        <div className={`text-3xl font-black leading-none tracking-tighter ${product.currentPrice < product.price ? "text-[#e10d0d]" : "text-gray-900"}`}>
                            {product.currentPrice.toFixed(2)}
                            <span className="text-base font-bold ml-1 uppercase">Lei</span>
                        </div>
                        {hasReduced && freshDiscountPercentage > 0 && (
                            <span className="text-[10px] text-gray-400 font-bold bg-gray-100 px-1.5 py-0.5 rounded mb-1">
                                Fresh: {product.freshPrice.toFixed(2)} Lei
                            </span>
                        )}
                    </div>
                </div>

                {/* BUTOANE / UI INTERACTIV */}
               <div className="mt-2 flex flex-col xl:flex-row gap-2 h-11 relative overflow-visible transition-all duration-500 ease-in-out">
                    {isOutOfStock ? (
                        <Button disabled className="w-full h-full rounded-xl bg-gray-200 text-gray-500 font-black text-base shadow-none border-none cursor-not-allowed">
                            Out of stock
                        </Button>
                    ) : (
                        <>
                            {/* AFISARE REDUCED */}
                            {hasReduced && (recentActionMode === 'reduced' && cartItemReduced ? (
                                renderStepper(false, cartItemReduced, qtyInCartReduced, limitReachedReduced)
                            ) : recentActionMode === 'fresh' ? null : (
                                <Button
                                    onClick={(e) => handleInitialAdd(e, false)}
                                    disabled={addingType !== null || limitReachedReduced}
                                    className={`h-full rounded-xl font-black transition-all flex items-center justify-center shadow-none border-none w-full ${hasFresh ? 'xl:w-1/2 text-[11px] xl:text-xs gap-1' : 'text-sm gap-2'} bg-orange-600 text-white hover:bg-orange-700 disabled:opacity-50`}
                                    title="Add Reduced to cart"
                                >
                                    {addingType === 'reduced' ? (
                                        <Loader2 size={14} strokeWidth={2.5} className="animate-spin shrink-0" />
                                    ) : (
                                        <>
                                            <Hourglass size={12} strokeWidth={2.5} className="shrink-0" />
                                            <span className="truncate leading-none">
                                                {hasFresh ? "Reduced" : (
                                                    <span className="flex items-center gap-1"><span className="sm:hidden">Add</span><span className="hidden sm:inline">Add to cart</span></span>
                                                )}
                                            </span>
                                        </>
                                    )}
                                </Button>
                            ))}

                            {/* AFISARE FRESH */}
                            {hasFresh && (recentActionMode === 'fresh' && cartItemFresh ? (
                                renderStepper(true, cartItemFresh, qtyInCartFresh, limitReachedFresh)
                            ) : recentActionMode === 'reduced' ? null : (
                                <Button
                                    onClick={(e) => handleInitialAdd(e, true)}
                                    disabled={addingType !== null || limitReachedFresh}
                                    className={`h-full rounded-xl font-black transition-all flex items-center justify-center shadow-none border-none w-full ${hasReduced ? 'xl:w-1/2 text-[11px] xl:text-xs gap-1' : 'text-sm gap-2'} bg-[#134c9c] text-white hover:bg-[#80c4e8] hover:text-gray-700 disabled:opacity-50`}
                                    title="Add Fresh to cart"
                                >
                                    {addingType === 'fresh' ? (
                                        <Loader2 size={14} strokeWidth={2.5} className="animate-spin shrink-0" />
                                    ) : (
                                        <>
                                            {hasReduced ? <Leaf size={12} strokeWidth={2.5} className="shrink-0" /> : <ShoppingBasket size={18} strokeWidth={2.5} className="shrink-0" />}
                                            <span className="truncate leading-none">
                                                {hasReduced ? "Fresh" : (
                                                    <span className="flex items-center gap-1"><span className="sm:hidden">Add</span><span className="hidden sm:inline">Add to cart</span></span>
                                                )}
                                            </span>
                                        </>
                                    )}
                                </Button>
                            ))}
                        </>
                    )}
                </div>
            </div>
        </Link>
    );
}