import { useEffect, useState } from "react";
import { useCart } from "@/context/CartContext";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Link, useNavigate} from "react-router-dom";
import { CheckCircle2, CreditCard, Banknote, MapPin, Loader2, Plus, AlertTriangle, ShoppingBag, Store, Package, ArrowLeft, Receipt } from "lucide-react";
import axios from "axios";

interface Address {
    id: number;
    street: string;
    city: string;
    zipCode: string;
    country: string;
    isDefaultDelivery: boolean;
}

export default function Checkout() {
    const { cartItems, fetchCart } = useCart();
    const { token, user } = useAuth();
    const navigate = useNavigate();

    // Stari pentru preluare adrese si selectie
    const [addresses, setAddresses] = useState<Address[]>([]);
    const [selectedAddressId, setSelectedAddressId] = useState<number | null>(null);
    const [isLoadingAddresses, setIsLoadingAddresses] = useState(true);
    const [actualUserId, setActualUserId] = useState<number | null>(null);

    // Stare pentru un formular rapid de adaugare adresa
    const [showAddAddressForm, setShowAddAddressForm] = useState(false);
    const [newAddress, setNewAddress] = useState({ street: "", city: "", zipCode: "", country: "Romania" });

    // Stari pentru comanda
    const [paymentMethod, setPaymentMethod] = useState<'CARD' | 'CASH'>('CARD');
    const [promoCode, setPromoCode] = useState("");
    const [appliedPromo, setAppliedPromo] = useState(false);
    const [isApplyingPromo, setIsApplyingPromo] = useState(false);
    const [discountPercent, setDiscountPercent] = useState(0);

    const [isPlacingOrder, setIsPlacingOrder] = useState(false);
    const [orderSuccess, setOrderSuccess] = useState(false);
    const [errorMsg, setErrorMsg] = useState("");

    // Stari pentru Cardul Bancar (Mock)
    const [cardNumber, setCardNumber] = useState("");
    const [cardExpiry, setCardExpiry] = useState("");
    const [cardCvv, setCardCvv] = useState("");
    const [cardName, setCardName] = useState("");

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
    
    const handlePlaceOrder = async () => {
        if (!selectedAddressId) {
            setErrorMsg("Please select a delivery address.");
            return;
        }

        setIsPlacingOrder(true);
        setErrorMsg("");

        await new Promise(resolve => setTimeout(resolve, 800));

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

            const newNotif = {
                id: Date.now(),
                orderId: savedOrder.id,
                message: `Order #${savedOrder.id} has been placed successfully and is now Confirmed.`,
                date: new Date().toISOString(),
                read: false
            };
            const existingNotifs = JSON.parse(localStorage.getItem('userNotifs') || '[]');
            localStorage.setItem('userNotifs', JSON.stringify([newNotif, ...existingNotifs]));
            
            window.dispatchEvent(new Event('new_notification'));

            await fetchCart();
            setOrderSuccess(true);
            
        }catch (err: any) {
            console.error(err);
            const backendMessage = err.response?.data?.message || "";
            
            if (backendMessage.toLowerCase().includes("stoc") || backendMessage.toLowerCase().includes("stock")) {
                setErrorMsg("Stock levels changed. Returning you to cart to review your items...");
                setTimeout(() => {
                    navigate("/cart");
                }, 2500);
            } else {
                setErrorMsg(backendMessage || "Failed to place order. Please try again.");
            }
        } finally {
            setIsPlacingOrder(false);
        }
    };

    const sortedAddresses = [...addresses].sort((a, b) => a.id - b.id);

    const isCardValid = paymentMethod === 'CASH' || (cardNumber.length >= 15 && cardExpiry.length >= 4 && cardCvv.length >= 3 && cardName.length > 0);

    if (orderSuccess) {
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
                    
                    <p className="text-gray-500 text-lg leading-relaxed mb-10">
                        Thank you, <div className="inline-block font-bold text-[#134c9c]">{user?.firstName}</div>! Your order has been successfully placed and is now being processed.
                    </p>

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
            <div className="min-h-[90vh] bg-[#f8fafc] flex flex-col items-center justify-center p-4">
                <div className="bg-white max-w-xl w-full p-10 md:p-14 rounded-[3rem] shadow-xl shadow-blue-900/5 border border-gray-100 flex flex-col items-center text-center animate-in zoom-in-95 fade-in duration-500">
                    <div className="p-8 bg-gray-50 rounded-full mb-8 shadow-inner">
                        <ShoppingBag size={64} className="text-gray-300" />
                    </div>
                    <h1 className="font-black text-4xl text-gray-900 mb-4 tracking-tight">
                        Your cart is empty
                    </h1>
                    <div className="text-gray-500 mb-10 text-lg leading-relaxed">
                        <p>You cannot checkout without any items.</p> 
                        <p>Fill your cart by exploring our <strong className="text-[#134c9c]">fresh</strong> groceries.</p>
                    </div>
                    <Link to='/' className="w-full">
                        <Button className="w-full h-14 rounded-2xl bg-[#134c9c] hover:bg-[#0f3d7d] text-white font-black text-lg shadow-lg shadow-blue-900/20 hover:-translate-y-1 transition-all flex items-center justify-center gap-2">
                            <Store size={22} />
                            Search for groceries
                        </Button>
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-[90vh] bg-[#f8fafc] py-10 px-4 sm:px-6 lg:px-8">
            <div className="max-w-6xl mx-auto">
                
                {/* BUTON BACK SI TITLU */}
                <div className="mb-8">
                    <Link to="/cart" className="inline-flex items-center gap-2 text-sm font-bold text-gray-500 hover:text-[#134c9c] transition-colors mb-4">
                        <ArrowLeft size={16} strokeWidth={3} /> Return to Cart
                    </Link>
                    <h1 className="text-3xl font-black text-gray-900 mb-8 flex items-center gap-3 tracking-tight">
                        <Receipt size={28} className="text-[#134c9c]" />
                        Checkout</h1>
                </div>

                {errorMsg && (
                    <div className="mb-8 p-5 bg-red-50 text-red-700 border border-red-200 rounded-2xl flex items-center gap-3 animate-in fade-in">
                        <AlertTriangle size={24} />
                        <span className="font-bold text-lg">{errorMsg}</span>
                    </div>
                )}

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
                    
                    {/* COLOANA STANGA */}
                    <div className="lg:col-span-2 space-y-8">
                        
                        {/* 1. ADRESA DE LIVRARE */}
                        <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-gray-100">
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
                                                    className={`p-6 rounded-2xl border-2 cursor-pointer transition-all flex flex-col justify-between ${selectedAddressId === addr.id ? "border-[#134c9c] bg-blue-50/50 shadow-md" : "border-gray-100 hover:border-blue-200 hover:bg-gray-50"}`}
                                                >
                                                    <div>
                                                        <div className="flex justify-between items-start mb-3">
                                                            <p className="font-black text-gray-900 text-lg">{addr.city}</p>
                                                            {addr.isDefaultDelivery && <span className="bg-blue-100 text-blue-700 text-[10px] px-2.5 py-1 rounded-md uppercase font-black tracking-widest">Default</span>}
                                                        </div>
                                                        <p className="text-sm font-medium text-gray-600 mb-1">{addr.street}</p>
                                                        <p className="text-xs font-bold text-gray-400">{addr.zipCode}, {addr.country}</p>
                                                    </div>
                                                    
                                                    {!addr.isDefaultDelivery && (
                                                        <div className="mt-4 pt-4 border-t border-gray-200/60">
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
                                            <h3 className="text-lg font-black text-gray-900 mb-6 flex items-center gap-2"><Plus size={20} className="text-[#134c9c]"/> Add New Address</h3>
                                            <form onSubmit={handleQuickAddAddress} className="space-y-5">
                                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                                                    <div className="space-y-2">
                                                        <label className="text-xs font-bold text-gray-500 uppercase tracking-widest ml-1">Street</label>
                                                        <Input required value={newAddress.street} onChange={(e)=>setNewAddress({...newAddress, street: e.target.value})} placeholder="e.g. Str. Principala 1" className="bg-white border-gray-200 h-12 rounded-xl" />
                                                    </div>
                                                    <div className="space-y-2">
                                                        <label className="text-xs font-bold text-gray-500 uppercase tracking-widest ml-1">City</label>
                                                        <Input required value={newAddress.city} onChange={(e)=>setNewAddress({...newAddress, city: e.target.value})} placeholder="Bucharest" className="bg-white border-gray-200 h-12 rounded-xl"/>
                                                    </div>
                                                    <div className="space-y-2">
                                                        <label className="text-xs font-bold text-gray-500 uppercase tracking-widest ml-1">Postal Code</label>
                                                        <Input required value={newAddress.zipCode} onChange={(e)=>setNewAddress({...newAddress, zipCode: e.target.value})} placeholder="012345" className="bg-white border-gray-200 h-12 rounded-xl"/>
                                                    </div>
                                                    <div className="space-y-2">
                                                        <label className="text-xs font-bold text-gray-500 uppercase tracking-widest ml-1">Country</label>
                                                        <Input required value={newAddress.country} onChange={(e)=>setNewAddress({...newAddress, country: e.target.value})} disabled className="bg-gray-100 text-gray-500 border-gray-200 h-12 rounded-xl cursor-not-allowed"/>
                                                    </div>
                                                </div>
                                                <div className="flex gap-3 pt-2">
                                                    <Button type="submit" className="bg-[#134c9c] hover:bg-[#0f3d7d] h-12 px-8 rounded-xl font-bold">Save Address</Button>
                                                    <Button type="button" variant="outline" onClick={() => setShowAddAddressForm(false)} className="h-12 px-8 rounded-xl font-bold border-2">Cancel</Button>
                                                </div>
                                            </form>
                                        </div>
                                    ) : (
                                        <Button 
                                            onClick={() => setShowAddAddressForm(true)} 
                                            variant="outline" 
                                            className="w-full mt-4 h-14 flex items-center justify-center gap-2 border-dashed border-2 border-gray-300 hover:border-[#134c9c] hover:bg-blue-50 text-gray-500 hover:text-[#134c9c] rounded-2xl font-bold transition-all"
                                        >
                                            <Plus size={20} /> Add Another Address
                                        </Button>
                                    )}
                                </div>
                            )}
                        </div>

                        {/* 2. METODA DE PLATA */}
                        <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-gray-100">
                            <div className="flex items-center gap-3 mb-8 border-b border-gray-100 pb-6">
                                <div className="p-3 bg-blue-50 text-[#134c9c] rounded-2xl">
                                    <CreditCard size={24} />
                                </div>
                                <h2 className="text-2xl font-black text-gray-900 tracking-tight">Payment Method</h2>
                            </div>
                            
                            <div className="grid grid-cols-2 gap-4">
                                <button 
                                    onClick={() => setPaymentMethod('CARD')}
                                    className={`flex flex-col items-center justify-center p-6 rounded-2xl border-2 transition-all gap-3 ${paymentMethod === 'CARD' ? "border-[#134c9c] bg-blue-50 text-[#134c9c] shadow-md" : "border-gray-100 hover:border-blue-200 hover:bg-gray-50 text-gray-500"}`}
                                >
                                    <CreditCard size={32} />
                                    <span className="font-bold text-lg">Pay by Card</span>
                                </button>
                                <button 
                                    onClick={() => setPaymentMethod('CASH')}
                                    className={`flex flex-col items-center justify-center p-6 rounded-2xl border-2 transition-all gap-3 ${paymentMethod === 'CASH' ? "border-green-500 bg-green-50 text-green-700 shadow-md" : "border-gray-100 hover:border-green-200 hover:bg-gray-50 text-gray-500"}`}
                                >
                                    <Banknote size={32} />
                                    <span className="font-bold text-lg">Cash on Delivery</span>
                                </button>
                            </div>

                            {/* UI PENTRU CARD BANCAR */}
                            {paymentMethod === 'CARD' && (
                                <div className="mt-8 p-6 border border-gray-200 bg-gray-50/50 rounded-2xl space-y-5 animate-in fade-in slide-in-from-top-4">
                                    <div className="flex items-center justify-between mb-2">
                                        <div className="flex items-center gap-2 text-gray-700">
                                            <CreditCard size={20} className="text-[#134c9c]" />
                                            <h3 className="font-black text-gray-900">Credit Card Details</h3>
                                        </div>
                                        <div className="flex gap-2">
                                            <div className="w-10 h-6 bg-[#1a1f71] rounded-md flex items-center justify-center text-[9px] text-white font-bold italic tracking-widest shadow-sm">VISA</div>
                                            <div className="w-10 h-6 bg-[#eb001b] rounded-md flex items-center justify-center text-[9px] text-white font-bold shadow-sm">MC</div>
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-xs font-bold text-gray-500 uppercase tracking-widest ml-1">Card Number</label>
                                        <Input 
                                            placeholder="0000 0000 0000 0000" 
                                            maxLength={19} 
                                            value={cardNumber} 
                                            onChange={(e) => setCardNumber(e.target.value.replace(/[^0-9 ]/g, ''))} 
                                            className="bg-white border-gray-200 h-12 rounded-xl font-mono text-lg tracking-widest"
                                        />
                                    </div>
                                    <div className="grid grid-cols-2 gap-5">
                                        <div className="space-y-2">
                                            <label className="text-xs font-bold text-gray-500 uppercase tracking-widest ml-1">Expiry Date</label>
                                            <Input 
                                                placeholder="MM/YY" 
                                                maxLength={5} 
                                                value={cardExpiry} 
                                                onChange={(e) => setCardExpiry(e.target.value)} 
                                                className="bg-white border-gray-200 h-12 rounded-xl text-center font-mono text-lg"
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-xs font-bold text-gray-500 uppercase tracking-widest ml-1">CVV</label>
                                            <Input 
                                                placeholder="123" 
                                                maxLength={3} 
                                                type="password" 
                                                value={cardCvv} 
                                                onChange={(e) => setCardCvv(e.target.value.replace(/[^0-9]/g, ''))} 
                                                className="bg-white border-gray-200 h-12 rounded-xl text-center font-mono text-lg tracking-widest"
                                            />
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-xs font-bold text-gray-500 uppercase tracking-widest ml-1">Name on Card</label>
                                        <Input 
                                            placeholder="JOHN DOE" 
                                            value={cardName} 
                                            onChange={(e) => setCardName(e.target.value.toUpperCase())} 
                                            className="bg-white border-gray-200 h-12 rounded-xl uppercase font-medium"
                                        />
                                    </div>
                                </div>
                            )}

                        </div>

                    </div>

                    {/* COLOANA DREAPTA: SUMAR & BUTON FINAL */}
                    <div className="lg:col-span-1 sticky top-28 space-y-6">
                        <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-gray-100">
                            <h2 className="text-2xl font-black text-gray-900 mb-6 border-b border-gray-100 pb-6 tracking-tight">Summary</h2>
                            
                            <div className="space-y-5 mb-8">
                                <div className="flex justify-between items-center text-gray-600 font-medium">
                                    <span>Products ({cartItems.length})</span>
                                    <span className="font-bold text-gray-900">{rawTotal.toFixed(2)} Lei</span>
                                </div>
                                <div className="flex justify-between items-center text-gray-600 font-medium">
                                    <span>Delivery</span>
                                    <span className="text-green-600 font-bold bg-green-50 px-2 py-0.5 rounded text-sm uppercase tracking-wider">Free</span>
                                </div>
                                {appliedPromo && (
                                    <div className="flex justify-between items-center text-orange-600 font-bold">
                                        <span>Promo ({promoCode})</span>
                                        <span>-{discountPercent}%</span>
                                    </div>
                                )}
                                <div className="h-px bg-gray-100 my-4"></div>
                                <div className="flex justify-between items-end">
                                    <span className="text-lg font-bold text-gray-500 uppercase tracking-widest">Total</span>
                                    <div className="text-right">
                                        {appliedPromo && <span className="text-sm text-gray-400 line-through mr-2">{rawTotal.toFixed(2)} Lei</span>}
                                        <span className="text-4xl font-black text-[#134c9c] tracking-tighter">
                                            {finalTotal.toFixed(2)} Lei
                                        </span>
                                    </div>
                                </div>
                            </div>

                            {/* PROMO CODE INPUT */}
                            <div className="flex gap-2 mb-8">
                                <Input 
                                    placeholder="Promo code" 
                                    value={promoCode} 
                                    onChange={(e) => setPromoCode(e.target.value.toUpperCase())}
                                    disabled={appliedPromo || isApplyingPromo}
                                    className="bg-gray-50 border-gray-200 h-12 rounded-xl font-bold uppercase tracking-widest text-center"
                                />
                                <Button 
                                    variant={appliedPromo ? "outline" : "default"}
                                    onClick={appliedPromo ? () => {setAppliedPromo(false); setPromoCode("");} : handleApplyPromo}
                                    disabled={isApplyingPromo || !promoCode.trim()}
                                    className={`w-28 h-12 rounded-xl font-bold transition-all ${appliedPromo ? "text-red-500 border-red-200 hover:bg-red-50" : "bg-gray-900 hover:bg-gray-800 text-white"}`}
                                >
                                    {isApplyingPromo ? <Loader2 className="animate-spin" size={18} /> : appliedPromo ? "Remove" : "Apply"}
                                </Button>
                            </div>

                            <Button 
                                onClick={handlePlaceOrder}
                                disabled={isPlacingOrder || addresses.length === 0 || selectedAddressId === null || !isCardValid}
                                className="w-full h-16 rounded-2xl bg-[#134c9c] hover:bg-[#0f3d7d] text-white font-black text-xl shadow-xl shadow-blue-900/20 hover:-translate-y-1 transition-all flex items-center justify-center gap-3 disabled:opacity-50 disabled:hover:translate-y-0 disabled:shadow-none"
                            >
                                {isPlacingOrder ? <Loader2 className="animate-spin w-6 h-6" /> : <><CheckCircle2 size={24} /> Place Order</>}
                            </Button>
                        </div>
                    </div>

                </div>
            </div>
        </div>
    );
}