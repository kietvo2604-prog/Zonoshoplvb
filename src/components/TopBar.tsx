import { Shield, HelpCircle, Phone } from "lucide-react";

const TopBar = () => {
  return (
    <div className="gradient-accent py-2 px-4 overflow-hidden">
      <div className="container mx-auto flex items-center justify-between text-sm">
        <div className="flex-1 overflow-hidden">
          <p className="font-semibold tracking-wide text-accent-foreground whitespace-nowrap animate-marquee">
            🎮 ZONOshop - Thiên đường ACC Roblox uy tín hàng đầu! &nbsp;&nbsp;&nbsp;&nbsp;&nbsp; 🎮 ZONOshop - Thiên đường ACC Roblox uy tín hàng đầu!
          </p>
        </div>
        <div className="hidden md:flex items-center gap-6 text-accent-foreground shrink-0 ml-4">
          <a href="/chinh-sach-bao-hanh" className="flex items-center gap-1 hover:underline">
            <Shield className="w-3.5 h-3.5" /> Chính sách
          </a>
          <a href="/faq" className="flex items-center gap-1 hover:underline">
            <HelpCircle className="w-3.5 h-3.5" /> FAQ
          </a>
          <a href="https://discord.gg/ZONOshop" target="_blank" rel="noopener" className="flex items-center gap-1 hover:underline">
            <Phone className="w-3.5 h-3.5" /> Liên hệ
          </a>
        </div>
      </div>
    </div>
  );
};

export default TopBar;
