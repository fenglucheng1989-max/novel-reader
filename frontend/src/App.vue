<script>
export default {
  onLaunch() {
    console.log('App Launch')
  },
  onShow() {
    console.log('App Show')
  },
  onHide() {
    console.log('App Hide')
  }
}
</script>

<style>
page {
  background-color: #F8F8F6;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
  color: #1F1F1F;
}

view,
text,
input,
button {
  box-sizing: border-box;
}

button::after {
  border: 0;
}

/* #ifdef H5 */
body {
  margin: 0;
  background: #E8E8E4;
  overflow-x: hidden;
}

#app {
  width: min(100vw, 480px);
  min-height: 100vh;
  margin: 0 auto;
  background:
    linear-gradient(180deg, #FAFAF8 0%, #F5F5F2 40%, #F8F8F6 100%);
  box-shadow: 0 0 42px rgba(0, 0, 0, 0.08);
  overflow-x: hidden;
}

.product-page {
  min-height: 100vh;
  background:
    linear-gradient(180deg, rgba(240, 238, 234, 0.75), rgba(248, 248, 246, 0.96) 42%),
    #F5F5F2;
}

.product-card {
  border-radius: 8px;
  background: #FFFFFF;
  border: 1px solid rgba(0, 0, 0, 0.06);
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.04);
}

.text-cut-2 {
  display: -webkit-box;
  overflow: hidden;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
}

.text-cut-3 {
  display: -webkit-box;
  overflow: hidden;
  -webkit-line-clamp: 3;
  -webkit-box-orient: vertical;
}

uni-page-head .uni-page-head {
  left: 50% !important;
  right: auto !important;
  width: min(100vw, 480px) !important;
  transform: translateX(-50%);
}

uni-page-body {
  width: 100%;
  overflow-x: hidden;
}

uni-tabbar .uni-tabbar {
  left: 50% !important;
  right: auto !important;
  width: min(100vw, 480px) !important;
  transform: translateX(-50%);
}

uni-tabbar .uni-tabbar__bd {
  left: auto !important;
  right: auto !important;
  width: auto !important;
  transform: none !important;
}

uni-tabbar .uni-tabbar__item {
  flex: 1 1 0 !important;
  width: 33.3333% !important;
}

@media (max-width: 480px) {
  body {
    background: #F0F0ED;
  }

  #app {
    width: 100vw;
    box-shadow: none;
  }

  uni-page-head .uni-page-head {
    left: 0 !important;
    right: 0 !important;
    width: 100vw !important;
    transform: none;
  }

  uni-tabbar .uni-tabbar {
    left: 0 !important;
    right: 0 !important;
    width: 100vw !important;
    transform: none;
  }
}
/* #endif */

</style>
