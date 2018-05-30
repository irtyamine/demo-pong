import Vue from 'vue/dist/vue.esm.js';
import pong from '../pong';

window.ws = undefined;

new Vue({
  el: '#pong',
  data: {
    playerIds: [],
    scores: [0, 0],
    isPlaying: false
  },
  methods: {
    incrementScore(player) {
      this.$set(this.scores, player, this.scores[player] + 1);
    },
    togglePlaying() {
      this.isPlaying = !this.isPlaying;
      pong.setPlaying(this.isPlaying);
    },
    addPlayer(id) {
      pong.addPlayer(id);
      this.playerIds.push(id);
    },
    removePlayer(id) {
      // TODO
    },
    updatePosition(playerId, position) {
      // TODO
    }
  },
  computed: {
    arePlayersConnected() {
      return this.playerIds[0] != null && this.playerIds[1] != null;
    }
  },
  beforeDestroy() {
    window.ws.close();
  },
  mounted() {
    window.addEventListener('keydown', event => {
      if (event.keyCode === 32) {
        if (!this.arePlayersConnected) {
          return;
        }
        this.togglePlaying();
      }
    });

    pong.init(this.$refs.pongContainer, this.incrementScore);

    window.ws = new WebSocket('ws://localhost:8080');
    window.ws.onmessage = message => {
      const parsed = JSON.parse(message.data);

      switch (parsed.event) {
        case 'playerIn':
          this.addPlayer(parsed.id);
          break;

        case 'playerOut':
          this.removePlayer(parsed.id);
          break;

        case 'position':
          this.updatePosition(parsed.id, parsed.position);
          break;

        default:
          console.warn(`skipping unknown message from server ${parsed.event}`);
          break;
      }
    };
  }
});
