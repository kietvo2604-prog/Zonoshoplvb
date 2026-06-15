import { Home, ShoppingCart, History as HistoryIcon, Trophy, Megaphone, Tag, Landmark, FileText, CreditCard, Phone, Settings, ChevronRight, Menu, X, Gamepad2 } from "lucide-react";
import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";

interface SideNavProps {
  open: boolean;
  onClose: () => void;
}

const NavItem = ({ icon: Icon, label, active, onClick, badge }: any) => (
  <button
    onClick={onClick}
    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-md text-sm transition-all group ${
      active
        ? "bg-primary/15 text-primary border border-primary/40 shadow-[0_0_12px_hsl(var(--primary)/0.35)]"
        : "text-foreground/85 hover:bg-primary/5 hover:text-primary border border-transparent"
    }`}
  >
    <Icon className={`w-4 h-4 shrink-0 ${active ? "text-primary" : "text-foreground/60 group-hover:text-primary"}`} />
    <span className="flex-1 text-left truncate">{label}</span>
    {badge && <ChevronRight className="w-4 h-4 opacity-60" />}
  </button>
);

const SectionLabel = ({ children }: any) => (
  <p className="px-3 pt-4 pb-2 text-[11px] font-bold uppercase tracking-widest text-primary/70">{children}</p>
);

const SideNav = ({ open, onClose }: SideNavProps) => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const [logoUrl, setLogoUrl] = useState<string | null>(null);
  const [balance, setBalance] = useState<number>(0);

  useEffect(() => {
    supabase.from("shop_settings").select("value").eq("key", "shop_logo_url").maybeSingle().then(({ data }) => {
      if (data?.value) setLogoUrl(data.value);
    });
  }, []);

  useEffect(() => {
    if (!user) { setBalance(0); return; }
    supabase.from("profiles").select("balance").eq("user_id", user.id).single().then(({ data }) => setBalance(data?.balance ?? 0));
  }, [user]);

  const go = (path: string) => { navigate(path); onClose(); };
  const isActive = (p: string) => pathname === p;

  return (
    <>
      {/* Mobile overlay */}
      {open && <div onClick={onClose} className="fixed inset-0 bg-black/60 z-40 lg:hidden" />}

      <aside
        className={`fixed lg:sticky top-0 left-0 z-50 h-screen w-72 shrink-0 bg-card border-r-2 border-primary/40 shadow-[0_0_30px_hsl(var(--primary)/0.18)] transform transition-transform duration-300 overflow-y-auto ${
          open ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        }`}
      >
        <div className="lg:hidden flex justify-end p-2">
          <button onClick={onClose} className="p-1.5 rounded-md hover:bg-muted"><X className="w-5 h-5" /></button>
        </div>

        {/* Logo banner */}
        <div className="px-4 pt-2 pb-4">
          <a href="/" className="block rounded-lg overflow-hidden border-2 border-primary/60 shadow-[0_0_20px_hsl(var(--primary)/0.45)]">
            {logoUrl ? (
              <img src={logoUrl} alt="Shop Logo" className="w-full h-32 object-cover" />
            ) : (
              <div className="w-full h-32 gradient-primary flex items-center justify-center">
                <Gamepad2 className="w-12 h-12 text-primary-foreground" />
              </div>
            )}
          </a>
        </div>

        {/* Language / Currency / Balance */}
        <div className="px-4 space-y-2 text-xs">
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">Select Language:</span>
            <span className="font-semibold text-primary">Vietnamese</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">Select Currency:</span>
            <span className="font-semibold text-primary">VND ▾</span>
          </div>
        </div>

        <div className="mx-4 mt-3 border-t border-primary/20 pt-3 text-xs flex items-center gap-2">
          <span className="font-bold uppercase text-foreground/70">Số dư</span>
          <span className="font-bold text-yellow-500">{balance.toLocaleString("vi-VN")}đ</span>
          <span className="text-muted-foreground">- Giảm:</span>
          <span className="text-destructive font-bold">0%</span>
        </div>

        {/* Main nav */}
        <nav className="px-3 pt-3 pb-6 space-y-1">
          <NavItem icon={Home} label="Trang Chủ" active={isActive("/")} onClick={() => go("/")} />
          <NavItem icon={ShoppingCart} label="Mua Tài Khoản" active={false} onClick={() => go("/?cat=all")} badge />
          <NavItem icon={HistoryIcon} label="Lịch Sử Mua Hàng" active={isActive("/lich-su-mua")} onClick={() => go("/lich-su-mua")} />
          <NavItem icon={Trophy} label="Bảng Xếp Hạng" active={false} onClick={() => go("/lich-su-nap")} />
          <NavItem icon={Megaphone} label="Tiếp Thị Liên Kết" active={isActive("/ctv")} onClick={() => go("/ctv")} />
          <NavItem icon={Tag} label="Mã Giảm Giá" active={false} onClick={() => go("/trang-ca-nhan")} />

          <SectionLabel>Nạp Tiền</SectionLabel>
          <NavItem icon={Landmark} label="Ngân Hàng" active={isActive("/nap-ngan-hang")} onClick={() => go("/nap-ngan-hang")} />
          <NavItem icon={FileText} label="Hoá Đơn" active={isActive("/bien-dong-so-du")} onClick={() => go("/bien-dong-so-du")} />
          <NavItem icon={CreditCard} label="Nạp Thẻ" active={isActive("/nap-the")} onClick={() => go("/nap-the")} />

          <SectionLabel>Khác</SectionLabel>
          <NavItem icon={Phone} label="Liên Hệ" active={isActive("/faq")} onClick={() => go("/faq")} />
          <NavItem icon={Settings} label="Quy Định Nạp Thẻ" active={isActive("/quy-dinh-nap-the")} onClick={() => go("/quy-dinh-nap-the")} />
        </nav>
      </aside>
    </>
  );
};

export const SideNavTrigger = ({ onClick }: { onClick: () => void }) => (
  <button onClick={onClick} className="lg:hidden p-2 rounded-md border border-primary/40 bg-card hover:bg-primary/10">
    <Menu className="w-5 h-5 text-primary" />
  </button>
);

export default SideNav;
