// import Kuzzle from 'kuzzle-sdk/src/Kuzzle';
import pong from '../pong';
import ReconnectingWebSocket from 'ReconnectingWebSocket';
import Vue from 'vue/dist/vue.esm.js';

window.ws = undefined;
const MAX_SCORE = 5;
// const KUZZLE_INDEX_NAME = 'pong';
// const KUZZLE_COLLECTION_NAME = 'wins';

// const kuzzle = new Kuzzle('localhost', { protocol: 'http' });

new Vue({
  el: '#pong',
  data: {
    playersByPosition: [],
    scores: [0, 0],
    positions: {},
    isPlaying: false,
    winnerName: '',
    sound: false
  },
  methods: {
    resetScores() {
      this.$set(this.scores, 0, 0);
      this.$set(this.scores, 1, 0);
    },
    incrementScore(player) {
      this.$set(this.scores, player, this.scores[player] + 1);
      if (this.scores[player] >= MAX_SCORE) {
        this.isPlaying = false;
      }
    },
    togglePlaying() {
      this.isPlaying = !this.isPlaying;
    },
    addPlayer(id) {
      const ids = pong.addPlayer(id);
      if (!ids) {
        console.warn(`unable to add device ${id} to the player list`);
      }
      this.playersByPosition = ids;
    },
    removePlayer(id) {
      const ids = pong.removePlayer(id);
      this.playersByPosition = ids;
      if (this.isPlaying) {
        this.togglePlaying();
      }
    },
    updatePosition(positions) {
      if (!this.arePlayersConnected) {
        return;
      }
      this.positions = positions;
      Object.keys(positions).forEach(playerId => {
        pong.updatePosition(playerId, positions[playerId]);
      });
    },
    submitWinner() {
      this.resetScores();
    }
  },
  computed: {
    arePlayersConnected() {
      return this.connectedPlayer1 && this.connectedPlayer2;
    },
    connectedPlayer1() {
      return this.playersByPosition.top != undefined;
    },
    connectedPlayer2() {
      return this.playersByPosition.bottom != undefined;
    },
    gameEnd() {
      return this.scores[0] >= MAX_SCORE || this.scores[1] >= MAX_SCORE;
    },
    winnerIndex() {
      return this.scores.findIndex(score => {
        return score >= MAX_SCORE;
      });
    }
  },
  watch: {
    isPlaying(value) {
      pong.setPlaying(value);

      if (value === true) {
        this.$refs.music.play();
      }

      if (value === false) {
        this.$refs.music.pause();
      }
    }
  },
  beforeDestroy() {
    window.ws.close();
  },
  async mounted() {
    this.$refs.music.volume = 0;
    window.addEventListener('keydown', event => {
      if (event.keyCode === 32) {
        if (!this.arePlayersConnected) {
          return;
        }
        this.togglePlaying();
      }
      if (event.keyCode === 83) {
        if (this.$refs.music.volume > 0) {
          console.log('sound off');
          this.sound = false;
          this.$refs.music.volume = 0;
        } else {
          console.log('sound on');
          this.sound = true;
          this.$refs.music.volume = 1;
        }
      }
    });

    pong.init(this.$refs.pongContainer, this.incrementScore);

    window.ws = new ReconnectingWebSocket('ws://localhost:8080', null, {
      debug: false
    });
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
          this.updatePosition(parsed.positions);
          break;

        default:
          console.warn(`skipping unknown message from server ${parsed.event}`);
          break;
      }
    };

    window.ws.onopen = () => {
      window.ws.send('getPlayers');
    };

    // await kuzzle.connect();

    // const indexExists = await kuzzle.index.exists(KUZZLE_INDEX_NAME);
    // console.log(indexExists);
    // if (!indexExists) {
    //   await kuzzle.index.create(KUZZLE_INDEX_NAME);
    // }
    // const collectionExists = await kuzzle.collection.exists(
    //   KUZZLE_INDEX_NAME,
    //   KUZZLE_COLLECTION_NAME
    // );
    // if (!collectionExists) {
    //   await kuzzle.collection.create(KUZZLE_INDEX_NAME, KUZZLE_COLLECTION_NAME);
    // }
  }
});
