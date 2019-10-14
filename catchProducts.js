// ==UserScript==
// @name         淘宝和天猫通用店铺商品信息抓取(单页)
// @namespace    http://tampermonkey.net/
// @version      1.0.0
// @description  以img为中心抓取；(目前仅支持大图/图表模式)仅抓取店铺信息，商品主图及搜索条件信息；不抓取略缩图、页面左侧推荐、本店内推荐
// @description  [淘宝] [天猫] [taobao] [tmall]
// @author       Laicy <240298098@qq.com>
// @compatible   chrome
// @include      *.taobao.com/category*
// @include      *.tmall.com/category*
// @include      *.tmall.com/search.htm*
// @include      *.taobao.com/search.htm*
// @require      https://apps.bdimg.com/libs/jquery/2.1.4/jquery.min.js
// @match        https://www.baidu.com/s?ie=UTF-8&wd=%E5%A6%82%E4%BD%95%E5%81%9Ajs%E6%8F%92%E4%BB%B6
// @grant        none
// ==/UserScript==


/**
 * 设置抓取按钮
 * @method
 * @param  string variable 参数名
 * @author Laicy <240298098@qq.com>
 */
(function()
{
    var button = "<a id='catchOK' style='position: fixed;z-index: 101;left: 0;top: 50%;margin-top: -36px;width: 28px;height: 72px;"+
                 "border-top-right-radius: 2px;border-bottom-right-radius: 2px;background-color: #78deaa;transition: all .3s;"+
                 "font-size: 12px;color: #fff;box-shadow: 0 6px 10px 0 rgba(134,253,138,0.4);padding: 8px 7px;line-height: 14px;box-sizing: border-box;"+
                 "text-decoration: none;outline: none;cursor: pointer;'>数据抓取</a>";
    $('body').append(button);
})();

/**
 * 执行抓取(天猫图片使用数据流，需要自动滚动页面)
 * @method
 * @author Laicy <240298098@qq.com>
 */
$('#catchOK').click(function(){
    $(this).css('display','none');
    if (getQueryVariable('viewType') == 'list')
    {
        returnData();
        return false;
    }
    $('html').scrollTop(0);
    var top = $('html').scrollTop();
    var scroll = setInterval(function () {
       if(top < $('.J_TItems').height()) {
           top = top + 50;
           $('html').scrollTop(top);
       }else{
           var data =  getProducts(getSuffix(),getArea());
           returnData(data);
           $('html').scrollTop(0);
           $('#catchOK').css('display','block');
           clearInterval(scroll);
       }
    }, 20);
})

/**
 * 数组转Json字符串并输出提示框
 * @method returnData
 * @param array list 店铺及商品数组
 * @author Laicy <240298098@qq.com>
 */
function returnData(list){
    var msg;
    if (list){
        // 将数组转为格式化JSON字符串并输出在控制台
        var json = JSON.stringify(list, null, "\t");
        console.log(json);
        msg = "抓取成功，请查看控制台\r点击确定可直接下载json文件";
    }else{
        msg = "抓取失败，找不到有效列表";
        alert(msg);
        return false;
    }
    // 确认下载文件
    if (confirm(msg)){
        downLoad("data.json",json);
    };
}

/**
 * 创建下载文件按钮
 * @method downLoad
 * @param string filename 文件名及格式
 * @param string text Json数据
 * @author Laicy <240298098@qq.com>
 */
function downLoad(filename, text) {
      var element = document.createElement('a');
      element.style.display = 'none';
      document.body.appendChild(element);
      element.setAttribute('href', 'data:text/plain;charset=utf-8,' + encodeURIComponent(text));
      element.setAttribute('download', filename);
      element.click();
      document.body.removeChild(element);
}

/**
 * 获取url参数
 * @method getQueryVariable
 * @param  string variable 参数名
 * @author Laicy <240298098@qq.com>
 * @return string
 */
function getQueryVariable(variable)
{
       var query = window.location.search.substring(1);
       var vars = query.split("&");
       for (var i=0;i<vars.length;i++) {
               var pair = vars[i].split("=");
               if(pair[0] == variable){return pair[1];}
       }
       return(false);
}

/**
 * 获取店铺及当前页面主要信息(淘宝)
 * @method getInfoTaobao
 * @author Laicy <240298098@qq.com>
 * @return array
 */
function getInfoTaobao(){
    // 店铺名称(移除回车换行和空格)
       var shopname = String($('.tshop-psm-shop-ww-hover').find('.shop-name').text()).replace(/[\r\n]/g,"").replace(/\ +/g,"");
    // 当前页数
    var pageNo = $(".page-info").html()?$(".page-info").html().split("/")[0]:'0';
    // 总页数
    var pageAll = $(".page-info").html()?$(".page-info").html().split("/")[1]:'0';
    // 获取当前排序类型
    var orderType = getQueryVariable("orderType")?getQueryVariable("orderType"):"coefp_desc";
    // 获取当前价格范围
    var lowPrice = getQueryVariable("lowPrice")?getQueryVariable("lowPrice"):0;
    var highPrice = getQueryVariable("highPrice")?getQueryVariable("highPrice"):100000000;
    // 搜索关键字
    var keyword = getQueryVariable("keyword")?$('.search-form [name="keyword"]').val():"";
    var info = [{
        "shopname"  : shopname,
        "type"      : "taobao",
        "pageNo"    : pageNo,
        "pageAll"   : pageAll,
        "orderType" : orderType,
        "lowPrice"  : lowPrice,
        "highPrice" : highPrice,
        "keyword"   : keyword
    }];
    return info;
}

