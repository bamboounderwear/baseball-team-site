<script lang="ts">
  import { onMount } from 'svelte';
  let post: any = null;
  onMount(async () => {
    const slug = location.hash.split('/').pop();
    const res = await fetch('/api/news/' + slug); post = await res.json();
  });
</script>

{#if post}
  <article class="container my-8">
    <img src={post.featuredImageUrl} alt={post.title} class="mb-4" />
    <h1 class="text-3xl font-bold">{post.title}</h1>
    <div class="text-sm mb-4">{post.subtitle} · {new Date(post.publishedAt).toLocaleDateString()}</div>
    <div class="prose max-w-none" >
      {@html post.body}
    </div>
  </article>
{:else}
  <div class="container my-8">Loading...</div>
{/if}
