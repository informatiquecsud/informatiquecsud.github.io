"use strict";(self["webpackChunkquasar2_app"]=self["webpackChunkquasar2_app"]||[]).push([[637],{9637:(e,a,l)=>{l.r(a),l.d(a,{default:()=>j});l(2100),l(5363),l(812);var n=l(3673),t=l(1959),o=l(2323),i=l(9582),s=l(838),r=l(8825),d=l(1525);const c=["src","width","height"];function m(e,a,l,t,o,i){return(0,n.wg)(),(0,n.iD)("iframe",{class:"robotsim-container",src:e.src,frameborder:"0",width:e.width,height:e.height},"\n  ",8,c)}const u=(0,n.aZ)({name:"IFrameRobotSim",props:{src:{type:String,required:!0},width:{type:Number,required:!0},height:{type:Number,required:!0}}});var p=l(4260);const _=(0,p.Z)(u,[["render",m]]),f=_;let y,w=e=>e;const h=(e,a)=>{const l=String.raw(y||(y=w`
from ast import *

class _FindDefs(NodeVisitor):
    def __init__(self):
        self.defs={}

    def visit_FunctionDef(self,node):
        #print("Found def!",type(node.name))
        self.generic_visit(node)
        self.defs[node.name]=node.name

    def get_defs(self):
        return self.defs


### Code to translate simple python code to be async. n.b. right now only sleep calls and imports are async in practice
# all calls to local functions are async as otherwise you can't run sleep in them
class _MakeAsyncCalls(NodeTransformer):
    def __init__(self,call_table):
        self.call_table=call_table
        self.in_main=False

    def visit_AsyncFunctionDef(self,node):
        # ignore anything that is already async except for the main
        if node.name=='__async_main':
            self.in_main=True
            self.generic_visit(node)
            self.in_main=False
        return node

    def visit_ImportFrom(self,node):
        if not self.in_main:
            return node
        elements=[]
        elements.append(Tuple([Constant(node.module),Constant(None)],ctx=Load()))
        # first call async code to import it into pyodide, then call the original import statement to make it be available here
        newNode=[Expr(value=Await(Call(Name('aimport',ctx=Load()),args=[List(elements,ctx=Load())],keywords=[]))),node]
        return newNode

    def visit_Import(self,node):
        if not self.in_main:
            return node
        elements=[]
        for c in node.names:
            thisElement=Tuple([Constant(c.name),Constant(c.asname)],ctx=Load())
            elements.append(thisElement)
        # first call async code to import it into pyodide, then call the original import statement to make it be available here
        newNode=[Expr(value=Await(Call(Name('aimport',ctx=Load()),args=[List(elements,ctx=Load())],keywords=[]))),node]
        return newNode

    def visit_FunctionDef(self,node):
        #print("Found functiondef")
        self.generic_visit(node) # make sure any calls are turned into awaits where relevant
        return AsyncFunctionDef(name=node.name,args=node.args,body=node.body,decorator_list=node.decorator_list,returns=node.returns)

    def _parse_call(self,name):
        allNames=name.split(".")
        retVal=Name(id=allNames[0],ctx=Load())
        allNames=allNames[1:]
        #print(dump(retVal))
        while len(allNames)>0:
            retVal=Attribute(value=retVal,attr=allNames[0],ctx=Load())
            allNames=allNames[1:]
        #print(dump(retVal))
        return retVal


    def visit_Call(self, node):
        target=node.func
        make_await=False
        nameParts=[]
        while type(target)==Attribute:
            nameParts=[target.attr]+nameParts
            target=target.value
        if type(target)==Name:
            nameParts=[target.id]+nameParts
        target_id=".".join(nameParts)
        simple_name=nameParts[-1]
        if target_id in self.call_table:
            make_await=True
        elif simple_name in self.call_table:
            make_await=True
        if make_await:
            nameNodes=self._parse_call(self.call_table[target_id])
            #print("make await",target_id,node.args,node.keywords)
            newNode=Await(Call(nameNodes,args=node.args,keywords=node.keywords))
            return newNode
        else:
            # external library call, ignore
            return Call(node.func,node.args,node.keywords)


class _LineOffsetter(NodeTransformer):
    def __init__(self,offset):
        self.offset=offset

    def visit(self, node):
        if hasattr(node,"lineno"):
            node.lineno+=self.offset
        if hasattr(node,"endlineno"):
            node.end_lineno+=self.offset
        self.generic_visit(node)
        return node


# todo make this for multiple code modules (and maybe to guess class types from the code..)
def __asyncify_sleep_delay(code_str,compile_mode='exec'):
    code_imports = "import asyncio\n"

    asleep_def = "async def __async_main():\n"

    extraLines=len(asleep_def.split("\n"))-1


    code_lines = []

    for line in code_str.splitlines():
        if 'import' in line.split('#')[0]:
            code_imports += line + '\n'
        else:
            code_lines += ["    "+line]

    all_code = code_imports
    all_code += asleep_def
    all_code += '\n'.join(code_lines)
    all_code += '\n'

    #all_code+="_loop.set_task_to_run_until_done(__async_main())\n"
    all_code+="asyncio.run(__async_main())\n"

    # print(all_code)

    oldTree=parse(all_code, mode='exec')

    defs=_FindDefs()
    defs.visit(oldTree)
    allDefs=defs.get_defs()
    # override sleep with asleep
    allDefs["sleep"]="asyncio.sleep"
    allDefs["delay"]="delay"
    allDefs["time.sleep"]="asyncio.sleep"
    newTree=fix_missing_locations(_MakeAsyncCalls(allDefs).visit(oldTree))
    newTree=_LineOffsetter(-extraLines).visit(newTree)

    with open('tree.dump', 'w') as f:
        f.write(dump(newTree))

    return newTree

    #return compile(newTree,filename="your_code.py",mode=compile_mode)

def __strip_async_main(new_ast):
    code = unparse(new_ast)
    lines = code.splitlines()
    final_lines = []

    in_async_main = False

    for line in lines:
        #print("currentline", line)
        if not in_async_main:
            if line.startswith('async def __async_main()'):
                in_async_main = True
            elif line.startswith('asyncio.run(__async_main())'):
                continue
            else:
                final_lines.append(line)
        elif in_async_main:
            if line.startswith('    '):
                final_lines.append(line[4:])
            elif line == '':
                final_lines.append(line)
            else:
                in_async_main = False

        #print('lines', final_lines)


    return '\n'.join(final_lines)

result = __asyncify_sleep_delay(code_to_compile,compile_mode='exec')
__strip_async_main(result)
`));return console.log("conversion code",l),a.runPythonAsync(l,a.toPy({code_to_compile:e}))};l(5949);const v=(0,n.Uk)("Save & Run"),g=(0,n.Uk)("Reload"),b=(0,n.Uk)("Asyncify"),k=(0,n.Uk)("Share"),N=(0,n.Uk)("PyRobotSim"),x=(0,n.Uk)(" REPL "),C={props:{},setup(e){const a=(0,r.Z)();function l(){a.dialog({title:"New file name",message:"What name should I give to the new file?",prompt:{model:"",type:"text"},cancel:!0,persistent:!0}).onOk((e=>{u.value.push({path:e,data:""})})).onCancel((()=>{})).onDismiss((()=>{}))}const c=(0,i.yj)(),m=(0,i.tv)(),u=(0,t.iH)([{path:"main.py",data:""}]),p=(0,t.iH)(0),_=(0,t.iH)(""),y={mode:"text/x-python",theme:"eclipse",lineNumbers:!0,smartIndent:!0,indentUnit:4,foldGutter:!0,styleActiveLine:!0},w=(0,t.iH)(50),C=((0,t.iH)(""),(0,t.iH)("stdout")),W=(0,t.iH)(""),q=(0,t.iH)(0),T=(0,t.iH)(""),U=((0,t.iH)(0),(0,t.iH)(!1)),L=(0,t.iH)(null);let P=null;const V=!1,D="v0.19.0",S=async()=>{try{V?(window.languagePluginUrl=`${LOCAL_PYODIDE_SERVER_URL}`,await(0,s.ve)(`${LOCAL_PYODIDE_SERVER_URL}pyodide.js`)):(window.languagePluginUrl=`https://cdn.jsdelivr.net/pyodide/${D}/full/`,await(0,s.ve)(`https://cdn.jsdelivr.net/pyodide/${D}/full/pyodide.js`),P=await loadPyodide({indexURL:languagePluginUrl,stdin:window.prompt,stdout:F,stderr:e=>T.value+=e+"\n"}),window.pyodide=P,console.log("pyodide loading ...",P)),U.value=!0}catch(e){console.log(e),L.value=e}},F=e=>{console.log(e),W.value+=e+"\n",q.value+=1,console.log("stdout",W.value)},E=e=>{T.value+=e+"\n",console.log("stderr",T.value)},A=(e,a)=>{e.forEach((e=>{a.FS.writeFile(e.path,e.data)}))},H=async()=>{W.value="",T.value="",localStorage.setItem("editorFiles",JSON.stringify(u.value)),A(u.value,P);const e=u.value[p.value].data;let a;try{a=await h(e,P),_.value=a,console.log("res",a)}catch(l){E(`Error while converting code to async code: \n${l}`),C.value="stderr"}try{await P.runPythonAsync(a)}catch(l){E(`Error while running code on virtual robot.\n${l}`),C.value="stderr"}},Z=()=>{const e=localStorage.getItem("editorFiles");void 0!==e&&(u.value=JSON.parse(e))},j=()=>{m.replace({query:{main:btoa(u.value[0].data)}})},R=async(e,a)=>{const l=new Headers;l.append("pragma","no-cache"),l.append("cache-control","no-cache"),a.forEach((a=>{const l=e+a;fetch(l,{method:"GET",mode:"cors",cache:"no-store"}).then((e=>e.text())).then((e=>{u.value.push({path:a,data:e})})).catch((e=>{alert(`Unable to download module from ${l}`)}))}))};return(0,n.bv)((async()=>{console.log("loading Pyodide"),await S(),W.value="",void 0!==c.query.main&&(u.value[0].data=atob(c.query.main));const e="https://raw.githubusercontent.com/informatiquecsud/mbrobot/main/maqueen-plus/pyodide-robotsim/";await R(e,["mbrobotplus.py","delay.py","microbit.py"])})),(e,a)=>{const i=(0,n.up)("q-btn"),s=(0,n.up)("q-toolbar-title"),r=(0,n.up)("q-toolbar"),c=(0,n.up)("q-header"),m=(0,n.up)("q-tab"),U=(0,n.up)("q-tabs"),L=(0,n.up)("q-separator"),P=(0,n.up)("q-tab-panels"),V=(0,n.up)("q-card"),D=(0,n.up)("q-tab-panel"),S=(0,n.up)("q-splitter");return(0,n.wg)(),(0,n.j4)(S,{modelValue:w.value,"onUpdate:modelValue":a[5]||(a[5]=e=>w.value=e)},{before:(0,n.w5)((()=>[(0,n.Wm)(c,{elevated:""},{default:(0,n.w5)((()=>[(0,n.Wm)(r,null,{default:(0,n.w5)((()=>[(0,n.Wm)(i,{color:"green",class:"q-ma-sm",onClick:H},{default:(0,n.w5)((()=>[v])),_:1}),(0,n.Wm)(i,{color:"white","text-color":"black",class:"q-ma-sm",onClick:Z},{default:(0,n.w5)((()=>[g])),_:1}),(0,n.Wm)(i,{color:"white","text-color":"black",class:"q-ma-sm",onClick:(0,t.SU)(h)},{default:(0,n.w5)((()=>[b])),_:1},8,["onClick"]),(0,n.Wm)(i,{color:"white","text-color":"black",class:"q-ma-sm",onClick:j},{default:(0,n.w5)((()=>[k])),_:1}),(0,n.Wm)(s,null,{default:(0,n.w5)((()=>[N])),_:1})])),_:1})])),_:1}),(0,n.Wm)(V,null,{default:(0,n.w5)((()=>[(0,n.Wm)(U,{modelValue:p.value,"onUpdate:modelValue":a[0]||(a[0]=e=>p.value=e),dense:"","no-caps":"",class:"text-grey","active-color":"primary","indicator-color":"primary",align:"justify"},{default:(0,n.w5)((()=>[((0,n.wg)(!0),(0,n.iD)(n.HY,null,(0,n.Ko)(u.value,((e,a)=>((0,n.wg)(),(0,n.j4)(m,{name:a,key:a,label:e.path},null,8,["name","label"])))),128)),(0,n.Wm)(i,{class:"q-ma-sm",color:"white",icon:"add",label:"New ...","text-color":"black",onClick:l})])),_:1},8,["modelValue"]),(0,n.Wm)(L),(0,n.Wm)(P,{modelValue:p.value,"onUpdate:modelValue":a[1]||(a[1]=e=>p.value=e),animated:""},{default:(0,n.w5)((()=>[((0,n.wg)(!0),(0,n.iD)(n.HY,null,(0,n.Ko)(u.value,((a,l)=>((0,n.wg)(),(0,n.j4)((0,t.SU)(d.ZP),{name:l,key:l,value:u.value[l].data,"onUpdate:value":e=>u.value[l].data=e,options:y,border:"",placeholder:"test placeholder",height:400,onChange:e.change},null,8,["name","value","onUpdate:value","onChange"])))),128))])),_:1},8,["modelValue"])])),_:1}),(0,n.Wm)(V,null,{default:(0,n.w5)((()=>[(0,n.Wm)(U,{modelValue:C.value,"onUpdate:modelValue":a[2]||(a[2]=e=>C.value=e),dense:"",class:"text-grey","active-color":"primary","indicator-color":"primary",align:"justify"},{default:(0,n.w5)((()=>[(0,n.Wm)(m,{name:"stdout",label:"Stdout"}),(0,n.Wm)(m,{name:"stderr",label:"Stderr"}),(0,n.Wm)(m,{name:"repl",label:"REPL"}),(0,n.Wm)(m,{name:"asyncifiedCode",label:"Async"})])),_:1},8,["modelValue"]),(0,n.Wm)(L),(0,n.Wm)(P,{modelValue:C.value,"onUpdate:modelValue":a[4]||(a[4]=e=>C.value=e),animated:""},{default:(0,n.w5)((()=>[(0,n.Wm)(D,{name:"stdout"},{default:(0,n.w5)((()=>[((0,n.wg)(),(0,n.iD)("pre",{key:q.value},(0,o.zw)(W.value),1))])),_:1}),(0,n.Wm)(D,{name:"stderr"},{default:(0,n.w5)((()=>[(0,n._)("pre",null,(0,o.zw)(T.value),1)])),_:1}),(0,n.Wm)(D,{name:"repl"},{default:(0,n.w5)((()=>[x])),_:1}),(0,n.Wm)(D,{name:"asyncifiedCode"},{default:(0,n.w5)((()=>[(0,n.Wm)((0,t.SU)(d.ZP),{value:_.value,"onUpdate:value":a[3]||(a[3]=e=>_.value=e),options:{...y,readOnly:!0},border:"",height:400,onChange:e.change},null,8,["value","options","onChange"])])),_:1})])),_:1},8,["modelValue"])])),_:1})])),after:(0,n.w5)((()=>[(0,n.Wm)(f,{src:"robotsim1/TM_code/index.html",width:700,height:700})])),_:1},8,["modelValue"])}}};var W=l(218),q=l(3812),T=l(9570),U=l(8240),L=l(3747),P=l(151),V=l(2496),D=l(3269),S=l(5869),F=l(5906),E=l(6602),A=l(7518),H=l.n(A);const Z=C,j=Z;H()(C,"components",{QSplitter:W.Z,QHeader:q.Z,QToolbar:T.Z,QBtn:U.Z,QToolbarTitle:L.Z,QCard:P.Z,QTabs:V.Z,QTab:D.Z,QSeparator:S.Z,QTabPanels:F.Z,QTabPanel:E.Z})}}]);