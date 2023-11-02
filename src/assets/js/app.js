import { select } from "d3-selection";
import "../css/app.css";
import { getTagColor } from "./tagStyle";

var PREFIX_LINE_NUM = "";
var TipContainer = null;
var HEIGHT_ROW = 60;
var COLOR_TEXT = "rgba(0,0,0,0)";
var COLOR_STROKE = "black";
var WIDTH_FIRST_COLUMN = 70;
var RATIO_TAG = 9;
var RATIO_TEXT = 18;
var REGEX_EMOJI = /\p{Emoji}/u;

export function RenderMorphemViewer(selector, data, width) {
  var copiedData = JSON.parse(JSON.stringify(data));
  var parent = document.querySelector(selector);
  parent.innerHTML = "";
  var svgEl = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  svgEl.setAttributeNS(null, "class", "viewer");
  parent.appendChild(svgEl);
  if (!TipContainer) {
    TipContainer = document.createElement("div");
    TipContainer.classList.add("tip_container");
    document.getElementsByTagName("body")[0].appendChild(TipContainer);
  }

  if (!width) width = 1120;

  var svg = select(svgEl);

  var curX = 0;
  var curY = 0;
  var grpCurRow;
  var cxMax = width;

  function openNewRow() {
    if (curX > 0) {
      curX = WIDTH_FIRST_COLUMN;
      curY += HEIGHT_ROW;
    }

    svg
      .append("rect")
      .attr("x", 0)
      .attr("y", curY)
      .attr("width", "100%")
      .attr("height", HEIGHT_ROW)
      .attr("fill", "#FFFF");

    grpCurRow = svg.append("g");
  }

  function addPos(item) {
    var word = item.text;
    var tagAll = item.tag;
    var tip = item.tip;

    curX += 5;
    var grp = grpCurRow.append("g");

    var tags = tagAll.split(/\+|,/);
    var tipHtml = tip;
    var tag0 = tags[0];
    var isShortTag = tag0.length == 2;
    var hasEnding = !!item.ending.length;
    var hasAbbr = !!item.abbr.length;

    var cxTag = tag0.length * RATIO_TAG;
    var cxWordLen = word.length || 1;
    if (REGEX_EMOJI.test(word)) {
      cxWordLen = 1;
    }
    if (cxWordLen == 1 && (hasEnding || hasAbbr)) {
      cxWordLen = 2;
    }
    var cxWord = cxWordLen * RATIO_TEXT;
    var xCenter = curX + cxWord / 2;
    var yAxis = curY + 8;
    var tagRectX = 0;
    if (hasAbbr) {
      cxTag += item.abbr.length * RATIO_TAG - 4;
      cxWord += 4;
      tagRectX += 2;
    }
    if (hasEnding) {
      cxTag += item.ending.length * RATIO_TAG;
    }
    grp
      .append("rect")
      .attr("x", xCenter + tagRectX - cxTag / 2)
      .attr("y", (yAxis += 4))
      .attr("width", cxTag)
      .attr("height", 16)
      .attr("rx", 3)
      .attr("ry", 3)
      .attr("fill", getTagColor(tags[0]));

    if (hasAbbr) {
      xCenter += 4;
      grp
        .append("text")
        .attr("x", xCenter - cxTag / 3 - 4)
        .attr("y", yAxis + 8)
        .attr("text-anchor", "middle")
        .attr("font-size", "10px")
        .text(
          item.abbr
            .map(function (tag) {
              return tag[0];
            })
            .join("")
        );
    }
    if (hasEnding) {
      xCenter -= 4;
      grp
        .append("text")
        .attr("x", xCenter + cxTag / 3 + 4)
        .attr("y", yAxis + 8)
        .attr("text-anchor", "middle")
        .attr("font-size", "10px")
        .text(
          item.ending
            .map(function (tag) {
              return tag[0];
            })
            .join("")
        );
    }
    grp
      .append("text")
      .attr("x", xCenter)
      .attr("y", (yAxis += 12))
      .attr("text-anchor", "middle")
      .attr("font-size", "11px")
      .text(tag0);

    yAxis += 13;
    grp
      .append("path")
      .attr(
        "d",
        "M" +
          curX +
          "," +
          yAxis +
          "C" +
          (curX + 1) +
          "," +
          (yAxis - 5) +
          " " +
          (curX + cxWord - 1) +
          "," +
          (yAxis - 5) +
          " " +
          (curX + cxWord) +
          "," +
          yAxis
      )
      .attr("stroke", COLOR_STROKE)
      .attr("stroke-width", 1.5)
      .attr("fill", "none");

    var textBox = grp
      .append("rect")
      .attr("x", curX)
      .attr("y", (yAxis += 3))
      .attr("width", cxWord + "px")
      .attr("height", 18)
      .attr("fill", COLOR_TEXT);

    grp
      .append("text")
      .attr("y", (yAxis += 14))
      .attr("text-anchor", "middle")
      .attr("font-size", "14px")
      .attr("x", xCenter)
      .text(word);

    grp.on("mouseover", function () {
      textBox.attr("stroke", "#000");
      TipContainer.innerHTML = tipHtml;
      TipContainer.style.display = "block";

      var rcSvg = svgEl.getBoundingClientRect();
      var rcElem = this.getBBox();
      var x = rcSvg.left + xCenter - (TipContainer.offsetWidth - 14) / 2 - 8;
      var y =
        rcSvg.top + rcElem.y + window.scrollY - TipContainer.offsetHeight - 12;
      TipContainer.style.left = x + "px";
      TipContainer.style.top = y + "px";
    });

    grp.on("mouseout", function () {
      textBox.attr("stroke", "none");
      TipContainer.style.display = "none";
    });

    curX += cxWord;
    if (curX > width) {
      if (curX > cxMax) cxMax = curX;

      openNewRow();
    }
  }

  for (var iSentence in copiedData) {
    var sentence = copiedData[iSentence];
    var tokens = sentence["tokens"];

    openNewRow();
    renderLine(svg, curY + 1);

    var grpSentNum = grpCurRow.append("g");
    grpSentNum
      .append("text")
      .attr("x", 3 + 24)
      .attr("y", curY + 38)
      .attr("font-size", "14px")
      .attr("text-anchor", "middle")
      .text(PREFIX_LINE_NUM + (parseInt(iSentence) + 1));

    curX = WIDTH_FIRST_COLUMN;

    if (tokens.length) {
      for (var iWord in tokens) {
        var wordSegment = tokens[iWord];
        var info = convertMorpheme(wordSegment);

        for (let idx = 0; idx < info.offset.length; idx++) {
          addPos(info.items[info.offset[idx]]);
        }
      }
    } else {
      addPos({
        text: sentence.text.content,
        tag: "",
        tip: "",
        abbr: [],
        ending: [],
      });
    }
  }

  if (curX > 0) curY += HEIGHT_ROW;
  renderLine(svg, curY - 1);
  svg.attr("height", curY).attr("width", cxMax);
}

