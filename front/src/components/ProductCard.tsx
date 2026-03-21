import { Product } from "@/types";
import { Link } from "react-router-dom";
import { ShoppingBasket, Leaf, Loader2, Clock, Hourglass } from "lucide-react"; // Am schimbat AlertTriangle cu Timer
import { Button } from "./ui/button";
import { useCart } from "@/context/CartContext";
import { useState } from "react";

interface ProductCardProps {
    product: Product;
    compact?: boolean;
}

export default function ProductCard({ product, compact=false }: ProductCardProps) {
    const imageToDisplay = product.imageUrls?.[0] || "https://placehold.co/400?text=No+Image";
    const { addToCart } = useCart();

    // State pentru a sti care jumatate de buton se incarca (sau null daca niciuna)
    const [addingType, setAddingType] = useState<'fresh' | 'reduced' | null>(null);

    //calculam reducerea maxima
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

    //adaugat parametrul isFresh ca sa stim pe care dintre jumatatile butonului a apasat
    const handleAddToCart = async (e: React.MouseEvent, isFresh: boolean) => {
        e.preventDefault(); //nu ne duce la productdetails (evenimentul default cand se apasa pe link)
        e.stopPropagation(); //nu transmite mai departe la parinti eventul

        // 1. Setam butonul corect in loading state
        setAddingType(isFresh ? 'fresh' : 'reduced');

        // 2. Simulam loading-ul (efect vizual ca pe ProductDetails)
        await new Promise(resolve => setTimeout(resolve, 300));

        // 3. Trimitem comanda catre backend
        await addToCart(product.id, 1, isFresh);

        // 4. Oprim loading-ul
        setAddingType(null);
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

                {/* BADGE CLEARANCE ACTIVE (Pus in dreapta sus) */}
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
                        {/* Daca pretul curent e cel de expirare, dar exista si o promotie pe Fresh, o afisam discret */}
                        {hasReduced && freshDiscountPercentage > 0 && (
                            <span className="text-[10px] text-gray-400 font-bold bg-gray-100 px-1.5 py-0.5 rounded mb-1">
                                Fresh: {product.freshPrice.toFixed(2)} Lei
                            </span>
                        )}
                    </div>
                </div>
                {/* BUTON ADAUGARE (SPLIT BUTTON DACA E NEVOIE) */}
               <div className="mt-2 flex flex-col xl:flex-row gap-2">
                    {isOutOfStock ? (
                        <Button
                            disabled
                            className="w-full h-12 rounded-xl bg-gray-200 text-gray-500 font-black text-base shadow-none border-none cursor-not-allowed"
                        >
                            Out of stock
                        </Button>
                    ) : (
                        <>
                            {hasReduced && (
                                <Button
                                    onClick={(e) => handleAddToCart(e, false)}
                                    disabled={addingType !== null}
                                    /* Daca e compact si are si Fresh, aplicam font super mic si spatii reduse */
                                    className={`h-11 rounded-xl font-black transition-all flex items-center justify-center shadow-none border-none w-full ${hasFresh ? (compact ? 'xl:w-1/2 px-0.5 gap-0.5 text-[10px]' : 'xl:w-1/2 text-[11px] xl:text-xs gap-1') : 'text-sm gap-2'} bg-orange-600 text-white hover:bg-orange-700`}
                                    title="Add Reduced to cart"
                                >
                                    {addingType === 'reduced' ? (
                                        <Loader2 size={14} strokeWidth={2.5} className="animate-spin shrink-0" />
                                    ) : (
                                        <>
                                            <Hourglass size={12} strokeWidth={2.5} className="shrink-0" />
                                            {/* Afisam textul "Reduced" cu truncate in caz ca ecranul e absolut minuscul */}
                                            <span className="truncate leading-none">
                                                {hasFresh ? "Reduced" : (
                                                    <span className="flex items-center gap-1">
                                                        <span className="sm:hidden">Add</span>
                                                        <span className="hidden sm:inline">Add to cart</span>
                                                    </span>
                                                )}
                                            </span>
                                        </>
                                    )}
                                </Button>
                            )}

                            {hasFresh && (
                                <Button
                                    onClick={(e) => handleAddToCart(e, true)}
                                    disabled={addingType !== null}
                                    /* La fel si aici pt butonul Fresh */
                                    className={`h-11 rounded-xl font-black transition-all flex items-center justify-center shadow-none border-none w-full ${hasReduced ? (compact ? 'xl:w-1/2 px-0.5 gap-0.5 text-[10px]' : 'xl:w-1/2 text-[11px] xl:text-xs gap-1') : 'text-sm gap-2'} bg-[#134c9c] text-white hover:bg-[#80c4e8] hover:text-gray-800`}
                                    title="Add Fresh to cart"
                                >
                                    {addingType === 'fresh' ? (
                                        <Loader2 size={14} strokeWidth={2.5} className="animate-spin shrink-0" />
                                    ) : (
                                        <>
                                            {hasReduced ? (
                                                <Leaf size={12} strokeWidth={2.5} className="shrink-0" />
                                            ) : (
                                                <ShoppingBasket size={18} strokeWidth={2.5} className="shrink-0" />
                                            )}
                                            
                                            <span className="truncate leading-none">
                                                {hasReduced ? "Fresh" : (
                                                    <span className="flex items-center gap-1">
                                                        <span className="sm:hidden">Add</span>
                                                        <span className="hidden sm:inline">Add to cart</span>
                                                    </span>
                                                )}
                                            </span>
                                        </>
                                    )}
                                </Button>
                            )}
                        </>
                    )}
                </div>
            </div>
        </Link>
    );
}