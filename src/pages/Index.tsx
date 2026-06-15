import { useState, useEffect, useRef } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import SideNav, { SideNavTrigger } from "@/components/SideNav";
import WelcomePanel from "@/components/WelcomePanel";
import CategoryTabs from "@/components/CategoryTabs";
import ProductSection from "@/components/ProductSection";
import TopUpGuide from "@/components/TopUpGuide";
import RecentPurchases from "@/components/RecentPurchases";
import RecentTopups from "@/components/RecentTopups";
import Footer from "@/components/Footer";
import WelcomePopup from "@/components/WelcomePopup";
import ThemeToggle from "@/components/ThemeToggle";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, Bell, Wallet, Search, User as UserIcon, LogOut, Shield, ChevronDown } from "lucide-react";

interface Product {
  id: string;
  name: string;
  price: number;
  stock: number;
  description: string | null;
  category: string;
  image_url: string | null;
  product_type?: string;
}

type Category = { id: string; name: string; slug: string; image_url: string | null };

const Index = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user, signOut } = useAuth();
  const [activeCategory, setActiveCategory] = useState(searchParams.get("cat") || "all");
  const [searchQuery, setSearchQuery] = useState(searchParams.get("search") || "");
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [navOpen, setNavOpen] = useState(false);
  const [balance, setBalance] = useState<number>(0);
  const [isAdmin, setIsAdmin] = useState(false);
  const [userMenu, setUserMenu] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const s = searchParams.get("search");
    if (s) setSearchQuery(s);
    const c = searchParams.get("cat");
    if (c) setActiveCategory(c);
  }, [searchParams]);

  useEffect(() => {
    const fetchData = async () => {
      const [prodRes, catRes] = await Promise.all([
        supabase.from("products").select("*").eq("status", "active").order("created_at", { ascending: false }),
        supabase.from("categories").select("*").order("sort_order"),
      ]);
      setProducts((prodRes.data as Product[]) || []);
      setCategories((catRes.data as Category[]) || []);
      setLoading(false);
    };
    fetchData();
  }, []);

  useEffect(() => {
    if (!user) { setBalance(0); setIsAdmin(false); return; }
    supabase.from("profiles").select("balance").eq("user_id", user.id).single().then(({ data }) => setBalance(data?.balance ?? 0));
    supabase.from("user_roles").select("role").eq("user_id", user.id).eq("role", "admin").then(({ data }) => setIsAdmin(!!(data && data.length > 0)));
  }, [user]);

  useEffect(() => {
    const h = (e: MouseEvent) => { if (menuRef.current && !menuRef.current.contains(e.target as Node)) setUserMenu(false); };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, []);

  const slugMap: Record<string, string> = {};
  const imgMap: Record<string, string | null> = {};
  categories.forEach(c => { slugMap[c.name] = c.slug; imgMap[c.name] = c.image_url; });

  const filtered = searchQuery.trim()
    ? products.filter(p => p.name.toLowerCase().includes(searchQuery.toLowerCase()) || p.category.toLowerCase().includes(searchQuery.toLowerCase()))
    : products;

  const grouped: Record<string, Product[]> = {};
  filtered.forEach((p) => {
    if (!grouped[p.category]) grouped[p.category] = [];
    grouped[p.category].push(p);
  });

  const displayName = user?.user_metadata?.full_name || user?.email?.split("@")[0] || "User";

  return (
    <div className="min-h-screen bg-background">
      <WelcomePopup />

      <div className="flex">
        <SideNav open={navOpen} onClose={() => setNavOpen(false)} />

        <div className="flex-1 min-w-0">
          {/* Inline top bar */}
          <div className="sticky top-0 z-30 bg-background/85 backdrop-blur border-b border-primary/20 px-4 py-2.5 flex items-center gap-3">
            <SideNavTrigger onClick={() => setNavOpen(true)} />

            {user && (
              <button onClick={() => navigate("/nap-the")} className="flex items-center gap-2 px-3 py-1.5 rounded-md border border-primary/40 bg-primary/5 hover:bg-primary/10">
                <Wallet className="w-4 h-4 text-primary" />
                <span className="text-xs font-bold text-primary">Ví: <span className="text-yellow-500">{balance.toLocaleString("vi-VN")}đ</span></span>
              </button>
            )}

            <div className="flex-1 max-w-md hidden md:block">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Tìm kiếm sản phẩm..."
                  className="w-full bg-muted/50 border border-primary/30 rounded-lg pl-9 pr-3 py-2 text-sm focus:outline-none focus:border-primary"
                />
              </div>
            </div>

            <div className="ml-auto flex items-center gap-2">
              <ThemeToggle />
              <button className="w-9 h-9 rounded-full bg-muted border border-border flex items-center justify-center hover:bg-border">
                <Bell className="w-4 h-4" />
              </button>
              {user ? (
                <div className="relative" ref={menuRef}>
                  <button onClick={() => setUserMenu(!userMenu)} className="flex items-center gap-2 px-2 py-1.5 rounded-lg border border-border hover:bg-muted">
                    <div className="w-7 h-7 rounded-full gradient-primary flex items-center justify-center text-primary-foreground text-xs font-bold">
                      {displayName.charAt(0).toUpperCase()}
                    </div>
                    <span className="hidden sm:inline text-sm font-medium max-w-[100px] truncate">{displayName}</span>
                    <ChevronDown className={`w-3 h-3 transition-transform ${userMenu ? "rotate-180" : ""}`} />
                  </button>
                  {userMenu && (
                    <div className="absolute right-0 top-full mt-1 bg-card border border-border rounded-lg shadow-lg py-1 min-w-[200px] z-50">
                      <a href="/trang-ca-nhan" className="flex items-center gap-2 px-4 py-2.5 text-sm hover:bg-muted"><UserIcon className="w-4 h-4" /> Trang cá nhân</a>
                      {isAdmin && <a href="/admin" className="flex items-center gap-2 px-4 py-2.5 text-sm text-neon-orange hover:bg-muted"><Shield className="w-4 h-4" /> Admin</a>}
                      <button onClick={() => signOut()} className="flex items-center gap-2 w-full px-4 py-2.5 text-sm text-destructive hover:bg-muted"><LogOut className="w-4 h-4" /> Đăng xuất</button>
                    </div>
                  )}
                </div>
              ) : (
                <a href="/dang-nhap" className="px-3 py-1.5 gradient-primary rounded-md text-sm font-semibold text-primary-foreground">Đăng nhập</a>
              )}
            </div>
          </div>

          <main className="p-4 lg:p-6 space-y-6">
            <WelcomePanel />

            {/* Category pills */}
            <div className="overflow-x-auto pb-1">
              <CategoryTabs activeCategory={activeCategory} onCategoryChange={setActiveCategory} />
            </div>

            {loading ? (
              <div className="flex justify-center py-16"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>
            ) : filtered.length === 0 ? (
              <div className="text-center py-16 text-muted-foreground">
                {searchQuery ? `Không tìm thấy sản phẩm "${searchQuery}"` : "Chưa có sản phẩm nào."}
              </div>
            ) : (
              Object.entries(grouped).map(([category, prods]) => {
                const catSlug = slugMap[category] || category.toLowerCase().replace(/\s+/g, "");
                if (activeCategory !== "all" && activeCategory !== catSlug) return null;
                return (
                  <ProductSection
                    key={category}
                    title={category.toUpperCase()}
                    imageUrl={imgMap[category] || undefined}
                    products={prods.map((p) => ({
                      id: p.id,
                      name: p.name,
                      price: p.price.toLocaleString("vi-VN") + "đ",
                      numericPrice: p.price,
                      stock: p.stock,
                      description: p.description || "",
                      category: p.category,
                      imageUrl: p.image_url || undefined,
                      product_type: p.product_type,
                    }))}
                  />
                );
              })
            )}

            <div className="grid md:grid-cols-2 gap-6">
              <RecentPurchases />
              <RecentTopups />
            </div>

            <TopUpGuide />
          </main>

          <Footer />
        </div>
      </div>
    </div>
  );
};

export default Index;
