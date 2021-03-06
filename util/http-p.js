import {
  config
} from '../config.js'

import {
  Base64
} from './base64.js'

import {
  Token
} from '../models/token.js'


// console.log(Base64)

const tips = {
  1: '抱歉，出现了一个错误',
  1005: 'appkey无效，请前往www.7yue.pro申请',
}
// # 解构
class HTTP {
  request({
    url,
    data = {},
    method = 'GET'
  }) {
    return new Promise((resolve, reject) => {
      this._request(url, resolve, reject, data, method)
    })
  }
  // 2小时
  // token1 1小时59分59秒 超过2小时
  // 退出 
  // 自动 无感知帮助他重新刷新令牌
  // 退出 短时间 二次重发机制（这个方法只适合小程序）
  // 在web中大部分是把用户的账号密码放到缓存中  或者使用双令牌（access_token、refresh_token）比如微信，一直使用的时候不需要输入密码账号，如果一个月不使用，要重新输入
  _request(url, resolve, reject, data = {}, method = 'GET', noRefetch = false) {
    wx.request({
      url: config.api_base_url + url,
      method: method,
      data: data,
      header: {
        'content-type': 'application/json',
        Authorization: this._encode()
      },
      success: (res) => {
        const code = res.statusCode.toString()
        if (code.startsWith('2')) {
          resolve(res.data)
        } else {
          if (code == '403') {
            if (!noRefetch) {
              this._refetch(
                url,
                resolve,
                reject,
                data,
                method
              )
            }
          } else {
            reject()
            const error_code = res.data.error_code
            this._show_error(error_code)
          }
        }
      },
      fail: (err) => {
        reject()
        this._show_error(1)
      }
    })

  }

  _show_error(error_code) {
    if (!error_code) {
      error_code = 1
    }
    const tip = tips[error_code]
    wx.showToast({
      title: tip ? tip : tips[1],
      icon: 'none',
      duration: 2000
    })
  }

  //  再次发起请求
  _refetch(...param) {
    var token = new Token();
    token.getTokenFromServer((token) => {
      this._request(...param, true);
    });
  }

  _encode() {
    const token = wx.getStorageSync('token')
    const base64 = new Base64()
    const result = base64.encode(token + ':')
    return 'Basic ' + result
  }


}

export {
  HTTP
}