import { useState, useRef, useEffect } from "react";
import axios from "axios";
import { Bot, X, Send, ShoppingCart, Loader2, Clock } from "lucide-react";
import { Link } from "react-router-dom";
import { useCart } from "@/context/CartContext";
import { Product } from "@/types";

//Bouncing Dots ai cand scrie
function TypingIndicator() {
    return (
        <div className="flex items-center gap-1 p-2">
            <div className="w-2 h-2 bg-[#134c9c]/60 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
            <div className="w-2 h-2 bg-[#134c9c]/60 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
            <div className="w-2 h-2 bg-[#134c9c]/60 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
        </div>
    );
}

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

// Interfete Chatbot
interface ActionButton {
    text: string;
    link: string;
}

type Message = { 
    role: "user" | "assistant"; 
    content: string; 
    recommended_ids?: number[];
    actionButton?: ActionButton | null; 
};

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
    }, [messages, isLoading]);

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
                recommended_ids: data.produse_recomandate,
                actionButton: data.buton_navigare || null 
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
                <div className="bg-[#f8fafc] w-[350px] sm:w-[400px] h-[550px] max-h-[80vh] rounded-3xl shadow-2xl border border-gray-200 mb-4 flex flex-col overflow-hidden animate-in slide-in-from-bottom-10 fade-in duration-300">
                    
                    {/* Header */}
                    <div className="relative bg-gradient-to-br from-[#0a2747] via-[#0f3d7d] to-[#134c9c] p-4 flex items-center justify-between text-white shadow-md overflow-hidden shrink-0 rounded-t-3xl border-b border-blue-900/50">
                        
                        {/* Animated Blobs (luate din hero banner de pe home page si adaptate) */}
                        <div className="absolute top-[-50%] right-[-10%] w-[150px] h-[150px] bg-cyan-400/30 rounded-full blur-[30px] pointer-events-none animate-blob z-0"></div>
                        <div className="absolute bottom-[-50%] left-[-10%] w-[120px] h-[120px] bg-blue-400/30 rounded-full blur-[25px] pointer-events-none animate-blob z-0" style={{ animationDelay: "2s" }}></div>
                        <div className="absolute top-[10%] left-[30%] w-[100px] h-[100px] bg-emerald-400/20 rounded-full blur-[20px] pointer-events-none animate-blob z-0" style={{ animationDelay: "4s" }}></div>

                        <div className="flex items-center gap-3 relative z-10">
                            {/* Iconita ai sus */}
                            <div className="bg-white/10 p-2.5 rounded-2xl backdrop-blur-md border border-white/20 shadow-sm relative">
                                <Bot size={24} className="text-cyan-50 drop-shadow-md" />
                            </div>
                            <div>
                                <h3 className="font-black text-lg leading-tight tracking-tight drop-shadow-sm">Freshli AI</h3>
                                <p className="text-[10px] text-cyan-100 font-bold uppercase tracking-widest">Your personal assistant</p>
                            </div>
                        </div>
                        <button onClick={() => setIsOpen(false)} className="relative z-10 bg-white/10 hover:bg-white/20 p-2 rounded-full transition-colors backdrop-blur-sm border border-white/10">
                            <X size={20} strokeWidth={3} />
                        </button>
                    </div>

                    {/* Zona de mesaje */}
                    <div className="flex-1 overflow-y-auto p-4 bg-[url('/noise.png')] bg-repeat opacity-95 space-y-6">
                        {messages.map((msg, idx) => {
                            const isUser = msg.role === "user";
                            return (
                                <div key={idx} className={`flex gap-3 ${isUser ? "justify-end" : "justify-start"}`}>
                                    
                                    {/* Avatar AI in stanga mesajului */}
                                    {!isUser && (
                                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#134c9c] to-blue-500 flex items-center justify-center shrink-0 mt-1 shadow-sm">
                                            <Bot size={16} className="text-white" />
                                        </div>
                                    )}

                                    <div className={`flex flex-col ${isUser ? "items-end" : "items-start"} max-w-[80%]`}>
                                        
                                        {/* Bula de text */}
                                        <div className={`px-4 py-3 rounded-[1.25rem] shadow-sm text-sm leading-relaxed ${
                                            isUser 
                                                ? "bg-gradient-to-br from-[#134c9c] to-blue-600 text-white rounded-br-sm" 
                                                : "bg-white border border-gray-200/60 text-gray-800 rounded-tl-sm"
                                        }`}>
                                            {msg.content}
                                        </div>

                                        {/* Lista cu produse */}
                                        {!isUser && (
                                            <div className="w-full mt-3">
                                                {msg.recommended_ids && msg.recommended_ids.length > 0 && (
                                                    <div className="flex gap-3 overflow-x-auto pb-3 scrollbar-hide snap-x">
                                                        {msg.recommended_ids.map(id => (
                                                            <div key={`msg-${idx}-prod-${id}`} className="snap-start">
                                                                <MiniProductCard productId={id} />
                                                            </div>
                                                        ))}
                                                    </div>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                        
                        {/* Loading indicator cu animatie 3 puncte bouncing */}
                        {isLoading && (
                            <div className="flex gap-3 justify-start">
                                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#134c9c] to-blue-500 flex items-center justify-center shrink-0 mt-1 shadow-sm">
                                    <Bot size={16} className="text-white" />
                                </div>
                                <div className="px-4 py-3 bg-white border border-gray-200/60 rounded-[1.25rem] rounded-tl-sm shadow-sm">
                                    <TypingIndicator />
                                </div>
                            </div>
                        )}
                        <div ref={messagesEndRef} className="h-1" />
                    </div>

                    {/* Input Area */}
                    <div className="p-3 bg-white border-t border-gray-100 z-10 shadow-[0_-10px_20px_rgba(0,0,0,0.02)]">
                        <form onSubmit={sendMessage} className="relative flex items-center bg-gray-50 border border-gray-200/60 rounded-full focus-within:ring-2 focus-within:ring-blue-100 focus-within:border-[#134c9c] transition-all shadow-inner">
                            <input 
                                type="text" 
                                value={input} 
                                onChange={(e) => setInput(e.target.value)}
                                placeholder="Ask me anything..."
                                className="w-full bg-transparent border-transparent focus:ring-0 px-5 h-12 text-[14px] outline-none placeholder:text-gray-400"
                                disabled={isLoading}
                                autoComplete="off"
                            />
                            <button 
                                type="submit" 
                                disabled={!input.trim() || isLoading}
                                className="absolute right-1.5 w-9 h-9 bg-[#134c9c] text-white rounded-full flex items-center justify-center disabled:opacity-50 hover:bg-blue-800 hover:scale-105 transition-all shadow-md"
                            >
                                <Send size={16} className="-ml-0.5 mt-0.5" />
                            </button>
                        </form>
                    </div>
                </div>
            )}

            {/* Buton principal */}
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