function convertMorpheme(wordSegment) {
  var index = 0;
  var offsets = [];
  var morphemes = wordSegment["morphemes"];
  var modified = wordSegment["modified"];
  var prev = null;
  var items = morphemes.reduce(function (container, current) {
    index += 1;

    if (current.pass) {
      return container;
    }

    var text = wordSegment.text.content;
    var offset = wordSegment.text.beginOffset;
    var currentOffset = current.text.beginOffset - offset;
    var currentTextLen = [...current.text.content].length;

    var prevSet = container[current.text.beginOffset];

    if (prevSet) {
      prevSet.text = text.substr(currentOffset, currentTextLen);
      prevSet.tip += "+" + getTip(current);
      prevSet.ending.push(current.tag);
    } else {
      var displayText = current.text.content;
      var tip = getTip(current);
      var abbr = [];
      var ending = [];
      if (prev) {
        var prevInfo = container[prev.text.beginOffset];
        var prevTextLen = [...prevInfo.text].length;
        var prevEnded =
          prevInfo.text[prevTextLen - 1] == text.substr(currentOffset - 1, 1);
        if (REGEX_EMOJI.test(prevInfo.text)) {
          prevEnded = true;
        }
        // 이전 segment에 포함
        if (
          prev.text.beginOffset - offset + prevTextLen >
          current.text.beginOffset
        ) {
          prevInfo.text = text.substr(
            prev.text.beginOffset - offset,
            prevTextLen
          );
          prevInfo.tip += "+" + tip;
          prevInfo.ending.push(current.tag);
          return container;
          // 이전 segment가 끝나고 offset이 같지 않을 경우
        } else if (
          !prevEnded &&
          text.substr(currentOffset, currentTextLen) != current.text.content
        ) {
          prevInfo.text =
            modified ||
            text.slice(
              prev.text.beginOffset - offset,
              current.text.beginOffset - offset
            ) + text.substr(current.text.beginOffset - offset, currentTextLen);
          var last = morphemes[index];
          if (last) {
            if (prevInfo.text[prevTextLen - 1] == last.text.content[0]) {
              prevInfo.text = text.substr(
                prev.text.beginOffset - offset,
                prevTextLen - 1
              );
            }
          }
          prevInfo.tip += "+" + tip;
          prevInfo.ending.push(current.tag);
          return container;
        } else if (
          prevEnded &&
          (current.tag == "VCP" ||
            (current.tag == "VV" && displayText == "하") ||
            (current.tag == "XSV" && displayText == "하"))
        ) {
          var last = morphemes[index];
          if (last) {
            if (current.tag == "XSV" && displayText == "하") {
              var char = text.substr(
                last.text.beginOffset - offset,
                last.text.length
              );
              var isSimilar =
                current.text.beginOffset == last.text.beginOffset &&
                nucleus(char) == nucleus(last.text.content) &&
                coda(char) == coda(last.text.content);
              if (isSimilar) {
                last.pass = true;
                displayText = text.substr(
                  currentOffset,
                  last.text.content.length
                );
                abbr.push(current.tag);
                tip += "+" + getTip(last);
                current.tag = last.tag;
              }
            } else if (current.text.beginOffset == last.text.beginOffset) {
              last.pass = true;
              displayText = text.substr(
                currentOffset,
                last.text.content.length
              );
              abbr.push(current.tag);
              tip += "+" + getTip(last);
              current.tag = last.tag;
            }
          }
        }
      }

      offsets.push(current.text.beginOffset);
      container[current.text.beginOffset] = {
        tip: tip,
        text: displayText,
        tag: current.tag,
        abbr: abbr,
        ending: ending,
      };
    }
    prev = current;
    return container;
  }, {});

  return {
    offset: offsets,
    items: items,
  };
}

