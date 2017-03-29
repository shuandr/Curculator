var app = angular.module('orderCalc', ['ngAnimate']);

app.config(function($interpolateProvider) {
    $interpolateProvider.startSymbol('{[{');
    $interpolateProvider.endSymbol('}]}');
});

app.controller('orderCalcCtrl', function($scope, $http) {

    // statis data
    var euroExchange = 29;
    $scope.allMoulds = [];

    // materials

    // XHR
    $http.get("assets/json/injac_katalog.json").then(function(response) {
        $scope.serbMoulds = response.data;
        $scope.allMoulds = $scope.serbMoulds;
    });

    $http.get("assets/json/garcia_katalog.json").then(function(response) {
        $scope.espanaMoulds = response.data;
        $scope.allMoulds = $scope.allMoulds.concat($scope.espanaMoulds);
    });

    $scope.passTypes = [{
        type: 'без паспарту',
        price: 0
    }, {
        type: 'папір',
        price: 240
    }, {
        type: 'тканина/оксамит',
        price: 568
    }, {
        type: 'з чорним зрізом',
        price: 320
    }, {
        type: 'металік',
        price: 435
    }];

    $scope.shtapikPrice = [{
        name: "shtapik-PL",
        price: 78
    }, {
        name: "shtapik-ES",
        price: 4.83
    }, {
        name: "shtapik-USA",
        price: 70
    }];

    $scope.glassTypes = [{
        type: 'звичайне',
        price: 240
    }, {
        type: 'антиблік',
        price: 270
    }, {
        type: 'пластик',
        price: 433
    }];

    $scope.backTypes = [{
        type: 'картон',
        price: 78
    }, {
        type: 'ДВП',
        price: 135
    }, {
        type: 'піно-картон',
        price: 440
    }];
    // $scope.discounts = ["0","5%","10%","12%",]


    // WORK PRICES

    var mouldWork = [{
        range: 20, //см
        price: 10 //грн
    }, {
        range: 40,
        price: 18
    }, {
        range: 60,
        price: 32
    }, {
        range: 90,
        price: 50
    }];

    var mouldSawWork = [{
        range: 60, //см
        price: 30 //грн
    }, {
        range: 90,
        price: 50
    }, {
        range: 120,
        price: 100
    }];

    var mouldOrnAccuracy = 1.6; //підбір орнаменту
    var antiGlassClip = 6; // зажими на антираму з роботою
    var furniture = 0;

    $scope.objWidth = 0;
    $scope.objHeight = 0;
    $scope.objQuantity = 1;

    $scope.passWidth = 0;
    $scope.selectedMould = {};
    $scope.selectedMould.code = "001";

    $scope.selectedPass = 0;
    $scope.doublePass = 0;

    $scope.selectedGlass = 0;
    $scope.selectedBack = 0;
    $scope.discount = 0;




    // CALCULATION


    $scope.objPerim = function() {
        var objWidth = $scope.objWidth;
        var objHeight = $scope.objHeight;
        return (objWidth + objHeight) * 2 / 100;
    };

    $scope.objSqr = function() { //площа в м. кв.
        var objWidth = $scope.objWidth;
        var objHeight = $scope.objHeight;
        return objWidth * objHeight / 10000;
    };

    // mouldings

    $scope.mouldPerim = function() {

        var objPerim = $scope.objPerim();
        var mouldWidth = Number($scope.selectedMould.width) / 1000;
        var passWidth = Number($scope.passWidth) / 100;
        // console.log(objPerim);

        return objPerim + mouldWidth * 8 + (passWidth * 8 + 0.06);
    };

    $scope.cutMould = function() {
        var mouldWidth = $scope.selectedMould.width;
        var cutMould;
         
        if ($scope.sawCut) {
           var cutPrices = mouldSawWork;
        } else {
            cutPrices = mouldWork;
        }
                for (var i = 0; i < cutPrices.length; i++) {
            if (mouldWidth < cutPrices[i].range) {
                cutMould = cutPrices[i].price;
                break;
            }
        };
        if ($scope.ornAccuracy) {
            cutMould *= mouldOrnAccuracy;
        }
        return cutMould;
    };

    $scope.mouldCost = function() {
        var mouldPerim = $scope.mouldPerim();
        var mouldPrice = Number($scope.selectedMould.price);
        var cutMould = $scope.cutMould();
        return mouldPerim * mouldPrice * euroExchange + cutMould;
    };

    // passepartou
    $scope.passSqr = function() {
        var objWidth = $scope.objWidth;
        var objHeight = $scope.objHeight;
        var passWidth = $scope.passWidth;
        var passOffset = $scope.passOffset;
        var passSqr = 0;
        var innerPassSqr = 0;
        if ($scope.doublePass) {
            innerPassSqr = (objWidth + passOffset * 2 + 4) *
                (objHeight + passOffset * 2 + 4) / 10000;
        };

        if ($scope.passWidth) {
            passSqr = (objWidth + passWidth * 2 + 1) *
                (objHeight + passWidth * 2 + 1.5) / 10000 + innerPassSqr;

        };
        return passSqr;
    };

    $scope.cutPass = function() {
        var cutPass = 8;

        if ($scope.passWidth == 0) {
            cutPass = 0;
        }
        if ($scope.passForm == "oval-pass") {
            cutPass = 18;
        }
        if ($scope.passForm == "arch-pass") {
            cutPass = 25;
        }
        if ($scope.doublePass) {
            cutPass *= 2;
        } 
        return cutPass;
    };

    $scope.passCost = function() {
        var passSqr = $scope.passSqr();
        var passPrice = $scope.selectedPass.price;
        var cutPass = $scope.cutPass();
        return passSqr * passPrice + cutPass;
    };

    $scope.shtapikCost = function() {
        var cutShtapik = 8;
        var shtapikCost = 0;
        var shtapikPerim = function() {
            var objPerim = $scope.objPerim();
            var passOffset = $scope.passOffset || 0;
            // console.log(objPerim);
            return (objPerim + passOffset * 8 / 100);
        }
        if ($scope.shtapikType == $scope.shtapikPrice[0].name) {
            shtapikCost = cutShtapik + shtapikPerim() * $scope.shtapikPrice[0].price;
        }
        if ($scope.shtapikType == $scope.shtapikPrice[1].name) {
            shtapikCost = cutShtapik + shtapikPerim() * $scope.shtapikPrice[1].price * euroExchange;
        }
        if ($scope.shtapikType == $scope.shtapikPrice[2].name) {
            shtapikCost = cutShtapik + shtapikPerim() * $scope.shtapikPrice[2].price;
        }

        return shtapikCost;
    }

    // glass
    $scope.glassSqr = function() {
        if ($scope.selectedPass) {
            var glassSqr = $scope.passSqr();
        } else {
            glassSqr = $scope.objSqr();
        }
        return glassSqr;
    };

    $scope.cutGlass = function() {
        var cutGlass = 8;
        if ($scope.antiGlass) {
            cutGlass = 10;
        }
        return cutGlass;
    };

    $scope.antiGlassClipWork = function() {
        var antiGlassClipWork = 0;
        if ($scope.antiGlass) {
            antiGlassClipWork = antiGlassClip * $scope.clipQuantity;
        }
        return antiGlassClipWork;
    };

    $scope.glassCost = function() {
        var glassSqr = $scope.glassSqr();
        var glassPrice = $scope.selectedGlass.price;
        var cutGlass = $scope.cutGlass();
        var antiGlassClipWork = $scope.antiGlassClipWork();
        return glassSqr * glassPrice + cutGlass + antiGlassClipWork;
    };



    // back
    $scope.backSqr = function() {
        var backSqr;
        if ($scope.selectedPass) {
            var backSqr = $scope.passSqr();
        } else {
            
            var backSqr = $scope.objSqr();
        }
        return backSqr;
    };

    $scope.cutBack = function() {
        var cutBack = 2;
        if ($scope.selectedBack.type == $scope.backTypes[1].type) {
            cutBack = 5;
        }
            console.log($scope.selectedBack.type);
        return cutBack;
    };

    $scope.backCost = function() {
        if ($scope.doubleBack) {
            var backSqr = $scope.backSqr() * 2;
        } else {
            var backSqr = $scope.backSqr();
        }
        var backPrice = $scope.selectedBack.price;
        return backSqr * backPrice;
    };


    // stretch
    $scope.stretchWork = function() {
        var objPerim = $scope.objPerim();

        var stretch = 0;
        if ($scope.stretch == "DVP") {
            stretch += objPerim * 25 + $scope.objSqr() * $scope.backTypes[1].price;
            // console.log(objPerim);
        }
        if ($scope.stretch == "subframe") {
            stretch += objPerim * 16;
        }
        if ($scope.stretch == "subframeGallery") {
            stretch += objPerim * 18;
        }
        return stretch;
    };

    $scope.furniture = function() {
        var objPerim = $scope.objPerim();

        if (objPerim == 0 ) {
            furniture = 0;
        } else if (objPerim < 1.4) {
            furniture = 10;
        } else if (objPerim < 2) {
            furniture = 15;
        } else {
            furniture = 25;
        }
        return furniture;
    };

    // TOTAL
    $scope.totalCost = function() {
        var mouldCost = $scope.mouldCost() || 0;
        var passCost = $scope.passCost() || 0;
        var glassCost = $scope.glassCost() || 0;
        var backCost = $scope.backCost() || 0;
        var shtapikCost = $scope.shtapikCost() || 0;
        var stretch = $scope.stretchWork() || 0;
        var furniture = $scope.furniture() || 0;
        var objQuantity = $scope.objQuantity;

        return (mouldCost + passCost + shtapikCost + glassCost + backCost + stretch + furniture) * objQuantity;
    };
    $scope.customerMustPay = function() {
        var totalCost = $scope.totalCost() || 0;
        var advancePay = $scope.advancePay || 0;
        var discount = (100 - Number($scope.discount)) / 100;


        return totalCost * discount - advancePay;
    };

/*$scope.resetForm = function ()
    {
      $scope.orderForm.$setPristine();
      $scope.orderForm.$setUntouched();
    };
*/

});
