import { Link, useNavigate } from "react-router-dom"
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle} from "@/components/ui/card";
import { Loader2, X, AlertCircle, Mail, Eye, EyeOff, Send, CheckCircle2} from "lucide-react";
import { useState } from "react"
import axios from "axios";
import { useAuth } from "@/context/AuthContext";
import { toast } from "sonner";

export default function Login() {
    const [email, setEmail] = useState(""); //useState<string>("")
    const [password, setPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [isLoading, setIsLoading] = useState(false)
    const isValid = email.trim().length > 0 && password.trim().length > 0; // trim elimina space-urile de la inceput si sfarsit.
    const [loginError, setLoginError] = useState(false);
    const navigate = useNavigate();
    const {login}=useAuth();
    //Stari pentru modal-ul de Forgot Password
    const [showForgotModal, setShowForgotModal] = useState(false);
    const [forgotEmail, setForgotEmail] = useState("");
    const [isSendingForgot, setIsSendingForgot] = useState(false);
    const [forgotSuccess, setForgotSuccess] = useState(false);
    

    const handleLogin = async (e: React.SyntheticEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setLoginError(false); //resetam eroarea la fiecare incercare
        const apiUrl = import.meta.env.VITE_API_URL;
        try {
            const response = await axios.post(`${apiUrl}/auth/login`,
                {
                    email: email,
                    password: password
                });
            //console.log("Raspuns de la server:", response.data);
            // a fost inlocuit console.log-ul cu functia de login efectiva.
            login(response.data.token); // Contextul preia controlul, salveaza in localStorage, decodeaza userul
            navigate("/");
        }
        catch (error: any) {
            console.error("Error logging in:", error);
            setLoginError(true);
        }
        finally {
            setIsLoading(false);
        }
    };

    const handleForgotPassword = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!forgotEmail.trim() || !forgotEmail.includes("@")) return;

        setIsSendingForgot(true);
        try {
            const apiUrl = import.meta.env.VITE_API_URL;
            await axios.post(`${apiUrl}/auth/forgot-password`, { email: forgotEmail.trim() });
            setForgotSuccess(true);
        } catch (err) {
            console.error(err);
            toast.error("Failed to send reset email. Please try again.");
        } finally {
            setIsSendingForgot(false);
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

            {/* CARD-UL PROPRIU-ZIS (Glassmorphism) */}
            <Card className="w-full max-w-lg rounded-[2.5rem] shadow-2xl shadow-blue-900/10 border border-white/60 relative p-4 sm:p-6 bg-white/60 backdrop-blur-2xl z-10">
                <Link to="/" className="absolute top-6 right-6 text-gray-500 hover:bg-white/50 hover:text-gray-900 transition-colors rounded-full p-2">
                    <X size={24} strokeWidth={2.5} />
                </Link>
                
                <CardHeader className="space-y-2 text-center mt-4">
                    <CardTitle className="text-3xl font-black text-gray-900 tracking-tight">Welcome back!</CardTitle>
                    <CardDescription className="text-base text-gray-500">Please enter your credentials to access your account.</CardDescription>
                </CardHeader>
                
                <CardContent className="mt-4">
                    <form onSubmit={handleLogin} className="space-y-5">
                        {/* Mesaj de eroare */}
                        {loginError && (
                            <div className="bg-red-50/90 backdrop-blur-sm border border-red-200 text-red-600 px-4 py-3 rounded-2xl flex items-center justify-center gap-2 animate-in fade-in zoom-in-95">
                                <AlertCircle size={18} strokeWidth={2.5} />
                                <span className="text-sm font-bold">Email or password is not correct</span>
                            </div>
                        )}
                        
                        {/* Email */}
                        <div className="space-y-2.5">
                            <Label htmlFor="email" className="text-sm font-bold text-gray-700 ml-1">Email Address</Label>
                            <Input id="email" type="email" placeholder="name@example.com" value={email}
                                onChange={(e) => setEmail(e.target.value)} required 
                                className="h-14 text-base bg-white/60 backdrop-blur-sm border-white/50 rounded-xl focus-visible:ring-[#134c9c] focus:bg-white transition-colors" />
                        </div>
                        
                        {/* Password */}
                        <div className="space-y-2.5">
                            <div className="flex items-center justify-between ml-1 pr-1">
                                <Label htmlFor="password" className="text-sm font-bold text-gray-700">Password</Label>
                                <button 
                                    type="button" 
                                    onClick={() => setShowForgotModal(true)} 
                                    className="text-xs font-black text-[#134c9c] hover:text-blue-800 transition-colors hover:underline"
                                >
                                    Forgot password?
                                </button>
                            </div>
                            <div className="relative">
                                <Input
                                    id="password"
                                    type={showPassword ? "text" : "password"}
                                    placeholder="Your password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    required
                                    className="h-14 text-base pr-12 bg-white/60 backdrop-blur-sm border-white/50 rounded-xl focus-visible:ring-[#134c9c] focus:bg-white transition-colors"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 p-2 text-gray-400 hover:text-gray-600 transition-colors rounded-full hover:bg-gray-100"
                                    tabIndex={-1} // Sa nu primeasca focus din greseala cand dai TAB
                                >
                                    {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                                </button>
                            </div>
                        </div>
                    
                        {/* Submit Button */}
                        <Button disabled={!isValid || isLoading} type="submit" 
                            className={`w-full h-14 rounded-2xl font-black text-lg mt-4 transition-all duration-300 ${
                                isValid 
                                ? "bg-[#134c9c] hover:bg-[#0f3d7d] text-white shadow-xl shadow-blue-900/20 hover:-translate-y-1" 
                                : "bg-gray-300/50 text-gray-500 cursor-not-allowed shadow-none"
                            }`}>
                            {isLoading ? (
                                <Loader2 className="h-6 w-6 animate-spin" />
                            ) : (
                                "Login to Account"
                            )}
                        </Button>
                    </form>
                </CardContent>
                
                <CardFooter className="flex justify-center pb-6">
                    <p className="text-sm font-medium text-gray-600">Don't have an account yet?
                        <Link to="/register" className="text-[#134c9c] hover:underline ml-1.5 font-bold">Sign up</Link>
                    </p>
                </CardFooter>
            </Card>
            
            {/* --- MODAL FORGOT PASSWORD --- */}
            {showForgotModal && (
                <div className="fixed inset-0 z-[150] flex items-center justify-center bg-slate-900/40 backdrop-blur-sm px-4">
                    <div className="bg-white/90 backdrop-blur-2xl border border-white/50 rounded-[2.5rem] p-8 sm:p-10 max-w-md w-full shadow-2xl relative animate-in zoom-in-95 fade-in duration-300">
                        <button 
                            onClick={() => setShowForgotModal(false)} 
                            className="absolute top-6 right-6 text-gray-400 hover:text-gray-900 transition-colors bg-white/50 hover:bg-white p-2 rounded-full"
                        >
                            <X size={20} strokeWidth={3} />
                        </button>

                        {forgotSuccess ? (
                            <div className="flex flex-col items-center text-center animate-in fade-in zoom-in-95">
                                <div className="w-20 h-20 bg-green-50 text-green-500 rounded-full flex items-center justify-center mb-6">
                                    <CheckCircle2 size={40} strokeWidth={2.5} />
                                </div>
                                <h2 className="text-3xl font-black text-gray-900 mb-4 tracking-tight">Email Sent!</h2>
                                <p className="text-gray-500 text-lg mb-8 leading-relaxed">
                                    If an account exists for <strong className="text-gray-900">{forgotEmail}</strong>, we've sent an email to reset your password. Please check your inbox (and spam folder).
                                </p>
                                <Button onClick={() => setShowForgotModal(false)} className="w-full h-14 text-lg font-black rounded-2xl bg-gray-900 text-white hover:bg-gray-800 transition-all hover:-translate-y-0.5">
                                    Return to Login
                                </Button>
                            </div>
                        ) : (
                            <>
                                <div className="flex items-center gap-4 mb-6">
                                    <div className="w-14 h-14 rounded-full flex items-center justify-center bg-blue-100/50 text-[#134c9c] shrink-0 border border-blue-200/50">
                                        <Mail size={28} />
                                    </div>
                                    <h2 className="text-2xl font-black text-gray-900 leading-tight">Password Reset</h2>
                                </div>

                                <p className="text-gray-600 mb-6 text-base leading-relaxed font-medium">
                                    Enter your email address and we'll send you an email to regain access to your account.
                                </p>

                                <form onSubmit={handleForgotPassword} className="space-y-6">
                                    <div className="space-y-2">
                                        <Label htmlFor="forgot-email" className="text-xs font-bold text-gray-500 uppercase tracking-widest ml-1">Email Address</Label>
                                        <Input 
                                            id="forgot-email" 
                                            type="email" 
                                            placeholder="name@example.com" 
                                            value={forgotEmail}
                                            onChange={(e) => setForgotEmail(e.target.value)}
                                            required
                                            autoFocus
                                            className="h-14 text-base bg-white border-gray-200 rounded-xl focus-visible:ring-[#134c9c]" 
                                        />
                                    </div>

                                    <Button
                                        type="submit"
                                        disabled={!forgotEmail.includes("@") || isSendingForgot}
                                        className="w-full h-14 text-lg font-black rounded-2xl shadow-lg shadow-blue-900/20 bg-[#134c9c] hover:bg-[#0f3d7d] text-white transition-all hover:-translate-y-0.5 flex gap-2"
                                    >
                                        {isSendingForgot ? <Loader2 className="animate-spin w-6 h-6" /> : <><Send size={18} className="-mt-0.5"/> Send Reset Link</>}
                                    </Button>
                                </form>
                            </>
                        )}
                    </div>
                </div>
            )}
        </div>
    )
}