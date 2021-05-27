import { PlayerEntity } from "@/vbc-entity";
import { AnswerState, WinnedState } from "@/vbc-state";
import { QuizResultUtils } from "../quiz-logic";

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

export class Round2Logic {

    static operateRound2(playerDataList: PlayerEntity[]) {
        let roundLog = '【Round 2: 連答つき５○２×】\n';
        // セットごとに参加者（ペーパー勝ち抜け48人）を振り分け
        const setList: PlayerEntity[][] = [[], [], [], []];
        for(let i = 0; i < 48; i++) {
          const player = playerDataList[i];
          setAdvantageValue(player);
          setList[i % 4].push(player);
        }
  
        // セット実行
        for (let i = 0; i < setList.length; i++) {
          const setPlayers = setList[i];
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

        roundLog += '【Round 2: 連答つき５○２× おわり】\n';
        return roundLog;
    }
}