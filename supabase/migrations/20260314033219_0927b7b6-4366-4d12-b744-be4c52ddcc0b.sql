
CREATE OR REPLACE FUNCTION public.purchase_product_batch(p_user_id uuid, p_product_id uuid, p_quantity integer)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_product products%ROWTYPE;
  v_profile profiles%ROWTYPE;
  v_order_code text;
  v_order_id uuid;
  v_chars text := 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  v_i integer;
  v_total_price integer;
  v_account_infos text[];
  v_account record;
  v_count integer := 0;
BEGIN
  -- Validate quantity
  IF p_quantity < 1 OR p_quantity > 100 THEN
    RETURN jsonb_build_object('success', false, 'error', 'Số lượng không hợp lệ');
  END IF;

  -- Get product
  SELECT * INTO v_product FROM products WHERE id = p_product_id AND status = 'active';
  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Sản phẩm không tồn tại');
  END IF;

  -- Calculate total price
  v_total_price := v_product.price * p_quantity;

  -- Check balance
  SELECT * INTO v_profile FROM profiles WHERE user_id = p_user_id FOR UPDATE;
  IF NOT FOUND OR v_profile.balance < v_total_price THEN
    RETURN jsonb_build_object('success', false, 'error', 'Số dư không đủ. Cần ' || v_total_price || 'đ');
  END IF;

  -- Grab accounts
  v_account_infos := ARRAY[]::text[];
  FOR v_account IN
    SELECT * FROM product_accounts
    WHERE product_id = p_product_id AND is_sold = false
    ORDER BY created_at
    LIMIT p_quantity
    FOR UPDATE SKIP LOCKED
  LOOP
    v_account_infos := array_append(v_account_infos, v_account.account_info);
    v_count := v_count + 1;
  END LOOP;

  IF v_count < p_quantity THEN
    RETURN jsonb_build_object('success', false, 'error', 'Không đủ hàng. Chỉ còn ' || v_count || ' sản phẩm');
  END IF;

  -- Generate order code
  v_order_code := 'NNQ';
  FOR v_i IN 1..12 LOOP
    v_order_code := v_order_code || substr(v_chars, floor(random() * 36 + 1)::int, 1);
  END LOOP;

  -- Create ONE order with combined account info and total price
  INSERT INTO orders (user_id, product_name, product_category, price, account_info, order_code)
    VALUES (p_user_id, v_product.name, v_product.category, v_total_price, array_to_string(v_account_infos, E'\n'), v_order_code)
    RETURNING id INTO v_order_id;

  -- Mark accounts as sold
  UPDATE product_accounts SET is_sold = true, sold_to_order_id = v_order_id
    WHERE product_id = p_product_id AND is_sold = false
    AND id IN (
      SELECT id FROM product_accounts
      WHERE product_id = p_product_id AND is_sold = false
      ORDER BY created_at
      LIMIT p_quantity
    );

  -- Update stock
  UPDATE products SET stock = (SELECT count(*) FROM product_accounts WHERE product_id = p_product_id AND is_sold = false) WHERE id = p_product_id;

  -- Deduct balance
  UPDATE profiles SET balance = balance - v_total_price WHERE user_id = p_user_id;

  RETURN jsonb_build_object(
    'success', true,
    'order_code', v_order_code,
    'order_id', v_order_id,
    'account_infos', to_jsonb(v_account_infos),
    'total_price', v_total_price,
    'quantity', p_quantity
  );
END;
$function$;
