import { createRouter, createWebHashHistory, RouteRecordRaw } from 'vue-router'
import Home from '../views/Home.vue'

const routes: Array<RouteRecordRaw> = [
  {
    path: '/',
    name: 'Home',
    component: Home
  },
  {
    path: '/simulate',
    name: 'Simulate',
    component: () => import(/* webpackChunkName: "simulate" */ '../views/Simulate.vue')
  }
]

const router = createRouter({
  history: createWebHashHistory(),
  routes
})

export default router