function onset(char) {
  var code = char.charCodeAt(0);
  if (0xac00 <= code <= 0xd7b0) {
    return code - 0xac00;
  }
  return -1;
}

function nucleus(char) {
  var code = char.charCodeAt(0);
  if (0xac00 <= code <= 0xd7b0) {
    return (code - 0xac00) % 588;
  }
  return -1;
}

function coda(char) {
  var code = char.charCodeAt(0);
  if (0xac00 <= code <= 0xd7b0) {
    return (code - 0xac00) % 28;
  }
  return -1;
}

function getTip(morephem) {
  return morephem.text.content + "/" + morephem.tag;
}

function renderLine(svg, y) {
  svg
    .append("line")
    .attr("x1", 0)
    .attr("y1", y)
    .attr("x2", "100%")
    .attr("y2", y)
    .attr("stroke-width", 1)
    .attr("stroke", "#dddddd");
}

export function DownloadSvg(selector) {
  const svg = document.querySelector(selector);

  const data = new XMLSerializer().serializeToString(svg);
  const blob = new Blob([data], { type: "image/svg+xml;charset=utf-8" });

  const link = document.createElement("a");

  link.download = "morpheme.svg";
  link.href = URL.createObjectURL(blob);

  link.click();
}

export function DownloadPng(selector) {
  const svg = document.querySelector(selector);

  const data = new XMLSerializer().serializeToString(svg);
  const blob = new Blob([data], { type: "image/svg+xml;charset=utf-8" });

  const cavas = document.createElement("canvas");

  const { width, height } = svg.getBoundingClientRect();

  cavas.width = width;
  cavas.height = height;

  const ctx = cavas.getContext("2d");

  const img = new Image();

  img.onload = (e) => {
    ctx.drawImage(e.target, 0, 0);

    const link = document.createElement("a");

    link.download = "image.png";
    link.href = cavas.toDataURL("image/png");

    link.click();
  };

  img.src = URL.createObjectURL(blob);
}
