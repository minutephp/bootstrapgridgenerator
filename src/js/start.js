var drawing = false;
var divCount = 1;
var body = $('body');
var drawing = false;
var resizing = false;
var selected = false;
var startZIndex = 9999;

var MIN_DISTANCE = 10; // minimum distance to "snap" to a guide
var guides = []; // no guides available ...
var innerOffsetX, innerOffsetY; // we'll use those during drag ...

function newDiv(x, y) {
    var id = 'canvas' + (divCount++);
    var html = '<div id="' + id + '" class="rectangle" style="width:10px;height:10px;left:' + x + 'px;top:' + y + 'px;z-index:999999;"><span class="topline"></span><span class="rightline"></span><span class="botline"></span><span class="leftline"></span><i class="topcorner">&nbsp;</i>' + id + '</div>';
    $('body').append(html);
    return $('#' + id);
}

function startResizing() {
    resizing = true;
    $(this).find('span').css('display', 'block');
}

function stopResizing() {
    resizing = false;
    var div = $(this);

    $(this).find('span').css('display', 'none');

    if (( div.width() < 15 ) || (div.height() < 15)) {
        setTimeout(function (e) {
            e.html('').remove()
        }, 100, div);
    }
}

function selectEnd() {
    if (selected) {
        try {
            $('div.rectangle').removeClass('selected').resizable('destroy').draggable('destroy');
        } catch (e) {
        } finally {
            selected = false;
            setZIndex($(this));
        }
    }
}

function selectStart() {
    selectEnd();

    $(this).addClass('selected').resizable({start: startResizing, stop: stopResizing, handles: 'e, w, n, s, se'}).draggable({handle: "i.topcorner", start: startResizing, stop: stopResizing});
    selected = true;
}

function setZIndex(div) {
    var area = (div.width() * div.height());
    var zIndex = startZIndex + Math.round(9999999 - area);
    div.css('z-index', zIndex);
}

function initDraw() {
    //document.body.innerHTML += divs;
}

function startDraw(event) {
    if (drawing) return;

    var x = event.pageX;
    var y = event.pageY;
    var div = newDiv(x, y);
    var startTime = +new Date();
    var minTime = 200;

    drawing = true;

    body.addClass('noselect');

    if (!($(event.target).is('.selected, .ui-resizable-handle, .ui-draggable-handle, .rightcorner'))) {
        selectEnd();
    }

    body.on('mousemove', function (event) {
        if (!resizing) {
            div.css('width', (event.pageX - x) + 'px').css('height', (event.pageY - y) + 'px');
            if (((event.pageX - x) > 15) && ((event.pageY - y) > 15)) {
                selectEnd();
            }
        } else {
            div.html('').remove();
        }
    });

    body.on('mouseup', function (event) {
        cancelDraw();

        var endTime = +new Date();

        div.find('span').css('display', 'none');

        if ((endTime - startTime > minTime) && (div.width() > 10) && (div.height() > 10)) {
            setZIndex(div);
            div.on('mousedown', function (event) {
                selectStart.call(this);
            });
        } else {
            div.html('').remove();
        }
    });

    initDraw();
}

function cancelDraw() {
    drawing = false;
    body.off('mousemove').off('click').off('mouseup');
}

function endDraw() {
    cancelDraw();

    if (makeTree()) {
        var body = $('body').attr('id', 'body');
        var htmlCode = printRect('#body');
        htmlCode = process(htmlCode);
        body.append('<div id="dialog" title="Bootstrap grid code"><textarea rows="10" cols="80" id="bootcode" style="width:99%;height:95%;font-family:courier;font-size:12px;" readonly></textarea></div>');
        $("#dialog").dialog({
            modal: true,
            width: Math.min($(window).width(), 900),
            height: Math.min($(window).height(), 400),
            buttons: {
                Preview: function () {
                    var win = window.open('', '_blank');
                    win.document.write('<html><head><title>Preview</title><link rel="stylesheet" type="text/css" href="//maxcdn.bootstrapcdn.com/bootstrap/3.3.2/css/bootstrap.min.css"></head><body>');
                    win.document.write('<div class="container-fluid">' + htmlCode + '</div>');
                    win.document.write('<scrip' + 't>var a = document.querySelectorAll(\'div[class^="col"]\'); for ( var i in a ) { if(a[i] && a[i].hasOwnProperty("style")) { a[i].style.background = c(5); a[i].style.border = "2px solid " + c(2) } } function c(e){var t=[Math.random()*256,Math.random()*256,Math.random()*256];var n=[e*51,e*51,e*51];var r=[t[0]+n[0],t[1]+n[1],t[2]+n[2]].map(function(e){return Math.round(e/2)});return"rgb("+r.join(",")+")"}</scrip' + 't>');
                    win.document.write('</body></html>');
                },
                Close: function () {
                    $(this).dialog("close");
                }
            }
        });
        $('div.ui-dialog').css('z-index', startZIndex + 9999999);
        $('#bootcode').text(htmlCode).get()[0].select();

        //console.clear();
        console.log(htmlCode);
    }

    chrome.extension.sendMessage({});
}

