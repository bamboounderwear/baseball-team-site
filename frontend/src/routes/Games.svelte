<script lang="ts">
  import { onMount } from 'svelte';
  let list: any[] = [];
  onMount(async () => {
    const res = await fetch('/api/games'); const j = await res.json(); list = j.list;
  });
</script>

<section class="container my-8">
  <h1 class="text-3xl font-bold mb-4">Games & Schedule</h1>
  <div class="grid md:grid-cols-3">
    {#each list as g}
      <a href={"#/games/" + g.slug} class="border border-black p-4">
        <img src={"https://placehold.co/600x300?text=" + encodeURIComponent(g.title)} alt={g.title} class="mb-2" />
        <div class="font-bold">{g.title}</div>
        <div>{new Date(g.date).toLocaleString()}</div>
        <div>vs {g.opponent}</div>
      </a>
    {/each}
  </div>
</section>
