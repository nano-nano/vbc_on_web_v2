<template>
  <div>
    <!-- ファイル未選択時のsegment -->
    <div class="ui placeholder segment" v-if="!isFileLoaded" @dragover.prevent @drop.prevent="onFileSelect">
      <div class="ui icon header">
        <i class="file outline icon" />
        参加者データCSVファイルが読み込まれていません<br />
        ファイル選択ボタンで選択するか、ここにファイルをドラッグしてください
      </div>
      <div class="inline">
        <div class="ui primary button" @click="onClickFileSelectBtn">ファイルを選択</div>
        <div class="ui button" @click="onClickSampleDataBtn">サンプルデータで実行する</div>
      </div>
    </div>
    <!-- ファイル選択時のsegment -->
    <div class="ui segment" v-if="isFileLoaded">
      <div class="ui top attached label">読み込み済みファイル</div>
      <div>
        <p>{{ state.importFileName }}</p>
        <div class="ui button negative fluid" @click="onFileClear">結果をクリア</div>
      </div>
    </div>

    <!-- ファイル選択用（非表示） -->
    <input style="display: none" ref="inputRef" type="file" accept=".csv" @change="onFileSelect">
  </div>
</template>

<script lang="ts">
import { defineComponent, ref, reactive } from 'vue';
import { PlayerEntity, Round2Entity, Round3Entity, ExRoundEntity, SemiFinalEntity, FinalEntity, FinalSetEntity } from '@/vbc-entity'
import { WinnedState, Round3Course } from '@/vbc-state';

const createFinalSetEntities = () => {
  const result = [];
  for (let i = 0; i < 7; i++) {
    result.push({
      points: 0,
      misses: 0,
      answered: '',
      status: WinnedState.UNDEFINED
    } as FinalSetEntity);
  }
  return result;
}

const convertCsvToPlayerDataList = async (file: File) => {
  const rawStr = await file.text();
  return convertCsvToPlayerDataListInner(rawStr);
}

const convertCsvToPlayerDataListInner = (rawStr: string) => {
  const result: PlayerEntity[] = [];
  for (const line of rawStr.split('\n')) {
    if (line == "") continue;
    const lineItems = line.split(',');
    result.push({
      paperRank: parseInt(lineItems[0]),
      name: lineItems[1],
      knowledge: parseFloat(lineItems[2]),
      pushSpeed: parseFloat(lineItems[3]),
      request10o10x: parseFloat(lineItems[4]),
      requestSwedish10: parseFloat(lineItems[5]),
      request10by10: parseFloat(lineItems[6]),
      request10updown: parseFloat(lineItems[7]),
      belonging: (lineItems[8] ? lineItems[8] : '-'),
      r2Status: {
        points: 0,
        misses: 0,
        answered: '',
        status: WinnedState.UNDEFINED
      } as Round2Entity,
      r3Status: {
        requestCourseArray: [],
        fixedCourse: Round3Course.UNDEFINED,
        points: 0,
        misses: 0,
        answered: '',
        status: WinnedState.UNDEFINED
      } as Round3Entity,
      exStatus: {
        firstStepStatus: WinnedState.UNDEFINED,
        secondStepPoints: 0,
        secondStepMisses: 0,
        secondStepAnswered: '',
        secondStepStatus: WinnedState.UNDEFINED
      } as ExRoundEntity,
      sfStatus: {
        seatIndex: -1,
        points: 0,
        misses: 0,
        answered: ['', '', ''],
        status: WinnedState.UNDEFINED,
        losedSetNo: 99
      } as SemiFinalEntity,
      fStatus: {
        set: createFinalSetEntities(),
        nSeven: 0,
        isWin: false,
      } as FinalEntity
    } as PlayerEntity);
  }
  return result;
}

export default defineComponent({
  props: {
    isFileLoaded: Boolean
  },
  setup(_, context) {
    const state = reactive({
      importFileName: '',
    })
    const inputRef = ref();

    const onClickFileSelectBtn = () => inputRef.value.click();

    // eslint-disable-next-line
    const onFileSelect = async (event: any) => {
      const files: File[] = event.target.files || event.dataTransfer.files;
      if (files.length == 0 || files[0] == undefined) {
        state.importFileName = '';
        context.emit('onFileSelected', null);
        return;
      }
      // 拡張子を確認
      const extension = files[0].name.slice((files[0].name.lastIndexOf('.') - 1 >>> 0) + 2);
      if (extension != 'csv') {
        state.importFileName = '';
        context.emit('onFileSelected', null);
        return;
      }

      state.importFileName = files[0].name
      context.emit('onFileSelected', await convertCsvToPlayerDataList(files[0]));
    }

    const onFileClear = () => {
      state.importFileName = '';
      inputRef.value.value = '';
      context.emit('onFileSelected', null);
    }
    
    const onClickSampleDataBtn = () => {
      // サンプルファイルはpublic配下にある
      fetch('./sample_data.csv')
        .then(res => res.text())
        .then(text => {
          state.importFileName = '（サンプルデータ）'
          context.emit('onFileSelected', convertCsvToPlayerDataListInner(text));
        });
    }


    return {
      state,
      inputRef,
      onClickFileSelectBtn,
      onFileSelect,
      onFileClear,
      onClickSampleDataBtn,
    }
  }
});
</script>

<style lang="scss" scoped>
</style>