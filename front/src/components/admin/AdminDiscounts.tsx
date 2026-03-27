import { useState, useEffect } from "react";
import axios from "axios";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Tag, Search, Plus, Loader2, Save, X, Edit2, Trash2} from "lucide-react";

interface Discount {
    id: number;
    percentage: number;
    productId: number;
    productName: string;
    productImage?: string;
    basePrice: number;
    reducedPrice: number;
}

interface AdminDiscountsProps {
    token: string | null;
    addAdminLog: (msg: string, type: any) => void;
    setToast: (toast: any) => void;
    setIsAddDiscountModalOpen: (open: boolean) => void;
}

export default function AdminDiscounts({ token, addAdminLog, setToast, setIsAddDiscountModalOpen }: AdminDiscountsProps) {
    const [discounts, setDiscounts] = useState<Discount[]>([]);
    const [isLoadingDiscounts, setIsLoadingDiscounts] = useState(false);
    const [discountSearchTerm, setDiscountSearchTerm] = useState("");
    const [discountsPage, setDiscountsPage] = useState(1);
    const [editingDiscountId, setEditingDiscountId] = useState<number | null>(null);
    const [editDiscountPercentage, setEditDiscountPercentage] = useState<number>(0);
    const ITEMS_PER_PAGE = 10;

    const fetchDiscounts = async () => {
        setIsLoadingDiscounts(true);
        try {
            const apiUrl = import.meta.env.VITE_API_URL;
            const res = await axios.get(`${apiUrl}/discounts`, { headers: { Authorization: `Bearer ${token}` } });
            setDiscounts(res.data);
        } catch (err) {
            console.error(err);
        } finally {
            setIsLoadingDiscounts(false);
        }
    };

    useEffect(() => {
        fetchDiscounts();
        window.addEventListener('refresh_discounts', fetchDiscounts);
        return () => window.removeEventListener('refresh_discounts', fetchDiscounts);
    }, []);

    const filteredDiscounts = discounts.filter(d => d.productName.toLowerCase().includes(discountSearchTerm.toLowerCase().trim()));
    const paginatedDiscounts = filteredDiscounts.slice((discountsPage - 1) * ITEMS_PER_PAGE, discountsPage * ITEMS_PER_PAGE);
    const totalPages = Math.ceil(filteredDiscounts.length / ITEMS_PER_PAGE) || 1;

    const handleSaveDiscountEdit = async (discountId: number) => {
        if (editDiscountPercentage < 1 || editDiscountPercentage > 99) {
            setToast({ show: true, message: "Percentage must be between 1 and 99.", type: 'error' });
            return;
        }
        try {
            const apiUrl = import.meta.env.VITE_API_URL;
            await axios.put(`${apiUrl}/discounts/${discountId}?percentage=${editDiscountPercentage}`, {}, { headers: { Authorization: `Bearer ${token}` } });
            addAdminLog(`Updated discount #${discountId} to ${editDiscountPercentage}%.`, 'price');
            setEditingDiscountId(null);
            fetchDiscounts();
            setToast({ show: true, message: "Discount updated successfully!", type: 'success' });
        } catch (error) {
            setToast({ show: true, message: "Failed to update discount.", type: 'error' });
        } finally {
            setTimeout(() => setToast({ show: false, message: '', type: 'success' }), 4000);
        }
    };

    const handleDeleteDiscount = async (discountId: number) => {
        try {
            const apiUrl = import.meta.env.VITE_API_URL;
            await axios.delete(`${apiUrl}/discounts/${discountId}`, { headers: { Authorization: `Bearer ${token}` } });
            addAdminLog(`Deleted discount #${discountId}.`, 'delete');
            setDiscounts(discounts.filter(d => d.id !== discountId));
            setToast({ show: true, message: "Discount deleted successfully.", type: 'success' });
        } catch (error) {
            setToast({ show: true, message: "Failed to delete discount.", type: 'error' });
        } finally {
            setTimeout(() => setToast({ show: false, message: '', type: 'success' }), 4000);
        }
    };

    return (
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 max-w-7xl mx-auto">
            <div className="mb-6 flex flex-col md:flex-row md:items-end justify-between gap-4">
                <div>
                    <h1 className="text-3xl sm:text-4xl font-black text-gray-900 mb-2 flex items-center gap-3 tracking-tight">
                        <Tag size={32} className="text-[#134c9c]" /> Manage Discounts
                    </h1>
                    <p className="text-gray-500 text-base">Edit or delete active percentage discounts on products.</p>
                </div>
                <div className="flex flex-col sm:flex-row items-center gap-3 w-full md:w-auto md:ml-auto">
                    <div className="relative w-full md:w-72">
                        <Input type="text" placeholder="Search by product name..." value={discountSearchTerm} onChange={(e) => {setDiscountSearchTerm(e.target.value); setDiscountsPage(1);}} className="pl-10 h-12 bg-white rounded-xl border-gray-200 shadow-sm" />
                        <Search size={18} className="absolute left-3 top-3.5 text-gray-400" />
                    </div>
                    <Button onClick={() => setIsAddDiscountModalOpen(true)} className="w-full sm:w-auto h-12 px-6 bg-[#134c9c] hover:bg-[#0f3d7d] text-white font-black text-sm rounded-xl flex items-center gap-2 shadow-lg shadow-blue-900/20 shrink-0 transition-transform hover:-translate-y-0.5">
                        <Plus size={20} strokeWidth={3} /> Add Discount
                    </Button>
                </div>
            </div>

            <Card className="border border-gray-100 shadow-sm rounded-[2.5rem] bg-white overflow-hidden">
                <CardContent className="p-0">
                    {isLoadingDiscounts ? (
                        <div className="flex justify-center p-16"><Loader2 className="animate-spin text-[#134c9c]" size={40} /></div>
                    ) : (
                        <>
                            <div className="overflow-x-auto w-full">
                                <table className="w-full text-left border-collapse min-w-[800px]">
                                    <thead>
                                        <tr className="bg-gray-50 text-gray-500 text-xs uppercase tracking-wider">
                                            <th className="p-5 font-bold pl-6">ID</th>
                                            <th className="p-5 font-bold">Product</th>
                                            <th className="p-5 font-bold">Base Price</th>
                                            <th className="p-5 font-bold">Discount %</th>
                                            <th className="p-5 font-bold text-red-600">Reduced Price</th>
                                            <th className="p-5 font-bold text-center pr-6">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-100">
                                        {paginatedDiscounts.map((disc) => (
                                            <tr key={disc.id} className={`transition-colors border-b border-gray-50 ${editingDiscountId === disc.id ? 'bg-blue-50/50' : 'hover:bg-blue-50/30'}`}>
                                                <td className="p-5 pl-6">
                                                    <p className="font-black text-gray-900">Disc #{disc.id}</p>
                                                    <p className="text-xs text-gray-400 font-bold mt-1">Prod #{disc.productId}</p>
                                                </td>
                                                <td className="p-5 flex items-center gap-4">
                                                    <div className="w-12 h-12 bg-white border border-gray-200 rounded-xl flex items-center justify-center p-1 shrink-0 shadow-sm">
                                                        <img src={disc.productImage || "https://placehold.co/100?text=No+Img"} alt="" className="w-full h-full object-contain" />
                                                    </div>
                                                    <p className="font-bold text-gray-900 line-clamp-2 max-w-[200px]">{disc.productName}</p>
                                                </td>
                                                <td className="p-5 font-bold text-gray-500 line-through">{disc.basePrice.toFixed(2)} Lei</td>
                                                <td className="p-5">
                                                    {editingDiscountId === disc.id ? (
                                                        <div className="flex items-center gap-1 w-24">
                                                            <Input type="number" value={editDiscountPercentage} onChange={(e) => setEditDiscountPercentage(Number(e.target.value))} className="w-16 h-10 bg-white px-2 font-bold text-[#134c9c] rounded-xl shadow-sm" autoFocus />
                                                            <span className="font-black text-gray-500 text-lg">%</span>
                                                        </div>
                                                    ) : (
                                                        <span className="inline-flex items-center justify-center px-3 py-1.5 bg-red-100 text-red-600 font-black rounded-xl text-sm shadow-sm border border-red-200">
                                                            -{disc.percentage}%
                                                        </span>
                                                    )}
                                                </td>
                                                <td className="p-5 font-black text-red-600 text-xl">{disc.reducedPrice.toFixed(2)} <span className="text-sm uppercase tracking-widest">Lei</span></td>
                                                <td className="p-5 pr-6">
                                                    {editingDiscountId === disc.id ? (
                                                        <div className="flex items-center justify-center gap-2">
                                                            <button onClick={() => handleSaveDiscountEdit(disc.id)} className="p-2.5 bg-green-100 text-green-600 rounded-xl hover:bg-green-600 hover:text-white transition-colors shadow-sm" title="Save"><Save size={18} /></button>
                                                            <button onClick={() => setEditingDiscountId(null)} className="p-2.5 bg-red-100 text-red-600 rounded-xl hover:bg-red-600 hover:text-white transition-colors shadow-sm" title="Cancel"><X size={18} /></button>
                                                        </div>
                                                    ) : (
                                                        <div className="flex items-center justify-center gap-3">
                                                            <button onClick={() => { setEditingDiscountId(disc.id); setEditDiscountPercentage(disc.percentage); }} className="p-2 bg-gray-100 text-[#134c9c] hover:bg-[#134c9c] hover:text-white rounded-xl transition-colors shadow-sm" title="Edit Discount"><Edit2 size={16} /></button>
                                                            <button onClick={() => handleDeleteDiscount(disc.id)} className="p-2 bg-red-50 text-red-500 hover:bg-red-600 hover:text-white rounded-xl transition-colors shadow-sm" title="Remove Discount"><Trash2 size={16} /></button>
                                                        </div>
                                                    )}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                                {filteredDiscounts.length === 0 && (
                                    <div className="text-center p-12 text-gray-500 flex flex-col items-center">
                                        <Tag size={48} className="text-gray-300 mb-4" />
                                        <p className="font-bold text-lg text-gray-900 mb-1">No active discounts</p>
                                    </div>
                                )}
                            </div>
                            {totalPages > 1 && (
                                <div className="flex flex-col sm:flex-row items-center justify-between gap-4 px-6 py-4 bg-gray-50 border-t border-gray-100 rounded-b-[2rem]">
                                    <span className="text-xs font-bold text-gray-500 uppercase tracking-widest text-center sm:text-left">
                                        Showing {(discountsPage - 1) * ITEMS_PER_PAGE + 1} - {Math.min(discountsPage * ITEMS_PER_PAGE, filteredDiscounts.length)} of {filteredDiscounts.length}
                                    </span>
                                    <div className="flex gap-2">
                                        <Button variant="outline" size="sm" disabled={discountsPage === 1} onClick={() => setDiscountsPage(p => p - 1)} className="h-9 rounded-xl font-bold border-gray-200">Previous</Button>
                                        <Button variant="outline" size="sm" disabled={discountsPage === totalPages} onClick={() => setDiscountsPage(p => p + 1)} className="h-9 rounded-xl font-bold border-gray-200">Next</Button>
                                    </div>
                                </div>
                            )}
                        </>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}