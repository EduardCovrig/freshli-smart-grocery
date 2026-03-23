import { useState, useRef, useEffect } from "react";
import axios from "axios";
import { Bot, X, Send, ShoppingCart, Loader2, Clock } from "lucide-react";
import { Link } from "react-router-dom";
import { useCart } from "@/context/CartContext";
import { Product } from "@/types";

//SUB-COMPONENTA: Mini-Card pentru Produsele Recomandate 
function MiniProductCard({ productId }: { productId: number }) {
    const [product, setProduct] = useState<Product | null>(null);
    const { addToCart } = useCart();
    const [isAdding, setIsAdding] = useState(false);
    const [hasError, setHasError] = useState(false);

    useEffect(() => {
        // cerere detaliile produsului din Spring Boot pentru a afisa poza si pretul
        axios.get(`${import.meta.env.VITE_API_URL}/products/${productId}`)
            .then(res => setProduct(res.data))
            .catch(() => {
                console.error(`Produsul cu ID ${productId} inventat de AI nu a fost gasit.`);
                setHasError(true);
            });
    }, [productId]);

    if (hasError) return null;

    if (!product) return <div className="h-20 w-48 bg-gray-100 animate-pulse rounded-xl shrink-0 border border-gray-200"></div>;

    const handleAdd = async (e: React.MouseEvent) => {
        e.preventDefault();
        setIsAdding(true);
        const hasClearance = (product.nearExpiryQuantity || 0) > 0;
        await addToCart(product.id, 1, !hasClearance); 
        setIsAdding(false);
    };

    const imageToDisplay = product.imageUrls?.[0] || "https://placehold.co/100?text=No+Image";
    
    // Logica pentru reduceri
    const expiringStock = product.nearExpiryQuantity || 0;
    const hasReduced = expiringStock > 0;
    const discountPercentage = product.currentPrice < product.price
        ? Math.round(((product.price - product.currentPrice) / product.price) * 100)
        : 0;

    return (
        <Link to={`/product/${product.id}`} className="flex flex-col w-48 bg-white border border-gray-200 rounded-xl overflow-hidden shrink-0 hover:shadow-md transition-shadow group">
            <div className="h-24 w-full bg-white flex items-center justify-center p-2 relative">
                
                {/* BADGE REDUCERE din tabel adiscounts */}
                {product.hasActiveDiscount && discountPercentage > 0 && (
                    <div className="absolute top-1.5 left-1.5 px-1.5 py-0.5 text-[9px] bg-gradient-to-tr from-rose-500 to-red-600 text-white rounded-full font-black z-20 shadow-md shadow-red-600/20 flex items-center justify-center">
                        -{discountPercentage}%
                    </div>
                )}

                {/* BADGE CLEARANCE */}
                {hasReduced && (
                    <div className="absolute top-1.5 right-1.5 px-1.5 py-0.5 text-[8px] gap-0.5 bg-gradient-to-r from-orange-500 to-red-500 text-white rounded-full font-black uppercase flex items-center z-20 shadow-md shadow-orange-500/20">
                        <Clock className="w-2 h-2" strokeWidth={3} />
                        Clearance
                    </div>
                )}

                <img src={imageToDisplay} alt={product.name} className="h-full object-contain group-hover:scale-105 transition-transform" />
            </div>
            
            <div className="p-2 flex flex-col gap-1 bg-gray-50 border-t border-gray-100 flex-1">
                <p className="text-xs font-bold text-gray-900 truncate">{product.name}</p>
                <div className="flex items-center justify-between mt-auto pt-1">
                    
                    {/* pret */}
                    <div className="flex flex-col justify-center">
                        {product.currentPrice < product.price && (
                            <span className="text-[10px] text-gray-400 line-through font-bold leading-none mb-0.5">
                                {product.price.toFixed(2)} lei
                            </span>
                        )}
                        <span className={`text-sm font-black leading-none ${product.currentPrice < product.price ? "text-red-600" : "text-[#134c9c]"}`}>
                            {product.currentPrice.toFixed(2)} lei
                        </span>
                    </div>

                    <button 
                        onClick={handleAdd}
                        disabled={isAdding || product.stockQuantity <= 0}
                        className="bg-blue-50 text-[#134c9c] hover:bg-[#134c9c] hover:text-white p-1.5 rounded-lg transition-colors disabled:opacity-50 shrink-0"
                    >
                        {isAdding ? <Loader2 size={14} className="animate-spin" /> : <ShoppingCart size={14} strokeWidth={2.5} />}
                    </button>
                </div>
            </div>
        </Link>
    );
}

//Chatbot
type Message = { role: "user" | "assistant"; content: string; recommended_ids?: number[] };

