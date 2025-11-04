<script lang="ts">
  import { onMount } from 'svelte';
  let teamSettings: any = {};
  let list: any[] = [];

  onMount(async () => {
    try {
      const s = await fetch('/api/admin/settings?key=team'); // not implemented; fallback to default in DB in real admin
    } catch {}
    // For demo simplicity, we'll query players via a public endpoint (could be added); here just mock fetch from news as placeholder
    const res = await fetch('/api/home'); const j = await res.json();
    teamSettings = j?.team ?? { title:'Our Team', subtitle:'Meet the players', about:'We are a community-driven baseball team.' };
    // No public players endpoint in this skeleton; create via admin and wire up similarly
    list = [
      { name:'Player One', bio:'Pitcher', imageUrl:'https://placehold.co/400x400?text=Player+1' },
      { name:'Player Two', bio:'Catcher', imageUrl:'https://placehold.co/400x400?text=Player+2' },
      { name:'Player Three', bio:'Shortstop', imageUrl:'https://placehold.co/400x400?text=Player+3' }
    ];
  });
</script>

<section class="container my-8">
  <h1 class="text-3xl font-bold mb-2">{teamSettings.title ?? 'Team'}</h1>
  <p class="mb-4">{teamSettings.subtitle ?? 'Subtitle'}</p>
  <p class="mb-8">{teamSettings.about ?? 'About the team.'}</p>

  <div class="grid md:grid-cols-3">
    {#each list as p}
      <div class="border border-black p-4">
        <img src={p.imageUrl} alt={p.name} class="mb-2" />
        <div class="font-bold">{p.name}</div>
        <div class="text-sm">{p.bio}</div>
      </div>
    {/each}
  </div>
</section>
