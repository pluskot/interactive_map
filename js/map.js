var MAP_WIDTH = objectsPaths[0].mapProperties.map_width;
var MAP_HEIGHT = objectsPaths[0].mapProperties.map_height;
var VIEW_BOX_WIDTH = objectsPaths[0].mapProperties.viewbox_width;
var VIEW_BOX_HEIGHT = objectsPaths[0].mapProperties.viewbox_height;
var VIEW_BOX_X = objectsPaths[0].mapProperties.viewbox_x;
var VIEW_BOX_Y = objectsPaths[0].mapProperties.viewbox_y;
var mapContainer = document.getElementById('map');
var map = new Raphael(mapContainer, MAP_WIDTH, MAP_HEIGHT);
var inDetails = false;
map.setViewBox(VIEW_BOX_X, VIEW_BOX_Y, VIEW_BOX_WIDTH, VIEW_BOX_HEIGHT);
var sector_number = 0;
var panZoom = map.panzoom({ initialZoom: 7.36, initialPosition: { x: 0, y: 0 } });
//var activeFloor = 0;
var _sector = {
    cursor: "pointer",
    stroke: "#000000",
    'stroke-width': "0.2",
    'stroke-linecap': "butt",
    'stroke-linejoin': "miter",
    'stroke-opacity': "1"
};

var _unit = {
    cursor: "pointer",
    stroke: "#000000",
    'stroke-width': "0.2",
    'stroke-linecap': "butt",
    'stroke-linejoin': "miter",
    'stroke-opacity': "1"
};

var _free = {
    fill: "green",
    opacity: "1"
}
var _selected = {
    fill: "yellow",
    opacity: "1"
};

var _booked = {
    fill: "red",
    opacity: "1"
};

var _mouse_over = {
    opacity: "0.7"
}

var _mouse_out = {
    opacity: "1"
}

var overlay = map.rect(0, 0, map.width, map.height);
overlay.attr({ fill: '#ffffff', 'fill-opacity': 0, "stroke-width": 0, stroke: '#ffffff' });
overlay.selectedObject = -1;
overlay.selectedSector = -1;

var objects = map.set();

$(document).ready(function () {
    initSelect();
    loadObjects();
    initializeStateOfObjects();
    changeActiveFloor(0);

    $("#mapFloorSelector").change(function () {
        var floor = $(this).val();
        changeActiveFloor(floor);
    });

});

function initSelect() {
    for (var i = 0; i < images.length; i++) {
        $('#mapFloorSelector').append('<input type="radio" value="' + i + '">' + images[i].description + '</input>');
    }
}

function loadObjects() {
    objectID = 0;
    unitID = 0;
    for (var i = 0; i < objectsPaths.length; i++) {
        var object = map.set();
        object.id = i;
        object.units = loadUnits();
        object.sectors = loadSectors();
        objects.push(object);
        objectID++;
    }
};

function loadSectors() {
    var sectors = map.set();
    for (var i = 0; i < objectsPaths[objectID].sectors.length; i++) {
        var sector = map.path(toAbsolutePath(objectsPaths[objectID].sectors[i].path));
        sector.id = i;
        sector.object_id = objectID;
        sector.booked = 'f';
        sector.selected = 'f';
        sectors.push(sector);
    }
    sectors.attr(_sector);
    sectors.click(handleDetails);

    sectors.mouseover(function () {
        this.animate(_mouse_over, 500);
    });

    sectors.mouseout(function () {
        this.animate(_mouse_out, 500);
    });
    return sectors;
};

function loadUnits() {
    var units = map.set();
    for (var i = 0; i < objectsPaths[objectID].sectors.length; i++) {
        var sectorUnits = map.set();
        sectorUnits.sector_id = i;
        sectorUnits.object_id = objectID;
        for (var j = 0; j < objectsPaths[objectID].sectors[i].units.length; j++) {
            var unit = map.path(toAbsolutePath(objectsPaths[objectID].sectors[i].units[j].path));
            unit.id = j;
            unit.booked = objectsPaths[objectID].sectors[i].units[j].booked;
            unit.selected = objectsPaths[objectID].sectors[i].units[j].selected;
            unit.company_id = objectsPaths[objectID].sectors[i].units[j].company_id;
            sectorUnits.push(unit);
        }
        units.push(sectorUnits);
    }
    units.hide();
    units.attr(_unit);

    units.mouseout(function () {
        this.animate(_mouse_out, 500);
    });

    units.mouseover(function () {
        this.animate(_mouse_over, 500);
    });

    units.click(clickUnit);
    return units;
};

