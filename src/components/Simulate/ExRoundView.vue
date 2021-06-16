<template>
  <div>
    <div class="ui accordion styled fluid">
      <div class="title" :class="{ active: state.isAccordionOpen }" @click="toggleAccordion">
        <i class="dropdown icon" />【Extra Round: 敗者復活】
      </div>
      <div class="content fade" :class="{ active: state.isAccordionOpen }">
        <table class="ui compact table unstackable">
          <thead>
            <tr>
              <th colspan="3">First Step: 読み上げ筆記クイズ</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="(progress, progressIdx) in firstStepProgress" :key="progressIdx" class="center aligned">
              <td>第 {{ progress.questionCount }} 問</td>
              <td><small>{{ progress.answered }}</small></td>
              <td>残り {{ progress.remainedCount }} 人 <b>{{ getSecondStepPlayersFixedLabel(progress.remainedCount) }}</b></td>
            </tr>
          </tbody>
        </table>
        <table v-if="getSecondStepPlayerList.length >= 2" class="ui compact table">
          <thead>
            <tr>
              <th :colspan="getSecondStepPlayerList.length">Second Step: ５○１×クイズ</th>
            </tr>
          </thead>
          <tbody>
            <!-- ペーパー順位 -->
            <tr class="center aligned">
              <td v-for="(player, playerIdx) in getSecondStepPlayerList" :key="playerIdx">
                <small>{{ convertRankNumberToText(player) }}</small>
              </td>
            </tr>
            <!-- 所属 -->
            <tr class="center aligned">
              <td v-for="(player, playerIdx) in getSecondStepPlayerList" :key="playerIdx">
                <small>{{ player.belonging }}</small>
              </td>
            </tr>
            <!-- 名前 -->
            <tr class="center aligned">
              <td v-for="(player, playerIdx) in getSecondStepPlayerList" :key="playerIdx" :style="{ backgroundColor: getNamePlateColorCode(player) }">
                <strong class="vertical-writing">{{ player.name }}</strong>
              </td>
            </tr>
            <!-- 正誤記録 -->
            <tr class="center aligned">
              <td v-for="(player, playerIdx) in getSecondStepPlayerList" :key="playerIdx">
                <small>{{ player.exStatus.secondStepAnswered }}</small>
              </td>
            </tr>
            <!-- 状態 -->
            <tr class="center aligned">
              <td v-for="(player, playerIdx) in getSecondStepPlayerList" :key="playerIdx">
                <small :class="getWinnedStateLabelStyle(player.exStatus.secondStepStatus)">{{ player.exStatus.secondStepStatus }}</small>
              </td>
            </tr>
          </tbody>
        </table>
        <!-- Second Step不開催パターン -->
        <div v-if="getSecondStepPlayerList.length == 1" class="ui segment">
          <p>
            勝ち抜け者1名のみのため、Second StepはSkip: {{ getSecondStepPlayerList[0].name }}
            {{ getSecondStepPlayerList[0].belonging ? '【' + getSecondStepPlayerList[0].belonging + '】' : '' }}
          </p>
        </div>
        <div v-if="getSecondStepPlayerList.length == 0" class="ui segment">
          <p>勝ち抜け者0名のため、Second StepはSkip</p>
        </div>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import { computed, defineComponent, PropType, reactive } from 'vue';

import { ExRoundFirstStepProgress, PlayerEntity } from '@/vbc-entity';
import { NamePlateUtils, WinnedStateUtils } from '@/logic/common-logic';
import { WinnedState } from '@/vbc-state';

const getSecondStepPlayersFixedLabel = (remainedCount: number) => ((remainedCount > 0 && remainedCount <= 12) ? '⇒ 決定！' : '');
const convertRankNumberToText = (player: PlayerEntity) => NamePlateUtils.convertRankNumberToText(player.paperRank);
const getNamePlateColorCode = (player: PlayerEntity) => NamePlateUtils.getBgColorCode(player.paperRank);
const getWinnedStateLabelStyle = (state: string) => WinnedStateUtils.getWinnedStateLabelStyle(state);

export default defineComponent({
  props: {
    playerDataList: {
      type: Array as PropType<PlayerEntity[]>,
      required: true
    },
    firstStepProgress: {
      type: Array as PropType<ExRoundFirstStepProgress[]>,
      required: true
    }
  },
  setup(props) {
    const state = reactive({
      /** Accordionが開いているかどうか */
      isAccordionOpen: false,
    });

    const getSecondStepPlayerList = computed(() => {
      return props.playerDataList.filter(p => p.exStatus.firstStepStatus == WinnedState.NON_ORDER_WINNED);
    });

    const toggleAccordion = () => {
      state.isAccordionOpen = !state.isAccordionOpen;
    }

    return {
      props,
      state,
      getSecondStepPlayerList,
      toggleAccordion,
      getSecondStepPlayersFixedLabel,
      convertRankNumberToText,
      getNamePlateColorCode,
      getWinnedStateLabelStyle,
    }
  }
});
</script>

<style lang="scss" scoped>
.fade{
  animation: fadeIn 0.5s;
}
@keyframes fadeIn {
  0% { opacity: 0.0 }
  100% { opacity: 1.0 }
}
</style>