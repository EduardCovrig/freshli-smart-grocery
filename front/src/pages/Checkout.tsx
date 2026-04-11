import { useEffect, useState } from "react";
import { useCart } from "@/context/CartContext";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Link, useNavigate } from "react-router-dom";
import { loadStripe } from "@stripe/stripe-js";
import { Elements, CardElement, useStripe, useElements } from "@stripe/react-stripe-js";
import { CheckCircle2, CreditCard, Banknote, MapPin, Loader2, Plus, AlertTriangle, ShoppingBag, Store, Package, ArrowLeft, Receipt, Tag, Lock } from "lucide-react";
import axios from "axios";
import { generateInvoicePDF } from "@/lib/pdfGenerator";

const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLIC_KEY || "");

interface Address {
    id: number;
    street: string;
    city: string;
    zipCode: string;
    country: string;
    isDefaultDelivery: boolean;
}

// Formular de plata stripe
const StripePaymentForm = ({
    clientSecret, onSuccess, onError, isProcessing, setIsProcessing, totalAmount, canPay
}: {
    clientSecret: string, onSuccess: (paymentIntentId: string) => void, onError: (msg: string) => void, isProcessing: boolean, setIsProcessing: (val: boolean) => void, totalAmount: number,
    canPay: boolean
}) => {
    const stripe = useStripe();
    const elements = useElements();
    const { user } = useAuth();
    const [cardName, setCardName] = useState(user?.firstName ? `${user.firstName} ${user.lastName}` : "");

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!stripe || !elements) return;

        setIsProcessing(true);
        const cardElement = elements.getElement(CardElement);
        if (!cardElement) { setIsProcessing(false); return; }

        const { error, paymentIntent } = await stripe.confirmCardPayment(clientSecret, {
            payment_method: {
                card: cardElement,
                billing_details: { name: cardName },
            },
        });

        if (error) {
            onError(error.message || "A apărut o eroare la procesarea plății.");
            setIsProcessing(false);
        } else if (paymentIntent && paymentIntent.status === "succeeded") {
            onSuccess(paymentIntent.id);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="mt-6 p-5 border border-blue-100 bg-blue-50/50 rounded-2xl space-y-4 animate-in fade-in slide-in-from-top-4">
            <div className="flex items-center gap-2 mb-2 text-gray-700 border-b border-gray-200/50 pb-3">
                <Lock size={16} className="text-[#134c9c]" />
                <h3 className="font-black text-sm text-gray-900 uppercase tracking-widest">Secure Payment</h3>
            </div>
            <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest ml-1">Name on Card</label>
                <Input placeholder="JOHN DOE" value={cardName} onChange={(e) => setCardName(e.target.value.toUpperCase())} className="bg-white border-gray-200 h-11 rounded-xl uppercase font-medium focus-visible:ring-[#134c9c] text-sm" required />
            </div>
            <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest ml-1">Card Details</label>
                <div className="bg-white border border-gray-200 p-3.5 rounded-xl shadow-sm focus-within:ring-1 focus-within:ring-[#134c9c] transition-all">
                    <CardElement options={{ hidePostalCode: true, style: { base: { fontSize: '14px', fontFamily: 'monospace', color: '#1f2937', '::placeholder': { color: '#9ca3af' } } } }} />
                </div>
            </div>
            <Button type="submit" disabled={!stripe || isProcessing || !canPay} className="w-full h-14 rounded-2xl bg-[#134c9c] hover:bg-[#0f3d7d] text-white font-black text-lg shadow-xl shadow-blue-900/20 hover:-translate-y-0.5 transition-all mt-6 flex gap-2 disabled:shadow-none disabled:hover:translate-y-0">
                {isProcessing ? <Loader2 className="animate-spin w-5 h-5" /> : <><CheckCircle2 size={20} /> Pay {totalAmount.toFixed(2)} LEI</>}
            </Button>
            <p className="text-center text-[9px] text-gray-400 font-bold tracking-widest uppercase mt-3">Encrypted & Processed by Stripe</p>
        </form>
    );
};

