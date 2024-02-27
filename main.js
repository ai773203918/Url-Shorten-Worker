let res

// 获取当前页面的路径作为 API 服务器地址
let apiSrv = window.location.pathname
// 获取密码输入框的值
let password_value = document.querySelector("#passwordText").value

// 默认的构建值项目函数，在不同的 index.html 中可以设置为不同的函数
let buildValueItemFunc = buildValueTxt

function shorturl() {
  // 如果长链接输入框为空，弹出警告并返回
  if (document.querySelector("#longURL").value == "") {
    alert("URL 不能为空！")
    return
  }

  // 禁用“缩短链接”按钮，并将按钮文本改为“请等待...”
  document.getElementById("addBtn").disabled = true;
  document.getElementById("addBtn").innerHTML = '<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>请稍候...';

  // 发起 POST 请求
  fetch(apiSrv, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ cmd: "add", url: document.querySelector("#longURL").value, key: document.querySelector("#keyPhrase").value, password: password_value })
  }).then(function (response) {
    return response.json();
  }).then(function (myJson) {
    res = myJson;
    // 启用“缩短链接”按钮，并将按钮文本改回“缩短链接”
    document.getElementById("addBtn").disabled = false;
    document.getElementById("addBtn").innerHTML = '缩短链接';

    // 如果生成短链接成功
    if (res.status == "200") {
      let keyPhrase = res.key;
      let valueLongURL = document.querySelector("#longURL").value;
      // 保存到本地存储
      localStorage.setItem(keyPhrase, valueLongURL);
      // 将生成的链接添加到页面上的链接列表中
      addUrlToList(keyPhrase, valueLongURL)

      document.getElementById("result").innerHTML = window.location.protocol + "//" + window.location.host + "/" + res.key;
    } else {
      // 否则在结果区域显示错误信息
      document.getElementById("result").innerHTML = res.error;
    }

    // 弹出结果提示框
    var modal = new bootstrap.Modal(document.getElementById('resultModal'));
    modal.show();

  }).catch(function (err) {
    // 捕获并处理异常
    alert("未知错误，请重试！");
    console.log(err);
    document.getElementById("addBtn").disabled = false;
    document.getElementById("addBtn").innerHTML = '缩短链接';
  })
}

function copyurl(id, attr) {
  let target = null;

  if (attr) {
    target = document.createElement('div');
    target.id = 'tempTarget';
    target.style.opacity = '0';
    if (id) {
      let curNode = document.querySelector('#' + id);
      target.innerText = curNode[attr];
    } else {
      target.innerText = attr;
    }
    document.body.appendChild(target);
  } else {
    target = document.querySelector('#' + id);
  }

  try {
    let range = document.createRange();
    range.selectNode(target);
    window.getSelection().removeAllRanges();
    window.getSelection().addRange(range);
    document.execCommand('copy');
    window.getSelection().removeAllRanges();
    console.log('复制成功')
  } catch (e) {
    console.log('复制失败')
  }

  if (attr) {
    // 移除临时目标
    target.parentElement.removeChild(target);
  }
}

function loadUrlList() {
  // 清空列表
  let urlList = document.querySelector("#urlList")
  while (urlList.firstChild) {
    urlList.removeChild(urlList.firstChild)
  }

  // 获取长链接输入框中的值
  let longUrl = document.querySelector("#longURL").value
  console.log(longUrl)

  // 遍历本地存储
  let len = localStorage.length
  console.log(+len)
  for (; len > 0; len--) {
    let keyShortURL = localStorage.key(len - 1)
    let valueLongURL = localStorage.getItem(keyShortURL)

    // 如果长链接为空，则加载所有本地存储中的项目；否则只加载匹配的项目
    if (longUrl == "" || (longUrl == valueLongURL)) {
      addUrlToList(keyShortURL, valueLongURL)
    }
  }
}

function addUrlToList(shortUrl, longUrl) {
  let urlList = document.querySelector("#urlList")

  let child = document.createElement('div')
  child.classList.add("mb-3")
  child.classList.add("list-group-item")

  let keyItem = document.createElement('div')
  keyItem.classList.add("input-group")

  // 删除按钮
  let delBtn = document.createElement('button')
  delBtn.setAttribute('type', 'button')
  delBtn.classList.add("btn", "btn-danger")
  delBtn.setAttribute('onclick', 'deleteShortUrl(\"' + shortUrl + '\")')
  delBtn.setAttribute('id', 'delBtn-' + shortUrl)
  delBtn.innerText = "X"
  keyItem.appendChild(delBtn)

  // 查询访问次数按钮
  let qryCntBtn = document.createElement('button')
  qryCntBtn.setAttribute('type', 'button')
  qryCntBtn.classList.add("btn", "btn-info")
  qryCntBtn.setAttribute('onclick', 'queryVisitCount(\"' + shortUrl + '\")')
  qryCntBtn.setAttribute('id', 'qryCntBtn-' + shortUrl)
  qryCntBtn.innerText = "?"
  keyItem.appendChild(qryCntBtn)

  // 短链接信息
  let keyTxt = document.createElement('span')
  keyTxt.classList.add("form-control")
  keyTxt.innerText = window.location.protocol + "//" + window.location.host + "/" + shortUrl
  keyItem.appendChild(keyTxt)
  
  child.appendChild(keyItem)

  // 长链接信息
  child.appendChild(buildValueItemFunc(longUrl))

  urlList.append(child)
}

