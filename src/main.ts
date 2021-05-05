import { createApp } from 'vue'
import App from './App.vue'
import router from './router'

import 'semantic-ui-css/semantic.min.css';

createApp(App)
.use(router)
.mount('#app')
