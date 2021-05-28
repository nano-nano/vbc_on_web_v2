<template>
  <div>
    <div class="ui accordion styled fluid">
      <div class="title" :class="{ active: state.isAccordionOpen }" @click="toggleAccordion">
        <i class="dropdown icon" />【Semi Final: 3セット制タイムレース Nine Hundred】
      </div>
      <div class="content fade" :class="{ active: state.isAccordionOpen }">
        <div v-for="(players, setIdx) in setPlayerDataList" :key="setIdx">
          <table class="ui compact table">
            <thead>
              <tr>
                <!-- Proxy objectの要素数をカウントするhack -->
                <th :colspan="Object.keys(props.setPlayerDataList[0]).length">第{{ (setIdx + 1) }}セット</th>
              </tr>
            </thead>
            <tbody>
              <!-- ペーパー順位 -->
              <tr class="center aligned">
                <td v-for="(player, playerIdx) in players" :key="playerIdx">
                  <small v-show="isNeedShowPlayer((setIdx + 1), player)">{{ convertRankNumberToText(player) }}</small>
                </td>
              </tr>
              <!-- 所属 -->
              <tr class="center aligned">
                <td v-for="(player, playerIdx) in players" :key="playerIdx">
                  <small v-show="isNeedShowPlayer((setIdx + 1), player)">{{ player.belonging }}</small>
                </td>
              </tr>
              <!-- 名前 -->
              <tr class="center aligned">
                <td v-for="(player, playerIdx) in players" :key="playerIdx" :style="{ backgroundColor: getNamePlateColorCode(player, isNeedShowPlayer((setIdx + 1), player)) }">
                  <strong class="vertical-writing" v-show="isNeedShowPlayer((setIdx + 1), player)">{{ player.name }}</strong>
                </td>
              </tr>
              <!-- 正誤記録 -->
              <tr class="center aligned">
                <td v-for="(player, playerIdx) in players" :key="playerIdx">
                  <small v-show="isNeedShowPlayer((setIdx + 1), player)">{{ player.sfStatus.answered[setIdx] }}</small>
                </td>
              </tr>
              <!-- 状態 -->
              <tr class="center aligned">
                <td v-for="(player, playerIdx) in players" :key="playerIdx">
                  <small :class="getWinnedStateLabelStyle(player.sfStatus.status)" v-show="isNeedShowPlayer((setIdx + 1), player)">
                    {{ player.sfStatus.status }}
                  </small>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import { computed, defineComponent, PropType, reactive } from 'vue';

import { PlayerEntity } from '@/vbc-entity';
import { NamePlateUtils, WinnedStateUtils } from '@/logic/common-logic';
import { WinnedState } from '@/vbc-state';

const convertRankNumberToText = (player: PlayerEntity) => NamePlateUtils.convertRankNumberToText(player.paperRank);
const getNamePlateColorCode = (player: PlayerEntity, isNeedShow: boolean) => {
  if (!isNeedShow) return ''; // 表示の必要が無い場合は背景に色を付けない
  return NamePlateUtils.getBgColorCode(player.paperRank)
};
const getWinnedStateLabelStyle = (state: string) => WinnedStateUtils.getWinnedStateLabelStyle(state);

export default defineComponent({
  props: {
    setPlayerDataList: {
      type: Array as PropType<PlayerEntity[][]>,
      required: true
    }
  },
  setup(props) {
    const state = reactive({
      /** Accordionが開いているかどうか */
      isAccordionOpen: false,
    });

    const isNeedShowPlayer = (setNo: number, player: PlayerEntity) => {
      if (setNo == 2) {
        if (player.sfStatus.status == WinnedState.FIRST_WINNED) return false;
        if (player.sfStatus.losedSetNo < 2) return false;
      } else if (setNo == 3) {
        if (player.sfStatus.status == WinnedState.FIRST_WINNED || player.sfStatus.status == WinnedState.SECOND_WINNED) return false;
        if (player.sfStatus.losedSetNo < 3) return false;
      }
      return true;
    }


    const toggleAccordion = () => {
      state.isAccordionOpen = !state.isAccordionOpen;
    }

    return {
      state,
      props,
      isNeedShowPlayer,
      toggleAccordion,
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