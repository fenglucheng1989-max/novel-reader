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
  background-color: #f5f5f5;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
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
  background: #e9ecef;
  overflow-x: hidden;
}

#app {
  width: min(100vw, 480px);
  min-height: 100vh;
  margin: 0 auto;
  background: #f5f5f5;
  box-shadow: 0 0 32px rgba(15, 23, 42, 0.08);
  overflow-x: hidden;
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
    background: #f5f5f5;
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
