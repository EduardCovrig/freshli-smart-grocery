import { Link } from "react-router-dom";
import { Store, ArrowLeft, LayoutDashboard, TrendingUp, Box, Tag, Clock, Users, Bell } from "lucide-react";
import React from "react"; // Ne trebuie React pentru type-ul de Icon

interface AdminSidebarProps {
    activeTab: string;
    setActiveTab: (tab: any) => void;
    isMobileMenuOpen: boolean;
    setIsMobileMenuOpen: (open: boolean) => void;
    expiringCount: number;
    newNotifsCount: number;
}

// Aceasta interfata ii spune Typescript-ului exact la ce sa se astepte
interface NavTab {
    id: 'dashboard' | 'products' | 'expiring' | 'ordersList' | 'notifications' | 'churn' | 'discounts';
    label: string;
    icon: React.ElementType;
    badge?: number;
}

export default function AdminSidebar({ activeTab, setActiveTab, isMobileMenuOpen, setIsMobileMenuOpen, expiringCount, newNotifsCount }: AdminSidebarProps) {
    
    // Folosim tipul strict NavTab[]
    const navTabs: NavTab[] = [
        { id: 'dashboard', label: 'Overview', icon: LayoutDashboard },
           { id: 'churn', label: 'Customer Retention', icon: Users },
        { id: 'ordersList', label: 'Revenue & Orders', icon: TrendingUp },
        { id: 'products', label: 'Manage Products', icon: Box },
        { id: 'discounts', label: 'Manage Discounts', icon: Tag },
        { id: 'expiring', label: 'Clearance', icon: Clock, badge: expiringCount },
        { id: 'notifications', label: 'Activity Hub', icon: Bell, badge: newNotifsCount },
    ];

    return (
        <aside className={`fixed md:sticky md:top-0 left-0 z-50 h-screen md:h-auto md:min-h-[93vh] w-[280px] bg-white border-r border-gray-100 flex flex-col transition-transform duration-300 ease-in-out shadow-2xl md:shadow-none ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}`}>
            <div className="p-6 flex flex-col flex-1 overflow-y-auto">
                <div className="hidden md:flex items-center justify-center gap-2 mb-8 text-[#134c9c] w-full">
                    <Store size={26} className="shrink-0" />
                    <span className="font-black text-xl tracking-tighter text-center leading-tight">
                        Freshli Administrator
                    </span>
                </div>

                <Link to="/" className="inline-flex items-center gap-2 text-sm font-bold text-gray-500 hover:text-[#134c9c] transition-colors mb-6">
                    <ArrowLeft size={16} strokeWidth={3} /> Return to Store
                </Link>

                <div className="space-y-2.5">
                    {navTabs.map((tab) => {
                        const Icon = tab.icon;
                        const isActive = activeTab === tab.id;
                        return (
                            <button 
                                key={tab.id}
                                onClick={() => { setActiveTab(tab.id); setIsMobileMenuOpen(false); }} 
                                className={`w-full flex items-center justify-between px-4 py-3.5 rounded-2xl font-bold text-sm transition-all duration-300 transform-gpu ${isActive ? 'bg-[#134c9c] text-white shadow-md scale-[1.02] relative z-10' : 'bg-transparent text-gray-500 hover:bg-gray-100 hover:text-gray-900 hover:scale-[1.02] hover:z-10 relative'}`}
                            >
                                <div className="flex items-center gap-3">
                                    <Icon size={20} strokeWidth={2.5} /> 
                                    {tab.label}
                                </div>
                                {tab.badge !== undefined && tab.badge > 0 ? (
                                    <span className={`text-[10px] px-2 py-0.5 rounded-full ${isActive ? 'bg-white text-[#134c9c]' : 'bg-red-500 text-white'}`}>
                                        {tab.badge}
                                    </span>
                                ) : null}
                            </button>
                        );
                    })}
                </div>
            </div>
        </aside>
    );
}