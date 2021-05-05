<template>
  <div class="ui container">
    <div class="ui large secondary inverted pointing menu">
      <router-link class="item" :class="{ active: props.page == 'Home' }" to="/">Home</router-link>
      <router-link class="item" :class="{ active: props.page == 'Simulate' }" to="/simulate">Simulate</router-link>
      <router-link class="item disabled" :class="{ active: props.page == 'Create' }" to="/">Create</router-link>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent } from 'vue';

export default defineComponent({
  props: {
    page: {
      type: String,
      default: 'Home'
    }
  },
  setup(props) {
    return {
      props
    }
  }
});
</script>