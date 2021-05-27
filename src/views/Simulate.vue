<template>
  <div>
    <div class="ui inverted vertical center aligned segment">
      <NavBar page="Simulate" />
    </div>

    <div id="content" class="ui container">
      <!-- ファイルインポート -->
      <CsvImportView :isFileLoaded="state.isCsvFileLoaded" @onFileSelected="onImportFileSelected" />
      
      <div id="results" v-if="state.isCsvFileLoaded">
        <Round2View :playerDataList="state.playerDataList" />
        <Round3View :courseOrder="state.r3CourseOrder" :priorityedPlayerDataList="state.r3PriorityedPlayerDataList" />
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent, reactive } from 'vue';

import NavBar from '@/components/NavBar.vue';
import CsvImportView from '@/components/Simulate/CsvImportView.vue';
import Round2View from '@/components/Simulate/Round2View.vue';
import Round3View from '@/components/Simulate/Round3View.vue';

import { PlayerEntity } from '@/vbc-entity';
import { Round2Logic } from '@/logic/rounds/round2-logic';
import { Round3Logic } from '@/logic/rounds/round3-logic';
import { Round3CourseArray } from "@/vbc-state";

enum Rounds {
  ROUND_2,
  ROUND_3,
}

export default defineComponent({
  components: {
    NavBar,
    CsvImportView,
    Round2View,
    Round3View,
  },
  setup() {
    const state = reactive<{
      /** 参加者データCSVを読み込んでいるかどうか */
      isCsvFileLoaded: boolean,
      /** 参加者データ配列 */
      playerDataList: PlayerEntity[],
      /** 1問ログデータ格納用連想配列 */
      vbcLogList: { round: Rounds, log: string }[],
      /** Round3コース順配列 */
      r3CourseOrder: typeof Round3CourseArray,
      /** Round3参加者データ配列（優先順位順） */
      r3PriorityedPlayerDataList: PlayerEntity[],
    }>({
      isCsvFileLoaded: false,
      playerDataList: [],
      vbcLogList: [],
      r3CourseOrder: [],
      r3PriorityedPlayerDataList: [],
    });
    
    const onImportFileSelected = (entities: PlayerEntity[] | null): void => {
      state.isCsvFileLoaded = false;
      if (entities != null) {
        state.playerDataList = entities;
        state.vbcLogList = [];
        
        if (entities.length == 0) return;
        state.isCsvFileLoaded = true;

        // 試合実行
        const r2Log = Round2Logic.operateRound2(state.playerDataList);
        state.vbcLogList.push({ round: Rounds.ROUND_2, log: r2Log });

        const r3Result = Round3Logic.operateRound3(state.playerDataList);
        state.r3CourseOrder = r3Result.courseOrder;
        state.r3PriorityedPlayerDataList = r3Result.priorityedPlayers;
        state.vbcLogList.push({ round: Rounds.ROUND_3, log: r3Result.roundLog });


      } else {
        state.playerDataList = [];
        state.vbcLogList = [];
      }
    }

    return {
      Rounds,
      state,
      onImportFileSelected,
    };
  }
});
</script>

<style lang="scss" scoped>
#content {
  margin: 20px 0;
}
</style>