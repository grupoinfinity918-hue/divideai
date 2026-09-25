import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/common/ProtectedRoute';

import Home from './pages/Home';
import ShowcaseFull from './pages/ShowcaseFull';
import ProductDetail from './pages/ProductDetail';
import Checkout from './pages/Checkout';
import MyPurchases from './pages/MyPurchases';
import MyChatsPage from './pages/MyChatsPage';
import SaleChatPage from './pages/SaleChatPage';
import PreSaleChatPage from './pages/PreSaleChatPage';
import SupportChatPage from './pages/SupportChatPage';
import SellerStorePage from './pages/SellerStorePage';
import ProfileSettings from './pages/ProfileSettings';
import Login from './pages/auth/Login';
import Register from './pages/auth/Register';

import SellerDashboard from './pages/seller/SellerDashboard';
import AdminDashboard from './pages/admin/AdminDashboard';

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/vitrine/:tipo" element={<ShowcaseFull />} />
          <Route path="/produto/:id" element={<ProductDetail />} />
          <Route path="/loja/:id" element={<SellerStorePage />} />
          <Route path="/login" element={<Login />} />
          <Route path="/cadastro" element={<Register />} />

          <Route
            path="/perfil"
            element={
              <ProtectedRoute>
                <ProfileSettings />
              </ProtectedRoute>
            }
          />
          <Route
            path="/meus-chats"
            element={
              <ProtectedRoute>
                <MyChatsPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/chat-venda/:protocol"
            element={
              <ProtectedRoute>
                <SaleChatPage />
              </ProtectedRoute>
            }
          />

          <Route
            path="/chat-duvidas/:id"
            element={
              <ProtectedRoute>
                <PreSaleChatPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/suporte/:id"
            element={
              <ProtectedRoute>
                <SupportChatPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/checkout/:orderId"
            element={
              <ProtectedRoute>
                <Checkout />
              </ProtectedRoute>
            }
          />
          <Route
            path="/minhas-compras"
            element={
              <ProtectedRoute>
                <MyPurchases />
              </ProtectedRoute>
            }
          />

          <Route
            path="/loja"
            element={
              <ProtectedRoute>
                <SellerDashboard />
              </ProtectedRoute>
            }
          />

          <Route
            path="/admin"
            element={
              <ProtectedRoute roles={['ADMIN', 'SUPPORT']}>
                <AdminDashboard />
              </ProtectedRoute>
            }
          />

          <Route path="*" element={<Home />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
