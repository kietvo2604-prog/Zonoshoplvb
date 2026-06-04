import kietzImg from "@/assets/NNQ.png";

const KietzBadge = () => {
  return (
    <a
      href="https://zalo.me/0987672604"
      target="_blank"
      rel="noopener noreferrer"
      className="fixed bottom-4 right-4 z-[9999] flex items-center gap-2 rounded-full bg-card border border-primary/40 shadow-lg pl-1.5 pr-3 py-1.5 hover:scale-105 hover:shadow-[0_0_20px_hsl(var(--primary)/0.5)] transition-all duration-300 group"
      title="Kietz Depzai"
    >
      <img
        src={kietzImg}
        alt="Kietz Depzai"
        className="w-7 h-7 rounded-full object-cover border border-primary/50"
      />
      <span className="text-xs font-display font-bold text-primary group-hover:neon-text">
        Kietz Depzai
      </span>
    </a>
  );
};

export default KietzBadge;
