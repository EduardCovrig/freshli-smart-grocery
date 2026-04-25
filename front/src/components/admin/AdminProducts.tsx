import { useState, useEffect } from "react";
import axios from "axios";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Box, Search, Plus, Loader2, Save, X, Edit2, Trash2, SearchX, AlertTriangle, PackageOpen, ChevronUp, ChevronDown, CheckCircle2 } from "lucide-react";
import { Product } from "@/types";

interface Brand { id: number; name: string; }
interface Category { id: number; name: string; }

interface AdminProductsProps {
    token: string | null;
    addAdminLog: (msg: string, type: any) => void;
    setToast: (toast: any) => void;
    displayFormattedStock: (q: number, u: string) => string;
}

export default function AdminProducts({ token, addAdminLog, setToast, displayFormattedStock }: AdminProductsProps) {
    const [products, setProducts] = useState<Product[]>([]);
    const [isLoadingProducts, setIsLoadingProducts] = useState(true);
    const [productSearchTerm, setProductSearchTerm] = useState("");
    const [productsPage, setProductsPage] = useState(1);
    const ITEMS_PER_PAGE = 10;

    const [showOnlyOutOfStock, setShowOnlyOutOfStock] = useState(false);

    const [editingProductId, setEditingProductId] = useState<number | null>(null);
    const [editPriceValue, setEditPriceValue] = useState<string>("");

    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [deleteProductModal, setDeleteProductModal] = useState<number | null>(null);
    const [batchModal, setBatchModal] = useState<{ show: boolean; productId: number; productName: string; currentStock: number; } | null>(null);

    const [brands, setBrands] = useState<Brand[]>([]);
    const [categories, setCategories] = useState<Category[]>([]);
    const [showAttributes, setShowAttributes] = useState(false); 
    const [uploadFile, setUploadFile] = useState<File | null>(null);
    const [newBatchQuantity, setNewBatchQuantity] = useState<string>("");
    const [newBatchExpDate, setNewBatchExpDate] = useState<string>("");
    const [isSavingBatch, setIsSavingBatch] = useState(false);

    const [newProduct, setNewProduct] = useState({
        name: "", description: "", price: "", stockQuantity: "", unitOfMeasure: "", expirationDate: "",
        brandId: 0, categoryId: 0, imageUrls: [""], calories: "", proteins: "", carbs: "", fats: ""
    });

    const fetchProductsList = async () => {
        setIsLoadingProducts(true);
        try {
            const apiUrl = import.meta.env.VITE_API_URL;
            const res = await axios.get(`${apiUrl}/products`);
            const sortedProducts = res.data.sort((a: Product, b: Product) => a.id - b.id);
            setProducts(sortedProducts);
        } catch (err) {
        } finally {
            setIsLoadingProducts(false);
        }
    };

    useEffect(() => {
        fetchProductsList();
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
            }
        };
        fetchBrandsAndCategories();

        window.addEventListener('refresh_products', fetchProductsList);
        return () => window.removeEventListener('refresh_products', fetchProductsList);
    }, []);

    const filteredProducts = products.filter(p => 
    {
        if (showOnlyOutOfStock && p.stockQuantity > 0) {
            return false;
        }
        return p.name.toLowerCase().includes(productSearchTerm.toLowerCase().trim()) ||
        p.id.toString().includes(productSearchTerm.trim())
    }
    );
    const paginatedProducts = filteredProducts.slice((productsPage - 1) * ITEMS_PER_PAGE, productsPage * ITEMS_PER_PAGE);
    const totalPages = Math.ceil(filteredProducts.length / ITEMS_PER_PAGE) || 1;

    const handleAddProduct = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const apiUrl = import.meta.env.VITE_API_URL;
            let finalImageUrl = newProduct.imageUrls[0]; 

            if (uploadFile) {
                const formData = new FormData();
                formData.append("file", uploadFile);
                formData.append("brandId", newProduct.brandId.toString());
                formData.append("productName", newProduct.name);

                const uploadRes = await axios.post(`${apiUrl}/products/upload-image`, formData, {
                    headers: { Authorization: `Bearer ${token}`, "Content-Type": "multipart/form-data" }
                });
                finalImageUrl = uploadRes.data;
            }

            const attributes: Record<string, string> = {};
            if (newProduct.calories) attributes["Calories"] = `${newProduct.calories} kcal`;
            if (newProduct.proteins) attributes["Proteins"] = `${newProduct.proteins} g`;
            if (newProduct.carbs) attributes["Carbs"] = `${newProduct.carbs} g`;
            if (newProduct.fats) attributes["Fats"] = `${newProduct.fats} g`;

            const validImageUrls = finalImageUrl && finalImageUrl.trim() !== "" ? [finalImageUrl] : []; 

            const payload: any = {
                name: newProduct.name, description: newProduct.description, price: Number(newProduct.price) || 0,
                stockQuantity: Number(newProduct.stockQuantity) || 0, unitOfMeasure: newProduct.unitOfMeasure,
                brandId: Number(newProduct.brandId), categoryId: Number(newProduct.categoryId),
                imageUrls: validImageUrls, attributes: attributes     
            };
            if (newProduct.expirationDate && newProduct.expirationDate.trim() !== "") {
                payload.expirationDate = newProduct.expirationDate;
            }

            await axios.post(`${apiUrl}/products`, payload, { headers: { Authorization: `Bearer ${token}` } });

            addAdminLog(`New product "${newProduct.name}" was added to the store.`, 'add'); 
            setIsAddModalOpen(false);
            setNewProduct({ name: "", description: "", price: "", stockQuantity: "", unitOfMeasure: "buc", expirationDate: "", brandId: 0, categoryId: 0, imageUrls: [""], calories: "", proteins: "", carbs: "", fats: "" });
            setUploadFile(null); 
            fetchProductsList();
            setToast({ show: true, message: "New product added successfully!", type: 'success' });
            setTimeout(() => setToast({ show: false, message: '', type: 'success' }), 4000);
        } catch (error: any) {
            let backendMessage = "Failed to add product. Check console.";
            if (error.response?.data) {
                if (typeof error.response.data === 'string') backendMessage = error.response.data;
                else if (error.response.data.message) backendMessage = error.response.data.message;
            }
            setToast({ show: true, message: `Java Error: ${backendMessage}`, type: 'error' });
            setTimeout(() => setToast({ show: false, message: '', type: 'error' }), 6000);
        }
    };

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

    const handleDeleteProduct = async (productId: number) => {
        try {
            const apiUrl = import.meta.env.VITE_API_URL;
            const product = products.find(p => p.id === productId);
            await axios.delete(`${apiUrl}/products/${productId}`, { headers: { Authorization: `Bearer ${token}` } });
            setProducts(products.filter(p => p.id !== productId));

            if (product) { 
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

    const handleSaveNewBatch = async () => {
        if (!batchModal || !newBatchQuantity || isNaN(Number(newBatchQuantity)) || Number(newBatchQuantity) <= 0 || !newBatchExpDate) {
            setToast({ show: true, message: "Please enter valid quantity and expiration date.", type: 'error' });
            setTimeout(() => setToast({ show: false, message: '', type: 'error' }), 4000);
            return;
        }

        setIsSavingBatch(true);
        try {
            const apiUrl = import.meta.env.VITE_API_URL;
            await axios.put(`${apiUrl}/products/${batchModal.productId}/batch?quantity=${newBatchQuantity}&expirationDate=${newBatchExpDate}`, {}, { headers: { Authorization: `Bearer ${token}` } });
            addAdminLog(`Added new batch of ${newBatchQuantity} units for product "${batchModal.productName}" (ID: #${batchModal.productId}).`, 'add');
            await fetchProductsList();
            setBatchModal(null);
            setNewBatchQuantity("");
            setNewBatchExpDate("");
            setToast({ show: true, message: "New batch added successfully!", type: 'success' });
            setTimeout(() => setToast({ show: false, message: '', type: 'success' }), 4000);
        } catch (error) {
            setToast({ show: true, message: "Failed to add new batch.", type: 'error' });
            setTimeout(() => setToast({ show: false, message: '', type: 'error' }), 4000);
        } finally {
            setIsSavingBatch(false);
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
                    
                    {/* Butonul Out of Stock */}
                    <button
                        onClick={() => {
                            setShowOnlyOutOfStock(!showOnlyOutOfStock);
                            setProductsPage(1); // Resetam pagina la schimbarea filtrului
                        }}
                        className={`h-12 px-4 rounded-xl font-bold text-xs sm:text-sm transition-all flex items-center gap-2 shrink-0 border ${showOnlyOutOfStock ? 'bg-red-50 text-red-600 border-red-200 shadow-sm' : 'bg-white text-gray-500 border-gray-200 hover:bg-gray-50'}`}
                    >
                        <div className={`w-4 h-4 rounded flex items-center justify-center border transition-colors ${showOnlyOutOfStock ? 'bg-red-500 border-red-600 text-white' : 'bg-gray-100 border-gray-300'}`}>
                            {showOnlyOutOfStock && <CheckCircle2 size={12} strokeWidth={4} />}
                        </div>
                        Out of Stock
                    </button>

                    <div className="relative w-full md:w-72">
                        <Input type="text" placeholder="Search by name or ID..." value={productSearchTerm} onChange={(e) => {setProductSearchTerm(e.target.value); setProductsPage(1);}} className="pl-10 h-12 bg-white rounded-xl border-gray-200 shadow-sm focus-visible:ring-[#134c9c]" />
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

            {/* MODAL PENTRU ADAUGARE PRODUS NOU */}
            {isAddModalOpen && (
                <div className="fixed inset-0 z-[120] flex items-start sm:items-center justify-center bg-black/60 backdrop-blur-sm px-4 pt-20 sm:pt-24 pb-6 overflow-y-auto">
                    <div className="bg-white rounded-[2rem] p-6 sm:p-8 max-w-2xl w-full shadow-2xl relative animate-in zoom-in-95 border border-gray-100 my-auto mt-0 sm:mt-auto">
                        <button onClick={() => setIsAddModalOpen(false)} className="absolute top-4 right-4 sm:top-6 sm:right-6 text-gray-400 hover:text-gray-800 transition-colors bg-gray-50 hover:bg-gray-100 p-2 rounded-full">
                            <X size={20} strokeWidth={3} />
                        </button>

                        <div className="flex items-center gap-3 sm:gap-4 mb-4 sm:mb-6 border-b border-gray-100 pb-4">
                            <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full flex items-center justify-center bg-blue-50 text-[#134c9c]">
                                <Box size={24} />
                            </div>
                            <div>
                                <h2 className="text-xl sm:text-2xl font-black text-gray-900 tracking-tight">Add New Product</h2>
                                <p className="text-xs sm:text-sm text-gray-500 font-medium">List a new item in your store's catalog.</p>
                            </div>
                        </div>

                        <form onSubmit={handleAddProduct} className="space-y-4">
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div className="space-y-1.5">
                                    <label className="text-[10px] sm:text-xs font-black uppercase tracking-widest text-gray-500 ml-1">Product Name</label>
                                    <Input required value={newProduct.name} onChange={(e) => setNewProduct({ ...newProduct, name: e.target.value })} placeholder="ex. Organic Milk" className="h-10 sm:h-12 border-gray-200 rounded-xl bg-gray-50/50" />
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-[10px] sm:text-xs font-black uppercase tracking-widest text-gray-500 ml-1">Price (Lei)</label>
                                    <Input required type="number" step="0.01" value={newProduct.price} onChange={(e) => setNewProduct({ ...newProduct, price: e.target.value })} placeholder="0.00" className="h-10 sm:h-12 border-gray-200 rounded-xl bg-gray-50/50" />
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-[10px] sm:text-xs font-black uppercase tracking-widest text-gray-500 ml-1">Initial Stock</label>
                                    <Input required type="number" value={newProduct.stockQuantity} onChange={(e) => setNewProduct({ ...newProduct, stockQuantity: e.target.value })} placeholder="100" className="h-10 sm:h-12 border-gray-200 rounded-xl bg-gray-50/50" />
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-[10px] sm:text-xs font-black uppercase tracking-widest text-gray-500 ml-1">Unit (kg, buc, L)</label>
                                    <Input required value={newProduct.unitOfMeasure} onChange={(e) => setNewProduct({ ...newProduct, unitOfMeasure: e.target.value })} placeholder="buc" className="h-10 sm:h-12 border-gray-200 rounded-xl bg-gray-50/50" />
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-[10px] sm:text-xs font-black uppercase tracking-widest text-gray-500 ml-1">Expiration Date</label>
                                    <Input type="date" value={newProduct.expirationDate} onChange={(e) => setNewProduct({ ...newProduct, expirationDate: e.target.value })} className="h-10 sm:h-12 border-gray-200 rounded-xl bg-gray-50/50" />
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-[10px] sm:text-xs font-black uppercase tracking-widest text-gray-500 ml-1">Upload Image (JPG/PNG)</label>
                                    <Input
                                        type="file"
                                        accept="image/png, image/jpeg"
                                        onChange={(e) => setUploadFile(e.target.files?.[0] || null)}
                                        className="h-10 sm:h-12 border-gray-200 bg-gray-50/50 rounded-xl cursor-pointer 
                                            file:mr-2 sm:file:mr-4 file:py-1 sm:file:py-1.5 file:px-3 sm:file:px-4 file:rounded-lg file:border-0 
                                            file:text-[10px] sm:file:text-xs file:font-black file:bg-[#134c9c] file:text-white 
                                            hover:file:bg-[#0f3d7d] transition-all pt-1.5 sm:pt-2"
                                    />
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-[10px] sm:text-xs font-black uppercase tracking-widest text-gray-500 ml-1">Brand</label>
                                    <Select value={newProduct.brandId ? newProduct.brandId.toString() : ""} onValueChange={(val) => setNewProduct({ ...newProduct, brandId: parseInt(val) })}>
                                        <SelectTrigger className="h-10 sm:h-12 border-gray-200 rounded-xl bg-gray-50/50">
                                            <SelectValue placeholder="Select Brand" />
                                        </SelectTrigger>
                                        <SelectContent className="z-[130] rounded-xl">
                                            {brands.map(b => (
                                                <SelectItem key={b.id} value={b.id.toString()}>{b.name}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-[10px] sm:text-xs font-black uppercase tracking-widest text-gray-500 ml-1">Category</label>
                                    <Select value={newProduct.categoryId ? newProduct.categoryId.toString() : ""} onValueChange={(val) => setNewProduct({ ...newProduct, categoryId: parseInt(val) })}>
                                        <SelectTrigger className="h-10 sm:h-12 border-gray-200 rounded-xl bg-gray-50/50">
                                            <SelectValue placeholder="Select Category" />
                                        </SelectTrigger>
                                        <SelectContent className="z-[130] rounded-xl">
                                            {categories.map(c => (
                                                <SelectItem key={c.id} value={c.id.toString()}>{c.name}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>

                            <div className="space-y-1.5">
                                <label className="text-[10px] sm:text-xs font-black uppercase tracking-widest text-gray-500 ml-1">Description</label>
                                <textarea
                                    className="w-full min-h-16 sm:min-h-20 p-3 sm:p-4 rounded-2xl border border-gray-200 bg-gray-50/50 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-[#134c9c] transition-all text-xs sm:text-sm font-medium resize-none"
                                    value={newProduct.description}
                                    onChange={(e) => setNewProduct({ ...newProduct, description: e.target.value })}
                                    placeholder="Write an appealing description..."
                                />
                            </div>

                            <div className="pt-2 border-t border-gray-100">
                                <button
                                    type="button"
                                    onClick={() => setShowAttributes(!showAttributes)}
                                    className="flex items-center justify-between w-full text-xs sm:text-sm font-black text-[#134c9c] hover:text-[#0f3d7d] transition-colors bg-blue-50/50 hover:bg-blue-100/50 px-4 sm:px-5 py-2.5 sm:py-3.5 rounded-2xl border border-blue-100"
                                >
                                    <span>{showAttributes ? "Hide Nutritional Information" : "Add Nutritional Info (Optional)"}</span>
                                    {showAttributes ? <ChevronUp size={18} className="sm:w-5 sm:h-5" /> : <ChevronDown size={18} className="sm:w-5 sm:h-5" />}
                                </button>

                                {showAttributes && (
                                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4 mt-3 sm:mt-4 p-4 sm:p-5 bg-gray-50/80 rounded-2xl border border-gray-200 animate-in slide-in-from-top-2 fade-in">
                                        <div className="space-y-1.5">
                                            <label className="text-[9px] sm:text-[10px] font-black uppercase tracking-widest text-gray-500 ml-1">Calories (kcal)</label>
                                            <Input type="number" value={newProduct.calories} onChange={(e) => setNewProduct({ ...newProduct, calories: e.target.value })} placeholder="ex. 250" className="h-10 sm:h-12 bg-white rounded-xl" />
                                        </div>
                                        <div className="space-y-1.5">
                                            <label className="text-[9px] sm:text-[10px] font-black uppercase tracking-widest text-gray-500 ml-1">Proteins (g)</label>
                                            <Input type="number" value={newProduct.proteins} onChange={(e) => setNewProduct({ ...newProduct, proteins: e.target.value })} placeholder="ex. 15" className="h-10 sm:h-12 bg-white rounded-xl" />
                                        </div>
                                        <div className="space-y-1.5">
                                            <label className="text-[9px] sm:text-[10px] font-black uppercase tracking-widest text-gray-500 ml-1">Carbs (g)</label>
                                            <Input type="number" value={newProduct.carbs} onChange={(e) => setNewProduct({ ...newProduct, carbs: e.target.value })} placeholder="ex. 30" className="h-10 sm:h-12 bg-white rounded-xl" />
                                        </div>
                                        <div className="space-y-1.5">
                                            <label className="text-[9px] sm:text-[10px] font-black uppercase tracking-widest text-gray-500 ml-1">Fats (g)</label>
                                            <Input type="number" value={newProduct.fats} onChange={(e) => setNewProduct({ ...newProduct, fats: e.target.value })} placeholder="ex. 10" className="h-10 sm:h-12 bg-white rounded-xl" />
                                        </div>
                                    </div>
                                )}
                            </div>

                            <div className="flex gap-3 sm:gap-4 pt-4 sm:pt-6 border-t border-gray-100">
                                <Button type="button" onClick={() => setIsAddModalOpen(false)} variant="outline" className="w-full h-12 sm:h-14 text-sm sm:text-base font-bold rounded-2xl border-2">Cancel</Button>
                                <Button
                                    type="submit"
                                    disabled={newProduct.brandId === 0 || newProduct.categoryId === 0}
                                    className="w-full h-12 sm:h-14 text-sm sm:text-base font-black rounded-2xl shadow-xl shadow-blue-900/20 bg-[#134c9c] hover:bg-[#0f3d7d] text-white disabled:opacity-50 transition-all hover:-translate-y-0.5"
                                >
                                    Create Product
                                </Button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/*MODAL PENTRU ADAUGARE LOT NOU*/}
            {batchModal && batchModal.show && (
                <div className="fixed inset-0 z-[120] flex items-center justify-center bg-black/60 backdrop-blur-sm px-4 py-10">
                    <div className="bg-white rounded-[2.5rem] p-8 sm:p-10 max-w-md w-full shadow-2xl relative animate-in zoom-in-95">
                        <button onClick={() => setBatchModal(null)} className="absolute top-6 right-6 text-gray-400 hover:text-gray-800 transition-colors bg-gray-50 hover:bg-gray-100 p-2 rounded-full">
                            <X size={20} strokeWidth={3} />
                        </button>

                        <div className="flex items-center gap-4 mb-8">
                            <div className="w-14 h-14 rounded-full flex items-center justify-center bg-blue-50 text-[#134c9c] shrink-0">
                                <PackageOpen size={28} />
                            </div>
                            <h2 className="text-2xl font-black text-gray-900 tracking-tight">Add New Batch</h2>
                        </div>

                        {batchModal.currentStock > 0 ? (
                            <div className="bg-blue-50 border border-blue-200 text-blue-800 p-5 rounded-2xl mb-8 flex gap-4 text-sm leading-relaxed">
                                <Box size={24} className="shrink-0 text-[#134c9c] mt-0.5" strokeWidth={2.5} />
                                <div>
                                    <p className="font-black text-lg mb-1 tracking-tight">Inventory Notice</p>
                                    <p className="font-medium">You are adding a new batch of <strong>{newBatchQuantity || '0'}</strong> units. 
                                    The system will automatically track expiration dates and sell older items first. Current stock: <strong>{batchModal.currentStock}</strong> units.</p>
                                </div>
                            </div>
                        ) : (
                            <p className="text-gray-500 mb-8 text-base leading-relaxed">
                                The current stock for <strong className="text-gray-900">{batchModal.productName}</strong> is empty. Please add the new quantity and its expiration date.
                            </p>
                        )}

                        <div className="space-y-6 mb-10">
                            <div className="space-y-2.5">
                                <label className="text-xs font-black text-gray-500 uppercase tracking-widest ml-1">New Quantity Received</label>
                                <Input
                                    type="number"
                                    min="1"
                                    value={newBatchQuantity}
                                    onChange={(e) => setNewBatchQuantity(e.target.value)}
                                    placeholder="ex. 50"
                                    className="h-14 border-gray-200 bg-gray-50 rounded-xl text-lg font-black focus-visible:ring-[#134c9c]"
                                />
                            </div>
                            <div className="space-y-2.5">
                                <label className="text-xs font-black text-gray-500 uppercase tracking-widest ml-1">New Expiration Date</label>
                                <Input
                                    type="date"
                                    value={newBatchExpDate}
                                    onChange={(e) => setNewBatchExpDate(e.target.value)}
                                    className="h-14 border-gray-200 bg-gray-50 rounded-xl text-lg font-black focus-visible:ring-[#134c9c]"
                                />
                            </div>
                        </div>

                        <div className="flex gap-4">
                            <Button type="button" onClick={() => setBatchModal(null)} variant="outline" className="flex-1 h-14 text-base font-bold rounded-2xl border-2">Cancel</Button>
                            <Button
                                onClick={handleSaveNewBatch}
                                disabled={!newBatchQuantity || !newBatchExpDate || isSavingBatch}
                                className="flex-1 h-14 text-base font-black rounded-2xl shadow-xl shadow-blue-900/20 bg-[#134c9c] hover:bg-[#0f3d7d] text-white disabled:opacity-50 hover:-translate-y-0.5 transition-all"
                            >
                                {isSavingBatch ? <Loader2 className="animate-spin" size={20} /> : "Save Batch"}
                            </Button>
                        </div>
                    </div>
                </div>
            )}

            {/* MODAL PENTRU STERGEREA COMPLETA A UNUI PRODUS */}
            {deleteProductModal !== null && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm px-4">
                    <div className="bg-white rounded-[2.5rem] p-8 max-w-md w-full shadow-2xl relative animate-in zoom-in-95">
                        <button onClick={() => setDeleteProductModal(null)} className="absolute top-5 right-5 text-gray-400 hover:text-gray-800 transition-colors bg-gray-100 hover:bg-gray-200 p-2 rounded-full">
                            <X size={20} strokeWidth={3} />
                        </button>

                        <div className="flex items-center gap-4 mb-6">
                            <div className="w-14 h-14 rounded-full flex items-center justify-center bg-red-50 text-red-600">
                                <AlertTriangle size={28} />
                            </div>
                            <h2 className="text-2xl font-black text-gray-900">Remove Product?</h2>
                        </div>

                        <p className="text-gray-500 mb-8 text-lg leading-relaxed">
                            Are you sure you want to completely remove this product from the store? This action cannot be undone and will delete all associated data.
                        </p>

                        <div className="flex gap-4">
                            <Button onClick={() => setDeleteProductModal(null)} variant="outline" className="w-full h-14 text-lg font-bold rounded-2xl border-2">Cancel</Button>
                            <Button
                                onClick={() => handleDeleteProduct(deleteProductModal)}
                                className="w-full h-14 text-lg font-bold rounded-2xl shadow-md bg-red-600 hover:bg-red-700 text-white hover:-translate-y-0.5 transition-all"
                            >
                                Yes, Delete
                            </Button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}