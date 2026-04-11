import { useEffect, useState } from "react";
import axios from "axios";
import { useAuth } from "@/context/AuthContext";
import { Link, Navigate } from "react-router-dom";
import { Loader2, CheckCircle2, AlertTriangle, X, Send, Menu, PackageOpen, CalendarDays, Download, Tag } from "lucide-react";
import { Button } from "@/components/ui/button";

import AdminSidebar from "@/components/admin/AdminSidebar";
import AdminOverview from "@/components/admin/AdminOverview";
import AdminRevenue from "@/components/admin/AdminRevenue";
import AdminOrders from "@/components/admin/AdminOrders";
import AdminProducts from "@/components/admin/AdminProducts";
import AdminDiscounts from "@/components/admin/AdminDiscounts";
import AdminClearance from "@/components/admin/AdminClearance";
import AdminNotifications from "@/components/admin/AdminNotifications";
import AdminChurn from "@/components/admin/AdminChurn";
import { generateInvoicePDF } from "@/lib/pdfGenerator";

interface OrderItem {
    productName: string;
    quantity: number;
    price: number;
    basePrice: number;
    subTotal: number;
    imageUrl?: string;
    unitOfMeasure?: string;
    productId?: number;
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
    const [selectedOrderDetails, setSelectedOrderDetails] = useState<OrderDetails | null>(null);

    const [dismissedAlerts, setDismissedAlerts] = useState<string[]>(() => {
        const saved = localStorage.getItem("dismissedSystemAlerts");
        return saved ? JSON.parse(saved) : [];
    });

    const [adminLogs, setAdminLogs] = useState<{ id: number, message: string, date: string, type: 'status' | 'price' | 'delete' | 'clearance' | 'add' | 'promo' }[]>(() => {
        const saved = localStorage.getItem("adminActionLogs");
        return saved ? JSON.parse(saved) : [];
    });

    const [toast, setToast] = useState<{ show: boolean; message: string; type: 'success' | 'error' }>({ show: false, message: '', type: 'success' });
    const [promoModal, setPromoModal] = useState<{ show: boolean, directSend?: boolean, clientId: number, clientName: string } | null>(null);
    const [sendingToId, setSendingToId] = useState<number | null>(null);

    const [sentPromos, setSentPromos] = useState<number[]>(() => {
        const saved = localStorage.getItem("sentAdminPromos");
        return saved ? JSON.parse(saved) : [];
    });

    const addAdminLog = (message: string, type: 'status' | 'price' | 'delete' | 'clearance' | 'add' | 'promo') => {
        const newLog = { id: Date.now(), message, date: new Date().toISOString(), type };
        const updatedLogs = [newLog, ...adminLogs];
        setAdminLogs(updatedLogs);
        localStorage.setItem("adminActionLogs", JSON.stringify(updatedLogs));
    };

