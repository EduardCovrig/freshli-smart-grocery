import { useEffect, useState } from "react";
import axios from "axios";
import { useAuth } from "@/context/AuthContext";
import { Link, Navigate } from "react-router-dom";
import {
    LayoutDashboard,
    TrendingUp,
    PackageOpen,
    AlertTriangle,
    ArrowLeft,
    Store,
    Search,
    Loader2,
    CheckCircle2,
    Box,
    Trash2,
    Edit2,
    Save,
    X,
    Clock,
    ShoppingCart,
    CalendarDays,
    Bell,
    Check,
    Users,
    Send,
    TrendingDown,
    Plus,
    ChevronDown,
    ChevronUp
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Product } from "@/types";

interface OrderItem {
    productName: string;
    quantity: number;
    price: number;
    subTotal: number;
}

interface OrderDetails {
    id: number;
    status: string;
    totalPrice: number;
    createdAt: string;
    items: OrderItem[];
    userEmail?: string;
}

interface ChurnData { //date pt clienti cu risc de nu a mai comanda pe platforma, folositi in tab-ul de users analytics.
    userId: number;
    email: string;
    name: string;
    churnRisk: number;
    totalOrders: number;
    totalSpent: number;
    daysSinceLastOrder: number;
}

interface Brand { id: number; name: string; }
interface Category { id: number; name: string; }

