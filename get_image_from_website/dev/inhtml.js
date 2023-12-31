//dev
let testResult;

// get html
// utilize
// const tbs = chrome.windows.tabs;
let manualInputAry = [];
let defaultLength = 5;

document.getElementById("js-more-label").addEventListener("click", (e) => {
  defaultLength += 1;
  const label = document.createElement("label");
  label.setAttribute("for", `text-${defaultLength}`);
  label.innerHTML = `<input class="js-input" id="text-${defaultLength}" type="text"></input>`;
  document.getElementById("js-form-inner").appendChild(label);
  return defaultLength;
});

document.getElementById("js-btn").addEventListener("click", (e) => {
  const INPUT_ELEs = [].slice.call(document.querySelectorAll(".js-input"));
  INPUT_ELEs.forEach((ele) => {
    if (ele.value && ele.value !== "") {
      manualInputAry.push(ele.value);
    }
  });
  chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
    chrome.tabs.sendMessage(tabs[0].id, {
      inputAry: manualInputAry,
    });
  });
});
