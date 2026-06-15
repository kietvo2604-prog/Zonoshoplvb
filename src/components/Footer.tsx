import { Gamepad2, Phone, MessageCircle, Globe } from "lucide-react";

const Footer = () => {
  return (
    <footer id="contact" className="bg-card border-t border-border mt-12">
      <div className="container mx-auto px-4 py-10">
        <div className="grid md:grid-cols-3 gap-8">
          <div>
            <div className="flex items-center gap-2 mb-4">
              <Gamepad2 className="w-6 h-6 text-primary" />
              <span className="font-display text-lg font-bold text-primary neon-text">ZONOshop</span>
            </div>
            <p className="text-sm text-muted-foreground">
              Hệ thống cung cấp dịch vụ game Roblox tự động hàng đầu. Uy tín tạo nên thương hiệu!
            </p>
          </div>

          <div>
            <h3 className="font-bold text-foreground mb-4">Liên kết nhanh</h3>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li><a href="#" className="hover:text-primary transition-colors">Trang chủ</a></li>
              <li><a href="#" className="hover:text-primary transition-colors">Sản phẩm</a></li>
              <li><a href="#policy" className="hover:text-primary transition-colors">Chính sách</a></li>
              <li><a href="#faq" className="hover:text-primary transition-colors">FAQ</a></li>
            </ul>
          </div>

          <div>
            <h3 className="font-bold text-foreground mb-4">Hỗ trợ khách hàng</h3>
            <div className="space-y-3 text-sm text-muted-foreground">
              <div className="flex items-center gap-2">
                <Phone className="w-4 h-4 text-primary" />
                <span>Hotline/Zalo: <a href="https://zalo.me/0365739178" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">Liên hệ Admin</a></span>
              </div>
              <div className="flex items-center gap-2">
                <MessageCircle className="w-4 h-4 text-secondary" />
                <span>Facebook: <a href="https://www.facebook.com/share/1XK2wU8D2J/" target="_blank" rel="noopener noreferrer nofollow" className="text-secondary hover:underline font-medium">ZONOshop Official ↗</a></span>
              </div>
              <div className="flex items-center gap-2">
                <Globe className="w-4 h-4 text-neon-orange" />
                <span>Hỗ trợ 24/7</span>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-8 pt-6 border-t border-border text-center">
          {/* Dòng bản quyền cũ */}
          <p className="text-xs text-muted-foreground">
            © 2026 ZONOshop. Uy tín tạo nên thương hiệu! 🎮
          </p>
          
          {/* Dòng CODE BY - CÓ HIỆU ỨNG PHÁT SÁNG */}
          <p className="text-sm md:text-base font-medium text-foreground/70 mt-3">
            CODE BY{" "}
            <a 
              href="https://www.facebook.com/profile.php?id=61588297479720" 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-base md:text-lg font-bold text-primary transition-all duration-300 inline-flex items-center gap-1 animate-pulse-glow hover:animate-none hover:scale-105"
              style={{
                textShadow: "0 0 5px #8b5cf6, 0 0 10px #c084fc, 0 0 15px #a78bfa",
                animation: "glowPulse 2s ease-in-out infinite"
              }}
            >
              Anh Kiet
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
              </svg>
            </a>
          </p>
        </div>
      </div>

      {/* Style cho hiệu ứng phát sáng */}
      <style>{`
        @keyframes glowPulse {
          0%, 100% {
            text-shadow: 0 0 5px #8b5cf6, 0 0 10px #c084fc;
          }
          50% {
            text-shadow: 0 0 15px #a78bfa, 0 0 25px #c084fc, 0 0 35px #8b5cf6;
          }
        }
        .animate-pulse-glow {
          animation: glowPulse 2s ease-in-out infinite;
        }
      `}</style>
    </footer>
  );
};

export default Footer;