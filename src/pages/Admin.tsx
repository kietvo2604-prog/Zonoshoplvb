import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Users, CreditCard, Package, LayoutDashboard, LogOut, ChevronLeft, Gamepad2, ShoppingBag, FolderOpen, Tag, UserPlus, FileText, Rocket, Server } from "lucide-react";
import AdminUsers from "@/components/admin/AdminUsers";
import AdminTopups from "@/components/admin/AdminTopups";
import AdminProducts from "@/components/admin/AdminProducts";
import AdminOverview from "@/components/admin/AdminOverview";
import AdminOrders from "@/components/admin/AdminOrders";
import AdminCategories from "@/components/admin/AdminCategories";
import AdminDiscountCodes from "@/components/admin/AdminDiscountCodes";
import AdminCTV from "@/components/admin/AdminCTV";
import AdminShopSettings from "@/components/admin/AdminShopSettings";
import AdminBoostOrders from "@/components/admin/AdminBoostOrders";
import AdminCardApiSettings from "@/components/admin/AdminCardApiSettings";
import AdminRoles from "@/components/admin/AdminRoles";

type Tab = "overview" | "users" | "topups" | "products" | "orders" | "categories" | "discounts" | "ctv" | "shop_settings" | "boost_orders" | "card_api" | "roles" | "sepay_qr";

const Admin = () => {
  const { user, signOut, loading } = useAuth();
  const navigate = useNavigate();
  const [isAdmin, setIsAdmin] = useState(false);
  const [checking, setChecking] = useState(true);
  const [tab, setTab] = useState<Tab>(() => {
    const saved = localStorage.getItem("admin_tab");
    return (saved && ["overview","users","topups","products","orders","categories","discounts","ctv","shop_settings","boost_orders","card_api"].includes(saved)) ? saved as Tab : "overview";
  });

  useEffect(() => {
    localStorage.setItem("admin_tab", tab);
  }, [tab]);
  const [sidebarOpen, setSidebarOpen] = useState(true);

  useEffect(() => {
    if (loading) return;
    if (!user) { navigate("/dang-nhap"); return; }
    supabase.from("user_roles").select("role").eq("user_id", user.id).eq("role", "admin")
      .then(({ data }) => {
        if (data && data.length > 0) setIsAdmin(true);
        else navigate("/");
        setChecking(false);
      });
  }, [user, loading, navigate]);

  if (loading || checking) {
    return (<div className="min-h-screen bg-background flex items-center justify-center">
      <div className="text-primary font-display text-xl animate-pulse-neon">Đang tải...</div>
    </div>);
  }
  if (!isAdmin) return null;

  const tabs = [
    { id: "overview" as Tab, name: "Tổng quan", icon: LayoutDashboard },
    { id: "orders" as Tab, name: "Đơn hàng", icon: ShoppingBag },
    { id: "boost_orders" as Tab, name: "Đơn cày thuê", icon: Rocket },
    { id: "users" as Tab, name: "Người dùng", icon: Users },
    { id: "topups" as Tab, name: "Nạp tiền", icon: CreditCard },
    { id: "card_api" as Tab, name: "API gạch thẻ", icon: Server },
    { id: "products" as Tab, name: "Sản phẩm", icon: Package },
    { id: "categories" as Tab, name: "Danh mục", icon: FolderOpen },
    { id: "discounts" as Tab, name: "Mã giảm giá", icon: Tag },
    { id: "ctv" as Tab, name: "Cấp Quyền CTV", icon: UserPlus },
    { id: "roles" as Tab, name: "Cấp Quyền Admin", icon: Users },
    { id: "sepay_qr" as Tab, name: "Sepay QR Code", icon: FileText },
    { id: "shop_settings" as Tab, name: "Mô tả Shop", icon: FileText },
  ];

  return (
    <div className="min-h-screen bg-background flex flex-col md:flex-row">
      {/* Mobile top bar */}
      <div className="md:hidden bg-card border-b border-border p-3 flex items-center justify-between sticky top-0 z-30">
        <div className="flex items-center gap-2">
          <Gamepad2 className="w-6 h-6 text-primary" />
          <span className="font-display text-sm font-bold text-primary">ADMIN</span>
        </div>
        <button onClick={() => setSidebarOpen(!sidebarOpen)} className="p-2 rounded bg-muted border border-border">
          <LayoutDashboard className="w-4 h-4" />
        </button>
      </div>

      <aside className={`bg-card border-r border-border md:flex md:flex-col transition-all duration-300 ${sidebarOpen ? "flex flex-col w-full md:w-64" : "hidden md:flex md:w-16"}`}>
        <div className="hidden md:flex p-4 border-b border-border items-center gap-2">
          <Gamepad2 className="w-7 h-7 text-primary shrink-0" />
          {sidebarOpen && <span className="font-display text-sm font-bold text-primary tracking-wider">ADMIN</span>}
          <button onClick={() => setSidebarOpen(!sidebarOpen)} className="ml-auto p-1 rounded hover:bg-muted transition-colors">
            <ChevronLeft className={`w-4 h-4 text-muted-foreground transition-transform ${!sidebarOpen ? "rotate-180" : ""}`} />
          </button>
        </div>
        <nav className="flex-1 p-2 space-y-1 overflow-x-auto md:overflow-y-auto flex md:block gap-1">
          {tabs.map((t) => (
            <button key={t.id} onClick={() => { setTab(t.id); if (window.innerWidth < 768) setSidebarOpen(false); }}
              className={`shrink-0 md:w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all whitespace-nowrap ${
                tab === t.id ? "gradient-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground hover:bg-muted"
              }`}>
              <t.icon className="w-5 h-5 shrink-0" />
              <span className={sidebarOpen ? "inline" : "hidden md:hidden"}>{t.name}</span>
              <span className="md:hidden">{t.name}</span>
            </button>
          ))}
        </nav>
        <div className="p-2 border-t border-border space-y-1 hidden md:block">
          <a href="/" className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-semibold gradient-primary text-primary-foreground hover:opacity-90 transition-all">
            <ChevronLeft className="w-5 h-5 shrink-0" />{sidebarOpen && <span>Về trang chủ Shop</span>}
          </a>
          <button onClick={signOut} className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-destructive hover:bg-muted transition-all">
            <LogOut className="w-5 h-5 shrink-0" />{sidebarOpen && <span>Đăng xuất</span>}
          </button>
        </div>
      </aside>
      <main className="flex-1 p-3 sm:p-6 overflow-auto">
        <div className="max-w-6xl mx-auto">
          {tab === "overview" && <AdminOverview />}
          {tab === "orders" && <AdminOrders />}
          {tab === "boost_orders" && <AdminBoostOrders />}
          {tab === "users" && <AdminUsers />}
          {tab === "topups" && <AdminTopups />}
          {tab === "card_api" && <AdminCardApiSettings />}
          {tab === "products" && <AdminProducts />}
          {tab === "categories" && <AdminCategories />}
          {tab === "discounts" && <AdminDiscountCodes />}
          {tab === "ctv" && <AdminCTV />}
          {tab === "shop_settings" && <AdminShopSettings />}
        </div>
      </main>
    </div>
  );
};

export default Admin;