export default function Chatbot() {
    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState<Message[]>([
        { role: "assistant", content: "Hello! I'm your assistant, Freshli. What are you looking for?" }
    ]);
    const [input, setInput] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    // Auto-scroll la ultimul mesaj
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages]);

    const sendMessage = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!input.trim()) return;

        const userText = input.trim();
        //salvare mesaj direct in istoric
        const newHistory: Message[] = [...messages, { role: "user", content: userText }];
        
        setMessages(newHistory);
        setInput("");
        setIsLoading(true);

        try {
            //curatare array
            const payloadMessages = newHistory.map(m => ({ role: m.role, content: m.content }));

            const response = await axios.post(`${import.meta.env.VITE_AI_API_URL}/chat`, {
                messages: payloadMessages
            });

            const data = response.data;
            
            //adaugare raspuns in chat
            setMessages(prev => [...prev, { 
                role: "assistant", 
                content: data.mesaj, 
                recommended_ids: data.produse_recomandate 
            }]);

        } catch (error) {
            console.error("Eroare Chat AI:", error);
            setMessages(prev => [...prev, { role: "assistant", content: "Sorry, I am experiencing a technical issue in the kitchen. Please try again!" }]);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="fixed bottom-6 right-6 z-[100] flex flex-col items-end">
            {/* Fereastra de Chat */}
            {isOpen && (
                <div className="bg-white w-[350px] sm:w-[400px] h-[550px] max-h-[80vh] rounded-3xl shadow-2xl border border-gray-200 mb-4 flex flex-col overflow-hidden animate-in slide-in-from-bottom-10 fade-in duration-300">
                    
                    {/* Header */}
                    <div className="bg-gradient-to-r from-[#134c9c] to-blue-600 p-4 flex items-center justify-between text-white shadow-md z-10">
                        <div className="flex items-center gap-3">
                            <div className="bg-white/20 p-2 rounded-xl backdrop-blur-sm">
                                <Bot size={24} />
                            </div>
                            <div>
                                <h3 className="font-black text-lg leading-tight">Freshli AI</h3>
                                <p className="text-xs text-blue-100 font-medium">Smarter grocery shopping</p>
                            </div>
                        </div>
                        <button onClick={() => setIsOpen(false)} className="hover:bg-white/20 p-2 rounded-full transition-colors">
                            <X size={20} strokeWidth={3} />
                        </button>
                    </div>

                    {/* Zona de mesaje */}
                    <div className="flex-1 overflow-y-auto p-4 bg-slate-50 space-y-5">
                        {messages.map((msg, idx) => (
                            <div key={idx} className={`flex flex-col ${msg.role === "user" ? "items-end" : "items-start"}`}>
                                
                                {/* Bula de text */}
                                <div className={`max-w-[85%] p-3.5 rounded-2xl shadow-sm text-sm ${msg.role === "user" ? "bg-[#134c9c] text-white rounded-br-sm" : "bg-white border border-gray-100 text-gray-800 rounded-bl-sm"}`}>
                                    {msg.content}
                                </div>

                                {/* Lista cu produse (Doar daca AI-ul ne-a dat ID-uri) */}
                                {msg.role === "assistant" && msg.recommended_ids && msg.recommended_ids.length > 0 && (
                                    <div className="mt-3 flex gap-3 overflow-x-auto w-full pb-2 scrollbar-hide pl-1">
                                        {msg.recommended_ids.map(id => (
                                            <MiniProductCard key={id} productId={id} />
                                        ))}
                                    </div>
                                )}
                            </div>
                        ))}
                        
                        {/* Loading indicator */}
                        {isLoading && (
                            <div className="flex items-start">
                                <div className="bg-white border border-gray-100 p-4 rounded-2xl rounded-bl-sm shadow-sm flex items-center gap-2 text-gray-500">
                                    <Loader2 size={16} className="animate-spin text-[#134c9c]" /> AI is cooking a response...
                                </div>
                            </div>
                        )}
                        <div ref={messagesEndRef} />
                    </div>

                    {/* Input Area */}
                    <form onSubmit={sendMessage} className="p-3 bg-white border-t border-gray-100">
                        <div className="relative flex items-center">
                            <input 
                                type="text" 
                                value={input} 
                                onChange={(e) => setInput(e.target.value)}
                                placeholder="Type here (e.g. pasta recipe)..."
                                className="w-full bg-gray-100 border-transparent focus:bg-white focus:border-[#134c9c] focus:ring-2 focus:ring-blue-100 rounded-full h-12 pl-4 pr-12 text-sm transition-all"
                                disabled={isLoading}
                            />
                            <button 
                                type="submit" 
                                disabled={!input.trim() || isLoading}
                                className="absolute right-1.5 w-9 h-9 bg-[#134c9c] text-white rounded-full flex items-center justify-center disabled:opacity-50 disabled:bg-gray-400 hover:bg-blue-800 transition-colors shadow-md"
                            >
                                <Send size={16} className="-ml-0.5 mt-0.5" />
                            </button>
                        </div>
                    </form>
                </div>
            )}

            {/* Butonul Plutitor Principal */}
            {!isOpen && (
                <button 
                    onClick={() => setIsOpen(true)}
                    className="w-16 h-16 bg-[#134c9c] text-white rounded-full shadow-2xl flex items-center justify-center hover:bg-blue-800 hover:scale-110 transition-all duration-300 ring-4 ring-blue-100 animate-in zoom-in-90"
                >
                    <Bot size={32} />
                </button>
            )}
        </div>
    );
}