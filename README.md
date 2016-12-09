# FileUp

> AJAX file upload with queue.

## 插件初始化传入一个`option`对象，对象中参数为：
- `threshold`：number-可选（默认1）-文件上传数目限制
- `endpoint`：String-必须-文件上传地址，必须配置
- `headers`：Object-可选-额外的请求头对象
- `params`：Object-可选-额外的请求参数对象
- `field`：String-可选（默认file）-文件上传name标识

## 插件包含的监听事件：
- add：添加文件事件（回调函数的参数item）
- upload：文件上传开始事件（回调函数的参数item）
- success：文件上传成功事件（回调函数的参数item，event）
- error：文件上传失败事件（回调函数的参数item，event）
- abort：终止文件上传事件（回调函数的参数item，event）
- progress：文件上传过程事件（回调函数的参数item，event）
- done：文件上传结束事件（回调函数的参数item，event）

## 插件包含的函数：
- add：参数（File file）-将文件对象添加到队列中
- on：参数（String event，Function callback）-给文件上传对象添加事件监听
- work：参数（无）-开始讲队列中的文件上传

## 对插件的改动
我在对插件进行了一些的扩展，完善了插件的文件队列清空和根据文件名将文件从队列中删除的方法。
首先是清空文件列表比较简单：
```
resetList: function() {
      this.working = 0;
      this.queue = [];
      this.items = [];
    },
```
清空文件列表只要将顺序队列，文件队列，序号全部初始化即可。
接下来就是根据文件名称删除其中一个文件，这个一开始实现起来稍微有点问题，后台换了一个思路，首先将队列清空，然后将非删除的文件再一个一个的的添加进去即可：
```
deleteFile: function(filename) {
      var oldItems = this.items;
      var newQueue = [];
      var newItems = [];
      oldItems.forEach(function(it, i) {
        var index = newItems.length;
        if(it.file.name != filename) {
          var item = {
            file: it.file,
            status: 'enqueued',
            index: index,
            xhr: new XMLHttpRequest(),
            data: new FormData()
          };

          newItems.push(item);
          newQueue.push(item.index);
        }
      });
      this.items = newItems;
      this.queue = newQueue;
      this.working = this.working - 1;
    }
```
首先创建两个新队列，遍历将原队列中文件名不等于删除文件的文件名的文件添加进去，最后将新队列添赋值给原队列，将`working`值减一就可以了。

## 添加新事件
更新于2016-12-9
添加文件上传结束（无论其中文件成功与否）事件
```
if(this.queue.length == 0) {
    this.emit('end', this.items);
}
```