import { useEffect, useState } from "react"
import axios from "axios"
import { Product } from "@/types"
import ProductCard from "@/components/ProductCard";
import { ArrowUpDown, Loader2, SearchX, Store, Sparkles, AlertTriangle, Flame, Clock, Search, ArrowLeft, ArrowRight, Leaf, ChevronDown, ChevronUp, TrendingUp } from "lucide-react";
import { Link, useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAuth } from "@/context/AuthContext";

const CATEGORIES_LIST = [
    { name: "Bakery", image: "/categories/bakery.jpg", bg: "bg-amber-50/50", hover: "hover:bg-amber-50 hover:shadow-amber-100/50" },
    { name: "Beverages", image: "/categories/beverages.jpg", bg: "bg-cyan-50/50", hover: "hover:bg-cyan-50 hover:shadow-cyan-100/50" },
    { name: "Meat & Fish", image: "/categories/meat-and-fish.jpg", bg: "bg-red-50/50", hover: "hover:bg-red-50 hover:shadow-red-100/50" },
    { name: "Sweets & Snacks", image: "/categories/sweets-and-snacks.jpg", bg: "bg-pink-50/50", hover: "hover:bg-pink-50 hover:shadow-pink-100/50" },
    { name: "Fruits & Vegetables", image: "/categories/fruits-and-vegetables.jpg", bg: "bg-green-50/50", hover: "hover:bg-green-50 hover:shadow-green-100/50" },
    { name: "Dairy & Eggs", image: "/categories/dairy-and-eggs.jpg", bg: "bg-yellow-50/50", hover: "hover:bg-yellow-50 hover:shadow-yellow-100/50" },
    { name: "Pastry", image: "/categories/pastry.jpg", bg: "bg-purple-50/50", hover: "hover:bg-purple-50 hover:shadow-purple-100/50" }
];

