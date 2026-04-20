import { Link } from "react-router-dom";
import { ArrowUp, Mail, MapPin } from "lucide-react";

export default function Footer()
{
    const supportEmail=import.meta.env.VITE_STORE_EMAIL || "contact@freshli.store";
    const scrollToTop = () => {
        window.scrollTo({ top: 0, behavior: "smooth" });
    };
    return (
        <footer className="bg-slate-900 text-slate-300 py-10 px-4 sm:px-6 lg:px-8 border-t border-slate-800 mt-auto">
            <div className="max-w-[1400px] mx-auto grid grid-cols-1 md:grid-cols-3 gap-8 mb-8 border-b border-slate-800 pb-8">
                
                {/* 1. Brand & Logo */}
                <div className="space-y-4">
                    <Link to="/" className="flex items-center gap-2 group">
                        {/* Imaginea logo-ului (invert ca sa se vada alb pe fundalul negru) */}
                        <img src="/logo-full.png" alt="Freshli Logo" className="h-8 w-auto object-contain brightness-0 invert" />
                    </Link>
                    <p className="text-sm leading-relaxed max-w-xs text-slate-400">
                        Smarter choices, better prices. Your personalized grocery platform powered by artificial intelligence.
                    </p>
                </div>

                {/* 2. Quick Links */}
                <div className="space-y-4">
                    <h3 className="text-white font-bold tracking-widest uppercase text-sm">Quick Links</h3>
                    <ul className="space-y-2 text-sm font-medium">
                        <li><Link to="/" className="hover:text-blue-400 transition-colors">Home / Catalog</Link></li>
                        <li><Link to="/cart" className="hover:text-blue-400 transition-colors">Shopping Cart</Link></li>
                        <li><Link to="/profile" className="hover:text-blue-400 transition-colors">My Account</Link></li>
                    </ul>
                </div>

                {/* 3. Contact & Support */}
                <div className="space-y-4">
                    <h3 className="text-white font-bold tracking-widest uppercase text-sm">Contact & Support</h3>
                    <ul className="space-y-3 text-sm font-medium">
                        <li className="flex items-center gap-3">
                            <div className="p-2 bg-slate-800 rounded-lg"><Mail size={16} className="text-blue-400" /></div>
                            <a href={`mailto:${supportEmail}`} className="hover:text-white transition-colors">{supportEmail}</a>
                        </li>
                        <li className="flex items-center gap-3">
                            <div className="p-2 bg-slate-800 rounded-lg"><MapPin size={16} className="text-blue-400" /></div>
                            <span>Bucharest, Romania</span>
                        </li>
                    </ul>
                </div>
            </div>

            {/* Bottom Bar: Copyright & Back to Top */}
            <div className="max-w-[1400px] mx-auto flex flex-col sm:flex-row justify-between items-center gap-6 text-xs font-medium text-slate-500">
                <p>&copy; {new Date().getFullYear()} Freshli Store. All rights reserved.</p>
                <button
                    onClick={scrollToTop}
                    className="flex items-center gap-2 bg-slate-800 hover:bg-[#134c9c] text-white px-5 py-2.5 rounded-full transition-all shadow-lg hover:-translate-y-1"
                >
                    Back to top <ArrowUp size={14} strokeWidth={3} />
                </button>
            </div>
        </footer>
    );
}