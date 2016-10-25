/*<select id="countryId"></select>
<select id="cityId"></select>
<select id="districtId"></select>
<select id="townId"></select>
<select id="estateId"></select>*/

/*
	options:{
		selects:[{
			ele:null,//select元素，jQuery对象
			url:null,//查询接口地址
			paramName:null,//查询的参数
			paramNameForNext:null,//带给下个select的查询的参数
			selected:function(){},//选中触发的事件
			data:{
	
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
        if (!options.data) {
            $.each(options.selects, function(index, select) { //遍历配置中的selects
                $(select.ele).select2({
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
                        data: typeof select.data === 'function' && select.data || function(params) {
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
                }).on('change', function() {
                    var val = $(select.ele).val();
                    select.value = val;
                    for (var i = index + 1; i < options.selects.length; i++) {
                        options.selects[i].value = null;
                        $(options.selects[i].ele).find('option').remove();
                        $(options.selects[i].ele).trigger('change');
                    }

                    select.selected && select.selected();
                });
            });
        } else { //本地数据
            $.each(options.selects, function(index, select) {                
                $(select.ele).select2({
                    data: index === 0 && options.data || null,
                    language:"zh-CN",
                    placeholder:"--请选择--"                   
                }).on('change', function() {
                    var id = $(select.ele).val();
                    var result = [];
                    getDataByLevel(options.data, index , id, result);
                    if(result.length>0){
                    	result = result[0].items;
                    }
                    var nextSelect = options.selects[index + 1];                                           
                    if (nextSelect) {
                        $(nextSelect.ele).select2('destroy');
                        $(nextSelect.ele).find('option').remove();
                        $(nextSelect.ele).select2({
                            data: result,
                            language:"zh-CN",
                            placeholder:"--请选择--"                   
                        });
                        for(var i = index+2; i < options.selects.length; i++){
                        	$(options.selects[i].ele).find('option').remove();
                        	$(nextSelect.ele).trigger('change');
                        }
                    }
                });
            });
        }
    };
}(jQuery);