function clearLocalStorage() {
  localStorage.clear()
}

function deleteShortUrl(delKeyPhrase) {
  // 按钮状态
  document.getElementById("delBtn-" + delKeyPhrase).disabled = true;
  document.getElementById("delBtn-" + delKeyPhrase).innerHTML = '<span class="spinner-border spinner-border-sm" role="status"></span>';

  // 从 KV 中删除
  fetch(apiSrv, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ cmd: "del", key: delKeyPhrase, password: password_value })
  }).then(function (response) {
    return response.json();
  }).then(function (myJson) {
    res = myJson;

    // 删除成功
    if (res.status == "200") {
      // 从本地存储中删除
      localStorage.removeItem(delKeyPhrase)

      // 加载本地存储
      loadUrlList()

      document.getElementById("result").innerHTML = "删除成功"
    } else {
      document.getElementById("result").innerHTML = res.error;
    }

    // 弹出结果提示框
    var modal = new bootstrap.Modal(document.getElementById('resultModal'));
    modal.show();

  }).catch(function (err) {
    alert("未知错误，请重试！");
    console.log(err);
  })
}

function queryVisitCount(qryKeyPhrase) {
  // 按钮状态
  document.getElementById("qryCntBtn-" + qryKeyPhrase).disabled = true;
  document.getElementById("qryCntBtn-" + qryKeyPhrase).innerHTML = '<span class="spinner-border spinner-border-sm" role="status"></span>';

  // 从 KV 中查询
  fetch(apiSrv, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ cmd: "qry", key: qryKeyPhrase + "-count", password: password_value })
  }).then(function (response) {
    return response.json();
  }).then(function (myJson) {
    res = myJson;

    // 查询成功
    if (res.status == "200") {
      document.getElementById("qryCntBtn-" + qryKeyPhrase).innerHTML = res.url;
    } else {
      document.getElementById("result").innerHTML = res.error;
      // 弹出结果提示框
      var modal = new bootstrap.Modal(document.getElementById('resultModal'));
      modal.show();
    }

  }).catch(function (err) {
    alert("未知错误，请重试！");
    console.log(err);
  })
}

function query1KV() {
  let qryKeyPhrase = document.getElementById("keyForQuery").value;
  if (qryKeyPhrase == "") {
    return
  }

  // 从 KV 中查询
  fetch(apiSrv, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ cmd: "qry", key: qryKeyPhrase, password: password_value })
  }).then(function (response) {
    return response.json();
  }).then(function (myJson) {
    res = myJson;

    // 查询成功
    if (res.status == "200") {
      document.getElementById("longURL").value = res.url;
      document.getElementById("keyPhrase").value = qryKeyPhrase;
      // 触发 input 事件
      document.getElementById("longURL").dispatchEvent(new Event('input', {
        bubbles: true,
        cancelable: true,
      }))
    } else {
      document.getElementById("result").innerHTML = res.error;
      // 弹出结果提示框
      var modal = new bootstrap.Modal(document.getElementById('resultModal'));
      modal.show();
    }

  }).catch(function (err) {
    alert("未知错误，请重试！");
    console.log(err);
  })
}

function loadKV() {
  // 清空本地存储
  clearLocalStorage(); 

  // 从 KV 中查询，cmd 为 "qryall"，查询全部
  fetch(apiSrv, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ cmd: "qryall", password: password_value })
  }).then(function (response) {    
    return response.json();
  }).then(function (myJson) {
    res = myJson;
    // 查询成功
    if (res.status == "200") {

      // 遍历 kvlist
      res.kvlist.forEach(item => {      
        keyPhrase = item.key;
        valueLongURL = item.value;
        // 保存到本地存储
        localStorage.setItem(keyPhrase, valueLongURL);  
      });

    } else {
      document.getElementById("result").innerHTML = res.error;
      // 弹出结果提示框
      var modal = new bootstrap.Modal(document.getElementById('resultModal'));
      modal.show();
    }
  }).catch(function (err) {
    alert("未知错误，请重试！");
    console.log(err);
  })
}

function buildValueTxt(longUrl) {
  let valueTxt = document.createElement('div')
  valueTxt.classList.add("form-control")
  valueTxt.innerText = longUrl
  return valueTxt
}

document.addEventListener('DOMContentLoaded', function() {
  var popoverTriggerList = [].slice.call(document.querySelectorAll('[data-bs-toggle="popover"]'))
  var popoverList = popoverTriggerList.map(function (popoverTriggerEl) {
    return new bootstrap.Popover(popoverTriggerEl)
  });

  loadUrlList();
});
