const CONFIG = require('../../config.js')
const WXAPI = require('apifm-wxapi')
const AUTH = require('../../utils/auth');
const LZH = require('../../utils/lzh.js');

Date.prototype.format = function(format) {
  var date = {
         "M+": this.getMonth() + 1,
         "d+": this.getDate(),
         "h+": this.getHours(),
         "m+": this.getMinutes(),
         "s+": this.getSeconds(),
         "q+": Math.floor((this.getMonth() + 3) / 3),
         "S+": this.getMilliseconds()
  };
  if (/(y+)/i.test(format)) {
         format = format.replace(RegExp.$1, (this.getFullYear() + '').substr(4 - RegExp.$1.length));
  }
  for (var k in date) {
         if (new RegExp("(" + k + ")").test(format)) {
                format = format.replace(RegExp.$1, RegExp.$1.length == 1
                       ? date[k] : ("00" + date[k]).substr(("" + date[k]).length));
         }
  }
  return format;
}

Page({
  data: {
    totalScoreToPay: 0,
    goodsList: [],
    isNeedLogistics: 0, // 是否需要物流信息
    yunPrice: 0,
    amountLogistics2: 0,
    allGoodsAndYunPrice: 0,
    goodsJsonStr: "",
    orderType: "", //订单类型，购物车下单或立即支付下单，默认是购物车， buyNow 说明是立即购买 

    couponAmount: 0, //优惠券金额
    curCoupon: null, // 当前选择使用的优惠券
    curCouponShowText: '请选择使用优惠券', // 当前选择使用的优惠券
    peisongType: 'kd', // 配送方式 kd,zq 分别表示快递/到店自取
    remark: '',
    shopIndex: -1,
    pageIsEnd: false,

    bindMobileStatus: 0, // 0 未判断 1 已绑定手机号码 2 未绑定手机号码
    userScore: 0, // 用户可用积分
    deductionScore: '-1', // 本次交易抵扣的积分数， -1 为不抵扣，0 为自动抵扣，其他金额为抵扣多少积分
    shopCarType: 0, //0自营购物车，1云货架购物车
    dyopen: 0, // 是否开启订阅
    dyunit: 0, // 按天
    dyduration: 1, // 订阅间隔
    dytimes: 1, // 订阅次数
    dateStart: undefined, // 订阅首次扣费时间
    minDate: new Date().getTime(),
    maxDate: new Date(2030, 10, 1).getTime(),
    currentDate: new Date().getTime(),
    formatter: (type, value) => {
      if (type === 'year') {
        return `${value}年`;
      } 
      if (type === 'month') {
        return `${value}月`;
      }
      if (type === 'day') {
        return `${value}日`;
      }
      if (type === 'hour') {
        return `${value}点`;
      }
      if (type === 'minute') {
        return `${value}分`;
      }
      return value;
    },
    cardId: '0' // 使用的次卡ID
  },
  onShow() {
    if (this.data.pageIsEnd) {
      return
    }
    this.doneShow()
    
  },
  async doneShow() {
    let goodsList = []
    //立即购买下单
    if ("buyNow" == this.data.orderType) {
      var buyNowInfoMem = wx.getStorageSync('buyNowInfo');
      this.data.kjId = buyNowInfoMem.kjId;
      if (buyNowInfoMem && buyNowInfoMem.shopList) {
        goodsList = buyNowInfoMem.shopList
      }
    } else {
      //购物车下单
      var res = await LZH.shoppingCarInfo()
      if (res.code == 0) {
        goodsList = res.data.items.filter(ele => {
          return ele.selected
        })
        const shopIds = []
        goodsList.forEach(ele => {
          shopIds.push(ele.shopId)
        })
      }
    }

    this.setData({
      goodsList,
      peisongType: this.data.peisongType
    });
    this.initShoppingAddress()
    this.userAmount()
  },

  onLoad(e) {
    const nowDate = new Date();
    let _data = {
      dateStart: nowDate.format('yyyy-MM-dd h:m:s'),
      orderPeriod_open: wx.getStorageSync('orderPeriod_open'),
      order_pay_user_balance: wx.getStorageSync('order_pay_user_balance'),
      zt_open_hx: wx.getStorageSync('zt_open_hx'),
    }
    if (e.orderType) {
      _data.orderType = e.orderType
    }
    this.setData(_data)
    this.getUserApiInfo()
  },
  async userAmount() {
    const res = await LZH.userAmount()
    const order_pay_user_balance = wx.getStorageSync('order_pay_user_balance')
    if (res.code == 0) {
      this.setData({
        balance: order_pay_user_balance == '1' ? res.data.balance : 0,
        userScore: res.data.score
      })
    }
  },
  getDistrictId: function (obj, aaa) {
    if (!obj) {
      return "";
    }
    if (!aaa) {
      return "";
    }
    return aaa;
  },
  remarkChange(e) {
    this.data.remark = e.detail.value
  },
  async goCreateOrder() {
    this.setData({
      btnLoading: true
    })
    this.createOrder(true)
  },

  async createOrder(e) {
    // shopCarType: 0 //0自营购物车，1云货架购物车
    const loginToken = wx.getStorageSync('token') // 用户登录 token
    const postData = {
      goodsJsonStr: this.data.goodsJsonStr,
      remark: this.data.remark,
      peisongType: this.data.peisongType
    }
 
    if (this.data.kjId) {
      postData.kjid = this.data.kjId
    }

    if (e && postData.peisongType == 'kd') {
      if (!this.data.curAddressData) {
        wx.hideLoading();
        wx.showToast({
          title: '请设置收货地址',
          icon: 'none'
        })
        this.setData({
          btnLoading: false
        })
        return;
      }
      postData.address = this.data.curAddressData.address;
      postData.linkMan = this.data.curAddressData.linkMan;
      postData.mobile = this.data.curAddressData.mobile;
      postData.code = this.data.curAddressData.code;
    }
    
    if (!e) {
      postData.calculate = "true";
    } else {
      if (postData.peisongType == 'zq' && this.data.shops && this.data.shopIndex == -1) {
        wx.showToast({
          title: '请选择自提门店',
          icon: 'none'
        })
        this.setData({
          btnLoading: false
        })
        return;
      }
      const extJsonStr = {}
      if (postData.peisongType == 'zq') {
        if (!this.data.name) {
          wx.showToast({
            title: '请填写联系人',
            icon: 'none'
          })
          this.setData({
            btnLoading: false
          })
          return;
        }
        if (!this.data.mobile) {
          wx.showToast({
            title: '请填写联系电话',
            icon: 'none'
          })
          this.setData({
            btnLoading: false
          })
          return;
        }
        extJsonStr['联系人'] = this.data.name
        extJsonStr['联系电话'] = this.data.mobile
        postData.isCanHx = this.data.zt_open_hx == '1' ? true : false
      }
      if (postData.peisongType == 'zq' && this.data.shops) {
        postData.shopIdZt = this.data.shops[this.data.shopIndex].id
        postData.shopNameZt = this.data.shops[this.data.shopIndex].name
      }
      postData.extJsonStr = JSON.stringify(extJsonStr)
    }

    let totalRes = {
      code: 0,
      msg: 'success',
      data: {
        score: 0,
        amountReal: 0,
        orderIds: []
      }
    }
    
    const res = await LZH.orderCreate(postData)
    this.data.pageIsEnd = true
    if (res.code != 0) {
      this.data.pageIsEnd = false
      wx.showModal({
        title: '错误',
        content: res.msg,
        showCancel: false
      })
      this.setData({
        btnLoading: false
      })
      return;
    }
    totalRes = res
    if (!e) {
      this.setData({
        totalScoreToPay: res.data.score,
        isNeedLogistics: res.data.isNeedLogistics, //vop 商品必须快递
        allGoodsAndYunPrice: res.data.amountReal,
        goodsAdditionalPriceMap: res.data.goodsAdditionalPriceMap,
        yunPrice: res.data.amountLogistics,
        amountLogistics2: res.data.amountLogistics2,
        deductionMoney: res.data.deductionMoney,
        couponAmount: res.data.couponAmount
      })
    }
    if (!e) {
      this.data.pageIsEnd = false
      return
    }

    if (e && "buyNow" != this.data.orderType) {
      // 清空购物车数据
      const keyArrays = []
      this.data.goodsList.forEach(ele => {
        keyArrays.push(ele.key)
      })
      WXAPI.shippingCarInfoRemoveItem(loginToken, keyArrays.join())
    }
    this.processAfterCreateOrder(totalRes)
  },
  async processAfterCreateOrder(res) {
    this.setData({
      btnLoading: false
    })
    
    if (res.data.status != 0) {
      wx.redirectTo({
        url: "/pages/order-list/index"
      })
      return
    }
    let orderId = ''
    if (res.data.orderIds && res.data.orderIds.length > 0) {
      orderId = res.data.orderIds.join()
    } else {
      orderId = res.data.id
    }
    // 直接弹出支付，取消支付的话，去订单列表
    this.setData({
      orderId,
      money: res.data.amountReal,
      paymentShow: true,
      nextAction: {
        type: 0,
        id: orderId
      }
    })
  },
  async initShoppingAddress() {
    const res = await LZH.defaultAddress()
    if (res.code == 0) {
      this.setData({
        curAddressData: res.data.info
      });
    } else {
      this.setData({
        curAddressData: null
      });
    }
    this.processYunfei();
  },
  processYunfei() {
    var goodsList = this.data.goodsList
    if (goodsList.length == 0) {
      return
    }

    
    const goodsJsonStr = []
    for (let i = 0; i < goodsList.length; i++) {
      let carShopBean = goodsList[i];
      if (carShopBean.logistics || carShopBean.logisticsId) {
        isNeedLogistics = 1;
      }

      const _goodsJsonStr = {
        propertyChildIds: carShopBean.propertyChildIds
      }
      if (carShopBean.sku && carShopBean.sku.length > 0) {
        let propertyChildIds = ''
        carShopBean.sku.forEach(option => {
          propertyChildIds = propertyChildIds + ',' + option.optionId + ':' + option.optionValueId
        })
        _goodsJsonStr.propertyChildIds = propertyChildIds
      }
      if (carShopBean.additions && carShopBean.additions.length > 0) {
        let goodsAdditionList = []
        carShopBean.additions.forEach(option => {
          goodsAdditionList.push({
            pid: option.pid,
            id: option.id
          })
        })
        _goodsJsonStr.goodsAdditionList = goodsAdditionList
      }
      _goodsJsonStr.productId = carShopBean.productId
      _goodsJsonStr.number = carShopBean.number
      _goodsJsonStr.logisticsType = 0
      goodsJsonStr.push(_goodsJsonStr)
    }
   
    this.setData({
      goodsJsonStr: JSON.stringify(goodsJsonStr)
    });
    this.createOrder();
  },
  addAddress: function () {
    wx.navigateTo({
      url: "/pages/address-add/index"
    })
  },
  selectAddress: function () {
    wx.navigateTo({
      url: "/pages/select-address/index"
    })
  },

  radioChange(e) {
    this.setData({
      peisongType: e.detail.value
    })
    this.processYunfei()
    if (e.detail.value == 'zq') {
      this.fetchShops()
    }
  },
  dyChange(e) {
    this.setData({
      dyopen: e.detail.value
    })
  },
  dyunitChange(e) {
    this.setData({
      dyunit: e.detail.value
    })
  },
  cancelLogin() {
    wx.navigateBack()
  },
  async fetchShops() {
    const res = await WXAPI.fetchShops()
    if (res.code == 0) {
      let shopIndex = this.data.shopIndex
      const shopInfo = wx.getStorageSync('shopInfo')
      if (shopInfo) {
        shopIndex = res.data.findIndex(ele => {
          return ele.id == shopInfo.id
        })
      }
      this.setData({
        shops: res.data,
        shopIndex
      })
    }
  },
  shopSelect(e) {
    this.setData({
      shopIndex: e.detail.value
    })
  },
  goMap() {
    const _this = this
    const shop = this.data.shops[this.data.shopIndex]
    const latitude = shop.latitude
    const longitude = shop.longitude
    wx.openLocation({
      latitude,
      longitude,
      scale: 18
    })
  },
  callMobile() {
    const shop = this.data.shops[this.data.shopIndex]
    wx.makePhoneCall({
      phoneNumber: shop.linkPhone,
    })
  },
  async getUserApiInfo() {
    const res = await LZH.userDetail()
    if (res.code == 0) {
      let bindMobileStatus = res.data.base.mobile ? 1 : 2 // 账户绑定的手机号码状态
      if (!CONFIG.needBindMobile) {
        bindMobileStatus = 1
      }
      this.setData({
        bindMobileStatus,
        mobile: res.data.base.mobile,
        name: res.data.base.nick,
      })
    }
  },
  bindMobile() {
    this.setData({
      bindMobileShow: true
    })
  },
  bindMobileOk(e) {
    console.log(e.detail); // 这里是组件里data的数据
    this.setData({
      bindMobileShow: false,
      mobile: e.detail.mobile,
      bindMobileStatus: 1
    })
  },
  bindMobileCancel() {
    this.setData({
      bindMobileShow: false
    })
  },
  deductionScoreChange(event) {
    this.setData({
      deductionScore: event.detail,
    })
    this.processYunfei()
  },
  deductionScoreClick(event) {
    const {
      name
    } = event.currentTarget.dataset;
    this.setData({
      deductionScore: name,
    })
    this.processYunfei()
  },
  cardChange(event) {
    this.setData({
      cardId: event.detail,
    })
    this.processYunfei()
  },
  cardClick(event) {
    const {
      name
    } = event.currentTarget.dataset;
    this.setData({
      cardId: name,
    })
    this.processYunfei()
  },
  dateStartclick(e) {
    this.setData({
      dateStartpop: true
    })
  },
  dateStartconfirm(e) {
    const d = new Date(e.detail)
    this.setData({
      dateStart: d.format('yyyy-MM-dd h:m:s'),
      dateStartpop: false
    })
    console.log(e);
  },
  dateStartcancel(e) {
    this.setData({
      dateStartpop: false
    })
  },
 
  paymentOk(e) {
    debugger
    console.log(e.detail); // 这里是组件里data的数据
    this.setData({
      paymentShow: false
    })
    wx.redirectTo({
      url: '/pages/order-list/index',
    })
  },
  paymentCancel() {
    this.setData({
      paymentShow: false
    })
  },
})