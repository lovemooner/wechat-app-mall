const WXAPI = require('apifm-wxapi')
const AUTH = require('../../utils/auth')
const LZH = require('../../utils/lzh')

const app = getApp()
Page({
  data: {
  },
  selectTap: function(e) {
    console.log(e);
    var id = e.currentTarget.dataset.id;
    LZH.updateAddress({
      token: wx.getStorageSync('token'),
      id: id,
      isDefault: 'true'
    }).then(function(res) {
      wx.navigateBack({})
    })
  },

  addAddess: function() {
    wx.navigateTo({
      url: "/pages/address-add/index"
    })
  },

  editAddess: function(e) {
    console.log(e);
    
    wx.navigateTo({
      url: "/pages/address-add/index?id=" + e.currentTarget.dataset.id
    })
  },

  onLoad: function() {
  },
  onShow: function() {
    AUTH.checkHasLogined().then(isLogined => {
      if (isLogined) {
        this.initAddress();
      }
    })
  },
  async initAddress() {
    wx.showLoading({
      title: '',
    })
    const res = await LZH.queryAddress()
    wx.hideLoading({
      success: (res) => {},
    })
    if (res.code == 0) {
      this.setData({
        addressList: res.data
      });
    } else if (res.code == 700) {
      this.setData({
        addressList: null
      });
    } else {
      wx.showToast({
        title: res.msg,
        icon: 'none'
      })
    }
  },
  onPullDownRefresh() {
    this.initAddress()
    wx.stopPullDownRefresh()
  },
})