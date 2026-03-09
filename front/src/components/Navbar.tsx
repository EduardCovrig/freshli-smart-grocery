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
        const saved = JSON.parse(localStorage.getItem('userNotifs') || '[]');
        setNotifications(saved);
    };

    useEffect(() => {
        if (isAuthenticated) {
            loadNotifications();
            window.addEventListener('new_notification', loadNotifications);
            return () => window.removeEventListener('new_notification', loadNotifications);
        }
    }, [isAuthenticated]);

    const unreadCount = notifications.filter(n => !n.read).length;

    const handleNotificationClick = (notifId: number) => {
        const updated = notifications.map(n => n.id === notifId ? { ...n, read: true } : n);
        setNotifications(updated);
        localStorage.setItem('userNotifs', JSON.stringify(updated));
        setIsNotifMenuOpen(false);
        navigate('/profile', { state: { tab: 'orders' } });
    };

    const handleMarkAllRead = () => {
        const updated = notifications.map(n => ({ ...n, read: true }));
        setNotifications(updated);
        localStorage.setItem('userNotifs', JSON.stringify(updated));
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

            // Facem navigarea catre pagina Home cu parametrul curent de search
            // Pentru simplitate, folosim filtrul de brand 
            // sau putem adauga "?search=" in viitor.
            navigate(`/?search=${encodeURIComponent(searchQuery.trim())}`);


            setSearchQuery("");  //resetam scrisul din searchbar.
        }
    };


    /// Ascunde Navbar pe Login/Register
    if (location.pathname === "/login" || location.pathname === "/register")
        return null;
    return (
        <nav className="sticky top-0 z-[100] flex items-center justify-between px-8 py-4 bg-white/90 backdrop-blur-2md border-b border-gray-200">
            {/* ZONA 1: LOGO & MENU CATEGORII (Stanga) */}
            <div className="flex  gap-10 items-center z-50">
                <Link to="/" className="flex items-center gap-2 group hover:opacity-90 transition-opacity">
                    {/* Afisam logo-ul imagine. h-8 inseamna o inaltime de vreo 32px, poti pune h-10 daca vrei mai mare */}
                    <img src="/logo.png" alt="Freshli Logo" className="h-8 w-auto object-contain" />
                    {/* Daca logo-ul tau are deja textul 'Freshli' in el, poti sterge <span>-ul de mai jos. 
                        Daca logo-ul e doar o iconita, lasa span-ul ca sa scrie textul langa ea. */}
                    <span className="text-2xl font-black text-[#134c9c] tracking-tight group-hover:text-blue-900 transition-colors">
                        Freshli
                    </span>
                </Link>
                <div
                    className="relative hidden lg:block"
                    ref={categoriesRef}
                >
                    <button onClick={() => {
                        setIsMenuOpen(!isMenuOpen);
                        setIsUserMenuOpen(false); // inchidem restul ca sa nu se suprapuna
                        setIsNotifMenuOpen(false); // acelasi lucru
                    }} className="flex items-center gap-2 text-gray-600 hover:text-[#134c9c] font-bold py-2">

                        <Grid3X3 size={23} />
                        Products
                        <ChevronDown size={16} className={`transition-transform duration-500 ${isMenuOpen ? "rotate-180" : ""}`} />
                        {/* animatie pt hover sageata */}
                    </button>

                    {/* MEGA-MENU DROPDOWN */}
                    <div className={`absolute top-full left-0 w-[470px] bg-white border border-gray-150 shadow-2xl shadow-blue-900/30 rounded-2xl p-6 transition-all duration-300 origin-top-left 
                        ${isMenuOpen ? "opacity-100 scale-100 visible" : "opacity-0 scale-95 invisible"}`}>
                        <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4 border-b pb-2">Browse Categories</h3>

                        <div className="grid grid-cols-3 gap-y-6 gap-x-4">
                            {categories.map((c, index) => (
                                <Link 
                                    key={c.id} 
                                    to={`/?category=${encodeURIComponent(c.name)}`} 
                                    onClick={() => setIsMenuOpen(false)}
                                    // Adaugam clasa col-start-2 DOAR pentru al 7-lea element (index 6)
                                    className={`group flex flex-col items-center gap-3 rounded-xl transition-colors ${index === 6 ? "col-start-2" : ""}`}
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
            {/* ZONA 2: SEARCH BAR (Centru) */}
            <div className="hidden md:flex absolute left-1/2 top-1/2 transform -translate-x-1/2 -translate-y-1/2 w-full max-w-xl px-4" ref={searchRef}>
                <div className="relative w-full">
                    <input
                        type="text"
                        placeholder="Search for your favorite products..."
                        value={searchQuery}
                        autoComplete="off"
                        onChange={(e) => setSearchQuery(e.target.value)}
                        onFocus={() => { if (searchResults.length > 0) setShowDropdown(true) }}
                        onKeyDown={handleSearchSubmit}
                        className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-full focus:outline-none focus:border-black bg-gray-50 transition-colors"
                    />
                    {isSearching ? (
                        <Loader2 size={20} className="absolute left-3 top-3 text-gray-400 animate-spin" />
                    ) : (
                        <Search size={20} className="absolute left-3 top-3 text-gray-400" />
                    )}

                    {/* DROPDOWN REZULTATE SEARCH */}
                    {showDropdown && (
                        <div className="absolute top-full left-0 w-full mt-2 bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden z-50 animate-in fade-in slide-in-from-top-2">
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
            {/* ZONA 3: User & Cart (Dreapta) */}
            <div className="flex items-center gap-6 z-10">
                {/* --- MENIU NOTIFICARI (CLOPOTEL) --- */}
                {isAuthenticated && (
                    <div
                        className="relative z-50 mr-2"
                        ref={notifMenuRef}
                    >
                        <button 
                            onClick={() => {
                                setIsNotifMenuOpen(!isNotifMenuOpen);
                                setIsMenuOpen(false);
                                setIsUserMenuOpen(false);
                            }}
                            className="relative p-2 text-gray-500 hover:text-blue-600 transition-colors">
                            <Bell size={22} />
                            {unreadCount > 0 && (
                                <span className="absolute top-0 right-0 bg-red-500 text-white text-[10px] font-bold w-4 h-4 flex items-center justify-center rounded-full border border-white">
                                    {unreadCount}
                                </span>
                            )}
                        </button>

                        <div className={`absolute right-0 top-full mt-2 w-80 bg-white border border-gray-100 shadow-xl rounded-2xl overflow-hidden transition-all duration-300 origin-top-right
                            ${isNotifMenuOpen ? "opacity-100 scale-100 visible" : "opacity-0 scale-75 invisible"}`}>
                            <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
                                <h3 className="font-bold text-gray-900">Notifications</h3>
                                {unreadCount > 0 && (
                                    <button onClick={handleMarkAllRead} className="text-xs text-blue-600 font-bold hover:underline">
                                        Mark all as read
                                    </button>
                                )}
                            </div>
                            <div className="max-h-80 overflow-y-auto">
                                {notifications.length === 0 ? (
                                    <div className="p-6 text-center text-sm text-gray-500">
                                        No recent activity.
                                    </div>
                                ) : (
                                   notifications.map(notif => (
                                        <div 
                                            key={notif.id} 
                                            onClick={() => handleNotificationClick(notif.id)}
                                            className={`p-4 border-b border-gray-50 cursor-pointer hover:bg-gray-50 transition-colors flex gap-3 items-start ${!notif.read ? "bg-blue-50/30" : ""}`}
                                        >
                                            {/* Iconita decisa dinamic */}
                                            <div className={`mt-0.5 p-1.5 rounded-full shrink-0 ${!notif.read ? "bg-white shadow-sm" : "bg-gray-50"}`}>
                                                {getNotificationIcon(notif.message)}
                                            </div>
                                            
                                            <div className="flex-1">
                                                <p className={`text-sm leading-snug ${!notif.read ? "font-bold text-gray-900" : "text-gray-600"}`}>
                                                    {notif.message}
                                                </p>
                                                <p className="text-xs text-gray-400 mt-1.5 font-medium">{formatDate(notif.date)}</p>
                                            </div>
                                            
                                            {/* Punct albastru indicator pentru unread */}
                                            {!notif.read && (
                                                <div className="w-2 h-2 bg-[#134c9c] rounded-full mt-1.5 shrink-0"></div>
                                            )}
                                        </div>
                                    ))
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
                            className="flex items-center gap-2 pl-3 pr-4 py-2 bg-gray-50 hover:bg-gray-100 rounded-full border border-gray-200 transition-colors cursor-pointer"
                        >
                            <div className="w-7 h-7 bg-white rounded-full flex items-center justify-center border border-gray-200 shadow-sm">
                                <User size={14} className="text-[#134c9c]" />
                            </div>
                            <span className="text-sm font-bold text-gray-700 whitespace-nowrap" title={fullName}>
                                {displayName}
                            </span>
                            <ChevronDown size={14} className={`text-gray-500 transition-transform duration-300 ${isUserMenuOpen ? "rotate-180" : ""}`} />
                        </button>

                        {/* Meniul Dropdown */}
                        <div className={`absolute right-0 top-full mt-2 w-64 bg-white border border-gray-100 shadow-xl shadow-blue-900/10 rounded-2xl p-2 transition-all duration-300 origin-top-right
                            ${isUserMenuOpen ? "opacity-100 scale-100 visible" : "opacity-0 scale-75 invisible"}`}>

                            <div className="px-4 py-2 mb-2 border-b border-gray-100">
                                <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">My Account</p>
                            </div>

                            {user?.role === "ADMIN" && (
                                <Link to="/admin" onClick={() => setIsUserMenuOpen(false)} className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold text-orange-600 bg-orange-50 hover:bg-orange-100 transition-colors mb-2">
                                    <Store size={18} /> Admin Dashboard
                                </Link>
                            )}

                            <Link to="/profile" state={{ tab: 'details' }} onClick={() => setIsUserMenuOpen(false)} className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold text-gray-600 hover:bg-blue-50 hover:text-[#134c9c] transition-colors">
                                <User size={18} /> My Profile
                            </Link>
                            <Link to="/profile" state={{ tab: 'orders' }} onClick={() => setIsUserMenuOpen(false)} className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold text-gray-600 hover:bg-blue-50 hover:text-[#134c9c] transition-colors">
                                <Package size={18} /> Order History
                            </Link>
                            <Link to="/profile" state={{ tab: 'addresses' }} onClick={() => setIsUserMenuOpen(false)} className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold text-gray-600 hover:bg-blue-50 hover:text-[#134c9c] transition-colors">
                                <MapPin size={18} /> Saved Addresses
                            </Link>

                            <div className="h-px bg-gray-100 my-1 mx-2"></div>

                            <button onClick={handleLogout} className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold text-red-600 hover:bg-red-50 transition-colors">
                                <LogOut size={18} /> Log Out
                            </button>
                        </div>
                    </div>
                ) : (
                    <Link to="/login" className="flex items-center gap-2 text-gray-600 hover:text-blue-700 font-medium transition">
                        <User size={20} />
                        <span className="hidden sm:inline">Log in</span>
                    </Link>
                )}
                {/* Buton Cos */}
                <Link to="/cart" className="relative bg-blue-50 p-2 text-blue-600 rounded-full hover:bg-blue-100 transition">
                    <ShoppingCart size={20} />
                    {cartCount > 0 && (
                        <span className={`absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold w-5 h-5 flex 
                     items-center justify-center rounded-full transition-transform duration-200 ease-in-out ${isBumping ? "scale-150" : "scale-100"}`}>
                            {cartCount}
                        </span>
                    )}
                </Link>

            </div>
        </nav>
    )
}