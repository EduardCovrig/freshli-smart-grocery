import { useState, useEffect } from "react";
import axios from "axios";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Users, Loader2, AlertTriangle, CheckCircle2, TrendingDown, Send, Sparkles, Bot, X } from "lucide-react";

interface ChurnData {
    userId: number;
    email: string;
    name: string;
    churnRisk: number;
    totalOrders: number;
    totalSpent: number;
    daysSinceLastOrder: number;
}

interface AdminChurnProps {
    token: string | null;
    openPromoConfigurator: (clientId: number, clientName: string, hasBeenSent: boolean) => void;
    sentPromos: number[];
}

export default function AdminChurn({ token, openPromoConfigurator, sentPromos }: AdminChurnProps) {
    const [churnClients, setChurnClients] = useState<ChurnData[]>([]);
    const [isLoadingChurn, setIsLoadingChurn] = useState(false);
    const [churnPage, setChurnPage] = useState(1);
    const [searchTerm, setSearchTerm] = useState("");

    //3 state-uri pe ai churn reasoning
    const [aiReasonModal, setAiReasonModal] = useState<{ show: boolean, client: ChurnData | null } | null>(null);
    const [aiReasonText, setAiReasonText] = useState<string>("");
    const [isGeneratingReason, setIsGeneratingReason] = useState(false);

    const handleGetAiReason = async (client: ChurnData) => {
        setAiReasonModal({ show: true, client });
        setIsGeneratingReason(true);
        setAiReasonText("");

        try {
            const aiApiUrl = import.meta.env.VITE_AI_API_URL;
            const response = await axios.post(`${aiApiUrl}/churn/reason`, {
                name: client.name,
                churnRisk: client.churnRisk,
                totalOrders: client.totalOrders,
                totalSpent: client.totalSpent,
                daysSinceLastOrder: client.daysSinceLastOrder
            });

            if (response.data.status === "success") {
                setAiReasonText(response.data.reason);
            } else {
                setAiReasonText("Error generating analysis.");
            }
        } catch (error) {
            console.error("AI Reason Error:", error);
            setAiReasonText("Connection to AI service failed.");
        } finally {
            setIsGeneratingReason(false);
        }
    };
    const ITEMS_PER_PAGE = 10;

    const filteredChurnClients = churnClients.filter(client =>
        client.name.toLowerCase().includes(searchTerm.toLowerCase().trim()) ||
        client.userId.toString().includes(searchTerm.trim())
    );

    const fetchChurnData = async () => {
        setIsLoadingChurn(true);
        try {
            const apiUrl = import.meta.env.VITE_API_URL;
            const response = await axios.get(`${apiUrl}/recommendations/churn`, { headers: { Authorization: `Bearer ${token}` } });
            if (response.data.status === "success") {
                setChurnClients(response.data.data);
            }
        } catch (err) {
            console.error(err);
        } finally {
            setIsLoadingChurn(false);
        }
    };

    useEffect(() => { fetchChurnData(); }, []);

    const paginatedChurn = filteredChurnClients.slice((churnPage - 1) * ITEMS_PER_PAGE, churnPage * ITEMS_PER_PAGE);
    const totalPages = Math.ceil(filteredChurnClients.length / ITEMS_PER_PAGE) || 1;

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
                    <h1 className="text-3xl sm:text-4xl font-black text-gray-900 mb-2 flex items-center gap-3 tracking-tight">
                        <Users size={32} className="text-[#134c9c]" /> Customer Retention
                    </h1>
                    <p className="text-gray-500 text-base">AI-Powered Churn Prediction using Random Forest Classification.</p>
                </div>
                <div className="relative w-full md:w-80 shrink-0">
                    <input
                        type="text"
                        placeholder="Search by name or ID..."
                        value={searchTerm}
                        onChange={(e) => {
                            setSearchTerm(e.target.value);
                            setChurnPage(1);
                        }}
                        className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:border-[#134c9c] bg-white transition-colors h-12 shadow-sm"
                    />
                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="absolute left-3 top-3.5 text-gray-400">
                        <circle cx="11" cy="11" r="8"></circle>
                        <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
                    </svg>
                </div>
            </div>

            <Card className="border border-gray-100 shadow-sm rounded-[2.5rem] bg-white overflow-hidden">
                <CardContent className="p-0">
                    {isLoadingChurn ? (
                        <div className="flex justify-center p-16"><Loader2 className="animate-spin text-[#134c9c]" size={40} /></div>
                    ) : (
                        <>
                            <div className="overflow-x-auto w-full">
                                <table className="w-full text-left border-collapse min-w-[800px]">
                                    <thead>
                                        <tr className="bg-gray-50 text-gray-500 text-xs uppercase tracking-wider">
                                            <th className="p-5 font-bold pl-6">Client Info</th>
                                            <th className="p-5 font-bold text-center">Orders</th>
                                            <th className="p-5 font-bold text-right">Total Spent</th>
                                            <th className="p-5 font-bold text-center">Last Order</th>
                                            <th className="p-5 font-bold text-center">Churn Risk</th>
                                            <th className="p-5 font-bold text-center pr-6">Action</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-100">
                                        {paginatedChurn.map((client) => {
                                            const isHighRisk = client.churnRisk >= 40;
                                            const isMediumRisk = client.churnRisk >= 20 && client.churnRisk < 40;
                                            const canSendPromo = isHighRisk || isMediumRisk;
                                            const hasBeenSent = sentPromos.includes(client.userId);

                                            return (
                                                <tr 
                                                    key={client.userId} 
                                                    onClick={() => handleGetAiReason(client)}
                                                    className="group hover:bg-blue-50/40 transition-colors border-b border-gray-50 cursor-pointer"
                                                >
                                                    <td className="p-5 pl-6">
                                                        <p className="font-black text-gray-900 group-hover:text-[#134c9c] transition-colors text-lg">{client.name}</p>
                                                        <p className="text-xs text-gray-500 font-bold mt-1 tracking-wide">{client.email}</p>
                                                    </td>
                                                    <td className="p-5 font-bold text-gray-700 text-center">
                                                        <span className="bg-gray-100 text-gray-700 px-3 py-1.5 rounded-lg text-sm">{client.totalOrders}</span>
                                                    </td>
                                                    <td className="p-5 font-black text-[#134c9c] text-right text-lg">{client.totalSpent.toFixed(2)} Lei</td>
                                                    <td className="p-5 text-sm text-gray-600 text-center font-bold bg-gray-50/50">{client.daysSinceLastOrder} days ago</td>
                                                    <td className="p-5 text-center">
                                                        <button
                                                            onClick={() => handleGetAiReason(client)}
                                                            className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest border shadow-sm cursor-pointer transition-all hover:scale-105 ${isHighRisk ? 'bg-red-50 text-red-600 border-red-200 hover:bg-red-100' : isMediumRisk ? 'bg-orange-50 text-orange-600 border-orange-200 hover:bg-orange-100' : 'bg-green-50 text-green-600 border-green-200 hover:bg-green-100'}`}
                                                        >
                                                            {isHighRisk ? <AlertTriangle size={16} strokeWidth={3} /> : isMediumRisk ? <TrendingDown size={16} strokeWidth={3} /> : <CheckCircle2 size={16} strokeWidth={3} />}
                                                            {client.churnRisk}% Risk
                                                        </button>
                                                    </td>
                                                    <td className="p-5 text-center flex justify-center pr-6">
                                                        <Button
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                openPromoConfigurator(client.userId, client.name, hasBeenSent);
                                                            }}
                                                            disabled={!canSendPromo}
                                                            className={`rounded-xl shadow-sm h-12 px-6 transition-all duration-300 min-w-[150px] font-black flex items-center justify-center gap-2 ${hasBeenSent ? 'bg-green-100 text-green-700 border border-green-200 hover:bg-green-200' : canSendPromo ? 'bg-[#134c9c] hover:bg-[#0f3d7d] text-white hover:shadow-md hover:-translate-y-0.5' : 'bg-gray-100 text-gray-400 border border-transparent'}`}
                                                        >
                                                            {hasBeenSent ? <CheckCircle2 size={18} strokeWidth={3} /> : <Send size={18} strokeWidth={2.5} />}
                                                            {hasBeenSent ? "Sent" : "Send Promo"}
                                                        </Button>
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                                {churnClients.length === 0 && (
                                    <div className="text-center p-16 flex flex-col items-center justify-center text-gray-500">
                                        <Users size={48} className="text-gray-300 mb-4" />
                                        <p className="font-bold text-lg text-gray-900 mb-1">Not enough data</p>
                                        <p className="text-sm">Run ML analysis or the script is not currently running.</p>
                                    </div>
                                )}
                            </div>
                            {renderPagination(churnPage, filteredChurnClients.length, setChurnPage)}
                        </>
                    )}
                </CardContent>
            </Card>
            {/* MODAL AI CHURN REASON  */}
            {aiReasonModal && aiReasonModal.show && aiReasonModal.client && (
                <div className="fixed inset-0 z-[150] flex items-center justify-center bg-slate-900/60 backdrop-blur-md px-4">
                    <div className="bg-[#f8fafc] rounded-[2rem] md:rounded-[2.5rem] w-full max-w-lg shadow-2xl relative animate-in zoom-in-95 fade-in duration-300 overflow-hidden border border-white/20">
                        
                        {/* Header Stil Freshli AI */}
                        <div className="relative bg-gradient-to-br from-[#0a2747] via-[#0f3d7d] to-[#134c9c] p-6 sm:p-8 flex items-center justify-between text-white shadow-md overflow-hidden shrink-0 border-b border-blue-900/50">
                            {/* Animated Blobs din Chatbot */}
                            <div className="absolute top-[-50%] right-[-10%] w-[150px] h-[150px] bg-cyan-400/30 rounded-full blur-[30px] pointer-events-none animate-blob z-0"></div>
                            <div className="absolute bottom-[-50%] left-[-10%] w-[120px] h-[120px] bg-blue-400/30 rounded-full blur-[25px] pointer-events-none animate-blob z-0" style={{ animationDelay: "2s" }}></div>
                            <div className="absolute top-[10%] left-[30%] w-[100px] h-[100px] bg-emerald-400/20 rounded-full blur-[20px] pointer-events-none animate-blob z-0" style={{ animationDelay: "4s" }}></div>
                            
                            <div className="flex items-center gap-4 relative z-10">
                                <div className="bg-white/10 p-3 rounded-2xl backdrop-blur-md border border-white/20 shadow-sm relative">
                                    <Bot size={28} className="text-cyan-50 drop-shadow-md" />
                                </div>
                                <div>
                                    <h2 className="text-2xl font-black leading-tight tracking-tight drop-shadow-sm text-white">Freshli AI</h2>
                                    <p className="text-xs text-cyan-100 font-bold uppercase tracking-widest mt-0.5">Retention Analysis</p>
                                </div>
                            </div>
                            
                            <button onClick={() => setAiReasonModal(null)} className="relative z-10 bg-white/10 hover:bg-white/20 p-2.5 rounded-full transition-colors backdrop-blur-sm border border-white/10 text-white">
                                <X size={20} strokeWidth={3} />
                            </button>
                        </div>

                        {/* Body */}
                        <div className="p-6 sm:p-8 bg-white/50 backdrop-blur-xl">
                            <div className="flex items-center gap-2 mb-4 px-2">
                                <Users size={16} className="text-gray-400" />
                                <span className="text-xs font-bold text-gray-500 uppercase tracking-widest">Client: <span className="text-gray-900">{aiReasonModal.client.name}</span></span>
                            </div>

                            <div className="bg-white border border-blue-100/50 rounded-3xl p-6 min-h-[160px] flex flex-col justify-center relative shadow-[0_8px_30px_rgb(0,0,0,0.04)] overflow-hidden">
                                {isGeneratingReason ? (
                                    <div className="flex flex-col items-center justify-center h-full gap-4 text-[#134c9c] py-8">
                                        <Loader2 className="animate-spin" size={36} strokeWidth={2.5} />
                                        <span className="text-xs font-black uppercase tracking-widest text-blue-400/80 animate-pulse">Asking Freshli AI...</span>
                                    </div>
                                ) : (
                                    <div className="text-gray-700 text-sm leading-relaxed font-medium space-y-5">
                                        {aiReasonText.split('\n').filter(line => line.trim() !== '').map((paragraph, index) => {
                                            
                                            // Formatare superioara pentru "Actionable advice"
                                            if (paragraph.toLowerCase().includes("actionable advice")) {
                                                const parts = paragraph.split(/(actionable advice:?)/i);
                                                return (
                                                    <div key={index} className="bg-gradient-to-r from-blue-50 to-cyan-50 p-5 rounded-2xl border border-blue-100/60 shadow-inner mt-6">
                                                        {parts.map((part, i) => 
                                                            part.toLowerCase().includes("actionable advice") 
                                                            ? <span key={i} className="font-black text-[#134c9c] flex items-center gap-2 mb-2 uppercase tracking-widest text-[11px]"><Sparkles size={16} className="text-cyan-500"/> {part}</span> 
                                                            : <span key={i} className="text-[#0a2747] font-semibold">{part.replace(/\*\*/g, '')}</span>
                                                        )}
                                                    </div>
                                                );
                                            }
                                            
                                            return <p key={index} className="text-justify text-gray-600">{paragraph.replace(/\*\*/g, '')}</p>;
                                        })}
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Footer */}
                        <div className="bg-gray-50/80 border-t border-gray-100 p-5 px-8 flex justify-between items-center text-[10px] font-black text-gray-400 uppercase tracking-widest">
                            <span className="flex items-center gap-2">
                                Risk Level: 
                                <span className={`px-2 py-1 rounded-md text-white shadow-sm ${aiReasonModal.client.churnRisk >= 40 ? 'bg-red-500' : aiReasonModal.client.churnRisk >= 20 ? 'bg-orange-500' : 'bg-green-500'}`}>
                                    {aiReasonModal.client.churnRisk}%
                                </span>
                            </span>
                            <span className="flex items-center gap-1.5"><Bot size={14} className="text-cyan-600"/> Powered by LLaMA 3</span>
                        </div>

                    </div>
                </div>
            )}
        </div>
    );
}