import { useState, useEffect } from "react";
import axios from "axios";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Clock, Search, Loader2, Trash2, CheckCircle2 } from "lucide-react";
import { Product } from "@/types";

interface AdminClearanceProps {
    displayFormattedStock: (q: number, u: string) => string;
    setDropClearanceModal: (id: number) => void;
}

export default function AdminClearance({ displayFormattedStock, setDropClearanceModal }: AdminClearanceProps) {
    const [products, setProducts] = useState<Product[]>([]);
    const [isLoadingProducts, setIsLoadingProducts] = useState(true);
    const [clearanceSearchTerm, setClearanceSearchTerm] = useState("");
    const [clearancePage, setClearancePage] = useState(1);
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
        window.addEventListener('refresh_products', fetchProductsList);
        return () => window.removeEventListener('refresh_products', fetchProductsList);
    }, []);

    const expiringProductsList = products.filter(p => (p.nearExpiryQuantity || 0) > 0);
    const filteredExpiringProducts = expiringProductsList.filter(p => p.name.toLowerCase().includes(clearanceSearchTerm.toLowerCase().trim()));
    const paginatedClearance = filteredExpiringProducts.slice((clearancePage - 1) * ITEMS_PER_PAGE, clearancePage * ITEMS_PER_PAGE);
    const totalPages = Math.ceil(filteredExpiringProducts.length / ITEMS_PER_PAGE) || 1;

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
                        <Clock size={32} /> Clearance Management
                    </h1>
                    <p className="text-gray-500 text-base">Monitor and manage products that are approaching their expiration date.</p>
                </div>
                <div className="relative w-full md:w-80 shrink-0">
                    <Input type="text" placeholder="Search by product name..." value={clearanceSearchTerm} onChange={(e) => {setClearanceSearchTerm(e.target.value); setClearancePage(1);}} className="pl-10 h-12 bg-white rounded-xl border-orange-200 shadow-sm focus-visible:ring-orange-500" />
                    <Search size={18} className="absolute left-3 top-3.5 text-gray-400" />
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
                                            <th className="p-5 font-bold pl-6">Product</th>
                                            <th className="p-5 font-bold text-center">Expiring Quantity</th>
                                            <th className="p-5 font-bold">Clearance Price</th>
                                            <th className="p-5 font-bold text-center pr-6">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-orange-50">
                                        {paginatedClearance.map((prod) => (
                                            <tr key={prod.id} className="hover:bg-orange-50/40 transition-colors">
                                                <td className="p-5 pl-6 flex items-center gap-4">
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
        </div>
    );
}