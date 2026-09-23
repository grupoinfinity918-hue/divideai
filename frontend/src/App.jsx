import { BrowserRouter, Routes, Route } from 'react-router-dom';

import Home from './pages/Home';
import SellerChats from './pages/seller/SellerChats';
import StoreSettings from './pages/seller/StoreSettings';
import AdminDashboard from './pages/admin/AdminDashboard';
import ChatMonitoring from './pages/admin/ChatMonitoring';
import ListingApproval from './pages/admin/ListingApproval';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />

        <Route path="/loja/atendimentos" element={<SellerChats />} />
        <Route path="/loja/configuracoes" element={<StoreSettings />} />

        <Route path="/admin" element={<AdminDashboard />} />
        <Route path="/admin/chats" element={<ChatMonitoring />} />
        <Route path="/admin/anuncios/aprovacao" element={<ListingApproval />} />

        <Route path="*" element={<Home />} />
      </Routes>
    </BrowserRouter>
  );
}
