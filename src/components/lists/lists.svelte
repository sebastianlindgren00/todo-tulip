<script lang="ts">
    import { getLists, pb } from '@lib/pocketbase';
    import { onDestroy } from 'svelte';
    import Card from './card.svelte';
    import { onMount } from 'svelte';

    let lists = [];

    const fetchLists = async () => {
        try {
            const response = await getLists();
            lists = response.items;
        } catch (error) {
            console.error('Failed to fetch lists:', error);
        }
    };

    // same as in card.svelte component
    onMount(() => {
        fetchLists();
        pb.collection('lists').subscribe(
        '*',
         function(e){
            console.log('Lists subscription triggered:', e);
            switch (e.action) {
                case 'create':
                    console.log(' List created!!!');
                    lists = [...lists, e.record];
                    break;
                case 'update':
                    lists = lists.map((list) => (list.id === e.record.id ? e.record : list));
                    break;
                case 'delete':
                    // remove the item from the array
                    lists = lists.filter((list) => list.id !== e.record.id);
                    break;
                default:
                    break;
            }
        });
    });

    onDestroy(() => {
            pb.collection('lists').unsubscribe();
    });
</script>

<div class="flex pb-5">
    {#each lists as list (list.id)}
        <Card listName={list.name} listId={list.id} sharedUsers={list.shared} listOwner={list.owner} />
    {/each}
</div>
