import { useEffect, useState } from "react";
import { useCart } from "@/context/CartContext";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Link, useNavigate} from "react-router-dom";
import { CheckCircle2, CreditCard, Banknote, MapPin, Loader2, Plus, AlertTriangle, ShoppingBag, Store, Package, ArrowLeft } from "lucide-react";
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
    const [isApplyingPromo, setIsApplyingPromo] = useState(false); // Loading pt Promo

    const [isPlacingOrder, setIsPlacingOrder] = useState(false);
    const [orderSuccess, setOrderSuccess] = useState(false);
    const [errorMsg, setErrorMsg] = useState("");

    // Stari pentru Cardul Bancar (Mock)
    const [cardNumber, setCardNumber] = useState("");
    const [cardExpiry, setCardExpiry] = useState("");
    const [cardCvv, setCardCvv] = useState("");
    const [cardName, setCardName] = useState("");

    const rawTotal = cartItems.reduce((acc, item) => acc + item.subTotal, 0);
    const finalTotal = appliedPromo ? rawTotal * 0.90 : rawTotal;

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
        // Simulam o mica intarziere (ca si cum verifica in BD)
        await new Promise(resolve => setTimeout(resolve, 600)); 

        if (promoCode.trim().toUpperCase() === "LICENTA10") {
            setAppliedPromo(true);
            setErrorMsg("");
        } else {
            setAppliedPromo(false);
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

        //simulare waiting
        await new Promise(resolve => setTimeout(resolve, 800));

        try {
            const apiUrl = import.meta.env.VITE_API_URL;
            const payload = {
                addressId: selectedAddressId,
                paymentMethod: paymentMethod,
                promoCode: appliedPromo ? "LICENTA10" : ""
            };

            const res = await axios.post(`${apiUrl}/orders`, payload, {
                headers: { Authorization: `Bearer ${token}` }
            });

            const savedOrder = res.data;

            // Creare Notificare
            const newNotif = {
                id: Date.now(),
                orderId: savedOrder.id,
                message: `Order #${savedOrder.id} has been placed successfully and is now Confirmed.`,
                date: new Date().toISOString(),
                read: false
            };
            const existingNotifs = JSON.parse(localStorage.getItem('userNotifs') || '[]');
            localStorage.setItem('userNotifs', JSON.stringify([newNotif, ...existingNotifs]));
            
            // Declansam un eveniment custom ca Navbar-ul sa stie sa se actualizeze instant
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

    // --- SORTAM ADRESELE SA NU SARA PE ECRAN ---
    const sortedAddresses = [...addresses].sort((a, b) => a.id - b.id);

    // --- VALIDARE MINIMA CARD BANCAR ---
    const isCardValid = paymentMethod === 'CASH' || (cardNumber.length >= 15 && cardExpiry.length >= 4 && cardCvv.length >= 3 && cardName.length > 0);


    if (orderSuccess) {
        return (
            <div className="min-h-[90vh] flex flex-col items-center justify-center bg-gray-50 px-4 text-center">
                <div className="w-24 h-24 bg-green-100 text-green-600 rounded-full flex items-center justify-center mb-6 shadow-sm">
                    <CheckCircle2 size={50} strokeWidth={3} />
                </div>
                <h1 className="text-4xl font-black text-gray-900 mb-4">Order Confirmed!</h1>
                <p className="text-gray-500 max-w-md mx-auto mb-8 text-lg">
                    Thank you, {user?.firstName}! Your order has been successfully placed and is now being processed.
                </p>
                <div className="flex flex-col sm:flex-row gap-4 items-center justify-center">
                    <Link to="/">
                        <Button variant="outline" className="h-12 px-8 rounded-xl font-bold border-2 hover:bg-gray-100 shadow-sm text-gray-700">
                            <Store size={18} className="mr-2"/> Continue Shopping
                        </Button>
                    </Link>
                    <Link to="/profile">
                        <Button className="h-12 px-8 rounded-xl font-bold bg-[#134c9c] hover:bg-blue-800 text-white shadow-lg">
                            <Package size={18} className="mr-2"/> See your orders
                        </Button>
                    </Link>
                </div>
            </div>
        );
    }

    if (cartItems.length === 0 && !orderSuccess) {
        return (
            <div className="min-h-[93vh] flex flex-col items-center justify-center text-center bg-gray-50">
                <div className="p-8 bg-white rounded-full mb-6 shadow-sm hover:bg-gray-800 transition-colors duration-400 group">
                    <ShoppingBag size={64} className="text-gray-300 group-hover:text-white transition-colors" />
                </div>
                <h1 className="font-black text-4xl text-gray-900 mb-5">
                    Your cart is empty.
                </h1>
                <div className="text-gray-500 mb-8 max-w-lg">
                    <p className="mb-0">You cannot checkout without any items.</p> 
                    <p>Fill your cart by exploring our <strong className="text-[#134c9c]">delicious</strong> and <strong className="text-[#1c7d1c]">fresh</strong> groceries...</p>
                </div>
                <Link to='/'>
                    <Button className="h-12 px-8 rounded-full bg-[#134c9c] hover:bg-[#1e5cad] text-white font-bold text-lg shadow-lg hover:shadow-xl transition-all mb-20 flex items-center gap-2">
                        <Store size={22} />
                        Search for your favourite groceries
                    </Button>
                </Link>
            </div>
        );
    }

    return (
        <div className="min-h-[90vh] bg-gray-50 py-10 px-4 sm:px-6 lg:px-8">
            <div className="max-w-6xl mx-auto">
                
                {/* BUTON BACK SI TITLU */}
                <div className="mb-8">
                    <Link to="/cart" className="inline-flex items-center gap-2 text-sm font-bold text-gray-500 hover:text-[#134c9c] transition-colors mb-4">
                        <ArrowLeft size={16} strokeWidth={3} /> Return to Cart
                    </Link>
                    <h1 className="text-3xl font-black text-gray-900">Checkout</h1>
                </div>

                {errorMsg && (
                    <div className="mb-6 p-4 bg-red-50 text-red-700 border border-red-200 rounded-xl flex items-center gap-3">
                        <AlertTriangle size={20} />
                        <span className="font-bold">{errorMsg}</span>
                    </div>
                )}

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
                    
                    {/* COLOANA STANGA */}
                    <div className="lg:col-span-2 space-y-6">
                        
                        {/* 1. ADRESA DE LIVRARE */}
                        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                            <div className="flex items-center gap-2 mb-6 border-b pb-4">
                                <MapPin className="text-[#134c9c]" />
                                <h2 className="text-xl font-bold text-gray-900">Delivery Address</h2>
                            </div>

                            {isLoadingAddresses ? (
                                <div className="flex justify-center py-6"><Loader2 className="animate-spin text-blue-500" /></div>
                            ) : (
                                <div className="space-y-4">
                                    {addresses.length > 0 && (
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                            {/* MAPAM FOLOSIND ARRAY-UL SORTAT */}
                                            {sortedAddresses.map((addr) => (
                                                <div 
                                                    key={addr.id}
                                                    onClick={() => setSelectedAddressId(addr.id)}
                                                    className={`p-4 rounded-xl border-2 cursor-pointer transition-all flex flex-col justify-between ${selectedAddressId === addr.id ? "border-[#134c9c] bg-blue-50" : "border-gray-100 hover:border-blue-200"}`}
                                                >
                                                    <div>
                                                        <div className="flex justify-between items-start mb-2">
                                                            <p className="font-bold text-gray-900">{addr.city}</p>
                                                            {addr.isDefaultDelivery && <span className="bg-blue-100 text-blue-700 text-[10px] px-2 py-0.5 rounded uppercase font-black">Default</span>}
                                                        </div>
                                                        <p className="text-sm text-gray-600">{addr.street}</p>
                                                        <p className="text-xs text-gray-400 mt-1">{addr.zipCode}, {addr.country}</p>
                                                    </div>
                                                    
                                                    {!addr.isDefaultDelivery && (
                                                        <div className="mt-3 pt-3 border-t border-gray-200/60">
                                                            <button 
                                                                onClick={(e) => handleSetDefaultAddress(e, addr)}
                                                                className="text-xs font-bold text-gray-500 hover:text-[#134c9c] underline transition-colors"
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
                                        <div className="mt-6 p-5 border border-blue-100 bg-blue-50/50 rounded-xl relative">
                                            <h3 className="text-sm font-bold text-gray-800 mb-4 flex items-center gap-2"><Plus size={16}/> Add New Address</h3>
                                            <form onSubmit={handleQuickAddAddress} className="space-y-4">
                                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                                    <div>
                                                        <label className="text-sm font-bold text-gray-600">Street</label>
                                                        <Input required value={newAddress.street} onChange={(e)=>setNewAddress({...newAddress, street: e.target.value})} placeholder="e.g. Str. Principala 1" className="bg-white" />
                                                    </div>
                                                    <div>
                                                        <label className="text-sm font-bold text-gray-600">City</label>
                                                        <Input required value={newAddress.city} onChange={(e)=>setNewAddress({...newAddress, city: e.target.value})} placeholder="Bucharest" className="bg-white"/>
                                                    </div>
                                                    <div>
                                                        <label className="text-sm font-bold text-gray-600">Postal Code</label>
                                                        <Input required value={newAddress.zipCode} onChange={(e)=>setNewAddress({...newAddress, zipCode: e.target.value})} placeholder="012345" className="bg-white"/>
                                                    </div>
                                                    <div>
                                                        <label className="text-sm font-bold text-gray-600">Country</label>
                                                        <Input required value={newAddress.country} onChange={(e)=>setNewAddress({...newAddress, country: e.target.value})} disabled className="bg-white"/>
                                                    </div>
                                                </div>
                                                <div className="flex gap-2">
                                                    <Button type="submit" className="bg-[#134c9c] hover:bg-blue-800">Save Address</Button>
                                                    <Button type="button" variant="ghost" onClick={() => setShowAddAddressForm(false)}>Cancel</Button>
                                                </div>
                                            </form>
                                        </div>
                                    ) : (
                                        <Button 
                                            onClick={() => setShowAddAddressForm(true)} 
                                            variant="outline" 
                                            className="w-full mt-4 flex items-center justify-center gap-2 border-dashed border-2 border-gray-300 hover:border-[#134c9c] hover:bg-blue-50 text-gray-600 hover:text-[#134c9c] transition-all"
                                        >
                                            <Plus size={16} /> Add Another Address
                                        </Button>
                                    )}
                                </div>
                            )}
                        </div>

                        {/* 2. METODA DE PLATA */}
                        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 tracking-tight">
                            <div className="flex items-center gap-2 mb-6 border-b pb-4">
                                <CreditCard className="text-[#134c9c]" />
                                <h2 className="text-xl font-bold text-gray-900">Payment Method</h2>
                            </div>
                            
                            <div className="grid grid-cols-2 gap-4">
                                <button 
                                    onClick={() => setPaymentMethod('CARD')}
                                    className={`flex flex-col items-center justify-center p-4 rounded-xl border-2 transition-all gap-2 ${paymentMethod === 'CARD' ? "border-blue-500 bg-blue-50 text-blue-700" : "border-gray-100 hover:bg-gray-50 text-gray-500"}`}
                                >
                                    <CreditCard size={32} />
                                    <span className="font-bold">Pay by Card</span>
                                </button>
                                <button 
                                    onClick={() => setPaymentMethod('CASH')}
                                    className={`flex flex-col items-center justify-center p-4 rounded-xl border-2 transition-all gap-2 ${paymentMethod === 'CASH' ? "border-green-500 bg-green-50 text-green-700" : "border-gray-100 hover:bg-gray-50 text-gray-500"}`}
                                >
                                    <Banknote size={32} />
                                    <span className="font-bold">Cash on Delivery</span>
                                </button>
                            </div>

                            {/* UI PENTRU CARD BANCAR */}
                            {paymentMethod === 'CARD' && (
                                <div className="mt-6 p-5 border border-gray-200 bg-gray-50 rounded-xl space-y-4 animate-in fade-in slide-in-from-top-4">
                                    <div className="flex items-center justify-between mb-2">
                                        <div className="flex items-center gap-2 text-gray-700">
                                            <CreditCard size={18} />
                                            <h3 className="font-bold text-sm">Credit Card Details</h3>
                                        </div>
                                        {/* Sigle false de carduri (optional vizual) */}
                                        <div className="flex gap-1">
                                            <div className="w-8 h-5 bg-blue-600 rounded flex items-center justify-center text-[8px] text-white font-bold italic">VISA</div>
                                            <div className="w-8 h-5 bg-red-500 rounded flex items-center justify-center text-[8px] text-white font-bold">MC</div>
                                        </div>
                                    </div>
                                    <Input 
                                        placeholder="Card Number " 
                                        maxLength={19} 
                                        value={cardNumber} 
                                        onChange={(e) => setCardNumber(e.target.value.replace(/[^0-9 ]/g, ''))} 
                                        className="bg-white border-gray-300 font-mono tracking-widest"
                                    />
                                    <div className="grid grid-cols-2 gap-4">
                                        <Input 
                                            placeholder="MM/YY" 
                                            maxLength={5} 
                                            value={cardExpiry} 
                                            onChange={(e) => setCardExpiry(e.target.value)} 
                                            className="bg-white border-gray-300 text-center font-mono"
                                        />
                                        <Input 
                                            placeholder="CVV" 
                                            maxLength={3} 
                                            type="password" 
                                            value={cardCvv} 
                                            onChange={(e) => setCardCvv(e.target.value.replace(/[^0-9]/g, ''))} 
                                            className="bg-white border-gray-300 text-center font-mono"
                                        />
                                    </div>
                                    <Input 
                                        placeholder="Name on Card" 
                                        value={cardName} 
                                        onChange={(e) => setCardName(e.target.value.toUpperCase())} 
                                        className="bg-white border-gray-300 uppercase"
                                    />
                                </div>
                            )}

                        </div>

                    </div>

                    {/* COLOANA DREAPTA: SUMAR & BUTON FINAL */}
                    <div className="lg:col-span-1 sticky top-28 space-y-6">
                        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                            <h2 className="text-xl font-bold text-gray-900 mb-6 border-b pb-4">Summary</h2>
                            
                            <div className="space-y-4 mb-6 text-sm">
                                <div className="flex justify-between text-gray-600">
                                    <span>Products ({cartItems.length})</span>
                                    <span className="font-bold text-gray-900">{rawTotal.toFixed(2)} Lei</span>
                                </div>
                                <div className="flex justify-between text-gray-600">
                                    <span>Delivery</span>
                                    <span className="text-green-600 font-bold">Free</span>
                                </div>
                                {appliedPromo && (
                                    <div className="flex justify-between text-orange-600 font-bold">
                                        <span>Promo Code (LICENTA10)</span>
                                        <span>-10%</span>
                                    </div>
                                )}
                                <div className="h-px bg-gray-100 my-2"></div>
                                <div className="flex justify-between items-end">
                                    <span className="text-lg font-bold text-gray-900">Total</span>
                                    <div className="text-right">
                                        {appliedPromo && <span className="text-xs text-gray-400 line-through mr-2">{rawTotal.toFixed(2)}</span>}
                                        <span className="text-3xl font-black text-[#134c9c]">
                                            {finalTotal.toFixed(2)}
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
                                    className="bg-gray-50 font-bold uppercase tracking-widest text-center"
                                />
                                <Button 
                                    variant={appliedPromo ? "outline" : "default"}
                                    onClick={appliedPromo ? () => {setAppliedPromo(false); setPromoCode("");} : handleApplyPromo}
                                    disabled={isApplyingPromo}
                                    className={`w-28 transition-all ${appliedPromo ? "text-red-500 border-red-200 hover:bg-red-50" : "bg-gray-900"}`}
                                >
                                    {isApplyingPromo ? <Loader2 className="animate-spin" size={18} /> : appliedPromo ? "Remove" : "Apply"}
                                </Button>
                            </div>

                            <Button 
                                onClick={handlePlaceOrder}
                                disabled={isPlacingOrder || addresses.length === 0 || selectedAddressId === null || !isCardValid}
                                className="w-full h-14 rounded-xl bg-green-600 hover:bg-green-700 text-white font-bold text-xl shadow-lg transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:bg-gray-400"
                            >
                                {isPlacingOrder ? <Loader2 className="animate-spin w-6 h-6" /> : <><CheckCircle2 /> Place Order</>}
                            </Button>
                        </div>
                    </div>

                </div>
            </div>
        </div>
    );
}