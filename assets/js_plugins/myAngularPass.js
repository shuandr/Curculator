var appPass = angular.module('passCatalog', []);

appPass.config(function($interpolateProvider) {
    $interpolateProvider.startSymbol('{[{');
    $interpolateProvider.endSymbol('}]}');
});

appPass.controller('passCtrl', function($scope) {
    $scope.passprt = ['01','02','03','04','05','06','07','08','09','10','11','12','13','14','15'];
});