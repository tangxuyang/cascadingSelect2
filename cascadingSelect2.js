/*-----------------------------------------------------------------------------------------------------------------------------------------------------------------------
1. 插件名称：cascadingSelect2
2. 插件描述：
3. 版本：1.0
4.  对其他插件的依赖：jQuery,jQuery.select2
5. 备注：
6. 未尽事宜：
7. 作者：唐旭阳(tangxuyang.hi@163.com)
-----------------------------------------------------------------------------------------------------------------------------------------------------------------------*/

/*<select id="countryId"></select>
<select id="cityId"></select>
<select id="districtId"></select>
<select id="townId"></select>
<select id="estateId"></select>*/

/*
    optios:{
        dynamic:true,
        selects:[{
            ele:null,//select元素，jQuery选择符,#id
            url:null,//查询接口地址
            paramName:null,//查询的参数字段
            paramNameForNext:null,//带给下个select的查询的参数字段
            selected:function(){},//选中触发的事件
            data:{//附加参数
    
            },
            placeholder:{//
                id:"",
                text:"--请选择--"
            }
        }],
        data:[{//本地数据
            id:1,
            text:"china",
            items:[{
                id:1,
                text:"上海",
                items:[{
                    id:1,
                    text:"浦东",
                    items:[{
                        id:1,
                        text:"花木",
                        items:[{
                            id:1,
                            text:"我的小区"
                        }]
                    }]
                }]
            }]
        }]
    }
*/
+ function() {
    function getDataByLevel(data, level, id, result) {
        if (level === 0) {
            if (data) {
                for (var i = 0; i < data.length; i++) {
                    if (data[i].id == id) {
                        result.push(data[i]);
                    }
                }
            }

            return;
        }
        if (data && data.length > 0) {
            for (var i = 0; i < data.length; i++) {
                if (data[i] && data[i].items) {
                    getDataByLevel(data[i].items, level - 1, id, result);
                }
            }
        }
    }
    $.cascadingSelect2 = function(options) {
        if (!options.data) {//没有本地数据
            $.each(options.selects, function(index, select) { //遍历配置中的selects
                //检查dom，是否有data-value，初始选中值
                var dataValue = $(select.ele).data('value');//
                if( dataValue !== undefined){
                    select.initial = dataValue;
                }

                var localOption = {};                    
                if (options.dynamic) {//每次查询都想remote发送请求
                    localOption = {
                        minimumInputLength: select.minimumInput || 1,
                        ajax: {
                            url: function(params) {
                                var url = select.url;
                                var parentSelect = options.selects[index - 1];
                                if (index > 0) { //非第一个select
                                    if (parentSelect.value === undefined || parentSelect.value === null || parentSelect.value === '') { //如果前一个select的value不为空，把它作为url的一部分
                                        url = select.url;
                                    } else {
                                        url += "?" + options.selects[index - 1].paramNameForNext + "=" + options.selects[index - 1].value;
                                    }
                                }

                                return url;
                            },
                            dataType: select.dataType || 'json',
                            delay: select.delay || 250,
                            data:  typeof select.data === 'function' && select.data || function(params) {
                                var obj = $.extend({}, select.data);
                                obj[select.paramName] = params.term;
                                return obj;
                            },
                            processResults: select.processResults || function(data, params) {
                                params.page = params.page || 1;

                                return {
                                    results: data.items,
                                    pagination: {
                                        more: false,
                                    }
                                }
                            },
                            transport: function(params, success, failure) {
                                if (index > 0 && select.url === params.url) { //如果非第一个select的url跟初始url相同，表示前一个select没有选中，不发请求
                                    return null;
                                }
                                var $request = $.ajax(params);

                                $request.then(success);
                                $request.fail(failure);

                                return $request;
                            },
                        },

                        language: 'zh-CN',
                        placeholder: "--请选择--",
                    };

                    $(select.ele).select2(localOption);
                } else {//数据一次性从remote获取，每次查询只是本地查询
                    if (index == 0) { //第一个select
                        $.ajax({
                            url: select.url,
                            data: select.data,
                            success: function(data) {
                                //处理获取的数据
                                data = select.processResults && select.processResults(data) || data;
                                var $ele = $(select.ele);
                                $.each(data,function(j, item) {
                                    $ele.append("<option value='" + item.id + "' "+(select.initial == item.id?"selected":"")+">" + item.text + "</option>");
                                });
                                $(select.ele).select2({
                                    language:"zh-CN",
                                });

                                delete select.initial;
                                select.ready && select.ready();
                            }
                        });
                    } else {
                        $(select.ele).select2({
                            language:"zh-CN",
                        });
                    }
                }

                $(select.ele).on('change', function() {
                    var val = $(select.ele).val();//选中值
                    var placeholderVal = select.placeholder && select.placeholder.id;
                    select.value = val;

                    //把当前select后面的select都清空
                    for (var i = index + 1; i < options.selects.length; i++) {
                        options.selects[i].value = null;
                        $(options.selects[i].ele).find('option').remove();
                        $(options.selects[i].ele).select2({
                            language:"zh-CN",                            
                            placeholder:select.placeholder
                        });
                    }

                    if (!options.dynamic) {//如果是一次性获取远程数据的配置
                        var nextSelect = options.selects[index + 1];//下一个select
                        if (nextSelect && val != placeholderVal) {//下一个select存在，且选中值不是placeholder，表示选中了有效的值
                            var url = nextSelect.url;

                            if (val === undefined || val === null || val === '') { 
                                url = nextSelect.url;
                            } else {//如果当前select的value不为空，把它作为url的一部分
                                url += "?" + select.paramNameForNext + "=" + select.value;
                            }

                            //发送请求，动态后去下一个select的内容
                            $.ajax({
                                url: url,
                                success: function(data) {  
                                    //加工返回数据                                  
                                    data = nextSelect.processResults && nextSelect.processResults(data) || data;
                                    var $ele = $(nextSelect.ele);
                                    $.each(data,function(j, item) {
                                        $ele.append("<option value='" + item.id + "' "+(nextSelect.initial == item.id?"selected":"")+">" + item.text + "</option>");
                                    });
                                    $ele.select2({
                                        language:"zh-CN",
                                    });

                                    delete nextSelect.initial;
                                    nextSelect.ready && nextSelect.ready();
                                }
                            });
                        }
                    }

                    if (select.value != null && select.value != "") {//选中的值有意义
                        select.selected && select.selected();
                    }
                });
            });

            
        } else { //本地数据
            $.each(options.selects, function(index, select) {
                $(select.ele).select2({
                    data: index === 0 && options.data || null,
                    language: "zh-CN",
                    placeholder: "--请选择--"
                }).on('change', function() {
                    var id = $(select.ele).val();
                    var result = [];
                    getDataByLevel(options.data, index, id, result);
                    if (result.length > 0) {
                        result = result[0].items;
                    }
                    var nextSelect = options.selects[index + 1];
                    if (nextSelect) {
                        $(nextSelect.ele).select2('val', '');
                        $(nextSelect.ele).find('option').remove();
                        $(nextSelect.ele).select2({
                            data: result,
                            language: "zh-CN",
                            placeholder: "--请选择--"
                        });
                        for (var i = index + 2; i < options.selects.length; i++) {
                            $(options.selects[i].ele).select2('val', '');
                            $(options.selects[i].ele).find('option').remove();
                            //$(nextSelect.ele).trigger('change');
                        }
                    }
                });
            });
        }
    };
}(jQuery);
