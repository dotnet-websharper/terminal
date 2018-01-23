// $begin{copyright}
//
// This file is part of WebSharper
//
// Copyright (c) 2008-2016 IntelliFactory
//
// Licensed under the Apache License, Version 2.0 (the "License"); you
// may not use this file except in compliance with the License.  You may
// obtain a copy of the License at
//
//     http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or
// implied.  See the License for the specific language governing
// permissions and limitations under the License.
//
// $end{copyright}

IntelliFactory = {
    Runtime: {
        Ctor: function (ctor, typeFunction) {
            ctor.prototype = typeFunction.prototype;
            return ctor;
        },

        Cctor: function (cctor) {
            var init = true;
            return function () {
                if (init) {
                    init = false;
                    cctor();
                }
            };
        },

        Class: function (members, base, statics) {
            var proto = members;
            if (base) {
                proto = new base();
                for (var m in members) { proto[m] = members[m] }
            }
            var typeFunction = function (copyFrom) {
                if (copyFrom) {
                    for (var f in copyFrom) { this[f] = copyFrom[f] }
                }
            }
            typeFunction.prototype = proto;
            if (statics) {
                for (var f in statics) { typeFunction[f] = statics[f] }
            }
            return typeFunction;
        },

        Clone: function (obj) {
            var res = {};
            for (var p in obj) { res[p] = obj[p] }
            return res;
        },

        NewObject:
            function (kv) {
                var o = {};
                for (var i = 0; i < kv.length; i++) {
                    o[kv[i][0]] = kv[i][1];
                }
                return o;
            },

        DeleteEmptyFields:
            function (obj, fields) {
                for (var i = 0; i < fields.length; i++) {
                    var f = fields[i];
                    if (obj[f] === void (0)) { delete obj[f]; }
                }
                return obj;
            },

        GetOptional:
            function (value) {
                return (value === void (0)) ? null : { $: 1, $0: value };
            },

        SetOptional:
            function (obj, field, value) {
                if (value) {
                    obj[field] = value.$0;
                } else {
                    delete obj[field];
                }
            },

        SetOrDelete:
            function (obj, field, value) {
                if (value === void (0)) {
                    delete obj[field];
                } else {
                    obj[field] = value;
                }
            },

        Apply: function (f, obj, args) {
            return f.apply(obj, args);
        },

        Bind: function (f, obj) {
            return function () { return f.apply(this, arguments) };
        },

        CreateFuncWithArgs: function (f) {
            return function () { return f(Array.prototype.slice.call(arguments)) };
        },

        CreateFuncWithOnlyThis: function (f) {
            return function () { return f(this) };
        },

        CreateFuncWithThis: function (f) {
            return function () { return f(this).apply(null, arguments) };
        },

        CreateFuncWithThisArgs: function (f) {
            return function () { return f(this)(Array.prototype.slice.call(arguments)) };
        },

        CreateFuncWithRest: function (length, f) {
            return function () { return f(Array.prototype.slice.call(arguments, 0, length).concat([Array.prototype.slice.call(arguments, length)])) };
        },

        CreateFuncWithArgsRest: function (length, f) {
            return function () { return f([Array.prototype.slice.call(arguments, 0, length), Array.prototype.slice.call(arguments, length)]) };
        },

        BindDelegate: function (func, obj) {
            var res = func.bind(obj);
            res.$Func = func;
            res.$Target = obj;
            return res;
        },

        CreateDelegate: function (invokes) {
            if (invokes.length == 0) return null;
            if (invokes.length == 1) return invokes[0];
            var del = function () {
                var res;
                for (var i = 0; i < invokes.length; i++) {
                    res = invokes[i].apply(null, arguments);
                }
                return res;
            };
            del.$Invokes = invokes;
            return del;
        },

        CombineDelegates: function (dels) {
            var invokes = [];
            for (var i = 0; i < dels.length; i++) {
                var del = dels[i];
                if (del) {
                    if ("$Invokes" in del)
                        invokes = invokes.concat(del.$Invokes);
                    else
                        invokes.push(del);
                }
            }
            return IntelliFactory.Runtime.CreateDelegate(invokes);
        },

        DelegateEqual: function (d1, d2) {
            if (d1 === d2) return true;
            if (d1 == null || d2 == null) return false;
            var i1 = d1.$Invokes || [d1];
            var i2 = d2.$Invokes || [d2];
            if (i1.length != i2.length) return false;
            for (var i = 0; i < i1.length; i++) {
                var e1 = i1[i];
                var e2 = i2[i];
                if (!(e1 === e2 || ("$Func" in e1 && "$Func" in e2 && e1.$Func === e2.$Func && e1.$Target == e2.$Target)))
                    return false;
            }
            return true;
        },

        ThisFunc: function (d) {
            return function () {
                var args = Array.prototype.slice.call(arguments);
                args.unshift(this);
                return d.apply(null, args);
            };
        },

        ThisFuncOut: function (f) {
            return function () {
                var args = Array.prototype.slice.call(arguments);
                return f.apply(args.shift(), args);
            };
        },

        ParamsFunc: function (length, d) {
            return function () {
                var args = Array.prototype.slice.call(arguments);
                return d.apply(null, args.slice(0, length).concat([args.slice(length)]));
            };
        },

        ParamsFuncOut: function (length, f) {
            return function () {
                var args = Array.prototype.slice.call(arguments);
                return f.apply(null, args.slice(0, length).concat(args[length]));
            };
        },

        ThisParamsFunc: function (length, d) {
            return function () {
                var args = Array.prototype.slice.call(arguments);
                args.unshift(this);
                return d.apply(null, args.slice(0, length + 1).concat([args.slice(length + 1)]));
            };
        },

        ThisParamsFuncOut: function (length, f) {
            return function () {
                var args = Array.prototype.slice.call(arguments);
                return f.apply(args.shift(), args.slice(0, length).concat(args[length]));
            };
        },

        Curried: function (f, n, args) {
            args = args || [];
            return function (a) {
                var allArgs = args.concat([a === void (0) ? null : a]);
                if (n == 1)
                    return f.apply(null, allArgs);
                if (n == 2)
                    return function (a) { return f.apply(null, allArgs.concat([a === void (0) ? null : a])); }
                return IntelliFactory.Runtime.Curried(f, n - 1, allArgs);
            }
        },

        Curried2: function (f) {
            return function (a) { return function (b) { return f(a, b); } }
        },

        Curried3: function (f) {
            return function (a) { return function (b) { return function (c) { return f(a, b, c); } } }
        },

        UnionByType: function (types, value, optional) {
            var vt = typeof value;
            for (var i = 0; i < types.length; i++) {
                var t = types[i];
                if (typeof t == "number") {
                    if (Array.isArray(value) && (t == 0 || value.length == t)) {
                        return { $: i, $0: value };
                    }
                } else {
                    if (t == vt) {
                        return { $: i, $0: value };
                    }
                }
            }
            if (!optional) {
                throw new Error("Type not expected for creating Choice value.");
            }
        },

        OnLoad:
            function (f) {
                if (!("load" in this)) {
                    this.load = [];
                }
                this.load.push(f);
            },

        Start:
            function () {
                function run(c) {
                    for (var i = 0; i < c.length; i++) {
                        c[i]();
                    }
                }
                if ("load" in this) {
                    run(this.load);
                    this.load = [];
                }
            },
    }
}

IntelliFactory.Runtime.OnLoad(function () {
    if (window.WebSharper && WebSharper.Activator && WebSharper.Activator.Activate)
        WebSharper.Activator.Activate()
});

// Polyfill

if (!Date.now) {
    Date.now = function now() {
        return new Date().getTime();
    };
}

if (!Math.trunc) {
    Math.trunc = function (x) {
        return x < 0 ? Math.ceil(x) : Math.floor(x);
    }
}

function ignore() { };
function id(x) { return x };
function fst(x) { return x[0] };
function snd(x) { return x[1] };
function trd(x) { return x[2] };

