<script lang="ts">
  import { onMount } from 'svelte';
  import Nav from './components/Nav.svelte';
  import Footer from './components/Footer.svelte';
  import Home from './routes/Home.svelte';
  import Team from './routes/Team.svelte';
  import News from './routes/News.svelte';
  import NewsPost from './routes/NewsPost.svelte';
  import Games from './routes/Games.svelte';
  import Game from './routes/Game.svelte';
  import Shop from './routes/Shop.svelte';
  import Product from './routes/Product.svelte';

  let route = location.hash.slice(1) || '/';
  const navigate = () => route = location.hash.slice(1) || '/';

  onMount(() => {
    window.addEventListener('hashchange', navigate);
    return () => window.removeEventListener('hashchange', navigate);
  });

  function Router() {
    if (route === '/') return Home;
    if (route.startsWith('/team')) return Team;
    if (route.startsWith('/news/')) return NewsPost;
    if (route.startsWith('/news')) return News;
    if (route.startsWith('/games/')) return Game;
    if (route.startsWith('/games')) return Games;
    if (route.startsWith('/shop')) return Shop;
    if (route.startsWith('/product/')) return Product;
    return Home;
  }
</script>

<div class="min-h-screen flex flex-col bg-white text-black">
  <Nav />
  <main class="flex-1">
    <svelte:component this="{Router()}" />
  </main>
  <Footer />
</div>
