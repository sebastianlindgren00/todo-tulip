<script lang="ts">
	import Footer from '@components/layout/footer.svelte';
	import './styles.css';
</script>

<main class="app main-bg h-full min-w-full w-fit">
	<slot />
</main>
<Footer />

<style>
	.main-bg {
		background: #eb5bdb;
		background: linear-gradient(135deg, #eb5bdb, #a161fb);
	}
</style>
