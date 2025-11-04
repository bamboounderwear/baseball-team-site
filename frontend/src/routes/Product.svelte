<script lang="ts">
  import { onMount } from 'svelte';
  let product: any = null;
  let qty = 1;

  onMount(async () => {
    const slug = location.hash.split('/').pop();
    // In a fuller build you'd fetch /api/products/:slug
    product = { slug, title: slug, price: 29.99, imageUrl:'https://placehold.co/1000x600?text='+slug, description:'Product description.' };
  });

  async function addToCart() {
    const r = await fetch('/api/cart/product', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ productId: 1, qty }) });
    if (r.ok) alert('Added to cart');
  }
</script>

{#if product}
<section class="container my-8">
  <img src={product.imageUrl} alt={product.title} class="mb-4" />
  <h1 class="text-3xl font-bold">{product.title}</h1>
  <div class="text-xl mb-2">${product.price}</div>
  <p class="mb-4">{product.description}</p>
  <form on:submit|preventDefault={addToCart} class="flex items-center gap-2">
    <input type="number" min="1" bind:value={qty} class="w-24" />
    <button type="submit">Add to cart</button>
  </form>
</section>
{/if}
