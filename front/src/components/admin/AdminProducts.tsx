import { useState, useEffect } from "react";
import axios from "axios";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Box, Search, Plus, Loader2, Save, X, Edit2, Trash2, SearchX } from "lucide-react";
import { Product } from "@/types";

interface AdminProductsProps {
    token: string | null;
    addAdminLog: (msg: string, type: any) => void;
    setToast: (toast: any) => void;
    displayFormattedStock: (q: number, u: string) => string;
    setIsAddModalOpen: (open: boolean) => void;
    setBatchModal: (modal: any) => void;
    setDeleteProductModal: (id: number) => void;
}

export default function AdminProducts({ token, addAdminLog, setToast, displayFormattedStock, setIsAddModalOpen, setBatchModal, setDeleteProductModal }: AdminProductsProps) {
    const [products, setProducts] = useState<Product[]>([]);
    const [isLoadingProducts, setIsLoadingProducts] = useState(true);
    const [productSearchTerm, setProductSearchTerm] = useState("");
    const [productsPage, setProductsPage] = useState(1);
    const [editingProductId, setEditingProductId] = useState<number | null>(null);
    const [editPriceValue, setEditPriceValue] = useState<string>("");
    const ITEMS_PER_PAGE = 10;

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
        // Asculta la un event custom de refresh ca sa reincarcam produsele dupa add
        window.addEventListener('refresh_products', fetchProductsList);
        return () => window.removeEventListener('refresh_products', fetchProductsList);
    }, []);

    const filteredProducts = products.filter(p => p.name.toLowerCase().includes(productSearchTerm.toLowerCase().trim()));
    const paginatedProducts = filteredProducts.slice((productsPage - 1) * ITEMS_PER_PAGE, productsPage * ITEMS_PER_PAGE);
    const totalPages = Math.ceil(filteredProducts.length / ITEMS_PER_PAGE) || 1;

    const handleSaveProductPrice = async (productId: number) => {
        if (!editPriceValue || isNaN(Number(editPriceValue))) return;
        const product = products.find(p => p.id === productId);
        if (!product) return;

        try {
            const apiUrl = import.meta.env.VITE_API_URL;
            await axios.put(`${apiUrl}/products/${productId}/price?newPrice=${editPriceValue}`, {}, { headers: { Authorization: `Bearer ${token}` } });
            addAdminLog(`Updated price for product "${product.name}" (ID: #${productId}) to ${editPriceValue} Lei.`, 'price');
            setEditingProductId(null);
            fetchProductsList();
            setToast({ show: true, message: "Product price updated successfully!", type: 'success' });
            setTimeout(() => setToast({ show: false, message: '', type: 'success' }), 4000);
        } catch (error) {
            setToast({ show: true, message: "Failed to update product price.", type: 'error' });
            setTimeout(() => setToast({ show: false, message: '', type: 'error' }), 4000);
        }
    };

    return (
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 max-w-7xl mx-auto">
            <div className="mb-6 flex flex-col md:flex-row md:items-end justify-between gap-4">
                <div>
                    <h1 className="text-3xl sm:text-4xl font-black text-gray-900 mb-2 flex items-center gap-3 tracking-tight">
                        <Box size={32} className="text-[#134c9c]" /> Manage Products
                    </h1>
                    <p className="text-gray-500 text-base">Edit prices, adjust stock or add products to the store.</p>
                </div>
                <div className="flex flex-col sm:flex-row items-center gap-3 w-full md:w-auto md:ml-auto">
                    <div className="relative w-full md:w-72">
                        <Input type="text" placeholder="Search by product name..." value={productSearchTerm} onChange={(e) => {setProductSearchTerm(e.target.value); setProductsPage(1);}} className="pl-10 h-12 bg-white rounded-xl border-gray-200 shadow-sm" />
                        <Search size={18} className="absolute left-3 top-3.5 text-gray-400" />
                    </div>
                    <Button onClick={() => setIsAddModalOpen(true)} className="w-full sm:w-auto h-12 px-6 bg-[#134c9c] hover:bg-[#0f3d7d] text-white font-black text-sm rounded-xl flex items-center gap-2 shadow-lg shadow-blue-900/20 shrink-0 transition-transform hover:-translate-y-0.5">
                        <Plus size={20} strokeWidth={3} /> Add Product
                    </Button>
                </div>
            </div>

            <Card className="border border-gray-100 shadow-sm rounded-[2.5rem] bg-white overflow-hidden">
                <CardContent className="p-0">
                    {isLoadingProducts ? (
                        <div className="flex justify-center p-16"><Loader2 className="animate-spin text-[#134c9c]" size={40} /></div>
                    ) : (
                        <>
                            <div className="overflow-x-auto w-full">
                                <table className="w-full text-left border-collapse min-w-[700px]">
                                    <thead>
                                        <tr className="bg-gray-50 text-gray-500 text-xs uppercase tracking-wider">
                                            <th className="p-5 font-bold w-16 pl-6">ID</th>
                                            <th className="p-5 font-bold">Product</th>
                                            <th className="p-5 font-bold">Category</th>
                                            <th className="p-5 font-bold">Stock</th>
                                            <th className="p-5 font-bold w-[160px]">Base Price</th>
                                            <th className="p-5 font-bold text-center pr-6">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-100">
                                        {paginatedProducts.map((prod) => (
                                            <tr key={prod.id} className={`transition-colors border-b border-gray-50 ${editingProductId === prod.id ? 'bg-blue-50/50' : 'hover:bg-blue-50/30'}`}>
                                                <td className="p-5 pl-6 font-black text-gray-900">#{prod.id}</td>
                                                <td className="p-5 flex items-center gap-4">
                                                    <div className="w-14 h-14 bg-white border border-gray-200 rounded-xl flex items-center justify-center p-1 shrink-0 shadow-sm">
                                                        <img src={prod.imageUrls?.[0] || "https://placehold.co/100?text=No+Img"} alt="" className="w-full h-full object-contain" />
                                                    </div>
                                                    <div>
                                                        <p className="font-bold text-gray-900 line-clamp-1">{prod.name}</p>
                                                        <p className="text-xs text-gray-500 font-bold uppercase tracking-widest mt-1">{prod.brandName}</p>
                                                    </div>
                                                </td>
                                                <td className="p-5 text-sm font-bold text-gray-600">{prod.categoryName}</td>
                                                <td className="p-5 text-sm font-medium text-gray-600 w-[200px]">
                                                    <div className="flex flex-col gap-2 items-start">
                                                        <span className="font-black text-gray-900 bg-gray-100 px-2.5 py-1 rounded-lg text-xs">{displayFormattedStock(prod.stockQuantity, prod.unitOfMeasure)}</span>
                                                        <button
                                                            onClick={() => setBatchModal({ show: true, productId: prod.id, productName: prod.name, currentStock: prod.stockQuantity })}
                                                            className="text-[10px] font-bold px-2.5 py-1.5 bg-blue-50 text-[#134c9c] rounded-lg hover:bg-[#134c9c] hover:text-white transition-colors uppercase tracking-widest flex items-center gap-1"
                                                        >
                                                            <Plus size={12} strokeWidth={3} /> New Batch
                                                        </button>
                                                    </div>
                                                </td>
                                                <td className="p-5 w-[160px]">
                                                    {editingProductId === prod.id ? (
                                                        <div className="flex items-center gap-2">
                                                            <Input type="number" value={editPriceValue} onChange={(e) => setEditPriceValue(e.target.value)} className="w-20 h-10 bg-white px-3 font-bold text-[#134c9c] rounded-xl shadow-sm" autoFocus />
                                                            <span className="text-xs font-bold text-gray-500 uppercase">Lei</span>
                                                        </div>
                                                    ) : (
                                                        <div className="flex flex-col">
                                                            <span className={`font-black text-lg ${prod.freshPrice < prod.price ? 'text-green-600' : 'text-gray-900'}`}>
                                                                {(prod.freshPrice || prod.price).toFixed(2)} <span className="text-xs font-bold text-gray-500 uppercase">Lei</span>
                                                            </span>
                                                            {prod.freshPrice < prod.price && (
                                                                <span className="text-[10px] text-gray-400 font-bold flex items-center gap-1 mt-1">
                                                                    <span className="line-through">{prod.price.toFixed(2)} Lei</span>
                                                                    <span className="bg-red-100 text-red-600 px-1.5 py-0.5 rounded uppercase tracking-widest text-[8px]">Promo</span>
                                                                </span>
                                                            )}
                                                        </div>
                                                    )}
                                                </td>
                                                <td className="p-5 pr-6">
                                                    {editingProductId === prod.id ? (
                                                        <div className="flex items-center justify-center gap-2">
                                                            <button onClick={() => handleSaveProductPrice(prod.id)} className="p-2.5 bg-green-100 text-green-600 rounded-xl hover:bg-green-600 hover:text-white transition-colors shadow-sm" title="Save new price"><Save size={18} /></button>
                                                            <button onClick={() => setEditingProductId(null)} className="p-2.5 bg-red-100 text-red-600 rounded-xl hover:bg-red-600 hover:text-white transition-colors shadow-sm" title="Cancel edit"><X size={18} /></button>
                                                        </div>
                                                    ) : (
                                                        <div className="flex items-center justify-center gap-3">
                                                            <button onClick={() => { setEditingProductId(prod.id); setEditPriceValue(prod.price.toString()); }} className="p-2 bg-gray-100 text-[#134c9c] hover:bg-[#134c9c] hover:text-white rounded-xl transition-colors shadow-sm" title="Edit Product"><Edit2 size={16} /></button>
                                                            <button onClick={() => setDeleteProductModal(prod.id)} className="p-2 bg-red-50 text-red-500 hover:bg-red-600 hover:text-white rounded-xl transition-colors shadow-sm" title="Remove Product"><Trash2 size={16} /></button>
                                                        </div>
                                                    )}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                                {filteredProducts.length === 0 && (
                                    <div className="text-center p-12 text-gray-500 flex flex-col items-center">
                                        <SearchX size={48} className="text-gray-300 mb-4" />
                                        <p className="font-bold text-lg text-gray-900 mb-1">No products found</p>
                                    </div>
                                )}
                            </div>
                            {totalPages > 1 && (
                                <div className="flex flex-col sm:flex-row items-center justify-between gap-4 px-6 py-4 bg-gray-50 border-t border-gray-100 rounded-b-[2rem]">
                                    <span className="text-xs font-bold text-gray-500 uppercase tracking-widest text-center sm:text-left">
                                        Showing {(productsPage - 1) * ITEMS_PER_PAGE + 1} - {Math.min(productsPage * ITEMS_PER_PAGE, filteredProducts.length)} of {filteredProducts.length}
                                    </span>
                                    <div className="flex gap-2">
                                        <Button variant="outline" size="sm" disabled={productsPage === 1} onClick={() => setProductsPage(p => p - 1)} className="h-9 rounded-xl font-bold border-gray-200">Previous</Button>
                                        <Button variant="outline" size="sm" disabled={productsPage === totalPages} onClick={() => setProductsPage(p => p + 1)} className="h-9 rounded-xl font-bold border-gray-200">Next</Button>
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