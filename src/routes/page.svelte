<script lang="ts">
	import styles from './page.module.pcss';
</script>

<style lang="postcss">
	h1 {
		color: red;
		font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
	}

	.whoop-it {
		background: darkolivegreen;
	}
</style>

<h1 class="whoop-it">Welcome to SvelteKit</h1>
<p class={styles.psara + ' ' + styles.imHash}>Visit me at
	<a href="https://svelte.dev/docs/kit">svelte.dev/docs/kit</a>
	to read the documentation
</p>
