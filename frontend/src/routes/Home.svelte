<script lang="ts">
  import { onMount } from 'svelte';
  let hero: any = {};
  let games: any[] = [];
  let news: any[] = [];
  let email = ''; let name='';

  onMount(async () => {
    const res = await fetch('/api/home');
    const j = await res.json();
    hero = j.hero;
    games = j.upcomingGames;
    news = j.recentNews;
  });

  async function subscribe() {
    const r = await fetch('/api/newsletter', { method: 'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ email, name }) });
    if (r.ok) { email=''; name=''; alert('Thanks for subscribing!'); }
  }
</script>

<section class="relative">
  <img src="{hero?.background ?? 'https://placehold.co/1600x500?text=Hero+Banner'}" alt="Hero" class="w-full h-auto" />
  <div class="container py-6">
    <h1 class="text-3xl md:text-5xl font-bold">{hero?.headline ?? 'Welcome to the Team'}</h1>
    <a href="#/games" class="inline-block mt-4">
      <button>{hero?.cta ?? 'Get Tickets'}</button>
    </a>
  </div>
</section>

<section class="container my-8">
  <h2 class="text-2xl font-bold mb-4">Next Games</h2>
  <div class="grid md:grid-cols-3">
    {#each games as g}
      <a href={"#/games/" + g.slug} class="block border border-black p-4">
        <img src={"https://placehold.co/600x300?text=" + encodeURIComponent(g.title)} alt={g.title} class="mb-2" />
        <div class="font-bold">{g.title}</div>
        <div>{new Date(g.date).toLocaleString()}</div>
        <div>vs {g.opponent}</div>
      </a>
    {/each}
  </div>
</section>

<section class="container my-8">
  <h2 class="text-2xl font-bold mb-4">Recent News</h2>
  <div class="grid md:grid-cols-3">
    {#each news as n}
      <a href={"#/news/" + n.slug} class="block border border-black p-4">
        <img src={n.featuredImageUrl} alt={n.title} class="mb-2" />
        <div class="font-bold">{n.title}</div>
        <div class="text-sm">{new Date(n.publishedAt).toLocaleDateString()}</div>
      </a>
    {/each}
  </div>
</section>

<section class="container my-8">
  <h2 class="text-2xl font-bold mb-4">Join our newsletter</h2>
  <form on:submit|preventDefault={subscribe} class="grid gap-2 max-w-md">
    <input type="text" placeholder="Your name" bind:value={name} />
    <input type="email" placeholder="Email address" bind:value={email} />
    <button type="submit">Sign Up</button>
  </form>
</section>
