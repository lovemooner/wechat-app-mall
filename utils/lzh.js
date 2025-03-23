var request = function request(url, method, data) {
  var _url = "http://47.116.87.201"+url;
  if (url.indexOf("http") == 0) {

    _url = url;
  }
  var header = {
    'Content-Type': 'application/json'
  };
  
  console.log(_url)
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
        console.log("fail"+error)
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
    return request('/shop/product/list', 'get', data);
  },
  productCategory: function productCategory() {
    return request('/shop/category/all', 'get');
  }

}