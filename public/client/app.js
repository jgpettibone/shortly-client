var shortlyApp = angular.module('shortlyApp', [
  'ngRoute'
]);

shortlyApp.config(['$routeProvider',
  function($routeProvider) {
  $routeProvider.
    when('/', {
      templateUrl: 'client/partials/listUrls.html',
      controller: 'UrlListCtrl'
    }).
    when('/create', {
      templateUrl: 'client/partials/createUrl.html',
      controller: 'UrlCreateCtrl'
    }).
    otherwise({
      redirectTo: '/'
    });
}]);

shortlyApp.controller('UrlListCtrl', function($scope, $http) {
  $http({
    method: 'GET',
    url: '/links'
  }).then(function(obj){
    $scope.links = obj.data;
  });
});

shortlyApp.controller('UrlCreateCtrl', function($scope, $http) {
  $scope.shorten = function(url) {
    $http({
      method: 'POST',
      url: '/links',
      data: {url: url}
    }).then(function(data){
      console.log(data);
    });
  };
});

