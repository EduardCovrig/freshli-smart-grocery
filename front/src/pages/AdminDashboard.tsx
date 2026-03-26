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
    ChevronUp,
    Tag,
    XCircle,
    Download,
    Wallet,
    ArrowDownLeft,
    SearchX
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Product } from "@/types";
import { generateInvoicePDF } from "@/lib/pdfGenerator";

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
interface Discount {
    id: number;
    percentage: number;
    productId: number;
    productName: string;
    productImage?: string;
    basePrice: number;
    reducedPrice: number;
}

export default function AdminDashboard() {

    const { token, user } = useAuth();

    const [activeTab, setActiveTab] = useState<'dashboard' | 'products' | 'expiring' | 'ordersList' | 'revenue' | 'notifications' | 'churn' | 'discounts'>('dashboard');

    const [stats, setStats] = useState({ totalOrders: 0, totalRevenue: 0, expiringProducts: 0 });
    const [isLoadingStats, setIsLoadingStats] = useState(true);
    const [timeRange, setTimeRange] = useState<'week' | 'month' | 'year'>('week');

    const [products, setProducts] = useState<Product[]>([]);
    const [isLoadingProducts, setIsLoadingProducts] = useState(false);

    const [editingProductId, setEditingProductId] = useState<number | null>(null);
    const [editPriceValue, setEditPriceValue] = useState<string>("");

    const [discounts, setDiscounts] = useState<Discount[]>([]);
    const [isLoadingDiscounts, setIsLoadingDiscounts] = useState(false);
    const [discountSearchTerm, setDiscountSearchTerm] = useState("");
    const [editingDiscountId, setEditingDiscountId] = useState<number | null>(null);
    const [editDiscountPercentage, setEditDiscountPercentage] = useState<number>(0);

    // Stari pentru adaugare Discount
    const [isAddDiscountModalOpen, setIsAddDiscountModalOpen] = useState(false);
    const [newDiscountProductId, setNewDiscountProductId] = useState<string>("");
    const [newDiscountPercentage, setNewDiscountPercentage] = useState<number>(10);

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
            
            fetchDiscounts();
            fetchProductsList(); // Refresh si la produse ca sa se vada pretul nou taiat
            
            setToast({ show: true, message: "Discount added successfully!", type: 'success' });
        } catch (error) {
            setToast({ show: true, message: "Failed to add discount.", type: 'error' });
        } finally {
            setTimeout(() => setToast({ show: false, message: '', type: 'success' }), 4000);
        }
    };

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

    // State pentru Modalul de Detalii Comanda
    const [selectedOrderDetails, setSelectedOrderDetails] = useState<OrderDetails | null>(null);

    //stari sistem de adaugare lot nou (batch) la editare produs
    const [batchModal, setBatchModal] = useState<{
        show: boolean;
        productId: number;
        productName: string;
        currentStock: number;
    } | null>(null);
    const [newBatchQuantity, setNewBatchQuantity] = useState<string>("");
    const [newBatchExpDate, setNewBatchExpDate] = useState<string>("");
    const [isSavingBatch, setIsSavingBatch] = useState(false);

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
    // state-uri pentru paginare
    const ITEMS_PER_PAGE = 10;
    const [revenuePage, setRevenuePage] = useState(1);
    const [ordersPage, setOrdersPage] = useState(1);
    const [productsPage, setProductsPage] = useState(1);
    const [discountsPage, setDiscountsPage] = useState(1);
    const [clearancePage, setClearancePage] = useState(1);
    const [churnPage, setChurnPage] = useState(1);

    // Resetam la prima pagina cand se fac cautari
    useEffect(() => setOrdersPage(1), [orderSearchTerm]);
    useEffect(() => setProductsPage(1), [productSearchTerm]);
    useEffect(() => setDiscountsPage(1), [discountSearchTerm]);
    useEffect(() => setClearancePage(1), [clearanceSearchTerm]);
    useEffect(() => setRevenuePage(1), [revenueFilter]);

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
    const [adminLogs, setAdminLogs] = useState<{ id: number, message: string, date: string, type: 'status' | 'price' | 'delete' | 'clearance' | 'add' | 'promo' }[]>(() => {
        const saved = localStorage.getItem("adminActionLogs");
        return saved ? JSON.parse(saved) : [];
    });

    const addAdminLog = (message: string, type: 'status' | 'price' | 'delete' | 'clearance' | 'add' | 'promo') => {
        const newLog = { id: Date.now(), message, date: new Date().toISOString(), type };
        const updatedLogs = [newLog, ...adminLogs];
        setAdminLogs(updatedLogs);
        localStorage.setItem("adminActionLogs", JSON.stringify(updatedLogs));
    };

    // Starea pentru modalul "Trimite din nou?"
    const [promoModal, setPromoModal] = useState<{ show: boolean, clientId: number, clientName: string } | null>(null);

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

    const handleSendPromo = async (clientId: number, clientName: string) => {
        setSendingToId(clientId);
        try {
            const apiUrl = import.meta.env.VITE_API_URL;
            const message = `We miss you! Use code COMEBACK20-U${clientId} at checkout for a 20% discount on your next order!`;

            await axios.post(`${apiUrl}/notifications/send`,
                { userId: clientId, message: message },
                { headers: { Authorization: `Bearer ${token}` } }
            );

            addAdminLog(`Sent 20% comeback promo code to ${clientName} (ID: #${clientId}).`, 'promo');

           // Adaugam userul in lista celor care au primit. Salvam in state si in localStorage
            const updatedSent = [...sentPromos, clientId];
            setSentPromos(updatedSent);
            localStorage.setItem("sentAdminPromos", JSON.stringify(updatedSent));

            // ADAUGAT PENTRU NOTIFICARE CLIENT PROMO CODE 
            const targetClient = churnClients.find(c => c.userId === clientId);
            const storageKey = targetClient?.email ? `userNotifs_${targetClient.email}` : 'userNotifs';

            const promoNotif = {
                id: Date.now(),
                orderId: 0,
                message: message,
                date: new Date().toISOString(),
                read: false
            };
            const existingPromoNotifs = JSON.parse(localStorage.getItem(storageKey) || '[]');
            localStorage.setItem(storageKey, JSON.stringify([promoNotif, ...existingPromoNotifs]));
            window.dispatchEvent(new Event('new_notification'));
            // ---------------------------------------------------

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

    const renderPagination = (currentPage: number, totalItems: number, setPage: React.Dispatch<React.SetStateAction<number>>) => {
        const totalPages = Math.ceil(totalItems / ITEMS_PER_PAGE) || 1;
        if (totalPages <= 1) return null;
        
        return (
            <div className="flex items-center justify-between px-6 py-4 bg-gray-50 border-t border-gray-100 rounded-b-[2rem]">
                <span className="text-xs font-bold text-gray-500 uppercase tracking-widest">
                    Showing {(currentPage - 1) * ITEMS_PER_PAGE + 1} - {Math.min(currentPage * ITEMS_PER_PAGE, totalItems)} of {totalItems}
                </span>
                <div className="flex gap-2">
                    <Button variant="outline" size="sm" disabled={currentPage === 1} onClick={() => setPage(p => p - 1)} className="h-8 rounded-lg font-bold border-gray-200">
                        Previous
                    </Button>
                    <Button variant="outline" size="sm" disabled={currentPage === totalPages} onClick={() => setPage(p => p + 1)} className="h-8 rounded-lg font-bold border-gray-200">
                        Next
                    </Button>
                </div>
            </div>
        );
    };

    const [dismissedAlerts, setDismissedAlerts] = useState<string[]>(() => {
        const saved = localStorage.getItem("dismissedSystemAlerts");
        if (saved) return JSON.parse(saved);
        // Fallback in caz ca exista notificari vechi salvate
        const old = localStorage.getItem("dismissedAdminNotifs");
        if (old) return JSON.parse(old).map((id: number) => `exp-${id}`);
        return [];
    });
    const [showPastNotifs, setShowPastNotifs] = useState(false);
    const [isLogsExpanded, setIsLogsExpanded] = useState(false);

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
            // NOTIFICARE CLIENT PENTRU SCHIMBARE STATUS COMANDA
            const targetOrder = allOrders.find(o => o.id === orderId);
            const storageKey = targetOrder?.userEmail ? `userNotifs_${targetOrder.userEmail}` : 'userNotifs';

            const newNotif = {
                id: Date.now(),
                orderId: orderId,
                message: `Your order #${orderId} status has been updated to: ${newStatus}.`,
                date: new Date().toISOString(),
                read: false
            };
            const existingNotifs = JSON.parse(localStorage.getItem(storageKey) || '[]');
            localStorage.setItem(storageKey, JSON.stringify([newNotif, ...existingNotifs]));
            window.dispatchEvent(new Event('new_notification'));
            // ----------------------------------------


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

    //1. filtering data
    const filteredOrders = allOrders.filter(o => o.id.toString().includes(orderSearchTerm.trim()));

    const filteredProducts = products.filter(p => p.name.toLowerCase().includes(productSearchTerm.toLowerCase().trim()));

    const expiringProductsList = products.filter(p => (p.nearExpiryQuantity || 0) > 0);
    const filteredExpiringProducts = expiringProductsList.filter(p => p.name.toLowerCase().includes(clearanceSearchTerm.toLowerCase().trim()));


    const filteredDiscounts = discounts.filter(d => d.productName.toLowerCase().includes(discountSearchTerm.toLowerCase().trim()));

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
    
    //2. slicing data pentru ui (paginare)
    const paginatedRevenueOrders = filteredRevenueOrders.slice((revenuePage - 1) * ITEMS_PER_PAGE, revenuePage * ITEMS_PER_PAGE);
    const paginatedOrders = filteredOrders.slice((ordersPage - 1) * ITEMS_PER_PAGE, ordersPage * ITEMS_PER_PAGE);
    const paginatedProducts = filteredProducts.slice((productsPage - 1) * ITEMS_PER_PAGE, productsPage * ITEMS_PER_PAGE);
    const paginatedDiscounts = filteredDiscounts.slice((discountsPage - 1) * ITEMS_PER_PAGE, discountsPage * ITEMS_PER_PAGE);
    const paginatedClearance = filteredExpiringProducts.slice((clearancePage - 1) * ITEMS_PER_PAGE, clearancePage * ITEMS_PER_PAGE);
    const paginatedChurn = churnClients.slice((churnPage - 1) * ITEMS_PER_PAGE, churnPage * ITEMS_PER_PAGE);

    const handleSaveProductPrice = async (productId: number) => {
        if (!editPriceValue || isNaN(Number(editPriceValue))) return;

        const product = products.find(p => p.id === productId);
        if (!product) return;

        try {
            const apiUrl = import.meta.env.VITE_API_URL;
            const config = { headers: { Authorization: `Bearer ${token}` } };

            // Salvam DOAR PRETUL
            await axios.put(`${apiUrl}/products/${productId}/price?newPrice=${editPriceValue}`, {}, config);

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

    const handleSaveNewBatch = async () => {
        if (!batchModal || !newBatchQuantity || isNaN(Number(newBatchQuantity)) || Number(newBatchQuantity) <= 0 || !newBatchExpDate) {
            setToast({ show: true, message: "Please enter valid quantity and expiration date.", type: 'error' });
            setTimeout(() => setToast({ show: false, message: '', type: 'error' }), 4000);
            return;
        }

        setIsSavingBatch(true);
        try {
            const apiUrl = import.meta.env.VITE_API_URL;
            const config = { headers: { Authorization: `Bearer ${token}` } };

            // 1. Facem UN SINGUR REQUEST catre noul endpoint care creeaza Lotul in BD
            await axios.put(`${apiUrl}/products/${batchModal.productId}/batch?quantity=${newBatchQuantity}&expirationDate=${newBatchExpDate}`, {}, config);

            addAdminLog(`Added new batch of ${newBatchQuantity} units for product "${batchModal.productName}" (ID: #${batchModal.productId}).`, 'add');

            // 2. Facem refresh la lista de produse ca sa aducem sumele recalculate de Java (Fresh / Clearance)
            await fetchProductsList();

            // 3. Inchidem modalul
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

   // --- GENERARE ALERTE SISTEM (PRODUSE EXPIRATE / CLEARANCE + COMENZI NOI) ---
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // 1. Alerte Produse Expirate Complet (Daca au ramas agățate cumva inainte de cron-job)
    const expiredAlerts = products
        .filter(p => p.expirationDate && new Date(p.expirationDate) < today)
        .map(p => ({
            id: `exp-dead-${p.id}-${p.expirationDate}`,
            type: 'expired_complete',
            date: new Date(p.expirationDate!),
            item: p as any
        }));

    // 2. Alerte Produse intrate in Clearance (Mai au <= 7 zile)
    const clearanceAlerts = products
        .filter(p => (p.nearExpiryQuantity || 0) > 0 && p.expirationDate && new Date(p.expirationDate) >= today)
        .map(p => ({
            id: `clearance-${p.id}-${p.expirationDate}`, 
            type: 'clearance_entered',
            date: new Date(), 
            item: p as any
        }));

    // 3. Alerte Comenzi Noi (Status: CONFIRMED)
    const newOrderAlerts = allOrders
        .filter(o => o.status === 'CONFIRMED')
        .map(o => ({
            id: `ord-${o.id}`,
            type: 'order',
            date: new Date(o.createdAt),
            item: o as any
        }));

    // Combinam toate 3 tipurile
    const allSystemAlerts = [...expiredAlerts, ...clearanceAlerts, ...newOrderAlerts].sort((a, b) => b.date.getTime() - a.date.getTime());
    const newNotifs = allSystemAlerts.filter(a => !dismissedAlerts.includes(a.id));
    const pastNotifs = allSystemAlerts.filter(a => dismissedAlerts.includes(a.id));

    const handleDismissAlert = (alertId: string) => {
        const updated = [...dismissedAlerts, alertId];
        setDismissedAlerts(updated);
        localStorage.setItem("dismissedSystemAlerts", JSON.stringify(updated));
    };
    // -------------------------------------------------------------

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
            // Rotunjim valorile pentru a arăta bine pe grafic (max 2 zecimale)
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

    useEffect(() => {
        if (activeTab === 'discounts' && discounts.length === 0) {
            fetchDiscounts();
        }
    }, [activeTab]);

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

    const handleSaveDiscountEdit = async (discountId: number) => {
        if (editDiscountPercentage < 1 || editDiscountPercentage > 99) {
            setToast({ show: true, message: "Percentage must be between 1 and 99.", type: 'error' });
            setTimeout(() => setToast({ show: false, message: '', type: 'error' }), 4000);
            return;
        }
        try {
            const apiUrl = import.meta.env.VITE_API_URL;
            await axios.put(`${apiUrl}/discounts/${discountId}?percentage=${editDiscountPercentage}`, {}, {
                headers: { Authorization: `Bearer ${token}` }
            });
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

    if (!user || user.role !== "ADMIN") return <Navigate to="/" replace />;
    if (isLoadingStats) return <div className="min-h-screen flex items-center justify-center"><Loader2 className="animate-spin text-blue-600" size={50} /></div>;

    return (
            <div className="flex min-h-[calc(100vh-76px)] bg-gray-50 flex-col md:flex-row">
                <div className="w-full md:w-72 bg-slate-900 text-white p-6 flex flex-col gap-2 shrink-0 border-r border-slate-800">
               <div className="mb-8">
                    <Link to="/" className="inline-flex items-center gap-2 text-xs font-bold text-slate-400 hover:text-blue-400 transition-colors mb-4">
                        <ArrowLeft size={16} strokeWidth={3} /> Return to Store
                    </Link>
                    <div className="flex items-center gap-3 border-b border-slate-700 pb-4">
                        <Store size={28} className="text-blue-400" />
                        <span className="font-black text-xl tracking-wider">ADMIN PANEL</span>
                    </div>
                </div>
                <button onClick={() => setActiveTab('dashboard')} className={`flex items-center gap-3 px-4 py-4 -mt-4 rounded-xl font-bold transition-all w-full text-left ${activeTab === 'dashboard' ? 'bg-blue-600 shadow-lg shadow-blue-900/50' : 'hover:bg-slate-800 text-slate-300 hover:text-white'}`}><LayoutDashboard size={20} />Overview</button>
                <button onClick={() => setActiveTab('revenue')} className={`flex items-center gap-3 px-4 py-4 rounded-xl font-bold transition-all w-full text-left ${activeTab === 'revenue' ? 'bg-blue-600 shadow-lg shadow-blue-900/50' : 'hover:bg-slate-800 text-slate-300 hover:text-white'}`}><TrendingUp size={20} /> Revenue Analytics</button>
                <button onClick={() => setActiveTab('ordersList')} className={`flex items-center justify-between px-4 py-4 rounded-xl font-bold transition-all w-full text-left ${activeTab === 'ordersList' ? 'bg-blue-600 shadow-lg shadow-blue-900/50' : 'hover:bg-slate-800 text-slate-300 hover:text-white'}`}><div className="flex items-center gap-3"><ShoppingCart size={20} /> Store Orders</div></button>
                <button onClick={() => setActiveTab('products')} className={`flex items-center gap-3 px-4 py-4 rounded-xl font-bold transition-all w-full text-left ${activeTab === 'products' ? 'bg-blue-600 shadow-lg shadow-blue-900/50' : 'hover:bg-slate-800 text-slate-300 hover:text-white'}`}><Box size={20} />Manage Products</button>
                <button onClick={() => setActiveTab('discounts')} className={`flex items-center gap-3 px-4 py-4 rounded-xl font-bold transition-all w-full text-left ${activeTab === 'discounts' ? 'bg-blue-600 shadow-lg shadow-blue-900/50' : 'hover:bg-slate-800 text-slate-300 hover:text-white'}`}><Tag size={20} /> Manage Discounts</button>
                <button onClick={() => setActiveTab('expiring')} className={`flex items-center justify-between px-4 py-4 rounded-xl font-bold transition-all w-full text-left ${activeTab === 'expiring' ? 'bg-blue-600 shadow-lg shadow-blue-900/50' : 'hover:bg-slate-800 text-slate-300 hover:text-white'}`}>
                    <div className="flex items-center gap-3"><Clock size={20} /> Clearance</div>
                    {stats.expiringProducts > 0 && <span className="bg-red-500 text-white text-xs px-2 py-0.5 rounded-full">{stats.expiringProducts}</span>}
                </button>
                <button onClick={() => setActiveTab('churn')} className={`flex items-center justify-between px-4 py-3 rounded-xl font-bold transition-all w-full text-left ${activeTab === 'churn' ? 'bg-blue-600 shadow-lg shadow-blue-900/50' : 'hover:bg-slate-800 text-slate-300 hover:text-white'}`}>
                    <div className="flex items-center gap-3"><Users size={20} /> Customer Retention</div>
                </button>
                <button onClick={() => setActiveTab('notifications')} className={`flex items-center justify-between px-4 py-3 rounded-xl font-bold transition-all w-full text-left ${activeTab === 'notifications' ? 'bg-blue-600 shadow-lg shadow-blue-900/50' : 'hover:bg-slate-800 text-slate-300 hover:text-white'}`}>
                    <div className="flex items-center gap-3"><Bell size={20} />Activity Hub</div>
                    {newNotifs.length > 0 && <span className="bg-red-500 text-white text-xs px-2 py-0.5 rounded-full">{newNotifs.length}</span>}
                </button>
            </div>

            <div className="flex-1 p-6 lg:p-8 overflow-y-auto">

                {activeTab === 'dashboard' && (
                    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 flex flex-col h-full w-full">
                        <div className="mb-6 flex flex-col lg:flex-row lg:items-end justify-between gap-4">
                            <div>
                                <h1 className="text-3xl font-black text-gray-900 mb-1">Overview</h1>
                                <p className="text-gray-500 text-sm">Welcome back, <strong className="text-[#134c9c]">{user?.firstName}</strong>. Here's a summary of your business.</p>
                            </div>
                            
                            {/* Butoanele de time range mutate sus langa titlu pentru a fi mai vizibile */}
                            <div className="flex bg-white p-1.5 rounded-xl border border-gray-200 shadow-sm shrink-0 overflow-x-auto">
                                <button onClick={() => setTimeRange('week')} className={`px-5 py-2 text-xs font-black rounded-lg transition-all uppercase tracking-widest ${timeRange === 'week' ? 'bg-[#134c9c] text-white shadow-md' : 'text-gray-500 hover:text-gray-900 hover:bg-gray-50'}`}>7 Days</button>
                                <button onClick={() => setTimeRange('month')} className={`px-5 py-2 text-xs font-black rounded-lg transition-all uppercase tracking-widest ${timeRange === 'month' ? 'bg-[#134c9c] text-white shadow-md' : 'text-gray-500 hover:text-gray-900 hover:bg-gray-50'}`}>4 Weeks</button>
                                <button onClick={() => setTimeRange('year')} className={`px-5 py-2 text-xs font-black rounded-lg transition-all uppercase tracking-widest ${timeRange === 'year' ? 'bg-[#134c9c] text-white shadow-md' : 'text-gray-500 hover:text-gray-900 hover:bg-gray-50'}`}>1 Year</button>
                            </div>
                        </div>

                        {/* Un singur card urias pentru tot Dashboard-ul */}
                        <Card className="border border-gray-100 shadow-sm rounded-[2rem] flex flex-col w-full bg-white overflow-hidden flex-1 mb-2">
                            
                            {/* KPI-urile integrate direct in Header-ul graficului */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 divide-y sm:divide-y-0 xl:divide-x divide-gray-100 border-b border-gray-100 bg-gray-50/30">
                                
                                {/* 1. Revenue */}
                                <div onClick={() => setActiveTab('revenue')} className="p-5 sm:p-6 lg:p-8 cursor-pointer hover:bg-blue-50/50 transition-colors group border-r border-gray-100 xl:border-r-0">
                                    <div className="flex items-center gap-3 mb-2">
                                        <div className="w-10 h-10 bg-green-100 text-green-600 rounded-full flex items-center justify-center shrink-0">
                                            <TrendingUp size={20} strokeWidth={2.5} />
                                        </div>
                                        <p className="text-xs font-bold text-gray-500 uppercase tracking-widest">Gross Revenue</p>
                                    </div>
                                    <div className="flex items-baseline gap-1 overflow-hidden">
                                        <h3 className="text-2xl sm:text-3xl lg:text-4xl font-black text-gray-900 tracking-tight group-hover:text-[#134c9c] transition-colors truncate">{stats.totalRevenue.toFixed(2)}</h3>
                                        <span className="text-xs sm:text-sm font-bold text-gray-400 uppercase tracking-widest shrink-0">Lei</span>
                                    </div>
                                </div>

                                {/* 2. Orders */}
                                <div onClick={() => setActiveTab('ordersList')} className="p-5 sm:p-6 lg:p-8 cursor-pointer hover:bg-blue-50/50 transition-colors group sm:border-r xl:border-r-0 border-gray-100">
                                    <div className="flex items-center gap-3 mb-2">
                                        <div className="w-10 h-10 bg-blue-100 text-[#134c9c] rounded-full flex items-center justify-center shrink-0">
                                            <PackageOpen size={20} strokeWidth={2.5} />
                                        </div>
                                        <p className="text-xs font-bold text-gray-500 uppercase tracking-widest truncate">Total Orders</p>
                                    </div>
                                    <h3 className="text-2xl sm:text-3xl lg:text-4xl font-black text-gray-900 tracking-tight group-hover:text-[#134c9c] transition-colors truncate">{stats.totalOrders}</h3>
                                </div>

                                {/* 3. Clearance */}
                                <div onClick={() => setActiveTab('expiring')} className="p-5 sm:p-6 lg:p-8 cursor-pointer hover:bg-orange-50/50 transition-colors group relative sm:col-span-2 xl:col-span-1 border-t sm:border-t-0 xl:border-t-0 border-gray-100">
                                    <div className="flex items-center gap-3 mb-2">
                                        <div className="w-10 h-10 bg-orange-100 text-orange-500 rounded-full flex items-center justify-center shrink-0">
                                            <AlertTriangle size={20} strokeWidth={2.5} />
                                        </div>
                                        <p className="text-xs font-bold text-gray-500 uppercase tracking-widest truncate">Needs Action</p>
                                        {stats.expiringProducts > 0 && (
                                            <span className="absolute top-4 sm:top-6 lg:top-8 right-4 sm:right-6 lg:right-8 bg-red-500 text-white text-[9px] font-black px-2 py-0.5 rounded-full uppercase tracking-widest animate-pulse">Clearance</span>
                                        )}
                                    </div>
                                    <div className="flex items-baseline gap-2 overflow-hidden">
                                        <h3 className="text-2xl sm:text-3xl lg:text-4xl font-black text-orange-600 tracking-tight group-hover:text-orange-700 transition-colors truncate">{stats.expiringProducts}</h3>
                                        <span className="text-xs sm:text-sm font-bold text-gray-400 shrink-0">items</span>
                                    </div>
                                </div>
                            </div>

                            {/* GRAFICUL MARE */}
                            <CardContent className="p-6 sm:p-8 pt-8 flex-1">
                                <div className="flex justify-between items-center mb-6">
                                    <div>
                                        <h3 className="text-lg font-black text-gray-900">{getChartTitle()}</h3>
                                        <p className="text-sm text-gray-500">Visualizing successful transactions.</p>
                                    </div>
                                </div>
                                <div style={{ width: '100%', height: '350px' }}> {/* Inaltime restabilita la 350px pentru vizibilitate optima */}
                                    <ResponsiveContainer width="100%" height="100%">
                                        <AreaChart data={generateChartData()} margin={{ top: 10, right: 0, left: -20, bottom: 0 }}>
                                            <defs>
                                                <linearGradient id="colorSales" x1="0" y1="0" x2="0" y2="1">
                                                    <stop offset="5%" stopColor="#134c9c" stopOpacity={0.4} />
                                                    <stop offset="95%" stopColor="#134c9c" stopOpacity={0} />
                                                </linearGradient>
                                            </defs>
                                            <XAxis dataKey="name" stroke="#cbd5e1" fontSize={11} tickLine={false} axisLine={false} dy={10} />
                                            <YAxis stroke="#cbd5e1" fontSize={11} tickLine={false} axisLine={false} tickFormatter={(value) => `${value}`} dx={-5} />
                                            <CartesianGrid strokeDasharray="4 4" vertical={false} stroke="#f1f5f9" />
                                            <Tooltip 
                                                contentStyle={{ borderRadius: '16px', border: '1px solid #f1f5f9', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)', fontWeight: 'bold' }} 
                                                itemStyle={{ color: '#134c9c' }}
                                         
                                            />
                                            <Area type="monotone" dataKey="sales" stroke="#134c9c" strokeWidth={3} fillOpacity={1} fill="url(#colorSales)" activeDot={{ r: 6, strokeWidth: 0, fill: '#134c9c' }} />
                                        </AreaChart>
                                    </ResponsiveContainer>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                )}

                {activeTab === 'revenue' && (
                    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                        <div className="mb-8">
                            <h1 className="text-3xl font-black text-gray-900 mb-2 flex items-center gap-3">
                                <Wallet size={28} className="text-[#134c9c]" /> Revenue Analytics
                            </h1>
                            <p className="text-gray-500 text-lg">Calculate and track your real earnings based on actual orders.</p>
                        </div>

                        {isLoadingOrders ? (
                            <div className="flex justify-center p-20"><Loader2 className="animate-spin text-[#134c9c]" size={50} /></div>
                        ) : (
                            <div className="space-y-8">
                                {/* CARDUL PREMIUM DE TOTAL (Portofel) */}
                                <Card className="border-none shadow-xl bg-gradient-to-br from-slate-900 via-[#134c9c] to-blue-900 text-white rounded-[2.5rem] overflow-hidden relative">
                                    {/* Efecte de lumina / Glow */}
                                    <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/4 pointer-events-none"></div>
                                    <div className="absolute bottom-0 left-0 w-40 h-40 bg-blue-400/20 rounded-full blur-2xl translate-y-1/3 -translate-x-1/4 pointer-events-none"></div>
                                    
                                    <CardContent className="p-8 sm:p-12 relative z-10 flex flex-col lg:flex-row justify-between items-center gap-8">
                                        <div className="text-center lg:text-left">
                                            <p className="text-blue-200 font-bold uppercase tracking-widest text-sm mb-3 flex items-center justify-center lg:justify-start gap-2">
                                                <Wallet size={18} /> Total Net Earnings
                                            </p>
                                            <div className="text-5xl sm:text-6xl font-black tracking-tighter mb-2 drop-shadow-md">
                                                {calculatedRevenue.toFixed(2)} <span className="text-2xl text-blue-200 uppercase tracking-widest ml-1 font-bold">Lei</span>
                                            </div>
                                            <p className="text-blue-100/80 text-sm font-medium">Generated from <strong className="text-white">{filteredRevenueOrders.length}</strong> successful transactions.</p>
                                        </div>
                                        
                                        {/* Filtrele tip Segmented Control (Sticla) */}
                                        <div className="flex bg-white/10 backdrop-blur-md p-1.5 rounded-2xl border border-white/20 shadow-inner">
                                            <button onClick={() => setRevenueFilter('today')} className={`px-5 py-3 text-xs font-black rounded-xl transition-all uppercase tracking-widest ${revenueFilter === 'today' ? 'bg-white text-[#134c9c] shadow-md' : 'text-blue-100 hover:bg-white/10'}`}>Today</button>
                                            <button onClick={() => setRevenueFilter('month')} className={`px-5 py-3 text-xs font-black rounded-xl transition-all uppercase tracking-widest ${revenueFilter === 'month' ? 'bg-white text-[#134c9c] shadow-md' : 'text-blue-100 hover:bg-white/10'}`}>Month</button>
                                            <button onClick={() => setRevenueFilter('year')} className={`px-5 py-3 text-xs font-black rounded-xl transition-all uppercase tracking-widest ${revenueFilter === 'year' ? 'bg-white text-[#134c9c] shadow-sm' : 'text-blue-100 hover:bg-white/10'}`}>Year</button>
                                            <button onClick={() => setRevenueFilter('all')} className={`px-5 py-3 text-xs font-black rounded-xl transition-all uppercase tracking-widest ${revenueFilter === 'all' ? 'bg-white text-[#134c9c] shadow-sm' : 'text-blue-100 hover:bg-white/10'}`}>All Time</button>
                                        </div>
                                    </CardContent>
                                </Card>

                                {/* TABELUL DE REVENUE */}
                                <Card className="border border-gray-100 shadow-sm rounded-[2.5rem] bg-white overflow-hidden">
                                    <CardHeader className="p-6 sm:px-8 border-b border-gray-50">
                                        <CardTitle className="text-xl font-black text-gray-900 flex items-center gap-3">
                                            <CalendarDays size={22} className="text-[#134c9c]" />
                                            Transactions Breakdown
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent className="p-0">
                                        <div className="overflow-x-auto">
                                            <table className="w-full text-left border-collapse min-w-[600px]">
                                                <thead>
                                                    <tr className="bg-gray-50 text-gray-500 text-xs uppercase tracking-wider">
                                                        <th className="p-5 font-bold pl-8">Transaction</th>
                                                        <th className="p-5 font-bold">Date & Time</th>
                                                        <th className="p-5 font-bold">Status</th>
                                                        <th className="p-5 font-bold text-right pr-8">Net Amount</th>
                                                    </tr>
                                                </thead>
                                                <tbody className="divide-y divide-gray-50">
                                                    {paginatedRevenueOrders.map(order => (
                                                        <tr key={order.id} className="hover:bg-blue-50/30 transition-colors group">
                                                            <td className="p-5 pl-8 flex items-center gap-3">
                                                                <div className="w-10 h-10 rounded-full bg-green-50 text-green-600 flex items-center justify-center shrink-0">
                                                                    <ArrowDownLeft size={18} strokeWidth={3} />
                                                                </div>
                                                                <div>
                                                                    <p className="font-black text-gray-900">Order #{order.id}</p>
                                                                    <p className="text-xs text-gray-500">{order.items.length} items</p>
                                                                </div>
                                                            </td>
                                                            <td className="p-5 text-sm text-gray-600 font-medium">{formatDate(order.createdAt)}</td>
                                                            <td className="p-5">
                                                                <span className={`px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest border shadow-sm ${getStatusColor(order.status)}`}>
                                                                    {order.status}
                                                                </span>
                                                            </td>
                                                            <td className="p-5 font-black text-green-600 text-right pr-8 text-lg">
                                                                +{order.totalPrice.toFixed(2)} <span className="text-xs">LEI</span>
                                                            </td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                            {filteredRevenueOrders.length === 0 && (
                                                <div className="text-center p-12 text-gray-500 flex flex-col items-center">
                                                    <SearchX size={48} className="text-gray-300 mb-4" />
                                                    <p className="font-bold text-lg text-gray-900 mb-1">No transactions found</p>
                                                    <p className="text-sm">There are no successful orders for the selected period.</p>
                                                </div>
                                            )}
                                            {renderPagination(revenuePage, filteredRevenueOrders.length, setRevenuePage)}
                                        </div>
                                    </CardContent>
                                </Card>
                            </div>
                        )}
                    </div>
                )}

                {activeTab === 'ordersList' && (
                    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
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
                                               {paginatedOrders.map((order) => {
                                                    const draftStatus = statusDrafts[order.id] || order.status;
                                                    const hasChanged = draftStatus !== order.status;

                                                    return (
                                                        <tr
                                                            key={order.id}
                                                            onClick={() => setSelectedOrderDetails(order)}
                                                            className="group hover:bg-blue-50/40 transition-all cursor-pointer border-b border-gray-50"
                                                        >
                                                            <td className="p-4 font-black text-gray-900">#{order.id}</td>
                                                            <td className="p-4 text-sm text-gray-600">{formatDate(order.createdAt)}</td>
                                                            <td className="p-4 text-sm text-gray-600">
                                                                <div className="flex items-center gap-3">
                                                                    <div className="bg-gray-100 text-gray-600 font-bold px-2 py-1 rounded-md text-xs">
                                                                        {order.items.length} items
                                                                    </div>
                                                                    <span className="text-[10px] text-blue-500 font-bold uppercase tracking-widest opacity-0 group-hover:opacity-100 transition-opacity">
                                                                        View details &rarr;
                                                                    </span>
                                                                </div>
                                                            </td>
                                                            <td className="p-4 font-black text-[#134c9c] text-lg">{order.totalPrice.toFixed(2)} Lei</td>
                                                            <td className="p-4">
                                                                <span className={`px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest border shadow-sm ${getStatusColor(order.status)}`}>
                                                                    {order.status}
                                                                </span>
                                                            </td>

                                                            {/* OPRIM propagarea click-ului aici ca sa nu deschida modalul cand schimbi statusul */}
                                                            <td className="p-4 w-[280px]" onClick={(e) => e.stopPropagation()}>
                                                                <div className="flex gap-2">
                                                                    <Select value={draftStatus} onValueChange={(val) => setStatusDrafts({ ...statusDrafts, [order.id]: val })}>
                                                                        <SelectTrigger className="w-full bg-white border-gray-200 h-10 text-xs font-bold shadow-sm">
                                                                            <SelectValue />
                                                                        </SelectTrigger>
                                                                        <SelectContent className="z-[100]">
                                                                            <SelectItem value="CONFIRMED">CONFIRMED</SelectItem>
                                                                            <SelectItem value="PROCESSING">PROCESSING</SelectItem>
                                                                            <SelectItem value="SHIPPED">SHIPPED</SelectItem>
                                                                            <SelectItem value="DELIVERED">DELIVERED</SelectItem>
                                                                            <SelectItem value="CANCELLED">CANCELLED</SelectItem>
                                                                        </SelectContent>
                                                                    </Select>
                                                                    {hasChanged && (
                                                                        <Button size="sm" className="bg-green-600 hover:bg-green-700 h-10 shadow-md" onClick={() => handleUpdateOrderStatus(order.id)} disabled={updatingOrderId === order.id}>
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
                                        {renderPagination(ordersPage, filteredOrders.length, setOrdersPage)}
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </div>
                )}

                {activeTab === 'products' && (
                    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
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
                                                    <th className="p-4 font-bold w-16">ID</th>
                                                    <th className="p-4 font-bold">Product</th>
                                                    <th className="p-4 font-bold">Category</th>
                                                    <th className="p-4 font-bold">Stock</th>
                                                    <th className="p-4 font-bold w-[150px]">Base Price</th>
                                                    <th className="p-4 font-bold text-center">Actions</th>
                                                </tr>
                                            </thead>
                                           <tbody className="divide-y divide-gray-100">
                                                {paginatedProducts.map((prod) => (
                                                    <tr key={prod.id} className={`transition-colors ${editingProductId === prod.id ? 'bg-blue-50/50' : 'hover:bg-blue-50/30'}`}>
                                                        <td className="p-4 font-black text-gray-900">#{prod.id}</td>
                                                        
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
                                                        <td className="p-4 text-sm font-medium text-gray-600 w-[200px]">
                                                            <div className="flex flex-col gap-2 items-start">
                                                                <span>{displayFormattedStock(prod.stockQuantity, prod.unitOfMeasure)}</span>
                                                                <button
                                                                    onClick={() => {
                                                                        // Permitem adminului sa adauge loturi oricand! Backend-ul le sorteaza inteligent.
                                                                        setBatchModal({
                                                                            show: true,
                                                                            productId: prod.id,
                                                                            productName: prod.name,
                                                                            currentStock: prod.stockQuantity
                                                                        });
                                                                        setNewBatchQuantity("");
                                                                        setNewBatchExpDate("");
                                                                    }}
                                                                    className="text-[10px] font-bold px-2.5 py-1 bg-blue-50 text-[#134c9c] rounded-md hover:bg-[#134c9c] hover:text-white transition-colors uppercase tracking-widest flex items-center gap-1"
                                                                >
                                                                    <Plus size={12} strokeWidth={3} /> New Batch
                                                                </button>
                                                            </div>
                                                        </td>

                                                        <td className="p-4 w-[150px]">
                                                            {editingProductId === prod.id ? (
                                                                <div className="flex items-center gap-1">
                                                                    <Input type="number" value={editPriceValue} onChange={(e) => setEditPriceValue(e.target.value)} className="w-20 h-8 bg-white px-2 font-bold text-[#134c9c]" autoFocus />
                                                                    <span className="text-xs font-bold text-gray-500">Lei</span>
                                                                </div>
                                                            ) : (
                                                                <div className="flex flex-col">
                                                                    <span className={`font-bold ${prod.freshPrice < prod.price ? 'text-green-600' : 'text-gray-900'}`}>
                                                                        {(prod.freshPrice || prod.price).toFixed(2)} Lei
                                                                    </span>
                                                                    {prod.freshPrice < prod.price && (
                                                                        <span className="text-[10px] text-gray-400 font-bold flex items-center gap-1 mt-0.5">
                                                                            <span className="line-through">{prod.price.toFixed(2)} Lei</span>
                                                                            <span className="bg-red-100 text-red-600 px-1 rounded uppercase tracking-widest text-[8px]">Promo</span>
                                                                        </span>
                                                                    )}
                                                                </div>
                                                            )}
                                                        </td>

                                                        <td className="p-4">
                                                            {editingProductId === prod.id ? (
                                                                <div className="flex items-center justify-center gap-2">
                                                                    <button onClick={() => handleSaveProductPrice(prod.id)} className="p-2 bg-green-100 text-green-600 rounded hover:bg-green-200 transition-colors shadow-sm" title="Save new price"><Save size={16} /></button>
                                                                    <button onClick={() => setEditingProductId(null)} className="p-2 bg-red-100 text-red-600 rounded hover:bg-red-200 transition-colors shadow-sm" title="Cancel edit"><X size={16} /></button>
                                                                </div>
                                                            ) : (
                                                                <div className="flex items-center justify-center gap-3">
                                                                    <button onClick={() => { setEditingProductId(prod.id); setEditPriceValue(prod.price.toString()); }} className="text-blue-500 hover:text-blue-700 transition-colors" title="Edit Product"><Edit2 size={18} /></button>
                                                                    <button onClick={() => setDeleteProductModal(prod.id)} className="text-red-400 hover:text-red-600 transition-colors" title="Remove Product"><Trash2 size={18} /></button>
                                                                </div>
                                                            )}
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                       </table>
                                        {filteredProducts.length === 0 && <p className="text-center p-8 text-gray-500">No products found.</p>}
                                        {renderPagination(productsPage, filteredProducts.length, setProductsPage)}
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </div>
                )}

                {activeTab === 'discounts' && (
                    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                        <div className="mb-6 flex flex-col md:flex-row md:items-end justify-between gap-4">
                            <div>
                                <h1 className="text-3xl font-black text-gray-900 mb-2 flex items-center gap-3">
                                    <Tag size={28} className="text-blue-600" /> Manage Discounts
                                </h1>
                                <p className="text-gray-500">Edit or delete active percentage discounts on products.</p>
                            </div>
                           <div className="flex flex-col sm:flex-row items-center gap-3 w-full md:w-auto md:ml-auto">
                                <div className="relative w-full md:w-72">
                                    <Input type="text" placeholder="Search by product name..." value={discountSearchTerm} onChange={(e) => setDiscountSearchTerm(e.target.value)} className="pl-10 h-11 bg-white rounded-xl border-gray-200" />
                                    <Search size={18} className="absolute left-3 top-3.5 text-gray-400" />
                                </div>
                                <Button onClick={() => setIsAddDiscountModalOpen(true)} className="w-full sm:w-auto h-11 px-6 bg-[#134c9c] hover:bg-[#80c4e8] hover:text-black text-white font-bold rounded-xl flex items-center gap-2 shadow-lg shadow-blue-900/20 shrink-0">
                                    <Plus size={20} strokeWidth={3} /> Add Discount
                                </Button>
                            </div>
                        </div>

                        <Card className="border-none shadow-sm overflow-hidden">
                            <CardContent className="p-0">
                                {isLoadingDiscounts ? (
                                    <div className="flex justify-center p-10"><Loader2 className="animate-spin text-blue-600" size={40} /></div>
                                ) : (
                                    <div className="overflow-x-auto">
                                        <table className="w-full text-left border-collapse min-w-[800px]">
                                            <thead>
                                                <tr className="bg-gray-50 text-gray-500 text-xs uppercase tracking-wider">
                                                    <th className="p-4 font-bold">IDs</th>
                                                    <th className="p-4 font-bold">Product</th>
                                                    <th className="p-4 font-bold">Base Price</th>
                                                    <th className="p-4 font-bold">Discount %</th>
                                                    <th className="p-4 font-bold">Reduced Price</th>
                                                    <th className="p-4 font-bold text-center">Actions</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-gray-100">
                                               {paginatedDiscounts.map((disc) => (
                                                    <tr key={disc.id} className={`transition-colors ${editingDiscountId === disc.id ? 'bg-blue-50/50' : 'hover:bg-blue-50/30'}`}>
                                                        <td className="p-4">
                                                            <p className="text-xs font-bold text-gray-900">Disc: #{disc.id}</p>
                                                            <p className="text-xs text-gray-400 font-bold mt-1">Prod: #{disc.productId}</p>
                                                        </td>
                                                        <td className="p-4 flex items-center gap-3">
                                                            <div className="w-12 h-12 bg-white border border-gray-200 rounded-lg flex items-center justify-center p-1 shrink-0">
                                                                <img src={disc.productImage || "https://placehold.co/100?text=No+Img"} alt="" className="w-full h-full object-contain" />
                                                            </div>
                                                            <p className="font-bold text-gray-900 line-clamp-2">{disc.productName}</p>
                                                        </td>
                                                        <td className="p-4 font-bold text-gray-500 line-through">{disc.basePrice.toFixed(2)} Lei</td>
                                                        <td className="p-4">
                                                            {editingDiscountId === disc.id ? (
                                                                <div className="flex items-center gap-1 w-24">
                                                                    <Input type="number" value={editDiscountPercentage} onChange={(e) => setEditDiscountPercentage(Number(e.target.value))} className="w-16 h-8 bg-white px-2 font-bold text-[#134c9c]" autoFocus />
                                                                    <span className="font-bold text-gray-500">%</span>
                                                                </div>
                                                            ) : (
                                                                <span className="inline-flex items-center justify-center px-2.5 py-1 bg-red-100 text-red-600 font-black rounded-lg text-sm">
                                                                    -{disc.percentage}%
                                                                </span>
                                                            )}
                                                        </td>
                                                        <td className="p-4 font-black text-red-600 text-lg">{disc.reducedPrice.toFixed(2)} Lei</td>
                                                        <td className="p-4">
                                                            {editingDiscountId === disc.id ? (
                                                                <div className="flex items-center justify-center gap-2">
                                                                    <button onClick={() => handleSaveDiscountEdit(disc.id)} className="p-2 bg-green-100 text-green-600 rounded hover:bg-green-200 transition-colors shadow-sm" title="Save"><Save size={16} /></button>
                                                                    <button onClick={() => setEditingDiscountId(null)} className="p-2 bg-red-100 text-red-600 rounded hover:bg-red-200 transition-colors shadow-sm" title="Cancel"><X size={16} /></button>
                                                                </div>
                                                            ) : (
                                                                <div className="flex items-center justify-center gap-3">
                                                                    <button onClick={() => { setEditingDiscountId(disc.id); setEditDiscountPercentage(disc.percentage); }} className="text-blue-500 hover:text-blue-700 transition-colors" title="Edit Discount"><Edit2 size={18} /></button>
                                                                    <button onClick={() => handleDeleteDiscount(disc.id)} className="text-red-400 hover:text-red-600 transition-colors" title="Remove Discount"><Trash2 size={18} /></button>
                                                                </div>
                                                            )}
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                       </table>
                                        {filteredDiscounts.length === 0 && <p className="text-center p-8 text-gray-500">No active discounts found.</p>}
                                        {renderPagination(discountsPage, filteredDiscounts.length, setDiscountsPage)}
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </div>
                )}

                {activeTab === 'expiring' && (
                    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                        <div className="mb-6 flex flex-col md:flex-row md:items-end justify-between gap-4">
                            <div>
                                <h1 className="text-3xl font-black text-orange-600 mb-2 flex items-center gap-3">
                                    <Clock size={28} /> Clearance
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
                                                    <th className="p-4 font-bold text-center">Expiring Quantity</th>
                                                    <th className="p-4 font-bold">Clearance Price</th>
                                                    <th className="p-4 font-bold text-center">Actions</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-gray-100">
                                               {paginatedClearance.map((prod) => {
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
                                        {renderPagination(clearancePage, filteredExpiringProducts.length, setClearancePage)}
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </div>
                )}

                {activeTab === 'notifications' && (
                    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                        <div className="mb-8 flex flex-col md:flex-row justify-between md:items-end gap-4">
                            <div>
                                <h1 className="text-3xl font-black text-gray-900 mb-2 flex items-center gap-3">
                                    <Bell size={28} className="text-[#134c9c]" /> Activity Hub
                                </h1>
                                <p className="text-gray-500">Monitor system alerts, product expirations, and your admin action history.</p>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">

                            {/* COLOANA 1: SYSTEM ALERTS (EXPIRATIONS) */}
                            <div className="space-y-6">
                                <div className="flex items-center justify-between px-2">
                                    <h2 className="text-lg font-black text-gray-900 uppercase tracking-widest flex items-center gap-2">
                                        <AlertTriangle size={20} className="text-orange-500" /> System Alerts
                                    </h2>
                                    {pastNotifs.length > 0 && (
                                        <button
                                            onClick={() => setShowPastNotifs(!showPastNotifs)}
                                            className="text-xs font-bold text-[#134c9c] hover:underline"
                                        >
                                            {showPastNotifs ? "Hide Read Alerts" : `View Read (${pastNotifs.length})`}
                                        </button>
                                    )}
                                </div>

                                {isLoadingProducts ? (
                                    <div className="flex justify-center p-10 bg-white rounded-[2rem] border border-gray-100 shadow-sm"><Loader2 className="animate-spin text-[#134c9c]" size={40} /></div>
                                ) : (
                                    <div className="space-y-4">
                                        {/* Starea "Empty" */}
                                        {newNotifs.length === 0 && !showPastNotifs && (
                                            <Card className="border border-gray-100 shadow-sm text-center p-10 bg-white rounded-[2rem]">
                                                <CardContent className="flex flex-col items-center justify-center m-0 p-0">
                                                    <div className="bg-green-50 p-4 rounded-full mb-4">
                                                        <Check size={32} className="text-green-500" strokeWidth={3} />
                                                    </div>
                                                    <p className="text-gray-900 font-black text-xl">All Clear!</p>
                                                    <p className="text-gray-500 text-sm mt-1">No unread system alerts.</p>
                                                </CardContent>
                                            </Card>
                                        )}

                                        {/* Unread Notifications (Mixte: Comenzi + Expirari) */}
                                        {newNotifs.map(alert => (
                                            <Card key={alert.id} className={`relative border-none shadow-md hover:shadow-lg transition-shadow bg-gradient-to-r ${alert.type === 'expiration' ? 'from-orange-50' : 'from-blue-50'} to-white rounded-[1.5rem] overflow-hidden group`}>
                                                {/* Banda Laterala Colorata */}
                                                <div className={`absolute left-0 top-0 bottom-0 w-1.5 ${alert.type === 'expiration' ? 'bg-orange-500' : 'bg-[#134c9c]'}`}></div>

                                                <button
                                                    onClick={() => handleDismissAlert(alert.id)}
                                                    className="absolute top-4 right-4 p-2 text-gray-400 hover:text-gray-700 bg-white hover:bg-gray-100 rounded-full shadow-sm transition-all opacity-0 group-hover:opacity-100"
                                                    title="Mark as read"
                                                >
                                                    <X size={16} strokeWidth={3} />
                                                </button>

                                                <CardContent className="p-6 flex items-start gap-4">
                                                    {/* Iconita in functie de tip */}
                                                    {alert.type === 'expired_complete' && (
                                                        <div className="w-12 h-12 rounded-2xl flex items-center justify-center bg-gradient-to-br from-red-500 to-red-700 text-white shadow-lg shadow-red-500/30 shrink-0">
                                                            <XCircle size={24} strokeWidth={2.5} />
                                                        </div>
                                                    )}
                                                    {alert.type === 'clearance_entered' && (
                                                        <div className="w-12 h-12 rounded-2xl flex items-center justify-center bg-gradient-to-br from-orange-400 to-orange-500 text-white shadow-lg shadow-orange-500/30 shrink-0">
                                                            <Clock size={24} strokeWidth={2.5} />
                                                        </div>
                                                    )}
                                                    {alert.type === 'order' && (
                                                        <div className="w-12 h-12 rounded-2xl flex items-center justify-center bg-gradient-to-br from-[#134c9c] to-blue-400 text-white shadow-lg shadow-blue-500/30 shrink-0">
                                                            <ShoppingCart size={24} strokeWidth={2.5} />
                                                        </div>
                                                    )}

                                                    <div className="pr-8">
                                                        {alert.type === 'expired_complete' && (
                                                            <>
                                                                <h3 className="font-bold text-gray-900 text-base mb-1">Product Expired</h3>
                                                                <p className="text-gray-600 text-sm leading-relaxed">
                                                                    <strong className="text-gray-900">{alert.item.name}</strong> ({alert.item.brandName}) has passed its expiration date (<span className="text-red-600 font-bold">{alert.item.expirationDate}</span>). It will be automatically removed from stock.
                                                                </p>
                                                            </>
                                                        )}
                                                        {alert.type === 'clearance_entered' && (
                                                            <>
                                                                <h3 className="font-bold text-gray-900 text-base mb-1">Clearance Alert</h3>
                                                                <p className="text-gray-600 text-sm leading-relaxed">
                                                                    <strong className="text-gray-900">{alert.item.name}</strong> ({alert.item.brandName}) has <strong className="text-orange-600">{alert.item.nearExpiryQuantity} units</strong> expiring on <span className="text-orange-600 font-bold">{alert.item.expirationDate}</span>. They are now marked as Clearance.
                                                                </p>
                                                            </>
                                                        )}
                                                        {alert.type === 'order' && (
                                                            <>
                                                                <h3 className="font-bold text-gray-900 text-base mb-1">New Order Received</h3>
                                                                <p className="text-gray-600 text-sm leading-relaxed">
                                                                    Order <strong className="text-gray-900">#{alert.item.id}</strong> was placed for <strong className="text-[#134c9c]">{alert.item.totalPrice.toFixed(2)} LEI</strong>. Please review and process it.
                                                                </p>
                                                            </>
                                                        )}
                                                    </div>
                                                </CardContent>
                                            </Card>
                                        ))}

                                        {/* Read Notifications (Past) */}
                                        {showPastNotifs && pastNotifs.length > 0 && (
                                            <div className="pt-4 space-y-4 animate-in fade-in slide-in-from-top-4">
                                                {pastNotifs.map(alert => (
                                                    <Card key={`past-${alert.id}`} className="border border-gray-100 bg-gray-50 shadow-none opacity-70 rounded-[1.5rem] overflow-hidden relative">
                                                        <CardContent className="p-5 flex items-start gap-4">
                                                            <div className="bg-gray-200 p-2 rounded-xl text-gray-500 shrink-0">
                                                                <CheckCircle2 size={20} />
                                                            </div>
                                                            <div>
                                                                <h3 className="font-bold text-gray-700 text-sm mb-1">Alert Acknowledged</h3>
                                                                <p className="text-gray-500 text-xs leading-relaxed">
                                                                    {alert.type === 'expired_complete' && <><strong className="text-gray-700">{alert.item.name}</strong> (Exp: {alert.item.expirationDate}) expiration was acknowledged.</>}
                                                                    {alert.type === 'clearance_entered' && <><strong className="text-gray-700">{alert.item.name}</strong> clearance alert (Exp: {alert.item.expirationDate}) was acknowledged.</>}
                                                                    {alert.type === 'order' && <>New order <strong className="text-gray-700">#{alert.item.id}</strong> has been acknowledged.</>}
                                                                </p>
                                                            </div>
                                                        </CardContent>
                                                    </Card>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>

                            {/* COLOANA 2: ADMIN ACTION LOGS */}
                            <div className="space-y-6">
                                <div className="flex items-center justify-between px-2">
                                    <h2 className="text-lg font-black text-gray-900 uppercase tracking-widest flex items-center gap-2">
                                        <LayoutDashboard size={20} className="text-[#134c9c]" /> Admin Logs
                                    </h2>
                                    {adminLogs.length > 0 && (
                                        <button
                                            onClick={() => { setAdminLogs([]); localStorage.removeItem("adminActionLogs"); }}
                                            className="text-xs font-bold text-red-500 hover:underline flex items-center gap-1"
                                        >
                                            <Trash2 size={12} /> Clear Logs
                                        </button>
                                    )}
                                </div>

                                {adminLogs.length === 0 ? (
                                    <Card className="border border-gray-100 shadow-sm text-center p-10 bg-white rounded-[2rem]">
                                        <CardContent className="flex flex-col items-center justify-center m-0 p-0">
                                            <div className="bg-gray-50 p-4 rounded-full mb-4">
                                                <LayoutDashboard size={32} className="text-gray-300" />
                                            </div>
                                            <p className="text-gray-900 font-bold text-lg">No actions recorded.</p>
                                            <p className="text-gray-500 text-sm mt-1">Changes made to products or orders will appear here.</p>
                                        </CardContent>
                                    </Card>
                                ) : (
                                    <div className="space-y-3">
                                        {/* Aici folosim logica pentru Expandable */}
                                        {adminLogs.slice(0, isLogsExpanded ? adminLogs.length : 6).map(log => (
                                            <Card key={log.id} className="border border-gray-100 shadow-sm bg-white rounded-2xl overflow-hidden relative hover:shadow-md transition-shadow">
                                                <div className="w-1.5 h-full bg-[#134c9c] absolute left-0 top-0"></div>
                                                <CardContent className="p-4 flex items-start gap-4 ml-1">
                                                    <div className="bg-blue-50 p-2.5 rounded-xl text-[#134c9c] shrink-0 mt-0.5">
                                                        {log.type === 'status' && <PackageOpen size={18} />}
                                                        {log.type === 'price' && <Edit2 size={18} />}
                                                        {log.type === 'delete' && <Trash2 size={18} />}
                                                        {log.type === 'clearance' && <Clock size={18} />}
                                                        {log.type === 'add' && <Plus size={18} />}
                                                        {log.type === 'promo' && <Tag size={18} />}
                                                    </div>
                                                    <div className="flex-1 min-w-0 flex flex-col justify-center">
                                                        <h3 className="font-bold text-gray-900 text-sm">
                                                            {log.type === 'status' && "Order Updated"}
                                                            {log.type === 'price' && "Pricing Changed"}
                                                            {log.type === 'delete' && "Product Deleted"}
                                                            {log.type === 'clearance' && "Clearance Dropped"}
                                                            {log.type === 'add' && "Inventory Update"}
                                                            {log.type === 'promo' && "Promo Code Sent"}
                                                        </h3>
                                                        <p className="text-gray-500 text-xs mt-1 leading-relaxed pr-2">
                                                            {log.message}
                                                        </p>
                                                        <span className="text-[10px] font-bold text-gray-400 mt-2 flex items-center gap-1">
                                                            <Clock size={10} /> {formatDate(log.date)}
                                                        </span>
                                                    </div>
                                                </CardContent>
                                            </Card>
                                        ))}

                                        {/* Buton de Show More daca sunt mai mult de 6 loguri */}
                                        {adminLogs.length > 6 && (
                                            <div className="pt-2 flex justify-center">
                                                <button
                                                    onClick={() => setIsLogsExpanded(!isLogsExpanded)}
                                                    className="flex items-center gap-2 bg-white border border-gray-200 text-gray-600 px-6 py-2 rounded-full shadow-sm font-bold text-xs hover:bg-gray-50 transition-colors"
                                                >
                                                    {isLogsExpanded ? (
                                                        <>Show Less <ChevronUp size={14} /></>
                                                    ) : (
                                                        <>Show {adminLogs.length - 6} More <ChevronDown size={14} /></>
                                                    )}
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                )}
                {/*  TAB-UL DE CHURN PREDICTION  */}
                {activeTab === 'churn' && (
                    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
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
                                                {paginatedChurn.map((client) => {
                                                    const isHighRisk = client.churnRisk >= 40;
                                                    const isMediumRisk = client.churnRisk >= 20 && client.churnRisk < 40;

                                                    const canSendPromo = isHighRisk || isMediumRisk;

                                                    const hasBeenSent = sentPromos.includes(client.userId); //A primit deja codul in sesiunea asta?

                                                   return (
                                                        <tr key={client.userId} className="group hover:bg-blue-50/40 transition-colors border-b border-gray-50">
                                                            <td className="p-4">
                                                                <p className="font-bold text-gray-900 group-hover:text-[#134c9c] transition-colors">{client.name}</p>
                                                                <p className="text-xs text-gray-500 font-medium mt-0.5">{client.email}</p>
                                                            </td>
                                                            <td className="p-4 font-bold text-gray-700 text-center">
                                                                <span className="bg-gray-100 text-gray-700 px-3 py-1 rounded-lg text-xs">{client.totalOrders}</span>
                                                            </td>
                                                            <td className="p-4 font-black text-[#134c9c] text-right">{client.totalSpent.toFixed(2)} Lei</td>
                                                            <td className="p-4 text-sm text-gray-600 text-center font-medium">{client.daysSinceLastOrder} days ago</td>

                                                            <td className="p-4 text-center">
                                                                <div className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest border shadow-sm
                                                                    ${isHighRisk ? 'bg-red-50 text-red-600 border-red-200' : isMediumRisk ? 'bg-orange-50 text-orange-600 border-orange-200' : 'bg-green-50 text-green-600 border-green-200'}
                                                                `}>
                                                                    {isHighRisk ? <AlertTriangle size={14} strokeWidth={2.5}/> : isMediumRisk ? <TrendingDown size={14} strokeWidth={2.5} /> : <CheckCircle2 size={14} strokeWidth={2.5} />}
                                                                    {client.churnRisk}% Risk
                                                                </div>
                                                            </td>

                                                            <td className="p-4 text-center flex justify-center">
                                                                <Button
                                                                    onClick={() => {
                                                                        if (hasBeenSent) {
                                                                            setPromoModal({ show: true, clientId: client.userId, clientName: client.name });
                                                                        } else {
                                                                            handleSendPromo(client.userId, client.name);
                                                                        }
                                                                    }}
                                                                    disabled={sendingToId === client.userId || !canSendPromo}
                                                                    size="sm"
                                                                    className={`rounded-xl shadow-sm h-10 px-4 transition-all duration-300 min-w-[140px] font-bold flex items-center justify-center gap-2 ${hasBeenSent ? 'bg-green-100 text-green-700 border border-green-200 hover:bg-green-200' :
                                                                        canSendPromo ? 'bg-[#134c9c] hover:bg-[#0f3d7d] text-white hover:shadow-md hover:-translate-y-0.5' :
                                                                            'bg-gray-100 text-gray-400 border border-transparent'
                                                                        }`}
                                                                >
                                                                    {sendingToId === client.userId ? <Loader2 className="animate-spin" size={16} />
                                                                        : hasBeenSent ? <CheckCircle2 size={16} strokeWidth={2.5} />
                                                                            : <Send size={16} strokeWidth={2.5} />}

                                                                    {hasBeenSent ? "Sent" : "Send Promo"}
                                                                </Button>
                                                            </td>
                                                        </tr>
                                                    );
                                                })}
                                            </tbody>
                                       </table>
                                        {churnClients.length === 0 && <p className="text-center p-8 text-gray-500">Not enough data to run ML analysis or the script is not currently running.</p>}
                                        {renderPagination(churnPage, churnClients.length, setChurnPage)}
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
            {/* MODAL CONFIRMARE "SEND AGAIN" */}
            {promoModal && promoModal.show && (
                <div className="fixed inset-0 z-[150] flex items-center justify-center bg-black/40 backdrop-blur-sm px-4">
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
                            You have already sent a promo code to <strong className="text-gray-900">{promoModal.clientName}</strong> during this session. Are you sure you want to send another notification?
                        </p>

                        <div className="flex gap-4">
                            <Button onClick={() => setPromoModal(null)} variant="outline" className="flex-1 h-14 text-base font-bold rounded-2xl border-2 hover:bg-gray-50 transition-all">Cancel</Button>
                            <Button
                                onClick={() => {
                                    handleSendPromo(promoModal.clientId, promoModal.clientName);
                                    setPromoModal(null);
                                }}
                                className="flex-1 h-14 text-base font-bold rounded-2xl shadow-lg shadow-blue-900/20 bg-[#134c9c] hover:bg-[#0f3d7d] text-white transition-all hover:-translate-y-0.5"
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
                                    <Input required value={newProduct.name} onChange={(e) => setNewProduct({ ...newProduct, name: e.target.value })} placeholder="ex. Organic Milk" className="h-12 border-gray-200" />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-xs font-black uppercase text-gray-400 ml-1">Price (Lei)</label>
                                    <Input required type="number" step="0.01" value={newProduct.price} onChange={(e) => setNewProduct({ ...newProduct, price: e.target.value })} placeholder="0.00" className="h-12 border-gray-200" />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-xs font-black uppercase text-gray-400 ml-1">Initial Stock</label>
                                    <Input required type="number" value={newProduct.stockQuantity} onChange={(e) => setNewProduct({ ...newProduct, stockQuantity: e.target.value })} placeholder="100" className="h-12 border-gray-200" />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-xs font-black uppercase text-gray-400 ml-1">Unit (kg, buc, L)</label>
                                    <Input required value={newProduct.unitOfMeasure} onChange={(e) => setNewProduct({ ...newProduct, unitOfMeasure: e.target.value })} placeholder="buc" className="h-12 border-gray-200" />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-xs font-black uppercase text-gray-400 ml-1">Expiration Date</label>
                                    <Input type="date" value={newProduct.expirationDate} onChange={(e) => setNewProduct({ ...newProduct, expirationDate: e.target.value })} className="h-12 border-gray-200" />
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
                                    <Select value={newProduct.brandId ? newProduct.brandId.toString() : ""} onValueChange={(val) => setNewProduct({ ...newProduct, brandId: parseInt(val) })}>
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
                                    <Select value={newProduct.categoryId ? newProduct.categoryId.toString() : ""} onValueChange={(val) => setNewProduct({ ...newProduct, categoryId: parseInt(val) })}>
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
                                    onChange={(e) => setNewProduct({ ...newProduct, description: e.target.value })}
                                    placeholder="Write something about the product..."
                                />
                            </div>

                            {/* SECTIUNEA EXTENSIBILA PENTRU ATRIBUTE --- */}
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
                                            <Input type="number" value={newProduct.calories} onChange={(e) => setNewProduct({ ...newProduct, calories: e.target.value })} placeholder="ex. 250" className="h-10 bg-white" />
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-xs font-bold text-gray-500 ml-1">Proteins (g)</label>
                                            <Input type="number" value={newProduct.proteins} onChange={(e) => setNewProduct({ ...newProduct, proteins: e.target.value })} placeholder="ex. 15" className="h-10 bg-white" />
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-xs font-bold text-gray-500 ml-1">Carbs (g)</label>
                                            <Input type="number" value={newProduct.carbs} onChange={(e) => setNewProduct({ ...newProduct, carbs: e.target.value })} placeholder="ex. 30" className="h-10 bg-white" />
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-xs font-bold text-gray-500 ml-1">Fats (g)</label>
                                            <Input type="number" value={newProduct.fats} onChange={(e) => setNewProduct({ ...newProduct, fats: e.target.value })} placeholder="ex. 10" className="h-10 bg-white" />
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
            {/* --- MODAL PENTRU ADAUGARE LOT NOU --- */}
            {batchModal && batchModal.show && (
                <div className="fixed inset-0 z-[120] flex items-center justify-center bg-black/60 backdrop-blur-sm px-4 py-10">
                    <div className="bg-white rounded-3xl p-8 max-w-md w-full shadow-2xl relative animate-in zoom-in-95">
                        <button onClick={() => setBatchModal(null)} className="absolute top-5 right-5 text-gray-400 hover:text-gray-800 transition-colors bg-gray-100 p-2 rounded-full">
                            <X size={20} strokeWidth={3} />
                        </button>

                        <div className="flex items-center gap-3 mb-6">
                            <div className="w-12 h-12 rounded-full flex items-center justify-center bg-blue-50 text-blue-600">
                                <PackageOpen size={24} />
                            </div>
                            <h2 className="text-2xl font-black text-gray-900">Add New Batch</h2>
                        </div>

                        {/* WARNING DACA MAI EXISTA STOC */}
                      {batchModal.currentStock > 0 ? (
                            <div className="bg-blue-50 border border-blue-200 text-blue-800 p-4 rounded-xl mb-6 flex gap-3 text-sm leading-relaxed">
                                <Box size={20} className="shrink-0 text-blue-600 mt-0.5" />
                                <div>
                                    <p className="font-bold mb-1">Inventory Notice</p>
                                    <p>You are adding a new batch of <strong>{newBatchQuantity || '0'}</strong> units. 
                                    The system will automatically track expiration dates and sell older items first. Current stock: <strong>{batchModal.currentStock}</strong> units.</p>
                                </div>
                            </div>
                        ) : (
                            <p className="text-gray-500 mb-6 text-sm leading-relaxed">
                                The current stock for <strong>{batchModal.productName}</strong> is empty. Please add the new quantity and its expiration date.
                            </p>
                        )}

                        <div className="space-y-4 mb-8">
                            <div className="space-y-2">
                                <label className="text-xs font-bold text-gray-500 uppercase tracking-widest ml-1">New Quantity Received</label>
                                <Input
                                    type="number"
                                    min="1"
                                    value={newBatchQuantity}
                                    onChange={(e) => setNewBatchQuantity(e.target.value)}
                                    placeholder="ex. 50"
                                    className="h-12 border-gray-200 bg-gray-50 rounded-xl text-base font-bold"
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-xs font-bold text-gray-500 uppercase tracking-widest ml-1">New Expiration Date</label>
                                <Input
                                    type="date"
                                    value={newBatchExpDate}
                                    onChange={(e) => setNewBatchExpDate(e.target.value)}
                                    className="h-12 border-gray-200 bg-gray-50 rounded-xl text-base font-bold"
                                />
                            </div>
                        </div>

                        <div className="flex gap-3">
                            <Button type="button" onClick={() => setBatchModal(null)} variant="outline" className="flex-1 h-12 text-sm font-bold rounded-xl border-2">Cancel</Button>
                            <Button
                                onClick={handleSaveNewBatch}
                                disabled={!newBatchQuantity || !newBatchExpDate || isSavingBatch}
                                className="flex-1 h-12 text-sm font-bold rounded-xl shadow-md bg-[#134c9c] hover:bg-blue-800 text-white disabled:opacity-50"
                            >
                                {isSavingBatch ? <Loader2 className="animate-spin" size={18} /> : "Save New Batch"}
                            </Button>
                        </div>
                    </div>
                </div>
            )}
            {/* --- MODAL DETALII COMANDA --- */}
            {selectedOrderDetails && (
                <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
        <div className="bg-white rounded-[2.5rem] p-0 max-w-2xl w-full shadow-2xl relative animate-in zoom-in-95 flex flex-col max-h-[90vh] overflow-hidden border border-gray-100">

                        {/* Header-ul Modalului */}
                        <div className="p-6 sm:p-8 bg-gray-50/80 border-b border-gray-100 flex items-start justify-between shrink-0">
                            <div>
                                <div className="flex flex-wrap items-center gap-3 mb-2">
                                    <h2 className="text-2xl font-black text-gray-900 tracking-tight">Order #{selectedOrderDetails.id}</h2>
                                    <span className={`px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest border shadow-sm ${getStatusColor(selectedOrderDetails.status)}`}>
                                        {selectedOrderDetails.status}
                                    </span>
                                </div>
                                <p className="text-sm text-gray-500 font-medium flex items-center gap-1.5">
                                    <CalendarDays size={14} className="text-gray-400" />
                                    Placed on {formatDate(selectedOrderDetails.createdAt)}
                                </p>
                            </div>
                           <div className="flex items-center gap-3">
                                {/* BUTON DESCARCARE PDF */}
                                {selectedOrderDetails.status !== 'CANCELLED' && (
                                    <button
                                        onClick={() => generateInvoicePDF(selectedOrderDetails, selectedOrderDetails.userEmail)}
                                        className="text-[#134c9c] hover:text-white transition-colors bg-blue-50 hover:bg-[#134c9c] px-4 py-2 rounded-full shadow-sm border border-blue-200 flex items-center gap-2 font-bold text-sm"
                                        title="Download Invoice PDF"
                                    >
                                        <Download size={16} strokeWidth={2.5} />
                                        <span className="hidden sm:inline">Invoice</span>
                                    </button>
                                )}

                                {/* BUTONUL DE X (INCHIDERE MODAL) */}
                                <button
                                    onClick={() => setSelectedOrderDetails(null)}
                                    className="text-gray-400 hover:text-red-500 transition-colors bg-white hover:bg-red-50 p-2 rounded-full shadow-sm border border-gray-200"
                                >
                                    <X size={20} strokeWidth={3} />
                                </button>
                            </div>
                        </div>

                        {/* Continutul scrollabil (Produsele) */}
                        <div className="p-6 sm:p-8 overflow-y-auto flex-1 bg-white">
                            <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest mb-4">
                                Items Ordered ({selectedOrderDetails.items.length})
                            </h3>
                            <div className="space-y-3">
                                {selectedOrderDetails.items.map((item, idx) => {
                                    const isReduced = item.basePrice > item.price;

                                    return (
                                        <div key={idx} className={`flex items-center gap-4 p-4 rounded-2xl border bg-white hover:bg-blue-50/30 transition-colors ${isReduced ? 'border-orange-100 bg-orange-50/10' : 'border-gray-100'}`}>
                                            <div className="w-16 h-16 bg-white border border-gray-100 shadow-sm rounded-xl flex items-center justify-center p-1 shrink-0 relative">
                                                {item.imageUrl ? (
                                                    <img src={item.imageUrl} alt={item.productName} className="w-full h-full object-contain" />
                                                ) : (
                                                    <PackageOpen size={24} className="text-gray-300" />
                                                )}
                                            </div>

                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center gap-2 mb-1">
                                                    <p className="font-bold text-gray-900 truncate">{item.productName}</p>
                                                    {isReduced && (
                                                        <span className="bg-gradient-to-r from-orange-500 to-red-500 text-white text-[9px] font-black uppercase tracking-widest px-1.5 py-0.5 rounded">
                                                            Reduced
                                                        </span>
                                                    )}
                                                </div>

                                                <div className="flex items-center gap-2">
                                                    <span className="text-xs text-gray-500 font-bold bg-gray-100 px-2 py-0.5 rounded">
                                                        Quantity: {item.quantity}
                                                    </span>
                                                    <span className="text-xs font-medium text-gray-500">
                                                        &times;
                                                        {isReduced ? (
                                                            <span className="ml-1">
                                                                <span className="line-through text-gray-300 mr-1">{item.basePrice.toFixed(2)}</span>
                                                                <span className="text-red-600 font-bold">{item.price.toFixed(2)} Lei</span>
                                                            </span>
                                                        ) : (
                                                            <span className="ml-1 text-gray-600">{item.price.toFixed(2)} Lei</span>
                                                        )}
                                                    </span>
                                                </div>
                                            </div>
                                            <div className="text-right shrink-0">
                                                <p className="font-black text-gray-900 text-lg">{item.subTotal.toFixed(2)} <span className="text-xs text-gray-400">LEI</span></p>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>

                        {/* Footer-ul cu Totalul si Calcule Promo */}
                        <div className="p-6 sm:p-8 bg-gray-50/80 border-t border-gray-100 flex flex-col gap-3 shrink-0">
                            {/* Calculam daca s-a folosit promo code pe toata comanda */}
                            {(() => {
                                const sumOfItems = selectedOrderDetails.items.reduce((acc, it) => acc + (it.subTotal), 0);
                                const promoDiscount = sumOfItems - selectedOrderDetails.totalPrice;

                                // Afisam doar daca discount-ul este mai mare de 0.05 lei (ca sa evitam erori de rotunjire float)
                                if (promoDiscount > 0.05) {
                                    return (
                                        <div className="flex justify-between items-center text-sm font-bold text-orange-600 mb-2 border-b border-gray-200/50 pb-3">
                                            <span className="flex items-center gap-1.5"><Tag size={16} /> Promo Code Applied</span>
                                            <span>-{promoDiscount.toFixed(2)} LEI</span>
                                        </div>
                                    );
                                }
                                return null;
                            })()}

                            <div className="flex justify-between items-end">
                                <div>
                                    <p className="text-gray-500 font-bold uppercase tracking-widest text-[10px] mb-1">Total Amount</p>
                                    <p className="text-xs text-gray-400">Includes all taxes & delivery</p>
                                </div>
                                <div className="text-right">
                                    <p className="text-3xl font-black text-[#134c9c] leading-none tracking-tighter">
                                        {selectedOrderDetails.totalPrice.toFixed(2)} <span className="text-sm text-gray-500">LEI</span>
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* --- MODAL PENTRU ADAUGARE DISCOUNT NOU --- */}
            {isAddDiscountModalOpen && (
                <div className="fixed inset-0 z-[120] flex items-center justify-center bg-black/60 backdrop-blur-sm px-4 py-10">
                    <div className="bg-white rounded-3xl p-8 max-w-md w-full shadow-2xl relative animate-in zoom-in-95">
                        <button onClick={() => setIsAddDiscountModalOpen(false)} className="absolute top-5 right-5 text-gray-400 hover:text-gray-800 transition-colors bg-gray-100 p-2 rounded-full">
                            <X size={20} strokeWidth={3} />
                        </button>

                        <div className="flex items-center gap-3 mb-6">
                            <div className="w-12 h-12 rounded-full flex items-center justify-center bg-blue-50 text-blue-600">
                                <Tag size={24} />
                            </div>
                            <h2 className="text-2xl font-black text-gray-900">Add New Discount</h2>
                        </div>

                        <div className="space-y-6 mb-8">
                            <div className="space-y-2">
                                <label className="text-xs font-bold text-gray-500 uppercase tracking-widest ml-1">Select Product</label>
                                <Select value={newDiscountProductId} onValueChange={setNewDiscountProductId}>
                                    <SelectTrigger className="h-16 border-gray-200 bg-gray-50 rounded-xl">
                                        <SelectValue placeholder="Choose a product" />
                                    </SelectTrigger>
                                    
                                    {/* Dropdown-ul cu imagini si detalii */}
                                    <SelectContent className="max-h-[300px] z-[150]">
                                        {products.map(p => (
                                            <SelectItem key={p.id} value={p.id.toString()} className="py-3 cursor-pointer hover:bg-blue-50/50">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-10 h-10 bg-white border border-gray-200 rounded-lg p-1 shrink-0 flex items-center justify-center">
                                                        <img src={p.imageUrls?.[0] || "https://placehold.co/100?text=No+Img"} alt="" className="w-full h-full object-contain" />
                                                    </div>
                                                    <div className="flex flex-col text-left">
                                                        <span className="font-bold text-gray-900">{p.name}</span>
                                                        <span className="text-[10px] text-gray-500 font-medium tracking-wide">ID: #{p.id} | Base: {p.price} Lei</span>
                                                    </div>
                                                </div>
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="space-y-4">
                                <label className="text-xs font-bold text-gray-500 uppercase tracking-widest ml-1 flex justify-between">
                                    <span>Discount Percentage</span>
                                    <span className="text-[#134c9c] font-black">{newDiscountPercentage}%</span>
                                </label>
                                
                                {/* Slider + Input */}
                                <div className="flex items-center gap-4">
                                    <input 
                                        type="range" 
                                        min="1" 
                                        max="99" 
                                        value={newDiscountPercentage} 
                                        onChange={(e) => setNewDiscountPercentage(Number(e.target.value))}
                                        className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-[#134c9c]"
                                    />
                                    <div className="shrink-0 relative">
                                        <Input 
                                            type="number" 
                                            min="1" 
                                            max="99" 
                                            value={newDiscountPercentage} 
                                            onChange={(e) => setNewDiscountPercentage(Number(e.target.value))} 
                                            className="w-20 h-12 bg-gray-50 border-gray-200 rounded-xl font-bold text-lg text-center pr-6" 
                                        />
                                        <span className="absolute right-3 top-1/2 -translate-y-1/2 font-bold text-gray-400">%</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="flex gap-3">
                            <Button type="button" onClick={() => setIsAddDiscountModalOpen(false)} variant="outline" className="flex-1 h-14 text-sm font-bold rounded-xl border-2">Cancel</Button>
                            <Button
                                onClick={handleAddDiscountSubmit}
                                disabled={!newDiscountProductId}
                                className="flex-1 h-14 text-sm font-bold rounded-xl shadow-md bg-[#134c9c] hover:bg-blue-800 text-white disabled:opacity-50"
                            >
                                Apply Discount
                            </Button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}