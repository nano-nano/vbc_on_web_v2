<template>
  <div>
    <div id="simTop" class="ui inverted vertical center aligned segment">
      <NavBar page="Simulate" />
    </div>

    <div id="content" class="ui container">
      <!-- ファイルインポート -->
      <CsvImportView :isFileLoaded="state.isCsvFileLoaded" @onFileSelected="onImportFileSelected" />
      
      <!-- 結果表示 -->
      <div id="results" v-if="state.isCsvFileLoaded">
        <Round2View :playerDataList="state.playerDataList" />
        <Round3View :courseOrder="state.r3CourseOrder" :priorityedPlayerDataList="state.r3PriorityedPlayerDataList" />
        <ExRoundView :playerDataList="state.playerDataList" :firstStepProgress="state.exFirstStepProgress" />
        <SemiFinalView :setPlayerDataList="state.sfSetPlayerDataList" />
        <FinalView :setPlayerDataList="state.fSetPlayerDataList" />
      </div>
      <!-- 追加操作 -->
      <div id="additional" v-if="state.isCsvFileLoaded">
        <AdditionalOperationView :vbcLogList="state.vbcLogList" :onClickSaveImageButton="onSaveImageButtonClicked" />
      </div>

      <!-- スクロールボタン -->
      <div class="additional">
        <button v-if="state.isCsvFileLoaded" class="circular ui icon button " @click="onTopScrollClicked">
          トップへ<i class="icon arrow up" />
        </button>
        <button v-if="state.isCsvFileLoaded" class="circular ui icon button " @click="onAdditionalScrollClicked">
          追加操作へ<i class="icon arrow down" />
        </button>
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
import ExRoundView from '@/components/Simulate/ExRoundView.vue';
import SemiFinalView from '@/components/Simulate/SemiFinalView.vue';
import FinalView from '@/components/Simulate/FinalView.vue';
import AdditionalOperationView from '@/components/Simulate/AdditionalOperationView.vue';

import { ExRoundFirstStepProgress, PlayerEntity } from '@/vbc-entity';
import { Round3CourseArray, Rounds } from "@/vbc-state";
import { Round2Logic } from '@/logic/rounds/round2-logic';
import { Round3Logic } from '@/logic/rounds/round3-logic';
import { ExRoundLogic } from '@/logic/rounds/ex-round-logic';
import { SemiFinalLogic } from '@/logic/rounds/semi-final-logic';
import { FinalLogic } from '@/logic/rounds/final-logic';

import html2canvas from 'html2canvas';
import { DateTime } from 'luxon';

export default defineComponent({
  components: {
    NavBar,
    CsvImportView,
    Round2View,
    Round3View,
    ExRoundView,
    SemiFinalView,
    FinalView,
    AdditionalOperationView,
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
      /** ExRound 1st step経過配列 */
      exFirstStepProgress: ExRoundFirstStepProgress[],
      /** SemiFinal セットごとの結果 */
      sfSetPlayerDataList: PlayerEntity[][],
      /** Final セットごとの結果 */
      fSetPlayerDataList: PlayerEntity[][],
    }>({
      isCsvFileLoaded: false,
      playerDataList: [],
      vbcLogList: [],
      r3CourseOrder: [],
      r3PriorityedPlayerDataList: [],
      exFirstStepProgress: [],
      sfSetPlayerDataList: [],
      fSetPlayerDataList: [],
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

        const exResult = ExRoundLogic.operateExRound(state.playerDataList);
        state.exFirstStepProgress = exResult.firstStepProgress;
        state.vbcLogList.push({ round: Rounds.EX_ROUND, log: exResult.roundLog });

        const sfResult = SemiFinalLogic.operateSemiFinal(state.playerDataList);
        state.sfSetPlayerDataList = sfResult.setResult;
        state.vbcLogList.push({ round: Rounds.SEMI_FINAL, log: sfResult.roundLog });

        const fResult = FinalLogic.operateFinal(state.playerDataList);
        state.fSetPlayerDataList = fResult.setResult;
        state.vbcLogList.push({ round: Rounds.FINAL, log: fResult.roundLog });
        


      } else {
        state.playerDataList = [];
        state.vbcLogList = [];
      }
    }

    const onSaveImageButtonClicked = () => {
      const target = document.querySelector('#results') as HTMLElement;
      if (target == null) return;
      html2canvas(target).then(canvas => {
        canvas.toBlob(blob => {
          const fileName = `vbc_result_${DateTime.local().toFormat('yyyyMMddHHmmss')}.png`;

          if (window.navigator.msSaveBlob != undefined) {
            // IEやEdgeの場合
            window.navigator.msSaveOrOpenBlob(blob, fileName);
          } else {
            const url = window.URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = fileName;
            link.click();
          }
        });
      });
    }

    const onTopScrollClicked = () => {
      const target = document.querySelector('#simTop') as HTMLElement;
      target.scrollIntoView({
        behavior: "smooth",
        block: "start"
      });
    }

    const onAdditionalScrollClicked = () => {
      const target = document.querySelector('#additional') as HTMLElement;
      target.scrollIntoView({
        behavior: "smooth",
        block: "start"
      });
    }

    return {
      Rounds,
      state,
      onImportFileSelected,
      onSaveImageButtonClicked,
      onTopScrollClicked,
      onAdditionalScrollClicked,
    };
  }
});
</script>

<style lang="scss" scoped>
#content {
  margin: 20px 0;
}
#additional {
  margin: 20px 0;
}

div.additional {
  position: fixed;
  bottom: 20px;
  right: 30px;
  z-index: 99;
  display: flex;
  flex-direction: column;

  button {
    margin: 5px;
  }
}
</style>