export default function Checkout() {
    const { cartItems, fetchCart } = useCart();
    const { token, user } = useAuth();
    const navigate = useNavigate();

    const [addresses, setAddresses] = useState<Address[]>([]);
    const [selectedAddressId, setSelectedAddressId] = useState<number | null>(null);
    const [isLoadingAddresses, setIsLoadingAddresses] = useState(true);
    const [actualUserId, setActualUserId] = useState<number | null>(null);

    const [showAddAddressForm, setShowAddAddressForm] = useState(false);
    const [newAddress, setNewAddress] = useState({ street: "", city: "", zipCode: "", country: "Romania" });

    const [paymentMethod, setPaymentMethod] = useState<'CARD' | 'CASH'>('CARD');
    const [promoCode, setPromoCode] = useState("");
    const [appliedPromo, setAppliedPromo] = useState(false);
    const [isApplyingPromo, setIsApplyingPromo] = useState(false);
    const [discountPercent, setDiscountPercent] = useState(0);

    const [isPlacingOrder, setIsPlacingOrder] = useState(false);
    const [orderSuccess, setOrderSuccess] = useState(false);
    const [errorMsg, setErrorMsg] = useState("");

    const [savedOrderDetails, setSavedOrderDetails] = useState<any>(null);
    const [clientSecret, setClientSecret] = useState<string | null>(null);
    const [isGeneratingPaymentIntent, setIsGeneratingPaymentIntent] = useState(false);

    const rawTotal = cartItems.reduce((acc, item) => acc + item.subTotal, 0);
    const finalTotal = appliedPromo ? rawTotal * (1 - (discountPercent / 100)) : rawTotal;

    const fetchAddresses = async () => {
        setIsLoadingAddresses(true);
        try {
            const apiUrl = import.meta.env.VITE_API_URL;
            if (!actualUserId) {
                const meRes = await axios.get(`${apiUrl}/users/me`, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                setActualUserId(meRes.data.id);
            }

            const res = await axios.get(`${apiUrl}/addresses`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setAddresses(res.data);

            if (res.data.length > 0) {
                const def = res.data.find((a: Address) => a.isDefaultDelivery);
                setSelectedAddressId(def ? def.id : res.data[0].id);
            }
        } catch (err) {
            console.error(err);
        } finally {
            setIsLoadingAddresses(false);
        }
    };

    useEffect(() => {
        fetchAddresses();
    }, []);

    useEffect(() => {
        const getPaymentIntent = async () => {
            if (paymentMethod !== 'CARD' || cartItems.length === 0) {
                setClientSecret(null); return;
            }
            setIsGeneratingPaymentIntent(true);
            try {
                const apiUrl = import.meta.env.VITE_API_URL;
                const response = await axios.post(`${apiUrl}/payments/create-intent`,
                    { amount: finalTotal, currency: "ron" },
                    { headers: { Authorization: `Bearer ${token}` } });
                setClientSecret(response.data.clientSecret);
            } catch (err) {
                setErrorMsg("Payment system unavailable. Please select Cash on Delivery.");
            } finally {
                setIsGeneratingPaymentIntent(false);
            }
        };
        getPaymentIntent();
    }, [finalTotal, paymentMethod, cartItems.length, token]);

    const handleQuickAddAddress = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const apiUrl = import.meta.env.VITE_API_URL;
            const isFirstAddress = addresses.length === 0;
            const payload = { ...newAddress, isDefaultDelivery: isFirstAddress, userId: actualUserId };

            await axios.post(`${apiUrl}/addresses`, payload, {
                headers: { Authorization: `Bearer ${token}` }
            });

            setShowAddAddressForm(false);
            setNewAddress({ street: "", city: "", zipCode: "", country: "Romania" });
            await fetchAddresses();
        } catch (err) {
            console.error("Eroare la adaugarea adresei", err);
        }
    };

    const handleSetDefaultAddress = async (e: React.MouseEvent, addr: Address) => {
        e.stopPropagation();
        try {
            const apiUrl = import.meta.env.VITE_API_URL;
            const payload = {
                street: addr.street,
                city: addr.city,
                zipCode: addr.zipCode,
                country: addr.country,
                isDefaultDelivery: true,
                userId: actualUserId
            };

            await axios.put(`${apiUrl}/addresses/${addr.id}`, payload, {
                headers: { Authorization: `Bearer ${token}` }
            });

            await fetchAddresses();
        } catch (err) {
            console.error("Eroare la setarea adresei default", err);
        }
    };

    const handleApplyPromo = async () => {
        setIsApplyingPromo(true);
        await new Promise(resolve => setTimeout(resolve, 600));
        const code = promoCode.trim().toUpperCase();

        if (code === "LICENTA10") {
            setAppliedPromo(true);
            setDiscountPercent(10);
            setErrorMsg("");
        } else if (code === `COMEBACK20-U${actualUserId}`) {
            setAppliedPromo(true);
            setDiscountPercent(20);
            setErrorMsg("");
        } else {
            setAppliedPromo(false);
            setDiscountPercent(0);
            setErrorMsg("Invalid promo code.");
        }
        setIsApplyingPromo(false);
    };

    const placeOrderInDatabase = async () => {
        if (!selectedAddressId) {
            setErrorMsg("Please select a delivery address.");
            return;
        }

        setIsPlacingOrder(true);
        setErrorMsg("");

        try {
            const apiUrl = import.meta.env.VITE_API_URL;
            const payload = {
                addressId: selectedAddressId,
                paymentMethod: paymentMethod,
                promoCode: appliedPromo ? promoCode.trim().toUpperCase() : ""
            };

            const res = await axios.post(`${apiUrl}/orders`, payload, {
                headers: { Authorization: `Bearer ${token}` }
            });

            const savedOrder = res.data;
            setSavedOrderDetails(savedOrder);

            const storageKey = user?.sub ? `userNotifs_${user.sub}` : 'userNotifs';
            const newNotif = {
                id: Date.now(),
                orderId: savedOrder.id,
                message: `Order #${savedOrder.id} has been placed successfully and is now Confirmed.`,
                date: new Date().toISOString(),
                read: false
            };
            const existingNotifs = JSON.parse(localStorage.getItem(storageKey) || '[]');
            localStorage.setItem(storageKey, JSON.stringify([newNotif, ...existingNotifs]));
            window.dispatchEvent(new Event('new_notification'));

            await fetchCart();
            setOrderSuccess(true);

        } catch (err: any) {
            console.error("Order error:", err);
            const backendMessage = err.response?.data?.message || err.response?.data || "An error occurred during checkout.";

            if (typeof backendMessage === 'string' && (backendMessage.toLowerCase().includes("stoc") || backendMessage.toLowerCase().includes("stock"))) {
                setErrorMsg("Stock levels changed. Returning you to cart to review your items...");
                setTimeout(() => {
                    navigate("/cart");
                }, 3000);
            } else {
                setErrorMsg(typeof backendMessage === 'string' ? backendMessage : "Failed to place order. Please try again.");
            }
        } finally {
            setIsPlacingOrder(false); 
        }
    };

    const handlePlaceOrderCash = async () => {
        setIsPlacingOrder(true);
        await new Promise(resolve => setTimeout(resolve, 800));
        await placeOrderInDatabase();
    };

    const sortedAddresses = [...addresses].sort((a, b) => a.id - b.id);

    // Helper funcție pentru display u.m. cum e pe Profile
    const getDisplayUnit = (unit: string | undefined) => {
        if (!unit) return 'buc';
        const u = unit.toLowerCase().trim();
        
        if (['l', 'ml', 'litru', 'litri'].includes(u)) return 'buc';
        if (['g', 'gr', 'gram', 'kg', 'kilogram'].includes(u)) return '100g';
        if (['buc', 'bucata'].includes(u)) return 'piece';
        
        return unit; 
    };

    if (orderSuccess && savedOrderDetails) {
        return (
            <div className="min-h-[90vh] bg-[#f8fafc] flex flex-col items-center justify-center p-4">
                <div className="bg-white max-w-xl w-full p-10 md:p-14 rounded-[3rem] shadow-xl shadow-green-900/5 border border-gray-100 flex flex-col items-center text-center animate-in zoom-in-95 fade-in duration-500 relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-green-400/10 rounded-full blur-[60px] -translate-y-1/2 translate-x-1/3 pointer-events-none"></div>
                    <div className="relative mb-8">
                        <div className="w-24 h-24 bg-green-50 rounded-full flex items-center justify-center">
                            <CheckCircle2 size={50} className="text-green-500" strokeWidth={2.5} />
                        </div>
                    </div>
                    <h1 className="text-4xl font-black text-gray-900 mb-4 tracking-tight">Order Confirmed!</h1>
                   <div className="flex flex-col items-center mb-10">
                        <p className="text-gray-500 text-lg leading-relaxed mb-6">
                            Thank you, <span className="inline-block font-bold text-[#134c9c]">{user?.firstName}</span>! Your order has been successfully placed and is now being processed.
                        </p>
                        <Button 
                            onClick={() => generateInvoicePDF(savedOrderDetails, `${user?.firstName} ${user?.lastName}`)}
                            variant="outline" 
                            className="h-12 px-6 rounded-xl font-bold border-2 border-gray-200 hover:border-[#134c9c] hover:text-[#134c9c] hover:bg-blue-50 transition-all flex items-center gap-2"
                        >
                            <Receipt size={18} /> Download Invoice PDF
                        </Button>
                    </div>
                    <div className="w-full flex flex-col sm:flex-row gap-4 relative z-10">
                        <Link to="/" className="flex-1">
                            <Button variant="outline" className="w-full h-14 rounded-2xl font-bold border-2 border-gray-200 hover:border-[#134c9c] hover:text-[#134c9c] hover:bg-blue-50 text-lg transition-all">
                                Continue Shopping
                            </Button>
                        </Link>
                        <Link to="/profile" state={{ tab: 'orders' }} className="flex-1">
                            <Button className="w-full h-14 rounded-2xl bg-[#134c9c] hover:bg-[#0f3d7d] text-white font-black text-lg shadow-lg shadow-blue-900/20 hover:-translate-y-1 transition-all flex items-center gap-2">
                                <Package size={20} />
                                See your orders
                            </Button>
                        </Link>
                    </div>
                </div>
            </div>
        );
    }

    if (cartItems.length === 0 && !orderSuccess) {
        return (
            <div className="min-h-[90vh] relative bg-slate-50 flex flex-col items-center justify-center p-4 overflow-hidden">
                {/* BACKGROUND EFFECTS */}
                <div className="absolute inset-0 w-full h-full z-0 pointer-events-none">
                    <div className="absolute top-[-10%] left-[-10%] w-[40vw] h-[40vw] max-w-[500px] max-h-[500px] rounded-full bg-blue-400/20 mix-blend-multiply filter blur-[80px] opacity-70 animate-blob"></div>
                    <div className="absolute top-[40%] right-[-5%] w-[35vw] h-[35vw] max-w-[400px] max-h-[400px] rounded-full bg-cyan-300/20 mix-blend-multiply filter blur-[80px] opacity-70 animate-blob" style={{ animationDelay: "2s" }}></div>
                    <div className="absolute bottom-[-10%] left-[20%] w-[45vw] h-[45vw] max-w-[600px] max-h-[600px] rounded-full bg-indigo-300/20 mix-blend-multiply filter blur-[80px] opacity-70 animate-blob" style={{ animationDelay: "4s" }}></div>
                </div>

                <div className="bg-white/70 backdrop-blur-xl max-w-xl w-full p-10 md:p-14 rounded-[3rem] shadow-xl shadow-blue-900/5 border border-white/50 flex flex-col items-center text-center animate-in zoom-in-95 fade-in duration-500 relative z-10">
                    <div className="p-8 bg-gray-50/80 rounded-full mb-8 shadow-inner">
                        <ShoppingBag size={64} className="text-gray-300" />
                    </div>
                    <h1 className="font-black text-4xl text-gray-900 mb-4 tracking-tight">
                        Your cart is empty
                    </h1>
                    <div className="text-gray-500 mb-10 text-lg leading-relaxed">
                        <p>You cannot checkout without any items.</p>
                        <p>Fill your cart by exploring our <strong className="text-[#134c9c]">fresh</strong> groceries.</p>
                    </div>
                    <Link to='/' className="w-full relative z-10">
                        <Button className="w-full h-auto min-h-[3.5rem] py-3 px-4 rounded-2xl bg-[#134c9c] hover:bg-[#0f3d7d] text-white font-black text-sm sm:text-base md:text-lg shadow-xl shadow-blue-900/20 hover:-translate-y-1 transition-all flex flex-row items-center justify-center gap-2 sm:gap-3">
                            <Store className="w-5 h-5 sm:w-6 sm:h-6 shrink-0" />
                            <span className="whitespace-normal sm:whitespace-nowrap text-center leading-tight">Search for groceries</span>
                        </Button>
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-[90vh] relative bg-slate-50 py-10 px-4 sm:px-6 lg:px-8 overflow-hidden">
            {/* BACKGROUND EFFECTS */}
            <div className="absolute inset-0 w-full h-full z-0 pointer-events-none">
                <div className="absolute top-[-10%] left-[-10%] w-[40vw] h-[40vw] max-w-[500px] max-h-[500px] rounded-full bg-blue-400/20 mix-blend-multiply filter blur-[80px] opacity-70 animate-blob"></div>
                <div className="absolute top-[40%] right-[-5%] w-[35vw] h-[35vw] max-w-[400px] max-h-[400px] rounded-full bg-cyan-300/20 mix-blend-multiply filter blur-[80px] opacity-70 animate-blob" style={{ animationDelay: "2s" }}></div>
                <div className="absolute bottom-[-10%] left-[20%] w-[45vw] h-[45vw] max-w-[600px] max-h-[600px] rounded-full bg-indigo-300/20 mix-blend-multiply filter blur-[80px] opacity-70 animate-blob" style={{ animationDelay: "4s" }}></div>
            </div>

            <div className="max-w-6xl mx-auto relative z-10">

                {/* BUTON BACK SI TITLU */}
                <div className="mb-8">
                    <Link to="/cart" className="inline-flex items-center gap-2 text-sm font-bold text-gray-500 hover:text-[#134c9c] transition-colors mb-4 bg-white/50 backdrop-blur-md px-3 py-1.5 rounded-full border border-white/50">
                        <ArrowLeft size={16} strokeWidth={3} /> Return to Cart
                    </Link>
                    <h1 className="text-3xl font-black text-gray-900 mb-8 flex items-center gap-3 tracking-tight">
                        <Receipt size={28} className="text-[#134c9c]" />
                        Checkout
                    </h1>
                </div>

                {errorMsg && (
                    <div className="mb-8 p-5 bg-red-50 text-red-700 border border-red-200 rounded-2xl flex items-center gap-3 animate-in fade-in shadow-sm">
                        <AlertTriangle size={24} />
                        <span className="font-bold text-lg">{errorMsg}</span>
                    </div>
                )}

                {/* GRID 12 COLOANE PENTRU O PROPORTIE MAI BUNA (7 Stanga / 5 Dreapta) */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">

                    {/* COLOANA STANGA (Adresa + Sumar Produse) */}
                    <div className="lg:col-span-7 xl:col-span-7 space-y-8">

                        {/* 1. ADRESA DE LIVRARE */}
                        <div className="bg-white/80 backdrop-blur-2xl p-6 sm:p-8 rounded-[2.5rem] shadow-sm border border-white/60">
                            <div className="flex items-center gap-3 mb-8 border-b border-gray-100 pb-6">
                                <div className="p-3 bg-blue-50 text-[#134c9c] rounded-2xl">
                                    <MapPin size={24} />
                                </div>
                                <h2 className="text-2xl font-black text-gray-900 tracking-tight">Delivery Address</h2>
                            </div>

                            {isLoadingAddresses ? (
                                <div className="flex justify-center py-10"><Loader2 className="animate-spin text-[#134c9c]" size={40} /></div>
                            ) : (
                                <div className="space-y-6">
                                    {addresses.length > 0 && (
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                            {sortedAddresses.map((addr) => (
                                                <div
                                                    key={addr.id}
                                                    onClick={() => setSelectedAddressId(addr.id)}
                                                    className={`p-5 rounded-2xl border-2 cursor-pointer transition-all flex flex-col justify-between ${selectedAddressId === addr.id ? "border-[#134c9c] bg-blue-50/80 shadow-md" : "border-gray-100 hover:border-blue-200 hover:bg-gray-50 bg-white/50"}`}
                                                >
                                                    <div>
                                                        <div className="flex justify-between items-start mb-2">
                                                            <p className="font-black text-gray-900 text-lg">{addr.city}</p>
                                                            {addr.isDefaultDelivery && <span className="bg-blue-100 text-blue-700 text-[10px] px-2 py-0.5 rounded-md uppercase font-black tracking-widest">Default</span>}
                                                        </div>
                                                        <p className="text-sm font-medium text-gray-600 mb-1">{addr.street}</p>
                                                        <p className="text-xs font-bold text-gray-400">{addr.zipCode}, {addr.country}</p>
                                                    </div>

                                                    {!addr.isDefaultDelivery && (
                                                        <div className="mt-4 pt-3 border-t border-gray-200/60">
                                                            <button
                                                                onClick={(e) => handleSetDefaultAddress(e, addr)}
                                                                className="text-xs font-bold text-gray-500 hover:text-[#134c9c] transition-colors"
                                                            >
                                                                Make Default
                                                            </button>
                                                        </div>
                                                    )}
                                                </div>
                                            ))}
                                        </div>
                                    )}

                                    {showAddAddressForm ? (
                                        <div className="mt-8 p-6 border border-blue-100 bg-blue-50/50 rounded-2xl relative animate-in fade-in">
                                            <h3 className="text-base font-black text-gray-900 mb-6 flex items-center gap-2"><Plus size={18} className="text-[#134c9c]" /> Add New Address</h3>
                                            <form onSubmit={handleQuickAddAddress} className="space-y-4">
                                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                                    <div className="space-y-1.5">
                                                        <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest ml-1">Street</label>
                                                        <Input required value={newAddress.street} onChange={(e) => setNewAddress({ ...newAddress, street: e.target.value })} placeholder="e.g. Str. Principala 1" className="bg-white border-gray-200 h-11 rounded-xl focus-visible:ring-[#134c9c]" />
                                                    </div>
                                                    <div className="space-y-1.5">
                                                        <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest ml-1">City</label>
                                                        <Input required value={newAddress.city} onChange={(e) => setNewAddress({ ...newAddress, city: e.target.value })} placeholder="Bucharest" className="bg-white border-gray-200 h-11 rounded-xl focus-visible:ring-[#134c9c]" />
                                                    </div>
                                                    <div className="space-y-1.5">
                                                        <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest ml-1">Postal Code</label>
                                                        <Input required value={newAddress.zipCode} onChange={(e) => setNewAddress({ ...newAddress, zipCode: e.target.value })} placeholder="012345" className="bg-white border-gray-200 h-11 rounded-xl focus-visible:ring-[#134c9c]" />
                                                    </div>
                                                    <div className="space-y-1.5">
                                                        <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest ml-1">Country</label>
                                                        <Input required value={newAddress.country} onChange={(e) => setNewAddress({ ...newAddress, country: e.target.value })} disabled className="bg-gray-100 text-gray-500 border-gray-200 h-11 rounded-xl cursor-not-allowed" />
                                                    </div>
                                                </div>
                                                <div className="flex gap-3 pt-2">
                                                    <Button type="submit" className="bg-[#134c9c] hover:bg-[#0f3d7d] h-11 px-6 rounded-xl font-bold text-xs shadow-sm">Save Address</Button>
                                                    <Button type="button" variant="outline" onClick={() => setShowAddAddressForm(false)} className="h-11 px-6 rounded-xl font-bold border-2 text-xs">Cancel</Button>
                                                </div>
                                            </form>
                                        </div>
                                    ) : (
                                        <Button
                                            onClick={() => setShowAddAddressForm(true)}
                                            variant="outline"
                                            className="w-full mt-4 h-12 flex items-center justify-center gap-2 border-dashed border-2 border-gray-300 hover:border-[#134c9c] hover:bg-blue-50 text-gray-500 hover:text-[#134c9c] rounded-2xl font-bold transition-all text-sm bg-white/50"
                                        >
                                            <Plus size={18} /> Add Another Address
                                        </Button>
                                    )}
                                </div>
                            )}
                        </div>

                        {/* 2. REZUMAT PRODUSE (Mini List Scrollable) */}
                        <div className="bg-white/80 backdrop-blur-2xl p-6 sm:p-8 rounded-[2.5rem] shadow-sm border border-white/60">
                            <div className="flex items-center justify-between mb-6 border-b border-gray-100 pb-4">
                                <div className="flex items-center gap-3">
                                    <div className="p-3 bg-blue-50 text-[#134c9c] rounded-2xl">
                                        <ShoppingBag size={20} />
                                    </div>
                                    <h2 className="text-2xl font-black text-gray-900 tracking-tight">Review Items</h2>
                                </div>
                                <Link to="/cart" className="text-xs font-bold text-[#134c9c] bg-blue-50 px-3 py-1.5 rounded-lg hover:bg-[#134c9c] hover:text-white transition-colors">Edit Cart</Link>
                            </div>

                            <div className="space-y-3 max-h-[380px] overflow-y-auto pr-2 pb-2 
                                [&::-webkit-scrollbar]:w-1.5 
                                [&::-webkit-scrollbar-track]:bg-gray-50 
                                [&::-webkit-scrollbar-track]:rounded-full 
                                [&::-webkit-scrollbar-thumb]:bg-gray-200 
                                [&::-webkit-scrollbar-thumb]:rounded-full hover:[&::-webkit-scrollbar-thumb]:bg-gray-300">
                                {cartItems.map((item, idx) => {
                                    const isReduced = item.basePrice > item.pricePerUnit;
                                    
                                    return(
                                    <div key={idx} className="flex items-center gap-4 p-3 bg-white/60 hover:bg-white rounded-2xl transition-colors border border-gray-100/80 shadow-sm">
                                        <div className="w-16 h-16 bg-white border border-gray-100 rounded-xl p-1.5 flex-shrink-0 flex items-center justify-center shadow-sm">
                                            <img src={item.imageUrl || "https://placehold.co/100?text=No+Img"} alt={item.productName} className="w-full h-full object-contain" />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2 mb-1">
                                                <p className="font-bold text-gray-900 truncate text-sm">{item.productName}</p>
                                                {isReduced && (
                                                    <span className="bg-gradient-to-r from-orange-500 to-red-500 text-white text-[9px] font-black uppercase tracking-widest px-1.5 py-0.5 rounded shrink-0 shadow-sm">
                                                        Reduced
                                                    </span>
                                                )}
                                            </div>
                                            <div className="flex items-center gap-1.5 text-xs">
                                                <span className="text-gray-500 font-medium">
                                                    {item.quantity} &times;
                                                </span>
                                                {isReduced ? (
                                                    <div className="flex items-center gap-1.5">
                                                        <span className="line-through text-gray-300 font-medium">{item.basePrice.toFixed(2)}</span>
                                                        <span className="text-red-600 font-bold">{item.pricePerUnit.toFixed(2)} Lei / {getDisplayUnit(item.productUnit)}</span>
                                                    </div>
                                                ) : (
                                                    <span className="text-gray-600 font-medium">{item.pricePerUnit.toFixed(2)} Lei / {getDisplayUnit(item.productUnit)}</span>
                                                )}
                                            </div>
                                        </div>
                                        <div className="text-right flex-shrink-0">
                                            <p className="font-black text-[#134c9c] text-base">{item.subTotal.toFixed(2)} <span className="text-[10px] text-gray-400">LEI</span></p>
                                        </div>
                                    </div>
                                )})}
                            </div>
                        </div>

                    </div>

                    {/* COLOANA DREAPTA (Checkout & Payment - STICKY) */}
                    <div className="lg:col-span-5 xl:col-span-5 sticky top-28 space-y-6">
                        
                        <div className="bg-white/90 backdrop-blur-2xl p-6 sm:p-8 rounded-[2.5rem] shadow-2xl shadow-blue-900/10 border border-white/60">
                            <h2 className="text-2xl font-black text-gray-900 mb-6 border-b border-gray-100 pb-4 tracking-tight flex items-center gap-3">
                                <Receipt className="text-[#134c9c]" size={24}/> Order Summary
                            </h2>

                            {/* PROMO CODE INPUT */}
                            <div className="flex gap-2 mb-6 border-b border-gray-100 pb-6">
                                <div className="relative w-full">
                                    <Tag className="absolute left-3 top-3 text-gray-400" size={18} />
                                    <Input
                                        placeholder="Promo code"
                                        value={promoCode}
                                        onChange={(e) => setPromoCode(e.target.value.toUpperCase())}
                                        disabled={appliedPromo || isApplyingPromo}
                                        className="bg-gray-50 border-gray-200 h-12 rounded-xl font-bold uppercase tracking-widest pl-10 focus-visible:ring-[#134c9c] text-sm"
                                    />
                                </div>
                                <Button
                                    variant={appliedPromo ? "outline" : "default"}
                                    onClick={appliedPromo ? () => { setAppliedPromo(false); setPromoCode(""); } : handleApplyPromo}
                                    disabled={isApplyingPromo || !promoCode.trim()}
                                    className={`w-28 h-12 rounded-xl font-bold transition-all text-sm ${appliedPromo ? "text-red-500 border-red-200 hover:bg-red-50" : "bg-[#134c9c] hover:bg-[#0f3d7d] text-white shadow-md shadow-blue-900/10"}`}
                                >
                                    {isApplyingPromo ? <Loader2 className="animate-spin" size={18} /> : appliedPromo ? "Remove" : "Apply"}
                                </Button>
                            </div>

                            <div className="space-y-4 mb-6">
                                <div className="flex justify-between items-center text-gray-600 text-sm font-medium">
                                    <span>Products</span>
                                    <span className="font-bold text-gray-900">{rawTotal.toFixed(2)} Lei</span>
                                </div>
                                <div className="flex justify-between items-center text-gray-600 text-sm font-medium">
                                    <span>Delivery</span>
                                    <span className="text-green-600 font-bold bg-green-50 px-2 py-0.5 rounded text-[10px] uppercase tracking-wider border border-green-100">Free</span>
                                </div>
                                {appliedPromo && (
                                    <div className="flex justify-between items-center text-[#134c9c] text-sm font-bold bg-blue-50 p-2.5 rounded-lg border border-blue-100 shadow-sm animate-in fade-in">
                                        <span className="flex items-center gap-1.5"><Tag size={16} className="-mt-0.5 text-blue-500" /> Promo ({promoCode})</span>
                                        <span>-{discountPercent}%</span>
                                    </div>
                                )}
                                
                                <div className="pt-4 mt-4 border-t border-gray-200 border-dashed">
                                    <div className="flex justify-between items-end">
                                        <div>
                                            <p className="text-lg font-black text-gray-900 uppercase tracking-tight">Total</p>
                                            <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mt-0.5">Taxes & VAT Included</p>
                                        </div>
                                        <div className="text-right">
                                            {appliedPromo && <span className="text-xs text-gray-400 line-through mr-2">{rawTotal.toFixed(2)} Lei</span>}
                                            <span className="text-4xl font-black text-[#134c9c] tracking-tighter">
                                                {finalTotal.toFixed(2)} <span className="text-base text-gray-400">Lei</span>
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* SELECTIE PLATA */}
                            <div className="mt-8">
                                <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest mb-3">Select Payment Method</h3>
                                <div className="grid grid-cols-2 gap-3 mb-2">
                                    <button
                                        onClick={() => setPaymentMethod('CARD')}
                                        className={`flex items-center justify-center py-3 px-2 rounded-xl border-2 transition-all gap-2 ${paymentMethod === 'CARD' ? "border-[#134c9c] bg-blue-50 text-[#134c9c] shadow-sm" : "border-gray-100 hover:border-blue-200 hover:bg-gray-50 text-gray-500 bg-white"}`}
                                    >
                                        <CreditCard size={18} />
                                        <span className="font-bold text-xs uppercase tracking-wider">Card</span>
                                    </button>
                                    <button
                                        onClick={() => setPaymentMethod('CASH')}
                                        className={`flex items-center justify-center py-3 px-2 rounded-xl border-2 transition-all gap-2 ${paymentMethod === 'CASH' ? "border-green-500 bg-green-50 text-green-700 shadow-sm" : "border-gray-100 hover:border-green-200 hover:bg-gray-50 text-gray-500 bg-white"}`}
                                    >
                                        <Banknote size={18} />
                                        <span className="font-bold text-xs uppercase tracking-wider">Cash</span>
                                    </button>
                                </div>

                                {/* UI PENTRU CARD BANCAR SAU CASH */}
                                {paymentMethod === 'CARD' ? (
                                    <>
                                        {isGeneratingPaymentIntent ? (
                                            <div className="mt-6 flex flex-col items-center justify-center p-6 border border-gray-100 bg-gray-50 rounded-2xl gap-3">
                                                <Loader2 className="animate-spin text-[#134c9c]" size={24} />
                                                <span className="font-bold text-[10px] text-gray-500 uppercase tracking-widest text-center">Connecting to secure gateway...</span>
                                            </div>
                                        ) : clientSecret ? (
                                            <Elements stripe={stripePromise} options={{ clientSecret }}>
                                                <StripePaymentForm
                                                    clientSecret={clientSecret}
                                                    onSuccess={placeOrderInDatabase}
                                                    onError={setErrorMsg}
                                                    isProcessing={isPlacingOrder}
                                                    setIsProcessing={setIsPlacingOrder}
                                                    totalAmount={finalTotal}
                                                    canPay={selectedAddressId !== null}
                                                />
                                            </Elements>
                                        ) : (
                                            <div className="mt-4 p-4 text-center text-xs text-red-500 font-bold bg-red-50 rounded-xl">
                                                Could not initialize payment. Please try again.
                                            </div>
                                        )}
                                    </>
                                ) : (
                                    <Button
                                        onClick={handlePlaceOrderCash}
                                        disabled={isPlacingOrder || addresses.length === 0 || selectedAddressId === null}
                                        className="w-full h-14 mt-6 rounded-2xl bg-[#134c9c] hover:bg-[#0f3d7d] text-white font-black text-lg shadow-lg shadow-blue-900/20 hover:-translate-y-0.5 transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:hover:translate-y-0 disabled:shadow-none"
                                    >
                                        {isPlacingOrder ? <Loader2 className="animate-spin w-5 h-5" /> : <><CheckCircle2 size={20} /> Confirm Order</>}
                                    </Button>
                                )}
                            </div>
                        </div>

                    </div>

                </div>
            </div>
        </div>
    );
}