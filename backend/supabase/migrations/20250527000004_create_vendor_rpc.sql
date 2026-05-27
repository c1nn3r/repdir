-- create_vendor RPC: runs as SECURITY DEFINER to bypass RLS
-- Called from vendor signup page after auth.signUp()
CREATE OR REPLACE FUNCTION create_vendor(
  p_display_name TEXT,
  p_tracking_code TEXT
) RETURNS JSONB LANGUAGE plpgsql SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  v_user_id UUID;
BEGIN
  v_user_id := auth.uid();

  IF v_user_id IS NULL THEN
    RETURN jsonb_build_object('error', 'not authenticated');
  END IF;

  INSERT INTO vendors (user_id, display_name, tracking_code)
  VALUES (v_user_id, p_display_name, p_tracking_code);

  RETURN jsonb_build_object('success', true, 'tracking_code', p_tracking_code);
EXCEPTION
  WHEN unique_violation THEN
    RETURN jsonb_build_object('error', 'Vendor already exists for this account');
  WHEN OTHERS THEN
    RETURN jsonb_build_object('error', SQLERRM);
END;
$$;

GRANT EXECUTE ON FUNCTION create_vendor TO authenticated, anon;
NOTIFY pgrst, 'reload config';
