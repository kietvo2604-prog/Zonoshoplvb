import logoImage from "@/assets/download (1).jpg";

const AnimatedLogo = () => {
  return (
    <div className="flex flex-col items-start leading-none select-none">
      <span className="text-[8px] md:text-[10px] lg:text-xs font-bold tracking-[0.2em] uppercase text-primary/70">
       
      </span>
      <div className="relative">
        {/* Lớp glow phía sau logo */}
        <div 
          className="absolute inset-0 rounded-full blur-xl opacity-70 animate-pulse"
          style={{
            background: "radial-gradient(circle, rgba(139,92,246,0.6) 0%, rgba(192,132,252,0.3) 50%, transparent 80%)",
            transform: "scale(1.2)",
          }}
        />
        {/* Logo chính - ĐÃ PHÓNG TO */}
        <img 
          src={logoImage}
          alt="ZonoShop Logo"
          className="relative h-16 md:h-24 lg:h-32 w-auto object-contain transition-all duration-300 hover:scale-105"
          style={{
            filter: "drop-shadow(0 0 8px #8b5cf6) drop-shadow(0 0 15px #a78bfa)",
          }}
        />
      </div>
    </div>
  );
};

export default AnimatedLogo;