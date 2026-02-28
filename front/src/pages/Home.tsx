import { useEffect, useState } from "react"
import axios from "axios"
import { Product } from "@/types"
import ProductCard from "@/components/ProductCard";
import { ArrowUpDown, Loader2, SearchX, Store, Sparkles, AlertTriangle, ChevronRight, Flame, Clock, Wheat, CupSoda, Beef, Cookie, Apple, Egg, CakeSlice, Search, ArrowLeft, ArrowRight } from "lucide-react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAuth } from "@/context/AuthContext";

// Definim lista fixa de categorii cu iconite pentru randul de 7 patratele
const CATEGORIES_LIST = [
    { name: "Bakery", icon: Wheat, color: "text-amber-600", bg: "bg-amber-50", hover: "hover:bg-amber-100" },
    { name: "Beverages", icon: CupSoda, color: "text-cyan-600", bg: "bg-cyan-50", hover: "hover:bg-cyan-100" },
    { name: "Meat & Fish", icon: Beef, color: "text-red-600", bg: "bg-red-50", hover: "hover:bg-red-100" },
    { name: "Sweets & Snacks", icon: Cookie, color: "text-pink-600", bg: "bg-pink-50", hover: "hover:bg-pink-100" },
    { name: "Fruits & Vegetables", icon: Apple, color: "text-green-600", bg: "bg-green-50", hover: "hover:bg-green-100" },
    { name: "Dairy & Eggs", icon: Egg, color: "text-yellow-600", bg: "bg-yellow-50", hover: "hover:bg-yellow-100" },
    { name: "Pastry", icon: CakeSlice, color: "text-purple-600", bg: "bg-purple-50", hover: "hover:bg-purple-100" }
];

