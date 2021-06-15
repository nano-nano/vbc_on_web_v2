<template>
  <div>
    <div class="ui segment">
      <div class="ui top attached label">追加操作</div>
      <div class="ui form">
        <div class="field">
          <label>1問ログ</label>
          <textarea style="resize: none;" readonly rows="6" v-model="state.formattedLog" />
        </div>
      </div>
      <div class="log buttons">
        <div class="ui button" v-if="isSupportClipboardCopy" @click="onCopyClicked">クリップボードにコピー</div>
        <div class="ui button" :class="{ disabled: state.isSavingTxt }" @click="onSaveClicked">テキストファイルで保存</div>
      </div>
      <div class="ui divider" />
      <div class="log buttons">
        <div class="ui button disabled">表示中の結果を画像で保存する</div>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import { Rounds } from '@/vbc-state';
import { defineComponent, PropType, reactive } from 'vue';
import { DateTime } from 'luxon';

export default defineComponent({
  props: {
    vbcLogList: {
      type: Array as PropType<{ round: Rounds, log: string }[]>,
      required: true
    }
  },
  setup(props) {
    const state = reactive({
      formattedLog: '',
      isSavingTxt: false,
    });

    const isSupportClipboardCopy = navigator.clipboard;

    // deep copy
    const copied = props.vbcLogList.slice(0, props.vbcLogList.length);
    const sorted = copied.sort((a, b) => a.round - b.round).map(e => e.log);
    state.formattedLog = sorted.join('\n');

    const onCopyClicked = () => {
      navigator.clipboard.writeText(state.formattedLog).then(() => {
        alert('クリップボードにコピーしました');
      });
    };

  const onSaveClicked = () => {
    state.isSavingTxt = true;
    const blob = new Blob([state.formattedLog], { type: 'text/plain' });
    const fileName = `vbc_result_${DateTime.local().toFormat('yyyyMMddHHmmss')}.txt`;

    if (window.navigator.msSaveBlob != undefined) {
      // IEやEdgeの場合
      window.navigator.msSaveOrOpenBlob(blob, fileName);
    } else {
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = fileName;
      link.click();
    }
    state.isSavingTxt = false;
  };

    return {
      state,
      isSupportClipboardCopy,
      onCopyClicked,
      onSaveClicked,
    }
  }
});
</script>

<style lang="scss" scoped>
.log.buttons {
  display: flex;
  justify-content: flex-end;
  margin-top: 10px;
}
</style>