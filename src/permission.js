import router from './router'
import store from './store'
import {
  Message
} from 'element-ui'
import NProgress from 'nprogress' // progress bar
import 'nprogress/nprogress.css' // progress bar style
import {
  getToken
} from '@/utils/auth' // get token from cookie

NProgress.configure({
  showSpinner: false
}) // NProgress Configuration

//免登录白名单
const whiteList = ['/login']
let flag = true

router.beforeEach((to, from, next) => {
  NProgress.start()
  if (getToken()) {
    to.meta.title && store.dispatch('settings/setTitle', to.meta.title)
    /* has token*/
    if (to.path === '/login') {
      next({
        path: '/'
      })
      NProgress.done()
    } else {
      if (store.getters.refresh) {
        store.dispatch('RefreshPermission', {
          refresh: false
        })
        // 判断当前用户是否已拉取完user_info信息
        store.dispatch('GetInfo').then(() => {
          if (flag) {
            store.dispatch('GenerateRoutes').then(accessRoutes => {
              // 根据permissions权限生成可访问的路由表
              router.addRoutes(accessRoutes) // 动态添加可访问路由表
              flag = false
              next({
                ...to,
                replace: true
              }) // hack方法 确保addRoutes已完成
            })
          } else {
            next()
          }
        }).catch(err => {
          store.dispatch('WebLogout').then(() => {
            Message.error(err)
            next({
              path: '/'
            })
          })
        })
      } else {
        next()
      }
    }
  } else {
    // 没有token
    if (whiteList.indexOf(to.path) !== -1) {
      // 在免登录白名单，直接进入
      next()
    } else {
      store.dispatch('RefreshPermission', {
        refresh: true
      })
      next(`/login?redirect=${to.fullPath}`) // 否则全部重定向到登录页
      NProgress.done()
    }
  }
})

router.afterEach(() => {
  // finish progress bar
  NProgress.done()
})
