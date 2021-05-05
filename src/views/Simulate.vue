<template>
  <div>
    <div class="ui inverted vertical center aligned segment">
      <NavBar page="Simulate" />
    </div>

    <div id="content" class="ui container">
      <!-- ファイルインポート -->
      <CsvImportView :isFileLoaded="state.isCsvFileLoaded" @onFileSelected="onImportFileSelected" />
      
      <div id="results" v-show="state.isCsvFileLoaded">
        <Round2View :playerDataList="state.playerDataList" @onFinishRound="onFinishRoundSimulate(Rounds.ROUND_2)" />
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent, reactive } from 'vue';

import NavBar from '@/components/NavBar.vue';
import CsvImportView from '@/components/Simulate/CsvImportView.vue';
import Round2View from '@/components/Simulate/Round2View.vue';

import { PlayerEntity } from '@/vbc-entity';

enum Rounds {
  ROUND_2
}

export default defineComponent({
  components: {
    NavBar,
    CsvImportView,
    Round2View,
  },
  setup() {
    const state = reactive<{
      /** 参加者データCSVを読み込んでいるかどうか */
      isCsvFileLoaded: boolean,
      /** 参加者データ配列 */
      playerDataList: PlayerEntity[],
      /** 1問ログデータ格納用連想配列 */
      vbcLogList: any[],
      /** Round2が終了したかどうか */
      isRound2Finished: boolean
    }>({
      isCsvFileLoaded: false,
      playerDataList: [],
      vbcLogList: [],
      isRound2Finished: false
    });
    
    const onImportFileSelected = (entities: PlayerEntity[] | null) => {
      state.isCsvFileLoaded = false;
      if (entities != null) {
        state.playerDataList = entities;
        state.vbcLogList = [];
        if (entities.length != 0) {
          state.isCsvFileLoaded = true;
        }
      } else {
        state.playerDataList = [];
        state.vbcLogList = [];
      }
    }

    const onFinishRoundSimulate = (round: Rounds) => {
      switch (round) {
        case Rounds.ROUND_2:
          state.isRound2Finished = true;
          break;
        default:
          // 
      }
    }

    return {
      Rounds,
      state,
      onImportFileSelected,
      onFinishRoundSimulate,
    };
  }
});
</script>

<style lang="scss" scoped>
#content {
  margin: 20px 0;
}
</style>