function go() {
    var maskDiv = '<div style="z-Index:' + (startZIndex++) + ';background:#000;opacity:0.0;position:absolute;width:100%;height:100%;min-width:' + $('body').width() + 'px;min-height:' + $('body').height() + 'px;top:0px;left:0px;"></div>';
    maskDiv += '<div id="guide-h" class="guide" style="z-Index:' + (startZIndex++) + '"></div><div id="guide-v" class="guide"  style="z-Index:' + (startZIndex++) + '"></div>';
    $('body').append(maskDiv);
    body.on('mousedown', startDraw);
}

function process(str) {
    var div = document.createElement('div');
    div.innerHTML = str.trim();

    var html = format(div, 0).innerHTML;
    $(div).html('').remove();
    return html.replace(/\s*\&nbsp;\s*/g, '&nbsp;').trim();
}

function format(node, level) {

    var indentBefore = new Array(level++ + 1).join('  '),
        indentAfter = new Array(level - 1).join('  '),
        textNode;

    for (var i = 0; i < node.children.length; i++) {

        textNode = document.createTextNode('\n' + indentBefore);
        node.insertBefore(textNode, node.children[i]);

        format(node.children[i], level);

        if (node.lastElementChild == node.children[i]) {
            textNode = document.createTextNode('\n' + indentAfter);
            node.appendChild(textNode);
        }
    }

    return node;
}

function makeTree() {
    var rects = $('div.rectangle');

    if (rects.length < 2) {
        alert('Sorry, you need to draw at least 2 rectangles.');
        return false;
    }

    for (var i = 0; i < rects.length; i++) {
        var lastDiff = 9999;
        var parent = 'body';

        for (var j = 0; j < rects.length; j++) {
            if (i != j) {
                var rectI = $(rects[i]);
                var rectJ = $(rects[j]);

                if (meInside(rectI, rectJ)) {
                    if (topDiff(rectI, rectJ) < lastDiff) {
                        lastDiff = topDiff(rectI, rectJ);
                        parent = rectJ.attr('id');
                    }
                }
            }
        }

        rectI.attr('data-parent', parent);
    }

    return true;
}

