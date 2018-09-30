var objectsPaths = [];
var sectorID = 0;
var objectID = 0;
var unitID = 1;
var svgDoc = 0;

function getContent() {
    for (var i = 0; i < images.length; i++) {
        loadXMLDoc(images[i].path);
    }
    var scr = document.createElement('script');
    var head = document.body || document.getElementsByTagName('body')[0];
    scr.src = 'js/map.js';
    scr.async = false; // optionally
    head.insertBefore(scr, head.lastChild);
}

function loadXMLDoc(path) {
    var xmlhttp = new XMLHttpRequest();
    xmlhttp.onreadystatechange = function () {
        if (this.readyState == 4 && this.status == 200) {
            handleSVG(this);
        }
    };
    xmlhttp.open("GET", String(path), false);
    xmlhttp.send();
}

function handleSVG(xml) {
    svgDoc = xml.responseXML;
    readSVG();
}



function getUnitsPaths() {
    var units = [];
    unitID = 1;
    while (true) {
        var svgItem = svgDoc.getElementById(String.fromCharCode('a'.charCodeAt() + sectorID) + String(unitID));
        if (svgItem != null) {
            var unit = {
                id: unitID,
                path: svgItem.getAttribute("d"),
                booked: 'f',
                selected: 'f',
                company_id: 0,
            }
            units.push(unit);
            unitID++;
        } else {
            break;
        }
    }
    return units;
};

function getSectorsPaths() {
    var sectors = [];
    while (true) {
        var svgItem = svgDoc.getElementById("sector_" + String.fromCharCode('a'.charCodeAt() + sectorID));
        if (svgItem != null) {
            var sector = {
                id: sectorID,
                path: svgItem.getAttribute("d"),
                units: getUnitsPaths(),
            };
            sectors.push(sector);
            sectorID++;
        } else {
            break;
        }
    }
    return sectors;
};

function readSVG() {
    var object = {
        object_id: objectID,
        sectors: getSectorsPaths(),
        mapProperties: getSVGProperties(),
    }
    objectsPaths.push(object);
    objectID++;
};

function getSVGProperties() {
    for (var i = 0; i < svgDoc.childNodes.length; i++) {
        var node = svgDoc.childNodes[i];
        if (node.viewBox != null) {  //parametr viewBox jest tylko raz w svg
            var params = {
                map_width: node.width.baseVal.value,
                map_height: node.height.baseVal.value,
                viewbox_width: node.viewBox.baseVal.width,
                viewbox_height: node.viewBox.baseVal.height,
                viewbox_x: node.viewBox.baseVal.x,
                viewbox_y: node.viewBox.baseVal.y,
            }
            return params;
        }
    }
}
