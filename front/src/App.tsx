import Home from "./pages/Home"
import Login from "./pages/Login"
import Register from "./pages/Register"
import Cart from "./pages/Cart"
import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom"
import Navbar from "./components/Navbar"
import { ProtectedRoute } from "./components/ProtectedRoute"
import NotFound from "./pages/NotFound"
import ProductDetails from "./pages/ProductDetails"
import Checkout from "./pages/Checkout"
import Profile from "./pages/Profile"
import ScrollToTop from "./components/ScrollToTop"
import AdminDashboard from "./pages/AdminDashboard"
import { Toaster } from "@/components/ui/sonner";
import Footer from "./components/Footer"
import Chatbot from "./components/Chatbot"
import ResetPassword from "./pages/ResetPassword"

function ChatbotWrapper() {
  const location = useLocation();
  const hiddenRoutes = ["/login", "/register", "/reset-password"]; // Ascundem chatbot-ul pe paginile de login, register si reset-password 
  
  if (hiddenRoutes.includes(location.pathname)) {
    return null;
  }
  
  return <Chatbot />;
}

function App() {
  return (
    <BrowserRouter>
      <ScrollToTop /> {/* Componenta care se asigura ca la schimbarea paginii, scroll-ul e sus */}
      <div className="flex flex-col min-h-screen">
        <Navbar />
        <main className="flex-1">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/reset-password" element={<ResetPassword />}/>
            <Route path="/product/:id" element={<ProductDetails />} />
            <Route path="/cart" element={
              <ProtectedRoute>
                <Cart />
              </ProtectedRoute>} />
            <Route path="/checkout" element={
              <ProtectedRoute>
                <Checkout />
              </ProtectedRoute>} />
            <Route path="/profile" element={
              <ProtectedRoute>
                <Profile />
              </ProtectedRoute>} />
            <Route path="/admin" element={
              <ProtectedRoute>
                <AdminDashboard />
              </ProtectedRoute>}
            />

            {/* path="*" -> orice altceva */}
            <Route path='*' element={<NotFound />} />
          </Routes>
        </main>
        <Footer />
      </div>
      <ChatbotWrapper />
      <Toaster richColors position="bottom-right" />
    </BrowserRouter>
  )
}

export default App  