<script lang="ts">
  import InputBox from "./lib/InputBox.svelte";
  import LogView from "./lib/LogView.svelte";
  import {MessageRepository} from "./lib/repository/MessageRepository";

  let messageRepository = new MessageRepository();
</script>

<main class="container">
  <div class="input-box">
    <InputBox replyTo={null} messageRepository={messageRepository} />
  </div>
  <div class="log-view">
    <LogView messageRepository={messageRepository} />
  </div>
</main>

<style>
  .container {
    display: flex; /* Enables Flexbox */
    flex-direction: column; /* Stack children vertically */
    height: 100vh;
    padding-left: 8px;
    padding-right: 8px;
  }

  .log-view {
    padding-inline-start: 0;
    flex-grow: 1;
    margin-block-start: 0;
    margin-block-end: 0;
    max-height: 80vh;
  }

  .input-box {
    margin-top: 9px;
  }
</style>
