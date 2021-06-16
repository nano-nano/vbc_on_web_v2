<template>
  <div>
    <div class="ui inverted vertical center aligned segment">
      <NavBar page="Home" />
      <div id="hero" class="ui container">
        <h1 class="ui inverted">abcをWeb上で（勝手に）開催</h1>
        <h2>学生早押しクイズ最高峰の大会を手軽にシミュレート</h2>
        <div class="ui huge primary button" @click="onClickStartBtn">はじめる<i class="right arrow icon" /></div>
      </div>
    </div>

    <div id="content">
      <div class="ui vertical stripe segment">
        <div class="ui text container">
          <h3 class="ui header">クイズ大会「abc」をバーチャルに再現</h3>
          <p>
            新世代による基本問題実力No.1決定戦として名高いクイズ大会「abc」をPython上でシミュレートするプロジェクト
            <a href="https://github.com/NMLibrary/vbc" target='_blank' rel='noopener noreferrer'>「vbc」</a>に刺激を受け、
            ほぼ同じロジックでWebブラウザ上に大胆シミュレート。<br />
            参加者のデータを用意するだけで、abcの熱戦が目の前に。
          </p>
          <p>
            クイズ大会「abc」については<a href="https://abc-dive.com/portal/" target='_blank' rel='noopener noreferrer'>こちら</a>
          </p>

          <h3 class="ui header">使い方はシンプル</h3>
          <p>
            ペーパークイズの得点順になった参加者データCSVファイルを、画面の指示通りに読み込ませるだけの簡単手順。
            ビジュアル化された各ラウンドの結果と、１問ごとのテキストログが表示されます。
            結果の保存機能もあります。<br />
            とにかく動作が見てみたい方向けに、サンプルデータで実行するボタンも用意しています。
          </p>
          <div class="ui accordion">
            <div class="title" :class="{ active: state.isOpenAboutCsvAccordion }" @click="toggleAboutAccordion">
              <i class="dropdown icon" />参加者データCSVについて
            </div>
            <div class="content" :class="{ active: state.isOpenAboutCsvAccordion }">
              <p>
                <a href="https://github.com/NMLibrary/vbc#sample_datacsv%E3%81%AE%E5%BD%A2%E5%BC%8F%E3%81%AB%E3%81%A4%E3%81%84%E3%81%A6" target='_blank' rel='noopener noreferrer'>本家vbcのREADME.md</a>に準拠した、
                以下のフォーマットになっています。
              </p>
              <div class="ui segment">
                <div class="ui top attached label">CSV(UTF-8)</div>
                <p>順位,名前,知識量,早押し力,10○10×のコース希望値,Swedish 10のコース希望値,10 by 10のコース希望値,10 up-downのコース希望値,(option)所属</p>
                <p>(option)所属 はvbc on Web独自の拡張要素です。未設定でも機能します。</p>
              </div>
              <p>サンプルデータのCSVファイルは<a href="./sample_data.csv" target='_blank' rel='noopener noreferrer'>こちら</a>からダウンロードできます。</p>
            </div>
          </div>

          <h4 class="ui horizontal header divider">注意事項・免責事項</h4>
          <p>
            <ul>
              <li>インスパイア元のクイズ大会「abc」やツール「vbc」とは無関係です。何かあっても問い合わせはしないようにお願いします。</li>
              <li>
                スマートフォンなど横幅の狭い画面でも動作はしますが、レイアウトが崩れます。
                1200px以上の横幅のある画面での利用を推奨します。
              </li>
              <li>
                本プログラムを利用したことによる不具合や損害については一切の責任を負いません。
                また、本プログラム利用者が本プログラムの利用を通じて他者に損害を与えた場合、利用者は、自らの責任において問題を解決するものとします。
              </li>
            </ul>
          </p>

          <h4 class="ui horizontal header divider">更新履歴</h4>
          <p>
            2020/08/30: 公開開始<br />
            2020/09/16: 結果をpngファイルとしてダウンロードできるようにしました<br />
            2021/--/--: サイト全体のデザインをリニューアルしました<br />
          </p>
        </div>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent, reactive } from 'vue';
import { useRouter } from 'vue-router';

import NavBar from '@/components/NavBar.vue';

export default defineComponent({
  components: {
    NavBar,
  },
  setup() {
    const state = reactive<{
      /** 参加者データCSVについてのAccordionが開いているかどうか */
      isOpenAboutCsvAccordion: boolean,
    }>({
      isOpenAboutCsvAccordion: false,
    });
    const router = useRouter();

    const toggleAboutAccordion = () => {
      state.isOpenAboutCsvAccordion = !state.isOpenAboutCsvAccordion;
    }
    const onClickStartBtn = () => {
      router.push('Simulate');
    }
    
    return {
      state,
      toggleAboutAccordion,
      onClickStartBtn,
    };
  }
});
</script>

<style lang="scss" scoped>
#hero {
  width: 100%;
  padding:120px 0;
  background-image: url('../assets/hero.png');
  background-size: cover;
  background-position: center;
}

#content {
  margin: 50px 0;
}
</style>