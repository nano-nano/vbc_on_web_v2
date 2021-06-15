import { PlayerEntity } from "@/vbc-entity";
import { AnswerState, WinnedState } from "@/vbc-state";
import { ButtonPushProbabilityFunction, CorrectAnswerProbabilityFunction, QuizResultUtils } from "../quiz-logic";

const calculateButtonPushProbabilityForFinal = (setIndex: number) => {
  const newFunction: ButtonPushProbabilityFunction = (players: PlayerEntity[], index: number, difficulty: number, slashPoint: number) => {
    let value = QuizResultUtils.calculateStandardButtonPushProbability(players, index, difficulty, slashPoint);
    if ((setIndex + 1) - players[index].fStatus.set[setIndex].misses >= 3) {
      value *= 1.5;
    } else if ((setIndex + 1) - players[index].fStatus.set[setIndex].misses == 1) {
      value *= 0.75;
    }
    return value;
  };
  return newFunction;
}

const calculateCorrectAnswerProbabilityForFinal = (setIndex: number) => {
  const newFunction: CorrectAnswerProbabilityFunction = (players: PlayerEntity[], index: number, difficulty: number, slashPoint: number) => {
    const nRemainedPlayers = players.filter((player) => player.fStatus.set[setIndex].status == WinnedState.UNDEFINED).length;
    let baseValue = 0.7 - Math.sqrt(setIndex) * 0.2;
    if (nRemainedPlayers == 2) {
      baseValue += 0.1
    }

    let value = QuizResultUtils.calculateCorrectAnswerProbability(
      baseValue,
      players[index].knowledge, 
      players[index].pushSpeed,
      difficulty,
      slashPoint);
    if ((setIndex + 1) - players[index].fStatus.set[setIndex].misses >= 3) {
      value /= 1.5;
    } else if ((setIndex + 1) - players[index].fStatus.set[setIndex].misses == 3) {
      value /= 0.75;
    }
    return value;
  };
  return newFunction;
}

const operateSet = (setIndex: number, players: PlayerEntity[], roundLog: string) => {
  let nWinnedPlayer = 0;
  let nLosedPlayer = 0;

  while (nWinnedPlayer < 1  && nLosedPlayer < 2) {
    const result = QuizResultUtils.operateQuiz(
      players, 
      calculateButtonPushProbabilityForFinal(setIndex),
      calculateCorrectAnswerProbabilityForFinal(setIndex));
    if (result.pushedPlayerIndex == -1) {
      // 問題スルー
      roundLog += `（スルー）\n`;
      continue;
    } else if (players[result.pushedPlayerIndex].fStatus.set[setIndex].status != WinnedState.UNDEFINED) {
      // その解答者が既に勝ち抜け or 敗退している
      continue;
    } else {
      // 誰かが解答権を得ている
      roundLog += `${players[result.pushedPlayerIndex].name} `;
      if (result.isCorrected) {
        // 正解した
        roundLog += `${AnswerState.CORRECT} `;
        players[result.pushedPlayerIndex].fStatus.set[setIndex].points++;
        players[result.pushedPlayerIndex].fStatus.set[setIndex].answered += AnswerState.CORRECT;
        if (players[result.pushedPlayerIndex].fStatus.set[setIndex].points == 7) {
          // セット勝ち抜け
          players[result.pushedPlayerIndex].fStatus.nSeven++;
          roundLog += `=> [セット勝ち抜け: ${players[result.pushedPlayerIndex].fStatus.nSeven}]`;
          players[result.pushedPlayerIndex].fStatus.set[setIndex].status = WinnedState.NON_ORDER_WINNED;
          nWinnedPlayer++;
        }
      } else {
        // 誤答した
        roundLog += `${AnswerState.INCORRECT} `;
        players[result.pushedPlayerIndex].fStatus.set[setIndex].misses++;
        players[result.pushedPlayerIndex].fStatus.set[setIndex].answered += AnswerState.INCORRECT;
        if (players[result.pushedPlayerIndex].fStatus.set[setIndex].misses == (setIndex + 1)) {
          // セット敗退
          roundLog += `=> [セット敗退]`;
          players[result.pushedPlayerIndex].fStatus.set[setIndex].status = WinnedState.LOSED;
          nLosedPlayer++;
        }
      }
      roundLog += '\n';
    }
  }

  if (nLosedPlayer == 2) {
    // トビ残り処理
    const remainPlayer = players.filter((player) => player.fStatus.set[setIndex].status != WinnedState.LOSED)[0];
    remainPlayer.fStatus.set[setIndex].status = WinnedState.NON_ORDER_WINNED;
    remainPlayer.fStatus.nSeven++;
    roundLog += `${remainPlayer.name} => [セット勝ち抜け: ${remainPlayer.fStatus.nSeven}]`;
    roundLog += '\n';
  }
  return roundLog;
}

export class FinalLogic {
    
    static operateFinal(playerDataList: PlayerEntity[]) {
      const finalSetResultData = [];

      let roundLog = '【Final: トリプルセブン】\n';
      const finalPlayers = playerDataList.filter((player) => {
        return player.sfStatus.status != WinnedState.UNDEFINED && player.sfStatus.status != WinnedState.LOSED;
      });
  
      for (let i = 0; i < 7; i++) {
        roundLog += `（第${i + 1}セット）\n`;
        roundLog = operateSet(i, finalPlayers, roundLog);
  
        const winner = finalPlayers.filter((player) => player.fStatus.nSeven == 3)[0];
        if (winner == undefined) {
          // 優勝者が決まっていない
          const copied = Object.assign({}, JSON.parse(JSON.stringify(finalPlayers))) as PlayerEntity[];
          finalSetResultData.push(copied);
        } else {
          // 優勝者が決まった
          winner.fStatus.isWin = true;
          roundLog += `優勝決定！: ${winner.name}`;
          roundLog += '\n';
          break;
        }
      }

      const copied = Object.assign({}, JSON.parse(JSON.stringify(finalPlayers))) as PlayerEntity[];
      finalSetResultData.push(copied);
      roundLog += '【Final: トリプルセブン おわり】\n';
      return { setResult: finalSetResultData, roundLog: roundLog }
    }
}