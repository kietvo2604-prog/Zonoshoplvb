
-- product_type
DO $$ BEGIN
  CREATE TYPE public.product_type AS ENUM ('account', 'boost');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

ALTER TABLE public.products
  ADD COLUMN IF NOT EXISTS product_type public.product_type NOT NULL DEFAULT 'account';

-- boost_orders table
CREATE TABLE IF NOT EXISTS public.boost_orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  product_id uuid NOT NULL,
  product_name text NOT NULL,
  price integer NOT NULL,
  account_username text NOT NULL,
  account_password text NOT NULL,
  customer_note text,
  admin_note text,
  status text NOT NULL DEFAULT 'pending',
  refunded boolean NOT NULL DEFAULT false,
  order_code text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE ON public.boost_orders TO authenticated;
GRANT ALL ON public.boost_orders TO service_role;

ALTER TABLE public.boost_orders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view own boost orders" ON public.boost_orders
  FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users create own boost orders" ON public.boost_orders
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Admins view all boost orders" ON public.boost_orders
  FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admins update boost orders" ON public.boost_orders
  FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'admin'::app_role)) WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

CREATE TRIGGER update_boost_orders_updated_at
  BEFORE UPDATE ON public.boost_orders
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Boost purchase RPC
CREATE OR REPLACE FUNCTION public.purchase_boost(
  p_user_id uuid,
  p_product_id uuid,
  p_username text,
  p_password text,
  p_note text
) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_product products%ROWTYPE;
  v_profile profiles%ROWTYPE;
  v_order_id uuid;
  v_order_code text := 'NNQ';
  v_chars text := 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  v_i int;
BEGIN
  IF p_user_id IS NULL OR p_user_id <> auth.uid() THEN
    RETURN jsonb_build_object('success', false, 'error', 'Không hợp lệ');
  END IF;
  IF coalesce(trim(p_username),'') = '' OR coalesce(trim(p_password),'') = '' THEN
    RETURN jsonb_build_object('success', false, 'error', 'Vui lòng nhập tài khoản và mật khẩu');
  END IF;
  SELECT * INTO v_product FROM products WHERE id = p_product_id AND status = 'active' AND product_type = 'boost';
  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Dịch vụ cày thuê không tồn tại');
  END IF;
  SELECT * INTO v_profile FROM profiles WHERE user_id = p_user_id FOR UPDATE;
  IF NOT FOUND OR v_profile.balance < v_product.price THEN
    RETURN jsonb_build_object('success', false, 'error', 'Số dư không đủ');
  END IF;

  FOR v_i IN 1..12 LOOP
    v_order_code := v_order_code || substr(v_chars, floor(random()*36+1)::int, 1);
  END LOOP;

  INSERT INTO boost_orders(user_id, product_id, product_name, price, account_username, account_password, customer_note, order_code)
    VALUES (p_user_id, v_product.id, v_product.name, v_product.price, p_username, p_password, p_note, v_order_code)
    RETURNING id INTO v_order_id;

  UPDATE profiles SET balance = balance - v_product.price WHERE user_id = p_user_id;

  RETURN jsonb_build_object('success', true, 'order_code', v_order_code, 'order_id', v_order_id);
END; $$;

REVOKE EXECUTE ON FUNCTION public.purchase_boost(uuid, uuid, text, text, text) FROM anon;
GRANT EXECUTE ON FUNCTION public.purchase_boost(uuid, uuid, text, text, text) TO authenticated;

-- Admin cancel & refund RPC
CREATE OR REPLACE FUNCTION public.cancel_boost_order(p_order_id uuid, p_refund boolean, p_admin_note text)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_order boost_orders%ROWTYPE; BEGIN
  IF NOT public.has_role(auth.uid(), 'admin'::app_role) THEN
    RETURN jsonb_build_object('success', false, 'error', 'Forbidden');
  END IF;
  SELECT * INTO v_order FROM boost_orders WHERE id = p_order_id FOR UPDATE;
  IF NOT FOUND THEN RETURN jsonb_build_object('success', false, 'error', 'Order not found'); END IF;
  IF v_order.status IN ('completed','cancelled','cancelled_refunded') THEN
    RETURN jsonb_build_object('success', false, 'error', 'Đơn đã đóng');
  END IF;
  IF p_refund THEN
    UPDATE profiles SET balance = balance + v_order.price WHERE user_id = v_order.user_id;
    UPDATE boost_orders SET status='cancelled_refunded', refunded=true, admin_note=p_admin_note WHERE id=p_order_id;
  ELSE
    UPDATE boost_orders SET status='cancelled', admin_note=p_admin_note WHERE id=p_order_id;
  END IF;
  RETURN jsonb_build_object('success', true);
END; $$;
REVOKE EXECUTE ON FUNCTION public.cancel_boost_order(uuid, boolean, text) FROM anon, authenticated;
GRANT EXECUTE ON FUNCTION public.cancel_boost_order(uuid, boolean, text) TO authenticated;

-- Payment provider settings table (single row controlled by key in shop_settings - already supports it)
-- We'll just rely on shop_settings rows: card_provider (thesieure|gachthefast), card_partner_id, card_partner_key, sepay_api_key, sepay_account_number, sepay_bank_name
