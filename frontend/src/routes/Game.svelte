<script lang="ts">
  import { onMount } from 'svelte';
  let game: any = null;
  let section = '';
  let seats: any[] = [];
  let message = '';

  onMount(async () => {
    const slug = location.hash.split('/').pop();
    const r = await fetch('/api/games/' + slug); game = await r.json();
  });

  async function loadSeats() {
    if (!game || !section) return;
    const r = await fetch(`/api/tickets?gameId=${game.id}&section=${encodeURIComponent(section)}`);
    const j = await r.json();
    seats = j.seats;
  }

  async function addSeat(row: string, seatNumber: number) {
    const r = await fetch('/api/cart/ticket', {
      method: 'POST',
      headers: {'Content-Type':'application/json'},
      body: JSON.stringify({ gameId: game.id, section, row, seat: seatNumber })
    });
    message = r.ok ? 'Added to cart' : 'Seat not available';
  }
</script>

{#if game}
<section class="container my-8">
  <img src={"https://placehold.co/1200x400?text=" + encodeURIComponent(game.title)} alt={game.title} class="mb-4" />
  <h1 class="text-3xl font-bold">{game.title}</h1>
  <div class="mb-4">{new Date(game.date).toLocaleString()} · vs {game.opponent}</div>

  <div class="mb-2">Select Section:</div>
  <select bind:value={section} on:change={loadSeats} class="mb-4 max-w-sm">
    <option value="">-- Select --</option>
    {#each game.sections as s}
      <option value={s.section}>{s.section} (Available: {s.available})</option>
    {/each}
  </select>

  {#if section}
    <div class="mb-2 font-bold">Seats in {section}</div>
    <table>
      <thead><tr><th>Row</th><th>Seat</th><th>Price</th><th>Status</th><th></th></tr></thead>
      <tbody>
        {#each seats as s}
          <tr>
            <td>{s.row}</td>
            <td>{s.seat}</td>
            <td>${s.price}</td>
            <td>{s.status}</td>
            <td>{#if s.status === 'available'}<button on:click={() => addSeat(s.row, s.seat)}>Add</button>{/if}</td>
          </tr>
        {/each}
      </tbody>
    </table>
    {#if message}<div class="mt-2">{message}</div>{/if}
  {/if}
</section>
{:else}
  <div class="container my-8">Loading...</div>
{/if}
