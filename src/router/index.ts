import { createRouter, createWebHistory } from 'vue-router';
import BlogHome from '../views/BlogHome.vue';


const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'Home',
      component: BlogHome,
    },
    {
      path: '/BlogPage',
      name: 'BlogPage',
      // route level code-splitting
      // this generates a separate chunk (About.[hash].js) for this route
      // which is lazy-loaded when the route is visited.
      component: () => import('../views/BlogPage.vue'),
    },
  ],
});

export default router;
