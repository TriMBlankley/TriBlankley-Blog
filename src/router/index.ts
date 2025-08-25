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
      path: '/BlogPage/:id',
      name: 'BlogPage',
      component: () => import('../views/BlogPage.vue'),
      props: true
    },
  ],
});

export default router;