export default function Home() {
    const { token } = useAuth();
    const navigate = useNavigate();
    const [searchParams,setSearchParams] = useSearchParams(); //pentru a citi parametrii din url, ex ?category=, etc.
    const currentCategory = searchParams.get("category"); //extragerea categoriei din url, daca exista
    const currentBrand = searchParams.get("brand"); //extrage brandul din url, daca exista.
    const currentFilter = searchParams.get("filter");
    const currentSearch = searchParams.get("search");

    const [products, setProducts] = useState<Product[]>([]); //lista de produse, initial goala
    const [recommendations, setRecommendations] = useState<Product[]>([]);
    const [isLoading, setIsLoading] = useState(true);        //initial se incarca
    const [error, setError] = useState<string | null>(null); //eroare, initial fara.

    // State pentru sortare
    const sortOrder = searchParams.get("sort") || "none";
    //paginare

    const currentPage = parseInt(searchParams.get("page") || "1", 10);
    const ITEMS_PER_PAGE = 42;

    useEffect(() => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }, [searchParams]); //cand se schimba linkul

    useEffect(() => {
        const fetchData = async () => {
            try {
                setIsLoading(true);
                const apiUrl = import.meta.env.VITE_API_URL;

                let requestUrl = `${apiUrl}/products`;
                // daca s-a dat o categorie in url SI NU E CEA DE AI, adaugam la request
                if (currentSearch) {
                    // Daca avem query de search (dat din Enter in Navbar)
                    requestUrl = `${apiUrl}/products/search?query=${encodeURIComponent(currentSearch)}`;
                }
                else if (currentCategory && currentCategory !== "AI_RECOMMENDATIONS") {
                    requestUrl += `/filter?category=${encodeURIComponent(currentCategory)}`;
                }
                else if (currentBrand) {
                    requestUrl += `/filter?brand=${encodeURIComponent(currentBrand)}`;
                }

                const config = token ? { headers: { Authorization: `Bearer ${token}` } } : {};

                const [prodRes, recRes] = await Promise.all([
                    axios.get(requestUrl),
                    axios.get(`${apiUrl}/recommendations`, config)
                ]);

                setProducts(prodRes.data);
                setRecommendations(recRes.data);

            } catch (err) {
                console.error(err);
                setError("It seems we can't load the products right now. Please try again later.");
            } finally {
                setIsLoading(false);
            }
        }
        fetchData();
    }, [currentCategory, currentBrand, currentSearch, token]) //de fiecare data cand se schimba categoria din url, sau brandul.

    // Impartim produsele in liste speciale pentru "Our Deals" si "Save Me"
    // "Save Me" = produse care expira curand (le simulam prin cele care au pret redus dar si cantitate de expirare)
    const saveMeProducts = products.filter(p => (p.nearExpiryQuantity || 0) > 0);
    // "Our Deals" = produse reduse normal (pret curent < pret de baza) care NU sunt in saveMe
    const dealsProducts = products.filter(p => (p.currentPrice || 0) < (p.price || 0) && (p.nearExpiryQuantity || 0) === 0);
    // console.log("Toate produsele primite de la Java:", products);
    // console.log("Produsele pentru OUR DEALS (trebuie sa aiba currentPrice < basePrice):", dealsProducts);

    // Alegem ce lista afisam in catalogul mare de jos.
    let baseProductsToDisplay = products;
    if (currentCategory === "AI_RECOMMENDATIONS") {
        baseProductsToDisplay = recommendations;
    } else if (currentFilter === "deals") {
        baseProductsToDisplay = dealsProducts;
    } else if (currentFilter === "expiring") {
        baseProductsToDisplay = saveMeProducts;
    }

    const sortedProducts = [...baseProductsToDisplay].sort((a, b) => { //sortare produse intern doar pe front, 
        // fara a face request nou la backend pt a fi mai optim si mai rapid.
        if (sortOrder === "price-asc") {
            return a.currentPrice - b.currentPrice;
        } else if (sortOrder === "price-desc") {
            return b.currentPrice - a.currentPrice;
        } else if (sortOrder === "name-asc") {
            return a.name.localeCompare(b.name);
        }
        return 0; // "none"
    });

    const totalPages = Math.ceil(sortedProducts.length / ITEMS_PER_PAGE);
    const paginatedProducts = sortedProducts.slice(
        (currentPage - 1) * ITEMS_PER_PAGE,
        currentPage * ITEMS_PER_PAGE
    );

    if (isLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <Loader2 className="animate-spin text-blue-600" size={50} />
            </div>
        )
    }

    if (error) return (
        <div className="min-h-96 flex flex-col items-center justify-center text-gray-500 font-bold gap-y-14">
            <AlertTriangle size={90} className="text-red-400" />
            <p className="text-[#134c9c] text-4xl tracking-tight">{error}</p>
            <Loader2 className="animate-spin text-[#134c9c]" size={50} />
        </div>
    );

    // COMPONENTA REUTILIZABILA PENTRU UN RAND ORIZONTAL CU BUTON OVERLAP
    const HorizontalRow = ({ title, icon, items, onClickMore, badgeText, badgeColor, badgeClass }: any) => {
        if (items.length === 0) return null;
        return (
            <div className="mb-14 bg-white p-6 sm:p-8 rounded-3xl border border-gray-100 shadow-sm relative">
                <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white shadow-sm ${badgeColor}`}>
                            {icon}
                        </div>
                        <h2 className="text-2xl font-black text-gray-900 tracking-tight">{title}</h2>
                        {badgeText && <span className={`ml-2 px-3 py-1 text-xs font-bold uppercase rounded-full tracking-wider shadow-sm ${badgeClass || 'bg-red-100 text-red-700'}`}>{badgeText}</span>}
                    </div>
                </div>

                <div className="relative">
                    {/* pr-8 lasa spatiu ca sa nu se taie din ultimul produs sub buton */}
                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4 pr-4">
                        {items.slice(0, title === "Recommended For You" ? 10 : 5).map((product: Product) => (
                            <ProductCard key={`${title}-${product.id}`} product={product} />
                        ))}
                    </div>

                    {/* BUTONUL OVERLAP*/}
                    <button
                        onClick={onClickMore}
                        className="absolute top-1/2 -translate-y-1/2 -right-4 sm:-right-6 z-10 w-14 h-14 bg-white border border-gray-100 text-[#134c9c] rounded-full flex items-center justify-center shadow-[0_0_20px_rgba(0,0,0,0.1)] hover:scale-110 hover:bg-blue-50 transition-all duration-300"
                        title="Show More"
                    >
                        <ChevronRight size={32} />
                    </button>
                </div>
            </div>
        );
    };

    const isMainHomeView = !currentCategory && !currentBrand && !currentFilter && !currentSearch && currentPage === 1;

    return (
        <div className="min-h-screen bg-gray-50">
            <div className="max-w-[1600px] mx-auto px-4 py-10">
                {/* ========================================================================= */}
                {/* ZONA DE RANDURI ORIZONTALE (Vizibile doar pe pagina principala de HOME)   */}
                {/* ========================================================================= */}
                {isMainHomeView && (
                    <div className="animate-in fade-in slide-in-from-bottom-8">

                        {/* 1. RECOMANDARI AI */}
                        <HorizontalRow
                            title="Recommended For You"
                            icon={<Sparkles size={20} />}
                            badgeColor="bg-gradient-to-br from-[#134c9c] to-blue-400"
                            badgeClass="bg-gradient-to-r from-indigo-500 to-[#134c9c] text-white"
                            badgeText="Powered by AI"
                            items={recommendations}
                            onClickMore={() => navigate('/?category=AI_RECOMMENDATIONS')}
                        />
                        {/* 4. RANDUL DE 7 CATEGORII */}
                        <div className="mb-16">
                            <h2 className="text-xl font-bold text-gray-400 uppercase tracking-widest text-center mb-6">Shop by Category</h2>
                            {/* grid fix pe 7 coloane (pe desktop) ca sa incapa perfect */}
                            <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-4">
                                {CATEGORIES_LIST.map((cat) => (
                                    <Link
                                        to={`/?category=${encodeURIComponent(cat.name)}`}
                                        key={cat.name}
                                        className={`flex flex-col items-center justify-center p-6 rounded-3xl border border-gray-100 transition-all duration-300 ${cat.bg} ${cat.hover} hover:scale-110 hover:shadow-md cursor-pointer`}
                                    >
                                        <cat.icon size={40} className={`${cat.color} mb-3`} strokeWidth={1.5} />
                                        <span className="text-sm font-bold text-gray-800 text-center leading-tight">{cat.name}</span>
                                    </Link>
                                ))}
                            </div>
                        </div>

                        {/* 3. OUR DEALS */}
                        <HorizontalRow
                            title="Our Deals"
                            icon={<Flame size={20} />}
                            badgeColor="bg-orange-500"
                            items={dealsProducts}
                            onClickMore={() => navigate('/?filter=deals')}
                        />

                        {/* 4. SAVE ME (Aproape de expirare) */}
                        <HorizontalRow
                            title="Save Me"
                            icon={<Clock size={20} />}
                            badgeColor="bg-red-500"
                            badgeText="Expiring Soon"
                            badgeClass="bg-gradient-to-r from-red-500 to-red-900 text-white"
                            items={saveMeProducts}
                            onClickMore={() => navigate('/?filter=expiring')}
                        />
                    </div>
                )}


                {/* ============================================================== */}
                {/* CATALOGUL PRINCIPAL (Unde ajungi cand apesi Explore/Categorii) */}
                {/* ============================================================== */}
                <div id="catalog-section" className="px-2 py-4">

                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end mb-8 border-b border-gray-200 pb-4 gap-4">
                        <h2 className="text-3xl font-black text-gray-900 tracking-tight flex items-center gap-3">
                            {currentSearch ? (
                                <>
                                    <Search size={28} className="text-[#134c9c]" />
                                    Search results for: "{currentSearch}"
                                </>
                            ) : currentCategory === "AI_RECOMMENDATIONS" ? (
                                <>
                                    <Sparkles size={28} className="text-[#134c9c]" />
                                    Your Personalized Catalog
                                </>
                            ) : currentFilter === "deals" ? (
                                <>
                                    <Flame size={28} className="text-orange-500" />
                                    Our Deals
                                </>
                            ) : currentFilter === "expiring" ? (
                                <>
                                    <Clock size={28} className="text-red-500" />
                                    Save Me (Clearance)
                                </>
                            ) : currentCategory ? (
                                <>
                                    <Store size={28} className="text-[#134c9c]" />
                                    {currentCategory}
                                </>
                            ) : currentBrand ? (
                                <>
                                    <Search size={28} className="text-[#134c9c]" />
                                    {currentBrand}
                                </>
                            ) : (
                                <>
                                    <Store size={28} className="text-[#134c9c]" />
                                    Explore our Catalog
                                </>
                            )}
                        </h2>

                        <div className="flex items-center gap-2 w-full sm:w-auto">
                            <ArrowUpDown size={16} className="text-gray-500 hidden sm:block" />
                            <span className="text-sm font-bold uppercase tracking-wider text-gray-500 hidden sm:block">Sort by:</span>
                            {/* OLD Select code with basic html <select>, replaced with shadcn ui select later on.
                             <select
                                value={sortOrder}
                                ... (deleted)
                            </select> */}

                            {/* IMPLEMENTAREA SHADCN UI */}
                            <Select
                                value={sortOrder}
                                onValueChange={(val: string) => {
                                    const newParams = new URLSearchParams(searchParams);

                                    if (val !== "none") newParams.set("sort", val);
                                    else newParams.delete("sort");

                                    newParams.set("page", "1"); // resetam pagina la 1 cand se schimba sortarea
                                    if (!currentCategory && !currentBrand && !currentFilter && !currentSearch) {
                                        newParams.set("filter", "catalog");
                                    }

                                    setSearchParams(newParams);
                                }}
                            > {/* val poate fi orice, se trimite automat value din selecitem aia ca parametru, si il baga in functie */}
                                <SelectTrigger className="w-full sm:w-[200px] bg-white border-gray-200 shadow-sm text-gray-800 font-medium text-sm rounded-xl hover:border-[#134c9c] data-[state=open]:border-[#134c9c] focus:outline-none focus:ring-0 focus:ring-offset-0 transition-colors h-11">
                                    {/* linia cu data-[state=open] vine din shadcn, e cazul in care dropdownul e deschis */}
                                    <SelectValue placeholder="something testing"></SelectValue> {/* apare doar daca sortOrder state e goala sau undefined, nu cazul nostru */}
                                </SelectTrigger>
                                <SelectContent className="rounded-xl shadow-lg border-gray-100 text-cente">
                                    <SelectItem value="none" className="cursor-pointer rounded-lg hover:bg-blue-50 focus:bg-blue-50 transition-colors">Recommended</SelectItem>
                                    <SelectItem value="price-asc" className="cursor-pointer rounded-lg hover:bg-blue-50 focus:bg-blue-50 transition-colors">Price: Low to High</SelectItem>
                                    <SelectItem value="price-desc" className="cursor-pointer rounded-lg hover:bg-blue-50 focus:bg-blue-50 transition-colors">Price: High to Low</SelectItem>
                                    <SelectItem value="name-asc" className="cursor-pointer rounded-lg hover:bg-blue-50 focus:bg-blue-50 transition-colors">Name: A to Z</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    {/* cazul in care backendul merge, dar nu avem produse. */}
                    {baseProductsToDisplay.length === 0 ? (
                        <div className="min-h-[40vh] flex flex-col items-center text-center justify-center bg-gray-50">
                            <div className="p-8 bg-white rounded-full mb-6 shadow-sm hover:bg-gray-800 transition-colors duration-400 group">
                                <SearchX size={64} className="text-gray-300 group-hover:text-white transition-colors" />
                            </div>
                            <h1 className="font-black text-4xl text-gray-900 mb-5">
                                No products found!
                            </h1>
                            <div className="text-gray-500 mb-8 max-w-lg">
                                <p className="mb-0">It looks like we are currently out of stock for <strong className="text-[#134c9c]">
                                    {currentSearch ? `"${currentSearch}"` : currentCategory === "AI_RECOMMENDATIONS" ? "Recommendations" : currentFilter === "deals" ? "Deals" : currentFilter === "expiring" ? "Clearance" : currentCategory || currentBrand}
                                </strong>.</p>
                                <p>Try exploring other <strong className="text-[#1c7d1c]">fresh</strong> categories!</p>
                            </div>
                            <Link to='/'>
                                <Button className="h-12 px-8 rounded-full bg-[#134c9c] hover:bg-[#1e5cad] text-white font-bold text-lg shadow-lg hover:shadow-xl transition-all mb-20">
                                    <Store size={22} />
                                    View all products
                                </Button>
                            </Link>
                        </div>
                    ) : (
                        <div className="space-y-12">
                            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 xl:grid-cols-6 gap-3">
                                {paginatedProducts.map((product) => (
                                    <ProductCard key={product.id} product={product} />
                                ))}
                            </div>

                            {totalPages > 1 && (
                                <div className="flex items-center justify-center gap-4 pt-8 pb-10">
                                    <Button
                                        variant="outline"
                                        disabled={currentPage === 1}
                                        onClick={() => {
                                            const newParams = new URLSearchParams(searchParams);
                                            newParams.set("page", Math.max(currentPage - 1, 1).toString());
                                            if (isMainHomeView) newParams.set("filter", "catalog");
                                            setSearchParams(newParams);
                                        }}
                                        className="h-12 px-6 rounded-full font-bold border-2 hover:bg-gray-100 disabled:opacity-50 flex items-center gap-2"
                                    >
                                        <ArrowLeft size={18} /> Back
                                    </Button>

                                    <span className="font-bold text-gray-500">
                                        Page {currentPage} of {totalPages}
                                    </span>

                                    <Button
                                        variant="outline"
                                        disabled={currentPage === totalPages}
                                        onClick={() => {
                                            const newParams = new URLSearchParams(searchParams);
                                            newParams.set("page", Math.min(currentPage + 1, totalPages).toString());
                                            if (isMainHomeView) newParams.set("filter", "catalog");
                                            setSearchParams(newParams);
                                        }}
                                        className="h-12 px-6 rounded-full font-bold border-2 hover:bg-gray-100 disabled:opacity-50 flex items-center gap-2"
                                    >
                                        Next <ArrowRight size={18} />
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