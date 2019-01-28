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
    var euroExchange = 33;
    var UsdEuro = 0.87;
    var mouldOrnAccuracy = 1.6; //підбір орнаменту
    var antiGlassClip = 6; // зажими на антираму з роботою
    var furniture = 0;
    var cutSlip = 10;


    $scope.allMoulds = [];
    $scope.passTypes = [0, 0, 0];
    $scope.slipPrice = [0, 0, 0];
    $scope.glassTypes = [0, 0, 0];
    $scope.backTypes = [0, 0, 0];
    $scope.mouldWork = [];
    $scope.mouldSawWork = [];
    $scope.subframe = [];

    // materials

    // XHR
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

    $http.get("assets/json/matWorkPrices.json").then(function(response) {
        $scope.matWorkPrices = response.data;
        $scope.passTypes = angular.copy($scope.matWorkPrices.passTypes);
        $scope.slipPrice = angular.copy($scope.matWorkPrices.slipPrice);
        $scope.glassTypes = angular.copy($scope.matWorkPrices.glassTypes);
        $scope.backTypes = angular.copy($scope.matWorkPrices.backTypes);
        $scope.mouldWork = angular.copy($scope.matWorkPrices.mouldWork);
        $scope.mouldSawWork = angular.copy($scope.matWorkPrices.mouldSawWork);
        $scope.subframe = angular.copy($scope.matWorkPrices.subframe);
        // console.log($scope.glassTypes[0].type);
    });


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
        mould: {
            code: '001'
        },
        outerMould: {},
        ornAccuracy: false,
        sawCut: false,
        pass: 'без паспарту',
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
        stretch: "без натяжки",
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
        var mouldWidth = $scope.selObj.mould.width;
        var cutMould;

        if ($scope.selObj.sawCut || $scope.selObj.mould.width > 90) {
            var cutPrices = $scope.mouldSawWork;
        } else {
            cutPrices = $scope.mouldWork;
        }
        for (var i = 0; i < cutPrices.length; i++) {
            if (mouldWidth < cutPrices[i].range) {
                cutMould = cutPrices[i].price;
                break;
            }
        }
        if ($scope.selObj.ornAccuracy) {
            cutMould *= mouldOrnAccuracy;
        }
        if ($scope.selObj.doubleMould) {
            cutMould *= 2;
        }
        return cutMould;
    };



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
    $scope.totalPassSqr = function() {
        var totalPassSqr = $scope.passSqr() + $scope.innerPassSqr();
        return totalPassSqr;
    }

    $scope.cutPass = function() {
        var cutPass = 0;

        if ($scope.selObj.passWidth !== 0) {
            cutPass = 12;
        }
        if ($scope.selObj.passForm == "oval-pass") {
            cutPass = 20;
        }
        if ($scope.selObj.passForm == "arch-pass") {
            cutPass = 25;
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
        var slipPerim = function() {
            var objPerim = $scope.selObj.perim();
            var passOffset = $scope.selObj.passOffset;
            return (objPerim + passOffset * 8 / 100);
        }
        if ($scope.slipType == $scope.slipPrice[0].name) {
            slipCost = cutSlip + slipPerim() * $scope.slipPrice[0].price;
        }
        if ($scope.slipType == $scope.slipPrice[1].name) {
            slipCost = cutSlip + slipPerim() * $scope.slipPrice[1].price * euroExchange;
        }
        if ($scope.slipType == $scope.slipPrice[2].name) {
            slipCost = cutSlip + slipPerim() * $scope.slipPrice[2].price;
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

    $scope.cutGlass = function() {
        if ($scope.selObj.glass.type == $scope.glassTypes[0].type) {
            var cutGlass = 0;
        } else {
            cutGlass = 12;
        }
        if ($scope.selObj.antiGlass) {
            cutGlass = 14;
        }
        return cutGlass;
    }

    $scope.antiGlassClipWork = function() {
        var antiGlassClipWork = 0;
        if ($scope.selObj.antiGlass) {
            // $scope.clipQuantity = 4;
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
        var cutBack = 0;
        if ($scope.selObj.back.type == $scope.backTypes[1].type) {
            cutBack = 4;
        } else if ($scope.selObj.back.type == $scope.backTypes[2].type) {
            cutBack = 7;
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
        for (var i = 0; i < $scope.subframe.length; i++) {
            if (objPerim < $scope.subframe[i].range) {
                var subframeMeterPrice = $scope.subframe[i].price;
                break;
            }
        }
        if ($scope.selObj.stretch == "DVP") {
            // var furniture = 10;
            stretch += objPerim * 26 + $scope.selObj.sqr() * $scope.backTypes[1].price + $scope.furniture();
            // console.log(objPerim);
        }
        if ($scope.selObj.stretch == "subframe") {
            stretch += objPerim * 20 + objPerim * subframeMeterPrice;
        }
        if ($scope.selObj.stretch == "subframeGallery") {
            stretch += objPerim * 23 + objPerim * subframeMeterPrice;
        }
        return stretch;
    }

    $scope.furniture = function() {
        var objPerim = $scope.selObj.perim();

        if ($scope.selObj.mould.code == iniObj.mould.code && !$scope.selObj.antiGlass && $scope.selObj.stretch == iniObj.stretch ) {
            furniture = 0;
        } else if (objPerim < 1.4) {
            furniture = 12;
        } else if (objPerim < 2) {
            furniture = 18;
        } else {
            furniture = 25;
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
        resetNonNg();
    }


});
