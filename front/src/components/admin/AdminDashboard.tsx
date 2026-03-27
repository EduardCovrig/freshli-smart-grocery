import { useEffect, useState } from "react";
import axios from "axios";
import { useAuth } from "@/context/AuthContext";
import { Navigate } from "react-router-dom";
import {
    Store,
    Loader2,
    CheckCircle2,
    AlertTriangle,
    X,
    ShoppingCart,
    CalendarDays,
    Download,
    SearchX,
    Menu
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Product } from "@/types";
import { generateInvoicePDF } from "@/lib/pdfGenerator";

// IMPORTURI COMPONENTE EXtrase
import AdminSidebar from "@/components/admin/AdminSidebar";
import AdminOverview from "@/components/admin/AdminOverview";

// --- TO DO: Urmeaza sa le extragem si pe astea in PASUL 2 ---
// import AdminRevenue from "@/components/admin/AdminRevenue";
// import AdminOrders from "@/components/admin/AdminOrders";
// import AdminProducts from "@/components/admin/AdminProducts";
// ...

interface OrderItem {
    productName: string;
    quantity: number;
    price: number;
    basePrice: number;
    subTotal: number;
    imageUrl?: string;
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

    const [activeTab, setActiveTab] = useState<'dashboard' | 'products' | 'expiring' | 'ordersList' | 'revenue' | 'notifications' | 'churn' | 'discounts'>('dashboard');
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false); 

    const [stats, setStats] = useState({ totalOrders: 0, totalRevenue: 0, expiringProducts: 0 });
    const [isLoadingStats, setIsLoadingStats] = useState(true);
    const [timeRange, setTimeRange] = useState<'week' | 'month' | 'year'>('week');

    const [allOrders, setAllOrders] = useState<OrderDetails[]>([]);
    const [isLoadingOrders, setIsLoadingOrders] = useState(false);

    // Stari pentru sistemul de Notificari/Log-uri interne pentru Admin
    const [dismissedAlerts, setDismissedAlerts] = useState<string[]>(() => {
        const saved = localStorage.getItem("dismissedSystemAlerts");
        return saved ? JSON.parse(saved) : [];
    });

    const [toast, setToast] = useState<{ show: boolean; message: string; type: 'success' | 'error' }>({ show: false, message: '', type: 'success' });

    // Preluare date globale
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


    // Functii pentru Grafice
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
            return last7Days.map(d => ({ ...d, sales: Number(d.sales.toFixed(2)) }));
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
            return weeks.map(w => ({ ...w, sales: Number(w.sales.toFixed(2)) }));
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
            return yearData.map(m => ({ ...m, sales: Number(m.sales.toFixed(2)) }));
        }
        return [];
    };

    const getChartTitle = () => {
        if (timeRange === 'month') return "Monthly Revenue (Last 28 Days)";
        if (timeRange === 'year') return `Yearly Revenue (${new Date().getFullYear()})`;
        return "Weekly Revenue (Last 7 Days)";
    };


    // Protectie Ruta
    if (!user || user.role !== "ADMIN") return <Navigate to="/" replace />;
    if (isLoadingStats) return <div className="min-h-[93vh] flex items-center justify-center bg-[#f8fafc]"><Loader2 className="animate-spin text-[#134c9c]" size={50} /></div>;

    // Calcul pentru numarul de notificari necitite (simulat pentru exemplul curent)
    const newNotifsCount = 0; // Vom aduce logica reala inapoi in pasul 2 cand extragem si Notification component

    return (
        <div className="min-h-[93vh] bg-[#f8fafc] flex flex-col md:flex-row relative w-full">
            
            {/* --- HEADER MOBIL --- */}
            <div className="md:hidden bg-white border-b border-gray-100 p-4 flex items-center justify-between sticky top-0 z-40 shadow-sm">
                <div className="flex items-center gap-2 text-[#134c9c]">
                    <Store size={24} />
                    <span className="font-black text-lg tracking-tight">Admin Panel</span>
                </div>
                <button onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} className="p-2 bg-blue-50 text-[#134c9c] rounded-xl hover:bg-blue-100 transition-colors">
                    {isMobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
                </button>
            </div>

            {/* --- OVERLAY MOBIL --- */}
            {isMobileMenuOpen && (
                <div className="fixed inset-0 bg-black/50 z-40 md:hidden backdrop-blur-sm" onClick={() => setIsMobileMenuOpen(false)} />
            )}

            {/* --- SIDEBAR --- */}
            <AdminSidebar 
                activeTab={activeTab} 
                setActiveTab={setActiveTab} 
                isMobileMenuOpen={isMobileMenuOpen} 
                setIsMobileMenuOpen={setIsMobileMenuOpen}
                expiringCount={stats.expiringProducts}
                newNotifsCount={newNotifsCount}
            />

            {/* --- CONTINUTUL PRINCIPAL --- */}
            <div className="flex-1 w-full min-w-0 p-4 sm:p-6 lg:p-8 overflow-y-auto">
                {activeTab === 'dashboard' && (
                    <AdminOverview 
                        user={user}
                        stats={stats}
                        timeRange={timeRange}
                        setTimeRange={setTimeRange}
                        chartData={generateChartData()}
                        chartTitle={getChartTitle()}
                        setActiveTab={setActiveTab}
                    />
                )}

                {/* Restul tab-urilor sunt ascunse momentan pentru a testa curatenia. Le vom adauga imediat inapoi în PASUL 2! */}
                {activeTab !== 'dashboard' && (
                    <div className="text-center mt-20">
                        <Loader2 className="animate-spin text-[#134c9c] mx-auto mb-4" size={40} />
                        <h2 className="text-xl font-bold text-gray-500">Migrating component...</h2>
                    </div>
                )}
            </div>

            {/* FLOATING TOAST NOTIFICATION */}
            {toast.show && (
                <div className={`fixed bottom-8 right-8 z-[999] flex items-center gap-3 px-6 py-4 rounded-2xl shadow-2xl animate-in slide-in-from-bottom-5 fade-in duration-300 ${toast.type === 'success' ? 'bg-gray-900 text-white border-l-4 border-l-green-500' : 'bg-red-600 text-white'}`}>
                    {toast.type === 'success' ? <CheckCircle2 size={24} className="text-green-400" /> : <AlertTriangle size={24} />}
                    <p className="font-bold text-sm tracking-wide">{toast.message}</p>
                </div>
            )}
        </div>
    );
}