import { useState, useEffect } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Loader2, X, AlertCircle, CheckCircle2, Lock, Eye, EyeOff } from "lucide-react";
import axios from "axios";

export default function ResetPassword() {
    const [searchParams] = useSearchParams();
    const token = searchParams.get("token");
    const navigate = useNavigate();

    const [newPassword, setNewPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState(false);

    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);

    const isValid = newPassword.length >= 8 && newPassword === confirmPassword;

    // Daca cineva intra pe pagina fara token in link, il trimitem la login
    useEffect(() => {
        if (!token) {
            navigate("/login");
        }
    }, [token, navigate]);

    const handleReset = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!isValid) return;

        setIsLoading(true);
        setError("");

        try {
            const apiUrl = import.meta.env.VITE_API_URL;
            await axios.post(`${apiUrl}/auth/reset-password`, {
                token: token,
                newPassword: newPassword
            });
            setSuccess(true);
        } catch (err: any) {
            setError(err.response?.data || "Failed to reset password. The link might be expired.");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen w-full flex items-center justify-center relative overflow-hidden bg-slate-50 px-4 pb-20 pt-10">
            {/* BACKGROUND EFFECTS */}
            <div className="absolute inset-0 w-full h-full overflow-hidden z-0 pointer-events-none">
                <div className="absolute top-[-10%] left-[-10%] w-[50vw] h-[50vw] max-w-[600px] max-h-[600px] rounded-full bg-blue-400/30 mix-blend-multiply filter blur-[80px] opacity-70 animate-blob"></div>
                <div className="absolute top-[20%] right-[-10%] w-[50vw] h-[50vw] max-w-[600px] max-h-[600px] rounded-full bg-cyan-300/30 mix-blend-multiply filter blur-[80px] opacity-70 animate-blob" style={{ animationDelay: "2s" }}></div>
                <div className="absolute bottom-[-20%] left-[20%] w-[60vw] h-[60vw] max-w-[700px] max-h-[700px] rounded-full bg-indigo-300/30 mix-blend-multiply filter blur-[80px] opacity-70 animate-blob" style={{ animationDelay: "4s" }}></div>
            </div>

            <Card className="w-full max-w-lg rounded-[2.5rem] shadow-2xl shadow-blue-900/10 border border-white/60 relative p-4 sm:p-6 bg-white/60 backdrop-blur-2xl z-10 animate-in fade-in zoom-in-95">
                <Link to="/login" className="absolute top-6 right-6 text-gray-500 hover:bg-white/50 hover:text-gray-900 transition-colors rounded-full p-2">
                    <X size={24} strokeWidth={2.5} />
                </Link>

                {success ? (
                    <CardContent className="pt-10 flex flex-col items-center text-center">
                        <div className="w-20 h-20 bg-green-50 text-green-500 rounded-full flex items-center justify-center mb-6">
                            <CheckCircle2 size={40} strokeWidth={2.5} />
                        </div>
                        <h2 className="text-3xl font-black text-gray-900 mb-4 tracking-tight">Password Reset!</h2>
                        <p className="text-gray-500 text-lg mb-8 leading-relaxed">
                            Your password has been successfully changed. You can now log in using your new credentials.
                        </p>
                        <Link to="/login" className="w-full">
                            <Button className="w-full h-14 text-lg font-black rounded-2xl bg-gray-900 text-white hover:bg-gray-800 transition-all hover:-translate-y-0.5">
                                Go to Login
                            </Button>
                        </Link>
                    </CardContent>
                ) : (
                    <>
                        <CardHeader className="space-y-2 text-center mt-4">
                            <div className="mx-auto w-16 h-16 bg-blue-50 text-[#134c9c] rounded-2xl flex items-center justify-center mb-2">
                                <Lock size={32} />
                            </div>
                            <CardTitle className="text-3xl font-black text-gray-900 tracking-tight">Set New Password</CardTitle>
                            <CardDescription className="text-base text-gray-500">Please enter your new password below.</CardDescription>
                        </CardHeader>
                        
                        <CardContent className="mt-4">
                            <form onSubmit={handleReset} className="space-y-5">
                                {error && (
                                    <div className="bg-red-50/90 backdrop-blur-sm border border-red-200 text-red-600 px-4 py-3 rounded-2xl flex items-center gap-3 animate-in fade-in">
                                        <AlertCircle size={20} className="shrink-0" />
                                        <span className="text-sm font-bold leading-tight">{error}</span>
                                    </div>
                                )}
                                
                                <div className="space-y-2.5">
                                    <Label htmlFor="newPassword" className="text-sm font-bold text-gray-700 ml-1">New Password</Label>
                                    <div className="relative">
                                        <Input id="newPassword" type={showPassword ? "text" : "password"} placeholder="Minimum 8 characters" value={newPassword}
                                            onChange={(e) => setNewPassword(e.target.value)} required 
                                            className="h-14 text-base pr-12 bg-white/60 backdrop-blur-sm border-white/50 rounded-xl focus-visible:ring-[#134c9c] focus:bg-white transition-colors" />
                                        <button type="button" onClick={() => setShowPassword(!showPassword)} tabIndex={-1}
                                            className="absolute right-3 top-1/2 -translate-y-1/2 p-2 text-gray-400 hover:text-gray-600 transition-colors rounded-full hover:bg-gray-100">
                                            {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                                        </button>
                                    </div>
                                </div>
                                
                                <div className="space-y-2.5">
                                    <Label htmlFor="confirmPassword" className="text-sm font-bold text-gray-700 ml-1">Confirm New Password</Label>
                                    <div className="relative">
                                        <Input id="confirmPassword" type={showConfirmPassword ? "text" : "password"} placeholder="Repeat new password" value={confirmPassword}
                                            onChange={(e) => setConfirmPassword(e.target.value)} required 
                                            className={`h-14 text-base pr-12 backdrop-blur-sm rounded-xl focus-visible:ring-[#134c9c] focus:bg-white transition-colors ${
                                                confirmPassword.length > 0 && newPassword !== confirmPassword ? "border-red-300 bg-red-50/50" : "border-white/50 bg-white/60"
                                            }`} />
                                        <button type="button" onClick={() => setShowConfirmPassword(!showConfirmPassword)} tabIndex={-1}
                                            className="absolute right-3 top-1/2 -translate-y-1/2 p-2 text-gray-400 hover:text-gray-600 transition-colors rounded-full hover:bg-gray-100">
                                            {showConfirmPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                                        </button>
                                    </div>
                                    {confirmPassword.length > 0 && newPassword !== confirmPassword && (
                                        <p className="text-xs font-bold text-red-500 ml-1 mt-1">Passwords do not match.</p>
                                    )}
                                </div>
                            
                                <Button disabled={!isValid || isLoading} type="submit" 
                                    className={`w-full h-14 rounded-2xl font-black text-lg mt-6 transition-all duration-300 ${
                                        isValid 
                                        ? "bg-[#134c9c] hover:bg-[#0f3d7d] text-white shadow-xl shadow-blue-900/20 hover:-translate-y-1" 
                                        : "bg-gray-300/50 text-gray-500 cursor-not-allowed shadow-none"
                                    }`}>
                                    {isLoading ? <Loader2 className="h-6 w-6 animate-spin" /> : "Save New Password"}
                                </Button>
                            </form>
                        </CardContent>
                    </>
                )}
            </Card>
        </div>
    );
}