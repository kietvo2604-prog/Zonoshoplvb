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

        <div className="mt-8 pt-6 border-t border-border text-center text-xs text-muted-foreground">
          © 2026 ZONOshop. Uy tín tạo nên thương hiệu! 🎮

        </div>
      </div>
    </footer>
  );
};

export default Footer;

