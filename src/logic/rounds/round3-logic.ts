import { PlayerEntity } from "@/vbc-entity";
import { AnswerState, Round3Course, Round3CourseArray, WinnedState, WinnedStateOrder } from "@/vbc-state";
import { Random } from "../common-logic";
import { QuizResultUtils } from "../quiz-logic";

/**
 * コース実施順を決定して配列で返す
 */
 const getCourseOrder = () => {
    const courseArray = Round3CourseArray;
    const length = Round3CourseArray.length;
    // シャッフル
    for(let i = length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        const tmp = courseArray[i];
        courseArray[i] = courseArray[j];
        courseArray[j] = tmp;
    }
    return courseArray;
  }
  
  /**
   * あるプレイヤーのコース希望順に並べられたコース配列を返す
   */
  const getRequestCourseArray = (player: PlayerEntity) => {
    // コース希望値を算出
    const requestCourses = [
      { course: Round3Course.OX, value: Random.getRandomArbitrary(0, player.request10o10x)},
      { course: Round3Course.BY, value: Random.getRandomArbitrary(0, player.request10by10)},
      { course: Round3Course.SWEDISH, value: Random.getRandomArbitrary(0, player.requestSwedish10)},
      { course: Round3Course.UP_DOWN, value: Random.getRandomArbitrary(0, player.request10updown)}
    ];
    // 希望値の昇順でソートしてコース情報だけ返す
    return requestCourses
      .sort((courseA, courseB) => (courseA.value - courseB.value))
      .map((item) => item.course);
  }
  
  /**
   * 挙手をシミュレートする
   */
  const handsUp = (player: PlayerEntity, course: string, endCourses: string[]) => {
    // 既にコースが確定している人は手を挙げない
    if (player.r3Status.fixedCourse != Round3Course.UNDEFINED) return false; 
  
    for (const hopeCourse of player.r3Status.requestCourseArray) {
      if (!endCourses.includes(hopeCourse)) {
        return hopeCourse == course;
      }
    }
    // 本来ここまで到達することはないが、もし到達してしまった場合はとりあえず挙手する（出られなくなってしまうので）
    return true;
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
      default:
        return WinnedState.UNDEFINED;
    }
  }
  
  /**
   * プレーオフを実行する
   */
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
  
  // ===
  
  /**
   * 10○10✕を実行する
   */
  const operate10o10x = (players: PlayerEntity[], roundLog: string) => {
    let nWinnedPlayer = 0;
    let nLosedPlayer = 0;
    let time = 0;  // コース経過時間（秒）
  
    while (nWinnedPlayer < 2  && nLosedPlayer < 3 && time < (15 * 60)) { // 15分x60秒
      const result = QuizResultUtils.operateQuiz(
        players, 
        undefined, 
        QuizResultUtils.calculateCorrectAnswerProbabilityFor10o10x);
      if (result.pushedPlayerIndex == -1) {
        // 問題スルー
        time += Random.getRandomArbitrary(10.5 - 4, 10.5 + 4);
        roundLog += `（スルー）\n`;
        continue;
      } else if (players[result.pushedPlayerIndex].r3Status.status != WinnedState.UNDEFINED) {
        // その解答者が既に勝ち抜け or 敗退している
        continue;
      } else {
        // 誰かが解答権を得ている
        time += Random.getRandomArbitrary(10.5 - 4, 10.5 + 4);
        roundLog += `${players[result.pushedPlayerIndex].name} `;
        if (result.isCorrected) {
          // 正解した
          roundLog += `${AnswerState.CORRECT} `;
          players[result.pushedPlayerIndex].r3Status.points++;
          players[result.pushedPlayerIndex].r3Status.answered += AnswerState.CORRECT;
  
          if (players[result.pushedPlayerIndex].r3Status.points == 10) {
            // 勝ち抜け
            roundLog += `=> ${getWinState(nWinnedPlayer)}`;
            players[result.pushedPlayerIndex].r3Status.status = getWinState(nWinnedPlayer);
            nWinnedPlayer++;
          }
        } else {
          // 誤答した
          roundLog += `${AnswerState.INCORRECT} `;
          players[result.pushedPlayerIndex].r3Status.misses += 1;
          players[result.pushedPlayerIndex].r3Status.answered += AnswerState.INCORRECT;
  
          if (players[result.pushedPlayerIndex].r3Status.misses == 10) {
            // 敗退
            roundLog += `=> ${WinnedState.LOSED}`;
            players[result.pushedPlayerIndex].r3Status.status = WinnedState.LOSED;
            nLosedPlayer++;
          }
        }
        roundLog += '\n';
      }
    }
  
    if (time >= (15 * 60)) {
      roundLog += '（タイムアップ終了）\n';
    }
  
    if (nWinnedPlayer < 2) {
      // トビ残り・タイムアップ処理
      const remainedPlayers = players
        .filter((player) => player.r3Status.status == WinnedState.UNDEFINED)
        .sort((playerA, playerB) => {
          if (playerA.r3Status.points > playerB.r3Status.points) return -1; // ポイント多い順
          if (playerA.r3Status.points < playerB.r3Status.points) return 1;
          if (playerA.r3Status.misses < playerB.r3Status.misses) return -1; // 誤答少ない順
          if (playerA.r3Status.misses > playerB.r3Status.misses) return 1;
          return operatePlayOff(playerA, playerB) // プレーオフ
        });
      for (let i = 0; i < (2 - nWinnedPlayer); i++) {
        // 勝ち抜け設定
        remainedPlayers[i].r3Status.status = getWinState(nWinnedPlayer);
        nWinnedPlayer++;
      }
    }
  
    for (const player of players) {
      player.r3Status.answered += ' （' + 
        player.r3Status.points + AnswerState.CORRECT + 
        player.r3Status.misses + AnswerState.INCORRECT + '）';
    }
  
    const winnerPlayersName = players
      .filter((player) => (player.r3Status.status != WinnedState.UNDEFINED && player.r3Status.status != WinnedState.LOSED))
      .map((player) => player.name);
    roundLog += '勝ち抜け ';
    for (const name of winnerPlayersName) {
      roundLog += `[${name}]`;
    }
    roundLog += '\n';
    return roundLog;
  }
  
  /**
   * 10 by 10を実行する
   */
  const operate10by10 = (players: PlayerEntity[], roundLog: string) => {
    let nWinnedPlayer = 0;
    let nLosedPlayer = 0;
    let time = 0;  // コース経過時間（秒）
  
    while (nWinnedPlayer < 2  && nLosedPlayer < 3 && time < (15 * 60)) {
      const result = QuizResultUtils.operateQuiz(
        players, 
        QuizResultUtils.calculateButtonPushProbabilityFor10by10, 
        QuizResultUtils.calculateCorrectAnswerProbabilityFor10by10);
  
      if (result.pushedPlayerIndex == -1) {
        // 問題スルー
        time += Random.getRandomArbitrary(12.5 - 4, 12.5 + 4);
        roundLog += `（スルー）\n`;
        continue;
      } else if (players[result.pushedPlayerIndex].r3Status.status != WinnedState.UNDEFINED) {
        // その解答者が既に勝ち抜け or 敗退している
        continue;
      } else {
        // 誰かが解答権を得ている
        time += Random.getRandomArbitrary(12.5 - 4, 12.5 + 4);
        roundLog += `${players[result.pushedPlayerIndex].name} `;
        if (result.isCorrected) {
          // 正解した
          roundLog += `${AnswerState.CORRECT} `;
          players[result.pushedPlayerIndex].r3Status.points++;
          players[result.pushedPlayerIndex].r3Status.answered += AnswerState.CORRECT;
  
          if ((players[result.pushedPlayerIndex].r3Status.points * (10 - players[result.pushedPlayerIndex].r3Status.misses)) >= 100) {
            // 勝ち抜け
            roundLog += `=> ${getWinState(nWinnedPlayer)}`;
            players[result.pushedPlayerIndex].r3Status.status = getWinState(nWinnedPlayer);
            nWinnedPlayer++;
          }
        } else {
          // 誤答した
          roundLog += `${AnswerState.INCORRECT} `;
          players[result.pushedPlayerIndex].r3Status.misses += 1;
          players[result.pushedPlayerIndex].r3Status.answered += AnswerState.INCORRECT;
  
          if (players[result.pushedPlayerIndex].r3Status.misses == 10) {
            // 敗退
            roundLog += `=> ${WinnedState.LOSED}`;
            players[result.pushedPlayerIndex].r3Status.status = WinnedState.LOSED;
            nLosedPlayer++;
          }
        }
        roundLog += '\n';
      }
    }
  
    if (time >= (15 * 60)) {
      roundLog += '（タイムアップ終了）\n';
    }
  
    if (nWinnedPlayer < 2) {
      // トビ残り・タイムアップ処理
      const remainedPlayers = players
        .filter((player) => player.r3Status.status == WinnedState.UNDEFINED)
        .sort((playerA, playerB) => {
          if ((playerA.r3Status.points * (10 - playerA.r3Status.misses)) > 
              (playerB.r3Status.points * (10 - playerB.r3Status.misses))) return -1; // 積ポイント多い順
          if ((playerA.r3Status.points * (10 - playerA.r3Status.misses)) < 
              (playerB.r3Status.points * (10 - playerB.r3Status.misses))) return 1;
          return operatePlayOff(playerA, playerB) // プレーオフ
        });
      const nRequiredWinner = (2 - nWinnedPlayer);
      for (let i = 0; i < nRequiredWinner; i++) {
        // 勝ち抜け設定
        remainedPlayers[i].r3Status.status = getWinState(nWinnedPlayer);
        nWinnedPlayer++;
      }
    }
  
    for (const player of players) {
      player.r3Status.answered += ' （' + 
        (player.r3Status.points * (10 - player.r3Status.misses)) + 'pts.）';
    }
  
    const winnerPlayersName = players
      .filter((player) => (player.r3Status.status != WinnedState.UNDEFINED && player.r3Status.status != WinnedState.LOSED))
      .map((player) => player.name);
    roundLog += '勝ち抜け ';
    for (const name of winnerPlayersName) {
      roundLog += `[${name}]`;
    }
    roundLog += '\n';
    return roundLog;
  }
  
  /**
   * 10 up-downを実行する
   */
  const operate10UpDown = (players: PlayerEntity[], roundLog: string) => {
    let nWinnedPlayer = 0;
    let nLosedPlayer = 0;
    let time = 0;  // コース経過時間（秒）
  
    while (nWinnedPlayer < 2  && nLosedPlayer < 3 && time < (15 * 60)) {
      const result = QuizResultUtils.operateQuiz(
        players, 
        undefined, 
        QuizResultUtils.calculateCorrectAnswerProbabilityFor10UpDown);
  
      if (result.pushedPlayerIndex == -1) {
        // 問題スルー
        time += Random.getRandomArbitrary(12.5 - 4, 12.5 + 4);
        roundLog += `（スルー）\n`;
        continue;
      } else if (players[result.pushedPlayerIndex].r3Status.status != WinnedState.UNDEFINED) {
        // その解答者が既に勝ち抜け or 敗退している
        continue;
      } else {
        // 誰かが解答権を得ている
        time += Random.getRandomArbitrary(12.5 - 4, 12.5 + 4);
        roundLog += `${players[result.pushedPlayerIndex].name} `;
        if (result.isCorrected) {
          // 正解した
          roundLog += `${AnswerState.CORRECT} `;
          players[result.pushedPlayerIndex].r3Status.points++;
          players[result.pushedPlayerIndex].r3Status.answered += AnswerState.CORRECT;
  
          if (players[result.pushedPlayerIndex].r3Status.points == 10) {
            // 勝ち抜け
            roundLog += `=> ${getWinState(nWinnedPlayer)}`;
            players[result.pushedPlayerIndex].r3Status.status = getWinState(nWinnedPlayer);
            nWinnedPlayer++;
          }
        } else {
          // 誤答した
          roundLog += `${AnswerState.INCORRECT} `;
          players[result.pushedPlayerIndex].r3Status.misses += 1;
          players[result.pushedPlayerIndex].r3Status.answered += AnswerState.INCORRECT;
          // 10up-downは誤答したらポイントが0に戻る
          players[result.pushedPlayerIndex].r3Status.points == 0;
  
          if (players[result.pushedPlayerIndex].r3Status.misses == 2) {
            // 敗退
            roundLog += `=> ${WinnedState.LOSED}`;
            players[result.pushedPlayerIndex].r3Status.status = WinnedState.LOSED;
            nLosedPlayer++;
          }
        }
        roundLog += '\n';
      }
    }
  
    if (time >= (15 * 60)) {
      roundLog += '（タイムアップ終了）\n';
    }
  
    if (nWinnedPlayer < 2) {
      // トビ残り・タイムアップ処理
      const remainedPlayers = players
        .filter((player) => player.r3Status.status == WinnedState.UNDEFINED)
        .sort((playerA, playerB) => {
          if (playerA.r3Status.points > playerB.r3Status.points) return -1; // ポイント多い順
          if (playerA.r3Status.points < playerB.r3Status.points) return 1;
          return operatePlayOff(playerA, playerB) // プレーオフ
        });
      const nRequiredWinner = (2 - nWinnedPlayer);
      for (let i = 0; i < nRequiredWinner; i++) {
        // 勝ち抜け設定
        remainedPlayers[i].r3Status.status = getWinState(nWinnedPlayer);
        nWinnedPlayer++;
      }
    }
  
    for (const player of players) {
      player.r3Status.answered += ` （${player.r3Status.points}pts.）`;
    }
  
    const winnerPlayersName = players
      .filter((player) => (player.r3Status.status != WinnedState.UNDEFINED && player.r3Status.status != WinnedState.LOSED))
      .map((player) => player.name);
    roundLog += '勝ち抜け ';
    for (const name of winnerPlayersName) {
      roundLog += `[${name}]`;
    }
    roundLog += '\n';
    return roundLog;
  }
  
  /**
   * Swedish 10を実行する
   */
  const operateSwedish10 = (players: PlayerEntity[], roundLog: string) => {
    let nWinnedPlayer = 0;
    let nLosedPlayer = 0;
    let time = 0;  // コース経過時間（秒）
  
    while (nWinnedPlayer < 2  && nLosedPlayer < 3 && time < (15 * 60)) {
      const result = QuizResultUtils.operateQuiz(
        players, 
        QuizResultUtils.calculateButtonPushProbabilityForSwedish10, 
        QuizResultUtils.calculateCorrectAnswerProbabilityForSwedish10);
  
      if (result.pushedPlayerIndex == -1) {
        // 問題スルー
        time += Random.getRandomArbitrary(12.5 - 4, 12.5 + 4);
        roundLog += `（スルー）\n`;
        continue;
      } else if (players[result.pushedPlayerIndex].r3Status.status != WinnedState.UNDEFINED) {
        // その解答者が既に勝ち抜け or 敗退している
        continue;
      } else {
        // 誰かが解答権を得ている
        time += Random.getRandomArbitrary(12.5 - 4, 12.5 + 4);
        roundLog += `${players[result.pushedPlayerIndex].name} `;
        if (result.isCorrected) {
          // 正解した
          roundLog += `${AnswerState.CORRECT} `;
          players[result.pushedPlayerIndex].r3Status.points++;
          players[result.pushedPlayerIndex].r3Status.answered += AnswerState.CORRECT;
  
          if (players[result.pushedPlayerIndex].r3Status.points == 10) {
            // 勝ち抜け
            roundLog += `=> ${getWinState(nWinnedPlayer)}`;
            players[result.pushedPlayerIndex].r3Status.status = getWinState(nWinnedPlayer);
            nWinnedPlayer++;
          }
        } else {
          // 誤答した
          const missCount = () => {
              if (players[result.pushedPlayerIndex].r3Status.points == 0) return 1;
              if (players[result.pushedPlayerIndex].r3Status.points <= 2) return 2;
              if (players[result.pushedPlayerIndex].r3Status.points <= 5) return 3;
              return 4;
          };
  
          roundLog += `${AnswerState.INCORRECT} `;
          players[result.pushedPlayerIndex].r3Status.misses += missCount();
          players[result.pushedPlayerIndex].r3Status.answered += `(${missCount()}${AnswerState.INCORRECT})`;
  
          if (players[result.pushedPlayerIndex].r3Status.misses >= 10) {
            // 敗退
            roundLog += `=> ${WinnedState.LOSED}`;
            players[result.pushedPlayerIndex].r3Status.status = WinnedState.LOSED;
            nLosedPlayer++;
          }
        }
        roundLog += '\n';
      }
    }
  
    if (time >= (15 * 60)) {
      roundLog += '（タイムアップ終了）\n';
    }
  
    if (nWinnedPlayer < 2) {
      // トビ残り・タイムアップ処理
      const remainedPlayers = players
        .filter((player) => player.r3Status.status == WinnedState.UNDEFINED)
        .sort((playerA, playerB) => {
          if (playerA.r3Status.points > playerB.r3Status.points) return -1; // ポイント多い順
          if (playerA.r3Status.points < playerB.r3Status.points) return 1;
          if (playerA.r3Status.misses < playerB.r3Status.misses) return -1; // 誤答少ない順
          if (playerA.r3Status.misses > playerB.r3Status.misses) return 1;
          return operatePlayOff(playerA, playerB) // プレーオフ
        });
      const nRequiredWinner = (2 - nWinnedPlayer);
      for (let i = 0; i < nRequiredWinner; i++) {
        // 勝ち抜け設定
        remainedPlayers[i].r3Status.status = getWinState(nWinnedPlayer);
        nWinnedPlayer++;
      }
    }
  
    for (const player of players) {
      player.r3Status.answered += ' （' + 
        player.r3Status.points + AnswerState.CORRECT + 
        player.r3Status.misses + AnswerState.INCORRECT + '）';
    }
  
    const winnerPlayersName = players
      .filter((player) => (player.r3Status.status != WinnedState.UNDEFINED && player.r3Status.status != WinnedState.LOSED))
      .map((player) => player.name);
    roundLog += '勝ち抜け ';
    for (const name of winnerPlayersName) {
      roundLog += `[${name}]`;
    }
    roundLog += '\n';
    return roundLog;
  }