export default function Home() {
    const { token } = useAuth();
    const [searchParams, setSearchParams] = useSearchParams();
    
    const currentCategory = searchParams.get("category");
    const currentBrand = searchParams.get("brand");
    const currentFilter = searchParams.get("filter");
    const currentSearch = searchParams.get("search");

    const [products, setProducts] = useState<Product[]>([]);
    const [recommendations, setRecommendations] = useState<Product[]>([]);
    const [topSellers, setTopSellers] = useState<Product[]>([]); // NOU: State separat pentru Top Sellers
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Stari pentru sistemul Expandable
    const [recsCount, setRecsCount] = useState(5);
    const [topSellersCount, setTopSellersCount] = useState(5);
    const [isDealsExpanded, setIsDealsExpanded] = useState(false);
    const [isSaveMeExpanded, setIsSaveMeExpanded] = useState(false);
    const [isPriceDropsExpanded, setIsPriceDropsExpanded] = useState(false);

    const sortOrder = searchParams.get("sort") || "none";
    const currentPage = parseInt(searchParams.get("page") || "1", 10);
    const ITEMS_PER_PAGE = 42;

    useEffect(() => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }, [searchParams]);

    useEffect(() => {
        const fetchData = async () => {
            try {
                setIsLoading(true);
                const apiUrl = import.meta.env.VITE_API_URL;

                let requestUrl = `${apiUrl}/products`;
                
                if (currentSearch) {
                    requestUrl = `${apiUrl}/products/search?query=${encodeURIComponent(currentSearch)}`;
                } else if (currentCategory && currentCategory !== "AI_RECOMMENDATIONS") {
                    requestUrl += `/filter?category=${encodeURIComponent(currentCategory)}`;
                } else if (currentBrand) {
                    requestUrl += `/filter?brand=${encodeURIComponent(currentBrand)}`;
                }

                const config = token ? { headers: { Authorization: `Bearer ${token}` } } : {};

                const [prodRes, recRes, topRes] = await Promise.all([
                    axios.get(requestUrl),
                    axios.get(`${apiUrl}/recommendations`, config),
                    axios.get(`${apiUrl}/recommendations`) 
                ]);

                setProducts(prodRes.data);
                setRecommendations(recRes.data);
                setTopSellers(topRes.data); // Setam Top Sellers
                
                // Resetam stările de expandare la schimbarea paginii
                setRecsCount(5);
                setTopSellersCount(5);
                setIsDealsExpanded(false);
                setIsSaveMeExpanded(false);
                setIsPriceDropsExpanded(false);

            } catch (err) {
                setError("It seems we can't load the products right now. Please try again later.");
            } finally {
                setIsLoading(false);
            }
        }
        fetchData();
    }, [currentCategory, currentBrand, currentSearch, token]);

    // VIEW LOGIC
    const isMainHomeView = !currentCategory && !currentBrand && !currentFilter && !currentSearch && currentPage === 1;
    const isCategoryOrBrandView = (currentCategory && currentCategory !== "AI_RECOMMENDATIONS") || currentBrand;

   // SECTIUNI DE PRODUSE (Doar produsele IN STOC si cu cantitati valide)
    const inStockProducts = products.filter(p => p.stockQuantity > 0);

    //Save Me: Trebuie sa aiba stoc de clearance (nearExpiryQuantity > 0)
    const saveMeProducts = inStockProducts.filter(p => (p.nearExpiryQuantity || 0) > 0);
    
    //Deals: Vrem produsele care au o reducere SETATA DE ADMIN (nu doar pentru ca expira).
    // deci daca freshPrice < price, inseamna ca exista un discount in baza de date
    const dealsProducts = inStockProducts.filter(p => (p.freshPrice || p.price) < p.price);
    
    //Price Drops contextuale (apar in paginile de categorie/brand). Doar cele in stoc.
    //Aici intra absolut TOATE care au orice fel de reducere (admin sau clearance).
    const contextPriceDrops = inStockProducts.filter(p => 
        ((p.freshPrice || p.price) < p.price) || ((p.nearExpiryQuantity || 0) > 0)
    ).sort((a,b) => {
        const aClearance = (a.nearExpiryQuantity || 0) > 0 ? 1 : 0;
        const bClearance = (b.nearExpiryQuantity || 0) > 0 ? 1 : 0;
        return bClearance - aClearance;
    });
    let baseProductsToDisplay = products;
    
 if (currentCategory === "AI_RECOMMENDATIONS") {
        baseProductsToDisplay = recommendations;
    } else if (currentFilter === "deals") {
        baseProductsToDisplay = dealsProducts;
    } else if (currentFilter === "expiring") {
        baseProductsToDisplay = saveMeProducts;
    } else if (!currentCategory && !currentBrand && !currentFilter && !currentSearch) {
        const recommendedIds = new Set(recommendations.map(r => r.id));
        const otherProducts = products.filter(p => !recommendedIds.has(p.id));
        baseProductsToDisplay = [...recommendations, ...otherProducts];
    }
    const sortedProducts = sortOrder === "none" 
        ? [...baseProductsToDisplay] 
        : [...baseProductsToDisplay].sort((a, b) => {
            if (sortOrder === "price-asc") return a.currentPrice - b.currentPrice;
            if (sortOrder === "price-desc") return b.currentPrice - a.currentPrice;
            if (sortOrder === "name-asc") return a.name.localeCompare(b.name);
            return 0;
        });

    const totalPages = Math.ceil(sortedProducts.length / ITEMS_PER_PAGE);
    const paginatedProducts = sortedProducts.slice(
        (currentPage - 1) * ITEMS_PER_PAGE,
        currentPage * ITEMS_PER_PAGE
    );

   if (isLoading) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center bg-[#f8fafc]">
                <div className="relative animate-in fade-in zoom-in-95 duration-500">
                    {/* Efect de glow pe fundal */}
                    <div className="absolute inset-0 bg-blue-400 blur-[50px] opacity-20 rounded-full"></div>
                    
                    {/* Cardul propriu-zis */}
                    <div className="bg-white p-10 rounded-[2.5rem] shadow-xl shadow-blue-900/5 flex flex-col items-center gap-6 relative z-10 border border-gray-100">
                        <div className="bg-blue-50 p-5 rounded-full">
                            <Loader2 className="animate-spin text-[#134c9c]" size={40} />
                        </div>
                        <div className="text-center">
                            <h3 className="text-2xl font-black text-gray-900 tracking-tight mb-2">Loading fresh deals...</h3>
                            <p className="text-sm font-bold text-gray-400 uppercase tracking-widest">Just a moment</p>
                        </div>
                    </div>
                </div>
            </div>
        )
    }

    if (error) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center bg-[#f8fafc] px-4">
                <div className="bg-white max-w-md w-full p-10 rounded-[3rem] shadow-2xl shadow-red-900/5 border border-red-50 flex flex-col items-center text-center animate-in fade-in zoom-in-95 duration-500">
                    <div className="bg-red-50 p-6 rounded-full mb-8">
                        <AlertTriangle size={60} className="text-red-500" strokeWidth={2.5} />
                    </div>
                    <h2 className="text-3xl font-black text-gray-900 mb-4 tracking-tight">Oops! Connection failed.</h2>
                    <p className="text-gray-500 text-lg mb-10 leading-relaxed">
                        {error}
                    </p>
                    <Button 
                        onClick={() => window.location.reload()} 
                        className="h-14 px-10 rounded-2xl bg-[#134c9c] hover:bg-[#0f3d7d] text-white font-black text-lg shadow-lg hover:-translate-y-1 transition-all w-full"
                    >
                        Refresh Page
                    </Button>
                </div>
            </div>
        )
    }
    return (
        <div className="min-h-screen bg-[#f8fafc] pb-24">
            
          {/* HERO BANNER */}
            {isMainHomeView && (
                <div className="bg-gradient-to-br from-[#0a2747] via-[#0f3d7d] to-[#134c9c] relative overflow-hidden pb-32 pt-16 ">
                    
                    {/* 2. ANIMATED BLOBS  */}
                    <div className="absolute top-[-20%] right-[-10%] w-[600px] h-[600px] bg-cyan-400/25 rounded-full blur-[100px] pointer-events-none animate-blob z-0"></div>
                    <div className="absolute bottom-[-20%] left-[-10%] w-[500px] h-[500px] bg-blue-400/20 rounded-full blur-[80px] pointer-events-none animate-blob z-0" style={{ animationDelay: "2s" }}></div>
                    <div className="absolute top-[20%] left-[20%] w-[400px] h-[400px] bg-emerald-400/15 rounded-full blur-[80px] pointer-events-none animate-blob z-0" style={{ animationDelay: "4s" }}></div>
                    
                    {/* 3. TEXT CONTENT */}
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 flex flex-col items-center text-center">
                        
                        {/* Badge */}
                        <div className="animate-in fade-in slide-in-from-bottom-4 duration-700">
                            <span className="bg-white/10 backdrop-blur-md border border-white/20 text-white text-xs font-black uppercase tracking-widest px-5 py-2 rounded-full mb-8 flex items-center gap-2 shadow-xl hover:bg-white/15 transition-colors cursor-default">
                                <Leaf size={16} className="text-green-400 drop-shadow-[0_0_8px_rgba(74,222,128,0.6)]" /> 
                                Your groceries? Our job.
                            </span>
                        </div>

                        {/* Titlu */}
                        <h1 className="text-5xl md:text-7xl font-black text-white mb-6 tracking-tight leading-[1.1] drop-shadow-lg animate-in fade-in slide-in-from-bottom-6 duration-1000">
                            Smarter choices. <br className="md:hidden" />
                            <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-300 via-[#80c4e8] to-blue-200 drop-shadow-none">
                                Better prices.
                            </span>
                        </h1>

                        {/* Subtitlu */}
                        <p className="text-blue-100/90 text-lg md:text-xl max-w-2xl font-medium leading-relaxed animate-in fade-in slide-in-from-bottom-8 duration-1000">
                            Experience a personalized grocery catalog with <strong className="text-white">dynamic deals</strong> tailored just for you.
                        </p>
                        
                    </div>

                    {/* 4. FADE OUT JOS */}
                    <div className="absolute bottom-0 left-0 w-full h-24 bg-gradient-to-t from-[#f8fafc] to-transparent z-10 pointer-events-none"></div>
                </div>
            )}

            <div className={`max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 ${isMainHomeView ? '-mt-24 relative z-20' : 'pt-10'}`}>
                
                {isMainHomeView && (
                    <div className="animate-in fade-in slide-in-from-bottom-8">
                        
                        {/* CATEGORII */}
                        <div className="mb-20">
                            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4">
                                {CATEGORIES_LIST.map((cat) => (
                                    <Link
                                        to={`/?category=${encodeURIComponent(cat.name)}`}
                                        key={cat.name}
                                        className={`group flex flex-col items-center justify-center p-6 rounded-[2rem] bg-white border border-gray-100 shadow-xl shadow-blue-900/5 transition-all duration-500 hover:-translate-y-2 ${cat.hover} cursor-pointer overflow-hidden relative`}
                                    >
                                        <div className={`absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 ${cat.bg} -z-10`}></div>
                                        <div className="w-20 h-20 mb-4 object-contain transition-transform duration-500 group-hover:scale-110 drop-shadow-md">
                                            <img src={cat.image} alt={cat.name} className="w-full h-full object-cover rounded-full border-4 border-white shadow-sm" />
                                        </div>
                                        <span className="text-sm font-black text-gray-800 text-center leading-tight tracking-tight group-hover:text-[#134c9c] transition-colors">{cat.name}</span>
                                    </Link>
                                ))}
                            </div>
                        </div>

                        {/* RECOMANDARI AI (EXPANDABLE treptat la 10) */}
                        {recommendations.length > 0 && (
                            <div className="mb-14 bg-gradient-to-b from-indigo-50/50 to-transparent p-6 sm:p-8 rounded-[2.5rem] border border-indigo-50 relative animate-in fade-in">
                                <div className="flex flex-wrap sm:flex-nowrap items-center gap-3 sm:gap-4 mb-6">
                                    <div className="w-12 h-12 rounded-2xl flex items-center justify-center text-white shadow-lg bg-gradient-to-br from-indigo-500 to-[#134c9c] shrink-0">
                                        <Sparkles size={24} />
                                    </div>
                                    <div>
                                        <h2 className="text-xl sm:text-2xl font-black text-gray-900 tracking-tight">
                                            {token ? "Recommended For You" : "Trending Products"}
                                        </h2>
                                    </div>
                                    <span className="ml-0 sm:ml-auto px-3 py-1.5 text-[10px] sm:text-xs font-black uppercase rounded-full tracking-widest shadow-sm bg-indigo-50 text-indigo-700 border border-indigo-100 shrink-0">
                                        {token ? "Powered by AI" : "Global Top Sellers"}
                                    </span>
                                </div>
                                <div className="relative">
                                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 lg:gap-5 pb-6">
                                        {recommendations.slice(0, recsCount).map((product: Product) => (
                                            <ProductCard key={`rec-${product.id}`} product={product} />
                                        ))}
                                    </div>
                                </div>

                                {recommendations.length > 5 && (
                                    <div className="flex justify-center -mt-2 relative z-20">
                                        <button 
                                            onClick={() => {
                                                if (recsCount === 5) {
                                                    setRecsCount(10);
                                                } else {
                                                    document.getElementById('catalog-section')?.scrollIntoView({ behavior: 'smooth' });
                                                }
                                            }}
                                            className="flex items-center gap-2 bg-white border border-gray-200 text-gray-600 px-6 py-2.5 rounded-full shadow-md font-bold text-sm hover:bg-indigo-50 hover:text-indigo-600 transition-colors"
                                        >
                                            {recsCount === 5 ? (
                                                <>Show 5 More <ChevronDown size={18} /></>
                                            ) : (
                                                <>Explore Full Catalog <ArrowRight size={18} /></>
                                            )}
                                        </button>
                                    </div>
                                )}
                            </div>
                        )}

                       {/* OUR DEALS */}
                        {dealsProducts.length > 0 && (
                            <div className="mb-14 bg-gradient-to-b from-orange-50/50 to-transparent p-6 sm:p-8 rounded-[2.5rem] border border-orange-50 relative animate-in fade-in">
                                <div className="flex flex-wrap sm:flex-nowrap items-center gap-3 sm:gap-4 mb-6">
                                    <div className="w-12 h-12 rounded-2xl flex items-center justify-center text-white shadow-lg bg-gradient-to-br from-orange-400 to-orange-600 shrink-0">
                                        <Flame size={24} />
                                    </div>
                                    <div>
                                        <h2 className="text-xl sm:text-2xl font-black text-gray-900 tracking-tight">Our Deals</h2>
                                    </div>
                                    <span className="ml-0 sm:ml-auto px-3 py-1.5 text-[10px] sm:text-xs font-black uppercase rounded-full tracking-widest shadow-sm bg-orange-50 text-orange-700 border border-orange-100 shrink-0">Discounts</span>
                                </div>

                                <div className="relative">
                                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 lg:gap-5 pb-6">
                                        {dealsProducts.slice(0, isDealsExpanded ? dealsProducts.length : 5).map((product: Product) => (
                                            <ProductCard key={`deals-${product.id}`} product={product} />
                                        ))}
                                    </div>
                                </div>

                                {dealsProducts.length > 5 && (
                                    <div className="flex justify-center -mt-2 relative z-20">
                                        <button 
                                            onClick={() => setIsDealsExpanded(!isDealsExpanded)}
                                            className="flex items-center gap-2 bg-white border border-gray-200 text-gray-600 px-6 py-2.5 rounded-full shadow-md font-bold text-sm hover:bg-orange-50 hover:text-orange-600 transition-colors"
                                        >
                                            {isDealsExpanded ? (
                                                <>Show Less <ChevronUp size={18} /></>
                                            ) : (
                                                <>Show {dealsProducts.length - 5} More <ChevronDown size={18} /></>
                                            )}
                                        </button>
                                    </div>
                                )}
                            </div>
                        )}

                        {/* SAVE ME */}
                        {saveMeProducts.length > 0 && (
                            <div className="mb-14 bg-gradient-to-b from-red-50/50 to-transparent p-6 sm:p-8 rounded-[2.5rem] border border-red-50 relative animate-in fade-in">
                                <div className="flex flex-wrap sm:flex-nowrap items-center gap-3 sm:gap-4 mb-6">
                                    <div className="w-12 h-12 rounded-2xl flex items-center justify-center text-white shadow-lg bg-gradient-to-br from-red-500 to-rose-600 shrink-0">
                                        <Clock size={24} />
                                    </div>
                                    <div>
                                        <h2 className="text-xl sm:text-2xl font-black text-gray-900 tracking-tight">Save Me</h2>
                                    </div>
                                    <span className="ml-0 sm:ml-auto px-3 py-1.5 text-[10px] sm:text-xs font-black uppercase rounded-full tracking-widest shadow-sm bg-red-100 text-red-700 border border-red-100 shrink-0">Expiring Soon</span>
                                </div>

                                <div className="relative">
                                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 lg:gap-5 pb-6">
                                        {saveMeProducts.slice(0, isSaveMeExpanded ? saveMeProducts.length : 5).map((product: Product) => (
                                            <ProductCard key={`saveme-${product.id}`} product={product} />
                                        ))}
                                    </div>
                                </div>

                                {saveMeProducts.length > 5 && (
                                    <div className="flex justify-center -mt-2 relative z-20">
                                        <button 
                                            onClick={() => setIsSaveMeExpanded(!isSaveMeExpanded)}
                                            className="flex items-center gap-2 bg-white border border-gray-200 text-gray-600 px-6 py-2.5 rounded-full shadow-md font-bold text-sm hover:bg-red-50 hover:text-red-600 transition-colors"
                                        >
                                            {isSaveMeExpanded ? (
                                                <>Show Less <ChevronUp size={18} /></>
                                            ) : (
                                                <>Show {saveMeProducts.length - 5} More <ChevronDown size={18} /></>
                                            )}
                                        </button>
                                    </div>
                                )}
                            </div>
                        )}

                        {/* TOP SELLERS (doar daca esti logat, altfel ai recommendatiosn de sus se transforma autoamt in asta)*/}
                       {token && topSellers.length > 0 && (
                            <div className="mb-14 bg-gradient-to-b from-blue-50/50 to-transparent p-6 sm:p-8 rounded-[2.5rem] border border-blue-50 relative animate-in fade-in">
                                <div className="flex flex-wrap sm:flex-nowrap items-center gap-3 sm:gap-4 mb-6">
                                    <div className="w-12 h-12 rounded-2xl flex items-center justify-center text-white shadow-lg bg-gradient-to-br from-blue-500 to-blue-700 shrink-0">
                                        <TrendingUp size={24} />
                                    </div>
                                    <div>
                                        <h2 className="text-xl sm:text-2xl font-black text-gray-900 tracking-tight">Top Sellers</h2>
                                    </div>
                                    <span className="ml-0 sm:ml-auto px-3 py-1.5 text-[10px] sm:text-xs font-black uppercase rounded-full tracking-widest shadow-sm bg-blue-100 text-blue-700 border border-blue-100 shrink-0">Trending</span>
                                </div>

                                <div className="relative">
                                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 lg:gap-5 pb-6">
                                        {topSellers.slice(0, topSellersCount).map((product: Product) => (
                                            <ProductCard key={`topseller-${product.id}`} product={product} />
                                        ))}
                                    </div>
                                </div>

                                {topSellers.length > 5 && topSellersCount === 5 && (
                                    <div className="flex justify-center -mt-2 relative z-20">
                                        <button 
                                            onClick={() => setTopSellersCount(10)} 
                                            className="flex items-center gap-2 bg-white border border-gray-200 text-gray-600 px-6 py-2.5 rounded-full shadow-md font-bold text-sm hover:bg-blue-50 hover:text-blue-600 transition-colors"
                                        >
                                            Show 5 More <ChevronDown size={18} />
                                        </button>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                )}

                {/* CATALOGUL PRINCIPAL & PRICE DROPS CONTEXTUALE                  */}
                <div id="catalog-section" className={`py-4 scroll-mt-24 ${isMainHomeView ? 'border-t border-gray-100 mt-8' : ''}`}>

                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-10 gap-6 mt-8">
                        {/* BUTON DE RETURN TO MAIN PAGE */}
                    {!isMainHomeView && (
                        <div className="animate-in fade-in">
                            <Link 
                                to="/"
                                className="inline-flex items-center gap-2 text-sm font-bold text-gray-500 hover:text-[#134c9c] transition-colors mb-4"
                            >
                                <ArrowLeft size={16} strokeWidth={3} /> Return to main page
                            </Link>
                        </div>
                    )}
                        <h2 className="text-3xl md:text-4xl font-black text-gray-900 tracking-tight flex items-center gap-4">
                            {currentSearch ? (
                                <>
                                    <div className="p-3 bg-blue-100 text-[#134c9c] rounded-2xl"><Search size={28} /></div>
                                    Results for: "{currentSearch}"
                                </>
                            ) : currentCategory === "AI_RECOMMENDATIONS" ? (
                                <>
                                    <div className="p-3 bg-indigo-100 text-indigo-600 rounded-2xl"><Sparkles size={28} /></div>
                                    Your Personalized Catalog
                                </>
                            ) : currentFilter === "deals" ? (
                                <>
                                    <div className="p-3 bg-orange-100 text-orange-600 rounded-2xl"><Flame size={28} /></div>
                                    Our Deals
                                </>
                            ) : currentFilter === "expiring" ? (
                                <>
                                    <div className="p-3 bg-red-100 text-red-600 rounded-2xl"><Clock size={28} /></div>
                                    Save Me (Clearance)
                                </>
                            ) : currentCategory ? (
                                <>
                                    <div className="p-3 bg-blue-100 text-[#134c9c] rounded-2xl"><Store size={28} /></div>
                                    {currentCategory}
                                </>
                            ) : currentBrand ? (
                                <>
                                    <div className="p-3 bg-blue-100 text-[#134c9c] rounded-2xl"><Search size={28} /></div>
                                    {currentBrand}
                                </>
                            ) : (
                                <>
                                    <div className="p-3 bg-gray-100 text-gray-600 rounded-2xl"><Store size={28} /></div>
                                    Explore our Catalog
                                </>
                            )}
                        </h2>

                        <div className="flex items-center gap-3 w-full md:w-auto bg-white p-2 rounded-2xl border border-gray-100 shadow-sm">
                            <div className="flex items-center gap-2 pl-2">
                                <ArrowUpDown size={16} className="text-gray-400 hidden sm:block" />
                                <span className="text-xs font-black uppercase tracking-widest text-gray-400 hidden sm:block whitespace-nowrap">Sort by:</span>
                            </div>
                            
                            <Select
                                value={sortOrder}
                                onValueChange={(val: string) => {
                                    const newParams = new URLSearchParams(searchParams);
                                    if (val !== "none") newParams.set("sort", val);
                                    else newParams.delete("sort");
                                    newParams.set("page", "1");
                                    if (!currentCategory && !currentBrand && !currentFilter && !currentSearch) {
                                        newParams.set("filter", "catalog");
                                    }
                                    setSearchParams(newParams);
                                }}
                            >
                                <SelectTrigger className="w-full md:w-[220px] bg-gray-50/50 border-transparent shadow-none text-gray-900 font-bold text-sm rounded-xl hover:bg-gray-100 focus:ring-0 focus:ring-offset-0 transition-colors h-10">
                                    <SelectValue placeholder="Recommended"></SelectValue>
                                </SelectTrigger>
                                <SelectContent className="rounded-xl shadow-xl border-gray-100 p-1">
                                    <SelectItem value="none" className="cursor-pointer rounded-lg hover:bg-blue-50 font-medium transition-colors mb-1">Recommended</SelectItem>
                                    <SelectItem value="price-asc" className="cursor-pointer rounded-lg hover:bg-blue-50 font-medium transition-colors mb-1">Price: Low to High</SelectItem>
                                    <SelectItem value="price-desc" className="cursor-pointer rounded-lg hover:bg-blue-50 font-medium transition-colors mb-1">Price: High to Low</SelectItem>
                                    <SelectItem value="name-asc" className="cursor-pointer rounded-lg hover:bg-blue-50 font-medium transition-colors">Name: A to Z</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    {/* SECTIUNEA EXTENSIBILA DE PRICE DROPS PENTRU CATEGORIE/BRAND */}
                    {isCategoryOrBrandView && contextPriceDrops.length > 0 && (
                        <div className="mb-14 bg-gradient-to-b from-orange-50/50 to-transparent p-6 sm:p-8 rounded-[2.5rem] border border-orange-100/50 relative animate-in fade-in slide-in-from-top-4">
                            <div className="flex items-center gap-4 mb-6">
                                <div className="w-12 h-12 rounded-2xl flex items-center justify-center text-white shadow-lg bg-gradient-to-br from-orange-400 to-red-500">
                                    <Flame size={24} />
                                </div>
                                <div>
                                    <h2 className="text-2xl font-black text-gray-900 tracking-tight">Price Drops</h2>
                                    <p className="text-orange-600 font-bold text-sm">Discounts and clearance in {currentCategory || currentBrand}</p>
                                </div>
                            </div>

                            <div className="relative">
                                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 lg:gap-5 pb-6">
                                    {contextPriceDrops.slice(0, isPriceDropsExpanded ? contextPriceDrops.length : 5).map((product: Product) => (
                                        <ProductCard key={`drop-${product.id}`} product={product} />
                                    ))}
                                </div>
                            </div>

                            {contextPriceDrops.length > 5 && (
                                <div className="flex justify-center -mt-2 relative z-20">
                                    <button 
                                        onClick={() => setIsPriceDropsExpanded(!isPriceDropsExpanded)}
                                        className="flex items-center gap-2 bg-white border border-gray-200 text-gray-600 px-6 py-2.5 rounded-full shadow-md font-bold text-sm hover:bg-orange-50 hover:text-orange-600 transition-colors"
                                    >
                                        {isPriceDropsExpanded ? (
                                            <>Show Less <ChevronUp size={18} /></>
                                        ) : (
                                            <>Show {contextPriceDrops.length - 5} More Deals <ChevronDown size={18} /></>
                                        )}
                                    </button>
                                </div>
                            )}
                        </div>
                    )}


                    {baseProductsToDisplay.length === 0 ? (
                        <div className="min-h-[50vh] flex flex-col items-center text-center justify-center bg-white rounded-[3rem] border border-gray-100 shadow-sm p-10">
                            <div className="p-8 bg-gray-50 rounded-full mb-8 shadow-inner hover:bg-gray-800 transition-colors duration-400 group">
                                <SearchX size={80} className="text-gray-300" />
                            </div>
                            <h1 className="font-black text-4xl text-gray-900 mb-4 tracking-tight">
                                No products found!
                            </h1>
                            <div className="text-gray-500 mb-10 max-w-lg text-lg">
                                <p className="mb-1">It looks like we are currently out of stock for <strong className="text-[#134c9c]">
                                    {currentSearch ? `"${currentSearch}"` : currentCategory === "AI_RECOMMENDATIONS" ? "Recommendations" : currentFilter === "deals" ? "Deals" : currentFilter === "expiring" ? "Clearance" : currentCategory || currentBrand}
                                </strong>.</p>
                                <p>Try exploring other fresh categories!</p>
                            </div>
                            <Link to='/'>
                                <Button className="h-14 px-10 rounded-2xl bg-[#134c9c] hover:bg-[#0f3d7d] text-white font-black text-lg shadow-xl shadow-blue-900/20 hover:-translate-y-1 transition-all">
                                    <Store size={22} className="mr-2" />
                                    View all products
                                </Button>
                            </Link>
                        </div>
                    ) : (
                        <div className="space-y-16">
                            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 xl:grid-cols-6 gap-4 lg:gap-5">
                                {paginatedProducts.map((product) => (
                                    <ProductCard key={product.id} product={product} />
                                ))}
                            </div>

                            {totalPages > 1 && (
                                <div className="flex items-center justify-center gap-6 pt-4 pb-12">
                                    <Button
                                        variant="outline"
                                        disabled={currentPage === 1}
                                        onClick={() => {
                                            const newParams = new URLSearchParams(searchParams);
                                            newParams.set("page", Math.max(currentPage - 1, 1).toString());
                                            if (isMainHomeView) newParams.set("filter", "catalog");
                                            setSearchParams(newParams);
                                        }}
                                        className="h-14 px-8 rounded-2xl font-black border-2 border-gray-200 hover:border-[#134c9c] hover:text-[#134c9c] hover:bg-blue-50 disabled:opacity-50 disabled:hover:border-gray-200 disabled:hover:bg-transparent flex items-center gap-3 transition-all"
                                    >
                                        <ArrowLeft size={20} /> Back
                                    </Button>

                                    <div className="bg-white border border-gray-200 h-14 px-6 rounded-2xl flex items-center justify-center shadow-sm">
                                        <span className="font-bold text-gray-500 tracking-widest uppercase text-xs">
                                            Page <span className="text-gray-900 text-base mx-1">{currentPage}</span> of <span className="text-gray-900 text-base ml-1">{totalPages}</span>
                                        </span>
                                    </div>

                                    <Button
                                        variant="outline"
                                        disabled={currentPage === totalPages}
                                        onClick={() => {
                                            const newParams = new URLSearchParams(searchParams);
                                            newParams.set("page", Math.min(currentPage + 1, totalPages).toString());
                                            if (isMainHomeView) newParams.set("filter", "catalog");
                                            setSearchParams(newParams);
                                        }}
                                        className="h-14 px-8 rounded-2xl font-black border-2 border-gray-200 hover:border-[#134c9c] hover:text-[#134c9c] hover:bg-blue-50 disabled:opacity-50 disabled:hover:border-gray-200 disabled:hover:bg-transparent flex items-center gap-3 transition-all"
                                    >
                                        Next <ArrowRight size={20} />
                                    </Button>
                                </div>
                            )}
                        </div>
                    )}
                </div>

            </div>
        </div>
    );
}