/**
 * 获取店铺及当前页面主要信息(天猫)
 * @method getInfoTmall
 * @author Laicy <240298098@qq.com>
 * @return array
 */
function getInfoTmall(){
    // 店铺名称(移除回车换行和空格)
    var shopname = $(".slogo-shopname").find("strong").html().replace(/[\r\n]/g,"").replace(/\ +/g, "");
    // 当前页数
    var pageNo = parseInt($(".ui-page-s-len").html().split("/")[0]);
    // 总页数
    var pageAll = parseInt($(".ui-page-s-len").html().split("/")[1]);
    // 获取当前排序类型
    var orderType = getQueryVariable("orderType")?getQueryVariable("orderType"):"defaultSort";
    // 获取当前价格范围
    var lowPrice = getQueryVariable("lowPrice")?parseInt(getQueryVariable("lowPrice")):0;
    var highPrice = getQueryVariable("highPrice")?parseInt(getQueryVariable("highPrice")):100000000;
    // 搜索关键字
    var keyword = getQueryVariable("keyword")?$('.J_TCrumbSearchInuput').val():"";
    // 是否为店铺VIP商品
    var vip = getQueryVariable("vip")=='ture'?ture:false;
    // 将所有信息组合成数组
    var info = [{
        "shopname"  : shopname,
        "type"      : "tmall",
        "pageNo"    : pageNo,
        "pageAll"   : pageAll,
        "orderType" : orderType,
        "lowPrice"  : lowPrice,
        "highPrice" : highPrice,
        "keyword"   : keyword,
        "vip"       : vip
    }];
    return info;
}

/**
 * 根据访问网站设置图片后缀
 * @method getSuffix
 * @author Laicy <240298098@qq.com>
 * @return string
 */
function getSuffix(){
    var url = window.location.href
    ,suffix;
    if (/taobao.com/.test(url)) {
        // 淘宝后缀一般为_240x240.jpg
        suffix = '_240x240.jpg';
    }else if(/tmall.com/.test(url)){
        // 天猫后缀一般为_180x180.jpg
        suffix = '_180x180.jpg';
    }
    return suffix;
}

/**
 * 根据访问网站设置抓取div区域
 * @method getArea
 * @author Laicy <240298098@qq.com>
 * @return object
 */
function getArea(){
    var url = window.location.href
    ,area;
    if (/taobao.com/.test(url)) {
        // 淘宝商品区域
        area = $('.shop-hesper-bd');
    }else if(/tmall.com/.test(url)){
        // 天猫商品区域
        area = $('.J_TItems');
    }
    return area;
}

/**
 * 获取所有商品信息 category和search通用
 * @method getProducts
 * @param  string suffix 图片后缀
 * @param  object area 抓取区域
 * @author Laicy <240298098@qq.com>
 * @return array
 */
function getProducts(suffix,area){
    var url = window.location.href
    // 店铺信息
    ,info;
    // 移除本店内推荐列表
    $('.comboHd').nextAll().remove();
    if (/taobao.com/.test(url)) {
        // 获取店铺及当前搜索条件信息
        info = getInfoTaobao();
    }else if(/tmall.com/.test(url)){
        // 获取店铺及当前搜索条件信息
        info = getInfoTmall();
    }
    // 预设空列表与序号
    var list = {};
    var data = [];
    var id = 0;
    // 统计本页面抓取的数量
    var count = area.find('.item').length;
    console.log("本次共抓取"+count+"条商品信息");
    if (count <= 0){
        return false;
    }
    // 遍历查询
    area.find('img').each(function(index,element){
        // 商品名称
        var title = $(this).attr("alt");
        // 序号自增
        id++;
        // 如果商品名称为空(即商品略缩图)结束本次循环
        if (!title) {
            id--;
            return true;
        }else{
            // 名称非空(即商品主图)
            // 如进行关键字搜索去除span标签
            title = $(this).attr("alt").replace('<span class=H>','').replace('</span>','');
            // 商品图片(移除限制大小的后缀)
            var img = String($(this).attr("src")).replace(suffix,'');
            // 商品价格
            var pric = $(this).parents('dt').siblings('.detail').find('.c-price').html().replace(/[\r\n]/g,"").replace(/\ +/g, "");
            // 商品编号
            var proid = $(this).parents('dl').attr('data-id');
        }
        // 将有效数据加入数组
        // 信息一览：自增序号、商品编号、商品名称、商品图片地址、商品当前价格
        data.push({
            'id':id,
            'proid':proid,
            'title':title,
            'img':img,
            'pric':pric
        });
    })
    // 将两个数组合并为二维数组
    var msg;
    if (info.length > 0 && data.length > 0) {
        list = {"info":info,"data":data};
        return list;
    }else{
        return false;
    }
}