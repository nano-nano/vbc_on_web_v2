import { PlayerEntity } from "@/vbc-entity";
import { AnswerState, WinnedState } from "@/vbc-state";
import { Random } from "../common-logic";
import { QuizResultUtils } from "../quiz-logic";

const operatePlayOff = (playerA: PlayerEntity, playerB: PlayerEntity) => {
    const result = QuizResultUtils.operateQuiz([playerA, playerB]);
    if (result.pushedPlayerIndex == -1) operatePlayOff(playerA, playerB); // スルーの場合は再帰実行
    if (result.isCorrected) {
      // どちらかが正解 -> 正解した方が先になるようにする
      return (result.pushedPlayerIndex == 0) ? -1 : 1;
    } else {
      // どちらかが誤答 -> 誤答した方が後になるようにする
      return (result.pushedPlayerIndex == 0) ? 1 : -1;
    }
  }
  
const operateSet = (setNo: number, players: PlayerEntity[], roundLog: string) => {
  let time = 0; // 経過時間（秒）
  while (time < 5 * 60) { // 5分
    const result = QuizResultUtils.operateQuiz(players);
    if (result.pushedPlayerIndex == -1) {
      // 問題スルー
      time += Random.getRandomArbitrary(7.5 - 4, 7.5 + 4);
      roundLog += `（スルー）\n`;
      continue;
    } else if (players[result.pushedPlayerIndex].sfStatus.status != WinnedState.UNDEFINED) {
      // その解答者が既に勝ち抜け or 敗退している
      continue;
    } else {
      // 誰かが解答権を得ている
      time += Random.getRandomArbitrary(7.5 - 4, 7.5 + 4);
      roundLog += `${players[result.pushedPlayerIndex].name} `;
      if (setNo == 1) {
        // 第1セット: 正解で+1, 誤答で-1
        if (result.isCorrected) {
          // 正解した
          roundLog += `${AnswerState.CORRECT} `;
          players[result.pushedPlayerIndex].sfStatus.points += 1;
          players[result.pushedPlayerIndex].sfStatus.answered[0] += AnswerState.CORRECT;
        } else {
          // 誤答した
          roundLog += `${AnswerState.INCORRECT} `;
          players[result.pushedPlayerIndex].sfStatus.misses += 1;
          players[result.pushedPlayerIndex].sfStatus.answered[0] += AnswerState.INCORRECT;
        }
      } else if (setNo == 2) {
        // 第2セット: 正解で+1, 誤答で-2
        if (result.isCorrected) {
          // 正解した
          roundLog += `${AnswerState.CORRECT} `;
          players[result.pushedPlayerIndex].sfStatus.points += 1;
          players[result.pushedPlayerIndex].sfStatus.answered[1] += AnswerState.CORRECT;
        } else {
          // 誤答した
          roundLog += `${AnswerState.INCORRECT} `;
          players[result.pushedPlayerIndex].sfStatus.misses += 2;
          players[result.pushedPlayerIndex].sfStatus.answered[1]+= AnswerState.INCORRECT;
        }
      } else {
        // 第2セット: 正解で+2, 誤答で-2
        if (result.isCorrected) {
          // 正解した
          roundLog += `${AnswerState.CORRECT} `;
          players[result.pushedPlayerIndex].sfStatus.points += 2;
          players[result.pushedPlayerIndex].sfStatus.answered[2] += AnswerState.CORRECT;
        } else {
          // 誤答した
          roundLog += `${AnswerState.INCORRECT} `;
          players[result.pushedPlayerIndex].sfStatus.misses += 2;
          players[result.pushedPlayerIndex].sfStatus.answered[2] += AnswerState.INCORRECT;
        }
      }
      roundLog += '\n';
    }
  }
  roundLog += `（制限時間終了）\n`;

  const sortedPlayersInSet = players
    .filter((player) => player.sfStatus.status == WinnedState.UNDEFINED)
    .sort((playerA, playerB) => {
      const playerAscore = playerA.sfStatus.points - playerA.sfStatus.misses;
      const playerBscore = playerB.sfStatus.points - playerB.sfStatus.misses;
        if (playerAscore != playerBscore) return (playerBscore - playerAscore); // （正解ポイント - 誤答ポイント）多い順
        return operatePlayOff(playerA, playerB); // プレーオフ
    });

  // 上位1人が勝ち抜け
  if (setNo == 1) {
    sortedPlayersInSet[0].sfStatus.status = WinnedState.FIRST_WINNED;
  } else if (setNo == 2) {
    sortedPlayersInSet[0].sfStatus.status = WinnedState.SECOND_WINNED;
  } else {
    sortedPlayersInSet[0].sfStatus.status = WinnedState.THIRD_WINNED;
  }
  roundLog += `${sortedPlayersInSet[0].name} => ${sortedPlayersInSet[0].sfStatus.status}\n`;

  // 下位2人が敗退
  sortedPlayersInSet[sortedPlayersInSet.length - 1].sfStatus.status = WinnedState.LOSED;
  sortedPlayersInSet[sortedPlayersInSet.length - 1].sfStatus.losedSetNo = setNo;
  if (sortedPlayersInSet.length != 8) {
    // 参加人数が8人の場合は2人目を決めない
    sortedPlayersInSet[sortedPlayersInSet.length - 2].sfStatus.status = WinnedState.LOSED;
    sortedPlayersInSet[sortedPlayersInSet.length - 2].sfStatus.losedSetNo = setNo;
  }
  roundLog += `${sortedPlayersInSet[sortedPlayersInSet.length - 1].name}, ${sortedPlayersInSet[sortedPlayersInSet.length - 2].name} => ${WinnedState.LOSED}\n`;

  return roundLog;
}

export class SemiFinalLogic {
    
    static operateSemiFinal(playerDataList: PlayerEntity[]) {
        const sfSetResultData = [];

        let roundLog = '【Semi Final: 3セット制タイムレース Nine Hundred】\n';
        const semiFinalPlayers = playerDataList.filter((player) => {
          return player.sfStatus.seatIndex != -1;
        }).sort((playerA, playerB) => {
          return playerB.sfStatus.seatIndex - playerA.sfStatus.seatIndex;
        });
    
        for (let i = 0; i < 3; i++) {
          roundLog += `（第${i + 1}セット）\n`;
          for (const player of semiFinalPlayers) {
              if (player.sfStatus.status == WinnedState.UNDEFINED) {
                  roundLog += `[${player.name}]`;
              }
          }
          roundLog += '\n';
    
          // クイズ実行
          roundLog = operateSet(i + 1, semiFinalPlayers, roundLog);
          // 結果用配列に抽出する
          // セットごとの結果を格納するため、deep copyする
          const copied = Object.assign({}, JSON.parse(JSON.stringify(semiFinalPlayers))) as PlayerEntity[];
          sfSetResultData.push(copied);
        }
        
        roundLog += '【Semi Final: 3セット制タイムレース Nine Hundred おわり】\n';
        return { setResult: sfSetResultData, roundLog: roundLog }
    }
}