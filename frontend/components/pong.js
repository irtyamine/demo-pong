import Vue from 'vue/dist/vue.esm.js';
import pong from '../pong';

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
    }
  },
  computed: {
    arePlayersConnected() {
      return this.playerIds[0] != null && this.playerIds[1] != null;
    }
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

    this.addPlayer('lal');
    this.addPlayer('lol');
  }
});
