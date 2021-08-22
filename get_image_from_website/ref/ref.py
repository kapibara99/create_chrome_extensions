# coding:utf-8
print("start")


# 初期設定 いじってよし
FOLDER_PATH = "/Users/sekiguchiteppei/dev/prog/Python3/get_image_from_website/"
OUTPUT_FILE = FOLDER_PATH + "result.csv"
URL = "https://benesse.jp/"
IMAGE_DL_SLEEP = 1
IMAGE_DL_PATH = "./img/"
IMG_TYPE_LIST = [".png",".jpg",".jpeg",".webp",".gif",".svg"]

#----------------------------------
# imports
import os
from bs4 import BeautifulSoup
import cssutils
import logging
cssutils.log.setLevel(logging.CRITICAL)

#from cssutils import CSSparser
import csv
import requests
from urllib.parse import urlparse
import time
import urllib.error
import urllib.request

#----------------------------------
# 関数群

# 配列から不要物を除去
def rem__noneType (ary):
  r_ary = filter(lambda a:a is not None,ary)
  return list(r_ary)

# 画像パス（cssも）をattr指定して取得
def get__img__path(attr,list,key,result):
  for l in list:
    g = l.get(attr)
    result[key].append(g)
  #result[key] = rem__noneType(result[key])

# ドメイン名をURL値から取得して、必要なところに挿入
URL_PARSER = urlparse(URL)
NN = URL_PARSER.netloc
SN = URL_PARSER.scheme
DN = SN + "://" + NN

def set_domain_name (datalist):
  for i in range(0,len(datalist)):
    if("../" in datalist[i]):
      print(datalist[i])
    if not("http" in datalist[i]):
      datalist[i] = str(DN) + datalist[i]

#指定ディレクトリに画像を保存
def dl__img(url,dir_path):
  try:
    with urllib.request.urlopen(url) as f:
      d = f.read()
      u = os.path.join(dir_path, os.path.basename(url))
      with open(u,mode="wb") as l:
        l.write(d)
  except urllib.error.URLError as e:
    print(e)
def dl__img__to__dir (img_list,dir_path):
  for i in img_list:
    dl__img(i,dir_path)
    time.sleep(IMAGE_DL_SLEEP)

# cssの画像も読み取る
#def get__filename(file):

#----------------------------------
# 実処理
# html取得
req = requests.get(URL)
html = BeautifulSoup(req.content,"html.parser")
r = {
  "img_path":[],
  "css_path":[]
}

# 抽出
get_data = {
  "img":list(set(html.find_all("img"))),
  "link":list(set(html.find_all("link"))),
  "source":list(set(html.find_all("source"))),
}
get__img__path("src",get_data["img"],"img_path",r)
get__img__path("data-src",get_data["img"],"img_path",r)
get__img__path("href",get_data["link"],"css_path",r)
get__img__path("srcset",get_data["source"],"img_path",r)

# 取得した値の調整
for k in r:
  #重複削除
  r[k] = list(set(r[k]))
  # none check
  r[k] = rem__noneType(r[k])
  # 絶対パスにドメイン名を与える
  set_domain_name(r[k])

#----------------------------------
# css にも検索かけて画像パスを拾ってくる
# css 以外を除去
css_n = 0
for css in r["css_path"]:
  if not(".css" in css):
    r["css_path"].pop(css_n)
  css_n += 1

# css を新たにリクエスト
css_data = {}
for css in r["css_path"]:
  fn = os.path.basename(css)
  dn = css.replace(fn,"")
  bn =  os.path.dirname(css).replace(os.path.basename(os.path.normpath(dn)),"")

  c = cssutils.parseUrl(css,encoding="utf-8")
  css_list = list(cssutils.getUrls(c))
  if(len(css_list) > 0):
    css_i = 0
    for img_path_in_css in css_list:
    #   # cssファイルごとに画像パスをフルパスにしてリザルトに格納
      if("../" in img_path_in_css):#相対パス　../バージョン
        img_path_in_css = bn + img_path_in_css.replace("../","")
      elif("./" in img_path_in_css):#相対パス ./バージョン
        img_path_in_css = dn + img_path_in_css.replace("./","")
      elif not(img_path_in_css[0]=="/"):# 相対パス スラなしバージョン
        img_path_in_css = dn + img_path_in_css
      else:
        img_path_in_css = DN + img_path_in_css
      css_list[css_i] = img_path_in_css
      css_i += 1

    css_data[fn] = css_list



#print(css_data)
# re.search('(?<=_).*(?=\.)', 'pinzu_1.png').group()


#----------------------------------
# 最終出力

# img かどうか　判定
img_n = 0
for img in r["img_path"]:
  if not(img in ".png") and not(img in ".jpg") and not(img in ".jpeg") and not(img in ".gif") and not(img in ".svg") and not(img in ".webp"):
    r["img_path"].pop(img_n)
  img_n += 1

# img download
#dl__img__to__dir(r["img_path"],IMAGE_DL_PATH)

# 最終list を　csvで残す
rr = r["img_path"] + r["css_path"]
csvw=csv.writer(open(OUTPUT_FILE,"w",encoding="UTF-8"),delimiter="\n")
for css in css_data:
  csvw.writerow(css_data[css])
print("done")