export class Round3Logic {

    static operateRound3(playerDataList: PlayerEntity[]) {
        let roundLog = '【Round 3: Number 10】\n';

        // Round3参加者のコース希望値算出 -> 優先順にソート
        const priorityedPlayerList = playerDataList
          .filter((player) => (player.r2Status.status != WinnedState.UNDEFINED && player.r2Status.status != WinnedState.LOSED))
          .map((player) => {
            player.r3Status.requestCourseArray = getRequestCourseArray(player);
            return player;
          })
          .sort((playerA, playerB) => {
            // 優先順は2R勝ち抜け順＞ペーパー順位
            if (WinnedStateOrder.indexOf(playerA.r2Status.status as any) < WinnedStateOrder.indexOf(playerB.r2Status.status as any)) return -1;
            if (WinnedStateOrder.indexOf(playerA.r2Status.status as any) > WinnedStateOrder.indexOf(playerB.r2Status.status as any)) return 1;
            return playerA.paperRank - playerB.paperRank;
          });
        
        // コース抽選
        const playerFixedCourseList: string[] = []; // 参加者決定済みコース
        const runningCourseOrder = getCourseOrder();
        roundLog += `（コース実施順）${runningCourseOrder[0]} ＞ ${runningCourseOrder[1]} ＞ ${runningCourseOrder[2]} ＞ ${runningCourseOrder[3]}\n`;
  
        // 4コース分のコース組み分け
        const fixedPlayerIndexList: number[] = [];
        for (const course of runningCourseOrder) {
          const coursePlayers: PlayerEntity[] = [];
          const handsUpPlayerIndexList: number[] = [];
  
          // 挙手シミュレート
          for (let i = 0; i < priorityedPlayerList.length; i++) {
            if (handsUp(priorityedPlayerList[i], course, playerFixedCourseList)) {
              handsUpPlayerIndexList.push(i);
            }
          }
          
          let playerCount = 0;
          // 優先度上位から抽出
          for (let i = 0; i < priorityedPlayerList.length; i++) {
            if (!fixedPlayerIndexList.includes(i) && handsUpPlayerIndexList.includes(i) && playerCount < 5) {
              coursePlayers.push(priorityedPlayerList[i]);
              playerCount++;
              fixedPlayerIndexList.push(i);
            }
          }
          // 優先度下位から補充
          for (let i = priorityedPlayerList.length - 1; i >= 0; i--) {
            if (!fixedPlayerIndexList.includes(i) && !handsUpPlayerIndexList.includes(i) && playerCount < 5) {
              coursePlayers.push(priorityedPlayerList[i]);
              playerCount++;
              fixedPlayerIndexList.push(i);
            }
          }
  
          // コース確定
          for (const player of coursePlayers) {
            player.r3Status.fixedCourse = course;
          }
          playerFixedCourseList.push(course);
        }
        const getPlayersByCourse = (course: string) => priorityedPlayerList.filter(player => player.r3Status.fixedCourse == course);
  
        for (let i = 0; i < runningCourseOrder.length; i++) {
          roundLog += `（コース${i + 1} : ${runningCourseOrder[i]}）\n`;
          for (const player of getPlayersByCourse(runningCourseOrder[i])) {
            roundLog += `[${player.name}]`;
          }
          roundLog += '\n';
  
          switch (runningCourseOrder[i]) {
            case Round3Course.OX:
              roundLog = operate10o10x(getPlayersByCourse(runningCourseOrder[i]), roundLog);
              break;
            case Round3Course.BY:
              roundLog = operate10by10(getPlayersByCourse(runningCourseOrder[i]), roundLog);
              break;
            case Round3Course.SWEDISH:
              roundLog = operateSwedish10(getPlayersByCourse(runningCourseOrder[i]), roundLog);
              break;
            case Round3Course.UP_DOWN:
              roundLog = operate10UpDown(getPlayersByCourse(runningCourseOrder[i]), roundLog);
              break;
            default:
              // ここを通ることは無い
          }
        }
  
        // 勝ち抜けたプレイヤーのSemi Final座席位置を決定する
        for (let i = 0; i < runningCourseOrder.length; i++) {
          getPlayersByCourse(runningCourseOrder[i])
            .filter((player) => player.r3Status.status == WinnedState.FIRST_WINNED || player.r3Status.status == WinnedState.SECOND_WINNED)
            .map((player) => {
              if (player.r3Status.status == WinnedState.FIRST_WINNED) {
                player.sfStatus.seatIndex = 3 - i;
              } else {
                player.sfStatus.seatIndex = 5 + i;
              }
              return player;
            });
        }
  
        roundLog += '【Round 3: Number 10 おわり】\n';
        return { courseOrder: runningCourseOrder, priorityedPlayers: priorityedPlayerList, roundLog: roundLog }
    }
}