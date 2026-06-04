
CREATE TABLE IF NOT EXISTS public.shop_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  key text UNIQUE NOT NULL,
  value text NOT NULL DEFAULT '',
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.shop_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view shop settings" ON public.shop_settings FOR SELECT TO public USING (true);
CREATE POLICY "Admins can manage shop settings" ON public.shop_settings FOR ALL TO authenticated USING (has_role(auth.uid(), 'admin')) WITH CHECK (has_role(auth.uid(), 'admin'));

INSERT INTO public.shop_settings (key, value) VALUES 
  ('shop_title', 'ZONOshop - SHOP ACC BLOX FRUITS, ACC RANDOM, ROBUX UY TÍN'),
  ('shop_subtitle_1', '🔥 Giao dịch tự động 24/7 – Mua là có ngay'),
  ('shop_subtitle_2', '🛡️ Bảo mật tuyệt đối – Cam kết uy tín'),
  ('shop_subtitle_3', '💰 Giá cả học sinh – Chất lượng hàng đầu')
ON CONFLICT (key) DO NOTHING;
