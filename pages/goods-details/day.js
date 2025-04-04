const WXAPI = require('apifm-wxapi')
const dayjs = require("dayjs")
const LZH = require('../../utils/lzh.js');
Page({
  data: {
    list: undefined,
    maxDate: dayjs().add(7, 'day').valueOf(),
  },
  onLoad(options) {
    this.setData({
      goodsId: options.goodsId
    })
    this.goodsPriceDaily()
  },
  onShow() {

  },
  async goodsPriceDaily() {
    // https://www.yuque.com/apifm/nu0f75/zg7uw6
    const res = await WXAPI.goodsPriceDaily(this.data.goodsId)
    if (res.code != 0) {
      wx.showModal({
        content: res.msg
      })
      return
    }
    const list = res.data.filter(ele => ele.stores > 0)
    this.setData({
      list
    })
  },
  async onSelect(event) {
    event.detail.forEach(ele => {
      const day = dayjs(ele).format('YYYY-MM-DD')
      const item = this.data.list.find(a => a.day == day)
      if (!item) {
        wx.showModal({
          content: day + '预约已满，请更换日期'
        })
      }
    })
  },
  async onConfirm(event) {
    const days = []
    event.detail.forEach(ele => {
      days.push(dayjs(ele).format('YYYY-MM-DD'))
    })
    const goodsJsonStr = [{
      goodsId: this.data.goodsId,
      number: days.length,
      days
    }]
    const d = {
      token: wx.getStorageSync('token'),
      goodsJsonStr: JSON.stringify(goodsJsonStr),
    }
    // https://www.yuque.com/apifm/nu0f75/qx4w98
    const res = await LZH.orderCreate(d)
    if (res.code != 0) {
      wx.showModal({
        content: res.msg
      })
      return
    }
    this.setData({
      orderId: res.data.id,
      money: res.data.amountReal,
      paymentShow: true,
      nextAction: {
        type: 0,
        id: res.data.id
      }
    })
  },
  paymentOk(e) {
    console.log(e.detail); // 这里是组件里data的数据
    this.setData({
      paymentShow: false
    })
    wx.redirectTo({
      url: '/pages/order-details/index?id=' + this.data.orderId,
    })
  },
  paymentCancel() {
    this.setData({
      paymentShow: false
    })
  },
})