export default function AdminDashboard() {
    const { token, user } = useAuth();

    const [activeTab, setActiveTab] = useState<'dashboard' | 'products' | 'expiring' | 'ordersList' | 'revenue' | 'notifications' | 'churn'>('dashboard');

    const [stats, setStats] = useState({ totalOrders: 0, totalRevenue: 0, expiringProducts: 0 });
    const [isLoadingStats, setIsLoadingStats] = useState(true);
    const [timeRange, setTimeRange] = useState<'week' | 'month' | 'year'>('week');

    const [products, setProducts] = useState<Product[]>([]);
    const [isLoadingProducts, setIsLoadingProducts] = useState(false);

    const [editingProductId, setEditingProductId] = useState<number | null>(null);
    const [editPriceValue, setEditPriceValue] = useState<string>("");
    const [editStockValue, setEditStockValue] = useState<number>(0);

    const [allOrders, setAllOrders] = useState<OrderDetails[]>([]);
    const [isLoadingOrders, setIsLoadingOrders] = useState(false);
    const [orderSearchTerm, setOrderSearchTerm] = useState("");
    const [productSearchTerm, setProductSearchTerm] = useState("");
    const [clearanceSearchTerm, setClearanceSearchTerm] = useState("");
    const [updatingOrderId, setUpdatingOrderId] = useState<number | null>(null);
    const [statusDrafts, setStatusDrafts] = useState<Record<number, string>>({});

    // Stari pentru adaugare produs
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [brands, setBrands] = useState<Brand[]>([]);
    const [categories, setCategories] = useState<Category[]>([]);
    const [showAttributes, setShowAttributes] = useState(false); // Pentru meniul extensibil
    const [uploadFile, setUploadFile] = useState<File | null>(null);

    const [newProduct, setNewProduct] = useState({
        name: "",
        description: "",
        price: "",
        stockQuantity: "",
        unitOfMeasure: "buc",
        expirationDate: "",
        brandId: 0, // 0 = neselectat
        categoryId: 0, // 0 = neselectat
        imageUrls: [""],
        // NOU: campurile pentru atribute
        calories: "",
        proteins: "",
        carbs: "",
        fats: ""
    });

    // NOU: Aducem brandurile si categoriile din baza de date o singura data la incarcare
    useEffect(() => {
        const fetchBrandsAndCategories = async () => {
            try {
                const apiUrl = import.meta.env.VITE_API_URL;
                const [brandsRes, categoriesRes] = await Promise.all([
                    axios.get(`${apiUrl}/brands`),
                    axios.get(`${apiUrl}/categories`)
                ]);
                setBrands(brandsRes.data);
                setCategories(categoriesRes.data);
            } catch (err) {
                console.error("Eroare la incarcare branduri/categorii", err);
            }
        };
        fetchBrandsAndCategories();
    }, []);


   const handleAddProduct = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const apiUrl = import.meta.env.VITE_API_URL;
            let finalImageUrl = newProduct.imageUrls[0]; // Imaginea default daca nu incarca nimic

            // DACA UTILIZATORUL A SELECTAT O IMAGINE, O TRIMITEM LA JAVA PRIMA DATA
            if (uploadFile) {
                const formData = new FormData();
                formData.append("file", uploadFile);
                formData.append("brandId", newProduct.brandId.toString());
                formData.append("productName", newProduct.name);

                // Trimitem ca 'multipart/form-data'
                const uploadRes = await axios.post(`${apiUrl}/products/upload-image`, formData, {
                    headers: { 
                        Authorization: `Bearer ${token}`,
                        "Content-Type": "multipart/form-data" 
                    }
                });
                
                //Java ne va returna numele curat generat (ex: "/brand-lapte.jpg")
                finalImageUrl = uploadRes.data;
            }

          const attributes: Record<string, string> = {};
            if (newProduct.calories) attributes["Calories"] = `${newProduct.calories} kcal`;
            if (newProduct.proteins) attributes["Proteins"] = `${newProduct.proteins} g`;
            if (newProduct.carbs) attributes["Carbs"] = `${newProduct.carbs} g`;
            if (newProduct.fats) attributes["Fats"] = `${newProduct.fats} g`;

            const validImageUrls = finalImageUrl && finalImageUrl.trim() !== "" ? [finalImageUrl] : []; //verificare imagini

            // CONSTRUIM PAYLOAD-UL DE BAZA (Doar cu campurile absolut obligatorii)
           const payload: any = {
                name: newProduct.name,
                description: newProduct.description,
                price: Number(newProduct.price) || 0,
                stockQuantity: Number(newProduct.stockQuantity) || 0,
                unitOfMeasure: newProduct.unitOfMeasure,
                brandId: Number(newProduct.brandId),
                categoryId: Number(newProduct.categoryId),
                imageUrls: validImageUrls,
                attributes: attributes     // obiect {} valid pentru Map-ul din backend
            };
            //adaugam data de expirare doar daca a fost completata
            if (newProduct.expirationDate && newProduct.expirationDate.trim() !== "") {
                payload.expirationDate = newProduct.expirationDate;
            }

            console.log("Trimitem catre Java produsul:", payload);
            await axios.post(`${apiUrl}/products`, payload, {
                headers: { Authorization: `Bearer ${token}` }
            });

            addAdminLog(`New product "${newProduct.name}" was added to the store.`, 'add'); //trimitem log despre adaugarea produsului in log-urile adminului

            setIsAddModalOpen(false);
            setNewProduct({ name: "", description: "", price: "", stockQuantity: "", unitOfMeasure: "buc", expirationDate: "", brandId: 0, categoryId: 0, imageUrls: [""], calories: "", proteins: "", carbs: "", fats: "" });
            setUploadFile(null); // Resetam fisierul
            
            fetchProductsList();
            setToast({ show: true, message: "New product added and image uploaded successfully!", type: 'success' });
            setTimeout(() => setToast({ show: false, message: '', type: 'success' }), 4000);
       } catch (error: any) {
            console.error("Eroare de la Java:", error.response?.data);
            
            let backendMessage = "Failed to add product. Check console.";
            if (error.response?.data) {
                if (typeof error.response.data === 'string') {
                    backendMessage = error.response.data;
                } else if (error.response.data.message) {
                    backendMessage = error.response.data.message;
                } else {
                    backendMessage = JSON.stringify(error.response.data);
                }
            }


            setToast({ show: true, message: `Eroare Java: ${backendMessage}`, type: 'error' });
            setTimeout(() => setToast({ show: false, message: '', type: 'error' }), 6000);
        }
    };

    const [revenueFilter, setRevenueFilter] = useState<'today' | 'month' | 'year' | 'all'>('all');

    // Stari si functii pentru Churn Prediction
    const [churnClients, setChurnClients] = useState<ChurnData[]>([]);
    const [isLoadingChurn, setIsLoadingChurn] = useState(false);
    const [sendingToId, setSendingToId] = useState<number | null>(null);
    // Tine minte in localStorage caror useri le-ai trimis (rezista la refresh/schimbare tab)
    const [sentPromos, setSentPromos] = useState<number[]>(() => {
        const saved = localStorage.getItem("sentAdminPromos");
        return saved ? JSON.parse(saved) : [];
    });

    //Sistemul de Notificari/Log-uri interne pentru Admin
    const [adminLogs, setAdminLogs] = useState<{id: number, message: string, date: string, type: 'status' | 'price' | 'delete' | 'clearance' | 'add'}[]>(() => {
        const saved = localStorage.getItem("adminActionLogs");
        return saved ? JSON.parse(saved) : [];
    });

    const addAdminLog = (message: string, type: 'status' | 'price' | 'delete' | 'clearance' | 'add') => {
        const newLog = { id: Date.now(), message, date: new Date().toISOString(), type };
        const updatedLogs = [newLog, ...adminLogs];
        setAdminLogs(updatedLogs);
        localStorage.setItem("adminActionLogs", JSON.stringify(updatedLogs));
    };
    
    // Starea pentru modalul "Trimite din nou?"
    const [promoModal, setPromoModal] = useState<{show: boolean, clientId: number, clientName: string} | null>(null);

    const [toast, setToast] = useState<{ show: boolean; message: string; type: 'success' | 'error' }>({ show: false, message: '', type: 'success' });
    //Starea pentru toast
    const [deleteProductModal, setDeleteProductModal] = useState<number | null>(null);
    const [dropClearanceModal, setDropClearanceModal] = useState<number | null>(null);

    useEffect(() => {
        if (activeTab === 'churn' && churnClients.length === 0) {
            fetchChurnData();
        }
    }, [activeTab]);

    const fetchChurnData = async () => {
        setIsLoadingChurn(true);
        try {
            const apiUrl = import.meta.env.VITE_API_URL;
            const response = await axios.get(`${apiUrl}/recommendations/churn`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (response.data.status === "success") {
                setChurnClients(response.data.data);
            }
        } catch (err) {
            console.error("Eroare la preluarea datelor de churn:", err);
        } finally {
            setIsLoadingChurn(false);
        }
    };

    const handleSendPromo = async (clientId: number,clientName: string) => {
        setSendingToId(clientId);
        try {
            const apiUrl = import.meta.env.VITE_API_URL;
            const message = `We miss you! Use code COMEBACK20-U${clientId} at checkout for a 20% discount on your next order!`;
            
            await axios.post(`${apiUrl}/notifications/send`, 
                { userId: clientId, message: message },
                { headers: { Authorization: `Bearer ${token}` } }
            );
            // Adaugam userul in lista celor care au primit. Salvam in state si in localStorage
            const updatedSent = [...sentPromos, clientId];
            setSentPromos(updatedSent);
            localStorage.setItem("sentAdminPromos", JSON.stringify(updatedSent));
            
            // Afisam mesajul de succes folosind toast-ul
            setToast({ show: true, message: `Promo code successfully sent to ${clientName}!`, type: 'success' });
            
            // Il ascundem automat dupa 4 secunde
            setTimeout(() => setToast({ show: false, message: '', type: 'success' }), 4000);
            //alert("Promo code sent successfully!"); (replaced with toast)
        } catch (err) {
            console.error("Eroare la trimiterea notificarii:", err);
            setToast({ show: true, message: "Failed to send promo code. Please try again.", type: 'error' });
            setTimeout(() => setToast({ show: false, message: '', type: 'error' }), 4000);
            //alert("Failed to send promo code."); (replaced with toast)
        } finally {
            setSendingToId(null);
        }
    };
    //final churn

    const [dismissedNotifs, setDismissedNotifs] = useState<number[]>(() => {
        const saved = localStorage.getItem("dismissedAdminNotifs");
        return saved ? JSON.parse(saved) : [];
    });
    const [showPastNotifs, setShowPastNotifs] = useState(false);

    useEffect(() => {
        const fetchStatsAndOrders = async () => {
            setIsLoadingOrders(true);
            try {
                const apiUrl = import.meta.env.VITE_API_URL;
                const headers = { Authorization: `Bearer ${token}` };

                const [statsRes, ordersRes] = await Promise.all([
                    axios.get(`${apiUrl}/orders/stats`, { headers }),
                    axios.get(`${apiUrl}/orders/all`, { headers })
                ]);

                setStats(statsRes.data);
                setAllOrders(ordersRes.data);
            } catch (err) {
                console.error("Eroare incarcare", err);
            } finally {
                setIsLoadingStats(false);
                setIsLoadingOrders(false);
            }
        };

        if (user?.role === "ADMIN") fetchStatsAndOrders();
    }, [token, user]);

  useEffect(() => {
        if (products.length === 0) {
            fetchProductsList();
        }
    }, [activeTab]);

    const fetchProductsList = async () => {
        setIsLoadingProducts(true);
        try {
            const apiUrl = import.meta.env.VITE_API_URL;
            const res = await axios.get(`${apiUrl}/products`);
            const sortedProducts = res.data.sort((a: Product, b: Product) => a.id - b.id);
            setProducts(sortedProducts);
        } catch (err) {
            console.error(err);
        } finally {
            setIsLoadingProducts(false);
        }
    };

    const displayFormattedStock = (quantity: number, unit: string) => {
        if (unit === "100g") {
            const totalGrams = quantity * 100;
            if (totalGrams >= 1000) {
                return `${(totalGrams / 1000).toFixed(2).replace(/\.00$/, '')} kg`;
            }
            return `${totalGrams} g`;
        }
        return `${quantity} ${unit}`;
    };

   const handleUpdateOrderStatus = async (orderId: number) => {
        const newStatus = statusDrafts[orderId];
        if (!newStatus) return;

        setUpdatingOrderId(orderId);
        try {
            const apiUrl = import.meta.env.VITE_API_URL;
            await axios.put(`${apiUrl}/orders/${orderId}/status`, `"${newStatus}"`, {
                headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" }
            });

            // ADAUGAM ACTIUNEA IN LOG-UL ADMINULUI
            addAdminLog(`Status for Order #${orderId} was updated to ${newStatus}.`, 'status');

            // Actualizam tabelul din UI
            setAllOrders(allOrders.map(o => o.id === orderId ? { ...o, status: newStatus } : o));
            const updatedDrafts = { ...statusDrafts };
            delete updatedDrafts[orderId];
            setStatusDrafts(updatedDrafts);
            // Succes Toast
            setToast({ show: true, message: `Status for Order #${orderId} updated successfully!`, type: 'success' });
            setTimeout(() => setToast({ show: false, message: '', type: 'success' }), 4000);
        } catch (err) {
            // Error Toast
            setToast({ show: true, message: "Failed to update order status.", type: 'error' });
            setTimeout(() => setToast({ show: false, message: '', type: 'error' }), 4000);
        } finally {
            setUpdatingOrderId(null);
        }
    };

    const filteredOrders = allOrders.filter(o => o.id.toString().includes(orderSearchTerm.trim()));

    const filteredProducts = products.filter(p => p.name.toLowerCase().includes(productSearchTerm.toLowerCase().trim()));

    const expiringProductsList = products.filter(p => (p.nearExpiryQuantity || 0) > 0);
    const filteredExpiringProducts = expiringProductsList.filter(p => p.name.toLowerCase().includes(clearanceSearchTerm.toLowerCase().trim()));

    const filteredRevenueOrders = allOrders.filter(o => {
        if (o.status === "CANCELLED") return false;
        const orderDate = new Date(o.createdAt);
        const now = new Date();
        if (revenueFilter === 'today') return orderDate.toDateString() === now.toDateString();
        if (revenueFilter === 'month') return orderDate.getMonth() === now.getMonth() && orderDate.getFullYear() === now.getFullYear();
        if (revenueFilter === 'year') return orderDate.getFullYear() === now.getFullYear();
        return true;
    });

    const calculatedRevenue = filteredRevenueOrders.reduce((sum, order) => sum + order.totalPrice, 0);

    const handleSaveProductEdit = async (productId: number) => {
        if (!editPriceValue || isNaN(Number(editPriceValue))) return;
        if (isNaN(editStockValue) || editStockValue < 0) return;

        try {
            const apiUrl = import.meta.env.VITE_API_URL;
            const config = { headers: { Authorization: `Bearer ${token}` } };
            const product = products.find(p => p.id === productId);

            await Promise.all([
                axios.put(`${apiUrl}/products/${productId}/price?newPrice=${editPriceValue}`, null, config),
                axios.put(`${apiUrl}/products/${productId}/stock?newStock=${editStockValue}`, null, config)
            ]);

            setProducts(products.map(p => {
                if (p.id === productId) {
                    return {
                        ...p,
                        price: Number(editPriceValue),
                        currentPrice: Number(editPriceValue),
                        stockQuantity: editStockValue,
                        nearExpiryQuantity: Math.min(p.nearExpiryQuantity || 0, editStockValue)
                    };
                }
                return p;
            }));

            if (product) { //adaugam in log-urile adminiului actiunea
                addAdminLog(`Updated details for product "${product.name}" (ID: #${productId}): Price set to ${editPriceValue} Lei, Stock set to ${editStockValue}.`, 'price');
            }
            setEditingProductId(null);
            
            // Succes Toast
            setToast({ show: true, message: "Product details updated successfully!", type: 'success' });
            setTimeout(() => setToast({ show: false, message: '', type: 'success' }), 4000);
        } catch (error) {
            // Error Toast
            setToast({ show: true, message: "Failed to update product details.", type: 'error' });
            setTimeout(() => setToast({ show: false, message: '', type: 'error' }), 4000);
        }
    };

   const handleDeleteProduct = async (productId: number) => {
        try {
            const apiUrl = import.meta.env.VITE_API_URL;
            const product = products.find(p => p.id === productId);
            await axios.delete(`${apiUrl}/products/${productId}`, { headers: { Authorization: `Bearer ${token}` } });
            setProducts(products.filter(p => p.id !== productId));

            if (product) { //adaugam in log-urile adminului actiunea
                addAdminLog(`Product "${product.name}" (ID: #${productId}) was completely removed from the store.`, 'delete');
            }
        
            setToast({ show: true, message: "Product completely removed from the store.", type: 'success' });
        } catch (error) { 
            setToast({ show: true, message: "Failed to remove product.", type: 'error' });
        } finally {
            setDeleteProductModal(null);
            setTimeout(() => setToast({ show: false, message: '', type: 'success' }), 4000);
        }
    };

   const handleDropClearance = async (productId: number) => {
        try {
            const apiUrl = import.meta.env.VITE_API_URL;
            const product = products.find(p => p.id === productId);
            await axios.put(`${apiUrl}/products/${productId}/drop-clearance`, {}, { headers: { Authorization: `Bearer ${token}` } });
            setProducts(products.map(p => {
                if (p.id === productId) {
                    return { ...p, stockQuantity: Math.max(0, p.stockQuantity - (p.nearExpiryQuantity || 0)), nearExpiryQuantity: 0 };
                }
                return p;
            }));
            setStats(prev => ({ ...prev, expiringProducts: Math.max(0, prev.expiringProducts - 1) }));
            

            if (product) { //ADAUGAM in logurile adminului actiunea de drop clearance
                addAdminLog(`Dropped clearance stock for product "${product.name}" (ID: #${productId}).`, 'clearance');
            }
            setToast({ show: true, message: "Clearance stock successfully dropped.", type: 'success' });
        } catch (error) { 
            setToast({ show: true, message: "Failed to drop clearance stock.", type: 'error' });
        } finally {
            setDropClearanceModal(null);
            setTimeout(() => setToast({ show: false, message: '', type: 'success' }), 4000);
        }
    };

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const allExpiredProducts = [...products]
        .filter(p => {
            if (!p.expirationDate) return false;
            const expDate = new Date(p.expirationDate);
            expDate.setHours(0, 0, 0, 0);
            return expDate < today;
        })
        .sort((a, b) => new Date(b.expirationDate!).getTime() - new Date(a.expirationDate!).getTime());

    const newNotifs = allExpiredProducts.filter(p => !dismissedNotifs.includes(p.id));
    const pastNotifs = allExpiredProducts.filter(p => dismissedNotifs.includes(p.id));

    const handleDismissNotif = (productId: number) => {
        const updated = [...dismissedNotifs, productId];
        setDismissedNotifs(updated);
        localStorage.setItem("dismissedAdminNotifs", JSON.stringify(updated));
    };

    const generateChartData = () => {
        const validOrders = allOrders.filter(o => o.status !== 'CANCELLED');
        const now = new Date();

        if (timeRange === 'week') {
            const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
            const last7Days = Array.from({ length: 7 }, (_, i) => {
                const d = new Date();
                d.setDate(d.getDate() - (6 - i));
                return { date: d.toDateString(), name: days[d.getDay()], sales: 0 };
            });

            validOrders.forEach(o => {
                const od = new Date(o.createdAt).toDateString();
                const dayMatch = last7Days.find(d => d.date === od);
                if (dayMatch) dayMatch.sales += o.totalPrice;
            });
            return last7Days;
        }

        if (timeRange === 'month') {
            const weeks = [{ name: 'Week 4', sales: 0 }, { name: 'Week 3', sales: 0 }, { name: 'Week 2', sales: 0 }, { name: 'Week 1', sales: 0 }];
            validOrders.forEach(o => {
                const od = new Date(o.createdAt);
                const diffTime = Math.abs(now.getTime() - od.getTime());
                const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                if (diffDays <= 7) weeks[3].sales += o.totalPrice;
                else if (diffDays <= 14) weeks[2].sales += o.totalPrice;
                else if (diffDays <= 21) weeks[1].sales += o.totalPrice;
                else if (diffDays <= 28) weeks[0].sales += o.totalPrice;
            });
            return weeks;
        }

        if (timeRange === 'year') {
            const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
            const yearData = months.map(m => ({ name: m, sales: 0 }));
            validOrders.forEach(o => {
                const od = new Date(o.createdAt);
                if (od.getFullYear() === now.getFullYear()) {
                    yearData[od.getMonth()].sales += o.totalPrice;
                }
            });
            return yearData;
        }
        return [];
    };

    const getChartTitle = () => {
        if (timeRange === 'month') return "Monthly Revenue (Last 28 Days)";
        if (timeRange === 'year') return `Yearly Revenue (${new Date().getFullYear()})`;
        return "Weekly Revenue (Last 7 Days)";
    };

    const formatDate = (dateString: string) => {
        return new Intl.DateTimeFormat('en-GB', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }).format(new Date(dateString));
    };

    const getStatusColor = (status: string) => {
        switch (status.toUpperCase()) {
            case 'CONFIRMED': return 'bg-blue-100 text-[#134c9c] border-blue-200';
            case 'PROCESSING': return 'bg-orange-100 text-orange-700 border-orange-200';
            case 'SHIPPED': return 'bg-purple-100 text-purple-700 border-purple-200';
            case 'DELIVERED': return 'bg-green-100 text-green-700 border-green-200';
            case 'CANCELLED': return 'bg-red-100 text-red-700 border-red-200';
            default: return 'bg-gray-100 text-gray-700 border-gray-200';
        }
    };

    if (!user || user.role !== "ADMIN") return <Navigate to="/" replace />;
    if (isLoadingStats) return <div className="min-h-screen flex items-center justify-center"><Loader2 className="animate-spin text-blue-600" size={50} /></div>;

    return (
        <div className="flex h-[calc(100vh-76px)] overflow-hidden bg-gray-50 flex-col md:flex-row">
            <div className="w-full md:w-72 bg-slate-900 text-white p-6 flex flex-col gap-2 shrink-0 overflow-y-auto border-r border-slate-800">
                <div className="flex items-center gap-3 mb-6 border-b border-slate-700 pb-4">
                    <Store size={28} className="text-blue-400" />
                    <span className="font-black text-xl tracking-wider">ADMIN PANEL</span>
                </div>

                <button onClick={() => setActiveTab('dashboard')} className={`flex items-center gap-3 px-4 py-3 rounded-xl font-bold transition-all w-full text-left ${activeTab === 'dashboard' ? 'bg-blue-600 shadow-lg shadow-blue-900/50' : 'hover:bg-slate-800 text-slate-300 hover:text-white'}`}><LayoutDashboard size={20} /> Overview</button>
                <button onClick={() => setActiveTab('revenue')} className={`flex items-center gap-3 px-4 py-3 rounded-xl font-bold transition-all w-full text-left ${activeTab === 'revenue' ? 'bg-blue-600 shadow-lg shadow-blue-900/50' : 'hover:bg-slate-800 text-slate-300 hover:text-white'}`}><TrendingUp size={20} /> Revenue Analytics</button>
                <button onClick={() => setActiveTab('ordersList')} className={`flex items-center justify-between px-4 py-3 rounded-xl font-bold transition-all w-full text-left ${activeTab === 'ordersList' ? 'bg-blue-600 shadow-lg shadow-blue-900/50' : 'hover:bg-slate-800 text-slate-300 hover:text-white'}`}><div className="flex items-center gap-3"><ShoppingCart size={20} /> Orders</div></button>
                <button onClick={() => setActiveTab('products')} className={`flex items-center gap-3 px-4 py-3 rounded-xl font-bold transition-all w-full text-left ${activeTab === 'products' ? 'bg-blue-600 shadow-lg shadow-blue-900/50' : 'hover:bg-slate-800 text-slate-300 hover:text-white'}`}><Box size={20} /> Products List</button>
                <button onClick={() => setActiveTab('expiring')} className={`flex items-center justify-between px-4 py-3 rounded-xl font-bold transition-all w-full text-left ${activeTab === 'expiring' ? 'bg-blue-600 shadow-lg shadow-blue-900/50' : 'hover:bg-slate-800 text-slate-300 hover:text-white'}`}>
                    <div className="flex items-center gap-3"><Clock size={20} /> Clearance</div>
                    {stats.expiringProducts > 0 && <span className="bg-red-500 text-white text-xs px-2 py-0.5 rounded-full">{stats.expiringProducts}</span>}
                </button>
                <button onClick={() => setActiveTab('churn')} className={`flex items-center justify-between px-4 py-3 rounded-xl font-bold transition-all w-full text-left ${activeTab === 'churn' ? 'bg-blue-600 shadow-lg shadow-blue-900/50' : 'hover:bg-slate-800 text-slate-300 hover:text-white'}`}>
                    <div className="flex items-center gap-3"><Users size={20} /> Customer Retention Analysis</div>
                </button>
                <button onClick={() => setActiveTab('notifications')} className={`flex items-center justify-between px-4 py-3 rounded-xl font-bold transition-all w-full text-left ${activeTab === 'notifications' ? 'bg-blue-600 shadow-lg shadow-blue-900/50' : 'hover:bg-slate-800 text-slate-300 hover:text-white'}`}>
                    <div className="flex items-center gap-3"><Bell size={20} /> Notifications & Logs </div>
                    {newNotifs.length > 0 && <span className="bg-red-500 text-white text-xs px-2 py-0.5 rounded-full">{newNotifs.length}</span>}
                </button>

                <Link to="/" className="flex items-center gap-3 px-4 py-3 rounded-xl text-slate-400 hover:bg-slate-800 hover:text-white transition-colors mt-auto pt-4"><ArrowLeft size={20} /> Back to Store</Link>
            </div>

            <div className="flex-1 p-6 lg:p-8 overflow-y-auto">

                {activeTab === 'dashboard' && (
                    <div className="animate-in fade-in slide-in-from-bottom-2">
                        <div className="mb-6">
                            <h1 className="text-3xl font-black text-gray-900 mb-2">Overview</h1>
                            <p className="text-gray-500">Welcome back, {user.firstName}. Here's what's happening today.</p>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                            <Card onClick={() => setActiveTab('revenue')} className="border-none shadow-sm cursor-pointer hover:shadow-lg hover:ring-2 hover:ring-green-200 transition-all">
                                <CardHeader className="flex flex-row items-center justify-between pb-2">
                                    <CardTitle className="text-sm font-bold text-green-600 uppercase tracking-widest">Total Revenue</CardTitle>
                                    <div className="w-10 h-10 bg-green-100 text-green-600 rounded-full flex items-center justify-center"><TrendingUp size={20} /></div>
                                </CardHeader>
                                <CardContent>
                                    <div className="text-3xl lg:text-4xl font-black text-gray-900">{stats.totalRevenue.toFixed(2)} Lei</div>
                                    <p className="text-xs text-green-600 font-bold mt-2">View Analytics &rarr;</p>
                                </CardContent>
                            </Card>

                            <Card onClick={() => setActiveTab('ordersList')} className="border-none shadow-sm cursor-pointer hover:shadow-lg hover:ring-2 hover:ring-blue-200 transition-all">
                                <CardHeader className="flex flex-row items-center justify-between pb-2">
                                    <CardTitle className="text-sm font-bold text-blue-600 uppercase tracking-widest">Total Orders</CardTitle>
                                    <div className="w-10 h-10 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center"><PackageOpen size={20} /></div>
                                </CardHeader>
                                <CardContent>
                                    <div className="text-3xl lg:text-4xl font-black text-gray-900">{stats.totalOrders}</div>
                                    <p className="text-xs text-blue-600 font-bold mt-2">Manage orders &rarr;</p>
                                </CardContent>
                            </Card>

                            <Card onClick={() => setActiveTab('expiring')} className="border-none shadow-sm cursor-pointer hover:shadow-lg hover:ring-2 hover:ring-orange-200 transition-all">
                                <CardHeader className="flex flex-row items-center justify-between pb-2">
                                    <CardTitle className="text-sm font-bold text-orange-500 uppercase tracking-widest">Action Needed</CardTitle>
                                    <div className="w-10 h-10 bg-orange-100 text-orange-600 rounded-full flex items-center justify-center"><AlertTriangle size={20} /></div>
                                </CardHeader>
                                <CardContent>
                                    <div className="text-3xl lg:text-4xl font-black text-orange-600">{stats.expiringProducts}</div>
                                    <p className="text-xs text-orange-600 font-bold mt-2">Products near expiration date &rarr;</p>
                                </CardContent>
                            </Card>
                        </div>

                        <Card className="border-none shadow-sm p-4 flex flex-col w-full">
                            <CardHeader className="pb-0 mb-4">
                                <CardTitle className="text-xl font-black text-gray-900">{getChartTitle()}</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div style={{ width: '100%', height: 300 }}>
                                    <ResponsiveContainer width="100%" height="100%">
                                        <AreaChart data={generateChartData()} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                                            <defs>
                                                <linearGradient id="colorSales" x1="0" y1="0" x2="0" y2="1">
                                                    <stop offset="5%" stopColor="#134c9c" stopOpacity={0.3} />
                                                    <stop offset="95%" stopColor="#134c9c" stopOpacity={0} />
                                                </linearGradient>
                                            </defs>
                                            <XAxis dataKey="name" stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} />
                                            <YAxis stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(value) => `${value} Lei`} />
                                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                                            <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                                            <Area type="monotone" dataKey="sales" stroke="#134c9c" strokeWidth={4} fillOpacity={1} fill="url(#colorSales)" />
                                        </AreaChart>
                                    </ResponsiveContainer>
                                </div>
                            </CardContent>
                            <div className="flex justify-end gap-2 mt-4 px-6 pb-2">
                                <Button variant={timeRange === 'week' ? 'default' : 'outline'} size="sm" onClick={() => setTimeRange('week')} className={`rounded-full ${timeRange === 'week' ? 'bg-slate-900 text-white' : 'text-gray-500 hover:text-slate-900'}`}>1 Week</Button>
                                <Button variant={timeRange === 'month' ? 'default' : 'outline'} size="sm" onClick={() => setTimeRange('month')} className={`rounded-full ${timeRange === 'month' ? 'bg-slate-900 text-white' : 'text-gray-500 hover:text-slate-900'}`}>1 Month</Button>
                                <Button variant={timeRange === 'year' ? 'default' : 'outline'} size="sm" onClick={() => setTimeRange('year')} className={`rounded-full ${timeRange === 'year' ? 'bg-slate-900 text-white' : 'text-gray-500 hover:text-slate-900'}`}>1 Year</Button>
                            </div>
                        </Card>
                    </div>
                )}

                {activeTab === 'revenue' && (
                    <div className="animate-in fade-in slide-in-from-bottom-2">
                        <div className="mb-6 flex justify-between items-end">
                            <div>
                                <h1 className="text-3xl font-black text-gray-900 mb-2 flex items-center gap-3">
                                    <TrendingUp size={28} className="text-green-600" /> Revenue Analytics
                                </h1>
                                <p className="text-gray-500">Calculate and track your real earnings based on actual orders.</p>
                            </div>
                        </div>

                        {isLoadingOrders ? (
                            <div className="flex justify-center p-10"><Loader2 className="animate-spin text-green-600" size={40} /></div>
                        ) : (
                            <div className="space-y-6">
                                <Card className="border-none shadow-sm bg-gradient-to-br from-green-50 to-white overflow-hidden">
                                    <CardContent className="p-8">
                                        <div className="flex flex-col md:flex-row justify-between items-center gap-6">
                                            <div className="text-center md:text-left">
                                                <p className="text-sm font-bold text-green-600 uppercase tracking-widest mb-2">Total Earnings</p>
                                                <div className="text-5xl font-black text-gray-900">{calculatedRevenue.toFixed(2)} LEI</div>
                                                <p className="text-xs text-gray-400 mt-2">From {filteredRevenueOrders.length} valid orders.</p>
                                            </div>
                                            <div className="flex bg-white p-1 rounded-xl shadow-sm border border-gray-100">
                                                <button onClick={() => setRevenueFilter('today')} className={`px-4 py-2 text-sm font-bold rounded-lg transition-all ${revenueFilter === 'today' ? 'bg-green-600 text-white shadow-md' : 'text-gray-500 hover:bg-gray-50'}`}>Today</button>
                                                <button onClick={() => setRevenueFilter('month')} className={`px-4 py-2 text-sm font-bold rounded-lg transition-all ${revenueFilter === 'month' ? 'bg-green-600 text-white shadow-md' : 'text-gray-500 hover:bg-gray-50'}`}>This Month</button>
                                                <button onClick={() => setRevenueFilter('year')} className={`px-4 py-2 text-sm font-bold rounded-lg transition-all ${revenueFilter === 'year' ? 'bg-green-600 text-white shadow-md' : 'text-gray-500 hover:bg-gray-50'}`}>This Year</button>
                                                <button onClick={() => setRevenueFilter('all')} className={`px-4 py-2 text-sm font-bold rounded-lg transition-all ${revenueFilter === 'all' ? 'bg-green-600 text-white shadow-md' : 'text-gray-500 hover:bg-gray-50'}`}>All Time</button>
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>

                                <Card className="border-none shadow-sm">
                                    <CardHeader>
                                        <CardTitle className="text-lg font-black text-gray-800 flex items-center gap-2">
                                            <CalendarDays size={18} className="text-gray-400" />
                                            Orders in selected period
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent className="p-0">
                                        <div className="overflow-x-auto">
                                            <table className="w-full text-left border-collapse">
                                                <thead>
                                                    <tr className="bg-gray-50 text-gray-500 text-xs uppercase tracking-wider">
                                                        <th className="p-4 font-bold">Order ID</th>
                                                        <th className="p-4 font-bold">Date & Time</th>
                                                        <th className="p-4 font-bold">Status</th>
                                                        <th className="p-4 font-bold text-right">Amount</th>
                                                    </tr>
                                                </thead>
                                                <tbody className="divide-y divide-gray-100">
                                                    {filteredRevenueOrders.map(order => (
                                                        <tr key={order.id} className="hover:bg-gray-50/50 transition-colors">
                                                            <td className="p-4 font-bold text-gray-900">#{order.id}</td>
                                                            <td className="p-4 text-sm text-gray-500">{formatDate(order.createdAt)}</td>
                                                            <td className="p-4"><span className={`px-2 py-1 rounded text-[10px] font-black uppercase tracking-wider border ${getStatusColor(order.status)}`}>{order.status}</span></td>
                                                            <td className="p-4 font-black text-green-600 text-right">+{order.totalPrice.toFixed(2)} Lei</td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                            {filteredRevenueOrders.length === 0 && <p className="text-center p-8 text-gray-500">No earnings found for this period.</p>}
                                        </div>
                                    </CardContent>
                                </Card>
                            </div>
                        )}
                    </div>
                )}

                {activeTab === 'ordersList' && (
                    <div className="animate-in fade-in slide-in-from-bottom-2">
                        <div className="mb-6 flex flex-col md:flex-row md:items-end justify-between gap-4">
                            <div>
                                <h1 className="text-3xl font-black text-gray-900 mb-2 flex items-center gap-3">
                                    <ShoppingCart size={28} className="text-blue-600" /> Store Orders
                                </h1>
                                <p className="text-gray-500">View and update the status of all customer orders.</p>
                            </div>
                            <div className="relative w-full md:w-72">
                                <Input type="text" placeholder="Search by Order ID..." value={orderSearchTerm} onChange={(e) => setOrderSearchTerm(e.target.value)} className="pl-10 h-12 bg-white rounded-xl border-gray-200" />
                                <Search size={18} className="absolute left-3 top-3.5 text-gray-400" />
                            </div>
                        </div>

                        <Card className="border-none shadow-sm overflow-hidden">
                            <CardContent className="p-0">
                                {isLoadingOrders ? (
                                    <div className="flex justify-center p-10"><Loader2 className="animate-spin text-blue-600" size={40} /></div>
                                ) : (
                                    <div className="overflow-x-auto">
                                        <table className="w-full text-left border-collapse min-w-[800px]">
                                            <thead>
                                                <tr className="bg-gray-50 text-gray-500 text-xs uppercase tracking-wider">
                                                    <th className="p-4 font-bold">Order ID</th>
                                                    <th className="p-4 font-bold">Date Placed</th>
                                                    <th className="p-4 font-bold">Items</th>
                                                    <th className="p-4 font-bold">Total</th>
                                                    <th className="p-4 font-bold">Current Status</th>
                                                    <th className="p-4 font-bold text-center">Update Status</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-gray-100">
                                                {filteredOrders.map((order) => {
                                                    const draftStatus = statusDrafts[order.id] || order.status;
                                                    const hasChanged = draftStatus !== order.status;

                                                    return (
                                                        <tr key={order.id} className="hover:bg-blue-50/30 transition-colors">
                                                            <td className="p-4 font-black text-gray-900">#{order.id}</td>
                                                            <td className="p-4 text-sm text-gray-600">{formatDate(order.createdAt)}</td>
                                                            <td className="p-4 text-sm text-gray-600">
                                                                {order.items.length} items
                                                                <div className="text-[10px] text-gray-400 mt-1 line-clamp-1">{order.items.map(i => i.productName).join(", ")}</div>
                                                            </td>
                                                            <td className="p-4 font-bold text-[#134c9c]">{order.totalPrice.toFixed(2)} Lei</td>
                                                            <td className="p-4"><span className={`px-2 py-1 rounded text-[10px] font-black uppercase tracking-wider border ${getStatusColor(order.status)}`}>{order.status}</span></td>
                                                            <td className="p-4 w-[280px]">
                                                                <div className="flex gap-2">
                                                                    <Select value={draftStatus} onValueChange={(val) => setStatusDrafts({ ...statusDrafts, [order.id]: val })}>
                                                                        <SelectTrigger className="w-full bg-white border-gray-200 h-9 text-xs font-bold"><SelectValue /></SelectTrigger>
                                                                        <SelectContent>
                                                                            <SelectItem value="CONFIRMED">CONFIRMED</SelectItem>
                                                                            <SelectItem value="PROCESSING">PROCESSING</SelectItem>
                                                                            <SelectItem value="SHIPPED">SHIPPED</SelectItem>
                                                                            <SelectItem value="DELIVERED">DELIVERED</SelectItem>
                                                                            <SelectItem value="CANCELLED">CANCELLED</SelectItem>
                                                                        </SelectContent>
                                                                    </Select>
                                                                    {hasChanged && (
                                                                        <Button size="sm" className="bg-green-600 hover:bg-green-700 h-9" onClick={() => handleUpdateOrderStatus(order.id)} disabled={updatingOrderId === order.id}>
                                                                            {updatingOrderId === order.id ? <Loader2 className="animate-spin h-4 w-4" /> : <Save size={16} />}
                                                                        </Button>
                                                                    )}
                                                                </div>
                                                            </td>
                                                        </tr>
                                                    );
                                                })}
                                            </tbody>
                                        </table>
                                        {filteredOrders.length === 0 && <p className="text-center p-8 text-gray-500">No orders found.</p>}
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </div>
                )}

                {activeTab === 'products' && (
                    <div className="animate-in fade-in slide-in-from-bottom-2">
                        <div className="mb-6 flex flex-col md:flex-row md:items-end justify-between gap-4">
                            <div>
                                <h1 className="text-3xl font-black text-gray-900 mb-2 flex items-center gap-3">
                                    <Box size={28} className="text-blue-600" /> Manage Products
                                </h1>
                                <p className="text-gray-500">Edit prices, adjust stock or add products to the store.</p>
                            </div>
                            
                            {/* Am grupat Search-ul si Butonul intr-un singur flex, impins in dreapta (ml-auto pe ecrane mari) */}
                            <div className="flex flex-col sm:flex-row items-center gap-3 w-full md:w-auto md:ml-auto">
                                <div className="relative w-full md:w-72">
                                    <Input type="text" placeholder="Search by product name..." value={productSearchTerm} onChange={(e) => setProductSearchTerm(e.target.value)} className="pl-10 h-11 bg-white rounded-xl border-gray-200" />
                                    <Search size={18} className="absolute left-3 top-3.5 text-gray-400" />
                                </div>
                                <Button onClick={() => setIsAddModalOpen(true)} className="w-full sm:w-auto h-11 px-6 bg-[#134c9c] hover:bg-[#80c4e8] hover:text-black text-white font-bold rounded-xl flex items-center gap-2 shadow-lg shadow-blue-900/20 shrink-0">
                                    <Plus size={20} strokeWidth={3} /> Add Product
                                </Button>
                            </div>
                        </div>
                        <Card className="border-none shadow-sm overflow-hidden">
                            <CardContent className="p-0">
                                {isLoadingProducts ? (
                                    <div className="flex justify-center p-10"><Loader2 className="animate-spin text-blue-600" size={40} /></div>
                                ) : (
                                    <div className="overflow-x-auto">
                                        <table className="w-full text-left border-collapse min-w-[600px]">
                                            <thead>
                                                <tr className="bg-gray-50 text-gray-500 text-xs uppercase tracking-wider">
                                                    <th className="p-4 font-bold">Product</th>
                                                    <th className="p-4 font-bold">Category</th>
                                                    <th className="p-4 font-bold">Stock</th>
                                                    <th className="p-4 font-bold w-[150px]">Base Price</th>
                                                    <th className="p-4 font-bold text-center">Actions</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-gray-100">
                                                {filteredProducts.map((prod) => (
                                                    <tr key={prod.id} className={`transition-colors ${editingProductId === prod.id ? 'bg-blue-50/50' : 'hover:bg-blue-50/30'}`}>
                                                        <td className="p-4 flex items-center gap-3">
                                                            <div className="w-12 h-12 bg-white border border-gray-200 rounded-lg flex items-center justify-center p-1 shrink-0">
                                                                <img src={prod.imageUrls?.[0] || "https://placehold.co/100?text=No+Img"} alt="" className="w-full h-full object-contain" />
                                                            </div>
                                                            <div>
                                                                <p className="font-bold text-gray-900 line-clamp-1">{prod.name}</p>
                                                                <p className="text-xs text-gray-400 font-bold">{prod.brandName}</p>
                                                            </div>
                                                        </td>
                                                        <td className="p-4 text-sm font-medium text-gray-600">{prod.categoryName}</td>

                                                        <td className="p-4 text-sm font-medium text-gray-600">
                                                            {editingProductId === prod.id ? (
                                                                <div className="flex items-center gap-1">
                                                                    <button onClick={() => setEditStockValue(prev => Math.max(0, prev - 1))} className="w-7 h-8 bg-white border border-gray-200 rounded text-gray-600 hover:bg-gray-100 transition-colors flex items-center justify-center font-bold">-</button>
                                                                    <Input type="number" value={editStockValue} onChange={(e) => setEditStockValue(Number(e.target.value))} className="w-16 h-8 text-center px-1 font-bold" />
                                                                    <button onClick={() => setEditStockValue(prev => prev + 1)} className="w-7 h-8 bg-white border border-gray-200 rounded text-gray-600 hover:bg-gray-100 transition-colors flex items-center justify-center font-bold">+</button>
                                                                    <span className="ml-1 text-xs text-gray-400">{prod.unitOfMeasure}</span>
                                                                </div>
                                                            ) : (
                                                                displayFormattedStock(prod.stockQuantity, prod.unitOfMeasure)
                                                            )}
                                                        </td>

                                                        <td className="p-4 w-[150px]">
                                                            {editingProductId === prod.id ? (
                                                                <div className="flex items-center gap-1">
                                                                    <Input type="number" value={editPriceValue} onChange={(e) => setEditPriceValue(e.target.value)} className="w-20 h-8 bg-white px-2 font-bold text-[#134c9c]" autoFocus />
                                                                    <span className="text-xs font-bold text-gray-500">Lei</span>
                                                                </div>
                                                            ) : (
                                                                <span className="font-bold text-gray-900">{prod.price.toFixed(2)} Lei</span>
                                                            )}
                                                        </td>

                                                        <td className="p-4">
                                                            {editingProductId === prod.id ? (
                                                                <div className="flex items-center justify-center gap-2">
                                                                    <button onClick={() => handleSaveProductEdit(prod.id)} className="p-2 bg-green-100 text-green-600 rounded hover:bg-green-200 transition-colors shadow-sm" title="Save changes"><Save size={16} /></button>
                                                                    <button onClick={() => setEditingProductId(null)} className="p-2 bg-red-100 text-red-600 rounded hover:bg-red-200 transition-colors shadow-sm" title="Cancel edit"><X size={16} /></button>
                                                                </div>
                                                            ) : (
                                                                <div className="flex items-center justify-center gap-3">
                                                                    <button onClick={() => { setEditingProductId(prod.id); setEditPriceValue(prod.price.toString()); setEditStockValue(prod.stockQuantity); }} className="text-blue-500 hover:text-blue-700 transition-colors" title="Edit Product"><Edit2 size={18} /></button>
                                                                   <button onClick={() => setDeleteProductModal(prod.id)} className="text-red-400 hover:text-red-600 transition-colors" title="Remove Product"><Trash2 size={18} /></button>
                                                                </div>
                                                            )}
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                        {filteredProducts.length === 0 && <p className="text-center p-8 text-gray-500">No products found.</p>}
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </div>
                )}

                {activeTab === 'expiring' && (
                    <div className="animate-in fade-in slide-in-from-bottom-2">
                        <div className="mb-6 flex flex-col md:flex-row md:items-end justify-between gap-4">
                            <div>
                                <h1 className="text-3xl font-black text-orange-600 mb-2 flex items-center gap-3">
                                    <Clock size={28} /> Clearance Management
                                </h1>
                                <p className="text-gray-500">Monitor and manage products that are approaching their expiration date.</p>
                            </div>
                            <div className="relative w-full md:w-72">
                                <Input type="text" placeholder="Search by product name..." value={clearanceSearchTerm} onChange={(e) => setClearanceSearchTerm(e.target.value)} className="pl-10 h-12 bg-white rounded-xl border-gray-200" />
                                <Search size={18} className="absolute left-3 top-3.5 text-gray-400" />
                            </div>
                        </div>

                        <Card className="border-orange-100 shadow-sm overflow-hidden">
                            <CardContent className="p-0">
                                {isLoadingProducts ? (
                                    <div className="flex justify-center p-10"><Loader2 className="animate-spin text-orange-600" size={40} /></div>
                                ) : (
                                    <div className="overflow-x-auto">
                                        <table className="w-full text-left border-collapse min-w-[600px]">
                                            <thead>
                                                <tr className="bg-orange-50 text-orange-800 text-xs uppercase tracking-wider">
                                                    <th className="p-4 font-bold">Product</th>
                                                    <th className="p-4 font-bold text-center">Expiring Qty</th>
                                                    <th className="p-4 font-bold">Clearance Price</th>
                                                    <th className="p-4 font-bold text-center">Actions</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-gray-100">
                                                {filteredExpiringProducts.map((prod) => {
                                                    return (
                                                        <tr key={prod.id} className="hover:bg-orange-50/30 transition-colors">
                                                            <td className="p-4 flex items-center gap-3">
                                                                <div className="w-12 h-12 bg-white border border-gray-200 rounded-lg flex items-center justify-center p-1 shrink-0">
                                                                    <img src={prod.imageUrls?.[0] || "https://placehold.co/100?text=No+Img"} alt="" className="w-full h-full object-contain" />
                                                                </div>
                                                                <div>
                                                                    <p className="font-bold text-gray-900 line-clamp-1">{prod.name}</p>
                                                                    <p className="text-xs text-gray-400 font-bold">Exp: {prod.expirationDate}</p>
                                                                </div>
                                                            </td>
                                                            <td className="p-4 text-center">
                                                                <span className="inline-flex items-center justify-center px-3 py-1 bg-red-100 text-red-700 font-black rounded-full">
                                                                    {displayFormattedStock(prod.nearExpiryQuantity || 0, prod.unitOfMeasure)}
                                                                </span>
                                                            </td>
                                                            <td className="p-4">
                                                                <div className="flex flex-col">
                                                                    <span className="font-black text-orange-600 text-lg">{prod.currentPrice.toFixed(2)} Lei</span>
                                                                    <span className="text-xs text-gray-400 line-through">{prod.price.toFixed(2)} Lei</span>
                                                                </div>
                                                            </td>
                                                            <td className="p-4">
                                                                <div className="flex items-center justify-center gap-3">
                                                                    <button onClick={() => setDropClearanceModal(prod.id)} className="flex items-center gap-1 text-xs font-bold text-red-500 hover:text-red-700 bg-red-50 px-3 py-2 rounded-lg transition-colors">
                                                                        <Trash2 size={14} /> Drop from store
                                                                    </button>
                                                                </div>
                                                            </td>
                                                        </tr>
                                                    );
                                                })}
                                            </tbody>
                                        </table>
                                        {filteredExpiringProducts.length === 0 && (
                                            <div className="text-center p-10 flex flex-col items-center justify-center">
                                                <CheckCircle2 size={40} className="text-green-500 mb-3" />
                                                <p className="text-gray-500 font-bold text-lg">Great news!</p>
                                                <p className="text-gray-400 text-sm">No products are currently near their expiration date.</p>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </div>
                )}

                {activeTab === 'notifications' && (
                    <div className="animate-in fade-in slide-in-from-bottom-2">
                        <div className="flex flex-col sm:flex-row justify-between sm:items-end mb-6 gap-4">
                            <div>
                                <h1 className="text-3xl font-black text-gray-900 mb-2 flex items-center gap-3">
                                    <Bell size={28} className="text-red-600" /> System Notifications
                                </h1>
                                <p className="text-gray-500">Automated alerts and system logs.</p>
                            </div>

                            {pastNotifs.length > 0 && (
                                <Button
                                    variant="outline"
                                    onClick={() => setShowPastNotifs(!showPastNotifs)}
                                    className="rounded-full border-gray-200 text-gray-600 font-bold"
                                >
                                    {showPastNotifs ? "Hide past notifications" : "Show past notifications"}
                                </Button>
                            )}
                        </div>

                        <div className="space-y-4">
                            {isLoadingProducts ? (
                                <div className="flex justify-center p-10"><Loader2 className="animate-spin text-red-600" size={40} /></div>
                            ) : (
                                <>
                                {/* daca nu e nimic */}
                                    {newNotifs.length === 0 && !showPastNotifs && (
                                        <Card className="border-none shadow-sm text-center p-10 bg-white">
                                            <CardContent className="flex flex-col items-center justify-center m-0 p-0">
                                                <div className="bg-green-50 p-4 rounded-full mb-4">
                                                    <Check size={40} className="text-green-500" strokeWidth={3} />
                                                </div>
                                                <p className="text-gray-900 font-black text-xl">You're all caught up!</p>
                                                <p className="text-gray-500 text-sm mt-1">No new system alerts or expirations.</p>
                                            </CardContent>
                                        </Card>
                                    )}
                                {/* recomandarile de sistem (expirare) */}
                                    {newNotifs.map(prod => (
                                        <Card key={`new-${prod.id}`} className="relative border-none border-l-4 border-l-red-500 shadow-sm hover:shadow-md transition-shadow bg-white">
                                            <button
                                                onClick={() => handleDismissNotif(prod.id)}
                                                className="absolute top-4 right-4 p-1.5 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                                                title="Mark as read"
                                            >
                                                <X size={18} strokeWidth={2.5} />
                                            </button>
                                            <CardContent className="p-5 flex items-start gap-4">
                                                <div className="bg-red-100 p-2.5 rounded-full text-red-600 mt-0.5 shrink-0">
                                                    <AlertTriangle size={20} />
                                                </div>
                                                <div className="pr-8">
                                                    <h3 className="font-black text-gray-900 text-lg">Automated Action: Product Expired</h3>
                                                    <p className="text-gray-600 text-sm mt-1 leading-relaxed">
                                                        Product <strong className="text-gray-900">"{prod.name}"</strong> from brand <strong className="text-gray-900">{prod.brandName}</strong> (ID: #{prod.id}) has expired on <span className="font-bold text-red-600">{prod.expirationDate}</span> and its clearance stock was automatically taken off from sale by the system.
                                                    </p>
                                                </div>
                                            </CardContent>
                                        </Card>
                                    ))}
                                    {/*LOGURILE ACTIUNILOR DE ADMIN */}
                                    {adminLogs.length > 0 && (
                                        <div className="mt-8 space-y-4">
                                            <div className="flex justify-between items-center mb-2 px-2">
                                                 <h3 className="text-sm font-black text-blue-800 uppercase tracking-widest">Admin Actions Log</h3>
                                                 <button onClick={() => {setAdminLogs([]); localStorage.removeItem("adminActionLogs");}} className="text-xs text-gray-400 hover:text-red-500 transition-colors font-bold">Clear Logs</button>
                                            </div>
                                            
                                            {adminLogs.map(log => (
                                                <Card key={log.id} className="border-none border-l-4 border-l-[#134c9c] shadow-sm bg-white">
                                                    <CardContent className="p-5 flex items-start gap-4">
                                                        <div className="bg-blue-50 p-2.5 rounded-full text-[#134c9c] mt-0.5 shrink-0">
                                                            {log.type === 'status' && <PackageOpen size={20} />}
                                                            {log.type === 'price' && <Edit2 size={20} />}
                                                            {log.type === 'delete' && <Trash2 size={20} />}
                                                            {log.type === 'clearance' && <Clock size={20} />}
                                                            {log.type === 'add' && <Plus size={20} />}
                                                        </div>
                                                        <div>
                                                            <div className="flex justify-between items-center mb-1">
                                                                <h3 className="font-bold text-gray-900 text-base">
                                                                    {log.type === 'status' && "Order Status Updated"}
                                                                    {log.type === 'price' && "Product Details Edited"}
                                                                    {log.type === 'delete' && "Product Deleted"}
                                                                    {log.type === 'clearance' && "Clearance Stock Dropped"}
                                                                    {log.type === 'add' && "Product Added"}
                                                                </h3>
                                                                <span className="text-xs font-bold text-gray-400">{formatDate(log.date)}</span>
                                                            </div>
                                                            <p className="text-gray-600 text-sm leading-relaxed">
                                                                {log.message}
                                                            </p>
                                                        </div>
                                                    </CardContent>
                                                </Card>
                                            ))}
                                        </div>
                                    )}

                                    {showPastNotifs && pastNotifs.length > 0 && (
                                        <div className="mt-8 space-y-4 animate-in fade-in slide-in-from-top-4">
                                            <h3 className="text-sm font-black text-gray-400 uppercase tracking-widest px-2 mb-2">Past Notifications</h3>
                                            {pastNotifs.map(prod => (
                                                <Card key={`past-${prod.id}`} className="border border-gray-100 bg-gray-50 shadow-none opacity-80">
                                                    <CardContent className="p-5 flex items-start gap-4">
                                                        <div className="bg-gray-200 p-2.5 rounded-full text-gray-500 mt-0.5 shrink-0">
                                                            <CheckCircle2 size={20} />
                                                        </div>
                                                        <div>
                                                            <h3 className="font-bold text-gray-700 text-lg">Product Expired (Read)</h3>
                                                            <p className="text-gray-500 text-sm mt-1 leading-relaxed">
                                                                Product <strong className="text-gray-700">"{prod.name}"</strong> from brand <strong className="text-gray-700">{prod.brandName}</strong> (ID: #{prod.id}) has expired on <span className="font-bold text-gray-600">{prod.expirationDate}</span> and its clearance stock was automatically taken off from sale by the system.
                                                            </p>
                                                        </div>
                                                    </CardContent>
                                                </Card>
                                            ))}
                                        </div>
                                    )}
                                </>
                            )}
                        </div>
                    </div>
                )}
                {/*  TAB-UL DE CHURN PREDICTION  */}
                {activeTab === 'churn' && (
                    <div className="animate-in fade-in slide-in-from-bottom-2">
                        <div className="mb-6 flex flex-col md:flex-row md:items-end justify-between gap-4">
                            <div>
                                <h1 className="text-3xl font-black text-gray-900 mb-2 flex items-center gap-3">
                                    <Users size={28} className="text-[#134c9c]" /> Customer Retention
                                </h1>
                                <p className="text-gray-500">AI-Powered Churn Prediction using Random Forest Classification.</p>
                            </div>
                        </div>

                        <Card className="border-none shadow-sm overflow-hidden">
                            <CardContent className="p-0">
                                {isLoadingChurn ? (
                                    <div className="flex justify-center p-10"><Loader2 className="animate-spin text-blue-600" size={40} /></div>
                                ) : (
                                    <div className="overflow-x-auto">
                                        <table className="w-full text-left border-collapse min-w-[800px]">
                                            <thead>
                                                <tr className="bg-gray-50 text-gray-500 text-xs uppercase tracking-wider">
                                                    <th className="p-4 font-bold">Client Info</th>
                                                    <th className="p-4 font-bold text-center">Orders</th>
                                                    <th className="p-4 font-bold text-right">Total Spent</th>
                                                    <th className="p-4 font-bold text-center">Last Order</th>
                                                    <th className="p-4 font-bold text-center">Churn Risk</th>
                                                    <th className="p-4 font-bold text-center">Action</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-gray-100">
                                                {churnClients.map((client) => {
                                                    const isHighRisk = client.churnRisk >= 50;
                                                    const isMediumRisk = client.churnRisk > 20 && client.churnRisk < 50;

                                                    const hasBeenSent = sentPromos.includes(client.userId); //A primit deja codul in sesiunea asta?

                                                    return (
                                                        <tr key={client.userId} className="border-b border-gray-50 hover:bg-blue-50/30 transition-colors">
                                                            <td className="p-4">
                                                                <p className="font-bold text-gray-900">{client.name}</p>
                                                                <p className="text-xs text-gray-500">{client.email}</p>
                                                            </td>
                                                            <td className="p-4 font-bold text-gray-700 text-center">{client.totalOrders}</td>
                                                            <td className="p-4 font-black text-[#134c9c] text-right">{client.totalSpent} LEI</td>
                                                            <td className="p-4 text-sm text-gray-600 text-center">{client.daysSinceLastOrder} days ago</td>
                                                            
                                                            <td className="p-4 text-center">
                                                                <div className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-[11px] font-black uppercase tracking-wider border shadow-sm
                                                                    ${isHighRisk ? 'bg-red-50 text-red-700 border-red-200' : isMediumRisk ? 'bg-orange-50 text-orange-700 border-orange-200' : 'bg-green-50 text-green-700 border-green-200'}
                                                                `}>
                                                                    {isHighRisk ? <AlertTriangle size={14}/> : isMediumRisk ? <TrendingDown size={14}/> : <CheckCircle2 size={14}/>}
                                                                    {client.churnRisk}% Risk
                                                                </div>
                                                            </td>

                                                            <td className="p-4 text-center">
                                                                <Button 
                                                                    onClick={() => {
                                                                        if (hasBeenSent) {
                                                                            setPromoModal({ show: true, clientId: client.userId, clientName: client.name });
                                                                        } else {
                                                                            handleSendPromo(client.userId, client.name);
                                                                        }
                                                                    }}
                                                                    disabled={sendingToId === client.userId || !isHighRisk}
                                                                    size="sm"
                                                                    className={`rounded-xl shadow-sm h-9 transition-all duration-300 min-w-40 ${
                                                                        hasBeenSent ? 'bg-green-100 text-green-700 border border-green-300 hover:bg-green-200' :
                                                                        isHighRisk ? 'bg-[#134c9c] hover:bg-blue-800 text-white' : 
                                                                        'bg-gray-200 text-gray-400'
                                                                    }`}
                                                                >
                                                                    {sendingToId === client.userId ? <Loader2 className="animate-spin" size={16} /> 
                                                                    : hasBeenSent ? <CheckCircle2 size={16} className="mr-1"/> 
                                                                    : <Send size={16} className="mr-1"/>}
                                                                    
                                                                    {hasBeenSent ? "Already Sent" : "Send Promo Code"}
                                                                </Button>
                                                            </td>
                                                        </tr>
                                                    );
                                                })}
                                            </tbody>
                                        </table>
                                        {churnClients.length === 0 && <p className="text-center p-8 text-gray-500">Not enough data to run ML analysis or the script is not currently running.</p>}
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </div>
                )}

            </div>
            {/* FLOATING TOAST NOTIFICATION */}
            {toast.show && (
                <div className={`fixed bottom-8 right-8 z-50 flex items-center gap-3 px-6 py-4 rounded-2xl shadow-2xl animate-in slide-in-from-bottom-5 fade-in duration-300 ${toast.type === 'success' ? 'bg-gray-900 text-white border-l-4 border-l-green-500' : 'bg-red-600 text-white'}`}>
                    {toast.type === 'success' ? <CheckCircle2 size={24} className="text-green-400" /> : <AlertTriangle size={24} />}
                    <p className="font-bold text-sm tracking-wide">{toast.message}</p>
                </div>
            )}
            {/* MODAL CONFIRMARE "TRIMITE DIN NOU" */}
            {promoModal && promoModal.show && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm px-4">
                    <div className="bg-white rounded-3xl p-8 max-w-md w-full shadow-2xl relative animate-in zoom-in-95">
                        <button onClick={() => setPromoModal(null)} className="absolute top-5 right-5 text-gray-400 hover:text-gray-800 transition-colors bg-gray-100 hover:bg-gray-200 p-2 rounded-full">
                            <X size={20} strokeWidth={3} />
                        </button>
                        
                        <div className="flex items-center gap-3 mb-4">
                            <div className="w-12 h-12 rounded-full flex items-center justify-center bg-orange-50 text-orange-600">
                                <Send size={24} />
                            </div>
                            <h2 className="text-2xl font-black text-gray-900">Send Again?</h2>
                        </div>
                        
                       <div className="text-center text-gray-500 mb-6 leading-relaxed flex flex-col gap-4">
                            <p>
                                You have already sent a promo code to <strong className="text-gray-900">{promoModal.clientName}</strong> during this session.
                            </p>
                            <p>
                                Are you sure you want to send another promo code notification?
                            </p>
                        </div>
                        
                        <div className="flex gap-4">
                            <Button onClick={() => setPromoModal(null)} variant="outline" className="w-full h-14 text-lg font-bold rounded-xl border-2">Cancel</Button>
                            <Button 
                                onClick={() => {
                                    handleSendPromo(promoModal.clientId, promoModal.clientName);
                                    setPromoModal(null); // Închide modalul după ce confirmă
                                }} 
                                className="w-full h-14 text-lg font-bold rounded-xl shadow-md bg-orange-600 hover:bg-orange-700 text-white"
                            >
                                Yes, Send
                            </Button>
                        </div>
                    </div>
                </div>
            )}
            {/* MODAL PENTRU STERGEREA COMPLETA A UNUI PRODUS */}
            {deleteProductModal !== null && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm px-4">
                    <div className="bg-white rounded-3xl p-8 max-w-md w-full shadow-2xl relative animate-in zoom-in-95">
                        <button onClick={() => setDeleteProductModal(null)} className="absolute top-5 right-5 text-gray-400 hover:text-gray-800 transition-colors bg-gray-100 hover:bg-gray-200 p-2 rounded-full">
                            <X size={20} strokeWidth={3} />
                        </button>
                        
                        <div className="flex items-center gap-3 mb-4">
                            <div className="w-12 h-12 rounded-full flex items-center justify-center bg-red-50 text-red-600">
                                <AlertTriangle size={24} />
                            </div>
                            <h2 className="text-2xl font-black text-gray-900">Remove Product?</h2>
                        </div>
                        
                        <p className="text-gray-500 mb-6 leading-relaxed">
                            Are you sure you want to completely remove this product from the store? This action cannot be undone and will delete all associated data.
                        </p>
                        
                        <div className="flex gap-4">
                            <Button onClick={() => setDeleteProductModal(null)} variant="outline" className="w-full h-14 text-lg font-bold rounded-xl border-2">Cancel</Button>
                            <Button 
                                onClick={() => handleDeleteProduct(deleteProductModal)} 
                                className="w-full h-14 text-lg font-bold rounded-xl shadow-md bg-red-600 hover:bg-red-700 text-white"
                            >
                                Yes, Delete
                            </Button>
                        </div>
                    </div>
                </div>
            )}

            {/* MODAL PENTRU ARUNCAREA STOCULUI EXPIRAT */}
            {dropClearanceModal !== null && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm px-4">
                    <div className="bg-white rounded-3xl p-8 max-w-md w-full shadow-2xl relative animate-in zoom-in-95">
                        <button onClick={() => setDropClearanceModal(null)} className="absolute top-5 right-5 text-gray-400 hover:text-gray-800 transition-colors bg-gray-100 hover:bg-gray-200 p-2 rounded-full">
                            <X size={20} strokeWidth={3} />
                        </button>
                        
                        <div className="flex items-center gap-3 mb-4">
                            <div className="w-12 h-12 rounded-full flex items-center justify-center bg-orange-50 text-orange-600">
                                <Trash2 size={24} />
                            </div>
                            <h2 className="text-2xl font-black text-gray-900">Discard Clearance?</h2>
                        </div>
                        
                        <p className="text-gray-500 mb-6 leading-relaxed">
                            Are you sure you want to discard this expiring stock? The items will be removed from sale, but any fresh stock of this product will remain available.
                        </p>
                        
                        <div className="flex gap-4">
                            <Button onClick={() => setDropClearanceModal(null)} variant="outline" className="w-full h-14 text-lg font-bold rounded-xl border-2">Keep it</Button>
                            <Button 
                                onClick={() => handleDropClearance(dropClearanceModal)} 
                                className="w-full h-14 text-lg font-bold rounded-xl shadow-md bg-orange-600 hover:bg-orange-700 text-white"
                            >
                                Discard Stock
                            </Button>
                        </div>
                    </div>
                </div>
            )}
            {/* --- MODAL PENTRU ADAUGARE PRODUS NOU --- */}
            {isAddModalOpen && (
                <div className="fixed inset-0 z-[110] flex items-center justify-center bg-black/60 backdrop-blur-sm px-4 overflow-y-auto py-10">
                    <div className="bg-white rounded-3xl p-8 max-w-2xl w-full shadow-2xl relative animate-in zoom-in-95 my-auto">
                        <button onClick={() => setIsAddModalOpen(false)} className="absolute top-5 right-5 text-gray-400 hover:text-gray-800 transition-colors bg-gray-100 p-2 rounded-full">
                            <X size={20} strokeWidth={3} />
                        </button>
                        
                        <div className="flex items-center gap-3 mb-8">
                            <div className="w-12 h-12 rounded-full flex items-center justify-center bg-blue-50 text-blue-600">
                                <Box size={24} />
                            </div>
                            <h2 className="text-2xl font-black text-gray-900">Add New Product</h2>
                        </div>
                        
                        <form onSubmit={handleAddProduct} className="space-y-5">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                <div className="space-y-2">
                                    <label className="text-xs font-black uppercase text-gray-400 ml-1">Product Name</label>
                                    <Input required value={newProduct.name} onChange={(e) => setNewProduct({...newProduct, name: e.target.value})} placeholder="e.g. Organic Milk" className="h-12 border-gray-200" />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-xs font-black uppercase text-gray-400 ml-1">Price (Lei)</label>
                                    <Input required type="number" step="0.01" value={newProduct.price} onChange={(e) => setNewProduct({...newProduct, price: e.target.value})} placeholder="0.00" className="h-12 border-gray-200" />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-xs font-black uppercase text-gray-400 ml-1">Initial Stock</label>
                                    <Input required type="number" value={newProduct.stockQuantity} onChange={(e) => setNewProduct({...newProduct, stockQuantity: e.target.value})} placeholder="100" className="h-12 border-gray-200" />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-xs font-black uppercase text-gray-400 ml-1">Unit (kg, buc, L)</label>
                                    <Input required value={newProduct.unitOfMeasure} onChange={(e) => setNewProduct({...newProduct, unitOfMeasure: e.target.value})} placeholder="buc" className="h-12 border-gray-200" />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-xs font-black uppercase text-gray-400 ml-1">Expiration Date</label>
                                    <Input type="date" value={newProduct.expirationDate} onChange={(e) => setNewProduct({...newProduct, expirationDate: e.target.value})} className="h-12 border-gray-200" />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-xs font-black uppercase text-gray-400 ml-1">Upload Image (JPG/PNG)</label>
                                    <Input 
                                        type="file" 
                                        accept="image/png, image/jpeg"
                                        onChange={(e) => setUploadFile(e.target.files?.[0] || null)} 
                                        className="h-12 border-gray-200 cursor-pointer 
                                        file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 
                                        file:text-xs file:font-black file:bg-[#134c9c] file:text-white 
                                        hover:file:bg-blue-800 transition-all pt-2.5" 
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-xs font-black uppercase text-gray-400 ml-1">Brand</label>
                                    <Select value={newProduct.brandId ? newProduct.brandId.toString() : ""} onValueChange={(val) => setNewProduct({...newProduct, brandId: parseInt(val)})}>
                                        <SelectTrigger className="h-12 border-gray-200">
                                            <SelectValue placeholder="Select Brand" />
                                        </SelectTrigger>
            
                                        <SelectContent className="z-[120]">
                                            {brands.map(b => (
                                                <SelectItem key={b.id} value={b.id.toString()}>{b.name}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-xs font-black uppercase text-gray-400 ml-1">Category</label>
                                    <Select value={newProduct.categoryId ? newProduct.categoryId.toString() : ""} onValueChange={(val) => setNewProduct({...newProduct, categoryId: parseInt(val)})}>
                                        <SelectTrigger className="h-12 border-gray-200">
                                            <SelectValue placeholder="Select Category" />
                                        </SelectTrigger>

                                        <SelectContent className="z-[120]">
                                            {categories.map(c => (
                                                <SelectItem key={c.id} value={c.id.toString()}>{c.name}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>
                            
                            <div className="space-y-2">
                                <label className="text-xs font-black uppercase text-gray-400 ml-1">Description</label>
                                <textarea 
                                    className="w-full min-h-24 p-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all text-sm"
                                    value={newProduct.description}
                                    onChange={(e) => setNewProduct({...newProduct, description: e.target.value})}
                                    placeholder="Write something about the product..."
                                />
                            </div>

                            {/* --- NOU: SECȚIUNEA EXTENSIBILĂ PENTRU ATRIBUTE --- */}
                            <div className="pt-2">
                                <button 
                                    type="button" 
                                    onClick={() => setShowAttributes(!showAttributes)} 
                                    className="flex items-center gap-2 text-sm font-bold text-[#134c9c] hover:text-blue-800 transition-colors bg-blue-50/50 hover:bg-blue-50 px-4 py-2 rounded-xl"
                                >
                                    {showAttributes ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                                    {showAttributes ? "Hide Nutritional Information" : "Add Nutritional Info (Optional)"}
                                </button>
                                
                                {showAttributes && (
                                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4 p-5 bg-gray-50 rounded-2xl border border-gray-100 animate-in slide-in-from-top-2 fade-in">
                                        <div className="space-y-2">
                                            <label className="text-xs font-bold text-gray-500 ml-1">Calories (kcal)</label>
                                            <Input type="number" value={newProduct.calories} onChange={(e) => setNewProduct({...newProduct, calories: e.target.value})} placeholder="e.g. 250" className="h-10 bg-white" />
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-xs font-bold text-gray-500 ml-1">Proteins (g)</label>
                                            <Input type="number" value={newProduct.proteins} onChange={(e) => setNewProduct({...newProduct, proteins: e.target.value})} placeholder="e.g. 15" className="h-10 bg-white" />
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-xs font-bold text-gray-500 ml-1">Carbs (g)</label>
                                            <Input type="number" value={newProduct.carbs} onChange={(e) => setNewProduct({...newProduct, carbs: e.target.value})} placeholder="e.g. 30" className="h-10 bg-white" />
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-xs font-bold text-gray-500 ml-1">Fats (g)</label>
                                            <Input type="number" value={newProduct.fats} onChange={(e) => setNewProduct({...newProduct, fats: e.target.value})} placeholder="e.g. 10" className="h-10 bg-white" />
                                        </div>
                                    </div>
                                )}
                            </div>

                            <div className="flex gap-4 pt-4">
                                <Button type="button" onClick={() => setIsAddModalOpen(false)} variant="outline" className="w-full h-14 text-lg font-bold rounded-2xl border-2">Cancel</Button>
                                <Button 
                                    type="submit"
                                    disabled={newProduct.brandId === 0 || newProduct.categoryId === 0}
                                    className="w-full h-14 text-lg font-bold rounded-2xl shadow-lg bg-[#134c9c] hover:bg-[#80c4e8] hover:text-black text-white disabled:opacity-50"
                                >
                                    Create Product
                                </Button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}