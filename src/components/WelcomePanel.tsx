import { ChevronRight, Zap } from "lucide-react";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

const DEFAULT_TITLE = "SHOPKIETZ";

const items = [
  { label: "Tham Gia Nhóm Zalo Thông Báo Của Shop (Có Mã Giảm Giá)", href: "https://zalo.me/0987672604" },
  { label: "Quản trị viên Facebook (Hỗ trợ) - Renji Kage", href: "https://facebook.com" },
  { label: "Thẻ Cào (Thẻ)", href: "/nap-the" },
  { label: "Nạp Tiền Ngân Hàng (Chuyển Khoản)", href: "/nap-ngan-hang" },
];

const WelcomePanel = () => {
  const [title, setTitle] = useState(DEFAULT_TITLE);
  const [logoUrl, setLogoUrl] = useState<string | null>(null);

  useEffect(() => {
    supabase.from("shop_settings").select("key,value").then(({ data }) => {
      const map: Record<string, string> = {};
      (data || []).forEach((s: any) => { map[s.key] = s.value; });
      if (map["shop_title"]) setTitle(map["shop_title"].split(" - ")[0] || map["shop_title"]);
      if (map["shop_logo_url"]) setLogoUrl(map["shop_logo_url"]);
    });
  }, []);

  return (
    <div className="grid lg:grid-cols-2 gap-5">
      {/* Banner card */}
      <div className="rounded-2xl border-2 border-primary/60 p-2 bg-card shadow-[0_0_25px_hsl(var(--primary)/0.35)]">
        {logoUrl ? (
          <img src={logoUrl} alt={title} className="w-full h-64 object-cover rounded-xl" />
        ) : (
          <div className="w-full h-64 rounded-xl gradient-primary flex items-center justify-center font-display text-4xl text-primary-foreground neon-text">
            {title}
          </div>
        )}
        <div className="mt-3 pb-2 text-center">
          <h2 className="font-display text-2xl text-primary neon-cyan-text flex items-center justify-center gap-2">
            <Zap className="w-5 h-5 text-accent" /> {title} <Zap className="w-5 h-5 text-accent" />
          </h2>
          <p className="text-sm text-muted-foreground mt-1">✨ Shop Uy Tín Hàng Đầu ✨</p>
          <a href="/?cat=all" className="inline-block mt-3 px-6 py-2.5 rounded-lg galaxy-button text-white font-bold text-sm tracking-wide hover:scale-105 transition-transform">
            NGẪU NHIÊN ACC NGAY NÀO →
          </a>
        </div>
      </div>

      {/* Welcome list */}
      <div className="rounded-2xl border-2 border-primary/60 p-5 bg-card shadow-[0_0_25px_hsl(var(--primary)/0.35)] flex flex-col">
        <h2 className="font-display text-center text-xl text-primary neon-cyan-text mb-4">
          CHÀO MỪNG MỌI NGƯỜI ĐẾN<br />
          <span className="text-2xl">{title}</span>
        </h2>
        <ul className="space-y-2.5 flex-1">
          {items.map((it, i) => (
            <li key={i}>
              <a
                href={it.href}
                target={it.href.startsWith("http") ? "_blank" : undefined}
                rel="noopener noreferrer"
                className="flex items-center gap-2 px-4 py-3 rounded-lg border border-primary/40 bg-background/40 hover:bg-primary/10 hover:border-primary text-sm font-medium text-foreground transition-all group"
              >
                <ChevronRight className="w-4 h-4 text-primary shrink-0 group-hover:translate-x-1 transition-transform" />
                <span className="flex-1">{it.label}</span>
              </a>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
};

export default WelcomePanel;
