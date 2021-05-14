<template>
  <div>
    <div class="ui accordion styled fluid">
      <div class="title" :class="{ active: state.isAccordionOpen }" @click="toggleAccordion">
        <i class="dropdown icon" />【Round 2: 連答つき５○２×】
      </div>
      <div class="content fade" :class="{ active: state.isAccordionOpen }">
        <div v-for="(players, setIdx) in state.setList" :key="setIdx">
          <table class="ui compact table">
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
import { defineComponent, PropType, reactive, watch } from 'vue';

import { PlayerEntity } from '@/vbc-entity';
import { WinnedState, AnswerState } from '@/vbc-state';
import { NamePlateUtils, WinnedStateUtils } from '@/logic/common-logic';
import { QuizResultUtils } from '@/logic/quiz-logic';

/**
 * 順位によるアドバンテージを設定する
 */
const setAdvantageValue = (player: PlayerEntity) => {
  const r2Status = player.r2Status;
  if (player.paperRank <= 4) {
      r2Status.points = 3;
      r2Status.answered = AnswerState.CORRECT_ADVANTAGE + AnswerState.CORRECT_ADVANTAGE + AnswerState.CORRECT_ADVANTAGE;
    } else if (player.paperRank <= 12) {
      r2Status.points = 2;
      r2Status.answered = AnswerState.CORRECT_ADVANTAGE + AnswerState.CORRECT_ADVANTAGE;
    } else if (player.paperRank <= 24) {
      r2Status.points = 1;
      r2Status.answered = AnswerState.CORRECT_ADVANTAGE;
    } else {
      r2Status.points = 0;
      r2Status.answered = '';
    }
}

/**
 * 勝ち抜け済み人数から勝ち抜けstateを返す
 */
const getWinState = (nWinner: number) => {
  switch (nWinner) {
    case 0:
      return WinnedState.FIRST_WINNED;
    case 1:
      return WinnedState.SECOND_WINNED;
    case 2:
      return WinnedState.THIRD_WINNED;
    case 3:
      return WinnedState.FOURTH_WINNED;
    case 4:
      return WinnedState.FIFTH_WINNED;
    default:
      return '';
  }
}

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
  setup(props, context) {
    const state = reactive({
      /** Accordionが開いているかどうか */
      isAccordionOpen: false,
      /** シミュレーションが終わったかどうか */
      isFinishSimulate: false,
      /** セットごとに分けた参加者データ配列 */
      setList: [[], [], [], []] as PlayerEntity[][],
    });

    const toggleAccordion = () => {
      state.isAccordionOpen = !state.isAccordionOpen;
    }

    // ===

    watch(props, () => {
      if (props.playerDataList.length == 0) {
        // 初期状態に戻す
        state.isAccordionOpen = false;
        state.isFinishSimulate = false;
        state.setList = [[], [], [], []];
        return;
      } 

      if (!state.isFinishSimulate) {
        let roundLog = '【Round 2: 連答つき５○２×】\n';
        // セットごとに参加者（ペーパー勝ち抜け48人）を振り分け
        for(let i = 0; i < 48; i++) {
          const player = props.playerDataList[i];
          setAdvantageValue(player);
          state.setList[i % 4].push(player);
        }
  
        // セット実行
        for (let i = 0; i < state.setList.length; i++) {
          const setPlayers = state.setList[i];
          let nWinnedPlayer = 0; // 勝ち抜け済み人数
          let nLosedPlayer = 0;  // 敗退済み人数
          let currentCorrectPlayerIndex = -1; // 連答権持ちプレイヤーのindex

          roundLog += `（第${i + 1}セット）`;
          for (const player of setPlayers) {
            roundLog += `[${player.name}]`;
          }
          roundLog += '\n';

          while (nWinnedPlayer < 5  && nLosedPlayer < 7) {
            const result = QuizResultUtils.operateQuiz(setPlayers);
            if (result.pushedPlayerIndex == -1) {
              // 問題スルー
              roundLog += '（スルー）\n';
              continue;
            } else {
              const targetPlayer = setPlayers[result.pushedPlayerIndex];
              const targetStatus = targetPlayer.r2Status;
              if (targetStatus.status != WinnedState.UNDEFINED) {
                // その解答者が既に勝ち抜け or 敗退している
                continue;
              }

              roundLog += `${targetPlayer.name} `;
              if (result.isCorrected) {
                // 正解した
                if (result.pushedPlayerIndex == currentCorrectPlayerIndex) {
                  // 連答正解
                  roundLog += `${AnswerState.CORRECT_DOUBLE} `;
                  targetStatus.points = Math.min(5, targetStatus.points + 2);
                  targetStatus.answered += AnswerState.CORRECT_DOUBLE;
                } else {
                  // 通常正解
                  roundLog += `${AnswerState.CORRECT} `;
                  targetStatus.points += 1;
                  targetStatus.answered += AnswerState.CORRECT;
                }
                // 連答権セット
                currentCorrectPlayerIndex = result.pushedPlayerIndex;
      
                if (targetStatus.points == 5) {
                  // 勝ち抜け
                  roundLog += `=> ${getWinState(nWinnedPlayer)}`;
                  targetStatus.status = getWinState(nWinnedPlayer);
                  nWinnedPlayer++;
                }
              } else {
                // 誤答した
                roundLog += `${AnswerState.INCORRECT} `;
                targetStatus.misses += 1;
                targetStatus.answered += AnswerState.INCORRECT;
                if (result.pushedPlayerIndex == currentCorrectPlayerIndex) {
                  // 連答権リセット
                  currentCorrectPlayerIndex = -1;
                }
      
                if (targetStatus.misses == 2) {
                  // 敗退
                  roundLog += `=> ${WinnedState.LOSED}`;
                  targetStatus.status = WinnedState.LOSED;
                  nLosedPlayer++;
                }
              }
              roundLog += '\n';
            }

            if (nLosedPlayer == 7) {
              // トビ残り処理
              const remainedPlayers = setPlayers
                .filter((player) => player.r2Status.status == WinnedState.UNDEFINED)
                .sort((playerA, playerB) => {
                  if (playerA.r2Status.points > playerB.r2Status.points) return -1; // ポイント多い順
                  if (playerA.r2Status.points < playerB.r2Status.points) return 1;
                  if (playerA.r2Status.misses < playerB.r2Status.misses) return -1; // 誤答少ない順
                  if (playerA.r2Status.misses > playerB.r2Status.misses) return 1;
                  return playerA.paperRank - playerB.paperRank; // ペーパー上位順
                });
              for (const player of remainedPlayers) {
                // 勝ち抜け設定
                player.r2Status.status = getWinState(nWinnedPlayer);
                nWinnedPlayer++;
              }
            }
          }

          // 勝ち抜けプレイヤーログ出力
          const winnerPlayersName = setPlayers
            .filter((player) => (player.r2Status.status != WinnedState.UNDEFINED && player.r2Status.status != WinnedState.LOSED))
            .map((player) => player.name);
          roundLog += '勝ち抜け ';
          for (const name of winnerPlayersName) {
            roundLog += `[${name}]`;
          }
          roundLog += '\n';
        }
        state.isAccordionOpen = true;
        state.isFinishSimulate = true;

        roundLog += '【Round 2: 連答つき５○２× おわり】\n';
        context.emit('onFinishRound', roundLog);
      }
    });


    return {
      props,
      state,
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