function initializeStateOfObjects() {
    for (var i = 0; i < objects.length; i++) {
        for (var j = 0; j < objects[i].units.length; j++) {
            initStateOfUnits(objects[i].units[j]);
        }
        for (var j = 0; j < objects[i].sectors.length; j++) {
            initStateOfSector(objects[i].sectors[j]);
        }
    }
};

function clickUnit() {
    if (this.booked == 'f') {
        if (this.selected == 'f') {
            this.selected = 't';
            this.animate(_selected, 500);
        } else {
            this.selected = 'f';
            this.animate(_free, 500);
        }
    }
}

function showButtons() {
	document.getElementById("revert").style.visibility="visible";
	document.getElementById("book").style.visibility="visible";
	document.getElementById("back").style.visibility="visible";
}

function hideButtons() {
	document.getElementById("revert").style.visibility="hidden";
	document.getElementById("book").style.visibility="hidden";
	document.getElementById("back").style.visibility="hidden";
}

function showRadioButtons() {
    $('#mapFloorSelector').css('visibility', 'visible');
}

function hideRadioButtons() {
    $('#mapFloorSelector').css('visibility', 'hidden');
}

function checkAmount(units) {
    var amount = 0;
    for (var i = 0; i < units.length; i++) {
        if (units[i].selected == 't') {
            amount++;
        }
    }
    if (amount < 4) {
        window.alert("Wybrano za malo jednostek");
        return false;
    } else if (amount > 8) {
        window.alert("Wybrano za duzo jednostek!");
    } else {
        return true;
    }
}

function compareUnitsById(a, b) {
    return a - b;
}

function checkNeighbourhood(units) {
    var _selectedUnits = [];
    for (var i = 0; i < units.length; i++) {
        if (units[i].selected == 't') {
            _selectedUnits.push(units[i].id);
        }
    }
    _selectedUnits.sort(compareUnitsById);
    for (var i = _selectedUnits.length - 1; i > 0; i--) {
        if ((_selectedUnits[i] - _selectedUnits[i - 1]) != 1) {
			window.alert("Jednostki nie sąsiaduja ze soba!");
            return false;
        }
    }
    return true;
}

function bookUnits(units) {
    for (var i = 0; i < units.length; i++) {
        if (units[i].selected == 't') {
            units[i].booked = 't';
            units[i].selected = 'f';
        }
    }
}

function revertSelection() {
    if (inDetails) {
        var _unitsID = overlay.selectedSector;
        var _objectID = overlay.selectedObject;
        inDetails = false;
        panZoom.disable();
        revertSelectionOfUnits(objects[_objectID].units[_unitsID]);
        initStateOfUnits(objects[_objectID].units[_unitsID]);
        initStateOfSector(objects[_objectID].sectors[_unitsID]);
        anim = overlay.animate({ 'fill-opacity': 0 }, 300, function () {
            hideButtons();
            showRadioButtons();
            objects[_objectID].units.toBack();
            objects[_objectID].units[_unitsID].hide();
            isHandling = false;
        });
        objects[_objectID].units[_unitsID].animateWith(overlay, anim, {
            transform: ""
        }, 300);
        overlay.selectedObject = -1;
        overlay.selectedSector = -1;
        objects[_objectID].sectors.toFront();
    }
}

function revertSelectionOfUnits(units) {
    for (var i = 0; i < units.length; i++) {
        if (units[i].selected == 't') {
            units[i].selected = 'f';
        }
    }
}

