window.T = {
	Timestamp : parseInt((new Date().getTime() / 1000)),
	Storage: function(key, setValue) {
		var getValue = null;
		try {
			if(typeof(setValue) === 'undefined') {
				getValue = window.localStorage.getItem(key);
			} else {
				window.localStorage.setItem(key, setValue.toString());
			}
		} catch (e) { /* Browser not support localStorage function. */ }
			return getValue;
		},
	StorageClear: function(key){
		try {
			if(key == undefined) {
				$.each(window.localStorage, function(key,value){ window.localStorage.removeItem(key); }); 
			} else {
				localStorage.removeItem(key);
			}
		} catch (e) { /* Browser not support localStorage function. */ }
	},
    StateURL: function(){
        return URI.expand("/{Component}"+(State.Module?'/':'')+"{Module}"+(State.StorageName?'/':'')+"{StorageName}/", window.State).toString();
    },
    StateName : function(){
        return  State.Component+(State.Module?'-'+State.Module:'')+(State.StorageName?'-'+State.StorageName:'');
    },
    SetState: function (component, module, item_name) {
        window.State.Component = component || null;
        window.State.Module = module || null;
        window.State.StorageName = item_name || null;
        T.StateCompile();
        return this;
    },
    SetComponent : function(func) {
        if(typeof func == 'function') T.__handle.Component = func;
    },
    SetModule: function (module) { // Event in Click menu in app.
        window.State.Module = module || null;
        T.StateCompile();
        return this;
    },
    SetItems: function (name, value) {
        if(value) T.Storage(name, value);
        window.State.StorageName = item_name || null;
        T.StateCompile();
        return this;
    },
    GetItems: function () {
        return T.Storage(window.State.StorageName);
    },
    StateCompile: function(event){
        var found = T.__handle.Component;
        if(found){
            window.State.Component = window.State.Component || T.Storage('component-default');
            T.__handle.Component(window.State.Component);
        }
        
        console.log('StateCompile::', 'StateName:', T.StateName(), '- GetItems:', T.GetItems(), window.State);
        if(!event) window.history.pushState(T.GetItems(), T.StateName(), T.StateURL());
        if(!found) window.history.replaceState(T.GetItems(), T.StateName(), T.StateURL());

        // if(window.State.Module || window.State.StorageName) {
        //     (function(){
        //         var defer = $.Deferred();
        //         // T.Abort(T.__handle);
        //         // $.ajax({ 
        //         //     url: window.origin + '/component/home/index.php',
        //         //     error: function(){
        //         //         defer.reject();
        //         //     },
        //         //     success: function(data){
        //                  defer.resolve();
        //         //     }
        //         // });
        //         return defer.promise();
        //     })().then(function(){
        //         loader.off();
        //     });
        // }
    }, 
    Abort: function(A){
        if(A != undefined) {
            if(A.readyState != 4 && A.readyState != undefined) A.abort();
        }
    },
    Thread: function(configs) {

    },
    Call: function(configs){
      configs = (typeof configs == 'string' ? { url: configs } : configs) || {};
      var aCall = $.Deferred();
      var _t = Date.now(), _m = md5(_t);
      T.Abort(T.__ajaxCall);
      T.__ajaxCall = $.ajax({
        url: configs.url || '',
        data: configs.data || {},
        headers: { 'X-Requested': _m, 'X-Sign': T.User.username },
        error: function(xhr, e, s){
            console.log('error');
            aCall.resolve(new CallbackException("Call function exception.", s), {});
        },
        success: function(data){ 
            var ex = new CallbackException({ onError: false, exTitle: "Successful", getItems: data });
            if(typeof data == 'object') {
                if(data.onError != undefined) ex = new CallbackException(data);
            }
            aCall.resolve(ex, ex.getItems);
        }
      });
      return aCall.promise();
    },
    HTML: function(e, url){
      console.log('HTML', e, url);
      var aHtml = $.Deferred();
      var _t = Date.now(), _m = md5(_t);
      $.ajax({
        url: '/html/' + url,
        data: { State: window.State },
        dataType: 'HTML',
        headers: { 'X-Requested': _m, 'X-Sign': T.User.username },
        error: function(xhr, ex, s){
            ex = new CallbackException("HTML function exception.", s);
            if($(e).length != 0) {
                $(e).html("HTML function exception.");
                aHtml.resolve(ex);
            } else {
                aHtml.reject(ex);
            }
        },
        success: function(html){ 
            var ex = new CallbackException({ onError: false, exTitle: "", getItems: null });
            if($(e).length != 0) {
                $(e).html(html);
                aHtml.resolve(ex);
            } else {
                aHtml.reject(ex);
            }
        }
      });
      return aHtml.promise();
    },
    Init: function(session){
        var aInit = $.Deferred();

        if(T.Storage('SESSION_CLIENT') == null) T.Storage('SESSION_CLIENT', session);
        $.ajaxSetup({
            dataType: 'JSON', type: 'POST',
            headers: { 'X-Requested-With': 'XMLHttpRequest', 'X-Session-Client': T.Storage('SESSION_CLIENT') || session }
        });

        if(!$.cookie('ACCESS')) {
            $.getScript( "http://l2.io/ip.js?var=myip", function() { $.cookie('ACCESS', md5(myip)); aInit.resolve({ init: true}); });
        } else {
            aInit.resolve({ init: true });
        }
        return aInit.promise();
     },
     User: {},
    __handle: {
        Component: null,
        Module: {},
    },
    __ajaxCall: undefined
}



