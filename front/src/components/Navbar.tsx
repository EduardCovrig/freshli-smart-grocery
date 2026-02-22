import { Link, useLocation, useNavigate } from "react-router-dom"
import { ShoppingCart, User, Search, LogOut, ChevronDown, Grid3X3, Package, MapPin, Loader2, Store, ShoppingBag, Bell } from "lucide-react" //iconitele
import { useAuth } from "@/context/AuthContext";
import { useCart } from "@/context/CartContext";
import {useState,useEffect, useRef} from "react"
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
    useEffect(() => 
    {
        const fetchCategories= async () => {
            try {
                const apiUrl=import.meta.env.VITE_API_URL;
                const response=await axios.get(`${apiUrl}/categories`);
                setCategories(response.data);
            }
            catch(err)
            {
                console.error("Error fetching categories:", err);
            }
        }
        fetchCategories();
    },[]); //doar o data, la inceput

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
        <nav className="sticky top-0 z-[100] flex items-center justify-between px-8 py-4 bg-white/90 backdrop-blur-md border-b border-gray-200">
            {/* ZONA 1: LOGO & MENU CATEGORII (Stanga) */}
            <div className="flex  gap-10 items-center z-50">
                <Link to="/" className="text-2xl font-bold text-[#134c9c] hover:text-blue-900">
                    EdwC Store
                </Link>
                <div 
                    className="relative hidden lg:block"
                    onMouseEnter={() => setIsMenuOpen(true)}
                    onMouseLeave={() => setIsMenuOpen(false)}
                >
                    <button className="flex items-center gap-2 text-gray-600 hover:text-[#134c9c] font-bold py-2">
                        <Grid3X3 size={23} />
                        Products
                        <ChevronDown size={16} className={`transition-transform duration-500 ${isMenuOpen ? "rotate-180" : ""}`}/>
                        {/* animatie pt hover sageata */}
                    </button>

                    {/* MEGA-MENU DROPDOWN */}
                    <div className={`absolute top-full left-0 w-[470px] bg-white border border-gray-150 shadow-2xl shadow-blue-900/30 rounded-2xl p-6 transition-all duration-300 origin-top-left 
                        ${isMenuOpen ? "opacity-100 scale-100 visible" : "opacity-0 scale-95 invisible"}`}>
                        <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4 border-b pb-2">Browse Categories</h3>
                        
                        <div className="grid grid-cols-3 gap-y-6 gap-x-4">
                            {categories.map((c) => (
                                <Link 
                                    key={c.id} 
                                    to={`/?category=${encodeURIComponent(c.name)}`} 
                               
                                    // transforma & in %26.
                                    onClick={() => setIsMenuOpen(false)}
                                    className="group flex flex-col items-center gap-3 rounded-xl transition-colors"
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
                        onFocus={() => { if(searchResults.length > 0) setShowDropdown(true) }}
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
                                    {searchResults.map((prod) => (
                                        <div 
                                            key={prod.id}
                                            onClick={() => {
                                                setShowDropdown(false);
                                                setSearchQuery("");
                                                navigate(`/product/${prod.id}`);
                                            }}
                                            className="flex items-center gap-4 p-3 hover:bg-blue-50 cursor-pointer border-b border-gray-50 last:border-none transition-colors"
                                        >
                                            {/* Poza in stanga */}
                                            <div className="w-12 h-12 bg-white border border-gray-200 rounded-lg flex items-center justify-center shrink-0 p-1">
                                                {prod.imageUrls?.[0] ? (
                                                    <img src={prod.imageUrls[0]} alt={prod.name} className="w-full h-full object-contain" />
                                                ) : (
                                                    <ShoppingBag size={20} className="text-gray-300" />
                                                )}
                                            </div>
                                            {/* Nume si brand in centru */}
                                            <div className="flex-1 min-w-0">
                                                <h4 className="text-sm font-bold text-gray-900 truncate">{prod.name}</h4>
                                                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest truncate">{prod.brandName}</p>
                                            </div>
                                            {/* Pret in dreapta */}
                                            <div className="text-right shrink-0">
                                                <span className="text-[#134c9c] font-black">{prod.currentPrice.toFixed(2)} Lei</span>
                                            </div>
                                        </div>
                                    ))}
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
                        onMouseEnter={() => setIsNotifMenuOpen(true)}
                        onMouseLeave={() => setIsNotifMenuOpen(false)}
                    >
                        <button className="relative p-2 text-gray-500 hover:text-blue-600 transition-colors">
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
                                            className={`p-4 border-b border-gray-50 cursor-pointer hover:bg-gray-50 transition-colors ${!notif.read ? "bg-blue-50/30" : ""}`}
                                        >
                                            <p className={`text-sm ${!notif.read ? "font-bold text-gray-900" : "text-gray-600"}`}>
                                                {notif.message}
                                            </p>
                                            <p className="text-xs text-gray-400 mt-1">{formatDate(notif.date)}</p>
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
                        onMouseEnter={() => setIsUserMenuOpen(true)}
                        onMouseLeave={() => setIsUserMenuOpen(false)}
                    >
                        {/* Butonul principal care te duce pe default (/profile) */}
                        <Link 
                            to="/profile" 
                            className="flex items-center gap-2 pl-3 pr-4 py-2 bg-gray-50 hover:bg-gray-100 rounded-full border border-gray-200 transition-colors"
                        >
                            <div className="w-7 h-7 bg-white rounded-full flex items-center justify-center border border-gray-200 shadow-sm">
                                <User size={14} className="text-[#134c9c]" />
                            </div>
                            <span className="text-sm font-bold text-gray-700 whitespace-nowrap" title={fullName}>
                                {displayName}
                            </span>
                            <ChevronDown size={14} className={`text-gray-500 transition-transform duration-300 ${isUserMenuOpen ? "rotate-180" : ""}`} />
                        </Link>

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