import { Link, useNavigate } from "react-router-dom"
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, X, AlertCircle} from "lucide-react";
import { useState } from "react"
import axios from "axios";
import { useAuth } from "@/context/AuthContext";

export default function Login() {
    const [email, setEmail] = useState(""); //useState<string>("")
    const [password, setPassword] = useState("");
    const [isLoading, setIsLoading] = useState(false)
    const isValid = email.trim().length > 0 && password.trim().length > 0; // trim elimina space-urile de la inceput si sfarsit.
    const [loginError, setLoginError] = useState(false);
    const navigate = useNavigate();
    const {login}=useAuth();

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
return (
        <div className="min-h-screen flex items-center justify-center bg-[#f8fafc] px-4 pb-32 pt-10">
            <Card className="w-full max-w-lg rounded-[2.5rem] shadow-2xl shadow-blue-900/5 border border-gray-100 relative p-4 sm:p-6 bg-white">
                <Link to="/" className="absolute top-6 right-6 text-gray-400 hover:bg-gray-100 hover:text-gray-900 transition-colors rounded-full p-2">
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
                            <div className="bg-red-50 border border-red-100 text-red-600 px-4 py-3 rounded-2xl flex items-center justify-center gap-2 animate-in fade-in zoom-in-95">
                                <AlertCircle size={18} strokeWidth={2.5} />
                                <span className="text-sm font-bold">Email or password is not correct</span>
                            </div>
                        )}
                        
                        {/* Email */}
                        <div className="space-y-2.5">
                            <Label htmlFor="email" className="text-sm font-bold text-gray-600 ml-1">Email Address</Label>
                            <Input id="email" type="email" placeholder="name@example.com" value={email}
                                onChange={(e) => setEmail(e.target.value)} required 
                                className="h-14 text-base bg-gray-50 border-gray-200 rounded-xl focus-visible:ring-[#134c9c] transition-colors" />
                        </div>
                        
                        {/* Password */}
                        <div className="space-y-2.5">
                            <Label htmlFor="password" className="text-sm font-bold text-gray-600 ml-1">Password</Label>
                            <Input id="password" type="password" placeholder="Your password" value={password}
                                onChange={(e) => setPassword(e.target.value)} required 
                                className="h-14 text-base bg-gray-50 border-gray-200 rounded-xl focus-visible:ring-[#134c9c] transition-colors" />
                        </div>
                        
                        {/* Submit Button */}
                        <Button disabled={!isValid || isLoading} type="submit" 
                            className={`w-full h-14 rounded-2xl font-black text-lg mt-4 transition-all duration-300 ${
                                isValid 
                                ? "bg-[#134c9c] hover:bg-[#0f3d7d] text-white shadow-xl shadow-blue-900/20 hover:-translate-y-1" 
                                : "bg-gray-100 text-gray-400 cursor-not-allowed shadow-none"
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
                    <p className="text-sm font-medium text-gray-500">Don't have an account yet?
                        <Link to="/register" className="text-[#134c9c] hover:underline ml-1.5 font-bold">Sign up</Link>
                    </p>
                </CardFooter>
            </Card>
        </div>
    )
}