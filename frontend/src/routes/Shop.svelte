<script lang="ts">
  import { onMount } from 'svelte';
  let list: any[] = [];
  onMount(async () => {
    // In a fuller build you'd add a public GET /api/products
    list = [
      { slug:'shirt', title:'Team Shirt', price:29.99, imageUrl:'https://placehold.co/600x600?text=Shirt' },
      { slug:'cap', title:'Team Cap', price:19.99, imageUrl:'https://placehold.co/600x600?text=Cap' }
    ];
  });
</script>

<section class="container my-8">
  <h1 class="text-3xl font-bold mb-4">Shop</h1>
  <div class="grid md:grid-cols-3">
    {#each list as p}
      <a href={"#/product/" + p.slug} class="border border-black p-4">
        <img src={p.imageUrl} alt={p.title} class="mb-2" />
        <div class="font-bold">{p.title}</div>
        <div>${p.price}</div>
      </a>
    {/each}
  </div>
</section>
