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

  userDetail: function userDetail(token) {
    return request('/user/detail', 'get', {
      token: token
    });
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


}