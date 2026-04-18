import { useState, useEffect, useMemo } from "react";
import axios from "axios";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tag, Search, Plus, Loader2, Save, X, Edit2, Trash2, AlertTriangle, ArrowRight } from "lucide-react";

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
}

export default function AdminDiscounts({ token, addAdminLog, setToast }: AdminDiscountsProps) {
    const [discounts, setDiscounts] = useState<Discount[]>([]);
    const [products, setProducts] = useState<any[]>([]);
    const [isLoadingDiscounts, setIsLoadingDiscounts] = useState(false);
    const [discountSearchTerm, setDiscountSearchTerm] = useState("");
    const [discountsPage, setDiscountsPage] = useState(1);
    
    // REPARAT: Am schimbat tipul din number in string ca sa poti sterge textul complet fara sa apara acel 0 enervant
    const [editingDiscountId, setEditingDiscountId] = useState<number | null>(null);
    const [editDiscountPercentage, setEditDiscountPercentage] = useState<string>("");
    
    const ITEMS_PER_PAGE = 10;

    // MODALE
    const [isAddDiscountModalOpen, setIsAddDiscountModalOpen] = useState(false);
    const [newDiscountProductId, setNewDiscountProductId] = useState<string>("");
    const [newDiscountPercentage, setNewDiscountPercentage] = useState<number>(10);
    const [deleteDiscountModal, setDeleteDiscountModal] = useState<number | null>(null);
    
    // State pentru căutarea internă din dropdown-ul de produse
    const [modalProductSearch, setModalProductSearch] = useState("");

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
        const fetchProducts = async () => {
            const apiUrl = import.meta.env.VITE_API_URL;
            axios.get(`${apiUrl}/products`).then(res => setProducts(res.data)).catch(console.error);
        };
        fetchProducts();
    }, [token]);

    const filteredDiscounts = discounts.filter(d => 
        d.productName.toLowerCase().includes(discountSearchTerm.toLowerCase().trim()) ||
        d.productId.toString().includes(discountSearchTerm.trim()) ||
        d.id.toString().includes(discountSearchTerm.trim())
    );
    const paginatedDiscounts = filteredDiscounts.slice((discountsPage - 1) * ITEMS_PER_PAGE, discountsPage * ITEMS_PER_PAGE);
    const totalPages = Math.ceil(filteredDiscounts.length / ITEMS_PER_PAGE) || 1;

    // Filtrarea produselor din dropdown-ul modalului
    const filteredModalProducts = products.filter(p => 
        p.name.toLowerCase().includes(modalProductSearch.toLowerCase().trim()) ||
        p.id.toString().includes(modalProductSearch.trim())
    );

    // --- CALCUL PRET NOU PENTRU PREVIEW IN MODAL ---
    const selectedProductForModal = useMemo(() => {
        if (!newDiscountProductId) return null;
        return products.find(p => p.id.toString() === newDiscountProductId);
    }, [newDiscountProductId, products]);

    const previewNewPrice = useMemo(() => {
        if (!selectedProductForModal) return null;
        const discountVal = (selectedProductForModal.price * newDiscountPercentage) / 100;
        return selectedProductForModal.price - discountVal;
    }, [selectedProductForModal, newDiscountPercentage]);


    // --- API CALLS ---
    const handleAddDiscountSubmit = async () => {
        if (!newDiscountProductId || newDiscountPercentage < 1 || newDiscountPercentage > 99) {
            setToast({ show: true, message: "Please select a product and valid percentage.", type: 'error' });
            setTimeout(() => setToast({ show: false, message: '', type: 'error' }), 4000);
            return;
        }
        
        try {
            const apiUrl = import.meta.env.VITE_API_URL;
            await axios.post(`${apiUrl}/discounts?productId=${newDiscountProductId}&percentage=${newDiscountPercentage}`, null, {
                headers: { Authorization: `Bearer ${token}` }
            });
            
            addAdminLog(`Added ${newDiscountPercentage}% discount for product #${newDiscountProductId}.`, 'price');
            setIsAddDiscountModalOpen(false);
            setNewDiscountProductId("");
            setNewDiscountPercentage(10);
            setModalProductSearch(""); // Resetam si search-ul
            fetchDiscounts();
            setToast({ show: true, message: "Discount added successfully!", type: 'success' });
        } catch (error) {
            setToast({ show: true, message: "Failed to add discount.", type: 'error' });
        } finally {
            setTimeout(() => setToast({ show: false, message: '', type: 'success' }), 4000);
        }
    };

    const handleSaveDiscountEdit = async (discountId: number) => {
        // Convertim din string înapoi in numar pentru validare si request API
        const parsedPercentage = Number(editDiscountPercentage);

        if (isNaN(parsedPercentage) || parsedPercentage < 1 || parsedPercentage > 99) {
            setToast({ show: true, message: "Percentage must be a number between 1 and 99.", type: 'error' });
            setTimeout(() => setToast({ show: false, message: '', type: 'error' }), 4000);
            return;
        }
        try {
            const apiUrl = import.meta.env.VITE_API_URL;
            await axios.put(`${apiUrl}/discounts/${discountId}?percentage=${parsedPercentage}`, {}, { headers: { Authorization: `Bearer ${token}` } });
            addAdminLog(`Updated discount #${discountId} to ${parsedPercentage}%.`, 'price');
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
            setDeleteDiscountModal(null);
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
                        <Input type="text" placeholder="Search by name or ID..." value={discountSearchTerm} onChange={(e) => {setDiscountSearchTerm(e.target.value); setDiscountsPage(1);}} className="pl-10 h-12 bg-white rounded-xl border-gray-200 shadow-sm" />
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
                                                            <Input 
                                                                type="number" 
                                                                value={editDiscountPercentage} 
                                                                onChange={(e) => setEditDiscountPercentage(e.target.value)} 
                                                                className="w-16 h-10 bg-white px-2 font-bold text-[#134c9c] rounded-xl shadow-sm [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none" 
                                                                autoFocus 
                                                            />
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
                                                            <button onClick={() => { setEditingDiscountId(disc.id); setEditDiscountPercentage(disc.percentage.toString()); }} className="p-2 bg-gray-100 text-[#134c9c] hover:bg-[#134c9c] hover:text-white rounded-xl transition-colors shadow-sm" title="Edit Discount"><Edit2 size={16} /></button>
                                                            <button onClick={() => setDeleteDiscountModal(disc.id)} className="p-2 bg-red-50 text-red-500 hover:bg-red-600 hover:text-white rounded-xl transition-colors shadow-sm" title="Remove Discount"><Trash2 size={16} /></button>
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

            {/* MODAL PENTRU ADAUGARE DISCOUNT NOU */}
            {isAddDiscountModalOpen && (
                <div className="fixed inset-0 z-[120] flex items-center justify-center bg-black/60 backdrop-blur-sm px-4 py-10">
                    <div className="bg-white rounded-[2.5rem] p-8 sm:p-10 max-w-md w-full shadow-2xl relative animate-in zoom-in-95 border border-gray-100">
                        <button onClick={() => {
                            setIsAddDiscountModalOpen(false);
                            setModalProductSearch(""); // resetam cautarea la inchidere
                        }} className="absolute top-6 right-6 text-gray-400 hover:text-gray-800 transition-colors bg-gray-50 hover:bg-gray-100 p-2 rounded-full">
                            <X size={20} strokeWidth={3} />
                        </button>

                        <div className="flex items-center gap-4 mb-8">
                            <div className="w-14 h-14 rounded-full flex items-center justify-center bg-blue-50 text-[#134c9c] shrink-0">
                                <Tag size={28} />
                            </div>
                            <h2 className="text-2xl font-black text-gray-900 tracking-tight">Add New Discount</h2>
                        </div>

                        <div className="space-y-8 mb-10">
                            <div className="space-y-2.5">
                                <label className="text-xs font-black text-gray-500 uppercase tracking-widest ml-1">Select Product</label>
                                <Select value={newDiscountProductId} onValueChange={setNewDiscountProductId}>
                                    <SelectTrigger className="h-14 border-gray-200 bg-gray-50 rounded-xl font-bold text-gray-900">
                                        <SelectValue placeholder="Choose a product" />
                                    </SelectTrigger>
                                    
                                    <SelectContent className="max-h-[350px] z-[150] rounded-xl flex flex-col p-2">
                                        {/* BARA DE SEARCH INTERNA (Sticky) */}
                                       <div className="sticky top-0 bg-white z-10 pb-2 mb-2 border-b border-gray-100">
                                            <div className="relative">
                                                <Input 
                                                    type="text" 
                                                    placeholder="Search by name or ID..."
                                                    value={modalProductSearch} 
                                                    onChange={(e) => setModalProductSearch(e.target.value)} 
                                                    className="h-10 pl-9 bg-gray-50 border-gray-200 rounded-lg text-sm focus-visible:ring-[#134c9c]" 
                                                    onKeyDown={(e) => e.stopPropagation()} 
                                                    onKeyDownCapture={(e) => e.stopPropagation()}
                                                    onKeyUp={(e) => e.stopPropagation()}
                                                    onKeyUpCapture={(e) => e.stopPropagation()}
                                                />
                                                <Search size={14} className="absolute left-3 top-3 text-gray-400" />
                                            </div>
                                        </div>
                                        
                                        <div className="overflow-y-auto pr-1">
                                            {filteredModalProducts.length > 0 ? (
                                                filteredModalProducts.map(p => (
                                                    <SelectItem key={p.id} value={p.id.toString()} className="py-3 cursor-pointer hover:bg-blue-50/50 rounded-lg mb-1">
                                                        <div className="flex items-center gap-4">
                                                            <div className="w-12 h-12 bg-white border border-gray-200 rounded-lg p-1 shrink-0 flex items-center justify-center shadow-sm">
                                                                <img src={p.imageUrls?.[0] || "https://placehold.co/100?text=No+Img"} alt="" className="w-full h-full object-contain" />
                                                            </div>
                                                            <div className="flex flex-col text-left">
                                                                <span className="font-bold text-gray-900 text-sm leading-tight max-w-[200px] truncate">{p.name}</span>
                                                                <span className="text-[10px] text-gray-500 font-bold tracking-widest uppercase mt-0.5">ID: #{p.id} | Base: {p.price} Lei</span>
                                                            </div>
                                                        </div>
                                                    </SelectItem>
                                                ))
                                            ) : (
                                                <div className="p-4 text-center text-sm text-gray-500 font-medium">No products found.</div>
                                            )}
                                        </div>
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="space-y-4 bg-gray-50 p-6 rounded-2xl border border-gray-100">
                                <label className="text-xs font-black text-gray-500 uppercase tracking-widest flex justify-between">
                                    <span>Discount Percentage</span>
                                    <span className="text-[#134c9c] text-base">{newDiscountPercentage}%</span>
                                </label>
                                
                                <div className="flex flex-col sm:flex-row items-center gap-4">
                                    <input 
                                        type="range" 
                                        min="1" 
                                        max="99" 
                                        value={newDiscountPercentage} 
                                        onChange={(e) => setNewDiscountPercentage(Number(e.target.value))}
                                        className="w-full h-2.5 bg-gray-200 rounded-full appearance-none cursor-pointer accent-[#134c9c]"
                                    />
                                    <div className="shrink-0 relative w-full sm:w-24 flex items-center justify-center mx-auto sm:mx-0 mt-4 sm:mt-0">
                                        <Input 
                                            type="number" 
                                            min="1" 
                                            max="99" 
                                            value={newDiscountPercentage} 
                                            onChange={(e) => setNewDiscountPercentage(Number(e.target.value))} 
                                            className="w-full h-12 bg-white border-gray-200 rounded-xl font-black text-xl text-center pr-6 shadow-sm focus-visible:ring-[#134c9c] [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none" 
                                        />
                                        <span className="absolute right-4 top-1/2 -translate-y-1/2 font-black text-gray-400">%</span>
                                    </div>
                                </div>
                            </div>
                            
                            {/* AFISARE CALCUL IN TIMP REAL */}
                            {selectedProductForModal && (
                                <div className="bg-red-50 border border-red-100 rounded-2xl p-4 flex items-center justify-between shadow-inner animate-in fade-in zoom-in-95 duration-300">
                                    <div className="flex flex-col">
                                        <span className="text-[10px] font-bold text-red-400 uppercase tracking-widest">New Price Preview</span>
                                        <span className="text-red-700 font-black text-2xl">
                                            {previewNewPrice?.toFixed(2)} <span className="text-sm">Lei</span>
                                        </span>
                                    </div>
                                    <div className="flex items-center gap-2 text-red-300 bg-white px-3 py-1.5 rounded-lg border border-red-50">
                                        <span className="line-through font-bold text-sm">{selectedProductForModal.price.toFixed(2)}</span>
                                        <ArrowRight size={14} />
                                        <span className="text-red-600 font-black text-sm">-{newDiscountPercentage}%</span>
                                    </div>
                                </div>
                            )}
                        </div>

                        <div className="flex gap-4">
                            <Button type="button" onClick={() => {
                                setIsAddDiscountModalOpen(false);
                                setModalProductSearch("");
                            }} variant="outline" className="flex-1 h-14 text-base font-bold rounded-2xl border-2">Cancel</Button>
                            <Button
                                onClick={handleAddDiscountSubmit}
                                disabled={!newDiscountProductId}
                                className="flex-1 h-14 text-base font-black rounded-2xl shadow-xl shadow-blue-900/20 bg-[#134c9c] hover:bg-[#0f3d7d] text-white disabled:opacity-50 hover:-translate-y-0.5 transition-all"
                            >
                                Apply Discount
                            </Button>
                        </div>
                    </div>
                </div>
            )}

            {/* MODAL PENTRU STERGEREA UNUI DISCOUNT */}
            {deleteDiscountModal !== null && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm px-4">
                    <div className="bg-white rounded-[2.5rem] p-8 max-w-md w-full shadow-2xl relative animate-in zoom-in-95">
                        <button onClick={() => setDeleteDiscountModal(null)} className="absolute top-5 right-5 text-gray-400 hover:text-gray-800 transition-colors bg-gray-100 hover:bg-gray-200 p-2 rounded-full">
                            <X size={20} strokeWidth={3} />
                        </button>

                        <div className="flex items-center gap-4 mb-6">
                            <div className="w-14 h-14 rounded-full flex items-center justify-center bg-red-50 text-red-600">
                                <AlertTriangle size={28} />
                            </div>
                            <h2 className="text-2xl font-black text-gray-900">Remove Discount?</h2>
                        </div>

                        <p className="text-gray-500 mb-8 text-lg leading-relaxed">
                            Are you sure you want to remove this discount? The product will return to its original base price immediately.
                        </p>

                        <div className="flex gap-4">
                            <Button onClick={() => setDeleteDiscountModal(null)} variant="outline" className="w-full h-14 text-lg font-bold rounded-2xl border-2">Cancel</Button>
                            <Button
                                onClick={() => handleDeleteDiscount(deleteDiscountModal)}
                                className="w-full h-14 text-lg font-bold rounded-2xl shadow-md bg-red-600 hover:bg-red-700 text-white hover:-translate-y-0.5 transition-all"
                            >
                                Yes, Remove
                            </Button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}