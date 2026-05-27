Deno.serve(async (req: Request) => {
  const key = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  return new Response(JSON.stringify({
    has_key: !!key,
    key_length: key?.length || 0,
    key_prefix: key?.substring(0, 20) || 'none'
  }), { headers: { "content-type": "application/json" } });
});