function bookSelected() {
    if (inDetails) {
        var _unitsID = overlay.selectedSector;
        var _objectID = overlay.selectedObject;
        if (checkAmount(objects[_objectID].units[_unitsID])) {
            if (checkNeighbourhood(objects[_objectID].units[_unitsID])) {
                inDetails = false;
                panZoom.disable();
                initStateOfSector(objects[_objectID].sectors[_unitsID]);
                bookUnits(objects[_objectID].units[_unitsID]);
                initStateOfSector(objects[_objectID].sectors[_unitsID]);
                anim = overlay.animate({ 'fill-opacity': 0 }, 300, function () {
                    hideButtons();
                    showRadioButtons();
                    initStateOfUnits(objects[_objectID].units[_unitsID]);
                    objects[_objectID].units[_unitsID];
                    objects[_objectID].units[_unitsID].hide();
                    isHandling = false;
                });
                objects[_objectID].units[_unitsID].animateWith(overlay, anim, {
                    transform: ""
                }, 300);
                overlay.selectedObject = -1;
                overlay.sectorSector = -1;
                objects[_objectID].sectors.toFront();
                window.alert("Pomyslnie udalo sie zarezerwowac sektory X,Y,Z,A dla firmy XXX w budynku X1");
            }
        }
    }
}

function backToMap() {
    if (inDetails) {
        var _unitsID = overlay.selectedSector;
        var _objectID = overlay.selectedObject;
        initStateOfSector(objects[_objectID].sectors[_unitsID]);
        inDetails = false;
        panZoom.disable();
        anim = overlay.animate({ 'fill-opacity': 0 }, 300, function () {
            hideButtons();
            showRadioButtons();
            objects[_objectID].units.toBack();
            objects[_objectID].units[_unitsID].hide();
            isHandling = false;
        });
        objects[_objectID].units[_unitsID].animateWith(overlay, anim, {
            transform: ""
        }, 300);
        overlay.selectedSector = -1;
        overlay.sectorObject = -1;
        objects[_objectID].sectors.toFront();
    }
}

function initStateOfSector(sector) {
    if (isEntirelyBooked(sector)) {
        sector.booked = 't';
        sector.attr(_booked);
        return;
    } else if (isEntirelySelected(sector)) {
        sector.selected = 't';
        sector.attr(_selected);
        return;
    }
    sector.attr(_free);
};

function isEntirelyBooked(sector) {
    for (var i = 0; i < objects[sector.object_id].units[sector.id].length; i++) {
        if (objects[sector.object_id].units[sector.id][i].booked == 'f') {
            return false;
        }
    }
    return true;
}

function isEntirelySelected(sector) {
    for (var i = 0; i < objects[sector.object_id].units[sector.id].length; i++) {
        if (objects[sector.object_id].units[sector.id][i].selected == 'f') {
            return false;
        }
    }
    return true;
}

function initStateOfUnits(units) {
    for (var i = 0; i < units.length; i++) {
        if (units[i].booked == 't') {
            units[i].attr(_booked);
        } else if (units[i].selected == 't') {
            units[i].attr(_selected);
        } else {
            units[i].attr(_free);
        }
    }
};

function changeActiveFloor(floor) {
    for (var i = 0; i < objects.length; i++) {
        if (floor == i) {
            overlay.toBack();
            objects[i].sectors.show();
            var img = images[i].path;
            mapContainer.style.backgroundImage = "url(" + String(img) + ")";
        }
        else {
            objects[i].sectors.hide();
        }
    }
}

function toAbsolutePath(path_string) {
    var p2s = /,?([achlmqrstvxz]),?/gi;
    var path_abs = Raphael._pathToAbsolute(path_string);
    var path_string_abs = path_abs.join(',').replace(p2s, '$1');
    return path_abs;
}

function handleDetails() {
    isHandling = true;
    overlay.selectedSector = this.id;
    overlay.selectedObject = this.object_id;
    var center_index;
    var anim, box = this.getBBox();

    center_index = objects[overlay.selectedObject].units[overlay.selectedSector].length / 2;

    var center_box = objects[overlay.selectedObject].units[overlay.selectedSector][center_index].getBBox();
    if (!inDetails) {
        inDetails = true;
        panZoom.disable();
        initStateOfUnits(objects[overlay.selectedObject].units[overlay.selectedSector]);
        objects[overlay.selectedObject].units[overlay.selectedSector].show();
        overlay.toFront();
        objects[overlay.selectedObject].units[overlay.selectedSector].toFront();
        anim = overlay.animate({ 'fill-opacity': 0.7 }, 300, function () {
            isHandling = false;
            hideRadioButtons();
            showButtons();
        });
        objects[overlay.selectedObject].units[overlay.selectedSector].animateWith(overlay, anim, {
            transform: "s4,4," + center_box.x + "," + center_box.y
        }, 300);
    }
}

