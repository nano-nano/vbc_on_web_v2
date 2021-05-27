<template>
  <div>
    <div class="ui accordion styled fluid">
      <div class="title" :class="{ active: state.isAccordionOpen }" @click="toggleAccordion">
        <i class="dropdown icon" />【Extra Round: 敗者復活】
      </div>
      <div class="content fade" :class="{ active: state.isAccordionOpen }">
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent, PropType, reactive } from 'vue';

import { PlayerEntity } from '@/vbc-entity';
import { NamePlateUtils, WinnedStateUtils } from '@/logic/common-logic';

const convertRankNumberToText = (player: PlayerEntity) => NamePlateUtils.convertRankNumberToText(player.paperRank);
const getNamePlateColorCode = (player: PlayerEntity) => NamePlateUtils.getBgColorCode(player.paperRank);
const getWinnedStateLabelStyle = (state: string) => WinnedStateUtils.getWinnedStateLabelStyle(state);

export default defineComponent({
  props: {
    courseOrder: {
      type: Array,
      required: true
    },
    priorityedPlayerDataList: {
      type: Array as PropType<PlayerEntity[]>,
      required: true
    },
  },
  setup(props) {
    const state = reactive({
      /** Accordionが開いているかどうか */
      isAccordionOpen: false,
    });

    const toggleAccordion = () => {
      state.isAccordionOpen = !state.isAccordionOpen;
    }

    const getCoursePlayerList = (course: string) => props.priorityedPlayerDataList.filter(e => e.r3Status.fixedCourse == course);

    return {
      props,
      state,
      toggleAccordion,
      getCoursePlayerList,
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