<script lang="ts">

    let body="";

    function send() {
        alert(`body: ${body}`)
    }

    function handleKeydown(event: KeyboardEvent) {
        if (event.shiftKey || event.ctrlKey || event.altKey || event.metaKey) {
            return;
        }

        if (event.key === 'Enter') {
            event.preventDefault();

            send();
        }
    }
</script>

<div>
    <form on:submit={send}>
        <textarea bind:value={body} cols="40" rows="3" on:keydown={handleKeydown}></textarea>
        <button>Send</button>
    </form>
</div>

<style>
    form {
        display: flex; /* Use flexbox to layout children */
        flex-direction: row; /* Stack children vertically */
        align-items: stretch; /* Stretch children to match the width of the container */
    }

    textarea {
        font-size: 1em; /* Sets font size to match default browser font size */
        width: 90%; /* Sets width to 70% of the container's width */
        resize: vertical; /* Allows resizing only vertically */
    }

    button {
        width: 10%; /* Sets width to 30% of the container's width */
        /* Additional styling for the button, if needed */
    }
</style>
