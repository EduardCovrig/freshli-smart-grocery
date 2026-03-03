import { Link } from "react-router-dom"
import { Button } from "@/components/ui/button";

export default function NotFound() {
    return (
       <div className="min-h-[90vh] bg-[#f8fafc] flex flex-col items-center justify-center p-4">
    <div className="bg-white max-w-xl w-full p-14 rounded-[3rem] shadow-xl shadow-blue-900/5 border border-gray-100 flex flex-col items-center text-center animate-in zoom-in-95 fade-in duration-500">
        <h1 className="text-8xl font-black text-[#134c9c] mb-4">404</h1>
        <h2 className="text-3xl font-black text-gray-900 mb-4 tracking-tight">Page not found</h2>
        <p className="text-gray-500 text-lg mb-10">It looks like the product you're searching for doesn't exist anymore.</p>
        {/* Butonul tau premium aici */}
            <Link to="/">
                <Button className="w-full h-14 rounded-2xl bg-[#134c9c] hover:bg-[#0f3d7d] text-white font-black text-lg shadow-xl shadow-blue-900/20 hover:-translate-y-1 transition-all flex items-center justify-center gap-3">
                    Search for other food items
                </Button>
            </Link>

        </div>
       
</div>

    )
}