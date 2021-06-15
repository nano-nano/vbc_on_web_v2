<template>
  <div>
    <div class="ui accordion styled fluid">
      <div class="title" :class="{ active: state.isAccordionOpen }" @click="toggleAccordion">
        <i class="dropdown icon" />【Final: トリプルセブン】
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
                  <small>{{ convertRankNumberToText(player) }}</small>
                </td>
              </tr>
              <!-- 所属 -->
              <tr class="center aligned">
                <td v-for="(player, playerIdx) in players" :key="playerIdx">
                  <small>{{ player.belonging }}</small>
                </td>
              </tr>
              <!-- 名前 -->
              <tr class="center aligned">
                <td v-for="(player, playerIdx) in players" :key="playerIdx" :style="{ backgroundColor: getNamePlateColorCode(player) }">
                  <strong class="vertical-writing" >{{ player.name }}</strong>
                </td>
              </tr>
              <!-- 正誤記録 -->
              <tr class="center aligned">
                <td v-for="(player, playerIdx) in players" :key="playerIdx">
                  <small>{{ player.fStatus.set[setIdx].answered }}</small>
                </td>
              </tr>
              <!-- 状態 -->
              <tr class="center aligned">
                <td v-for="(player, playerIdx) in players" :key="playerIdx">
                  <small :class="getWinnedStateLabelStyle(player.sfStatus.status)">
                    {{ player.fStatus.set[setIdx].status }}
                    <span v-if="player.fStatus.set[setIdx].status == WinnedState.NON_ORDER_WINNED">
                      {{ getWinnedStateAppendlabel(player) }}
                    </span>
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
import { defineComponent, PropType, reactive } from 'vue';

import { PlayerEntity } from '@/vbc-entity';
import { NamePlateUtils, WinnedStateUtils } from '@/logic/common-logic';
import { WinnedState } from '@/vbc-state';

const convertRankNumberToText = (player: PlayerEntity) => NamePlateUtils.convertRankNumberToText(player.paperRank);
const getNamePlateColorCode = (player: PlayerEntity) => NamePlateUtils.getBgColorCode(player.paperRank);
const getWinnedStateLabelStyle = (state: string) => WinnedStateUtils.getWinnedStateLabelStyle(state);
const getWinnedStateAppendlabel = (player: PlayerEntity) => {
  return `${player.fStatus.nSeven}★ ` + ((player.fStatus.nSeven == 3) ? ' ⇒ 優勝！' : '');
};

export default defineComponent({
  props: {
    setPlayerDataList: {
      type: Array as PropType<PlayerEntity[]>,
      required: true
    }
  },
  setup(props) {
    const state = reactive({
      /** Accordionが開いているかどうか */
      isAccordionOpen: true,
    });

    const toggleAccordion = () => {
      state.isAccordionOpen = !state.isAccordionOpen;
    }

    return {
      WinnedState,
      state,
      props,
      toggleAccordion,
      convertRankNumberToText,
      getNamePlateColorCode,
      getWinnedStateLabelStyle,
      getWinnedStateAppendlabel
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