// fileupload v1.1.1
// use import export
// more on https://github.com/lfy55/fileupload

var FileUp, each, proxy;

proxy = function (that, fn) {
  return function () {
    fn.apply(that, arguments);
  };
};

each = function (iterable, action) {
  for (var index in iterable) {
    if (iterable.hasOwnProperty(index)) {
      action(index, iterable[index]);
    }
  }
};

FileUp = function (options) {
  this.options = FileUp.options;

  each(options, proxy(this, function (key, value) {
    this.options[key] = value;
  }));

  if (this.options.endpoint === '') {
    throw new Error('Endpoint cannot be empty');
  }

  this.listeners = {};
  this.working = 0;
  this.queue = [];
  this.items = [];
};

FileUp.options = {

  // Limit of simultaneously uploads
  threshold: 1,

  // Upload enpoint
  endpoint: '',

  // Global headers
  headers: {},

  // Global additional parameters
  params: {},

  // File field name
  field: 'file',
};

FileUp.prototype = {
  upload: function (index) {
    var item = this.items[index];

    item.xhr.addEventListener('load', proxy(this, function (e) {
      item.status = 'done';
      this.emit('success', item, e);
    }));

    item.xhr.addEventListener('error', proxy(this, function (e) {
      item.status = 'failed';
      this.emit('error', item, e);
    }));

    item.xhr.addEventListener('abort', proxy(this, function (e) {
      item.status = 'aborted';
      this.emit('abort', item, e);
    }));

    item.xhr.addEventListener('loadend', proxy(this, function (e) {
      this.emit('done', item, e);
      this.working -= 1;
      if (this.queue.length == 0) {// 添加文件上传结束后返回所有文件结果的事件
        this.emit('end', this.items);
      }
      this.work();
    }));

    item.xhr.upload.addEventListener('progress', proxy(this, function (e) {
      this.emit('progress', item, e);
    }));

    item.xhr.open('POST', this.options.endpoint, true);

    each(this.options.headers, proxy(this, function (key, value) {
      item.xhr.setRequestHeader(key, value);
    }));

    each(this.options.params, proxy(this, function (key, value) {
      item.data.append(key, value);
    }));

    item.data.append(this.options.field, item.file);

    item.xhr.send(item.data);

    item.status = 'uploading';
    this.emit('upload', item);
  },

  on: function (event, callback) {
    this.listeners[event] = this.listeners[event] || [];
    this.listeners[event].push(callback);
  },

  emit: function () {
    var event, args;

    args = [].slice.call(arguments);
    event = args.shift();

    each(this.listeners[event], proxy(this, function (index, callback) {
      callback.apply(this, args);
    }));
  },

  work: function () {
    while (this.queue.length > 0 && this.working < this.options.threshold) {
      this.process(this.queue.shift());
    }
  },

  process: function (index) {
    this.working += 1;
    this.upload(index);
  },

  add: function (file) {
    var item = {
      file: file,
      status: 'enqueued',
      index: this.items.length,
      xhr: new XMLHttpRequest(),
      data: new FormData()
    };

    this.items.push(item);
    this.emit('add', item);
    this.queue.push(item.index);
  },
  resetList: function () {
    this.working = 0;
    this.queue = [];
    this.items = [];
  },
  deleteFile: function (filename) {
    var oldItems = this.items;
    var newQueue = [];
    var newItems = [];
    oldItems.forEach(function (it, i) {
      var index = newItems.length;
      if (it.file.name != filename) {
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
};

export default FileUp