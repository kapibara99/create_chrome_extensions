"use strict";
console.log("script is loaded");
const BASE_DOMAIN = window.location.protocol + '//' + window.location.host;
let THIS_FILE_NAME = window.location.href.split('/').pop();
let PASS_NAME = window.location.pathname;
if(!THIS_FILE_NAME == ""){
  PASS_NAME = PASS_NAME - THIS_FILE_NAME;
}
if(PASS_NAME === "/"){
  PASS_NAME = ""
}

// 一括ダウンロードボタンの追加
function addImageDownloadButton(imgList) {
  document.body.insertAdjacentHTML(
    "afterBegin",
    `<button id="download">画像一括ダウンロード</button>`
  );
  document.getElementById("download").addEventListener("click", ()=>{
    downloadImages(imgList);
  });
}

// 画像の一括ダウンロード
async function downloadImages(srcList) {
  // 画像 URL

  // JSZip に追加するために非同期リクエストを Promise で wrap
  const imagePromises = srcList.map(
    (src, i) => new Promise((resolve, reject) => {
      let xhr = new XMLHttpRequest();
      xhr.open('GET', src, true);
      xhr.responseType = "blob";
      xhr.onload = function() {
        // ファイル名とデータ返却
        const fileName = src.slice(src.lastIndexOf("/") + 1);
        resolve({ data: this.response, fileName: fileName });
      };
      // reject だと await Promise.all を抜けてしまう
      // => resolve でデータ無し
      xhr.onerror = () => resolve({ data: null });
      xhr.onabort = () => resolve({ data: null });
      xhr.ontimeout = () => resolve({ data: null });
      xhr.send();
    })
  );

  // すべての画像が取得できたら zip 生成
  const images = await Promise.all(imagePromises);
  generateImagesZip(images);
}

// zip ファイルで画像をダウンロード
function generateImagesZip(images) {
  let zip = new JSZip();

// フォルダ作成
  const folderName = "getImage";
  let folder = zip.folder(folderName);

  // フォルダ下に画像を格納
  images.forEach(image => {
    if (image.data && image.fileName) {
      folder.file(image.fileName, image.data)
    }
  });

  // zip を生成
  zip.generateAsync({ type: "blob" }).then(blob => {

    // ダウンロードリンクを 生成
    let dlLink = document.createElement("a");

    // blob から URL を生成
    const dataUrl = URL.createObjectURL(blob);
    dlLink.href = dataUrl;
    dlLink.download = `${folderName}.zip`;

    // 設置/クリック/削除
    document.body.insertAdjacentElement("beforeEnd", dlLink);
    dlLink.click();
    dlLink.remove();

    // オブジェクト URL の開放
    setTimeout(function() {
      window.URL.revokeObjectURL(dataUrl);
    }, 1000);
  });
}


chrome.runtime.onMessage.addListener(function (msg) {
  console.log("start");
  let result = [];

  // document.body.insertAdjacentHTML("afterbegin", `<p>${msg.mes}</p>`);
  result = initer();
  result = fixResultAry(result);
  console.log(result);
  addImageDownloadButton(result);
});

function fixResultAry (ary){
  const r = [...new Set(ary)]
  return r;
}
function initer() {
  let r = getImageSrc();
  return r;
}

function getImageSrc() {
  const doclist = [].slice.call(document.querySelectorAll('*'));
  let r = [];
  doclist.forEach(element => {
    const style = window.getComputedStyle(element);
    const imgPathObj_forCss = ["background-image", "content"];

    imgPathObj_forCss.forEach(tag => {
      const targetStyle = String(style.getPropertyValue(tag));
      if (targetStyle.match(/url/)&&verifImageFormat(targetStyle)) {
        const v = setHTTPImgPath(targetStyle);
        r.push(v);
      }
    });

    const imgPathObj_forHtml = ["src", "srcset","data-src","data-srcset"];
    imgPathObj_forHtml.forEach(tag => {
      const value = String(element.getAttribute(tag));
      if (verifImageFormat(value)){
        const v = setHTTPImgPath(value);
        r.push(v);
      }
    })
  });
  return r;
}

function verifImageFormat(tester){
  if (
    (tester.match(/.png/)
    ||(tester.match(/.jepg/))
    ||(tester.match(/.jpg/))
    ||(tester.match(/.svg/))
    ||(tester.match(/.webp/))
    ||(tester.match(/.gif/))
    )) {
      return true;
  }else{
    return false;
  }
}

function setHTTPImgPath(originPath) {
  const regHTTP = /[https]+[://]*?[/][a-zA-Z0-9_\.\/\-]+/g;
  const regAbsolute = /[/][a-zA-Z0-9_\.\/\-]+/g;
  const regRelative = /[./a-zA-Z][a-zA-Z0-9_\.\/\-]+/g;

  let m;
  if(originPath.match(/http/)){//http
    m = regHTTP.exec(originPath);
    if(Array.isArray(m)){
      m = String(m[0]);
    }
  }else{
    const first = originPath.slice(0,1);
    if(first === "/"){// first str is /
      m = BASE_DOMAIN + regAbsolute.exec(originPath);
    }else if(first === "."){// first str is ./
      m = regRelative.exec(originPath).slice(2);
      m = BASE_DOMAIN + PASS_NAME + "/" + m;
    }else if(first.match(/[a-z]/)){// first str is xxxx/
      m = BASE_DOMAIN + PASS_NAME + "/" + originPath;
    }else{// else is err
      console.log("e",originPath);
    }
  }
  return m;
}