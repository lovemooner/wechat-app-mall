var request = function request(url, method, data) {
  var _url = "https://www.lzh8888.cn/shop"+url;
  if (url.indexOf("http") == 0) {
    _url = url;
  }
  var header = {
    'Content-Type': 'application/json'
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

}