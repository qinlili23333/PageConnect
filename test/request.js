import axios from 'axios'
import 'es6-promise/auto'
import Cookies from 'js-cookie'

// Promise
// window.Promise = window.Promise || Promise;

const handleResponse = (res) => {
    // 支付接口使用的 status 判断
    if (res.data.success || res.data.status === 0 || res.data.errcode === 0 ||
      res.data.Status === 200) {
        return Promise.resolve(res.data)
    } else {
        // 联调开发阶段不需要跳转
        if(process.env.NODE_ENV === 'development') {
          // return this;
        }

        // 用户session丢失
        if (res.data.op === 'redirect') {
            const sUrl = res.data.url;
            const iNext = sUrl.indexOf('next=');
            let newUrl = sUrl.substring(0, iNext);

            newUrl += 'next=' + location.pathname;
            setTimeout(() => {
                location.href = '//' + location.host + newUrl;
            }, 500)

            return;
        }

        // fix 网页版中掉线后不知道跳转回扫码页面的情况
        if(res.data.op && res.data.op == 'web_redirect') {
          // 需要先登录
            if(location.href.indexOf('teacherLog') !== -1){
                location.href = '/web/?next=' + location.pathname + '&type=3&share=1'
            }else {
                location.href = '/web/?next=' + location.pathname;
            }
         
          return;
        }

        // 没有权限
        if (res.data.status_code === 1 || res.data.status_code === 2 || res.data.status_code === 4) {
            // location.href = '/v/index/course/normalcourse/error/' + res.data.status_code;
            location.href = location.origin + '/v2/web/forbidden'
        }

        // 没有填写信息 跳转个人信息完善页
        if (res.data.status_code === 5) {
            let nextURL = location.href;
            location.href = `/v/index/edituserinfo_simple?next_url=${nextURL}`;
        }

        // web开课部分接口不规范单独处理
        if (res.data.Language && res.status === 200) {
          return Promise.resolve(res.data)
        }

        return Promise.reject(res.data)
    }
}
const errorResponseGet = (error) => {
    if(error.response && (error.response.status === 401) && (error.response.data.errcode !== 401999)
      || error.Status === 401) {
          if(location.href.indexOf('teacherLog') !== -1){
              location.href = location.origin + '/web?next=' + location.pathname + '&type=3&share=1'
          }else{
              location.href = location.origin + '/web?next=' + location.pathname + '&type=3'
          }
      

      return;
    }
    if(error.errcode){
        let rep1 = /^4030[0-9]{2}$/
        let rep2 = /^4040[0-9]{2}$/
        if(rep1.test(error.errcode)){
            location.href = location.origin + '/v2/web/forbidden'
        }else if(rep2.test(error.errcode)){
            location.href = location.origin + '/v2/web/404'
        }
        Raven.captureException(error)
        //新版web
        return Promise.reject(error)
    }else{
        return Promise.reject(error)
    }
}
const errorResponsePost = (error) => {
    if(error.response && (error.response.status === 401) || error.Status === 401) {
        if(location.href.indexOf('teacherLog') !== -1){
            location.href = location.origin + '/web?next=' + location.pathname + '&type=3&share=1'
        }else{
            location.href = location.origin + '/web?next=' + location.pathname + '&type=3'
        }

      return;
    }
    if(error.errcode){
        Raven.captureException(error)
        //新版web
        return Promise.reject(error)
    }else{

        return Promise.reject(error)
    }
}

// 新平台 统计使用
axios.defaults.headers['xtbz'] = 'ykt';
axios.defaults.headers['university-id'] = 0

export default {
    get(url, params) {
        params = params || {}
        let queryString = []

        Object.keys(params).forEach(key => params[key] && queryString.push(`${key}=${params[key]}`))

        if (queryString.length > 0) {
            queryString = queryString.join('&')
            url += `?${queryString}`
        }
        if (process.env.NODE_ENV === 'production') {
            axios.defaults.withCredentials = true;
        }
        return axios
            .get(url)
            .then(function(response, data) {
                return response
            })
            .then(handleResponse)
            .catch(errorResponseGet)
    },

    post(url, params) {
        params = params || {}

        // post统一csrftoken
        axios.defaults.headers['X-CSRFToken'] = Cookies.get('csrftoken') || ''
        if (process.env.NODE_ENV === 'production') {
            axios.defaults.withCredentials = true;
        }
        return axios
            .post(url, params)
            .then(function(response, data) {
                return response
            })
            .then(handleResponse)
            .catch(errorResponsePost)
    }
}



// WEBPACK FOOTER //
// ./src/util/request.js