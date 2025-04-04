var request = function request(url, method, data) {
  var _url = "https://www.lzh8888.cn/shop"+url;
  if (url.indexOf("http") == 0) {
    _url = url;
  }
  var header = {
    'Content-Type': 'application/json',
    'token': wx.getStorageSync('token')
  };
  return new Promise(function (resolve, reject) {
    wx.request({
      url: _url,
      method: method,
      data: data,
      header: header,
      success: function success(request) {
        resolve(request.data);
      },  
      fail: function fail(error) {
        console.log("fail: "+error)
        reject(error);
      },
      complete: function complete(aaa) {
        // 加载完成
      }
    });
  });
};

module.exports = {
  getProduct: function getProduct(data) {
    if (!data) {
      data = {};
    }
    return request('/product/list', 'get', data);
  },
  goodsv2: function goodsv2(data) {
    if (!data) {
      data = {};
    }
    var shopIds = wx.getStorageSync('shopIds');
    if (shopIds) {
      data.shopId = shopIds;
    }
    return request('/product/list/v2', 'get', data);
  },

  productCategory: function productCategory() {
    return request('/category/all', 'get');
  },
  noticeList: function noticeList(data) {
    return request('/notice-list', 'post', data);
  },
  adPosition: function adPosition(key) {
    return request('/site/adPosition/info', 'get', { key: key });
  },
  banners: function banners(data) {
    return request('/banner-list', 'get', data);
  },
  login_wx: function login_wx(code) {
    return request('/user/login', 'post', {
      code: code,
      type: 2
    });
  },

  userDetail: function userDetail() {
    return request('/user/detail', 'get');
  },
  checkToken: function checkToken(token) {
    return request('/user/check-token', 'get', {
      token: token
    });
  },
  goodsAddition: function goodsAddition(goodsId) {
    return request('/shop/goods/goodsAddition', true, 'get', {
      goodsId: goodsId
    });``
  },

  shoppingCarInfoAddItem: function shoppingCarInfoAddItem(token, goodsId, number, sku, addition) {
    var type = arguments.length > 5 && arguments[5] !== undefined ? arguments[5] : '';

    return request('/shopping-cart/add', 'post', {
      goodsId: goodsId,
      number: number,
      sku: sku && sku.length > 0 ? JSON.stringify(sku) : '',
      addition: addition && addition.length > 0 ? JSON.stringify(addition) : '',
      type: type
    });
  },

  shoppingCarInfo: function shoppingCarInfo() {
    var type = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : '';
    return request('/shopping-cart/info', 'get', {
      type: type
    });
  },

  shoppingCartSelected: function shoppingCartSelected(id, selected) {
    var type = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : '';
    return request('/shopping-cart/select', 'post', {
      id: id,
      selected: selected, 
      type: type
    });
  },

  shoppingCarInfoModifyNumber: function shoppingCarInfoModifyNumber(id, number) {
    var type = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : '';
    return request('/shopping-cart/modifyNumber', 'post', {
      id: id, number: number, type: type
    });
  },
  // 订单
  orderList: function orderList(data) {
    return request('/order', 'get', data);
  },
  orderDetail: function orderDetail(token, id) {
    var hxNumber = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : '';
    var peisongOrderId = arguments.length > 3 && arguments[3] !== undefined ? arguments[3] : '';

    return request('/order/detail', true, 'get', {
      id: id,
      hxNumber: hxNumber,
      peisongOrderId: peisongOrderId
    });
  },

  modifyUserInfo: function modifyUserInfo(data) {
    return request('/user/modify', 'post', data);
  },

  uploadFileV2: function uploadFileV2(tempFilePath) {
    var expireHours = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : '';

    return new Promise(function (resolve, reject) {
      wx.uploadFile({
        url: 'https://www.lzh8888.cn/shop/upload2',
        filePath: tempFilePath,
        name: 'upfile',
        formData: {
          expireHours: expireHours
        },
        success: function success(res) {
          resolve(JSON.parse(res.data));
        },
        fail: function fail(error) {
          reject(error);
        },
        complete: function complete(aaa) {
          // 加载完成
        }
      });
    });
  },
  addAddress: function addAddress(data) {
    return request('/user/address/add', 'post', data);
  },
  updateAddress: function updateAddress(data) {
    return request('/user/address/update', true, 'post', data);
  },
  deleteAddress: function deleteAddress(id) {
    return request('/user/address/delete', 'delete', {
      id: id,
    });
  },
  queryAddress: function queryAddress() {
    return request('/user/address', 'get');
  },

  addressDetail: function addressDetail(id) {
    return request('/user/address/detail', 'get', {
      id: id,
    });
  },
  defaultAddress: function defaultAddress() {
    return request('/user/address/default', 'get');
  },
  provinceV2: () => {
    return request('/region/province', 'get')
  },
  cityV2: () => {
    return request('/region/city', 'get')
  },
  districtsV2: data => {
    return request('/region/districts', 'post', data)
  },
  // 查询下一级地址
  nextRegionV2: pid => {
    return request('/region/child', 'get', { pid })
  },
  userAmount: function userAmount() {
    return request('/user/amount', 'get');
  },
  orderCreate: function orderCreate(data) {
    return request('/order/create', 'post', data);
  },

  // 支付
  wxpay: function wxpay(data) {
    return request('/pay/wx/wxapp', 'post', data);
  },
  payVariableUrl: function payVariableUrl(url, data) {
    return request(url, 'post', data);
  },

}