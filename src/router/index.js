import { 
    createRouter,
    createWebHashHistory
} from 'vue-router'

import NetworkPage from '~/pages/NetworkPage.vue'
import VirtualMachinePage from '~/pages/VirtualMachinePage.vue'
import LogPage from '~/pages/LogPage.vue'
import NotFound from '~/pages/404.vue'

const routes = [{
    path:"/",
    component:VirtualMachinePage
},{
    path:"/NetworkPage",
    component:NetworkPage
},{
    path:"/LogPage",
    component:LogPage

},{ 
    path: '/:pathMatch(.*)*', 
    name: 'NotFound', 
    component: NotFound 
}]

const router = createRouter({
    history:createWebHashHistory(),
    routes
})

export default router