function printRect(container) {
    var rects = $('div.rectangle');
    var childs = getChildOf(container);
    var cHeight = /body/.test(container) ? $(window).height() : $(container).height();
    var cWidth = $(container).width();
    var cLeft = $(container).offset().left;
    var cTop = $(container).offset().top;

    var fails = 0;
    var rows = [];
    var intersecting = {};

    for (var y = cTop; y <= cTop + cHeight + 1000; y++) {
        var passing = false;

        for (var c = 0; c < childs.length; c++) {
            var child = $(childs[c]);

            if (intersectY(child, y)) {
                intersecting[child.attr('id')] = 1;
                passing = true;

                if (fails > 20) {
                    rows.push('blank:' + fails);
                }

                fails = 0;
            }
        }

        if (!passing) {
            var keys = getKeys(intersecting);

            if (keys.length > 0) {
                rows.push(keys)
                intersecting = {};
            }

            fails++;
        }
    }

    //console.log(rows);

    for (var r = 0; r < rows.length; r++) {
        var row = rows[r];

        if (/^blank/.test(row)) {
            continue;
        }

        var cols = [];
        var intersecting = {};

        for (var x = cLeft; x < cLeft + cWidth; x++) {
            var passing = false;

            for (var c = 0; c < row.length; c++) {
                var child = $('#' + row[c]);
                if (intersectX(child, x)) {
                    intersecting[child.attr('id')] = 1;
                    passing = true;
                }
            }

            if (!passing) {
                var keys = getKeys(intersecting);

                if (keys.length > 0) {
                    cols.push(keys)
                    intersecting = {};
                }
            }
        }

        var spans = [];
        var globalOffset = 0;

		for (var k = 0; k < cols.length; k++) {
            var left = minLeft(cols[k]);
            var right = maxRight(cols[k]);
            var top = minTop(cols[k]);
            var bottom = maxBottom(cols[k]);

            var md = Math.ceil((right - left) * 12 / cWidth);
            var offset = Math.floor((left - cLeft) * 12 / cWidth);
			
			console.log(md, offset, left, right, cWidth, cols[k][0]);

            offset = offset - globalOffset;

            globalOffset += offset + md;

            var span = '<div class="col-md-' + md + (offset > 0 ? (' col-md-offset-' + offset) : '') + '" style="min-height:' + (bottom - top) + 'px"';

            if (cols[k].length > 1) {
				 cols[k].sort(function(a, b) {
					var y1 = $('#'+a).offset().top;
					var y2 = $('#'+b).offset().top;

					return y1 - y2;
				});

                span += " title=\"container\">\n" + '<div class="row">' + "\n";

                for (var m = 0; m < cols[k].length; m++) {
                    var ck = $('#' + cols[k][m]);
                    var wid = Math.ceil(ck.width() * 12 / (right - left));
                    var off = Math.floor((ck.offset().left - left) * 12 / (right - left));

                    span += '<div class="col-md-' + wid + (off > 0 ? ' col-md-offset-' + off : '' ) + '" title="' + id(ck) + '" style="min-height:' + ck.height() + 'px">';
                    span += printRect('#' + id(ck));
                    span += '</div>';
                }

                span += "\n" + '</div>';
            } else {
                span += 'title="'+cols[k][0]+'">';
                span += printRect('#' + cols[k][0]);
            }

            span += '</div>';

            spans.push(span);
        }

        rows[r] = spans;
    }

    var html = '';

    for (var r = 0; r < rows.length; r++) {
        var match = /blank\:(\d+)/.exec(rows[r]);
        html += '<div class="row"' + (match && match[1] ? ' style="min-height:' + match[1] + 'px"' : '') + '>' + "\n";
        html += match ? '&nbsp;' : rows[r].join("\n");
        html += "\n" + '</div>';
    }

    return html;
}


function minLeft(arr) {
    var min = 99999;
    for (var i = 0; i < arr.length; i++) {
        var child = $('#' + arr[i]);
        var left = child.offset().left;
        if (left < min) {
            min = left;
        }
    }

    return min;
}

function maxRight(arr) {
    var max = 0;

    for (var i = 0; i < arr.length; i++) {
        var child = $('#' + arr[i]);
        var right = child.offset().left + child.width();

        if (right > max) {
            max = right;
        }
    }

    return max;
}

function minTop(arr) {
    var min = 99999;
    for (var i = 0; i < arr.length; i++) {
        var child = $('#' + arr[i]);
        var top = child.offset().top;
        if (top < min) {
            min = top;
        }
    }

    return min;
}

function maxBottom(arr) {
    var max = 0;

    for (var i = 0; i < arr.length; i++) {
        var child = $('#' + arr[i]);
        var right = child.offset().top + child.height();

        if (right > max) {
            max = right;
        }
    }

    return max;
}

function getKeys(obj) {
    var result = [];

    for (var i in obj) {
        if (obj.hasOwnProperty(i)) {
            result.push(i);
        }
    }

    return result;
}

function meInside(myself, parent) {
    return (myself.offset().top > parent.offset().top) && (myself.offset().left > parent.offset().left) && (myself.offset().top < parent.offset().top + parent.height()) && (myself.offset().left < parent.offset().left + parent.width());
}

function topDiff(myself, parent) {
    return myself.offset().top - parent.offset().top;
}

function getChildOf(myself) {
    return $('div.rectangle[data-parent="' + id(myself) + '"]');
}

function id(ele) {
    return $(ele).attr('id');
}

function intersectY(myself, y) {
    return (y >= myself.offset().top) && (y <= myself.offset().top + myself.height());
}

function intersectX(myself, x) {
    return (x >= myself.offset().left) && (x <= myself.offset().left + myself.width());
}

$(document).ready(go);