$.extend(window, {
    CallbackException : function(m1, m2) {
        m1 = m1 || {};
        this.onError = m1.onError || false;
        this.exTitle = m1.exTitle || ((m2!=undefined) ? m1 : undefined) || "Exception";
        this.exMessage = m1.exMessage || m2 || "";
        this.getItems = m1.getItems || {};
        try{
            if(m1.getItems != undefined) this.getItems = jQuery.parseJSON(this.getItems);
        } catch(e) { }
        this.toString = function(){ return this.exTitle + ' >>> ' + this.exMessage; }
    },
    Performance : function(funcName) {
        var EnablePerformance = performance != undefined && MBOS.Browser.Chrome;
        var BeginTime = 0.0, ElapsedTime = 0.0, FinishTime = 0.0;
        var func_name = funcName || "Performance"
        this.Start = function(){
            if(EnablePerformance) {
                var time = new Date().getHours() + ':' + new Date().getMinutes() + ':' + new Date().getSeconds();
                BeginTime = performance.now();
                ElapsedTime = BeginTime;
                if(typeof console != 'undefined') console.log(func_name + "() Performance >>> Starting on " + time);
            }
        }
        this.Check = function(msg){
            if(EnablePerformance) {
                var now = performance.now();
                if(typeof console != 'undefined') console.log((msg == undefined ? func_name + "() elapsed time is" : msg) + "\n\r", (now - ElapsedTime), "ms");
                ElapsedTime = now;
            }
        }
        this.Stop = function(msg){
            if(EnablePerformance) {
               var time = new Date().getHours() + ':' + new Date().getMinutes() + ':' + new Date().getSeconds();
               var now = performance.now();
               FinishTime = now;
               if(typeof console != 'undefined') console.log((msg == undefined ? func_name + "() elapsedtime is" : msg) + "\n\r", (now - ElapsedTime) , "ms (" + ((FinishTime - BeginTime) / 1000).toFixed(2) + " s)");
               if(typeof console != 'undefined') console.log(func_name + "() Performance >>> Stoped on " + time);
               ElapsedTime = performance.now();
            }
        }
        this.toString = function(){ return  func_name + "() elapsedtime is " + ((FinishTime - BeginTime) / 1000).toFixed(2) + " s"; }
    },
//    alert : function(title, msg, cancel) {
//        if(title instanceof CallbackException) {
//            
//        } else {
//            
//        }
//    },
//    confirm : function(title, msg, yes, no) {
//        
//    },
});

$.extend(Number.prototype, {
    toMoney: function () {
        var n = this, c = 2, d = ".", t = ",", s = n < 0 ? "-" : "", i = parseInt(n = Math.abs(+n || 0).toFixed(c)) + "", j = (j = i.length) > 3 ? j % 3 : 0;
        return s + (j ? i.substr(0, j) + t : "") + i.substr(j).replace(/(\d{3})(?=\d)/g, "$1" + t) + (c ? d + Math.abs(n - i).toFixed(c).slice(2) : "");
    }
});

$.extend(String.prototype, {
    toNumber: function () { var n = this, f = n != undefined ? parseFloat(parseFloat(n.replace(/,/g, '')).toFixed(2)) : 0; return (!isNaN(f)) ? f : 0; },
    toBoolean: function () {
        var m = { 'n': false, 'N': false, 'no': false, 'NO': false, 'FALSE': false, 'y': true, 'Y': true, 'false': false, 'yes': true, 'YES': true, 'TRUE': true, 'true': true };
        return (m.hasOwnProperty(this)) ? m[this] : false;
    }
});

var _HandleState = function () { // Event in Refesh page F5 key or Open NewTab. 
    var State = { Component: null, Module: null, StorageName: null, StorageItems: null }
    var getState = new RegExp(document.domain + '.*?\/([^\/]*)\/*([^\/]*)\/*([^\/]*)\/*([^\/]*)\/*', 'ig');
    getState = getState.exec(location.href);
    State.Component = getState[1] || null;
    State.Module = getState[2] || null;
    State.StorageName = getState[3] || null;
    return State;
};