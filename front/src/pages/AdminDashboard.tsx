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
    Check
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

export default function AdminDashboard() {
    const { token, user } = useAuth();

    const [activeTab, setActiveTab] = useState<'dashboard' | 'products' | 'expiring' | 'ordersList' | 'revenue' | 'notifications'>('dashboard');

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

    const [revenueFilter, setRevenueFilter] = useState<'today' | 'month' | 'year' | 'all'>('all');

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
        if ((activeTab === 'products' || activeTab === 'expiring' || activeTab === 'notifications') && products.length === 0) {
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
            const newNotif = {
                id: Date.now(),
                orderId: orderId,
                message: `The status for your Order #${orderId} has been updated to ${newStatus}.`,
                date: new Date().toISOString(),
                read: false
            };
            const existingNotifs = JSON.parse(localStorage.getItem('userNotifs') || '[]');
            localStorage.setItem('userNotifs', JSON.stringify([newNotif, ...existingNotifs]));

            window.dispatchEvent(new Event('new_notification'));
            setAllOrders(allOrders.map(o => o.id === orderId ? { ...o, status: newStatus } : o));
            const updatedDrafts = { ...statusDrafts };
            delete updatedDrafts[orderId];
            setStatusDrafts(updatedDrafts);
        } catch (err) {
            alert("Failed to update status.");
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
            setEditingProductId(null);
        } catch (error) {
            alert("Failed to update product details.");
        }
    };

    const handleDeleteProduct = async (productId: number) => {
        if (!window.confirm("Remove this product entirely from the store?")) return;
        try {
            const apiUrl = import.meta.env.VITE_API_URL;
            await axios.delete(`${apiUrl}/products/${productId}`, { headers: { Authorization: `Bearer ${token}` } });
            setProducts(products.filter(p => p.id !== productId));
        } catch (error) { alert("Failed to remove product."); }
    };

    const handleDropClearance = async (productId: number) => {
        if (!window.confirm("Discard expiring stock? The fresh stock will remain available.")) return;
        try {
            const apiUrl = import.meta.env.VITE_API_URL;
            await axios.put(`${apiUrl}/products/${productId}/drop-clearance`, {}, { headers: { Authorization: `Bearer ${token}` } });
            setProducts(products.map(p => {
                if (p.id === productId) {
                    return { ...p, stockQuantity: Math.max(0, p.stockQuantity - (p.nearExpiryQuantity || 0)), nearExpiryQuantity: 0 };
                }
                return p;
            }));
            setStats(prev => ({ ...prev, expiringProducts: Math.max(0, prev.expiringProducts - 1) }));
        } catch (error) { alert("Failed to drop clearance stock."); }
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
            <div className="w-full md:w-64 bg-slate-900 text-white p-6 flex flex-col gap-2 shrink-0 overflow-y-auto border-r border-slate-800">
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
                <button onClick={() => setActiveTab('notifications')} className={`flex items-center justify-between px-4 py-3 rounded-xl font-bold transition-all w-full text-left ${activeTab === 'notifications' ? 'bg-blue-600 shadow-lg shadow-blue-900/50' : 'hover:bg-slate-800 text-slate-300 hover:text-white'}`}>
                    <div className="flex items-center gap-3"><Bell size={20} /> Notifications</div>
                    {newNotifs.length > 0 && <span className="bg-red-500 text-white text-xs px-2 py-0.5 rounded-full">{newNotifs.length}</span>}
                </button>

                <Link to="/" className="flex items-center gap-3 px-4 py-3 rounded-xl text-slate-400 hover:bg-slate-800 hover:text-white transition-colors mt-auto pt-4"><ArrowLeft size={20} /> Exit to Store</Link>
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
                                <p className="text-gray-500">Edit base prices, adjust inventory stock or remove products from the store.</p>
                            </div>
                            <div className="relative w-full md:w-72">
                                <Input type="text" placeholder="Search by product name..." value={productSearchTerm} onChange={(e) => setProductSearchTerm(e.target.value)} className="pl-10 h-12 bg-white rounded-xl border-gray-200" />
                                <Search size={18} className="absolute left-3 top-3.5 text-gray-400" />
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
                                                                    <button onClick={() => handleDeleteProduct(prod.id)} className="text-red-400 hover:text-red-600 transition-colors" title="Remove Product"><Trash2 size={18} /></button>
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
                                                                    <button onClick={() => handleDropClearance(prod.id)} className="flex items-center gap-1 text-xs font-bold text-red-500 hover:text-red-700 bg-red-50 px-3 py-2 rounded-lg transition-colors">
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

            </div>
        </div>
    );
}