<script lang="ts">
  import { onMount } from 'svelte';
  let cartCount = 0;
  onMount(async () => {
    try {
      const r = await fetch('/api/cart');
      const j = await r.json();
      cartCount = (j.cart.products?.reduce((a: number, x: any) => a + x.qty, 0) || 0) + (j.cart.tickets?.length || 0);
    } catch {}
  });
</script>

<header class="border-b border-black">
  <div class="container flex items-center justify-between py-4">
    <a href="#/" class="font-bold text-xl">Baseball</a>
    <nav class="flex gap-4">
      <a href="#/">Home</a>
      <a href="#/team">Team</a>
      <a href="#/news">News</a>
      <a href="#/games">Games & Schedule</a>
      <a href="#/shop">Shop</a>
    </nav>
    <a href="#/cart" class="relative">Cart (<span>{cartCount}</span>)</a>
  </div>
</header>
