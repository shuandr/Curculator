var app = angular.module('nSidesCalc', [ ]);

app.config(function($interpolateProvider) {
    $interpolateProvider.startSymbol('{[{');
    $interpolateProvider.endSymbol('}]}');
});

app.controller('nSidesCalcCtrl', function($scope) {
    //припуск
    const spacer = 3;
    //мм забирає пила при порізці
    const sawSpacer = 4;
    $scope.mirrorWidth = 180;
    $scope.nSidesOpt = [6,8,10,12,14,16];
    $scope.nSides = $scope.nSidesOpt[1];
    $scope.mouldWidth = 0;

    $scope.mouldLength = function() {
        return ($scope.mirrorWidth + spacer + $scope.mouldWidth * 2) *
            Math.tan(Math.PI / $scope.nSides);
    };
    $scope.commonLength = function() {
        return $scope.nSides * ($scope.mouldLength() + sawSpacer);
    };

});