var app = angular.module('orderCalc', ['ngAnimate']);

app.config(function($interpolateProvider) {
    $interpolateProvider.startSymbol('{[{');
    $interpolateProvider.endSymbol('}]}');
});

app.directive('autoComplete', function($timeout) {
    return function(scope, iElement, iAttrs) {
        iElement.autocomplete({
            source: scope[iAttrs.uiItems],
            select: function() {
                $timeout(function() {
                    iElement.trigger('input');
                }, 500);
            }
        });
    };
});


app.controller('orderCalcCtrl', function($scope, $http) {

    // static data
    var euroExchange = 33.6;
    var UsdEuro = 0.84;

    var mouldOrnAccuracy = 1.6; //підбір орнаменту
    var LtypeQ = 1.4; //коєф. роботи з рамою L-типу 
    var LtypeClip = 8; // 1 кріплення рами L-типу, треба 3 шт на м/п
    var antiGlassClip = 8; // зажими на антираму з роботою
    var furniture = 0;
    $scope.cutSlip = 30;
    $scope.workQ = 1;
    $scope.workshopPrices = false;



    $scope.allMoulds = [];
    $scope.passTypes = [0, 0, 0];
    $scope.slipPrice = [0, 0, 0, 0];
    $scope.glassTypes = [0, 0, 0];
    $scope.backTypes = [0, 0, 0, 0, { "glue": " " }];
    $scope.mouldWork = { "WR": [], "WQ": [], "PR": [], "PQ": [], };
    $scope.glassWork = { "range": [], "price": [], "anti": " " };
    $scope.stretchWorkPrices = { "subframe": " " };
    $scope.subframe = [];
    $scope.furniturePrices = { "range": [], "price": [] };


    // materials

    // XHR
    $http.get("assets/json/matWorkPrices.json").then(function(response) {
        $scope.matWorkPrices = response.data;
        $scope.passTypes = $scope.matWorkPrices.passTypes;
        $scope.slipPrice = $scope.matWorkPrices.slipPrice;
        $scope.glassTypes = $scope.matWorkPrices.glassTypes;
        $scope.backTypes = $scope.matWorkPrices.backTypes;
        $scope.mouldWork = $scope.matWorkPrices.mouldWork;
        $scope.passWork = $scope.matWorkPrices.passWork;
        $scope.glassWork = $scope.matWorkPrices.glassWork;
        $scope.subframe = $scope.matWorkPrices.subframe;
        $scope.subframeWork = $scope.matWorkPrices.subframeWork;
        $scope.stretchWorkPrices = $scope.matWorkPrices.stretchWork;
        $scope.furniturePrices = $scope.matWorkPrices.furniture;
        $scope.stretchFurniture = $scope.matWorkPrices.stretchFurniture;
        $scope.mirror = $scope.matWorkPrices.mirror;

        // $scope.passTypes = angular.copy($scope.matWorkPrices.passTypes);

    });
    $http.get("assets/json/mould_catalog.json").then(function(response) {
        $scope.allMouldsCatalog = response.data;
        $scope.allMouldsCatalog.clever.forEach(function(item) {
            item.price *= UsdEuro;
        });
        $scope.allMouldsCatalog.framerica.forEach(function(item) {
            item.price /= euroExchange;
        });
        $scope.allMouldsCatalog.poland_syh.forEach(function(item) {
            item.price /= euroExchange;
        });
        $scope.allMouldsCatalog.ohtyr.forEach(function(item) {
            item.price /= euroExchange;
        });

        var createArray = function() {
            var arr = [];
            for (var key in $scope.allMouldsCatalog) {
                arr.push($scope.allMouldsCatalog[key]);
            }
            var merged = [].concat.apply([], arr);
            return merged;
        }
        $scope.allMoulds = createArray();
    });


    var currMonth = new Date().getMonth() + 1;
    var preId = 1;


    $scope.setOrderId = function() {
        localStorage.setItem('preId', preId);
        localStorage.setItem('lastOrderMonth', currMonth);
    }

    $scope.getOrderId = function() {
        currMonth = new Date().getMonth() + 1;
        if (localStorage.preId && localStorage.lastOrderMonth == currMonth) {
            preId = Number(localStorage.getItem('preId')) + 1;
            $scope.orderId = preId + '-' + currMonth;
        } else {
            preId = 1;
            $scope.orderId = preId + '-' + currMonth;
        }

    }


    var iniObj = {
        width: 0,
        height: 0,
        quantity: 1,
        perim: function() {
            return (this.width + this.height) * 2 / 100;
        },
        sqr: function() {
            return this.width * this.height / 10000;
        },
        mould: false,
        outerMould: {},
        ornAccuracy: false,
        Ltype: false,
        pass: {
            type: 'без паспарту'
        },
        passWidth: 0,
        passForm: false,
        glass: { type: 'без скла' },

        back: {
            type: 'без стінки'
        },
        doublePass: false,
        passOffset: 0,
        antiGlass: false,
        discount: 0,
        slip: false,
        stretch: "no",
        advancePay: 0,
    };

    $scope.selObj = angular.copy(iniObj);

    // CALCULATION

    // mouldings

    $scope.mouldPerim = function() {

        var objPerim = $scope.selObj.perim();
        var mouldWidth = $scope.selObj.mould.width / 1000;
        var passWidth = $scope.selObj.passWidth / 100;
        // console.log(objPerim);

        return objPerim + mouldWidth * 8 + (passWidth * 8 + 0.06);
    };
    $scope.outerMouldPerim = function() {

        var innerMouldPerim = $scope.mouldPerim();
        var mouldWidth = $scope.selObj.outerMould.width / 1000;

        return innerMouldPerim + mouldWidth * 8;
    };


    $scope.cutMould = function() {
        var objPerim = $scope.selObj.perim();
        var mouldWidth = $scope.selObj.mould.width;
        if ($scope.selObj.mould) {
            var cutMould = $scope.mouldWork.base;
        } else {
            var cutMould = 0;
        }
        var mouldWork = $scope.mouldWork;



        for (var i = 0; i < mouldWork.WR.length; i++) {
            if (mouldWidth > mouldWork.WR[i]) {
                cutMould = Math.ceil(cutMould * mouldWork.WQ[i]);
                break;
            }
        }
        for (var i = 0; i < mouldWork.PR.length; i++) {
            if ($scope.mouldPerim() > mouldWork.PR[i]) {
                cutMould = Math.ceil((cutMould * mouldWork.PQ[i]) / 5) * 5;
                break;
            }
        }

        if ($scope.selObj.ornAccuracy) {
            cutMould *= mouldOrnAccuracy;
        }
        if ($scope.selObj.Ltype) {
            cutMould = cutMould * LtypeQ +
                Math.ceil(objPerim) * LtypeClip * 3; // по 3 кріплення на 1 м.п.
        }
        if ($scope.selObj.doubleMould) {
            cutMould += $scope.cutOuterMould();
        }
        return cutMould;
    };


    $scope.cutOuterMould = function() {
        var objPerim = $scope.outerMouldPerim();
        var mouldWidth = $scope.selObj.outerMould.width / 1000;
        var mouldWork = $scope.mouldWork;
        var cutMould = $scope.mouldWork.base;

        for (var i = 0; i < mouldWork.WR.length; i++) {
            if (mouldWidth > mouldWork.WR[i]) {
                cutMould = Math.ceil(cutMould * mouldWork.WQ[i]);
                break;
            }
        }
        for (var i = 0; i < mouldWork.PR.length; i++) {
            if ($scope.mouldPerim() > mouldWork.PR[i]) {
                cutMould = Math.ceil((cutMould * mouldWork.PQ[i]) / 5) * 5;
                break;
            }
        }
        return cutMould;
    }

    $scope.mouldCost = function() {
        var mouldPerim = $scope.mouldPerim();
        var mouldPrice = $scope.selObj.mould.price;
        var outerMouldPerim = $scope.outerMouldPerim();
        var outerMouldPrice = $scope.selObj.outerMould.price;
        var cutMould = $scope.cutMould();
        if ($scope.selObj.doubleMould) {
            var outerCost = outerMouldPerim * outerMouldPrice * euroExchange;
        } else {
            outerCost = 0;
        }
        return mouldPerim * mouldPrice * euroExchange + outerCost + cutMould;
    };

    $scope.mouldPriceUAH = function() {

        var mouldPriceUAH = $scope.selObj.mould.price * euroExchange;
        return mouldPriceUAH;
    }

    // passepartou
    $scope.passSqr = function() {
        var objWidth = $scope.selObj.width;
        var objHeight = $scope.selObj.height;
        var passWidth = $scope.selObj.passWidth;
        var passOffset = $scope.selObj.passOffset;
        var passSqr = 0;
        var innerPassSqr = 0;


        if ($scope.selObj.passWidth) {
            passSqr = (objWidth + passWidth * 2 + 1) *
                (objHeight + passWidth * 2 + 1.5) / 10000 + innerPassSqr;

        };
        return passSqr;
    };
    $scope.innerPassSqr = function() {
        var objWidth = $scope.selObj.width;
        var objHeight = $scope.selObj.height;
        var passOffset = $scope.selObj.passOffset;
        var innerPassSqr = 0;
        if ($scope.selObj.doublePass) {
            innerPassSqr = (objWidth + passOffset * 2 + 4) *
                (objHeight + passOffset * 2 + 4) / 10000;
        };

        return innerPassSqr;
    };
    $scope.totalPassSqr = function() { //
        var totalPassSqr = $scope.passSqr() + $scope.innerPassSqr();
        return totalPassSqr;
    }

    $scope.passRange = function() { // шукаємо довшу сторону паспарту
        var passWidth = $scope.selObj.passWidth * 2 + $scope.selObj.passOffset * 2;
        if ($scope.selObj.width > $scope.selObj.height) {
            passRange = passWidth + $scope.selObj.width;
        } else {
            passRange = passWidth + $scope.selObj.height;
        }
        return passRange;
    }
    $scope.cutPass = function() {
        var cutPass = 0;
        var passWork = $scope.passWork;
        var passRange = $scope.passRange();

        if ($scope.selObj.passWidth > 0) {
            for (var i = 0; i < passWork.range.length; i++) {
                if (passRange > passWork.range[i]) {
                    cutPass = passWork.price[i];
                    break;
                }
            }
        }

        if ($scope.selObj.passForm == "oval-pass") {
            cutPass = passWork.form.oval;
        }
        if ($scope.selObj.passForm == "arch-pass") {
            cutPass = passWork.form.arch;
        }
        if ($scope.selObj.doublePass) {
            cutPass *= 2;
        }
        return cutPass;
    };

    $scope.passCost = function() {
        var passSqr = $scope.totalPassSqr();
        var passPrice = $scope.selObj.pass.price;
        var cutPass = $scope.cutPass();
        return passSqr * passPrice + cutPass;
    };
    // slip
    $scope.slipCost = function() {
        var slipCost = 0;
        var cutSlip = $scope.cutSlip;
        var slipPerim = function() {
            var objPerim = $scope.selObj.perim();
            var passOffset = $scope.selObj.passOffset;
            return (objPerim + passOffset * 8 / 100);
        }
        if ($scope.slipType == $scope.slipPrice[0].name) {
            slipCost = cutSlip + slipPerim() * $scope.slipPrice[0].price;
        }
        if ($scope.slipType == $scope.slipPrice[1].name) {
            slipCost = cutSlip + slipPerim() * $scope.slipPrice[1].price;
        }
        if ($scope.slipType == $scope.slipPrice[2].name) {
            slipCost = cutSlip + slipPerim() * $scope.slipPrice[2].price * euroExchange;
        }
        if ($scope.slipType == $scope.slipPrice[3].name) {
            slipCost = cutSlip + slipPerim() * $scope.slipPrice[3].price;
        }

        return slipCost;
    }

    // glass
    $scope.glassSqr = function() {
        if ($scope.selObj.passWidth) {
            var glassSqr = $scope.passSqr();
        } else {
            glassSqr = $scope.selObj.sqr();
        }
        return glassSqr;
    }

    $scope.glassRange = function() { // шукаємо довшу сторону скла

        if ($scope.selObj.width > $scope.selObj.height) {
            glassRange = $scope.selObj.width;
        } else {
            glassRange = $scope.selObj.height;
        }
        return glassRange;
    }

    $scope.cutGlass = function() {
        var glassWork = $scope.glassWork;

        if ($scope.selObj.glass.type == $scope.glassTypes[0].type) {
            var cutGlass = 0;

        } else {
            for (var i = 0; i < glassWork.range.length; i++) {
                if ($scope.glassRange() > glassWork.range[i]) {
                    cutGlass = glassWork.price[i];
                    break;
                }
            }

        }
        if ($scope.selObj.antiGlass) {
            cutGlass *= glassWork.anti;


        }
        return cutGlass;
    }

    $scope.antiGlassClipWork = function() {
        var antiGlassClipWork = 0;
        if ($scope.selObj.antiGlass) {
            antiGlassClipWork = antiGlassClip * $scope.clipQuantity;
        }
        return antiGlassClipWork;
    }

    $scope.glassCost = function() {
        var glassSqr = $scope.glassSqr();
        var glassPrice = $scope.selObj.glass.price;
        var cutGlass = $scope.cutGlass();
        var antiGlassClipWork = $scope.antiGlassClipWork();
        return glassSqr * glassPrice + cutGlass + antiGlassClipWork;
    }



    // back
    $scope.backSqr = function() {
        var backSqr;
        if ($scope.selObj.passWidth) {
            var backSqr = $scope.passSqr();
        } else {

            var backSqr = $scope.selObj.sqr();
        }
        return backSqr;
    }

    $scope.cutBack = function() {
        var backTypes = $scope.backTypes;
        var cutBack = 0;

        for (var i = 0; i < backTypes.length; i++) {
            if ($scope.selObj.back.type == backTypes[i].type) {
                cutBack = backTypes[i].cut;
                break;
            }
        }

        if ($scope.selObj.back.type == backTypes[4].type) { // поклейка на пінокартон
            cutBack += ($scope.selObj.sqr() * backTypes[4].glue < backTypes[4].minGlue ?
                backTypes[4].minGlue : $scope.selObj.sqr() * backTypes[4].glue);
        }

        if ($scope.selObj.doubleBack) {
            cutBack *= 2;
        }
        return cutBack;
    }

    $scope.backCost = function() {
        if ($scope.selObj.doubleBack) {
            var backSqr = $scope.backSqr() * 2;
        } else {
            var backSqr = $scope.backSqr();
        }
        var backPrice = $scope.selObj.back.price;
        return backSqr * backPrice + $scope.cutBack();
    }


    // stretch
    $scope.stretchWork = function() {
        var objPerim = $scope.selObj.perim();
        var stretch = 0;
        var stretchWorkPrices = $scope.stretchWorkPrices;
        for (var i = 0; i < $scope.subframe.length; i++) {
            if (objPerim < $scope.subframe[i].range) {
                var subframeMeterPrice = $scope.subframe[i].price;
                break;
            }
        }
        if ($scope.selObj.stretch == "no") {
            stretch = 0;
        }
        if ($scope.selObj.stretch == "subframe") {
            stretch += objPerim * stretchWorkPrices.subframe +
                objPerim * subframeMeterPrice + objPerim * $scope.stretchFurniture;
        }
        if ($scope.selObj.stretch == "subframeGallery") {
            stretch += objPerim * stretchWorkPrices.subframeGallery +
                objPerim * subframeMeterPrice + objPerim * $scope.stretchFurniture;
        }
        if ($scope.selObj.stretch == "DVP") {
            stretch += objPerim * stretchWorkPrices.DVP + objPerim * $scope.stretchFurniture +
                $scope.selObj.sqr() * $scope.backTypes[2].price + $scope.backTypes[2].cut;
        }
        return stretch;
    }

    $scope.furniture = function() {

        var objPerim = $scope.selObj.perim();
        var furnPrices = $scope.furniturePrices;
        if (!$scope.selObj.mould || $scope.selObj.mould && $scope.selObj.Ltype) {
            var furniture = 0;
        } else {

            for (var i = 0; i < furnPrices.range.length; i++) {
                if (objPerim > furnPrices.range[i]) {
                    furniture = furnPrices.price[i];
                    break;
                }
            }
        }

        return furniture;
    }

    // TOTAL
    $scope.totalCost = function() {
        var mouldCost = $scope.mouldCost() || 0;
        var passCost = $scope.passCost() || 0;
        var glassCost = $scope.glassCost() || 0;
        var backCost = $scope.backCost() || 0;
        var slipCost = $scope.slipCost() || 0;
        var stretch = $scope.stretchWork() || 0;
        var furniture = $scope.furniture() || 0;
        var objQuantity = $scope.selObj.quantity;

        return (mouldCost + passCost + slipCost + glassCost + backCost + stretch + furniture) * objQuantity;
    }
    $scope.totalWork = function() {
        var cutMould = $scope.cutMould() || 0;
        var cutPass = $scope.cutPass() || 0;
        var cutGlass = $scope.cutGlass() || 0;
        var antiGlassClipWork = $scope.antiGlassClipWork() || 0;
        var cutBack = $scope.cutBack() || 0;
        var stretchWork = $scope.stretchWork() || 0;
        return (cutMould + cutPass + cutGlass + antiGlassClipWork + cutBack + stretchWork) * $scope.selObj.quantity;
    }


    $scope.customerMustPay = function() {
        var totalCost = $scope.totalCost() || 0;
        var advancePay = $scope.selObj.advancePay || 0;
        var totalWork = $scope.totalWork() || 0;
        var discount = (100 - Number($scope.selObj.discount)) / 100;


        return (totalCost - totalWork) * discount + totalWork - advancePay;
    }

    $scope.resetForm = function() {
        $scope.selObj = angular.copy(iniObj);
        $scope.orderForm.$setPristine();
        $scope.orderForm.$setUntouched();
        $scope.getOrderId();

    }

    //ДЛЯ ТАБЛИЦЬ

    $scope.mouldWorkPrices = function(w, p) { // для таблиці work-prices для КЛІЄНТІВ
        var mouldWidth = (w * 10);
        var objPerim = (p - 0.1);
        if ($scope.workshopPrices) {
            $scope.workQ = 0.5;
        }else{
            $scope.workQ = 1;

        }
        var mouldWorkPrice = $scope.mouldWork.base * $scope.workQ;
        var mouldWork = $scope.mouldWork;


        for (var i = 0; i < mouldWork.WR.length; i++) {
            if (mouldWidth > mouldWork.WR[i]) {
                mouldWorkPrice = Math.ceil(mouldWorkPrice * mouldWork.WQ[i]);
                break;
            }
        }
        for (var i = 0; i < mouldWork.PR.length; i++) {
            if (objPerim > mouldWork.PR[i]) {
                mouldWorkPrice = Math.ceil(mouldWorkPrice * mouldWork.PQ[i] / 5) * 5;
                break;
            }
        }
        if ($scope.selObj.Ltype) {
            mouldWorkPrice = mouldWorkPrice * LtypeQ +
                Math.ceil(objPerim) * LtypeClip * 3; // по 3 кріплення на 1 м.п.
        }
        return mouldWorkPrice;
    };

    /* $scope.mouldWorkPricesQ = function(w, p) { // для таблиці work-prices для МАЙСТРІВ
        var mouldWidth = (w * 10);
        var objPerim = (p - 0.1);
        var mouldWorkPrice = $scope.mouldWork.base * $scope.workQ;
        var mouldWork = $scope.mouldWork;
        if ($scope.selObj.Ltype) {
            mouldWorkPrice = mouldWorkPrice * LtypeQ +
                Math.ceil(objPerim) * LtypeClip * 3; // по 3 кріплення на 1 м.п.
        }

        for (var i = 0; i < mouldWork.WR.length; i++) {
            if (mouldWidth > mouldWork.WR[i]) {
                mouldWorkPrice = Math.ceil(mouldWorkPrice * mouldWork.WQ[i]);
                break;
            }
        }
        for (var i = 0; i < mouldWork.PR.length; i++) {
            if (objPerim > mouldWork.PR[i]) {
                mouldWorkPrice = Math.ceil(mouldWorkPrice * mouldWork.PQ[i] / 5) * 5;
                break;
            }
        }
        return mouldWorkPrice;
    };
*/

});