import { lazy, Suspense } from 'react';
import { Route, Routes } from 'react-router-dom';
import ShopLayout from './components/ShopLayout.jsx';
import Home from './pages/Home.jsx';
import Catalog from './pages/Catalog.jsx';
import Cart from './pages/Cart.jsx';
import OrderDone from './pages/OrderDone.jsx';
import NotFound from './pages/NotFound.jsx';

// The owner dashboard is loaded only when someone opens /admin
const Admin = lazy(() => import('./admin/Admin.jsx'));

export default function App() {
  return (
    <Routes>
      <Route element={<ShopLayout />}>
        <Route index element={<Home />} />
        <Route path="katalogu" element={<Catalog />} />
        <Route path="shporta" element={<Cart />} />
        <Route path="porosia/:code" element={<OrderDone />} />
        <Route path="*" element={<NotFound />} />
      </Route>
      <Route
        path="admin/*"
        element={<Suspense fallback={<div className="min-h-screen bg-bone" />}><Admin /></Suspense>}
      />
    </Routes>
  );
}
