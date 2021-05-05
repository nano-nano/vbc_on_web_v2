import { WinnedState } from '@/vbc-state';

export class NamePlateUtils {
    /**
     * ペーパー順位に応じたネームプレート色のカラーコードを返す
     * 
     * @param rank ペーパー順位
     */
    static getBgColorCode(rank: number) {
        if (rank <= 4) return '#fb5353';  // 赤プレート
        if (rank <= 12) return '#41a3ec'; // 青プレート
        if (rank <= 24) return '#fbbd08'; // 黄プレート
        if (rank <= 48) return '#21ba45'; // 緑プレート
        return '#f8f9fa'; // デフォルトは白に近い色
    }

    /**
     * ペーパー順位を序数テキストに変換して返す
     * 
     * @param rank ペーパー順位
     */
    static convertRankNumberToText(rank: number) {
        const rankLastTwo = rank % 100;
        if (rankLastTwo >= 11 && rankLastTwo <= 13) return `${rank}th`;
        if (rank % 10 == 1) return `${rank}st`;
        if (rank % 10 == 2) return `${rank}nd`;
        if (rank % 10 == 3) return `${rank}rd`;
        return `${rank}th`;
    }
}

export class WinnedStateUtils {
    /**
     * 勝ち抜き状態に応じたstyle classを返す
     * 
     * @param state WinnedState
     */
    static getWinnedStateLabelStyle(state: string) {
        if (state == WinnedState.LOSED || state == WinnedState.UNDEFINED) return '' ;
        return 'winner-label';
    }
}

export class Random {
    /**
     * 0以上1未満の浮動小数点の擬似乱数を返す
     */
    static getRandom() {
        return Math.random();
    }

    /**
     * 指定した値の間のランダムな実数を返す
     * 戻り値はmin 以上、max 未満
     * 
     * @param min 最小値
     * @param max 最大値
     */
    static getRandomArbitrary(min: number, max: number) {
        return Math.random() * (max - min) + min;
    }

    /**
     * 指定した値の間のランダムな整数を返す
     * 戻り値はmin 以上（min が整数でない場合、min より大きい次の整数以上）、max 未満
     * 
     * @param min 最小値
     * @param max 最大値
     */
    static getRandomInt(min: number, max: number) {
        min = Math.ceil(min);
        max = Math.floor(max);
        return Math.floor(Math.random() * (max - min)) + min; //The maximum is exclusive and the minimum is inclusive
    }
}