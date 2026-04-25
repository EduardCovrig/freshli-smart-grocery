import { useState, useEffect } from "react";
import axios from "axios";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Clock, Search, Loader2, Trash2, CheckCircle2, X, AlertTriangle } from "lucide-react";
import { Product } from "@/types";

interface AdminClearanceProps {
    token: string | null;
    addAdminLog: (msg: string, type: any) => void;
    setToast: (toast: any) => void;
    displayFormattedStock: (q: number, u: string) => string;
}

export default function AdminClearance({ token, addAdminLog, setToast, displayFormattedStock }: AdminClearanceProps) {
    const [products, setProducts] = useState<Product[]>([]);
    const [isLoadingProducts, setIsLoadingProducts] = useState(true);
    const [clearanceSearchTerm, setClearanceSearchTerm] = useState("");
    const [clearancePage, setClearancePage] = useState(1);
    const ITEMS_PER_PAGE = 10;

    // MODALE
    const [dropClearanceModal, setDropClearanceModal] = useState<number | null>(null);
    const [isDiscardAllModalOpen, setIsDiscardAllModalOpen] = useState(false);
    const [isDiscardingAll, setIsDiscardingAll] = useState(false);

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

    useEffect(() => {
        fetchProductsList();
        window.addEventListener('refresh_products', fetchProductsList);
        return () => window.removeEventListener('refresh_products', fetchProductsList);
    }, []);

    const expiringProductsList = products.filter(p => (p.nearExpiryQuantity || 0) > 0);
    const filteredExpiringProducts = expiringProductsList.filter(p => 
        p.name.toLowerCase().includes(clearanceSearchTerm.toLowerCase().trim()) ||
        p.id.toString().includes(clearanceSearchTerm.trim())
    );
    const paginatedClearance = filteredExpiringProducts.slice((clearancePage - 1) * ITEMS_PER_PAGE, clearancePage * ITEMS_PER_PAGE);
    const totalPages = Math.ceil(filteredExpiringProducts.length / ITEMS_PER_PAGE) || 1;

    // --- API CALL ---
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

            if (product) { 
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

    const handleDiscardAll = async () => {
        setIsDiscardingAll(true);
        try {
            const apiUrl = import.meta.env.VITE_API_URL;
            
            // Trimitem API call pentru FIECARE produs expirat
            const promises = expiringProductsList.map(p =>
                axios.put(`${apiUrl}/products/${p.id}/drop-clearance`, {}, { headers: { Authorization: `Bearer ${token}` } })
            );
            await Promise.all(promises);

            addAdminLog(`Dropped all clearance stock (${expiringProductsList.length} items).`, 'clearance');
            setToast({ show: true, message: "All clearance stock dropped successfully.", type: 'success' });
            
            // Refacem request-ul ca sa curatam tabelul in UI
            await fetchProductsList();
        } catch (error) {
            setToast({ show: true, message: "Failed to drop all clearance stock.", type: 'error' });
        } finally {
            setIsDiscardingAll(false);
            setIsDiscardAllModalOpen(false);
            setTimeout(() => setToast({ show: false, message: '', type: 'success' }), 4000);
        }
    };

    const renderPagination = (currentPage: number, totalItems: number, setPage: React.Dispatch<React.SetStateAction<number>>) => {
        if (totalPages <= 1) return null;
        return (
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 px-6 py-4 bg-gray-50 border-t border-gray-100 rounded-b-[2rem]">
                <span className="text-xs font-bold text-gray-500 uppercase tracking-widest text-center sm:text-left">
                    Showing {(currentPage - 1) * ITEMS_PER_PAGE + 1} - {Math.min(currentPage * ITEMS_PER_PAGE, totalItems)} of {totalItems}
                </span>
                <div className="flex gap-2">
                    <Button variant="outline" size="sm" disabled={currentPage === 1} onClick={() => setPage(p => p - 1)} className="h-9 rounded-xl font-bold border-gray-200">Previous</Button>
                    <Button variant="outline" size="sm" disabled={currentPage === totalPages} onClick={() => setPage(p => p + 1)} className="h-9 rounded-xl font-bold border-gray-200">Next</Button>
                </div>
            </div>
        );
    };

    return (
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 max-w-7xl mx-auto">
            <div className="mb-6 flex flex-col md:flex-row md:items-end justify-between gap-4">
                <div>
                    <h1 className="text-3xl sm:text-4xl font-black text-orange-600 mb-2 flex items-center gap-3 tracking-tight">
                        <Clock size={32} /> Clearance 
                    </h1>
                    <p className="text-gray-500 text-base">Monitor and manage products that are approaching their expiration date.</p>
                </div>
                
                <div className="flex flex-col sm:flex-row items-center gap-3 w-full md:w-auto md:ml-auto">
                    {/* BUTON NOU: DISCARD ALL */}
                    {expiringProductsList.length > 0 && (
                        <Button 
                            onClick={() => setIsDiscardAllModalOpen(true)} 
                            variant="outline" 
                            className="w-full sm:w-auto h-12 px-4 rounded-xl border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700 font-bold flex items-center gap-2 shrink-0 transition-all shadow-sm"
                        >
                            <Trash2 size={18} /> Discard All
                        </Button>
                    )}

                    <div className="relative w-full md:w-80 shrink-0">
                        <Input type="text" placeholder="Search by name or ID..." value={clearanceSearchTerm} onChange={(e) => {setClearanceSearchTerm(e.target.value); setClearancePage(1);}} className="pl-10 h-12 bg-white rounded-xl border-orange-200 shadow-sm focus-visible:ring-orange-500" />
                        <Search size={18} className="absolute left-3 top-3.5 text-gray-400" />
                    </div>
                </div>
            </div>

            <Card className="border border-orange-100 shadow-sm rounded-[2.5rem] bg-white overflow-hidden">
                <CardContent className="p-0">
                    {isLoadingProducts ? (
                        <div className="flex justify-center p-16"><Loader2 className="animate-spin text-orange-600" size={40} /></div>
                    ) : (
                        <>
                            <div className="overflow-x-auto w-full">
                                <table className="w-full text-left border-collapse min-w-[700px]">
                                    <thead>
                                        <tr className="bg-orange-50 text-orange-800 text-xs uppercase tracking-wider">
                                            <th className="p-5 font-bold w-16 pl-6">ID</th>
                                            <th className="p-5 font-bold">Product</th>
                                            <th className="p-5 font-bold text-center">Expiring Quantity</th>
                                            <th className="p-5 font-bold">Clearance Price</th>
                                            <th className="p-5 font-bold text-center pr-6">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-orange-50">
                                        {paginatedClearance.map((prod) => (
                                            <tr key={prod.id} className="hover:bg-orange-50/40 transition-colors">
                                                <td className="p-5 pl-6 font-black text-gray-900">#{prod.id}</td>
                                                <td className="p-5 flex items-center gap-4">
                                                    <div className="w-14 h-14 bg-white border border-gray-200 rounded-xl flex items-center justify-center p-1 shrink-0 shadow-sm">
                                                        <img src={prod.imageUrls?.[0] || "https://placehold.co/100?text=No+Img"} alt="" className="w-full h-full object-contain" />
                                                    </div>
                                                    <div>
                                                        <p className="font-bold text-gray-900 text-base">{prod.name}</p>
                                                        <p className="text-xs text-orange-600 font-bold mt-1 uppercase tracking-widest bg-orange-100 inline-block px-2 py-0.5 rounded">Exp: {prod.expirationDate}</p>
                                                    </div>
                                                </td>
                                                <td className="p-5 text-center">
                                                    <span className="inline-flex items-center justify-center px-4 py-1.5 bg-red-100 text-red-700 font-black rounded-xl text-sm border border-red-200 shadow-sm">
                                                        {displayFormattedStock(prod.nearExpiryQuantity || 0, prod.unitOfMeasure)}
                                                    </span>
                                                </td>
                                                <td className="p-5">
                                                    <div className="flex flex-col">
                                                        <span className="font-black text-orange-600 text-xl">{prod.currentPrice.toFixed(2)} <span className="text-sm text-gray-500 uppercase tracking-widest">Lei</span></span>
                                                        <span className="text-xs text-gray-400 line-through font-bold mt-1">{prod.price.toFixed(2)} Lei</span>
                                                    </div>
                                                </td>
                                                <td className="p-5 pr-6 text-center">
                                                    <button onClick={() => setDropClearanceModal(prod.id)} className="inline-flex items-center gap-2 text-sm font-bold text-red-500 hover:text-white bg-red-50 hover:bg-red-600 px-4 py-2.5 rounded-xl transition-colors shadow-sm">
                                                        <Trash2 size={16} /> Drop from store
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                                {filteredExpiringProducts.length === 0 && (
                                    <div className="text-center p-16 flex flex-col items-center justify-center bg-green-50/30">
                                        <CheckCircle2 size={60} className="text-green-500 mb-4" strokeWidth={2.5} />
                                        <p className="text-gray-900 font-black text-2xl mb-2 tracking-tight">Great news!</p>
                                        <p className="text-gray-500 text-base">No products are currently near their expiration date.</p>
                                    </div>
                                )}
                            </div>
                            {renderPagination(clearancePage, filteredExpiringProducts.length, setClearancePage)}
                        </>
                    )}
                </CardContent>
            </Card>

            {/* MODAL PENTRU ARUNCAREA UNUI SINGUR LOT EXPIRAT */}
            {dropClearanceModal !== null && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm px-4">
                    <div className="bg-white rounded-[2.5rem] p-8 max-w-md w-full shadow-2xl relative animate-in zoom-in-95">
                        <button onClick={() => setDropClearanceModal(null)} className="absolute top-5 right-5 text-gray-400 hover:text-gray-800 transition-colors bg-gray-100 hover:bg-gray-200 p-2 rounded-full">
                            <X size={20} strokeWidth={3} />
                        </button>

                        <div className="flex items-center gap-4 mb-6">
                            <div className="w-14 h-14 rounded-full flex items-center justify-center bg-orange-50 text-orange-600">
                                <Trash2 size={28} />
                            </div>
                            <h2 className="text-2xl font-black text-gray-900">Discard Clearance?</h2>
                        </div>

                        <p className="text-gray-500 mb-8 text-lg leading-relaxed">
                            Are you sure you want to discard this expiring stock? The items will be removed from sale, but any fresh stock of this product will remain available.
                        </p>

                        <div className="flex gap-4">
                            <Button onClick={() => setDropClearanceModal(null)} variant="outline" className="w-full h-14 text-lg font-bold rounded-2xl border-2">Keep it</Button>
                            <Button
                                onClick={() => handleDropClearance(dropClearanceModal)}
                                className="w-full h-14 text-lg font-bold rounded-2xl shadow-md bg-orange-600 hover:bg-orange-700 text-white hover:-translate-y-0.5 transition-all"
                            >
                                Discard Stock
                            </Button>
                        </div>
                    </div>
                </div>
            )}

            {/* MODAL PENTRU ARUNCAREA TUTUROR LOTURILOR */}
            {isDiscardAllModalOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm px-4">
                    <div className="bg-white rounded-[2.5rem] p-8 max-w-md w-full shadow-2xl relative animate-in zoom-in-95 border-2 border-red-100">
                        <button onClick={() => setIsDiscardAllModalOpen(false)} className="absolute top-5 right-5 text-gray-400 hover:text-gray-800 transition-colors bg-gray-100 hover:bg-gray-200 p-2 rounded-full">
                            <X size={20} strokeWidth={3} />
                        </button>

                        <div className="flex items-center gap-4 mb-6">
                            <div className="w-14 h-14 rounded-full flex items-center justify-center bg-red-100 text-red-600">
                                <AlertTriangle size={28} />
                            </div>
                            <h2 className="text-2xl font-black text-gray-900">Discard All?</h2>
                        </div>

                        <p className="text-gray-500 mb-8 text-lg leading-relaxed">
                            You are about to discard <strong>all {expiringProductsList.length} products</strong> currently in clearance. This action cannot be undone. Are you absolutely sure?
                        </p>

                        <div className="flex gap-4">
                            <Button onClick={() => setIsDiscardAllModalOpen(false)} variant="outline" className="w-full h-14 text-lg font-bold rounded-2xl border-2 hover:bg-gray-50">Cancel</Button>
                            <Button
                                disabled={isDiscardingAll}
                                onClick={handleDiscardAll}
                                className="w-full h-14 text-lg font-bold rounded-2xl shadow-md bg-red-600 hover:bg-red-700 text-white hover:-translate-y-0.5 transition-all"
                            >
                                {isDiscardingAll ? <Loader2 className="animate-spin" size={24}/> : "Yes, Discard All"}
                            </Button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}