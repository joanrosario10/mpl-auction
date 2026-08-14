-- Run after schema.sql. Prints "max_bid ok" or throws.
do $$
begin
  assert public.max_bid(5000, 11, 100) = 4000, 'fresh purse, 10 slots to reserve';
  assert public.max_bid(3000,  5, 100) = 2600, 'mid auction, limited';
  assert public.max_bid( 300,  4, 100) =    0, 'broke, must save for the rest';
  assert public.max_bid( 500,  1, 100) =  500, 'last slot, spend it all';
  assert public.max_bid( 500,  0, 100) =    0, 'squad full';
  assert public.max_bid(   0,  3, 100) =    0, 'no money';
  raise notice 'max_bid ok';
end $$;
