angular.module('orderCalc', []).controller('namesCtrl', function($scope) {
    $scope.names = [
        {name:'Jani',country:'Norway'},
        {name:'Hege',country:'Sweden'},
        {name:'Kai',country:'Denmark'}
    ];
}); 

$scope.passTypes = [{
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