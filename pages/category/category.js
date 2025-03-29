const WXAPI = require('apifm-wxapi')
const CONFIG = require('../../config')
const AUTH = require('../../utils/auth')
const TOOLS = require('../../utils/tools.js') // TOOLS.showTabBarBadge();
const LZH = require('../../utils/lzh.js')

Page({
  /**
   * 页面的初始数据
   */
  data: {
    categories: [],
    activeCategory: 0,
    categorySelected: {
      name: '',
      id: ''
    },
    currentGoods: [],
    onLoadStatus: true,
    scrolltop: 0,
    skuCurGoods: undefined,
    current: 1,
    pageSize: 20
  },
  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function(options) {
    wx.showShareMenu({
      withShareTicket: true
    })
    this.setData({
      categoryMod: wx.getStorageSync('categoryMod')
    })
    this.categories();
  },
  async categories() {
    wx.showLoading({
      title: '',
    })
    
    const res = await LZH.productCategory()
    wx.hideLoading()
    let activeCategory = 0
    let categorySelected = this.data.categorySelected
    if (res.code == 0) {
      // const categories = res.data.filter(ele => {
      //   return !ele.vopCid1 && !ele.vopCid2
      // })
      const categories = res.data
      categories.forEach(p => {
        p.childs = categories.filter(ele => {
          return p.id == ele.pid
        })
      })

      const firstCategories = categories.filter(ele => { return ele.level == 1 })
      if (this.data.categorySelected.categoryName) {
        activeCategory = firstCategories.findIndex(ele => {
          return ele.id == this.data.categorySelected.categoryName
        })
        categorySelected = firstCategories[activeCategory]
      } else {
        categorySelected = firstCategories[0]
      }
    
      console.log("categorySelected "+categorySelected.categoryName)
      let adPosition = null
      if (categorySelected) {
        const resAd = await WXAPI.adPosition('category_' + categorySelected.categoryName)
        if (resAd.code === 0) {
          adPosition = resAd.data
        }
      }
      this.setData({
        current: 1,
        activeCategory,
        categories,
        firstCategories,
        categorySelected,
        adPosition
      })
      this.getGoodsList()
    }
  },
  async getGoodsList() {
    if (this.data.categoryMod == 2) {
      return
    }
    wx.showLoading({
      title: '',
    })
    // secondCategoryId
    let categoryName = ''
    if (this.data.secondCategoryId) {
      categoryName = this.data.secondCategoryId
    } else if(this.data.categorySelected && this.data.categorySelected.categoryName) {
      categoryName = this.data.categorySelected.categoryName
    }
    // https://www.yuque.com/apifm/nu0f75/wg5t98
    const res= await LZH.getProduct({
      categoryName,
      current: this.data.current,
      pageSize: this.data.pageSize
    })

    wx.hideLoading()
    if (res.code == 700) {
      if (this.data.current == 1) {
        this.setData({
          currentGoods: null
        });
      } else {
        wx.showToast({
          title: '没有更多了',
          icon: 'none'
        })
      }
      return
    }


    if (res.code != 0) {
      wx.showToast({
        title: res.msg,
        icon: 'none'
      })
      return
    }
    if (this.data.current == 1) {
      this.setData({
        currentGoods: res.data.records
      })
    } else {
      this.setData({
        currentGoods: this.data.currentGoods.concat(res.data.records)
      })
    }
  },
  async onCategoryClick(e) {
    const idx = e.target.dataset.idx
    if (idx == this.data.activeCategory) {
      this.setData({
        scrolltop: 0,
      })
      return
    }
    const categorySelected = this.data.firstCategories[idx]
    const res = await WXAPI.adPosition('category_' + categorySelected.categoryName)
    let adPosition = null
    if (res.code === 0) {
      adPosition = res.data
    }
    this.setData({
      current: 1,
      secondCategoryId: '',
      activeCategory: idx,
      categorySelected,
      scrolltop: 0,
      adPosition
    });
    this.getGoodsList();
  },
  onSecondCategoryClick(e) {
    const idx = e.detail.index
    let secondCategoryId = ''
    if (idx) {
      // 点击了具体的分类
      secondCategoryId = this.data.categorySelected.childs[idx-1].categoryName
    }
    this.setData({
      current: 1,
      secondCategoryId
    });
    this.getGoodsList();
  },

  bindconfirm(e) {
    this.setData({
      inputVal: e.detail
    })
    wx.navigateTo({
      url: '/pages/goods/list?name=' + this.data.inputVal,
    })
  },
  onShareAppMessage() {    
    return {
      title: '"' + CONFIG.mallName + '" ' + wx.getStorageSync('share_profile'),
      path: '/pages/index/index?inviter_id=' + wx.getStorageSync('uid')
    }
  },
  onShareTimeline() {    
    return {
      title: '"' + wx.getStorageSync('mallName') + '" ' + wx.getStorageSync('share_profile'),
      query: '',
      imageUrl: this.data.goodsDetail.basicInfo.pic
    }
  },
  onShow() {
    AUTH.checkHasLogined().then(isLogined => {
      if (isLogined) {
        TOOLS.showTabBarBadge() // 获取购物车数据，显示TabBarBadge
      } else {
        getApp().loginOK = () => {
          TOOLS.showTabBarBadge() // 获取购物车数据，显示TabBarBadge
        }
      }
    })
    const _categoryId = wx.getStorageSync('_categoryId')
    wx.removeStorageSync('_categoryId')
    if (_categoryId) {
      this.data.categorySelected.id = _categoryId
      this.categories();
    }
  },

  async addShopCar(e) {
    debugger
    const curGood = this.data.currentGoods.find(ele => {
      return ele.id == e.currentTarget.dataset.id
    })
    if (!curGood) {
      return
    }
    if (curGood.stores <= 0) {
      wx.showToast({
        title: '已售罄~',
        icon: 'none'
      })
      return
    }
    // 判断是否有可选配件全局或者按分类的
    const resGoodsAddition = await WXAPI.goodsAddition(curGood.id)
    if (resGoodsAddition.code == 0) {
      // 需要选择 SKU 和 可选配件
      curGood.hasAddition = true
      this.setData({
        skuCurGoods: curGood
      })
      return
    }
    if (!curGood.propertyIds && !curGood.hasAddition) {
      // 直接调用加入购物车方法
      const res = await WXAPI.shippingCarInfoAddItem(wx.getStorageSync('token'), curGood.id, 1, [])
      if (res.code == 2000) {
        wx.navigateTo({
          url: '/pages/login/index',
        })
        return
      }
      if (res.code == 30002) {
        // 需要选择规格尺寸
        this.setData({
          skuCurGoods: curGood
        })
      } else if (res.code == 0) {
        wx.showToast({
          title: '加入成功',
          icon: 'success'
        })
        wx.showTabBar()
        TOOLS.showTabBarBadge() // 获取购物车数据，显示TabBarBadge
      } else {
        wx.showToast({
          title: res.msg,
          icon: 'none'
        })
      }
    } else {
      // 需要选择 SKU 和 可选配件
      this.setData({
        skuCurGoods: curGood
      })
    }
  },
  goodsGoBottom() {
    this.data.current++
    this.getGoodsList()
  },
  adPositionClick(e) {
    const url = e.target.dataset.url
    if (url) {
      wx.navigateTo({
        url: url
      })
    }
  },
  searchscan() {
    wx.scanCode({
      scanType: ['barCode', 'qrCode', 'datamatrix', 'pdf417'],
      success: res => {
        this.setData({
          inputVal: res.result
        })
        wx.navigateTo({
          url: '/pages/goods/list?name=' + res.result,
        })
      }
    })
  }
})