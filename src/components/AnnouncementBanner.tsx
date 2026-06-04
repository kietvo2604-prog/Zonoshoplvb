import { Shield, MessageCircle, Users, ArrowRight } from "lucide-react";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

const DEFAULT_TITLE = "ZONOshop - SHOP ACC BLOX FRUITS, ACC RANDOM, ROBUX UY TÍN";
const DEFAULT_DESC = "🔥 Giao dịch tự động 24/7 – Mua là có ngay\n🛡️ Bảo mật tuyệt đối – Cam kết uy tín\n💰 Giá cả học sinh – Chất lượng hàng đầu";

const AnnouncementBanner = () => {
  const [title, setTitle] = useState(DEFAULT_TITLE);
  const [descHtml, setDescHtml] = useState<string>(DEFAULT_DESC);

  useEffect(() => {
    supabase.from("shop_settings").select("*").then(({ data }) => {
      const map: Record<string, string> = {};
      (data || []).forEach((s: any) => { map[s.key] = s.value; });
      if (map["shop_title"]) setTitle(map["shop_title"]);
      if (map["shop_description"]) {
        setDescHtml(map["shop_description"]);
      } else {
        const lines = [map["shop_subtitle_1"], map["shop_subtitle_2"], map["shop_subtitle_3"]].filter(Boolean);
        if (lines.length > 0) setDescHtml(lines.join("\n"));
      }
    });
  }, []);

  return (
    <div className="bg-card border border-border rounded-xl p-6 neon-card">
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <Shield className="w-5 h-5 text-primary" />
          <span className="font-semibold text-foreground">CHÍNH SÁCH BẢO HÀNH</span>
          <a href="/chinh-sach-bao-hanh" className="text-primary font-bold hover:underline flex items-center gap-1">
            TẠI ĐÂY <ArrowRight className="w-3.5 h-3.5" />
          </a>
        </div>
        <div className="flex items-center gap-2">
          <MessageCircle className="w-5 h-5 text-secondary" />
          <span className="font-semibold text-foreground">FAQ NHỮNG CÂU HỎI THƯỜNG GẶP</span>
          <a href="/faq" className="text-secondary font-bold hover:underline flex items-center gap-1">
            TẠI ĐÂY <ArrowRight className="w-3.5 h-3.5" />
          </a>
        </div>
        <div className="flex items-center gap-2">
          <Users className="w-5 h-5 text-neon-orange" />
          <span className="font-semibold text-foreground">LIÊN HỆ HỖ TRỢ QUA ZALO</span>
          <a href="https://zalo.me/0987672604" target="_blank" rel="noopener noreferrer" className="text-neon-orange font-bold hover:underline flex items-center gap-1">
            TẠI ĐÂY <ArrowRight className="w-3.5 h-3.5" />
          </a>
        </div>
      </div>

      <div className="mt-5 pt-5 border-t border-border">
        <p className="text-lg font-bold text-foreground">{title}</p>
        <div className="mt-3 space-y-1 text-sm text-muted-foreground" dangerouslySetInnerHTML={{ __html: descHtml.replace(/\n/g, "<br/>") }} />
      </div>
    </div>
  );
};

export default AnnouncementBanner;