    useEffect(() => {
        const fetchStatsAndOrders = async () => {
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
            }
        };

        if (user?.role === "ADMIN") fetchStatsAndOrders();
    }, [token, user]);

    const handleSendPromo = async (clientId: number, clientName: string) => {
        setSendingToId(clientId);
        try {
            const apiUrl = import.meta.env.VITE_API_URL;
            const message = `We miss you! Use code COMEBACK20-U${clientId} at checkout for a 20% discount on your next order!`;

            await axios.post(`${apiUrl}/notifications/send`, { userId: clientId, message: message }, { headers: { Authorization: `Bearer ${token}` } });
            addAdminLog(`Sent 20% comeback promo code to ${clientName} (ID: #${clientId}).`, 'promo');

            const updatedSent = [...sentPromos, clientId];
            setSentPromos(updatedSent);
            localStorage.setItem("sentAdminPromos", JSON.stringify(updatedSent));

            setToast({ show: true, message: `Promo code successfully sent to ${clientName}!`, type: 'success' });
            setTimeout(() => setToast({ show: false, message: '', type: 'success' }), 4000);
        } catch (err) {
            setToast({ show: true, message: "Failed to send promo code.", type: 'error' });
            setTimeout(() => setToast({ show: false, message: '', type: 'error' }), 4000);
        } finally {
            setSendingToId(null);
            setPromoModal(null);
        }
    };

    useEffect(() => {
        if (promoModal?.directSend) {
            handleSendPromo(promoModal.clientId, promoModal.clientName);
        }
    }, [promoModal]);

    const formatDate = (dateString: string) => new Intl.DateTimeFormat('en-GB', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }).format(new Date(dateString));

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
    const getDisplayUnit = (unit: string | undefined) => {
        if (!unit) return 'piece';
        const u = unit.toLowerCase().trim();

        if (['l', 'ml', 'litru', 'litri'].includes(u)) return 'piece';
        if (['kg', 'kilogram'].includes(u)) return '1kg';
        if (['g', 'gr', 'gram'].includes(u)) return '100g';
        if (['buc', 'bucata'].includes(u)) return 'piece';

        return unit;
    };

    const displayFormattedStock = (quantity: number, unit: string) => {
        if (unit === "100g") {
            const totalGrams = quantity * 100;
            if (totalGrams >= 1000) return `${(totalGrams / 1000).toFixed(2).replace(/\.00$/, '')} kg`;
            return `${totalGrams} g`;
        }
        return `${quantity} ${unit}`;
    };

    const generateChartData = () => {
        const validOrders = allOrders.filter(o => o.status !== 'CANCELLED');
        const now = new Date();

        if (timeRange === 'week') {
            // Zilele saptamanii incepand cu Luni
            const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
            const last7Days = Array.from({ length: 7 }, (_, i) => {
                const d = new Date();
                d.setDate(d.getDate() - (6 - i));

                // getDay() returneaza 0 pentru Sunday, 1 pentru Monday etc.
                // Ajustam indexul ca sa potriveasca cu array-ul nostru (Monday = 0, Sunday = 6)
                let dayIndex = d.getDay() - 1;
                if (dayIndex === -1) dayIndex = 6; // Sunday

                return { date: d.toDateString(), name: days[dayIndex], sales: 0 };
            });

            validOrders.forEach(o => {
                const od = new Date(o.createdAt).toDateString();
                const dayMatch = last7Days.find(d => d.date === od);
                if (dayMatch) dayMatch.sales += o.totalPrice;
            });
            return last7Days.map(d => ({ ...d, sales: Number(d.sales.toFixed(2)) }));
        }

        if (timeRange === 'month') {
            const weeks = [
                { name: 'Week 1', sales: 0 },
                { name: 'Week 2', sales: 0 },
                { name: 'Week 3', sales: 0 },
                { name: 'Week 4', sales: 0 }
            ];

            validOrders.forEach(o => {
                const diffTime = Math.abs(now.getTime() - new Date(o.createdAt).getTime());
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


    if (!user || user.role !== "ADMIN") return <Navigate to="/" replace />;
    if (isLoadingStats) return <div className="min-h-[93vh] flex items-center justify-center bg-[#f8fafc]"><Loader2 className="animate-spin text-[#134c9c]" size={50} /></div>;

    const renderActiveTab = () => {
        switch (activeTab) {
            case 'dashboard':
                return <AdminOverview user={user} stats={stats} timeRange={timeRange} setTimeRange={setTimeRange} chartData={generateChartData()} chartTitle={getChartTitle()} setActiveTab={setActiveTab} />;
            case 'revenue':
                return <AdminRevenue allOrders={allOrders} formatDate={formatDate} getStatusColor={getStatusColor} />;
            case 'ordersList':
                return <AdminOrders allOrders={allOrders} setAllOrders={setAllOrders} token={token} addAdminLog={addAdminLog} setToast={setToast} setSelectedOrderDetails={setSelectedOrderDetails} formatDate={formatDate} getStatusColor={getStatusColor} />;
            case 'products':
                return <AdminProducts token={token} addAdminLog={addAdminLog} setToast={setToast} displayFormattedStock={displayFormattedStock} />;
            case 'discounts':
                return <AdminDiscounts token={token} addAdminLog={addAdminLog} setToast={setToast} />;
            case 'expiring':
                return <AdminClearance token={token} addAdminLog={addAdminLog} setToast={setToast} displayFormattedStock={displayFormattedStock} />;
            case 'notifications':
                return <AdminNotifications allOrders={allOrders} adminLogs={adminLogs} setAdminLogs={setAdminLogs} dismissedAlerts={dismissedAlerts} setDismissedAlerts={setDismissedAlerts} formatDate={formatDate} />;
            case 'churn':
                return <AdminChurn token={token} setPromoModal={setPromoModal} sentPromos={sentPromos} handleSendPromo={handleSendPromo} />;
            default: return null;
        }
    };

    return (
        <div className="min-h-[93vh] bg-[#f8fafc] flex flex-col md:flex-row relative w-full">
            <div className="md:hidden bg-white border-b border-gray-100 p-4 flex items-center justify-between sticky top-0 z-40 shadow-sm">
                <div className="flex items-center gap-2 text-[#134c9c]">
                    <span className="font-black text-lg tracking-tight">Admin Panel</span>
                </div>
                <button onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} className="p-2 bg-blue-50 text-[#134c9c] rounded-xl hover:bg-blue-100 transition-colors">
                    {isMobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
                </button>
            </div>

            {isMobileMenuOpen && (
                <div className="fixed inset-0 bg-black/50 z-40 md:hidden backdrop-blur-sm" onClick={() => setIsMobileMenuOpen(false)} />
            )}

            <AdminSidebar
                activeTab={activeTab}
                setActiveTab={setActiveTab}
                isMobileMenuOpen={isMobileMenuOpen}
                setIsMobileMenuOpen={setIsMobileMenuOpen}
                expiringCount={stats.expiringProducts}
                newNotifsCount={0}
            />

            <div className="flex-1 w-full min-w-0 p-4 sm:p-6 lg:p-8 overflow-y-auto">
                {renderActiveTab()}
            </div>

            {toast.show && (
                <div className={`fixed bottom-8 right-8 z-[999] flex items-center gap-3 px-6 py-4 rounded-2xl shadow-2xl animate-in slide-in-from-bottom-5 fade-in duration-300 ${toast.type === 'success' ? 'bg-gray-900 text-white border-l-4 border-l-green-500' : 'bg-red-600 text-white'}`}>
                    {toast.type === 'success' ? <CheckCircle2 size={24} className="text-green-400" /> : <AlertTriangle size={24} />}
                    <p className="font-bold text-sm tracking-wide">{toast.message}</p>
                </div>
            )}

            {promoModal && promoModal.show && !promoModal.directSend && (
                <div className="fixed inset-0 z-[150] flex items-center justify-center bg-black/50 backdrop-blur-sm px-4">
                    <div className="bg-white rounded-[2.5rem] p-8 sm:p-10 max-w-md w-full shadow-2xl relative animate-in zoom-in-95 fade-in">
                        <button onClick={() => setPromoModal(null)} className="absolute top-6 right-6 text-gray-400 hover:text-gray-800 transition-colors bg-gray-50 hover:bg-gray-100 p-2 rounded-full">
                            <X size={20} strokeWidth={3} />
                        </button>

                        <div className="flex items-center gap-4 mb-6">
                            <div className="w-14 h-14 rounded-full flex items-center justify-center bg-blue-50 text-[#134c9c] shrink-0">
                                <Send size={28} className="translate-x-0.5" />
                            </div>
                            <h2 className="text-2xl font-black text-gray-900 leading-tight">Send Again?</h2>
                        </div>

                        <p className="text-gray-500 mb-8 text-lg leading-relaxed">
                            You have already sent a promo code to <strong className="text-gray-900">{promoModal.clientName}</strong>. Are you sure you want to send another notification?
                        </p>

                        <div className="flex gap-4">
                            <Button onClick={() => setPromoModal(null)} variant="outline" className="flex-1 h-14 text-base font-bold rounded-2xl border-2 hover:bg-gray-50 transition-all">Cancel</Button>
                            <Button
                                onClick={() => handleSendPromo(promoModal.clientId, promoModal.clientName)}
                                disabled={sendingToId === promoModal.clientId}
                                className="flex-1 h-14 text-base font-bold rounded-2xl shadow-lg shadow-blue-900/20 bg-[#134c9c] hover:bg-[#0f3d7d] text-white transition-all hover:-translate-y-0.5"
                            >
                                {sendingToId === promoModal.clientId ? <Loader2 className="animate-spin" size={20} /> : "Yes, Send"}
                            </Button>
                        </div>
                    </div>
                </div>
            )}

            {selectedOrderDetails && (
                <div className="fixed inset-0 z-[150] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
                    <div className="bg-white rounded-[2.5rem] p-0 max-w-3xl w-full shadow-2xl relative animate-in zoom-in-95 flex flex-col max-h-[90vh] overflow-hidden border border-gray-100">
                        <div className="p-6 sm:p-8 bg-gray-50 border-b border-gray-100 flex items-start justify-between shrink-0">
                            <div>
                                <div className="flex flex-wrap items-center gap-3 mb-2">
                                    <h2 className="text-2xl sm:text-3xl font-black text-gray-900 tracking-tight">Order #{selectedOrderDetails.id}</h2>
                                    <span className={`px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest border shadow-sm ${getStatusColor(selectedOrderDetails.status)}`}>
                                        {selectedOrderDetails.status}
                                    </span>
                                </div>
                                <p className="text-sm text-gray-500 font-medium flex items-center gap-1.5">
                                    <CalendarDays size={16} className="text-gray-400" />
                                    Placed on <span className="text-gray-700 font-bold">{formatDate(selectedOrderDetails.createdAt)}</span>
                                </p>
                            </div>
                            <div className="flex items-center gap-3">
                                {selectedOrderDetails.status !== 'CANCELLED' && (
                                    <button
                                        onClick={() => generateInvoicePDF(selectedOrderDetails, selectedOrderDetails.userEmail)}
                                        className="text-[#134c9c] hover:text-white transition-all bg-blue-50 hover:bg-[#134c9c] px-5 py-2.5 rounded-xl shadow-sm border border-blue-200 flex items-center gap-2 font-black text-sm hover:-translate-y-0.5"
                                        title="Download Invoice PDF"
                                    >
                                        <Download size={18} strokeWidth={2.5} />
                                        <span className="hidden sm:inline">Invoice</span>
                                    </button>
                                )}
                                <button
                                    onClick={() => setSelectedOrderDetails(null)}
                                    className="text-gray-400 hover:text-gray-900 transition-colors bg-white hover:bg-gray-100 p-2.5 rounded-xl shadow-sm border border-gray-200"
                                >
                                    <X size={20} strokeWidth={3} />
                                </button>
                            </div>
                        </div>

                        <div className="p-6 sm:p-8 overflow-y-auto flex-1 bg-white">
                            <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest mb-4">
                                Items Ordered ({selectedOrderDetails.items.length})
                            </h3>
                            <div className="space-y-4">
                                {selectedOrderDetails.items.map((item: any, idx: number) => {
                                    const isReduced = item.basePrice > item.price;

                                    // Logica pentru a afisa Clearance DOAR cand e reducere de expirare (25%, 55%, 75%)
                                    let isClearance = false;
                                    if (isReduced) {
                                        const discountPercent = Math.round(((item.basePrice - item.price) / item.basePrice) * 100);
                                        if (discountPercent === 25 || discountPercent === 55 || discountPercent === 75) {
                                            isClearance = true;
                                        }
                                    }

                                    return (
                                        <div key={idx} className="flex items-center justify-between gap-4 p-3 rounded-2xl border border-gray-100/80 bg-gray-50/50 hover:bg-gray-50 transition-colors shadow-sm">
                                            <div className="flex items-center gap-4">
                                                {/* Poza cu bulina de cantitate */}
                                                <div className="relative">
                                                    <div className="w-16 h-16 bg-white rounded-xl border border-gray-100 flex items-center justify-center shrink-0 p-1.5 shadow-sm">
                                                        {item.imageUrl ? (
                                                            <img src={item.imageUrl} alt={item.productName} className="w-full h-full object-contain mix-blend-multiply" />
                                                        ) : (
                                                            <PackageOpen size={20} className="text-gray-300" />
                                                        )}
                                                    </div>
                                                    <div className="absolute -top-2 -right-2 bg-gray-900 text-white text-[10px] font-bold w-5 h-5 flex items-center justify-center rounded-full shadow-sm ring-2 ring-white">
                                                        {item.quantity}
                                                    </div>
                                                </div>

                                                {/* Detalii Nume si Pret */}
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex items-center gap-2 mb-1">
                                                        <Link to={`/product/${item.productId}`} className="font-bold text-gray-900 text-sm hover:text-[#134c9c] transition-colors truncate">
                                                            {item.productName}
                                                        </Link>
                                                        {isClearance && (
                                                            <span className="bg-gradient-to-r from-orange-500 to-red-500 text-white text-[9px] font-black uppercase tracking-widest px-1.5 py-0.5 rounded shrink-0 shadow-sm">
                                                                Clearance
                                                            </span>
                                                        )}
                                                    </div>
                                                    <div className="flex items-center gap-1.5 text-xs">
                                                        {isReduced ? (
                                                            <div className="flex items-center gap-1.5">
                                                                <span className="line-through text-gray-300 font-medium">{item.basePrice.toFixed(2)}</span>
                                                                <span className="text-red-600 font-bold">
                                                                    {item.price.toFixed(2)} Lei / {getDisplayUnit(item.unitOfMeasure)}
                                                                </span>
                                                            </div>
                                                        ) : (
                                                            <span className="text-gray-600 font-medium">
                                                                {item.price.toFixed(2)} Lei / {getDisplayUnit(item.unitOfMeasure)}
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Subtotal */}
                                            <div className="text-right flex-shrink-0 pr-2 flex flex-col justify-center items-end">
                                                <div className="font-black text-[#134c9c] text-xl leading-none">
                                                    {item.subTotal.toFixed(2)}
                                                    <span className="text-xs font-bold text-gray-400 uppercase tracking-widest ml-1">LEI</span>
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>

                        <div className="p-6 sm:p-8 bg-gray-50 border-t border-gray-100 flex flex-col gap-3 shrink-0">
                            {(() => {
                                const sumOfItems = selectedOrderDetails.items.reduce((acc, it) => acc + (it.subTotal), 0);
                                const promoDiscount = sumOfItems - selectedOrderDetails.totalPrice;

                                if (promoDiscount > 0.05) {
                                    return (
                                        <div className="flex justify-between items-center text-sm font-bold text-[#134c9c] mb-2 border-b border-gray-200/50 pb-4">
                                            <span className="flex items-center gap-2"><Tag size={18} className="text-blue-500" /> Promo Code Applied</span>
                                            <span className="text-lg tracking-tight font-black">-{promoDiscount.toFixed(2)} LEI</span>
                                        </div>
                                    );
                                }
                                return null;
                            })()}

                            <div className="flex justify-between items-end">
                                <div>
                                    <p className="text-gray-500 font-black uppercase tracking-widest text-[10px] mb-1">Total Amount</p>
                                    <p className="text-xs text-gray-400 font-medium">Includes all taxes & delivery</p>
                                </div>
                                <div className="text-right">
                                    <p className="text-4xl font-black text-[#134c9c] leading-none tracking-tighter">
                                        {selectedOrderDetails.totalPrice.toFixed(2)} <span className="text-base text-gray-500 tracking-widest">LEI</span>
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}