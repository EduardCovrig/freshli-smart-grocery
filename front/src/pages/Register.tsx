import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, X, AlertCircle } from "lucide-react";
import { useState } from "react";
import axios from "axios";
import { useAuth } from "@/context/AuthContext";
import { toast } from "sonner";

export default function Register() {
    const [firstName, setFirstName] = useState("");
    const [lastName, setLastName] = useState("");
    const [email, setEmail] = useState("");
    const [phoneNumber, setPhoneNumber] = useState("");
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [serverError, setServerError] = useState<string | null>(null); // Aici se tine eroarea

    //validari de atingere campuri (pentru a afisa mesajele de eroare doar dupa ce utilizatorul a interactionat cu acel camp)
    const [touchedPassword, setTouchedPassword] = useState(false); // daca utilizatorul a scris parola, si dupa a apasat pe altceva
    const [touchedEmail, setTouchedEmail] = useState(false);
    const [touchedPhone, setTouchedPhone] = useState(false);


    const [isLoading, setIsLoading] = useState(false);
    const navigate = useNavigate();
    const {login}=useAuth();

    //reguli de validare
    const isEmailValid = email.includes("@"); //sa aibe @ in el
    const isPhoneValid = phoneNumber.length === 10; // Fix 10 cifre
    const isPasswordValid = password.trim().length >= 8; //minim 8 caractere
    const passwordsMatch = password === confirmPassword; //sa fie la fel

    const isValid =
        firstName.trim().length > 0 &&
        lastName.trim().length > 0 &&
        isEmailValid &&
        isPhoneValid &&
        isPasswordValid &&
        passwordsMatch;

    const handleRegister = async (e: React.SyntheticEvent) => {
        e.preventDefault();

        if (!passwordsMatch) {
            toast.error("Passwords do not match!");
            return;
        }
        setIsLoading(true);
        const apiUrl = import.meta.env.VITE_API_URL;
        try {
            //keys neaparat sa fie EXACT ca în clasa Java (DTO-urile) pentru ca Spring sa poata face maparea automata.
            const payload =
            {
                "firstName": firstName,
                "lastName": lastName,
                "email": email,
                "phoneNumber": phoneNumber,
                "password": password
            }
            await axios.post(`${apiUrl}/auth/register`, payload);

            const loginResponse = await axios.post(`${apiUrl}/auth/login`, {
                email: email,
                password: password
            });
            // console.log("Auto-login reusit! Token:", loginResponse.data);
            // a fost inlocuit console.log-ul cu functia de login efectiva.
            login(loginResponse.data.token);
            navigate("/");
        }
        catch (error: any) {
            console.error("Error registering user:", error);
            if (error.response && error.response.data) {
                // Backend-ul poate trimite string simplu sau obiect JSON
                const message = typeof error.response.data === 'string'
                    ? error.response.data
                    : error.response.data.message || "Something went wrong.";

                setServerError(message);
            } else {
                setServerError("Server not responding. Please try again later.");
            }
        }
        finally {
            setIsLoading(false);
        }
    }
  return (
        <div className="min-h-screen w-full flex items-center justify-center relative overflow-hidden bg-slate-50 px-4 pb-20 pt-10">
            
            {/* BACKGROUND EFFECTS */}
            <div className="absolute inset-0 w-full h-full overflow-hidden z-0 pointer-events-none">
                <div className="absolute top-[-10%] left-[-10%] w-[50vw] h-[50vw] max-w-[600px] max-h-[600px] rounded-full bg-blue-400/30 mix-blend-multiply filter blur-[80px] opacity-70 animate-blob"></div>
                <div className="absolute top-[20%] right-[-10%] w-[50vw] h-[50vw] max-w-[600px] max-h-[600px] rounded-full bg-cyan-300/30 mix-blend-multiply filter blur-[80px] opacity-70 animate-blob" style={{ animationDelay: "2s" }}></div>
                <div className="absolute bottom-[-20%] left-[20%] w-[60vw] h-[60vw] max-w-[700px] max-h-[700px] rounded-full bg-indigo-300/30 mix-blend-multiply filter blur-[80px] opacity-70 animate-blob" style={{ animationDelay: "4s" }}></div>
            </div>

            {/* CARD-UL PROPRIU-ZIS (Glassmorphism) */}
            <Card className="w-full max-w-xl rounded-[2.5rem] shadow-2xl shadow-blue-900/10 border border-white/60 relative p-4 sm:p-6 bg-white/60 backdrop-blur-2xl z-10">
                <Link to="/" className="absolute top-6 right-6 text-gray-500 hover:bg-white/50 hover:text-gray-900 transition-colors rounded-full p-2">
                    <X size={24} strokeWidth={2.5} />
                </Link>

                <CardHeader className="space-y-2 text-center mt-2">
                    <CardTitle className="text-3xl font-black text-gray-900 tracking-tight">Create an Account</CardTitle>
                    <CardDescription className="text-base text-gray-500">Enter your details below to get started</CardDescription>
                </CardHeader>
                
                <CardContent className="mt-2">
                    <form onSubmit={handleRegister} className="space-y-5">

                        {/* NUME SI PRENUME */}
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2.5">
                                <Label htmlFor="firstName" className="text-sm font-bold text-gray-700 ml-1">First Name</Label>
                                <Input id="firstName" placeholder="John" value={firstName}
                                    onChange={(e) => setFirstName(e.target.value)} required
                                    className="h-14 text-base bg-white/60 backdrop-blur-sm border-white/50 rounded-xl focus-visible:ring-[#134c9c] focus:bg-white transition-colors" />
                            </div>
                            <div className="space-y-2.5">
                                <Label htmlFor="lastName" className="text-sm font-bold text-gray-700 ml-1">Last Name</Label>
                                <Input id="lastName" placeholder="Doe" value={lastName}
                                    onChange={(e) => setLastName(e.target.value)} required
                                    className="h-14 text-base bg-white/60 backdrop-blur-sm border-white/50 rounded-xl focus-visible:ring-[#134c9c] focus:bg-white transition-colors" />
                            </div>
                        </div>
                        
                        {/* EMAIL */}
                        <div className="space-y-2.5">
                            <Label htmlFor="email" className="text-sm font-bold text-gray-700 ml-1">Email Address</Label>
                            <Input id="email" type="email" placeholder="name@example.com" value={email}
                                onChange={(e) => setEmail(e.target.value)} required
                                onBlur={() => setTouchedEmail(true)}
                                className={`h-14 text-base backdrop-blur-sm rounded-xl focus-visible:ring-[#134c9c] focus:bg-white transition-colors ${
                                    touchedEmail && !isEmailValid ? "bg-red-50/80 border-red-300 text-red-900" : "bg-white/60 border-white/50"
                                }`}
                            />
                            {touchedEmail && !isEmailValid && (
                                <p className="text-xs font-bold text-red-500 ml-1">Please enter a valid email address.</p>
                            )}
                        </div>
                        
                        {/* TELEFON */}
                        <div className="space-y-2.5">
                            <Label htmlFor="phone" className="text-sm font-bold text-gray-700 ml-1">Phone Number</Label>
                            <Input id="phone" type="tel" required placeholder="0712 345 678" value={phoneNumber}
                                maxLength={10}
                                onKeyDown={(e) => {
                                    const allowedKeys = ["Backspace", "Delete", "Tab", "Enter", "ArrowLeft", "ArrowRight"];
                                    if (!/[0-9]/.test(e.key) && !allowedKeys.includes(e.key)) e.preventDefault();
                                }}
                                onChange={(e) => setPhoneNumber(e.target.value)}
                                onBlur={() => setTouchedPhone(true)}
                                className={`h-14 text-base backdrop-blur-sm rounded-xl focus-visible:ring-[#134c9c] focus:bg-white transition-colors ${
                                    touchedPhone && !isPhoneValid ? "bg-red-50/80 border-red-300 text-red-900" : "bg-white/60 border-white/50"
                                }`}
                            />
                            {touchedPhone && !isPhoneValid && (
                                <p className="text-xs font-bold text-red-500 ml-1">Phone number must be exactly 10 digits.</p>
                            )}
                        </div>
                        
                        {/* PAROLA */}
                        <div className="space-y-2.5">
                            <Label htmlFor="password" className="text-sm font-bold text-gray-700 ml-1">Password</Label>
                            <Input id="password" type="password" placeholder="Minimum 8 characters" value={password} required
                                onChange={(e) => setPassword(e.target.value)}
                                onBlur={() => setTouchedPassword(true)} 
                                className={`h-14 text-base backdrop-blur-sm rounded-xl focus-visible:ring-[#134c9c] focus:bg-white transition-colors ${
                                    touchedPassword && password.length < 8 ? "bg-red-50/80 border-red-300 text-red-900" : "bg-white/60 border-white/50"
                                }`}
                            />
                            {touchedPassword && password.length < 8 && (
                                <p className="text-xs font-bold text-red-500 ml-1">Password must be at least 8 characters long.</p>
                            )}
                        </div>

                        {/* CONFIRMARE PAROLA */}
                        <div className="space-y-2.5">
                            <Label htmlFor="confirmPassword" className="text-sm font-bold text-gray-700 ml-1">Confirm Password</Label>
                            <Input id="confirmPassword" type="password" placeholder="Repeat password" value={confirmPassword} required
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                className={`h-14 text-base backdrop-blur-sm rounded-xl focus-visible:ring-[#134c9c] focus:bg-white transition-colors ${
                                    confirmPassword && !passwordsMatch ? "bg-red-50/80 border-red-300 text-red-900" : "bg-white/60 border-white/50"
                                }`} 
                            />
                            {confirmPassword && !passwordsMatch && (
                                <p className="text-xs font-bold text-red-500 ml-1">Passwords do not match.</p>
                            )}
                        </div>

                        {/* Server Error */}
                        {serverError && (
                            <div className="bg-red-50/90 backdrop-blur-sm border border-red-200 text-red-600 px-4 py-3 rounded-2xl flex items-center justify-center gap-2 animate-in fade-in">
                                <AlertCircle size={18} strokeWidth={2.5} />
                                <span className="text-sm font-bold">{serverError}</span>
                            </div>
                        )}

                        {/* Submit Button */}
                        <Button disabled={!isValid || isLoading} type="submit" 
                            className={`w-full h-14 rounded-2xl font-black text-lg mt-6 transition-all duration-300 ${
                                isValid 
                                ? "bg-[#134c9c] hover:bg-[#0f3d7d] text-white shadow-xl shadow-blue-900/20 hover:-translate-y-1" 
                                : "bg-gray-300/50 text-gray-500 cursor-not-allowed shadow-none"
                            }`}>
                            {isLoading ? (
                                <Loader2 className="h-6 w-6 animate-spin" />
                            ) : (
                                "Create Account"
                            )}
                        </Button>

                    </form>
                </CardContent>

                <CardFooter className="flex justify-center pb-4 pt-2">
                    <p className="text-sm font-medium text-gray-600">Already have an account?
                        <Link to="/login" className="text-[#134c9c] hover:underline ml-1.5 font-bold">Login here</Link>
                    </p>
                </CardFooter>
            </Card>
        </div>
    )
}
