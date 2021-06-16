<template>
  <div>
    <div class="ui accordion styled fluid">
      <div class="title" :class="{ active: state.isAccordionOpen }" @click="toggleAccordion">
        <i class="dropdown icon" />【Round 2: 連答つき５○２×】
      </div>
      <div class="content fade" :class="{ active: state.isAccordionOpen }">
        <div v-for="(players, setIdx) in setList" :key="setIdx">
          <table class="ui compact table unstackable">
            <thead>
              <tr>
                <th colspan="12">第{{ (setIdx + 1) }}セット</th>
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
                  <strong class="vertical-writing">{{ player.name }}</strong>
                </td>
              </tr>
              <!-- 正誤記録 -->
              <tr class="center aligned">
                <td v-for="(player, playerIdx) in players" :key="playerIdx">
                  <small>{{ player.r2Status.answered }}</small>
                </td>
              </tr>
              <!-- 状態 -->
              <tr class="center aligned">
                <td v-for="(player, playerIdx) in players" :key="playerIdx">
                  <small :class="getWinnedStateLabelStyle(player.r2Status.status)">{{ player.r2Status.status }}</small>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
        <!-- 次点表示エリア -->
        <div class="ui segment" v-if="props.playerDataList.length >= 49">
          <p>
            次点（49th）: {{ props.playerDataList[48].name }}
            {{ props.playerDataList[48].belonging ? '【' + props.playerDataList[48].belonging + '】' : '' }}
          </p>
        </div>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import { computed, defineComponent, PropType, reactive } from 'vue';

import { PlayerEntity } from '@/vbc-entity';
import { NamePlateUtils, WinnedStateUtils } from '@/logic/common-logic';

const convertRankNumberToText = (player: PlayerEntity) => NamePlateUtils.convertRankNumberToText(player.paperRank);
const getNamePlateColorCode = (player: PlayerEntity) => NamePlateUtils.getBgColorCode(player.paperRank);
const getWinnedStateLabelStyle = (state: string) => WinnedStateUtils.getWinnedStateLabelStyle(state);

export default defineComponent({
  props: {
    playerDataList: {
      type: Array as PropType<PlayerEntity[]>,
      required: true
    }
  },
  setup(props) {
    const state = reactive({
      /** Accordionが開いているかどうか */
      isAccordionOpen: true,
    });

    const setList = computed(() => {
      const result: PlayerEntity[][] = [[], [], [], []];
      for(let i = 0; i < 48; i++) {
        const player = props.playerDataList[i];
        result[i % 4].push(player);
      }
      return result;
    });

    const toggleAccordion = () => {
      state.isAccordionOpen = !state.isAccordionOpen;
    }

    return {
      state,
      props,
      setList,
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