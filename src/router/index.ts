import { createRouter, createWebHashHistory } from 'vue-router'
import DefaultLayout from '../layouts/DefaultLayout.vue'
import HomeView from '../views/HomeView.vue'
import EditorView from '../views/EditorView.vue'

const router = createRouter({
  history: createWebHashHistory(),
  routes: [
    {
      path: '/',
      component: DefaultLayout,
      children: [
        {
          path: '',
          name: 'home',
          component: HomeView,
        },
        {
          path: 'editor',
          name: 'editor',
          component: EditorView,
        },
      ],
    },
  ],
})

export default router
