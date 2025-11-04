<script lang="ts">
  import { onMount } from 'svelte';
  let list: any[] = [];
  onMount(async () => {
    const res = await fetch('/api/news'); const j = await res.json(); list = j.list;
  });
</script>

<section class="container my-8">
  <h1 class="text-3xl font-bold mb-4">News</h1>
  <div class="grid md:grid-cols-3">
    {#each list as n}
      <a href={"#/news/" + n.slug} class="border border-black p-4">
        <img src={n.featuredImageUrl} alt={n.title} class="mb-2" />
        <div class="font-bold">{n.title}</div>
        <div class="text-sm">{new Date(n.publishedAt).toLocaleDateString()}</div>
      </a>
    {/each}
  </div>
</section>
