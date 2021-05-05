<template>
  <router-view/>

  <!-- 共通フッター -->
  <div class="ui vertical footer segment">
    <div class="ui divider" />
    <div class="ui stackable text container center" style="width: fit-content;">
      (c) 2020 Nano-Nano
      <span>
        Twitter: 
        <a href='https://twitter.com/nano2_aloerina' target='_blank' rel='noopener noreferrer'>@nano2_aloerina</a>
      </span>
      <span>
        GitHub: 
        <a href='https://github.com/nano-nano' target='_blank' rel='noopener noreferrer'>nano-nano</a>
      </span>
    </div>
  </div>
</template>

<style lang="scss">
/** 全体のスクロール設定 */
body {
  overflow-y: scroll;
}
/** テーブル */
table {
  table-layout: fixed;
}
.vertical-writing {
  -ms-writing-mode: tb-rl;
  writing-mode: vertical-rl;
  vertical-align: middle;
}
.winner-label {
  font-weight: bolder;
}
</style>