if (!console) {
    console = {
        count: ignore,
        dir: ignore,
        error: ignore,
        group: ignore,
        groupEnd: ignore,
        info: ignore,
        log: ignore,
        profile: ignore,
        profileEnd: ignore,
        time: ignore,
        timeEnd: ignore,
        trace: ignore,
        warn: ignore
    }
};
(function () {
    var lastTime = 0;
    var vendors = ['webkit', 'moz'];
    for (var x = 0; x < vendors.length && !window.requestAnimationFrame; ++x) {
        window.requestAnimationFrame = window[vendors[x] + 'RequestAnimationFrame'];
        window.cancelAnimationFrame =
          window[vendors[x] + 'CancelAnimationFrame'] || window[vendors[x] + 'CancelRequestAnimationFrame'];
    }

    if (!window.requestAnimationFrame)
        window.requestAnimationFrame = function (callback, element) {
            var currTime = new Date().getTime();
            var timeToCall = Math.max(0, 16 - (currTime - lastTime));
            var id = window.setTimeout(function () { callback(currTime + timeToCall); },
              timeToCall);
            lastTime = currTime + timeToCall;
            return id;
        };

    if (!window.cancelAnimationFrame)
        window.cancelAnimationFrame = function (id) {
            clearTimeout(id);
        };
}());
;
(function()
{
 "use strict";
 var WebSharperTerminalSample,Client,SC$1,WebSharper,Operators,UI,Next,Var,List,T,Arrays,AttrProxy,WebSharperTerminalSample_Templates,Snap,Abbrev,Fresh,AttrModule,Array,JavaScript,JSModule,Pervasives,Doc,Numeric,Attrs,Unchecked,DomUtility,SC$2,Enumerator,SC$3,Collections,Dictionary,Docs,SC$4,Mailbox,View,T$1,SC$5,Slice,Strings,Seq,HashSet,DocElemNode,Client$1,Docs$1,RunState,NodeSet,An,CheckedInput,Elt,DictionaryUtil,Attrs$1,Dyn,Concurrency,Anims,AppendList,String,Updates,SC$6,SC$7,HashSet$1,Char,DynamicAttrNode,Scheduler,CancellationTokenSource,Easing,OperationCanceledException,HashSetUtil,SC$8,Lazy,DomNodes,Queue,IntelliFactory,Runtime,console,$,String$1,Node,Date;
 WebSharperTerminalSample=window.WebSharperTerminalSample=window.WebSharperTerminalSample||{};
 Client=WebSharperTerminalSample.Client=WebSharperTerminalSample.Client||{};
 SC$1=window.StartupCode$WebSharperTerminalSample$Client=window.StartupCode$WebSharperTerminalSample$Client||{};
 WebSharper=window.WebSharper=window.WebSharper||{};
 Operators=WebSharper.Operators=WebSharper.Operators||{};
 UI=WebSharper.UI=WebSharper.UI||{};
 Next=UI.Next=UI.Next||{};
 Var=Next.Var=Next.Var||{};
 List=WebSharper.List=WebSharper.List||{};
 T=List.T=List.T||{};
 Arrays=WebSharper.Arrays=WebSharper.Arrays||{};
 AttrProxy=Next.AttrProxy=Next.AttrProxy||{};
 WebSharperTerminalSample_Templates=window.WebSharperTerminalSample_Templates=window.WebSharperTerminalSample_Templates||{};
 Snap=Next.Snap=Next.Snap||{};
 Abbrev=Next.Abbrev=Next.Abbrev||{};
 Fresh=Abbrev.Fresh=Abbrev.Fresh||{};
 AttrModule=Next.AttrModule=Next.AttrModule||{};
 Array=Next.Array=Next.Array||{};
 JavaScript=WebSharper.JavaScript=WebSharper.JavaScript||{};
 JSModule=JavaScript.JSModule=JavaScript.JSModule||{};
 Pervasives=JavaScript.Pervasives=JavaScript.Pervasives||{};
 Doc=Next.Doc=Next.Doc||{};
 Numeric=WebSharper.Numeric=WebSharper.Numeric||{};
 Attrs=Next.Attrs=Next.Attrs||{};
 Unchecked=WebSharper.Unchecked=WebSharper.Unchecked||{};
 DomUtility=Next.DomUtility=Next.DomUtility||{};
 SC$2=window.StartupCode$WebSharper_UI_Next$Abbrev=window.StartupCode$WebSharper_UI_Next$Abbrev||{};
 Enumerator=WebSharper.Enumerator=WebSharper.Enumerator||{};
 SC$3=window.StartupCode$WebSharper_UI_Next$Attr_Client=window.StartupCode$WebSharper_UI_Next$Attr_Client||{};
 Collections=WebSharper.Collections=WebSharper.Collections||{};
 Dictionary=Collections.Dictionary=Collections.Dictionary||{};
 Docs=Next.Docs=Next.Docs||{};
 SC$4=window.StartupCode$WebSharper_UI_Next$DomUtility=window.StartupCode$WebSharper_UI_Next$DomUtility||{};
 Mailbox=Abbrev.Mailbox=Abbrev.Mailbox||{};
 View=Next.View=Next.View||{};
 T$1=Enumerator.T=Enumerator.T||{};
 SC$5=window.StartupCode$WebSharper_UI_Next$Doc_Client=window.StartupCode$WebSharper_UI_Next$Doc_Client||{};
 Slice=WebSharper.Slice=WebSharper.Slice||{};
 Strings=WebSharper.Strings=WebSharper.Strings||{};
 Seq=WebSharper.Seq=WebSharper.Seq||{};
 HashSet=Collections.HashSet=Collections.HashSet||{};
 DocElemNode=Next.DocElemNode=Next.DocElemNode||{};
 Client$1=Next.Client=Next.Client||{};
 Docs$1=Client$1.Docs=Client$1.Docs||{};
 RunState=Docs$1.RunState=Docs$1.RunState||{};
 NodeSet=Docs$1.NodeSet=Docs$1.NodeSet||{};
 An=Next.An=Next.An||{};
 CheckedInput=Next.CheckedInput=Next.CheckedInput||{};
 Elt=Next.Elt=Next.Elt||{};
 DictionaryUtil=Collections.DictionaryUtil=Collections.DictionaryUtil||{};
 Attrs$1=Client$1.Attrs=Client$1.Attrs||{};
 Dyn=Attrs$1.Dyn=Attrs$1.Dyn||{};
 Concurrency=WebSharper.Concurrency=WebSharper.Concurrency||{};
 Anims=Next.Anims=Next.Anims||{};
 AppendList=Next.AppendList=Next.AppendList||{};
 String=Next.String=Next.String||{};
 Updates=Next.Updates=Next.Updates||{};
 SC$6=window.StartupCode$WebSharper_Main$Concurrency=window.StartupCode$WebSharper_Main$Concurrency||{};
 SC$7=window.StartupCode$WebSharper_UI_Next$Animation=window.StartupCode$WebSharper_UI_Next$Animation||{};
 HashSet$1=Abbrev.HashSet=Abbrev.HashSet||{};
 Char=WebSharper.Char=WebSharper.Char||{};
 DynamicAttrNode=Next.DynamicAttrNode=Next.DynamicAttrNode||{};
 Scheduler=Concurrency.Scheduler=Concurrency.Scheduler||{};
 CancellationTokenSource=WebSharper.CancellationTokenSource=WebSharper.CancellationTokenSource||{};
 Easing=Next.Easing=Next.Easing||{};
 OperationCanceledException=WebSharper.OperationCanceledException=WebSharper.OperationCanceledException||{};
 HashSetUtil=Collections.HashSetUtil=Collections.HashSetUtil||{};
 SC$8=window.StartupCode$WebSharper_UI_Next$AppendList=window.StartupCode$WebSharper_UI_Next$AppendList||{};
 Lazy=WebSharper.Lazy=WebSharper.Lazy||{};
 DomNodes=Docs$1.DomNodes=Docs$1.DomNodes||{};
 Queue=WebSharper.Queue=WebSharper.Queue||{};
 IntelliFactory=window.IntelliFactory;
 Runtime=IntelliFactory&&IntelliFactory.Runtime;
 console=window.console;
 $=window.jQuery;
 String$1=window.String;
 Node=window.Node;
 Date=window.Date;
 Client.Main=function()
 {
  SC$1.$cctor();
  return SC$1.Main;
 };
 Client.Help=function(command)
 {
  return command==="help"?{
   $:1,
   $0:null
  }:null;
 };
 Client.Template=function(command)
 {
  return command==="template"?{
   $:1,
   $0:null
  }:null;
 };
 Client.set_numOfTemplates=function($1)
 {
  SC$1.$cctor();
  SC$1.numOfTemplates=$1;
 };
 Client.numOfTemplates=function()
 {
  SC$1.$cctor();
  return SC$1.numOfTemplates;
 };
 Client.onDownload=function(pName,a,a$1)
 {
  window.alert(pName.RVal());
 };
 Client.Clear=function(command)
 {
  return command==="clear"?{
   $:1,
   $0:null
  }:null;
 };
 Client.Switch=function(command)
 {
  return command==="switch"?{
   $:1,
   $0:null
  }:null;
 };
 Client.i2=function(_this,command)
 {
  if(command==="asd")
   _this.echo("kek");
  else
   if(command==="switch")
    _this.pop();
   else
    _this.echo("...");
 };
 Client.intOpt=function()
 {
  SC$1.$cctor();
  return SC$1.intOpt;
 };
 Client.Blank=function(command)
 {
  return command===""?{
   $:1,
   $0:null
  }:null;
 };
 Client.interpreter=function()
 {
  SC$1.$cctor();
  return SC$1.interpreter;
 };
 Client.Opt=function()
 {
  SC$1.$cctor();
  return SC$1.Opt;
 };
 SC$1.$cctor=Runtime.Cctor(function()
 {
  var r,r$1,interpreter,options;
  SC$1.intOpt=(r={},r.name="No2",r.prompt="+ ",r);
  SC$1.numOfTemplates=0;
  SC$1.interpreter=function(command)
  {
   var $1,$2,id,rvProjName,html,t,D,$3,$4,$5;
   return($1=Client.Help(command),$1!=null&&$1.$==1)?this.echo("Commands: help, clear, template"):($2=Client.Template(command),$2!=null&&$2.$==1)?(Client.set_numOfTemplates(Client.numOfTemplates()+1),id="template"+window.String(Client.numOfTemplates()),rvProjName=Var.Create$1(""),html=WebSharperTerminalSample_Templates.form((D=function(a,a$1)
   {
    return Client.onDownload(rvProjName,a,a$1);
   },new T({
    $:1,
    $0:{
     $:4,
     $0:"download",
     $1:function($6)
     {
      return function($7)
      {
       return D($6,$7);
      };
     }
    },
    $1:(t=new T({
     $:1,
     $0:{
      $:6,
      $0:"projname",
      $1:rvProjName
     },
     $1:T.Empty
    }),new T({
     $:1,
     $0:{
      $:3,
      $0:"eventprop",
      $1:AttrProxy.Concat(List.ofArray([AttrModule.Handler("keypress",function()
      {
       return function(ev)
       {
        return ev.stopPropagation();
       };
      }),AttrModule.Handler("keydown",function()
      {
       return function(ev)
       {
        return ev.stopPropagation();
       };
      }),AttrModule.Handler("keyup",function()
      {
       return function(ev)
       {
        return ev.stopPropagation();
       };
      }),AttrModule.Handler("input",function()
      {
       return function(ev)
       {
        return ev.stopPropagation();
       };
      })]))
     },
     $1:t
    }))
   }))),this.echo("<div id=\""+id+"\"></div>",{
    raw:true
   }),Doc.RunById(id,html)):($3=Client.Clear(command),$3!=null&&$3.$==1)?this.clear():($4=Client.Switch(command),$4!=null&&$4.$==1)?this.push(function(c)
   {
    return Client.i2(this,c);
   },Client.intOpt()):($5=Client.Blank(command),$5!=null&&$5.$==1)?this.echo(""):this.echo("Unknown command",{
    raw:true
   });
  };
  SC$1.Opt=(r$1={},r$1.name="Terminal1",r$1.prompt="> ",r$1.greetings="Welcome to the Terminal Test Page! See 'help' for the list of commands.",r$1.onInit=function(t)
  {
   t.enable();
   return t.echo("Hey Dood, it's workin'!");
  },r$1);
  SC$1.Main=(interpreter=Client.interpreter(),(options=Client.Opt(),void window.$("#body").terminal(interpreter,options)));
  SC$1.$cctor=window.ignore;
 });
 Operators.FailWith=function(msg)
 {
  throw window.Error(msg);
 };
 Operators.KeyValue=function(kvp)
 {
  return[kvp.K,kvp.V];
 };
 Var.Create$1=function(v)
 {
  var _var;
  _var=null;
  _var=Var.New(false,v,Snap.New({
   $:2,
   $0:v,
   $1:[]
  }),Fresh.Int(),function()
  {
   return _var.s;
  });
  return _var;
 };
 Var.Set=function(_var,value)
 {
  if(_var.o)
   (function($1)
   {
    return $1("WebSharper UI.Next: invalid attempt to change value of a Var after calling SetFinal");
   }(function(s)
   {
    console.log(s);
   }));
  else
   {
    Snap.Obsolete(_var.s);
    _var.c=value;
    _var.s=Snap.New({
     $:2,
     $0:value,
     $1:[]
    });
   }
 };
 T=List.T=Runtime.Class({
  GetEnumerator:function()
  {
   return new T$1.New(this,null,function(e)
   {
    var m;
    m=e.s;
    return m.$==0?false:(e.c=m.$0,e.s=m.$1,true);
   },void 0);
  },
  GetEnumerator0:function()
  {
   return Enumerator.Get(this);
  }
 },null,T);
 T.Empty=new T({
  $:0
 });
 Arrays.get=function(arr,n)
 {
  Arrays.checkBounds(arr,n);
  return arr[n];
 };
 Arrays.length=function(arr)
 {
  return arr.dims===2?arr.length*arr.length:arr.length;
 };
 Arrays.checkBounds=function(arr,n)
 {
  if(n<0||n>=arr.length)
   Operators.FailWith("Index was outside the bounds of the array.");
 };
 Arrays.set=function(arr,n,x)
 {
  Arrays.checkBounds(arr,n);
  arr[n]=x;
 };
 List.ofArray=function(arr)
 {
  var r,i,$1;
  r=T.Empty;
  for(i=Arrays.length(arr)-1,$1=0;i>=$1;i--)r=new T({
   $:1,
   $0:Arrays.get(arr,i),
   $1:r
  });
  return r;
 };
 List.head=function(l)
 {
  return l.$==1?l.$0:List.listEmpty();
 };
 List.tail=function(l)
 {
  return l.$==1?l.$1:List.listEmpty();
 };
 List.listEmpty=function()
 {
  return Operators.FailWith("The input list was empty.");
 };
 AttrProxy=Next.AttrProxy=Runtime.Class({},null,AttrProxy);
 AttrProxy.Concat=function(xs)
 {
  var x;
  x=Array.ofSeqNonCopying(xs);
  return Array.TreeReduce(Attrs.EmptyAttr(),AttrProxy.Append,x);
 };
 AttrProxy.Append=function(a,b)
 {
  return Attrs.AppendTree(a,b);
 };
 AttrProxy.Create=function(name,value)
 {
  return Attrs.Static(function(el)
  {
   DomUtility.SetAttr(el,name,value);
  });
 };
 WebSharperTerminalSample_Templates.form=function(h)
 {
  return h?Doc.GetOrLoadTemplate("template",{
   $:1,
   $0:"form"
  },function()
  {
   return $.parseHTML("<div class=\"form-class\">\r\n    <input type=\"text\" id=\"sample1\" placeholder=\"MyProject\" ws-var=\"ProjName\" ws-attr=\"EventProp\">\r\n    <div class=\"mdl-selectfield mdl-js-selectfield is-dirty\" id=\"plainSelect\" data-upgraded=\",MaterialSelectfield\">\r\n                            <select id=\"myselect\" name=\"myselect\" class=\"mdl-selectfield__select\" style=\"opacity: 0; z-index: -1;\">\r\n                                <option value=\"clientserverfsharp\">Client-Server Application F#\r\n                                <option value=\"spafsharp\">Single Page Application F#\r\n                                <option value=\"extensionfsharp\">Extension F#\r\n                                <option value=\"libraryfsharp\">Library F#\r\n                                <option value=\"offlinefsharp\">HTML Application F#\r\n                                <option value=\"owinfsharp\">Owin F#\r\n                                <option value=\"clientserverfsharp\">Client-Server Application C#\r\n                                <option value=\"spacsharp\">Single Page Application C#\r\n                                <option value=\"librarycsharp\">Library C#\r\n                                <option value=\"offlinecsharp\">HTML Application C#\r\n                            </select>\r\n                            <label class=\"mdl-selectfield__label\" for=\"myselect\">Available templates</label>\r\n                        <div class=\"mdl-selectfield__box\" tabindex=\"1\"><span tabindex=\"-1\" class=\"mdl-selectfield__arrow-down__container\"><span class=\"mdl-selectfield__arrow-down\" tabindex=\"-1\"></span></span><span class=\"mdl-selectfield__box-value\" tabindex=\"-1\">Client-Server Application F#\r\n                                </span></div><div class=\"mdl-selectfield__list-option-box\" tabindex=\"-1\"><ul tabindex=\"-1\"><li class=\"is-selected\" data-value=\"0\" tabindex=\"-1\">Client-Server Application F#\r\n                                </li><li class=\"\" data-value=\"1\" tabindex=\"-1\">Single Page Application F#\r\n                                </li><li class=\"\" data-value=\"2\" tabindex=\"-1\">Extension F#\r\n                                </li><li class=\"\" data-value=\"3\" tabindex=\"-1\">Library F#\r\n                                </li><li class=\"\" data-value=\"4\" tabindex=\"-1\">HTML Application F#\r\n                                </li><li class=\"\" data-value=\"5\" tabindex=\"-1\">Owin F#\r\n                                </li><li class=\"\" data-value=\"6\" tabindex=\"-1\">Client-Server Application C#\r\n                                </li><li class=\"\" data-value=\"7\" tabindex=\"-1\">Single Page Application C#\r\n                                </li><li class=\"\" data-value=\"8\" tabindex=\"-1\">Library C#\r\n                                </li><li class=\"\" data-value=\"9\" tabindex=\"-1\">HTML Application C#\r\n                            </li></ul></div></div>\r\n\r\n    <div class=\"mdl-selectfield mdl-js-selectfield is-dirty\" id=\"plainIdeSelect\" data-upgraded=\",MaterialSelectfield\">\r\n                            <select id=\"myselect\" name=\"myselect\" class=\"mdl-selectfield__select\" style=\"opacity: 0; z-index: -1;\">\r\n                                <option value=\"vs2017\">Visual Studio 2017\r\n                            </select>\r\n                            <label class=\"mdl-selectfield__label\" for=\"myselect\">Your IDE</label>\r\n                        <div class=\"mdl-selectfield__box\" tabindex=\"1\"><span tabindex=\"-1\" class=\"mdl-selectfield__arrow-down__container\"><span class=\"mdl-selectfield__arrow-down\" tabindex=\"-1\"></span></span><span class=\"mdl-selectfield__box-value\" tabindex=\"-1\">Visual Studio 2017\r\n                            </span></div><div class=\"mdl-selectfield__list-option-box\" tabindex=\"-1\"><ul tabindex=\"-1\"><li class=\"is-selected\" data-value=\"0\" tabindex=\"-1\">Visual Studio 2017\r\n                            </li></ul></div></div>\r\n\r\n    <div class=\"social-button-group\">\r\n                            <button class=\"mdl-button mdl-js-button mdl-button--raised mdl-button--colored dl-button\" data-upgraded=\",MaterialButton\" ws-onclick=\"Download\">\r\n                                Download\r\n                            </button>\r\n                        </div>\r\n</div>");
  },h):Doc.PrepareTemplate("template",{
   $:1,
   $0:"form"
  },function()
  {
   return $.parseHTML("<div class=\"form-class\">\r\n    <input type=\"text\" id=\"sample1\" placeholder=\"MyProject\" ws-var=\"ProjName\" ws-attr=\"EventProp\">\r\n    <div class=\"mdl-selectfield mdl-js-selectfield is-dirty\" id=\"plainSelect\" data-upgraded=\",MaterialSelectfield\">\r\n                            <select id=\"myselect\" name=\"myselect\" class=\"mdl-selectfield__select\" style=\"opacity: 0; z-index: -1;\">\r\n                                <option value=\"clientserverfsharp\">Client-Server Application F#\r\n                                <option value=\"spafsharp\">Single Page Application F#\r\n                                <option value=\"extensionfsharp\">Extension F#\r\n                                <option value=\"libraryfsharp\">Library F#\r\n                                <option value=\"offlinefsharp\">HTML Application F#\r\n                                <option value=\"owinfsharp\">Owin F#\r\n                                <option value=\"clientserverfsharp\">Client-Server Application C#\r\n                                <option value=\"spacsharp\">Single Page Application C#\r\n                                <option value=\"librarycsharp\">Library C#\r\n                                <option value=\"offlinecsharp\">HTML Application C#\r\n                            </select>\r\n                            <label class=\"mdl-selectfield__label\" for=\"myselect\">Available templates</label>\r\n                        <div class=\"mdl-selectfield__box\" tabindex=\"1\"><span tabindex=\"-1\" class=\"mdl-selectfield__arrow-down__container\"><span class=\"mdl-selectfield__arrow-down\" tabindex=\"-1\"></span></span><span class=\"mdl-selectfield__box-value\" tabindex=\"-1\">Client-Server Application F#\r\n                                </span></div><div class=\"mdl-selectfield__list-option-box\" tabindex=\"-1\"><ul tabindex=\"-1\"><li class=\"is-selected\" data-value=\"0\" tabindex=\"-1\">Client-Server Application F#\r\n                                </li><li class=\"\" data-value=\"1\" tabindex=\"-1\">Single Page Application F#\r\n                                </li><li class=\"\" data-value=\"2\" tabindex=\"-1\">Extension F#\r\n                                </li><li class=\"\" data-value=\"3\" tabindex=\"-1\">Library F#\r\n                                </li><li class=\"\" data-value=\"4\" tabindex=\"-1\">HTML Application F#\r\n                                </li><li class=\"\" data-value=\"5\" tabindex=\"-1\">Owin F#\r\n                                </li><li class=\"\" data-value=\"6\" tabindex=\"-1\">Client-Server Application C#\r\n                                </li><li class=\"\" data-value=\"7\" tabindex=\"-1\">Single Page Application C#\r\n                                </li><li class=\"\" data-value=\"8\" tabindex=\"-1\">Library C#\r\n                                </li><li class=\"\" data-value=\"9\" tabindex=\"-1\">HTML Application C#\r\n                            </li></ul></div></div>\r\n\r\n    <div class=\"mdl-selectfield mdl-js-selectfield is-dirty\" id=\"plainIdeSelect\" data-upgraded=\",MaterialSelectfield\">\r\n                            <select id=\"myselect\" name=\"myselect\" class=\"mdl-selectfield__select\" style=\"opacity: 0; z-index: -1;\">\r\n                                <option value=\"vs2017\">Visual Studio 2017\r\n                            </select>\r\n                            <label class=\"mdl-selectfield__label\" for=\"myselect\">Your IDE</label>\r\n                        <div class=\"mdl-selectfield__box\" tabindex=\"1\"><span tabindex=\"-1\" class=\"mdl-selectfield__arrow-down__container\"><span class=\"mdl-selectfield__arrow-down\" tabindex=\"-1\"></span></span><span class=\"mdl-selectfield__box-value\" tabindex=\"-1\">Visual Studio 2017\r\n                            </span></div><div class=\"mdl-selectfield__list-option-box\" tabindex=\"-1\"><ul tabindex=\"-1\"><li class=\"is-selected\" data-value=\"0\" tabindex=\"-1\">Visual Studio 2017\r\n                            </li></ul></div></div>\r\n\r\n    <div class=\"social-button-group\">\r\n                            <button class=\"mdl-button mdl-js-button mdl-button--raised mdl-button--colored dl-button\" data-upgraded=\",MaterialButton\" ws-onclick=\"Download\">\r\n                                Download\r\n                            </button>\r\n                        </div>\r\n</div>");
  });
 };
 Var=Next.Var=Runtime.Class({
  RVal:function()
  {
   return this.c;
  },
  RView:function()
  {
   return this.v;
  },
  set_RVal:function(v)
  {
   Var.Set(this,v);
  },
  RUpdM:function(f)
  {
   var m;
   m=f(this.c);
   m!=null&&m.$==1?Var.Set(this,m.$0):void 0;
  }
 },null,Var);
 Var.New=function(Const,Current,Snap$1,Id,VarView)
 {
  return new Var({
   o:Const,
   c:Current,
   s:Snap$1,
   i:Id,
   v:VarView
  });
 };
 Snap.WhenRun=function(snap,avail,obs)
 {
  var m;
  m=snap.s;
  m==null?obs():m!=null&&m.$==2?(m.$1.push(obs),avail(m.$0)):m!=null&&m.$==3?(m.$0.push(avail),m.$1.push(obs)):avail(m.$0);
 };
 Snap.Map=function(fn,sn)
 {
  var m,res;
  m=sn.s;
  return m!=null&&m.$==0?Snap.New({
   $:0,
   $0:fn(m.$0)
  }):(res=Snap.New({
   $:3,
   $0:[],
   $1:[]
  }),(Snap.When(sn,function(a)
  {
   Snap.MarkDone(res,sn,fn(a));
  },res),res));
 };
 Snap.Map3=function(fn,sn1,sn2,sn3)
 {
  var $1,$2,$3,res;
  function cont(a)
  {
   var m,$4,$5,$6;
   if(!(m=res.s,m!=null&&m.$==0||m!=null&&m.$==2&&true))
    {
     $4=Snap.ValueAndForever(sn1);
     $5=Snap.ValueAndForever(sn2);
     $6=Snap.ValueAndForever(sn3);
     $4!=null&&$4.$==1?$5!=null&&$5.$==1?$6!=null&&$6.$==1?$4.$0[1]&&$5.$0[1]&&$6.$0[1]?Snap.MarkForever(res,fn($4.$0[0],$5.$0[0],$6.$0[0])):Snap.MarkReady(res,fn($4.$0[0],$5.$0[0],$6.$0[0])):void 0:void 0:void 0;
    }
  }
  $1=sn1.s;
  $2=sn2.s;
  $3=sn3.s;
  return $1!=null&&$1.$==0?$2!=null&&$2.$==0?$3!=null&&$3.$==0?Snap.New({
   $:0,
   $0:fn($1.$0,$2.$0,$3.$0)
  }):Snap.Map3Opt1(fn,$1.$0,$2.$0,sn3):$3!=null&&$3.$==0?Snap.Map3Opt2(fn,$1.$0,$3.$0,sn2):Snap.Map3Opt3(fn,$1.$0,sn2,sn3):$2!=null&&$2.$==0?$3!=null&&$3.$==0?Snap.Map3Opt4(fn,$2.$0,$3.$0,sn1):Snap.Map3Opt5(fn,$2.$0,sn1,sn3):$3!=null&&$3.$==0?Snap.Map3Opt6(fn,$3.$0,sn1,sn2):(res=Snap.New({
   $:3,
   $0:[],
   $1:[]
  }),(Snap.When(sn1,cont,res),Snap.When(sn2,cont,res),Snap.When(sn3,cont,res),res));
 };
 Snap.Sequence=function(snaps)
 {
  var snaps$1,res,w,cont;
  snaps$1=Arrays.ofSeq(snaps);
  return snaps$1.length==0?Snap.New({
   $:0,
   $0:[]
  }):(res=Snap.New({
   $:3,
   $0:[],
   $1:[]
  }),(w=[Arrays.length(snaps$1)-1],(cont=function()
  {
   var vs;
   if(w[0]===0)
    {
     vs=Arrays.map(function(s)
     {
      var m;
      m=s.s;
      return m!=null&&m.$==0?m.$0:m!=null&&m.$==2?m.$0:Operators.FailWith("value not found by View.Sequence");
     },snaps$1);
     Arrays.forall(function(a)
     {
      var $1;
      return($1=a.s,$1!=null&&$1.$==0)&&true;
     },snaps$1)?Snap.MarkForever(res,vs):Snap.MarkReady(res,vs);
    }
   else
    w[0]--;
  },(Arrays.iter(function(s)
  {
   Snap.When(s,cont,res);
  },snaps$1),res))));
 };
 Snap.Map2=function(fn,sn1,sn2)
 {
  var $1,$2,res;
  function cont(a)
  {
   var m,$3,$4;
   if(!(m=res.s,m!=null&&m.$==0||m!=null&&m.$==2&&true))
    {
     $3=Snap.ValueAndForever(sn1);
     $4=Snap.ValueAndForever(sn2);
     $3!=null&&$3.$==1?$4!=null&&$4.$==1?$3.$0[1]&&$4.$0[1]?Snap.MarkForever(res,fn($3.$0[0],$4.$0[0])):Snap.MarkReady(res,fn($3.$0[0],$4.$0[0])):void 0:void 0;
    }
  }
  $1=sn1.s;
  $2=sn2.s;
  return $1!=null&&$1.$==0?$2!=null&&$2.$==0?Snap.New({
   $:0,
   $0:fn($1.$0,$2.$0)
  }):Snap.Map2Opt1(fn,$1.$0,sn2):$2!=null&&$2.$==0?Snap.Map2Opt2(fn,$2.$0,sn1):(res=Snap.New({
   $:3,
   $0:[],
   $1:[]
  }),(Snap.When(sn1,cont,res),Snap.When(sn2,cont,res),res));
 };
 Snap.Map2Unit=function(sn1,sn2)
 {
  var $1,$2,res;
  function cont()
  {
   var m,$3,$4;
   if(!(m=res.s,m!=null&&m.$==0||m!=null&&m.$==2&&true))
    {
     $3=Snap.ValueAndForever(sn1);
     $4=Snap.ValueAndForever(sn2);
     $3!=null&&$3.$==1?$4!=null&&$4.$==1?$3.$0[1]&&$4.$0[1]?Snap.MarkForever(res,null):Snap.MarkReady(res,null):void 0:void 0;
    }
  }
  $1=sn1.s;
  $2=sn2.s;
  return $1!=null&&$1.$==0?$2!=null&&$2.$==0?Snap.New({
   $:0,
   $0:null
  }):sn2:$2!=null&&$2.$==0?sn1:(res=Snap.New({
   $:3,
   $0:[],
   $1:[]
  }),(Snap.When(sn1,cont,res),Snap.When(sn2,cont,res),res));
 };
 Snap.WhenObsoleteRun=function(snap,obs)
 {
  var m;
  m=snap.s;
  m==null?obs():m!=null&&m.$==2?m.$1.push(obs):m!=null&&m.$==3?m.$1.push(obs):void 0;
 };
 Snap.When=function(snap,avail,obs)
 {
  var m;
  m=snap.s;
  m==null?Snap.Obsolete(obs):m!=null&&m.$==2?(Snap.EnqueueSafe(m.$1,obs),avail(m.$0)):m!=null&&m.$==3?(m.$0.push(avail),Snap.EnqueueSafe(m.$1,obs)):avail(m.$0);
 };
 Snap.MarkDone=function(res,sn,v)
 {
  var $1;
  if(($1=sn.s,$1!=null&&$1.$==0)&&true)
   Snap.MarkForever(res,v);
  else
   Snap.MarkReady(res,v);
 };
 Snap.Map3Opt1=function(fn,x,y,sn3)
 {
  return Snap.Map(function(z)
  {
   return fn(x,y,z);
  },sn3);
 };
 Snap.Map3Opt2=function(fn,x,z,sn2)
 {
  return Snap.Map(function(y)
  {
   return fn(x,y,z);
  },sn2);
 };
 Snap.Map3Opt3=function(fn,x,sn2,sn3)
 {
  return Snap.Map2(function($1,$2)
  {
   return fn(x,$1,$2);
  },sn2,sn3);
 };
 Snap.Map3Opt4=function(fn,y,z,sn1)
 {
  return Snap.Map(function(x)
  {
   return fn(x,y,z);
  },sn1);
 };
 Snap.Map3Opt5=function(fn,y,sn1,sn3)
 {
  return Snap.Map2(function($1,$2)
  {
   return fn($1,y,$2);
  },sn1,sn3);
 };
 Snap.Map3Opt6=function(fn,z,sn1,sn2)
 {
  return Snap.Map2(function($1,$2)
  {
   return fn($1,$2,z);
  },sn1,sn2);
 };
 Snap.ValueAndForever=function(snap)
 {
  var m;
  m=snap.s;
  return m!=null&&m.$==0?{
   $:1,
   $0:[m.$0,true]
  }:m!=null&&m.$==2?{
   $:1,
   $0:[m.$0,false]
  }:null;
 };
 Snap.MarkForever=function(sn,v)
 {
  var m,qa,i,$1;
  m=sn.s;
  if(m!=null&&m.$==3)
   {
    sn.s={
     $:0,
     $0:v
    };
    qa=m.$0;
    for(i=0,$1=Arrays.length(qa)-1;i<=$1;i++)(Arrays.get(qa,i))(v);
   }
  else
   void 0;
 };
 Snap.MarkReady=function(sn,v)
 {
  var m,qa,i,$1;
  m=sn.s;
  if(m!=null&&m.$==3)
   {
    sn.s={
     $:2,
     $0:v,
     $1:m.$1
    };
    qa=m.$0;
    for(i=0,$1=Arrays.length(qa)-1;i<=$1;i++)(Arrays.get(qa,i))(v);
   }
  else
   void 0;
 };
 Snap.Map2Opt1=function(fn,x,sn2)
 {
  return Snap.Map(function(y)
  {
   return fn(x,y);
  },sn2);
 };
 Snap.Map2Opt2=function(fn,y,sn1)
 {
  return Snap.Map(function(x)
  {
   return fn(x,y);
  },sn1);
 };
 Snap.Copy=function(sn)
 {
  var m,res,res$1;
  m=sn.s;
  return m==null?sn:m!=null&&m.$==2?(res=Snap.New({
   $:2,
   $0:m.$0,
   $1:[]
  }),(Snap.WhenObsolete(sn,res),res)):m!=null&&m.$==3?(res$1=Snap.New({
   $:3,
   $0:[],
   $1:[]
  }),(Snap.When(sn,function(v)
  {
   Snap.MarkDone(res$1,sn,v);
  },res$1),res$1)):sn;
 };
 Snap.EnqueueSafe=function(q,x)
 {
  var qcopy,i,$1,o;
  q.push(x);
  if(q.length%20===0)
   {
    qcopy=q.slice(0);
    Queue.Clear(q);
    for(i=0,$1=Arrays.length(qcopy)-1;i<=$1;i++){
     o=Arrays.get(qcopy,i);
     typeof o=="object"?function(sn)
     {
      if(sn.s)
       q.push(sn);
     }(o):function(f)
     {
      q.push(f);
     }(o);
    }
   }
  else
   void 0;
 };
 Snap.WhenObsolete=function(snap,obs)
 {
  var m;
  m=snap.s;
  m==null?Snap.Obsolete(obs):m!=null&&m.$==2?Snap.EnqueueSafe(m.$1,obs):m!=null&&m.$==3?Snap.EnqueueSafe(m.$1,obs):void 0;
 };
 Fresh.Int=function()
 {
  Fresh.set_counter(Fresh.counter()+1);
  return Fresh.counter();
 };
 Fresh.set_counter=function($1)
 {
  SC$2.$cctor();
  SC$2.counter=$1;
 };
 Fresh.counter=function()
 {
  SC$2.$cctor();
  return SC$2.counter;
 };
 AttrModule.Handler=function(name,callback)
 {
  return Attrs.Static(function(el)
  {
   el.addEventListener(name,function(d)
   {
    return(callback(el))(d);
   },false);
  });
 };
 AttrModule.OnAfterRender=function(callback)
 {
  return new AttrProxy({
   $:4,
   $0:callback
  });
 };
 AttrModule.Value=function(_var)
 {
  var f,g;
  return AttrModule.CustomValue(_var,window.id,(f=window.id,(g=function(a)
  {
   return{
    $:1,
    $0:a
   };
  },function(x)
  {
   return g(f(x));
  })));
 };
 AttrModule.Checked=function(_var)
 {
  var onSet;
  onSet=function(el)
  {
   return!Unchecked.Equals(_var.RVal(),el.checked)?_var.set_RVal(el.checked):null;
  };
  return AttrProxy.Concat([AttrModule.DynamicProp("checked",_var.RView()),AttrModule.Handler("change",function($1)
  {
   return function($2)
   {
    return onSet($1,$2);
   };
  }),AttrModule.Handler("click",function($1)
  {
   return function($2)
   {
    return onSet($1,$2);
   };
  })]);
 };
 AttrModule.IntValue=function(_var)
 {
  return AttrModule.CustomVar(_var,function($1,$2)
  {
   var i;
   i=$2.get_Input();
   return $1.value!==i?void($1.value=i):null;
  },function(el)
  {
   var s,m,o;
   s=el.value;
   return{
    $:1,
    $0:String.isBlank(s)?(el.checkValidity?el.checkValidity():true)?new CheckedInput({
     $:2,
     $0:s
    }):new CheckedInput({
     $:1,
     $0:s
    }):(m=(o=0,[Numeric.TryParseInt32(s,{
     get:function()
     {
      return o;
     },
     set:function(v)
     {
      o=v;
     }
    }),o]),m[0]?new CheckedInput({
     $:0,
     $0:m[1],
     $1:s
    }):new CheckedInput({
     $:1,
     $0:s
    }))
   };
  });
 };
 AttrModule.IntValueUnchecked=function(_var)
 {
  return AttrModule.CustomValue(_var,window.String,function(s)
  {
   var pd;
   return String.isBlank(s)?{
    $:1,
    $0:0
   }:(pd=+s,pd!==pd>>0?null:{
    $:1,
    $0:pd
   });
  });
 };
 AttrModule.FloatValue=function(_var)
 {
  return AttrModule.CustomVar(_var,function($1,$2)
  {
   var i;
   i=$2.get_Input();
   return $1.value!==i?void($1.value=i):null;
  },function(el)
  {
   var s,i;
   s=el.value;
   return{
    $:1,
    $0:String.isBlank(s)?(el.checkValidity?el.checkValidity():true)?new CheckedInput({
     $:2,
     $0:s
    }):new CheckedInput({
     $:1,
     $0:s
    }):(i=+s,window.isNaN(i)?new CheckedInput({
     $:1,
     $0:s
    }):new CheckedInput({
     $:0,
     $0:i,
     $1:s
    }))
   };
  });
 };
 AttrModule.FloatValueUnchecked=function(_var)
 {
  return AttrModule.CustomValue(_var,window.String,function(s)
  {
   var pd;
   return String.isBlank(s)?{
    $:1,
    $0:0
   }:(pd=+s,window.isNaN(pd)?null:{
    $:1,
    $0:pd
   });
  });
 };
 AttrModule.Dynamic=function(name,view)
 {
  return Attrs.Dynamic(view,function(el)
  {
   return function(v)
   {
    return DomUtility.SetAttr(el,name,v);
   };
  });
 };
 AttrModule.CustomValue=function(_var,toString,fromString)
 {
  return AttrModule.CustomVar(_var,function($1,$2)
  {
   $1.value=toString($2);
  },function(e)
  {
   return fromString(e.value);
  });
 };
 AttrModule.DynamicProp=function(name,view)
 {
  return Attrs.Dynamic(view,function(el)
  {
   return function(v)
   {
    el[name]=v;
   };
  });
 };
 AttrModule.CustomVar=function(_var,set,get)
 {
  var onChange,set$1;
  onChange=function(el)
  {
   return _var.RUpdM(function(v)
   {
    var m,$1;
    m=get(el);
    return m!=null&&m.$==1&&(!Unchecked.Equals(m.$0,v)&&($1=[m,m.$0],true))?$1[0]:null;
   });
  };
  set$1=function(e,v)
  {
   var m,$1;
   m=get(e);
   return m!=null&&m.$==1&&(Unchecked.Equals(m.$0,v)&&($1=m.$0,true))?null:set(e,v);
  };
  return AttrProxy.Concat([AttrModule.Handler("change",function($1)
  {
   return function($2)
   {
    return onChange($1,$2);
   };
  }),AttrModule.Handler("input",function($1)
  {
   return function($2)
   {
    return onChange($1,$2);
   };
  }),AttrModule.Handler("keypress",function($1)
  {
   return function($2)
   {
    return onChange($1,$2);
   };
  }),AttrModule.DynamicCustom(function($1)
  {
   return function($2)
   {
    return set$1($1,$2);
   };
  },_var.RView())]);
 };
 AttrModule.DynamicCustom=function(set,view)
 {
  return Attrs.Dynamic(view,set);
 };
 Array.ofSeqNonCopying=function(xs)
 {
  var q,o;
  if(xs instanceof window.Array)
   return xs;
  else
   if(xs instanceof T)
    return Arrays.ofList(xs);
   else
    if(xs===null)
     return[];
    else
     {
      q=[];
      o=Enumerator.Get(xs);
      try
      {
       while(o.MoveNext())
        q.push(o.Current());
       return q;
      }
      finally
      {
       if("Dispose"in o)
        o.Dispose();
      }
     }
 };
 Array.TreeReduce=function(defaultValue,reduction,array)
 {
  var l;
  function loop(off,len)
  {
   var $1,l2;
   return len<=0?defaultValue:len===1&&(off>=0&&off<l&&true)?Arrays.get(array,off):(l2=len/2>>0,reduction(loop(off,l2),loop(off+l2,len-l2)));
  }
  l=Arrays.length(array);
  return loop(0,l);
 };
 Array.MapTreeReduce=function(mapping,defaultValue,reduction,array)
 {
  var l;
  function loop(off,len)
  {
   var $1,l2;
   return len<=0?defaultValue:len===1&&(off>=0&&off<l&&true)?mapping(Arrays.get(array,off)):(l2=len/2>>0,reduction(loop(off,l2),loop(off+l2,len-l2)));
  }
  l=Arrays.length(array);
  return loop(0,l);
 };
 JSModule.GetFieldValues=function(o)
 {
  var r,k;
  r=[];
  for(var k$1 in o)r.push(o[k$1]);
  return r;
 };
 Pervasives.NewFromSeq=function(fields)
 {
  var r,e,f;
  r={};
  e=Enumerator.Get(fields);
  try
  {
   while(e.MoveNext())
    {
     f=e.Current();
     r[f[0]]=f[1];
    }
  }
  finally
  {
   if("Dispose"in e)
    e.Dispose();
  }
  return r;
 };
 Doc=Next.Doc=Runtime.Class({},null,Doc);
 Doc.RunById=function(id,tr)
 {
  var m;
  m=DomUtility.Doc().getElementById(id);
  Unchecked.Equals(m,null)?Operators.FailWith("invalid id: "+id):Doc.Run(m,tr);
 };
 Doc.GetOrLoadTemplate=function(baseName,name,els,fillWith)
 {
  Doc.PrepareTemplate(baseName,name,els);
  return Doc.NamedTemplate(baseName,name,fillWith);
 };
 Doc.PrepareTemplate=function(baseName,name,els)
 {
  var els$1,i,$1,el,m;
  if(!Docs.LoadedTemplates().ContainsKey(Doc.ComposeName(baseName,name)))
   {
    els$1=els();
    for(i=0,$1=els$1.length-1;i<=$1;i++){
     el=Arrays.get(els$1,i);
     m=el.parentNode;
     Unchecked.Equals(m,null)?void 0:m.removeChild(el);
    }
    Doc.PrepareTemplateStrict(baseName,name,els$1);
   }
 };
 Doc.Run=function(parent,doc)
 {
  var d;
  d=doc.docNode;
  Docs.LinkElement(parent,d);
  View.Sink(Mailbox.StartProcessor(Docs.PerformAnimatedUpdate(Docs.CreateRunState(parent,d),d)),doc.updates);
 };
 Doc.NamedTemplate=function(baseName,name,fillWith)
 {
  var name$1,m,o;
  name$1=Doc.ComposeName(baseName,name);
  m=(o=null,[Docs.LoadedTemplates().TryGetValue(name$1,{
   get:function()
   {
    return o;
   },
   set:function(v)
   {
    o=v;
   }
  }),o]);
  return m[0]?Doc.ChildrenTemplate(m[1].cloneNode(true),fillWith):(console.warn("Local template doesn't exist",name$1),Doc.Empty());
 };
 Doc.ComposeName=function(baseName,name)
 {
  return(baseName+"/"+(name==null?"":name.$0)).toLowerCase();
 };
 Doc.PrepareTemplateStrict=function(baseName,name,els)
 {
  var convertAttrs,convertTextNode,mapHoles,fillInstanceAttrs,removeHolesExcept,fillTextHole,fill,fakeroot;
  function recF(recI,$1,$2)
  {
   var $3,x,f,g,name$1,name$2,t,instance,usedHoles,mappings,attrs,i,$4,name$3,m,i$1,$5,n,singleTextFill,i$2,$6,n$1,next;
   while(true)
    switch(recI)
    {
     case 0:
      name$1=Slice.string($1.nodeName,{
       $:1,
       $0:3
      },null).toLowerCase();
      name$2=name$1.indexOf(String$1.fromCharCode(46))===-1?baseName+"/"+name$1:Strings.Replace(name$1,".","/");
      if(!Docs.LoadedTemplates().ContainsKey(name$2))
       return console.warn("Instantiating non-loaded template",name$2);
      else
       {
        t=Docs.LoadedTemplates().get_Item(name$2);
        instance=t.cloneNode(true);
        usedHoles=new HashSet.New$3();
        mappings=new Dictionary.New$5();
        attrs=$1.attributes;
        for(i=0,$4=attrs.length-1;i<=$4;i++){
         name$3=attrs.item(i).name.toLowerCase();
         mappings.set_Item(name$3,(m=attrs.item(i).nodeValue,m===""?name$3:m.toLowerCase()));
         !usedHoles.Add(name$3)?console.warn("Hole mapped twice",name$3):void 0;
        }
        for(i$1=0,$5=$1.childNodes.length-1;i$1<=$5;i$1++){
         n=$1.childNodes[i$1];
         Unchecked.Equals(n.nodeType,Node.ELEMENT_NODE)?!usedHoles.Add(n.nodeName.toLowerCase())?console.warn("Hole filled twice",name$2):void 0:void 0;
        }
        singleTextFill=$1.childNodes.length===1&&Unchecked.Equals($1.firstChild.nodeType,Node.TEXT_NODE);
        if(singleTextFill)
         {
          x=fillTextHole(instance,$1.firstChild.textContent);
          ((function(a)
          {
           return function(o)
           {
            if(o!=null)
             a(o.$0);
           };
          }((f=function(usedHoles$1)
          {
           return function(a)
           {
            return usedHoles$1.Add(a);
           };
          }(usedHoles),g=function()
          {
          },function(x$1)
          {
           return g(f(x$1));
          })))(x));
         }
        removeHolesExcept(instance,usedHoles);
        if(!singleTextFill)
         {
          for(i$2=0,$6=$1.childNodes.length-1;i$2<=$6;i$2++){
           n$1=$1.childNodes[i$2];
           Unchecked.Equals(n$1.nodeType,Node.ELEMENT_NODE)?n$1.hasAttributes()?fillInstanceAttrs(instance,n$1):fillDocHole(instance,n$1):void 0;
          }
         }
        mapHoles(instance,mappings);
        (((function(a)
        {
         var c;
         c=function($7,$8)
         {
          return fill(a,$7,$8);
         };
         return function($7)
         {
          return function($8)
          {
           return c($7,$8);
          };
         };
        }(instance))($1.parentNode))($1));
        $1.parentNode.removeChild($1);
       }
     case 1:
      if($2!==null)
       {
        next=$2.nextSibling;
        if(Unchecked.Equals($2.nodeType,Node.TEXT_NODE))
         convertTextNode($2);
        else
         if(Unchecked.Equals($2.nodeType,Node.ELEMENT_NODE))
          convertElement($2);
        recI=1;
        $1=$1;
        $2=next;
       }
      else
       return null;
    }
  }
  function fillDocHole(instance,fillWith)
  {
   var m,name$1,m$1;
   function fillHole(p,n)
   {
    var parsed,i,$1;
    if(name$1==="title"&&fillWith.hasChildNodes())
     {
      parsed=$.parseHTML(fillWith.textContent);
      fillWith.removeChild(fillWith.firstChild);
      for(i=0,$1=parsed.length-1;i<=$1;i++)fillWith.appendChild(Arrays.get(parsed,i));
     }
    else
     null;
    convertElement(fillWith);
    return fill(fillWith,p,n);
   }
   name$1=fillWith.nodeName.toLowerCase();
   DomUtility.IterSelector(instance,"[ws-attr-holes]",function(e)
   {
    var holeAttrs,i,$1,attrName,_this;
    holeAttrs=Strings.SplitChars(e.getAttribute("ws-attr-holes"),[32],1);
    for(i=0,$1=holeAttrs.length-1;i<=$1;i++){
     attrName=Arrays.get(holeAttrs,i);
     e.setAttribute(attrName,(_this=new window.RegExp("\\${"+name$1+"}","ig"),e.getAttribute(attrName).replace(_this,fillWith.textContent)));
    }
   });
   m$1=instance.querySelector("[ws-hole="+name$1+"]");
   if(Unchecked.Equals(m$1,null))
    {
     m=instance.querySelector("[ws-replace="+name$1+"]");
     return Unchecked.Equals(m,null)?null:(fillHole(m.parentNode,m),void m.parentNode.removeChild(m));
    }
   else
    {
     while(m$1.hasChildNodes())
      m$1.removeChild(m$1.lastChild);
     m$1.removeAttribute("ws-hole");
     return fillHole(m$1,null);
    }
  }
  function convertInstantiation(el)
  {
   return recF(0,el);
  }
  function convertElement(el)
  {
   var m,m$1;
   if(Strings.StartsWith(el.nodeName.toLowerCase(),"ws-")&&!el.hasAttribute("ws-template"))
    convertInstantiation(el);
   else
    {
     convertAttrs(el);
     m=el.getAttribute("ws-template");
     if(m===null)
      {
       m$1=el.getAttribute("ws-children-template");
       if(m$1===null)
        convert(el,el.firstChild);
       else
        {
         el.removeAttribute("ws-children-template");
         Doc.PrepareTemplate(baseName,{
          $:1,
          $0:m$1
         },function()
         {
          return DomUtility.ChildrenArray(el);
         });
         while(el.hasChildNodes())
          el.removeChild(el.lastChild);
        }
      }
     else
      Doc.PrepareSingleTemplate(baseName,{
       $:1,
       $0:m
      },el);
    }
  }
  function convert(p,n)
  {
   return recF(1,p,n);
  }
  convertAttrs=function(el)
  {
   var attrs,toRemove,events,holedAttrs,i,$1,a,_this;
   function lowercaseAttr(name$1)
   {
    var m;
    m=el.getAttribute(name$1);
    m===null?void 0:el.setAttribute(name$1,m.toLowerCase());
   }
   attrs=el.attributes;
   toRemove=[];
   events=[];
   holedAttrs=[];
   for(i=0,$1=attrs.length-1;i<=$1;i++){
    a=attrs.item(i);
    Strings.StartsWith(a.nodeName,"ws-on")&&a.nodeName!=="ws-onafterrender"&&a.nodeName!=="ws-on"?(toRemove.push(a.nodeName),events.push(Slice.string(a.nodeName,{
     $:1,
     $0:"ws-on".length
    },null)+":"+a.nodeValue.toLowerCase())):!Strings.StartsWith(a.nodeName,"ws-")&&(new window.RegExp(Docs.TextHoleRE())).test(a.nodeValue)?(a.nodeValue=(_this=new window.RegExp(Docs.TextHoleRE(),"g"),a.nodeValue.replace(_this,function($2,$3)
    {
     return"${"+$3.toLowerCase()+"}";
    })),holedAttrs.push(a.nodeName)):void 0;
   }
   !(events.length==0)?el.setAttribute("ws-on",Strings.concat(" ",events)):void 0;
   !(holedAttrs.length==0)?el.setAttribute("ws-attr-holes",Strings.concat(" ",holedAttrs)):void 0;
   lowercaseAttr("ws-hole");
   lowercaseAttr("ws-replace");
   lowercaseAttr("ws-attr");
   lowercaseAttr("ws-onafterrender");
   lowercaseAttr("ws-var");
   Arrays.iter(function(a$1)
   {
    el.removeAttribute(a$1);
   },toRemove);
  };
  convertTextNode=function(n)
  {
   var m,li,$1,s,strRE,hole;
   m=null;
   li=0;
   s=n.textContent;
   strRE=new window.RegExp(Docs.TextHoleRE(),"g");
   while(m=strRE.exec(s),m!==null)
    {
     n.parentNode.insertBefore(window.document.createTextNode(Slice.string(s,{
      $:1,
      $0:li
     },{
      $:1,
      $0:strRE.lastIndex-Arrays.get(m,0).length-1
     })),n);
     li=strRE.lastIndex;
     hole=window.document.createElement("span");
     hole.setAttribute("ws-replace",Arrays.get(m,1).toLowerCase());
     n.parentNode.insertBefore(hole,n);
    }
   strRE.lastIndex=0;
   n.textContent=Slice.string(s,{
    $:1,
    $0:li
   },null);
  };
  mapHoles=function(t,mappings)
  {
   function run(attrName)
   {
    DomUtility.IterSelector(t,"["+attrName+"]",function(e)
    {
     var m,o;
     m=(o=null,[mappings.TryGetValue(e.getAttribute(attrName).toLowerCase(),{
      get:function()
      {
       return o;
      },
      set:function(v)
      {
       o=v;
      }
     }),o]);
     m[0]?e.setAttribute(attrName,m[1]):void 0;
    });
   }
   run("ws-hole");
   run("ws-replace");
   run("ws-attr");
   run("ws-onafterrender");
   run("ws-var");
   DomUtility.IterSelector(t,"[ws-on]",function(e)
   {
    e.setAttribute("ws-on",Strings.concat(" ",Arrays.map(function(x)
    {
     var a,m,o;
     a=Strings.SplitChars(x,[58],1);
     m=(o=null,[mappings.TryGetValue(Arrays.get(a,1),{
      get:function()
      {
       return o;
      },
      set:function(v)
      {
       o=v;
      }
     }),o]);
     return m[0]?Arrays.get(a,0)+":"+m[1]:x;
    },Strings.SplitChars(e.getAttribute("ws-on"),[32],1))));
   });
   return DomUtility.IterSelector(t,"[ws-attr-holes]",function(e)
   {
    var holeAttrs,i,$1;
    holeAttrs=Strings.SplitChars(e.getAttribute("ws-attr-holes"),[32],1);
    for(i=0,$1=holeAttrs.length-1;i<=$1;i++)(function()
    {
     var attrName,f;
     attrName=Arrays.get(holeAttrs,i);
     return e.setAttribute(attrName,((f=function(s,a)
     {
      var a$1;
      a$1=Operators.KeyValue(a);
      return s.replace(new window.RegExp("\\${"+a$1[0]+"}","ig"),"${"+a$1[1]+"}");
     },(Runtime.Curried3(Seq.fold))(f))(e.getAttribute(attrName)))(mappings));
    }());
   });
  };
  fillInstanceAttrs=function(instance,fillWith)
  {
   var name$1,m,i,$1,a;
   convertAttrs(fillWith);
   name$1=fillWith.nodeName.toLowerCase();
   m=instance.querySelector("[ws-attr="+name$1+"]");
   if(Unchecked.Equals(m,null))
    return console.warn("Filling non-existent attr hole",name$1);
   else
    {
     m.removeAttribute("ws-attr");
     for(i=0,$1=fillWith.attributes.length-1;i<=$1;i++){
      a=fillWith.attributes.item(i);
      a.name==="class"&&m.hasAttribute("class")?m.setAttribute("class",m.getAttribute("class")+" "+a.nodeValue):m.setAttribute(a.name,a.nodeValue);
     }
     return;
    }
  };
  removeHolesExcept=function(instance,dontRemove)
  {
   function run(attrName)
   {
    DomUtility.IterSelector(instance,"["+attrName+"]",function(e)
    {
     if(!dontRemove.Contains(e.getAttribute(attrName)))
      e.removeAttribute(attrName);
    });
   }
   run("ws-attr");
   run("ws-onafterrender");
   run("ws-var");
   DomUtility.IterSelector(instance,"[ws-hole]",function(e)
   {
    if(!dontRemove.Contains(e.getAttribute("ws-hole")))
     {
      e.removeAttribute("ws-hole");
      while(e.hasChildNodes())
       e.removeChild(e.lastChild);
     }
   });
   DomUtility.IterSelector(instance,"[ws-replace]",function(e)
   {
    if(!dontRemove.Contains(e.getAttribute("ws-replace")))
     e.parentNode.removeChild(e);
   });
   DomUtility.IterSelector(instance,"[ws-on]",function(e)
   {
    e.setAttribute("ws-on",Strings.concat(" ",Arrays.filter(function(x)
    {
     return dontRemove.Contains(Arrays.get(Strings.SplitChars(x,[58],1),1));
    },Strings.SplitChars(e.getAttribute("ws-on"),[32],1))));
   });
   return DomUtility.IterSelector(instance,"[ws-attr-holes]",function(e)
   {
    var holeAttrs,i,$1,attrName,_this;
    holeAttrs=Strings.SplitChars(e.getAttribute("ws-attr-holes"),[32],1);
    for(i=0,$1=holeAttrs.length-1;i<=$1;i++){
     attrName=Arrays.get(holeAttrs,i);
     e.setAttribute(attrName,(_this=new window.RegExp(Docs.TextHoleRE(),"g"),e.getAttribute(attrName).replace(_this,function($2,$3)
     {
      return dontRemove.Contains($3)?$2:"";
     })));
    }
   });
  };
  fillTextHole=function(instance,fillWith)
  {
   var m;
   m=instance.querySelector("[ws-replace]");
   return Unchecked.Equals(m,null)?(console.warn("Filling non-existent text hole",name),null):(m.parentNode.replaceChild(new window.Text(fillWith),m),{
    $:1,
    $0:m.getAttribute("ws-replace")
   });
  };
  fill=function(fillWith,p,n)
  {
   while(true)
    if(fillWith.hasChildNodes())
     n=p.insertBefore(fillWith.lastChild,n);
    else
     return null;
  };
  fakeroot=Doc.FakeRoot(els);
  Docs.LoadedTemplates().set_Item(Doc.ComposeName(baseName,name),fakeroot);
  Arrays.length(els)>0?convert(fakeroot,Arrays.get(els,0)):void 0;
 };
 Doc.ChildrenTemplate=function(el,fillWith)
 {
  var els,addAttr,tryGetAsDoc,docTreeNode,$1,updates,$2,holes,updates$1,attrs,afterRender,fw,e,x;
  holes=[];
  updates$1=[];
  attrs=[];
  afterRender=[];
  fw=new Dictionary.New$5();
  e=Enumerator.Get(fillWith);
  try
  {
   while(e.MoveNext())
    {
     x=e.Current();
     fw.set_Item(x.$0,x);
    }
  }
  finally
  {
   if("Dispose"in e)
    e.Dispose();
  }
  els=DomUtility.ChildrenArray(el);
  addAttr=function(el$1,attr)
  {
   var attr$1,o,f;
   attr$1=Attrs.Insert(el$1,attr);
   updates$1.push(Attrs.Updates(attr$1));
   attrs.push([el$1,attr$1]);
   o=Runtime.GetOptional(attr$1.OnAfterRender);
   return o==null?null:(f=o.$0,void afterRender.push(function()
   {
    f(el$1);
   }));
  };
  tryGetAsDoc=function(name)
  {
   var m,o;
   m=(o=null,[fw.TryGetValue(name,{
    get:function()
    {
     return o;
    },
    set:function(v)
    {
     o=v;
    }
   }),o]);
   return m[0]?m[1].$==0?{
    $:1,
    $0:m[1].$1
   }:m[1].$==1?{
    $:1,
    $0:Doc.TextNode(m[1].$1)
   }:m[1].$==2?{
    $:1,
    $0:Doc.TextView(m[1].$1)
   }:m[1].$==6?{
    $:1,
    $0:Doc.TextView(m[1].$1.RView())
   }:m[1].$==7?{
    $:1,
    $0:Doc.TextView(View.Map(String$1,m[1].$1.RView()))
   }:m[1].$==8?{
    $:1,
    $0:Doc.TextView(View.Map(function(i)
    {
     return i.get_Input();
    },m[1].$1.RView()))
   }:m[1].$==9?{
    $:1,
    $0:Doc.TextView(View.Map(String$1,m[1].$1.RView()))
   }:m[1].$==10?{
    $:1,
    $0:Doc.TextView(View.Map(function(i)
    {
     return i.get_Input();
    },m[1].$1.RView()))
   }:m[1].$==11?{
    $:1,
    $0:Doc.TextView(View.Map(String$1,m[1].$1.RView()))
   }:(console.warn("Content hole filled with attribute data",name),null):null;
  };
  DomUtility.IterSelector(el,"[ws-hole]",function(p)
  {
   var m,doc,name;
   name=p.getAttribute("ws-hole");
   p.removeAttribute("ws-hole");
   while(p.hasChildNodes())
    p.removeChild(p.lastChild);
   m=tryGetAsDoc(name);
   m!=null&&m.$==1?(doc=m.$0,Docs.LinkElement(p,doc.docNode),holes.push(DocElemNode.New(Attrs.Empty(p),doc.docNode,null,p,Fresh.Int(),null)),updates$1.push(doc.updates)):void 0;
  });
  DomUtility.IterSelector(el,"[ws-replace]",function(e$1)
  {
   var m,doc,p,after,before,o;
   m=tryGetAsDoc(e$1.getAttribute("ws-replace"));
   m!=null&&m.$==1?(doc=m.$0,p=e$1.parentNode,after=window.document.createTextNode(""),p.replaceChild(after,e$1),before=Docs.InsertBeforeDelim(after,doc.docNode),o=Arrays.tryFindIndex(function(y)
   {
    return e$1===y;
   },els),o==null?void 0:Arrays.set(els,o.$0,doc.docNode),holes.push(DocElemNode.New(Attrs.Empty(p),doc.docNode,{
    $:1,
    $0:[before,after]
   },p,Fresh.Int(),null)),updates$1.push(doc.updates)):void 0;
  });
  DomUtility.IterSelector(el,"[ws-attr]",function(e$1)
  {
   var name,m,o;
   name=e$1.getAttribute("ws-attr");
   e$1.removeAttribute("ws-attr");
   m=(o=null,[fw.TryGetValue(name,{
    get:function()
    {
     return o;
    },
    set:function(v)
    {
     o=v;
    }
   }),o]);
   m[0]?m[1].$==3?addAttr(e$1,m[1].$1):console.warn("Attribute hole filled with non-attribute data",name):void 0;
  });
  DomUtility.IterSelector(el,"[ws-on]",function(e$1)
  {
   addAttr(e$1,AttrProxy.Concat(Arrays.choose(function(x$1)
   {
    var a,m,o;
    a=Strings.SplitChars(x$1,[58],1);
    m=(o=null,[fw.TryGetValue(Arrays.get(a,1),{
     get:function()
     {
      return o;
     },
     set:function(v)
     {
      o=v;
     }
    }),o]);
    return m[0]?m[1].$==4?{
     $:1,
     $0:AttrModule.Handler(Arrays.get(a,0),m[1].$1)
    }:(console.warn("Event hole on"+Arrays.get(a,0)+" filled with non-event data",Arrays.get(a,1)),null):null;
   },Strings.SplitChars(e$1.getAttribute("ws-on"),[32],1))));
   e$1.removeAttribute("ws-on");
  });
  DomUtility.IterSelector(el,"[ws-onafterrender]",function(e$1)
  {
   var name,m,o;
   name=e$1.getAttribute("ws-onafterrender");
   m=(o=null,[fw.TryGetValue(name,{
    get:function()
    {
     return o;
    },
    set:function(v)
    {
     o=v;
    }
   }),o]);
   m[0]?m[1].$==5?(e$1.removeAttribute("ws-onafterrender"),addAttr(e$1,AttrModule.OnAfterRender(m[1].$1))):console.warn("onafterrender hole filled with non-onafterrender data",name):void 0;
  });
  DomUtility.IterSelector(el,"[ws-var]",function(e$1)
  {
   var name,m,o;
   name=e$1.getAttribute("ws-var");
   e$1.removeAttribute("ws-var");
   m=(o=null,[fw.TryGetValue(name,{
    get:function()
    {
     return o;
    },
    set:function(v)
    {
     o=v;
    }
   }),o]);
   m[0]?m[1].$==6?addAttr(e$1,AttrModule.Value(m[1].$1)):m[1].$==7?addAttr(e$1,AttrModule.Checked(m[1].$1)):m[1].$==8?addAttr(e$1,AttrModule.IntValue(m[1].$1)):m[1].$==9?addAttr(e$1,AttrModule.IntValueUnchecked(m[1].$1)):m[1].$==10?addAttr(e$1,AttrModule.FloatValue(m[1].$1)):m[1].$==11?addAttr(e$1,AttrModule.FloatValueUnchecked(m[1].$1)):console.warn("Var hole filled with non-Var data",name):void 0;
  });
  DomUtility.IterSelector(el,"[ws-attr-holes]",function(e$1)
  {
   var re,holeAttrs,i,$3;
   re=new window.RegExp(Docs.TextHoleRE(),"g");
   holeAttrs=Strings.SplitChars(e$1.getAttribute("ws-attr-holes"),[32],1);
   e$1.removeAttribute("ws-attr-holes");
   for(i=0,$3=holeAttrs.length-1;i<=$3;i++)(function()
   {
    var m,lastIndex,$4,finalText,value,s,s$1,s$2,s$3,attrName,s$4,res,textBefore;
    attrName=Arrays.get(holeAttrs,i);
    s$4=e$1.getAttribute(attrName);
    m=null;
    lastIndex=0;
    res=[];
    while(m=re.exec(s$4),m!==null)
     {
      textBefore=Slice.string(s$4,{
       $:1,
       $0:lastIndex
      },{
       $:1,
       $0:re.lastIndex-Arrays.get(m,0).length-1
      });
      lastIndex=re.lastIndex;
      res.push([textBefore,Arrays.get(m,1)]);
     }
    finalText=Slice.string(s$4,{
     $:1,
     $0:lastIndex
    },null);
    re.lastIndex=0;
    value=Arrays.foldBack(function($5,$6)
    {
     return(function(t)
     {
      var textBefore$1,holeName;
      textBefore$1=t[0];
      holeName=t[1];
      return function(t$1)
      {
       var textAfter,views,holeContent,m$1,o;
       textAfter=t$1[0];
       views=t$1[1];
       holeContent=(m$1=(o=null,[fw.TryGetValue(holeName,{
        get:function()
        {
         return o;
        },
        set:function(v)
        {
         o=v;
        }
       }),o]),m$1[0]?m$1[1].$==1?{
        $:0,
        $0:m$1[1].$1
       }:m$1[1].$==2?{
        $:1,
        $0:m$1[1].$1
       }:m$1[1].$==6?{
        $:1,
        $0:m$1[1].$1.RView()
       }:m$1[1].$==7?{
        $:1,
        $0:View.Map(String$1,m$1[1].$1.RView())
       }:m$1[1].$==8?{
        $:1,
        $0:View.Map(function(i$1)
        {
         return i$1.get_Input();
        },m$1[1].$1.RView())
       }:m$1[1].$==9?{
        $:1,
        $0:View.Map(String$1,m$1[1].$1.RView())
       }:m$1[1].$==10?{
        $:1,
        $0:View.Map(function(i$1)
        {
         return i$1.get_Input();
        },m$1[1].$1.RView())
       }:m$1[1].$==11?{
        $:1,
        $0:View.Map(String$1,m$1[1].$1.RView())
       }:(console.warn("Attribute value hole filled with non-text data",holeName),{
        $:0,
        $0:""
       }):{
        $:0,
        $0:""
       });
       return holeContent.$==1?[textBefore$1,new T({
        $:1,
        $0:textAfter===""?holeContent.$0:View.Map(function(s$5)
        {
         return s$5+textAfter;
        },holeContent.$0),
        $1:views
       })]:[textBefore$1+holeContent.$0+textAfter,views];
      };
     }($5))($6);
    },res,[finalText,T.Empty]);
    return addAttr(e$1,value[1].$==1?value[1].$1.$==1?value[1].$1.$1.$==1?value[1].$1.$1.$1.$==0?(s=value[0],AttrModule.Dynamic(attrName,View.Map3(function(v1,v2,v3)
    {
     return s+v1+v2+v3;
    },value[1].$0,value[1].$1.$0,value[1].$1.$1.$0))):(s$1=value[0],AttrModule.Dynamic(attrName,View.Map(function(vs)
    {
     return s$1+Strings.concat("",vs);
    },View.Sequence(value[1])))):(s$2=value[0],AttrModule.Dynamic(attrName,View.Map2(function(v1,v2)
    {
     return s$2+v1+v2;
    },value[1].$0,value[1].$1.$0))):value[0]===""?AttrModule.Dynamic(attrName,value[1].$0):(s$3=value[0],AttrModule.Dynamic(attrName,View.Map(function(v)
    {
     return s$3+v;
    },value[1].$0))):AttrProxy.Create(attrName,value[0]));
   }());
  });
  docTreeNode=Runtime.DeleteEmptyFields({
   Els:els,
   Dirty:true,
   Holes:holes,
   Attrs:attrs,
   Render:($1=afterRender.length==0?null:{
    $:1,
    $0:function(el$1)
    {
     Arrays.iter(function(f)
     {
      f(el$1);
     },afterRender);
    }
   },$1?$1.$0:void 0)
  },["Render"]);
  updates=Array.TreeReduce(View.Const(),View.Map2Unit,updates$1);
  return els&&Arrays.length(els)===1&&(Arrays.get(els,0)instanceof Node&&(Unchecked.Equals(Arrays.get(els,0).nodeType,Node.ELEMENT_NODE)&&($2=Arrays.get(els,0),true)))?Elt.TreeNode(docTreeNode,updates):Doc.Mk({
   $:6,
   $0:docTreeNode
  },updates);
 };
 Doc.Empty=function()
 {
  return Doc.Mk(null,View.Const());
 };
 Doc.PrepareSingleTemplate=function(baseName,name,el)
 {
  var m,m$1,n;
  el.removeAttribute("ws-template");
  m=el.getAttribute("ws-replace");
  m===null?void 0:(el.removeAttribute("ws-replace"),m$1=el.parentNode,Unchecked.Equals(m$1,null)?void 0:(n=window.document.createElement(el.tagName),n.setAttribute("ws-replace",m),m$1.replaceChild(n,el)));
  Doc.PrepareTemplateStrict(baseName,name,[el]);
 };
 Doc.FakeRoot=function(els)
 {
  var fakeroot,i,$1;
  fakeroot=window.document.createElement("div");
  for(i=0,$1=els.length-1;i<=$1;i++)fakeroot.appendChild(Arrays.get(els,i));
  return fakeroot;
 };
 Doc.TextNode=function(v)
 {
  return Doc.Mk({
   $:5,
   $0:DomUtility.CreateText(v)
  },View.Const());
 };
 Doc.TextView=function(txt)
 {
  var node;
  node=Docs.CreateTextNode();
  return Doc.Mk({
   $:4,
   $0:node
  },View.Map(function(t)
  {
   Docs.UpdateTextNode(node,t);
  },txt));
 };
 Doc.Mk=function(node,updates)
 {
  return new Doc.New(node,updates);
 };
 Doc.New=Runtime.Ctor(function(docNode,updates)
 {
  this.docNode=docNode;
  this.updates=updates;
 },Doc);
 Snap.Obsolete=function(sn)
 {
  var $1,m,i,$2,o;
  m=sn.s;
  if(m==null||(m!=null&&m.$==2?($1=m.$1,false):m!=null&&m.$==3?($1=m.$1,false):true))
   void 0;
  else
   {
    sn.s=null;
    for(i=0,$2=Arrays.length($1)-1;i<=$2;i++){
     o=Arrays.get($1,i);
     typeof o=="object"?function(sn$1)
     {
      Snap.Obsolete(sn$1);
     }(o):o();
    }
   }
 };
 Snap.New=function(State)
 {
  return{
   s:State
  };
 };
 Numeric.TryParseInt32=function(s,r)
 {
  return Numeric.TryParse(s,-2147483648,2147483647,r);
 };
 Attrs.Static=function(attr)
 {
  return new AttrProxy({
   $:3,
   $0:attr
  });
 };
 Attrs.EmptyAttr=function()
 {
  SC$3.$cctor();
  return SC$3.EmptyAttr;
 };
 Attrs.AppendTree=function(a,b)
 {
  var x;
  return a===null?b:b===null?a:(x=new AttrProxy({
   $:2,
   $0:a,
   $1:b
  }),(Attrs.SetFlags(x,Attrs.Flags(a)|Attrs.Flags(b)),x));
 };
 Attrs.SetFlags=function(a,f)
 {
  a.flags=f;
 };
 Attrs.Flags=function(a)
 {
  return a!==null&&a.hasOwnProperty("flags")?a.flags:0;
 };
 Attrs.Insert=function(elem,tree)
 {
  var nodes,oar,arr;
  function loop(node)
  {
   if(!(node===null))
    if(node!=null&&node.$==1)
     nodes.push(node.$0);
    else
     if(node!=null&&node.$==2)
      {
       loop(node.$0);
       loop(node.$1);
      }
     else
      if(node!=null&&node.$==3)
       node.$0(elem);
      else
       if(node!=null&&node.$==4)
        oar.push(node.$0);
  }
  nodes=[];
  oar=[];
  loop(tree);
  arr=nodes.slice(0);
  return Dyn.New(elem,Attrs.Flags(tree),arr,oar.length===0?null:{
   $:1,
   $0:function(el)
   {
    Seq.iter(function(f)
    {
     f(el);
    },oar);
   }
  });
 };
 Attrs.Updates=function(dyn)
 {
  return Array.MapTreeReduce(function(x)
  {
   return x.NChanged();
  },View.Const(),View.Map2Unit,dyn.DynNodes);
 };
 Attrs.Empty=function(e)
 {
  return Dyn.New(e,0,[],null);
 };
 Attrs.HasChangeAnim=function(attr)
 {
  var flag;
  flag=4;
  return(attr.DynFlags&flag)===flag;
 };
 Attrs.GetChangeAnim=function(dyn)
 {
  return Attrs.GetAnim(dyn,function($1,$2)
  {
   return $1.NGetChangeAnim($2);
  });
 };
 Attrs.HasEnterAnim=function(attr)
 {
  var flag;
  flag=1;
  return(attr.DynFlags&flag)===flag;
 };
 Attrs.GetEnterAnim=function(dyn)
 {
  return Attrs.GetAnim(dyn,function($1,$2)
  {
   return $1.NGetEnterAnim($2);
  });
 };
 Attrs.HasExitAnim=function(attr)
 {
  var flag;
  flag=2;
  return(attr.DynFlags&flag)===flag;
 };
 Attrs.GetExitAnim=function(dyn)
 {
  return Attrs.GetAnim(dyn,function($1,$2)
  {
   return $1.NGetExitAnim($2);
  });
 };
 Attrs.Dynamic=function(view,set)
 {
  return new AttrProxy({
   $:1,
   $0:new DynamicAttrNode.New(view,set)
  });
 };
 Attrs.GetAnim=function(dyn,f)
 {
  return An.Concat(Arrays.map(function(n)
  {
   return f(n,dyn.DynElem);
  },dyn.DynNodes));
 };
 Attrs.Sync=function(elem,dyn)
 {
  Arrays.iter(function(d)
  {
   d.NSync(elem);
  },dyn.DynNodes);
 };
 Arrays.ofList=function(xs)
 {
  var l,q;
  q=[];
  l=xs;
  while(!(l.$==0))
   {
    q.push(List.head(l));
    l=List.tail(l);
   }
  return q;
 };
 Arrays.exists=function(f,x)
 {
  var e,i,$1,l;
  e=false;
  i=0;
  l=Arrays.length(x);
  while(!e&&i<l)
   if(f(x[i]))
    e=true;
   else
    i=i+1;
  return e;
 };
 Arrays.iter=function(f,arr)
 {
  var i,$1;
  for(i=0,$1=arr.length-1;i<=$1;i++)f(arr[i]);
 };
 Arrays.map=function(f,arr)
 {
  var r,i,$1;
  r=new window.Array(arr.length);
  for(i=0,$1=arr.length-1;i<=$1;i++)r[i]=f(arr[i]);
  return r;
 };
 Arrays.filter=function(f,arr)
 {
  var r,i,$1;
  r=[];
  for(i=0,$1=arr.length-1;i<=$1;i++)if(f(arr[i]))
   r.push(arr[i]);
  return r;
 };
 Arrays.tryPick=function(f,arr)
 {
  var res,i,m;
  res=null;
  i=0;
  while(i<arr.length&&res==null)
   {
    m=f(arr[i]);
    m!=null&&m.$==1?res=m:void 0;
    i=i+1;
   }
  return res;
 };
 Arrays.tryFindIndex=function(f,arr)
 {
  var res,i;
  res=null;
  i=0;
  while(i<arr.length&&res==null)
   {
    f(arr[i])?res={
     $:1,
     $0:i
    }:void 0;
    i=i+1;
   }
  return res;
 };
 Arrays.choose=function(f,arr)
 {
  var q,i,$1,m;
  q=[];
  for(i=0,$1=arr.length-1;i<=$1;i++){
   m=f(arr[i]);
   m==null?void 0:q.push(m.$0);
  }
  return q;
 };
 Arrays.foldBack=function(f,arr,zero)
 {
  var acc,$1,len,i,$2;
  acc=zero;
  len=arr.length;
  for(i=1,$2=len;i<=$2;i++)acc=f(arr[len-i],acc);
  return acc;
 };
 Arrays.ofSeq=function(xs)
 {
  var q,o;
  if(xs instanceof window.Array)
   return xs.slice();
  else
   if(xs instanceof T)
    return Arrays.ofList(xs);
   else
    {
     q=[];
     o=Enumerator.Get(xs);
     try
     {
      while(o.MoveNext())
       q.push(o.Current());
      return q;
     }
     finally
     {
      if("Dispose"in o)
       o.Dispose();
     }
    }
 };
 Arrays.pick=function(f,arr)
 {
  var m;
  m=Arrays.tryPick(f,arr);
  return m==null?Operators.FailWith("KeyNotFoundException"):m.$0;
 };
 Arrays.concat=function(xs)
 {
  return window.Array.prototype.concat.apply([],Arrays.ofSeq(xs));
 };
 Arrays.forall=function(f,x)
 {
  var a,i,$1,l;
  a=true;
  i=0;
  l=Arrays.length(x);
  while(a&&i<l)
   if(f(x[i]))
    i=i+1;
   else
    a=false;
  return a;
 };
 Arrays.create=function(size,value)
 {
  var r,i,$1;
  r=new window.Array(size);
  for(i=0,$1=size-1;i<=$1;i++)r[i]=value;
  return r;
 };
 Arrays.init=function(size,f)
 {
  var r,i,$1;
  size<0?Operators.FailWith("Negative size given."):null;
  r=new window.Array(size);
  for(i=0,$1=size-1;i<=$1;i++)r[i]=f(i);
  return r;
 };
 Unchecked.Equals=function(a,b)
 {
  var m,eqR,k,k$1;
  if(a===b)
   return true;
  else
   {
    m=typeof a;
    if(m=="object")
    {
     if(a===null||a===void 0||b===null||b===void 0)
      return false;
     else
      if("Equals"in a)
       return a.Equals(b);
      else
       if(a instanceof window.Array&&b instanceof window.Array)
        return Unchecked.arrayEquals(a,b);
       else
        if(a instanceof window.Date&&b instanceof window.Date)
         return Unchecked.dateEquals(a,b);
        else
         {
          eqR=[true];
          for(var k$2 in a)if(function(k$3)
          {
           eqR[0]=!a.hasOwnProperty(k$3)||b.hasOwnProperty(k$3)&&Unchecked.Equals(a[k$3],b[k$3]);
           return!eqR[0];
          }(k$2))
           break;
          if(eqR[0])
           {
            for(var k$3 in b)if(function(k$4)
            {
             eqR[0]=!b.hasOwnProperty(k$4)||a.hasOwnProperty(k$4);
             return!eqR[0];
            }(k$3))
             break;
           }
          return eqR[0];
         }
    }
    else
     return m=="function"&&("$Func"in a?a.$Func===b.$Func&&a.$Target===b.$Target:"$Invokes"in a&&"$Invokes"in b&&Unchecked.arrayEquals(a.$Invokes,b.$Invokes));
   }
 };
 Unchecked.arrayEquals=function(a,b)
 {
  var eq,i;
  if(Arrays.length(a)===Arrays.length(b))
   {
    eq=true;
    i=0;
    while(eq&&i<Arrays.length(a))
     {
      !Unchecked.Equals(Arrays.get(a,i),Arrays.get(b,i))?eq=false:void 0;
      i=i+1;
     }
    return eq;
   }
  else
   return false;
 };
 Unchecked.dateEquals=function(a,b)
 {
  return a.getTime()===b.getTime();
 };
 Unchecked.Hash=function(o)
 {
  var m;
  m=typeof o;
  return m=="function"?0:m=="boolean"?o?1:0:m=="number"?o:m=="string"?Unchecked.hashString(o):m=="object"?o==null?0:o instanceof window.Array?Unchecked.hashArray(o):Unchecked.hashObject(o):0;
 };
 Unchecked.hashString=function(s)
 {
  var hash,i,$1;
  if(s===null)
   return 0;
  else
   {
    hash=5381;
    for(i=0,$1=s.length-1;i<=$1;i++)hash=Unchecked.hashMix(hash,s.charCodeAt(i)<<0);
    return hash;
   }
 };
 Unchecked.hashArray=function(o)
 {
  var h,i,$1;
  h=-34948909;
  for(i=0,$1=Arrays.length(o)-1;i<=$1;i++)h=Unchecked.hashMix(h,Unchecked.Hash(Arrays.get(o,i)));
  return h;
 };
 Unchecked.hashObject=function(o)
 {
  var h,k;
  if("GetHashCode"in o)
   return o.GetHashCode();
  else
   {
    h=[0];
    for(var k$1 in o)if(function(key)
    {
     h[0]=Unchecked.hashMix(Unchecked.hashMix(h[0],Unchecked.hashString(key)),Unchecked.Hash(o[key]));
     return false;
    }(k$1))
     break;
    return h[0];
   }
 };
 Unchecked.hashMix=function(x,y)
 {
  return(x<<5)+x+y;
 };
 Unchecked.Compare=function(a,b)
 {
  var $1,m,$2,cmp,k,k$1;
  if(a===b)
   return 0;
  else
   {
    m=typeof a;
    switch(m=="function"?1:m=="boolean"?2:m=="number"?2:m=="string"?2:m=="object"?3:0)
    {
     case 0:
      return typeof b=="undefined"?0:-1;
      break;
     case 1:
      return Operators.FailWith("Cannot compare function values.");
      break;
     case 2:
      return a<b?-1:1;
      break;
     case 3:
      if(a===null)
       $2=-1;
      else
       if(b===null)
        $2=1;
       else
        if("CompareTo"in a)
         $2=a.CompareTo(b);
        else
         if("CompareTo0"in a)
          $2=a.CompareTo0(b);
         else
          if(a instanceof window.Array&&b instanceof window.Array)
           $2=Unchecked.compareArrays(a,b);
          else
           if(a instanceof window.Date&&b instanceof window.Date)
            $2=Unchecked.compareDates(a,b);
           else
            {
             cmp=[0];
             for(var k$2 in a)if(function(k$3)
             {
              return!a.hasOwnProperty(k$3)?false:!b.hasOwnProperty(k$3)?(cmp[0]=1,true):(cmp[0]=Unchecked.Compare(a[k$3],b[k$3]),cmp[0]!==0);
             }(k$2))
              break;
             if(cmp[0]===0)
              {
               for(var k$3 in b)if(function(k$4)
               {
                return!b.hasOwnProperty(k$4)?false:!a.hasOwnProperty(k$4)&&(cmp[0]=-1,true);
               }(k$3))
                break;
              }
             $2=cmp[0];
            }
      return $2;
      break;
    }
   }
 };
 Unchecked.compareArrays=function(a,b)
 {
  var cmp,i;
  if(Arrays.length(a)<Arrays.length(b))
   return -1;
  else
   if(Arrays.length(a)>Arrays.length(b))
    return 1;
   else
    {
     cmp=0;
     i=0;
     while(cmp===0&&i<Arrays.length(a))
      {
       cmp=Unchecked.Compare(Arrays.get(a,i),Arrays.get(b,i));
       i=i+1;
      }
     return cmp;
    }
 };
 Unchecked.compareDates=function(a,b)
 {
  return Unchecked.Compare(a.getTime(),b.getTime());
 };
 DomUtility.Doc=function()
 {
  SC$4.$cctor();
  return SC$4.Doc;
 };
 DomUtility.IterSelector=function(el,selector,f)
 {
  var l,i,$1;
  l=el.querySelectorAll(selector);
  for(i=0,$1=l.length-1;i<=$1;i++)f(l[i]);
 };
 DomUtility.ChildrenArray=function(element)
 {
  var a,i,$1;
  a=[];
  for(i=0,$1=element.childNodes.length-1;i<=$1;i++)a.push(element.childNodes[i]);
  return a;
 };
 DomUtility.CreateText=function(s)
 {
  return DomUtility.Doc().createTextNode(s);
 };
 DomUtility.SetAttr=function(el,name,value)
 {
  el.setAttribute(name,value);
 };
 DomUtility.InsertAt=function(parent,pos,node)
 {
  var m;
  if(!(node.parentNode===parent&&pos===(m=node.nextSibling,Unchecked.Equals(m,null)?null:m)))
   parent.insertBefore(node,pos);
 };
 DomUtility.RemoveNode=function(parent,el)
 {
  if(el.parentNode===parent)
   parent.removeChild(el);
 };
 SC$2.$cctor=Runtime.Cctor(function()
 {
  SC$2.counter=0;
  SC$2.$cctor=window.ignore;
 });
 Enumerator.Get=function(x)
 {
  return x instanceof window.Array?Enumerator.ArrayEnumerator(x):Unchecked.Equals(typeof x,"string")?Enumerator.StringEnumerator(x):x.GetEnumerator();
 };
 Enumerator.ArrayEnumerator=function(s)
 {
  return new T$1.New(0,null,function(e)
  {
   var i;
   i=e.s;
   return i<Arrays.length(s)&&(e.c=Arrays.get(s,i),e.s=i+1,true);
  },void 0);
 };
 Enumerator.StringEnumerator=function(s)
 {
  return new T$1.New(0,null,function(e)
  {
   var i;
   i=e.s;
   return i<s.length&&(e.c=s.charCodeAt(i),e.s=i+1,true);
  },void 0);
 };
 Enumerator.Get0=function(x)
 {
  return x instanceof window.Array?Enumerator.ArrayEnumerator(x):Unchecked.Equals(typeof x,"string")?Enumerator.StringEnumerator(x):"GetEnumerator0"in x?x.GetEnumerator0():x.GetEnumerator();
 };
 SC$3.$cctor=Runtime.Cctor(function()
 {
  SC$3.EmptyAttr=null;
  SC$3.$cctor=window.ignore;
 });
 Dictionary=Collections.Dictionary=Runtime.Class({
  ContainsKey:function(k)
  {
   var $this,d;
   $this=this;
   d=this.data[this.hash(k)];
   return d&&Arrays.exists(function(a)
   {
    return $this.equals.apply(null,[(Operators.KeyValue(a))[0],k]);
   },d);
  },
  TryGetValue:function(k,res)
  {
   var $this,d,v;
   $this=this;
   d=this.data[this.hash(k)];
   return d&&(v=Arrays.tryPick(function(a)
   {
    var a$1;
    a$1=Operators.KeyValue(a);
    return $this.equals.apply(null,[a$1[0],k])?{
     $:1,
     $0:a$1[1]
    }:null;
   },d),v!=null&&v.$==1&&(res.set(v.$0),true));
  },
  get_Item:function(k)
  {
   return this.get(k);
  },
  set_Item:function(k,v)
  {
   this.set(k,v);
  },
  get:function(k)
  {
   var $this,d;
   $this=this;
   d=this.data[this.hash(k)];
   return d?Arrays.pick(function(a)
   {
    var a$1;
    a$1=Operators.KeyValue(a);
    return $this.equals.apply(null,[a$1[0],k])?{
     $:1,
     $0:a$1[1]
    }:null;
   },d):DictionaryUtil.notPresent();
  },
  set:function(k,v)
  {
   var $this,h,d,m;
   $this=this;
   h=this.hash(k);
   d=this.data[h];
   d?(m=Arrays.tryFindIndex(function(a)
   {
    return $this.equals.apply(null,[(Operators.KeyValue(a))[0],k]);
   },d),m==null?(this.count=this.count+1,d.push({
    K:k,
    V:v
   })):d[m.$0]={
    K:k,
    V:v
   }):(this.count=this.count+1,this.data[h]=new window.Array({
    K:k,
    V:v
   }));
  },
  GetEnumerator:function()
  {
   return Enumerator.Get0(this);
  },
  GetEnumerator0:function()
  {
   return Enumerator.Get0(Arrays.concat(JSModule.GetFieldValues(this.data)));
  }
 },null,Dictionary);
 Dictionary.New$5=Runtime.Ctor(function()
 {
  Dictionary.New$6.call(this,[],Unchecked.Equals,Unchecked.Hash);
 },Dictionary);
 Dictionary.New$6=Runtime.Ctor(function(init,equals,hash)
 {
  var e,x;
  this.equals=equals;
  this.hash=hash;
  this.count=0;
  this.data=[];
  e=Enumerator.Get(init);
  try
  {
   while(e.MoveNext())
    {
     x=e.Current();
     this.set(x.K,x.V);
    }
  }
  finally
  {
   if("Dispose"in e)
    e.Dispose();
  }
 },Dictionary);
 Docs.LoadedTemplates=function()
 {
  SC$5.$cctor();
  return SC$5.LoadedTemplates;
 };
 Docs.LinkElement=function(el,children)
 {
  Docs.InsertDoc(el,children,null);
 };
 Docs.CreateRunState=function(parent,doc)
 {
  return RunState.New(NodeSet.get_Empty(),Docs.CreateElemNode(parent,Attrs.EmptyAttr(),doc));
 };
 Docs.PerformAnimatedUpdate=function(st,doc)
 {
  var b;
  return An.get_UseAnimations()?(b=null,Concurrency.Delay(function()
  {
   var cur,change,enter;
   cur=NodeSet.FindAll(doc);
   change=Docs.ComputeChangeAnim(st,cur);
   enter=Docs.ComputeEnterAnim(st,cur);
   return Concurrency.Bind(An.Play(An.Append(change,Docs.ComputeExitAnim(st,cur))),function()
   {
    return Concurrency.Bind(Docs.SyncElemNodesNextFrame(st),function()
    {
     return Concurrency.Bind(An.Play(enter),function()
     {
      st.PreviousNodes=cur;
      return Concurrency.Return(null);
     });
    });
   });
  })):Docs.SyncElemNodesNextFrame(st);
 };
 Docs.TextHoleRE=function()
 {
  SC$5.$cctor();
  return SC$5.TextHoleRE;
 };
 Docs.InsertDoc=function(parent,doc,pos)
 {
  var d;
  return doc!=null&&doc.$==1?Docs.InsertNode(parent,doc.$0.El,pos):doc!=null&&doc.$==2?(d=doc.$0,(d.Dirty=false,Docs.InsertDoc(parent,d.Current,pos))):doc==null?pos:doc!=null&&doc.$==4?Docs.InsertNode(parent,doc.$0.Text,pos):doc!=null&&doc.$==5?Docs.InsertNode(parent,doc.$0,pos):doc!=null&&doc.$==6?Arrays.foldBack(function($1,$2)
  {
   return $1.constructor===window.Object?Docs.InsertDoc(parent,$1,$2):Docs.InsertNode(parent,$1,$2);
  },doc.$0.Els,pos):Docs.InsertDoc(parent,doc.$0,Docs.InsertDoc(parent,doc.$1,pos));
 };
 Docs.CreateElemNode=function(el,attr,children)
 {
  var attr$1;
  Docs.LinkElement(el,children);
  attr$1=Attrs.Insert(el,attr);
  return DocElemNode.New(attr$1,children,null,el,Fresh.Int(),Runtime.GetOptional(attr$1.OnAfterRender));
 };
 Docs.ComputeChangeAnim=function(st,cur)
 {
  var relevant,a;
  relevant=(a=function(n)
  {
   return Attrs.HasChangeAnim(n.Attr);
  },function(a$1)
  {
   return NodeSet.Filter(a,a$1);
  });
  return An.Concat(Arrays.map(function(n)
  {
   return Attrs.GetChangeAnim(n.Attr);
  },NodeSet.ToArray(NodeSet.Intersect(relevant(st.PreviousNodes),relevant(cur)))));
 };
 Docs.ComputeEnterAnim=function(st,cur)
 {
  return An.Concat(Arrays.map(function(n)
  {
   return Attrs.GetEnterAnim(n.Attr);
  },NodeSet.ToArray(NodeSet.Except(st.PreviousNodes,NodeSet.Filter(function(n)
  {
   return Attrs.HasEnterAnim(n.Attr);
  },cur)))));
 };
 Docs.ComputeExitAnim=function(st,cur)
 {
  return An.Concat(Arrays.map(function(n)
  {
   return Attrs.GetExitAnim(n.Attr);
  },NodeSet.ToArray(NodeSet.Except(cur,NodeSet.Filter(function(n)
  {
   return Attrs.HasExitAnim(n.Attr);
  },st.PreviousNodes)))));
 };
 Docs.SyncElemNodesNextFrame=function(st)
 {
  var a;
  a=function(ok)
  {
   window.requestAnimationFrame(function()
   {
    Docs.SyncElemNode(st.Top);
    ok();
   });
  };
  return Concurrency.FromContinuations(function($1,$2,$3)
  {
   return a.apply(null,[$1,$2,$3]);
  });
 };
 Docs.InsertBeforeDelim=function(afterDelim,doc)
 {
  var p,before;
  p=afterDelim.parentNode;
  before=window.document.createTextNode("");
  p.insertBefore(before,afterDelim);
  Docs.LinkPrevElement(afterDelim,doc);
  return before;
 };
 Docs.InsertNode=function(parent,node,pos)
 {
  DomUtility.InsertAt(parent,pos,node);
  return node;
 };
 Docs.SyncElemNode=function(el)
 {
  Docs.SyncElement(el);
  Docs.Sync(el.Children);
  Docs.AfterRender(el);
 };
 Docs.CreateTextNode=function()
 {
  return{
   Text:DomUtility.CreateText(""),
   Dirty:false,
   Value:""
  };
 };
 Docs.UpdateTextNode=function(n,t)
 {
  n.Value=t;
  n.Dirty=true;
 };
 Docs.LinkPrevElement=function(el,children)
 {
  Docs.InsertDoc(el.parentNode,children,el);
 };
 Docs.SyncElement=function(el)
 {
  function hasDirtyChildren(el$1)
  {
   function dirty(doc)
   {
    var d,t;
    return doc!=null&&doc.$==0?dirty(doc.$0)||dirty(doc.$1):doc!=null&&doc.$==2?(d=doc.$0,d.Dirty||dirty(d.Current)):doc!=null&&doc.$==6&&(t=doc.$0,t.Dirty||Arrays.exists(hasDirtyChildren,t.Holes));
   }
   return dirty(el$1.Children);
  }
  Attrs.Sync(el.El,el.Attr);
  hasDirtyChildren(el)?Docs.DoSyncElement(el):void 0;
 };
 Docs.Sync=function(doc)
 {
  var d,t;
  if(doc!=null&&doc.$==1)
   Docs.SyncElemNode(doc.$0);
  else
   if(doc!=null&&doc.$==2)
    Docs.Sync(doc.$0.Current);
   else
    if(doc==null)
     ;
    else
     if(doc!=null&&doc.$==5)
      ;
     else
      if(doc!=null&&doc.$==4)
       {
        d=doc.$0;
        d.Dirty?(d.Text.nodeValue=d.Value,d.Dirty=false):void 0;
       }
      else
       if(doc!=null&&doc.$==6)
        {
         t=doc.$0;
         Arrays.iter(function(e)
         {
          Docs.SyncElemNode(e);
         },t.Holes);
         Arrays.iter(function(t$1)
         {
          Attrs.Sync(t$1[0],t$1[1]);
         },t.Attrs);
         Docs.AfterRender(t);
        }
       else
        {
         Docs.Sync(doc.$0);
         Docs.Sync(doc.$1);
        }
 };
 Docs.AfterRender=function(el)
 {
  var m;
  m=Runtime.GetOptional(el.Render);
  m!=null&&m.$==1?(m.$0(el.El),Runtime.SetOptional(el,"Render",null)):void 0;
 };
 Docs.DoSyncElement=function(el)
 {
  var parent,p,m;
  function ins(doc,pos)
  {
   var d,t;
   return doc!=null&&doc.$==1?doc.$0.El:doc!=null&&doc.$==2?(d=doc.$0,d.Dirty?(d.Dirty=false,Docs.InsertDoc(parent,d.Current,pos)):ins(d.Current,pos)):doc==null?pos:doc!=null&&doc.$==4?doc.$0.Text:doc!=null&&doc.$==5?doc.$0:doc!=null&&doc.$==6?(t=doc.$0,(t.Dirty?t.Dirty=false:void 0,Arrays.foldBack(function($1,$2)
   {
    return $1.constructor===window.Object?ins($1,$2):$1;
   },t.Els,pos))):ins(doc.$0,ins(doc.$1,pos));
  }
  parent=el.El;
  DomNodes.Iter((p=el.El,function(e)
  {
   DomUtility.RemoveNode(p,e);
  }),DomNodes.Except(DomNodes.DocChildren(el),DomNodes.Children(el.El,Runtime.GetOptional(el.Delimiters))));
  ins(el.Children,(m=Runtime.GetOptional(el.Delimiters),m!=null&&m.$==1?m.$0[1]:null));
 };
 SC$4.$cctor=Runtime.Cctor(function()
 {
  SC$4.Doc=window.document;
  SC$4.$cctor=window.ignore;
 });
 Mailbox.StartProcessor=function(procAsync)
 {
  var st;
  function work()
  {
   var b;
   b=null;
   return Concurrency.Delay(function()
   {
    return Concurrency.Bind(procAsync,function()
    {
     var m;
     m=st[0];
     return Unchecked.Equals(m,1)?(st[0]=0,Concurrency.Zero()):Unchecked.Equals(m,2)?(st[0]=1,work()):Concurrency.Zero();
    });
   });
  }
  st=[0];
  return function()
  {
   var m;
   m=st[0];
   Unchecked.Equals(m,0)?(st[0]=1,Concurrency.Start(work(),null)):Unchecked.Equals(m,1)?st[0]=2:void 0;
  };
 };
 View.Sink=function(act,a)
 {
  function loop()
  {
   Snap.WhenRun(a(),act,function()
   {
    Concurrency.scheduler().Fork(loop);
   });
  }
  Concurrency.scheduler().Fork(loop);
 };
 View.Map=function(fn,a)
 {
  return View.CreateLazy(function()
  {
   return Snap.Map(fn,a());
  });
 };
 View.Map3=function(fn,a,a$1,a$2)
 {
  return View.CreateLazy(function()
  {
   return Snap.Map3(fn,a(),a$1(),a$2());
  });
 };
 View.Sequence=function(views)
 {
  return View.CreateLazy(function()
  {
   return Snap.Sequence(Seq.map(function(a)
   {
    return a();
   },views));
  });
 };
 View.Map2=function(fn,a,a$1)
 {
  return View.CreateLazy(function()
  {
   return Snap.Map2(fn,a(),a$1());
  });
 };
 View.Const=function(x)
 {
  var o;
  o=Snap.New({
   $:0,
   $0:x
  });
  return function()
  {
   return o;
  };
 };
 View.Map2Unit=function(a,a$1)
 {
  return View.CreateLazy(function()
  {
   return Snap.Map2Unit(a(),a$1());
  });
 };
 View.CreateLazy=function(observe)
 {
  var lv;
  lv={
   c:null,
   o:observe
  };
  return function()
  {
   var c,$1;
   c=lv.c;
   return c===null?(c=lv.o(),lv.c=c,($1=c.s,$1!=null&&$1.$==0)&&true?lv.o=null:Snap.WhenObsoleteRun(c,function()
   {
    lv.c=null;
   }),c):c;
  };
 };
 T$1=Enumerator.T=Runtime.Class({
  MoveNext:function()
  {
   return this.n(this);
  },
  Current:function()
  {
   return this.c;
  },
  Dispose:function()
  {
   if(this.d)
    this.d(this);
  }
 },null,T$1);
 T$1.New=Runtime.Ctor(function(s,c,n,d)
 {
  this.s=s;
  this.c=c;
  this.n=n;
  this.d=d;
 },T$1);
 SC$5.$cctor=Runtime.Cctor(function()
 {
  SC$5.LoadedTemplates=new Dictionary.New$5();
  SC$5.TextHoleRE="\\${([^}]+)}";
  SC$5.$cctor=window.ignore;
 });
 Slice.string=function(source,start,finish)
 {
  return start==null?finish!=null&&finish.$==1?source.slice(0,finish.$0+1):"":finish==null?source.slice(start.$0):source.slice(start.$0,finish.$0+1);
 };
 Strings.concat=function(separator,strings)
 {
  return Arrays.ofSeq(strings).join(separator);
 };
 Strings.StartsWith=function(t,s)
 {
  return t.substring(0,s.length)==s;
 };
 Strings.SplitChars=function(s,sep,opts)
 {
  return Strings.Split(s,new window.RegExp("["+Strings.RegexEscape(String$1.fromCharCode.apply(void 0,sep))+"]"),opts);
 };
 Strings.Replace=function(subject,search,replace)
 {
  function replaceLoop(subj)
  {
   var index,replaced,nextStartIndex;
   index=subj.indexOf(search);
   return index!==-1?(replaced=Strings.ReplaceOnce(subj,search,replace),(nextStartIndex=index+replace.length,Strings.Substring(replaced,0,index+replace.length)+replaceLoop(replaced.substring(nextStartIndex)))):subj;
  }
  return replaceLoop(subject);
 };
 Strings.RegexEscape=function(s)
 {
  return s.replace(new window.RegExp("[-\\/\\\\^$*+?.()|[\\]{}]","g"),"\\$&");
 };
 Strings.Split=function(s,pat,opts)
 {
  return opts===1?Arrays.filter(function(x)
  {
   return x!=="";
  },Strings.SplitWith(s,pat)):Strings.SplitWith(s,pat);
 };
 Strings.ReplaceOnce=function(string,search,replace)
 {
  return string.replace(search,replace);
 };
 Strings.forall=function(f,s)
 {
  return Seq.forall(f,Strings.protect(s));
 };
 Strings.SplitWith=function(str,pat)
 {
  return str.split(pat);
 };
 Strings.Substring=function(s,ix,ct)
 {
  return s.substr(ix,ct);
 };
 Strings.protect=function(s)
 {
  return s===null?"":s;
 };
 Seq.fold=function(f,x,s)
 {
  var r,e;
  r=x;
  e=Enumerator.Get(s);
  try
  {
   while(e.MoveNext())
    r=f(r,e.Current());
   return r;
  }
  finally
  {
   if("Dispose"in e)
    e.Dispose();
  }
 };
 Seq.iter=function(p,s)
 {
  var e;
  e=Enumerator.Get(s);
  try
  {
   while(e.MoveNext())
    p(e.Current());
  }
  finally
  {
   if("Dispose"in e)
    e.Dispose();
  }
 };
 Seq.map=function(f,s)
 {
  return{
   GetEnumerator:function()
   {
    var en;
    en=Enumerator.Get(s);
    return new T$1.New(null,null,function(e)
    {
     return en.MoveNext()&&(e.c=f(en.Current()),true);
    },function()
    {
     en.Dispose();
    });
   }
  };
 };
 Seq.max=function(s)
 {
  return Seq.reduce(function($1,$2)
  {
   return Unchecked.Compare($1,$2)>=0?$1:$2;
  },s);
 };
 Seq.forall=function(p,s)
 {
  return!Seq.exists(function(x)
  {
   return!p(x);
  },s);
 };
 Seq.reduce=function(f,source)
 {
  var e,r;
  e=Enumerator.Get(source);
  try
  {
   if(!e.MoveNext())
    Operators.FailWith("The input sequence was empty");
   r=e.Current();
   while(e.MoveNext())
    r=f(r,e.Current());
   return r;
  }
  finally
  {
   if("Dispose"in e)
    e.Dispose();
  }
 };
 Seq.exists=function(p,s)
 {
  var e,r;
  e=Enumerator.Get(s);
  try
  {
   r=false;
   while(!r&&e.MoveNext())
    r=p(e.Current());
   return r;
  }
  finally
  {
   if("Dispose"in e)
    e.Dispose();
  }
 };
 HashSet=Collections.HashSet=Runtime.Class({
  Contains:function(item)
  {
   var arr;
   arr=this.data[this.hash(item)];
   return arr==null?false:this.arrContains(item,arr);
  },
  Add:function(item)
  {
   return this.add(item);
  },
  arrContains:function(item,arr)
  {
   var c,i,$1,l;
   c=true;
   i=0;
   l=arr.length;
   while(c&&i<l)
    if(this.equals.apply(null,[arr[i],item]))
     c=false;
    else
     i=i+1;
   return!c;
  },
  add:function(item)
  {
   var h,arr;
   h=this.hash(item);
   arr=this.data[h];
   return arr==null?(this.data[h]=[item],this.count=this.count+1,true):this.arrContains(item,arr)?false:(arr.push(item),this.count=this.count+1,true);
  },
  IntersectWith:function(xs)
  {
   var other,all,i,$1,item;
   other=new HashSet.New$4(xs,this.equals,this.hash);
   all=HashSetUtil.concat(this.data);
   for(i=0,$1=all.length-1;i<=$1;i++){
    item=all[i];
    !other.Contains(item)?this.Remove(item):void 0;
   }
  },
  get_Count:function()
  {
   return this.count;
  },
  CopyTo:function(arr)
  {
   var i,all,i$1,$1;
   i=0;
   all=HashSetUtil.concat(this.data);
   for(i$1=0,$1=all.length-1;i$1<=$1;i$1++)Arrays.set(arr,i$1,all[i$1]);
  },
  ExceptWith:function(xs)
  {
   var e;
   e=Enumerator.Get(xs);
   try
   {
    while(e.MoveNext())
     this.Remove(e.Current());
   }
   finally
   {
    if("Dispose"in e)
     e.Dispose();
   }
  },
  Remove:function(item)
  {
   var arr;
   arr=this.data[this.hash(item)];
   return arr==null?false:this.arrRemove(item,arr)&&(this.count=this.count-1,true);
  },
  arrRemove:function(item,arr)
  {
   var c,i,$1,l;
   c=true;
   i=0;
   l=arr.length;
   while(c&&i<l)
    if(this.equals.apply(null,[arr[i],item]))
     {
      arr.splice.apply(arr,[i,1]);
      c=false;
     }
    else
     i=i+1;
   return!c;
  },
  GetEnumerator:function()
  {
   return Enumerator.Get(HashSetUtil.concat(this.data));
  },
  GetEnumerator0:function()
  {
   return Enumerator.Get(HashSetUtil.concat(this.data));
  }
 },null,HashSet);
 HashSet.New$3=Runtime.Ctor(function()
 {
  HashSet.New$4.call(this,[],Unchecked.Equals,Unchecked.Hash);
 },HashSet);
 HashSet.New$4=Runtime.Ctor(function(init,equals,hash)
 {
  var e;
  this.equals=equals;
  this.hash=hash;
  this.data=[];
  this.count=0;
  e=Enumerator.Get(init);
  try
  {
   while(e.MoveNext())
    this.add(e.Current());
  }
  finally
  {
   if("Dispose"in e)
    e.Dispose();
  }
 },HashSet);
 HashSet.New$2=Runtime.Ctor(function(init)
 {
  HashSet.New$4.call(this,init,Unchecked.Equals,Unchecked.Hash);
 },HashSet);
 DocElemNode=Next.DocElemNode=Runtime.Class({
  Equals:function(o)
  {
   return this.ElKey===o.ElKey;
  },
  GetHashCode:function()
  {
   return this.ElKey;
  }
 },null,DocElemNode);
 DocElemNode.New=function(Attr,Children,Delimiters,El,ElKey,Render)
 {
  var $1;
  return new DocElemNode(($1={
   Attr:Attr,
   Children:Children,
   El:El,
   ElKey:ElKey
  },(Runtime.SetOptional($1,"Delimiters",Delimiters),Runtime.SetOptional($1,"Render",Render),$1)));
 };
 RunState.New=function(PreviousNodes,Top)
 {
  return{
   PreviousNodes:PreviousNodes,
   Top:Top
  };
 };
 NodeSet.get_Empty=function()
 {
  return{
   $:0,
   $0:new HashSet.New$3()
  };
 };
 NodeSet.FindAll=function(doc)
 {
  var q;
  function loop(node)
  {
   if(node!=null&&node.$==0)
    {
     loop(node.$0);
     loop(node.$1);
    }
   else
    if(node!=null&&node.$==1)
     loopEN(node.$0);
    else
     if(node!=null&&node.$==2)
      loop(node.$0.Current);
     else
      if(node!=null&&node.$==6)
       Arrays.iter(loopEN,node.$0.Holes);
  }
  function loopEN(el)
  {
   q.push(el);
   loop(el.Children);
  }
  q=[];
  loop(doc);
  return{
   $:0,
   $0:new HashSet.New$2(q)
  };
 };
 NodeSet.Filter=function(f,a)
 {
  return{
   $:0,
   $0:HashSet$1.Filter(f,a.$0)
  };
 };
 NodeSet.Intersect=function(a,a$1)
 {
  return{
   $:0,
   $0:HashSet$1.Intersect(a.$0,a$1.$0)
  };
 };
 NodeSet.ToArray=function(a)
 {
  return HashSet$1.ToArray(a.$0);
 };
 NodeSet.Except=function(a,a$1)
 {
  return{
   $:0,
   $0:HashSet$1.Except(a.$0,a$1.$0)
  };
 };
 An.get_UseAnimations=function()
 {
  return Anims.UseAnimations();
 };
 An.Play=function(anim)
 {
  var b;
  b=null;
  return Concurrency.Delay(function()
  {
   return Concurrency.Bind(An.Run(function()
   {
   },Anims.Actions(anim)),function()
   {
    Anims.Finalize(anim);
    return Concurrency.Return(null);
   });
  });
 };
 An.Append=function(a,a$1)
 {
  return{
   $:0,
   $0:AppendList.Append(a.$0,a$1.$0)
  };
 };
 An.Concat=function(xs)
 {
  return{
   $:0,
   $0:AppendList.Concat(Seq.map(Anims.List,xs))
  };
 };
 An.Run=function(k,anim)
 {
  var dur,a;
  dur=anim.Duration;
  return dur===0?Concurrency.Zero():(a=function(ok)
  {
   function loop(start,now)
   {
    var t;
    t=now-start;
    anim.Compute(t);
    k();
    return t<=dur?void window.requestAnimationFrame(function(t$1)
    {
     loop(start,t$1);
    }):ok();
   }
   window.requestAnimationFrame(function(t)
   {
    loop(t,t);
   });
  },Concurrency.FromContinuations(function($1,$2,$3)
  {
   return a.apply(null,[$1,$2,$3]);
  }));
 };
 An.get_Empty=function()
 {
  return{
   $:0,
   $0:AppendList.Empty()
  };
 };
 CheckedInput=Next.CheckedInput=Runtime.Class({
  get_Input:function()
  {
   return this.$==1?this.$0:this.$==2?this.$0:this.$1;
  }
 },null,CheckedInput);
 Elt=Next.Elt=Runtime.Class({},Doc,Elt);
 Elt.TreeNode=function(tree,updates)
 {
  var rvUpdates,x,f;
  rvUpdates=Updates.Create(updates);
  return new Elt.New$1({
   $:6,
   $0:tree
  },View.Map2Unit((x=Arrays.map((f=function(t)
  {
   return t[1];
  },function(x$1)
  {
   return Attrs.Updates(f(x$1));
  }),tree.Attrs),Array.TreeReduce(View.Const(),View.Map2Unit,x)),rvUpdates.v),Arrays.get(tree.Els,0),rvUpdates);
 };
 Elt.New$1=Runtime.Ctor(function(docNode,updates,elt,rvUpdates)
 {
  Doc.New.call(this,docNode,updates);
  this.docNode$1=docNode;
  this.updates$1=updates;
  this.elt=elt;
  this.rvUpdates=rvUpdates;
 },Elt);
 DictionaryUtil.notPresent=function()
 {
  return Operators.FailWith("The given key was not present in the dictionary.");
 };
 Dyn.New=function(DynElem,DynFlags,DynNodes,OnAfterRender)
 {
  var $1;
  $1={
   DynElem:DynElem,
   DynFlags:DynFlags,
   DynNodes:DynNodes
  };
  Runtime.SetOptional($1,"OnAfterRender",OnAfterRender);
  return $1;
 };
 Concurrency.Delay=function(mk)
 {
  return function(c)
  {
   try
   {
    (mk(null))(c);
   }
   catch(e)
   {
    c.k({
     $:1,
     $0:e
    });
   }
  };
 };
 Concurrency.Bind=function(r,f)
 {
  return Concurrency.checkCancel(function(c)
  {
   r({
    k:function(a)
    {
     var x;
     if(a.$==0)
      {
       x=a.$0;
       Concurrency.scheduler().Fork(function()
       {
        try
        {
         (f(x))(c);
        }
        catch(e)
        {
         c.k({
          $:1,
          $0:e
         });
        }
       });
      }
     else
      Concurrency.scheduler().Fork(function()
      {
       c.k(a);
      });
    },
    ct:c.ct
   });
  });
 };
 Concurrency.Zero=function()
 {
  SC$6.$cctor();
  return SC$6.Zero;
 };
 Concurrency.Start=function(c,ctOpt)
 {
  var ct,d;
  ct=(d=(Concurrency.defCTS())[0],ctOpt==null?d:ctOpt.$0);
  Concurrency.scheduler().Fork(function()
  {
   if(!ct.c)
    c({
     k:function(a)
     {
      if(a.$==1)
       Concurrency.UncaughtAsyncError(a.$0);
     },
     ct:ct
    });
  });
 };
 Concurrency.Return=function(x)
 {
  return function(c)
  {
   c.k({
    $:0,
    $0:x
   });
  };
 };
 Concurrency.checkCancel=function(r)
 {
  return function(c)
  {
   if(c.ct.c)
    Concurrency.cancel(c);
   else
    r(c);
  };
 };
 Concurrency.defCTS=function()
 {
  SC$6.$cctor();
  return SC$6.defCTS;
 };
 Concurrency.UncaughtAsyncError=function(e)
 {
  console.log("WebSharper: Uncaught asynchronous exception",e);
 };
 Concurrency.FromContinuations=function(subscribe)
 {
  return function(c)
  {
   var continued,once;
   continued=[false];
   once=function(cont)
   {
    if(continued[0])
     Operators.FailWith("A continuation provided by Async.FromContinuations was invoked multiple times");
    else
     {
      continued[0]=true;
      Concurrency.scheduler().Fork(cont);
     }
   };
   subscribe(function(a)
   {
    once(function()
    {
     c.k({
      $:0,
      $0:a
     });
    });
   },function(e)
   {
    once(function()
    {
     c.k({
      $:1,
      $0:e
     });
    });
   },function(e)
   {
    once(function()
    {
     c.k({
      $:2,
      $0:e
     });
    });
   });
  };
 };
 Concurrency.cancel=function(c)
 {
  c.k({
   $:2,
   $0:new OperationCanceledException.New(c.ct)
  });
 };
 Concurrency.scheduler=function()
 {
  SC$6.$cctor();
  return SC$6.scheduler;
 };
 Anims.UseAnimations=function()
 {
  SC$7.$cctor();
  return SC$7.UseAnimations;
 };
 Anims.Actions=function(a)
 {
  return Anims.ConcatActions(Arrays.choose(function(a$1)
  {
   return a$1.$==1?{
    $:1,
    $0:a$1.$0
   }:null;
  },AppendList.ToArray(a.$0)));
 };
 Anims.Finalize=function(a)
 {
  Arrays.iter(function(a$1)
  {
   if(a$1.$==0)
    a$1.$0();
  },AppendList.ToArray(a.$0));
 };
 Anims.List=function(a)
 {
  return a.$0;
 };
 Anims.ConcatActions=function(xs)
 {
  var xs$1,m,dur,xs$2;
  xs$1=Array.ofSeqNonCopying(xs);
  m=Arrays.length(xs$1);
  return m===0?Anims.Const():m===1?Arrays.get(xs$1,0):(dur=Seq.max(Seq.map(function(anim)
  {
   return anim.Duration;
  },xs$1)),(xs$2=Arrays.map(function(a)
  {
   return Anims.Prolong(dur,a);
  },xs$1),Anims.Def(dur,function(t)
  {
   Arrays.iter(function(anim)
   {
    anim.Compute(t);
   },xs$2);
  })));
 };
 Anims.Const=function(v)
 {
  return Anims.Def(0,function()
  {
   return v;
  });
 };
 Anims.Prolong=function(nextDuration,anim)
 {
  var comp,dur,last;
  comp=anim.Compute;
  dur=anim.Duration;
  last=Lazy.Create(function()
  {
   return anim.Compute(anim.Duration);
  });
  return{
   Compute:function(t)
   {
    return t>=dur?last.f():comp(t);
   },
   Duration:nextDuration
  };
 };
 Anims.Def=function(d,f)
 {
  return{
   Compute:f,
   Duration:d
  };
 };
 AppendList.Append=function(x,y)
 {
  return x.$==0?y:y.$==0?x:{
   $:2,
   $0:x,
   $1:y
  };
 };
 AppendList.Concat=function(xs)
 {
  var x;
  x=Array.ofSeqNonCopying(xs);
  return Array.TreeReduce(AppendList.Empty(),AppendList.Append,x);
 };
 AppendList.ToArray=function(xs)
 {
  var out;
  function loop(xs$1)
  {
   if(xs$1.$==1)
    out.push(xs$1.$0);
   else
    if(xs$1.$==2)
     {
      loop(xs$1.$0);
      loop(xs$1.$1);
     }
    else
     if(xs$1.$==3)
      Arrays.iter(function(v)
      {
       out.push(v);
      },xs$1.$0);
  }
  out=[];
  loop(xs);
  return out.slice(0);
 };
 AppendList.Empty=function()
 {
  SC$8.$cctor();
  return SC$8.Empty;
 };
 String.isBlank=function(s)
 {
  return Strings.forall(Char.IsWhiteSpace,s);
 };
 Updates=Next.Updates=Runtime.Class({},null,Updates);
 Updates.Create=function(v)
 {
  var _var;
  _var=null;
  _var=Updates.New(v,null,function()
  {
   var c;
   c=_var.s;
   return c===null?(c=Snap.Copy(_var.c()),_var.s=c,Snap.WhenObsoleteRun(c,function()
   {
    _var.s=null;
   }),c):c;
  });
  return _var;
 };
 Updates.New=function(Current,Snap$1,VarView)
 {
  return new Updates({
   c:Current,
   s:Snap$1,
   v:VarView
  });
 };
 SC$6.$cctor=Runtime.Cctor(function()
 {
  SC$6.noneCT={
   c:false,
   r:[]
  };
  SC$6.scheduler=new Scheduler.New();
  SC$6.defCTS=[new CancellationTokenSource.New()];
  SC$6.Zero=Concurrency.Return();
  SC$6.GetCT=function(c)
  {
   c.k({
    $:0,
    $0:c.ct
   });
  };
  SC$6.$cctor=window.ignore;
 });
 SC$7.$cctor=Runtime.Cctor(function()
 {
  SC$7.CubicInOut=Easing.Custom(function(t)
  {
   var t2;
   t2=t*t;
   return 3*t2-2*(t2*t);
  });
  SC$7.UseAnimations=true;
  SC$7.$cctor=window.ignore;
 });
 HashSet$1.Filter=function(ok,set)
 {
  return new HashSet.New$2(Arrays.filter(ok,HashSet$1.ToArray(set)));
 };
 HashSet$1.Intersect=function(a,b)
 {
  var set;
  set=new HashSet.New$2(HashSet$1.ToArray(a));
  set.IntersectWith(HashSet$1.ToArray(b));
  return set;
 };
 HashSet$1.ToArray=function(set)
 {
  var arr;
  arr=Arrays.create(set.get_Count(),void 0);
  set.CopyTo(arr);
  return arr;
 };
 HashSet$1.Except=function(excluded,included)
 {
  var set;
  set=new HashSet.New$2(HashSet$1.ToArray(included));
  set.ExceptWith(HashSet$1.ToArray(excluded));
  return set;
 };
 Char.IsWhiteSpace=function(c)
 {
  return String$1.fromCharCode(c).match(new window.RegExp("\\s"))!==null;
 };
 Numeric.TryParse=function(s,min,max,r)
 {
  var x,ok;
  x=+s;
  ok=x===x-x%1&&x>=min&&x<=max;
  ok?r.set(x):void 0;
  return ok;
 };
 DynamicAttrNode=Next.DynamicAttrNode=Runtime.Class({
  NChanged:function()
  {
   return this.updates;
  },
  NGetChangeAnim:function(parent)
  {
   return An.get_Empty();
  },
  NGetEnterAnim:function(parent)
  {
   return An.get_Empty();
  },
  NGetExitAnim:function(parent)
  {
   return An.get_Empty();
  },
  NSync:function(parent)
  {
   if(this.dirty)
    {
     (this.push(parent))(this.value);
     this.dirty=false;
    }
  }
 },null,DynamicAttrNode);
 DynamicAttrNode.New=Runtime.Ctor(function(view,push)
 {
  var $this;
  $this=this;
  this.push=push;
  this.value=void 0;
  this.dirty=false;
  this.updates=View.Map(function(x)
  {
   $this.value=x;
   $this.dirty=true;
  },view);
 },DynamicAttrNode);
 Scheduler=Concurrency.Scheduler=Runtime.Class({
  Fork:function(action)
  {
   var $this;
   $this=this;
   this.robin.push(action);
   this.idle?(this.idle=false,window.setTimeout(function()
   {
    $this.tick();
   },0)):void 0;
  },
  tick:function()
  {
   var loop,$this,t;
   $this=this;
   t=Date.now();
   loop=true;
   while(loop)
    if(this.robin.length===0)
     {
      this.idle=true;
      loop=false;
     }
    else
     {
      (this.robin.shift())();
      Date.now()-t>40?(window.setTimeout(function()
      {
       $this.tick();
      },0),loop=false):void 0;
     }
  }
 },null,Scheduler);
 Scheduler.New=Runtime.Ctor(function()
 {
  this.idle=true;
  this.robin=[];
 },Scheduler);
 CancellationTokenSource=WebSharper.CancellationTokenSource=Runtime.Class({},null,CancellationTokenSource);
 CancellationTokenSource.New=Runtime.Ctor(function()
 {
  this.c=false;
  this.pending=null;
  this.r=[];
  this.init=1;
 },CancellationTokenSource);
 Easing=Next.Easing=Runtime.Class({},null,Easing);
 Easing.Custom=function(f)
 {
  return new Easing.New(f);
 };
 Easing.New=Runtime.Ctor(function(transformTime)
 {
  this.transformTime=transformTime;
 },Easing);
 OperationCanceledException=WebSharper.OperationCanceledException=Runtime.Class({},null,OperationCanceledException);
 OperationCanceledException.New=Runtime.Ctor(function(ct)
 {
  OperationCanceledException.New$1.call(this,"The operation was canceled.",null,ct);
 },OperationCanceledException);
 OperationCanceledException.New$1=Runtime.Ctor(function(message,inner,ct)
 {
  this.message=message;
  this.inner=inner;
  this.ct=ct;
 },OperationCanceledException);
 HashSetUtil.concat=function(o)
 {
  var r,k;
  r=[];
  for(var k$1 in o)r.push.apply(r,o[k$1]);
  return r;
 };
 SC$8.$cctor=Runtime.Cctor(function()
 {
  SC$8.Empty={
   $:0
  };
  SC$8.$cctor=window.ignore;
 });
 Lazy.Create=function(f)
 {
  return{
   c:false,
   v:f,
   f:Lazy.forceLazy
  };
 };
 Lazy.forceLazy=function()
 {
  var v;
  v=this.v();
  this.c=true;
  this.v=v;
  this.f=Lazy.cachedLazy;
  return v;
 };
 Lazy.cachedLazy=function()
 {
  return this.v;
 };
 DomNodes.DocChildren=function(node)
 {
  var q;
  function loop(doc)
  {
   if(doc!=null&&doc.$==2)
    loop(doc.$0.Current);
   else
    if(doc!=null&&doc.$==1)
     q.push(doc.$0.El);
    else
     if(doc==null)
      ;
     else
      if(doc!=null&&doc.$==5)
       q.push(doc.$0);
      else
       if(doc!=null&&doc.$==4)
        q.push(doc.$0.Text);
       else
        if(doc!=null&&doc.$==6)
         Arrays.iter(function(a)
         {
          if(a.constructor===window.Object)
           loop(a);
          else
           q.push(a);
         },doc.$0.Els);
        else
         {
          loop(doc.$0);
          loop(doc.$1);
         }
  }
  q=[];
  loop(node.Children);
  return{
   $:0,
   $0:Array.ofSeqNonCopying(q)
  };
 };
 DomNodes.Children=function(elem,delims)
 {
  var n,o,a;
  if(delims!=null&&delims.$==1)
   {
    a=[];
    n=delims.$0[0].nextSibling;
    while(n!==delims.$0[1])
     {
      a.push(n);
      n=n.nextSibling;
     }
    return{
     $:0,
     $0:a
    };
   }
  else
   return{
    $:0,
    $0:Arrays.init(elem.childNodes.length,(o=elem.childNodes,function(a$1)
    {
     return o[a$1];
    }))
   };
 };
 DomNodes.Except=function(a,a$1)
 {
  var excluded;
  excluded=a.$0;
  return{
   $:0,
   $0:Arrays.filter(function(n)
   {
    return Arrays.forall(function(k)
    {
     return!(n===k);
    },excluded);
   },a$1.$0)
  };
 };
 DomNodes.Iter=function(f,a)
 {
  Arrays.iter(f,a.$0);
 };
 Queue.Clear=function(a)
 {
  a.splice(0,Arrays.length(a));
 };
 Runtime.OnLoad(function()
 {
  Client.Main();
 });
}());


if (typeof IntelliFactory !=='undefined')
  IntelliFactory.Runtime.Start();