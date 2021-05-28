import { ExRoundFirstStepProgress, PlayerEntity } from "@/vbc-entity";
import { AnswerState, WinnedState } from "@/vbc-state";
import { Random } from "../common-logic";
import { CorrectAnswerProbabilityFunction, QuizResultUtils } from "../quiz-logic";

const getFirstStepPlayers = (players: PlayerEntity[]) => {
    return players.filter((player) => {
      return (player.r2Status.status == WinnedState.UNDEFINED || player.r2Status.status == WinnedState.LOSED) || 
        (player.r3Status.status == WinnedState.UNDEFINED || player.r3Status.status == WinnedState.LOSED)
    });
  }
  
  const calculateCorrectAnswerProbabilityFor2ndStep: CorrectAnswerProbabilityFunction = (players: PlayerEntity[], index: number, difficulty: number, slashPoint: number) => {
    const modifiedPlayerKnowledge = (player: PlayerEntity) => {
      let knowledge = player.knowledge;
      if (player.exStatus.secondStepPoints <= 2) {
        knowledge += 2.5;
      } else {
        knowledge += 3;
      }
      return knowledge;
    }
    
    let value = QuizResultUtils.calculateCorrectAnswerProbability(
        0.5, 
        modifiedPlayerKnowledge(players[index]),
        players[index].pushSpeed,
        difficulty,
        slashPoint);
    
    const nRemainedPlayers = players.filter((player) => player.exStatus.secondStepStatus == WinnedState.UNDEFINED).length;
    if (nRemainedPlayers == 2) {
      value += 0.2;
    }
    return value;
  }
  
  const set2ndStepWinnedData = (player: PlayerEntity) => {
    player.exStatus.firstStepStatus = WinnedState.NON_ORDER_WINNED;
    player.exStatus.secondStepStatus = WinnedState.NON_ORDER_WINNED;
    player.sfStatus.seatIndex = 4; // 準決勝の座席indexは固定
  }

export class ExRoundLogic {

    static operateExRound(playerDataList: PlayerEntity[]) {
        let roundLog = '【Extra Round: 敗者復活】\n';

        // First Step
        roundLog += '（First Step）\n';
        const firstStepPlayers = getFirstStepPlayers(playerDataList);
        let remainedPlayers = firstStepPlayers;
        let questionCount = 0;
        const firstStepProgressList: ExRoundFirstStepProgress[] = [];
        while (remainedPlayers.length >= 13) {
          questionCount++;
          const progress = { 
            questionCount: questionCount,
            answered: '',
            remainedCount: 0
          } as ExRoundFirstStepProgress
          const difficulty = QuizResultUtils.getQuestionDifficultyForExFirst(questionCount);
          for (const player of remainedPlayers) {
            // 敗者復活 First Stepは早押しルールではないため、知識力で回答可能性を算出する
            const isIncorrect = ((player.knowledge - difficulty + Random.getRandomArbitrary(-2, 2)) < 0);
            if (isIncorrect) {
              player.exStatus.firstStepStatus = WinnedState.LOSED;
            }
            progress.answered += (isIncorrect ? AnswerState.INCORRECT : AnswerState.CORRECT);
          }
    
          // 敗者をremainedPlayersから取り除く
          remainedPlayers = remainedPlayers.filter((player) => player.exStatus.firstStepStatus != WinnedState.LOSED);
          progress.remainedCount = remainedPlayers.length;
          firstStepProgressList.push(progress);
          roundLog += `${ progress.questionCount } 問目: 残り ${ progress.remainedCount } 人\n`;
        }
        roundLog += '（First Step おわり）\n';

        // Second Step
        if (remainedPlayers.length == 0) {
            roundLog += '（First Step 勝ち抜け0名 ⇒ 敗者復活なし）\n';
        } else if (remainedPlayers.length == 1) {
            const player = remainedPlayers[0];
            set2ndStepWinnedData(player);
            roundLog += `（First Step 勝ち抜け1名 ⇒ 敗者復活決定！: ${player.name}）\n`;
        } else {
            roundLog += '（Second Step）\n';
            let nWinnedPlayer = 0;
            let nLosedPlayer = 0;
            for (const player of remainedPlayers) {
                player.exStatus.firstStepStatus = WinnedState.NON_ORDER_WINNED;
                roundLog += `[${player.name}]`;
            }
            roundLog += '\n';
    
            const nSecondStepPlayers = remainedPlayers.length;
            while (nWinnedPlayer < 1  && nLosedPlayer < (nSecondStepPlayers - 1)) {
                // クイズ実行
                const result = QuizResultUtils.operateQuiz(remainedPlayers, undefined, calculateCorrectAnswerProbabilityFor2ndStep);
                if (result.pushedPlayerIndex == -1) {
                    // 問題スルー
                    roundLog += `（スルー）\n`;
                    continue;
                } else if (remainedPlayers[result.pushedPlayerIndex].exStatus.secondStepStatus != WinnedState.UNDEFINED) {
                    // その解答者が既に勝ち抜け or 敗退している
                    continue;
                } else {
                    // 誰かが解答権を得ている
                    roundLog += `${remainedPlayers[result.pushedPlayerIndex].name} `;
                    if (result.isCorrected) {
                    // 正解した
                    roundLog += `${AnswerState.CORRECT} `;
                    remainedPlayers[result.pushedPlayerIndex].exStatus.secondStepPoints += 1;
                    remainedPlayers[result.pushedPlayerIndex].exStatus.secondStepAnswered += AnswerState.CORRECT;
        
                    if (remainedPlayers[result.pushedPlayerIndex].exStatus.secondStepPoints == 5) {
                        // 勝ち抜け
                        roundLog += `=> [勝ち抜け]`;
                        set2ndStepWinnedData(remainedPlayers[result.pushedPlayerIndex]);
                        nWinnedPlayer++;
                    }
                    } else {
                    // 誤答した
                    roundLog += `${AnswerState.INCORRECT} => [失格]`;
                    remainedPlayers[result.pushedPlayerIndex].exStatus.secondStepPoints += 1;
                    remainedPlayers[result.pushedPlayerIndex].exStatus.secondStepAnswered += AnswerState.INCORRECT;
                    // 誤答は即失格
                    remainedPlayers[result.pushedPlayerIndex].exStatus.secondStepStatus = WinnedState.LOSED;
                    nLosedPlayer++;
                    }
                    roundLog += '\n';
                }
            }
    
            if (nWinnedPlayer == 0) {
                // トビ残り処理
                const remainedLastPlayer = remainedPlayers.filter((player) => player.exStatus.secondStepStatus == WinnedState.UNDEFINED)[0];
                set2ndStepWinnedData(remainedLastPlayer);
                roundLog += `敗者復活決定！: ${remainedLastPlayer.name}）\n`;
            }
        }
        roundLog += '（Second Step おわり）\n';
        roundLog += '【Extra Round: 敗者復活 おわり】\n';
        return { firstStepProgress: firstStepProgressList, roundLog: roundLog };
    }
}