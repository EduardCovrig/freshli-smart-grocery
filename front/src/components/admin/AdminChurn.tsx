import { useState, useEffect } from "react";
import axios from "axios";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Users, Loader2, AlertTriangle, CheckCircle2, TrendingDown, Send } from "lucide-react";

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
    setPromoModal: (modal: any) => void;
    sentPromos: number[];
    handleSendPromo: (clientId: number, clientName: string) => void;
}

export default function AdminChurn({ token, setPromoModal, sentPromos, handleSendPromo }: AdminChurnProps) {
    const [churnClients, setChurnClients] = useState<ChurnData[]>([]);
    const [isLoadingChurn, setIsLoadingChurn] = useState(false);
    const [churnPage, setChurnPage] = useState(1);
    const ITEMS_PER_PAGE = 10;

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

    const paginatedChurn = churnClients.slice((churnPage - 1) * ITEMS_PER_PAGE, churnPage * ITEMS_PER_PAGE);
    const totalPages = Math.ceil(churnClients.length / ITEMS_PER_PAGE) || 1;

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
                                                <tr key={client.userId} className="group hover:bg-blue-50/30 transition-colors border-b border-gray-50">
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
                                                        <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest border shadow-sm ${isHighRisk ? 'bg-red-50 text-red-600 border-red-200' : isMediumRisk ? 'bg-orange-50 text-orange-600 border-orange-200' : 'bg-green-50 text-green-600 border-green-200'}`}>
                                                            {isHighRisk ? <AlertTriangle size={16} strokeWidth={3}/> : isMediumRisk ? <TrendingDown size={16} strokeWidth={3} /> : <CheckCircle2 size={16} strokeWidth={3} />}
                                                            {client.churnRisk}% Risk
                                                        </div>
                                                    </td>
                                                    <td className="p-5 text-center flex justify-center pr-6">
                                                        <Button
                                                            onClick={() => {
                                                                if (hasBeenSent) setPromoModal({ show: true, clientId: client.userId, clientName: client.name });
                                                                else handleSendPromo(client.userId, client.name);
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
                            {renderPagination(churnPage, churnClients.length, setChurnPage)}
                        </>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}