"use strict";
const BASE_DOMAIN = window.location.protocol + "//" + window.location.host;
let THIS_FILE_NAME = window.location.href.split("/").pop();
let PASS_NAME = window.location.pathname;
if (!THIS_FILE_NAME == "") {
  PASS_NAME = PASS_NAME - THIS_FILE_NAME;
}
if (PASS_NAME === "/") {
  PASS_NAME = "";
}

// func init
chrome.runtime.onMessage.addListener(function (msg) {
  let result = initer(msg.inputAry);
  addImageDownloadButton(result);
});

// download zip
function addImageDownloadButton(imgList) {
  document.body.insertAdjacentHTML(
    "afterBegin",
    `<button id="js-download-image-zip-from-kapy" style="
    outline: none;
    border: 2px solid #333;
    border-radius:15px;
    background: #fff;
    z-index: 99999;
    position: fixed;
    top:20px;
    right:20px;
    cursor: pointer;
    color: #333;
    text-align: center;
    line-height: 1.4;
    font-size: 24px;
    padding: 8px 20px;
    display: block;
    margin:30px auto;
    ">Let's download!</button>`
  );
  document
    .getElementById("js-download-image-zip-from-kapy")
    .addEventListener("click", () => {
      downloadImages(imgList);
    });
  // downloader
  async function downloadImages(srcList) {
    const imagePromises = srcList.map(
      (src) =>
        new Promise((resolve) => {
          let xhr = new XMLHttpRequest();
          xhr.open("GET", src, true);
          xhr.responseType = "blob";
          xhr.onload = function () {
            // return data
            const fileName = src.replace(BASE_DOMAIN, "");
            resolve({
              data: this.response,
              fileName: fileName,
            });
          };
          xhr.onerror = () =>
            resolve({
              data: null,
            });
          xhr.onabort = () =>
            resolve({
              data: null,
            });
          xhr.ontimeout = () =>
            resolve({
              data: null,
            });
          xhr.send();
        })
    );

    // get image promise obj
    const images = await Promise.all(imagePromises);
    generateImagesZip(images);
  }
  // generate zip
  function generateImagesZip(images) {
    let zip = new JSZip();

    // create data folder
    const folderName = "getImage";
    let folder = zip.folder(folderName);
    images.forEach((image) => {
      if (image.data && image.fileName) {
        folder.file(image.fileName, image.data);
      }
    });
    zip
      .generateAsync({
        type: "blob",
      })
      .then((blob) => {
        // create download link
        let dlLink = document.createElement("a");
        const dataUrl = URL.createObjectURL(blob);
        dlLink.href = dataUrl;
        dlLink.download = `${folderName}.zip`;

        // init and remove
        document.body.insertAdjacentElement("beforeEnd", dlLink);
        dlLink.click();
        dlLink.remove();
        setTimeout(function () {
          window.URL.revokeObjectURL(dataUrl);
        }, 1000);
      });
  }
}

function initer(inputAry) {
  let r = getImageSrc(inputAry);
  r = [...new Set(r)];

  function getImageSrc(inputAry) {
    const doclist = [].slice.call(document.querySelectorAll("*"));
    const afterlist = [].slice.call(document.querySelectorAll("*::after"));
    const beforelist = [].slice.call(document.querySelectorAll("*::before"));
    const researchList = doclist.concat(afterlist).concat(beforelist);
    let r = [];
    researchList.forEach((element) => {
      const style = window.getComputedStyle(element);
      const imgPathObj_forCss = ["background-image", "content"];

      imgPathObj_forCss.forEach((tag) => {
        const targetStyle = String(style.getPropertyValue(tag));
        if (targetStyle.match(/url/) && verifImageFormat(targetStyle)) {
          const v = setHTTPImgPath(targetStyle);
          r.push(v);
        }
      });

      const imgPathObj_forHtml = [
        ...["src", "srcset", "data-src", "data-srcset"],
        ...inputAry,
      ];
      imgPathObj_forHtml.forEach((tag) => {
        const value = String(element.getAttribute(tag));
        if (verifImageFormat(value)) {
          const v = setHTTPImgPath(value);
          r.push(v);
        }
      });
    });

    function verifImageFormat(tester) {
      if (
        // || or
        tester.match(/.png/) ||
        tester.match(/.jepg/) ||
        tester.match(/.jpg/) ||
        tester.match(/.svg/) ||
        tester.match(/.webp/) ||
        tester.match(/.gif/)
      ) {
        if (
          //&& and
          tester.indexOf("data:image/") == -1
        ) {
          return true;
        } else {
          return false;
        }
      } else {
        return false;
      }
    }

    function setHTTPImgPath(originPath) {
      const regHTTP = /[https]+[://]*?[/][a-zA-Z0-9_\.\/\-]+/g;
      const regAbsolute = /[/][a-zA-Z0-9_\.\/\-]+/g;
      const regRelative = /[./a-zA-Z][a-zA-Z0-9_\.\/\-]+/g;

      let m;
      if (originPath.match(/http/)) {
        //http
        m = regHTTP.exec(originPath);
        if (Array.isArray(m)) {
          m = String(m[0]);
        }
      } else {
        const first = originPath.slice(0, 1);
        if (first === "/") {
          // first str is /
          m = BASE_DOMAIN + regAbsolute.exec(originPath);
        } else if (first === ".") {
          // first str is ./
          m = regRelative.exec(originPath).slice(2);
          m = BASE_DOMAIN + PASS_NAME + "/" + m;
        } else if (first.match(/[a-zA-Z0-9]/)) {
          // first str is xxxx/
          m = BASE_DOMAIN + PASS_NAME + "/" + originPath;
        } else {
          // else is err
          console.error("fix path failed", originPath);
        }
      }
      return m;
    }
    return r;
  }
  return r;
}
