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
      // ???????????????
      roundLog += `???????????????\n`;
      continue;
    } else if (players[result.pushedPlayerIndex].fStatus.set[setIndex].status != WinnedState.UNDEFINED) {
      // ???????????????????????????????????? or ??????????????????
      continue;
    } else {
      // ?????????????????????????????????
      roundLog += `${players[result.pushedPlayerIndex].name} `;
      if (result.isCorrected) {
        // ????????????
        roundLog += `${AnswerState.CORRECT} `;
        players[result.pushedPlayerIndex].fStatus.set[setIndex].points++;
        players[result.pushedPlayerIndex].fStatus.set[setIndex].answered += AnswerState.CORRECT;
        if (players[result.pushedPlayerIndex].fStatus.set[setIndex].points == 7) {
          // ?????????????????????
          players[result.pushedPlayerIndex].fStatus.nSeven++;
          roundLog += `=> [?????????????????????: ${players[result.pushedPlayerIndex].fStatus.nSeven}]`;
          players[result.pushedPlayerIndex].fStatus.set[setIndex].status = WinnedState.NON_ORDER_WINNED;
          nWinnedPlayer++;
        }
      } else {
        // ????????????
        roundLog += `${AnswerState.INCORRECT} `;
        players[result.pushedPlayerIndex].fStatus.set[setIndex].misses++;
        players[result.pushedPlayerIndex].fStatus.set[setIndex].answered += AnswerState.INCORRECT;
        if (players[result.pushedPlayerIndex].fStatus.set[setIndex].misses == (setIndex + 1)) {
          // ???????????????
          roundLog += `=> [???????????????]`;
          players[result.pushedPlayerIndex].fStatus.set[setIndex].status = WinnedState.LOSED;
          nLosedPlayer++;
        }
      }
      roundLog += '\n';
    }
  }

  if (nLosedPlayer == 2) {
    // ??????????????????
    const remainPlayer = players.filter((player) => player.fStatus.set[setIndex].status != WinnedState.LOSED)[0];
    remainPlayer.fStatus.set[setIndex].status = WinnedState.NON_ORDER_WINNED;
    remainPlayer.fStatus.nSeven++;
    roundLog += `${remainPlayer.name} => [?????????????????????: ${remainPlayer.fStatus.nSeven}]`;
    roundLog += '\n';
  }
  return roundLog;
}

export class FinalLogic {
    
    static operateFinal(playerDataList: PlayerEntity[]) {
      const finalSetResultData = [];

      let roundLog = '???Final: ????????????????????????\n';
      const finalPlayers = playerDataList.filter((player) => {
        return player.sfStatus.status != WinnedState.UNDEFINED && player.sfStatus.status != WinnedState.LOSED;
      });
  
      for (let i = 0; i < 7; i++) {
        roundLog += `??????${i + 1}????????????\n`;
        roundLog = operateSet(i, finalPlayers, roundLog);
  
        const winner = finalPlayers.filter((player) => player.fStatus.nSeven == 3)[0];
        if (winner == undefined) {
          // ?????????????????????????????????
          const copied = Object.assign({}, JSON.parse(JSON.stringify(finalPlayers))) as PlayerEntity[];
          finalSetResultData.push(copied);
        } else {
          // ????????????????????????
          winner.fStatus.isWin = true;
          roundLog += `???????????????: ${winner.name}`;
          roundLog += '\n';
          break;
        }
      }

      const copied = Object.assign({}, JSON.parse(JSON.stringify(finalPlayers))) as PlayerEntity[];
      finalSetResultData.push(copied);
      roundLog += '???Final: ????????????????????? ????????????\n';
      return { setResult: finalSetResultData, roundLog: roundLog }
    }
}