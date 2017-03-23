var app = angular.module('orderCalc', []);

app.config(function($interpolateProvider) {
    $interpolateProvider.startSymbol('{[{');
    $interpolateProvider.endSymbol('}]}');
});

app.controller('orderCalcCtrl', function($scope, $http) {

    // statis data
    $scope.dateNow = new Date();
    $scope.euroExchange = 29;
    $scope.allMoulds = [];

    $scope.passTypes = [{
        type: 'папір',
        price: 120
    }, {
        type: 'тканина',
        price: 160
    }, {
        type: 'оксамит',
        price: 200
    }, {
        type: 'металік',
        price: 180
    }];

    $scope.glassTypes = [{
        type: 'звичайне',
        price: 240
    }, {
        type: 'антиблік',
        price: 270
    }, {
        type: 'пластик',
        price: 75
    }];

    $scope.backTypes = [{
        type: 'картон',
        price: 78
    }, {
        type: 'ДВП',
        price: 96
    }];

    /*$scope.mouldPerim = 0;
    $scope.mouldCost = 0;
    $scope.passCost = 0;
    $scope.glassCost =0;*/
    $scope.passWidth = 0;
    $scope.selectedMould = 0;
    $scope.selectedPass = 0;
    $scope.selectedGlass = 0;
    $scope.selectedBack = 0;

    // XHR
    $http.get("assets/json/injac_katalog.json").then(function(response) {
        $scope.serbMoulds = response.data;
        $scope.allMoulds = $scope.serbMoulds;
    });

    $http.get("assets/json/garcia_katalog.json").then(function(response) {
        $scope.espanaMoulds = response.data;
        $scope.allMoulds = $scope.allMoulds.concat($scope.espanaMoulds);

    });

// CALCULATION
  // mouldings
    $scope.mouldPerim = function() {
        var objWidth = Number($scope.objWidth);
        var objHeight = Number($scope.objHeight);
        var mouldWidth = Number($scope.selectedMould.width);
        var passWidth = Number($scope.passWidth);
        return (objWidth + objHeight) * 2 +
            mouldWidth * 8 / 10 +
            (passWidth * 8 + 6);
    };

    $scope.mouldCost = function() {
        var mouldPerim = $scope.mouldPerim();
        var currency = Number($scope.euroExchange);
        var mouldPrice = Number($scope.selectedMould.price);
        return mouldPerim * mouldPrice * currency / 100;
    };

  // passepartou
    $scope.passSqr = function() {
        var objWidth = Number($scope.objWidth);
        var objHeight = Number($scope.objHeight);
        var passWidth = Number($scope.passWidth);
        var passSqr;
        if ($scope.passWidth) {
            var passSqr = (objWidth + passWidth * 2 + 1) *
                (objHeight + passWidth * 2 + 1.5) / 10000;
        } else {
            var passSqr = 0;
        }
        return passSqr;
    };

    $scope.passCost = function() {
        var passSqr = $scope.passSqr();
        var passPrice = Number($scope.selectedPass.price);
        return passSqr * passPrice;
    };

  // glass
    $scope.glassSqr = function() {
        var glassSqr;
        if ($scope.selectedPass) {
            var glassSqr = $scope.passSqr();
        } else {
            var objWidth = Number($scope.objWidth);
            var objHeight = Number($scope.objHeight);
            var glassSqr = objWidth * objHeight / 10000;
        }
        return glassSqr;
    };
    $scope.glassCost = function() {
        var glassSqr = $scope.glassSqr();
        var glassPrice = Number($scope.selectedGlass.price);
        return glassSqr * glassPrice;
    };

 // back
    $scope.backSqr = function() {
        var backSqr;
        if ($scope.selectedPass) {
            var backSqr = $scope.passSqr();
        } else {
            var objWidth = Number($scope.objWidth);
            var objHeight = Number($scope.objHeight);
            var backSqr = objWidth * objHeight / 10000;
        }
        return backSqr;
    };

    $scope.backCost = function() {
    	if ($scope.doubleBack) {
        var backSqr = $scope.backSqr()*2;
    	} else {
        var backSqr = $scope.backSqr();
    	}
        var backPrice = Number($scope.selectedBack.price);
        return backSqr * backPrice;
    };

  // TOTAL
    $scope.totalCost = function() {
        var mouldCost = $scope.mouldCost() || 0;
        var passCost = $scope.passCost() || 0;
        var glassCost = $scope.glassCost() || 0;
        var backCost = $scope.backCost() || 0;

        return mouldCost + passCost + glassCost + backCost;
    };
$scope.customerMustPay = function() {
        var totalCost = $scope.totalCost() || 0;
        var advancePay = $scope.advancePay || 0;
        

        return totalCost - advancePay;
    };



});