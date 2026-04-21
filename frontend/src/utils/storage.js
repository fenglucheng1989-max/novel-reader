export function getStorage(key, fallback = null) {
  try {
    const value = uni.getStorageSync(key)
    return value || fallback
  } catch (e) {
    return fallback
  }
}

export function setStorage(key, value) {
  try {
    uni.setStorageSync(key, value)
  } catch (e) {
    // Storage failure should not break reading.
  }
}
