import { Link, useLocation, useNavigate } from "react-router-dom"
import { ShoppingCart, User, Search, LogOut, ChevronDown, Grid3X3, Package, MapPin, Loader2, Store, ShoppingBag, Bell, XCircle, CheckCircle2 } from "lucide-react" //iconitele
import { useAuth } from "@/context/AuthContext";
import { useCart } from "@/context/CartContext";
import { useState, useEffect, useRef } from "react"
import axios from "axios"
import { Product } from "@/types";

interface Category {
    id: number;
    name: string;
}
interface Notification {
    id: number;
    orderId: number;
    message: string;
    date: string;
    read: boolean;
}

export default function Navbar() {
    const location = useLocation(); //pentru a afla pe ce pagina suntem acum.
    const navigate = useNavigate();
    const { user, logout, isAuthenticated } = useAuth();

    const { cartCount } = useCart();
    const [isBumping, setIsBumping] = useState(false); //state animatie bulina rosie cart

    const [categories, setCategories] = useState<Category[]>([]); //categoriile preluate din backend
    const [isMenuOpen, setIsMenuOpen] = useState(false); //state pentru dropdown menu

    const [isUserMenuOpen, setIsUserMenuOpen] = useState(false); //state pentru dropdown menu user, daca e deschis sau nu

    const [isNotifMenuOpen, setIsNotifMenuOpen] = useState(false); //meniu notificari

    const [notifications, setNotifications] = useState<Notification[]>([]); //notificari

    // Ref-uri pentru detectarea click-urilor in afara
    const categoriesRef = useRef<HTMLDivElement>(null);
    const userMenuRef = useRef<HTMLDivElement>(null);
    const notifMenuRef = useRef<HTMLDivElement>(null);

    // Ascunde meniurile dropdown la click in exterior
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            // Verificam fiecare meniu. Daca s-a dat click, si NU s-a dat in interiorul lui, il inchidem.
            if (categoriesRef.current && !categoriesRef.current.contains(event.target as Node)) {
                setIsMenuOpen(false);
            }
            if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
                setIsUserMenuOpen(false);
            }
            if (notifMenuRef.current && !notifMenuRef.current.contains(event.target as Node)) {
                setIsNotifMenuOpen(false);
            }
        };

        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);


    /* FUNCTII NOTIFICARI */
    const loadNotifications = () => {
        if (!user?.sub) return; // sub este email-ul din JWT
        const storageKey = `userNotifs_${user.sub}`;
        const saved = JSON.parse(localStorage.getItem(storageKey) || '[]');
        setNotifications(saved);
    };

    useEffect(() => {
        if (isAuthenticated) {
            loadNotifications();
            window.addEventListener('new_notification', loadNotifications);
            return () => window.removeEventListener('new_notification', loadNotifications);
        }
    }, [isAuthenticated, user?.sub]);

    const unreadCount = notifications.filter(n => !n.read).length;

    const handleNotificationClick = (notifId: number) => {
        if (!user?.sub) return;
        const storageKey = `userNotifs_${user.sub}`;
        const updated = notifications.map(n => n.id === notifId ? { ...n, read: true } : n);
        setNotifications(updated);
        localStorage.setItem(storageKey, JSON.stringify(updated));
        setIsNotifMenuOpen(false);
        navigate('/profile', { state: { tab: 'orders' } });
    };

    const handleMarkAllRead = () => {
        if (!user?.sub) return;
        const storageKey = `userNotifs_${user.sub}`;
        const updated = notifications.map(n => ({ ...n, read: true }));
        setNotifications(updated);
        localStorage.setItem(storageKey, JSON.stringify(updated));
    };

    // Functie pentru a alege iconita in functie de textul notificarii
    const getNotificationIcon = (message: string) => {
        const msg = message.toLowerCase();
        if (msg.includes("cancelled")) {
            return <XCircle size={20} className="text-red-500" />;
        }
        if (msg.includes("placed") || msg.includes("confirmed")) {
            return <CheckCircle2 size={20} className="text-green-500" />;
        }
        return <Bell size={20} className="text-[#134c9c]" />; // Default
    };
    /* FINAL FUNCTII NOTIFICARI */

    useEffect(() => {
        if (cartCount === 0) return; // Nu animam la incarcarea initiala daca e 0

        setIsBumping(true); // 1. Pornim animatia

        // 2. stop dupa 0.4s
        const timer = setTimeout(() => {
            setIsBumping(false);
        }, 400);

        return () => clearTimeout(timer);
    }, [cartCount]);

    const formatDate = (isoString: string) => {
        const date = new Date(isoString);
        return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) + ' - ' + date.toLocaleDateString();
    };


    // effect pentru preluarea categoriilor din backend
    useEffect(() => {
        const fetchCategories = async () => {
            try {
                const apiUrl = import.meta.env.VITE_API_URL;
                const response = await axios.get(`${apiUrl}/categories`);
                setCategories(response.data);
            }
            catch (err) {
                console.error("Error fetching categories:", err);
            }
        }
        fetchCategories();
    }, []); //doar o data, la inceput

    const getCategoryImagePath = (name: string) => { // Dairy & Eggs -> dairy-and-eggs.jpg
        const fileName = name.toLowerCase().replace(/ & /g, '-and-').replace(/\s+/g, '-');
        return `/categories/${fileName}.jpg`;
    };

    // --- LOGICA DE AFISARE NUME ---
    const firstName = user?.firstName || "";
    const lastName = user?.lastName || "";
    const fullName = `${firstName} ${lastName}`.trim(); // Numele complet
    // Daca lungimea totala > 15 caractere, afiseaza doar prenumele. Altfel, afiseaza numele complet.
    const displayName = fullName.length > 15 ? firstName : fullName;

    // Functie wrapper pentru logout ca sa redirectioneze pe pagina principala ulterior
    const handleLogout = () => {
        logout();
        navigate("/");
    };

    // STATE PENTRU SEARCH DINAMIC
    const [searchQuery, setSearchQuery] = useState("");
    const [searchResults, setSearchResults] = useState<Product[]>([]);
    const [isSearching, setIsSearching] = useState(false);
    const [showDropdown, setShowDropdown] = useState(false);
    const searchRef = useRef<HTMLDivElement>(null);

    // LOGICA SEARCH DEBOUNCE
    useEffect(() => {
        if (searchQuery.trim().length < 2) {
            setSearchResults([]);
            setShowDropdown(false);
            return;
        }

        const delayDebounceFn = setTimeout(async () => {
            setIsSearching(true);
            try {
                const apiUrl = import.meta.env.VITE_API_URL;
                const response = await axios.get(`${apiUrl}/products/search?query=${searchQuery}`);
                // Pastram doar primele 3 rezultate
                setSearchResults(response.data.slice(0, 3));
                setShowDropdown(true);
            } catch (err) {
                console.error("Search error", err);
            } finally {
                setIsSearching(false);
            }
        }, 200); // asteapta 200ms

        return () => clearTimeout(delayDebounceFn);
    }, [searchQuery]);

    // Ascunde search dropdown daca dam click in afara lui
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
                setShowDropdown(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    //enter pe search bar
    const handleSearchSubmit = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter' && searchQuery.trim().length > 0) {
            // Ascundem dropdown-ul
            setShowDropdown(false);
            navigate(`/?search=${encodeURIComponent(searchQuery.trim())}`);


            setSearchQuery("");  //resetam scrisul din searchbar.
        }
    };


    /// Ascunde Navbar pe Login/Register
    if (location.pathname === "/login" || location.pathname === "/register")
        return null;
    return (
        <nav className="sticky top-0 z-[100] flex flex-wrap md:flex-nowrap items-center justify-between gap-y-4 px-4 sm:px-8 py-3 md:py-4 bg-white/80 backdrop-blur-xl border-b border-white/50 shadow-sm">
            <div className="flex gap-3 lg:gap-4 xl:gap-8 items-center z-50 md:flex-1 justify-start">
                <Link to="/" className="flex items-center gap-2 group shrink-0">
                    <img src="/logo.png" alt="Freshli Logo" className="h-8 w-auto object-contain" />
                    <span className="text-2xl font-black text-[#134c9c] tracking-tight">Freshli</span>
                </Link>
                <div
                    className="relative"
                    ref={categoriesRef}
                >
                    <button onClick={() => {
                        setIsMenuOpen(!isMenuOpen);
                        setIsUserMenuOpen(false);
                        setIsNotifMenuOpen(false);
                    }} className={`flex items-center gap-2 p-1.5 sm:px-4 sm:py-2.5 rounded-full font-black text-sm transition-all duration-300 border ${isMenuOpen ? "bg-blue-50 text-[#134c9c] border-blue-100 shadow-sm" : "bg-gray-50/80 text-gray-600 border-gray-100 hover:bg-gray-100 hover:text-gray-900"}`}
                    >
                        <div className={`p-1 rounded-md ${isMenuOpen ? "bg-white shadow-sm" : ""}`}>
                            <Grid3X3 size={18} strokeWidth={2.5} />
                        </div>
                        <span className="hidden xl:inline">Explore Categories</span>
                            <ChevronDown size={14} strokeWidth={3} className={`hidden xl:block transition-transform duration-500 ml-1 ${isMenuOpen ? "rotate-180 text-[#134c9c]" : "text-gray-400"}`} />
                    </button>

                    {/* MEGA-MENU DROPDOWN */}
                    <div className={`fixed sm:absolute top-full sm:top-full left-1/2 sm:left-0 -translate-x-1/2 sm:translate-x-0 mt-3 w-[calc(100vw-2rem)] sm:w-[470px] bg-white/95 backdrop-blur-xl border border-gray-100 shadow-2xl shadow-blue-900/10 rounded-[2.5rem] overflow-hidden transition-all duration-300 origin-top sm:origin-top-left 
                        ${isMenuOpen ? "opacity-100 scale-100 visible translate-y-0" : "opacity-0 scale-95 invisible -translate-y-2"}`}>
                        <div className="bg-white px-6 sm:px-8 py-5 sm:py-6 border-b border-gray-100 flex items-center justify-between relative z-10">
                            <h3 className="font-black text-gray-900 text-base sm:text-lg tracking-tight">
                                Explore Categories
                            </h3>
                            <div className="bg-blue-50 text-[#134c9c] p-2 rounded-xl shadow-sm hidden sm:block">
                                <Grid3X3 size={20} strokeWidth={2.5} />
                            </div>
                        </div>

                        <div className="bg-gray-50/80 p-5 sm:p-8">
                            <div className="grid grid-cols-2 sm:grid-cols-3 gap-y-6 gap-x-4">
                                {categories.map((c, index) => (
                                    <Link
                                        key={c.id}
                                        to={`/?category=${encodeURIComponent(c.name)}`}
                                        onClick={() => setIsMenuOpen(false)}
                                        className={`group flex flex-col items-center gap-2 sm:gap-3 rounded-xl transition-colors ${index === 6 ? "sm:col-start-2" : ""}`}
                                    >
                                        {/* Poza Categoriei */}
                                        <div className="w-16 h-16 rounded-full overflow-hidden bg-gray-50 border-2 border-gray-100 group-hover:border-[#134c9c] group-hover:shadow-md transition-all duration-300 flex items-center justify-center">
                                            <img
                                                src={getCategoryImagePath(c.name)}
                                                alt={c.name}
                                                className="w-full h-full object-cover scale-100 group-hover:scale-110 transition-transform duration-500"
                                                //fallback daca nu gaseste poza 
                                                onError={(e) => { e.currentTarget.src = "https://placehold.co/100x100?text=+" }}
                                            />
                                        </div>
                                        {/* Numele Categoriei */}
                                        <span className="text-sm font-bold text-gray-700 group-hover:text-[#134c9c] text-center leading-tight">
                                            {c.name}
                                        </span>
                                    </Link>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            {/* ZONA 2: SEARCH BAR (Centru pe desktop si randul 2 pe mobil) */}
            <div className="order-last md:order-none w-full md:w-[35%] lg:w-[40%] xl:w-[45%] flex justify-center z-10 px-0 md:px-4" ref={searchRef}>
                <div className="relative w-full max-w-xl">
                    <input
                        type="text"
                        placeholder="Search for your favorite products..."
                        value={searchQuery}
                        autoComplete="off"
                        onChange={(e) => setSearchQuery(e.target.value)}
                        onFocus={() => { if (searchResults.length > 0) setShowDropdown(true) }}
                        onKeyDown={handleSearchSubmit}
                        className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-full focus:outline-none focus:border-black bg-gray-50 transition-colors truncate"
                    />
                    {isSearching ? (
                        <Loader2 size={20} className="absolute left-3 top-3 text-gray-400 animate-spin" />
                    ) : (
                        <Search size={20} className="absolute left-3 top-3 text-gray-400" />
                    )}

                    {/* DROPDOWN REZULTATE SEARCH */}
                    {showDropdown && (
                        <div className="absolute top-full left-0 w-full mt-3 bg-white/95 backdrop-blur-xl border border-gray-100 shadow-2xl shadow-blue-900/10 rounded-[2rem] overflow-hidden z-50 animate-in fade-in slide-in-from-top-2">
                            {searchResults.length > 0 ? (
                                <div>
                                    {/* Generam dinamic lista pentru a separa variantele Fresh / Clearance */}
                                    {searchResults.flatMap(prod => {
                                        const hasClearance = (prod.nearExpiryQuantity || 0) > 0;
                                        const hasFresh = (prod.stockQuantity || 0) - (prod.nearExpiryQuantity || 0) > 0;
                                        const versions = [];

                                        if (hasClearance) {
                                            versions.push({ ...prod, displayMode: 'reduced', uniqueId: `${prod.id}-reduced` });
                                        }
                                        if (hasFresh || (!hasClearance && !hasFresh)) {
                                            versions.push({ ...prod, displayMode: 'fresh', uniqueId: `${prod.id}-fresh` });
                                        }
                                        return versions;
                                    }).slice(0, 4).map((item) => { // Afisam maxim 4 rezultate combinate
                                        const prod = item;
                                        const isClearanceVer = item.displayMode === 'reduced';
                                        const isFreshVer = item.displayMode === 'fresh' && (prod.nearExpiryQuantity || 0) > 0;

                                        // Daca e versiunea proaspata a unui produs redus, afisam pretul intreg
                                        const showPrice = isFreshVer ? prod.price : prod.currentPrice;
                                        const oldPrice = prod.price;
                                        const showDiscount = isClearanceVer || (!isFreshVer && prod.currentPrice < prod.price);

                                        return (
                                            <div
                                                key={item.uniqueId}
                                                onClick={() => {
                                                    setShowDropdown(false);
                                                    setSearchQuery("");
                                                    // TRIMITEM STATE-UL CĂTRE PAGINA DE PRODUS
                                                    navigate(`/product/${prod.id}`, { state: { autoSelectMode: item.displayMode } });
                                                }}
                                                className="flex items-center gap-4 p-3 hover:bg-blue-50 cursor-pointer border-b border-gray-50 last:border-none transition-colors"
                                            >
                                                {/* Poza in stanga */}
                                                <div className="w-12 h-12 bg-white border border-gray-200 rounded-lg flex items-center justify-center shrink-0 p-1 relative">
                                                    {isClearanceVer && <div className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-orange-500 rounded-full"></div>}
                                                    {isFreshVer && <div className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-blue-500 rounded-full"></div>}
                                                    {prod.imageUrls?.[0] ? (
                                                        <img src={prod.imageUrls[0]} alt={prod.name} className="w-full h-full object-contain" />
                                                    ) : (
                                                        <ShoppingBag size={20} className="text-gray-300" />
                                                    )}
                                                </div>
                                                {/* Nume si brand in centru */}
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex items-center gap-2">
                                                        <h4 className="text-sm font-bold text-gray-900 truncate">{prod.name}</h4>
                                                        {isClearanceVer && <span className="text-[9px] bg-orange-100 text-orange-700 px-1.5 py-0.5 rounded font-black uppercase tracking-wider">Clearance</span>}
                                                        {isFreshVer && <span className="text-[9px] bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded font-black uppercase tracking-wider">Fresh</span>}
                                                    </div>
                                                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest truncate">{prod.brandName}</p>
                                                </div>
                                                {/* Pret in dreapta */}
                                                <div className="text-right shrink-0 flex flex-col items-end justify-center">
                                                    {showDiscount ? (
                                                        <>
                                                            <span className="text-[10px] text-gray-400 line-through font-bold leading-none mb-0.5">
                                                                {oldPrice.toFixed(2)} Lei
                                                            </span>
                                                            <span className="text-red-600 font-black leading-none">
                                                                {showPrice.toFixed(2)} Lei
                                                            </span>
                                                        </>
                                                    ) : (
                                                        <span className="text-[#134c9c] font-black">
                                                            {showPrice.toFixed(2)} Lei
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                        )
                                    })}
                                </div>
                            ) : (
                                <div className="p-4 text-center text-sm text-gray-500">No products found.</div>
                            )}
                        </div>
                    )}
                </div>
            </div>
            {/* ZONA 3: User & Cart & Notifications (Dreapta) */}
            <div className="flex items-center gap-2 sm:gap-4 lg:gap-6 z-10 md:flex-1 justify-end">
                {/* --- MENIU NOTIFICARI (CLOPOTEL) --- */}
                {isAuthenticated && (
                    <div
                        className="relative z-50 mr-2"
                        ref={notifMenuRef}
                    >
                        {/* Buton Clopotel */}
                        <button
                            onClick={() => {
                                setIsNotifMenuOpen(!isNotifMenuOpen);
                                setIsMenuOpen(false);
                                setIsUserMenuOpen(false);
                            }}
                            className={`relative p-2.5 rounded-full transition-all duration-300 ${isNotifMenuOpen ? "bg-blue-50 text-[#134c9c]" : "text-gray-500 hover:text-[#134c9c] hover:bg-gray-50"}`}
                        >
                            <Bell size={22} className={unreadCount > 0 ? "animate-bounce origin-top" : ""} style={{ animationIterationCount: 1.5 }} />
                            {unreadCount > 0 && (
                                <span className="absolute top-0 -right-0.5 bg-red-600 text-white text-[10px] font-black min-w-[20px] h-5 px-1 flex items-center justify-center rounded-full border-[2.5px] border-white shadow-sm">
                                    {unreadCount}
                                </span>
                            )}
                        </button>

                        {/* Dropdown Notificari*/}
                        <div className={`fixed sm:absolute right-4 sm:right-0 top-full sm:top-full mt-3 w-[calc(100vw-2rem)] sm:w-[380px] bg-white/95 backdrop-blur-xl border border-gray-100 shadow-2xl shadow-blue-900/10 rounded-[2.5rem] overflow-hidden transition-all duration-300 origin-top sm:origin-top-right
                            ${isNotifMenuOpen ? "opacity-100 scale-100 visible translate-y-0" : "opacity-0 scale-95 invisible -translate-y-2"}`}>
                            {/* Header */}
                            <div className="px-6 py-5 border-b border-gray-100 flex justify-between items-center sticky top-0 bg-white/90 z-10">
                                <h3 className="font-black text-gray-900 text-lg tracking-tight flex items-center gap-2">
                                    Notifications
                                </h3>
                                {unreadCount > 0 && (
                                    <button
                                        onClick={handleMarkAllRead}
                                        className="text-xs text-[#134c9c] font-bold bg-blue-50 hover:bg-blue-100 px-3 py-1.5 rounded-full transition-colors"
                                    >
                                        Mark all read
                                    </button>
                                )}
                            </div>

                            {/* Body */}
                            <div className="max-h-[420px] overflow-y-auto p-2">
                                {notifications.length === 0 ? (
                                    <div className="p-10 flex flex-col items-center justify-center text-center">
                                        <div className="w-16 h-16 bg-green-50 rounded-full flex items-center justify-center mb-4">
                                            <CheckCircle2 size={32} className="text-green-500" strokeWidth={2.5} />
                                        </div>
                                        <p className="font-black text-gray-900 text-lg mb-1">You're all caught up!</p>
                                        <p className="text-sm text-gray-500 font-medium">No new notifications right now.</p>
                                    </div>
                                ) : (
                                    <div className="space-y-1">
                                        {notifications.map(notif => (
                                            <div
                                                key={notif.id}
                                                onClick={() => handleNotificationClick(notif.id)}
                                                className={`p-4 rounded-2xl cursor-pointer transition-all duration-300 flex gap-4 items-start relative group ${!notif.read ? "bg-blue-50/60 hover:bg-blue-50" : "hover:bg-gray-50"}`}
                                            >
                                                {/* Iconita cu animatie la hover */}
                                                <div className={`mt-0.5 p-2.5 rounded-xl shrink-0 transition-transform duration-300 group-hover:scale-110 ${!notif.read ? "bg-white shadow-sm" : "bg-gray-100"}`}>
                                                    {getNotificationIcon(notif.message)}
                                                </div>

                                                {/* Mesajul */}
                                                <div className="flex-1 min-w-0 pr-6">
                                                    <p className={`text-sm leading-relaxed line-clamp-3 ${!notif.read ? "font-bold text-gray-900" : "text-gray-600 font-medium"}`}>
                                                        {notif.message}
                                                    </p>
                                                    <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mt-2">
                                                        {formatDate(notif.date)}
                                                    </p>
                                                </div>

                                                {/* Punctul albastru animat (pulse) pentru Unread */}
                                                {!notif.read && (
                                                    <div className="absolute right-5 top-1/2 -translate-y-1/2 w-2.5 h-2.5 bg-[#134c9c] rounded-full">
                                                        <div className="absolute inset-0 rounded-full bg-[#134c9c] animate-ping opacity-75"></div>
                                                    </div>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                )}
                {/* --- SFARSIT MENIU NOTIFICARI --- */}
                {/* Buton User / Dropdown */}
                {isAuthenticated ? (
                    <div
                        className="relative z-50"
                        ref={userMenuRef}
                    >
                        {/* Butonul principal care te duce pe default (/profile) */}
                        <button
                            onClick={() => {
                                setIsUserMenuOpen(!isUserMenuOpen);
                                setIsMenuOpen(false);
                                setIsNotifMenuOpen(false);
                            }}
                            className={`flex items-center gap-2.5 p-1.5 sm:pl-2 sm:pr-4 rounded-full font-black text-sm transition-all duration-300 border cursor-pointer ${isUserMenuOpen ? "bg-blue-50 text-[#134c9c] border-blue-100 shadow-sm" : "bg-gray-50/80 text-gray-700 border-gray-100 hover:bg-gray-100"}`}
                        >
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center transition-colors ${isUserMenuOpen ? "bg-white shadow-sm text-[#134c9c]" : "bg-white border border-gray-200 shadow-sm text-gray-500"}`}>
                                <User size={16} strokeWidth={2.5} />
                            </div>
                            <span className="hidden lg:inline whitespace-nowrap tracking-tight" title={fullName}>
                                {displayName}
                            </span>
                            <ChevronDown size={14} strokeWidth={3} className={`hidden lg:block transition-transform duration-500 ml-0.5 ${isUserMenuOpen ? "rotate-180 text-[#134c9c]" : "text-gray-400"}`} />
                        </button>

                        {/* Meniul Dropdown User */}
                        <div className={`fixed sm:absolute right-4 sm:right-0 top-full sm:top-full mt-3 w-[calc(100vw-2rem)] sm:w-72 bg-white/95 backdrop-blur-xl border border-gray-100 shadow-2xl shadow-blue-900/10 rounded-[2.5rem] overflow-hidden transition-all duration-300 origin-top sm:origin-top-right
                            ${isUserMenuOpen ? "opacity-100 scale-100 visible translate-y-0" : "opacity-0 scale-95 invisible -translate-y-2"}`}>

                            {/* Header Alb - Info Card Utilizator */}
                            <div className="bg-white px-6 py-5 border-b border-gray-100 flex items-center gap-4 relative z-10">
                                <div className="w-12 h-12 bg-blue-50 rounded-2xl flex items-center justify-center border border-blue-100 shadow-sm shrink-0">
                                    <User size={24} className="text-[#134c9c]" strokeWidth={2.5} />
                                </div>
                                <div className="flex flex-col min-w-0">
                                    <span className="text-base font-black text-gray-900 truncate" title={fullName}>
                                        {fullName}
                                    </span>
                                    <span className="text-[10px] font-bold text-blue-600 uppercase tracking-widest truncate mt-0.5">
                                        {user?.role === "ADMIN" ? "Administrator" : "Customer"}
                                    </span>
                                </div>
                            </div>

                            {/* Body Gri - optiunile meniului */}
                            <div className="bg-gray-50/80 p-3">
                                <div className="space-y-1 mb-2">
                                    {user?.role === "ADMIN" && (
                                        <Link to="/admin" onClick={() => setIsUserMenuOpen(false)} className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold text-orange-600 hover:bg-white hover:shadow-sm border border-transparent hover:border-orange-100 transition-all">
                                            <Store size={18} strokeWidth={2.5} /> Admin Dashboard
                                        </Link>
                                    )}

                                    <Link to="/profile" state={{ tab: 'details' }} onClick={() => setIsUserMenuOpen(false)} className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold text-gray-600 hover:bg-white hover:text-[#134c9c] hover:shadow-sm border border-transparent hover:border-gray-100 transition-all">
                                        <User size={18} strokeWidth={2.5} /> My Profile
                                    </Link>
                                    <Link to="/profile" state={{ tab: 'orders' }} onClick={() => setIsUserMenuOpen(false)} className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold text-gray-600 hover:bg-white hover:text-[#134c9c] hover:shadow-sm border border-transparent hover:border-gray-100 transition-all">
                                        <Package size={18} strokeWidth={2.5} /> Order History
                                    </Link>
                                    <Link to="/profile" state={{ tab: 'addresses' }} onClick={() => setIsUserMenuOpen(false)} className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold text-gray-600 hover:bg-white hover:text-[#134c9c] hover:shadow-sm border border-transparent hover:border-gray-100 transition-all">
                                        <MapPin size={18} strokeWidth={2.5} /> Saved Addresses
                                    </Link>
                                </div>

                                <div className="h-px bg-gray-200/60 my-2 mx-4"></div>

                                <button onClick={handleLogout} className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold text-red-600 hover:bg-white hover:shadow-sm border border-transparent hover:border-red-100 transition-all mt-2">
                                    <LogOut size={18} strokeWidth={2.5} /> Log Out
                                </button>
                            </div>
                        </div>
                    </div>
                ) : (
                    <Link to="/login" className="flex items-center gap-2 text-gray-600 hover:text-blue-700 font-medium transition">
                        <User size={20} />
                        <span className="hidden sm:inline">Log in</span>
                    </Link>
                )}
                {/* Buton Cos */}
                <Link to="/cart" className="relative p-2.5 rounded-full text-gray-500 hover:text-[#134c9c] hover:bg-gray-50 transition-all duration-300">
                    <ShoppingCart size={22} strokeWidth={2.5} />
                    {cartCount > 0 && (
                        <span className={`absolute top-0 -right-1 bg-[#134c9c] text-white text-[10px] font-black min-w-[20px] h-5 px-1 flex items-center justify-center rounded-full border-[2.5px] border-white shadow-sm transition-transform duration-300 ease-out ${isBumping ? "scale-125" : "scale-100"}`}>
                            {cartCount}
                        </span>
                    )}
                </Link>
            </div>
        </nav>
    )
}